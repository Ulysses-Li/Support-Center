# 鑽孔分類篩選入口

此目錄僅負責彙整 Super Drill 與 Super Power Drill，將需求與實際料號帶入各自的工具頁。

- `app.js`：分類頁 DOM、表單、卡片及共用 Header／Footer 載入。
- `selector.js`：產品入口、狀態序列化與核心 API 的薄層整合；不存放產品切削規則。
- `styles.css`：分類頁專用樣式，不載入產品頁 CSS。
- `catalog-notes.html`：連往各產品型錄及獨立待確認清單。

## 產品資料來源

| 產品 | 自主管理目錄 | 瀏覽器 API |
| --- | --- | --- |
| Super Drill | `CuttingData/SuperDrill/` | `SuperDrillCore` |
| Super Power Drill | `CuttingData/SuperPowerDrill/` | `SuperPowerDrillCore` |

每個產品的 `core.js` 及 `data/catalog.json`、`data/cutting-data.json` 由本分類頁讀取；產品的 app、圖面與 CSS 不會載入本頁。修改產品規則只需改該產品目錄。根目錄 Header、Footer、背景與品牌圖示繼續全站共用。

## 路由與選擇

分類頁只接收孔徑、上下公差、深度及材料，用 `sdTool`、`spdTool` 保留各系列選擇，進入產品頁時以 `tool` 傳遞實際料號。若深度未填，入口不會以刀體 T 自動補值。沒有符合刀體的系列不顯示。

分類頁不顯示機台、內冷或特殊入口設定，也不讀取、驗證或轉傳舊網址中的這些欄位，避免不可見條件限制結果。呼叫產品核心時使用中性預設（旋轉刀具、一般平面、供液未知），實際工況仍由各產品頁獨立設定及驗證。

分類頁不再以柄徑篩選，舊網址中的 `shank` 也會忽略及移除。柄徑仍顯示在刀體規格中，各產品頁維持自己的夾持核對。

最短尺寸以共同刊載的可鑽深 T 排序，不跨系列比較定義不同的 L／L1。孔徑或需求深度改變時重新預選最短刀體；材料改變時保留手選。完整孔徑與深度下，最短刀體會標為優先推薦；手選較長刀體不冒稱最短。

只有最短可用系列的 `canSelect` 為 true。較長系列、工況阻擋或尚未填齊孔徑／深度時，卡片以 80% 透明度停用，使用原生 disabled 選單與按鈕，且不輸出產品選用網址。型錄連結保留；停用原因由 `selectionNote` 說明。手選同系列較長刀體、舊網址或材料切換皆不會解鎖另一系列。需求深度超出較短系列後，才開放下一個可用系列。

`explainNoMatch` 僅在沒有幾何候選時，從各產品 normalized catalog 的實際料號計算原因：標準名目孔徑缺項、該孔徑最大可鑽深 T、與需求的差距，以及原始料號和印刷頁碼。未填孔徑時會明確說明是全系列最大值，不將其視為每個刀徑都可達到；缺值不補零。鄰近孔徑僅供核對離散標準規格，不會自動變更客戶需求。

## 驗證

`node --test Machining/Drilling/tests/*.test.js`
