# NC Helix Drill 樣板資料來源

核對日期：2026-11-02。官方三張切削表未印版次，日期只表示本次核對時間。

從官方 [NC Helix Drill 公式頁](https://nine9.jic-tools.com.tw/cutting-formula.htm?related_pc=8) 的 Cutting Data 區塊發現以下原始圖片，已保存在本資料夾；客戶操作中的來源連結使用站內副本。

- `cutting-data-1.jpg`：`010-1320` 與 `012-1525`，原網址 `https://nine9.jic-tools.com.tw/upload_files/cutting-formula/helix_drill/Cutting_data_NC_Helix_Drill_1.jpg`。
- `cutting-data-2.jpg`：`016-2030` 與 `020-2540`，原網址 `https://nine9.jic-tools.com.tw/upload_files/cutting-formula/helix_drill/Cutting_data_NC_Helix_Drill_2.jpg`。
- `cutting-data-3.jpg`：`025-3050` 與 `025-4265`，原網址 `https://nine9.jic-tools.com.tw/upload_files/cutting-formula/helix_drill/Cutting_data_NC_Helix_Drill_3.jpg`。本樣板先不收錄 `025-4265` 側固刀。
- `formula.jpg`：同頁 Formula 區塊，原網址 `https://nine9.jic-tools.com.tw/upload_files/cutting-formula/helix_drill/Formula.jpg`。

刀頭規格核對官方 [Cylindrical Shank](https://nine9.jic-tools.com.tw/cylindrical-shank.html) 與 [Screw Fit Type](https://nine9.jic-tools.com.tw/screw-fit-cutter.html) 表格。99323 的最大孔深為型錄條件上限，仍需確認實際接桿、伸出與干涉。

## 資料界線

- 十二種原表材料各自保留，碳鋼 0.25%、0.45%、0.60% 不合併。
- `data.js` 每列皆存 Vc 與 grade。020-2540 的不鏽鋼、Ni、Ti、硬化鋼 Vc 與其他組不同，不能只看全域 material.vc。
- Al 的一般 99321 Vc 為 345；Ni 的一般 99323 Vc 為 28，依原始圖片保留，未使用舊資料中的 350／30。
- 每一刀徑僅提供原表三個加工孔徑節點的 fz 與 Pitch，未建立未經核准的插值／鄰近取值規則。
- 公式圖的刀頭顯示兩個相對刀片位置；`teeth: 2` 僅作可調整的圖示初值，須確認實際作用齒數。官方網頁的「每刀片兩刃」描述可翻面刃數，不足以單獨證明作用齒數。
- 刀片 grade 保留切削表列值，不根據官方產品頁的用途文案自行改動。
