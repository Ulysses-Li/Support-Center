'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Core = require('../core.js');
const Diagrams = require('../diagrams.js');
const Locale = require('../locale.js');
const root = path.resolve(__dirname, '..');

// 使用最小 DOM 與 fetch 替身檢查表單狀態，不依賴瀏覽器或其他產品檔案。
async function load(search = '', defaultLang = 'zh-TW') {
  if (defaultLang && !new URLSearchParams(search).has('lang')) search += (search ? '&' : '?') + 'lang=' + defaultLang;
  const markup = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const nodes = {};
  for (const [, id] of markup.matchAll(/\bid="([^"]+)"/g)) {
    nodes[id] = {
      id, value: '', textContent: '', innerHTML: '', hidden: false, disabled: false, dataset: {}, handlers: {}, options: [],
      get innerText() { return this.textContent || this.innerHTML.replace(/<[^>]+>/g, ' '); },
      addEventListener(type, callback) { this.handlers[type] = callback; },
      appendChild(option) { this.options.push(option); },
      classList: { add() {}, remove() {}, toggle() { return true; } },
      showModal() { this.open = true; }, close() { this.open = false; }
    };
  }
  Object.assign(nodes.machineMode, { value: 'rotating' });
  Object.assign(nodes.application, { value: 'regular_surface' });
  Object.assign(nodes.coolant, { value: 'unknown' });
  // 選項由實際 innerHTML 解析，避免替身自行加入正式選單不存在的材料。
  const decode = text => text.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const encode = text => String(text).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  Object.defineProperty(nodes.material, 'innerHTML', {
    get() { return this.markup || ''; },
    set(markup) {
      this.markup = markup;
      this.options = [...markup.matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/g)].map(([, attrs, text]) => ({ value: decode(attrs.match(/\bvalue="([^"]*)"/)?.[1] || ''), textContent: decode(text), hidden: /\bhidden\b/.test(attrs), disabled: /\bdisabled\b/.test(attrs) }));
    }
  });
  nodes.material.appendChild = function (option) {
    this.options.push(option);
    this.markup += `<option value="${encode(option.value)}"${option.hidden ? ' hidden' : ''}${option.disabled ? ' disabled' : ''}>${encode(option.textContent)}</option>`;
  };
  const listeners = {}, requested = [], errors = [], copied = [], urls = [];
  const hub = {}, notes = { dataset: { notesLink: 'questions' } };
  const scopedLocale = { ...Locale, renderScoped(_scope, lang) {
    for (const node of Object.values(nodes)) { node.textContent = Locale.translate(node.textContent, lang); node.innerHTML = Locale.translateMarkup(node.innerHTML, lang); }
  } };
  const context = {
    URL, URLSearchParams, console: { error: error => errors.push(error), warn() {} },
    window: { SuperPowerDrillCore: Core, SuperPowerDrillDiagrams: Diagrams, SuperPowerDrillLocale: scopedLocale },
    document: {
      documentElement: {}, title: 'Super Power Drill Setup | Nine9 Support Center',
      currentScript: { src: 'https://example.test/CuttingData/SuperPowerDrill/app.js' },
      getElementById: id => nodes[id] || null,
      createElement: () => ({ value: '', textContent: '' }),
      querySelectorAll: selector => selector === '[data-hub-link]' ? [hub] : selector === '[data-notes-link]' ? [notes] : [],
      addEventListener: (type, callback) => { listeners[type] = callback; }
    },
    location: { pathname: '/CuttingData/SuperPowerDrill/index.html', search, hash: '' },
    history: { replaceState: (_a, _b, value) => urls.push(value) },
    navigator: { clipboard: { writeText: async value => { copied.push(value); } } },
    fetch: async url => {
      const target = new URL(url);
      requested.push(target.pathname);
      return {
        ok: true, text: async () => '',
        json: async () => JSON.parse(fs.readFileSync(path.join(root, 'data', path.basename(target.pathname)), 'utf8'))
      };
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'app.js'), 'utf8'), context);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(errors, []);
  return { nodes, listeners, requested, copied, urls, hub, notes, context };
}

test('自有資料載入與範例能完成選型，網址回傳自身與 hub', async () => {
  const app = await load();
  assert.deepEqual(app.requested.filter(url => url.endsWith('.json')).sort(), ['/CuttingData/SuperPowerDrill/data/catalog.json', '/CuttingData/SuperPowerDrill/data/cutting-data.json']);
  app.nodes.exampleButton.handlers.click();
  assert.equal(app.nodes.selectedId.textContent, '00-99307-25100');
  assert.equal(app.nodes.vc.value, '115');
  assert.equal(app.nodes.feed.value, '0.08');
  assert.equal(app.nodes.copyButton.disabled, false);
  assert.match(app.nodes.diagramCanvas.innerHTML, /L1 前段 139 mm/);
  assert.match(app.nodes.cuttingSource.innerHTML, /Super_Power_Drill_p128-135\.pdf#page=8/);
  assert.match(app.hub.href, /Machining\/Drilling\/index\.html\?.*spdTool=00-99307-25100/);
});

test('既有 URL 帶入公差、料號、手動 Vc/f 與限速後仍可計算', async () => {
  const app = await load('?diameter=25&depth=100&material=carbon_low&shank=32&coolant=yes&pressure=10&spdDepthClass=lt7d&tool=00-99307-25100&values=manual&vc=100&feed=0.08&machineMax=500&toleranceUpper=%2B0.05&toleranceLower=-0.02');
  assert.equal(app.nodes.vc.value, '100');
  assert.equal(app.nodes.feed.value, '0.08');
  assert.equal(app.nodes.rpmResult.textContent, '500');
  assert.equal(app.nodes.feedResult.textContent, '40');
  assert.equal(app.nodes.toleranceUpper.value, '+0.05');
  assert.equal(app.nodes.toleranceLower.value, '-0.02');
  assert.match(app.urls.at(-1), /values=manual.*vc=100.*feed=0.08/);
});

test('低壓與斜面即使輸入手動值也停止計算與複製', async () => {
  const app = await load('?diameter=25&depth=100&material=carbon_low&shank=32&coolant=yes&pressure=9&spdDepthClass=lt7d&tool=00-99307-25100&values=manual&vc=100&feed=0.08');
  assert.equal(app.nodes.rpmResult.textContent, '—');
  assert.equal(app.nodes.feedResult.textContent, '—');
  assert.equal(app.nodes.copyButton.disabled, true);
  app.nodes.pressure.value = '10';
  app.nodes.application.value = 'angled';
  app.listeners.input({ target: app.nodes.application });
  assert.equal(app.nodes.rpmResult.textContent, '—');
  assert.equal(app.nodes.copyButton.disabled, true);
});

test('非鐵、耐熱與未知材料 URL 都顯示材料原因，手動值無法繞過', async () => {
  for (const material of ['non_ferrous', 'heat_resistant', 'unknown-material']) {
    const app = await load('?diameter=25&depth=100&material=' + material + '&shank=32&coolant=yes&pressure=10&spdDepthClass=lt7d&tool=00-99307-25100&values=manual&vc=100&feed=0.08');
    const reason = material === 'non_ferrous' ? '本系列不建議用於非鐵金屬' : '型錄未列此材料適用配對，不提供推薦';
    assert.equal(app.nodes.material.value, material);
    assert.equal(app.nodes.toolList.innerHTML, '');
    assert.equal(app.nodes.emptyState.textContent, reason);
    assert.equal(app.nodes.dataStatus.textContent, reason);
    assert.equal(app.nodes.resultCount.textContent, '此材料不提供推薦');
    assert.equal(app.nodes.selectedStatus.textContent, '材料不適用');
    assert.equal(app.nodes.medianButton.disabled, true);
    assert.equal(app.nodes.vc.disabled, true);
    assert.equal(app.nodes.feed.disabled, true);
    assert.equal(app.nodes.copyButton.disabled, true);
    assert.equal(app.nodes.rpmResult.textContent, '—');
    app.nodes.vc.value = '100'; app.nodes.feed.value = '0.08';
    app.nodes.vc.handlers.input();
    assert.equal(app.nodes.rpmResult.textContent, '—');
    assert.equal(app.nodes.feedResult.textContent, '—');
    assert.equal(app.nodes.copyButton.disabled, true);
    const legacy = app.nodes.material.options.find(option => option.value === material);
    assert.ok(legacy && legacy.hidden && legacy.disabled);
    assert.equal(legacy.textContent, '請選擇材料');
    assert.ok(!app.nodes.material.options.some(option => !option.hidden && !option.disabled && option.value === material));
  }
});

test('已支持材料缺少分組可手動試算，未選材料不能計算', async () => {
  const prefix = '?diameter=25&depth=100&shank=32&coolant=yes&pressure=10&tool=00-99307-25100&values=manual&vc=100&feed=0.08';
  const supported = await load(prefix + '&material=carbon_low');
  assert.notEqual(supported.nodes.rpmResult.textContent, '—');
  assert.equal(supported.nodes.copyButton.disabled, false);
  assert.match(supported.nodes.machineLimitNote.textContent, /手動試算/);
  const unselected = await load(prefix);
  assert.equal(unselected.nodes.rpmResult.textContent, '—');
  assert.equal(unselected.nodes.copyButton.disabled, true);
});

test('無 lang 預設英文，切換與 hub／notes 保留條件，複製內容完整英文', async () => {
  const app = await load('', null);
  assert.equal(app.context.document.documentElement.lang, 'en');
  app.nodes.exampleButton.handlers.click();
  for (const node of Object.values(app.nodes)) {
    if (node.id === 'languageToggle') continue;
    assert.doesNotMatch(node.textContent + node.innerHTML, /[\u3400-\u9fff]/, node.id);
  }
  const toggle = new URL(app.nodes.languageToggle.href);
  assert.equal(toggle.searchParams.get('lang'), 'zh-TW');
  assert.equal(toggle.searchParams.get('diameter'), '25');
  assert.equal(toggle.searchParams.get('tool'), '00-99307-25100');
  assert.equal(new URL(app.hub.href).searchParams.get('lang'), 'en');
  assert.equal(new URL(app.notes.href).searchParams.get('lang'), 'en');
  assert.match(app.urls.at(-1), /lang=en/);
  await app.nodes.copyButton.handlers.click();
  assert.equal(app.copied.length, 1);
  assert.doesNotMatch(app.copied[0], /[\u3400-\u9fff]/);
});

test('英文不支持材料仍阻擋；繁中可切回原文', async () => {
  const en = await load('?lang=en&diameter=25&depth=100&material=non_ferrous', null);
  assert.equal(en.nodes.emptyState.textContent, 'This series is not recommended for non-ferrous metals');
  assert.equal(en.nodes.copyButton.disabled, true);
  const zh = await load('?lang=zh-TW&diameter=25&depth=100&material=non_ferrous', null);
  assert.equal(zh.context.document.documentElement.lang, 'zh-Hant');
  assert.equal(zh.nodes.emptyState.textContent, '本系列不建議用於非鐵金屬');
  assert.equal(new URL(zh.nodes.languageToggle.href).searchParams.get('lang'), 'en');
});

test('英／繁中下拉只提供 8 種已支持材料，舊 N/S/未知材料不能成為可選項', async () => {
  const supportedIds = JSON.parse(fs.readFileSync(path.join(root, 'data/cutting-data.json'), 'utf8')).materials.map(material => material.id).sort();
  for (const lang of ['en', 'zh-TW']) {
    const normal = await load('?lang=' + lang, null);
    const visible = normal.nodes.material.options.filter(option => option.value && !option.hidden && !option.disabled);
    assert.deepEqual(visible.map(option => option.value).sort(), supportedIds);
    assert.equal(visible.length, 8);
    assert.equal(/[\u3400-\u9fff]/.test(visible.map(option => option.textContent).join(' ')), lang === 'zh-TW');
    for (const material of ['non_ferrous', 'heat_resistant', 'unknown-material']) {
      const legacy = await load('?lang=' + lang + '&diameter=25&depth=100&material=' + material, null);
      const option = legacy.nodes.material.options.find(item => item.value === material);
      assert.ok(option.hidden && option.disabled);
      assert.equal(option.textContent, lang === 'en' ? 'Choose a material' : '請選擇材料');
      assert.deepEqual(legacy.nodes.material.options.filter(item => item.value && !item.hidden && !item.disabled).map(item => item.value).sort(), supportedIds);
      assert.equal(legacy.nodes.copyButton.disabled, true);
      assert.equal(legacy.nodes.rpmResult.textContent, '—');
    }
  }
});
