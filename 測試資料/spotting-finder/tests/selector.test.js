const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const selector = require('../selector-core.js');
const root = path.resolve(__dirname, '../../..');
const aceData = vm.runInNewContext(fs.readFileSync(path.join(root, 'Products/AceSpotDrill/product-dataV2.0.js'), 'utf8') + '; PRODUCT_PAGE_DATA');
const aceGeometry = require(path.join(root, 'CuttingData/AceSpotDrill/chamfer-geometry.js'));
const ncPath = path.join(root, 'CuttingData/NCSpotDrill/data.js');
const ncData = require(fs.existsSync(ncPath) ? ncPath : path.join(root, '測試資料/nc-spot-workbench/data.js'));
const records = selector.buildCandidates({ aceData, aceGeometry, ncData });
const filter = input => selector.filterCandidates(records, input);

test('empty filters preserve all real candidate combinations', () => {
  assert.equal(records.filter(item => item.productId === 'ace').length, 6 * 4 * 7);
  assert.ok(records.some(item => item.productId === 'nc'));
  assert.deepEqual(filter({}), records);
  assert.deepEqual(filter({ material: 'all', angle: '', diameter: null }), records);
  assert.equal(new Set(records.map(item => item.id)).size, records.length);
});

test('ACE SI06 60-degree boundary respects Tmax rather than the nominal 5.5 mm maximum', () => {
  const si06 = input => filter({ material: 'carbonLow', angle: '60', diameter: input }).filter(item => item.selection.size === 'SI06');
  assert.equal(si06(5.1384).length, 1);
  assert.equal(si06(5.1385).length, 0);
  assert.equal(si06(5.5).length, 0);
  assert.equal(filter({ material: 'carbonLow', angle: '90', diameter: 5.5 }).filter(item => item.selection.size === 'SI06').length, 1);
});

test('ACE geometric tip-plane lower limit is not a valid zero-depth hole', () => {
  const row = records.find(item => item.productId === 'ace' && item.selection.size === 'SI06' && item.angle === 120 && item.materialId === 'carbonLow');
  assert.equal(row.minDiameterInclusive, false);
  assert.equal(selector.filterCandidates([row], { diameter: row.minDiameter }).length, 0);
  assert.equal(selector.filterCandidates([row], { diameter: row.minDiameter + .001 }).length, 1);
});

test('material, angle and diameter must match the same assembly record', () => {
  const fixture = [
    { materialId: 'stainless', angle: 90, minDiameter: 1, maxDiameter: 20 },
    { materialId: 'carbonLow', angle: 60, minDiameter: 2, maxDiameter: 5 }
  ];
  assert.equal(selector.filterCandidates(fixture, { material: 'stainless', angle: 60, diameter: 3 }).length, 0);
  assert.equal(selector.filterCandidates(fixture, { material: 'carbonLow', angle: 60, diameter: 8 }).length, 0);
});

test('shared NC CT2T inserts retain angle-specific assembly diameter limits', () => {
  assert.ok(filter({ material: 'carbonHigh', angle: 120, diameter: 17 }).some(item => item.selection.series === 'nc120'));
  assert.equal(filter({ material: 'carbonHigh', angle: 120, diameter: 17.1 }).filter(item => item.productId === 'nc').length, 0);
  assert.ok(filter({ material: 'carbonHigh', angle: 142, diameter: 18.5 }).some(item => item.selection.series === 'nc142'));
});

test('P60 material restriction and CT reference availability remain separate', () => {
  assert.equal(filter({ material: 'stainless', angle: 60, diameter: 3 }).filter(item => item.selection.series === 'p60').length, 0);
  const low = filter({ material: 'carbonLow', angle: 60, diameter: 5 }).find(item => item.selection.series === 'p60');
  const high = filter({ material: 'highAlloy', angle: 60, diameter: 5 }).find(item => item.selection.series === 'p60');
  assert.ok(low);
  assert.equal(low.cuttingAvailable, true);
  assert.equal(high.cuttingAvailable, false);
  assert.equal(low.rank, 0);
  // 理論尖點深度4.3301大於實體Tmax3，不可把未知刀尖修正當成零而錯刪此型錄孔徑。
  assert.ok(5 / (2 * Math.tan(Math.PI / 6)) > 3);
});

test('NC prose-confirmed material use is not removed merely because rating is blank', () => {
  const rows = filter({ material: 'carbonHigh', angle: 90, diameter: 25 });
  const row = rows.find(item => item.selection.series === 'nc25');
  assert.ok(row);
  assert.equal(row.rank, 0);
});

test('a catalog material match can require manual cutting confirmation', () => {
  const rows = filter({ material: 'heatResistant', angle: 90, diameter: 5 });
  assert.ok(rows.some(item => item.productId === 'nc'));
  assert.ok(rows.filter(item => item.productId === 'nc').every(item => item.cuttingAvailable === false));
  assert.equal(rows.filter(item => item.productId === 'ace').length, 0);
});

test('unsupported and invalid filters cannot silently become all products', () => {
  for (const diameter of [0, -1, NaN, Infinity, 'abc', 'Infinity', true, [], {}]) {
    assert.equal(filter({ diameter }).length, 0);
  }
  assert.equal(filter({ material: 'unknown-material' }).length, 0);
  assert.equal(filter({ angle: 'invalid' }).length, 0);
  assert.equal(filter({ angle: 0 }).length, 0);
  assert.equal(filter({ material: 'titanium' }).filter(item => item.productId === 'ace').length, 0);
});

const microContract = JSON.parse(fs.readFileSync(path.join(root, '測試資料/micro-spot-plan/filter-contract.json'), 'utf8'));
const microRecords = selector.buildMicroCandidates(microContract);
const microFilter = input => selector.filterCandidates(microRecords, input);

test('Micro stainless 0.5 mm / 90-degree matches the two actual NC2032 insert geometries', () => {
  const matches = microFilter({ material: 'stainless', angle: 90, diameter: .5 });
  assert.deepEqual(matches.map(item => [item.selection.insert, item.selection.grade]), [
    ['X060A90W010R', 'NC2032'], ['X060A90W020R', 'NC2032']
  ]);
  assert.ok(matches.every(item => item.productId === 'micro' && item.cuttingAvailable === false));
});

test('Micro non-ferrous uses XP9001 only on the listed 90-degree variants', () => {
  assert.equal(microFilter({ material: 'nonFerrous', angle: 120, diameter: .5 }).length, 0);
  assert.equal(microFilter({ material: 'nonFerrous', angle: 142, diameter: .5 }).length, 0);
  const matches = microFilter({ material: 'nonFerrous', angle: 90, diameter: .5 });
  assert.equal(matches.length, 2);
  assert.ok(matches.every(item => item.selection.grade === 'XP9001'));
});

test('Micro alloy aliases preserve the 120-degree NC2032 restriction and unknown hardness condition', () => {
  for (const material of ['lowAlloy', 'highAlloy']) {
    const matches = microFilter({ material, angle: 120, diameter: .5 });
    assert.equal(matches.length, 1);
    assert.equal(matches[0].selection.grade, 'NC2032');
    assert.equal(matches[0].sourceMaterialId, 'alloySteel');
    assert.equal(matches[0].hardness.maxExclusive, 40);
    assert.equal(matches[0].hardness.unknownHardnessStatus, 'conditional-match');
  }
  const hardened = microFilter({ material: 'hardened', angle: 90, diameter: .5 });
  assert.equal(hardened.length, 2);
  assert.ok(hardened.every(item => item.selection.grade === 'NC2035' && item.hardness.maxExclusive === 50));
});

test('Micro uses inclusive catalog nominal 2.53 mm boundary without replacing it with a sharp-point formula', () => {
  assert.equal(microFilter({ material: 'stainless', angle: 120, diameter: 2.53 }).length, 1);
  assert.equal(microFilter({ material: 'stainless', angle: 120, diameter: 2.5301 }).length, 0);
  assert.equal(microFilter({ material: 'stainless', angle: 120, diameter: .1 }).length, 1);
  assert.equal(microFilter({ material: 'stainless', angle: 120, diameter: .0999 }).length, 0);
});

test('Micro catalog joins contain exactly four geometries and eight real insert/grade variants', () => {
  assert.deepEqual([...new Set(microRecords.map(item => item.selection.insert))].sort(), [
    'X060A120W010R', 'X060A142W010R', 'X060A90W010R', 'X060A90W020R'
  ]);
  assert.deepEqual([...new Set(microRecords.map(item => `${item.selection.insert}/${item.selection.grade}`))].sort(), [
    'X060A120W010R/NC2032', 'X060A142W010R/NC2032',
    'X060A90W010R/NC2032', 'X060A90W010R/NC2035', 'X060A90W010R/XP9001',
    'X060A90W020R/NC2032', 'X060A90W020R/NC2035', 'X060A90W020R/XP9001'
  ]);
  assert.equal(new Set(microRecords.map(item => item.id)).size, microRecords.length);
  assert.equal(microFilter({ material: 'titanium', diameter: .5 }).length, 0);
  assert.equal(microFilter({ angle: 60, diameter: .5 }).length, 0);
  assert.ok(microRecords.every(item => item.cuttingAvailable === false));
});
