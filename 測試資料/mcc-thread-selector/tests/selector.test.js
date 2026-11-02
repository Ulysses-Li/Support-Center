/* 以官方 Quick Pick 202604 的獨立對照案例驗證選型，避免只驗證程式自己的篩選結果。
 * 頁 1–3 為內牙，頁 4–6 為外牙；同規格的多個刀片及跨欄續表不得遺失。
 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const data = require("../data.js");
const { createMccSelector, normalizeSearch } = require("../core.js");
const selector = createMccSelector(data);
const sorted = values => [...values].sort();

test("switching application can preserve a metric size written as 1 versus 1.0 in the source", () => {
  assert.equal(normalizeSearch("M6 × 1"), normalizeSearch("M6 × 1.0"));
  const internal = selector.getThreads({ side: "internal", standard: "M", query: "M6x1" })[0];
  const external = selector.getThreads({ side: "external", standard: "M" }).find(row => normalizeSearch(row.size) === normalizeSearch(internal.size));
  assert.ok(external);
  assert.deepEqual(sorted(external.insertIds), sorted(["R06007-06810", "R06010-08510", "R06010-10010"]));
});

// 僅供測試定位來源列：M6 × 1 與 M6 x 1.0 為同一個原表規格。
const canonicalSize = value => String(value).replace(/(\d+)\.0+(?=\D|$)/g, "$1").replace(/[×x]/gi, "x").replace(/\s+/g, "").toUpperCase();
function sourceRow(side, standard, size) {
  const rows = data.rows.filter(row => row.side === side && row.standard === standard && canonicalSize(row.size) === canonicalSize(size));
  assert.equal(rows.length, 1, `Expected one merged source row: ${side}/${standard}/${size}`);
  return rows[0];
}
function assertCandidates(side, standard, size, insertIds, page) {
  const row = sourceRow(side, standard, size);
  assert.deepEqual(sorted(row.insertIds), sorted(insertIds), `${side}/${standard}/${size}`);
  assert.equal(row.page, page, `Wrong source page: ${side}/${standard}/${size}`);
  assert.deepEqual(sorted(selector.getInserts({ threadId: row.id }).map(insert => insert.id)), sorted(insertIds));
}

test("source revision, all eight thread families, both sides and six source pages are retained", () => {
  assert.equal(String(data.source.revision), "202604");
  assert.match(data.source.url, /Quick_Pick_for_MCC_Thread_insert\.pdf$/);
  const standards = ["M", "MF", "UNC", "UNF", "UNEF", "G", "PT", "NPT"];
  assert.deepEqual(sorted(data.standards.map(item => item.id)), sorted(standards));
  for (const side of ["internal", "external"]) {
    assert.deepEqual(sorted(new Set(data.rows.filter(row => row.side === side).map(row => row.standard))), sorted(standards));
  }
  assert.deepEqual(sorted(new Set(data.rows.map(row => row.page))), [1, 2, 3, 4, 5, 6]);
  assert.ok(data.rows.length > 100, "The source contains more than the small metric example tables.");
});

test("customer PDF source stays on site and its bytes match the recorded source checksum", () => {
  // 對客連結必須是單一斜線開頭的站內路徑；外站網址僅保留於維護來源欄位。
  assert.match(data.source.url, /^\/(?!\/)/, "Customer source link must be root-relative.");
  const sourceUrl = new URL(data.source.url, "https://source-check.invalid");
  assert.equal(sourceUrl.origin, "https://source-check.invalid");
  assert.equal(sourceUrl.search, "");
  assert.equal(sourceUrl.hash, "");
  assert.equal(sourceUrl.pathname, "/Products/MCCThreadMill/downloads/Quick_Pick_for_MCC_Thread_insert.pdf");
  assert.equal(data.source.originalUrl, "https://nine9.jic-tools.com.tw/upload_files/download/Quick_Pick_thread_type/Quick_Pick_for_MCC_Thread_insert.pdf");

  const siteRoot = path.resolve(__dirname, "../../..");
  const pdfPath = path.resolve(siteRoot, decodeURIComponent(sourceUrl.pathname).slice(1));
  assert.ok(pdfPath.startsWith(`${siteRoot}${path.sep}`), "Source PDF must resolve inside this site.");
  assert.ok(fs.existsSync(pdfPath), `Missing on-site source PDF: ${pdfPath}`);
  assert.ok(fs.statSync(pdfPath).isFile(), "On-site source must be a file.");
  assert.match(data.source.sha256, /^[a-f\d]{64}$/i, "Source checksum must be a SHA-256 value.");
  const checksum = crypto.createHash("sha256").update(fs.readFileSync(pdfPath)).digest("hex");
  assert.equal(checksum, data.source.sha256.toLowerCase(), "PDF bytes differ from the source used to build the selector.");
});

test("all source keys are unique, candidates are merged, and IDs resolve to positive catalog diameters", () => {
  const recordIds = new Set(), sourceKeys = new Set();
  const insertMap = new Map(data.inserts.map(insert => [insert.id, insert]));
  assert.equal(insertMap.size, 17, "Quick Pick includes 17 distinct insert part numbers.");
  assert.equal(insertMap.size, data.inserts.length);
  for (const insert of data.inserts) assert.ok(Number.isFinite(insert.diameter) && insert.diameter > 0, insert.id);
  for (const row of data.rows) {
    assert.ok(["internal", "external"].includes(row.side), `Unknown thread side ${row.side}`);
    assert.ok(data.standards.some(standard => standard.id === row.standard), `Unknown standard ${row.standard}`);
    assert.ok(typeof row.id === "string" && row.id.length > 0);
    assert.ok(!recordIds.has(row.id), `Duplicate row ID ${row.id}`);
    recordIds.add(row.id);
    const key = [row.side, row.standard, canonicalSize(row.size)].join("|");
    assert.ok(!sourceKeys.has(key), `Duplicate unmerged source row ${key}`);
    sourceKeys.add(key);
    assert.ok(row.insertIds.length > 0, key);
    assert.equal(new Set(row.insertIds).size, row.insertIds.length, `Duplicate candidate ${key}`);
    for (const id of row.insertIds) assert.ok(insertMap.has(id), `Missing insert ${id} for ${key}`);
    assert.ok(row.side === "internal" ? row.page >= 1 && row.page <= 3 : row.page >= 4 && row.page <= 6, `Wrong page/side ${key}`);
  }
});

test("M6 x 1 has distinct internal and external candidates; M8 also changes with side", () => {
  assertCandidates("internal", "M", "M6 x 1", ["R06005-05010"], 2);
  assertCandidates("external", "M", "M6 x 1", ["R06007-06810", "R06010-08510", "R06010-10010"], 5);
  assertCandidates("internal", "M", "M8 x 1.25", ["R06007-06810"], 2);
  assertCandidates("external", "M", "M8 x 1.25", ["R06010-10010"], 5);
});

test("metric fine pitch candidates and bottom-of-column continuation rows match pages 1 and 4", () => {
  assertCandidates("internal", "MF", "MF8 x 0.75", ["R06005-05006"], 1);
  assertCandidates("internal", "MF", "MF8 x 1", ["R06005-05010", "R06007-06810"], 1);
  assertCandidates("internal", "MF", "MF10 x 1.25", ["R06007-06810", "R06010-08510"], 1);
  assertCandidates("internal", "MF", "MF50 x 2", ["R06010-10010"], 1);
  assertCandidates("internal", "MF", "MF80 x 2", ["R06010-10010"], 1);
  assertCandidates("external", "MF", "MF4 x 0.5", ["R06005-05006"], 4);
  assertCandidates("external", "MF", "MF6 x 0.75", ["R06005-05010", "R06007-06810", "R06010-08510"], 4);
  assertCandidates("external", "MF", "MF8 x 1", ["R06007-06810", "R06010-08510", "R06010-10010"], 4);
  assertCandidates("external", "MF", "MF10 x 1.25", ["R06010-10010"], 4);
  assertCandidates("external", "MF", "MF50 x 1.5", ["R06010-10010"], 4);
});

test("UNC dedicated inserts are not replaced with generic pitch-compatible inserts", () => {
  assertCandidates("internal", "UNC", "UNC 1/4-20", ["R06005-05012"], 2);
  assertCandidates("internal", "UNC", "UNC 5/16-18", ["R06005-05613"], 2);
  assertCandidates("internal", "UNC", "UNC 3/8-16", ["R06007-07216"], 2);
  assertCandidates("internal", "UNC", "UNC 7/16-14", ["R06010-09020"], 2);
  assertCandidates("internal", "UNC", "UNC 1/2-13", ["R06010-09522", "R06010-10010"], 2);
  assertCandidates("internal", "UNC", "UNC 9/16-12", ["R06010-10024"], 2);
  assertCandidates("external", "UNC", "UNC 1/4-20", ["R06010-10010"], 5);
});

test("UNF and UNEF retain side-specific multi-candidate merged cells", () => {
  assertCandidates("internal", "UNF", "UNF 1/4-28", ["R06005-05006", "R06005-05010"], 2);
  assertCandidates("external", "UNF", "UNF 1/4-28", ["R06007-06810", "R06010-08510"], 5);
  assertCandidates("internal", "UNEF", "UNEF 1/4-32", ["R06005-05006"], 2);
  assertCandidates("external", "UNEF", "UNEF 1/4-32", ["R06005-05010", "R06007-06810", "R06010-08510"], 6);
  assertCandidates("internal", "UNEF", "UNEF 1 11/16-18", ["R06010-08510", "R06010-10010"], 2);
  assertCandidates("external", "UNEF", "UNEF 1 11/16-18", ["R06010-10010"], 6);
});

test("parallel G and tapered PT/NPT use their own catalog diameters on both sides", () => {
  for (const [side, page] of [["internal", 3], ["external", 6]]) {
    assertCandidates(side, "G", "G (PF) 1/16", ["R05507-06512"], page);
    assertCandidates(side, "G", "G (PF) 1/8", ["R05507-06512"], page);
    assertCandidates(side, "G", "G (PF) 1/4", ["R05510-10018"], page);
    assertCandidates(side, "PT", "PT 1/4", ["R05510-09516"], page);
    assertCandidates(side, "PT", "PT 1/2", ["R05510-10025"], page);
    assertCandidates(side, "NPT", "NPT 1/4", ["R06010-09808"], page);
    assertCandidates(side, "NPT", "NPT 1/2", ["R06010-10810"], page);
  }
  for (const [id, diameter] of [["R05507-06512", 6.56], ["R05510-09516", 9.5], ["R06010-09808", 9.8], ["R06010-10810", 10.8]]) {
    assert.equal(selector.getInsert(id).diameter, diameter);
  }
  assert.equal(selector.getStandard("G").kind, "parallel");
  assert.equal(selector.getStandard("PT").kind, "tapered");
  assert.equal(selector.getStandard("NPT").angle, 60);
});

test("every forward candidate is reverse-searchable and reverse results contain no extra relation", () => {
  for (const row of data.rows) {
    assert.equal(selector.getRow(row.id)?.id, row.id);
    assert.deepEqual(sorted(selector.getInserts({ threadId: row.id }).map(insert => insert.id)), sorted(row.insertIds));
    for (const insertId of row.insertIds) {
      const reverse = selector.getThreads({ side: row.side, standard: row.standard, insertId });
      assert.ok(reverse.some(item => item.id === row.id), `Lost reverse relation ${row.id}/${insertId}`);
      assert.ok(reverse.every(item => item.side === row.side && item.standard === row.standard && item.insertIds.includes(insertId)));
    }
  }
});

test("keyboard-friendly search normalizes spaces and multiplication signs without mixing thread families", () => {
  assert.equal(normalizeSearch("M6 × 1"), normalizeSearch("m6x1"));
  const expected = sourceRow("internal", "M", "M6x1");
  const matches = selector.getThreads({ side: "internal", standard: "M", query: "M6x1" });
  assert.ok(matches.some(row => row.id === expected.id));
  assert.ok(matches.every(row => row.side === "internal" && row.standard === "M"));
  assert.deepEqual(selector.getInserts({ query: "r06005-05010" }).map(insert => insert.id), ["R06005-05010"]);
});

test("unlisted thread sizes and unknown identifiers remain empty instead of extrapolating a match", () => {
  // 空結果表示此版選用表未列出，不能把它解讀為工件一定無法加工。
  assert.equal(selector.getThreads({ side: "internal", standard: "M", query: "M20x2.5" }).length, 0);
  assert.equal(selector.getThreads({ side: "external", standard: "PT", query: "PT 2" }).length, 0);
  assert.equal(selector.getThreads({ side: "internal", insertId: "R-NOT-IN-CATALOG" }).length, 0);
  assert.equal(selector.getInserts({ threadId: "not-a-catalog-row" }).length, 0);
  assert.equal(selector.getInserts({ query: "not-a-catalog-insert" }).length, 0);
  assert.ok(selector.getRow("not-a-catalog-row") == null);
});
