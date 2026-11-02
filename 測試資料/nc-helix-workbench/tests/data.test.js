/* 以官方原表中的獨立數值建立回歸，防止舊資料的系列反置與四捨五入再次流入樣板。 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const data = require("../data.js");
const workbenchRoot = path.resolve(__dirname, "..");

function sourceCell(suffix, diameter, material, series = "99321") {
  const tool = data.tools.find(item => item.id === `${series}-${suffix}`);
  assert.ok(tool, `Missing source tool ${series}-${suffix}`);
  const row = tool.table.find(item => item.diameter === diameter);
  assert.ok(row, `Missing source diameter ${suffix}/Ø${diameter}`);
  assert.ok(row.values[material], `Missing source material ${material}`);
  return row.values[material];
}

test("012 carbon 0.25% keeps the official 120/200 Vc columns and Ø20 feed/Pitch", () => {
  // cutting-data-1.jpg，下半表 carbon steel 0.25%C，Ø20。
  const expected = {fz: .065, pitches: [1.50, 2.00, 2.50], vc: {"99321": 120, "99323": 200}, grade: "NC2032"};
  assert.deepEqual(sourceCell("012-1525", 20, "carbon025"), expected);
  assert.deepEqual(sourceCell("012-1525", 20, "carbon025", "99323"), expected);
  assert.deepEqual(sourceCell("012-1525", 15, "carbon060").pitches, [1.10, 1.50, 1.80]);
});

test("020 retains its distinct stainless, nickel, titanium and hardened-steel Vc", () => {
  // cutting-data-2.jpg，下半表，不能把其他刀徑的全域材料 Vc 套在這裡。
  const expected = {
    stainless: {"99321": 80, "99323": 90},
    nickel: {"99321": 40, "99323": 50},
    titanium: {"99321": 80, "99323": 90},
    hardened: {"99321": 80, "99323": 90}
  };
  for (const [material, vc] of Object.entries(expected)) {
    assert.deepEqual(sourceCell("020-2540", 32, material).vc, vc);
  }
  assert.deepEqual(sourceCell("020-2540", 32, "stainless").pitches, [1.90, 2.55, 3.20]);
  assert.equal(sourceCell("020-2540", 32, "stainless").fz, .070);
  assert.deepEqual(sourceCell("016-2030", 25, "stainless").vc, {"99321": 60, "99323": 90});
});

test("Al 345 and general Ni 28 are preserved without rounding to legacy presets", () => {
  // cutting-data-1.jpg 與 cutting-data-2.jpg，上半表 Al／Ni-alloy。
  assert.equal(sourceCell("010-1320", 16, "aluminium").vc["99321"], 345);
  assert.equal(sourceCell("012-1525", 20, "aluminium").vc["99321"], 345);
  assert.equal(sourceCell("016-2030", 30, "nickel").vc["99323"], 28);
  assert.equal(sourceCell("025-3050", 40, "nickel").vc["99323"], 28);
});

test("025 Ø40 distinguishes cast-iron 0.115 feed from carbon-steel 0.120", () => {
  // cutting-data-3.jpg，上半表 Ø40；兩列的 fz 不相同。
  assert.equal(sourceCell("025-3050", 40, "castIron").fz, .115);
  assert.equal(sourceCell("025-3050", 40, "carbon025").fz, .120);
  assert.deepEqual(sourceCell("025-3050", 30, "aluminium").pitches, [2.50, 3.00, 3.40]);
  assert.deepEqual(sourceCell("025-3050", 50, "copper").pitches, [4.30, 5.75, 7.20]);
});

test("every selectable tool and material has usable source-backed condition nodes", () => {
  const toolIds = new Set();
  const materialIds = new Set(data.materials.map(item => item.id));
  assert.equal(materialIds.size, data.materials.length, "Material IDs must remain unique.");
  for (const tool of data.tools) {
    assert.ok(!toolIds.has(tool.id), `Duplicate tool ${tool.id}`);
    toolIds.add(tool.id);
    assert.ok(Number.isFinite(tool.dc) && tool.dc > 0 && tool.dc < tool.dmin);
    assert.ok(tool.dmax > tool.dmin && Number.isFinite(tool.maxDepth) && tool.maxDepth > 0);
    assert.ok(tool.table.length > 0, `${tool.id} has no source table.`);
    const diameters = new Set();
    for (const row of tool.table) {
      assert.ok(Number.isFinite(row.diameter) && row.diameter >= tool.dmin && row.diameter <= tool.dmax);
      assert.ok(!diameters.has(row.diameter), `Duplicate source diameter ${tool.id}/Ø${row.diameter}`);
      diameters.add(row.diameter);
      for (const material of data.materials) {
        const condition = row.values[material.id];
        assert.ok(condition, `${tool.id}/Ø${row.diameter} is missing ${material.id}`);
        assert.ok(Number.isFinite(condition.fz) && condition.fz > 0);
        assert.ok(Number.isFinite(condition.vc[tool.series]) && condition.vc[tool.series] > 0);
        assert.match(condition.grade, /^NC\d+$/);
        assert.equal(condition.pitches.length, 3, "Each source node must support the three printed power columns.");
        assert.ok(condition.pitches.every(value => Number.isFinite(value) && value > 0));
        assert.ok(condition.pitches[0] <= condition.pitches[1] && condition.pitches[1] <= condition.pitches[2]);
      }
    }
  }
});

test("customer source links resolve to real JPEG files inside the local workbench", () => {
  const sources = new Set([data.source.localUrl, ...data.tools.map(tool => tool.sourceUrl), "./sources/formula.jpg"]);
  for (const localUrl of sources) {
    assert.match(localUrl, /^\.\/sources\//, "Customer source links must use local source assets.");
    const sourcePath = path.resolve(workbenchRoot, localUrl);
    assert.ok(sourcePath.startsWith(`${workbenchRoot}${path.sep}`));
    assert.ok(fs.statSync(sourcePath).isFile(), `Missing local source ${localUrl}`);
    const bytes = fs.readFileSync(sourcePath);
    assert.equal(bytes[0], 0xff, `${localUrl} is not a JPEG.`);
    assert.equal(bytes[1], 0xd8, `${localUrl} is not a JPEG.`);
    assert.ok(bytes.length > 1000, `${localUrl} appears truncated.`);
  }
});
