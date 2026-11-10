const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core.js');
const data = require('../../i-center-plan/research-data.json');
const inserts = data.insert_inventory.items;
const base = {insertId:'I9MT08T1B0100-NC5074',holderId:'00-99616-IC08-10F',materialId:'P-carbon-lt03',rpm:6000,feed:.03,depth:2.21};
const calculate = changes => core.calculate(data,{...base,...changes});

test('all 51 inserts remain separate DIN forms and ANSI catalog families', () => {
  assert.equal(core.findInserts(data,{}).length,51);
  assert.equal(core.findInserts(data,{standard:'DIN'}).length,43);
  for(const [form,count] of [['A',3],['AB',20],['R',20]]) assert.equal(core.findInserts(data,{standard:'DIN',form}).length,count);
  const ansi=core.findInserts(data,{standard:'ANSI'});
  assert.equal(ansi.length,8);assert.ok(ansi.every(insert=>insert.family==='ANSI 60°'));
  assert.equal(core.findInserts(data,{standard:'unknown'}).length,0);
});

test('pilot diameter matches exact catalog d1 and retains the same-diameter IC choices', () => {
  const din=core.findInserts(data,{standard:'DIN',form:'AB',diameter:2});
  assert.deepEqual(din.map(insert=>insert.ic),['08','10','12']);
  assert.equal(core.findInserts(data,{standard:'DIN',form:'AB',diameter:2.00001}).length,0);
  assert.equal(core.findInserts(data,{standard:'ANSI',diameter:1.98})[0].size_designation,'#2');
  assert.equal(core.findInserts(data,{standard:'ANSI',diameter:5/64*25.4}).length,0);
  assert.equal(core.findInserts(data,{standard:'DIN',diameter:1.98}).length,0);
  for(const diameter of [0,-1,'NaN','Infinity','<script>'])assert.equal(core.findInserts(data,{diameter}).length,0);
});

test('holder matching uses IC and never just the shared pilot diameter', () => {
  const choices=core.findInserts(data,{standard:'DIN',form:'AB',diameter:2});
  for(const insert of choices){const holders=core.holdersFor(data,insert.id);assert.ok(holders.length);assert.ok(holders.every(holder=>holder.ic===insert.ic));}
  assert.equal(core.holdersFor(data,'unknown').length,0);
  const wrong=calculate({holderId:'00-99616-IC12-16F'});
  assert.equal(wrong.canCopy,false);assert.equal(wrong.holder,null);
});

test('the materials list is the 7 original cutting-table labels, not grade-specific approvals', () => {
  const materials=core.materials(data);
  assert.equal(materials.length,7);assert.equal(new Set(materials.map(item=>item.id)).size,7);
  assert.deepEqual(materials[0],{id:'P-carbon-lt03',label:'Carbon steel C<0.3%',iso:'P'});
  assert.ok(materials.some(item=>item.iso==='M'&&item.label==='Stainless steel'));
});

test('cutting values join the original confirmed IC/d1 column and preserve three-value sequences', () => {
  const joined=core.cuttingFor(data,base.insertId,base.materialId);
  assert.equal(joined.reasonCode,'available');assert.equal(joined.column.id,'small-1');
  assert.equal(joined.row.spindle_speed_rpm.min,2000);assert.equal(joined.row.spindle_speed_rpm.max,10000);
  assert.deepEqual(joined.row.feed_mm_per_rev.catalog_sequence,[.02,.03,.05]);
  assert.equal(joined.row.feed_mm_per_rev.recommended_value,null);
  assert.equal(joined.row, data.cutting_data.cutting_conditions.find(row=>row.id===joined.row.id));
});

test('IC10 d1 1.50 and all ANSI inserts retain unconfirmed cutting ranges without borrowing neighbors', () => {
  for(const insert of inserts.filter(insert=>insert.family==='ANSI 60°'||(insert.ic==='10'&&insert.dimensions.d1===1.5))){
    const cutting=core.cuttingFor(data,insert.id,base.materialId);
    assert.equal(cutting.row,null);assert.equal(cutting.column,null);assert.ok(cutting.reason);
  }
  assert.equal(core.cuttingFor(data,'unknown',base.materialId).row,null);
  assert.equal(core.cuttingFor(data,base.insertId,'unknown').row,null);
});

test('per-revolution feed conversion does not multiply two flutes and manual Z uses only entered positive depth', () => {
  const result=calculate({});assert.equal(result.canCopy,true);assert.equal(result.feedRate,180);
  assert.equal(result.depth,2.21);assert.equal(result.z,-2.21);assert.equal(result.valueBasis,'catalog-range');
  assert.match(result.depthBasis,/User-entered/);
  const other=calculate({depth:9});assert.equal(other.depth,9);assert.equal(other.z,-9);assert.equal(other.feedRate,180);
  assert.ok(other.warnings.some(text=>/exceeds the listed L3/.test(text)));
});

test('A+B stage applies the catalog 30 percent reduction at L2 while f remains unchanged', () => {
  const result=calculate({});assert.equal(result.stage.triggerDepth,2.21);assert.equal(result.stage.reached,true);
  assert.equal(result.stage.rpm,4200);assert.equal(result.stage.feed,.03);assert.equal(result.stage.feedRate,126);
  assert.equal(result.rpm,6000);assert.equal(result.feedRate,180);assert.equal(result.z,-2.21);
  assert.equal(calculate({depth:2.2}).stage.reached,false);
  assert.equal(calculate({insertId:'I9MT08T1R0100-NC5074'}).stage,null);
  assert.match(result.stage.note,/not automatically the final/);
});

test('unconfirmed cutting values allow explicit manual input but do not masquerade as catalog recommendations', () => {
  const result=calculate({insertId:'I9MT1003B0150-NC2057',holderId:core.holdersFor(data,'I9MT1003B0150-NC2057')[0].parts_no});
  assert.equal(result.cutting.row,null);assert.equal(result.spindleRange,null);assert.equal(result.feedRange,null);
  assert.equal(result.canCopy,true);assert.equal(result.valueBasis,'manual');assert.equal(result.feedRate,180);
  assert.ok(result.warnings.some(text=>/neighboring diameter is not substituted/.test(text)));
  const ansi=inserts.find(insert=>insert.family==='ANSI 60°');
  const custom=calculate({insertId:ansi.id,holderId:core.holdersFor(data,ansi.id)[0].parts_no});
  assert.equal(custom.canCopy,true);assert.equal(custom.valueBasis,'manual');assert.equal(custom.stage,null);
});

test('catalog-range deviations warn and retain user values while an explicit machine limit is enforced', () => {
  const outside=calculate({rpm:11000,feed:.06});
  assert.equal(outside.canCopy,true);assert.equal(outside.rpm,11000);assert.equal(outside.feed,.06);assert.equal(outside.valueBasis,'manual');
  assert.ok(outside.warnings.some(text=>/outside the listed/.test(text)));
  const capped=calculate({machineMaxRpm:5000});
  assert.equal(capped.canCopy,false);assert.equal(capped.rpm,null);assert.equal(capped.feedRate,null);
  assert.deepEqual(calculate({machineMaxRpm:8000}).machineCatalogRange,[2000,8000]);
  const belowCatalog=calculate({rpm:1000,machineMaxRpm:1500});
  assert.equal(belowCatalog.canCopy,true);assert.equal(belowCatalog.machineCatalogRange,null);assert.equal(belowCatalog.valueBasis,'manual');
  assert.ok(belowCatalog.warnings.some(text=>/does not overlap/.test(text)));
});

test('pre-balance reference speed is not used as an unlisted maximum safe holder speed', () => {
  const nonferrous=calculate({materialId:'N-nonferrous',rpm:15000});
  assert.equal(nonferrous.canCopy,true);assert.equal(nonferrous.rpm,15000);
  assert.ok(nonferrous.warnings.some(text=>/not a maximum safe speed/.test(text)));
});

test('missing and invalid values do not leave old usable outputs', () => {
  const empty=core.calculate(data,{});assert.equal(empty.canCopy,false);assert.equal(empty.status,'empty');assert.equal(empty.rpm,null);assert.equal(empty.z,null);
  for(const [field,values] of Object.entries({rpm:[0,-1,'Infinity','NaN'],feed:[0,-1,'Infinity'],depth:[0,-1,'NaN'],machineMaxRpm:[0,-1,'<script>']})) for(const value of values){
    const result=calculate({[field]:value});assert.equal(result.canCopy,false);assert.equal(result.feedRate,null);assert.equal(result.z,null);
  }
  for(const field of ['insertId','holderId','materialId']){const result=calculate({[field]:'unknown'});assert.equal(result.canCopy,false);assert.equal(result.feedRate,null);assert.equal(result.z,null);}
});

test('site recommendation uses the listed feed sequence median, not the min/max average or a factory best claim', () => {
  const input={insertId:'I9MT08T1B0200-NC5074',materialId:'P-carbon-lt03'};
  const cutting=core.cuttingFor(data,input.insertId,input.materialId);
  assert.deepEqual(cutting.row.feed_mm_per_rev.catalog_sequence,[.03,.05,.06]);
  const result=core.recommendation(data,input);
  assert.equal(result.valid,true);assert.equal(result.rpm,4800);assert.equal(result.feed,.05);
  assert.notEqual(result.feed,(.03+.06)/2);
  assert.match(result.reason,/Site median recommendation/);assert.doesNotMatch(result.reason,/best/i);
  assert.equal(cutting.row.feed_mm_per_rev.recommended_value,null);
});

test('median recommendation averages two listed feed values and intersects S with an explicit machine cap', () => {
  const input={insertId:base.insertId,materialId:'P-high-alloy'};
  const row=core.cuttingFor(data,input.insertId,input.materialId).row;
  assert.deepEqual(row.feed_mm_per_rev.catalog_sequence,[.01,.02]);
  const result=core.recommendation(data,input);
  assert.equal(result.valid,true);assert.equal(result.feed,.015);
  const capped=core.recommendation(data,{insertId:base.insertId,materialId:base.materialId,machineMaxRpm:5000});
  assert.equal(capped.valid,true);assert.equal(capped.rpm,3500);assert.equal(capped.feed,.03);
  assert.equal(core.recommendation(data,{insertId:base.insertId,materialId:base.materialId,machineMaxRpm:2000}).rpm,2000);
});

test('no confirmed cutting row or no machine overlap never produces a median recommendation', () => {
  for(const insert of inserts.filter(insert=>insert.family==='ANSI 60°'||(insert.ic==='10'&&insert.dimensions.d1===1.5))) {
    const result=core.recommendation(data,{insertId:insert.id,materialId:base.materialId});
    assert.equal(result.valid,false);assert.equal(result.rpm,null);assert.equal(result.feed,null);assert.ok(result.reason);
  }
  for(const machineMaxRpm of [0,-1,'NaN','Infinity',1000]) {
    const result=core.recommendation(data,{insertId:base.insertId,materialId:base.materialId,machineMaxRpm});
    assert.equal(result.valid,false);assert.equal(result.rpm,null);assert.equal(result.feed,null);
  }
});

test('missing sequence falls back to the listed endpoints and sequence sorting does not mutate source data', () => {
  const fixture=JSON.parse(JSON.stringify(data));
  const row=core.cuttingFor(fixture,base.insertId,base.materialId).row;
  delete row.feed_mm_per_rev.catalog_sequence;
  assert.equal(core.recommendation(fixture,{insertId:base.insertId,materialId:base.materialId}).feed,(.02+.05)/2);
  row.feed_mm_per_rev.catalog_sequence=[.05,.02,.03];
  assert.equal(core.recommendation(fixture,{insertId:base.insertId,materialId:base.materialId}).feed,.03);
  assert.deepEqual(row.feed_mm_per_rev.catalog_sequence,[.05,.02,.03]);
});
