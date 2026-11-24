/* 型錄真實型號的圖面回歸：檢查 XML、跨圖 ID 與尺寸來源，不綁定 SVG 路徑快照。 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");
const diagrams = require("../diagrams.js");
const catalogs = Object.fromEntries(["X060", "V060", "W060", "N9MTW"].map(directory => [directory, JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../${directory}/data/catalog.json`), "utf8"))]));
const catalog = catalogs.X060;
const baseOptions = { family: "X060", state: { width: 0.2, depth: 0.1 } };
const x060Drawings = catalog.inserts.flatMap(insert => catalog.holders.map(holder => ({
  insert, holder, svg: diagrams.render({ ...baseOptions, insert, holder })
})));
// 僅組合同系列實體刀片與刀柄，避免把V045刀片硬配到V060刀柄。
const allDrawings = Object.values(catalogs).flatMap(group => group.inserts.flatMap(insert => group.holders.filter(holder => holder.family === insert.family).map(holder => ({
  insert, holder, svg: diagrams.render({ ...baseOptions, family: insert.family, insert, holder })
}))));

test("四組156個同系列組合及引用的型錄SVG均完整有效，箭頭ID不互相污染", () => {
  assert.equal(allDrawings.length, 156);
  // Python 標準庫只負責 XML 剖析；不新增 XML 套件或瀏覽器依賴。
  const pythonCandidates = [process.env.PYTHON, path.join(os.homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe"), "python3", "python"].filter(Boolean);
  const python = pythonCandidates.find(command => spawnSync(command, ["-c", "import sys; print(sys.version_info.major)"], { encoding: "utf8", timeout: 10000 }).stdout?.trim() === "3");
  assert.ok(python, "需要 Python 3 標準庫驗證 SVG XML");
  const script = [
    "import sys,json,re,pathlib,urllib.parse,xml.etree.ElementTree as ET",
    "payload=json.load(sys.stdin); base=pathlib.Path(payload['base']); seen=set(); assets=set()",
    "for svg in payload['svgs']:",
    " root=ET.fromstring(svg)",
    " assert root.tag=='{http://www.w3.org/2000/svg}svg'",
    " ids=[el.attrib['id'] for el in root.iter() if 'id' in el.attrib]",
    " assert len(ids)==len(set(ids)), '同一圖內 ID 重複'",
    " assert seen.isdisjoint(ids), '不同圖之間 ID 重複'",
    " seen.update(ids)",
    " assert all(ref in ids for ref in re.findall(r'url\\(#([^)]*)\\)',svg)), '圖面引用不存在的 ID'",
    " assert all(ref in ids for ref in root.attrib.get('aria-labelledby','').split()), '無障礙標籤 ID 不存在'",
    " assert root.find('{http://www.w3.org/2000/svg}title') is not None",
    " assert root.find('{http://www.w3.org/2000/svg}desc') is not None",
    " images=list(root.iter('{http://www.w3.org/2000/svg}image'))",
    " assert images, '型錄圖面未引用原始SVG資源'",
    " for image in images:",
    "  href=image.attrib.get('href') or image.attrib.get('{http://www.w3.org/1999/xlink}href',''); ref=urllib.parse.urlsplit(href)",
    "  assert not ref.scheme and not ref.netloc, '型錄SVG不能依賴外部資源'",
    "  asset=(base/urllib.parse.unquote(ref.path)).resolve()",
    "  assert asset.is_file() and asset.suffix=='.svg', '型錄SVG檔案未包含在本機資源中'",
    "  if asset in assets: continue",
    "  assets.add(asset); drawing=ET.parse(asset).getroot()",
    "  assert drawing.tag=='{http://www.w3.org/2000/svg}svg'",
    "  for el in drawing.iter():",
    "   nested=el.attrib.get('href') or el.attrib.get('{http://www.w3.org/1999/xlink}href','')",
    "   assert not nested or nested.startswith('#'), '原始線圖仍引用未包裝的外部資源'",
    "print(f'{len(payload[\"svgs\"])} SVG XML valid; {len(assets)} catalog assets valid')"
  ].join("\n");
  const result = spawnSync(python, ["-X", "utf8", "-c", script], { input: JSON.stringify({ base: path.resolve(__dirname, "../../X060"), svgs: allDrawings.map(item => item.svg) }), encoding: "utf8", maxBuffer: 4 * 1024 * 1024, timeout: 30000 });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.match(result.stdout, /156 SVG XML valid; 6 catalog assets valid/);
});

test("X060 圖面數字來自所選刀柄，40、60、100 mm 及 Ø6、Ø8 不互相借用", () => {
  const expected = {
    "00-99619-X060-06": { length: 40, diameter: 6 },
    "00-99619-X060-06L": { length: 60, diameter: 6 },
    "00-99619-X060-06LS": { length: 60, diameter: 6 },
    "00-99619-X060-06XL": { length: 100, diameter: 6 },
    "00-99619-X060-08": { length: 60, diameter: 8 }
  };
  for (const { insert, holder, svg } of x060Drawings) {
    const values = expected[holder.part_number];
    assert.ok(svg.includes(`總長 ${values.length} mm`), holder.part_number);
    assert.ok(svg.includes(`Ø${values.diameter} mm`), holder.part_number);
    for (const other of [40, 60, 100].filter(value => value !== values.length)) assert.ok(!svg.includes(`總長 ${other} mm`), `${holder.part_number} 不應借用 ${other} mm`);
    assert.ok(svg.includes(insert.part_base));
    assert.ok(svg.includes(holder.part_number));
    assert.match(svg, /需求 W 0\.2 mm/);
    assert.match(svg, /需求 t 0\.1 mm/);
  }
});

test("未選刀片與刀柄時仍有 X060 外形參考，不顯示虛構的已選尺寸", () => {
  const svg = diagrams.render({ family: "X060", state: { angle: 30, form: "radius_angled" } });
  assert.match(svg, /X060/);
  assert.ok(!/總長 (?:40|60|100) mm/.test(svg));
  assert.ok(!/Ø(?:6|8) mm/.test(svg));
  assert.match(svg, /未指定|待選|未選|選擇/);
});

test("X060 料號及刀柄文字在 SVG 內保持 XML 跳脫", () => {
  const insert = { ...catalog.inserts[0], part_base: 'X060<script>"&\'測試' };
  const holder = { ...catalog.holders[0], part_number: 'holder<bad>"&\'測試' };
  const svg = diagrams.render({ ...baseOptions, insert, holder });
  assert.ok(!svg.includes("<script>"));
  assert.ok(!svg.includes("<bad>"));
  assert.ok(svg.includes("&lt;script&gt;"));
  assert.ok(svg.includes("&lt;bad&gt;"));
  assert.ok(svg.includes("&amp;"));
  assert.ok(svg.includes("&quot;"));
});


// 外形按實體系列與特殊刀柄選取；訂購單位沿用原值，不把英制柄誤標成公制。
test("V045、V060台階柄、W060及N9MT-W按各自型錄原圖及尺寸路由", () => {
  const draw = (directory, insertFamily, holderId) => {
    const data = catalogs[directory];
    return diagrams.render({ family: directory, insert: data.inserts.find(item => item.family === insertFamily), holder: data.holders.find(item => item.part_number === holderId), state: {} });
  };
  const v045 = draw("V060", "V045", "00-99619-V045-06");
  assert.match(v045, /v045-holder-outline\.svg/);
  assert.match(v045, /型錄p75原始向量線圖/);
  const v060 = draw("V060", "V060", "00-99619-V060-06");
  assert.match(v060, /v060-holder-outline\.svg/);
  assert.match(v060, /型錄p76原始向量線圖/);
  const stepped = draw("V060", "V060", "00-99619-V060-04");
  assert.match(stepped, /v060-04-holder-outline\.svg/);
  assert.match(stepped, /後段 12 mm/);
  assert.match(stepped, /前頭 Ø6 mm/);
  assert.match(stepped, /Ø4 mm/);
  assert.doesNotMatch(stepped, /前端 12 mm/);
  const w060 = draw("W060", "W060", "00-99619-W060-04");
  assert.match(w060, /w060-holder-outline\.svg/);
  assert.match(w060, /型錄p77原始向量線圖/);
  const metric = draw("N9MTW", "N9MT-W", "00-99616-10");
  const imperial = draw("N9MTW", "N9MT-W", "00-99616-3/8");
  for (const svg of [metric, imperial]) {
    assert.match(svg, /n9mtw-holder-outline\.svg/);
    assert.match(svg, /型錄p78原始向量線圖/);
    assert.match(svg, /總長 90 mm/);
  }
  assert.match(metric, /Ø10 mm/);
  assert.doesNotMatch(metric, /Ø0\.375 inch/);
  assert.match(imperial, /Ø0\.375 inch/);
  assert.doesNotMatch(imperial, /Ø10 mm/);
});
