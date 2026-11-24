雕刻分類頁與初步選型

入口：/Machining/Engraving/index.html
依刻線寬度、深度、材料與角度篩選 X060、V045、V060、W060、N9MT-W。
線寬與深度分別核對型錄範圍，不由其中一項推算另一項，也不保證實際槽底形狀。

engraving-data.js 直接讀取 CuttingData 四組產品的正式 catalog.json 與 cutting-data.json，
只轉換初篩需要的欄位；規格、牌號及材料配對以該四組資料為唯一維護來源。
engraving-engine.js 負責純篩選；app.js 負責共用頁首、頁尾、卡片及規格視窗。
選定刀片後，帶入設定會保留尺寸、材種、角度與實體刀片 ID。
V045 與 V060 共用 /CuttingData/V060/index.html，依刀片 ID 區分。
NC Spot Drill 的產品資料入口保留於頁面下方。

桌面顯示三欄卡片；手機預設全部收合，同時只開啟一個系列。
正式頁的樣式、程式、產品圖及型錄均不引用測試資料目錄。

驗證：
node --test Machining/Engraving/tests/*.test.cjs CuttingData/Engraving/tests/*.test.cjs
