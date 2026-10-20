/* 以已知尺寸與剖面接觸點驗證補正／Z 配對，避免只比對程式內部公式。 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ACE_CHAMFER_90, ACE_CHAMFER_SIZES, ACE_CHAMFER_ANGLES, getChamferGeometry, calculateChamfer, convertContactDiameter } = require("../chamfer-geometry.js");
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);
const input = { size: "SI06", angle: 90, c: .5, diameter: 5.5, reference: "upper", datum: "actual" };

test("SI06 upper Ø5.5 / C0.5: R2.25, compensation Ø4.5, actual-tip Z-2.4", () => {
  const result = calculateChamfer(input);
  assert.equal(result.valid, true);
  close(result.radius, 2.25);
  close(result.compensationDiameter, 4.5);
  close(result.z, -2.4);
  close(result.lowerDiameter, 4.5);
  close(result.upperDiameter, 5.5);
});

test("upper/middle/lower diameters describe the same physical setup", () => {
  for (const [reference, diameter] of [["upper", 5.5], ["middle", 5], ["lower", 4.5]]) {
    const result = calculateChamfer({ ...input, reference, diameter });
    assert.equal(result.valid, true);
    close(result.radius, 2.25);
    close(result.z, -2.4);
  }
});

test("actual-tip vs theoretical-tip datum changes Z by the catalog correction, not R", () => {
  const actual = calculateChamfer(input);
  const theoretical = calculateChamfer({ ...input, datum: "theoretical" });
  close(theoretical.z, -2.75);
  close(actual.z - theoretical.z, .35);
  close(actual.radius, theoretical.radius);
});

test("C1 with upper Ø4 has R1 / Z-1.65 on SI06", () => {
  const result = calculateChamfer({ ...input, c: 1, diameter: 4 });
  assert.equal(result.valid, true);
  close(result.radius, 1);
  close(result.z, -1.65);
});

test("all sizes, contact references and datums meet both workpiece chamfer endpoints", () => {
  let checked = 0;
  for (const [size, g] of Object.entries(ACE_CHAMFER_90)) {
    for (const c of [.1, .5, g.maxC]) for (const [reference, position] of [["upper", 1], ["middle", .5], ["lower", 0]]) {
      const min = g.minDiameter + 2 * position * c;
      const max = g.maxDiameter - 2 * (1 - position) * c;
      for (const diameter of [min, (min + max) / 2, max]) for (const datum of ["actual", "theoretical"]) {
        const r = calculateChamfer({ size, angle: 90, c, diameter, reference, datum });
        assert.equal(r.valid, true, `${size}/${c}/${reference}/${diameter}/${datum}: ${r.errors}`);
        // 90° 圓錐在任一高度的半徑等於該處到理論尖點的軸向距離。
        const theoreticalTipZ = r.z - (datum === "actual" ? g.tipCorrection : 0);
        const xAtSurface = r.radius - (0 - theoreticalTipZ);
        const xAtLowerEdge = r.radius - (-c - theoreticalTipZ);
        close(xAtSurface, -c);
        close(xAtLowerEdge, 0);
        close(r.compensationDiameter, 2 * r.radius);
        checked++;
      }
    }
  }
  assert.equal(checked, 324);
});

test("rejects excessive upper diameter, truncated-tip contact, Cmax and invalid input", () => {
  for (const change of [
    { reference: "middle", diameter: 5.5 },
    { reference: "lower", diameter: 1.19 },
    { c: 2.001 }, { c: 0 }, { c: -1 }, { c: NaN }, { c: Infinity },
    { diameter: 0 }, { diameter: NaN }, { diameter: Infinity },
    { reference: "unknown" }, { datum: "unknown" }
  ]) assert.equal(calculateChamfer({ ...input, ...change }).valid, false, JSON.stringify(change));
});

test("unsupported angles and sizes do not return numerical compensation", () => {
  for (const change of [{ angle: 55 }, { angle: 0 }, { angle: NaN }, { size: "SI99" }]) {
    const result = calculateChamfer({ ...input, ...change });
    assert.equal(result.valid, false);
    assert.equal(result.radius, undefined);
    assert.equal(result.z, undefined);
  }
});

test("large C reports catalog feed reduction threshold", () => {
  assert.equal(calculateChamfer({ ...input, c: 1 }).reduceFeed, false);
  assert.equal(calculateChamfer({ ...input, c: 1.01 }).reduceFeed, true);
});

test("C0.5 upper Ø5.5 converts to middle Ø5 / lower Ø4.5 and back", () => {
  const middle = convertContactDiameter({ diameter: 5.5, c: .5, from: "upper", to: "middle" });
  close(middle, 5);
  const lower = convertContactDiameter({ diameter: middle, c: .5, from: "middle", to: "lower" });
  close(lower, 4.5);
  close(convertContactDiameter({ diameter: lower, c: .5, from: "lower", to: "upper" }), 5.5);
});

test("reference conversion preserves R and Z across all sizes and contact positions", () => {
  for (const [size, g] of Object.entries(ACE_CHAMFER_90)) for (const c of [.5, g.maxC]) {
    for (const from of ["upper", "middle", "lower"]) for (const to of ["upper", "middle", "lower"]) {
      const originalDiameter = convertContactDiameter({ diameter: g.maxDiameter, c, from: "upper", to: from });
      const changedDiameter = convertContactDiameter({ diameter: originalDiameter, c, from, to });
      const original = calculateChamfer({ ...input, size, c, diameter: originalDiameter, reference: from });
      const changed = calculateChamfer({ ...input, size, c, diameter: changedDiameter, reference: to });
      assert.equal(original.valid, true);
      assert.equal(changed.valid, true);
      close(original.radius, changed.radius);
      close(original.z, changed.z);
    }
  }
});

test("invalid diameter or C cannot be converted into a new apparently valid input", () => {
  for (const change of [{ diameter: 0 }, { diameter: NaN }, { c: 0 }, { c: NaN }, { from: "unknown" }, { to: "unknown" }]) {
    assert.ok(Number.isNaN(convertContactDiameter({ diameter: 5.5, c: .5, from: "upper", to: "lower", ...change })));
  }
});

test("60/120/142 degree inserts have independently checked face slopes, H and Z", () => {
  const cases = [
    { angle: 60, face: 60, height: .8660254037844386, z: -3.1141016151377544 },
    { angle: 120, face: 30, height: .2886751345948129, z: -1.1047005383792515 },
    { angle: 142, face: 19, height: .17216380664483264, z: -.6486552265793305 }
  ];
  for (const expected of cases) {
    const r = calculateChamfer({ ...input, angle: expected.angle, diameter: 4 });
    assert.equal(r.valid, true, r.errors.join(" "));
    close(r.radius, 1.5);
    close(r.height, expected.height);
    close(r.z, expected.z);
    assert.equal(r.geometry.faceAngle, expected.face);
  }
});

test("all four angles meet both chamfer endpoints for each size/reference/datum", () => {
  let checked = 0;
  for (const size of Object.keys(ACE_CHAMFER_SIZES)) for (const angle of ACE_CHAMFER_ANGLES) {
    const g = getChamferGeometry(size, angle);
    const slope = Math.tan((90 - angle / 2) * Math.PI / 180);
    for (const width of [.1, .5, g.maxC]) for (const [reference, k] of [["upper", 1], ["middle", .5], ["lower", 0]]) {
      const min = g.minDiameter + 2 * k * width;
      const max = g.maxContactDiameter - 2 * (1 - k) * width;
      for (const diameter of [min, (min + max) / 2, max]) for (const datum of ["actual", "theoretical"]) {
        const r = calculateChamfer({ size, angle, c: width, diameter, reference, datum });
        assert.equal(r.valid, true, `${size}/${angle}/${width}/${reference}: ${r.errors}`);
        const theoreticalTipZ = r.z - (datum === "actual" ? g.tipCorrection : 0);
        close(r.radius - (-theoreticalTipZ) / slope, -width);
        close(r.radius - (-r.height - theoreticalTipZ) / slope, 0);
        close(r.height, width * slope);
        assert.ok(r.actualDrop <= g.maxDepth + 1e-8);
        const next = reference === "upper" ? "lower" : "upper";
        const convertedD = convertContactDiameter({ diameter, c: width, from: reference, to: next });
        const converted = calculateChamfer({ size, angle, c: width, diameter: convertedD, reference: next, datum });
        assert.equal(converted.valid, true);
        close(converted.radius, r.radius);
        close(converted.z, r.z);
        checked++;
      }
    }
  }
  assert.equal(checked, 1296);
});

test("60 degree contact is limited by catalog Tmax as well as nominal Dmax", () => {
  const nominal = calculateChamfer({ ...input, angle: 60 });
  assert.equal(nominal.valid, false);
  const g = getChamferGeometry("SI06", 60);
  assert.ok(g.maxContactDiameter < g.maxDiameter);
  const fitted = calculateChamfer({ ...input, angle: 60, diameter: g.maxContactDiameter });
  assert.equal(fitted.valid, true);
  close(fitted.actualDrop, 4.1);
});

test("other angles do not inherit 90 degree catalog Cmax or feed reduction ratings", () => {
  for (const angle of [60, 120, 142]) {
    const g = getChamferGeometry("SI06", angle);
    assert.equal(g.maxWidthSource, "geometry");
    assert.equal(g.reduceFeedAbove, null);
  }
  for (const angle of [120, 142]) assert.equal(getChamferGeometry("SI06", angle).minDiameterSource, "tip-plane geometry");
});
