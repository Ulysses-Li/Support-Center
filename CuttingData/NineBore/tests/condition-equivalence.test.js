/* 使用者確認同材料 NC30 共用切削參數；資料來源、實體品項與組裝限制仍須各自保留。 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../core.js');
const locale = require('../locale.zh-TW.js');
const ui = require('../locale.ui.js');
const root = path.join(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', `${name}.json`), 'utf8'));
const confirmed = JSON.parse(fs.readFileSync(path.join(root, 'confirmed-specs.json'), 'utf8'));
const normalize = (specs = confirmed, cutting = read('cutting-data'), inventory = read('product-inventory')) =>
  core.normalize(inventory, read('clamping-data'), cutting, specs);
const model = normalize();
const base = {
  diameter: 8, depth: 8, material: 'Stainless Steel', condition: 'Regular cutting',
  clamping: 'purchase_holder', holderId: '00-99146-BT40H'
};
const candidateFor = (currentModel = model, input = base, id = '00-99146-0800S') => {
  const candidate = core.find(currentModel, input).candidates.find(item => item.id === id);
  assert.ok(candidate, id);
  return candidate;
};
const withoutEquivalence = () => {
  const specs = structuredClone(confirmed);
  delete specs.cutting_condition_equivalence;
  return specs;
};

test('confirmation adds no export product, physical insert, grade or catalog cutting row', () => {
  const inventory = read('product-inventory');
  const cutting = read('cutting-data');
  const beforeInventory = structuredClone(inventory);
  const beforeCutting = structuredClone(cutting);
  const current = normalize(confirmed, cutting, inventory);
  const legacy = normalize(withoutEquivalence());
  assert.equal(current.confirmedConditionRules.length, 3);
  assert.deepEqual(current.bars, legacy.bars);
  assert.deepEqual(current.inserts, legacy.inserts);
  assert.equal(current.inserts.length, 8);
  assert.deepEqual(current.cuttingRows, legacy.cuttingRows);
  assert.deepEqual(inventory, beforeInventory);
  assert.deepEqual(cutting, beforeCutting);
  for (const material of ['Carbon Steel', 'Alloy Steel', 'Stainless Steel']) {
    const row = current.cuttingRows.find(item => item.workpiece_material === material && item.cutting_condition_or_surface_finish === 'Regular cutting');
    assert.deepEqual(row.grade_candidates, ['NC2033']);
  }
  assert.ok(!current.inserts.some(item => item.grade === 'DM' || item.grade === 'NC9031'));
});

for (const [material, prefix, vc, feed] of [
  ['Carbon Steel', 'carbon', 120, 0.05],
  ['Alloy Steel', 'alloy', 100, 0.05],
  ['Stainless Steel', 'stainless', 80, 0.07]
]) {
  for (const [diameter, part] of [[5, 'CCGT030102'], [8, 'CCGT040102']]) {
    test(`${material} ${part} regular cutting uses confirmed NC30 parameters with truthful provenance`, () => {
      const input = { ...base, diameter };
      input.material = material;
      const candidate = candidateFor(model, input, `00-99146-${String(diameter * 100).padStart(4, '0')}S`);
      const result = core.calculate(model, candidate, { ...input, allowReference: false });
      assert.equal(result.insert.id, `${part}|NC30`);
      assert.equal(result.insert.exactGeometry, true);
      assert.equal(result.insert.materialSuitable, true);
      assert.equal(result.insert.gradeMatch, false);
      assert.equal(result.insert.recommended, true);
      assert.equal(result.insert.referenceRecommended, false);
      assert.equal(result.conditionEquivalent, true);
      assert.equal(result.referenceMode, false);
      assert.equal(result.referenceRow, null);
      assert.equal(result.requestedCuttingRow.id, `${prefix}-regular`);
      assert.deepEqual(result.requestedCuttingRow.grade_candidates, ['NC2033']);
      assert.equal(result.usedCuttingRow.id, `${prefix}-interrupted`);
      assert.equal(result.recommendation.sourceRow, result.usedCuttingRow);
      assert.equal(result.recommendation.basis, 'user_confirmed_same_parameters');
      assert.deepEqual(result.conditionConfirmation, confirmed.cutting_condition_equivalence.source);
      assert.deepEqual(result.recommendation.confirmation, result.conditionConfirmation);
      assert.equal(result.vc, vc);
      assert.equal(result.feed, feed);
      assert.equal(result.aeLimit, 0.05);
      assert.ok(Math.abs(result.rpm - 1000 * vc / (Math.PI * diameter)) < 1e-9);
      assert.ok(Math.abs(result.feedRate - result.rpm * feed) < 1e-9);
      assert.equal(candidate.cuttingStatus, 'confirmed');
      assert.equal(candidate.status, 'confirmed');
      assert.equal(result.canCopy, true);
      assert.deepEqual(result.errors, []);
      assert.ok(!result.warnings.some(message => /trial reference|not catalog recommendations|absent from this row|no matching physical grade/i.test(message)));
    });
  }
}

test('missing and invalid confirmation evidence retain the legacy opt-in trial behavior', () => {
  const absent = withoutEquivalence();
  const mutations = [
    specs => { delete specs.cutting_condition_equivalence; },
    specs => { specs.cutting_condition_equivalence.status = 'review'; },
    specs => { specs.cutting_condition_equivalence.source = null; },
    specs => { specs.cutting_condition_equivalence.source.kind = 'catalog'; },
    specs => { specs.cutting_condition_equivalence.rules = null; },
    specs => { specs.cutting_condition_equivalence.rules = []; }
  ];
  for (const mutate of mutations) {
    const specs = structuredClone(confirmed);
    mutate(specs);
    const current = normalize(specs);
    assert.deepEqual(current.confirmedConditionRules, []);
    const candidate = candidateFor(current);
    const trial = core.calculate(current, candidate, { ...base, allowReference: true });
    assert.equal(trial.conditionEquivalent, false);
    assert.equal(trial.referenceMode, true);
    assert.equal(trial.recommendation.basis, 'same_material_other_condition');
    assert.equal(trial.vc, 80);
    assert.equal(trial.feed, 0.07);
    assert.equal(trial.canCopy, false);
    const disabled = core.calculate(current, candidate, { ...base, allowReference: false });
    assert.equal(disabled.recommendation, null);
    assert.equal(disabled.vc, null);
    assert.equal(disabled.feed, null);
    assert.deepEqual(trial, core.calculate(normalize(absent), candidateFor(normalize(absent)), { ...base, allowReference: true }));
  }
});

test('invalid material, grade, physical part or row IDs cannot broaden the confirmation scope', () => {
  const mutations = [
    rule => { rule.material = 'Carbon Steel'; },
    rule => { rule.grade = 'NC9036'; },
    rule => { rule.parts = ['CCFT060204']; },
    rule => { rule.parts = ['CCGT030102', 'NewExportPart']; },
    rule => { rule.parts = []; },
    rule => { rule.source_row_id = 'carbon-interrupted'; },
    rule => { rule.requested_row_id = 'stainless-mirror'; }
  ];
  for (const mutate of mutations) {
    const specs = structuredClone(confirmed);
    specs.cutting_condition_equivalence.rules = specs.cutting_condition_equivalence.rules.filter(rule => rule.material === 'Stainless Steel');
    mutate(specs.cutting_condition_equivalence.rules[0]);
    const current = normalize(specs);
    assert.deepEqual(current.confirmedConditionRules, []);
    const result = core.calculate(current, candidateFor(current), { ...base, allowReference: false });
    assert.equal(result.conditionEquivalent, false);
    assert.equal(result.recommendation, null);
    assert.equal(result.canCopy, false);
  }
});

test('source rows must retain the confirmed material, condition and NC30 grade', () => {
  const mutations = [
    row => { row.workpiece_material = 'Carbon Steel'; },
    row => { row.cutting_condition_or_surface_finish = 'Super mirror finish'; },
    row => { row.grade_candidates = ['NC9036']; },
    row => { row.hardness_condition = 'HRC < 50'; }
  ];
  for (const mutate of mutations) {
    const cutting = read('cutting-data');
    mutate(cutting.rows.find(row => row.id === 'stainless-interrupted'));
    const current = normalize(confirmed, cutting);
    const result = core.calculate(current, candidateFor(current), { ...base, allowReference: true });
    assert.equal(result.conditionEquivalent, false);
    assert.equal(result.referenceMode, false);
    assert.equal(result.recommendation, null);
    assert.equal(result.vc, null);
  }
});

test('confirmed 0602 NC2033 regular cutting preserves the direct catalog recommendation', () => {
  for (const [material, vc] of [['Carbon Steel', 150], ['Alloy Steel', 120], ['Stainless Steel', 100]]) {
    const input = { ...base, material, diameter: 20.1, clamping: 'existing_general', generalType: 'hydraulic', gripDiameter: 20 };
    const candidate = candidateFor(model, input, '00-99121-20');
    const result = core.calculate(model, candidate, { ...input, allowReference: true });
    assert.equal(result.insert.id, 'CCFT060204|NC2033');
    assert.equal(result.insert.gradeMatch, true);
    assert.equal(result.conditionEquivalent, false);
    assert.equal(result.referenceMode, false);
    assert.equal(result.vc, vc);
    assert.equal(result.feed, 0.07);
    assert.equal(result.recommendation.basis, 'selected_condition');
    assert.equal(result.usedCuttingRow, result.requestedCuttingRow);
    assert.equal(result.conditionConfirmation, null);
  }
});

test('an exact original NC30 grade match takes precedence over condition equivalence', () => {
  const cutting = read('cutting-data');
  const row = cutting.rows.find(item => item.id === 'stainless-regular');
  row.grade_candidates = ['NC30'];
  const current = normalize(confirmed, cutting);
  const result = core.calculate(current, candidateFor(current), { ...base, allowReference: true });
  assert.equal(result.insert.gradeMatch, true);
  assert.equal(result.conditionEquivalent, false);
  assert.equal(result.referenceMode, false);
  assert.equal(result.vc, 100);
  assert.equal(result.usedCuttingRow.id, 'stainless-regular');
  assert.equal(result.recommendation.basis, 'selected_condition');
});

test('confirmed parameters retain manual input, partially cleared fields and recoverable middle values', () => {
  const candidate = candidateFor();
  const initial = core.calculate(model, candidate, base);
  const manual = core.calculate(model, candidate, { ...base, vc: '73.25', feed: '0.041', useRecommendations: false });
  assert.equal(manual.vc, 73.25);
  assert.equal(manual.feed, 0.041);
  assert.equal(manual.source, 'manual');
  assert.equal(manual.conditionEquivalent, true);
  assert.deepEqual(manual.recommendation, initial.recommendation);
  for (const fields of [{ vc: '', feed: '0.041' }, { vc: '73.25', feed: '' }, { vc: '', feed: '' }]) {
    const cleared = core.calculate(model, candidate, { ...base, ...fields, useRecommendations: false });
    assert.equal(cleared.vc, fields.vc === '' ? null : 73.25);
    assert.equal(cleared.feed, fields.feed === '' ? null : 0.041);
    assert.equal(cleared.rpm, null);
    assert.equal(cleared.canCopy, false);
    assert.deepEqual(cleared.recommendation, initial.recommendation);
  }
  const restored = core.calculate(model, candidate, { ...base, vc: '', feed: '', useRecommendations: true });
  assert.equal(restored.vc, 80);
  assert.equal(restored.feed, 0.07);
  assert.equal(restored.conditionEquivalent, true);
  assert.equal(restored.canCopy, true);
});

test('an intentionally cleared insert is not reselected by confirmed condition rules', () => {
  const result = core.calculate(model, candidateFor(), { ...base, autoSelectInsert: false, insertId: '' });
  assert.equal(result.insert, null);
  assert.equal(result.recommendation, null);
  assert.equal(result.conditionEquivalent, false);
  assert.equal(result.vc, null);
  assert.equal(result.feed, null);
  assert.equal(result.canCopy, false);
});

test('NC9036 stays excluded from steel recommendations and explicit unsuitable IDs still fail', () => {
  const candidate = candidateFor();
  assert.deepEqual(core.applicableInserts(model, candidate, base.material).map(item => item.id), ['CCGT040102|NC30']);
  const result = core.calculate(model, candidate, { ...base, insertId: 'CCGT040102|NC9036', vc: 190, feed: 0.06, useRecommendations: false });
  assert.equal(result.insert.id, 'CCGT040102|NC9036');
  assert.equal(result.conditionEquivalent, false);
  assert.equal(result.recommendation, null);
  assert.equal(result.vc, 190);
  assert.equal(result.feed, 0.06);
  assert.ok(result.errors.includes('The selected insert grade is not listed for the chosen material.'));
  assert.equal(result.canCopy, false);
});

test('non-ferrous, missing or unknown materials and mirror/H conditions do not acquire equivalence', () => {
  for (const fields of [
    { material: 'Non-ferrous metal' }, { material: '' }, { material: 'Titanium' },
    { condition: 'Super mirror finish' }, { material: 'Hardened Steel <HRC 50' }
  ]) {
    const input = { ...base, ...fields };
    const candidate = candidateFor(model, input);
    const result = core.calculate(model, candidate, { ...input, allowReference: true });
    assert.equal(result.conditionEquivalent, false);
    assert.notEqual(result.recommendation?.basis, 'user_confirmed_same_parameters');
    assert.ok(candidate.insertOptions.every(item => !item.conditionEquivalent));
    if (!input.material || input.material === 'Titanium' || fields.condition) assert.equal(result.recommendation, null);
    if (input.material === 'Hardened Steel <HRC 50') {
      assert.ok(result.warnings.some(message => message.includes('HRC < 50')));
      assert.equal(result.canCopy, false);
    }
  }
});

test('condition confirmation does not approve straight-shank reach, clamping or deep-hole projection', () => {
  const cases = [
    [{ ...base, clamping: 'existing_general', generalType: 'hydraulic', gripDiameter: 20 }, '00-99121-08'],
    [base, '00-99151-0800W']
  ];
  for (const [input, id] of cases) {
    const candidate = candidateFor(model, input, id);
    const result = core.calculate(model, candidate, input);
    assert.equal(candidate.cuttingStatus, 'confirmed');
    assert.equal(result.conditionEquivalent, true);
    assert.equal(result.vc, 80);
    assert.equal(result.feed, 0.07);
    assert.equal(candidate.status, 'review');
    assert.equal(result.canCopy, false);
    assert.ok(result.warnings.some(message => /actual projection|actual insertion|clamping length/i.test(message)));
  }
});

test('Ae follows the used source row and excess stock or machine limits still block copying', () => {
  const cutting = read('cutting-data');
  const row = cutting.rows.find(item => item.id === 'stainless-interrupted');
  row.radial_stock_ae.by_insert_radius.find(item => item.re_mm === 0.2).ae_mm = 0.03;
  const current = normalize(confirmed, cutting);
  const input = { ...base, prebore: 7.92 };
  const candidate = candidateFor(current, input);
  const result = core.calculate(current, candidate, input);
  assert.equal(result.conditionEquivalent, true);
  assert.equal(result.aeLimit, 0.03);
  assert.ok(Math.abs(result.ae - 0.04) < 1e-9);
  assert.equal(result.canCopy, false);
  assert.ok(result.warnings.some(message => message.includes('exceeds the listed 0.03 mm')));
  const limited = core.calculate(model, candidateFor(), { ...base, machineMaxRpm: 1000 });
  assert.equal(limited.canCopy, false);
  assert.ok(limited.errors.some(message => message.includes('exceeds the entered limit')));
});

test('new confirmation labels and parameter source translate while preserving identities and numbers', () => {
  const labels = [
    'User-confirmed shared cutting parameters',
    'Regular and interrupted cutting use the same parameters for this material and NC30.',
    'User-confirmed parameters'
  ];
  for (const label of labels) {
    assert.notEqual(locale.translate(label), label);
    assert.equal(ui.translate(label), locale.translate(label));
  }
  const summary = ui.translate('User-confirmed parameters · median');
  assert.match(summary, /已確認共用參數/);
  assert.ok(!summary.includes('median'));
  const source = 'Stainless Steel · Interrupted cutting. Listed Vc: 70 / 80 / 100 m/min; f: 0.05 / 0.07 / 0.1 mm/rev. Catalog p. 162.';
  const translated = ui.translate(source);
  assert.match(translated, /不鏽鋼/);
  assert.match(translated, /斷續切削/);
  for (const token of ['70 / 80 / 100', '0.05 / 0.07 / 0.1', '162']) assert.ok(translated.includes(token));
  assert.equal(ui.translate('CCGT040102|NC30'), 'CCGT040102|NC30');
});
