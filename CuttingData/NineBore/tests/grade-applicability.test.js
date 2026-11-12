/* 適材、原切削列牌號與實體幾何分開驗證；篩選不可把試切參考升格為直接推薦。 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../core.js');
const research = path.join(__dirname, '..', 'data');
const read = name => JSON.parse(fs.readFileSync(path.join(research, `${name}.json`), 'utf8'));
const specs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'confirmed-specs.json'), 'utf8'));
const normalize = evidence => core.normalize(read('product-inventory'), read('clamping-data'), read('cutting-data'), evidence);
const model = normalize(specs);
const base = {
  diameter: 5, depth: 10, material: 'Stainless Steel', condition: 'Regular cutting',
  clamping: 'existing_general', generalType: 'hydraulic', gripDiameter: 20
};
const candidateFor = (currentModel = model, fields = {}) => core.find(currentModel, { ...base, ...fields }).candidates.find(item => item.id === '00-99121-05');
const option = (candidate, grade) => candidate.insertOptions.find(item => item.grade === grade);
const grades = options => options.map(item => item.grade).sort();
const materialError = 'The selected insert grade is not listed for the chosen material.';

test('verified p162 applicability preserves physical inventory and documents the hardened-steel exception', () => {
  assert.deepEqual(model.gradeMaterials, specs.grade_applicability.by_grade);
  assert.equal(model.inserts.length, 8);
  assert.ok(model.gradeMaterials.NC30.includes('Hardened Steel <HRC 50'));
  assert.ok(!model.inserts.some(insert => insert.parts === 'CCGT030102' && insert.grade === 'NC2033'));
  assert.deepEqual(read('cutting-data').rows.find(row => row.id === 'stainless-regular').grade_candidates, ['NC2033']);
});

test('stainless D5 retains material-suitable NC30 while excluding NC9036 from applicable choices', () => {
  const candidate = candidateFor();
  assert.ok(candidate);
  assert.equal(option(candidate, 'NC30').materialSuitable, true);
  assert.equal(option(candidate, 'NC30').exactGeometry, true);
  assert.equal(option(candidate, 'NC30').gradeMatch, false);
  assert.equal(option(candidate, 'NC30').recommended, false);
  assert.equal(option(candidate, 'NC9036').materialSuitable, false);
  assert.equal(option(candidate, 'NC9036').recommended, false);
  assert.equal(option(candidate, 'NC9036').referenceRecommended, false);
  assert.deepEqual(grades(core.applicableInserts(model, candidate, 'Stainless Steel')), ['NC30']);
  assert.equal(candidate.cuttingStatus, 'grade_gap');
});

test('non-ferrous D5 reverses applicability without borrowing a steel reference', () => {
  const input = { ...base, material: 'Non-ferrous metal' };
  const candidate = candidateFor(model, input);
  assert.equal(option(candidate, 'NC30').materialSuitable, false);
  assert.equal(option(candidate, 'NC9036').materialSuitable, true);
  assert.equal(option(candidate, 'NC9036').gradeMatch, true);
  assert.equal(option(candidate, 'NC9036').recommended, true);
  assert.deepEqual(grades(core.applicableInserts(model, candidate, input.material)), ['NC9036']);
  // UI亦可用同一候選重新核對材料，不得沿用上一個材料留下的布林值。
  assert.deepEqual(grades(core.applicableInserts(model, candidateFor(), input.material)), ['NC9036']);
  const result = core.calculate(model, candidate, { ...input, allowReference: true });
  assert.equal(result.grade, 'NC9036');
  assert.equal(result.referenceMode, false);
  assert.equal(result.referenceRow, null);
  assert.equal(result.vc, 200);
  assert.equal(result.feed, 0.07);
});

test('unselected and unknown materials keep geometric options without inventing recommendations', () => {
  for (const material of ['', 'Titanium']) {
    const candidate = candidateFor(model, { material });
    assert.ok(candidate.insertOptions.every(item => item.materialSuitable === null));
    assert.deepEqual(grades(core.applicableInserts(model, candidate, material)), ['NC30', 'NC9036']);
    assert.ok(candidate.insertOptions.every(item => !item.recommended && !item.referenceRecommended));
    const result = core.calculate(model, candidate, { ...base, material, allowReference: true });
    assert.equal(result.recommendation, null);
    assert.equal(result.referenceMode, false);
    assert.equal(result.rpm, null);
  }
});

test('known material still filters when the selected cutting condition has no catalog row', () => {
  const input = { ...base, condition: 'Super mirror finish' };
  const candidate = candidateFor(model, input);
  assert.equal(candidate.cuttingRow, null);
  assert.equal(option(candidate, 'NC30').materialSuitable, true);
  assert.equal(option(candidate, 'NC9036').materialSuitable, false);
  assert.deepEqual(grades(core.applicableInserts(model, candidate, input.material)), ['NC30']);
  assert.ok(candidate.insertOptions.every(item => !item.recommended && !item.referenceRecommended));
  const result = core.calculate(model, candidate, { ...input, insertId: 'CCGT030102|NC30', vc: 73, feed: 0.041, useRecommendations: false, allowReference: true });
  assert.equal(result.vc, 73);
  assert.equal(result.feed, 0.041);
  assert.equal(result.source, 'manual');
  assert.equal(result.recommendation, null);
  assert.equal(result.referenceMode, false);
  assert.ok(!result.errors.includes(materialError));
  assert.equal(result.canCopy, false);
});

test('material-suitable NC30 keeps stainless interrupted values separate from the requested regular row', () => {
  const candidate = candidateFor();
  const result = core.calculate(model, candidate, { ...base, allowReference: true });
  assert.equal(result.insert.id, 'CCGT030102|NC30');
  assert.equal(result.insert.materialSuitable, true);
  assert.equal(result.insert.gradeMatch, false);
  assert.equal(result.insert.recommended, false);
  assert.equal(result.insert.referenceRecommended, true);
  assert.equal(result.requestedCuttingRow.id, 'stainless-regular');
  assert.deepEqual(result.requestedCuttingRow.grade_candidates, ['NC2033']);
  assert.equal(result.usedCuttingRow.id, 'stainless-interrupted');
  assert.equal(result.referenceRow.workpiece_material, 'Stainless Steel');
  assert.equal(result.referenceMode, true);
  assert.equal(result.recommendation.basis, 'same_material_other_condition');
  assert.equal(result.source, 'catalog_reference');
  assert.equal(result.vc, 80);
  assert.equal(result.feed, 0.07);
  assert.equal(result.canCopy, false);
  assert.ok(result.warnings.some(message => message.includes('not catalog recommendations for the selected regular-cutting condition')));
});

test('reference opt-out never fills cutting values and manual values and blanks remain manual', () => {
  const candidate = candidateFor();
  for (const insertId of [undefined, 'CCGT030102|NC30']) {
    const result = core.calculate(model, candidate, { ...base, insertId, allowReference: false });
    assert.equal(result.recommendation, null);
    assert.equal(result.referenceMode, false);
    assert.equal(result.vc, null);
    assert.equal(result.feed, null);
  }
  const input = { ...base, insertId: 'CCGT030102|NC30', allowReference: false, useRecommendations: false };
  const manual = core.calculate(model, candidate, { ...input, vc: '73.25', feed: '0.041' });
  assert.equal(manual.vc, 73.25);
  assert.equal(manual.feed, 0.041);
  assert.equal(manual.source, 'manual');
  assert.equal(manual.recommendation, null);
  assert.ok(!manual.errors.includes(materialError));
  assert.ok(Number.isFinite(manual.rpm));
  assert.equal(manual.canCopy, false);
  const cleared = core.calculate(model, candidate, { ...input, vc: '', feed: '0.041' });
  assert.equal(cleared.vc, null);
  assert.equal(cleared.feed, 0.041);
  assert.equal(cleared.rpm, null);
  assert.equal(cleared.source, 'manual');
});

test('explicit unsuitable insert IDs fail rather than falling back to NC30 or erasing manual inputs', () => {
  // 模擬舊URL原本選在非鐵金屬；calculate必須依本次不鏽鋼重新核對適材。
  const candidate = candidateFor(model, { material: 'Non-ferrous metal' });
  const input = { ...base, insertId: 'CCGT030102|NC9036', allowReference: true };
  const result = core.calculate(model, candidate, input);
  assert.ok(result.errors.includes(materialError));
  assert.notEqual(result.insert?.id, 'CCGT030102|NC30');
  assert.equal(result.recommendation, null);
  assert.equal(result.referenceMode, false);
  assert.equal(result.vc, null);
  assert.equal(result.feed, null);
  assert.equal(result.canCopy, false);
  const manual = core.calculate(model, candidate, { ...input, vc: '73.25', feed: '0.041', useRecommendations: false });
  assert.ok(manual.errors.includes(materialError));
  assert.equal(manual.vc, 73.25);
  assert.equal(manual.feed, 0.041);
  assert.equal(manual.source, 'manual');
  assert.equal(manual.recommendation, null);
  assert.equal(manual.canCopy, false);
});

test('an intentionally cleared insert selection cannot silently auto-select a trial reference', () => {
  const candidate = candidateFor();
  const input = { ...base, insertId: '', allowReference: true, autoSelectInsert: false };
  const result = core.calculate(model, candidate, input);
  assert.ok(result.errors.includes('Choose an applicable insert for the selected material.'));
  assert.equal(result.insert, null);
  assert.equal(result.recommendation, null);
  assert.equal(result.referenceMode, false);
  assert.equal(result.vc, null);
  assert.equal(result.feed, null);
  assert.equal(result.canCopy, false);
  const manual = core.calculate(model, candidate, { ...input, vc: 73.25, feed: 0.041, useRecommendations: false });
  assert.equal(manual.insert, null);
  assert.equal(manual.vc, 73.25);
  assert.equal(manual.feed, 0.041);
  assert.equal(manual.source, 'manual');
  assert.equal(manual.canCopy, false);
});

test('NC30 remains applicable to HRC below 50 while retaining the actual-hardness check', () => {
  const input = { ...base, material: 'Hardened Steel <HRC 50' };
  const candidate = candidateFor(model, input);
  assert.equal(option(candidate, 'NC30').materialSuitable, true);
  assert.deepEqual(grades(core.applicableInserts(model, candidate, input.material)), ['NC30']);
  const result = core.calculate(model, candidate, { ...input, allowReference: true });
  assert.equal(result.grade, 'NC30');
  assert.equal(result.referenceMode, false);
  assert.ok(result.warnings.some(message => message.includes('HRC < 50')));
  assert.equal(result.canCopy, false);
});

test('missing grade evidence stays unknown instead of being treated as incompatible', () => {
  const withoutGrade = structuredClone(specs);
  delete withoutGrade.grade_applicability.by_grade.NC9036;
  const currentModel = normalize(withoutGrade);
  const candidate = candidateFor(currentModel);
  assert.equal(option(candidate, 'NC9036').materialSuitable, null);
  assert.deepEqual(grades(core.applicableInserts(currentModel, candidate, base.material)), ['NC30', 'NC9036']);
});

test('legacy and unverified applicability preserve the prior three-argument behavior', () => {
  const legacy = core.normalize(read('product-inventory'), read('clamping-data'), read('cutting-data'));
  // 無適材資料的同版本基準仍保留既有柄徑確認，避免把不同夾持來源的警示混入適材比較。
  const withoutApplicability = normalize({ ...specs, grade_applicability: undefined });
  const sources = [
    undefined,
    { ...specs.grade_applicability, status: 'review' },
    { ...specs.grade_applicability, source: { ...specs.grade_applicability.source, kind: 'user_confirmation' } },
    { ...specs.grade_applicability, source: { ...specs.grade_applicability.source, printed_page: 161 } },
    { ...specs.grade_applicability, source: null }
  ];
  for (const grade_applicability of sources) {
    const currentModel = normalize({ ...specs, grade_applicability });
    assert.deepEqual(currentModel.gradeMaterials, {});
    const candidate = candidateFor(currentModel);
    assert.ok(candidate.insertOptions.every(item => item.materialSuitable === null));
    assert.deepEqual(grades(core.applicableInserts(currentModel, candidate, base.material)), ['NC30', 'NC9036']);
    const input = { ...base, insertId: 'CCGT030102|NC9036', vc: 73.25, feed: 0.041, useRecommendations: false };
    const result = core.calculate(currentModel, candidate, input);
    assert.ok(!result.errors.includes(materialError));
    assert.equal(result.vc, 73.25);
    assert.equal(result.feed, 0.041);
    assert.deepEqual(result, core.calculate(withoutApplicability, candidateFor(withoutApplicability), input));
  }
  assert.deepEqual(legacy.gradeMaterials, {});
  const legacyCandidate = candidateFor(legacy);
  assert.ok(legacyCandidate.insertOptions.every(item => item.materialSuitable === null));
  assert.deepEqual(grades(core.applicableInserts(legacy, legacyCandidate, base.material)), ['NC30', 'NC9036']);
  const legacyResult = core.calculate(legacy, legacyCandidate, { ...base, insertId: 'CCGT030102|NC9036', vc: 73.25, feed: 0.041, useRecommendations: false });
  assert.ok(!legacyResult.errors.includes(materialError));
  assert.equal(legacyResult.vc, 73.25);
  assert.equal(legacyResult.feed, 0.041);
});
