# Nine9 通用型錄資料庫

主檔為 `nine9-catalog-2025-2026.json`，UTF-8、純 JSON，可由網站、Python、Node.js 或後續 AI 工作直接讀取。格式定義為 `nine9-catalog.schema.json`。目前沒有接到正式網站的載入流程。

來源是使用者提供的 **Nine9 Main Catalog V 2025–2026**，166 頁。`sources` 保存原檔名、版次、SHA-256 與原始位置；JSON 自身可獨立使用，不需要桌面上的 PDF 路徑才能讀取。

## 已收錄內容

| 欄位 | 內容 |
| --- | --- |
| `categories` | 12 個加工／配件分類 |
| `product_families` | 28 個產品家族、108 個子系列；中文名稱為整理譯名 |
| `items` | 223 筆正規化型號，含料號、訂購碼、牌號、塗層、規格與單位 |
| `cutting_data` | 534 筆：ACE 336 筆、NC Helix 198 筆 |
| `tables` | 264 張擷取表格，保留原始列與實體合併儲存格 |
| `identifier_index` | 1,091 個料號／代碼／牌號定位索引 |
| `technical_notes` | 30 頁技術參考文字 |
| `pages` | 全部 166 頁的可見文字與排版文字 |
| `site_resources` | 本專案產品頁對照，與型錄來源分開 |
| `quality_issues` | 具體頁碼與待核對問題 |
| `templates` | 新產品、型號、切削資料、來源、規格及來源註記的空白範本 |

`items` 已完成 ACE 刀片／刀桿、NC Helix 刀片／刀桿、部分 NineBore 刀桿／轉接座及延長桿的欄位整理。其他系列的資料保留在 `tables`、`pages` 與 `identifier_index`，可繼續補成型號記錄。其他產品的切削資料也先保留在原表；目前尚未全部正規化。

## 讀取與查詢

在專案根目錄執行，僅需 Node.js，無須安裝套件：

```powershell
node tools/catalog-db.js stats
node tools/catalog-db.js validate
node tools/catalog-db.js search "00-99321-016-2030"
node tools/catalog-db.js search "i-Center"
node tools/catalog-db.js template item
```

`search` 每種類別最多顯示 20 筆摘要，`total` 是實際符合筆數。`validate` 檢查唯一 ID、來源頁碼、外鍵、規格值與數值範圍；完整型別約束可交由 JSON Schema 編輯器／驗證器檢查。

Node.js 讀取範例：

```javascript
const fs = require('node:fs');
const db = JSON.parse(fs.readFileSync('data/catalog/nine9-catalog-2025-2026.json', 'utf8'));
const tool = db.items.find(x => x.part_number === '00-99321-016-2030');
const specs = Object.fromEntries(tool.attributes.map(x => [x.key, x.value]));
console.log(tool.order_code, specs, tool.source_refs);
```

Python 讀取時使用 `encoding="utf-8"`。輸出到網頁前仍須跳脫文字，不應直接把原文插入 `innerHTML`。

## 缺值與來源

- 未知文字用 `""`，未知數值／布林值用 `null`，沒有清單內容用 `[]`。不要用 `0` 代替未知數值。
- `attributes` 的每筆規格用固定 `key`、顯示名稱 `label`、值 `value`、單位 `unit` 與原始文字 `raw_value`。不同產品不必硬套相同尺寸欄位。
- `source_refs.pdf_page` 從 1 起算，`printed_page` 保留為文字。`table_id` 可連到原表，沒有可靠表格對應時留空。
- `tables.rows` 是自動擷取結果；其中 `null` 可能是合併格的延續或擷取缺漏，不代表原書沒有資料。`physical_cells` 保留從 1 起算的列／欄位置、跨度與原文字，不能把空格直接用上一列數值填滿。
- `tables.family_ids` 是頁面層級的產品定位；同頁多產品時，不能解讀成該表每列都適用所有家族。
- 所有表格仍標 `needs_review`，其中可能有圖面交疊、分段表頭、缺欄或非文字符號。`source_checked` 只表示該筆已填欄位與來源核對，不代表空白欄位原本不存在。
- 索引的 `text_index_only` 只證明字串出現在型錄，可能包含通配型號或訂製示例，不代表可購買標準品／庫存。
- PDF 隱藏在頁外的對頁內容已排除；圖面與特殊字型未執行 OCR。數學分數線、圖示評等與圖片不能只靠文字判讀。

ACE 第 23 頁 SI16／倒角／鑄鐵／60° 的進給原印 `0.10 ~ 0.03`，保留於 `raw_value`，上下限留 `null` 並標 `needs_review`。NC Helix 的兩系列 Vc 存於 `cutting_speed_by_holder_series`，不是速度上下限；Pitch 三值分別對應主軸功率 <12、12–20、>20 kW。此庫沒有加入直徑插值。

## 後續新增

1. 複製 `templates` 中所需範本，追加至對應陣列。
2. 填入不重複、日後不隨名稱或排序改變的 `id`；參照既有 `family_id`、`category_ids`。新家族先加入 `product_families`。
3. 補上來源；新型錄／官網版次使用新的 `sources.id`，保留舊資料的來源，不直接覆蓋成相同版次。
4. 只填已知資訊，保留 `raw_value` 和單位。額外自訂欄位放在 `extensions`。
5. 更新 `metadata.updated_at`、`database_version` 與適用的 `coverage` 統計，再執行 `validate`。只整理文字／表格而未核對數值時保留 `needs_review`。

本次未混入網站較新版切削圖片、202604 MCC Quick Pick 或郵件 FAQ，避免不同版次資料互相覆蓋。
