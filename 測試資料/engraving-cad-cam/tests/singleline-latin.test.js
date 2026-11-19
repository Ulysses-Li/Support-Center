const test = require('node:test');
const assert = require('node:assert/strict');
const latin = require('../singleline-latin.js');
const core = require('../core.js');
const parser = require('../../gcode-viewer/parser.js');

test('英文字母、數字及常用符號皆為開放單線筆畫', () => {
  for (const char of 'Hello Nine9! 0123456789-_.') {
    const glyph = latin.getGlyph(char);
    assert.ok(glyph && glyph.advance > 0, char);
    for (const stroke of glyph.paths) {
      assert.equal(stroke.closed, false);
      assert.ok(stroke.points.length >= 2);
      for (const p of stroke.points) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
    }
  }
  assert.equal(latin.getGlyph('A').paths.length,2);
  assert.equal(latin.getGlyph(' ').paths.length,0);
  assert.equal(latin.getGlyph('你'),null);
  assert.equal(latin.getGlyph('😀'),null);
});

test('圓弧字母以曲線細分並能交由現有 G-code 解析', () => {
  const glyph=latin.getGlyph('O');
  assert.ok(glyph.paths[0].points.length>12);
  const path=glyph.paths[0];
  const ys=path.points.map(p=>p.y);
  assert.ok(Math.max(...ys)-Math.min(...ys) > 0.9);
  const scaled=glyph.paths.map(p=>({closed:false,points:p.points.map(q=>({x:q.x*10,y:q.y*10}))}));
  const nc=core.generate(scaled,{depth:.2,stepdown:.2,safeZ:5,feed:100,plunge:30,spindle:1000});
  assert.equal(parser.parse(nc.code).stopped,false);
});

test('字高增大時提升圓弧細分密度', () => {
  const small=latin.getGlyph('O',10).paths[0].points.length;
  const large=latin.getGlyph('O',1000).paths[0].points.length;
  assert.ok(large>small);
  assert.throws(()=>latin.getGlyph('O',0),/文字高度/);
});

test('原字型缺少的符號明確回報，避免錯誤替代', () => {
  assert.equal(latin.getGlyph('^'),null);
  assert.equal(latin.getGlyph('`'),null);
  assert.equal(latin.getGlyph('|'),null);
});
