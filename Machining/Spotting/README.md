# Spotting 正式選刀篩選

入口：`/Machining/Spotting/index.html`。材料、夾角與工件表面點鑽孔徑必須同時命中同一筆刀片／組裝候選；不把產品的總角度、總直徑與總材料能力分開拼接。

資料直接讀取正式功能：

- ACE：`Products/AceSpotDrill/product-dataV2.0.js` 與 `CuttingData/AceSpotDrill/chamfer-geometry.js`；Dmax、Tmax 及刀尖模型共同限定孔徑。
- NC：`CuttingData/NCSpotDrill/data.js`；以同組刀片／角度／刀柄的型錄孔徑選型，實際刀長基準另在計算器確認。
- Micro：`CuttingData/MicroSpotDrill/filter-contract.json`；以材料推薦牌號和實際供貨品項交集，再套用 Wmin–Wmax 名義範圍。篩選結果接到正式 Micro 計算器。

零結果會說明孔徑過大、過小、落在區間缺口或無效邊界，以及材料／角度沒有對應組合。顯示的上限只由目前材料與角度的候選計算；不借用其他材料或角度的較大尺寸。

桌面與手機共用資料及 HTML。手機卡片預設收合、單開，並維護原生鍵盤操作與 ARIA 狀態。顧客可以保留材料／角度，只清除不符的孔徑。

驗證：

```text
node --test Machining/Spotting/tests/selector.test.js
```

測試涵蓋實際型錄邊界、同組裝交集、Micro 品項與材料限制、零結果原因，以及正式 Finder／Micro 入口和站內 PDF 不依賴本機樣板。桌面、手機、條件帶入與來源連結另做瀏覽器檢查。
