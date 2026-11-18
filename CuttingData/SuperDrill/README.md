# Super Drill 獨立產品套件

正式入口：`/CuttingData/SuperDrill/index.html`。本目錄可獨立維護產品程式、樣式、資料、圖片及型錄。分類頁只呼叫本產品核心與資料，不載入本產品的互動程式或樣式。

## 檔案與 API

- `app.js`：單產品畫面、URL 狀態與複製設定。
- `core.js`：`window.SuperDrillCore`，同時支援 CommonJS。
- `diagrams.js`：`window.SuperDrillDiagrams`，依料號數值畫出非比例尺寸圖。
- `data/catalog.json`：51 支刀體、5 種刀片；`data/cutting-data.json`：材料、16 列切削資料及本產品工況倍率。
- `assets/product.jpg`、`assets/manifest.json`：實際產品圖片及來源紀錄。
- `sources/Super_Drill_p136-141.pdf`：本產品 6 頁型錄；印刷 p136 → PDF 1，p141 → PDF 6。資料來源物件以 `original_pdf_page` 保留原始頁次。
- `catalog-notes.html`：本產品型錄規則及原廠待確認問題。

```js
const catalog = SuperDrillCore.normalizeCatalog(productJSON, cuttingJSON);
const candidates = SuperDrillCore.filterTools(catalog, state);
const cutting = SuperDrillCore.selectCutting(catalog, candidates[0].tool, state);
const result = SuperDrillCore.calculate({D: 20, vc: 100, feed: 0.08, machineMax: 1200});
```

工具欄位保留 `id/family='sd'/ratio/D/T/L/L1/shank/d1/raw/sourcePage/insertModel`；切削結果包含 `status`、`vcRange/feedRange`、原範圍 `baseVcRange/baseFeedRange`、`insertGrade`、`notes` 與倍率。無效數學輸入回 `null`。

## 維護規則

- 精確標稱孔徑配對，需求深度不得超過 T；不以 L、L1、Dmax 代替。4D 刀體加工淺孔仍採 4D 列。
- 型錄缺值維持空白，材料缺值不隱藏實體幾何候選。每轉進給不乘刀片數。
- 固定工況倍率修正 Vc 與 f；區間倍率須明確指定 `applicationFactor` 百分數，不自動取倍率中值。
- 保留 URL 的刀體選擇、上下公差、機台上限及手動值；更改材料、刀體或工況後回到該列起始中值。
- 有效刀體選擇在尚未填完深度時仍保留；不以型錄 T 自動填入客戶需求深度。
- 頁首頁尾、技術背景、Bootstrap 與 favicon 沿用全站資源。產品執行期不載入其他產品的資料與程式。

## 驗證

```powershell
node --test CuttingData/SuperDrill/tests/*.test.js
node --check CuttingData/SuperDrill/app.js
node --check CuttingData/SuperDrill/core.js
node --check CuttingData/SuperDrill/diagrams.js
```
