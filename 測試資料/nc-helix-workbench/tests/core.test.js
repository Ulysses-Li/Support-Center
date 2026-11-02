/* 以獨立尺寸與型錄列驗證單孔幾何，不沿用舊程式的假設資料。 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { getCandidates, getCatalogPresets, getSuggestedPresets, calculate } = require("../core.js");
const input = { diameter: 20, depth: 20, dc: 13, pitch: 2, vc: 120, fz: .065, teeth: 2, rampMax: 20, dmin: 15, dmax: 25, maxDepth: 36 };
const close = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test("Ø20 / Dc13 gives a Ø7 orbit, R3.5 and ten 2-mm turns to Z-20", () => {
  const result = calculate(input);
  assert.equal(result.valid, true);
  assert.equal(result.orbitDiameter, 7);
  assert.equal(result.radius, 3.5);
  assert.equal(result.turns, 10);
  assert.equal(result.actualPitch, 2);
  assert.equal(result.zTarget, -20);
  close(result.rampAngle, 5.2, .01);
  assert.equal(result.spindle, 2938);
  close(result.feed, 381.94);
});

test("10-mm depth and requested P3 uses four whole turns of 2.5 mm", () => {
  const result = calculate({ ...input, depth: 10, pitch: 3 });
  assert.equal(result.valid, true);
  assert.equal(result.turns, 4);
  assert.equal(result.actualPitch, 2.5);
  assert.equal(result.zTarget, -10);
});

test("requested pitch beyond total depth still gives one whole turn", () => {
  const result = calculate({ ...input, depth: 1, pitch: 100000000000 });
  assert.equal(result.valid, true);
  assert.equal(result.turns, 1);
  assert.equal(result.actualPitch, 1);
});

test("blank, zero, negative and nonfinite required inputs do not yield a valid setup", () => {
  for (const key of ["diameter", "depth", "dc", "pitch", "vc", "fz"]) {
    for (const value of ["", "   ", null, undefined, false, 0, -1, NaN, Infinity]) {
      const result = calculate({ ...input, [key]: value });
      assert.equal(result.valid, false, `${key}=${String(value)}`);
      assert.ok(result.errors.length);
    }
  }
});

test("tool and hole range boundaries are inclusive but equality of hole and tool is rejected", () => {
  assert.equal(calculate({ ...input, diameter: 15, depth: 36 }).valid, true);
  assert.equal(calculate({ ...input, diameter: 25 }).valid, true);
  assert.equal(calculate({ ...input, diameter: 14.9 }).valid, false);
  assert.equal(calculate({ ...input, diameter: 25.1 }).valid, false);
  assert.equal(calculate({ ...input, depth: 36.1 }).valid, false);
  assert.equal(calculate({ ...input, diameter: 13 }).valid, false);
  assert.equal(calculate({ ...input, diameter: 12 }).valid, false);
});

test("an actual 45-degree helix exceeds a 20-degree ramp limit", () => {
  const result = calculate({ ...input, diameter: 13 + 4 / Math.PI, depth: 4, pitch: 4, dmin: 13.1 });
  assert.equal(result.valid, false);
  close(result.rampAngle, 45);
  assert.ok(result.errors.includes("Actual ramp angle exceeds the tool limit."));
});

test("insert Pitch limit applies to actual whole-turn descent independently of ramp angle", () => {
  const setup = { ...input, diameter: 20, dc: 11, depth: 20, pitch: 10, dmin: 13, dmax: 20, maxDepth: 30, maxPitch: 3 };
  const exceeded = calculate(setup);
  assert.equal(exceeded.valid, false);
  assert.equal(exceeded.actualPitch, 10);
  assert.ok(exceeded.rampAngle < 20);
  assert.ok(exceeded.errors.includes("Actual Pitch exceeds the insert limit."));
  const fitted = calculate({ ...setup, depth: 3, pitch: 4 });
  assert.equal(fitted.valid, true);
  assert.equal(fitted.turns, 1);
  assert.equal(fitted.actualPitch, 3);
});

test("invalid teeth, ramp limits, catalog limits and excessive turn counts are rejected", () => {
  for (const teeth of [0, -.1, 1.5, NaN]) assert.equal(calculate({ ...input, teeth }).valid, false);
  for (const rampMax of [0, -1, 90, Infinity]) assert.equal(calculate({ ...input, rampMax }).valid, false);
  for (const limit of [{ dmin: NaN }, { dmax: 0 }, { maxDepth: null }, { maxPitch: 0 }, { maxPitch: Infinity }, { dmin: 25, dmax: 15 }]) {
    assert.equal(calculate({ ...input, ...limit }).valid, false);
  }
  assert.equal(calculate({ ...input, depth: 10, pitch: .001 }).turns, 10000);
  assert.equal(calculate({ ...input, depth: 10.001, pitch: .001 }).valid, false);
});

test("candidate selection respects hole, depth and coolant while retaining all qualifying tools", () => {
  const base = { dc: 13, dmin: 15, dmax: 25, maxDepth: 36, coolant: "external" };
  const tools = [{ ...base, id: "external" }, { ...base, id: "internal", maxDepth: 85, coolant: "internal" }, { ...base, id: "large", dc: 22, dmin: 25, dmax: 40, maxDepth: 60 }];
  assert.deepEqual(getCandidates(tools, { diameter: 20, depth: 20 }).map(tool => tool.id), ["external", "internal"]);
  assert.deepEqual(getCandidates(tools, { diameter: 20, depth: 50 }).map(tool => tool.id), ["internal"]);
  assert.deepEqual(getCandidates(tools, { diameter: 20, depth: 20, coolant: "external" }).map(tool => tool.id), ["external"]);
  assert.equal(getCandidates(tools, { diameter: 20, depth: 0 }).length, 0);
  assert.equal(getCandidates(tools, { diameter: "", depth: 20 }).length, 0);
  assert.equal(getCandidates(tools, { diameter: 20, depth: 20, coolant: "invalid" }).length, 0);
});

test("catalog presets only match explicitly listed sizes and return a detached pitches array", () => {
  const pitches = [1.5, 2, 2.5];
  const tool = { table: [{ diameter: 20, values: { carbon025: { fz: .065, pitches } } }] };
  const preset = getCatalogPresets(tool, "carbon025", 20);
  assert.deepEqual(preset, { diameter: 20, fz: .065, pitches });
  preset.pitches[0] = 100;
  assert.equal(pitches[0], 1.5);
  assert.equal(getCatalogPresets(tool, "carbon025", 20.01), null);
  assert.equal(getCatalogPresets(tool, "unknown", 20), null);
  assert.equal(getCatalogPresets(tool, "carbon025", ""), null);
});

// 故意使用未排序的節點，驗證只取真正相鄰兩列，且不修改原始資料。
const estimateFixture = () => ({
  dc: 13, dmin: 15, dmax: 25,
  table: [
    { diameter: 25, values: { carbon025: { fz: .09, pitches: [1.8, 2.4, 3] } } },
    { diameter: 15, values: { carbon025: { fz: .035, pitches: [1.2, 1.6, 2] } } },
    { diameter: 20, values: { carbon025: { fz: .065, pitches: [1.5, 2, 2.5] } } }
  ]
});

test("Ø18 estimates between adjacent Ø15 and Ø20 rows while exact presets remain unchanged", () => {
  const tool = estimateFixture();
  const estimated = getSuggestedPresets(tool, "carbon025", 18);
  assert.equal(estimated.kind, "estimated");
  assert.equal(estimated.diameter, 18);
  assert.deepEqual(estimated.bounds, [15, 20]);
  close(estimated.fz, .053);
  [1.38, 1.84, 2.3].forEach((value, index) => close(estimated.pitches[index], value));
  assert.equal(getCatalogPresets(tool, "carbon025", 18), null);
  assert.deepEqual(getSuggestedPresets(tool, "carbon025", 15), {
    diameter: 15, fz: .035, pitches: [1.2, 1.6, 2], kind: "catalog", bounds: [15, 15]
  });
  assert.deepEqual(getSuggestedPresets(tool, "carbon025", 20), {
    diameter: 20, fz: .065, pitches: [1.5, 2, 2.5], kind: "catalog", bounds: [20, 20]
  });
});

test("suggestions reject extrapolation, invalid inputs and tool diameter/range violations", () => {
  const tool = estimateFixture();
  for (const d of [14.9, 25.1, "", " ", null, false, NaN, Infinity, -1, 0]) {
    assert.equal(getSuggestedPresets(tool, "carbon025", d), null, `diameter=${String(d)}`);
  }
  assert.equal(getSuggestedPresets({ ...tool, dmin: 13, dmax: 30, dc: 11 }, "carbon025", 14), null);
  assert.equal(getSuggestedPresets({ ...tool, dmin: 13, dmax: 30, dc: 11 }, "carbon025", 26), null);
  assert.equal(getSuggestedPresets({ ...tool, dc: 18 }, "carbon025", 18), null);
  assert.equal(getSuggestedPresets({ ...tool, dmin: 19 }, "carbon025", 18), null);
  assert.equal(getSuggestedPresets({ ...tool, dmax: 17 }, "carbon025", 18), null);
  for (const metadata of [{ dc: null }, { dmin: NaN }, { dmax: Infinity }, { dmin: 25, dmax: 15 }]) {
    assert.equal(getSuggestedPresets({ ...tool, ...metadata }, "carbon025", 18), null);
  }
  assert.equal(getSuggestedPresets({}, "carbon025", 18), null);
  assert.equal(getSuggestedPresets(null, "carbon025", 18), null);
  assert.equal(getSuggestedPresets({ table: [] }, "carbon025", 18), null);
});

test("missing or invalid material rows stop estimates instead of being skipped", () => {
  const tool = estimateFixture();
  tool.table.find(row => row.diameter === 20).values = { otherMaterial: { fz: .08, pitches: [1, 2, 3] } };
  for (const d of [18, 20, 22]) assert.equal(getSuggestedPresets(tool, "carbon025", d), null);
  assert.equal(getSuggestedPresets(estimateFixture(), "unknown", 18), null);
  for (const invalid of [{ fz: 0, pitches: [1, 2, 3] }, { fz: .1, pitches: [1, 2] }, { fz: .1, pitches: [1, -2, 3] }, { fz: Infinity, pitches: [1, 2, 3] }]) {
    const damaged = estimateFixture();
    damaged.table.find(row => row.diameter === 20).values.carbon025 = invalid;
    assert.equal(getSuggestedPresets(damaged, "carbon025", 18), null);
    assert.equal(getSuggestedPresets(damaged, "carbon025", 22), null);
  }
});

test("suggestions preserve source order and nested arrays, including after returned values are edited", () => {
  const tool = estimateFixture();
  const before = JSON.stringify(tool);
  const estimate = getSuggestedPresets(tool, "carbon025", 18);
  estimate.pitches[0] = 999;
  estimate.bounds[0] = 999;
  const exact = getSuggestedPresets(tool, "carbon025", 20);
  exact.pitches[0] = 999;
  exact.bounds[0] = 999;
  assert.equal(JSON.stringify(tool), before);
  assert.equal(tool.table[0].diameter, 25);
  close(getSuggestedPresets(tool, "carbon025", 18).pitches[0], 1.38);
  assert.equal(getSuggestedPresets(tool, "carbon025", 20).pitches[0], 1.5);
});

test("Ø18 fixture agrees with the actual 012-1525 carbon025 source rows", () => {
  const data = require("../data.js");
  const tool = data.tools.find(item => item.id === "99321-012-1525");
  const estimate = getSuggestedPresets(tool, "carbon025", 18);
  assert.equal(estimate.kind, "estimated");
  assert.deepEqual(estimate.bounds, [15, 20]);
  close(estimate.fz, .053);
  [1.38, 1.84, 2.3].forEach((value, index) => close(estimate.pitches[index], value));
});
