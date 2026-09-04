/** NC Spot Drill 頁面資料：欄位格式請參考 docs/CODE_GUIDE.zh-TW.md。 */
const PRODUCT_PAGE_DATA = {
  "productName": "NC Spot Drill",
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
    "desc": "NC Spot Drill technical support area for catalog downloads, cutting data, NC programming support, and knowledge-base FAQ.",
    "href": ""
  },
  "faqs": [
    {
      "topic": "Technical FAQ",
      "question": "為什麼加工角度不是理想角度，例如 100° 實測成 99.5°？",
      "answer": "NC Spot Drill 的刀片在刀桿上有 offset、前傾與幾何偏位。刀片單一刃口稜線旋轉後形成的是曲線，加工面可能是曲面，所以不同量測位置會有不同角度。評估時要看完整量測報告，不可只用單點角度判定異常。"
    },
    {
      "topic": "Technical FAQ",
      "question": "刀片從非刃口側破裂，常見原因是什麼？",
      "answer": "常見原因是每轉進給過快、接近滿刀、排屑不良、工件懸空或剛性不足，造成非刃口側擠壓碰撞。先降低 `f mm/rev`，確認夾持剛性與懸出長度。"
    },
    {
      "topic": "Technical FAQ",
      "question": "刀桿刀片座磨損、刀片脫落，應該檢查什麼？",
      "answer": "先檢查螺絲是否用 `2.0 Nm` 扭力鎖緊，螺絲是否使用超過約 10 次，刀片是否磨耗造成切削阻力上升，刀具是否懸出過長或震刀。"
    },
    {
      "topic": "Technical FAQ",
      "question": "99616-10 可以做 350 mm 長刀桿嗎？",
      "answer": "不可以。350 mm 長度超出可承受長徑比，刀具會無法正常使用，目前標準品與特殊訂製都沒有合適方案。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶要求 `φ7 mm` 柄可以做嗎？",
      "answer": "目前沒有 `φ7 mm` 治具，只能訂製 `φ6 mm` 柄。若是 ER11 夾持需求，因 `φ7 mm` 已是 ER11 最大夾持徑，應確認客戶設備；可考慮 ERgo11 系列刀桿。"
    },
    {
      "topic": "Technical FAQ",
      "question": "NC10 刀片 horning 看起來不一致，是否異常？",
      "answer": "`N9MT11T3CT-NC10` 內排屑槽為模具成型，外框研磨後因胚料尺寸與模具收縮公差，刃口線寬可能不同。若前製程 horning 未完全磨除，較容易產生毛邊。改善方向是改以研磨位置 H 尺寸控管，確保前製程 horning 被去除形成較銳利刃口。"
    },
    {
      "topic": "Technical FAQ",
      "question": "NC10 加工產生毛邊怎麼處理？",
      "answer": "先確認 horning、刃口研磨線與材料。若客戶毛邊敏感，可測試改良製程刀片，或評估 `N9MT11T3CT2T-H-NC40` 是否適合該應用；但若是端面車溝，`2T-H` 可能干涉，不建議直接替代。"
    },
    {
      "topic": "Technical FAQ",
      "question": "深 V 槽可以用 NC Spot Drill 一次做到完成嗎？",
      "answer": "不建議直接視為一次完成。深槽應分刀，必要時用較大刀具粗加工、小刀具精修。但分刀會有接刀痕，若底部 R 或表面要求高，精修建議用全鎢成型銑刀。"
    },
    {
      "topic": "Technical FAQ",
      "question": "99616-09V 刀桿破裂是產品問題嗎？",
      "answer": "不一定。信件案例判斷，刀桿長時間承受較大扭轉切削力，可能在刀片座與底面交界形成剪力破壞。建議降低切削參數，或較大加工改用 `99616-13V`。"
    },
    {
      "topic": "Technical FAQ",
      "question": "142° 刀桿邊緣擦傷代表刀桿干涉嗎？",
      "answer": "不一定。ZOLLER 檢測案例顯示正常加工深度 `T=2.2 mm` 時不會干涉。擦傷更可能是刀片磨損或受損後，刀體才開始摩擦工件。"
    },
    {
      "topic": "Technical FAQ",
      "question": "3D STEP 檔可以用於精準刀片幾何嗎？",
      "answer": "提供的 3D STEP 主要供 CAD/CAM cutting simulation 使用。刀片排屑槽與 CT 系列複雜後逃料曲面可能不完整呈現；若客戶需要模擬，建議提供刀桿與刀片分開檔案，並詢問 CAD/CAM 軟體名稱與版本。"
    },
    {
      "topic": "Technical FAQ",
      "question": "左轉 120° NC Spotting 可以用兩刃口刀片嗎？",
      "answer": "不可以。兩刃口刀片不能做左轉 NC Spotting，左轉刀桿需改用四刃口刀片。"
    },
    {
      "topic": "Technical FAQ",
      "question": "90° 刻字用 `N9MT1704CT`，刀尖幾何如何描述？",
      "answer": "`99616-22 + N9MT1704CT` 加工底徑線寬約 `1.2 mm`。若客戶用於 engraving，應提供實際 tip geometry 圖面或附件資料。"
    },
    {
      "topic": "Technical FAQ",
      "question": "303 不鏽鋼 V 槽要求銳利邊，可否不用毛邊輪？",
      "answer": "可以視需求不使用。若客戶要求邊緣盡可能銳利，毛邊輪可能反而破壞銳利邊；是否去毛邊由客戶成品要求決定。\n\n---"
    }
  ]
};
