# 雕刻 CAD/CAM 本機樣板

本樣板可用滑鼠或觸控繪製、選取、移動、刪除及復原直線、矩形、圓形；游標在 2D 畫布內時，下方顯示即時 XY 毫米座標。文字可選擇中英文單線筆畫或 Noto Sans TC 外框，加入後可整段選取與移動。ASCII DXF 支援 LINE、CIRCLE、ARC、LWPOLYLINE 和舊版 2D POLYLINE。可設定雕刻深度、分層、安全高度與進給，產生中心線 G-code，並在 3D 工件上預覽圖形及播放刀路。`nine9-example.dxf` 可作匯入範例。

開啟頁面或按「載入 Nine-9 雕刻範例」會載入 Nine-9 DXF 字形輪廓，範圍約 100 × 24.81 mm，與新增文字的字型設定獨立；調整加工設定後可按「產生雕刻刀路」。

流水號可設定前後綴、起始號碼、數字位數、遞增量、數量與列間距，使用文字區的字型、高度與起點。數字不足位數時補零，超過位數時保留完整數字；一批最多 100 個。多個號碼向下排列於同一張圖並輸出成同一支 NC，並非每個工件自動遞增。列間距為相鄰起點距離，過小時會阻止加入；每個號碼可獨立選取、移動或刪除，整批加入可一次復原。

支援毫米與英吋；無單位的圖檔須手動指定。其他圖形、非 XY 平面或未支援的單位會阻止產生程式。DXF 文字、圖塊和 SPLINE 等目前不支援；DXF 文字需先轉換成支援的線條。手動輸入文字限單行，可即時預覽字形；單線英數提供 NormStroke 工程體與 EMS Tech、Casual Hand、Swiss、Capitol、League、Neato 等字型，中文在各單線選項中共用 Make Me a Hanzi 的筆畫中線資料。中文字形屬近似筆畫，未收錄的字元會顯示錯誤，不產生部分文字；尚無字形筆畫填滿功能。

程式假設工件頂面 Z0，產生的數值為示範，刀徑不做補正，也沒有刻痕寬度、刀具形狀、材料移除或夾具碰撞模擬。3D 工件依圖形外框、邊距與厚度建立，僅供視覺預覽；工件設定不會改寫 NC 座標。輸出格式尚未針對指定控制器與機台驗證。

在專案根目錄執行 `node tools/static-server.js`，開啟 `http://127.0.0.1:8019/測試資料/engraving-cad-cam/`。樣板暫時使用 `../gcode-viewer/` 的解析器與視圖；正式整合前應整理至共用模組。

驗證：`node --test 測試資料/engraving-cad-cam/tests/*.test.js`，以及 `npm test --prefix NCProgram`。字型與解析套件來源及授權見 `vendor/README.md`、`vendor/README-NormStroke.md`、`vendor/ems-strokes/README.md` 和 `vendor/hanzi-strokes/README.md`。
