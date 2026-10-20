/* 點鑽以型錄修正量與獨立剖面交點驗算，避免圖和數字共用錯誤而未察覺。 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ACE_CHAMFER_SIZES, ACE_CHAMFER_ANGLES, getChamferGeometry, calculateSpotting } = require("../chamfer-geometry.js");
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} != ${expected}`);

test("SI06 Ø4 has independently checked actual-tip depths for all four angles", () => {
  for (const [angle, expected] of [[60, 3.1141016151377544], [90, 1.65], [120, 1.1047005383792515], [142, .6486552265793305]]) {
    const r = calculateSpotting({ size: "SI06", angle, diameter: 4 });
    assert.equal(r.valid, true, r.errors.join(" "));
    close(r.depth, expected);
    close(r.z, -expected);
  }
});

test("90 degree SI10 uses catalog correction 0.58 and gives 4.17 mm at Ø9.5", () => {
  const r = calculateSpotting({ size: "SI10", angle: 90, diameter: 9.5 });
  assert.equal(r.valid, true);
  close(r.depth, 4.17);
  close(r.theoreticalDepth, 4.75);
  close(r.theoreticalDepth - r.depth, .58);
});

test("all sizes and angles intersect the requested surface diameter and obey Tmax", () => {
  let checked = 0;
  for (const size of Object.keys(ACE_CHAMFER_SIZES)) for (const angle of ACE_CHAMFER_ANGLES) {
    const g = getChamferGeometry(size, angle);
    for (const fraction of [.01, .25, .5, .75, 1]) {
      const diameter = g.minDiameter + fraction * (g.maxContactDiameter - g.minDiameter);
      const r = calculateSpotting({ size, angle, diameter });
      assert.equal(r.valid, true, `${size}/${angle}/${diameter}: ${r.errors}`);
      // 從實際刀尖往下延伸 ℓ 到理論尖點，獨立以半角正切求工件頂面孔徑。
      const theoreticalTipZ = r.z - g.tipCorrection;
      const surfaceRadius = -theoreticalTipZ * Math.tan(angle * Math.PI / 360);
      close(2 * surfaceRadius, diameter);
      assert.ok(r.depth > 0 && r.depth <= g.maxDepth + 1e-8);
      checked++;
    }
  }
  assert.equal(checked, 120);
});

test("60 degree nominal Dmax is rejected if too deep; fitted diameter reaches Tmax", () => {
  const nominal = calculateSpotting({ size: "SI06", angle: 60, diameter: 5.5 });
  assert.equal(nominal.valid, false);
  assert.ok(nominal.depth > nominal.geometry.maxDepth);
  assert.match(nominal.errors.join(" "), /Tmax/);
  const limit = calculateSpotting({ size: "SI06", angle: 60, diameter: nominal.geometry.maxContactDiameter });
  assert.equal(limit.valid, true);
  close(limit.depth, 4.1);
});

test("zero/negative/nonfinite, tip-plane-only contact and unsupported selections are rejected", () => {
  const base = { size: "SI06", angle: 90, diameter: 4 };
  for (const change of [{ diameter: 0 }, { diameter: -1 }, { diameter: NaN }, { diameter: Infinity }, { diameter: 1.19 }, { diameter: 5.51 }, { size: "SI99" }, { angle: 55 }]) {
    assert.equal(calculateSpotting({ ...base, ...change }).valid, false);
  }
  for (const angle of [120, 142]) {
    const g = getChamferGeometry("SI06", angle);
    assert.equal(calculateSpotting({ size: "SI06", angle, diameter: g.minDiameter }).valid, false);
  }
});
