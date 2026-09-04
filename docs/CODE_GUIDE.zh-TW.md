# 程式架構與繁體中文導覽

## 網站如何運作

這是沒有編譯步驟的靜態網站。瀏覽器直接讀取 HTML、CSS 與 JavaScript；各頁再用 `fetch()` 插入共用的 `header/header.html` 與 `footer/footer.html`。

主要資料流如下：

1. HTML 建立頁面容器並依順序載入資料檔、渲染檔。
2. 資料檔宣告產品、FAQ、影片或加工參數。
3. 渲染檔等待 `DOMContentLoaded`，再把資料轉成 HTML。
4. 使用者點擊、輸入或切換選項時，事件處理函式更新畫面或產生結果。

## 資料夾職責

| 路徑 | 用途 |
| --- | --- |
| `index.html` | GitHub Pages 與網站根網址使用的正式首頁。 |
| `nine9/` | 產品總覽與首頁專用樣式。 |
| `Machining/` | 依加工方式分類的產品入口頁。 |
| `Products/` | 各產品頁面與該產品專屬資料。 |
| `js/data/` | 跨頁共用的產品分類資料。 |
| `js/render/` | 把資料渲染成產品卡片、下載、FAQ、切削資料等畫面。 |
| `css/site-background.css` | 全站唯一的工程網格背景設定；其他頁面不再各自複製漸層。 |
| `header/`、`footer/` | 共用導覽列與頁尾。 |
| `CADDownload/` | CAD 型號搜尋與下載狀態。 |
| `CuttingData/` | 各產品切削資料入口。 |
| `ProductVideos/` | 各產品影片入口。 |
| `TechnicalFAQ/` | 各產品 FAQ 入口。 |
| `News/` | 新聞卡片清單。 |
| `ContactUs/` | 將表單內容組成 `mailto:` 郵件。 |
| `NCProgram/` | 獨立 NC Program 專案的完整副本，包含首頁與兩套 G-code 產生器。 |
| `tools/` | 本機靜態伺服器與 FAQ 資料維護腳本。 |

## 共用產品資料格式

每個 `Products/<產品>/product-data*.js` 都建立 `PRODUCT_PAGE_DATA`：

| 欄位 | 用途 |
| --- | --- |
| `productName` | 頁面標題、郵件主旨與技術支援文字所用的產品名稱。 |
| `downloads` | 型錄或檔案卡片；`href` 空白時顯示尚未提供。 |
| `programming` | NC 程式產生器的名稱、說明與入口。 |
| `videos` | 影片標題、說明與外部連結。 |
| `faqs` | FAQ 主題、問題與答案。 |
| `cuttingData` | 工法、刀片、角度、材料及 Vc/f 等計算資料。部分產品沒有此欄位。 |

資料檔以宣告內容為主，逐筆產品或規格物件都遵循相同欄位，因此採「欄位級註解」，避免每列重複同一句說明。實際控制流程集中在渲染器，已在函式與關鍵判斷處加上繁體中文註解。

## 共用產品頁渲染器

`js/render/product-resource-template-V1.0.js` 供大多數產品使用，`V1.0V2.0.js` 則供 ACE Spot Drill 使用。核心函式用途：

| 函式 | 用途 |
| --- | --- |
| `escapeHTML` | 將外部資料中的特殊字元編碼，避免被當成 HTML 執行。 |
| `renderDownload` | 顯示下載卡片。 |
| `renderProgramming` | 顯示 NC 程式工具入口。 |
| `renderVideos` | 顯示影片卡片。 |
| `renderFaqList` / `renderFaqDetail` | 顯示 FAQ 清單與單篇內容。 |
| `renderTechnicalSupport` | 建立技術支援郵件表單。 |
| `buildSupportMailto` | 把表單資料安全編碼成郵件連結。 |
| `getSelectedCuttingData` | 由目前選項找出對應工法、刀片、材料與進給範圍。 |
| `updateCuttingDataCalculator` | 計算建議 Vc、轉速、每刃進給與工作進給。 |
| `renderPage` | 依網址雜湊值切換產品頁分頁。 |
| `loadHeader` / `loadFooter` | 載入共用頁首與頁尾。 |

## NC Program 工具

`css/site-background.css` 集中定義冷白底、淡藍／淡橘徑向光暈與 36px 工程網格。一般頁面由 `header/header.css` 載入，NC Program 則由自己的頁首樣式載入同一個根目錄檔案。

NC Program 保留獨立站的黑色頁首外觀，但 Logo 與 NC Program 導覽都使用站內根路徑，不綁定網域或舊的 `/Nine-9` 子路徑。

目前首頁使用兩套正式工具：

- `NCProgram/Thread_Milling/`：螺紋銑削 G-code 產生器。
- `NCProgram/NC_Helix/`：螺旋插補鑽孔 G-code 產生器。

未加底線的 `NCProgram/ThreadMilling/` 是整併前版本，首頁已不再引用，暫時保留供回溯。

### 螺紋銑削

載入順序刻意由資料、純運算服務、表單狀態、UI，最後到 `main.js`。所有模組把公開功能掛到 `window.NCProgram`，所以不需要打包工具也能在瀏覽器運作。

| 模組 | 用途 |
| --- | --- |
| `src/data/materials.js` | 材料對應的切削速度與每刃進給預設值。 |
| `src/data/tools.js` | 刀片群組、適用牙規與刀徑。 |
| `src/data/threads.js` | 牙規外徑、螺距、底孔徑及深度資料。 |
| `src/services/cutting-params.js` | 轉速與進給的純計算。 |
| `src/services/thread-filter.js` | 牙系、牙規與刀片相容性篩選。 |
| `src/services/depth.js` | 自動加工深度。 |
| `src/services/gcode-generator.js` | 驗證輸入並產生平行牙或錐管牙 G-code。 |
| `src/services/export-file.js` | 加上程式結尾並下載文字檔。 |
| `src/state/form-state.js` | 集中讀取表單，整理成計算層需要的物件。 |
| `src/ui/*.js` | 下拉選單、走刀次數、材料色彩與事件綁定。 |
| `src/main.js` | DOM 完成後啟動整個工具。 |
| `tests/run-tests.js` | 在 Node.js 模擬瀏覽器全域物件並測試核心運算。 |

### 螺旋插補鑽孔

`NCProgram/NC_Helix/src/` 同樣分成 `data`、`services`、`state` 與 `ui`：資料層保存刀具與材料參數，服務層負責進給與 G-code 計算，狀態層統一讀取表單，UI 層處理語言、模式、警告與事件。

## 維護原則

- 新增產品時，複製一個現有產品資料夾，再修改 `product-data.js` 與產品總覽資料。
- 顯示文字與產品規格放資料檔；通用互動放渲染器，避免複製同一段函式。
- 所有插入 `innerHTML` 的資料都先經過 `escapeHTML()`。
- 改動 G-code 公式後必須在 `NCProgram` 執行 `npm test`，一次驗證兩套產生器。
- 目前的 V1/V2 與 `no/` 目錄是歷史版本；確認部署端不再引用後，才另行做移除提交。
