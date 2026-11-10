const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const selector = require('../selector-core.js');
const root = path.resolve(__dirname, '../../..');
const aceData = vm.runInNewContext(fs.readFileSync(path.join(root, 'Products/AceSpotDrill/product-dataV2.0.js'), 'utf8') + '; PRODUCT_PAGE_DATA');
const aceGeometry = require(path.join(root, 'CuttingData/AceSpotDrill/chamfer-geometry.js'));
// 正式篩選器只讀正式產品資料；來源缺漏要直接失敗，不回退到本機樣板。
const ncData = require(path.join(root, 'CuttingData/NCSpotDrill/data.js'));
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

const microContract = JSON.parse(fs.readFileSync(path.join(root, 'CuttingData/MicroSpotDrill/filter-contract.json'), 'utf8'));
const microRecords = selector.buildMicroCandidates(microContract);
const microFilter = input => selector.filterCandidates(microRecords, input);

test('Micro stainless 0.5 mm / 90-degree matches the two actual NC2032 insert geometries', () => {
  const matches = microFilter({ material: 'stainless', angle: 90, diameter: .5 });
  assert.deepEqual(matches.map(item => [item.selection.insert, item.selection.grade]), [
    ['X060A90W010R', 'NC2032'], ['X060A90W020R', 'NC2032']
  ]);
  assert.ok(matches.every(item => item.productId === 'micro' && item.cuttingAvailable === true));
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
  assert.ok(microRecords.every(item => item.cuttingAvailable === true));
});

const allRecords = [...records, ...microRecords];
test('no-match explanation for stainless 90-degree / 35 mm reports the actual 32 mm maximum', () => {
  const explanation = selector.explainNoMatch(allRecords, { material: 'stainless', angle: 90, diameter: 35 });
  assert.equal(explanation.reason, 'diameter-too-large');
  assert.equal(explanation.diameter, 35);
  assert.equal(explanation.maxDiameter, 32);
  assert.equal(explanation.minDiameter, .1);
  assert.deepEqual(explanation.ranges, [{ minDiameter: .1, maxDiameter: 32, minDiameterInclusive: true, maxDiameterInclusive: true }]);
});

test('no-match upper limit is restricted to the chosen stainless 60-degree combinations', () => {
  const explanation = selector.explainNoMatch(allRecords, { material: 'stainless', angle: 60, diameter: 35 });
  assert.equal(explanation.reason, 'diameter-too-large');
  assert.ok(Math.abs(explanation.maxDiameter - 18.198080484857) < 1e-12);
  assert.equal(explanation.minDiameter, 1);
  assert.equal(selector.explainNoMatch(allRecords, { material: 'stainless', angle: 60, diameter: 5 }), null);
});

test('a positive diameter below the smallest matching Micro insert reports too small', () => {
  const explanation = selector.explainNoMatch(allRecords, { material: 'stainless', angle: 90, diameter: .05 });
  assert.equal(explanation.reason, 'diameter-too-small');
  assert.equal(explanation.minDiameter, .1);
});

test('a hole diameter inside a genuine interval gap is not advertised as available', () => {
  const fixture = [
    { materialId: 'stainless', angle: 90, minDiameter: 1, maxDiameter: 2 },
    { materialId: 'stainless', angle: 90, minDiameter: 3, maxDiameter: 4 },
    { materialId: 'carbonLow', angle: 60, minDiameter: .1, maxDiameter: 50 }
  ];
  const explanation = selector.explainNoMatch(fixture, { material: 'stainless', angle: 90, diameter: 2.5 });
  assert.equal(explanation.reason, 'diameter-gap');
  assert.deepEqual(explanation.ranges.map(range => [range.minDiameter, range.maxDiameter]), [[1, 2], [3, 4]]);
  assert.equal(explanation.maxDiameter, 4);
});

test('unavailable material, angle and material-angle combination have separate reasons', () => {
  const fixture = [
    { materialId: 'stainless', angle: 90, minDiameter: 1, maxDiameter: 2 },
    { materialId: 'carbonLow', angle: 60, minDiameter: 1, maxDiameter: 4 }
  ];
  assert.equal(selector.explainNoMatch(fixture, { material: 'titanium', diameter: 3 }).reason, 'material-unavailable');
  assert.deepEqual(selector.explainNoMatch(fixture, { material: 'stainless', angle: 120 }), { reason: 'angle-unavailable', availableAngles: [90] });
  assert.deepEqual(selector.explainNoMatch(fixture, { material: 'stainless', angle: 60 }), { reason: 'material-angle-unavailable', availableAngles: [90] });
});

test('exclusive ACE lower boundary remains exclusive in the explanation', () => {
  const ace = records.find(item => item.productId === 'ace' && item.selection.size === 'SI06' && item.angle === 120 && item.materialId === 'stainless');
  const explanation = selector.explainNoMatch([ace], { diameter: ace.minDiameter });
  assert.equal(explanation.reason, 'boundary-invalid');
  assert.equal(explanation.ranges[0].minDiameterInclusive, false);
  assert.equal(selector.explainNoMatch([ace], { diameter: ace.minDiameter + .001 }), null);
});

test('range merging preserves open minima and excludes a shared point missing from both intervals', () => {
  const fixture = [
    { materialId: 'stainless', angle: 90, minDiameter: 1, maxDiameter: 2, minDiameterInclusive: false, maxDiameterInclusive: false },
    { materialId: 'stainless', angle: 90, minDiameter: 2, maxDiameter: 4, minDiameterInclusive: false }
  ];
  const sharedPoint = selector.explainNoMatch(fixture, { diameter: 2 });
  assert.equal(sharedPoint.reason, 'boundary-invalid');
  assert.equal(sharedPoint.ranges.length, 2);
  assert.equal(sharedPoint.ranges[0].minDiameterInclusive, false);
  const overlap = selector.explainNoMatch([...fixture, { materialId: 'stainless', angle: 90, minDiameter: 1.5, maxDiameter: 3 }], { diameter: 1 });
  assert.equal(overlap.ranges.length, 1);
  assert.equal(overlap.ranges[0].minDiameterInclusive, false);
  assert.equal(overlap.maxDiameter, 4);
});

test('valid matches and unrestricted filters return null while invalid inputs stay explicit', () => {
  assert.equal(selector.explainNoMatch(allRecords, {}), null);
  assert.equal(selector.explainNoMatch(allRecords, { material: 'stainless', angle: 90, diameter: .5 }), null);
  assert.deepEqual(selector.explainNoMatch(allRecords, { diameter: 'abc' }), { reason: 'invalid-input', field: 'diameter' });
  assert.deepEqual(selector.explainNoMatch(allRecords, { angle: -1 }), { reason: 'invalid-input', field: 'angle' });
  assert.deepEqual(selector.explainNoMatch(allRecords, { material: true }), { reason: 'invalid-input', field: 'material' });
});

test('formal finder and Micro entry use deployable local sources without prototype dependencies', () => {
  const finderDirectory = path.join(root, 'Machining/Spotting');
  const microDirectory = path.join(root, 'CuttingData/MicroSpotDrill');
  const finderHTML = fs.readFileSync(path.join(finderDirectory, 'index.html'), 'utf8');
  const finderApp = fs.readFileSync(path.join(finderDirectory, 'app.js'), 'utf8');
  const microHTML = fs.readFileSync(path.join(microDirectory, 'index.html'), 'utf8');
  const microApp = fs.readFileSync(path.join(microDirectory, 'app.js'), 'utf8');
  const forbiddenPath = /(?:^|[\\/])(?:測試資料|%E6%B8%AC%E8%A9%A6%E8%B3%87%E6%96%99|micro-spot-plan|micro-spot-workbench|spotting-finder)(?:[\\/]|$)/i;
  // 只檢查實際資源／導覽字串，不把程式註解中的搬移說明當成依賴。
  const pathsIn = source => [
    ...[...source.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/g)].map(match => match[1]),
    ...[...source.matchAll(/\b(?:href|src)\s*:\s*["']([^"']+)["']/g)].map(match => match[1]),
    ...[...source.matchAll(/\b(?:fetch|new URL)\s*\(\s*["'`]([^"'`]+)["'`]/g)].map(match => match[1])
  ];
  for (const [name, source] of [['finder HTML', finderHTML], ['finder app', finderApp], ['Micro HTML', microHTML], ['Micro app', microApp]]) {
    for (const resource of pathsIn(source)) assert.doesNotMatch(resource, forbiddenPath, `${name}: ${resource}`);
  }
  const inspectJSON = value => {
    if (typeof value === 'string') assert.doesNotMatch(value, forbiddenPath);
    else if (Array.isArray(value)) value.forEach(inspectJSON);
    else if (value && typeof value === 'object') Object.values(value).forEach(inspectJSON);
  };
  inspectJSON(microContract);
  const localFile = (directory, resource) => {
    const pathname = decodeURIComponent(resource.split(/[?#]/, 1)[0]);
    const resolved = pathname.startsWith('/') ? path.join(root, pathname.slice(1)) : path.resolve(directory, pathname);
    const relative = path.relative(root, resolved);
    assert.ok(!relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), `resource leaves the site: ${resource}`);
    return resolved;
  };
  // 篩選器按鈕必須接到正式 Micro 計算器，而非規劃報告或不存在的入口。
  const microEntry = pathsIn(finderApp).find(resource => /(?:^|\/)CuttingData\/MicroSpotDrill\/index\.html(?:[?#]|$)/.test(resource));
  assert.ok(microEntry, 'finder exposes the formal Micro calculator entry');
  assert.equal(localFile(finderDirectory, microEntry), path.join(microDirectory, 'index.html'));
  assert.ok(fs.existsSync(localFile(finderDirectory, microEntry)));
  for (const [directory, html] of [[finderDirectory, finderHTML], [microDirectory, microHTML]]) {
    for (const resource of pathsIn(html).filter(value => !/^(?:https?:|data:|#)/i.test(value))) {
      assert.ok(fs.existsSync(localFile(directory, resource)), `missing local resource: ${resource}`);
    }
  }
  for (const [directory, source] of [[finderDirectory, finderApp], [microDirectory, microApp]]) {
    for (const resource of pathsIn(source).filter(value => !/^(?:https?:|data:|#)/i.test(value) && !value.includes('${'))) {
      assert.ok(fs.existsSync(localFile(directory, resource)), `missing app data or entry resource: ${resource}`);
    }
  }
  const catalogLinks = pathsIn(microHTML).filter(resource => /\.pdf(?:[?#]|$)/i.test(resource) && !/^https?:/i.test(resource));
  assert.ok(catalogLinks.length > 0, 'Micro provides an on-site catalog source');
  for (const resource of catalogLinks) {
    const bytes = fs.readFileSync(localFile(microDirectory, resource));
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-', `invalid Micro source PDF: ${resource}`);
  }
});
