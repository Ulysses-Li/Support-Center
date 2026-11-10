"""整合本機型錄研究；不連線、不改正式頁、不刪除檔案。"""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]

def source(printed_page, section):
    return {"source_id": "nine9-icenter-p054-067", "printed_page": printed_page,
            "pdf_page": printed_page - 53, "section": section,
            "image": f"verification/page-{printed_page - 53:02d}.png"}

def datum(value, unit=None, status="catalog", note=None):
    out = {"value": value, "status": status}
    if unit is not None:
        out["unit"] = unit
    if note:
        out["note_zh_tw"] = note
    return out

PAGE_LABELS = [
    "Center Drill / Features", "Applications / Grades", "DIN332 Form R",
    "DIN332 Form A+B", "DIN332 Form A & ANSI 60° / Measuring Master",
    "Holder / Cylindrical Shank with Pre-balanced", "Square Shank / Double Flat Shank",
    "Center Height Adjusting Sleeve", "Performance", "i-Center Enquiry Form / DIN332 Form D",
    "Technical Standard ISO 2541-1972 / DIN332", "i-Center Applications", "Technical Guide", "Cutting Data"
]

data = {
    "schema_version": "1.0.0",
    "language": "zh-Hant-TW",
    "research_date": "2026-11-10",
    "scope_zh_tw": "僅整理指定英文版 i-Center 型錄印刷54-67頁；研究用途，未製作正式頁、未發布、未commit或push。",
    "sources": [{
        "id": "nine9-icenter-p054-067",
        "local_path": "sources/04_i-Center_p054-067.pdf",
        "original_path": "C:/Users/Louis/Desktop/Nine-9_Agent/Nine-9產品目錄/Nine9產品目錄_英文版_分類拆分/04_i-Center_p054-067.pdf",
        "sha256": hashlib.sha256((ROOT / "sources/04_i-Center_p054-067.pdf").read_bytes()).hexdigest(),
        "pdf_page_count": 14, "printed_page_first": 54, "printed_page_last": 67,
        "catalog_publication_date": None,
        "catalog_publication_date_status": "not_listed",
        "external_web_sources": [],
        "page_number_rule": "pdf_page = printed_page - 53；PDF頁碼為1起算。"
    }],
    "provenance_policy": {
        "catalog": "型錄文字、可見表格或有標值尺寸圖直接列出的內容；合併儲存格展開不改值。",
        "diagram_interpretation": "目視圖形的語意解讀；不是型錄逐字敘述，另註依據。",
        "derived": "由型錄數值或公式計算，保留公式與輸入；不作原始建議值。",
        "inferred": "例如表格未逐欄標示mm而由公制上下文判讀的單位，另標單位狀態。",
        "not_listed": "這份指定型錄沒有列出；null不代表零、不代表不支援。",
        "unclear": "型錄標示不足或跨表不一致，保留原文並禁止自動補值。",
        "no_cross_product_fill": True,
        "visual_authority_zh_tw": "文字擷取會含相鄰版面或被剪裁的隱藏圖文；可見頁面為欄列與段落歸屬的核對依據。",
        "units_zh_tw": "數值與單位分別判定來源。未逐欄印mm的公制尺寸保留unit_status推定註記；ANSI英吋分數與型錄mm近似值並存，不重新換算覆寫。"
    },
    "page_map": [{"pdf_page": i+1, "printed_page": i+54, "heading": h,
                  "render": f"verification/page-{i+1:02d}.png",
                  "raw_text": f"verification/pdf-page-{i+1:02d}.txt",
                  "bounded_text": f"verification/visible-page-{i+1:02d}.txt",
                  "visual_review_status": "reviewed"} for i,h in enumerate(PAGE_LABELS)],
    "classification": [
        {"id": "DIN332_A", "catalog_label": "DIN332 Form A", "kind": "center_hole_geometry",
         "description_zh_tw": "中心孔為60°直錐承靠面，成孔示意沒有外側120°保護沉錐。",
         "description_status": "diagram_interpretation",
         "pilot_diameter_range": datum([2.0,3.15], "mm"),
         "catalog_insert_count": 3, "ic_sizes": ["08"], "grade_codes": ["NC5074"],
         "centering_cone_included_angle": datum(60, "degree"),
         "insert_drill_point_included_angle": datum(120, "degree", note="刀片尖端圖上的120°；不可誤當成孔口保護錐。"),
         "protective_countersink_in_finished_A_hole": datum(False, status="diagram_interpretation"),
         "sources": [source(55,"Applications"), source(58,"DIN332 Form A"), source(64,"Form A center hole diagram")]},
        {"id": "DIN332_A+B", "catalog_label": "DIN332 Form A+B", "kind": "insert_geometry_for_center_holes",
         "description_zh_tw": "型錄產品名稱為A+B；刀片圖標出60°及120°，依其成孔示意與64頁Form B圖解讀，分別為主承靠錐與外側保護錐。",
         "description_status": "diagram_interpretation",
         "pilot_diameter_range": datum([1.0,10.0], "mm"),
         "catalog_insert_count": 20, "ic_sizes": ["08","10","12","16","20","25"],
         "grade_codes": ["NC5074","NC2057","NC2033"],
         "centering_cone_included_angle": datum(60, "degree"),
         "protective_countersink_included_angle": datum(120,"degree"),
         "insert_drill_point_included_angle": datum(120,"degree"),
         "depth_control_zh_tw": "依圖解讀，L2到主錐與外側錐交界、L3到外側錐終點，均為自刀尖起算的軸向尺寸。以控制深度取得A/B孔形是幾何推讀；型錄沒有明文列出逐款A孔加工循環，不應直接產生NC程式。",
         "depth_control_status": "diagram_interpretation",
         "spindle_rule": {"reduction_percent":30,"keep_feed_per_revolution":True,
                          "trigger_catalog_text":"while depth L2 is reached",
                          "source":source(66,"DIN 332 Form A+B")},
         "exceptions": [{"pilot_d1_mm":8,"d3_mm":20,"status":"catalog"},
                        {"pilot_d1_mm":10,"d3_mm":25,"status":"catalog"}],
         "exceptions_note_zh_tw": "57頁星號明示以上d3不同於DIN332；64頁Form B標準d3分別為22.4與28。",
         "sources": [source(55,"Applications"),source(57,"DIN332 Form A+B"),source(64,"Form B center hole diagram"),source(66,"Technical Guide")]},
        {"id": "DIN332_R", "catalog_label": "DIN332 Form R", "kind": "center_hole_geometry",
         "description_zh_tw": "中心承靠面為R圓弧輪廓，R是半徑尺寸；不是A/B直線錐面，也不是刀柄右手標記。",
         "description_status": "diagram_interpretation",
         "pilot_diameter_range": datum([1.0,10.0],"mm"),
         "catalog_insert_count":20,"ic_sizes":["08","10","12","16","20","25"],
         "grade_codes":["NC5074","NC2057","NC2033"],
         "constant_centering_cone_angle": datum(None,status="not_applicable",note="R弧面不可改寫成單一直錐角。"),
         "insert_drill_point_included_angle":datum(120,"degree"),
         "catalog_applications_zh_tw":["60°尾座頂心","90°尾座頂心","中心孔與頂心未對準"],
         "application_limit_zh_tw":"以上為64頁示意用途；不能用它取消66頁中心偏差E<0.02mm的操作要求。",
         "sources":[source(55,"Applications"),source(56,"DIN332 Form R"),source(64,"Form R center hole apply for")]},
        {"id":"ANSI_60","catalog_label":"ANSI 60°","kind":"separate_inch_nominal_size_family",
         "catalog_sizes":["#2","#3","#4","#5","#6","#7","#8","#10"],
         "catalog_insert_count":8,"ic_sizes":["12","16","20","25"],"grade_codes":["NC2033"],
         "description_zh_tw":"與DIN332 Form A分表列出。料號雖使用A2等字尾，不能併成DIN A公制直徑。",
         "centering_cone_included_angle":datum(60,"degree"),
         "sources":[source(55,"Applications"),source(58,"ANSI 60°")]}
    ],
    "grades":[
        {"id":"NC2057","substrate_grade":"P35","coating":"AlTiN + TiSiN",
         "catalog_application_zh_tw":"各種鋼用的通用牌號；雙刃切削、全研磨以改善穩定性。",
         "listed_ic_sizes":["10"],"status":"catalog","source":source(55,"NC2057")},
        {"id":"NC5074","substrate_grade":"P40","coating":"Helica (AlCrN)",
         "catalog_application_zh_tw":"為小直徑中心鑽設計。此牌號段落未逐項承諾所有P/M/K/N材料適用；需與67頁材料切削表分開閱讀。",
         "listed_ic_sizes":["08"],"status":"catalog","source":source(55,"NC5074")},
        {"id":"NC2033","substrate_grade":"K20F","coating":"TiAlN",
         "catalog_application_zh_tw":"碳鋼、合金鋼、高合金鋼、鑄鐵。",
         "listed_ic_sizes":["12","16","20","25"],"status":"catalog","source":source(55,"NC2033")}
    ],
    "family_features":[
        {"id":"two_flutes_two_edges","cutting_flutes":2,"cutting_edges_per_insert":2,"status":"catalog","source":source(54,"Center Drill")},
        {"id":"radial_repeatability","value":0.02,"unit":"mm","relation":"within","status":"catalog","source":source(54,"Excellent Repeatability")},
        {"id":"axial_position_accuracy","value":0.05,"unit":"mm","status":"catalog","note_zh_tw":"換刀片或換刃不需重新設定刀長。","source":source(54,"Easy Tool Length Setting")},
        {"id":"coolant","note_zh_tw":"可經刀柄中心供應內冷以提升表現與壽命。","status":"catalog","source":source(54,"Extended Tool Life")},
        {"id":"intro_cutting_example","workpiece_catalog":"alloy steel","spindle_speed_rpm":6000,
         "feed_mm_per_min":600,"feed_mm_per_rev":0.1,"insert_parts_no":None,"pilot_d1_mm":None,
         "status":"catalog","scope_zh_tw":"54頁敘述中的示例，沒有指定刀徑或料號；不得當作全系列起始參數。",
         "source":source(54,"High Speed, High Feed Rate")}
    ],
    "catalog_form_B_applications": {
        "description_zh_tw":"外側保護錐用途：運送時避免承靠面刮傷或變形、避開孔口毛邊及工件粗糙表面影響。",
        "status":"diagram_interpretation","source":source(64,"Form B center hole apply for")
    },
    "technical_standards":{
        "heading_catalog":"Technical Standard ISO 2541-1972 / DIN332",
        "edition_policy_zh_tw":"只轉錄型錄所印舊版標準名稱，不代表已查核現行標準或認證。",
        "standard_labels":{"R":"DIN332 Form R / ISO 2541-1972","A":"DIN332 Form A / ISO 866-1975","B":"DIN332 Form B / ISO 2540 1973"},
        "unit":"mm","unit_status":"inferred_from_numeric_metric_context",
        "unit_note_zh_tw":"原表未逐欄標mm；頁腳對a寫(mm/inch)，表中數值按其公制尺寸上下文保留，不據此混入英吋。",
        "a_note_catalog":"Minimum material will be cut. If the center hole will be removed after turning or grinding.",
        "a_note_zh_tw":"a為後續車削或研磨移除中心孔時，需切除的最小材料長度；不同於刀片CT或L。",
        "rows":[],"source":source(64,"Technical Standard table")
    },
    "application_examples":{
        "items_zh_tw":["引擎軸","傳動齒輪","軸承","馬達","研磨零件","主軸","減速機","冷卻風扇","萬向接頭"],
        "special_forms":"Special forms for other applications also available on request.",
        "status":"catalog","source":source(65,"Tip")
    },
    "selection_plan":{
        "status":"research_proposal",
        "steps":[
            {"order":1,"field":"hole_standard_and_geometry","label_zh_tw":"選孔形／標準","options":["DIN332 A","DIN332 A+B","DIN332 R","ANSI 60°","其他／提供圖面"],"note_zh_tw":"先看孔形示意；A+B保留原名，說明其60°主錐和120°保護錐。"},
            {"order":2,"field":"pilot_d1_and_hole_drawing","label_zh_tw":"輸入pilot d1及成孔要求","note_zh_tw":"先選公制或ANSI號數；顯示d2/d3、深度、公差、R及星號偏差。R及A+B的1.50/3.00為刀片特殊列，不以64頁標準孔表自動補值。"},
            {"order":3,"field":"workpiece_material","label_zh_tw":"選工件材料","note_zh_tw":"材料群以67頁原列為準；強度、硬度、熱處理與精確材料代號未列者由使用者提供。"},
            {"order":4,"field":"insert_ic_and_grade","label_zh_tw":"確認可用刀片／IC／固定牌號","note_zh_tw":"相同d1可能有多個IC/牌號；不能把任意牌號視為同一料號的可切換選項。顯示訂購Code及完整Parts No.。"},
            {"order":5,"field":"machine_and_holder","label_zh_tw":"選機台及刀柄","note_zh_tw":"依IC精確過濾，再按圓柄/Weldon、預平衡、25×25左右方柄、雙平面、柄徑及內冷篩選；雙平面為Non-Stock。"},
            {"order":6,"field":"cutting_conditions","label_zh_tw":"查切削起始範圍","note_zh_tw":"只有精確符合切削表IC及原列直徑條件才自動呈現；ANSI映射、d1=1.50缺口採人工確認。原表S/f與公式推導F分欄，粗體數字不得直接稱最佳值。"},
            {"order":7,"field":"setup_and_review","label_zh_tw":"確認裝夾及來源","note_zh_tw":"顯示中心偏差、內冷、螺絲扭矩、A+B到L2時降轉速、材料未列警示與本機PDF頁碼；不在研究階段生成加工程式。"}
        ]
    },
    "data_gaps":[
        {"id":"catalog_date","status":"not_listed","description_zh_tw":"指定拆分PDF沒有型錄發行日期、版本或現行供貨狀態。","source":source(54,"Center Drill")},
        {"id":"not_current_stock","status":"not_listed","description_zh_tw":"訂購碼與Non-Stock文字是型錄資料；沒有即時庫存、價格或交期。","sources":[source(60,"Double Flat Shank"),source(63,"Form D")]},
        {"id":"grade_material_scope","status":"unclear","description_zh_tw":"55頁牌號段落與67頁P/M/K/N切削表的敘述粒度不同。沒有逐料號×牌號×各硬度材料的適用認證矩陣，不能把材料表視為保證。","sources":[source(55,"Grades"),source(67,"Cutting Data")]},
        {"id":"nominal_sizes_not_exact_map","status":"unclear","description_zh_tw":"67頁括號ANSI號數與58頁英制實際d1不同；不能只用直徑接近值自動套入ANSI切削資料。","sources":[source(58,"ANSI 60°"),source(67,"Cutting Data")]},
        {"id":"pilot_1_5_cutting_column","status":"not_listed","description_zh_tw":"IC10有1.50mm刀片，切削表IC08/10欄僅Ø1~1.25、Ø1.6~3.15，未明列1.50mm。","sources":[source(56,"IC10 R"),source(57,"IC10 A+B"),source(67,"Cutting Data")]},
        {"id":"cutting_midpoint_legend","status":"unclear","description_zh_tw":"f欄部分中間數字以粗體顯示，但未提供粗體圖例；只保留順序和版式，不稱推薦或最佳進給。","source":source(67,"Cutting Data")},
        {"id":"material_boundary","status":"not_listed","description_zh_tw":"材料表C<0.3%與C>0.3%未明列C=0.3%；高合金鋼、不鏽鋼等未細分硬度／熱處理／材料牌號。","source":source(67,"Workpiece material")},
        {"id":"standard_vs_insert_depth","status":"unclear","description_zh_tw":"64頁是標準孔d/t/a；56-58頁為刀片幾何d/L/CT，不能互相覆寫。A+B取得A孔深度是幾何解讀，沒有逐款成孔循環。","sources":[source(57,"Form A+B"),source(64,"Technical Standard")]},
        {"id":"feeds_for_form_D","status":"not_listed","description_zh_tw":"Form D兩款僅列尺寸與牌號，沒有專屬切削表，不得套用A/B/R切削值。","source":source(63,"DIN332 Form D")},
        {"id":"all_tolerances","status":"not_listed","description_zh_tw":"標準品只轉錄明示d1、CT等公差；詢問表用公差不套到所有標準品。未列尺寸公差保持null或未列。","sources":[source(56,"Insert dimensions"),source(63,"Enquiry form tolerance")]},
        {"id":"speed_vs_holder_balance","status":"unclear","description_zh_tw":"67頁小徑非鐵材料切削表最高20000rpm；59頁刀柄標G6.3／10000rpm為預平衡基準，不是最高容許轉速。套用高轉速前仍缺實際刀柄／裝夾的容許轉速資料。","sources":[source(59,"Pre-balanced holder"),source(67,"Non-ferrous metal")]},
        {"id":"sleeve_adjustment_threshold","status":"unclear","description_zh_tw":"66頁寫中心偏移≥0.15mm請用調整套筒，61頁兩套筒調整範圍為±0.15mm；未說明大於調整行程時的處理方式。保留原文，不推定能修正任意偏差。","sources":[source(61,"Applications"),source(66,"Center height adjusting sleeve")]}
    ]
}

# 標準孔表逐列保留，不以刀片表反算或修正。
standard_rows = [
    [1,2.12,1.9,3,2.12,1.9,3,2.12,0.3,3.15,2.2,3.5],
    [1.25,2.65,2.3,4,2.65,2.3,4,2.65,0.4,4,2.7,4.5],
    [1.6,3.35,2.9,5,3.35,2.9,5,3.35,0.5,5,3.4,5.5],
    [2,4.25,3.7,6,4.25,3.7,6,4.25,0.6,6.3,4.3,6.6],
    [2.5,5.3,4.6,7,5.3,4.6,7,5.3,0.8,8,5.4,8.3],
    [3.15,6.7,5.8,9,6.7,5.9,9,6.7,0.9,10,6.8,10],
    [4,8.5,7.4,11,8.5,7.4,11,8.5,1.2,12.5,8.6,12.7],
    [5,10.6,9.2,14,10.6,9.2,14,10.6,1.6,16,10.8,15.6],
    [6.3,13.2,11.4,18,13.2,11.5,18,13.2,1.4,18,12.9,20],
    [8,17,14.7,22,17,14.8,22,17,1.6,22.4,16.4,25],
    [10,21.2,18.3,28,21.2,18.4,28,21.2,2,28,20.4,31]
]
for r in standard_rows:
    data["technical_standards"]["rows"].append({
        "pilot_d1":r[0],"R":dict(zip(["d2","t","a"],r[1:4])),
        "A":dict(zip(["d2","t","a"],r[4:7])),
        "B":dict(zip(["d2","b","d3","t","a"],r[7:])),
        "unit":"mm","unit_status":"inferred_from_numeric_metric_context",
        "status":"catalog","source":source(64,"Technical Standard table")})

# 55頁分類範圍只印直徑數字，mm由同章公制語境判讀。
for form in data["classification"]:
    if "pilot_diameter_range" in form:
        form["pilot_diameter_range"]["unit_status"] = "inferred_from_catalog_metric_context"

# 各研究模組保持原欄位，最後再建立共用料號索引與實際相容關係。
for key, filename in [
    ("insert_inventory","insert-inventory.json"),
    ("holders_accessories","holders-accessories.json"),
    ("cutting_data","cutting-data.json")
]:
    p = ROOT / filename
    if not p.exists():
        raise FileNotFoundError(f"必要研究模組尚未完成：{p}")
    data[key] = json.loads(p.read_text(encoding="utf-8-sig"))

# 索引只做確定欄位的連接；推定相容性與ANSI切削不明處保持可見。
data["product_index"] = []
for category, pointer, items in [
    ("cutting_insert", "/insert_inventory/items", data["insert_inventory"]["items"]),
    ("measuring_master", "/insert_inventory/measuring_masters", data["insert_inventory"]["measuring_masters"]),
    ("holder", "/holders_accessories/holders", data["holders_accessories"]["holders"]),
    ("center_height_sleeve", "/holders_accessories/center_height_sleeves", data["holders_accessories"]["center_height_sleeves"]),
    ("other_insert_Form_D", "/holders_accessories/other_inserts", data["holders_accessories"]["other_inserts"])
]:
    for i,item in enumerate(items):
        data["product_index"].append({
            "parts_no":item["parts_no"],"category":category,
            "order_code":item.get("order_code",item.get("code")),
            "data_pointer":f"{pointer}/{i}","source":item["source"]})

data["compatibility_index"] = []
holders = data["holders_accessories"]["holders"]
for item in data["insert_inventory"]["items"] + data["insert_inventory"]["measuring_masters"]:
    matches = [h for h in holders if h["ic"] == item["ic"]]
    data["compatibility_index"].append({
        "insert_parts_no":item["parts_no"],"ic":item["ic"],
        "grade_code":item.get("grade_code"),
        "holder_parts_nos":[h["parts_no"] for h in matches],
        "status":"inferred_from_matching_catalog_IC",
        "note_zh_tw":"同IC欄位配對，不是型錄逐料號相容認證。仍需核對機台、柄徑、轉速及裝夾。",
        "insert_source":item["source"],
        "holder_sources":list({h["source"]["printed_page"]:h["source"] for h in matches}.values())})

data["cutting_column_join"] = []
for item in data["insert_inventory"]["items"]:
    column_ids = []
    is_ansi = item["family"] == "ANSI 60°"
    if not is_ansi:
        for c in data["cutting_data"]["columns"]:
            if item["ic"] not in c["ic"]:
                continue
            d = c["d1_mm"]
            v = item["dimensions"]["d1"]
            match = (d["min"] <= v <= d["max"]) if d["kind"] == "range" else (v == d["value"])
            if match:
                column_ids.append(c["id"])
    data["cutting_column_join"].append({
        "insert_parts_no":item["parts_no"],"column_ids":column_ids,
        "status":"catalog_field_match" if column_ids else "requires_confirmation",
        "reason_zh_tw":"ANSI括號號數與公制直徑不一致，禁止自動按近似直徑套值。" if is_ansi else
                        ("按IC及原表d1條件匹配；不是逐牌號或逐孔形驗證。" if column_ids else "67頁未列此IC與d1組合，不能自行補值。"),
        "insert_source":item["source"],"cutting_source":source(67,"Cutting Data")})

data["summary_counts"] = {
    "DIN332_A":3,"DIN332_A_plus_B":20,"DIN332_R":20,"ANSI_60":8,
    "cutting_inserts_main_families":51,"measuring_masters":5,"holders":27,
    "center_height_sleeves":2,"other_inserts_Form_D":2,"products_total":87,
    "cutting_columns":10,"material_categories":7,"cutting_condition_rows":70,
    "technical_standard_d1_rows":11
}

(ROOT / "research-data.json").write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
print("research-data.json written; top-level keys:", ", ".join(data))
