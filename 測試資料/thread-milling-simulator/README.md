# MCC Thread Milling 動態模擬樣板

本機設計預覽，入口為 `index.html`。以專案根目錄啟動靜態 HTTP 服務後開啟 `/測試資料/thread-milling-simulator/index.html`。

英文版使用 `index.html?lang=en`，中文版使用 `index.html?lang=zh`。頁面右上角可即時切換語言，保留已選規格、材料、輸入值與動畫進度。靜態文字、動態訊息、圖面與無障礙標籤統一由 `i18n.js` 管理。

## 資料與共用元件

- 刀片、刀徑、配對與螺紋尺寸直接引用 `NCProgram/Thread_Milling/src/data/`。
- 切削參數、預設深度與 NC 輸出直接引用該功能的既有服務，沒有改動正式檔案。
- 共用根目錄的 header、footer、site-background、圖示與本機產品圖片。
- Bootstrap 版本與原 Thread Milling 頁一致，使用 5.3.6。

## 功能與範圍

- 內螺紋 M、MF、UNC、UNF、UNEF、G、PT、NPT；支援螺紋優先與刀片優先。
- 同步 SVG 側視圖、俯視圖、名義路徑與座標；暫停、重播、拖曳進度及速度控制。
- 一至三次徑向加工、材料參數與 NC 座標設定；原產生器程式的複製與下載。
- 平行牙沿用 G41/G03、底部向上及完整圈數；錐牙沿用 G42/G02、10° 分段、1.5P 進刀高度及半徑變化。
- 圖中為補正前名義座標與預先繪製的螺紋剖面，不模擬控制器補正或材料移除；播放時間獨立於切削時間。
- 非整數深度時，明示原產生器的螺旋終點 Z，不改動其完整圈數策略。
- 尊重 `prefers-reduced-motion`，啟用減少動畫時預設暫停；分頁隱藏時停止繪圖。

## 驗證

```powershell
node --test "測試資料/thread-milling-simulator/tests/motion.test.js"
npm test --prefix NCProgram
```

動畫核心測試從現有 NC 程式反查圈數與錐牙每個切削座標，以驗證雙方一致。

此樣板尚未套用至正式頁，也不發布至外部服務。
