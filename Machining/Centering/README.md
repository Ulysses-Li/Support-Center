# i-Center 中心孔設定

正式入口：`/Machining/Centering/index.html`。Products by Application 與 Cutting Data 共用此入口。

- `data.json` 集中維護 51 款刀片、同 IC 刀柄及 70 組切削表列資料；來源為本目錄 `sources/04_i-Center_p054-067.pdf`，印刷 p54–67。正式頁不引用樣板或研究資料夾。
- DIN 332 的 A、A+B、R 與 ANSI 60° 分開選型，依原表 pilot d1 精確配對；缺少已確認切削欄的尺寸保持手動輸入。
- 中位數推薦：S 取型錄範圍與選填機台上限交集的中點；f 取原表序列中位數。推薦為本站可調整起點。Vf = S × f，不乘刃數。
- A+B 在型錄 L2 後列出 S × 0.7、f 不變及 Vf × 0.7，主結果顯示初始切削值。
- 程式 Z 由使用者輸入深度換算 Z = −t，基準為實際刀尖對到工件表面 Z0；型錄 L1/L2/L3 不自動作為加工終點。
- 手機底部摘要顯示初始 S、Vf 與手動 Z；全頁共用一份計算狀態。

驗證：`node --test Machining/Centering/tests/*.test.js`。
