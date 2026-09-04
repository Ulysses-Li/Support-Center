/** Corner Rounding R 型頁面資料：欄位格式請參考 docs/CODE_GUIDE.zh-TW.md。 */
const PRODUCT_PAGE_DATA = {
  "productName": "Corner Rounding_R Type",
  "downloads": [
    {
      "title": "Catalog",
      "image": "",
      "href": ""
    },
    {
      "title": "Cutting Data",
      "image": "",
      "href": ""
    }
  ],
  "programming": {
    "title": "NC Program Generator",
    "desc": "Corner Rounding_R Type technical support area for catalog downloads, cutting data, NC programming support, and knowledge-base FAQ.",
    "href": ""
  },
  "faqs": [
    {
      "topic": "Technical FAQ",
      "question": "`N9MT11T3RC10` 加工 tungsten 的建議條件？",
      "answer": "建議刀片：\n\nN9MT11T3RC10 NC40\n\n建議範圍：\n\nVc = 10-50 m/min\nf  = 0.02-0.05 mm/rev\n\n初始值：\n\nVc = 30 m/min\nS  = 1736 rpm\nf  = 0.03 mm/rev\nF  = 52.08 mm/min\n\n鎢/鎢合金磨耗大，Vc 不宜高，刀具懸出要盡量短以提高剛性。"
    },
    {
      "topic": "Technical FAQ",
      "question": "R1.0 可以一刀完成嗎？",
      "answer": "可以。信件回覆指出 R1.0 基本上可一刀完成加工。  \n但若客戶要求較好的表面品質，建議粗精加工分開，保留 `0.03-0.05 mm` 做精修。"
    },
    {
      "topic": "Technical FAQ",
      "question": "加工 tungsten 時建議懸出長度是多少？",
      "answer": "信件沒有給固定長度，只給原則：\n\n刀具夾持越短剛性越好。\n\nAI 回答時應避免編造固定懸出值。可以建議「盡量縮短懸出，確保不干涉工件與治具」。"
    },
    {
      "topic": "Technical FAQ",
      "question": "`N9MT11T3RC10/RC15-NC9036` 可以加工 molybdenum 嗎？",
      "answer": "歷史信件中，日本客戶使用 `N9MT11T3RC10` 與 `RC15-NC9036` 加工 molybdenum，測試結果良好，但未提供切削數據。  \n因此可以說「有成功測試案例」，但不能保證所有 molybdenum 工況都適用。"
    },
    {
      "topic": "Technical FAQ",
      "question": "`N9MT11T3RC10/RC15` 可以改成 K10F 嗎？",
      "answer": "依 2024-07-26 技術回覆：\n\n目前該款刀片無 K10F 材種。\n\nAI 不可承諾可升級 K10F。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶覺得 K20F 加工 molybdenum 較弱，怎麼回？",
      "answer": "應回覆：\n\n- 目前此款沒有 K10F。\n- 請客戶提供實際磨耗、破損、壽命、加工條件與切削液資訊。\n- 若測試結果已良好，可先確認壽命目標與單件成本，再評估是否需調整切削條件或材種。\n- 大量需求 `500 / 1000 / 2000 pcs` 應交由業務報價處理。"
    },
    {
      "topic": "Technical FAQ",
      "question": "`N9MT11T3RC20` 圖面上 A 尺寸是多少？",
      "answer": "信件沒有直接提供 A 尺寸數值。技術回覆指出：\n\n- `99616-系列` 為單刃加工，刀片有偏置。\n- 客戶可能是要設定程式 offset。\n- 應參考型錄中的 `E` 值。\n\n所以 AI 應先釐清客戶用途。如果是 CNC 程式補正，回答方向是 `E` offset；若是正式圖面尺寸，需提供最新圖面或請工程確認。"
    },
    {
      "topic": "Technical FAQ",
      "question": "`99616-系列` 為什麼要注意 offset？",
      "answer": "因為信件明確指出：\n\n99616-系列的刀具是屬於單刃加工且刀片有偏置。\n\n單刃且刀片偏置時，程式設定不能只看刀桿中心線，需依型錄 `E` 值或正式圖面設定補正。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶反映 RC30 的 R 角變小，可能原因是什麼？",
      "answer": "歷史 QC 案例中，寄回的 `N9MT11T3RC30-NC40` 刀片：\n\n- `E` 尺寸超出公差。\n- 圓心 `X` 值與 `E` 值有相對關係，也超出設定尺寸。\n- 原因推定為治具不夠穩定造成偶發性生產異常。\n\n但不能直接套用到每個新案子。新客訴仍需量測與確認 lot。"
    },
    {
      "topic": "Technical FAQ",
      "question": "RC30 客訴後 Nine9 做了什麼改善？",
      "answer": "改善治具支撐邊：\n\n原支撐邊：2.032 mm\n改善後：3.701 mm\n增加：1.82 倍\n\n目的為增加研磨過程穩定性，降低偶發尺寸異常。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶只說「R 角怪怪的」時，AI 要問什麼？",
      "answer": "應詢問：\n\n- 完整型號與材種。\n- lot number。\n- 異常數量與總購買數量。\n- 是否只有外觀差異，還是加工後尺寸也異常。\n- R 角照片與工件加工結果照片。\n- 是否有量測 `R`、`E`、`X/Z` 等尺寸。\n- 是否能寄回異常品。"
    },
    {
      "topic": "Technical FAQ",
      "question": "`99616-28` 有 STEP 檔嗎？",
      "answer": "有。`LA/99616-28 STEP檔.eml` 的附件為：\n\n99616-28.STEP\n\n信件情境是德國客戶需要 `99616-28` 的 STEP 檔。\n\n---"
    }
  ]
};
