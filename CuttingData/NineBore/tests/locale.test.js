/* 繁中只轉換顯示：料號、資料識別碼、SVG幾何與數字必須保留。 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const locale = require('../locale.zh-TW.js');
const ui = require('../locale.ui.js');
const diagrams = require('../diagrams.js');
const core = require('../core.js');
const research = path.join(__dirname, '..', 'data');
const read = name => JSON.parse(fs.readFileSync(path.join(research, `${name}.json`), 'utf8'));
const model = core.normalize(read('product-inventory'), read('clamping-data'), read('cutting-data'));

test('localized SVG retains the exact geometry, source attributes and physical part numbers', () => {
  const options = {
    diameter: 10.125,
    depth: 24.75,
    bar: { series: '99151', partNo: '00-99151-1000S', minD: 9.87, maxD: 10.12, l1: 25, shankD: 20, sourcePage: 155 },
    holder: { partNo: '00-99146-BT40H' },
    adapter: { partNo: '00-99151-20' }
  };
  const markup = diagrams.renderSection(options) + diagrams.renderAssembly(options);
  const translated = locale.translateMarkup(markup);
  // 比較原始標籤，僅忽略明確授權的說明屬性；座標及style須逐字相同。
  const tags = value => (value.match(/<(?:[^>"']|"[^"]*"|'[^']*')*>/g) || []).map(tag => tag.replace(/\s(?:aria-label|title)=(?:"[^"]*"|'[^']*')/g, ''));
  assert.deepEqual(tags(translated), tags(markup));
  assert.match(translated, /工件/);
  assert.match(translated, /需求深度/);
  for (const part of ['00-99151-1000S', '00-99146-BT40H', '00-99151-20']) assert.ok(translated.includes(part), part);
  for (const number of ['10.125', '24.75', '9.87', '10.12', '25']) assert.ok(translated.includes(number), number);
});

test('markup localization preserves option values, IDs, links and data even when their labels translate', () => {
  const markup = '<select id="Carbon Steel" data-material="Carbon Steel"><option value="Carbon Steel">Carbon Steel</option><option value="Regular cutting">Regular cutting</option></select>' +
    '<a href="/?condition=Regular%20cutting" title="Workpiece">Workpiece</a>' +
    '<script>const label="Workpiece";</script><style>.Workpiece{color:red}</style>';
  const translated = locale.translateMarkup(markup);
  assert.match(translated, /id="Carbon Steel" data-material="Carbon Steel"/);
  assert.match(translated, /value="Carbon Steel">碳鋼/);
  assert.match(translated, /value="Regular cutting">一般切削/);
  assert.match(translated, /href="\/\?condition=Regular%20cutting" title="工件">工件/);
  assert.match(translated, /<script>const label="Workpiece";<\/script>/);
  assert.match(translated, /<style>\.Workpiece\{color:red\}<\/style>/);
});

test('runtime DOM localization changes only text and permitted explanatory attributes', () => {
  const attributes = { id: 'material', value: 'Carbon Steel', 'data-material': 'Carbon Steel', href: '/?material=Carbon%20Steel', viewBox: '0 0 450 300', d: 'M0 0L450 300', 'aria-label': 'Workpiece', title: 'Workpiece', alt: 'Workpiece', placeholder: 'Enter diameter' };
  const element = {
    hasAttribute: name => Object.hasOwn(attributes, name),
    getAttribute: name => attributes[name],
    setAttribute: (name, value) => { attributes[name] = value; }
  };
  const textNodes = [
    { nodeValue: 'Carbon Steel', parentElement: { tagName: 'OPTION' } },
    { nodeValue: '00-99146-BT40H', parentElement: { tagName: 'STRONG' } },
    { nodeValue: 'Workpiece', parentElement: { tagName: 'SCRIPT' } }
  ];
  const scope = { querySelectorAll: () => [element] };
  const descriptors = { document: Object.getOwnPropertyDescriptor(globalThis, 'document'), NodeFilter: Object.getOwnPropertyDescriptor(globalThis, 'NodeFilter') };
  try {
    globalThis.NodeFilter = { SHOW_TEXT: 4, FILTER_ACCEPT: 1, FILTER_REJECT: 2 };
    globalThis.document = { createTreeWalker: (root, type, filter) => {
      assert.equal(root, scope);
      assert.equal(type, NodeFilter.SHOW_TEXT);
      const nodes = textNodes.filter(node => filter.acceptNode(node) === NodeFilter.FILTER_ACCEPT);
      return { nextNode: () => nodes.shift() || null };
    } };
    ui.apply(scope);
    assert.equal(textNodes[0].nodeValue, '碳鋼');
    assert.equal(textNodes[1].nodeValue, '00-99146-BT40H');
    assert.equal(textNodes[2].nodeValue, 'Workpiece');
    assert.deepEqual(attributes, { id: 'material', value: 'Carbon Steel', 'data-material': 'Carbon Steel', href: '/?material=Carbon%20Steel', viewBox: '0 0 450 300', d: 'M0 0L450 300', 'aria-label': '工件', title: '工件', alt: '工件', placeholder: '輸入孔徑' });
  } finally {
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  }
});

test('dynamic diagnostics retain numeric spelling, ranges and grade identifiers', () => {
  const cases = [
    ["The target diameter is outside this bar's listed range of 9.87–10.12 mm.", ['9.87–10.12']],
    ['The target diameter falls in a gap between actual adjustable ranges (between 25.62 and 25.87 mm). No standard item is listed here; confirm a special size.', ['25.62', '25.87']],
    ['Calculated speed 12345 rpm exceeds the entered limit of 10000 rpm. Adjust Vc; speed has not been clipped automatically.', ['12345', '10000']],
    ['Radial stock Ae 0.1234 mm exceeds the listed 0.04 mm for this row and insert radius. Review the cutting conditions.', ['0.1234', '0.04']],
    ['Boring depth exceeds this bar\'s listed L1 of 2.5e+2 mm.', ['2.5e+2']],
    ['This row specifies NC9036 / NC2033, but no matching physical grade is listed for this insert geometry. A missing item is not invented and another cutting row is not substituted.', ['NC9036', 'NC2033']]
  ];
  for (const [message, tokens] of cases) {
    for (const translator of [locale.translate, ui.translate]) {
      const translated = translator(message);
      assert.notEqual(translated, message);
      for (const token of tokens) assert.ok(translated.includes(token), token);
    }
  }
});

test('display labels keep all original material and cutting-condition identifiers usable by core', () => {
  const materialsBefore = model.materials.map(item => item.id);
  const conditionsBefore = [...model.conditions];
  for (const item of model.materials) {
    assert.notEqual(locale.material(item.id), item.id);
    assert.notEqual(ui.translate(item.label), item.label);
  }
  for (const condition of model.conditions) assert.notEqual(locale.condition(condition), condition);
  assert.deepEqual(model.materials.map(item => item.id), materialsBefore);
  assert.deepEqual(model.conditions, conditionsBefore);
  assert.ok(core.find(model, { diameter: 8, depth: 12, material: 'Non-ferrous metal', condition: 'Regular cutting', clamping: 'purchase_holder', holderId: '00-99146-BT40H' }).candidates.length);
  assert.equal(locale.material('Unknown alloy'), 'Unknown alloy');
  assert.equal(locale.condition('Unknown operation'), 'Unknown operation');
});

test('unknown sentences and part identifiers remain unchanged instead of receiving partial translations', () => {
  for (const value of [
    'Unknown confirmable part 99146-0800S needs an independent review.',
    'Weldon-Special-confirm-1',
    'Quick-FIX-99146',
    'Holder-X-00-99146',
    'The factory confirmed NC9036 at 12345 rpm.',
    '00-99146-BT40H',
    'CCGT040102|NC9036'
  ]) {
    assert.equal(locale.translate(value), value);
    assert.equal(ui.translate(value), value);
  }
});

test('real core errors, diagnoses and merged setup warnings all retain their complete translation', () => {
  const base = { diameter: 8, depth: 12, material: 'Non-ferrous metal', condition: 'Regular cutting', clamping: 'purchase_holder', holderId: '00-99146-BT40H' };
  const cases = [
    {}, { diameter: 'invalid' }, { diameter: 1 }, { diameter: 120 }, { diameter: 25.7 }, { depth: 999 }, { depth: '' },
    { clamping: 'existing_general', holderId: '', gripDiameter: 20, diameter: 20 },
    { clamping: 'existing_general', holderId: '', gripDiameter: 13, diameter: 20 },
    { clamping: 'existing_general', holderId: '', gripDiameter: 50, diameter: 20 },
    ...model.materials.map(item => ({ material: item.id })),
    ...model.conditions.map(condition => ({ condition })),
    ...['Carbon Steel','Alloy Steel','Stainless Steel'].map(material => ({material,allowReference:true})),
    { diameter: 35, depth: 60 }, { holderId: '00-99146-SB32' }
  ];
  const messages = new Set();
  for (const overrides of cases) {
    const input = { ...base, ...overrides };
    const found = core.find(model, input);
    messages.add(found.diagnosis.message);
    found.errors.forEach(message => messages.add(message));
    for (const candidate of found.candidates) {
      const calculated = core.calculate(model, candidate, { ...input, insertId: candidate.insertOptions[0]?.id, vc: 200, feed: 0.1, machineMaxRpm: 1000, prebore: 1 });
      [...calculated.errors, ...calculated.warnings].forEach(message => messages.add(message));
    }
  }
  assert.ok(messages.size > 20);
  for (const message of messages) {
    assert.notEqual(locale.translate(message), message, message);
    assert.equal(ui.translate(message), locale.translate(message), message);
  }
});
