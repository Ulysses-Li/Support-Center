const test = require('node:test');
const assert = require('node:assert/strict');
const { formIcon, renderSection } = require('../diagrams.js');
const data = require('../../i-center-plan/research-data.json');
const inventory = data.insert_inventory.items;
const item = family => inventory.find(insert => insert.family === family);

test('form icons distinguish straight, protected and curved profiles with accessible names', () => {
  const icons = Object.fromEntries(['A', 'AB', 'R', 'ANSI'].map(form => [form, formIcon(form)]));
  for (const svg of Object.values(icons)) {
    assert.match(svg, /role="img"/);
    assert.match(svg, /<title>/);
    assert.match(svg, /<desc>/);
    assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
  }
  assert.match(icons.AB, /120° outer protective/);
  assert.doesNotMatch(icons.A, /120°/);
  assert.doesNotMatch(icons.R, /120°/);
  assert.match(icons.R, /Q/);
  assert.match(icons.ANSI, /ANSI number sizes/);
  assert.notEqual(icons.A, icons.AB);
  assert.notEqual(icons.A, icons.R);
});

test('all 51 cutting inserts show their unchanged catalog d/L/R values and correct family', () => {
  for (const insert of inventory) {
    const result = renderSection({ insert, depth: 3 });
    assert.match(result, /Catalog profile · schematic · not to scale/);
    for (const key of ['d1', 'd2', 'd3', 'L1', 'L2', 'L3', 'R']) {
      if (typeof insert.dimensions[key] !== 'number') continue;
      assert.match(result, new RegExp(`>${insert.dimensions[key]} mm<`));
    }
    assert.match(result, /Manual depth 3 mm · Z -3 mm/);
    assert.doesNotMatch(result, /NaN|Infinity|undefined/);
  }
});

test('DIN A does not become a protected Form B because its insert table contains d3/L3', () => {
  const result = renderSection({ insert: item('DIN332 Form A'), form: 'A' });
  assert.match(result, /60° bearing cone/);
  assert.match(result, /d3 · insert geometry/);
  assert.match(result, /L3 · insert geometry/);
  assert.doesNotMatch(result, /120° guard|120° outer protective/);
});

test('Form A+B main cone and protective countersink are separately labeled', () => {
  const insert = item('DIN332 Form A+B');
  const result = renderSection({ insert, form: 'AB', depth: 2.5 });
  assert.match(result, /60° main bearing cone/);
  assert.match(result, /120° guard/);
  assert.match(result, /d3/);
  assert.match(result, /L3/);
  assert.match(result, /actual insert tip was touched off at work surface Z0/);
  assert.match(result, /does not determine or verify the formed profile/);
});

test('Form R uses an arc concept without treating the drill-point 120-degree annotation as the bearing angle', () => {
  const result = renderSection({ insert: item('DIN332 Form R'), form: 'R' });
  assert.match(result, /Curved bearing surface/);
  assert.match(result, /R is a radius, not a constant cone angle/);
  assert.match(result, /class="icd-profile" data-form="R" d="[^"]*Q/);
  assert.doesNotMatch(result, /120°|60° main|120° guard/);
});

test('ANSI preserves independent size labels and printed inch values without converting over catalog mm', () => {
  const insert = inventory.find(row => row.family === 'ANSI 60°' && row.size_designation === '#10');
  const result = renderSection({ insert, form: 'ANSI' });
  assert.match(result, /ANSI 60° #10/);
  assert.match(result, /d2 0.98″/);
  assert.match(result, />25 mm</);
  assert.match(result, /separate from DIN metric Form A/);
  assert.doesNotMatch(result, /24.892/);
});

test('AB d3 catalog deviations remain visible instead of substituting DIN standard dimensions', () => {
  const insert = inventory.find(row => row.family === 'DIN332 Form A+B' && row.dimensions.d1 === 8);
  const result = renderSection({ insert, form: 'AB' });
  assert.match(result, />20 mm</);
  assert.match(result, /d3 differs from the DIN332 center-hole standard/);
  assert.doesNotMatch(result, />22.4 mm</);
});

test('Z comes only from the manually entered positive depth and is absent for missing/invalid values', () => {
  const insert = item('DIN332 Form A+B');
  for (const depth of [undefined, '', 0, -2, NaN, Infinity, '<script>']) {
    const result = renderSection({ insert, depth });
    assert.match(result, /No depth is derived from d1, L1, L2 or L3/);
    assert.doesNotMatch(result, /Manual depth|Z 0 mm|NaN|Infinity|undefined|<script>/);
  }
  const result = renderSection({ insert, depth: .00005 });
  assert.match(result, /Manual depth 0.00005 mm · Z -0.00005 mm/);
});

test('unknown forms, measuring masters and mismatched forms show an accessible explanation', () => {
  for (const result of [formIcon('unknown'), renderSection({}), renderSection({ insert: data.insert_inventory.measuring_masters[0], form: 'A' }), renderSection({ insert: item('DIN332 Form R'), form: 'AB' }), renderSection({ insert: { ...item('DIN332 Form A'), dimensions: { d1: Infinity, d2: 4 } } }), renderSection({ insert: { ...item('DIN332 Form R'), dimensions: { d1: 1, d2: 2.12, R: Infinity } } })]) {
    assert.match(result, /role="img"/);
    assert.doesNotMatch(result, /NaN|Infinity|undefined/);
  }
  assert.match(renderSection({ insert: item('DIN332 Form R'), form: 'AB' }), /This insert belongs to DIN332 Form R/);
});

test('dynamic model, inch and source strings cannot inject HTML or SVG', () => {
  const base = item('ANSI 60°');
  const insert = { ...base, id: '"><script>alert(1)</script>', parts_no: '<img src=x onerror=alert(1)>', source: { printed_page: '<script>x</script>' }, inch_dimensions_catalog: { d1: '<svg onload=alert(1)>' } };
  const result = renderSection({ insert, form: 'ANSI', depth: 2 });
  assert.match(result, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.match(result, /&lt;svg onload=alert\(1\)&gt;/);
  assert.doesNotMatch(result, /<script>|<img src=x|<svg onload|id="[^"]*</);
});
