"""從已視覺核對的 Micro 型錄數值產出研究文件；不寫入正式頁。"""
from pathlib import Path
from html import escape
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parent
SOURCE = Path(r"C:\Users\Louis\Downloads\02_Micro Spot Drill - NC Spot Drill_p024-041.pdf")
SOURCE_COPY = ROOT / "sources" / "micro-spot-catalog-p24-25.pdf"
SOURCE_ID = "micro-local-catalog-20261110"

def source(section, printed_page=25):
    return {"sourceId": SOURCE_ID, "pdfPage": printed_page - 23,
            "printedPage": printed_page, "section": section}

def write_json(name, data):
    (ROOT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

# 刀片幾何與訂購品項分開：同一幾何有多種牌號，不能用材料表憑空新增 SKU。
insert_rows = [
    ("X060A90W010R", 90, .02, .1, 1.1, .5,
     [("01X0082", "NC2032"), ("01X0221", "NC2035"), ("01X0220", "XP9001")]),
    ("X060A90W020R", 90, .04, .2, 2.2, 1.,
     [("01X0207", "NC2032"), ("01X0208", "NC2035"), ("01X0209", "XP9001")]),
    ("X060A120W010R", 120, .02, .1, 2.53, .7, [("01X0222", "NC2032")]),
    ("X060A142W010R", 142, .02, .1, 2.42, .4, [("01X0223", "NC2032")]),
]
coatings = {"NC2032": "TiAlN", "NC2035": "ALDURA", "XP9001": "Uncoated"}
inserts = []
for model, angle, re, wmin, wmax, tmax, variants in insert_rows:
    inserts.append({
        "id": model, "series": "X060", "includedAngleDeg": angle,
        "angleToleranceDeg": .5, "Lmm": 6, "Smm": 2.05, "ReMm": re,
        "WminMm": wmin, "WmaxMm": wmax, "TmaxMm": tmax,
        "substrateGrade": "K20F", "indexableCuttingEdges": 2,
        "engravingExplicitlyMentioned": model == "X060A90W020R",
        "variants": [{"orderCode": code, "gradeId": grade, "coating": coatings[grade],
                      "partNumber": model + " " + grade,
                      "source": source("Inserts / dimensions and order codes")}
                     for code, grade in variants],
        "sources": [source("Inserts / dimensions"), source("Features / 2 cutting edges", 24)],
    })

# 原表直接列 S（rpm）及 f（mm/rev）；沒有推薦 Vc、fz 或啄鑽深度 Q。
material_rows = [
    ("carbonSteel", "P", "碳鋼", "Carbon steel", ["NC2032"], [.012, .015, .015]),
    ("alloySteel", "P", "合金鋼", "Alloy steel", ["NC2032", "NC2035"], [.010, .010, .010]),
    ("stainless", "M", "不鏽鋼", "Stainless steel", ["NC2032"], [.008, .010, .010]),
    ("castIron", "K", "鑄鐵", "Cast Iron", ["NC2032"], [.010, .010, .010]),
    ("nonFerrous", "N", "非鐵材料", "Non-ferrous metal", ["XP9001"], [.015, .020, None]),
    ("hardenedSteel", "H", "硬化鋼 < HRC50", "Hardened steel < HRC50", ["NC2035"], [.006, .006, None]),
]
materials = []
for key, iso, zh, en, grades, maxima in material_rows:
    feeds = {}
    for index, (model, *_) in enumerate(insert_rows):
        maximum = maxima[min(index, 2)]
        feeds[model] = {"rangeMmPerRev": [.002, maximum] if maximum is not None else None,
                       "catalogCell": "0.002 ~ " + f"{maximum:.3f}" if maximum is not None else "-",
                       "source": source("Cutting Data / " + en)}
    materials.append({
        "id": key, "isoGroup": iso, "labelZh": zh, "catalogLabel": en,
        "recommendedGrades": grades, "spindleRpm": {"min": 8000, "max": 40000},
        "hardnessHrc": {"maxExclusive": 50} if key == "hardenedSteel" else None,
        "feedsByInsert": feeds, "source": source("Cutting Data / " + en),
    })

holder_rows = [
    ("69X001", "00-99619-X060-06", "Steel", 6, 40),
    ("69X002", "00-99619-X060-06L", "Carbide", 6, 60),
    ("69X003", "00-99619-X060-06LS", "Steel", 6, 60),
    ("69X004", "00-99619-X060-06XL", "Carbide", 6, 100),
    ("69X005", "00-99619-X060-08", "Steel", 8, 60),
]
holders = [{
    "orderCode": code, "partNumber": part, "shankMaterial": shank,
    "shankDiameterMm": diameter, "lengthMm": length,
    "compatibleInsertSeries": "X060", "screw": "NS-22044", "torqueNm": .9, "key": "NK-T7",
    "torqueScrewdriverRecommended": True,
    "workpieceRestriction": ["aluminum", "aluminumAlloy"] if length == 100 else None,
    "rawUnbalanceNote": "unbalanced <0.6gm" if length == 100 else None,
    "source": source("Holder / table and notes"),
} for code, part, shank, diameter, length in holder_rows]

catalog = {
    "schemaVersion": 1, "status": "research-only-not-production-approved", "productId": "micro-spot-drill",
    "productName": "Micro Spot Drill", "reviewDate": "2026-11-10", "units": "mm unless specified",
    "sourceFile": {
        "id": SOURCE_ID, "originalPath": str(SOURCE), "localCopy": "sources/micro-spot-catalog-p24-25.pdf",
        "sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(), "pdfPageCount": 2,
        "printedPages": [24, 25],
        "filenameScopeNote": "原檔名寫 p024-041；實際檔案只有 2 頁，印刷頁碼 24、25。不可宣稱已讀取 26-41 頁或 NC 段落。",
        "extractionNote": "PDF 第 2 頁文字層混有第 24 頁重複內容；欄位、合併儲存格與數值均以頁面渲染核對。",
    },
    "grades": [
        {"id": "NC2032", "coating": "TiAlN", "substrateGrade": "K20F",
         "catalogScope": "For all kinds of steel from < HRC 40, carbon steel, alloy steel, and cast iron.",
         "steelHardnessMaxExclusive": 40, "note": "不鏽鋼適用直接以 Cutting Data 的 M 列為依據；鋼類同時保留 NC2032 的 <HRC40 牌號限制。", "source": source("Inserts / grade descriptions")},
        {"id": "NC2035", "coating": "ALDURA", "substrateGrade": "K20F",
         "catalogScope": "For steel with heat treatment up to HRC 50.",
         "steelHardnessAutoRecommendationMaxExclusive": 50,
         "note": "牌號說明 up to HRC50；Cutting Data 的 H 列是 < HRC50。自動切削條件採較嚴格 <50，不含等號。", "source": source("Inserts / grade descriptions")},
        {"id": "XP9001", "coating": "Uncoated", "substrateGrade": "K20F",
         "catalogScope": "Non-ferrous metal, aluminum, brass, copper, plastic, acrylic.", "source": source("Inserts / grade descriptions")},
    ],
    "inserts": inserts, "holders": holders, "materials": materials,
    "geometryPolicy": {
        "sourceDimensionNames": ["Wmin", "Wmax", "Tmax", "Re", "L", "S"],
        "diameterMapping": "Spotting 孔口直徑 D 以 Wmin/Wmax 作名義篩選範圍；Dmin/Dmax 是篩選器衍生欄位，不是型錄原欄名。",
        "nominalRangeInclusive": True,
        "minimumBoundaryNote": "D = Wmin 是型錄名義下界；忽略 Re 的直線近似為零深度，不保證可加工的正切深。",
        "approximateFormulaForResearchOnly": "t ≈ (D - Wmin) / (2 * tan(theta / 2))",
        "formulaProvenance": "研究者依幾何推導，忽略 Re；並非型錄公式或已驗證的對刀關係。",
        "roundingExamples": [
            "120°、D=2.53：直線近似 t≈0.70148，與表列 Tmax=0.7 有取位差。",
            "142°、D=2.42：直線近似 t≈0.39942，與表列 Tmax=0.4 有取位差。",
        ],
        "phaseOneOutputs": ["catalog Wmin/Wmax/Tmax", "S rpm", "f mm/rev", "Vf mm/min"],
        "phaseOneBlockedOutputs": ["CNC Z target", "tool-tip correction", "G-code", "peck Q"],
        "unverified": ["實際刀尖與理論尖點基準", "Re 精確輪廓補償", "刀長對刀方式與軸向補正", "跳動/偏心允差", "傾斜或曲面局部幾何", "啄鑽/分段切深、冷卻與單次切入策略"],
        "source": source("Inserts / profile sketch and dimensions"),
    },
    "calculationPolicy": {
        "primaryInput": "S rpm", "feedInput": "f mm/rev", "feedRateFormula": "Vf = S * f",
        "optionalDerivedCuttingSpeed": "Vc = pi * D * S / 1000; display as derived, not catalog recommendation",
        "doNotMultiplyFeedByIndexableEdgeCount": True,
        "noCatalogVcOrPeckQ": True,
        "presetPolicy": "第一版建議不預填單一最佳值；先顯示型錄範圍。若後續採用中點等預設，須標註為介面起始值。",
        "source": source("Cutting Data / S and f column headings"),
    },
    "existingContentConflicts": [
        {"file": "Products/MicroSpotDrill/product-data.js", "issue": "FAQ 說 up to 56 HRC，與本 PDF 的 < HRC50 不同。"},
        {"file": "Products/MicroSpotDrill/product-data.js", "issue": "FAQ 含多段切深、NC 偏心結構及支撐刃內容；本 PDF 沒有這些 Micro 推薦參數。不得用 FAQ 補資料缺口。"},
    ],
}

# 依材料進給表與供貨牌號交集建立規則，保留每一款刀片的不同下限。
rules = []
for material in materials:
    for insert in inserts:
        feed = material["feedsByInsert"][insert["id"]]["rangeMmPerRev"]
        grades = [variant["gradeId"] for variant in insert["variants"]
                  if variant["gradeId"] in material["recommendedGrades"]]
        if feed is None or not grades:
            continue
        hardness_by_grade = {}
        if material["id"] in ("carbonSteel", "alloySteel", "stainless", "hardenedSteel"):
            hardness_by_grade = {grade: {"maxExclusive": 40 if grade == "NC2032" else 50,
                                         "unknownHardnessStatus": "conditional-match"}
                                 for grade in grades}
        rules.append({
            "material": material["id"], "isoGroup": material["isoGroup"],
            "insert": insert["id"], "angle": insert["includedAngleDeg"],
            "diameterMm": {"min": insert["WminMm"], "max": insert["WmaxMm"], "inclusive": True,
                           "mapping": {"min": "Wmin", "max": "Wmax"}, "status": "catalog-nominal"},
            "TmaxMm": insert["TmaxMm"], "grades": grades, "feedMmPerRev": feed,
            "spindleRpm": material["spindleRpm"], "hardnessHrc": material["hardnessHrc"],
            "hardnessByGrade": hardness_by_grade,
            "sources": [source("Inserts / dimensions and available grades"), material["source"]],
        })

summaries = []
for material in materials:
    for angle in (90, 120, 142):
        selected = [rule for rule in rules if rule["material"] == material["id"] and rule["angle"] == angle]
        if selected:
            summaries.append({
                "material": material["id"], "isoGroup": material["isoGroup"], "angle": angle,
                "diameterMm": {"min": min(r["diameterMm"]["min"] for r in selected),
                               "max": max(r["diameterMm"]["max"] for r in selected), "inclusive": True},
                "grades": sorted(set(g for r in selected for g in r["grades"])),
                "scope": "product-card summary only; resolve matching insert rule before calculating",
                "source": source("Inserts + Cutting Data"),
            })

contract = {
    "schemaVersion": 1, "status": "reviewed-catalog-nominal-research-contract",
    "productId": "micro-spot-drill", "operation": "spotting", "availableAngles": [90, 120, 142],
    "source": catalog["sourceFile"],
    "materialIds": [m["id"] for m in materials],
    "materialAliasesForIntegration": {"carbonLow": "carbonSteel", "carbonHigh": "carbonSteel", "lowAlloy": "alloySteel", "highAlloy": "alloySteel"},
    "aliasPolicy": "只映射材料名稱；ACE 的硬度細分、Vc/f/Q 等數值不可傳承。粗分類 P 可用來篩產品卡片，切削計算前須選碳鋼或合金鋼。",
    "materialInsertRules": rules, "summaryRanges": summaries,
    "matchPolicy": {
        "blankFilter": "空白代表尚未套用該條件；若填入直徑則須為有限正數。",
        "join": "material AND angle AND nominal diameter; then material recommended grades INTERSECT actual insert variants",
        "diameterBoundaries": "依十進位 mm 名義範圍包含兩端；不得先以忽略 Re 的公式重算上限。",
        "diameterAtMinimum": "顯示名義邊界提示；此匹配不是已驗證正切深或可直接編程承諾。",
        "hardness": "依 hardnessByGrade 核對：鋼類 NC2032 必須 <40；NC2035 的自動推薦先採 <50（原牌號說明 up to50 與 H 切削列 <50 的等號仍待確認）。未知硬度可列條件式候選，不顯示無條件適用。",
        "unsupportedCell": "原表 '-' 表示沒有此型錄推薦，不能借用其他角度或其他產品數據。",
        "holderRestriction": "全部 X060 刀片相容；06XL 只有確認為鋁或鋁合金才可選，N 粗分類不足以放行。",
        "noMatch": "保留使用者材料/角度/D，顯示無匹配原因；不暗改 D、角度、材料。",
        "unknownParameter": "白名單驗證並顯示無法套用的條件，不靜默替換為預設材料。",
        "noPublishedTargetYet": "尚未建立正式 Micro 計算頁；此研究不更動任何上游連結。",
    },
    "proposedTarget": "CuttingData/MicroSpotDrill/index.html",
    "proposedQuery": {"operation": "spotting", "material": "carbonSteel|alloySteel|stainless|castIron|nonFerrous|hardenedSteel",
                      "angle": "90|120|142", "diameter": "positive finite mm", "insert": "catalog model (optional)",
                      "grade": "NC2032|NC2035|XP9001 (optional)", "holder": "catalog part number (optional)", "source": "spotting"},
    "exampleQuery": "?operation=spotting&material=stainless&angle=120&diameter=0.5&source=spotting",
}

PLAN = """Micro Spot Drill 互動頁實作規劃（研究版，2026-11-10）

一、範圍及來源
本次只研究 Downloads 指定 PDF 的實際 2 頁（印刷24/25）。不改正式頁、不發布、不建立尚不可用的正式連結。正式數值唯一依據為印刷p25；p24支持產品功能與每片2個可轉位切削刃。原檔名p024-041不代表本檔包含26-41頁。文字層有重複內容，尺寸、表頭與合併格均已對照完整頁面渲染。

二、第一階段互動範圍
主操作固定 Spotting。頁首顯示 Micro Spot Drill、目前條件及型錄來源。可沿用 ACE 的 Bootstrap 5.3.3、共用 header/footer、根目錄 css/site-background.css 與條件/選刀/結果的順序。正式資料建議置於 Products/MicroSpotDrill/ 的獨立結構化資料檔，計算頁與 Spotting 篩選讀同一來源；不能從 FAQ 抽取數值。實際路徑應在核准實作時依全站資料架構定案。

01 加工條件：材料（P碳鋼/P合金鋼/M不鏽鋼/K鑄鐵/N非鐵/H硬化鋼）、可選材料細類與硬度、夾角90/120/142、目標孔口D。材料與角度先篩選，再列每個符合D的刀片/牌號；材料進給列與實際供貨牌號取交集。Spotting傳來的有效條件直接保留。未選的條件不強行補預設；無匹配時保留原輸入並說明原因。

02 選刀：4款幾何、8個刀片SKU；每個選項完整顯示型號、訂購碼、牌號/塗層、原表Wmin/Wmax/Tmax/Re。型號不應只顯示『X060』。先選刀片牌號，再列5支相容刀柄，展示柄徑/總長/材質；XL只在材料細類確定為鋁或鋁合金時可選。共同螺絲NS-22044、0.9Nm、NK-T7及扭力起子提示放在安裝說明。表中 K20F 是另列基材欄，不能覆蓋 NC2032/NC2035/XP9001 的牌號。

03 切削設定：S直接以rpm輸入（型錄8000-40000）；f以mm/rev輸入並顯示所選材料及刀片專屬範圍。可填機台最高轉速。S範圍與機台能力無交集時顯示沒有型錄支持值，不能把低速機台自動設成8000。D/f使用step=any接受更細手動值，調整按鈕可用D每次0.001mm、S每次100rpm、f每次0.001mm/rev。第一版不宣稱單一最佳預設值；若採中點須標為介面起始值。

04 結果：顯示S、Vf=S×f、刀片訂購碼/牌號、刀柄、D與原表幾何限制、材料適用條件、印刷p25來源。『兩個切削刃』是可轉位壽命特徵，不能將f再乘2。Vc最多列為可展開換算值πDS/1000，清楚標註非型錄推薦；改D不應因ACE的Vc公式而改S。無效輸入時清除舊結果並停用有效條件複製。範圍外的S/f不得顯示成型錄推薦；若日後允許自訂範圍外值，複製文字須包含偏離警告。

05 幾何與對刀：只呈現Wmin/Wmax/Tmax/Re的名義剖面示意及符號說明。D對應孔口寬，Wmin是底部短平段，Re為過渡圓角；圖應同尺度呈現X/Z。第一版不輸出CNC Z、G碼、刀尖補正或啄鑽Q。研究近似 t≈(D−Wmin)/(2tan(θ/2)) 忽略Re，並非型錄公式，不能用來反向否定已列的尺寸端點。D=Wmin提示為名義下界，正切深尚未驗證。120°在D=2.53的近似t=0.70148略大Tmax=0.7，因此篩選以型錄表列上限為準。

三、狀態與切換
empty：條件未完整，列待填欄位。
conditional：名義刀片匹配，但硬度、XL材料細類或D=Wmin仍需確認；列出具體適用條件。
valid：選刀、牌號、刀柄、S、f及機台限制均一致；可複製已核對切削設定，不含機台Z。
no-match：材料/角度/孔徑沒有型錄配對；保留輸入並說明。例如N+120°為原表'-'，D=2.54超過所有Micro Wmax。
invalid：空白必填欄、NaN、無限、零負值、參數未知或切削值超出允許條件；不顯示舊有效數值。
上游切換保留仍有效的選刀及手動輸入。失效的牌號/刀柄清除並提示原因，不自動變成另一材質。變更材料後重新核對f，不偷偷把已輸入D夾進新範圍。重新載入/重設/URL無效參數均遵守相同規則。

四、版面與無障礙
桌面沿用Bootstrap左7/12條件、右5/12結果，左下放幾何說明；卡片白底、技術藍資訊、Nine9橘主要操作。手機沿用同一份DOM直向排列；底部精簡結果條只呈現S/Vf，完整結果與複製仍在正文，不能遮住欄位或鍵盤焦點。一般字至少16px、操作至少14px、觸控至少44px。狀態用aria-live、欄位用aria-describedby、不可用項目附原因；若用展開選刀卡則同步aria-expanded/aria-controls。圖附title/desc，動畫支援prefers-reduced-motion。不要為桌面與手機維護兩份資料或頁面。

五、上游篩選契約
參閱filter-contract.json。productId=micro-spot-drill；operation=spotting；材料ID沿用carbonSteel/alloySteel/stainless/castIron/nonFerrous/hardenedSteel；角度90/120/142；diameter為mm有限正數。材料AND角度AND孔徑配對後，再核對牌號及刀柄。summaryRanges只適合產品卡片篩選，切削計算必須落到materialInsertRules中的特定刀片。不要只用ISO徽章就假定所有角度可用。ACE材料名稱只能做語義映射，不能帶入ACE的數值或額外材質能力。正式計算頁未建立前不更動上游連結。

六、資料缺口與正式化條件
1. 向原廠圖面或可追溯技術資料核對對刀基準、Re輪廓與尖端補正後，才評估Z計算。不得移植ACE的ℓ。
2. 確認Wmin端點的實際最小正切深、孔口定義與尺寸公差需求；目前只支持名義選刀篩選。
3. 確認HRC50等號：牌號說明up to50，切削列<50。NC2035鋼類自動推薦先採<50；這是保守實作政策，不把牌號原文改成<50。NC2032鋼類<40要保留條件。
4. XL的不平衡註記原文unbalanced <0.6gm；不得擅改為g、g·mm或額外轉速限制。
5. 本PDF沒有Micro的多段深度、Q、冷卻、跳動允差或NC程式，不從既有FAQ或NC頁補入。
6. Products/MicroSpotDrill/product-data.js含56HRC與其他來源資訊。另立內容整頓任務，本研究不修改FAQ。
7. 本機研究審查後，先在獨立測試資料夾製作實際互動樣板；使用者確認再整理到正式頁，正式頁不能依賴測試資料。

七、驗收案例（正式實作時執行）
A01 90°/D0.15僅W010；90°/D0.2同時W010與W020；90°/D1.10001僅W020；90°/D2.2含W020，D2.20001無90°候選。
A02 120°/D2.53和142°/D2.42均保留型錄名義端點；上限加0.00001即無該角度候選。不可用近似深度剔除120°的2.53。
A03 D0.1為W010名義下界提示；D0.09999不匹配。W020在D0.19999不能匹配；D0.2才到名義下界。
A04 N或H只提供90°，120/142無型錄推薦，不借90°的f。
A05 合金鋼90°可選NC2032/NC2035；120/142只可NC2032。碳鋼不因有NC2035供貨就自動推薦。
A06 已知鋼類（含不鏽鋼）HRC40不可選NC2032；HRC49.9可保留H+NC2035；HRC50/56沒有本表支持。硬度未知則保留條件式說明。
A07 N+W020+XP9001可用f0.020；碳鋼W010的f0.015超上限；M+W010上限0.008、W020上限0.010。
A08 S8000×f0.002=Vf16；N+W020在S40000×f0.020=Vf800。改D不得自動改S/f/Vf。不乘2刃。
A09 機台最高轉速6000無型錄S交集；最高10000時交集8000-10000；S=10001應提示機台上限。
A10 N泛類不能直接選XL；鋁/鋁合金可，銅/黃銅/塑膠/壓克力不可。其餘4支刀柄可配全部8個刀片SKU。
A11 URL有效條件回填；未知材料、角度、舊無效牌號、XSS文字、空值/0/負值/NaN/Infinity均有明確狀態，不跳成預設材料。
A12 鍵盤、窄螢幕、手機鍵盤、複製失敗/成功、重設、減少動畫、動態狀態與焦點、所有資源相對路徑均核對。正式頁不引用測試資料。
"""

def table(headers, rows):
    """研究文件中的資料也一律跳脫，避免未來字串被當成 HTML。"""
    return ('<p class="table-hint">窄螢幕可左右捲動表格，查看完整欄位。</p><div class="table-wrap" tabindex="0" role="region" aria-label="研究資料表，可左右捲動"><table><thead><tr>'
            + ''.join('<th scope="col">' + escape(str(h)) + '</th>' for h in headers)
            + '</tr></thead><tbody>'
            + ''.join('<tr>' + ''.join('<td>' + escape(str(c)) + '</td>' for c in row) + '</tr>' for row in rows)
            + '</tbody></table></div>')

def number(value):
    return format(value, 'g')

def render_report():
    geometry_table = table(["型號", "夾角", "Re", "Wmin → 篩選Dmin", "Wmax → 篩選Dmax", "Tmax"],
        [[i["id"], str(i["includedAngleDeg"]) + "°", number(i["ReMm"]), number(i["WminMm"]),
          number(i["WmaxMm"]), number(i["TmaxMm"])] for i in inserts])
    sku_table = table(["訂購碼", "完整品項", "塗層", "原表基材"],
        [[v["orderCode"], v["partNumber"], v["coating"], i["substrateGrade"]] for i in inserts for v in i["variants"]])
    holder_table = table(["訂購碼", "刀柄料號", "柄材", "Ød (mm)", "L (mm)", "附加限制"],
        [[h["orderCode"], h["partNumber"], h["shankMaterial"], h["shankDiameterMm"], h["lengthMm"],
          "僅鋁／鋁合金；unbalanced <0.6gm" if h["workpieceRestriction"] else "本頁未列額外材料限制"] for h in holders])
    feed_table = table(["ISO／材料", "90W010R f", "90W020R f", "120／142W010R f", "材料列推薦牌號"],
        [[m["isoGroup"] + " / " + m["labelZh"],
          m["feedsByInsert"]["X060A90W010R"]["catalogCell"],
          m["feedsByInsert"]["X060A90W020R"]["catalogCell"],
          m["feedsByInsert"]["X060A120W010R"]["catalogCell"], ', '.join(m["recommendedGrades"])] for m in materials])
    filter_rows = []
    for m in materials:
        columns = []
        for angle in (90, 120, 142):
            entry = next((s for s in summaries if s["material"] == m["id"] and s["angle"] == angle), None)
            columns.append("—（無型錄推薦）" if entry is None else
                number(entry["diameterMm"]["min"]) + "–" + number(entry["diameterMm"]["max"]) + " / " + ', '.join(entry["grades"]))
        filter_rows.append([m["isoGroup"] + " / " + m["labelZh"], m["id"], *columns])
    filter_table = table(["材料", "材料ID", "90°：D(mm)／牌號", "120°：D(mm)／牌號", "142°：D(mm)／牌號"], filter_rows)
    source_path = escape(str(SOURCE))
    return f'''<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Micro Spot Drill 研究與互動頁規劃</title><link rel="icon" href="../../favicon.png">
<link rel="stylesheet" href="../../css/site-background.css"><link rel="stylesheet" href="./research.css"></head>
<body><main class="report"><header><p class="eyebrow">NINE9 / RESEARCH / 2026-11-10</p>
<h1>Micro Spot Drill<br><span>選刀與切削資料互動頁規劃</span></h1>
<p class="lead">已核對 4 款刀片幾何、8 個刀片 SKU、5 支刀柄與 6 列材料切削條件。此為研究文件，尚未製作正式互動頁。</p>
<nav aria-label="研究文件章節"><a href="#filters">篩選邊界</a><a href="#inventory">完整品項</a><a href="#cutting">切削資料</a><a href="#geometry">幾何／對刀</a><a href="#plan">頁面規劃</a><a href="#sources">來源與交付檔</a></nav>
</header>
<section class="surface"><h2>研究結論</h2><ul>
<li>型錄直接提供 <strong>S = 8,000–40,000 rpm</strong>，主輸入應使用轉速與每轉進給；結果 <strong>Vf = S × f</strong>。來源：印刷 p25，Cutting Data。</li>
<li>材料依 P／M／K／N／H 分組；<strong>N 與 H 只有 90° 的推薦</strong>，120°／142° 表格為「-」。來源：印刷 p25。</li>
<li>孔徑篩選可把 <strong>Wmin／Wmax 映射為名義孔口 D 的邊界</strong>，需保留原欄名；本頁沒有可直接輸出的 CNC Z 對刀資料。</li>
<li>原檔名雖寫 p024-041，實際只有 <strong>PDF 第 1、2 頁，即印刷 p24、p25</strong>，不包含 NC 章節。</li>
</ul><p class="note">研究範圍：只保存到本資料夾；正式頁、Spotting 篩選器、NC 頁及既有 ACE 未提交修改均未更動，沒有發布。</p></section>

<section id="filters" class="surface"><p class="eyebrow">01 / FILTER HANDOFF</p><h2>可供 Spotting 篩選器採用的邊界</h2>
<p>條件以材料 AND 角度 AND 名義孔徑共同匹配。下表為產品卡片彙總，完整選刀須再取 <code>materialInsertRules</code> 的刀片／牌號交集。所有範圍均為 mm，包含表列兩端。來源：<a href="sources/catalog-2.png">印刷 p25，Inserts + Cutting Data</a>。</p>{filter_table}
<p class="note">D 等於 Wmin 時僅為名義邊界；正切深、孔口公差與對刀未驗證。H 必須 &lt; HRC50；牌號文字雖寫 up to HRC50，切削列不包含等號。NC2032 的鋼類條件為 &lt; HRC40。若硬度未知，候選需帶條件說明。</p>
<p><a class="action" href="filter-contract.json">開啟篩選資料契約 JSON</a></p></section>

<section id="inventory" class="surface"><p class="eyebrow">02 / CATALOG INVENTORY</p><h2>全部刀片與刀柄</h2>
<p>來源：印刷 p25，Inserts 尺寸表。角度公差 ±0.5°；全部刀片共用 L = 6 mm、S = 2.05 mm。原表標示 Wmin、Wmax、Tmax；0.1／0.2 是刀尖寬規格，不能當成整個系列的最大孔徑。</p>
{geometry_table}<h3>8 個可訂購刀片品項</h3>{sku_table}
<p>NC2032：TiAlN；NC2035：ALDURA；XP9001：無塗層。各幾何的實際牌號供貨以表列 SKU 為準；120°／142° 不提供 NC2035 或 XP9001。每片 2 個可轉位切削刃（p24），不應把每轉進給乘以 2。p25 只明示 X060A90W020R 也適合 engraving，第一版仍固定 Spotting。</p>
<h3>5 支相容刀柄</h3>{holder_table}
<p>全部支援 X060 系列。共用螺絲 <strong>NS-22044</strong>、鎖固扭矩 <strong>0.9 Nm</strong>、扳手 <strong>NK-T7</strong>；型錄建議扭力起子。XL 的 <code>unbalanced &lt;0.6gm</code> 保留原文單位，不推導額外轉速限制。來源：p25，Holder。</p></section>

<section id="cutting" class="surface"><p class="eyebrow">03 / CUTTING DATA</p><h2>獨立使用 Micro 的切削條件</h2>
<p>以下進給單位皆為 <strong>mm/rev</strong>，全部材料列共用 <strong>S = 8,000–40,000 rpm</strong>。120°／142° 共用同一進給欄；「-」代表沒有此型錄推薦，不是零進給。來源：p25，Cutting Data。</p>{feed_table}
<p class="note">材料列牌號必須與實際 SKU 取交集。例如合金鋼列雖含 NC2035，120°／142° 仍只能選 NC2032。非鐵細類依 XP9001 文字包括鋁、黃銅、銅、塑膠、壓克力；XL 的限制只放行鋁／鋁合金。</p>
<div class="formula"><p><strong>Vf = S × f</strong><br>8,000 × 0.002 = 16 mm/min<br>40,000 × 0.020 = 800 mm/min（僅支援該 f 的材料／刀片組合）</p>
<p><strong>可選換算：Vc = π × D × S ÷ 1,000</strong><br>此為換算值，不能標成型錄推薦 Vc。改 D 不應自動重新計算 S。型錄沒有 Micro 的 Q 或多段切深。</p></div></section>

<section id="geometry" class="surface"><p class="eyebrow">04 / GEOMETRY AND DATUM</p><h2>先清楚顯示幾何，對刀計算留待圖面核實</h2>
<p>p25 的 Re 圓角位於底部短平段與斜刃交界。可規劃同尺度剖面圖，顯示孔口 D、Wmin、Wmax、Tmax、Re 與夾角；圖應標記名義示意。</p>
<p>研究近似 <code>t ≈ (D − Wmin) / [2 tan(θ/2)]</code> 忽略 Re，屬於研究者推導。120°／D = 2.53 時計得 t ≈ 0.70148 mm，略高表列 Tmax 0.7 mm；142°／D = 2.42 時計得 t ≈ 0.39942 mm，表列為 0.4 mm。因此不可用此近似反過來剔除型錄端點。</p>
<p class="note">第一版顯示型錄尺寸與切削設定，不輸出 CNC Z、G 碼、尖端補正或啄鑽 Q。本來源尚未提供實際／理論尖點基準、刀長對刀方式、Re 精確補償、跳動允差或機台可用 Z。ACE 的 ℓ 與 NC 結構說明不適用於補足這些缺口。</p></section>

<section id="plan" class="surface"><p class="eyebrow">05 / INTERACTION PLAN</p><h2>預定操作流程</h2>
<ol class="workflow"><li><strong>加工條件</strong>材料／必要細類與硬度 → 夾角 → 目標孔口 D；從 Spotting 帶入時保留有效條件。</li>
<li><strong>選刀與安裝</strong>匹配刀片／牌號 → 訂購碼 → 相容刀柄。尺寸、材質、長度與 XL 限制同區顯示。</li>
<li><strong>切削設定</strong>直接輸入 S、f，可選填機台最高轉速；型錄範圍一直可見。</li>
<li><strong>即時結果</strong>S、Vf、完整刀片／刀柄、材料條件、幾何尺寸及來源。有效條件可複製；不含機台 Z。</li>
<li><strong>幾何說明</strong>名義剖面與對刀資料缺口；日後取得 Micro 專屬圖面再評估計算。</li></ol>
<h3>桌面與手機配置</h3><p>沿用 ACE 的條件／選刀／結果架構與 Bootstrap 5.3.3。桌面左 7/12 條件、右 5/12 結果，左下放幾何圖。手機使用同一份表單及資料，單欄排列、精簡 S／Vf 結果條；完整結果仍在正文。共用根目錄 Header、Footer、背景與圖示，不建立副本。</p>
<h3>必須明確處理的狀態</h3><p>待填條件、條件式匹配、有效、無匹配及無效輸入。不要暗改使用者 D／材料／角度；上游切換只保留仍有效選項。材料不支援的角度附原因；未知 URL 值顯示無法套用條件。無效時清除舊結果並停用有效推薦複製。</p>
<p>D／f 使用 step = any 接受細微手動值；調整按鈕可用 D 每次 0.001 mm、f 每次 0.001 mm/rev。觸控至少 44px，動態訊息搭配 ARIA，幾何圖附文字說明，支援減少動畫。第一版顯示建議範圍，不宣稱單一最佳預設值。</p>
<h3>實作與審查順序</h3><p>審查本研究 → 在獨立測試資料夾製作互動樣板 → 核對資料與手機／桌面操作 → 使用者確認 → 整理到正式資料與計算頁 → 串接 Spotting。研究檔不應被正式頁直接引用。</p>
<p><a class="action" href="implementation-plan.txt">完整流程、狀態與 12 組驗收案例</a></p></section>

<section class="surface"><h2>現有內容衝突與待補證據</h2><p><code>Products/MicroSpotDrill/product-data.js</code> 的 FAQ 含 56 HRC、多段切深、NC 非中心與支撐刃資訊；本 PDF p24–25 無法支持這些 Micro 推薦值。這次保留原檔，由後續獨立內容整頓處理。新選刀資料應獨立建模，不由 FAQ 自動推斷。</p>
<p>正式開發前仍須確認：Micro 對刀／尖端圖面、Wmin 最小正切深與孔口定義、HRC50 等號、XL 不平衡原單位。既有未提交的 ACE 檔案與其他進行中的 Spotting／NC 工作不屬於此研究改動。</p></section>

<section id="sources" class="surface"><p class="eyebrow">06 / EVIDENCE AND FILES</p><h2>可追溯來源與交付檔</h2>
<p>原檔：<code>{source_path}</code><br>SHA-256：<code class="hash">{catalog['sourceFile']['sha256']}</code></p>
<ul><li><a href="sources/micro-spot-catalog-p24-25.pdf">來源 PDF 本機副本</a>：PDF 第 1 頁＝印刷 p24（功能）；第 2 頁＝印刷 p25（全部品項、尺寸、刀柄與切削資料）。</li>
<li><a href="sources/catalog-1.png">p24 完整頁渲染</a>、<a href="sources/catalog-2.png">p25 完整頁渲染</a>、<a href="sources/catalog-extracted.txt">擷取文字</a>；PDF p25 文字層有 p24 重複內容，視覺表格為核對依據。</li>
<li><a href="research-data.json">完整結構化研究資料</a>：4 幾何／8 SKU／5 刀柄／6 材料／限制與來源。</li>
<li><a href="filter-contract.json">上游篩選契約</a>：20 組材料×刀片規則、14 組材料×角度彙總。</li>
<li><a href="implementation-plan.txt">完整實作規劃與驗收案例</a>、<a href="README.txt">檔案說明</a>、<a href="sources/source-manifest.json">來源清單</a>。</li></ul>
<p class="note">本文件是可審查研究，不是正式發布頁面或實際切削／機台編程指令。所有切削數據僅來自本份 Micro 型錄，未套用 ACE 值。</p></section>
<footer>Micro Spot Drill / 本機研究文件 / 2026-11-10</footer></main></body></html>'''

def main():
    SOURCE_COPY.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(SOURCE, SOURCE_COPY)
    write_json("research-data.json", catalog)
    write_json("filter-contract.json", contract)
    write_json("sources/source-manifest.json", {
        "source": catalog["sourceFile"],
        "pageMap": [{"pdfPage": 1, "printedPage": 24, "render": "catalog-1.png", "text": "page-01.txt", "scope": "Features / applications / 2 cutting edges"},
                    {"pdfPage": 2, "printedPage": 25, "render": "catalog-2.png", "text": "page-02.txt", "scope": "Inserts / Holder / Cutting Data"}],
        "renderTool": "bundled Poppler pdftoppm, 160 dpi PNG",
        "renderNotes": "Poppler reported font substitution warnings; complete pages visually inspected; independent p25 render checked.",
        "readOnlyProjectReferences": ["CuttingData/AceSpotDrill/index.html", "CuttingData/AceSpotDrill/app.js", "Products/MicroSpotDrill/product-data.js", "Machining/Spotting/index.html"],
        "referencePolicy": "專案檔案只供流程/現況研究；Micro 數值來源僅為本地指定PDF。",
    })
    (ROOT / "implementation-plan.txt").write_text(PLAN, encoding="utf-8")
    (ROOT / "index.html").write_text(render_report(), encoding="utf-8")
    (ROOT / "README.txt").write_text("""Micro Spot Drill 研究交付（2026-11-10）
開啟 index.html 可審查完整結論、品項、材料/角度/孔徑邊界與頁面規劃。
research-data.json：完整資料及逐列來源（4款幾何、8個刀片SKU、5支刀柄、6列材料）。
filter-contract.json：Spotting可採用的20組材料×刀片規則與14組材料×角度彙總；尚未連到正式頁。
implementation-plan.txt：流程、狀態、URL契約、資料缺口與12組實作驗收案例。
sources/：來源PDF本機副本、SHA-256/頁碼清單、文字擷取及頁面渲染。
build_research.py：以已人工核對資料重建報告/JSON；不會寫入正式頁。

來源PDF實際2頁，為印刷24/25（原檔名p024-041不代表本檔包含其餘頁）。
快速交接：P碳鋼/P合金鋼/M不鏽鋼/K鑄鐵：90° D0.1-2.2、120° D0.1-2.53、142° D0.1-2.42；N非鐵/H硬化鋼<50：只有90° D0.1-2.2。均為Wmin/Wmax名義篩選映射，來源印刷p25（PDF2）。必須再核對特定刀片與牌號。D=Wmin帶名義下界提示，不能保證正切深。
本PDF直接提供8000-40000rpm，Vf=S×f；不要沿用ACE的Vc/ℓ/Q。第一版不輸出CNC Z。
本機研究，不更動正式頁、不發布；保留其他未提交修改，沒有刪除文件。
""", encoding="utf-8")
    print(f"Generated research: {len(inserts)} geometries / {sum(len(i['variants']) for i in inserts)} insert SKUs / {len(holders)} holders / {len(rules)} rules / {len(summaries)} summaries")

if __name__ == "__main__":
    main()
