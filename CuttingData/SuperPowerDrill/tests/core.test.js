'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Core = require('../core.js');
const read = name => JSON.parse(fs.readFileSync(path.join(__dirname, '../data', name), 'utf8'));
const source = read('catalog.json');
const cutting = read('cutting-data.json');
const catalog = Core.normalizeCatalog(source, cutting);
const tool = id => catalog.tools.find(item => item.id === id);
const state = extra => ({ lang: 'zh-TW', diameter: 20, depth: 100, material: 'carbon_low', shank: 32, machineMode: 'rotating', application: 'regular_surface', coolant: 'yes', pressure: 10, spdDepthClass: 'lt7d', ...extra });

test('獨立 CommonJS 與瀏覽器 API 使用相同純函式介面', () => {
  const context = { SuperPowerDrillLocale: require('../locale.js') };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../core.js'), 'utf8'), context);
  assert.deepEqual(Object.keys(context.SuperPowerDrillCore), ['normalizeCatalog', 'getMaterialSupport', 'filterTools', 'selectCutting', 'calculate']);
  assert.ok(Object.isFrozen(Core));
  assert.equal(context.DrillingCore, undefined);
});

test('只保留 81 個標準刀體，尺寸與中心外刃欄位完整', () => {
  assert.equal(catalog.tools.length, 81);
  assert.equal(new Set(catalog.tools.map(item => item.id)).size, 81);
  assert.ok(catalog.tools.every(item => item.family === 'spd' && item.ratio === null));
  assert.equal(cutting.section.cutting_rows.length, 20);
  assert.equal(catalog.materials.length, 8);
  assert.equal(source.center_pilot_inserts.length, 4);
  assert.equal(source.periphery_inserts.length, 6);
  const a = tool('00-99307-19100');
  assert.deepEqual([a.D, a.T, a.L, a.L1, a.shank, a.d1, a.sourcePage], [19, 100, 119, 134, 32, 39, 130]);
  assert.deepEqual([a.centerModel, a.peripheryModel, a.centerQty, a.peripheryQty], ['99307-CD6', 'N9GX04T002', 1, 1]);
  assert.equal(tool('00-99307-35200').peripheryQty, 2);
  assert.equal(tool('00-99307-39300').L, 346);
});

test('另一產品工具與外來料號被拒絕，不能取得本產品切削值', () => {
  const foreign = { ...tool('00-99307-20100'), id: '00-99313-20', family: 'sd', ratio: 3 };
  assert.equal(Core.normalizeCatalog({ holders: [{ part_no: foreign.id }] }, cutting).tools.length, 0);
  const rejected = Core.selectCutting(catalog, foreign, state());
  assert.equal(rejected.status, 'missing');
  assert.equal(rejected.vcRange, null);
  assert.equal(rejected.feedRange, null);
  assert.equal(Core.filterTools({ ...catalog, tools: [foreign] }, state()).length, 0);
  assert.equal(Core.selectCutting(catalog, { ...foreign, family: 'spd' }, state()).vcRange, null);
});

test('尺寸按名目 D、可鑽深 T 與柄徑精確配對，不用 L 或公差擴張', () => {
  assert.equal(Core.filterTools(catalog, {}).length, 81);
  assert.equal(Core.filterTools(catalog, { material: 'non_ferrous' }).length, 0);
  assert.equal(Core.filterTools(catalog, state({ diameter: 20.1 })).length, 0);
  assert.equal(Core.filterTools(catalog, state({ diameter: 20, depth: 200 })).length, 1);
  assert.equal(Core.filterTools(catalog, state({ diameter: 20, depth: 200.01 })).length, 0);
  assert.equal(Core.filterTools(catalog, state({ shank: 25 })).length, 0);
  for (const value of [0, -1, Infinity, 'bad']) assert.equal(Core.filterTools(catalog, state({ depth: value })).length, 0);
});

test('材料支持只看自身切削表；未選、已支持與未列配對的材料明確區分', () => {
  for (const material of [undefined, null, '', ' ']) {
    assert.deepEqual(Core.getMaterialSupport(catalog, material, 'zh-TW'), { supported: null, sourcePage: null, note: '' });
  }
  assert.deepEqual(Core.getMaterialSupport(catalog, 'carbon_low', 'zh-TW'), { supported: true, sourcePage: 135, note: '' });
  assert.deepEqual(Core.getMaterialSupport(catalog, 'non_ferrous', 'zh-TW'), { supported: false, sourcePage: 135, note: '本系列不建議用於非鐵金屬' });
  for (const material of ['heat_resistant', 'unknown-material']) {
    assert.deepEqual(Core.getMaterialSupport(catalog, material, 'zh-TW'), { supported: false, sourcePage: 135, note: '型錄未列此材料適用配對，不提供推薦' });
  }
  const foreignOnly = { ...catalog, cutting: { ...cutting, section: { ...cutting.section, cutting_rows: [] }, other_product: { cutting_rows: [{ material_id: 'carbon_low' }] } } };
  assert.equal(Core.getMaterialSupport(foreignOnly, 'carbon_low').supported, false);
});

test('不支持的材質不列刀體，手動模式同樣回 blocked 與空切削值', () => {
  for (const material of ['non_ferrous', 'heat_resistant', 'unknown-material']) {
    const input = state({ material, valuesMode: 'manual', vc: 100, feed: .08 });
    assert.deepEqual(Core.filterTools(catalog, input), []);
    const result = Core.selectCutting(catalog, tool('00-99307-20100'), input);
    assert.equal(result.status, 'blocked');
    assert.equal(result.materialSupported, false);
    assert.equal(result.vcRange, null);
    assert.equal(result.feedRange, null);
    assert.ok(result.notes.includes(Core.getMaterialSupport(catalog, material, 'zh-TW').note));
  }
  assert.equal(Core.filterTools(catalog, { material: '' }).length, 81);
  assert.equal(Core.selectCutting(catalog, tool('00-99307-20100'), state()).materialSupported, true);
});

test('8 類材料分別選中心牌號，外刃維持已列 NC2032 實體配對', () => {
  const grades = { carbon_low: 'NC2032', carbon_high: 'NC40', low_alloy_low: 'NC2032', low_alloy_high: 'NC40', high_alloy: 'NC40', stainless: 'NC2032', cast_iron: 'NC40', hardened_lt50: 'NC40' };
  for (const [material, center] of Object.entries(grades)) {
    const result = Core.selectCutting(catalog, tool('00-99307-20100'), state({ material }));
    assert.equal(result.status, 'ready', material);
    assert.equal(result.centerGrade, center, material);
    assert.equal(result.peripheryGrade, 'NC2032', material);
    assert.ok(result.vcRange && result.feedRange, material);
    assert.equal(result.sourcePage, 135);
  }
  const a = Core.selectCutting(catalog, tool('00-99307-20100'), state());
  assert.deepEqual(a.vcRange, [80, 150]);
  assert.deepEqual(a.feedRange, [.04, .08]);
  assert.equal(a.vcMedian, 115);
  assert.equal(a.feedMedian, .06);
});

test('依刀體 T/D 自動選組，需求孔深與兩種舊 override 均不改變資料列', () => {
  for (const material of ['', 'non_ferrous']) {
    const preview = Core.selectCutting(catalog, tool('00-99307-35350'), state({ diameter: 35, depth: 150, material }));
    assert.equal(preview.depthRatio, 10);
    assert.equal(preview.depthClass, 'T>7D');
    assert.equal(preview.status, material ? 'blocked' : 'missing');
    assert.equal(preview.vcRange, null);
    assert.equal(preview.feedRange, null);
  }
  for (const override of ['', 'lt7d', 'gt7d']) {
    const long = Core.selectCutting(catalog, tool('00-99307-35350'), state({ diameter: 35, depth: 150, spdDepthClass: override }));
    assert.equal(long.status, 'ready');
    assert.equal(long.depthRatio, 10);
    assert.equal(long.depthClass, 'T>7D');
    assert.deepEqual(long.vcRange, [60, 120]);
    const short = Core.selectCutting(catalog, tool('00-99307-35200'), state({ diameter: 35, depth: 150, spdDepthClass: override }));
    assert.equal(short.status, 'ready');
    assert.equal(short.depthRatio, 200 / 35);
    assert.equal(short.depthClass, 'T<7D');
    assert.deepEqual(short.vcRange, [80, 150]);
    const medium = Core.selectCutting(catalog, tool('00-99307-20150'), state({ depth: 20, spdDepthClass: override }));
    assert.equal(medium.depthRatio, 7.5);
    assert.equal(medium.depthClass, 'T>7D');
    assert.deepEqual(medium.vcRange, [60, 120]);
    // 需求孔深恰為7D不構成缺列：此刀體本身是7.5D。
    const requestedSeven = Core.selectCutting(catalog, tool('00-99307-20150'), state({ depth: 140, spdDepthClass: override }));
    assert.equal(requestedSeven.status, 'ready');
    assert.equal(requestedSeven.depthClass, 'T>7D');
  }
});

test('刀體恰為7D與缺少有效T/D時保留空值，不自動套用任一側', () => {
  const boundary = { ...tool('00-99307-25150'), T: 175 };
  for (const override of ['lt7d', 'gt7d']) {
    const result = Core.selectCutting(catalog, boundary, state({ diameter: 25, depth: 100, spdDepthClass: override }));
    assert.equal(result.depthRatio, 7);
    assert.equal(result.depthClass, null);
    assert.equal(result.status, 'missing');
    assert.equal(result.vcRange, null);
    assert.equal(result.feedRange, null);
    assert.equal(result.notes[0], '刀體 T ÷ D 恰為7，型錄未列 T=7D 資料列；不自動套用較短或較長列。');
  }
  for (const dimensions of [{ T: null }, { T: 0 }, { D: null }, { D: Infinity }]) {
    const result = Core.selectCutting(catalog, { ...boundary, ...dimensions }, state({ diameter: 25 }));
    assert.equal(result.depthRatio, null);
    assert.equal(result.depthClass, null);
    assert.ok(result.status === 'missing' || result.status === 'blocked');
    assert.equal(result.vcRange, null);
    assert.equal(result.feedRange, null);
  }
});

test('刀體恰為7D或缺尺寸時，禁用工況仍優先blocked，手動值不能繞過', () => {
  for (const dimensions of [{ T: 175 }, { T: null }]) {
    const boundary = { ...tool('00-99307-25150'), ...dimensions };
    for (const prohibited of [{ coolant: 'no' }, { pressure: 9 }, { application: 'angled' }, { application: 'stack_drilling' }]) {
      const result = Core.selectCutting(catalog, boundary, state({ diameter: 25, depth: 100, valuesMode: 'manual', vc: 100, feed: .08, ...prohibited }));
      assert.equal(result.status, 'blocked');
      assert.equal(result.depthClass, null);
      assert.equal(result.vcRange, null);
      assert.equal(result.feedRange, null);
      assert.equal(result.vcMedian, null);
      assert.equal(result.feedMedian, null);
    }
  }
});

test('八種適用材料在自動短／長分組仍選正確中心及外刃牌號', () => {
  const expected = {
    carbon_low: [[80, 150], [60, 120], [.08, .12]],
    carbon_high: [[80, 150], [60, 120], [.08, .15]],
    low_alloy_low: [[60, 150], [40, 120], [.08, .12]],
    low_alloy_high: [[60, 150], [40, 120], [.08, .15]],
    high_alloy: [[60, 120], [40, 100], [.08, .12]],
    stainless: [[60, 120], [40, 100], [.06, .10]],
    cast_iron: [[60, 120], [40, 100], [.08, .12]],
    hardened_lt50: [[50, 80], [40, 60], [.06, .10]]
  };
  for (const body of [tool('00-99307-35200'), tool('00-99307-35350')]) {
    for (const material of catalog.materials) {
      const result = Core.selectCutting(catalog, body, state({ diameter: 35, depth: 150, material: material.id }));
      assert.equal(result.status, 'ready', material.id);
      assert.equal(result.depthClass, body.T === 200 ? 'T<7D' : 'T>7D');
      assert.equal(result.peripheryGrade, 'NC2032');
      assert.equal(result.centerGrade, ['carbon_low', 'low_alloy_low', 'stainless'].includes(material.id) ? 'NC2032' : 'NC40');
      assert.deepEqual(result.vcRange, expected[material.id][body.T === 200 ? 0 : 1]);
      assert.deepEqual(result.feedRange, expected[material.id][2]);
    }
  }
});

test('內冷、最低 10 bar、斜面與疊板限制保留', () => {
  for (const options of [{ coolant: 'no' }, { pressure: 9.99 }, { application: 'angled' }, { application: 'stack_drilling' }]) {
    const result = Core.selectCutting(catalog, tool('00-99307-20100'), state(options));
    assert.equal(result.status, 'blocked');
    assert.equal(result.vcRange, null);
    assert.equal(result.feedRange, null);
  }
  assert.equal(Core.selectCutting(catalog, tool('00-99307-20100'), state({ pressure: 10 })).status, 'ready');
  const unknown = Core.selectCutting(catalog, tool('00-99307-20100'), state({ pressure: '', coolant: 'unknown' }));
  assert.equal(unknown.status, 'review');
  assert.ok(unknown.vcRange);
  const unusual = Core.selectCutting(catalog, tool('00-99307-20100'), state({ application: 'cross_holes', applicationFactor: 50 }));
  assert.equal(unusual.status, 'review');
  assert.deepEqual(unusual.vcRange, [80, 150]);
});

test('缺材料／缺實體刀片不借值，NC40 小尺寸空格仍為 null', () => {
  assert.equal(Core.selectCutting(catalog, tool('00-99307-20100'), state({ material: 'non_ferrous' })).vcRange, null);
  const noCenter = Core.normalizeCatalog({ ...source, center_pilot_inserts: [] }, cutting);
  assert.equal(Core.selectCutting(noCenter, noCenter.tools.find(item => item.id === '00-99307-20100'), state()).feedRange, null);
  const alternative = cutting.section.cutting_rows.filter(row => row.periphery_grade === 'NC40');
  assert.equal(alternative.length, 4);
  assert.ok(alternative.every(row => row.feed_per_revolution.d19 === null && row.feed_per_revolution.d20_21 === null));
});

test('公制 S/F 保留機台限速與每轉進給，不乘刀片數且不修改資料', () => {
  const before = JSON.stringify({ source, cutting });
  const uncapped = Core.calculate({ D: 20, vc: 100, feed: .08 });
  assert.ok(Math.abs(uncapped.rpm - 5000 / Math.PI) < 1e-9);
  assert.ok(Math.abs(uncapped.feedRate - uncapped.rpm * .08) < 1e-9);
  assert.deepEqual(Core.calculate({ D: 20, vc: 100, feed: .08, machineMax: 500 }), { rpm: 500, feedRate: 40, rpmUncapped: uncapped.rpm, capped: true });
  for (const value of [0, -1, Infinity, '', null]) assert.equal(Core.calculate({ D: 20, vc: value, feed: .08 }), null);
  assert.equal(JSON.stringify({ source, cutting }), before);
});
