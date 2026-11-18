'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const diagrams = require('../diagrams.js');
const item = { id: '00-99307-19100', family: 'spd', D: 19, T: 100, L: 119, L1: 134, shank: 32, d1: 39, peripheryQty: 1, sourcePage: 130 };

test('獨立圖形 API 保留 SVG 可及性與實際 mm 數值', () => {
  const context = { SuperPowerDrillLocale: require('../locale.js') };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../diagrams.js'), 'utf8'), context);
  assert.equal(typeof context.SuperPowerDrillDiagrams.renderTool, 'function');
  assert.equal(context.DrillingDiagrams, undefined);
  const svg = diagrams.renderTool(item, { diameter: 19, lang: 'zh-TW' });
  assert.match(svg, /viewBox="0 0 900 420" role="img" aria-labelledby=/);
  for (const value of ['00-99307-19100', '可鑽深 T 100 mm', 'L 119 mm', 'L1 前段 134 mm', 'Ø32 mm', 'Ø39 mm', '後柄 58 mm', '非比例示意']) assert.ok(svg.includes(value));
  assert.match(svg, /dd-long-flute/);
  assert.match(svg, /dd-center-pilot/);
  assert.doesNotMatch(svg, /<image|dd-helical-flute/);
});

test('只接受本產品；外刃片數、重複圖面定義與文字跳脫正確', () => {
  assert.match(diagrams.renderTool({ ...item, family: 'sd' }, { lang: 'zh-TW' }), /選擇刀桿後/);
  const one = diagrams.renderTool(item);
  const two = diagrams.renderTool({ ...item, peripheryQty: 2 });
  assert.equal((one.match(/class="dd-insert dd-periphery-insert"/g) || []).length, 1);
  assert.equal((two.match(/class="dd-insert dd-periphery-insert"/g) || []).length, 2);
  assert.notEqual(one.match(/id="([^"]+)-title"/)[1], two.match(/id="([^"]+)-title"/)[1]);
  const invalid = diagrams.renderTool({ ...item, id: '<script>alert(1)</script>', T: null, D: Infinity }, { lang: 'zh-TW' });
  assert.match(invalid, /&lt;script&gt;/);
  assert.match(invalid, /可鑽深 T 未提供/);
  assert.doesNotMatch(invalid, /<script|Infinity|NaN|undefined/);
});
