/* 真實型錄邊界與配對回歸：不以虛構表格取代已核對的正式資料。 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const core = require("../core.js");
const read = file => JSON.parse(fs.readFileSync(file, "utf8"));
const common = read(path.resolve(__dirname, "../data/common.json"));
function load(group) {
  const folder = path.resolve(__dirname, "../../", group, "data");
  return core.normalizeCatalog(read(path.join(folder, "catalog.json")), read(path.join(folder, "cutting-data.json")), common);
}
const x = load("X060"), v = load("V060"), w = load("W060"), n = load("N9MTW");
const wBase = { width: 0.15, depth: 0.1, material: "carbon_steel", insertId: "W06004S101|NC2032", holderId: "00-99619-W060-04" };
const nBase = { width: 0.5, depth: 0.2, material: "alloy_steel", angle: 90, insertId: "N9MT080201W|NC40", holderId: "00-99616-10" };

test("正式資料正規化保留未知值與原始欄位，不把null變成0", () => {
  assert.equal(x.inserts.length, 21);
  assert.equal(x.inserts.find(item => item.form === "radius").limits.Wmin, null);
  assert.equal(w.inserts[0].dimensions.Re, null);
  assert.equal(w.holders[0].L1, null);
  assert.equal(w.holders[0].rpm_limit, null);
  assert.equal(w.inserts[0].partBase, w.inserts[0].part_base);
  assert.equal(n.holders.find(item => item.id === "00-99616-3/8").shank_diameter.unit, "inch");
});

test("同一刀片必須同時滿足寬與深，不能用W060系列包絡拼湊", () => {
  const result = core.filterInserts(w, { width: 0.1, depth: 0.201, material: "carbon_steel" });
  assert.equal(result.valid, true);
  assert.equal(result.matches.length, 0);
  assert.equal(result.reviewMatches.length, 0);
  assert.equal(core.filterInserts(w, { width: 0.1, depth: 0.2, material: "carbon_steel" }).matches[0].partBase, "W06004S101");
});

test("角度與底形要配合同一型號，X060圓弧底未知最小寬只列需確認", () => {
  assert.equal(core.filterInserts(x, { width: 0.7, depth: 0.5, angle: 30, material: "carbon_steel" }).candidates.length, 0);
  const result = core.filterInserts(x, { width: 0.7, depth: 0.5, angle: 60, material: "carbon_steel" });
  assert.ok(result.matches.every(item => item.form === "radius_angled" && item.angle === 60));
  assert.ok(result.reviewMatches.some(item => item.form === "radius"));
  const radius = result.reviewMatches.find(item => item.form === "radius");
  assert.equal(core.selectCutting(x, radius.id, { width: 0.7, depth: 0.5, material: "carbon_steel" }).valid, false);
  assert.ok(result.geometryCaution.includes("精確"));
});

test("材料切換會更換W03實體牌號，舊選擇不得繼續套用", () => {
  const base = { width: 0.3, depth: 0.1, angle: 60 };
  const steel = core.filterInserts(v, { ...base, material: "carbon_steel" });
  const stainless = core.filterInserts(v, { ...base, material: "stainless_steel" });
  assert.deepEqual(steel.matches.map(item => item.id), ["V06006T1W03|NC2032"]);
  assert.deepEqual(stainless.matches.map(item => item.id), ["V06006T1W03|NC9036"]);
  assert.equal(core.selectCutting(v, steel.matches[0].id, { ...base, material: "stainless_steel" }).valid, false);
});

test("V045小線寬只能配其表列材料，不借用其他牌號或W03表", () => {
  const base = { width: 0.5, depth: 0.1, angle: 45 };
  assert.equal(core.filterInserts(v, { ...base, material: "carbon_steel" }).matches.length, 0);
  assert.deepEqual(core.filterInserts(v, { ...base, material: "non_ferrous" }).matches.map(item => item.id), ["V04506T1W06|NC9031"]);
});

test("硬鋼共表只支援已存在的V060 NC2035，不生成V045假料號", () => {
  const result = core.filterInserts(v, { width: 0.7, depth: 0.3, material: "hardened_steel", hrc: 45 });
  assert.deepEqual(result.matches.map(item => item.id), ["V06006T1W06|NC2035"]);
  assert.equal(core.filterInserts(v, { width: 0.7, depth: 0.3, angle: 45, material: "hardened_steel", hrc: 45 }).candidates.length, 0);
});

test("HRC上限保持嚴格小於，缺硬度時不自動推薦切削值", () => {
  const xState = { depth: 0.2, angle: 45, form: "radius_angled", material: "hardened_steel" };
  const id = "X060A45W020R|NC2035";
  assert.equal(core.selectCutting(x, id, { ...xState, hrc: 49.999 }).valid, true);
  assert.equal(core.selectCutting(x, id, { ...xState, hrc: 50 }).valid, false);
  assert.equal(core.selectCutting(x, id, xState).status, "review");
  const vState = { depth: 0.3, material: "hardened_steel" };
  assert.equal(core.selectCutting(v, "V06006T1W06|NC2035", { ...vState, hardness: 55.999 }).valid, true);
  assert.equal(core.selectCutting(v, "V06006T1W06|NC2035", { ...vState, hardness: 56 }).valid, false);
});

test("N9MT90度0.8至0.9mm只留幾何候選，不給未列切削範圍", () => {
  const state = { ...nBase, depth: 0.85 };
  assert.equal(core.filterInserts(n, state).matches.length, 0);
  assert.equal(core.filterInserts(n, state).reviewMatches.length, 1);
  const cutting = core.selectCutting(n, nBase.insertId, state);
  assert.equal(cutting.status, "review");
  assert.equal(cutting.rpmRange, null);
  assert.equal(core.calculate(n, state).feedRate, null);
  assert.equal(core.selectCutting(n, nBase.insertId, { ...state, depth: 0.8 }).valid, true);
});

test("100mm XL要有鋁細分且同系列，非鐵大類或鋼材不能放行", () => {
  const id = "X060A45W020R|XP9001";
  const generic = core.getHolders(x, id, { material: "non_ferrous" });
  assert.ok(!generic.some(holder => holder.id.endsWith("XL")));
  assert.ok(core.getHolders(x, id, { material: "non_ferrous", materialDetail: "aluminum" }).some(holder => holder.id.endsWith("XL")));
  assert.ok(core.getHolders(x, id, { material: "non_ferrous", materialDetail: "aluminum_alloy" }).some(holder => holder.id.endsWith("XL")));
  assert.ok(!core.getHolders(x, id, { material: "carbon_steel", materialDetail: "aluminum" }).some(holder => holder.id.endsWith("XL")));
  assert.ok(core.getHolders(v, "V04506T1W06|NC2071", {}).every(holder => holder.family === "V045"));
});

test("網站中值受機台轉速限制，但機台低於型錄最小轉速時不冒充推薦", () => {
  const cutting = core.selectCutting(w, wBase.insertId, wBase);
  const normal = core.recommendValues(cutting, {});
  assert.equal(normal.rpm, 24000);
  assert.ok(Math.abs(normal.feed - 0.0085) < 1e-12);
  assert.equal(core.recommendValues(cutting, { machineMax: 12000 }).rpm, 12000);
  const tooLow = core.recommendValues(cutting, { machineMax: 7999 });
  assert.equal(tooLow.valid, false);
  assert.equal(tooLow.rpm, null);
});

test("F=S×f，Z下刀進給50%，不乘W060兩刃或N9MT四刃", () => {
  const wr = core.calculate(w, { ...wBase, rpm: 10000, feed: 0.01 });
  const nr = core.calculate(n, { ...nBase, rpm: 10000, feed: 0.01 });
  for (const result of [wr, nr]) {
    assert.equal(result.valid, true);
    assert.equal(result.feedRate, 100);
    assert.equal(result.plungeFeed, 50);
    assert.equal(result.mode, "manual");
  }
});

test("自動模式忽略上一組顯示值，重新依新配對取中值", () => {
  const result = core.calculate(w, { ...wBase, rpm: 500, feed: 4, valueMode: "site_midpoint" });
  assert.equal(result.valid, true);
  assert.equal(result.rpm, 24000);
  assert.ok(Math.abs(result.feed - 0.0085) < 1e-12);
  assert.equal(result.mode, "site_midpoint");
});

test("手動範圍外只作明示換算，機台或刀柄不相容仍阻止輸出", () => {
  const manual = core.calculate(w, { ...wBase, rpm: 4000, feed: 0.01, machineMax: 6000 });
  assert.equal(manual.valid, true);
  assert.ok(manual.warnings.some(text => text.includes("超出此配對")));
  assert.equal(manual.label, "手動數值換算");
  assert.equal(core.calculate(w, { ...wBase, rpm: 7000, feed: 0.01, machineMax: 6000 }).valid, false);
  assert.equal(core.calculate(w, { ...wBase, holderId: "00-99619-X060-06", rpm: 10000, feed: 0.01 }).valid, false);
  assert.equal(core.calculate(n, { ...nBase, material: "cast_iron", angle: 60, insertId: "N9MT080201W-60|NC40", holderId: "00-99616-10", rpm: 10000, feed: 0.01 }).valid, true);
  assert.equal(core.calculate(n, { ...nBase, material: "non_ferrous", insertId: "N9MT080201W-60|NC40", angle: 60, rpm: 10000, feed: 0.01 }).valid, false);
});

test("空白、非法尺寸、缺材料和缺刀柄不輸出加工數值", () => {
  assert.equal(core.filterInserts(w, { width: "", depth: "" }).ready, false);
  assert.equal(core.calculate(w, { ...wBase, width: "", depth: "" }).valid, false);
  for (const bad of [0, -1, Infinity, "bad"]) assert.equal(core.filterInserts(w, { width: bad }).valid, false);
  assert.equal(core.calculate(w, { ...wBase, material: "" }).rpm, null);
  assert.equal(core.calculate(w, { ...wBase, holderId: "" }).feedRate, null);
  assert.equal(core.calculate(w, { ...wBase, rpm: 0, feed: 0.01 }).valid, false);
  assert.equal(core.calculate(w, { ...wBase, rpm: 10000, feed: NaN }).valid, false);
});

test("切削表Ap與原研究資料保持不變，不執行精修累加", () => {
  const before = JSON.stringify([w.inserts, w.rows, w.holders]);
  core.calculate(w, { ...wBase, valueMode: "site_midpoint" });
  core.filterInserts(w, { width: 0.1, depth: 0.3, material: "non_ferrous" });
  assert.equal(JSON.stringify([w.inserts, w.rows, w.holders]), before);
  const result = core.calculate(v, { width: 0.7, depth: 2, material: "carbon_steel", insertId: "V06006T1W06|NC2032", holderId: "00-99619-V060-06" });
  assert.equal(result.valid, true);
  assert.deepEqual(result.cutting.depthPasses.numbered_passes, [0.8, 0.6, 0.3, 0.2, 0.1, null]);
  assert.equal(result.cutting.depthPasses.finishing, 0.05);
  assert.equal(Object.hasOwn(result, "totalPassDepth"), false);
});
