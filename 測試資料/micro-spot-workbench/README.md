# Micro Spot Drill 互動樣板

本機檢視 `/測試資料/micro-spot-workbench/index.html`，可按 **Load example** 查看不鏽鋼／90°／D0.5 的示範設定。本樣板未發布，正式頁不引用本資料夾。

## 資料與互動

- 唯一產品資料讀自 `../micro-spot-plan/research-data.json`，型錄連結使用研究資料夾的站內 PDF；正式化時應一起整理至正式產品資料。
- 材料、角度、D、牌號／實際供貨 SKU 逐組配對。切換後保留有效輸入，失效的刀片／XL 刀柄清除並顯示原因，不靜默換材料或修改 D。
- 依使用者最新要求，介面移除硬度輸入與未知硬度造成的操作阻擋（`requireHardnessConfirmation:false`）。舊網址的 hardness 參數不再套用；原始型錄牌號資料仍保存，不將未檢查硬度寫成已驗證適用。
- 轉速直接採型錄 S 範圍 8,000–40,000 rpm，與使用者填寫的機台上限取交集；f 依材料及刀片獨立查表，Vf=S×f，不乘兩個可轉位刃口。
- 手動設定、範例起點與範圍中點分別標示。D 每次調整 0.001 mm、f 每次 0.001 mm/rev、S 每次 100 rpm，保留更細手動輸入。
- 依使用者新增 Z 需求，提供名義短平底模型 `t=(D−Wmin)/(2tan(α/2))，Z=−t`，假設短平底刀尖對到工件表面 Z0、刀軸垂直局部平面；Re 未重建，不能稱原廠已驗證 Z 公式。
- 實測模式為同組裝單點校正：`t=tref+(D−Dref)/(2tan(α/2))`。換刀片、角度或刀柄會清除 Dref／tref，轉位或重新對刀時也應重設參考。
- 型錄選刀端點仍保留；零深、超 Tmax 或無效參考不提供有效 Z。120°／D2.53 的名義估算約0.70148大於型錄Tmax0.7，僅列模型差異並要求實測，不夾限成0.7冒充有效值。
- XL（L100）只對確認為鋁／鋁合金開放；保留原註記 `unbalanced <0.6gm`，不擅改單位。
- 手機底部固定列同步顯示 S、Vf、Z（包含名義／實測基準）；Z 無效時顯示 —，不保留舊值。
- 同一份 DOM 適用桌面與手機；欄位錯誤及結果狀態具備 ARIA，圖有 title／desc，所有動態字串先跳脫。

## 深連結

可帶 `material/angle/diameter/variant/holder/rpm/feedPerRev/machineMaxRpm/nonFerrousType/geometryMode/referenceDiameter/referenceDepth`。`variant` 是訂購碼；亦可帶 `insert` 型號及 `grade` 牌號。Spotting 材料別名只做名稱映射，未知值會顯示無法套用的欄位，不替換成預設材料。

## 驗證

`node --test 測試資料/micro-spot-workbench/tests/*.test.js`

核心測試涵蓋名義端點、材料／牌號交集、硬度、XL、機台速度範圍與每轉進給；圖測試涵蓋四種幾何、端點及跳脫。瀏覽器另驗證條件切換、錯誤清除、複製、深連結、手機與本地資源。
