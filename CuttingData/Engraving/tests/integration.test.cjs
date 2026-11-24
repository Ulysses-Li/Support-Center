/* 四個入口共用核心的整合驗證；固定範例核算進給，並檢查正式資源及導覽。 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const core = require("../core.js");
const diagrams = require("../diagrams.js");
const root = path.resolve(__dirname, "../../..");
const load = file => JSON.parse(fs.readFileSync(file, "utf8"));
const common = load(path.join(__dirname, "../data/common.json"));
const directories = ["X060", "V060", "W060", "N9MTW"];
const catalog = directory => core.normalizeCatalog(load(path.join(root, "CuttingData", directory, "data/catalog.json")), load(path.join(root, "CuttingData", directory, "data/cutting-data.json")), common);

test("四組正式資料完整、配對引用存在，執行期沒有研究資料路徑", () => {
  const totals = { inserts: 0, holders: 0, rows: 0, kits: 0 };
  for (const directory of directories) {
    const base = path.join(root, "CuttingData", directory);
    for (const filename of ["catalog.json", "cutting-data.json", "selection-rules.json"]) {
      const text = fs.readFileSync(path.join(base, "data", filename), "utf8");
      assert.ok(!text.includes("測試資料"), `${directory}/${filename} 不得依賴樣板`);
      const data = JSON.parse(text);
      for (const key of ["pdf_file", "common_file"]) assert.ok(fs.existsSync(path.resolve(base, data.source[key])), `${directory} 缺正式來源 ${key}`);
    }
    const data = catalog(directory);
    totals.inserts += data.inserts.length;
    totals.holders += data.holders.length;
    totals.rows += data.rows.length;
    totals.kits += data.starterKits.length;
    const ids = new Set(data.inserts.map(insert => insert.id));
    for (const row of data.rows) {
      assert.ok(row.insertIds.length > 0);
      for (const id of row.insertIds) assert.ok(ids.has(id));
    }
  }
  assert.deepEqual(totals, { inserts: 36, holders: 17, rows: 74, kits: 7 });
});

test("四個產品的固定範例直接得到每轉進給換算，沒有乘可換刃角數", () => {
  const fixtures = [
    { directory: "X060", input: { width: 0.2, depth: 0.1, material: "carbon_steel", angle: 30, insertId: "X060A30W020R|NC2032", holderId: "00-99619-X060-06" }, rpm: 24000, feed: 0.0055, rate: 132, plunge: 66 },
    { directory: "V060", input: { width: 0.3, depth: 0.1, material: "stainless_steel", angle: 60, insertId: "V06006T1W03|NC9036", holderId: "00-99619-V060-06" }, rpm: 21500, feed: 0.0065, rate: 139.75, plunge: 69.875 },
    { directory: "W060", input: { width: 0.15, depth: 0.1, material: "carbon_steel", angle: 60, insertId: "W06004S101|NC2032", holderId: "00-99619-W060-04" }, rpm: 24000, feed: 0.0085, rate: 204, plunge: 102 },
    { directory: "N9MTW", input: { width: 0.5, depth: 0.2, material: "alloy_steel", angle: 90, insertId: "N9MT080201W|NC40", holderId: "00-99616-10" }, rpm: 12500, feed: 0.014, rate: 175, plunge: 87.5 }
  ];
  for (const fixture of fixtures) {
    const result = core.calculate(catalog(fixture.directory), fixture.input);
    assert.equal(result.valid, true, `${fixture.directory}: ${result.errors.join(" ")}`);
    for (const [key, expected] of [["rpm", fixture.rpm], ["feed", fixture.feed], ["feedRate", fixture.rate], ["plungeFeed", fixture.plunge]]) assert.ok(Math.abs(result[key] - expected) < 1e-8, `${fixture.directory} ${key}`);
  }
});

test("Cutting Data 四張卡啟用並導向各自的正式工具", () => {
  const context = { document: { addEventListener() {} } };
  vm.runInNewContext(fs.readFileSync(path.join(root, "CuttingData/cutting-data.js"), "utf8") + "\nthis.products = CUTTING_DATA_PRODUCTS;", context);
  const expected = { x060: "./X060/index.html", v060: "./V060/index.html", w060: "./W060/index.html", n9mtw: "./N9MTW/index.html" };
  for (const [id, href] of Object.entries(expected)) {
    const product = context.products.find(item => item.id === id);
    assert.equal(product.status, "Available");
    assert.equal(product.href, href);
    assert.ok(fs.existsSync(path.resolve(root, "CuttingData", href)));
  }
});

test("尺寸圖保留需求與型錄的差異、實際數字與未知欄位", () => {
  const data = catalog("X060");
  const svg = diagrams.render({ insert: data.inserts.find(item => item.id === "X060A30W020R|NC2032"), holder: data.holders.find(item => item.id === "00-99619-X060-06"), state: { width: 0.2, depth: 0.1 } });
  assert.match(svg, /需求 W 0\.2 mm/);
  assert.match(svg, /需求 t 0\.1 mm/);
  assert.match(svg, /總長 40 mm/);
  assert.match(svg, /Ø6 mm/);
  assert.match(svg, /非比例/);
  const w03 = catalog("V060").inserts.find(item => item.id === "V06006T1W03|NC9036");
  assert.match(diagrams.render({ insert: w03 }), /型錄未列/);
  const smallHolder = catalog("V060").holders.find(item => item.id === "00-99619-V060-04");
  const smallDrawing = diagrams.render({ insert: w03, holder: smallHolder });
  assert.match(smallDrawing, /後段 12 mm/);
  assert.match(smallDrawing, /前頭 Ø6 mm/);
  assert.ok(!smallDrawing.includes("前端 12 mm"));
  assert.ok(!diagrams.render({ insert: { ...w03, part_base: '<script>alert(1)</script>' } }).includes("<script>"));
});

test("正式共用型錄與原始已驗證來源的SHA256相同", () => {
  const pdf = fs.readFileSync(path.join(__dirname, "../sources/Engraving-Tool-p068-083.pdf"));
  assert.equal(crypto.createHash("sha256").update(pdf).digest("hex"), "54bce9c904371810eed1641882c151834a082233fe5a645b7ee5a62f6d621052");
});
