'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const diagrams = require('../diagrams.js');

const boringBar = { series: '99146', partNo: '00-99146-1000S', minD: 9.87, maxD: 10.12, l1: 25, l: null, shankD: 20, sourcePage: 155, depthKind: 'boringDepth' };

test('exports the same browser and CommonJS API', function () {
  const sandbox = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../diagrams.js'), 'utf8'), sandbox);
  assert.equal(typeof sandbox.NINEBORE_DIAGRAMS.renderSection, 'function');
  assert.equal(typeof sandbox.NINEBORE_DIAGRAMS.renderAssembly, 'function');
  assert.ok(Object.isFrozen(diagrams));
});

test('renders an accessible, self-contained fixed viewBox without a bar', function () {
  const svg = diagrams.renderSection({ diameter: 12, depth: 30 });
  assert.match(svg, /^<svg /);
  assert.match(svg, /viewBox="0 0 450 300"/);
  assert.match(svg, /role="img" aria-label="/);
  assert.match(svg, /<title>.+<\/title><desc>.+<\/desc>/);
  assert.match(svg, /Schematic · Not to scale/);
  assert.match(svg, /D: 12 mm · Depth: 30 mm/);
  assert.match(svg, /data-depth-status="selection-needed"/);
  assert.doesNotMatch(svg, /nb-diagram-cutting-tip|<script|<image|href=|id=/);
  assert.match(svg, /font-size:14px/);
});

test('guards invalid hole numbers without leaking NaN, Infinity or raw markup', function () {
  for (const value of [NaN, Infinity, -Infinity, -1, 0, '', ' ', 'NaN', 'Infinity', '0x10', '<img src=x onerror=alert(1)>', null, {}, []]) {
    const svg = diagrams.renderSection({ diameter: value, depth: value });
    assert.match(svg, /D: not set · Depth: not set/);
    assert.doesNotMatch(svg, /NaN|Infinity|onerror|<img|undefined/);
  }
  assert.match(diagrams.renderSection({ diameter: '10.25', depth: '3e1' }), /D: 10.25 mm · Depth: 30 mm/);
});

test('valid extreme finite numbers remain labels and never change the geometry', function () {
  const svg = diagrams.renderSection({ diameter: Number.MAX_VALUE, depth: Number.MIN_VALUE });
  assert.match(svg, /D: ≈1\.7977e\+308 mm/);
  assert.match(svg, /viewBox="0 0 450 300"/);
  assert.doesNotMatch(svg, /x="Infinity"|y="NaN"|width="NaN"/);
});

test('99146 uses catalog Boring Depth and the quick interface without an adapter', function () {
  const options = { diameter: 10, depth: 25, bar: boringBar, holder: { partNo: '00-99146-BT40H' }, adapter: { partNo: 'WRONG-ADAPTER' } };
  const svg = diagrams.renderSection(options);
  assert.match(svg, /data-depth-kind="boring-depth" data-depth-status="catalog-check"/);
  assert.match(svg, /Catalog L1: 25 mm · Boring Depth/);
  assert.match(svg, /nb-diagram-quick-interface/);
  assert.doesNotMatch(svg, /class="nb-diagram-adapter"/);
  const assembly = diagrams.renderAssembly(options);
  assert.match(assembly, /00-99146-BT40H/);
  assert.doesNotMatch(assembly, /nb-assembly-node--adapter|WRONG-ADAPTER/);
});

test('99151 always includes the separate adapter and does not add lengths to depth', function () {
  const options = {
    diameter: 10,
    depth: 41,
    bar: { ...boringBar, series: '99151', partNo: '00-99151-1000W', l1: 40, l: 110, shankD: 10, sourcePage: 159 },
    holder: { partNo: '00-99146-BT40H', l: 56.3 },
    adapter: { partNo: '00-99151A-10', l: 42, boreD: 10 }
  };
  const svg = diagrams.renderSection(options);
  assert.match(svg, /class="nb-diagram-adapter"/);
  assert.match(svg, /data-depth-status="insufficient"/);
  assert.match(svg, /Catalog L1: 40 mm · Boring Depth/);
  assert.match(svg, /Depth exceeds catalog L1: insufficient/);
  assert.doesNotMatch(svg, /208\.3|152 mm|110 mm|verifiedBoringDepth/);
  const chain = diagrams.renderAssembly(options);
  assert.ok(chain.indexOf('00-99146-BT40H') < chain.indexOf('00-99151A-10'));
  assert.ok(chain.indexOf('00-99151A-10') < chain.indexOf('00-99151-1000W'));
  assert.match(chain, /Match adapter ØD to bar Ød/);
});

test('a missing 99151 adapter remains visible as a pending component', function () {
  const options = { bar: { ...boringBar, series: '99151' } };
  assert.match(diagrams.renderSection(options), /class="nb-diagram-adapter"/);
  assert.match(diagrams.renderAssembly(options), /nb-assembly-node--adapter is-pending/);
  assert.match(diagrams.renderAssembly(options), /99151 adapter: not selected/);
});

test('SB32 retains the external machine-holder requirement from core data', function () {
  const options = { bar: boringBar, holder: { partsNo: '00-99146-SB32H', requiresExternal32: true } };
  for (const markup of [diagrams.renderSection(options), diagrams.renderAssembly(options)]) {
    assert.match(markup, /SB32 requires a separate compatible Ø32 Weldon machine-side holder/);
  }
  assert.match(diagrams.renderAssembly(options), /00-99146-SB32H/);
});

test('99101 and 99121 L1 remain front-neck geometry even if depthKind is misleading', function () {
  for (const series of ['99101', '99121']) {
    const options = { diameter: 10, depth: 20, bar: { ...boringBar, series, l1: 25, depthKind: 'verifiedBoringDepth' } };
    const svg = diagrams.renderSection(options);
    assert.match(svg, /data-depth-kind="front-neck-geometry" data-depth-status="geometry-check"/);
    assert.match(svg, /Front-neck L1: 25 mm · geometry/);
    assert.match(svg, /Usable boring depth needs checking/);
    assert.doesNotMatch(svg, /Boring Depth|verifiedBoringDepth|Requested depth is within catalog L1/);
    const deep = diagrams.renderSection({ ...options, depth: 26 });
    assert.match(deep, /data-depth-status="geometry-insufficient"/);
    assert.match(deep, /Depth exceeds front-neck L1/);
  }
});

test('unknown series and missing L1 never claim verified depth', function () {
  const unknown = diagrams.renderSection({ depth: 10, bar: { series: 'unknown', l1: 30, depthKind: 'verifiedBoringDepth' } });
  assert.match(unknown, /data-depth-kind="unconfirmed" data-depth-status="unconfirmed"/);
  assert.match(unknown, /meaning unconfirmed/);
  for (const value of [NaN, Infinity, -1, 0, null, undefined]) {
    const svg = diagrams.renderSection({ depth: 100, bar: { ...boringBar, l1: value } });
    assert.match(svg, /data-depth-status="unconfirmed"/);
    assert.match(svg, /L1: catalog value unconfirmed/);
    assert.doesNotMatch(svg, /NaN|Infinity|undefined|Requested depth is within catalog L1/);
  }
});

test('all dynamic component and source strings are escaped', function () {
  const malicious = '\"><script>alert("x")</script>&\'';
  const options = {
    diameter: malicious,
    depth: malicious,
    bar: { ...boringBar, series: malicious, partNo: malicious, sourcePage: malicious },
    holder: { partNo: malicious },
    adapter: { partNo: malicious }
  };
  const svg = diagrams.renderSection(options);
  const chain = diagrams.renderAssembly({ ...options, bar: { ...options.bar, series: '99151' } });
  for (const markup of [svg, chain]) {
    assert.doesNotMatch(markup, /<script>|<\/script>|alert\("x"\)/);
    assert.match(markup, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;&amp;&#39;/);
  }
  assert.match(svg, /D: not set · Depth: not set/);
});

test('renderers accept omitted and null options', function () {
  for (const value of [undefined, null, {}, { bar: null }, { bar: {} }]) {
    assert.match(diagrams.renderSection(value), /^<svg /);
    assert.match(diagrams.renderAssembly(value), /Select a bar to show the assembly chain/);
  }
});

test('all default diagram, ARIA and assembly copy is English', function () {
  for (const series of [null, '99101', '99121', '99146', '99151', 'unknown']) {
    const options = { diameter: 10, depth: 30, bar: series ? { ...boringBar, series } : null };
    assert.doesNotMatch(diagrams.renderSection(options), /[\u3400-\u9fff]/);
    assert.doesNotMatch(diagrams.renderAssembly(options), /[\u3400-\u9fff]/);
  }
});

test('SVG has no outside frame and status notes fit in two short lines', function () {
  const options = [
    {},
    { bar: { ...boringBar, l1: null } },
    { depth: 25, bar: boringBar },
    { depth: 26, bar: boringBar },
    { bar: boringBar },
    { depth: 20, bar: { ...boringBar, series: '99101' } },
    { depth: 26, bar: { ...boringBar, series: '99121' } },
    { bar: { ...boringBar, series: 'unknown' } }
  ];
  for (const input of options) {
    const svg = diagrams.renderSection(input);
    assert.doesNotMatch(svg, /stroke="#d8e9f3"|rx="12"|width="449"/);
    const note = svg.match(/<text class="nb-diagram-note"[^>]*>(.*?)<\/text>/)[1];
    const lines = [...note.matchAll(/<tspan x="16" dy="(0|16)">([^<]*)<\/tspan>/g)];
    assert.ok(lines.length >= 1 && lines.length <= 2);
    assert.ok(lines.every(function (line) { return line[2].length <= 45; }));
  }
});
