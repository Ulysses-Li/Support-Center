'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Selector = require('../selector.js');
const root = path.resolve(__dirname, '../../..');
const packages = Object.fromEntries(Object.entries(Selector.products).map(([key, product]) => {
  const directory = path.join(root, product.directory);
  const core = require(path.join(directory, 'core.js'));
  const read = name => JSON.parse(fs.readFileSync(path.join(directory, 'data', name), 'utf8'));
  return [key, { core, catalog: core.normalizeCatalog(read('catalog.json'), read('cutting-data.json')) }];
}));
const groups = (state, selected = {}) => Selector.selectFamilies(packages, { ...Selector.defaults, ...state }, selected);

test('分類入口讀取兩個獨立核心及各自完整規格', () => {
  assert.notEqual(packages.sd.core, packages.spd.core);
  assert.deepEqual(groups({}).map(group => [group.key, group.matching.length]), [['sd', 51], ['spd', 81]]);
  assert.ok(packages.sd.catalog.tools.every(tool => tool.family === 'sd'));
  assert.ok(packages.spd.catalog.tools.every(tool => tool.family === 'spd'));
});

test('沒有符合規格的家族完全隱藏，缺少材料切削值仍保留幾何結果', () => {
  const state = { diameter: '10', depth: '20', material: 'carbon_low' };
  assert.deepEqual(groups(state).map(group => [group.key, group.matching.length]), [['sd', 1]]);
  assert.equal(groups({ ...state, depth: '31' }).length, 0);
  assert.deepEqual(groups({ ...state, material: 'non_ferrous' }).map(group => group.key), ['sd']);
});

test('指定4D刀體在材料變更後保留，失效料號才改選', () => {
  const state = { diameter: '20', depth: '20' };
  const selected = { sd: '00-99314-20' };
  for (const material of ['', 'stainless', 'non_ferrous']) {
    assert.equal(groups({ ...state, material }, selected)[0].chosen.tool.id, selected.sd);
  }
  assert.equal(groups({ ...state, diameter: '18' }, selected)[0].chosen.tool.D, 18);
});

test('兩入口獨立URL，傳實際料號與公差但不代填深度', () => {
  const state = { ...Selector.defaults, toleranceUpper: '+0.05', toleranceLower: '-0.02', spdDepthClass: 'lt7d', applicationFactor: '75' };
  for (const group of groups(state)) {
    const url = new URL(Selector.productUrl('http://127.0.0.1:5500/', group.key, state, group.chosen.tool));
    assert.equal(url.pathname, '/' + group.product.directory + 'index.html');
    assert.equal(url.searchParams.get('tool'), group.chosen.tool.id);
    assert.equal(url.searchParams.get('diameter'), String(group.chosen.tool.D));
    assert.equal(url.searchParams.get('depth'), null);
    assert.equal(url.searchParams.get('toleranceUpper'), '+0.05');
    assert.equal(url.searchParams.get('toleranceLower'), '-0.02');
    assert.equal(url.searchParams.has('sdTool'), false);
    assert.equal(url.searchParams.has('spdTool'), false);
  }
});

// 柄徑改由產品頁確認；舊分享網址不得悄悄改變分類頁結果或下一頁條件。
test('舊 shank 參數不篩選刀體，也不進入查詢與產品 CTA', () => {
  const state = { ...Selector.defaults, diameter: '24', depth: '36', material: 'carbon_low' };
  const baseline = groups(state).map(group => [group.key, group.matching.map(row => row.tool.id)]);
  for (const shank of ['20', '25', '32', '999', 'invalid']) {
    const legacyState = { ...state, shank };
    const result = groups(legacyState);
    assert.deepEqual(result.map(group => [group.key, group.matching.map(row => row.tool.id)]), baseline, `legacy shank=${shank}`);
    assert.equal(Selector.queryFor(legacyState).has('shank'), false);
    for (const group of result) {
      const url = new URL(Selector.productUrl('https://n9sp.cwli.dev/', group.key, legacyState, group.chosen.tool));
      assert.equal(url.searchParams.has('shank'), false);
      assert.equal(url.searchParams.get('diameter'), '24');
      assert.equal(url.searchParams.get('depth'), '36');
      assert.equal(url.searchParams.get('tool'), group.chosen.tool.id);
    }
  }
});

test('Ø24 深36依最短可用T選刀：SD T72在前，SPD T100其次', () => {
  const result = groups({ diameter: '24', depth: '36', material: 'carbon_low', coolant: 'yes', pressure: '20', spdDepthClass: 'lt7d' });
  assert.deepEqual(result.map(group => [group.key, group.chosen.tool.id, group.chosen.tool.T]), [
    ['sd', '00-99313-24', 72],
    ['spd', '00-99307-24100', 100]
  ]);
  assert.deepEqual(result.map(group => group.recommended), [true, false]);
  for (const group of result) {
    assert.equal(group.shortest.tool.id, group.chosen.tool.id);
    assert.ok(group.matching.every(row => row.tool.T >= group.shortest.tool.T));
    assert.ok(group.matching.every((row, index, rows) => index === 0 || rows[index - 1].tool.T <= row.tool.T));
  }
});

test('加深至90改用SD 4D T96，加深至100只保留SPD T100', () => {
  const at90 = groups({ diameter: '24', depth: '90' });
  assert.deepEqual(at90.map(group => [group.key, group.shortest.tool.id, group.shortest.tool.T]), [
    ['sd', '00-99314-24', 96],
    ['spd', '00-99307-24100', 100]
  ]);
  assert.ok(at90.every(group => group.chosen.tool.id === group.shortest.tool.id));
  const at100 = groups({ diameter: '24', depth: '100' });
  assert.deepEqual(at100.map(group => [group.key, group.chosen.tool.id, group.shortest.tool.T]), [
    ['spd', '00-99307-24100', 100]
  ]);
});

test('未填完整孔徑深度不標推薦；切削材料尚未補齊不抹去最短尺寸建議', () => {
  for (const state of [{}, { diameter: '24' }, { depth: '36' }]) {
    assert.ok(groups(state).every(group => group.recommended === false));
  }
  const result = groups({ diameter: '24', depth: '36' });
  assert.equal(result.length, 2);
  assert.ok(result.every(group => group.chosen.eligibility !== 'blocked'));
  assert.deepEqual(result.map(group => [group.key, group.recommended]), [['sd', true], ['spd', false]]);
});

test('舊進階參數不再改變分類頁的幾何結果、最短推薦與可選系列', () => {
  const summarize = result => result.map(group => ({
    key: group.key,
    tools: group.matching.map(row => row.tool.id),
    shortest: group.shortest.tool.id,
    chosen: group.chosen.tool.id,
    eligibility: group.chosen.eligibility,
    recommended: group.recommended,
    canSelect: group.canSelect
  }));
  // 深36檢查SD優先；深100只剩SPD，舊斜面/無內冷也不能形成隱藏的進入限制。
  for (const depth of ['36', '100']) {
    const state = { diameter: '24', depth, material: 'carbon_low' };
    const expected = summarize(groups(state));
    for (const overrides of [
      { application: 'angled' }, { application: 'stack_drilling' },
      { coolant: 'no' }, { pressure: '9' }, { machineMode: 'lathe' },
      { machineMax: '0' }, { applicationFactor: '999' }, { spdDepthClass: 'gt7d' },
      { shank: '32', machineMode: 'invalid', application: 'angled', coolant: 'no', pressure: '0', machineMax: '-1', spdDepthClass: 'invalid', applicationFactor: 'invalid' }
    ]) {
      assert.deepEqual(summarize(groups({ ...state, ...overrides })), expected, `舊參數${JSON.stringify(overrides)} / 深${depth}`);
    }
  }
});

test('分類頁只還原五個需求欄位，舊進階網址不傳入core條件或產品CTA', () => {
  const allowed = ['diameter', 'toleranceUpper', 'toleranceLower', 'depth', 'material'];
  assert.deepEqual(Selector.fields, allowed);
  assert.deepEqual(Object.keys(Selector.defaults), allowed);
  const demand = { diameter: '24', toleranceUpper: '+0.05', toleranceLower: '-0.02', depth: '100', material: 'carbon_low' };
  const legacy = {
    ...demand, shank: '20', machineMode: 'lathe', application: 'angled', coolant: 'no',
    pressure: '9', machineMax: '100', spdDepthClass: 'gt7d', applicationFactor: '75',
    values: 'manual', vc: '80', feed: '0.1', unexpected: '不得還原'
  };
  const job = Selector.currentJob(legacy);
  assert.equal(job.diameter, 24);
  assert.equal(job.depth, 100);
  assert.equal(job.material, demand.material);
  assert.equal(job.machineMode, 'rotating');
  assert.equal(job.application, 'regular_surface');
  assert.equal(job.coolant, 'unknown');
  for (const key of ['pressure', 'machineMax', 'applicationFactor', 'shank']) assert.equal(job[key], null);
  for (const key of ['values', 'vc', 'feed', 'unexpected']) assert.equal(Object.hasOwn(job, key), false);
  assert.notEqual(job.spdDepthClass, legacy.spdDepthClass);
  assert.deepEqual(Object.fromEntries(Selector.queryFor(legacy)), demand);
  // 網址還原白名單與CTA白名單相同；不存在的舊欄位不能被讀回狀態。
  const query = new URLSearchParams(legacy);
  const restored = { ...Selector.defaults };
  Selector.fields.forEach(key => { if (query.has(key)) restored[key] = query.get(key); });
  assert.deepEqual(restored, demand);
  for (const group of groups(legacy)) {
    const url = new URL(Selector.productUrl('https://n9sp.cwli.dev/', group.key, legacy, group.chosen.tool));
    assert.deepEqual(Object.fromEntries(url.searchParams), { ...demand, tool: group.chosen.tool.id });
  }
});

test('手選較長刀體在材料變更後保留，但不能冒稱最短推薦', () => {
  const state = { diameter: '24', depth: '36', coolant: 'yes', pressure: '20', spdDepthClass: 'lt7d' };
  const selected = { sd: '00-99314-24', spd: '00-99307-24150' };
  for (const material of ['', 'carbon_low', 'stainless', 'non_ferrous']) {
    const result = groups({ ...state, material }, selected);
    assert.deepEqual(result.map(group => group.chosen.tool.id), [selected.sd, selected.spd]);
    assert.deepEqual(result.map(group => group.shortest.tool.id), ['00-99313-24', '00-99307-24100']);
    assert.ok(result.every(group => group.recommended === false));
  }
  const shortestSelected = groups(state, { sd: '00-99313-24', spd: '00-99307-24100' });
  assert.deepEqual(shortestSelected.map(group => group.recommended), [true, false]);
  const preferredManuallyLong = groups(state, { sd: '00-99314-24', spd: '00-99307-24100' });
  assert.ok(preferredManuallyLong.every(group => group.recommended === false), '全體最短家族改選長刀體時，另一家族不遞補冒稱優先推薦');
});

test('家族排序以最短可用T為準，不依資料列順序或手選長度', () => {
  // 用不同最短長度的產品API回傳檢查排序，避免目前實體規格恰好總是SD較短掩蓋錯誤。
  const row = (id, T) => ({ tool: { id, T }, eligibility: 'ready', notes: [] });
  const custom = {
    sd: { catalog: {}, core: { filterTools: () => [row('sd-long', 180), row('sd-short', 120)] } },
    spd: { catalog: {}, core: { filterTools: () => [row('spd-long', 250), row('spd-short', 100)] } }
  };
  const result = Selector.selectFamilies(custom, { ...Selector.defaults, diameter: '24', depth: '36' }, { spd: 'spd-long' });
  assert.deepEqual(result.map(group => group.key), ['spd', 'sd']);
  assert.equal(result[0].shortest.tool.id, 'spd-short');
  assert.equal(result[0].chosen.tool.id, 'spd-long');
  assert.equal(result[0].recommended, false);
  assert.equal(result[1].recommended, false);
  const defaults = Selector.selectFamilies(custom, { ...Selector.defaults, diameter: '24', depth: '36' });
  assert.deepEqual(defaults.map(group => [group.key, group.recommended]), [['spd', true], ['sd', false]]);
  const blocked = Object.fromEntries(Object.entries(custom).map(([key, entry]) => [key, {
    catalog: entry.catalog,
    core: { filterTools: () => entry.core.filterTools().map(candidate => ({ ...candidate, eligibility: 'blocked' })) }
  }]));
  assert.ok(Selector.selectFamilies(blocked, { ...Selector.defaults, diameter: '24', depth: '36' }).every(group => group.recommended === false));
});

test('只能進入最短可用系列：Ø24深36與90選SD，100選SPD，退回36恢復SD', () => {
  const state = { diameter: '24', material: 'carbon_low', coolant: 'yes', pressure: '20', spdDepthClass: 'lt7d' };
  for (const [depth, expected] of [
    ['36', [['sd', true], ['spd', false]]],
    ['90', [['sd', true], ['spd', false]]],
    ['100', [['spd', true]]],
    ['36', [['sd', true], ['spd', false]]]
  ]) {
    const result = groups({ ...state, depth });
    assert.deepEqual(result.map(group => [group.key, group.canSelect]), expected, `depth=${depth}`);
    for (const group of result) {
      assert.equal(typeof group.selectionNote, 'string');
      if (!group.canSelect) assert.ok(group.selectionNote.trim(), '不可選家族需說明原因');
    }
  }
});

test('孔徑深度未完整或產品API回報blocked時不可選；全部blocked沒有可選系列', () => {
  for (const state of [{}, { diameter: '24' }, { depth: '36' }]) {
    const result = groups(state);
    assert.ok(result.length > 0, '未完成需求仍可查看尺寸候選');
    assert.ok(result.every(group => group.canSelect === false && typeof group.selectionNote === 'string' && group.selectionNote.trim()));
  }
  const row = (id, T) => ({ tool: { id, T }, eligibility: 'blocked', notes: ['此加工條件不適用'] });
  const allBlocked = {
    sd: { catalog: {}, core: { filterTools: () => [row('blocked-sd', 72)] } },
    spd: { catalog: {}, core: { filterTools: () => [row('blocked-spd', 100)] } }
  };
  const result = Selector.selectFamilies(allBlocked, { ...Selector.defaults, diameter: '24', depth: '36' });
  assert.equal(result.length, 2);
  assert.ok(result.every(group => group.canSelect === false && typeof group.selectionNote === 'string' && group.selectionNote.trim()));
});

test('最短家族手選較長規格仍可進入，但較長家族不能因手選解鎖', () => {
  const state = { diameter: '24', depth: '36', coolant: 'yes', pressure: '20', spdDepthClass: 'lt7d' };
  const selected = { sd: '00-99314-24', spd: '00-99307-24150' };
  for (const material of ['', 'carbon_low', 'stainless', 'non_ferrous']) {
    const result = groups({ ...state, material }, selected);
    assert.deepEqual(result.map(group => group.chosen.tool.id), [selected.sd, selected.spd]);
    assert.deepEqual(result.map(group => [group.key, group.canSelect]), [['sd', true], ['spd', false]]);
    assert.ok(result.every(group => group.recommended === false), '可選系列與目前刀體是否最短推薦是不同判斷');
  }
});

test('舊網址spdTool指向有效長刀體也不能繞過最短系列限制', () => {
  const query = new URLSearchParams('diameter=24&depth=36&material=carbon_low&shank=32&spdTool=00-99307-24250');
  const state = { ...Selector.defaults, ...Object.fromEntries(query) };
  const selected = { spd: query.get('spdTool') };
  const result = groups(state, selected);
  const spd = result.find(group => group.key === 'spd');
  assert.equal(spd.chosen.tool.id, '00-99307-24250', '舊料號有效，保留供查看而不暗中開放選取');
  assert.equal(spd.canSelect, false);
  assert.ok(spd.selectionNote.trim());
  assert.deepEqual(result.filter(group => group.canSelect).map(group => group.key), ['sd']);
  const at100 = groups({ ...state, depth: '100' }, selected);
  assert.deepEqual(at100.map(group => [group.key, group.canSelect]), [['spd', true]]);
  assert.equal(at100[0].chosen.tool.id, selected.spd);
  const backTo36 = groups({ ...state, depth: '36' }, selected);
  assert.deepEqual(backTo36.filter(group => group.canSelect).map(group => group.key), ['sd']);
});

// 無結果說明必須根據實體刀體尺寸，不以範圍內插料號，也不把未知深度補成零。
const explain = state => Selector.explainNoMatch(packages, { ...Selector.defaults, ...state });

test('有幾何結果、未填需求或非法尺寸時，不產生無匹配診斷', () => {
  for (const state of [
    {}, { diameter: '', depth: '' }, { diameter: '10' },
    { diameter: '10', depth: '30' }, { diameter: '24', depth: '250' },
    { diameter: '40', depth: '350' }, { diameter: '10', depth: '20', material: 'non_ferrous' },
    { diameter: '0', depth: '36' }, { diameter: '-10', depth: '36' },
    { diameter: 'invalid', depth: '36' }, { diameter: '10', depth: '0' },
    { diameter: '10', depth: '-1' }, { diameter: '10', depth: 'invalid' }
  ]) assert.equal(explain(state), null, JSON.stringify(state));
});

test('Ø10深36說明SD最大T30不足6，SPD未列Ø10規格', () => {
  const result = explain({ diameter: '10', depth: '36' });
  for (const key of ['title', 'summary', 'guidance']) assert.ok(typeof result[key] === 'string' && result[key].trim(), key);
  assert.match(result.title, /10/);
  const sd = result.families.find(family => family.key === 'sd');
  const spd = result.families.find(family => family.key === 'spd');
  assert.equal(sd.name, 'Super Drill');
  assert.equal(sd.reason, 'depth');
  assert.equal(sd.maxDepth, 30);
  assert.equal(sd.shortfall, 6);
  assert.equal(sd.toolId, '00-99313-10');
  assert.equal(sd.sourcePage, 138);
  assert.match(sd.message, /30/);
  assert.match(sd.message, /36/);
  assert.equal(spd.name, 'Super Power Drill');
  assert.equal(spd.reason, 'diameter');
  assert.deepEqual(spd.diameterRange, [19, 40]);
  assert.equal(spd.maxDepth, null);
  assert.equal(spd.shortfall, null);
  assert.equal(spd.toolId, null);
  assert.ok(spd.message.trim());
});

test('Ø10.1未列標準名目刀徑，提供鄰近規格但不誤報深度不足', () => {
  const result = explain({ diameter: '10.1', depth: '20' });
  assert.match(result.title + result.summary, /10\.1/);
  assert.equal(result.families.length, 2);
  const sd = result.families.find(family => family.key === 'sd');
  assert.deepEqual(sd.diameterRange, [10, 30]);
  assert.deepEqual(sd.nearbyDiameters, [10, 10.3]);
  for (const family of result.families) {
    assert.equal(family.reason, 'diameter');
    assert.equal(family.maxDepth, null);
    assert.equal(family.shortfall, null);
    assert.equal(family.toolId, null);
  }
});

test('Ø24深251逐系列列出實體最長刀體，SD差155、SPD差1', () => {
  const result = explain({ diameter: '24', depth: '251' });
  assert.deepEqual(result.families.map(family => [family.key, family.reason, family.maxDepth, family.shortfall, family.toolId, family.sourcePage]), [
    ['sd', 'depth', 96, 155, '00-99314-24', 139],
    ['spd', 'depth', 250, 1, '00-99307-24250', 130]
  ]);
  assert.match(result.summary, /250/);
  assert.match(result.summary, /251/);
});

test('Ø40深351區分SD孔徑不符與SPD鑽深不足，不借用別孔徑容量', () => {
  const result = explain({ diameter: '40', depth: '351' });
  const sd = result.families.find(family => family.key === 'sd');
  const spd = result.families.find(family => family.key === 'spd');
  assert.equal(sd.reason, 'diameter');
  assert.deepEqual(sd.diameterRange, [10, 30]);
  assert.equal(sd.maxDepth, null);
  assert.equal(spd.reason, 'depth');
  assert.equal(spd.maxDepth, 350);
  assert.equal(spd.shortfall, 1);
  assert.equal(spd.toolId, '00-99307-40350');
  assert.equal(spd.sourcePage, 131);
});

test('未填孔徑且深351時，容量明確標為全系列而非每個刀徑', () => {
  const result = explain({ depth: '351' });
  assert.match(result.summary, /全系列/);
  assert.deepEqual(result.families.map(family => [family.key, family.reason, family.maxDepth, family.shortfall]), [
    ['sd', 'depth', 120, 231], ['spd', 'depth', 350, 1]
  ]);
  assert.equal(result.families.find(family => family.key === 'sd').toolId, '00-99314-30');
});

test('材料缺值、非鐵與舊機台參數不會改變孔徑深度無匹配原因', () => {
  const state = { diameter: '10', depth: '36' };
  const expected = explain(state);
  for (const overrides of [
    { material: '' }, { material: 'non_ferrous' }, { material: 'carbon_low' },
    { shank: '32', machineMode: 'lathe', application: 'angled', coolant: 'no', pressure: '9', machineMax: 'invalid', spdDepthClass: 'gt7d', applicationFactor: '999' }
  ]) assert.deepEqual(explain({ ...state, ...overrides }), expected, JSON.stringify(overrides));
});

test('刀體資料缺少時明示資料不足，不把未知容量與不足量補成0', () => {
  const missing = Object.fromEntries(Object.entries(packages).map(([key, entry]) => [key, { ...entry, catalog: { ...entry.catalog, tools: [] } }]));
  const result = Selector.explainNoMatch(missing, { ...Selector.defaults, diameter: '10', depth: '36' });
  assert.equal(result.families.length, 2);
  for (const family of result.families) {
    assert.equal(family.reason, 'data');
    assert.equal(family.maxDepth, null);
    assert.equal(family.shortfall, null);
    assert.equal(family.toolId, null);
    assert.equal(family.sourcePage, null);
    assert.equal(family.diameterRange, null);
    assert.deepEqual(family.nearbyDiameters, []);
    assert.ok(family.message.trim());
  }
});

test('獨立產品不引用另一產品或舊共用bundle，分類頁不載入產品app/CSS', () => {
  for (const product of Object.values(Selector.products)) {
    const directory = path.join(root, product.directory);
    const other = product.directory.includes('/SuperDrill/') ? 'SuperPowerDrill' : 'SuperDrill';
    for (const file of ['index.html', 'app.js', 'core.js', 'diagrams.js', 'styles.css']) {
      const text = fs.readFileSync(path.join(directory, file), 'utf8');
      assert.equal(text.includes('CuttingData/Drilling/'), false, `${product.name}/${file} legacy dependency`);
      assert.equal(text.includes('../Drilling/'), false, `${product.name}/${file} legacy relative dependency`);
      assert.equal(text.includes('/' + other + '/'), false, `${product.name}/${file} cross dependency`);
    }
  }
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  assert.equal(html.includes('id="setupColumn"'), false);
  assert.equal(html.includes('id="diagramPanel"'), false);
  assert.equal(/Super(?:Power)?Drill\/(?:app\.js|styles\.css)/.test(html), false);
});
