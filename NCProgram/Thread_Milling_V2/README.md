# Thread Milling V2.0

正式入口：`/NCProgram/Thread_Milling_V2/index.html`，預設英文；以 `?lang=zh` 切換繁體中文，頁面右上角亦可切換語言。

- 與原版 `/NCProgram/Thread_Milling/` 並列，原版網址與功能保留。
- 正式頁自有 HTML、CSS、動畫與翻譯模組，不引用 `測試資料/`。
- 刀片配對、螺紋尺寸、材料參數與 NC 產生器共用 `../Thread_Milling/src/`，不建立第二份產品資料。
- 全站頁首、頁尾、背景與圖片共用根目錄資源。
- 支援內螺紋選型、同步側視／俯視刀路、分次加工、切削參數、進度控制、NC 複製及下載。
- 圖中為補正前名義座標，不模擬控制器補正或材料移除；動畫時間獨立於實際加工時間。

驗證：在專案根目錄執行 `npm test --prefix NCProgram`。路徑測試會與原 NC 產生器逐點比對。
