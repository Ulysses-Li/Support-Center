const test=require('node:test');
const assert=require('node:assert/strict');
const font=require('../singleline-latin-extra.js');
const core=require('../core.js');
const parser=require('../../gcode-viewer/parser.js');

const fontIds=['ems-tech','ems-hand','ems-swiss','ems-capitol','ems-league','ems-neato'];

test('所有字型的全部英數及可列印 ASCII 均有非零的開放筆畫',()=>{
  for(const id of fontIds) {
    const space=font.getGlyph(id,' ',10);
    assert.deepEqual(space.paths,[]);assert.ok(space.advance>0);
    for(let code=33;code<=126;code++) {
      const character=String.fromCharCode(code),glyph=font.getGlyph(id,character,10);
      assert.ok(glyph,`${id} missing ${character}`);assert.ok(glyph.advance>0);
      assert.ok(glyph.paths.length>0,`${id} empty ${character}`);
      const segments=new Set();
      for(const path of glyph.paths) {
        assert.equal(path.closed,false);assert.ok(path.points.length>=2);
        for(let index=1;index<path.points.length;index++) {
          const point=path.points[index], previous=path.points[index-1];
          assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
          assert.ok(point.x!==previous.x || point.y!==previous.y,`${id} ${character} contains a zero-length segment`);
          // 同一字元內避免完全相同或反向的線段，減少不必要的重複雕刻。
          const key=[`${point.x},${point.y}`,`${previous.x},${previous.y}`].sort().join('|');
          assert.ok(!segments.has(key),`${id} ${character} contains a repeated segment`);
          segments.add(key);
        }
      }
    }
  }
});
test('字型風格具有不同幾何，未知字元與字型不默默替代',()=>{
  assert.notDeepEqual(font.getGlyph('ems-tech','A').paths,font.getGlyph('ems-hand','A').paths);
  const signatures=fontIds.map(id=>JSON.stringify(['A','a','2'].map(char=>font.getGlyph(id,char).paths)));
  assert.equal(new Set(signatures).size,fontIds.length);
  assert.equal(font.getGlyph('ems-tech','你'),null);
  assert.equal(font.getGlyph('missing','A'),null);
  assert.throws(()=>font.getGlyph('ems-tech','A',0),/高度/);
});
test('字形筆畫可用既有 G-code 產生器和檢視器處理',()=>{
  for(const id of fontIds){
    const glyph=font.getGlyph(id,'a',50);
    const code=core.generate(glyph.paths,{depth:.2,stepdown:.2,safeZ:5,feed:100,plunge:30,spindle:1000}).code;
    const result=parser.parse(code);
    assert.equal(result.stopped,false);
    assert.ok(result.segments.length>0);
  }
});
