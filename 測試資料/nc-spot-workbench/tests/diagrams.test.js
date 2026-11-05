const test = require("node:test");
const assert = require("node:assert/strict");
const diagrams = require("../diagrams.js");

const spot = {
  geometryValid: true, valid: true, angle: 90, diameter: 6,
  depth: 3, theoreticalDepth: 3, z: -3, datum: "theoretical", tipOffset: 0
};
const chamfer = {
  ...spot, width: .4, height: .4, diameter: 6,
  upperDiameter: 6, lowerDiameter: 5.2, radius: 2.6, reference: "upper"
};

test("nominal spotting communicates its theoretical basis and does not claim an actual insert profile", () => {
  const svg = diagrams.renderSpotting(spot);
  assert.match(svg, /role="img"/);
  assert.match(svg, /aria-labelledby="ncsSpotTitle ncsSpotDescription"/);
  assert.match(svg, /No measured tip calibration has been applied/);
  assert.match(svg, /not the actual offset insert/);
  assert.match(svg, /stroke-dasharray="8 5"/);
});

test("measured datum accepts zero and signed offsets without inventing a flat insert profile", () => {
  for (const tipOffset of [0, .5, -.5]) {
    const svg = diagrams.renderSpotting({ ...spot, datum: "measured", tipOffset, depth: 3 - tipOffset, z: -(3 - tipOffset) });
    assert.match(svg, /Measured tool-length datum depth/);
    assert.match(svg, /Measured datum/);
    assert.doesNotMatch(svg, /Actual insert tip/);
    assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
  }
});

test("a cutting-input error does not hide independently valid geometry", () => {
  assert.match(diagrams.renderSpotting({ ...spot, valid: false, cuttingValid: false }), /NC Spot Drill 90° nominal spotting section/);
});

test("invalid, missing and untrusted geometry produces only a finite placeholder", () => {
  const invalids = [null, {}, { ...spot, angle: '<script>alert(1)</script>' }, { ...spot, diameter: Infinity }, { ...spot, depth: NaN }, { ...spot, geometryValid: false }, { ...spot, datum: "measured", tipOffset: null }];
  for (const input of invalids) {
    const svg = diagrams.renderSpotting(input);
    assert.match(svg, /section unavailable/);
    assert.doesNotMatch(svg, /<script|NaN|Infinity|undefined/);
  }
});

test("chamfer preserves the original-contour meaning of R and makes uncalibrated clearance explicit", () => {
  const svg = diagrams.renderChamfer(chamfer);
  assert.match(svg, /not a hole-center path radius or wear offset/);
  assert.match(svg, /actual clearance is unverified/);
  assert.match(svg, /at least 1 millimeter tip clearance/);
});

test("all contact references render, while unsupported angles and malformed references do not", () => {
  for (const reference of ["upper", "middle", "lower"]) assert.match(diagrams.renderChamfer({ ...chamfer, reference }), /90° nominal chamfer section/);
  for (const input of [{ ...chamfer, angle: 60 }, { ...chamfer, reference: 'upper" onload="alert(1)' }, { ...chamfer, upperDiameter: Infinity }]) {
    const svg = diagrams.renderChamfer(input);
    assert.match(svg, /section unavailable/);
    assert.doesNotMatch(svg, /onload|NaN|Infinity|undefined/);
  }
});
