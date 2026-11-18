'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Selector = require('../selector.js');
const root = path.resolve(__dirname, '../../..');
const hub = path.join(root, 'Machining/Drilling');
const html = fs.readFileSync(path.join(hub, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(hub, 'app.js'), 'utf8');
const cores = {
  SuperDrillCore: require('../../../CuttingData/SuperDrill/core.js'),
  SuperPowerDrillCore: require('../../../CuttingData/SuperPowerDrill/core.js')
};

const attributes = source => Object.fromEntries([...source.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(match => [match[1], match[2] ?? '']));
const decode = source => source.replace(/&(?:amp|lt|gt|quot|#39);/g, entity => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" })[entity]);

// 模擬原生 select 的值還原與 option 狀態；禁用選項仍可由舊網址程式化還原。
function element(tag, attrs = {}) {
  let value = attrs.value || '', markup = '';
  const node = {
    id: attrs.id, href: attrs.href || '', dataset: {}, textContent: '', hidden: false, disabled: false,
    options: tag === 'select' ? [] : undefined, listeners: {},
    classList: { toggle() {} }, setAttribute(key, next) { this[key] = next; },
    addEventListener(type, callback) { this.listeners[type] = callback; },
    append(option) { this.options.push(option); }, appendChild(option) { this.options.push(option); }
  };
  Object.defineProperty(node, 'value', {
    get() { return value; },
    set(next) { next = String(next ?? ''); value = node.options && !node.options.some(option => option.value === next) ? '' : next; }
  });
  Object.defineProperty(node, 'innerHTML', {
    get() { return markup; },
    set(next) {
      markup = String(next);
      if (!node.options) return;
      node.options = [...markup.matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/g)].map(match => {
        const attrs = attributes(match[1]);
        return { value: decode(attrs.value || ''), textContent: decode(match[2]), hidden: 'hidden' in attrs, disabled: 'disabled' in attrs };
      });
    }
  });
  return node;
}

async function load(search = '', extraMaterial = null) {
  const location = new URL('https://example.test/Machining/Drilling/index.html' + search);
  const nodes = new Map(), links = [], errors = [];
  for (const match of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)) {
    const attrs = attributes(match[2]);
    let node;
    if (attrs.id) { node = element(match[1], attrs); nodes.set(attrs.id, node); }
    if (match[1] === 'a' && 'data-language-link' in attrs) {
      node ||= element('a', attrs); node.href = new URL(attrs.href, location).href; links.push(node);
    }
  }
  const context = {
    window: { DrillingSelector: Selector, ...cores }, URL, URLSearchParams, location,
    document: {
      currentScript: { src: new URL('app.js', location).href }, documentElement: {},
      getElementById: id => nodes.get(id) || null, createElement: tag => element(tag),
      querySelectorAll: selector => selector === 'a[data-language-link]' ? links : []
    },
    history: { replaceState(_state, _unused, next) { location.href = new URL(next, location).href; } },
    console: { error(error) { errors.push(error.message); } },
    fetch: async url => {
      const pathname = new URL(url).pathname;
      if (pathname.startsWith('/header/') || pathname.startsWith('/footer/')) return { ok: true, text: async () => '' };
      assert.match(pathname, /^\/CuttingData\/Super(?:Power)?Drill\/data\/(?:catalog|cutting-data)\.json$/);
      return { ok: true, json: async () => {
        const data = JSON.parse(fs.readFileSync(path.join(root, pathname), 'utf8'));
        if (extraMaterial && pathname.endsWith('/cutting-data.json')) data.materials.push(extraMaterial);
        return data;
      } };
    }
  };
  vm.runInNewContext(script, context);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(errors, []);
  return {
    get: id => nodes.get(id), location,
    input(id, value) { const node = nodes.get(id); node.value = value; nodes.get('jobForm').listeners.input({ target: node }); }
  };
}

const visibleMaterials = page => page.get('material').options.filter(option => option.value && !option.hidden && !option.disabled);

test('雙語材料選單只顯示8個有自家切削配對的材料，英文採型錄名稱', async () => {
  const catalogMaterials = JSON.parse(fs.readFileSync(path.join(root, 'CuttingData/SuperDrill/data/cutting-data.json'), 'utf8')).materials;
  for (const language of ['en', 'zh-TW']) {
    const page = await load(language === 'en' ? '' : '?lang=zh-TW');
    const options = visibleMaterials(page);
    assert.equal(options.length, 8);
    assert.deepEqual(options.map(option => option.value), catalogMaterials.map(material => material.id));
    for (const [index, option] of options.entries()) {
      assert.equal(option.textContent, `${catalogMaterials[index].iso} · ${catalogMaterials[index][language === 'en' ? 'catalog_label' : 'label_zh']}`);
      assert.doesNotMatch(option.value, /non_ferrous|heat_resistant/);
    }
    assert.equal(page.get('material').options.length, 9);
    assert.equal(page.get('material').value, '');
  }
});

test('材料表新列若兩產品都沒有支持配對，不會成為可見選項', async () => {
  const page = await load('', { id: 'not_supported', iso: 'N', label_zh: '未支持測試材料', catalog_label: 'Unsupported test material' });
  assert.equal(visibleMaterials(page).length, 8);
  assert.equal(page.get('material').options.some(option => option.value === 'not_supported'), false);
});

test('舊N/S與未知材料使用隱藏禁用佔位選項，保留網址阻擋且不輸出推薦入口', async () => {
  for (const language of ['en', 'zh-TW']) {
    for (const material of ['non_ferrous', 'heat_resistant', 'unlisted_legacy_material', 'toString', '__proto__', '<img src=x onerror=alert(1)>']) {
      const query = new URLSearchParams({ diameter: '24', depth: '36', material, lang: language });
      const page = await load('?' + query);
      const select = page.get('material');
      const sentinel = select.options.find(option => option.value === material);
      assert.ok(sentinel, material);
      assert.equal(sentinel.hidden, true, material);
      assert.equal(sentinel.disabled, true, material);
      assert.equal(sentinel.textContent, language === 'en' ? 'Select material' : '請選擇材料');
      assert.equal(select.value, material);
      assert.equal(visibleMaterials(page).length, 8);
      assert.equal(page.location.searchParams.get('material'), material);
      assert.equal(new URL(page.get('languageSwitch').href).searchParams.get('material'), material);
      assert.equal(page.get('toolList').innerHTML, '');
      assert.equal(page.get('recommendationSummary').hidden, true);
      assert.equal(page.get('emptyState').hidden, false);
      assert.doesNotMatch(page.get('emptyState').innerHTML, /<img|CuttingData\/(?:SuperDrill|SuperPowerDrill)\/index\.html/);
    }
  }
});

test('舊材料網址切回已支持材料後恢復推薦，原佔位仍隱藏禁用', async () => {
  for (const material of ['non_ferrous', 'heat_resistant', 'unknown_material']) {
    const page = await load(`?diameter=24&depth=36&material=${material}`);
    const sentinel = page.get('material').options.find(option => option.value === material);
    page.input('material', 'carbon_low');
    assert.equal(page.get('material').value, 'carbon_low');
    assert.equal(page.get('emptyState').hidden, true);
    assert.equal(page.get('recommendationSummary').hidden, false);
    assert.match(page.get('toolList').innerHTML, /CuttingData\/SuperDrill\/index\.html\?/);
    assert.equal(page.location.searchParams.get('material'), 'carbon_low');
    assert.equal(sentinel.hidden, true); assert.equal(sentinel.disabled, true);
    page.input('material', 'stainless');
    assert.match(page.get('toolList').innerHTML, /material=stainless/);
  }
});
