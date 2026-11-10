const test = require('node:test');
const assert = require('node:assert/strict');
const { renderSection } = require('../diagrams.js');
const data = require('../data.json');
const core = require('../core.js');

test('all four catalog geometries retain their own widths, Tmax and Re', () => {
  for (const insert of data.inserts) {
    const svg = renderSection({ insert, diameter: insert.WmaxMm });
    assert.match(svg, new RegExp(insert.id));
    assert.match(svg, new RegExp(`Required spot D Ø${insert.WmaxMm} mm`));
    assert.match(svg, new RegExp(`Wmin ${insert.WminMm} mm`));
    assert.match(svg, new RegExp(`Wmax ${insert.WmaxMm} mm`));
    assert.match(svg, /Catalog Tmax/);
    assert.match(svg, new RegExp(`>${insert.TmaxMm} mm<`));
    assert.match(svg, new RegExp(`>${insert.ReMm} mm<`));
    assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
  }
});

test('straight nominal faces preserve the selected included angle with equal X/Z scaling', () => {
  for (const insert of data.inserts) {
    const svg = renderSection({ insert, diameter: .5 });
    const edge = svg.match(/class="ms-tool-edge" d="M([\d.]+) ([\d.]+)L([\d.]+) ([\d.]+)/);
    assert.ok(edge);
    const [x1, y1, x2, y2] = edge.slice(1).map(Number);
    const drawnAngle = 2 * Math.atan((x2 - x1) / (y2 - y1)) * 180 / Math.PI;
    assert.ok(Math.abs(drawnAngle - insert.includedAngleDeg) < .001);
  }
});

test('120-degree catalog endpoint remains a nominal width selection, not a calculated depth', () => {
  const insert = data.inserts.find(item => item.includedAngleDeg === 120);
  const svg = renderSection({ insert, diameter: 2.53 });
  assert.match(svg, /Required spot D Ø2.53 mm/);
  assert.doesNotMatch(svg, /outside this range/);
  assert.match(svg, /not a programmed Z value/);
  assert.match(svg, /No programmed Z or actual cutting depth is calculated/);
  assert.match(svg, /Re transition not reconstructed/);
});

test('nominal minimum is explicitly conditional rather than a positive-depth promise', () => {
  const insert = data.inserts[0];
  const svg = renderSection({ insert, diameter: insert.WminMm });
  assert.match(svg, /Nominal lower bound: positive cutting depth is unconfirmed/);
  assert.doesNotMatch(svg, /Z target|Depth target|t =|Z =/);
});

test('out-of-range or non-finite target D retains catalog diagram without invalid SVG coordinates', () => {
  for (const diameter of [0, -1, 3, NaN, Infinity, undefined, '<script>']) {
    const svg = renderSection({ insert: data.inserts[0], diameter });
    assert.match(svg, /outside this range|Enter a positive spot diameter D/);
    assert.match(svg, /Wmax 1.1 mm/);
    assert.doesNotMatch(svg, /NaN|Infinity|undefined|<script>/);
  }
});

test('dynamic model text is escaped and cannot enter SVG markup or IDs', () => {
  const insert = { ...data.inserts[0], id: 'X060"><script>alert(1)</script>' };
  const svg = renderSection({ insert, diameter: .5 });
  assert.match(svg, /X060&quot;&gt;&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(svg, /<script>|id="[^"]*<|aria-labelledby="[^"]*</);
});

test('missing or invalid catalog geometry yields an accessible selection prompt', () => {
  for (const insert of [undefined, {}, { ...data.inserts[0], WmaxMm: Infinity }, { ...data.inserts[0], includedAngleDeg: 180 }]) {
    const svg = renderSection({ insert, diameter: .5 });
    assert.match(svg, /role="img"/);
    assert.match(svg, /<title[^>]*>Micro spotting section unavailable/);
    assert.match(svg, /<desc/);
    assert.match(svg, /Select a Micro insert/);
    assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
  }
});

test('nominal geometry shows the current work-surface diameter, short-flat depth and negative Z', () => {
  const insert = data.inserts[0];
  const geometry = core.calculateGeometry(data, { insert: insert.id, diameter: .5 });
  const svg = renderSection({ insert, diameter: .5, geometry });
  assert.match(svg, /Work surface · Z0/);
  assert.match(svg, /D Ø0.5 mm/);
  assert.match(svg, /NOMINAL MODEL/);
  assert.match(svg, /Depth t 0.2 mm/);
  assert.match(svg, /Z -0.2 mm/);
  assert.match(svg, /Nominal flat Wmin 0.1 mm/);
  assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
});

test('measured datum shifts the Z dimension without moving the nominal flat or changing the face angle', () => {
  const insert = data.inserts[0];
  const nominal = core.calculateGeometry(data, { insert: insert.id, diameter: .9 });
  const measured = core.calculateGeometry(data, { insert: insert.id, diameter: .9, geometryMode: 'measured', referenceDiameter: .5, referenceDepth: .18 });
  const baseline = renderSection({ insert, diameter: .9, geometry: nominal });
  const svg = renderSection({ insert, diameter: .9, geometry: measured });
  assert.match(svg, /MEASURED REFERENCE/);
  assert.match(svg, /Z -0.38 mm/);
  assert.match(svg, /Depth t 0.38 mm/);
  assert.match(svg, /measured tool-length datum is an independent plane/);
  const flatPath = value => value.match(/class="ms-nominal-flat" d="([^"]+)"/)[1];
  const toolPath = value => value.match(/class="ms-tool-edge" d="([^"]+)"/)[1];
  assert.equal(flatPath(svg), flatPath(baseline));
  assert.equal(toolPath(svg), toolPath(baseline));
  const datumY = Number(svg.match(/class="ms-depth-dimension" d="M430 165V([\d.]+)"/)[1]);
  const flatY = Number(svg.match(/class="ms-nominal-flat" d="M[\d.]+ ([\d.]+)H/)[1]);
  assert.ok(datumY < flatY);
});

test('catalog rounding mismatch keeps the nominal profile but does not display computedZ as a usable target', () => {
  const insert = data.inserts.find(item => item.includedAngleDeg === 120);
  const geometry = core.calculateGeometry(data, { insert: insert.id, diameter: 2.53 });
  const svg = renderSection({ insert, diameter: 2.53, geometry });
  assert.equal(geometry.valid, false);
  assert.equal(geometry.status, 'nominal-only');
  assert.match(svg, /D Ø2.53 mm/);
  assert.match(svg, /Z unavailable/);
  assert.doesNotMatch(svg, /class="ms-depth-dimension"|Z -0.7015 mm/);
  assert.match(svg, /Catalog Tmax 0.7 mm/);
});

test('zero nominal depth keeps the work-surface illustration with no usable Z target', () => {
  const insert = data.inserts[0];
  const geometry = core.calculateGeometry(data, { insert: insert.id, diameter: .1 });
  const svg = renderSection({ insert, diameter: .1, geometry });
  assert.match(svg, /Work surface · Z0/);
  assert.match(svg, /Z unavailable/);
  assert.doesNotMatch(svg, /class="ms-depth-dimension"|Z 0 mm/);
});

test('a very small positive depth is not rounded into a zero Z label', () => {
  const insert = data.inserts[0];
  const geometry = core.calculateGeometry(data, { insert: insert.id, diameter: .1001 });
  const svg = renderSection({ insert, diameter: .1001, geometry });
  assert.equal(geometry.valid, true);
  assert.match(svg, /Z -0.00005 mm/);
  assert.doesNotMatch(svg, /Z 0 mm/);
});

test('invalid geometry explains the actual error and escapes untrusted error text', () => {
  const insert = data.inserts[0];
  const geometry = core.calculateGeometry(data, { insert: insert.id, diameter: 2 });
  geometry.errors.push('<script>alert(1)</script>');
  const svg = renderSection({ insert, diameter: 2, geometry });
  assert.match(svg, /Depth section unavailable/);
  assert.match(svg, /Z unavailable/);
  assert.match(svg, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(svg, /<script>|NaN|Infinity|undefined/);
});
