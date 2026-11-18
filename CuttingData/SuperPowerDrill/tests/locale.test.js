'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const L = require('../locale.js');
const Core = require('../core.js');
const Diagrams = require('../diagrams.js');
const catalog = Core.normalizeCatalog(require('../data/catalog.json'), require('../data/cutting-data.json'));

test('核心與 SVG 預設英文，zh-TW 明確保留繁中，不改數值及材料限制', () => {
  assert.equal(Core.getMaterialSupport(catalog, 'non_ferrous').note, 'This series is not recommended for non-ferrous metals');
  assert.equal(Core.getMaterialSupport(catalog, 'non_ferrous', 'zh-TW').note, '本系列不建議用於非鐵金屬');
  const tool = catalog.tools[0];
  for (const material of ['', 'non_ferrous', 'carbon_low']) {
    const result = Core.selectCutting(catalog, tool, { diameter: tool.D, depth: 50, material });
    assert.ok(result.notes.every(note => !/[\u3400-\u9fff]/.test(note)));
  }
  assert.doesNotMatch(Diagrams.renderTool(tool), /[\u3400-\u9fff]/);
  assert.doesNotMatch(Diagrams.renderEmpty(), /[\u3400-\u9fff]/);
  assert.match(Diagrams.renderTool(tool, { lang: 'zh-TW' }), /L1 前段/);
});

test('只翻譯指定 DOM 範圍，沒有全域 observer 或跨產品影響', () => {
  const inside = { nodeType: 3, nodeValue: '主軸轉速' };
  const outside = { nodeType: 3, nodeValue: '主軸轉速' };
  const scope = { nodeType: 1, tagName: 'MAIN', childNodes: [inside], hasAttribute: () => false };
  L.renderScoped(scope, 'en');
  assert.equal(inside.nodeValue, 'Spindle speed');
  assert.equal(outside.nodeValue, '主軸轉速');
  L.renderScoped(scope, 'zh-TW');
  assert.equal(inside.nodeValue, '主軸轉速');
  assert.doesNotMatch(fs.readFileSync(path.join(__dirname, '../locale.js'), 'utf8'), /MutationObserver/);
});

test('初始 HTML 英文、語言按鈕與專屬 locale 載入在核心之前', () => {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.match(html, /<html lang="en">/);
  assert.match(html, /id="languageToggle"/);
  assert.ok(html.indexOf('./locale.js') < html.indexOf('./core.js'));
  const text = html.replace(/<!--[\s\S]*?-->|<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]*>/g, '').replace(/繁體中文/g, '');
  assert.doesNotMatch(text, /[\u3400-\u9fff]/);
});
