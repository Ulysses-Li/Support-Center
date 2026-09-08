from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "docs" / "manual-assets"
OUTPUT = ROOT / "docs" / "Support Center 專案使用與改進說明書.docx"

NAVY = "0C2237"
BLUE = "0067AD"
ORANGE = "F05A1A"
PALE_BLUE = "EAF5FD"
PALE_ORANGE = "FFF1EA"
LIGHT_GRAY = "D9D9D9"
MID_GRAY = "536B82"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_border(cell, color=LIGHT_GRAY, size="6"):
    tc_pr = cell._tc.get_or_add_tcPr()
    borders = tc_pr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tc_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = "w:" + edge
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:color"), color)


def set_cell_margins(cell, top=100, start=120, bottom=100, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn("w:" + margin))
        if node is None:
            node = OxmlElement("w:" + margin)
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_run_font(run, name="Microsoft JhengHei", size=None, bold=None, color=None):
    run.font.name = name
    run._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), name)
    if size is not None:
        run.font.size = Pt(size)
    if bold is not None:
        run.bold = bold
    if color:
        run.font.color.rgb = RGBColor.from_string(color)


def keep_with_next(paragraph):
    p_pr = paragraph._p.get_or_add_pPr()
    keep = OxmlElement("w:keepNext")
    p_pr.append(keep)


def add_heading(doc, text, level=1):
    p = doc.add_paragraph(style=f"Heading {level}")
    p.paragraph_format.space_before = Pt(14 if level == 1 else 9)
    p.paragraph_format.space_after = Pt(6)
    r = p.add_run(text)
    set_run_font(r, size=16 if level == 1 else 13, bold=True, color="000000")
    keep_with_next(p)
    return p


def add_body(doc, text, bold_lead=None):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.line_spacing = 1.22
    if bold_lead and text.startswith(bold_lead):
        r1 = p.add_run(bold_lead)
        set_run_font(r1, size=10.8, bold=True, color=NAVY)
        text = text[len(bold_lead):]
    r = p.add_run(text)
    set_run_font(r, size=10.8, color="1E2E3D")
    return p


def add_bullets(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.left_indent = Inches(0.24)
        p.paragraph_format.first_line_indent = Inches(-0.12)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(item)
        set_run_font(r, size=10.5, color="1E2E3D")


def add_numbered(doc, items):
    for item in items:
        p = doc.add_paragraph(style="List Number")
        p.paragraph_format.left_indent = Inches(0.28)
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(item)
        set_run_font(r, size=10.5, color="1E2E3D")


def add_table(doc, headers, rows, widths=None):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    for i, header in enumerate(headers):
        cell = table.rows[0].cells[i]
        set_cell_shading(cell, NAVY)
        set_cell_border(cell)
        set_cell_margins(cell)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(header)
        set_run_font(r, size=9.5, bold=True, color="FFFFFF")
        if widths:
            cell.width = Inches(widths[i])
    for row_index, row in enumerate(rows):
        cells = table.add_row().cells
        for i, value in enumerate(row):
            cell = cells[i]
            if row_index % 2:
                set_cell_shading(cell, "F6FAFD")
            set_cell_border(cell)
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            p = cell.paragraphs[0]
            r = p.add_run(str(value))
            set_run_font(r, size=9.4, color="1E2E3D")
            if widths:
                cell.width = Inches(widths[i])
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return table


def add_image(doc, filename, caption, width=6.5):
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(6)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run()
    run.add_picture(str(ASSET_DIR / filename), width=Inches(width))
    c = doc.add_paragraph()
    c.alignment = WD_ALIGN_PARAGRAPH.CENTER
    c.paragraph_format.space_after = Pt(8)
    r = c.add_run(caption)
    set_run_font(r, size=9, color=MID_GRAY)
    r.italic = True


def add_two_images(doc, left_file, left_caption, right_file, right_caption):
    table = doc.add_table(rows=2, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    for i, filename in enumerate((left_file, right_file)):
        cell = table.rows[0].cells[i]
        cell.width = Inches(3.05)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.add_run().add_picture(str(ASSET_DIR / filename), width=Inches(2.2))
    for i, caption in enumerate((left_caption, right_caption)):
        cell = table.rows[1].cells[i]
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(caption)
        set_run_font(r, size=8.8, color=MID_GRAY)
        r.italic = True
    for row in table.rows:
        for cell in row.cells:
            set_cell_border(cell, color="FFFFFF", size="0")
            set_cell_margins(cell, top=50, start=80, bottom=50, end=80)
    doc.add_paragraph().paragraph_format.space_after = Pt(2)


def add_page_break(doc):
    p = doc.add_paragraph()
    p.add_run().add_break(WD_BREAK.PAGE)


def build():
    doc = Document()
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(0.7)
    section.bottom_margin = Inches(0.65)
    section.left_margin = Inches(0.78)
    section.right_margin = Inches(0.78)

    styles = doc.styles
    for style_name in ("Normal", "Title", "Subtitle", "Heading 1", "Heading 2"):
        style = styles[style_name]
        style.font.name = "Microsoft JhengHei"
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Microsoft JhengHei")
        style.font.color.rgb = RGBColor(0, 0, 0)

    # 封面：將用途、讀者與結論放在第一頁，方便交接時快速判斷文件價值。
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(54)
    r = p.add_run("NINE9 SUPPORT CENTER")
    set_run_font(r, size=10, bold=True, color=ORANGE)

    title = doc.add_paragraph(style="Title")
    title.paragraph_format.space_after = Pt(10)
    r = title.add_run("Support Center 專案使用與改進說明書")
    set_run_font(r, size=28, bold=True, color="000000")

    subtitle = doc.add_paragraph()
    subtitle.paragraph_format.space_after = Pt(22)
    r = subtitle.add_run("給新進維護者、內容管理者與產品技術人員的操作及交接指南")
    set_run_font(r, size=13, color=NAVY)

    add_body(doc, "這份說明書說明網站用途、主要頁面、操作流程、程式結構、資料維護方法、已觀察到的介面問題，以及後續研究和改進順序。新接手人員應先完成本機預覽，再依產品資料、共用元件和功能模組的責任範圍進行修改。")

    add_table(doc, ["文件項目", "內容"], [
        ["專案", "Nine9 Support Center 靜態技術支援網站"],
        ["檢查日期", "2026 年 9 月 8 日"],
        ["主要技術", "HTML、CSS、JavaScript、Bootstrap 5.3.3"],
        ["目前狀態", "前端功能持續整合，後台與 AI 架構規劃中"],
        ["建議先讀", "README.md、AGENTS.md、docs/CODE_GUIDE.zh-TW.md"],
    ], widths=[1.45, 5.05])

    add_heading(doc, "三分鐘快速開始", 1)
    add_numbered(doc, [
        "在專案根目錄啟動 node tools/static-server.js。",
        "依終端機顯示的網址開啟首頁，不要直接雙擊 HTML。",
        "先確認 Header、Footer、首頁卡片與產品圖片都能顯示。",
        "需要修改產品時，先找到 Products 內的產品資料檔，不要把資料直接寫死在共用渲染器。",
        "修改 NC Program 計算公式後，在 NCProgram 執行 npm test。",
    ])

    add_page_break(doc)
    add_heading(doc, "1 專案定位與使用者路徑", 1)
    add_body(doc, "Support Center 是 Nine9 產品技術支援入口，目標是讓客戶與內部同仁從加工方式出發，找到產品、切削資料、CAD、NC 程式、影片、FAQ 與技術支援。首頁負責導流，不應承載過多技術細節。")
    add_image(doc, "01-home-desktop.png", "圖 1　首頁桌面版：以產品搜尋和 NC Program 作為主要入口。")

    add_heading(doc, "建議使用者路徑", 2)
    add_table(doc, ["使用者需求", "建議入口", "完成條件"], [
        ["不知道產品名稱", "Products 或加工方式", "找到產品系列與相關產品"],
        ["已有產品或刀片型號", "產品工作台", "取得規格、切削參數與檔案"],
        ["需要 CAD", "CAD Download 或產品工作台", "確認刀柄、尺寸與格式後下載"],
        ["沒有 CAM 軟體", "NC Program", "產生可供檢查的起始 G-code"],
        ["遇到加工問題", "Technical FAQ 或 Support", "取得有來源的建議或轉人工"],
    ], widths=[1.55, 2.0, 2.95])

    add_page_break(doc)
    add_heading(doc, "2 首頁與行動版使用方式", 1)
    add_body(doc, "首頁上方的 Product Finder 與 NC Program 是主要任務入口，下方六張卡片則提供完整功能導覽。Popular Machining Methods 適合讓熟悉加工方式的使用者快速前往分類頁。")
    add_two_images(doc, "02-home-mobile.png", "圖 2　首頁手機版", "05-ace-workbench-mobile.png", "圖 3　ACE 工作台手機版")

    add_heading(doc, "目前發現的行動版問題", 2)
    add_bullets(doc, [
        "首頁手機版右側內容被截斷，表示某些區塊、文字或固定寬度造成橫向溢出。",
        "ACE 工作台手機版的表單欄位也超出視窗，部分內容無法完整閱讀或操作。",
        "Product Tools 固定在左側牆面的方向正確，但必須確保不遮住表單標籤和點擊區。",
        "所有 430 px 寬度頁面都應加入 overflow-x 檢查，避免用隱藏溢出掩蓋真正的寬度問題。",
    ])
    add_body(doc, "建議驗收尺寸：390 × 844、430 × 932、768 × 1024、1366 × 768 與 1440 × 1200。每個尺寸都要確認導覽、表單、卡片、PDF 按鈕、Footer 和固定工具列。")

    add_page_break(doc)
    add_heading(doc, "3 產品搜尋與分類頁", 1)
    add_body(doc, "產品總覽依加工方式分為 12 個 family。桌面版使用三欄卡片，手機版改為預設收合的單欄手風琴。使用者點擊另一張卡片時，前一張應自動收合，避免頁面過長。")
    add_image(doc, "03-products-desktop.png", "圖 4　產品總覽桌面版：分類圖示、相關產品與主要操作位置一致。")

    add_heading(doc, "新增或修改產品的順序", 2)
    add_numbered(doc, [
        "在 Products 下選擇相近產品資料夾作為參考。",
        "更新產品專屬的 product-data.js，集中維護名稱、下載、影片、FAQ 與 Cutting Data。",
        "在 nine9/js/products-data.js 更新分類與產品連結。",
        "確認共用渲染器能處理缺少資料的狀態，不以空白連結假裝可下載。",
        "同時測試桌面卡片和手機手風琴，檢查 aria-expanded、aria-controls 與鍵盤操作。",
    ])

    add_page_break(doc)
    add_heading(doc, "4 ACE Spot Drill 加工工作台", 1)
    add_body(doc, "ACE Spot Drill indexV3.0 將產品選型、Cutting Data 計算、PDF 型錄與 CAD 配對放在同一工作流程。使用者修改加工方式、ISO 材料、刀片尺寸、角度或加工數值後，右側結果應立即更新。")
    add_image(doc, "04-ace-workbench-desktop.png", "圖 5　ACE Spot Drill 桌面版工作台：左側工具列、中間輸入、右側即時結果。")

    add_heading(doc, "操作步驟", 2)
    add_numbered(doc, [
        "在 Choose the Application 選擇加工方式與工件材料。ISO P、M、K、N 等代碼必須和文字同時顯示，不能只靠顏色。",
        "在 Select the Insert 選擇刀片尺寸與夾角。選項變更後，系統會重建可用的相依選項。",
        "在 Set Cutting Values 檢查直徑 D、切削速度 Vc 與每轉進給 f。預設使用建議範圍中間值，但使用者可調整。",
        "在 Current Setup 確認刀片型號、轉速、進給與完整規格範圍。",
        "在 Files and Resources 預覽 PDF 型錄並確認 CAD 的刀柄、格式和檔案狀態。WAITING 代表配對存在但實體檔案尚未加入。",
    ])

    add_heading(doc, "計算與資料注意事項", 2)
    add_bullets(doc, [
        "RPM = 1000 × Vc ÷ π ÷ D；Feed Rate = RPM × f。",
        "直徑不得大於該刀片的 Dmax；無效輸入必須阻止顯示誤導性結果。",
        "60° Spotting 需要額外提示 peck cycle，不應只顯示一般說明。",
        "產品規格、Cutting Data 與 CAD 配對應共用同一資料來源，避免三處各自維護。",
    ])

    add_page_break(doc)
    add_heading(doc, "5 NC Program 使用與驗證", 1)
    add_body(doc, "NC Program 目前提供 Thread Milling 與 Helical Interpolation Drilling。這些工具用於建立可供工程師檢查的起始程式，不應宣稱可直接取代 CAM 或機台驗證。")
    add_image(doc, "06-nc-program-desktop.png", "圖 6　NC Program 首頁：依加工方式選擇產生器。")

    add_heading(doc, "安全使用原則", 2)
    add_bullets(doc, [
        "產生的 G-code 上機前必須由合格人員檢查控制器格式、原點、刀補、旋向、深度與安全高度。",
        "修改 gcode-generator、cutting-params、depth 或 thread-filter 後必須執行 npm test。",
        "測試應涵蓋邊界值、無效尺寸、內外牙差異、單位與材料預設值。",
        "下載檔案應包含程式用途、單位、產生時間與免責提醒，方便追溯。",
    ])

    add_page_break(doc)
    add_heading(doc, "6 程式結構與維護邊界", 1)
    add_table(doc, ["路徑", "責任", "修改原則"], [
        ["index.html", "首頁入口", "只維護導覽與首頁內容"],
        ["header 與 footer", "全站共用版型", "不在子資料夾建立副本"],
        ["css/site-background.css", "共用技術網格背景", "避免各頁重複漸層"],
        ["nine9", "產品總覽", "桌面與手機共用資料及 HTML"],
        ["Machining", "加工分類入口", "只整理分類與產品連結"],
        ["Products", "產品資料與產品頁", "資料放 product-data，通用互動放渲染器"],
        ["CADDownload", "CAD 搜尋入口", "顯示配對和可用狀態"],
        ["CuttingData", "切削資料入口", "避免複製產品數值"],
        ["NCProgram", "G-code 工具", "data、services、state、ui 分層"],
        ["tools", "本機伺服器與維護腳本", "不放頁面呈現資料"],
    ], widths=[1.7, 2.0, 2.8])

    add_heading(doc, "共用資料流", 2)
    add_body(doc, "HTML 建立容器 → 資料檔宣告內容 → 渲染器產生畫面 → 使用者事件更新狀態與結果。所有進入 innerHTML 的動態文字都要先做 HTML 跳脫。Header 與 Footer 透過 fetch 載入，因此直接用 file 協定開啟頁面會造成路徑或跨來源問題。")

    add_page_break(doc)
    add_heading(doc, "7 內容維護與發布流程", 1)
    add_table(doc, ["狀態", "可做的事", "負責角色"], [
        ["Draft", "新增與修改資料、上傳暫存檔", "Editor"],
        ["In Review", "檢查規格、來源、單位與適用範圍", "Reviewer"],
        ["Approved", "技術內容已核准，等待發布", "Reviewer"],
        ["Published", "前台可讀取的正式版本", "Admin"],
        ["Archived", "保留歷史但不在前台顯示", "Admin"],
    ], widths=[1.15, 3.65, 1.7])

    add_heading(doc, "每次更新前的檢查", 2)
    add_bullets(doc, [
        "產品名稱、料號、尺寸、角度與單位是否一致。",
        "Cutting Data 是否保留型錄頁碼、提供者、版本與審核日期。",
        "PDF 是否可預覽；CAD 是否只有實體檔案存在時才顯示下載。",
        "桌面與手機畫面是否無橫向捲動、遮擋或過小點擊區。",
        "共用 Header、Footer 與背景是否仍由根目錄載入。",
        "Git commit 是否只包含同一功能段落，訊息是否使用繁體中文。",
    ])

    add_page_break(doc)
    add_heading(doc, "8 研究與改進方向", 1)
    add_body(doc, "改進工作應先處理使用者能否完成任務，再進行視覺微調。以下優先順序綜合目前程式結構、實際截圖與預計導入的後台需求。")
    add_table(doc, ["優先級", "方向", "完成定義"], [
        ["P0", "修正手機版橫向溢出", "390 與 430 px 無內容截斷、無水平捲軸"],
        ["P0", "建立可信資料來源", "產品、Cutting Data、CAD 使用同一資料識別碼"],
        ["P0", "NC Program 安全驗證", "核心公式有自動測試，輸出附上檢查提醒"],
        ["P1", "統一語言與術語", "頁面英文、繁中和技術單位有明確語言策略"],
        ["P1", "降低外部依賴", "圖示改用內嵌 Bootstrap Icons，字型和 CDN 有備援"],
        ["P1", "後台審核與發布", "草稿、審核、發布、歷史版本和權限可追溯"],
        ["P2", "搜尋與分析", "可依料號、加工方式、材料和檔案狀態搜尋"],
        ["P2", "AI 與知識圖譜", "AI 只回答已發布資料並提供來源"],
    ], widths=[0.8, 2.4, 3.3])

    add_heading(doc, "使用者研究計畫", 2)
    add_numbered(doc, [
        "訪談 3 至 5 位業務、技術人員與客戶，記錄他們如何從問題找到產品和參數。",
        "設計五個任務：找產品、確認規格、算 Cutting Data、找 CAD、產生 NC Program。",
        "以手機與桌面各測一次，記錄完成率、完成時間、回頭次數與錯誤點。",
        "把找不到資料、等待檔案與不理解單位列為內容缺口，不只當成 UI 問題。",
        "每次改版只驗證一組假設，將結果和截圖寫入版本紀錄。",
    ])

    add_heading(doc, "建議觀察指標", 2)
    add_table(doc, ["指標", "用途", "初期目標"], [
        ["任務完成率", "是否能完成找產品、資料或檔案", "核心任務 ≥ 80%"],
        ["首次有效結果時間", "從首頁到第一個可用結果", "一般查找 ≤ 60 秒"],
        ["缺檔率", "被選到但無 PDF 或 CAD 的比例", "持續下降並可追蹤"],
        ["計算錯誤率", "無效輸入或不合理結果", "已知案例 0 個未攔截"],
        ["人工轉接率", "AI 或 FAQ 無法處理的問題", "保留原因分類"],
    ], widths=[1.55, 3.25, 1.7])

    add_page_break(doc)
    add_heading(doc, "9 後台與 AI 發展方向", 1)
    add_body(doc, "建議採用 Firebase 與 Google Cloud 混合架構。Firebase Authentication 負責登入；Firebase SQL Connect 所使用的 Cloud SQL PostgreSQL 保存產品與加工資料；Cloud Storage 保存 PDF、CAD 和圖片；Cloud Run 負責驗證、計算、發布與資料轉換；Vertex AI RAG 搜尋已核准文件。")

    add_heading(doc, "KG4CUT 與 OWL 的位置", 2)
    add_body(doc, "KG4CUT／OWL 應作為知識層，不應直接取代日常後台資料庫。先把產品、刀片、刀柄、ISO 材料、加工條件與檔案關聯整理成穩定的關聯式資料，再建立 ontology mapping 並輸出 RDF／OWL。AI 回答精確數值時應查 PostgreSQL；回答文件說明時才使用 RAG；需要關係推理時再查知識圖譜。")

    add_table(doc, ["元件", "用途", "不應負責"], [
        ["PostgreSQL", "正式規格、Cutting Data、版本與狀態", "自然語言回答"],
        ["Cloud Storage", "PDF、CAD、圖片與檔案版本", "產品關係查詢"],
        ["Cloud Run", "驗證、計算、發布與 API", "長期保存唯一資料"],
        ["OWL／KG4CUT", "語意關係與推理", "日常表單交易"],
        ["Vertex AI RAG", "文件檢索與有來源的回答", "自行猜測加工數值"],
    ], widths=[1.45, 3.15, 1.9])

    add_page_break(doc)
    add_heading(doc, "10 新接手人員檢查清單", 1)
    add_bullets(doc, [
        "我能啟動本機伺服器並開啟首頁。",
        "我知道 Header、Footer、背景和產品資料各自放在哪裡。",
        "我能說明 V1、V2 與 ACE V3 頁面的差異。",
        "我能新增一筆產品資料，而不修改共用渲染器。",
        "我能判斷 PDF、CAD 的可用與等待狀態。",
        "我知道 Cutting Data 的來源、單位和審核責任。",
        "我會在修改 NC Program 後執行測試。",
        "我會同時檢查 390、430、768、1366 與 1440 px 畫面。",
        "我不會把敏感資料或金鑰提交到 Git。",
        "我會用繁體中文撰寫 Git commit，並只提交相關檔案。",
    ])

    add_heading(doc, "問題回報應包含", 2)
    add_bullets(doc, [
        "頁面網址與裝置尺寸。",
        "重現步驟、預期結果與實際結果。",
        "畫面截圖和瀏覽器版本。",
        "使用的產品、刀片、材料、角度與輸入值。",
        "是否影響資料正確性、下載或 G-code。",
    ])

    add_heading(doc, "參考文件", 2)
    add_bullets(doc, [
        "專案根目錄 README.md",
        "專案根目錄 AGENTS.md",
        "docs/CODE_GUIDE.zh-TW.md",
        "Products/AceSpotDrill/cutting-data-calculator-logic.md",
        "Firebase SQL Connect：https://firebase.google.com/docs/sql-connect",
        "Cloud Run：https://docs.cloud.google.com/run/docs/overview/what-is-cloud-run",
        "Vertex AI RAG：https://cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/rag-overview",
    ])

    # 簡潔頁尾，僅提供文件識別和頁碼欄位。
    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("Nine9 Support Center　專案使用與改進說明書　")
    set_run_font(r, size=8.5, color=MID_GRAY)
    fld_char1 = OxmlElement("w:fldChar")
    fld_char1.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = " PAGE "
    fld_char2 = OxmlElement("w:fldChar")
    fld_char2.set(qn("w:fldCharType"), "end")
    r._r.append(fld_char1)
    r._r.append(instr)
    r._r.append(fld_char2)

    doc.core_properties.title = "Support Center 專案使用與改進說明書"
    doc.core_properties.subject = "Nine9 Support Center 使用、維護、研究與改進指南"
    doc.core_properties.keywords = "Nine9, Support Center, Cutting Data, CAD, NC Program, Firebase, KG4CUT"
    doc.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build()
