# Super Power Drill 獨立維護套件

正式入口：`/CuttingData/SuperPowerDrill/index.html`。本目錄不依賴其他產品、原鑽孔共用目錄、測試資料或輸出目錄。站內只沿用根目錄 header／footer／技術網格背景與分頁圖示，以及全站 Bootstrap 版本。

## 檔案責任

- `app.js`：本產品表單、上下公差、URL 狀態、組裝摘要、複製及尺寸圖 dialog。
- `core.js`：純函式選型、中心／外刃切削列、工況檢查與公制 S／F。
- `diagrams.js`：p130 原型外形的動態 SVG；L1 為前段，後柄 58 mm，T 為型錄鑽深。
- `styles.css`：本產品樣式，未保留分類頁或另一產品分支。
- `data/catalog.json`：81 支刀體、4 個中心刀片變體、6 個外刃實體項目與來源。
- `data/cutting-data.json`：8 材料分類、`section` 內 20 列切削表、內冷／工況及 p134 Kc 參考。
- `assets/product.jpg`、`assets/manifest.json`：p128 清晰照片與原始嵌入影像 bbox 來源。
- `sources/Super_Power_Drill_p128-135.pdf`：8 頁專屬型錄；印刷頁碼減 127 即 PDF 頁次。來源物件保留 `original_pdf_page`。
- `catalog-notes.html`：本產品選型規則與原廠待確認問題，可列印。

## 核心 API

瀏覽器全域 `window.SuperPowerDrillCore`，CommonJS `require('./core.js')`：

```js
const catalog = Core.normalizeCatalog(catalogJSON, cuttingJSON);
const matches = Core.filterTools(catalog, state); // [{tool, eligibility, notes, ...}]
const cutting = Core.selectCutting(catalog, tool, state);
const result = Core.calculate({D, vc, feed, machineMax});
```

正規化工具固定 `family: 'spd'`、`ratio: null`，保留 `id,D,T,L,L1,shank,d1,raw,sourcePage,insertModel,centerModel,peripheryModel,centerQty,peripheryQty`。另一產品的工具會被拒絕。分類入口可以只載核心與兩份 JSON，不需要本產品 app 或 CSS。

圖形 API 為 `window.SuperPowerDrillDiagrams`（亦支援 CommonJS），提供 `renderTool(tool,{diameter})`、`renderEmpty()`。外部文字會跳脫；圖中名目 D 與客戶目標孔徑分開標示。

## 狀態與數值規則

URL 保留 `diameter,toleranceUpper,toleranceLower,depth,material,shank,machineMode,application,coolant,pressure,machineMax,spdDepthClass,tool,values,vc,feed`；也接受舊的 `bar` 料號參數。`spdDepthClass` 須手選 `lt7d` 或 `gt7d`。恰好 7D 保留提醒，不改成包含等號。

中心牌號依材料列選 NC2032／NC40，外刃先用已明確列入刀體的 NC2032。NC40 外刃尾碼 31 的直接替換關係尚待原廠確認，20 列來源仍完整保留，空格不補成零。無內冷、壓力低於 10 bar、斜面或疊板會停止計算；未確認壓力或非標準工況保留條件提醒。水平主軸與切屑修正不自動疊加。

S=1000×Vc/(π×D)，F=S×f。這是通用公制數學，不引用其他章節作本產品 PDF 依據；每轉進給不乘刀片數。型錄範圍中值是網站可調起始值。手動試算會清楚標明非型錄推薦；需求孔深不直接生成 Z。

## 驗證

```powershell
node --check CuttingData/SuperPowerDrill/app.js
node --check CuttingData/SuperPowerDrill/core.js
node --check CuttingData/SuperPowerDrill/diagrams.js
node --test CuttingData/SuperPowerDrill/tests/*.test.js
```

測試覆蓋數量與來源頁碼、尺寸／深度邊界、中心外刃牌號、7D、內冷與禁用工況、S／F、另一產品拒絕、圖形跳脫與獨立依賴，以及 VM 表單／URL 載入。正式畫面由主代理統一檢查。
