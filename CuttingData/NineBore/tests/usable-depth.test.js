/* 99101／99121 的 L1 可加工深度已確認，包含等於 L1 的邊界；夾持要求獨立保留。 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../core.js');
const diagrams = require('../diagrams.js');
const locale = require('../locale.zh-TW.js');
const ui = require('../locale.ui.js');
const root = path.join(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', `${name}.json`), 'utf8'));
const confirmed = JSON.parse(fs.readFileSync(path.join(root, 'confirmed-specs.json'), 'utf8'));
const normalize = specs => core.normalize(read('product-inventory'), read('clamping-data'), read('cutting-data'), specs);
const model = normalize(confirmed);
const legacy = normalize();
const straight = current => current.bars.filter(bar => ['99101', '99121'].includes(bar.series));
const inputFor = (bar, depth = bar.l1) => ({
  diameter: bar.nominalD, depth, material: 'Non-ferrous metal', condition: 'Regular cutting',
  clamping: 'existing_general', generalType: 'hydraulic', gripDiameter: 20
});
const selectedFor = (current, bar, depth = bar.l1) => core.find(current, inputFor(bar, depth)).candidates.find(item => item.id === bar.id);

test('all 40 actual straight bars retain catalog dimensions and gain only confirmed L1 depth semantics', () => {
  const bars = straight(model);
  assert.equal(bars.length, 40);
  assert.equal(model.bars.length, 167);
  assert.deepEqual(model.bars.map(bar => bar.id), legacy.bars.map(bar => bar.id));
  assert.deepEqual(model.sourceInventory, legacy.sourceInventory);
  for (const bar of bars) {
    const original = legacy.bars.find(item => item.id === bar.id);
    assert.equal(bar.depthKind, 'confirmed_boring_depth');
    assert.deepEqual(bar.depthDefinitionSource, confirmed.usable_depth.source);
    assert.equal(bar.depthDefinitionSource.kind, 'user_confirmation');
    assert.equal(bar.l1, original.l1);
    assert.equal(bar.l, original.l);
    assert.equal(bar.minD, original.minD);
    assert.equal(bar.maxD, original.maxD);
    assert.deepEqual(bar.raw, original.raw);
    assert.equal(original.depthKind, 'front_neck');
    assert.equal(original.depthDefinitionSource, null);
  }
});

test('each straight bar accepts exactly its own L1 and rejects a larger requested depth', () => {
  for (const bar of straight(model)) {
    const atLimit = selectedFor(model, bar);
    assert.ok(atLimit, `${bar.id}: L1 ${bar.l1}`);
    assert.equal(atLimit.depthStatus, 'confirmed');
    assert.ok(!atLimit.reviewNotes.some(note => /front-neck geometry|Confirm actual projection/i.test(note)));
    assert.ok(!core.calculate(model, atLimit, inputFor(bar)).errors.some(error => error.includes('exceeds this bar')));
    assert.equal(selectedFor(model, bar, bar.l1 + 0.01), undefined);
    const tooDeep = core.calculate(model, atLimit, inputFor(bar, bar.l1 + 0.01));
    assert.ok(tooDeep.errors.includes(`Boring depth exceeds this bar's listed L1 of ${bar.l1} mm.`));
    assert.equal(tooDeep.canCopy, false);
  }
  const bar = model.bars.find(item => item.id === '00-99121-05');
  assert.equal(bar.l1, 15);
  assert.equal(selectedFor(model, bar, 15).depthStatus, 'confirmed');
  const missing = selectedFor(model, bar, '');
  assert.equal(missing.depthStatus, 'review');
  assert.ok(missing.criteria.missingFields.includes('depth'));
});

test('missing or invalid depth confirmation preserves legacy geometry-only behavior', () => {
  const mutations = [
    specs => { delete specs.usable_depth; },
    specs => { specs.usable_depth.status = 'review'; },
    specs => { specs.usable_depth.source = null; },
    specs => { specs.usable_depth.source.kind = 'catalog'; },
    specs => { specs.usable_depth.dimension = 'L'; },
    specs => { specs.usable_depth.includes_limit = false; },
    specs => { specs.usable_depth.series = null; },
    specs => { specs.usable_depth.series = ['99101', '99151']; }
  ];
  for (const mutate of mutations) {
    const specs = structuredClone(confirmed);
    mutate(specs);
    const current = normalize(specs);
    for (const id of ['00-99101-08', '00-99121-08']) {
      const bar = current.bars.find(item => item.id === id);
      assert.equal(bar.depthKind, 'front_neck');
      assert.equal(bar.depthDefinitionSource, null);
      const selected = selectedFor(current, bar);
      assert.equal(selected.depthStatus, 'review');
      assert.ok(selected.reviewNotes.some(note => note.includes('front-neck geometry')));
    }
  }
  for (const bar of straight(legacy)) assert.equal(selectedFor(legacy, bar).depthStatus, 'review');
});

test('usable depth confirmation does not approve straight clamping or alter quick/deep-hole assembly limits', () => {
  for (const id of ['00-99101-08', '00-99121-08']) {
    const bar = model.bars.find(item => item.id === id);
    const selected = selectedFor(model, bar);
    assert.equal(selected.depthStatus, 'confirmed');
    assert.equal(selected.clampStatus, 'review');
    assert.equal(selected.status, 'review');
    assert.ok(selected.reviewNotes.some(note => note.includes('minimum effective clamping length')));
    assert.equal(core.calculate(model, selected, inputFor(bar)).canCopy, false);
    const noGrip = { ...inputFor(bar), gripDiameter: '' };
    const unselected = core.find(model, noGrip).candidates.find(item => item.id === id);
    assert.equal(unselected.shankStatus, 'unselected');
    assert.equal(unselected.depthStatus, 'confirmed');
    assert.equal(unselected.clampStatus, 'review');
  }
  for (const bar of model.bars.filter(item => ['99146', '99151'].includes(item.series))) {
    const original = legacy.bars.find(item => item.id === bar.id);
    assert.equal(bar.depthKind, original.depthKind);
    assert.equal(bar.depthDefinitionSource, null);
  }
  const deepInput = { diameter: 8, depth: 32, material: 'Non-ferrous metal', condition: 'Regular cutting', clamping: 'purchase_holder', holderId: '00-99146-BT40H' };
  const deep = core.find(model, deepInput).candidates.find(item => item.id === '00-99151-0800W');
  assert.ok(deep.reviewNotes.some(note => note.includes('actual insertion into the adapter')));
  assert.equal(deep.status, 'review');
  assert.equal(core.calculate(model, deep, deepInput).canCopy, false);
});

test('normalized schematic and Chinese labels show confirmed depth while no-evidence drawings stay geometric', () => {
  for (const id of ['00-99101-08', '00-99121-05']) {
    const bar = model.bars.find(item => item.id === id);
    const svg = diagrams.renderSection({ bar, diameter: bar.nominalD, depth: bar.l1 });
    assert.match(svg, /data-depth-kind="confirmed-boring-depth" data-depth-status="confirmed-depth"/);
    assert.ok(svg.includes('L1 is confirmed as usable boring depth, including its stated limit.'));
    assert.ok(svg.includes('Requested depth is within confirmed L1.'));
    assert.ok(!svg.includes('Usable boring depth needs checking.'));
    const translated = locale.translateMarkup(svg);
    assert.match(translated, /data-depth-kind="confirmed-boring-depth" data-depth-status="confirmed-depth"/);
    assert.ok(translated.includes('L1 已確認為可加工深度，包含標示的最大深度。'));
    assert.ok(translated.includes('需求深度符合已確認的 L1 可加工深度。'));
    const over = diagrams.renderSection({ bar, diameter: bar.nominalD, depth: bar.l1 + 0.01 });
    assert.match(over, /data-depth-status="insufficient"/);
    assert.ok(over.includes('Depth exceeds confirmed L1.'));
    const missing = diagrams.renderSection({ bar, diameter: bar.nominalD });
    assert.match(missing, /data-depth-status="need-depth"/);
    const noEvidence = diagrams.renderSection({ bar: { ...bar, depthDefinitionSource: null }, depth: bar.l1 });
    assert.match(noEvidence, /data-depth-kind="front-neck-geometry" data-depth-status="geometry-check"/);
    assert.ok(noEvidence.includes('L1 is front-neck geometry, not a verified boring depth.'));
  }
  assert.equal(ui.translate('Usable boring depth L1'), '可加工深度 L1');
  const copyLabel = ui.translate('L1 15 mm (confirmed_boring_depth)');
  assert.ok(copyLabel.includes('15 mm'));
  assert.ok(copyLabel.includes('已確認可加工深度'));
});
