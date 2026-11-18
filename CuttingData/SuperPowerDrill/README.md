# Super Power Drill 獨立維護套件

正式入口：`/CuttingData/SuperPowerDrill/index.html`。本目錄不依賴其他產品、原鑽孔共用目錄、測試資料或輸出目錄。站內只沿用根目錄 header／footer／技術網格背景與分頁圖示，以及全站 Bootstrap 版本。

## 檔案責任

- `locale.js`：本套件獨立的英／繁中詞庫與指定 DOM 範圍翻譯，不使用全域 observer。
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
const support = Core.getMaterialSupport(catalog, materialId, lang); // {supported: null|boolean, sourcePage, note}
const matches = Core.filterTools(catalog, state); // [{tool, eligibility, notes, ...}]
const cutting = Core.selectCutting(catalog, tool, state);
const result = Core.calculate({D, vc, feed, machineMax});
```

正規化工具固定 `family: 'spd'`、`ratio: null`，保留 `id,D,T,L,L1,shank,d1,raw,sourcePage,insertModel,centerModel,peripheryModel,centerQty,peripheryQty`。另一產品的工具會被拒絕。分類入口可以只載核心與兩份 JSON，不需要本產品 app 或 CSS。`getMaterialSupport` 只檢查本產品 `cutting.section.cutting_rows` 的 `material_id`；未選材料回 `supported:null`，有對應列回 `true`，無對應列回 `false`。`selectCutting` 同步回傳 `materialSupported`；不適用時為 `blocked` 且切速／進給為空，`filterTools` 直接回空陣列。

圖形 API 為 `window.SuperPowerDrillDiagrams`（亦支援 CommonJS），提供 `renderTool(tool,{diameter})`、`renderEmpty()`。外部文字會跳脫；圖中名目 D 與客戶目標孔徑分開標示。

## 語言

無 `lang` 或 `lang=en` 預設英文；`lang=zh-TW` 為繁中檢閱。初始 HTML 為英文，產品與資料說明頁都有明顯切換按鈕，切換保留孔徑、公差、深度、材料、料號、切削值與其他狀態。返回分類頁或資料說明也保留 `lang`。

瀏覽器需依序載入自身 `locale.js`、`core.js`、`diagrams.js`、`app.js`。分類入口使用本核心時也先載入 `locale.js`；CommonJS 會自行 require 本地詞庫。核心提示使用 `state.lang`，`getMaterialSupport(catalog,id,lang)` 第三參數可選，省略為英文。圖形使用 `{lang}` 選項；複製文字與所有狀態同步語言。`SuperPowerDrillLocale.renderScoped` 僅用於自己的主內容及尺寸 dialog，不處理全站或其他產品 DOM。

## 狀態與數值規則

URL 保留 `lang,diameter,toleranceUpper,toleranceLower,depth,material,shank,machineMode,application,coolant,pressure,machineMax,tool,values,vc,feed`；也接受舊的 `bar` 料號參數。切削表分組依所選刀體的型錄鑽深 T ÷ 標稱孔徑 D 自動決定：T/D<7 採 T<7D 列，T/D>7 採 T>7D 列。需求孔深及舊網址的 `spdDepthClass` 不作選列依據，不要求客戶手選分組。型錄未列 T/D=7，恰好 7D 不自動套用任何資料列，仍列為原廠待確認問題，不將不等式改為包含等號。

中心牌號依材料列選 NC2032／NC40，外刃先用已明確列入刀體的 NC2032。NC40 外刃尾碼 31 的直接替換關係尚待原廠確認，20 列來源仍完整保留，空格不補成零。無內冷、壓力低於 10 bar、斜面或疊板會停止計算；未確認壓力或非標準工況保留條件提醒。水平主軸與切屑修正不自動疊加。

S=1000×Vc/(π×D)，F=S×f。這是通用公制數學，不引用其他章節作本產品 PDF 依據；每轉進給不乘刀片數。型錄範圍中值是網站可調起始值。非鐵金屬明確標示「本系列不建議用於非鐵金屬」；耐熱合金與未知且無適用列的材料不提供推薦，也不能手動填 Vc／f 繞過。材料下拉只列本產品切削表已支持的 8 種材料，不顯示非鐵、耐熱或未知材料。舊網址帶入不支持材料時，以隱藏且停用的 option 保留原材料 ID；閉合欄位顯示「請選擇材料」，展開清單不出現該材料，原狀態仍維持 blocked，不能靜默當作未選重新推薦。只有已支持材料缺少其他設定時可用原有手動試算，並清楚標明非型錄推薦；需求孔深不直接生成 Z。

## 驗證

```powershell
node --check CuttingData/SuperPowerDrill/app.js
node --check CuttingData/SuperPowerDrill/core.js
node --check CuttingData/SuperPowerDrill/diagrams.js
node --test CuttingData/SuperPowerDrill/tests/*.test.js
```

測試覆蓋數量與來源頁碼、尺寸／深度邊界、中心外刃牌號、依刀體 T/D 自動分組與恰好 7D 缺列、內冷與禁用工況、S／F、另一產品拒絕、圖形跳脫與獨立依賴，以及 VM 表單／URL 載入。正式畫面由主代理統一檢查。

## 推薦與選取

孔徑、需求深度與適用材料齊備後，在工況未被阻擋且具有型錄 Vc／f 範圍的候選中，依可鑽深 T 由短至長標示唯一的優先推薦。推薦卡保留推薦理由與需求深度／刀體 T 數值；內冷與夾持待確認等提醒維持原樣。

推薦與目前選取互相獨立。手選或網址指定較長刀體時，不把它改稱最短推薦；條件變更後重新判定推薦。使用者手填的 Vc／f 不會補足型錄缺值或取得推薦資格。
