/** W060 頁面資料：欄位格式請參考 docs/CODE_GUIDE.zh-TW.md。 */
const PRODUCT_PAGE_DATA = {
  "productName": "W060",
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
    "desc": "W060 technical support area for catalog downloads, cutting data, NC programming support, and knowledge-base FAQ.",
    "href": ""
  },
  "faqs": [
    {
      "topic": "Technical FAQ",
      "question": "V045 或 V060 可以做特殊刀片，例如 Re=1.0 mm 嗎？",
      "answer": "不建議承諾。信件中明確回覆：`V045/V060` 因刀片與刀桿設計不同，沒有提供訂製特殊刀片。若客戶需要特殊 R 角，可改用 `X060` 做訂製可行性評估。"
    },
    {
      "topic": "Technical FAQ",
      "question": "X060 可以加工深度 2 mm 的特殊 V 槽嗎？",
      "answer": "不一定。信件中的衝擊試驗標準測試棒案例需要 2 mm 深度，Nine9 判斷 X060 計算可加工深度約 1.5 mm，因此不適合。建議用 `99619-V045` 先粗加工，再預留精修給鎢鋼全研磨刀具。"
    },
    {
      "topic": "Technical FAQ",
      "question": "NC2035 是否適合 HRC60？",
      "answer": "`NC2035` 是目前信件中最適合高硬度材料的既有選項，但客戶回報 HRC56 沒問題、HRC60 表現不好。Nine9 回覆目前尚未找到比 NC2035 更好的材質 / 鍍層。HRC60 應視為高風險加工，需保守分刀與實測，不可保證。"
    },
    {
      "topic": "Technical FAQ",
      "question": "HRC54-56 加工 0.3 mm 深，X060A60W020R-NC2035 可怎麼設參數？",
      "answer": "信件建議：`S=10000 rpm`, `f=0.005 mm/rev`, `F=50 mm/min`, 分刀 `Ap=0.15+0.1+0.03+0.02=0.3 mm`。若長懸出或剛性不足，需更保守，例如降低進給或用原參數 * 0.7 起測。"
    },
    {
      "topic": "Technical FAQ",
      "question": "HRC54-56 加工 0.3 mm 深，X060A30W020R-NC2035 可怎麼設參數？",
      "answer": "信件建議：`S=10000 rpm`, `f=0.003 mm/rev`, `F=30 mm/min`, 分刀 `Ap=0.08+0.05+0.03+0.03+0.02+0.02+0.02+0.02+0.02+0.01=0.3 mm`。30 度刀尖較細，硬材與長懸出時容易不穩，需特別保守。"
    },
    {
      "topic": "Technical FAQ",
      "question": "刀片刻 4-5 個字就崩裂，該怎麼問客戶？",
      "answer": "要先問清楚是第一刀就破，還是分刀累加到總深度後才破。若第一刀即破，裝刀、中心高、偏擺、鎖緊或刀片入座問題機率較高；若已完成多次循環後破，則較可能是參數、深度、震動或剛性問題。"
    },
    {
      "topic": "Technical FAQ",
      "question": "長刀桿或長懸出時，鋼柄與鎢鋼柄差異如何？",
      "answer": "信件測試顯示，鎢鋼柄在同長度下略好於鋼柄，但不同刀片差異不同。60 mm 長刀桿最大建議伸出量為 36 mm，也就是 6D。加長刀桿參數可先用原參數 * 0.7 作保守起點。"
    },
    {
      "topic": "Technical FAQ",
      "question": "V04506T1W06-NC2071 加工 SAE4140 深 0.65 mm 有毛邊，是刀片批號問題嗎？",
      "answer": "信件判斷不一定是刀片問題。量測資料顯示加工深度 0.65 mm 距離負角刃口仍有很多距離，刃口尺寸與逃料尺寸也有間隙。應優先檢查螺絲扭力、刀片座變形、刀桿偏擺、深切造成的推擠與摩擦，並改為粗精加工，預留 `0.03 ~ 0.05 mm` 精修。"
    },
    {
      "topic": "Technical FAQ",
      "question": "V045 加工 AISI 304 深 0.4 mm 有毛邊，如何改善？",
      "answer": "信件建議調整分刀為 `0.3 - 0.37 - 0.4 mm`，精修進給 `f=0.01 mm/rev`。原客戶參數為 `RPM=10000`, `f=0.015`, 分刀 `0.25 - 0.3 - 0.4 mm`，最後一刀吃刀 0.1 mm，可能不利於美觀與毛邊控制。"
    },
    {
      "topic": "Technical FAQ",
      "question": "V060T1W03-NC9036 加工鋁 6061-T6 有毛邊，如何改善？",
      "answer": "信件建議 `f=0.007 mm/rev`，精修預留 `0.02 mm`。即使 run-out 為 0，也要檢查刀片刃尖中心高，建議中心高 `0 ± 0.01 mm`。"
    },
    {
      "topic": "Technical FAQ",
      "question": "沒有某尺寸的壽命測試，AI 可以估刀具可加工幾米嗎？",
      "answer": "不應直接編造。信件中 `X060A30R020-NC2032` 加工 S55C 的壽命詢問，Nine9 回覆沒有該尺寸壽命資料，只能提供最接近的試刀記錄作參考。AI 應說明需實測或引用接近案例。"
    },
    {
      "topic": "Technical FAQ",
      "question": "X060A60R010-XP9001 深度 0.87 mm 怎麼分刀？",
      "answer": "信件建議：`0.3 + 0.2 + 0.1 + 0.1 + 0.05 + 0.05 + 0.05 + 0.02 mm`，轉速 `S=8000 ~ 40000 rpm`，進給 `f=0.001 ~ 0.01 mm/rev`。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶說 run-out 接近 0，是否就能排除刀具裝夾問題？",
      "answer": "不能。run-out 只是其中一項。信件中鋁 6061-T6 毛邊案例提醒，即使刀桿 run-out 沒問題，仍需檢查刀片刃尖中心高 `0 ± 0.01 mm`。另外螺絲扭力、刀片座磨耗、刀片入座、刀把與懸出都要確認。"
    },
    {
      "topic": "Technical FAQ",
      "question": "高硬度雕刻時，30 度和 60 度刀片哪個更穩？",
      "answer": "信件未直接做通用規格宣告，但 HRC54-56 / SKD61 測試中提到 `X060A30W020R` 因刀尖細、角度小，在 SKD61 HRC50 以上與懸出 36 mm 情況下較容易破損；`X060A60W020R` 有較完整可行測試資料。回答時可說 30 度更細、更敏感，硬材深刻需更保守。\n\n---"
    }
  ]
};
