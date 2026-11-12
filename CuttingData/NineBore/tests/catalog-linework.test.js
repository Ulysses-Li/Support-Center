/* 99151 純線稿契約：來源分組有各自外形，不載照片、不引用外部資源，也不插入呼叫端字串。 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const linework = require('../catalog-linework.js');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'assets', 'line-drawings', 'manifest.json'), 'utf8'));
const keys = ['99151_d6', '99151_d8', '99151_d10', '99151_d11_WS', '99151_1500W', '99151_1600_2000W'];
const entries = keys.map(key => manifest.drawings.find(entry => entry.key === key));

function assertPureLinework(fragment, key) {
  assert.match(fragment, /^<g\b/, `${key}: expected an SVG group fragment`);
  assert.ok(fragment.endsWith('</g>'), `${key}: missing outer group closing tag`);
  assert.match(fragment, /<path\b/, `${key}: missing vector paths`);
  assert.doesNotMatch(fragment, /<(?:svg|title|desc|text|image|foreignObject|script|filter|use)\b/i, `${key}: linework must contain geometry only`);
  assert.doesNotMatch(fragment, /\b(?:href|src|filter|on[a-z]+)\s*=|url\s*\(|(?:https?|data|javascript):|\.png\b/i, `${key}: external, raster or executable content is forbidden`);
  assert.doesNotMatch(fragment, /NaN|Infinity|undefined/);
  const tags = [...fragment.matchAll(/<\/?([A-Za-z][A-Za-z0-9]*)\b/g)].map(match => match[1]);
  assert.ok(tags.every(tag => ['g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon'].includes(tag)), `${key}: unexpected SVG element`);
}

test('all six real 99151 groups render only local vector geometry', () => {
  assert.equal(entries.length, 6);
  assert.ok(entries.every(Boolean), 'all six profiles must exist in the real manifest');
  for (const entry of entries) assertPureLinework(linework.render(entry), entry.key);
});

test('the six profiles have distinct tool outlines rather than merely different profile labels', () => {
  const outlines = entries.map(entry => {
    const fragment = linework.render(entry);
    const outline = fragment.match(/<path\b[^>]*class="catalog-linework-outline"[^>]*\bd="([^"]+)"/);
    assert.ok(outline, `${entry.key}: no identifiable tool outline`);
    return outline[1];
  });
  assert.equal(new Set(outlines).size, keys.length, 'every group must have its own tool geometry');
});

test('unknown profiles, missing fields and mismatched source dimensions return no linework', () => {
  const source = entries[0];
  for (const invalid of [undefined, null, false, [], {}, source.key, { key: source.key },
    { ...source, key: '99151_unknown' }, { ...source, key: '__proto__' }, { ...source, key: 'constructor' },
    { ...source, key: '99151_d6" onload="alert(1)' },
    { ...source, width_px: source.width_px + 1 }, { ...source, height_px: source.height_px + 1 }]) {
    assert.equal(linework.render(invalid), '', JSON.stringify(invalid));
  }
  for (const field of ['width_px', 'height_px']) {
    for (const value of [undefined, null, '', String(source[field]), 0, -1, NaN, Infinity, true]) {
      assert.equal(linework.render({ ...source, [field]: value }), '', `${field}: ${value}`);
    }
  }
  for (const entry of manifest.drawings.filter(entry => !keys.includes(entry.key))) assert.equal(linework.render(entry), '', entry.key);
});

test('caller-provided labels, style and resource strings cannot alter the trusted linework', () => {
  for (const entry of entries) {
    const original = linework.render(entry);
    const hostile = {
      ...entry, file: 'https://example.com/attack.png', description_zh_tw: '<script>alert(1)</script>',
      outline: '" onload="alert(1)', stroke: 'url(https://example.com/attack.svg)',
      overlay_labels: [{ field: 'constant', value: '<image href="remote.png"/>' }]
    };
    assert.equal(linework.render(hostile), original, `${entry.key}: trusted geometry must ignore untrusted extra fields`);
    assertPureLinework(linework.render(hostile), entry.key);
  }
});

test('the browser UMD publishes the same frozen pure linework API', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'catalog-linework.js'), 'utf8'), context);
  const api = context.NINEBORE_CATALOG_LINEWORK;
  assert.equal(Object.isFrozen(api), true);
  for (const entry of entries) assert.equal(api.render(entry), linework.render(entry), entry.key);
  assert.equal(api.render({ key: '99121', width_px: 1751, height_px: 605 }), '');
});
