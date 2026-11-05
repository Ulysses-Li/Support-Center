# NC Spot Drill 型錄證據

- 檔案：`NC-Spot-Drill-2025-2026-ENG.pdf`。
- 來源：使用者下載並提供的 `C:/Users/Louis/Downloads/NC_Spot_Drill_2025-2026_ENG.pdf`，本機完整複製，未重排或改寫。
- SHA256：`EF41440CA6DFBCE802CCD7AACBFAFEB99247C3ED72C80EDE7B4AC7B7E0B3FB1F`。
- 核對日期：2026-11-05；版次依檔名為 2025–2026 ENG，不能把核對日期當成型錄版本。
- 使用者型錄共 19 頁，是主型錄抽選頁，頁碼不是連續的主型錄頁碼。

| PDF 頁碼 | 印刷頁碼 | 本樣板使用內容 |
| --- | --- | --- |
| 3 | 30 | 60° N9MT11T3P60-NC40、014204、兩種相容刀柄、Dmax 5／Tmax 3；本頁只有規格與用途，沒有切削預設 |
| 4 | 31 | 60° V9MT0802CT／V9MT12T3CT、V09／V13 刀柄、Dmax／Tmax、牌號 |
| 5 | 32 | 82° V0820802／V08212T3、3/8 與 5/8 英制刀柄、各自 Dmax／Tmax |
| 6 | 33 | 90° N9MT05T1CT／N9MT0602CT、NC06／NC08 刀柄 |
| 7 | 34 | 90° N9MT0802、NC10 刀柄、個別刀片 4.5／4.7 mm Tmax |
| 8 | 35 | N9MT0802 的兩種單套與四種入門包，映射原刀柄／刀片，未重複建立幾何 |
| 9 | 36 | 90° N9MT11T3、NC14 刀柄、wiper／一般刃形差異 |
| 10 | 37 | N9MT11T3 的四種單套與四種入門包，保留公／英制柄對應 |
| 11 | 38 | 90° N9MT1704CT，NC2071／NC5071／NC9036，兩種公制刀柄 |
| 12 | 39 | 90° 三角形 N9MT220408CT-NC40（3 個可轉用刃），以及 N9MT2506CT-NC2033／XP9000，公／英制刀柄 |
| 13 | 40 | 100° N9MT11T3CT2T-H 三牌號與專用 00-99616-20-100，Dmax16／Tmax6.2 |
| 14 | 41 | 142° V1420803／V1421604，採逐件表 Dmax15／30、Tmax2.5／5，不以標題32或柄徑代替 |
| 15–16 | 42–43 | WSP 雙角度結構；由獨立 WSP 資料／模型管理，不混進普通錐面 series |
| 17 | 52 | 刀具組合角度的直徑／深度圖、NC40／NC60 最小 1 mm 避讓、90° 倒角示意、S/F 公式 |
| 18 | 53 | small／standard 組 Vc、每轉進給、牌號適用符號、H 刃條件性 +50% 說明 |
| 19 | 54 | large 組 Vc、每轉進給、牌號適用符號；WSP 表僅閱讀、不納入此版 |

## 讀圖與資料維護原則

- 每轉進給單位是 **mm/rev**，不是 mm/tooth。刀片可轉用的 2／4 刃數不乘入 `F=S×f`。
- `N9MT11T3P60-NC40` 是 p30 的獨立 60° 全研磨刀片，**不是** p36 的 90° `N9MT11T3CT-NC40`。它相容 `00-99616-14-12`（Ø12×100）與 `00-99616-14`（Ø16×100），相同刀柄不代表相同加工角度或切削表。
- P60 型錄料號 `014204`、TiN／P35、L11、S3.97、Re0.8、Dmax5、Tmax3、兩個可轉用刃口。用途文字為 unhardened steel／cast iron，無數值 HRC 上限。本樣板以一般碳鋼、合金鋼、鑄鐵作保守材質候選；未將不鏽鋼等材料自動判為最佳適用。
- p53 的 standard 切削表明列 `N9MT0802 / N9MT11T3CT`，沒有 P60 專屬表頭。2026-11-05 使用者確認 **P60 由 N9MT11T3CT 改製**，因此以同牌號 NC40 的表格作參考起始值，記錄 `cuttingReference.basis:user-confirmed-parent`、母型號與確認日期；不是將改製關係冒稱為 PDF 原文。
- P60 用途與 CT-NC40 矩陣的交集是 `carbonLow/carbonHigh/lowAlloy/castIron`，才自動帶入 Vc／f 中間值。例如低碳鋼 Vc150–320、f0.05–0.10，預設235／0.075。高合金鋼的 CT-NC40 欄未標示，P60 用途仍保留但切削值手動輸入。不鏽鋼等也不因通用表有資料就擴大 P60 用途。Best／Suit／Possible、`<HRC48`、CT 最低深度不隨參考值繼承。
- 官網 `60nc-spot-drill.html` 的 Cutting Data 連至 `cutting-formula.htm?related_pc=2`，`NC_Spot_Drill2.jpg` 也以 CT 為表頭。畫面及複製內容明示 CT 參考起始值，連至站內 PDF 第18頁；P60 規格仍連到第3頁。
- 刀片在刀柄中心外有偏移，刃口有 Re、wiper 等造型。型錄 Dmax／Tmax 是規格限制，**不是**可直接推出精準實體刀尖修正量的兩個座標。
- `tipCorrection` 固定為 `null`；不能由 `Dmax/2*cot(α/2)−Tmax` 倒算，再冒充型錄或 ACE 的刀尖 ℓ。
- CT 系列 NC40／NC60 的 spotting 圖有 Minimum 1 mm；倒角圖也要求 1 mm tip clearance。P60 的 p30 規格頁沒有這項最低深度標註，不能僅因牌號同為 NC40 就套入 CT wiper 模型；其 `minSpotDepth` 保持 `null`。幾何模型仍需明確基準。
- 刀柄總長 L 不是可切削深度，也不是實際懸出長度。
- `materialRatings`：3=Best、2=Suit、1=Possible，0/未列=型錄表內未標示；不是材料適用性全域保證。
- H 系列增進給 50% 只保存為 `supportingEdgeFeedFactor:1.5`，未自動施加。
- 相同名稱的 hardened 列在 small／large 表為 `<HRC50`，standard 為 `<HRC56`；NC40 的個別牌號另有 `<HRC48` 說明。不能隱去這些差異。
- 耐熱合金的 spotting 進給為 `–`，資料保存 `null`，不插補或用倒角值代替。
- 型錄明列倒角用途的普通型 60°／82°／90° 組合可做 spotting／chamfering。100°／120°／N9MT-142° 組合另以目前官方詳細頁明列的 spotting／chamfering 用途補充。P60 只開放已由該頁確定的 spotting；V1420803／1604 只做 spotting。倒角皆是局部名義／實測基準模型，不涵蓋內角、整孔碰撞或 CAD/CAM 工具包絡。
- 系列下拉以完整刀片族名稱顯示，原 `nc06`／`nc08`／`nc10`／`nc14`／`v09`／`v13` 網址 ID 保留；新規格用獨立 ID，不能僅以相同刀柄或相同刀片名稱合併不同組裝角度。
- large 組牌號矩陣另核對 NC9036（與 NC9076 同欄）、NC40、NC2033、XP9000。矩陣空白與用途文字明列材質分開：例如 N9MT2506-XP9000 的鈦材用途出自 p39，p54 沒有為鈦材畫 Best 符號；不得自行補符號。
- 2026-11-05 以高解析度圖再次核對 p54：NC2071 的耐熱合金是 ○ Possible，NC5071 的淬硬鋼也是 ○ Possible，均記 1，沒有誤記為 ◎ Suit。

## 普通型完整覆蓋與補充來源

普通型 `series` 共 **17 個刀片／刀柄族、48 個刀片組裝選項、36 個刀柄選項**。同一實際刀片可出現在 90°／100°／120°／142° 不同組合，因此 48 是組裝選項數，不是互不重複的刀片料號數。另有 `catalogPackages` 的 **14 個單套／入門包料號**，每個明確連回 `familyId`、`insertId`、`holderPart`。單套未推定未標示的總刀片數；入門包依型錄記 6 片。

`catalogCoverage` 按印刷頁盤點每個族、包裝、overview、WSP 與幾何／切削表，供全範圍驗收使用。p28–29 的 RC／SW 等是另章產品引用，不以普通 NC Spot Drill 錐面模型代替；完整主型錄 RC/R/LA 為 p44–51、N9MT080201W Engraving 為 p80，與本工具分開。

### 120° 與 N9MT-142° 組合

- 來源檔：本站 `NC-Spot-Drill-Legacy.pdf`，PDF 第 13 頁、印刷頁 **1-13**。這些規格不是使用者 19 頁抽選分冊的第 13 頁。
- 原始官方 PDF：`https://nine9.jic-tools.com.tw/upload_files/products/pdf/Nine9_NC_Spot_Drill.pdf`；SHA256 為 `1659AFE62E9C9923D7992F277E0AC25361BB07731D4248FACAB28676AD8B40D1`。
- 目前官方詳細頁：`https://nine9.jic-tools.com.tw/100nc-spot-drill.html`，2026-11-05 核對仍列出 100°／120°／142° 及三種 H 牌號。
- `nc120`：`00-99616-20-120`／`00-99616-3/4-120`，Dmax17、Tmax4.76；`nc142`：`00-99616-20-142`／`00-99616-3/4-142`，Dmax18.5、Tmax3.16。兩者長度100，3/4 in 柄徑換算19.05 mm；英制 Dmax/Tmax 原值是四捨五入近似，不當作更精準的公制測量。
- 舊 PDF 只列 H-NC40／H-NC9076；H-NC5071 有目前官方頁的明確佐證，資料以 `gradeSourceNote` 分開，不冒稱舊 PDF 已有三牌號。
- 100° 的 Tmax 仍採使用者 p40 的 **6.2**，未用舊 PDF／網站的6.3覆蓋。V1420803／V1421604 與 N9MT CT2T-142 是兩個不同產品組合。
- 規格的 `sourcePdf`、`sourcePage`、`pdfPage` 指向舊 PDF；切削的 `cuttingSourcePdf`、`cuttingSourcePage`、`cuttingPdfPage` 仍指向使用者分冊 p53/PDF18 的 N9MT11T3CT/H 進給表，避免跨檔誤導頁碼。

### Dmin 最小加工直徑

- `NC-Spot-Drill-System-2026-p15.png` 是完整官方主型錄 PDF 第15頁整頁渲染；封面實際版次 **2026 / N0.CAT.JIC EN.202608**，不是依 URL 中 2025-2026 字樣猜測版次。PNG SHA256：`9D0FF74FC11C99B8592724A85C5446CC95E0C13DBE37E91A2A961C1814D050F6`。
- 由該表核對：V9MT0802＝1；V9MT12T3＝2；兩種 V082＝2；N9MT05T1／0602＝1；N9MT0802＝2；N9MT11T3-90°＝3；N9MT1704＝3；N9MT2204／2506 合併格＝4；N9MT11T3-100°＝3；兩種 V142＝2，單位均為 mm。
- P60 的 Dmin2、100°／120°／N9MT-142° 群組 Dmin3 另由目前官方 Application System `https://nine9.jic-tools.com.tw/nc-spot-drill.htm` 核對。P60、120°、N9MT-142° 的 `minDiameterSource` 保持 `null`、另記 `minDiameterSourceUrl` 與核對日期，不能假稱出自上面的 p15 圖。
- 官網 P60 Dmax6.2 與使用者單件表 Dmax5不同，本工具仍採較小的 **5**；Dmin2 明記官網來源。所有 Dmax/Tmax 均以選定單件細表為準，Dmin overview不覆蓋細規格。
- WSP 的 overview Dmin3.3 不能套給每種刀片；WSP 必須採自己的 D1/P/Dmax/Tmax 獨立模型。

其他來源比對記錄見 `legacy-notes.md`。本檔只維護普通型資料；WSP 的數據、公式與測試另由其模組管理。
