/* WSP 使用獨立型錄數值作 fixture；特別防止被一般錐尖校正或每齒進給邏輯取代。 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { data, calculate, renderSection } = require("../wsp.js");
const close = (actual, expected, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const base = { variantId: "m6", materialId: "carbonSteel", diameter: 6.3, vc: 225, feed: .1 };

test("all eleven full WSP part numbers and six holders match the three catalog bases", () => {
  assert.equal(data.variants.length, 11);
  assert.equal(data.holders.length, 6);
  assert.equal(data.families.length, 3);
  assert.equal(new Set(data.variants.map(item => item.part)).size, 11);
  for (const variant of data.variants) {
    assert.equal(variant.grade, "NC2033");
    assert.equal(variant.indexableEdges, 2);
    assert.equal(variant.holderIds.length, 2);
    assert.ok(variant.holderIds.every(id => data.holders.find(holder => holder.id === id)?.base === variant.base));
  }
  assert.equal(data.variants.find(item => item.id === "m4").part, "N9MT0802M04C-NC2033");
  assert.equal(data.variants.find(item => item.id === "m16").part, "N9MT1704M16C-NC2033");
  assert.equal(data.variants.find(item => item.id === "unc38").part, "N9MT11T3UNC38-NC2033");
});

test("P table includes independently checked first, middle, last and UNC columns", () => {
  const p = Object.fromEntries(data.variants.map(item => [item.id, item.p]));
  assert.deepEqual(p, { m4: 1.17, m5: 1.48, m6: 1.76, m8: 2.39, m10: 2.97, m12: 3.59, m14: 4.19, m16: 4.88, unc25: 1.8, unc31: 2.3, unc38: 2.78 });
  assert.equal(data.source.specificationPdfPage, 15);
  assert.equal(data.source.formulaPdfPage, 19);
});

test("M6 nominal thread +5% gives Ø6.3 and catalog Lreq1.39 without a two-edge multiplier", () => {
  const result = calculate(base);
  assert.equal(result.valid, true);
  close(result.recommendedDiameter, 6.3);
  close(result.depth, 1.39);
  close(result.z, -1.39);
  close(result.chamferWidth, .65);
  assert.equal(result.spindle, 11368);
  close(result.feedRate, 1136.8);
  assert.equal(result.datum, "catalog-wsp-insert-tip");
});

test("M4 and M16 fixtures use their own P and actual listed tip depth formula", () => {
  close(calculate({ ...base, variantId: "m4", diameter: 4.2 }).depth, .93);
  close(calculate({ ...base, variantId: "m16", diameter: 16.8 }).depth, 3.52);
  assert.equal(calculate({ ...base, variantId: "m16", diameter: 16.8 }).variant.maxDepth, 5.1);
});

test("UNC nominal thread sizes convert to millimeters before the 5% example", () => {
  const result = calculate({ ...base, variantId: "unc25", diameter: 6.6675 });
  assert.equal(result.valid, true);
  close(result.variant.nominalThreadDiameter, 6.35);
  close(result.recommendedDiameter, 6.6675);
  close(result.depth, 1.53375);
  close(data.variants.find(item => item.id === "unc31").nominalThreadDiameter, 7.9375);
});

test("Dmax and Tmax are both enforced rather than clipping the requested depth", () => {
  const result = calculate({ ...base, diameter: 8 });
  assert.equal(result.geometryValid, false);
  assert.equal(result.catalogMaxDiameter, 8);
  close(result.maxDiameter, 7.92);
  close(result.depth, 2.24);
  assert.ok(result.geometryErrors.some(message => /Tmax/.test(message)));
  const boundary = calculate({ ...base, diameter: 7.92 });
  assert.equal(boundary.geometryValid, true);
  close(boundary.depth, 2.2);
});

test("Dreq below D1 is not evaluated as a 90°-face formula", () => {
  assert.equal(calculate({ ...base, diameter: 4.9 }).geometryValid, false);
  const at = calculate({ ...base, diameter: 5 });
  assert.equal(at.geometryValid, true);
  close(at.chamferWidth, 0);
  assert.ok(at.warnings.some(message => /equals nominal D1/.test(message)));
});

test("dedicated WSP material ranges never use ordinary CT table values", () => {
  assert.equal(data.materials.length, 5);
  assert.deepEqual(data.materials.find(item => item.id === "stainless").vc, [80, 150]);
  assert.deepEqual(data.materials.find(item => item.id === "stainless").feed, [.04, .08]);
  assert.deepEqual(data.materials.find(item => item.id === "carbonSteel").vc, [150, 300]);
  assert.equal(calculate({ ...base, materialId: "nonFerrous" }).cuttingValid, false);
  assert.equal(calculate({ ...base, materialId: "hardened", hardness: 50 }).cuttingValid, false);
});

test("positive manual values outside the WSP range remain editable with warnings", () => {
  const result = calculate({ ...base, vc: 90, feed: .2 });
  assert.equal(result.valid, true);
  assert.equal(result.vc, 90);
  assert.equal(result.feedPerRev, .2);
  assert.equal(result.warnings.length, 2);
});

test("blank cutting inputs preserve an independently valid compound section", () => {
  const result = calculate({ ...base, vc: "", feed: "" });
  assert.equal(result.valid, false);
  assert.equal(result.geometryValid, true);
  assert.equal(result.cuttingValid, false);
  const svg = renderSection(result);
  assert.ok(svg.includes("Dreq Ø6.3 mm"));
  assert.ok(svg.includes("145°"));
  assert.ok(svg.includes("90°"));
});

test("ordinary calibration and offset inputs have no effect on the WSP formula", () => {
  const result = calculate({ ...base, datum: "measured", tipOffset: 999, width: 3, reference: "lower" });
  close(result.depth, 1.39);
  assert.equal(result.radius, undefined);
  assert.equal(result.compensationDiameter, undefined);
});

test("invalid selectors and blank or non-finite numbers cannot produce usable setup", () => {
  assert.equal(calculate({ ...base, variantId: "unknown" }).valid, false);
  for (const key of ["diameter", "vc", "feed"]) {
    for (const value of ["", " ", null, false, NaN, Infinity, -Infinity, 0, -1]) assert.equal(calculate({ ...base, [key]: value }).valid, false, `${key}: ${String(value)}`);
  }
  assert.equal(calculate({ ...base, variantId: "N9MT0802M06C-NC2033" }).valid, true);
});

test("SVG is finite, escapes injected text and explains the independent P datum", () => {
  const result = calculate(base);
  const svg = renderSection({ ...result, variant: { ...result.variant, threadLabel: '<script>"&' } });
  assert.ok(!/NaN|Infinity/.test(svg));
  assert.ok(!svg.includes("<script>"));
  assert.ok(svg.includes("&lt;script&gt;&quot;&amp;"));
  assert.ok(svg.includes("P 1.76 mm"));
  assert.ok(svg.includes("90° theoretical intersection"));
  const invalid = renderSection({ geometryValid: false, geometryErrors: ['<bad>&"'] });
  assert.ok(invalid.includes("&lt;bad&gt;&amp;&quot;"));
  assert.ok(!/NaN|Infinity/.test(invalid));
});
