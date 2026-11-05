# 補充刀柄與 Dmin 來源紀錄

本檔為 2026-11-05 製作 NC Spot Drill 樣板時的來源核對。`Legacy` 指下載的舊版型錄檔案；不代表已確認停產。網站顧客用連結應指向本資料夾的站內檔案。

## 120° 與 N9MT 型 142° 刀柄

- 當前仍可開啟的 Nine9 官方個別頁：<https://nine9.jic-tools.com.tw/100nc-spot-drill.html>。
- 官方原始 PDF：<https://nine9.jic-tools.com.tw/upload_files/products/pdf/Nine9_NC_Spot_Drill.pdf>。
- 站內保存：`NC-Spot-Drill-Legacy.pdf`，20 頁；表格在 PDF 第 13 頁，印刷頁碼 `1-13`。已將該頁渲染核對，並非只採搜尋摘要。
- PDF SHA256：`1659afe62e9c9923d7992f277e0ac25361bb07731d4248facab28676ad8b40d1`。

| 角度 | 刀柄料號 | 刀柄直徑 | 總長 L | Dmax | Tmax |
| --- | --- | --- | --- | --- | --- |
| 120° | 00-99616-20-120 | 20 mm | 100 mm | 17 mm | 4.76 mm |
| 120° | 00-99616-3/4-120 | 3/4 in | 100 mm | 0.669 in | 0.187 in |
| 142° | 00-99616-20-142 | 20 mm | 100 mm | 18.5 mm | 3.16 mm |
| 142° | 00-99616-3/4-142 | 3/4 in | 100 mm | 0.728 in | 0.124 in |

兩組均使用 `N9MT11T3CT2T`。舊 PDF 列出 `H-NC40`、`H-NC9076`，當前官方個別頁另列 `H-NC5071`；三個牌號的適用說明應分別核對，不能聲稱三者都出自舊 PDF。

官方 NC Spot Drill 總覽 <https://nine9.jic-tools.com.tw/nc-spot-drill.htm> 將 `100° / 120° / 142°` 這組的 Dmin 列為 3 mm。新型錄沒有列出這些 120°／N9MT-142° 刀柄細規格，並不表示它們屬於 Micro Spot Drill；它們是 NC Spot Drill 的另一組正式官方資料。

### 不同來源的衝突應保留

- `00-99616-20-100`：使用者提供的 2025–2026 分冊列 Tmax 6.2 mm；上述舊 PDF 與當前個別頁列 6.3 mm。樣板採選定來源的 6.2 mm，不以較大值覆蓋。
- `99619-V142-16 / -32` 是 V142 刀片的獨立組合，不能與本檔 `99616-20-142` 配 `N9MT11T3CT2T` 合併。V142 官網的 Dmax/Tmax 較使用者分冊大，樣板應維持分冊逐件規格，另記差異。
- 英制型號的型錄數字有四捨五入；不可把英制近似數據當成更精密的公制校正。

## 2026 主型錄的 Spot Drill System 表

- 官方主型錄原始 URL：<https://nine9.jic-tools.com.tw/upload_files/download/catalog/Main_catalogue/Nine9_main_catalouge_V_2025-2026_ENG_Version.pdf>。
- 本次下載檔雖沿用 `2025-2026` URL 檔名，PDF 第 1 頁封面實際為 **Main Catalog V / 2026 / N0.CAT.JIC EN.202608**。
- Dmin 證據：PDF 第 15 頁、印刷頁 15，標題 `Nine9 Spot Drill System`。
- 站內渲染證據：`NC-Spot-Drill-System-2026-p15.png`（140 dpi，從完整官方 PDF 渲染，保留整頁）。
- PNG SHA256：`9d0ff74fc11c99b8592724a85c5446cc95e0c13dbe37e91a2a961c1814d050f6`。

| 型號／型組 | Dmin（mm） |
| --- | --- |
| V9MT0802 | 1 |
| V9MT12T3 | 2 |
| V0820802 / V08212T3 | 2 |
| N9MT05T1 / N9MT0602 | 1 |
| N9MT0802 | 2 |
| N9MT11T3（90°） | 3 |
| N9MT1704 | 3 |
| N9MT2204 / N9MT2506（合併 Dmin 儲存格） | 4 |
| N9MT11T3（100°） | 3 |
| V142 | 2 |

P60 沒有列在該表，不能由其他 60° 刀片外推其 Dmin。WSP 表的 3.3 mm 是整組概述，各螺紋刀片仍應採自己對應的 D1、P、Dmax、Tmax。

此表是補充來源，不能標成使用者 19 頁分冊的內容。表內最高值也不能蓋過分冊的單件細規格（例如 V142 的 Tmax）。

## 全品項的產品邊界

NC Spot Drill 分冊／主型錄 p.28–43 可辨識 15 組普通刀片／刀柄族與 11 個 WSP 刀片規格；加入本檔官方 120° 與 N9MT-142°，為 17 組普通族。相同刀具的公／英制、長柄、螺紋柄、單套及入門包，應列為同一組合的刀柄／包裝選項，不重複建立幾何。

主型錄 p.44–51 明確是 Corner Rounding（RC、R、LA），p.80 明確是 N9MT080201W Engraving（SW）。它們可共用部分 NC Spot Drill 刀柄，但計算模型與網站產品入口獨立，應做相容性轉介而非套用普通點鑽錐面。p.28 將 SW 指到 p.78 是舊頁碼；此份完整主型錄 p.78 實為 V060 Engraving，真正的 N9MT080201W 在 p.80。
