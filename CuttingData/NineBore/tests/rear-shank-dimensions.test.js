/* 99121 後柄實體長度隨已選柄徑連動；不得因此改寫型錄 L／L1 或升級夾持與深度狀態。 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../core.js');
const diagram = require('../catalog-diagram.js');
const root = path.join(__dirname, '..');
const read = name => JSON.parse(fs.readFileSync(path.join(root, 'data', `${name}.json`), 'utf8'));
const confirmed = JSON.parse(fs.readFileSync(path.join(root, 'confirmed-specs.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets', 'line-drawings', 'manifest.json'), 'utf8'));
const normalize = (specs = confirmed, inventory = read('product-inventory')) => core.normalize(inventory, read('clamping-data'), read('cutting-data'), specs);
const model = normalize();
const expectedLengths = { 13: 48, 16: 48, 20: 50 };
const inputFor = (bar, gripDiameter) => ({
  diameter: bar.nominalD, depth: Math.min(bar.l1, 10), material: 'Non-ferrous metal', condition: 'Regular cutting',
  clamping: 'existing_general', generalType: 'hydraulic', gripDiameter
});
const choose = (current, bar, gripDiameter) => core.find(current, inputFor(bar, gripDiameter)).candidates.find(item => item.id === bar.id);
const dimensionTexts = (svg, field) => [...svg.matchAll(new RegExp(`<g data-dimension="${field}">[\\s\\S]*?<text\\b[^>]*>([\\s\\S]*?)<\\/text><\\/g>`, 'g'))].map(match => match[1]);

test('all 21 catalog 99121 parts map three confirmed rear shanks without new SKUs or changed L/L1', () => {
  const inventory = read('product-inventory');
  const before = structuredClone(inventory);
  const current = normalize(confirmed, inventory);
  const legacy = core.normalize(inventory, read('clamping-data'), read('cutting-data'));
  const bars = current.bars.filter(bar => bar.series === '99121');
  assert.equal(bars.length, 21);
  assert.equal(current.bars.length, 167);
  assert.deepEqual(current.bars.map(bar => bar.id), legacy.bars.map(bar => bar.id));
  for (const bar of bars) {
    const original = legacy.bars.find(item => item.id === bar.id);
    assert.deepEqual(bar.rearShankLengths, expectedLengths);
    assert.deepEqual(bar.raw, original.raw);
    assert.equal(bar.l, bar.raw.L_mm_catalog);
    assert.equal(bar.l1, bar.raw.L1_mm_catalog);
    assert.equal(bar.l, original.l);
    assert.equal(bar.l1, original.l1);
    for (const [diameter, length] of Object.entries(expectedLengths)) {
      const selected = choose(current, bar, Number(diameter));
      assert.ok(selected, `${bar.id}: Ø${diameter}`);
      assert.equal(selected.selectedShankD, Number(diameter));
      assert.equal(selected.selectedRearShankL, length);
      assert.equal(selected.bar.id, bar.id);
      assert.equal(selected.bar.l, original.l);
      assert.equal(selected.bar.l1, original.l1);
    }
  }
  assert.deepEqual(inventory, before);
});

test('missing or invalid confirmation never invents a rear-shank length mapping', () => {
  const mutations = [
    specs => { delete specs.series['99121'].rear_shank_dimensions; },
    specs => { specs.series['99121'].rear_shank_dimensions.status = 'review'; },
    specs => { specs.series['99121'].rear_shank_dimensions.source = null; },
    specs => { specs.series['99121'].rear_shank_dimensions.source.kind = 'catalog'; },
    specs => { specs.series['99121'].rear_shank_dimensions.catalog_L_L1_unchanged = false; },
    specs => { specs.series['99121'].rear_shank_dimensions.lengths_by_diameter_mm = null; },
    specs => { specs.series['99121'].rear_shank_dimensions.lengths_by_diameter_mm = [48, 48, 50]; },
    specs => { specs.series['99121'].rear_shank_dimensions.lengths_by_diameter_mm = { 13: '48', 16: 0, 20: -50 }; },
    specs => { specs.series['99121'].rear_shank_dimensions.lengths_by_diameter_mm = { 50: 48 }; },
    specs => { specs.series['99121'].status = 'review'; }
  ];
  for (const mutate of mutations) {
    const specs = structuredClone(confirmed);
    mutate(specs);
    const current = normalize(specs);
    const bar = current.bars.find(item => item.id === '00-99121-08');
    assert.deepEqual(bar.rearShankLengths, {});
    const selected = choose(current, bar, 20);
    assert.ok(selected);
    assert.equal(selected.selectedRearShankL, null);
    assert.equal(bar.l, 63);
    assert.equal(bar.l1, 24);
  }
});

test('unselected, unsupported or unmapped shanks never pick a rear-shank length automatically', () => {
  const bar = model.bars.find(item => item.id === '00-99121-08');
  for (const gripDiameter of [undefined, null, '']) {
    const selected = choose(model, bar, gripDiameter);
    assert.ok(selected);
    assert.equal(selected.selectedShankD, null);
    assert.equal(selected.selectedRearShankL, null);
    assert.equal(selected.shankStatus, 'unselected');
  }
  assert.ok(!core.find(model, inputFor(bar, 50)).candidates.some(item => item.id === bar.id));
  const specs = structuredClone(confirmed);
  specs.series['99121'].rear_shank_dimensions.lengths_by_diameter_mm = { 13: 48 };
  const partial = normalize(specs);
  const selected = choose(partial, partial.bars.find(item => item.id === bar.id), 16);
  assert.equal(selected.selectedShankD, 16);
  assert.equal(selected.selectedRearShankL, null);
  assert.deepEqual(selected.bar.rearShankLengths, { 13: 48 });
});

test('real 99121 SVG shows selected 48/50 mm rear length and bilingual accessible descriptions', () => {
  const drawing = manifest.drawings.find(item => item.key === '99121');
  const before = structuredClone(drawing);
  const bar = model.bars.find(item => item.id === '00-99121-08');
  for (const [diameter, length] of Object.entries(expectedLengths)) {
    const selected = choose(model, bar, Number(diameter));
    for (const language of ['zh-TW', 'en']) {
      const svg = diagram.render({ drawing, partLabel: bar.id, language, dimensions: {
        diameter: bar.nominalD, l1: bar.l1, l: bar.l, shankD: selected.selectedShankD, rearShankL: selected.selectedRearShankL
      } });
      assert.deepEqual(dimensionTexts(svg, 'rearShankL'), [`${length} mm`]);
      assert.deepEqual(dimensionTexts(svg, 'l1'), ['24 mm']);
      assert.deepEqual(dimensionTexts(svg, 'l'), ['63 mm']);
      assert.deepEqual(dimensionTexts(svg, 'shankD'), [`Ø${diameter} mm`]);
      const accessible = `${language === 'en' ? 'Rear shank length' : '後柄長度'}: ${length} mm`;
      assert.ok(svg.includes(`aria-label="${bar.id}`));
      assert.ok(svg.includes(accessible));
      assert.ok(svg.includes('<desc>'));
      assert.ok(!svg.includes('50 (48) mm'));
    }
  }
  const unselected = diagram.render({ drawing, dimensions: { rearShankL: null }, language: 'en' });
  assert.deepEqual(dimensionTexts(unselected, 'rearShankL'), ['—']);
  assert.ok(unselected.includes('Rear shank length: —'));
  assert.deepEqual(drawing, before);
});

test('rear-shank selection replaces only the 99121 50(48) label and leaves all other drawing constants intact', () => {
  const dimensions = { diameter: 8, l1: 24, l: 63, shankD: 20, shoulderD: 8, holderD: 20, holderL: 30, thread: 'M8' };
  for (const drawing of manifest.drawings) {
    const initial = diagram.render({ drawing, dimensions, language: 'en' });
    const selected = diagram.render({ drawing, dimensions: { ...dimensions, rearShankL: 48 }, language: 'en' });
    if (drawing.key !== '99121') {
      assert.equal(selected, initial, drawing.key);
      continue;
    }
    assert.ok(dimensionTexts(initial, 'constant').includes('50 (48) mm'));
    const constants = dimensionTexts(initial, 'constant').filter(value => value !== '50 (48) mm');
    assert.ok(constants.includes('27 mm'));
    assert.ok(constants.includes('MAX Ø30 mm') || constants.includes('MAX 30 mm'));
    assert.deepEqual(dimensionTexts(selected, 'constant'), constants);
    assert.deepEqual(dimensionTexts(selected, 'rearShankL'), ['48 mm']);
  }
  assert.ok(model.bars.filter(bar => bar.series !== '99121').every(bar => Object.keys(bar.rearShankLengths).length === 0));
});

test('confirmed rear physical length does not approve minimum clamping length or the complete assembly', () => {
  const bar = model.bars.find(item => item.id === '00-99121-08');
  for (const diameter of [13, 16, 20]) {
    const values = inputFor(bar, diameter);
    const selected = choose(model, bar, diameter);
    const result = core.calculate(model, selected, values);
    assert.equal(selected.selectedRearShankL, expectedLengths[diameter]);
    assert.equal(selected.shankStatus, 'confirmed');
    assert.equal(selected.depthStatus, 'confirmed');
    assert.equal(selected.clampStatus, 'review');
    assert.equal(selected.status, 'review');
    assert.ok(selected.reviewNotes.some(message => message.includes('minimum effective clamping length')));
    assert.ok(!selected.reviewNotes.some(message => message.includes('front-neck geometry')));
    assert.equal(result.canCopy, false);
    assert.equal(result.depth, values.depth);
  }
});

test('standard Ø20 ordering metadata requires explicit requests for Ø13/Ø16 without choosing the actual clamping diameter', () => {
  assert.equal(model.shankOrdering.status, 'confirmed');
  assert.equal(model.shankOrdering.standard_shank_diameter_mm, 20);
  assert.deepEqual(model.shankOrdering.explicit_request_shank_diameters_mm, [13, 16]);
  assert.equal(model.shankOrdering.source.kind, 'user_confirmation');
  assert.deepEqual(model.shankOrdering.source, confirmed.series['99121'].ordering.source);
  const bar = model.bars.find(item => item.id === '00-99121-08');
  const values = inputFor(bar, undefined);
  const selected = choose(model, bar, undefined);
  assert.equal(selected.selectedShankD, null);
  assert.equal(selected.selectedRearShankL, null);
  assert.equal(selected.shankStatus, 'unselected');
  assert.equal(selected.depthStatus, 'confirmed');
  assert.equal(selected.clampStatus, 'review');
  assert.equal(selected.status, 'review');
  assert.ok(selected.criteria.missingFields.includes('gripDiameter'));
  assert.ok(selected.reviewNotes.some(message => message.includes('minimum effective clamping length')));
  assert.equal(core.calculate(model, selected, values).canCopy, false);
  for (const mutate of [
    specs => { delete specs.series['99121'].ordering; },
    specs => { specs.series['99121'].ordering.status = 'review'; },
    specs => { specs.series['99121'].ordering.source = null; },
    specs => { specs.series['99121'].ordering.source.kind = 'catalog'; }
  ]) {
    const specs = structuredClone(confirmed);
    mutate(specs);
    assert.equal(normalize(specs).shankOrdering, null);
  }
});
