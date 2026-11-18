'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const core=require('../core.js'),Locale=require('../locale.js');
const read=name=>JSON.parse(fs.readFileSync(path.join(__dirname,'../data',name),'utf8'));
const product=read('catalog.json'),cutting=read('cutting-data.json');
const catalog=core.normalizeCatalog(product,cutting);
const tool=id=>catalog.tools.find(x=>x.id===id);
const sdState=extra=>Object.assign({diameter:20,depth:25,material:'carbon_low',shank:'',machineMode:'rotating',application:'regular_surface',coolant:'yes',pressure:''},extra);

test('CommonJS 與瀏覽器全域使用相同的純函式介面', () => {
  const context = { window: {} };
  context.globalThis = context.window;
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../core.js'), 'utf8'), context);
  assert.deepEqual(Object.keys(context.window.SuperDrillCore), ['normalizeCatalog', 'getMaterialSupport', 'filterTools', 'selectCutting', 'calculate']);
});


test('未選材料保留幾何；不支援材料及錯誤尺寸不等於全部', () => {
  assert.equal(core.filterTools(catalog, {}).length, 51);
  assert.equal(core.filterTools(catalog, { material: 'non_ferrous' }).length, 0);
  assert.ok(core.filterTools(catalog, {}).every(item => item.eligibility === 'review'));
  for (const bad of [0, -1, 'abc', Infinity]) {
    assert.deepEqual(core.filterTools(catalog, { diameter: bad }), []);
  }
});


test('旋轉選型只接受標稱孔徑，不用 Dmax 容納不同孔徑', () => {
  assert.equal(core.filterTools(catalog, sdState({ diameter: 10.25 }), { family: 'sd' }).length, 0);
  assert.equal(core.filterTools(catalog, sdState({ diameter: 10.25, machineMode: 'lathe' }), { family: 'sd' }).length, 0);
});


test('鑽孔深度 T 的邊界包含相等，超過就排除；柄徑亦精確比對', () => {
  const at = core.filterTools(catalog, sdState({ diameter: 10, depth: 30, shank: 20 }), { family: 'sd' });
  assert.equal(at.length, 1);
  assert.equal(at[0].tool.id, '00-99313-10');
  assert.equal(at[0].depthFits, true);
  assert.equal(core.filterTools(catalog, sdState({ diameter: 10, depth: 30.001 }), { family: 'sd' }).length, 0);
  assert.equal(core.filterTools(catalog, sdState({ diameter: 10, depth: 12, shank: 32 }), { family: 'sd' }).length, 0);
});


test('SD 選 4D 刀體，即使淺孔也維持 4D 切削列', () => {
  const state = sdState({ diameter: 20, depth: 10 });
  const a = core.selectCutting(catalog, tool('00-99313-20'), state);
  const b = core.selectCutting(catalog, tool('00-99314-20'), state);
  assert.equal(a.status, 'ready');
  assert.equal(b.status, 'ready');
  assert.deepEqual(a.vcRange, [80, 250]);
  assert.deepEqual(b.vcRange, [60, 180]);
  assert.equal(b.depthClass, 'T=4D');
  assert.equal(b.insertGrade, 'NC2032');
  assert.equal(b.sourcePage, 141);
});


test('材料支援只依自身資料列，N/S及未知材料一律不推薦', () => {
  assert.deepEqual(core.getMaterialSupport(catalog, ''), { supported: null, sourcePage: null, note: 'Select a workpiece material first.' });
  assert.equal(core.getMaterialSupport(catalog, 'carbon_low').supported, true);
  assert.equal(core.getMaterialSupport(catalog, 'carbon_low').sourcePage, 141);
  for (const material of ['non_ferrous', 'heat_resistant', 'unknown_material', 'toString', '__proto__']) {
    const state = sdState({ material, valuesMode: 'manual', vc: 100, feed: 0.06 });
    const support = core.getMaterialSupport(catalog, material);
    assert.equal(support.supported, false); assert.equal(support.sourcePage, 141);
    assert.equal(support.note, Locale.text(material === 'non_ferrous' ? '本系列不建議用於非鐵金屬' : '型錄未列此材料適用配對，不提供推薦'));
    const result = core.selectCutting(catalog, tool('00-99313-20'), state);
    assert.equal(result.status, 'blocked'); assert.equal(result.materialSupported, false);
    assert.equal(result.vcRange, null); assert.equal(result.feedRange, null);
    assert.equal(result.baseVcRange, null); assert.equal(result.baseFeedRange, null);
    assert.deepEqual(result.notes, [support.note]); assert.deepEqual(core.filterTools(catalog, state), []);
  }
  // 材料選單本身不等於有適用資料列。
  const emptyRows = core.normalizeCatalog(product, { ...cutting, section: { ...cutting.section, cutting_rows: [] } });
  assert.equal(core.getMaterialSupport(emptyRows, 'carbon_low').supported, false);
});

test('SD 型錄空白進給維持 missing，不把橫線當 0 或借用鄰欄', () => {
  const artificial = Object.assign({}, tool('00-99313-10'), { ratio: 4 });
  const result = core.selectCutting(catalog, artificial, sdState({ diameter: 10, depth: 20 }));
  assert.equal(result.status, 'missing');
  assert.equal(result.materialSupported, true);
  assert.equal(result.baseFeedRange, null);
  assert.equal(result.vcRange, null);
});


test('SD 的車床流程另列 review，不能因標稱配對便稱 ready', () => {
  const result = core.selectCutting(catalog, tool('00-99313-20'), sdState({ machineMode: 'lathe' }));
  assert.equal(result.status, 'review');
  assert.ok(result.notes.some(note => note.includes('Dmax')));
});


test('SD 單點 80% 同時修正 Vc 與 f，不用刀片數倍增', () => {
  const result = core.selectCutting(catalog, tool('00-99313-20'), sdState({ application: 'cross_holes' }));
  assert.equal(result.status, 'ready');
  assert.deepEqual(result.applicationFactorRange, [0.8, 0.8]);
  assert.deepEqual(result.vcRange, [64, 200]);
  assert.ok(Math.abs(result.feedRange[0] - 0.048) < 1e-12);
  assert.ok(Math.abs(result.feedRange[1] - 0.08) < 1e-12);
  assert.equal(result.applicationSourcePage, 140);
});


test('SD 70–80% 不暗取中值；必須明選區間內百分數', () => {
  const state = sdState({ application: 'stack_drilling' });
  const pending = core.selectCutting(catalog, tool('00-99313-20'), state);
  assert.equal(pending.status, 'review');
  assert.deepEqual(pending.applicationFactorRange, [0.7, 0.8]);
  assert.deepEqual(pending.baseVcRange, [80, 250]);
  assert.equal(pending.vcRange, null);
  assert.equal(pending.feedRange, null);
  assert.equal(pending.vcMedian, null);
  const selected = core.selectCutting(catalog, tool('00-99313-20'), Object.assign({}, state, { applicationFactor: 75 }));
  assert.equal(selected.status, 'ready');
  assert.deepEqual(selected.vcRange, [60, 187.5]);
  for (const factor of [60, 81, 'abc']) {
    assert.equal(core.selectCutting(catalog, tool('00-99313-20'), Object.assign({}, state, { applicationFactor: factor })).status, 'review');
  }
});


test('直接呼叫選表仍檢查幾何，不可繞過篩選器使用過深刀體', () => {
  const result = core.selectCutting(catalog, tool('00-99313-20'), sdState({ depth: 61 }));
  assert.equal(result.status, 'blocked');
  assert.equal(result.vcRange, null);
});


test('計算保持完整小數，機台上限同步降低每分鐘進給', () => {
  const normal = core.calculate({ D: 20, vc: 100, feed: 0.08 });
  assert.equal(normal.rpm, 100000 / (Math.PI * 20));
  assert.equal(normal.feedRate, normal.rpm * 0.08);
  assert.equal(normal.capped, false);
  const limited = core.calculate({ D: 20, vc: 100, feed: 0.08, machineMax: 1200 });
  assert.equal(limited.rpm, 1200);
  assert.equal(limited.feedRate, 96);
  assert.equal(limited.rpmUncapped, normal.rpm);
  assert.equal(limited.capped, true);
});


test('切削進給不乘外周片數、內外刀片或四個切削刃', () => {
  const result = core.calculate({ D: 40, vc: 100, feed: 0.1, peripheryQty: 2, cuttingEdges: 4 });
  assert.equal(result.feedRate, 100000 / (Math.PI * 40) * 0.1);
});


test('空白、非數值、非正值與溢位計算均回 null', () => {
  for (const value of ['', null, undefined, true, {}, [], 0, -1, NaN, Infinity, '3x']) {
    for (const key of ['D', 'vc', 'feed']) {
      assert.equal(core.calculate(Object.assign({ D: 20, vc: 100, feed: 0.1 }, { [key]: value })), null);
    }
  }
  for (const maximum of [0, -1, Infinity, 'bad']) {
    assert.equal(core.calculate({ D: 20, vc: 100, feed: 0.1, machineMax: maximum }), null);
  }
  assert.equal(core.calculate({ D: 1e-300, vc: 1e300, feed: 1 }), null);
  assert.ok(core.calculate({ D: '20', vc: '100', feed: '0.1', machineMax: '' }));
});


test('單產品完整實體資料與印刷/拆分PDF頁次',()=>{
 assert.equal(catalog.tools.length,51);assert.equal(catalog.tools.filter(x=>x.ratio===3).length,36);assert.equal(catalog.tools.filter(x=>x.ratio===4).length,15);
 assert.equal(new Set(catalog.tools.map(x=>x.id)).size,51);assert.ok(catalog.tools.every(x=>x.family==='sd'&&Math.abs(x.T-x.D*x.ratio)<1e-10));
 const x=tool('00-99313-10');assert.equal(x.T,30);assert.equal(x.L,49);assert.equal(x.L1,49);assert.equal(x.sourcePage,138);assert.equal(x.centerQty,1);assert.equal(x.peripheryQty,1);assert.equal(x.centerModel,x.peripheryModel);
 assert.equal(x.raw.source.pdf_page,3);assert.equal(x.raw.source.original_pdf_page,11);
 assert.equal(cutting.section.cutting_rows.length,16);assert.equal(cutting.section.source.pdf_page,6);assert.equal(cutting.section.source.original_pdf_page,14);
 assert.equal(core.selectCutting(catalog,tool('00-99313-20'),sdState()).sourcePdfPage,6);
});
test('另一家族資料及刀體被拒絕，不跨產品套用',()=>{
 assert.equal(core.normalizeCatalog({...product,product:'Other Drill'},cutting).tools.length,0);
 const other={...tool('00-99313-20'),family:'other'};
 assert.equal(core.selectCutting(catalog,other,sdState()).status,'blocked');
 assert.equal(core.filterTools({...catalog,tools:[other]},sdState()).length,0);
});
test('本產品不使用未刊載的數字壓力門檻',()=>{
 assert.equal(core.selectCutting(catalog,tool('00-99313-20'),sdState({pressure:2})).status,'ready');
 assert.equal(core.selectCutting(catalog,tool('00-99313-20'),sdState({coolant:'no'})).status,'review');
});
test('選表篩選不修改輸入型錄與狀態',()=>{
 const before=JSON.stringify({product,cutting});const state=Object.freeze(sdState());
 core.filterTools(catalog,state);core.selectCutting(catalog,tool('00-99313-20'),state);
 assert.equal(JSON.stringify({product,cutting}),before);
});

test('core messages default to English and accept an explicit Traditional Chinese language',()=>{
 const en=core.selectCutting(catalog,tool('00-99313-20'),sdState({material:'non_ferrous'}));
 const zh=core.selectCutting(catalog,tool('00-99313-20'),sdState({material:'non_ferrous',lang:'zh-TW'}));
 assert.equal(en.notes[0],'This series is not recommended for non-ferrous metals');assert.equal(zh.notes[0],'本系列不建議用於非鐵金屬');assert.equal(en.status,zh.status);
 for(const state of [{diameter:-1},{depth:100},{shank:32},{machineMode:'lathe'},{coolant:'no'},{application:'stack_drilling'}]){
  const result=core.selectCutting(catalog,tool('00-99313-20'),sdState(state));assert.doesNotMatch(result.notes.join(' '),/[\u3400-\u9fff]/);
 }
});
