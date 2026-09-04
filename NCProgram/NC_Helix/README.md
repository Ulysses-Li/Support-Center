# NC Helix 維護說明

NC Helix 已依功能拆分，頁面結構、資料、計算、狀態與 UI 事件分開維護。

## 修改位置

- `index.html`：表單欄位與頁面結構。
- `styles/main.css`：NC Helix 專屬樣式。
- `src/data/tool-data.js`：Part No.、刀徑、接桿與加工限制資料。
- `src/data/cutting-data.js`：材料、Vc、fz、Pitch 與刀片材質資料。
- `src/services/cutting-params.js`：材料切削參數與建議值。
- `src/services/feed-calculator.js`：轉速及進給計算。
- `src/services/gcode-generator.js`：螺旋刀路與加工時間。
- `src/services/export-file.js`：刀具啟動碼、清除與檔案匯出。
- `src/state/form-state.js`：不同加工模式的欄位狀態。
- `src/ui/`：刀具選擇、模式、多語系、提示與表單事件。
- `tests/run-tests.js`：結構、刀具資料與計算公式測試。

外層的 `header/`、`footer/` 與 `scripts/layout.js` 為共用元件，NC Helix 不另外複製。

新增或修改程式時，請使用繁體中文註解並說明該段程式的用意。
