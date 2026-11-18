'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Core = require('../core.js');
const Diagrams = require('../diagrams.js');
const root = path.resolve(__dirname, '..');

// 使用最小 DOM 與 fetch 替身檢查表單狀態，不依賴瀏覽器或其他產品檔案。
async function load(search = '') {
  const markup = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const nodes = {};
  for (const [, id] of markup.matchAll(/\bid="([^"]+)"/g)) {
    nodes[id] = {
      id, value: '', textContent: '', innerHTML: '', hidden: false, disabled: false, dataset: {}, handlers: {},
      addEventListener(type, callback) { this.handlers[type] = callback; },
      classList: { add() {}, remove() {}, toggle() { return true; } },
      showModal() { this.open = true; }, close() { this.open = false; }
    };
  }
  Object.assign(nodes.machineMode, { value: 'rotating' });
  Object.assign(nodes.application, { value: 'regular_surface' });
  Object.assign(nodes.coolant, { value: 'unknown' });
  const listeners = {}, requested = [], errors = [], copied = [], urls = [];
  const hub = {};
  const context = {
    URL, URLSearchParams, console: { error: error => errors.push(error), warn() {} },
    window: { SuperPowerDrillCore: Core, SuperPowerDrillDiagrams: Diagrams },
    document: {
      currentScript: { src: 'https://example.test/CuttingData/SuperPowerDrill/app.js' },
      getElementById: id => nodes[id] || null,
      querySelectorAll: selector => selector === '[data-hub-link]' ? [hub] : [],
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
  return { nodes, listeners, requested, copied, urls, hub };
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
