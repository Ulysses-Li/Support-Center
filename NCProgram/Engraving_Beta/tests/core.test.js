const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core.js');
const parseGcode = require('../../gcode-viewer/parser.js').parse;
const fs = require('node:fs');
const path = require('node:path');
const p = (...pairs) => pairs.flat().join('\n') + '\n';
const file = (units, ...entities) => p(0,'SECTION',2,'HEADER',9,'$INSUNITS',70,units,0,'ENDSEC',0,'SECTION',2,'ENTITIES',...entities,0,'ENDSEC',0,'EOF');

test('Nine-9 DXF 範例保留圖形、尺寸並可產生刀路', () => {
  const result=core.parseDXF(fs.readFileSync(path.join(__dirname,'../nine9-example.dxf'),'utf8'));
  assert.equal(result.blocked,false);assert.equal(result.needsUnits,false);
  assert.equal(result.paths.length,14);assert.ok(result.paths.every(shape=>shape.closed));
  const points=result.paths.flatMap(shape=>shape.points);
  const xs=points.map(point=>point.x),ys=points.map(point=>point.y);
  assert.ok(Math.abs(Math.min(...xs))<1e-9 && Math.abs(Math.min(...ys))<1e-9);
  assert.ok(Math.abs(Math.max(...xs)-100)<.01);
  assert.ok(Math.abs(Math.max(...ys)-24.81)<.01);
  const code=core.generate(result.paths,{depth:.5,stepdown:.5,safeZ:5,feed:300,plunge:100,spindle:3000}).code;
  assert.equal(parseGcode(code).stopped,false);
});

test('依 DXF 單位轉換，無單位時要求選擇', () => {
  const entity = [0,'LINE',10,1,20,2,11,2,21,2];
  assert.equal(core.parseDXF(file(1,...entity)).paths[0].points[0].x,25.4);
  assert.equal(core.parseDXF(file(4,...entity)).paths[0].points[0].x,1);
  const missing=core.parseDXF(file(0,...entity)); assert.equal(missing.blocked,true); assert.equal(missing.needsUnits,true);
  assert.equal(core.parseDXF(file(0,...entity),'inch').paths[0].points[0].x,25.4);
  assert.equal(core.parseDXF(file(0,...entity),'mm').paths[0].points[0].x,1);
  assert.equal(core.parseDXF(file(5,...entity)).blocked,true);
});
test('解析圓弧及正負 bulge，而非只連接直線', () => {
  const drawing=file(4,0,'ARC',10,0,20,0,40,5,50,0,51,90,0,'LWPOLYLINE',90,2,70,0,10,0,20,0,42,1,10,2,20,0);
  const result=core.parseDXF(drawing); assert.equal(result.blocked,false); assert.equal(result.paths.length,2);
  assert.ok(Math.abs(result.paths[0].points.at(-1).y-5)<1e-8);
  assert.ok(result.paths[1].points.some(v=>v.y<-.9));
  const negative=core.parseDXF(file(4,0,'LWPOLYLINE',90,2,70,0,10,0,20,0,42,-1,10,2,20,0));
  assert.ok(negative.paths[0].points.some(v=>v.y>.9));
});
test('封閉多段線與圓形正確辨識', () => {
  const result=core.parseDXF(file(4,0,'LWPOLYLINE',90,3,70,1,10,0,20,0,10,10,20,0,10,0,20,5,0,'CIRCLE',10,2,20,3,40,1));
  assert.equal(result.blocked,false); assert.deepEqual(result.paths.map(x=>x.closed),[true,true]);
  assert.equal(result.paths[0].points.length,3);
});
test('R12 POLYLINE 依 VERTEX 與 SEQEND 還原封閉輪廓與圓弧', () => {
  const drawing = file(4,
    0,'POLYLINE',70,1,66,1,10,0,20,0,30,0,
    0,'VERTEX',10,0,20,0,30,0,42,1,
    0,'VERTEX',10,2,20,0,30,0,
    0,'VERTEX',10,2,20,2,30,0,
    0,'SEQEND',
    0,'LINE',10,4,20,0,11,5,21,0);
  const result=core.parseDXF(drawing);
  assert.equal(result.blocked,false); assert.equal(result.paths.length,2);
  assert.equal(result.paths[0].closed,true);
  assert.ok(result.paths[0].points.some(v=>v.y<-.9));
  assert.deepEqual(result.paths[1].points[0],{x:4,y:0});
  const code=core.generate(result.paths,{depth:0.5,stepdown:0.5,safeZ:5,feed:100,plunge:30,spindle:3000}).code;
  assert.equal(parseGcode(code).stopped,false);
});
test('R12 多段線的 3D、擬合頂點與不完整序列會中止輸出', () => {
  const base = [0,'POLYLINE',70,8,0,'VERTEX',10,0,20,0,0,'VERTEX',10,1,20,0,0,'SEQEND'];
  assert.equal(core.parseDXF(file(4,...base)).blocked,true);
  const mesh = [0,'POLYLINE',70,64,0,'VERTEX',10,0,20,0,0,'VERTEX',10,1,20,0,0,'SEQEND'];
  assert.equal(core.parseDXF(file(4,...mesh)).blocked,true);
  const vertex = [0,'POLYLINE',70,0,0,'VERTEX',10,0,20,0,70,16,0,'VERTEX',10,1,20,0,0,'SEQEND'];
  assert.equal(core.parseDXF(file(4,...vertex)).blocked,true);
  const nonPlanar = [0,'POLYLINE',70,0,0,'VERTEX',10,0,20,0,30,1,0,'VERTEX',10,1,20,0,0,'SEQEND'];
  assert.equal(core.parseDXF(file(4,...nonPlanar)).blocked,true);
  const missing = [0,'POLYLINE',70,0,0,'VERTEX',10,0,20,0,0,'VERTEX',10,1,20,0,0,'LINE',10,2,20,0,11,3,21,0];
  const result=core.parseDXF(file(4,...missing));
  assert.equal(result.blocked,true); assert.match(result.warnings.join(),/SEQEND/); assert.equal(result.paths.length,1);
});
test('大半徑圓弧的弦高誤差低於 0.01 mm', () => {
  const points=core.circle(0,0,1000).points;
  const a=points[0],b=points[1];
  const midpointRadius=Math.hypot((a.x+b.x)/2,(a.y+b.y)/2);
  assert.ok(1000-midpointRadius<=0.01000001);
});
test('阻止未支援實體與非平面座標', () => {
  const mixed=core.parseDXF(file(4,0,'LINE',10,0,20,0,11,2,21,0,0,'INSERT',2,'PART'));
  assert.equal(mixed.blocked,true); assert.equal(mixed.paths.length,1); assert.match(mixed.warnings.join(),/INSERT/);
  for(const extra of [[30,3],[210,1,220,0,230,0]]) {
    const result=core.parseDXF(file(4,0,'LINE',10,0,20,0,11,2,21,0,...extra));
    assert.equal(result.blocked,true);
  }
});
test('分層雕刻在每條路徑前抬刀，且現有檢視器能完整解析', () => {
  const paths=[core.rectangle(0,0,10,5),core.line(20,0,25,0)];
  const result=core.generate(paths,{depth:1,stepdown:.4,safeZ:5,feed:100,plunge:30,spindle:3000});
  assert.equal(result.passCount,3);
  assert.match(result.code,/G00 Z5\.000\nG00 X20\.000 Y0\.000\nG01 Z-0\.400 F30\.000/);
  assert.match(result.code,/G01 Z-1\.000 F30\.000/);
  const parsed=parseGcode(result.code); assert.equal(parsed.stopped,false); assert.ok(parsed.segments.length>0);
});
test('缺少必要加工條件時不產出程式', () => {
  assert.throws(()=>core.generate([core.line(0,0,1,1)],{depth:1,stepdown:0,safeZ:2,feed:100,plunge:20,spindle:1000}));
  assert.throws(()=>core.generate([], {depth:1,stepdown:1,safeZ:2,feed:100,plunge:20,spindle:1000}));
});
