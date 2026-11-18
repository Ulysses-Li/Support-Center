"""將已逐頁核對的型錄 JSON 整理為繁中研究頁及候選交集；不修改原始規格。"""
from collections import Counter
from html import escape
from pathlib import Path
import hashlib
import json
import re

BASE = Path(__file__).resolve().parents[1]
REVIEW_DATE = "2026-11-18"


def read_json(name):
    return json.loads((BASE / name).read_text(encoding="utf-8-sig"))


def save_json(name, data):
    (BASE / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def e(value):
    return escape("—" if value is None else str(value), quote=True)


products = read_json("product-data.json")
cutting = read_json("cutting-data.json")
holders = [(series, table, row) for series in products["series"] for table in series["holder_tables"] for row in table["rows"]]
assert len(holders) == 46
assert len({row["part_no"] for _, _, row in holders}) == 46
assert sum(len(table["rows"]) for group in (cutting["series_A"], cutting["series_C"]) for table in group["tables"]) == 18
assert hashlib.sha256((BASE / products["source_file"]).read_bytes()).hexdigest() == "7f4bb5f8ec9f9e7e2df8699c96b01adeabe4cc1a651f78471da8377c532898f8"

# 資料鍵保留刀片料號與牌號兩欄，不自行拼成原廠未列的完整訂購SKU。
physical = []
for series in products["series"]:
    for table in series["insert_tables"]:
        for row in table["rows"]:
            variants = row.get("variants") or [{"grade_code": row["grade_code"], "coating_catalog": table.get("coating_catalog"), "iso_grade": row["iso_grade"]}]
            for variant in variants:
                family = ("A" + table["insert_size_catalog"]) if series["id"] == "A" else ("C04" if row["assembly_id"] == "assembly-c04" else "C05")
                physical.append({
                    "family": family, "part_no": row["part_no"], "grade_code": variant["grade_code"],
                    "sku_as_printed": row.get("sku"), "Re_mm": row["Re_mm"],
                    "L_mm": row.get("L_mm", table.get("common_dimensions", {}).get("L_mm")),
                    "S_mm": row.get("S_mm", table.get("common_dimensions", {}).get("S_mm")),
                    "coating_as_printed": variant.get("coating_catalog"),
                    "source": {**table["source"], "source_row": row["source_row"]}
                })
assert len(physical) == 17

families = {name: {"physical_inserts": [row for row in physical if row["family"] == name], "holder_records": []} for name in ("A06", "A10", "C04", "C05")}
for series, table, row in holders:
    # 僅將這份型錄明列的 A06/A10/C4/C5 型式分組，不從相同刀徑推斷刀片家族。
    match = re.search(r"(A06|A10|C4|C5)(?:-|$)", row["type"])
    assert match, row["part_no"]
    family = {"C4": "C04", "C5": "C05"}.get(match.group(1), match.group(1))
    families[family]["holder_records"].append({"part_no": row["part_no"], "D_mm": row["D_mm"], "source": {**table["source"], "source_row": row["source_row"]}})

coverage = {
    "schema_version": "1.0", "reviewed_on": REVIEW_DATE,
    "kind": "derived_catalog_record_intersection_not_a_new_manufacturer_recommendation",
    "source_files": ["product-data.json", "cutting-data.json"],
    "rule_zh": "只將同系列／尺寸家族的切削表牌號，與該家族實體刀片表取交集。幾何、Re、夾持、工況及尺寸仍須另外檢查；未交集不等於材料不適用，也不借用其他家族的數據。",
    "families": []
}
for family, group in families.items():
    table = cutting["series_A"]["tables"][0 if family == "A06" else 1] if family.startswith("A") else cutting["series_C"]["tables"][0]
    entries = []
    for row in table["rows"]:
        candidates = [insert for insert in group["physical_inserts"] if insert["grade_code"] in row["insert_grades"]]
        entries.append({
            "material_as_printed": row["work_material"], "iso_material_group": row["iso_material_group"],
            "cutting_source": {**table["source"], "source_row": row["source_row"]},
            "grades_as_printed": row["insert_grades"],
            "matching_physical_inserts": [{key: insert[key] for key in ("part_no", "grade_code", "sku_as_printed", "Re_mm", "source")} for insert in candidates],
            "catalog_intersection_exists": bool(candidates),
            "note_zh": "已有實體候選，仍須篩選刀體、Re、夾持及加工條件。" if candidates else "該切削列需要的牌號，在此尺寸家族未列實體刀片，不能自動套用。"
        })
    physical_grades = {insert["grade_code"] for insert in group["physical_inserts"]}
    table_grades = {grade for row in table["rows"] for grade in row["insert_grades"]}
    coverage["families"].append({
        "id": family, "holder_records": group["holder_records"], "material_rows": entries,
        "physical_grades_without_a_cutting_row": sorted(physical_grades - table_grades),
        "materials_not_listed_in_this_table": "沒有材質列時不產生型錄自動推薦；牌號文案不能取代切削範圍。"
    })
assert [x for x in coverage["families"] if x["id"] == "C04"][0]["material_rows"][-1]["catalog_intersection_exists"] is False
save_json("recommendation-coverage.json", coverage)

MATERIAL_ZH = {"Carbon Steel": "碳鋼", "Low alloy steel": "低合金鋼", "High alloy steel": "高合金鋼", "Stainless steel": "不鏽鋼", "Stainless Steel": "不鏽鋼", "Cast Iron": "鑄鐵", "Malleable Cast Iron": "可鍛鑄鐵", "Non-ferrous metal": "非鐵金屬", "Alloy Steel": "合金鋼", "Stanless Steel": "不鏽鋼", "Hardened steel < HRC52": "淬硬鋼（HRC < 52）"}
PDF = "./sources/12_Power%20Mill_p142-147.pdf"


def source_link(printed):
    return f'<a href="{PDF}#page={printed - 141}" target="_blank" rel="noopener">型錄 p{printed} ↗</a>'


def table_html(headers, rows):
    return '<div class="table-responsive"><table class="table align-middle"><thead><tr>' + ''.join('<th scope="col">' + e(header) + '</th>' for header in headers) + '</tr></thead><tbody>' + ''.join('<tr>' + ''.join('<td>' + e(cell) + '</td>' for cell in row) + '</tr>' for row in rows) + '</tbody></table></div>'


cutting_sections = []
for group_name, group in (("A", cutting["series_A"]), ("C", cutting["series_C"])):
    for table in group["tables"]:
        is_a = group_name == "A"
        title = f'A 系列 · {table["insert_size_mm"]} mm 刀片' if is_a else 'C 系列 · 專屬切削表'
        headers = ["ISO", "材料", "型錄示例", "Vc（m/min）", "fz（mm/tooth）"] + (["圖1 Ap（mm）", "圖2 Ap（mm）", "圖2 Ae（mm）"] if is_a else ["Ap（mm）"]) + ["表列牌號"]
        rows = []
        for row in table["rows"]:
            rows.append([row["iso_material_group"], MATERIAL_ZH.get(row["work_material"], row["work_material"]), row["sample_code_JIS"], row["Vc_m_per_min"], row["fz_mm_per_tooth"]] + ([row["diagram_1_Ap_mm"], row["diagram_2_Ap_mm"], row["diagram_2_Ae_mm"]] if is_a else [row["Ap_mm"]]) + [" / ".join(row["insert_grades"])])
        cutting_sections.append(f'<article class="mt-4"><div class="section-heading"><h3>{e(title)}</h3>{source_link(table["source"]["printed_page"])}</div>' + table_html(headers, rows) + '</article>')

inventory_sections = []
labels = {"part_no": "完整料號", "type": "型式 Type", "D_mm": "D（mm）", "d_h6_mm": "柄徑 d h6（mm）", "d1_mm": "d1（mm）", "ramp_angle_deg": "α（°）", "L1_mm": "L1（mm）", "L_mm": "L（mm）", "Z": "刃數 Z", "Ap_mm": "刀體表 Ap（mm）", "insert_pattern": "型錄刀片家族", "M": "連接螺紋 M", "DPM_mm": "DPM（mm）", "insert_group": "刀片家族", "table_segment": "來源分段"}
for series in products["series"]:
    for table in series["holder_tables"]:
        title = f'{series["id"]} 系列 · ' + ('圓柱直柄' if table["mounting"] == "cylindrical_shank" else 'Screw-Fit 螺牙刀頭')
        fields = table["fields"]
        inventory_sections.append(f'<details class="research-detail"><summary>{e(title)} · {len(table["rows"])} 筆</summary><p class="mt-3">{source_link(table["source"]["printed_page"])}</p>' + table_html([labels.get(field, field) for field in fields], [[row.get(field) for field in fields] for row in table["rows"]]) + '</details>')

insert_rows = [[insert["family"], insert["part_no"], insert["grade_code"], insert["Re_mm"], insert["L_mm"], insert["S_mm"], insert["coating_as_printed"], str(insert["source"]["printed_page"])] for insert in physical]
coverage_rows = []
for family in coverage["families"]:
    for row in family["material_rows"]:
        choices = "; ".join(insert["part_no"] + " · " + insert["grade_code"] + " · Re" + insert["Re_mm"] for insert in row["matching_physical_inserts"])
        coverage_rows.append([family["id"], MATERIAL_ZH.get(row["material_as_printed"], row["material_as_printed"]), " / ".join(row["grades_as_printed"]), choices or "本尺寸家族無表列實體候選"])

issues = [
    ("工法圖名稱", "p145 兩張圖各有 Ap，第二張另有 Ae；原頁未印文字名稱。資料保留圖1／圖2，工法名稱須確認後再做自動規則。", [145]),
    ("A06 / NC2032 切削範圍", "p144 有 U 型 NC2032 實體刀片；p145 的 6.5 mm 表未列 NC2032。不能用 A10 的 NC2032 或其他牌號數值代替。", [144, 145]),
    ("C04 淬硬鋼沒有可直接推薦的刀片", "p147 淬硬鋼列只列 NC2032；本份 C04 實體刀片只有 NC30。NC2032 只見於 C05、Re1.0 的 C9MT05T110H-NC2032。", [147]),
    ("延長桿與接頭資料", "p143／146 引用 p164 延長桿，但本 PDF 不含該頁。接桿完整配對、實際伸出與 Screw-Fit 接頭扭力仍需補；0.6／0.9 Nm 是刀片螺絲扭力。", [143, 144, 146, 147]),
    ("同 Type、不同完整料號", "C 系列螺牙刀頭有 8 組相同 Type，分屬 00-99802 與 00-99805，且 L 不同；需確認訂購與裝配差異，兩筆均保留。", [146]),
    ("表面品質比較圖牌號矛盾", "p145 比較圖寫 A9MT1035 NC2033，p144 產品表是 A9MT1035 NC2032。沒有因此新增 NC2033 品項；圖的量測指標與完整試切條件也未明列。", [144, 145]),
    ("鍍層字形與刀片鼻 R", "來源含 TiAlN／TiAIN／AITiN 字形差異，暫不合併化學名稱。牌號與 Re 必須依實體列成對保存，不能任意交叉。", [144, 147])
]
issue_html = ''.join(f'<article class="issue"><h3>{i:02d} · {e(title)}</h3><p>{e(note)}</p><p class="source-links">' + '　'.join(source_link(page) for page in pages) + '</p></article>' for i, (title, note, pages) in enumerate(issues, 1))
source_previews = ''.join(f'<div class="col-6 col-lg-2"><a class="source-preview" href="{PDF}#page={i}" target="_blank" rel="noopener"><img src="./verification/page-{i}.png" alt="型錄第{141+i}頁核對圖" loading="lazy"><span>p{141+i} · PDF第{i}頁</span></a></div>' for i in range(1, 7))

html = '''<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Power Mill｜型錄研究整理</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"><link rel="stylesheet" href="../../header/header.css"><link rel="stylesheet" href="../../footer/footer.css"><link rel="stylesheet" href="../../css/site-background.css"><link rel="icon" href="../../favicon.png"><link rel="apple-touch-icon" href="../../apple-touch-icon.png">
<style>body{font-family:Arial,"Microsoft JhengHei",sans-serif;color:#0c2237}main{padding:30px 16px 55px}.research-wrap{max-width:1180px;margin:auto}.eyebrow{color:#0067ad;font-size:14px;font-weight:800;letter-spacing:.08em}.surface{background:#fff;border:1px solid #d6e4ee;border-radius:15px;padding:28px;margin-top:24px}.research-intro{border-top:3px solid #0067ad}h1{font-size:clamp(32px,4vw,46px);font-weight:800}h2{font-size:26px;font-weight:800;margin-bottom:18px}h3{font-size:19px;font-weight:750}p,li,td,th,summary{font-size:16px;line-height:1.75}.meta,.muted{color:#587184}a{color:#0067ad}.btn-main{background:#f05a1a;color:white;border:1px solid #f05a1a}.btn{min-height:44px;font-size:15px}.metric strong{display:block;color:#0067ad;font-size:30px}.metric span{font-size:15px}.metric{background:#eef7fd;border-radius:10px;padding:16px}.section-heading{display:flex;justify-content:space-between;align-items:center;gap:16px}.section-heading a{font-size:14px;white-space:nowrap}.table{margin:12px 0 0;white-space:nowrap}.table thead th{background:#edf5fb;color:#24465f}.table td,.table th{padding:10px 12px;border-color:#e3ebf1}.notice{padding:17px 20px;background:#fff3eb;border-left:3px solid #f05a1a;border-radius:6px;margin-top:20px}.research-detail{padding:18px 0;border-bottom:1px solid #e1eaf1}.research-detail:last-child{border-bottom:0}.research-detail summary{font-weight:750;cursor:pointer;min-height:44px}.issue{padding:20px 0;border-bottom:1px solid #e1eaf1}.issue:last-child{border:0}.source-links{margin:0}.toc a{min-height:40px;display:inline-flex;align-items:center}.source-preview{display:block;text-decoration:none;background:#f2f7fb;padding:8px;border-radius:9px}.source-preview img{width:100%;height:160px;object-fit:contain;display:block}.source-preview span{display:block;font-size:14px;margin-top:8px}code{color:#0c2237;overflow-wrap:anywhere}a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid #0067ad;outline-offset:3px}@media(max-width:575.98px){main{padding:16px 10px 30px}.surface{padding:20px 16px}h2{font-size:23px}.metric{padding:12px}.metric strong{font-size:26px}.section-heading{align-items:flex-start;flex-wrap:wrap}.source-preview img{height:180px}}@media print{#header-placeholder,#footer-placeholder,.actions,.toc{display:none!important}main{padding:0}.surface{border:0;box-shadow:none;padding:10px 0;break-inside:auto}h2,h3{break-after:avoid}tr{break-inside:avoid}.table-responsive{overflow:visible}.table{white-space:normal}thead{display:table-header-group}.source-preview img{height:140px}@page{size:A4;margin:13mm}}</style></head><body class="d-flex flex-column min-vh-100"><div id="header-placeholder"></div><main class="flex-grow-1"><div class="research-wrap">
<nav aria-label="所在位置"><a href="../../CuttingData/index.html">切削資料</a> / Power Mill 型錄研究</nav>
<header class="surface research-intro"><p class="eyebrow">POWER MILL · CATALOG RESEARCH</p><h1>Power Mill 型錄資料整理</h1><p class="meta">複核日期：2026-11-18　｜　PDF 共6頁，對應型錄 p142–147</p><p>後續選型工具的資料底稿：分開保留 A／C 系列、刀體、刀片與切削範圍，並列出可建立的配對及尚缺依據。</p><div class="row g-3 mt-1"><div class="col-6 col-md-3"><div class="metric"><strong>46</strong><span>刀體規格列</span></div></div><div class="col-6 col-md-3"><div class="metric"><strong>14 / 17</strong><span>刀片料號／牌號組合</span></div></div><div class="col-6 col-md-3"><div class="metric"><strong>3</strong><span>獨立切削表</span></div></div><div class="col-6 col-md-3"><div class="metric"><strong>18</strong><span>原始材質資料列</span></div></div></div><div class="actions d-flex flex-wrap gap-2 mt-4"><a class="btn btn-main" href="PDF_PATH" target="_blank" rel="noopener">開啟來源 PDF</a><a class="btn btn-outline-primary" href="./product-data.json" download>刀體／刀片 JSON</a><a class="btn btn-outline-primary" href="./cutting-data.json" download>切削資料 JSON</a><a class="btn btn-outline-primary" href="./build-plan.json" download>建置準備 JSON</a></div></header>
<nav class="surface toc d-flex flex-wrap gap-3" aria-label="研究內容"><a href="#series">系列與規則</a><a href="#questions">先問客戶什麼</a><a href="#cutting">切削資料</a><a href="#inventory">刀體與刀片</a><a href="#coverage">推薦鏈核對</a><a href="#open-items">待確認項目</a><a href="#sources">來源頁面</a></nav>
<section class="surface" id="series"><h2>01 · A 與 C 系列先分開</h2>OVERVIEW_TABLE<div class="notice">06 是型錄尺寸代號，實際刀片長 L＝6.5 mm。A06／A10 在部分刀徑重疊，必須依選中刀體的刀片家族選切削表，不能只看刀徑。刀體 Z 表示刃數，與機台 Z 軸不同。</div><ul class="mt-3 mb-0"><li>A 系列開槽：表列進給減少30%，保留70%；斜坡角必須小於選中刀體的 α。SOURCE145</li><li>C 系列：徑向切寬 Ae &lt; 2.5 mm；H 列為硬度 HRC &lt; 52。這些條件不擴大套用到其他系列。SOURCE147</li><li>未列數據使用空值，不把刀片最大 Ap、L1 或要求深度直接換成加工 Z。</li></ul></section>
<section class="surface" id="questions"><h2>02 · 後續先問客戶哪些資料？</h2><p class="muted">以下是依資料相依性提出的介面規劃，並非型錄原有的問答順序。</p><ol><li><strong>加工目標／工法：</strong>需要90°肩面、圓鼻／3D曲面，或其他工法？先分 A／C 系列；p145 工法圖名稱待確認。</li><li><strong>材料：</strong>材質牌號及適用硬度條件；有材料文案不代表有對應數值列。</li><li><strong>刀徑與刀尖 R：</strong>選實際表列 D，並依所需 Re 篩選實體刀片。</li><li><strong>夾持方式：</strong>圓柱柄徑／可用伸出，或 Screw-Fit 螺牙介面與接桿。</li><li><strong>切深 Ap／切寬 Ae 與切入方式：</strong>先確認工法，再驗證該表與刀體限制。</li><li><strong>機台條件：</strong>最高轉速、剛性與冷卻等作為使用條件；本檔未提供所有對應限值。</li></ol><p><code>S = 1000 × Vc / (π × D)</code>；<code>Vf = S × fz × Z</code>。單位依次為 rpm、mm/min；fz 是每齒進給，Z 是刃數。此為後續計算器的單位推導，需另確認有效切削直徑；Z 取自所選刀體刃數。</p><a href="./build-plan.json">查看完整欄位與相依規劃 ↗</a></section>
<section class="surface" id="cutting"><h2>03 · 切削數據逐表保留</h2><p>保留原範圍，尚未替使用者選中位數。A 表兩張示意圖未印工法文字名稱，以下以「圖1／圖2」對應來源。</p>CUTTING_TABLES</section>
<section class="surface" id="inventory"><h2>04 · 刀體、刀片與配件</h2><p>46筆刀體均保留完整料號及原欄位；展開可核對尺寸。空格顯示「—」，不填成0。</p>HOLDER_TABLES<details class="research-detail"><summary>刀片與牌號 · 17 種實體組合</summary>INSERT_TABLE<p class="muted mt-3">A 表料號與牌號原為分欄，不自行拼成原廠完整 SKU；C 表的完整 SKU 另存於 JSON。鍍層字形保留來源，不擅自合併。</p></details><details class="research-detail"><summary>刀片螺絲、扭力與扳手 · 4組</summary>ASSEMBLY_TABLE<p class="muted mt-3">這是刀片螺絲扭力，不是 Screw-Fit 刀頭與接桿的鎖付扭力。</p></details></section>
<section class="surface" id="coverage"><h2>05 · 表列牌號 × 實體刀片交集</h2><p>先做資料層的候選交集，不能直接視為某支刀具在全部工況下的唯一推薦。還需檢查刀體、Re、尺寸、夾持及加工方式。</p><div class="notice">C04 的 H 列沒有表列實體候選；A06 的 NC2032 雖有刀片，但6.5 mm切削表未列該牌號。這兩種情況都必須明確說明缺的是哪段資料。</div><details class="research-detail"><summary>展開4種尺寸家族的逐材料候選</summary>COVERAGE_TABLE</details><a class="d-inline-block mt-3" href="./recommendation-coverage.json" download>下載推薦鏈核對 JSON ↗</a></section>
<section class="surface" id="open-items"><h2>06 · 需確認或補充的來源資料</h2>ISSUES</section>
<section class="surface" id="sources"><h2>07 · 來源頁碼與核對圖</h2><div class="row g-3">SOURCE_PREVIEWS</div><p class="muted mt-3">原 PDF SHA-256：<code>7f4bb5f8ec9f9e7e2df8699c96b01adeabe4cc1a651f78471da8377c532898f8</code></p><p><a href="./research-notes.txt">繁中整理筆記</a> · <a href="./page-map.json">頁碼對照</a> · <a href="./verification/specs-review-20261118.txt">規格逐列核對</a> · <a href="./verification/cutting-review-20261118.txt">切削逐列核對</a></p></section>
</div></main><div id="footer-placeholder"></div><script>
// 資料整理頁共用根目錄頁首頁尾；只提供閱讀，沒有產品選型或切削計算操作。
fetch('../../header/header.html?v=20260520-news').then(r=>r.text()).then(text=>{document.getElementById('header-placeholder').innerHTML=text;const button=document.getElementById('mobileMenuBtn'),nav=document.getElementById('topNav');if(button&&nav){button.setAttribute('aria-controls','topNav');button.setAttribute('aria-expanded','false');button.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg>';button.addEventListener('click',()=>{const open=nav.classList.toggle('active');button.setAttribute('aria-expanded',String(open));});}});
fetch('../../footer/footer.html').then(r=>r.text()).then(text=>{document.getElementById('footer-placeholder').innerHTML=text;});
</script></body></html>'''

overview_rows = [
    ["A", "90°肩面／肩銑", "Ø10–25 mm", "06（L6.5）／10（L10）", "23（直柄11＋螺牙12）", "p142–145"],
    ["C", "圓鼻／Torus Radius", "Ø10–26 mm", "C04（L4）／C05（L5）", "23（直柄4＋螺牙19）", "p142、146–147"]
]
replacements = {
    "PDF_PATH": PDF,
    "OVERVIEW_TABLE": table_html(["系列", "主要幾何", "型錄刀徑範圍", "刀片家族", "刀體列數", "來源頁"], overview_rows),
    "SOURCE145": source_link(145), "SOURCE147": source_link(147),
    "CUTTING_TABLES": ''.join(cutting_sections), "HOLDER_TABLES": ''.join(inventory_sections),
    "INSERT_TABLE": table_html(["家族", "刀片料號", "牌號", "Re（mm）", "L（mm）", "S（mm）", "鍍層原字形", "型錄頁"], insert_rows),
    "ASSEMBLY_TABLE": table_html(["組別", "螺絲", "扭力（Nm）", "扳手", "來源頁"], [[row["id"], row["screw"], row["torque_Nm"], row["key"], row["source"]["printed_page"]] for row in products["assemblies"]]),
    "COVERAGE_TABLE": table_html(["家族", "材料", "切削表牌號", "本家族實體候選／Re（mm）"], coverage_rows),
    "ISSUES": issue_html, "SOURCE_PREVIEWS": source_previews
}
for token, replacement in replacements.items():
    assert token in html, token
    html = html.replace(token, replacement)
(BASE / "index.html").write_text(html, encoding="utf-8")
print(json.dumps({"holder_rows": len(holders), "insert_variants": len(physical), "coverage_families": len(coverage["families"]), "coverage_material_cases": len(coverage_rows), "output": "index.html + recommendation-coverage.json"}, ensure_ascii=False))
