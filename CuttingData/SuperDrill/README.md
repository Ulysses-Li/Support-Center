# Super Drill 獨立產品套件

正式入口：`/CuttingData/SuperDrill/index.html`。本目錄可獨立維護產品程式、樣式、資料、圖片及型錄。分類頁只呼叫本產品核心與資料，不載入本產品的互動程式或樣式。

## 檔案與 API

- `locale.js`：獨立純翻譯 API `SuperDrillLocale`，不監聽全域 DOM。瀏覽器需先載入 locale，再載入 core／diagrams／app；Node 自動 require。
- `app.js`：單產品畫面、URL 狀態與複製設定。
- `core.js`：`window.SuperDrillCore`，同時支援 CommonJS。
- `diagrams.js`：`window.SuperDrillDiagrams`，依料號數值畫出非比例尺寸圖。
- `data/catalog.json`：51 支刀體、5 種刀片；`data/cutting-data.json`：材料、16 列切削資料及本產品工況倍率。
- `assets/product.jpg`、`assets/manifest.json`：實際產品圖片及來源紀錄。
- `sources/Super_Drill_p136-141.pdf`：本產品 6 頁型錄；印刷 p136 → PDF 1，p141 → PDF 6。資料來源物件以 `original_pdf_page` 保留原始頁次。
- `catalog-notes.html`：本產品型錄規則及原廠待確認問題。

```js
const catalog = SuperDrillCore.normalizeCatalog(productJSON, cuttingJSON);
const material = SuperDrillCore.getMaterialSupport(catalog, state.material);
const candidates = SuperDrillCore.filterTools(catalog, state);
const cutting = candidates[0] ? SuperDrillCore.selectCutting(catalog, candidates[0].tool, state) : null;
const result = SuperDrillCore.calculate({D: 20, vc: 100, feed: 0.08, machineMax: 1200});
```

工具欄位保留 `id/family='sd'/ratio/D/T/L/L1/shank/d1/raw/sourcePage/insertModel`；`getMaterialSupport` 回傳 `{supported: null|boolean, sourcePage, note}`，僅依本產品切削資料列判定；未選材料為 `null`。切削結果包含 `materialSupported`、`status`、`vcRange/feedRange`、原範圍 `baseVcRange/baseFeedRange`、`insertGrade`、`notes` 與倍率。無效數學輸入回 `null`。

## 維護規則

- 精確標稱孔徑配對，需求深度不得超過 T；不以 L、L1、Dmax 代替。4D 刀體加工淺孔仍採 4D 列。
- 未選材料時可先篩幾何，但不可計算或複製加工值；非鐵金屬不建議使用，耐熱／未知材料未列適用配對時不推薦刀體，亦不可手動繞過。已支援材料缺少特定工況參數時才保留標示限制的手動試算。每轉進給不乘刀片數。
- 固定工況倍率修正 Vc 與 f；區間倍率須明確指定 `applicationFactor` 百分數，不自動取倍率中值。
- 材料下拉只顯示本產品有適用資料列的八種材質。舊 URL 的不支援材質以隱藏、停用的提示選項保留原 id，閉合顯示「請選擇材料」，不出現在可選清單，仍維持禁止推薦與計算。保留刀體選擇、上下公差、機台上限及適用材料手動值；更改材料、刀體或工況後回到該列起始中值。
- 有效刀體選擇在尚未填完深度時仍保留；不以型錄 T 自動填入客戶需求深度。
- 頁首頁尾、技術背景、Bootstrap 與 favicon 沿用全站資源。產品執行期不載入其他產品的資料與程式。

## 驗證

```powershell
node --test CuttingData/SuperDrill/tests/*.test.js
node --check CuttingData/SuperDrill/app.js
node --check CuttingData/SuperDrill/core.js
node --check CuttingData/SuperDrill/diagrams.js
```

## Language / 語言

English is the default when `lang` is absent or `lang=en`. Use `?lang=zh-TW` for Traditional Chinese review. The language button preserves the selected body, job conditions, tolerances and manual values. Product, hub and catalog-note return links retain the language parameter.

`state.lang` selects core message language. `getMaterialSupport(catalog, materialId, lang)` accepts an optional language argument. `SuperDrillDiagrams.renderTool(tool, {lang})` and `renderEmpty(lang)` use the same convention. Numeric catalog data, material IDs and API keys remain unchanged. The notes page also defaults to English and retains the selected language when returning to the product.
