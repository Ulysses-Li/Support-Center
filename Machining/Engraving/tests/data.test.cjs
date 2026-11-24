const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const data = require('../engraving-data.js');
const script = fs.readFileSync(path.join(__dirname, '../engraving-data.js'), 'utf8');
const root = path.resolve(__dirname, '../../..');

test('分類頁沿用正式實體規格與可追溯配對，不產生額外牌號', () => {
  assert.equal(data.inserts.length, 36);
  assert.equal(data.holders.length, 17);
  assert.equal(data.cuttingRows.length, 94);
  assert.equal(data.materials.length, 7);
  assert.deepEqual(data.families.map(item => item.id), ['X060', 'V045', 'V060', 'W060', 'N9MT-W']);
  assert.ok(!data.inserts.some(item => item.family === 'V045' && item.grade === 'NC2035'));
  assert.ok(data.holders.some(item => item.shankLabel === 'Ø3/8 inch'));
  assert.ok(data.cuttingRows.every(row => data.inserts.some(insert => insert.partBase === row.model && row.grades.includes(insert.grade))));
  assert.ok(data.cuttingRows.filter(row => row.material === 'hardened_steel').every(row => row.hardnessLimit === 'HRC < 50' || row.hardnessLimit === 'HRC < 56'));
});

test('正式來源及產品連結均存在，沒有樣板目錄依賴', () => {
  for (const href of [data.source.catalogHref, data.source.researchHref, ...data.families.flatMap(item => [item.image, item.productHref])]) {
    assert.doesNotMatch(href, /測試資料|engraving-plan/);
    assert.ok(fs.existsSync(path.resolve(__dirname, '..', href)), href);
  }
});

test('瀏覽器非同步讀取八個正式 JSON，結果與 Node 來源相同', async () => {
  const requests = [];
  const context = { window: {}, fetch: async href => {
    requests.push(href);
    assert.match(href, /^\.\.\/\.\.\/CuttingData\/(X060|V060|W060|N9MTW)\/data\/(catalog|cutting-data)\.json$/);
    return { ok: true, json: async () => JSON.parse(fs.readFileSync(path.resolve(root, 'Machining/Engraving', href), 'utf8')) };
  }};
  vm.runInNewContext(script, context);
  assert.equal(context.window.ENGRAVING_DATA, undefined);
  const result = await context.window.EngravingDataReady;
  assert.equal(requests.length, 8);
  assert.equal(JSON.stringify(result), JSON.stringify(data));
  assert.equal(result, context.window.ENGRAVING_DATA);
});

test('任一正式 JSON 載入失敗時保留錯誤，不用不完整資料推薦', async () => {
  const context = { window: {}, fetch: async () => ({ ok: false, status: 404 }) };
  vm.runInNewContext(script, context);
  await assert.rejects(context.window.EngravingDataReady, /雕刻資料載入失敗/);
  assert.equal(context.window.ENGRAVING_DATA, undefined);
});
