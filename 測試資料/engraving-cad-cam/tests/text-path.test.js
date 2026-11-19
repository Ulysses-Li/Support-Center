const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const opentype = require('../vendor/opentype.min.js');
const {pathsFromFont} = require('../text-path.js');
const core = require('../core.js');
const parseGcode = require('../../gcode-viewer/parser.js').parse;
const bytes = fs.readFileSync(path.join(__dirname,'../vendor/NotoSansTC.ttf'));
const font = opentype.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));

test('繁體中文與英文轉換為可加工輪廓並保留字高與原點', () => {
  const paths=pathsFromFont(font,'Hello 你好',{x:3,y:7,height:12,spacing:1});
  assert.ok(paths.length>8);
  assert.ok(paths.every(p=>p.closed && p.points.length>=2));
  const points=paths.flatMap(p=>p.points);
  const xs=points.map(p=>p.x),ys=points.map(p=>p.y);
  assert.ok(Math.abs(Math.min(...xs)-3)<0.01);
  assert.ok(Math.abs(Math.min(...ys)-7)<0.03);
  assert.ok(Math.abs(Math.max(...ys)-Math.min(...ys)-12)<0.03);
  const result=core.generate(paths,{depth:.2,stepdown:.2,safeZ:5,feed:100,plunge:30,spindle:1000});
  const parsed=parseGcode(result.code);
  assert.equal(parsed.stopped,false);
  assert.ok(parsed.segments.length>0);
});

test('缺字、換行及錯誤尺寸回報錯誤而不產生局部刀路', () => {
  assert.throws(()=>pathsFromFont(font,'你好😀',{height:5}),/不支援/);
  assert.throws(()=>pathsFromFont(font,'A\nB',{height:5}),/單行/);
  assert.throws(()=>pathsFromFont(font,'   ',{height:5}),/輸入文字/);
  assert.throws(()=>pathsFromFont(font,'Hello',{height:0}),/高度/);
});
