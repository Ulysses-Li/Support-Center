"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const diagrams = require("../diagrams.js");

const sd = { id: "00-99313-10", family: "sd", ratio: 3, D: 10, T: 30, L: 49, L1: 49, shank: 20, d1: 27, sourcePage: 138, insertModel: "N9GX04T002" };

test("same frozen API works in a browser and CommonJS", () => {
  const sandbox = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../diagrams.js"), "utf8"), sandbox);
  assert.equal(typeof sandbox.SuperDrillDiagrams.renderTool, "function");
  assert.equal(typeof sandbox.SuperDrillDiagrams.renderEmpty, "function");
  assert.ok(Object.isFrozen(diagrams));
});


test("SD exposes all numeric dimensions and defines L1 as rear shank", () => {
  const svg = diagrams.renderTool(sd, { diameter: 10.2 });
  assert.match(svg, /^<svg xmlns=/);
  assert.match(svg, /viewBox="0 0 900 420"/);
  assert.match(svg, /role="img" aria-labelledby=/);
  assert.match(svg, /<title[^>]*>Super Drill · 00-99313-10/);
  for (const text of ["Ø10 mm", "Drilling depth T 30 mm", "L 49 mm", "L1 rear shank 49 mm", "Ø20 mm", "Ø27 mm", "Target diameter Ø10.2 mm", "Schematic · not to scale", "L1 = rear shank length"]) assert.ok(svg.includes(text), text);
  assert.equal((svg.match(/class="dd-insert /g) || []).length, 2);
  assert.match(svg, /dd-helical-flute/);
  assert.doesNotMatch(svg, /dd-center-pilot|<image|<script|href=/);
});


test("untrusted labels are escaped and invalid dimensions do not become zero", () => {
  const svg = diagrams.renderTool({ ...sd, id: '<img onerror="alert(1)">', D: '<script>', T: null, L: Infinity, L1: -1, shank: {}, d1: NaN, sourcePage: '138\" onload=\"bad' }, { diameter: '<svg onload="bad">' });
  assert.match(svg, /&lt;img onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.match(svg, /L1 rear shank Not provided/);
  assert.doesNotMatch(svg, /<img|<script|<svg onload|NaN|Infinity|undefined|0 mm|onload=/);
  assert.match(svg, /data-dimension="T"/);
});


test("duplicate tool views use independent SVG definition ids", () => {
  const first = diagrams.renderTool(sd);
  const second = diagrams.renderTool(sd);
  const a = first.match(/id="([^"]+)-title"/)[1];
  const b = second.match(/id="([^"]+)-title"/)[1];
  assert.notEqual(a, b);
  for (const [svg, prefix] of [[first, a], [second, b]]) {
    assert.ok(svg.includes('url(#' + prefix + '-metal)'));
    assert.ok(svg.includes('id="' + prefix + '-metal"'));
  }
});


test("selection placeholder supplies no invented numeric dimensions", () => {
  for (const input of [null, undefined, {}, { family: "other" }]) {
    const svg = diagrams.renderTool(input);
    assert.match(svg, /Select a body to view actual dimensions/);
    assert.doesNotMatch(svg, /data-dimension=|Ø\d|NaN|undefined/);
  }
});

test('dimension text is English by default and Chinese on request without changing numbers',()=>{
 const en=diagrams.renderTool(sd),zh=diagrams.renderTool(sd,{lang:'zh-TW'});
 assert.doesNotMatch(en,/[\u3400-\u9fff]/);assert.match(zh,/L1 後柄 49 mm/);assert.match(zh,/可鑽深 T 30 mm/);
 for(const value of ['Ø10 mm','30 mm','49 mm','Ø20 mm']){assert.ok(en.includes(value));assert.ok(zh.includes(value));}
});
