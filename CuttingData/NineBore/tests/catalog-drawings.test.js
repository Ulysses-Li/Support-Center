/* 原圖對應測試：使用實際研究資料檢查完整性，並阻止缺號及錯誤來源被猜成有效圖面。 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../core.js');
const drawings = require('../catalog-drawings.js');
const research = path.join(__dirname, '..', 'data');
const read = name => JSON.parse(fs.readFileSync(path.join(research, `${name}.json`), 'utf8'));
const inventory = read('product-inventory');
const model = core.normalize(inventory, read('clamping-data'), read('cutting-data'));
const bar = id => model.bars.find(item => item.id === id);
const drawing = (overrides = {}) => ({ key: '99121', file: '99121-p153.png', printed_page: 153, pdf_page: 6, width_px: 1200, height_px: 420, ...overrides });

test('all 167 actual bar rows resolve to the correct eleven drawing groups', () => {
  assert.equal(model.bars.length, 167);
  const counts = {};
  const directGroupKeys = { '99101': '99101', '99121': '99121', '99146_S': '99146_S' };
  for (const group of inventory.boring_bar_groups) {
    for (const row of group.rows) {
      const actual = bar(row[group.columns.indexOf('part_no_catalog')]);
      const key = drawings.barKey(actual);
      assert.ok(key, `${actual.id} must have a source drawing`);
      if (directGroupKeys[group.id]) assert.equal(key, directGroupKeys[group.id]);
      else if (group.id === '99146_A') assert.equal(key, actual.nominalD < 40 ? '99146_A_26_39' : '99146_A_40_50');
      else if (actual.shankD === 15.5) assert.equal(key, actual.id === '00-99151-1500W' ? '99151_1500W' : '99151_1600_2000W');
      else assert.equal(key, actual.shankD === 11 ? '99151_d11_WS' : `99151_d${actual.shankD}`);
      counts[key] = (counts[key] || 0) + 1;
    }
  }
  assert.deepEqual(counts, {
    '99101': 19, '99121': 21, '99146_S': 68, '99146_A_26_39': 14, '99146_A_40_50': 11,
    '99151_d6': 8, '99151_d8': 8, '99151_d10': 9, '99151_d11_WS': 3, '99151_1500W': 1, '99151_1600_2000W': 5
  });
});

test('drawing boundaries keep 99146 A geometry and the two Ø15.5 shapes distinct', () => {
  for (const [id, key] of [
    ['00-99146-2550S', '99146_S'], ['00-99146-26A', '99146_A_26_39'],
    ['00-99146-39A', '99146_A_26_39'], ['00-99146-40A', '99146_A_40_50'],
    ['00-99146-50A', '99146_A_40_50'], ['00-99151-0675W', '99151_d6'],
    ['00-99151-0700W', '99151_d8'], ['00-99151-0875W', '99151_d8'],
    ['00-99151-0900W', '99151_d10'], ['00-99151-1100W', '99151_d10'],
    ['00-99151-1200WS', '99151_d11_WS'], ['00-99151-1400WS', '99151_d11_WS'],
    ['00-99151-1500W', '99151_1500W'], ['00-99151-1600W', '99151_1600_2000W'],
    ['00-99151-2000W', '99151_1600_2000W']
  ]) assert.equal(drawings.barKey(bar(id)), key, id);
});

test('missing, contradictory or unlisted bar identities never infer a drawing', () => {
  for (const item of [
    null, undefined, {}, [], '00-99121-08', { series: '99121' }, { id: '00-99121-08' },
    { ...bar('00-99121-08'), series: '99101' }, { ...bar('00-99121-08'), partsNo: '00-99121-09' },
    { ...bar('00-99121-08'), id: '00-99121-07H' }, { ...bar('00-99146-0500S'), id: '00-99146-0525S' },
    { ...bar('00-99151-1100W'), id: '00-99151-1125W' },
    { ...bar('00-99151-1200WS'), id: '00-99151-1200W' },
    { ...bar('00-99151-1500W'), shankD: 11 }, { ...bar('00-99151-0500W'), shankD: undefined }
  ]) assert.equal(drawings.barKey(item), null, JSON.stringify(item));
});

test('all six holders and five adapters map through exact catalog parts', () => {
  assert.deepEqual(model.holders.map(holder => [holder.partsNo, drawings.holderKey(holder)]), [
    ['00-99146-HSK63AH', 'holder_HSK63A'], ['00-99146-CAT40H', 'holder_CAT40'],
    ['00-99146-BT30H', 'holder_BT'], ['00-99146-BT40H', 'holder_BT'], ['00-99146-BT50H', 'holder_BT'],
    ['00-99146-SB32H', 'holder_SB32']
  ]);
  assert.equal(model.adapters.length, 5);
  assert.ok(model.adapters.every(adapter => drawings.adapterKey(adapter) === 'adapter_99151'));
  for (const item of [null, {}, { id: '00-99146-BT40H' }, { partsNo: '00-99146-BT60H' }, { partsNo: '00-99146-BT40H', id: '00-99146-BT30H' }]) {
    assert.equal(drawings.holderKey(item), null);
  }
  for (const item of [null, {}, { partsNo: '00-99151A-15' }, { partsNo: '00-99151A-16' }, { partsNo: '00-99151A-06', id: '00-99151A-08' }]) {
    assert.equal(drawings.adapterKey(item), null);
  }
});

test('resolve returns the unique manifest entry with complete local provenance', () => {
  const entry = drawing({ caption: '原廠圖面' });
  const manifest = { drawings: [null, { key: 'unrelated' }, entry] };
  assert.equal(drawings.resolve(manifest, drawings.barKey(bar('00-99121-08'))), entry);
  assert.equal(drawings.resolve({ drawings: [drawing({ file: 'NineBore_99121.PNG' })] }, '99121').file, 'NineBore_99121.PNG');
  assert.equal(drawings.resolve({ drawings: [entry, entry] }, '99121'), null);
  assert.equal(drawings.resolve({ drawings: [entry] }, 'unknown'), null);
  assert.equal(drawings.resolve({ drawings: [drawing({ key: 'unknown' })] }, 'unknown'), null);
  for (const manifest of [null, {}, [], { drawings: null }, { drawings: {} }]) assert.equal(drawings.resolve(manifest, '99121'), null);
});

test('resolve rejects URL injection, traversal, non-PNG files and noninteger metadata', () => {
  for (const file of [
    '', 'https://example.com/drawing.png', '//example.com/drawing.png', 'data:image/png;base64,abc',
    '../99121.png', '..\\99121.png', 'catalog/99121.png', 'C:\\99121.png', '.99121.png',
    '99121.png?x=1', '99121.png#fragment', '99121%2epng', '99121.svg', '99121.png" onerror="alert(1)',
    '99121.png\n', 'two..dots.png'
  ]) assert.equal(drawings.resolve({ drawings: [drawing({ file })] }, '99121'), null, file);
  for (const field of ['printed_page', 'pdf_page', 'width_px', 'height_px']) {
    for (const value of [undefined, null, 0, -1, 1.5, '153', true, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
      assert.equal(drawings.resolve({ drawings: [drawing({ [field]: value })] }, '99121'), null, `${field}: ${value}`);
    }
  }
  assert.equal(drawings.resolve({ drawings: [drawing({ printed_page: 152 })] }, '99121'), null);
  assert.equal(drawings.resolve({ drawings: [drawing({ pdf_page: 5 })] }, '99121'), null);
});

test('all sixteen drawing keys require their original printed and PDF pages', () => {
  const groups = [
    [152, 5, ['99101']], [153, 6, ['99121']], [155, 8, ['99146_S']],
    [156, 9, ['99146_A_26_39', '99146_A_40_50']],
    [159, 12, ['99151_d6', '99151_d8', '99151_d10', '99151_d11_WS', '99151_1500W', '99151_1600_2000W']],
    [154, 7, ['holder_HSK63A', 'holder_CAT40', 'holder_BT', 'holder_SB32']], [158, 11, ['adapter_99151']]
  ];
  const entries = groups.flatMap(([printed_page, pdf_page, keys]) => keys.map(key => drawing({ key, printed_page, pdf_page, file: `${key}.png` })));
  assert.equal(entries.length, 16);
  for (const entry of entries) assert.equal(drawings.resolve({ drawings: entries }, entry.key), entry);
});

test('the real drawing bundle covers every catalog item with sixteen local PNGs and matching source metadata', () => {
  // 不只測模擬 manifest：實際交付的檔名、頁碼、圖檔尺寸及所有品項接線都必須完整。
  const assetDirectory = path.join(__dirname, '..', 'assets', 'line-drawings');
  const manifest = JSON.parse(fs.readFileSync(path.join(assetDirectory, 'manifest.json'), 'utf8'));
  const expectedKeys = [
    '99101', '99121', '99146_S', '99146_A_26_39', '99146_A_40_50',
    '99151_d6', '99151_d8', '99151_d10', '99151_d11_WS', '99151_1500W', '99151_1600_2000W',
    'holder_HSK63A', 'holder_CAT40', 'holder_BT', 'holder_SB32', 'adapter_99151'
  ];
  assert.equal(manifest.drawings.length, expectedKeys.length);
  assert.equal(new Set(manifest.drawings.map(entry => entry.key)).size, expectedKeys.length, 'drawing keys must be unique');
  assert.equal(new Set(manifest.drawings.map(entry => entry.file)).size, expectedKeys.length, 'each drawing must have its own PNG');
  assert.deepEqual(manifest.drawings.map(entry => entry.key).sort(), [...expectedKeys].sort());

  for (const entry of manifest.drawings) {
    assert.equal(drawings.resolve(manifest, entry.key), entry, `${entry.key}: invalid manifest entry or source page`);
    const imagePath = path.join(assetDirectory, entry.file);
    assert.ok(fs.existsSync(imagePath), `${entry.key}: missing local PNG ${entry.file}`);
    assert.ok(fs.statSync(imagePath).isFile(), `${entry.key}: asset must be a file`);
    const png = fs.readFileSync(imagePath);
    assert.ok(png.length >= 33, `${entry.file}: incomplete PNG header`);
    assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), `${entry.file}: invalid PNG signature`);
    assert.equal(png.readUInt32BE(8), 13, `${entry.file}: invalid IHDR length`);
    assert.equal(png.toString('ascii', 12, 16), 'IHDR', `${entry.file}: missing IHDR`);
    assert.equal(png.readUInt32BE(16), entry.width_px, `${entry.file}: width differs from manifest`);
    assert.equal(png.readUInt32BE(20), entry.height_px, `${entry.file}: height differs from manifest`);
  }

  const catalogItems = [
    ...model.bars.map(item => ({ item, key: drawings.barKey(item) })),
    ...model.holders.map(item => ({ item, key: drawings.holderKey(item) })),
    ...model.adapters.map(item => ({ item, key: drawings.adapterKey(item) }))
  ];
  assert.equal(model.bars.length, 167);
  assert.equal(model.holders.length, 6);
  assert.equal(model.adapters.length, 5);
  assert.equal(catalogItems.length, 178);
  for (const { item, key } of catalogItems) {
    const entry = drawings.resolve(manifest, key);
    assert.ok(entry, `${item.id}: no real drawing entry`);
    assert.equal(entry.printed_page, item.source.printed_page, `${item.id}: wrong printed source page`);
    assert.equal(entry.pdf_page, item.source.pdf_page, `${item.id}: wrong PDF source page`);
  }
});

test('browser UMD publishes the same pure mapping API without requiring modules', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'catalog-drawings.js'), 'utf8'), context);
  const api = context.NINEBORE_CATALOG_DRAWINGS;
  assert.equal(api.barKey(bar('00-99121-08')), '99121');
  assert.equal(api.holderKey(model.holders[0]), 'holder_HSK63A');
  assert.equal(api.adapterKey(model.adapters[0]), 'adapter_99151');
  assert.equal(api.resolve({ drawings: [drawing()] }, '99121').file, '99121-p153.png');
  assert.equal(Object.isFrozen(api), true);
});
