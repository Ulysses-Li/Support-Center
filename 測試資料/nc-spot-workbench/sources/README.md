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
| 6 | 33 | 90° N9MT05T1CT／N9MT0602CT、NC06／NC08 刀柄 |
| 7 | 34 | 90° N9MT0802、NC10 刀柄、個別刀片 4.5／4.7 mm Tmax |
| 9 | 36 | 90° N9MT11T3、NC14 刀柄、wiper／一般刃形差異 |
| 17 | 52 | 刀具組合角度的直徑／深度圖、NC40／NC60 最小 1 mm 避讓、90° 倒角示意、S/F 公式 |
| 18 | 53 | small／standard 組 Vc、每轉進給、牌號適用符號、H 刃條件性 +50% 說明 |
| 19 | 54 | large 組 Vc、每轉進給、牌號適用符號；WSP 表僅閱讀、不納入此版 |

## 讀圖與資料維護原則

- 每轉進給單位是 **mm/rev**，不是 mm/tooth。刀片可轉用的 2／4 刃數不乘入 `F=S×f`。
- `N9MT11T3P60-NC40` 是 p30 的獨立 60° 全研磨刀片，**不是** p36 的 90° `N9MT11T3CT-NC40`。它相容 `00-99616-14-12`（Ø12×100）與 `00-99616-14`（Ø16×100），相同刀柄不代表相同加工角度或切削表。
- P60 型錄料號 `014204`、TiN／P35、L11、S3.97、Re0.8、Dmax5、Tmax3、兩個可轉用刃口。用途文字為 unhardened steel／cast iron，無數值 HRC 上限。本樣板以一般碳鋼、合金鋼、鑄鐵作保守材質候選；未將不鏽鋼等材料自動判為最佳適用。
- p53 的 standard 切削表明列 `N9MT0802 / N9MT11T3CT`，**沒有** `N9MT11T3P60`；不能借用該表的 Vc、f、Best／Suit／Possible 或 `<HRC48` 說明。P60 資料明示 `feedTable:null`、`cuttingPresetAvailable:false`、`manualInput:true`，切削條件需自行輸入並確認。
- 刀片在刀柄中心外有偏移，刃口有 Re、wiper 等造型。型錄 Dmax／Tmax 是規格限制，**不是**可直接推出精準實體刀尖修正量的兩個座標。
- `tipCorrection` 固定為 `null`；不能由 `Dmax/2*cot(α/2)−Tmax` 倒算，再冒充型錄或 ACE 的刀尖 ℓ。
- CT 系列 NC40／NC60 的 spotting 圖有 Minimum 1 mm；倒角圖也要求 1 mm tip clearance。P60 的 p30 規格頁沒有這項最低深度標註，不能僅因牌號同為 NC40 就套入 CT wiper 模型；其 `minSpotDepth` 保持 `null`。幾何模型仍需明確基準。
- 刀柄總長 L 不是可切削深度，也不是實際懸出長度。
- `materialRatings`：3=Best、2=Suit、1=Possible，0/未列=型錄表內未標示；不是材料適用性全域保證。
- H 系列增進給 50% 只保存為 `supportingEdgeFeedFactor:1.5`，未自動施加。
- 相同名稱的 hardened 列在 small／large 表為 `<HRC50`，standard 為 `<HRC56`；NC40 的個別牌號另有 `<HRC48` 說明。不能隱去這些差異。
- 耐熱合金的 spotting 進給為 `–`，資料保存 `null`，不插補或用倒角值代替。
- 60° 系列保留其型錄倒角切削範圍，但第一版只開放 spotting。90° 正面局部直邊倒角使用獨立模型，不涵蓋內角、整孔碰撞或 CAD/CAM 工具包絡。
- 系列下拉以完整刀片族名稱顯示，原 `nc06`／`nc08`／`nc10`／`nc14`／`v09`／`v13` 網址 ID 保留；新增 `p60` 與 CT 系列明確分開。
- 82°、100°、120°、142°、WSP、NC22/25/32 等系列不在此樣板範圍。特別是 120° 只有深度圖的線，沒有這份抽選型錄內的完整匹配表，不能自行補造刀柄／刀片。
