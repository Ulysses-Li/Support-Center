/* 以獨立三角形案例、固定組裝實測與轉速基準驗證，不冒用 ACE 刀尖修正。 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { calculate, convertContactDiameter, finiteNumber } = require("../core.js");
const base = { operation: "spotting", angle: 90, diameter: 10, vc: 100, feed: 0.05, datum: "theoretical" };
const close = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);

test("Ø10 nominal 90° spot is 5 mm deep with every-revolution feed", () => {
  const result = calculate(base);
  assert.equal(result.valid, true);
  assert.equal(result.isNominal, true);
  close(result.depth, 5);
  close(result.z, -5);
  assert.equal(result.actualDepth, null);
  assert.equal(result.spindle, 3183);
  close(result.feedRate, 159.15);
  assert.ok(result.warnings.some(message => /theoretical point/.test(message)));
});

test("120° holder uses its own nominal depth without an ACE tip correction", () => {
  const result = calculate({ ...base, angle: 120, diameter: 12 });
  assert.equal(result.geometryValid, true);
  close(result.depth, 2 * Math.sqrt(3));
  close(result.tipOffset, 0);
});

test("a measured local 0.4-mm reference changes depth but not cutting speed", () => {
  const result = calculate({ ...base, datum: "measured", tipOffset: 0.4 });
  assert.equal(result.valid, true);
  assert.equal(result.isNominal, false);
  close(result.actualDepth, 4.6);
  close(result.z, -4.6);
  assert.equal(result.spindle, 3183);
});

test("finite negative measured offset is retained rather than clamped", () => {
  const result = calculate({ ...base, datum: "measured", tipOffset: -0.3 });
  assert.equal(result.valid, true);
  close(result.depth, 5.3);
  assert.equal(result.tipOffset, -0.3);
});

test("measured mode requires a finite offset and a positive resulting depth", () => {
  for (const tipOffset of [undefined, null, "", " ", NaN, Infinity, 5, 6]) {
    const result = calculate({ ...base, datum: "measured", tipOffset });
    assert.equal(result.valid, false, String(tipOffset));
    assert.equal(result.geometryValid, false);
  }
});

test("chamfer upper diameter drives RPM, independent of chosen contact label", () => {
  const chamfer = { ...base, operation: "chamfering", diameter: 10, width: 1, reference: "upper" };
  const upper = calculate(chamfer);
  const middle = calculate({ ...chamfer, diameter: 9, reference: "middle" });
  const lower = calculate({ ...chamfer, diameter: 8, reference: "lower" });
  for (const result of [upper, middle, lower]) {
    assert.equal(result.valid, true);
    close(result.radius, 4);
    close(result.height, 1);
    close(result.depth, 5);
    close(result.tipClearance, 4);
    assert.equal(result.maxCuttingDiameter, 10);
    assert.equal(result.spindle, 3183);
    close(result.feedRate, 159.15);
  }
});

test("changing contact reference preserves the same R and Z round-trip", () => {
  const chamfer = { ...base, operation: "chamfering", width: 0.6, diameter: 5.5, reference: "upper", datum: "measured", tipOffset: 0.3 };
  const first = calculate(chamfer);
  const diameter = convertContactDiameter({ diameter: 5.5, width: 0.6, from: "upper", to: "lower" });
  close(diameter, 4.3);
  const second = calculate({ ...chamfer, reference: "lower", diameter });
  close(first.radius, second.radius);
  close(first.z, second.z);
  close(convertContactDiameter({ diameter, width: 0.6, from: "lower", to: "upper" }), 5.5);
});

test("1-mm chamfer tip clearance has an inclusive boundary and uses measured datum", () => {
  const input = { ...base, operation: "chamfering", width: 0.5, reference: "upper", datum: "measured", tipOffset: 0.2, diameter: 3.4 };
  const at = calculate(input);
  assert.equal(at.geometryValid, true);
  close(at.tipClearance, 1);
  assert.equal(at.clearanceVerified, true);
  assert.equal(calculate({ ...input, diameter: 3.39 }).geometryValid, false);
  assert.equal(calculate({ ...input, diameter: 3 }).geometryValid, false);
  assert.equal(calculate({ ...input, diameter: 3, datum: "theoretical" }).geometryValid, true);
});

test("minimum spotting depth applies only when that grade requests it", () => {
  const small = { ...base, diameter: 1.5 };
  assert.equal(calculate(small).geometryValid, true);
  assert.equal(calculate({ ...small, minSpotDepth: 1 }).geometryValid, false);
  assert.equal(calculate({ ...small, diameter: 2, minSpotDepth: 1 }).geometryValid, true);
  assert.equal(calculate({ ...small, diameter: 2, datum: "measured", tipOffset: 0.2, minSpotDepth: 1 }).geometryValid, false);
});

test("maximum diameter checks the whole chamfer, not the selected lower diameter", () => {
  const input = { ...base, operation: "chamfering", width: 1, reference: "lower", diameter: 8, maxDiameter: 9 };
  const result = calculate(input);
  assert.equal(result.geometryValid, false);
  assert.equal(result.upperDiameter, 10);
  assert.equal(result.maxD, 7);
  assert.equal(calculate({ ...input, maxDiameter: 10 }).geometryValid, true);
});

test("unknown diameter limits stay unknown and do not borrow a holder shank diameter", () => {
  const result = calculate({ ...base, maxDiameter: null });
  assert.equal(result.geometryValid, true);
  assert.equal(result.maxDiameter, null);
  assert.equal(result.maxD, null);
});

test("point angles use their own W/H ratio without borrowing 90-degree C geometry", () => {
  for (const angle of [60, 82, 90, 100, 120, 142]) {
    assert.equal(calculate({ ...base, angle }).geometryValid, true);
    const chamfer = calculate({ ...base, operation: "chamfering", width: 0.5, angle });
    assert.equal(chamfer.geometryValid, true);
    close(chamfer.height, .5 / Math.tan(angle * Math.PI / 360));
  }
});

test("catalog Dmin constrains the complete cutting band, with an inclusive boundary", () => {
  assert.equal(calculate({ ...base, diameter: 2.9, minDiameter: 3 }).geometryValid, false);
  assert.equal(calculate({ ...base, diameter: 3, minDiameter: 3 }).geometryValid, true);
  const input = { ...base, operation: "chamfering", width: .5, diameter: 3.9, minDiameter: 3 };
  assert.equal(calculate(input).geometryValid, false);
  const boundary = calculate({ ...input, diameter: 4 });
  assert.equal(boundary.geometryValid, true);
  assert.equal(boundary.minD, 4);
  assert.equal(calculate({ ...base, minDiameter: -1 }).valid, false);
});

test("empty, nonfinite, nonpositive and non-numeric inputs never become usable values", () => {
  for (const key of ["diameter", "vc", "feed"]) {
    for (const value of [null, "", " ", false, [], {}, NaN, Infinity, -Infinity, 0, -1]) {
      assert.equal(calculate({ ...base, [key]: value }).valid, false, `${key}: ${String(value)}`);
    }
  }
  for (const angle of [null, "", NaN, 0, -1, 180, Infinity]) {
    assert.equal(calculate({ ...base, angle }).valid, false);
  }
  assert.equal(finiteNumber("1.25"), 1.25);
  assert.equal(finiteNumber("  "), null);
});

test("cutting failure leaves usable geometry available to the diagram", () => {
  const result = calculate({ ...base, feed: "" });
  assert.equal(result.geometryValid, true);
  assert.equal(result.cuttingValid, false);
  assert.equal(result.valid, false);
  close(result.depth, 5);
  assert.equal(result.spindle, 3183);
  assert.equal(result.feedRate, null);
});

test("manual out-of-range cutting values produce a warning without replacing them", () => {
  const result = calculate({ ...base, vc: 200, vcRange: [65, 125], feed: 0.2, feedRange: [0.03, 0.08] });
  assert.equal(result.valid, true);
  assert.equal(result.vc, 200);
  assert.equal(result.feedPerRev, 0.2);
  assert.ok(result.warnings.some(message => /Vc is outside/.test(message)));
  assert.ok(result.warnings.some(message => /Feed per revolution is outside/.test(message)));
});

test("invalid contact reference and impossible width cannot pass geometry validation", () => {
  assert.equal(calculate({ ...base, operation: "chamfering", width: 2, diameter: 3 }).geometryValid, false);
  assert.equal(calculate({ ...base, operation: "chamfering", width: 1, reference: "unknown" }).geometryValid, false);
  assert.ok(Number.isNaN(convertContactDiameter({ diameter: "", width: 1, from: "upper", to: "lower" })));
  assert.ok(Number.isNaN(convertContactDiameter({ diameter: 5, width: 1, from: "unknown", to: "lower" })));
});
