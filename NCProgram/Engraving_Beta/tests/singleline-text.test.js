const test = require('node:test');
const assert = require('node:assert/strict');
const data = require('../vendor/hanzi-strokes/medians.json').glyphs;
const chineseCore = require('../singleline-chinese.js');
const latin = require('../singleline-latin.js');
const latinExtra = require('../singleline-latin-extra.js');
const {create} = require('../singleline-text.js');
const {generate} = require('../core.js');
const {parse} = require('../../gcode-viewer/parser.js');
const chinese = {load: async () => {}, getGlyph: char => chineseCore.glyphFromData(data, char)};

test('繁中與英文混排產生開放筆畫，可匯入刀路檢視器', async () => {
  const paths = await create('你好 Nine9', {x:3,y:5,height:10,latin,chinese});
  assert.ok(paths.length > 13);
  assert.ok(paths.every(path => path.closed === false && path.points.length >= 2));
  const points = paths.flatMap(path => path.points);
  assert.ok(Math.abs(Math.min(...points.map(point => point.x)) - 3) < 1e-9);
  assert.ok(Math.abs(Math.min(...points.map(point => point.y)) - 5) < 1e-9);
  const code = generate(paths, {depth:.2,stepdown:.2,safeZ:5,feed:100,plunge:30,spindle:1000}).code;
  assert.equal(parse(code).stopped, false);
});

test('水平筆畫按字體框縮放，不因實際筆畫高度而過度放大', async () => {
  const paths = await create('一', {height:10,latin,chinese});
  assert.equal(paths.length, 1);
  const points = paths[0].points;
  const width = Math.max(...points.map(point => point.x)) - Math.min(...points.map(point => point.x));
  assert.ok(width > 0 && width < 15);
});

test('缺字與無效設定會拒絕整段文字', async () => {
  await assert.rejects(create('你好😀', {height:10,latin,chinese}), /不支援/);
  await assert.rejects(create('Hello', {height:0,latin,chinese}), /高度/);
  await assert.rejects(create(' \n', {height:10,latin,chinese}), /輸入文字/);
});

test('新增字型支援中英混排並產生可解析的開放刀路', async () => {
  const signatures = [];
  for (const id of ['ems-tech', 'ems-hand', 'ems-swiss', 'ems-capitol', 'ems-league', 'ems-neato']) {
    const adapter = {getGlyph: (char, height) => latinExtra.getGlyph(id, char, height)};
    const paths = await create('你好 Nine9', {height:10, latin:adapter, chinese});
    assert.ok(paths.every(path => path.closed === false && path.points.length >= 2));
    const code = generate(paths, {depth:.2,stepdown:.2,safeZ:5,feed:100,plunge:30,spindle:1000}).code;
    assert.equal(parse(code).stopped, false);
    signatures.push(JSON.stringify(await create('Nine9', {height:10, latin:adapter, chinese})));
    assert.deepEqual(await create('你好', {height:10, latin:adapter, chinese}),
      await create('你好', {height:10, latin, chinese}));
  }
  assert.notEqual(signatures[0], signatures[1]);
});

test('Swiss 單線字型能依指定尺寸產生 Nine-9 文字刀路', async () => {
  const adapter = {getGlyph: (char, height) => latinExtra.getGlyph('ems-swiss', char, height)};
  const paths = await create('Nine-9', {x:0,y:0,height:20,latin:adapter,chinese});
  assert.equal(paths.length, 8);
  assert.ok(paths.every(path => path.closed === false));
  const points=paths.flatMap(path=>path.points);
  const xs=points.map(point=>point.x),ys=points.map(point=>point.y);
  assert.ok(Math.abs(Math.min(...xs))<1e-9 && Math.abs(Math.min(...ys))<1e-9);
  assert.ok(Math.abs(Math.max(...xs)-97.37)<0.01);
  assert.ok(Math.abs(Math.max(...ys)-27.82)<0.01);
  const code=generate(paths,{depth:.5,stepdown:.5,safeZ:5,feed:300,plunge:100,spindle:3000}).code;
  assert.equal(parse(code).stopped,false);
});
