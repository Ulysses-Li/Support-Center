/* 原圖數字覆蓋契約：不猜缺漏尺寸，不接受外部影像路徑或可注入的 SVG 資料。 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const diagram = require('../catalog-diagram.js');
const core = require('../core.js');
const catalogDrawings = require('../catalog-drawings.js');
const vectorKeys = new Set(['99151_d6', '99151_d8', '99151_d10', '99151_d11_WS', '99151_1500W', '99151_1600_2000W']);
const overlay = (field, overrides = {}) => ({ field, box: { x: 100, y: 100, width: 240, height: 80 }, x: 220, y: 140, font_size: 46, rotate: 0, fill: '#fff', ...overrides });
const drawing = (overrides = {}) => ({ file: '99121-bar.png', width_px: 1751, height_px: 605, overlay_labels: [overlay('diameter'), overlay('l1'), overlay('shankD')], ...overrides });
const render = overrides => diagram.render({ drawing: drawing(), dimensions: { diameter: 8, l1: 24, shankD: 20 }, partLabel: '00-99121-08', language: 'en', ...overrides });

function realBundle() {
  const workbench = path.join(__dirname, '..');
  const research = path.join(workbench, 'data');
  const read = name => JSON.parse(fs.readFileSync(path.join(research, `${name}.json`), 'utf8'));
  return {
    manifest: JSON.parse(fs.readFileSync(path.join(workbench, 'assets', 'line-drawings', 'manifest.json'), 'utf8')),
    model: core.normalize(read('product-inventory'), read('clamping-data'), read('cutting-data'))
  };
}

function dimensionTexts(svg, field) {
  return [...svg.matchAll(new RegExp(`<g data-dimension="${field}">[\\s\\S]*?<text\\b[^>]*>([\\s\\S]*?)<\\/text><\\/g>`, 'g'))].map(match => match[1]);
}

function assertRealDimensions(svg, entry, dimensions, part) {
  assert.ok(svg.startsWith('<svg '), `${part}: missing dimension drawing`);
  const fields = [...new Set(entry.overlay_labels.map(label => label.field))].filter(field => field !== 'constant');
  for (const field of fields) {
    const value = dimensions[field];
    const expected = field === 'thread' ? (value && value !== '-' ? core.escapeHTML(value) : '—') :
      Number.isFinite(value) && value > 0 ? `${['diameter', 'shankD', 'shoulderD', 'holderD'].includes(field) ? 'Ø' : ''}${value} mm` : '—';
    const texts = dimensionTexts(svg, field);
    assert.equal(texts.length, entry.overlay_labels.filter(label => label.field === field).length, `${part}: missing ${field} text`);
    for (const text of texts) {
      assert.equal(text, expected, `${part}: ${field} must show its actual selected value`);
      assert.doesNotMatch(text, /^(?:L1?|Ø[Dd](?:1)?)$/, `${part}: a dimension symbol was left as the value`);
    }
  }
}

function assertDrawingBase(svg, entry, part) {
  if (vectorKeys.has(entry.key)) {
    assert.match(svg, /data-drawing-style="linework"/, `${part}: expected pure linework`);
    assert.match(svg, /<path\b/, `${part}: missing vector geometry`);
    assert.doesNotMatch(svg, /<image\b|<filter\b|\.png\b|\b(?:href|src)\s*=|url\s*\(/i, `${part}: 99151 must not load raster or external resources`);
  } else {
    assert.match(svg, /data-drawing-style="catalog-image"/, `${part}: original catalog image must remain available`);
    assert.ok(svg.includes(`<image href="./assets/line-drawings/${entry.file}"`), `${part}: missing original catalog PNG`);
    assert.doesNotMatch(svg, /data-linework-profile=/);
  }
}

test('render retains the original PNG and aspect ratio while placing actual mm values over masks', () => {
  const svg = render();
  assert.match(svg, /^<svg /);
  assert.match(svg, /viewBox="0 0 1751 605" preserveAspectRatio="xMidYMid meet"/);
  assert.match(svg, /<image href="\.\/assets\/line-drawings\/99121-bar\.png" x="0" y="0" width="1751" height="605"/);
  assert.match(svg, /<rect x="100" y="100" width="240" height="80" fill="#fff"/);
  assert.match(svg, /font-size="46" fill="#0c2237" text-anchor="middle" dominant-baseline="central"/);
  assert.match(svg, />Ø8 mm<\/text>/);
  assert.match(svg, />24 mm<\/text>/);
  assert.match(svg, />Ø20 mm<\/text>/);
  assert.equal((svg.match(/<image /g) || []).length, 1);
});

test('the selected Ø13, Ø16 and Ø20 shanks appear directly as dimension values', () => {
  for (const shankD of [13, 16, 20]) {
    const svg = render({ dimensions: { diameter: 8, l1: 24, shankD } });
    assert.match(svg, new RegExp(`>Ø${shankD} mm<\\/text>`));
    assert.match(svg, new RegExp(`Bar shank diameter: Ø${shankD} mm`));
  }
});

test('all dynamic fields preserve their own units and semantics without deriving lengths', () => {
  const fields = ['diameter', 'l1', 'l', 'shankD', 'shoulderD', 'holderD', 'holderL', 'thread'];
  const svg = render({
    drawing: drawing({ overlay_labels: fields.map(field => overlay(field)) }),
    dimensions: { diameter: 8, l1: 24, l: 63, shankD: 16, shoulderD: 6.2, holderD: 15.5, holderL: 21.5, thread: 'M8×1.25' }
  });
  for (const value of ['Ø8 mm', '24 mm', '63 mm', 'Ø16 mm', 'Ø6.2 mm', 'Ø15.5 mm', '21.5 mm', 'M8×1.25']) assert.ok(svg.includes(`>${value}</text>`), value);
  assert.match(svg, /Accessory diameter ØD: Ø15\.5 mm/);
  assert.match(svg, /Holder \/ adapter L: 21\.5 mm/);
  const missingL = render({ drawing: drawing({ overlay_labels: [overlay('l')] }), dimensions: { l1: 24, holderL: 21.5 } });
  assert.match(missingL, /Bar L: —/);
  assert.match(missingL, />—<\/text>/);
});

test('missing and invalid dimension values display an em dash without NaN or guessed data', () => {
  for (const value of [undefined, null, '', '16', false, 0, -1, NaN, Infinity, {}, []]) {
    const svg = render({ drawing: drawing({ overlay_labels: [overlay('shankD')] }), dimensions: { shankD: value } });
    assert.match(svg, />—<\/text>/);
    assert.doesNotMatch(svg, /NaN|Infinity/);
  }
  assert.match(render({ dimensions: null }), />—<\/text>/);
  assert.match(render({ dimensions: {} }), />—<\/text>/);
});

test('constant dimensions and rotated source labels retain literal safe values', () => {
  for (const value of ['27 mm', '50 mm', '50 (48) mm', '85 mm', '90 mm', '42 mm', '60 mm', 'MAX 30 mm', 'MAX Ø30 mm', 'Ø20 mm', 'Ø32 mm']) {
    const svg = render({ drawing: drawing({ overlay_labels: [overlay('constant', { value, rotate: -90, fill: '#e7e8e9' })] }) });
    assert.ok(svg.includes(`>${value}</text>`), value);
    assert.match(svg, /transform="rotate\(-90 220 140\)"/);
    assert.match(svg, /fill="#e7e8e9"/);
  }
  assert.match(render({ drawing: drawing({ overlay_labels: [overlay('l1', { rotate: 90 })] }) }), /transform="rotate\(90 220 140\)"/);
});

test('accessible titles and descriptions follow Traditional Chinese or English', () => {
  const zh = render({ language: 'zh-TW' });
  const en = render({ language: 'en' });
  assert.match(zh, /role="img" aria-label="00-99121-08 — 型錄尺寸圖; 目標孔徑: Ø8 mm; 刀桿 L1: 24 mm; 刀桿柄徑: Ø20 mm"/);
  assert.match(zh, /<title>00-99121-08 — 型錄尺寸圖; 目標孔徑: Ø8 mm; 刀桿 L1: 24 mm; 刀桿柄徑: Ø20 mm<\/title>/);
  assert.match(en, /<title>00-99121-08 — Catalog dimensions; Target diameter: Ø8 mm; Bar L1: 24 mm; Bar shank diameter: Ø20 mm<\/title>/);
  assert.match(en, /<desc>Target diameter: Ø8 mm; Bar L1: 24 mm; Bar shank diameter: Ø20 mm<\/desc>/);
});

test('part labels are escaped and invalid thread or constant text cannot inject markup', () => {
  const partLabel = '<img src=x onerror="alert(1)">&\'unsafe';
  const svg = render({ partLabel });
  assert.doesNotMatch(svg, /<img|onerror="|<script/);
  assert.match(svg, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;&amp;&#39;unsafe/);
  for (const thread of ['M8', 'M8x1.25', 'M8×1.25', 'M12xP1.75', 'M16xP2.0', 'M24xP3.0']) {
    assert.ok(render({ drawing: drawing({ overlay_labels: [overlay('thread')] }), dimensions: { thread } }).includes(`>${thread}</text>`));
  }
  const imperial = render({ drawing: drawing({ overlay_labels: [overlay('thread')] }), dimensions: { thread: '5/8"-11' } });
  assert.ok(imperial.includes('>5/8&quot;-11</text>'));
  assert.match(imperial, /Thread: 5\/8&quot;-11/);
  assert.doesNotMatch(imperial, /5\/8&quot;-11 mm/);
  for (const thread of ['M8" onload="alert(1)', '<script>', 'javascript:alert(1)', '8mm', 'M', 'Mfoo', 'M0', 'M8xP0', '5/0"-11', '5/8"-0']) {
    const safe = render({ drawing: drawing({ overlay_labels: [overlay('thread')] }), dimensions: { thread } });
    assert.match(safe, />—<\/text>/);
    assert.doesNotMatch(safe, /<script|onload|javascript:/);
  }
  for (const value of ['<svg onload=alert(1)>', '27 mm"', 'text', 'calc(27 mm)', 'M8', '27 mm; fill:red']) {
    assert.equal(render({ drawing: drawing({ overlay_labels: [overlay('constant', { value })] }) }), '');
  }
});

test('external URLs, non-PNG assets and malformed entries cannot produce SVG', () => {
  for (const file of ['https://example.com/a.png', '//example.com/a.png', '../a.png', 'C:\\a.png', 'sub/a.png', 'a.png?x=1', 'data:image/png;base64,abc', 'a.svg', 'a.png" onload="x', 'two..dots.png']) {
    assert.equal(render({ drawing: drawing({ file }) }), '', file);
  }
  for (const overrides of [{ width_px: 0 }, { width_px: 1751.5 }, { width_px: '1751' }, { height_px: -1 }, { height_px: Infinity }, { overlay_labels: [] }, { overlay_labels: null }, { overlay_labels: [null] }]) {
    assert.equal(render({ drawing: drawing(overrides) }), '');
  }
  for (const input of [undefined, null, {}, [], { drawing: null }]) assert.equal(diagram.render(input), '');
});

test('out-of-bounds masks, invalid text coordinates, rotation and fill reject the overlay', () => {
  for (const change of [
    { box: { x: -1, y: 100, width: 240, height: 80 } },
    { box: { x: 1700, y: 100, width: 240, height: 80 } },
    { box: { x: 100, y: 600, width: 240, height: 80 } },
    { box: { x: 100, y: 100, width: 0, height: 80 } },
    { box: { x: 100, y: 100, width: 240, height: NaN } },
    { box: null }, { x: -1 }, { x: 1752 }, { y: 606 }, { y: '140' },
    { font_size: 0 }, { font_size: Infinity }, { font_size: 2000 }, { rotate: 45 }, { rotate: '90' },
    { fill: 'red' }, { fill: '#fff" onload="x' }, { field: 'unknown' }, { field: '__proto__' }
  ]) assert.equal(render({ drawing: drawing({ overlay_labels: [overlay('l1', change)] }) }), '', JSON.stringify(change));
});

test('all sixteen real overlays and all 167 bar selections render actual numeric dimension texts', () => {
  const { manifest, model } = realBundle();
  assert.equal(manifest.drawings.length, 16);
  for (const entry of manifest.drawings) {
    const dimensions = { diameter: 8, l1: 24, l: 63, shankD: 16, shoulderD: 11, holderD: 45, holderL: 72, thread: 'M8' };
    const svg = diagram.render({ drawing: entry, dimensions, partLabel: entry.key, language: 'en' });
    assertRealDimensions(svg, entry, dimensions, entry.key);
    assertDrawingBase(svg, entry, entry.key);
    assert.equal((svg.match(/<g data-dimension=/g) || []).length, entry.overlay_labels.length, `${entry.key}: some source labels were lost`);
    assert.ok(svg.includes(`viewBox="0 0 ${entry.width_px} ${entry.height_px}"`), `${entry.key}: source proportions changed`);
  }
  assert.equal(model.bars.length, 167);
  assert.equal(model.bars.filter(bar => bar.series === '99151').length, 34);
  const renderedVectorKeys = new Set();
  for (const bar of model.bars) {
    const entry = catalogDrawings.resolve(manifest, catalogDrawings.barKey(bar));
    assert.ok(entry, `${bar.id}: no real manifest entry`);
    const dimensions = { diameter: bar.nominalD, l1: bar.l1, l: bar.l, shankD: bar.shankD, shoulderD: bar.shoulderD };
    const svg = diagram.render({ drawing: entry, dimensions, partLabel: bar.id, language: 'zh-TW' });
    assertRealDimensions(svg, entry, dimensions, bar.id);
    assertDrawingBase(svg, entry, bar.id);
    if (bar.series === '99151') renderedVectorKeys.add(entry.key);
  }
  assert.deepEqual([...renderedVectorKeys].sort(), [...vectorKeys].sort());
});

test('the real 99121 shank overlay follows Ø13/16/20 and absent shoulder dimensions remain unknown', () => {
  const { manifest, model } = realBundle();
  const bar = model.bars.find(item => item.id === '00-99121-08');
  const entry = catalogDrawings.resolve(manifest, catalogDrawings.barKey(bar));
  assert.ok(entry.overlay_labels.some(label => label.field === 'shankD'));
  for (const shankD of [13, 16, 20]) {
    const dimensions = { diameter: 8, l1: bar.l1, l: bar.l, shankD, shoulderD: null };
    const svg = diagram.render({ drawing: entry, dimensions, partLabel: bar.id, language: 'zh-TW' });
    assertRealDimensions(svg, entry, dimensions, `${bar.id} Ø${shankD}`);
    assert.deepEqual(dimensionTexts(svg, 'shankD'), [`Ø${shankD} mm`]);
  }
  const nullShoulderBars = model.bars.filter(bar => bar.shoulderD === null &&
    catalogDrawings.resolve(manifest, catalogDrawings.barKey(bar)).overlay_labels.some(label => label.field === 'shoulderD'));
  assert.ok(nullShoulderBars.length > 0, 'real source drawings must exercise unknown shoulder dimensions');
  for (const bar of nullShoulderBars) {
    const entry = catalogDrawings.resolve(manifest, catalogDrawings.barKey(bar));
    const svg = diagram.render({ drawing: entry, dimensions: { diameter: bar.nominalD, l1: bar.l1, l: bar.l, shankD: bar.shankD, shoulderD: null }, partLabel: bar.id });
    assert.deepEqual(dimensionTexts(svg, 'shoulderD'), ['—'], `${bar.id}: a missing neck diameter must not inherit another row`);
  }
});

test('all six real holders and five adapters render their own dimensions and original thread strings', () => {
  const { manifest, model } = realBundle();
  assert.equal(model.holders.length, 6);
  assert.equal(model.adapters.length, 5);
  for (const item of [...model.holders, ...model.adapters]) {
    const key = model.holders.includes(item) ? catalogDrawings.holderKey(item) : catalogDrawings.adapterKey(item);
    const entry = catalogDrawings.resolve(manifest, key);
    assert.ok(entry, `${item.id}: no real accessory drawing`);
    const dimensions = { holderD: item.dimensions_mm['ØD'], holderL: item.dimensions_mm.L, thread: item.catalog_fields_original?.M };
    const svg = diagram.render({ drawing: entry, dimensions, partLabel: item.partsNo, language: 'en' });
    assertRealDimensions(svg, entry, dimensions, item.id);
    assertDrawingBase(svg, entry, item.id);
    assert.ok(entry.overlay_labels.some(label => label.field === 'holderD'), `${item.id}: missing diameter overlay`);
    assert.ok(entry.overlay_labels.some(label => label.field === 'holderL'), `${item.id}: missing length overlay`);
    if (dimensions.thread && dimensions.thread !== '-') {
      assert.ok(entry.overlay_labels.some(label => label.field === 'thread'), `${item.id}: missing thread overlay`);
      assert.deepEqual(dimensionTexts(svg, 'thread'), [core.escapeHTML(dimensions.thread)]);
      assert.ok(!dimensionTexts(svg, 'thread')[0].endsWith(' mm'), `${item.id}: threads must retain catalog units`);
    }
  }
});

test('vector drawings retain escaped labels and dynamic dimensions without embedding their source PNG', () => {
  const { manifest } = realBundle();
  for (const key of vectorKeys) {
    const entry = catalogDrawings.resolve(manifest, key);
    const dimensions = { diameter: 8.25, l1: 40.5, l: 120, shankD: 15.5, shoulderD: null };
    const svg = diagram.render({ drawing: entry, dimensions, partLabel: '<script>alert("x")</script>', language: 'en' });
    assertRealDimensions(svg, entry, dimensions, key);
    assertDrawingBase(svg, entry, key);
    assert.doesNotMatch(svg, /<script\b/);
    assert.match(svg, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  }
});

test('the browser renderer uses the same vector profiles when the linework script is loaded', () => {
  const { manifest } = realBundle();
  const context = vm.createContext({});
  for (const file of ['catalog-linework.js', 'catalog-diagram.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  }
  for (const key of vectorKeys) {
    const entry = catalogDrawings.resolve(manifest, key);
    const dimensions = { diameter: 8, l1: 24, l: 63, shankD: 16, shoulderD: null };
    const svg = context.NINEBORE_CATALOG_DIAGRAM.render({ drawing: entry, dimensions });
    assertRealDimensions(svg, entry, dimensions, key);
    assertDrawingBase(svg, entry, key);
  }
});

test('99151 cannot fall back to a photograph when source dimensions do not match its vector profile', () => {
  const { manifest } = realBundle();
  for (const key of vectorKeys) {
    const entry = catalogDrawings.resolve(manifest, key);
    for (const field of ['width_px', 'height_px']) {
      assert.equal(diagram.render({ drawing: { ...entry, [field]: entry[field] + 1 }, dimensions: { diameter: 8, l1: 24 } }), '', `${key}: mismatched ${field} must not display a PNG`);
    }
  }
});

test('a browser missing the linework module hides 99151 while keeping other catalog images available', () => {
  const { manifest } = realBundle();
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'catalog-diagram.js'), 'utf8'), context);
  for (const key of vectorKeys) {
    const entry = catalogDrawings.resolve(manifest, key);
    assert.equal(context.NINEBORE_CATALOG_DIAGRAM.render({ drawing: entry, dimensions: { diameter: 8, l1: 24 } }), '', `${key}: no raster fallback is allowed`);
  }
  const entry = catalogDrawings.resolve(manifest, '99121');
  assertDrawingBase(context.NINEBORE_CATALOG_DIAGRAM.render({ drawing: entry, dimensions: { diameter: 8, l1: 24, l: 63, shankD: 16 } }), entry, '99121 without vector module');
});

test('browser UMD exposes a frozen pure renderer without a module loader', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'catalog-diagram.js'), 'utf8'), context);
  assert.equal(context.NINEBORE_CATALOG_DIAGRAM.render({ drawing: drawing(), dimensions: { diameter: 8, l1: 24, shankD: 16 } }).includes('Ø16 mm</text>'), true);
  assert.equal(Object.isFrozen(context.NINEBORE_CATALOG_DIAGRAM), true);
});
