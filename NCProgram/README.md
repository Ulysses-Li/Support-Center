# NC Program 專案結構

此專案依加工程式拆分資料夾，避免不同 NC Program 的資料、畫面與運算邏輯互相影響。

## 資料夾用途

- `Thread_Milling/`：Thread Milling 專屬頁面、資料、運算程式、樣式與測試。
- `NC_Helix/`：NC Helix Drill 專屬頁面、資料、運算程式、樣式與測試。
- `index.html`：相容舊網址的入口頁，目前會導向 Thread Milling。
- `header/`：所有 NC Program 頁面共用的頁首元件與樣式。
- `footer/`：所有 NC Program 頁面共用的頁尾元件與樣式。
- `scripts/layout.js`：共用頁首頁尾載入器。
- `scripts/dev-server.js`：本機開發伺服器；目前首頁會轉往 Thread Milling。

## Thread Milling 修改位置

- `Thread_Milling/index.html`：欄位與頁面結構。
- `Thread_Milling/styles/main.css`：Thread Milling 專屬畫面樣式。
- `Thread_Milling/src/data/`：材料、牙規與刀具原始資料。
- `Thread_Milling/src/services/`：計算、篩選、G-code 與匯出邏輯。
- `Thread_Milling/src/state/`：表單狀態整理。
- `Thread_Milling/src/ui/`：畫面事件與選單更新。
- `Thread_Milling/tests/`：自動測試。

## NC Helix 修改位置

- `NC_Helix/index.html`：欄位與頁面結構。
- `NC_Helix/styles/main.css`：NC Helix 專屬畫面樣式。
- `NC_Helix/src/data/`：刀具與加工限制資料。
- `NC_Helix/src/services/`：切削參數、進給、G-code 與匯出邏輯。
- `NC_Helix/src/state/`：不同加工模式的欄位狀態。
- `NC_Helix/src/ui/`：畫面事件、模式、多語系與提示功能。
- `NC_Helix/tests/`：自動測試。

## 新增其他 NC Program

新增獨立資料夾後，可在頁面引用上一層的 `header/`、`footer/` 與 `scripts/layout.js`。專屬資料與程式請留在自己的資料夾內，避免跨程式耦合。

新增與修改程式時，註解使用繁體中文，並以「用意」說明該段程式負責的工作，方便後續查找與維護。
