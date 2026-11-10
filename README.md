# Nine9 Support Center

Nine9 產品技術支援中心的靜態網站原始碼。網站提供產品分類、CAD 下載入口、切削資料、產品影片、技術 FAQ，以及螺紋銑削 NC 程式產生器。

## 本機預覽

此網站會透過 `fetch()` 載入共用頁首與頁尾，因此不要直接用檔案總管開啟 HTML。請在專案根目錄執行：

```powershell
node tools/static-server.js
```

再依終端機顯示的網址開啟網站。NC Program 也可單獨執行；測試會同時檢查螺紋銑削與螺旋鑽孔：

```powershell
cd NCProgram
npm test
npm run dev
```

## 維護入口

- 首頁：`index.html`
- 產品總覽：`nine9/products.html`
- 切削資料產品選擇：`CuttingData/index.html`；ACE 互動計算器：`CuttingData/AceSpotDrill/index.html`
- 加工分類：`Machining/`
- 產品內容資料：`Products/<產品名稱>/product-data.js`
- 可持續新增的型錄 JSON 資料庫：[`data/catalog/README.md`](data/catalog/README.md)；主檔為 `data/catalog/nine9-catalog-2025-2026.json`
- 共用產品頁渲染：`js/render/product-resource-template-V1.0.js`
- 全站共用圖片：`assets/images/`；瀏覽器圖示則直接放在專案根目錄
- NC Program 首頁與產生器（包含 Thread Milling V2.0 雙視圖模擬器）：`NCProgram/`
- 完整架構與程式說明：[`docs/CODE_GUIDE.zh-TW.md`](docs/CODE_GUIDE.zh-TW.md)

## 版本檔案注意事項

ACE Cutting Data 的正式計算器獨立放在 `CuttingData/AceSpotDrill/`，包含點鑽／倒角剖面與補正計算；正式頁不引用 `測試資料/`。型錄幾何集中在該目錄的 `chamfer-geometry.js`，切削速度與進給預設仍共用正式產品資料。可用以下指令驗證點鑽與倒角幾何：

```powershell
node --test CuttingData/AceSpotDrill/tests/chamfer-geometry.test.js CuttingData/AceSpotDrill/tests/spotting-geometry.test.js
```

檔名含 `V2.0` 的產品版型目前只供 ACE Spot Drill 頁面使用；其他產品仍使用 V1.0。未被正式頁面引用的 `css/no/`、`js/data/no/`、`js/render/no/` 已移至 `等待移除/` 保留。

`NCProgram/Thread_Milling/`、`NCProgram/Thread_Milling_V2/` 與 `NCProgram/NC_Helix/` 是目前首頁使用的正式工具；V2.0 預設英文，與原版螺紋銑削並列。未加底線的舊版 `NCProgram/ThreadMilling/` 已不再使用。

全站頁面（包含 NC Program）只引用根目錄的 `header/` 與 `footer/`；已解除引用的頁首頁尾副本集中保留在 `等待移除/`，方便確認後再清理。
