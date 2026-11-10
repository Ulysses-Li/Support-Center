const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core.js');
const data = require('../data.json');
const base = { material:'carbonSteel', angle:90, diameter:.5, hardness:20, variant:'01X0082', holder:'00-99619-X060-06', rpm:8000, feedPerRev:.002 };
const find = criteria => core.findCandidates(data, criteria);
const calculate = changes => core.calculate(data, {...base, ...changes});
const ids = criteria => [...new Set(find(criteria).map(candidate => candidate.insert.id))];

test('90-degree nominal diameter boundaries preserve the actual W010/W020 overlap', () => {
  assert.deepEqual(ids({material:'stainless',angle:90,diameter:.15}), ['X060A90W010R']);
  assert.deepEqual(ids({material:'stainless',angle:90,diameter:.2}), ['X060A90W010R','X060A90W020R']);
  assert.deepEqual(ids({material:'stainless',angle:90,diameter:1.10001}), ['X060A90W020R']);
  assert.deepEqual(ids({material:'stainless',angle:90,diameter:2.2}), ['X060A90W020R']);
  assert.equal(find({material:'stainless',angle:90,diameter:2.20001}).length, 0);
});

test('120 and 142 degrees retain catalog upper limits without a straight-tip depth approximation', () => {
  assert.equal(find({material:'stainless',angle:120,diameter:2.53}).length, 1);
  assert.equal(find({material:'stainless',angle:120,diameter:2.53001}).length, 0);
  assert.equal(find({material:'stainless',angle:142,diameter:2.42}).length, 1);
  assert.equal(find({material:'stainless',angle:142,diameter:2.42001}).length, 0);
  assert.equal(find({material:'stainless',angle:90,diameter:.09999}).length, 0);
});

test('non-ferrous and hardened steel do not borrow feed values or grades from 90-degree inserts', () => {
  for (const material of ['nonFerrous','hardenedSteel']) for (const angle of [120,142]) assert.equal(find({material,angle,diameter:.5}).length, 0);
  assert.deepEqual([...new Set(find({material:'nonFerrous',angle:90,diameter:.5}).map(c=>c.variant.gradeId))], ['XP9001']);
  assert.deepEqual([...new Set(find({material:'hardenedSteel',angle:90,diameter:.5}).map(c=>c.variant.gradeId))], ['NC2035']);
  assert.deepEqual([...new Set(find({material:'alloySteel',angle:120,diameter:.5}).map(c=>c.variant.gradeId))], ['NC2032']);
});

test('NC2032 steel hardness is strictly below 40, including stainless, while cast iron has no steel-hardness transfer', () => {
  for (const material of ['carbonSteel','alloySteel','stainless']) {
    assert.ok(find({material,angle:120,diameter:.5,hardness:39.9}).length);
    assert.equal(find({material,angle:120,diameter:.5,hardness:40}).length, 0);
  }
  assert.ok(find({material:'castIron',angle:120,diameter:.5,hardness:56}).length);
});

test('NC2035 uses the conservative below-50 boundary and unknown steel hardness remains conditional', () => {
  assert.ok(find({material:'hardenedSteel',angle:90,diameter:.5,hardness:49.9}).length);
  for (const hardness of [50,56]) assert.equal(find({material:'hardenedSteel',angle:90,diameter:.5,hardness}).length, 0);
  const result = calculate({hardness:''});
  assert.equal(result.status,'conditional'); assert.equal(result.cuttingValid,true);
  assert.equal(result.rpm,8000); assert.equal(result.feedRate,16); assert.equal(result.canCopy,false);
  assert.match(result.conditions.join(' '),/below HRC 40/);
});

test('f is per revolution; indexable edge count is not a multiplier and changing diameter leaves S and f intact', () => {
  const result = calculate({});
  assert.equal(result.valid,true); assert.equal(result.feedRate,16);
  const other = calculate({diameter:.8});
  assert.equal(other.rpm,8000); assert.equal(other.feedPerRev,.002); assert.equal(other.feedRate,16);
  const max = calculate({material:'nonFerrous',variant:'01X0209',diameter:1.5,hardness:'',rpm:40000,feedPerRev:.020});
  assert.equal(max.feedRate,800); assert.equal(max.valid,true);
  assert.equal(Object.hasOwn(max,'z'),false); assert.equal(Object.hasOwn(max,'depth'),false);
});

test('feed ranges are material- and geometry-specific and out-of-range values clear output', () => {
  assert.deepEqual(calculate({material:'stainless'}).feedRange,[.002,.008]);
  assert.equal(calculate({material:'stainless',feedPerRev:.009}).canCopy,false);
  assert.equal(calculate({feedPerRev:.015}).feedRate,null);
  const w020 = calculate({material:'stainless',variant:'01X0207',diameter:1.5,feedPerRev:.010});
  assert.equal(w020.canCopy,true); assert.equal(w020.feedRate,80);
});

test('machine limit must intersect catalog S; no automatic 8000-rpm setting for a 6000-rpm machine', () => {
  const low = calculate({machineMaxRpm:6000});
  assert.equal(low.spindleRange,null); assert.equal(low.rpm,null); assert.equal(low.canCopy,false);
  assert.match(low.errors.join(' '),/no supported speed range/);
  assert.deepEqual(calculate({machineMaxRpm:10000}).spindleRange,[8000,10000]);
  assert.equal(calculate({machineMaxRpm:10000,rpm:10001}).feedRate,null);
  assert.equal(calculate({rpm:7999}).canCopy,false); assert.equal(calculate({rpm:40001}).canCopy,false);
});

test('XL is allowed only for confirmed aluminum or aluminum alloy; other holders remain available', () => {
  for (const nonFerrousType of ['', 'copper','brass','plastic','acrylic']) {
    const result = calculate({material:'nonFerrous',variant:'01X0220',hardness:'',nonFerrousType,holder:'00-99619-X060-06XL'});
    assert.equal(result.canCopy,false); assert.equal(result.availableHolders.length,4);
    assert.match(result.fieldErrors.holder,/only for aluminum/);
  }
  for (const nonFerrousType of ['aluminum','aluminumAlloy']) {
    const result = calculate({material:'nonFerrous',variant:'01X0220',hardness:'',nonFerrousType,holder:'00-99619-X060-06XL'});
    assert.equal(result.canCopy,true); assert.equal(result.availableHolders.length,5);
  }
  assert.equal(calculate({nonFerrousType:'aluminum',holder:'00-99619-X060-06XL'}).canCopy,false);
});

test('Wmin is a conditional nominal edge and is never turned into a verified zero-depth CNC result', () => {
  const result = calculate({diameter:.1});
  assert.equal(result.status,'conditional'); assert.equal(result.canCopy,false);
  assert.match(result.conditions.join(' '),/positive cutting depth has not been verified/);
  assert.equal(result.feedRate,16);
});

test('empty fields, invalid numbers, unknown SKU and mismatched selections are not silently replaced', () => {
  const empty = core.calculate(data,{});
  assert.equal(empty.status,'empty'); assert.equal(empty.rpm,null); assert.equal(empty.selected,null);
  for (const diameter of [0,-1,'NaN','Infinity','<img src=x>']) assert.equal(calculate({diameter}).canCopy,false);
  for (const value of ['NaN','Infinity',0,-1]) {
    assert.equal(calculate({rpm:value}).feedRate,null);
    assert.equal(calculate({feedPerRev:value}).feedRate,null);
  }
  assert.equal(calculate({variant:'not-a-code'}).selected,null);
  assert.equal(calculate({angle:120,variant:'01X0082'}).selected,null);
  assert.equal(calculate({material:'unknown'}).selected,null);
  assert.equal(calculate({holder:'unknown'}).holder,null);
  assert.equal(calculate({hardness:-1}).canCopy,false);
});

test('no match reports the constrained diameter maximum rather than another angle range', () => {
  const result = calculate({material:'stainless',angle:90,diameter:2.3});
  assert.equal(result.status,'no-match'); assert.equal(result.feedRate,null);
  assert.match(result.errors.join(' '),/maximum for this material and angle is 2.2 mm/);
  assert.equal(calculate({material:'nonFerrous',angle:120}).status,'no-match');
});

test('nominal depth uses the short-flat Wmin and nominal face angle, with an explicit model basis', () => {
  const result = calculate({});
  assert.equal(result.canCopy,true);
  assert.ok(Math.abs(result.geometry.nominalDepth - .2) < 1e-12);
  assert.ok(Math.abs(result.geometry.depth - .2) < 1e-12);
  assert.ok(Math.abs(result.geometry.z + .2) < 1e-12);
  assert.match(result.geometryBasis,/short-flat insert tip/);
  assert.match(result.geometryBasis,/Re is not modeled/);
  assert.match(result.geometryBasis,/not a manufacturer-verified Z formula/);
  assert.equal(result.geometry.mode,'nominal');
});

test('all 4 nominal geometries calculate their own face slope and respect floating-point endpoint noise', () => {
  const cases = [
    ['X060A90W010R',.5,.2], ['X060A90W020R',1,.4],
    ['X060A120W010R',1,.9/(2*Math.tan(Math.PI/3))],
    ['X060A142W010R',1,.9/(2*Math.tan(71*Math.PI/180))]
  ];
  for (const [insert,diameter,expected] of cases) {
    const result=core.calculateGeometry(data,{insert,diameter});
    assert.equal(result.valid,true);
    assert.ok(Math.abs(result.depth-expected)<1e-12);
    assert.ok(Math.abs(result.z+expected)<1e-12);
  }
  // tan(45°) 的浮點誤差不可使型錄 0.5 / 1.0 mm 端點誤判超深。
  assert.equal(core.calculateGeometry(data,{insert:'X060A90W010R',diameter:1.1}).valid,true);
  assert.equal(core.calculateGeometry(data,{insert:'X060A90W020R',diameter:2.2}).valid,true);
});

test('120-degree catalog endpoint keeps the raw estimate rather than clamping it to Tmax or returning an effective Z', () => {
  const result=core.calculateGeometry(data,{insert:'X060A120W010R',diameter:2.53});
  assert.equal(result.status,'nominal-only'); assert.equal(result.valid,false);
  assert.equal(result.roundingMismatch,true); assert.equal(result.withinDepthLimit,false);
  assert.ok(Math.abs(result.nominalDepth-.7014805770653954)<1e-12);
  assert.equal(result.computedDepth,result.nominalDepth); assert.equal(result.computedZ,-result.nominalDepth);
  assert.equal(result.depth,null); assert.equal(result.z,null);
  const setup=calculate({angle:120,diameter:2.53,variant:'01X0222'});
  assert.equal(setup.cuttingValid,true); assert.equal(setup.feedRate,16);
  assert.equal(setup.canCopy,false); assert.equal(setup.status,'conditional');
});

test('same-assembly measured reference shifts the datum but retains the selected nominal slope', () => {
  const geometry=core.calculateGeometry(data,{insert:'X060A90W010R',diameter:.9,geometryMode:'measured',referenceDiameter:.5,referenceDepth:.18});
  assert.equal(geometry.valid,true);
  assert.ok(Math.abs(geometry.depth-.38)<1e-12);
  assert.ok(Math.abs(geometry.z+.38)<1e-12);
  assert.ok(Math.abs(geometry.tipOffset-.02)<1e-12);
  const endpoint=core.calculateGeometry(data,{insert:'X060A120W010R',diameter:2.53,geometryMode:'measured',referenceDiameter:2.53,referenceDepth:.7});
  assert.equal(endpoint.valid,true); assert.equal(endpoint.depth,.7); assert.equal(endpoint.z,-.7);
  assert.equal(endpoint.roundingMismatch,false);
  const setup=calculate({geometryMode:'measured',referenceDiameter:.5,referenceDepth:.18});
  assert.equal(setup.canCopy,true); assert.match(setup.geometryBasis,/Same-assembly measured/);
});

test('measured references must belong to the insert diameter/depth limits and must not generate a zero/negative or over-Tmax target', () => {
  const baseGeometry={insert:'X060A90W010R',diameter:1,geometryMode:'measured',referenceDiameter:.5,referenceDepth:.2};
  for (const changes of [
    {referenceDiameter:.09},{referenceDiameter:1.10001},{referenceDepth:0},{referenceDepth:.50001},
    {referenceDepth:'NaN'},{referenceDiameter:'Infinity'},
    {diameter:1.1,referenceDepth:.3}, // target .6 > Tmax .5
    {diameter:.2,referenceDiameter:.9,referenceDepth:.1} // target negative
  ]) {
    const geometry=core.calculateGeometry(data,{...baseGeometry,...changes});
    assert.equal(geometry.valid,false); assert.equal(geometry.depth,null); assert.equal(geometry.z,null);
    assert.ok(geometry.errors.length);
  }
  const setup=calculate({diameter:1.1,geometryMode:'measured',referenceDiameter:.5,referenceDepth:.3});
  assert.equal(setup.canCopy,false); assert.equal(setup.status,'invalid');
  assert.equal(setup.cuttingValid,true); assert.equal(setup.rpm,8000); assert.equal(setup.feedRate,16);
});

test('Wmin remains a conditional edge with zero nominal estimate and no usable target', () => {
  const geometry=core.calculateGeometry(data,{insert:'X060A90W010R',diameter:.1});
  assert.equal(geometry.status,'conditional'); assert.equal(geometry.valid,false);
  assert.equal(geometry.nominalDepth,0); assert.equal(geometry.computedZ,0);
  assert.equal(geometry.depth,null); assert.equal(geometry.z,null);
  const measured=core.calculateGeometry(data,{insert:'X060A90W010R',diameter:.1,geometryMode:'measured',referenceDiameter:.5,referenceDepth:.3});
  assert.equal(measured.status,'conditional'); assert.equal(measured.valid,false);
});

test('incomplete or unknown geometry references preserve valid cutting values without enabling copy', () => {
  const incomplete=calculate({geometryMode:'measured',referenceDiameter:'',referenceDepth:''});
  assert.equal(incomplete.status,'empty'); assert.equal(incomplete.cuttingValid,true);
  assert.equal(incomplete.canCopy,false); assert.equal(incomplete.feedRate,16);
  assert.ok(incomplete.missingFields.includes('referenceDiameter'));
  for (const input of [{insert:'unknown',diameter:.5},{insert:'X060A90W010R',diameter:0},{insert:'X060A90W010R',diameter:.5,geometryMode:'unknown'},{variant:'01X0082',insert:'X060A120W010R',diameter:.5}]) {
    const geometry=core.calculateGeometry(data,input);
    assert.equal(geometry.valid,false); assert.equal(geometry.z,null);
  }
});

test('the UI can omit hardness confirmation while source limits and explicit known-hardness validation remain intact', () => {
  const result=calculate({material:'alloySteel',hardness:undefined,requireHardnessConfirmation:false});
  assert.equal(result.canCopy,true); assert.equal(result.valid,true); assert.equal(result.feedRate,16);
  assert.equal(result.selected.hardnessMax,40);
  assert.doesNotMatch(result.conditions.join(' '),/hardness|HRC/i);
  const candidates=core.findCandidates(data,{material:'alloySteel',angle:90,diameter:.5,requireHardnessConfirmation:false});
  assert.ok(candidates.length);
  assert.ok(candidates.every(candidate=>!candidate.conditions.some(text=>/hardness|HRC/i.test(text))));
  const unsupported=calculate({material:'nonFerrous',angle:120,hardness:undefined,requireHardnessConfirmation:false});
  assert.doesNotMatch(unsupported.errors.join(' '),/hardness|HRC/i);
  assert.equal(calculate({hardness:40,requireHardnessConfirmation:false}).canCopy,false);
});

test('a same-assembly measured Z is not effective until a valid compatible holder is identified', () => {
  const measured={material:'stainless',diameter:.5,variant:'01X0082',geometryMode:'measured',referenceDiameter:.5,referenceDepth:.2,requireHardnessConfirmation:false,hardness:undefined};
  const missing=calculate({...measured,holder:undefined});
  assert.equal(missing.geometry.valid,false); assert.equal(missing.geometry.status,'empty');
  assert.equal(missing.geometry.depth,null); assert.equal(missing.geometry.z,null);
  assert.equal(missing.geometry.computedDepth,.2); assert.equal(missing.geometry.computedZ,-.2);
  assert.ok(missing.geometry.missingFields.includes('holder'));
  assert.match(missing.geometry.conditions.join(' '),/valid compatible holder/);
  for (const holder of ['unknown','00-99619-X060-06XL']) {
    const invalid=calculate({...measured,holder});
    assert.equal(invalid.geometry.valid,false); assert.equal(invalid.geometry.status,'invalid');
    assert.equal(invalid.geometry.depth,null); assert.equal(invalid.geometry.z,null);
  }
  assert.equal(calculate({...measured}).geometry.valid,true);
  // 名義幾何不套用實測組裝確認門檻。
  assert.equal(calculate({...measured,geometryMode:'nominal',holder:undefined}).geometry.valid,true);
});
