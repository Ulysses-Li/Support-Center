/* 直接讀型錄研究 JSON，驗證孔徑缺口、夾持鏈與計算，避免假料號／假完成狀態。 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../core.js');
const research = path.join(__dirname, '..', 'data');
const read = name => JSON.parse(fs.readFileSync(path.join(research, `${name}.json`), 'utf8'));
const model = core.normalize(read('product-inventory'), read('clamping-data'), read('cutting-data'));
// 新規格獨立於PDF研究資料；原三參數模型保留，用來驗證未確認來源的舊行為。
const confirmedSpecs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'confirmed-specs.json'), 'utf8'));
const confirmedModel = core.normalize(read('product-inventory'), read('clamping-data'), read('cutting-data'), confirmedSpecs);
const base = { diameter: 8, depth: 12, material: 'Non-ferrous metal', clamping: 'purchase_holder', holderId: '00-99146-BT40H', condition: 'Regular cutting' };
const find = overrides => core.find(model, { ...base, ...overrides });
const bar = (result, id) => result.candidates.find(candidate => candidate.bar.id === id);

test('normalize preserves all 167 physical bars and eight part/grade variants without inventing SKUs', () => {
  assert.equal(model.bars.length, 167);
  assert.equal(new Set(model.bars.map(item => item.id)).size, 167);
  assert.equal(model.inserts.length, 8);
  assert.equal(model.insertGeometries.length, 5);
  assert.equal(model.materials.length, 6);
  assert.equal(model.cuttingRows.length, 10);
  assert.equal(model.holders.length, 6);
  assert.equal(model.adapters.length, 5);
  assert.ok(model.inserts.some(item => item.id === 'CCGT040102|NC9036'));
  assert.ok(!model.inserts.some(item => item.parts === 'CCGT030102' && item.grade === 'NC2033'));
  assert.ok(!model.inserts.some(item => item.parts === 'CCGH060204'));
  assert.equal(model.inserts.find(item => item.parts === 'CCGH0602U').re, null);
  assert.equal(model.bars.find(item => item.id === '00-99146-0800S').l, null);
});

test('incomplete first four answers allow browsing but never confirmed combinations', () => {
  const result = core.find(model, {});
  assert.equal(result.candidates.length, 167);
  assert.equal(result.criteria.complete, false);
  assert.deepEqual(result.criteria.missingFields, ['diameter', 'depth', 'material', 'clamping']);
  assert.equal(result.diagnosis.code, 'browse');
  assert.ok(result.candidates.every(item => item.status === 'review'));
});

test('diameter intervals keep real gaps and include both stated boundary endpoints', () => {
  const gap = find({ diameter: 25.7, depth: 10 });
  assert.equal(gap.candidates.length, 0);
  assert.equal(gap.diagnosis.code, 'diameter_gap');
  assert.deepEqual(gap.diagnosis.gap, [25.62, 25.87]);
  assert.ok(bar(find({ diameter: 25.62, depth: 10 }), '00-99146-2550S'));
  assert.ok(bar(find({ diameter: 25.87, depth: 10 }), '00-99146-26A'));
  assert.equal(find({ diameter: 3 }).diagnosis.code, 'below_minimum');
  assert.equal(find({ diameter: 51 }).diagnosis.code, 'above_maximum');
});

test('99121 gaps stay unfilled under the general clamping path', () => {
  const result = find({ diameter: 5.5, depth: 10, clamping: 'existing_general', generalType: 'collet', gripDiameter: 20 });
  assert.equal(result.candidates.length, 0);
  assert.equal(result.diagnosis.code, 'diameter_gap');
  assert.deepEqual(result.diagnosis.gap, [5.1, 5.9]);
});

test('depth uses each actual L1 and chooses shorter valid bars first', () => {
  const short = find();
  assert.equal(short.candidates[0].bar.id, '00-99146-0800S');
  assert.equal(short.candidates[0].bar.l1, 16);
  const deep = find({ depth: 20 });
  assert.equal(bar(deep, '00-99146-0800S'), undefined);
  const deepBar = bar(deep, '00-99151-0800W');
  assert.ok(deepBar);
  assert.equal(deepBar.bar.l1, 32);
  assert.equal(deepBar.adapter.id, '00-99151A-08');
  assert.equal(deepBar.depthStatus, 'confirmed');
  assert.equal(deepBar.status, 'review');
  const impossible = find({ depth: 500 });
  assert.equal(impossible.diagnosis.code, 'depth_exceeded');
  assert.equal(impossible.diagnosis.maximumL1, 32);
});

test('general holders restrict to straight bars and retain front-neck and 99121 mapping uncertainty', () => {
  const result = find({ clamping: 'existing_general', generalType: 'hydraulic', gripDiameter: 20 });
  assert.ok(result.candidates.length > 0);
  assert.ok(result.candidates.every(item => ['99101', '99121'].includes(item.bar.series)));
  assert.ok(result.candidates.every(item => item.depthStatus === 'review' && item.clampStatus === 'review'));
  assert.equal(bar(result, '00-99121-08').bar.shankD, null);
  const thirteen = find({ clamping: 'existing_general', generalType: 'side_lock', gripDiameter: 13 });
  assert.equal(bar(thirteen, '00-99101-08'), undefined);
  assert.equal(bar(thirteen, '00-99121-08').clampStatus, 'review');
  assert.ok(bar(thirteen, '00-99121-08').reviewNotes.some(note => note.includes('Ø20（Ø13）')));
});

test('99121 is the precision-first choice when both straight-bar series pass the same filters', () => {
  for (const diameter of [8, 17, 20.1]) {
    const result = core.find(confirmedModel, { ...base, diameter, depth: 15, clamping: 'existing_general', gripDiameter: 20 });
    assert.equal(result.candidates[0].bar.series, '99121');
    assert.equal(result.candidates[0].precisionPreferred, true);
    assert.equal(result.candidates[0].bar.division, 0.01);
    assert.equal(result.candidates.find(candidate => candidate.bar.series === '99101').bar.division, 0.03);
    assert.ok(result.candidates.some(candidate => candidate.bar.series === '99101' && !candidate.precisionPreferred));
    assert.ok(result.candidates.every(candidate => candidate.bar.minD <= diameter && diameter <= candidate.bar.maxD && candidate.bar.l1 >= 15));
    // 推薦不是完工公差或夾持的核准；前頸長與實際伸出仍為原有待確認狀態。
    assert.ok(result.candidates.every(candidate => candidate.status === 'review' && candidate.depthStatus === 'review' && candidate.clampStatus === 'review'));
  }
});

test('precision preference never adds an out-of-range series or changes quick-change ordering', () => {
  const only101 = core.find(confirmedModel, { ...base, diameter: 8.3, clamping: 'existing_general', gripDiameter: 20 });
  assert.deepEqual(only101.candidates.map(candidate => candidate.bar.series), ['99101']);
  assert.ok(only101.candidates.every(candidate => !candidate.precisionPreferred));
  const only121 = core.find(confirmedModel, { ...base, clamping: 'existing_general', gripDiameter: 16 });
  assert.deepEqual(only121.candidates.map(candidate => candidate.bar.series), ['99121']);
  assert.ok(only121.candidates.every(candidate => !candidate.precisionPreferred));
  const quick = find();
  assert.equal(quick.candidates[0].bar.id, '00-99146-0800S');
  assert.ok(quick.candidates.every(candidate => !candidate.precisionPreferred));
  const none = core.find(confirmedModel, { ...base, clamping: 'existing_general', gripDiameter: 50 });
  assert.equal(none.candidates.length, 0);
  assert.equal(none.diagnosis.code, 'shank_unavailable');
});

test('mixed-route browsing uses a stable precision priority without changing the candidate set', () => {
  const result = core.find(confirmedModel, { ...base, holderId: '', clamping: 'unknown' });
  assert.equal(result.candidates[0].bar.series, '99121');
  assert.deepEqual(new Set(result.candidates.map(candidate => candidate.bar.series)), new Set(['99101', '99121', '99146', '99151']));
  const preferred = result.candidates.filter(candidate => candidate.precisionPreferred);
  assert.ok(preferred.length > 0);
  assert.deepEqual(result.candidates.slice(0, preferred.length), preferred);
  const remainder = result.candidates.slice(preferred.length);
  assert.ok(remainder.every((candidate, index) => !index || remainder[index - 1].bar.l1 <= candidate.bar.l1));
});

test('general Ø13 retains only drawing-supported 99121 bars for review', () => {
  const result = find({ clamping: 'existing_general', generalType: 'side_lock', gripDiameter: 13 });
  assert.ok(result.candidates.length > 0);
  assert.ok(result.candidates.every(candidate => candidate.bar.series === '99121'));
  for (const candidate of result.candidates) {
    assert.equal(candidate.bar.shankD, null);
    assert.deepEqual(candidate.bar.shankOptions, [20, 13]);
    assert.equal(candidate.shankStatus, 'review');
    assert.equal(candidate.clampStatus, 'review');
    assert.equal(candidate.status, 'review');
    assert.ok(candidate.reviewNotes.some(note => note.includes('requested Ø13') && note.includes('per-part mapping is unconfirmed')));
  }
  // 移除圖面證據後，不可用程式內硬編的Ø13維持候選。
  const inventoryWithoutShankIssue = read('product-inventory');
  inventoryWithoutShankIssue.critical_source_issues = inventoryWithoutShankIssue.critical_source_issues.filter(issue => issue.id !== '99121_diagram_shank_mapping');
  const withoutEvidence = core.normalize(inventoryWithoutShankIssue, read('clamping-data'), read('cutting-data'));
  const unsupported = core.find(withoutEvidence, { ...base, clamping: 'existing_general', gripDiameter: 13 });
  assert.equal(unsupported.candidates.length, 0);
  assert.equal(unsupported.diagnosis.code, 'shank_unavailable');
});

test('general Ø20 separates confirmed 99101 shank dimensions from unconfirmed 99121 mapping', () => {
  const result = find({ clamping: 'existing_general', generalType: 'hydraulic', gripDiameter: 20 });
  const known = bar(result, '00-99101-08');
  const drawing = bar(result, '00-99121-08');
  assert.ok(known && drawing);
  assert.equal(known.shankStatus, 'confirmed');
  assert.equal(known.clampStatus, 'review');
  assert.equal(drawing.shankStatus, 'review');
  assert.equal(drawing.clampStatus, 'review');
  assert.ok(drawing.reviewNotes.some(note => note.includes('requested Ø20') && note.includes('per-part mapping is unconfirmed')));
});

test('unavailable general shanks explain the requested size without blaming a valid hole diameter', () => {
  const result = find({ clamping: 'existing_general', generalType: 'collet', gripDiameter: 50 });
  assert.equal(result.candidates.length, 0);
  assert.equal(result.diagnosis.code, 'shank_unavailable');
  assert.equal(result.diagnosis.requestedShankDiameter, 50);
  assert.deepEqual(result.diagnosis.availableShankDiameters, [13, 20]);
  assert.ok(result.diagnosis.message.includes('requested Ø50 mm'));
  assert.ok(!result.diagnosis.message.includes('target diameter falls in a gap'));
});

test('unselected general grip diameter permits browsing but leaves requirements and shank checks incomplete', () => {
  const result = find({ clamping: 'existing_general', generalType: 'collet' });
  assert.equal(result.criteria.complete, false);
  assert.equal(result.criteria.questionsAnswered, false);
  assert.deepEqual(result.criteria.missingFields, ['gripDiameter']);
  assert.equal(result.diagnosis.code, 'browse');
  assert.ok(bar(result, '00-99101-08'));
  assert.ok(bar(result, '00-99121-08'));
  assert.ok(result.candidates.every(candidate => candidate.shankStatus === 'unselected' && candidate.status === 'review'));
});

test('confirmed 99121 options preserve every physical part and all catalog dimensions', () => {
  assert.equal(confirmedModel.bars.length, 167);
  assert.deepEqual(confirmedModel.bars.map(item => item.id), model.bars.map(item => item.id));
  assert.equal(new Set(confirmedModel.bars.map(item => item.id)).size, 167);
  for (const confirmed of confirmedModel.bars) {
    const original = model.bars.find(item => item.id === confirmed.id);
    if (confirmed.series === '99121') {
      assert.equal(confirmed.shankD, null);
      assert.deepEqual(confirmed.shankOptions, [20, 16, 13]);
      assert.equal(confirmed.shankOptionsConfirmed, true);
      assert.deepEqual(confirmed.shankOptionsSource, confirmedSpecs.series['99121'].source);
      // 只改可選柄徑與其證據；不得從Ø16推算新料號、L或L1。
      assert.deepEqual({ ...confirmed, shankOptions: original.shankOptions, shankOptionsConfirmed: original.shankOptionsConfirmed, shankOptionsSource: original.shankOptionsSource }, original);
    } else assert.deepEqual(confirmed, original);
  }
  assert.deepEqual(confirmedModel.holders, model.holders);
  assert.deepEqual(confirmedModel.adapters, model.adapters);
  assert.deepEqual(confirmedModel.sourceInventory, model.sourceInventory);
});

test('confirmed 99121 Ø20 Ø16 Ø13 selections verify shank only and keep the assembly under review', () => {
  for (const gripDiameter of [20, 16, 13]) {
    const input = { ...base, clamping: 'existing_general', generalType: 'hydraulic', gripDiameter };
    const result = core.find(confirmedModel, input);
    const candidate = bar(result, '00-99121-08');
    assert.ok(candidate);
    assert.ok(result.candidates.every(item => item.bar.series === '99121' || (gripDiameter === 20 && item.bar.series === '99101')));
    assert.equal(candidate.shankStatus, 'confirmed');
    assert.equal(candidate.selectedShankD, gripDiameter);
    assert.equal(candidate.bar.shankD, null);
    assert.equal(candidate.clampStatus, 'review');
    assert.equal(candidate.depthStatus, 'review');
    assert.equal(candidate.status, 'review');
    assert.ok(!candidate.reviewNotes.some(note => note.includes('per-part mapping is unconfirmed')));
    assert.ok(candidate.reviewNotes.some(note => note.includes('minimum effective clamping length')));
    assert.equal(core.calculate(confirmedModel, candidate, input).canCopy, false);
    const fixed = bar(result, '00-99101-08');
    if (gripDiameter === 20) {
      assert.ok(fixed);
      assert.equal(fixed.bar.shankD, 20);
      assert.equal(fixed.selectedShankD, 20);
    } else assert.equal(fixed, undefined);
  }
});

test('confirmed options do not turn missing or unknown clamping choices into verified shanks', () => {
  const missing = core.find(confirmedModel, { ...base, clamping: 'existing_general', generalType: 'collet' });
  assert.deepEqual(missing.criteria.missingFields, ['gripDiameter']);
  assert.ok(missing.candidates.every(candidate => candidate.shankStatus === 'unselected' && candidate.selectedShankD === null && candidate.status === 'review'));
  const unknown = bar(core.find(confirmedModel, { ...base, clamping: 'unknown', gripDiameter: 16 }), '00-99121-08');
  assert.equal(unknown.shankStatus, 'review');
  assert.equal(unknown.selectedShankD, null);
  const unsupported = core.find(confirmedModel, { ...base, clamping: 'existing_general', gripDiameter: 50 });
  assert.equal(unsupported.candidates.length, 0);
  assert.equal(unsupported.diagnosis.code, 'shank_unavailable');
  assert.deepEqual(unsupported.diagnosis.availableShankDiameters, [13, 16, 20]);
});

test('user-confirmed shanks remain supported independently of the older diagram issue', () => {
  const inventory = read('product-inventory');
  inventory.critical_source_issues = inventory.critical_source_issues.filter(issue => issue.id !== '99121_diagram_shank_mapping');
  const independent = core.normalize(inventory, read('clamping-data'), read('cutting-data'), confirmedSpecs);
  for (const gripDiameter of [20, 16, 13]) {
    const candidate = bar(core.find(independent, { ...base, clamping: 'existing_general', gripDiameter }), '00-99121-08');
    assert.equal(candidate.shankStatus, 'confirmed');
    assert.equal(candidate.selectedShankD, gripDiameter);
  }
});

test('untrusted or empty confirmation metadata preserves uncertain diagram options', () => {
  const source = confirmedSpecs.series['99121'];
  for (const invalid of [
    { ...source, status: 'review' },
    { ...source, source: { kind: 'catalog_diagram' } },
    { ...source, source: null },
    { ...source, shank_diameters_mm: [0, -16, Infinity, NaN, '16', true] },
    { ...source, shank_diameters_mm: '20,16,13' }
  ]) {
    const uncertain = core.normalize(read('product-inventory'), read('clamping-data'), read('cutting-data'), { series: { '99121': invalid } });
    const original = uncertain.bars.find(item => item.id === '00-99121-08');
    assert.deepEqual(original.shankOptions, [20, 13]);
    assert.equal(original.shankOptionsConfirmed, false);
    assert.equal(original.shankOptionsSource, null);
    const input = { ...base, clamping: 'existing_general', gripDiameter: 16 };
    assert.equal(core.find(uncertain, input).candidates.length, 0);
    const fallback = bar(core.find(uncertain, { ...input, gripDiameter: 13 }), '00-99121-08');
    assert.equal(fallback.shankStatus, 'review');
    assert.equal(fallback.selectedShankD, null);
    assert.ok(fallback.reviewNotes.some(note => note.includes('per-part mapping is unconfirmed')));
  }
});

test('confirmation accepts only finite positive numeric options and cannot overwrite other series', () => {
  const source = confirmedSpecs.series['99121'];
  const specs = { series: {
    '99121': { ...source, shank_diameters_mm: [20, 16, 13, 16, 0, -1, Infinity, NaN, '13', true] },
    '99101': { ...source, shank_diameters_mm: [50] },
    '99146': { ...source, shank_diameters_mm: [50] },
    '99151': { ...source, shank_diameters_mm: [50] }
  } };
  const checked = core.normalize(read('product-inventory'), read('clamping-data'), read('cutting-data'), specs);
  assert.deepEqual(checked.bars.find(item => item.id === '00-99121-08').shankOptions, [20, 16, 13]);
  assert.deepEqual(checked.bars.filter(item => item.series !== '99121'), model.bars.filter(item => item.series !== '99121'));
  const quick = bar(core.find(checked, { ...base, diameter: 5, depth: 15 }), '00-99151-0500W');
  assert.equal(quick.bar.shankD, 6);
  assert.equal(quick.adapter.id, '00-99151A-06');
});

test('D8 cutting calculations stay identical for all three confirmed rear shank sizes', () => {
  const results = [20, 16, 13].map(gripDiameter => {
    const input = { ...base, clamping: 'existing_general', generalType: 'hydraulic', gripDiameter };
    const candidate = bar(core.find(confirmedModel, input), '00-99121-08');
    return core.calculate(confirmedModel, candidate, input);
  });
  for (const result of results) {
    assert.equal(result.diameter, 8);
    assert.equal(result.vc, 200);
    assert.equal(result.feed, 0.07);
    assert.ok(Math.abs(result.rpm - 1000 * 200 / (Math.PI * 8)) < 1e-10);
    assert.ok(Math.abs(result.feedRate - result.rpm * 0.07) < 1e-10);
    assert.equal(result.canCopy, false);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result, results[0]);
  }
});

test('99151 adapters follow actual shank diameter, never the finished hole diameter', () => {
  const selected = find({ diameter: 5, depth: 15 });
  const candidate = bar(selected, '00-99151-0500W');
  assert.equal(candidate.bar.nominalD, 5);
  assert.equal(candidate.bar.shankD, 6);
  assert.equal(candidate.adapter.id, '00-99151A-06');
  assert.ok(find().candidates.every(item => ['99146', '99151'].includes(item.bar.series)));
});

test('missing and unknown holder IDs, unknown route, and SB32 never become ready', () => {
  for (const holderId of ['', 'not-a-catalog-holder', '00-99146-SB32H']) {
    const result = find({ holderId });
    const candidate = bar(result, '00-99146-0800S');
    assert.equal(candidate.clampStatus, 'review');
    assert.equal(candidate.status, 'review');
    assert.equal(core.calculate(model, candidate, { ...base, holderId }).canCopy, false);
    if (holderId !== '00-99146-SB32H') {
      assert.equal(result.criteria.complete, false);
      assert.equal(result.criteria.questionsAnswered, false);
      assert.deepEqual(result.criteria.missingFields, ['holderId']);
      assert.equal(result.diagnosis.code, 'browse');
    }
  }
  assert.equal(find().criteria.complete, true);
  assert.equal(find().criteria.questionsAnswered, true);
  const unknown = find({ clamping: 'unknown' });
  assert.ok(unknown.candidates.some(item => item.bar.series === '99101'));
  assert.ok(unknown.candidates.every(item => item.clampStatus === 'review'));
  const sb = bar(find({ holderId: '00-99146-SB32H' }), '00-99146-0800S');
  assert.ok(sb.reviewNotes.some(note => note.includes('external machine holder that grips Ø32')));
});

test('small physical insert can match exactly, but NC2033 grade gap is not filled from another row', () => {
  const exact = bar(find(), '00-99146-0800S');
  assert.equal(exact.cuttingStatus, 'confirmed');
  assert.equal(exact.status, 'confirmed');
  assert.ok(exact.insertOptions.some(item => item.id === 'CCGT040102|NC9036' && item.exactGeometry && item.gradeMatch));
  const gap = bar(find({ material: 'Carbon Steel' }), '00-99146-0800S');
  assert.equal(gap.cuttingStatus, 'grade_gap');
  assert.equal(gap.status, 'review');
  assert.ok(!gap.insertOptions.some(item => item.grade === 'NC2033'));
  assert.equal(gap.cuttingRow.id, 'carbon-regular');
  assert.equal(bar(find({ material: 'Carbon Steel', condition: 'Interrupted cutting' }), '00-99146-0800S').cuttingStatus, 'confirmed');
});

// 跨條件值只供明示的試切參考；原需求、牌號缺口與不可複製狀態都必須保留。
const referenceInput = { ...base, material: 'Carbon Steel', clamping: 'existing_general', generalType: 'hydraulic', gripDiameter: 20, allowReference: true };
const referenceCandidate = () => bar(core.find(model, referenceInput), '00-99121-08');
const referenceWarning = 'Reference values use the same material with NC30 under interrupted cutting; they are not catalog recommendations for the selected regular-cutting condition.';

test('D8 carbon regular offers exact NC30 trial reference without confirming the requested row', () => {
  const candidate = referenceCandidate();
  const result = core.calculate(model, candidate, referenceInput);
  const nc30 = candidate.insertOptions.find(insert => insert.id === 'CCGT040102|NC30');
  assert.equal(candidate.cuttingStatus, 'grade_gap');
  assert.equal(candidate.status, 'review');
  assert.equal(candidate.cuttingRow.id, 'carbon-regular');
  assert.equal(candidate.referenceRow.id, 'carbon-interrupted');
  assert.equal(nc30.exactGeometry, true);
  assert.equal(nc30.gradeMatch, false);
  assert.equal(nc30.recommended, false);
  assert.equal(nc30.referenceRecommended, true);
  assert.equal(nc30.referenceRow.id, 'carbon-interrupted');
  assert.equal(result.grade, 'NC30');
  assert.equal(result.insert.gradeMatch, false);
  assert.equal(result.referenceMode, true);
  assert.equal(result.vc, 120);
  assert.equal(result.feed, 0.05);
  assert.ok(Math.abs(result.rpm - 4774.64829275686) < 1e-9);
  assert.ok(Math.abs(result.feedRate - 238.732414637843) < 1e-9);
  assert.equal(result.source, 'catalog_reference');
  assert.equal(result.recommendation.basis, 'same_material_other_condition');
  assert.equal(result.recommendation.source, 'catalog_reference');
  assert.equal(result.recommendation.sourceRow, result.usedCuttingRow);
  assert.equal(result.cuttingRow.id, 'carbon-regular');
  assert.equal(result.requestedCuttingRow, result.cuttingRow);
  assert.equal(result.referenceRow.id, 'carbon-interrupted');
  assert.equal(result.usedCuttingRow, result.referenceRow);
  assert.deepEqual(result.recommendation.sourceRow.source, {
    printed_page: 162, pdf_page: 15, section: 'Cutting Data', image: 'verification/page-15.png'
  });
  assert.equal(candidate.criteria.material, 'Carbon Steel');
  assert.equal(candidate.criteria.condition, 'Regular cutting');
  assert.equal(result.cuttingRow.workpiece_material, 'Carbon Steel');
  assert.equal(result.cuttingRow.cutting_condition_or_surface_finish, 'Regular cutting');
  assert.ok(result.warnings.includes(referenceWarning));
  assert.ok(!result.warnings.some(warning => warning.includes('another material or operation are not substituted')));
  assert.ok(result.warnings.some(warning => warning.includes('per-part mapping is unconfirmed')));
  assert.equal(result.canCopy, false);
  assert.deepEqual(result.errors, []);
});

test('reference use is opt-in and cannot approve even an otherwise confirmed quick assembly', () => {
  const candidate = referenceCandidate();
  for (const allowReference of [undefined, false]) {
    const disabled = core.calculate(model, candidate, { ...referenceInput, allowReference });
    assert.equal(disabled.insert, null);
    assert.equal(disabled.recommendation, null);
    assert.equal(disabled.referenceRow, null);
    assert.equal(disabled.referenceMode, false);
    assert.equal(disabled.rpm, null);
    assert.equal(disabled.canCopy, false);
    const explicit = core.calculate(model, candidate, { ...referenceInput, allowReference, insertId: 'CCGT040102|NC30' });
    assert.equal(explicit.recommendation, null);
    assert.equal(explicit.rpm, null);
  }
  const quick = bar(find({ material: 'Carbon Steel' }), '00-99146-0800S');
  const result = core.calculate(model, { ...quick, status: 'confirmed', reviewNotes: [] }, { ...base, material: 'Carbon Steel', allowReference: true });
  assert.equal(result.referenceMode, true);
  assert.equal(result.canCopy, false);
  assert.equal(result.insert.gradeMatch, false);
});

test('reference manual edits and cleared fields retain truthful provenance and recoverable recommendation', () => {
  const candidate = referenceCandidate();
  const initial = core.calculate(model, candidate, referenceInput);
  const mixed = core.calculate(model, candidate, { ...referenceInput, vc: 100 });
  assert.equal(mixed.source, 'catalog_reference_manual');
  assert.equal(mixed.vc, 100);
  assert.equal(mixed.feed, 0.05);
  assert.ok(mixed.warnings.some(warning => warning.includes('user-entered values')));
  for (const fields of [{ vc: '', feed: '0.05' }, { vc: '120', feed: '' }, { vc: '', feed: '' }]) {
    const cleared = core.calculate(model, candidate, { ...referenceInput, ...fields, useRecommendations: false });
    assert.equal(cleared.source, 'manual');
    assert.equal(cleared.referenceMode, true);
    assert.equal(cleared.vc, fields.vc === '' ? null : 120);
    assert.equal(cleared.feed, fields.feed === '' ? null : 0.05);
    assert.equal(cleared.rpm, null);
    assert.equal(cleared.feedRate, null);
    assert.equal(cleared.canCopy, false);
    assert.deepEqual(cleared.recommendation, initial.recommendation);
  }
  const manual = core.calculate(model, candidate, { ...referenceInput, vc: 110, feed: 0.04, useRecommendations: false });
  assert.equal(manual.source, 'manual');
  assert.equal(manual.rpm > 0, true);
  assert.equal(manual.canCopy, false);
  const restored = core.calculate(model, candidate, { ...referenceInput, vc: '', feed: '', useRecommendations: true });
  assert.equal(restored.vc, 120);
  assert.equal(restored.feed, 0.05);
  assert.equal(restored.source, 'catalog_reference');
  assert.deepEqual(restored.recommendation, initial.recommendation);
});

test('same-material reference whitelist covers carbon, alloy and stainless regular cutting only', () => {
  for (const [material, id, vc, feed] of [
    ['Carbon Steel', 'carbon-interrupted', 120, 0.05],
    ['Alloy Steel', 'alloy-interrupted', 100, 0.05],
    ['Stainless Steel', 'stainless-interrupted', 80, 0.07]
  ]) {
    const input = { ...referenceInput, material };
    const candidate = bar(core.find(model, input), '00-99121-08');
    const result = core.calculate(model, candidate, input);
    assert.equal(result.referenceRow.id, id);
    assert.equal(result.referenceRow.workpiece_material, material);
    assert.equal(result.referenceRow.cutting_condition_or_surface_finish, 'Interrupted cutting');
    assert.equal(result.grade, 'NC30');
    assert.equal(result.vc, vc);
    assert.equal(result.feed, feed);
    assert.equal(candidate.cuttingStatus, 'grade_gap');
  }
});

test('a direct exact-grade match always takes priority over cross-condition reference', () => {
  // 用獨立模型模擬未來補齊原列的牌號證據，不修改研究 JSON。
  const directModel = { ...model, cuttingRows: model.cuttingRows.map(row => row.id === 'carbon-regular' ? { ...row, grade_candidates: ['NC30'] } : row) };
  const candidate = bar(core.find(directModel, referenceInput), '00-99121-08');
  const result = core.calculate(directModel, candidate, referenceInput);
  assert.equal(candidate.cuttingStatus, 'confirmed');
  assert.equal(candidate.referenceRow, null);
  assert.ok(candidate.insertOptions.every(insert => !insert.referenceRecommended && insert.referenceRow === null));
  assert.equal(result.referenceMode, false);
  assert.equal(result.referenceRow, null);
  assert.equal(result.usedCuttingRow.id, 'carbon-regular');
  assert.equal(result.insert.gradeMatch, true);
  assert.equal(result.vc, 150);
  assert.equal(result.feed, 0.07);
  assert.equal(result.source, 'site_median');
});

test('reference rejects wildcard 0602 geometry and incompatible NC9036 grade', () => {
  const input = { ...base, diameter: 12, depth: 20, material: 'Carbon Steel', allowReference: true };
  const candidate = bar(core.find(model, input), '00-99146-1200S');
  assert.equal(candidate.referenceRow, null);
  assert.ok(candidate.insertOptions.every(insert => !insert.referenceRecommended));
  const wildcard = core.calculate(model, candidate, input);
  assert.equal(wildcard.recommendation, null);
  assert.equal(wildcard.referenceMode, false);
  const wrongGrade = core.calculate(model, referenceCandidate(), { ...referenceInput, insertId: 'CCGT040102|NC9036' });
  assert.equal(wrongGrade.insert.exactGeometry, true);
  assert.equal(wrongGrade.insert.gradeMatch, false);
  assert.equal(wrongGrade.insert.referenceRecommended, false);
  assert.equal(wrongGrade.recommendation, null);
  assert.equal(wrongGrade.referenceMode, false);
  assert.equal(wrongGrade.rpm, null);
  assert.equal(wrongGrade.canCopy, false);
});

test('mirror, H, absent material and absent cutting rows never activate a reference', () => {
  for (const fields of [
    { material: 'Non-ferrous metal', condition: 'Super mirror finish' },
    { material: 'Carbon Steel', condition: 'Super mirror finish' },
    { material: 'Hardened Steel <HRC 50' },
    { material: 'Titanium' },
    { material: '' }
  ]) {
    const input = { ...referenceInput, ...fields };
    const candidate = bar(core.find(model, input), '00-99121-08');
    const result = core.calculate(model, candidate, input);
    assert.equal(candidate.referenceRow, null);
    assert.ok(candidate.insertOptions.every(insert => !insert.referenceRecommended));
    assert.equal(result.referenceMode, false);
    assert.equal(result.referenceRow, null);
    assert.notEqual(result.recommendation?.basis, 'same_material_other_condition');
  }
});

test('reference validates source material, condition and NC30 instead of trusting its row ID', () => {
  for (const fields of [
    { workpiece_material: 'Alloy Steel' },
    { cutting_condition_or_surface_finish: 'Regular cutting' },
    { grade_candidates: ['NC9036'] }
  ]) {
    const alteredModel = { ...model, cuttingRows: model.cuttingRows.map(row => row.id === 'carbon-interrupted' ? { ...row, ...fields } : row) };
    const candidate = bar(core.find(alteredModel, referenceInput), '00-99121-08');
    const result = core.calculate(alteredModel, candidate, referenceInput);
    assert.equal(candidate.referenceRow, null);
    assert.equal(result.recommendation, null);
    assert.equal(result.referenceMode, false);
  }
});

test('reference radial-stock limit comes from the actual interrupted-cutting source row', () => {
  const alteredModel = { ...model, cuttingRows: model.cuttingRows.map(row => row.id === 'carbon-interrupted' ? {
    ...row, radial_stock_ae: { by_insert_radius: [{ re_mm: 0.2, ae_mm: 0.025 }] }
  } : row) };
  const input = { ...referenceInput, prebore: 7.92 };
  const candidate = bar(core.find(alteredModel, input), '00-99121-08');
  const result = core.calculate(alteredModel, candidate, input);
  assert.equal(result.aeLimit, 0.025);
  assert.ok(result.warnings.some(warning => warning.includes('exceeds the listed 0.025 mm')));
  assert.equal(result.canCopy, false);
});

test('0602 wildcard never becomes an alias or automatic recommendation', () => {
  const candidate = bar(find({ diameter: 12, depth: 20, material: 'Carbon Steel' }), '00-99146-1200S');
  assert.equal(candidate.cuttingStatus, 'geometry_review');
  assert.ok(candidate.insertOptions.length > 0);
  assert.ok(candidate.insertOptions.every(item => item.exactGeometry === false));
  const result = core.calculate(model, candidate, { ...base, diameter: 12, depth: 20, material: 'Carbon Steel', insertId: 'CCFT060204|NC2033', vc: 120, feed: 0.07 });
  assert.equal(result.recommendation, null);
  assert.equal(result.source, 'manual');
  assert.equal(result.canCopy, false);
  assert.ok(result.warnings.some(note => note.includes('physical geometry')));
});

test('unlisted material or condition preserves geometric candidates without fabricated cutting data', () => {
  const result = find({ material: 'Titanium' });
  const candidate = bar(result, '00-99146-0800S');
  assert.ok(candidate);
  assert.equal(candidate.cuttingRow, null);
  assert.equal(candidate.cuttingStatus, 'no_data');
  assert.equal(candidate.status, 'review');
  assert.equal(bar(find({ condition: 'Super mirror finish' }), '00-99146-0800S').cuttingStatus, 'grade_gap');
  assert.equal(bar(find({ material: 'Carbon Steel', condition: 'Super mirror finish' }), '00-99146-0800S').cuttingStatus, 'no_data');
});

test('calculations use site middle values, actual cutting diameter, and feed per revolution', () => {
  const candidate = bar(find(), '00-99146-0800S');
  const result = core.calculate(model, candidate, base);
  assert.equal(result.grade, 'NC9036');
  assert.equal(result.insert.parts, 'CCGT040102');
  assert.equal(result.vc, 200);
  assert.equal(result.feed, 0.07);
  assert.equal(result.source, 'site_median');
  assert.deepEqual(result.recommendation.vcSequence, [150, 200, 300]);
  assert.ok(Math.abs(result.rpm - 1000 * 200 / (Math.PI * 8)) < 1e-10);
  assert.ok(Math.abs(result.feedRate - result.rpm * 0.07) < 1e-10);
  assert.equal(result.canCopy, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.depth, 12);
  assert.equal(result.z, undefined);
});

test('manual values keep their provenance and invalid limits never silently clip RPM', () => {
  const candidate = bar(find(), '00-99146-0800S');
  const manual = core.calculate(model, candidate, { ...base, vc: 100, feed: 0.05, machineMaxRpm: 3000 });
  assert.equal(manual.source, 'manual');
  assert.ok(manual.rpm > 3000);
  assert.equal(manual.canCopy, false);
  assert.ok(manual.errors.some(error => error.includes('not been clipped automatically')));
  const zero = core.calculate(model, candidate, { ...base, machineMaxRpm: 0 });
  assert.equal(zero.canCopy, false);
  assert.ok(zero.errors.some(error => error.includes('maximum speed')));
  const mixed = core.calculate(model, candidate, { ...base, vc: 100 });
  assert.equal(mixed.source, 'mixed');
  assert.equal(mixed.feed, 0.07);
});

test('clearing a manually edited field never calculates with hidden median values', () => {
  const candidate = bar(find(), '00-99146-0800S');
  const initial = core.calculate(model, candidate, { ...base, vc: '', feed: '' });
  assert.equal(initial.recommendation.vc, 200);
  assert.equal(initial.rpm > 0, true);

  const clearedVc = core.calculate(model, candidate, { ...base, vc: '', feed: '0.07', useRecommendations: false });
  assert.equal(clearedVc.vc, null);
  assert.equal(clearedVc.feed, 0.07);
  assert.equal(clearedVc.rpm, null);
  assert.equal(clearedVc.feedRate, null);
  assert.equal(clearedVc.canCopy, false);
  assert.equal(clearedVc.source, 'manual');
  assert.ok(clearedVc.errors.some(error => error.includes('Enter manual cutting speed')));
  assert.deepEqual(clearedVc.recommendation, initial.recommendation);

  const clearedFeed = core.calculate(model, candidate, { ...base, vc: '200', feed: ' ', useRecommendations: false });
  assert.equal(clearedFeed.vc, 200);
  assert.equal(clearedFeed.feed, null);
  assert.equal(clearedFeed.rpm, null);
  assert.equal(clearedFeed.feedRate, null);
  assert.equal(clearedFeed.canCopy, false);
  assert.ok(clearedFeed.errors.some(error => error.includes('Enter manual feed per revolution')));

  const filled = core.calculate(model, candidate, { ...base, vc: '180', feed: '0.06', useRecommendations: false });
  assert.equal(filled.vc, 180);
  assert.equal(filled.feed, 0.06);
  assert.equal(filled.rpm > 0, true);
  assert.equal(filled.canCopy, true);

  const restored = core.calculate(model, candidate, { ...base, vc: '', feed: '', useRecommendations: true });
  assert.equal(restored.vc, 200);
  assert.equal(restored.feed, 0.07);
  assert.equal(restored.source, 'site_median');
  assert.equal(restored.canCopy, true);
  assert.deepEqual(restored.errors, []);
});

test('prebore converts radial stock and flags excess without changing the clamping result', () => {
  const candidate = bar(find(), '00-99146-0800S');
  const result = core.calculate(model, candidate, { ...base, prebore: 7.8 });
  assert.ok(Math.abs(result.ae - 0.1) < 1e-10);
  assert.equal(result.aeLimit, 0.05);
  assert.equal(candidate.clampStatus, 'confirmed');
  assert.ok(result.warnings.some(note => note.includes('exceeds the listed')));
  assert.equal(result.canCopy, false);
  const equal = core.calculate(model, candidate, { ...base, prebore: 8 });
  assert.equal(equal.ae, null);
  assert.ok(equal.errors.some(error => error.includes('Prebore diameter must be smaller')));
});

test('null Re and mirror merged columns do not fabricate a radius or an Ae validation', () => {
  const candidate = bar(find({ diameter: 12, depth: 20, condition: 'Super mirror finish' }), '00-99146-1200S');
  const result = core.calculate(model, candidate, { ...base, diameter: 12, depth: 20, condition: 'Super mirror finish', insertId: 'CCGH0602U|XP9001', vc: 200, feed: 0.2, prebore: 11.8 });
  assert.equal(result.insert.re, null);
  assert.equal(result.aeLimit, null);
  assert.equal(result.recommendation, null);
  assert.ok(result.warnings.some(note => note.includes('Re or its catalog Ae mapping')));
});

test('hardness-qualified material retains the requirement for actual hardness confirmation', () => {
  const candidate = bar(find({ material: 'Hardened Steel <HRC 50' }), '00-99146-0800S');
  assert.equal(candidate.status, 'review');
  assert.ok(candidate.reviewNotes.some(note => note.includes('HRC < 50')));
  const result = core.calculate(model, candidate, { ...base, material: 'Hardened Steel <HRC 50' });
  assert.equal(result.grade, 'NC30');
  assert.equal(result.canCopy, false);
});

test('invalid numbers and stale candidate dimensions cannot produce copyable calculations', () => {
  for (const diameter of [-1, 0, 'abc', Infinity, true, []]) {
    const result = find({ diameter });
    assert.equal(result.candidates.length, 0);
    assert.ok(result.errors.some(error => error.includes('Target diameter')));
  }
  const candidate = bar(find(), '00-99146-0800S');
  const result = core.calculate(model, candidate, { ...base, diameter: 10, depth: 20, insertId: 'CCGT030102|NC30', vc: -1, feed: 0 });
  assert.equal(result.canCopy, false);
  assert.ok(result.errors.some(error => error.includes('outside this bar')));
  assert.ok(result.errors.some(error => error.includes('exceeds this bar')));
  assert.ok(result.errors.some(error => error.includes('not a listed physical candidate')));
  assert.ok(result.errors.some(error => error.includes('Cutting speed')));
  assert.ok(result.errors.some(error => error.includes('Feed per revolution')));
});

test('dynamic text can be safely escaped by the browser layer', () => {
  assert.equal(core.escapeHTML('<a title="x">&\'test</a>'), '&lt;a title=&quot;x&quot;&gt;&amp;&#39;test&lt;/a&gt;');
});
