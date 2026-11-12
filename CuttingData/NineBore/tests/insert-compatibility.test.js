/* 原廠系列配對證據：僅升級已確認的實體刀片／牌號，不把0602通配變成任意相容。 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../core.js');
const research = path.join(__dirname, '..', 'data');
const read = name => JSON.parse(fs.readFileSync(path.join(research, `${name}.json`), 'utf8'));
const confirmed = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'confirmed-specs.json'), 'utf8'));
const clone = value => structuredClone(value);
const normalize = (specs = confirmed, inventory = read('product-inventory')) => core.normalize(inventory, read('clamping-data'), read('cutting-data'), specs);
const model = normalize();
const input = { diameter: 20.1, depth: 15, material: 'Carbon Steel', condition: 'Regular cutting', clamping: 'existing_general', generalType: 'hydraulic', gripDiameter: 20 };
const candidate = (model, values = input, id = '00-99121-20') => core.find(model, values).candidates.find(item => item.id === id);
const insert = (candidate, id) => candidate.insertOptions.find(item => item.id === id);
const rule = confirmed.insert_compatibility.rules[0];

test('the verified bundle preserves shank confirmation and declares only the intended manufacturer rules', () => {
  assert.deepEqual(confirmed.series['99121'].shank_diameters_mm, [20, 16, 13]);
  assert.equal(confirmed.insert_compatibility.status, 'verified');
  assert.equal(confirmed.insert_compatibility.source.kind, 'manufacturer_website');
  assert.equal(confirmed.insert_compatibility.source.url, 'https://nine9.jic-tools.com.tw/Inserts-For-99101-121-111-146-151.html');
  assert.equal(confirmed.insert_compatibility.source.checked_date, '2026-11-12');
  assert.equal(model.verifiedInsertRules.length, 2);
  assert.deepEqual(confirmed.insert_compatibility.rules.map(item => [item.part_no_catalog, item.grade_designations]), [
    ['CCFT060204', ['NC2033', 'NC9036']], ['CCFW060204', ['NC2032']]
  ]);
});

test('D20.1 carbon regular automatically uses physical CCFT NC2033 and its own catalog middle values', () => {
  const selected = candidate(model);
  const result = core.calculate(model, selected, { ...input, allowReference: true, prebore: 20 });
  const physical = insert(selected, 'CCFT060204|NC2033');
  assert.equal(physical.exactGeometry, true);
  assert.equal(physical.gradeMatch, true);
  assert.equal(physical.recommended, true);
  assert.equal(physical.matchEvidence, 'manufacturer_series_and_p162_part');
  assert.deepEqual(physical.matchSource, confirmed.insert_compatibility.source);
  assert.equal(selected.cuttingStatus, 'confirmed');
  assert.equal(selected.cuttingRow.id, 'carbon-regular');
  assert.equal(result.insert.id, 'CCFT060204|NC2033');
  assert.equal(result.grade, 'NC2033');
  assert.equal(result.vc, 150);
  assert.equal(result.feed, 0.07);
  assert.equal(result.aeLimit, 0.1);
  assert.ok(Math.abs(result.rpm - 2375.4469118193333) < 1e-9);
  assert.ok(Math.abs(result.feedRate - 166.28128382735335) < 1e-9);
  assert.equal(result.source, 'site_median');
  assert.equal(result.referenceMode, false);
  assert.equal(result.usedCuttingRow.id, 'carbon-regular');
  assert.equal(selected.criteria.material, input.material);
  assert.equal(selected.criteria.condition, input.condition);
  // 刀片證據不會同時核准一般刀柄、伸出或完整組裝。
  assert.equal(selected.depthStatus, 'review');
  assert.equal(selected.clampStatus, 'review');
  assert.equal(selected.status, 'review');
  assert.equal(result.canCopy, false);
  assert.deepEqual(result.errors, []);
});

test('documented 99101 and 99121 choose NC9036 for N and CCFW NC2032 for K', () => {
  for (const id of ['00-99101-20', '00-99121-20']) {
    for (const [material, expected] of [['Non-ferrous metal', 'CCFT060204|NC9036'], ['Cast Iron', 'CCFW060204|NC2032']]) {
      const values = { ...input, material };
      const selected = candidate(model, values, id);
      const result = core.calculate(model, selected, values);
      assert.equal(result.insert.id, expected, `${id}: ${material}`);
      assert.equal(result.insert.exactGeometry, true);
      assert.equal(result.insert.gradeMatch, true);
      assert.equal(result.vc, material === 'Cast Iron' ? 100 : 200);
      assert.equal(result.feed, 0.07);
      assert.equal(result.canCopy, false);
    }
  }
});

test('both verified screw interfaces retain their own bar hardware while using the documented insert', () => {
  for (const [diameter, id, ref, screw] of [
    [9, '00-99121-09', 'cc0602_ns25045', 'NS-25045'],
    [20.1, '00-99121-20', 'cc0602_ns25060', 'NS-25060']
  ]) {
    const values = { ...input, diameter };
    const selected = candidate(model, values, id);
    assert.equal(selected.bar.insertInterface.ref, ref);
    assert.equal(selected.bar.insertInterface.screw_catalog, screw);
    assert.equal(core.calculate(model, selected, values).insert.id, 'CCFT060204|NC2033');
  }
});

test('the same 0602 names on unverified quick-change series retain geometry review', () => {
  const values = { ...input, clamping: 'purchase_holder', holderId: '00-99146-BT40H' };
  for (const id of ['00-99146-2000S', '00-99151-2000W']) {
    const selected = candidate(model, values, id);
    assert.equal(selected.cuttingStatus, 'geometry_review');
    assert.ok(selected.insertOptions.every(item => !item.exactGeometry && !item.recommended), id);
    const result = core.calculate(model, selected, { ...values, insertId: 'CCFT060204|NC2033', allowReference: true });
    assert.equal(result.recommendation, null);
    assert.equal(result.canCopy, false);
    assert.equal(result.rpm, null);
  }
});

test('missing or invalid provenance cannot promote a wildcard match', () => {
  const variants = [
    {}, { series: confirmed.series },
    { ...clone(confirmed), insert_compatibility: null },
    { ...clone(confirmed), insert_compatibility: { ...clone(confirmed.insert_compatibility), status: 'draft' } }
  ];
  for (const source of [null, {}, { ...confirmed.insert_compatibility.source, kind: 'user_confirmation' },
    { ...confirmed.insert_compatibility.source, url: 'https://example.com/Inserts-For-99101-121-111-146-151.html' },
    { ...confirmed.insert_compatibility.source, url: `${confirmed.insert_compatibility.source.url}?unverified=1` }]) {
    variants.push({ ...clone(confirmed), insert_compatibility: { ...clone(confirmed.insert_compatibility), source } });
  }
  for (const specs of variants) {
    const unverified = normalize(specs);
    const selected = candidate(unverified);
    assert.equal(insert(selected, 'CCFT060204|NC2033').exactGeometry, false, JSON.stringify(specs.insert_compatibility));
    assert.equal(selected.cuttingStatus, 'geometry_review');
    assert.equal(core.calculate(unverified, selected, input).recommendation, null);
  }
  const legacy = core.normalize(read('product-inventory'), read('clamping-data'), read('cutting-data'));
  assert.equal(insert(candidate(legacy), 'CCFT060204|NC2033').exactGeometry, false);
});

test('series, interface, part, grade, Ic and S must all match a verified rule and the physical record', () => {
  for (const change of [
    { series: ['99101'] }, { interface_refs: ['cc0602_ns25045'] }, { part_no_catalog: 'CCGH060204' },
    { grade_designations: ['NC2032'] }, { Ic_mm: 6.36 }, { S_mm: 2.4 }, { Ic_mm: '6.35' }, { S_mm: null }
  ]) {
    const specs = clone(confirmed);
    specs.insert_compatibility.rules = [{ ...clone(rule), ...change }];
    const altered = normalize(specs);
    const selected = candidate(altered);
    assert.equal(insert(selected, 'CCFT060204|NC2033').exactGeometry, false, JSON.stringify(change));
    assert.equal(core.calculate(altered, selected, input).recommendation, null);
  }
  for (const [field, value] of [['Ic_mm_catalog', 6.36], ['S_mm_catalog', 2.4]]) {
    const inventory = read('product-inventory');
    const row = inventory.physical_inserts.rows.find(row => row[0] === 'CCFT060204');
    row[inventory.physical_inserts.columns.indexOf(field)] = value;
    const altered = normalize(confirmed, inventory);
    assert.equal(insert(candidate(altered), 'CCFT060204|NC2033').exactGeometry, false, field);
  }
});

test('unconfirmed CCGH and additional grades never become aliases or invented physical products', () => {
  const selected = candidate(model);
  assert.equal(insert(selected, 'CCGH0602U|XP9001').exactGeometry, false);
  assert.ok(!model.inserts.some(item => item.parts === 'CCGH060204'));
  assert.ok(!selected.insertOptions.some(item => item.parts === 'CCGH060204'));
  const specs = clone(confirmed);
  specs.insert_compatibility.rules = [{ ...clone(rule), part_no_catalog: 'CCGH0602U', grade_designations: ['XP9001'] }];
  const unconfirmed = normalize(specs);
  assert.equal(insert(candidate(unconfirmed), 'CCGH0602U|XP9001').exactGeometry, false);

  const inventory = read('product-inventory');
  inventory.physical_inserts.grade_variants.push(['CCFT060204', 'NC30', 'unverified']);
  specs.insert_compatibility.rules = [{ ...clone(rule), grade_designations: ['NC30'] }];
  const unknownGrade = normalize(specs, inventory);
  assert.equal(insert(candidate(unknownGrade), 'CCFT060204|NC30').exactGeometry, false);
});

test('invalid rules are ignored individually without discarding valid manufacturer evidence or changing source data', () => {
  const specs = clone(confirmed);
  specs.insert_compatibility.rules.unshift(null, { ...clone(rule), part_no_catalog: 'CCGH060204' });
  const before = clone(specs);
  const mixed = normalize(specs);
  assert.equal(mixed.verifiedInsertRules.length, 2);
  assert.equal(insert(candidate(mixed), 'CCFT060204|NC2033').exactGeometry, true);
  assert.equal(insert(candidate(mixed), 'CCFW060204|NC2032').exactGeometry, true);
  assert.deepEqual(specs, before);
});

test('a mismatched manual grade or interrupted condition cannot borrow NC2033 regular-cutting values', () => {
  const selected = candidate(model);
  for (const insertId of ['CCFT060204|NC9036', 'CCFW060204|NC2032', 'CCGH0602U|XP9001']) {
    const result = core.calculate(model, selected, { ...input, insertId, allowReference: true });
    assert.equal(result.insert.gradeMatch, false);
    assert.equal(result.recommendation, null, insertId);
    assert.equal(result.rpm, null);
    assert.equal(result.canCopy, false);
  }
  const interruptedInput = { ...input, condition: 'Interrupted cutting' };
  const interrupted = candidate(model, interruptedInput);
  assert.equal(interrupted.cuttingRow.id, 'carbon-interrupted');
  assert.equal(interrupted.cuttingStatus, 'grade_gap');
  const result = core.calculate(model, interrupted, { ...interruptedInput, insertId: 'CCFT060204|NC2033', allowReference: true });
  assert.equal(result.insert.exactGeometry, true);
  assert.equal(result.insert.gradeMatch, false);
  assert.equal(result.referenceMode, false);
  assert.equal(result.recommendation, null);
  assert.equal(result.rpm, null);
  assert.equal(result.canCopy, false);
});
