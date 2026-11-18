'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Selector = require('../selector.js');
const root = path.resolve(__dirname, '../../..');
const packages = Object.fromEntries(Object.entries(Selector.products).map(([key, product]) => {
  const directory = path.join(root, product.directory);
  const core = require(path.join(directory, 'core.js'));
  const read = name => JSON.parse(fs.readFileSync(path.join(directory, 'data', name), 'utf8'));
  return [key, { core, catalog: core.normalizeCatalog(read('catalog.json'), read('cutting-data.json')) }];
}));
const groups = (state, selected = {}) => Selector.selectFamilies(packages, { ...Selector.defaults, ...state }, selected);

test('分類入口讀取兩個獨立核心及各自完整規格', () => {
  assert.notEqual(packages.sd.core, packages.spd.core);
  assert.deepEqual(groups({}).map(group => [group.key, group.matching.length]), [['sd', 51], ['spd', 81]]);
  assert.ok(packages.sd.catalog.tools.every(tool => tool.family === 'sd'));
  assert.ok(packages.spd.catalog.tools.every(tool => tool.family === 'spd'));
});

test('沒有符合規格的家族完全隱藏，缺少材料切削值仍保留幾何結果', () => {
  const state = { diameter: '10', depth: '20', shank: '20', material: 'carbon_low' };
  assert.deepEqual(groups(state).map(group => [group.key, group.matching.length]), [['sd', 1]]);
  assert.equal(groups({ ...state, depth: '31' }).length, 0);
  assert.deepEqual(groups({ ...state, material: 'non_ferrous' }).map(group => group.key), ['sd']);
});

test('指定4D刀體在材料變更後保留，失效料號才改選', () => {
  const state = { diameter: '20', depth: '20', shank: '25' };
  const selected = { sd: '00-99314-20' };
  for (const material of ['', 'stainless', 'non_ferrous']) {
    assert.equal(groups({ ...state, material }, selected)[0].chosen.tool.id, selected.sd);
  }
  assert.equal(groups({ ...state, diameter: '18' }, selected)[0].chosen.tool.D, 18);
});

test('兩入口獨立URL，傳實際料號與公差但不代填深度', () => {
  const state = { ...Selector.defaults, toleranceUpper: '+0.05', toleranceLower: '-0.02', spdDepthClass: 'lt7d', applicationFactor: '75' };
  for (const group of groups(state)) {
    const url = new URL(Selector.productUrl('http://127.0.0.1:5500/', group.key, state, group.chosen.tool));
    assert.equal(url.pathname, '/' + group.product.directory + 'index.html');
    assert.equal(url.searchParams.get('tool'), group.chosen.tool.id);
    assert.equal(url.searchParams.get('diameter'), String(group.chosen.tool.D));
    assert.equal(url.searchParams.get('depth'), null);
    assert.equal(url.searchParams.get('toleranceUpper'), '+0.05');
    assert.equal(url.searchParams.get('toleranceLower'), '-0.02');
    assert.equal(url.searchParams.has('sdTool'), false);
    assert.equal(url.searchParams.has('spdTool'), false);
  }
});

test('獨立產品不引用另一產品或舊共用bundle，分類頁不載入產品app/CSS', () => {
  for (const product of Object.values(Selector.products)) {
    const directory = path.join(root, product.directory);
    const other = product.directory.includes('/SuperDrill/') ? 'SuperPowerDrill' : 'SuperDrill';
    for (const file of ['index.html', 'app.js', 'core.js', 'diagrams.js', 'styles.css']) {
      const text = fs.readFileSync(path.join(directory, file), 'utf8');
      assert.equal(text.includes('CuttingData/Drilling/'), false, `${product.name}/${file} legacy dependency`);
      assert.equal(text.includes('../Drilling/'), false, `${product.name}/${file} legacy relative dependency`);
      assert.equal(text.includes('/' + other + '/'), false, `${product.name}/${file} cross dependency`);
    }
  }
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.equal(html.includes('id="setupColumn"'), false);
  assert.equal(html.includes('id="diagramPanel"'), false);
  assert.equal(/Super(?:Power)?Drill\/(?:app\.js|styles\.css)/.test(html), false);
});
