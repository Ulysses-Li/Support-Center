# MCC Thread Mill 正式選型頁

正式入口：`CuttingData/MCCThreadMill/index.html`，由 Cutting Data 的 MCC Thread Mill 卡片進入。

提供內／外牙的雙向查詢：依牙規找刀片、依刀片反查牙規，以及站內型錄頁碼與選型摘要複製。原本的測試樣板僅保留版面供比較，資料與查詢核心統一使用本資料夾。

資料來源為 Nine9 官方 **Quick Pick for MCC Thread Insert，202604**：6 頁、273 個內／外牙規記錄、17 個刀片、476 組配對。原始來源網址、PDF SHA256 與每筆來源頁碼保留在 `data.js`。

使用者下載的原始 PDF 存放於正式產品資源位置 `Products/MCCThreadMill/downloads/Quick_Pick_for_MCC_Thread_insert.pdf`。頁首、來源頁碼及複製摘要皆使用這份站內 PDF，不導向外部網站；`source.originalUrl` 僅供維護溯源。已確認下載檔案與抽取資料的來源 SHA256 完全一致。日後更新型錄時需同步更新站內 PDF、選型資料及來源版次。

- `data.js`：型錄逐表抽取的唯一選型資料，不套用舊 NC 工具的螺距範圍推算。
- `core.js`：無 DOM 的正反查核心；統一乘號、空白與等值小數寫法。
- `app.js`：操作流程與共用頁首／頁尾載入。
- `tools/extract-quick-pick.py`：202604 六頁版的合併儲存格抽取腳本。
- `tests/selector.test.js`：獨立 PDF 基準列、資料完整性及正反查測試。

驗證：

```powershell
node --test CuttingData/MCCThreadMill/tests/selector.test.js
```

需要重建時，以有 `pdfplumber` 的 Python 執行：

```powershell
python CuttingData/MCCThreadMill/tools/extract-quick-pick.py --source <官方PDF本機路徑>
```

腳本只適用上述版次與表格結構；型錄更新時，需重新確認版次、版面與測試。未列入此版的配對只表示尚無原表依據，不能據此宣告無法加工。刀桿配對、伸出／深度、刃數、材質與切削建議仍待正式來源確認；本頁不產生轉速、進給或 NC 程式。
