# MCC Thread Mill 選型樣板

本機預覽：`http://127.0.0.1:5500/測試資料/mcc-thread-selector/index.html`。

本樣板已套用到正式 `CuttingData/MCCThreadMill/`，由 Cutting Data 的 MCC Thread Mill 卡片進入。此資料夾只保留版面供比較；選型資料、查詢核心、抽取腳本與測試均以正式資料夾為唯一來源。

資料來源為 Nine9 官方 **Quick Pick for MCC Thread Insert，202604**：6 頁、273 個內／外牙規記錄、17 個刀片、476 組配對。原始來源網址、PDF SHA256 與每筆來源頁碼保留在正式頁的 `data.js`。

使用者下載的原始 PDF 存放於正式產品資源位置 `Products/MCCThreadMill/downloads/Quick_Pick_for_MCC_Thread_insert.pdf`。頁首、來源頁碼及複製摘要皆使用這份站內 PDF，不導向外部網站；`source.originalUrl` 僅供維護溯源。已確認下載檔案與抽取資料的來源 SHA256 完全一致。日後更新型錄時需同步更新站內 PDF、選型資料及來源版次。

- `../../CuttingData/MCCThreadMill/data.js`：型錄逐表抽取的唯一選型資料。
- `../../CuttingData/MCCThreadMill/core.js`：共用的正反查核心。
- `app.js`：操作流程與共用頁首／頁尾載入。
- 正式資料夾的 `tools/extract-quick-pick.py`：202604 六頁版的合併儲存格抽取腳本。
- 正式資料夾的 `tests/selector.test.js`：獨立 PDF 基準列、資料完整性及正反查測試。

驗證：

```powershell
node --test CuttingData/MCCThreadMill/tests/selector.test.js
```

需要重建時，以有 `pdfplumber` 的 Python 執行：

```powershell
python CuttingData/MCCThreadMill/tools/extract-quick-pick.py --source <官方PDF本機路徑>
```

腳本只適用上述版次與表格結構；型錄更新時，需重新確認版次、版面與測試。未列入此版的配對只表示尚無原表依據，不能據此宣告無法加工。刀桿配對、伸出／深度、刃數、材質與切削建議仍待正式來源確認；本樣板不產生轉速、進給或 NC 程式。
