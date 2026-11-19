const test = require('node:test');
const assert = require('node:assert/strict');
const { glyphs } = require('../vendor/hanzi-strokes/medians.json');
const chinese = require('../singleline-chinese.js');
const core = require('../core.js');
const parser = require('../../gcode-viewer/parser.js');

test('繁體中文單線筆畫保持原始數目，並可送至現有刀路解析器', () => {
  const one = chinese.glyphFromData(glyphs, '一');
  assert.equal(one.paths.length, 1);
  for (const char of ['你', '好', '漢', '字', '雕', '刻']) {
    const glyph = chinese.glyphFromData(glyphs, char);
    assert.ok(glyph.paths.length > 0);
    assert.ok(glyph.paths.every(path => !path.closed && path.points.length >= 2));
    const output = core.generate(glyph.paths, {depth:0.2, stepdown:0.2, safeZ:5, feed:100, plunge:30, spindle:1000});
    assert.equal(parser.parse(output.code).stopped, false);
  }
});

test('缺字或無效筆畫不會靜默產生路徑', () => {
  assert.throws(() => chinese.glyphFromData(glyphs, '😀'), /不支援/);
  assert.throws(() => chinese.glyphFromData({ '假': [[[1, 2]]] }, '假'), /資料有誤/);
  assert.throws(() => chinese.glyphFromData({ '假': [[[1, 2], [1, 2]]] }, '假'), /長度為零/);
});
