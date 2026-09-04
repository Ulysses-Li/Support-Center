/** NC Deburring 頁面資料：欄位格式請參考 docs/CODE_GUIDE.zh-TW.md。 */
const PRODUCT_PAGE_DATA = {
  "productName": "NC Deburring",
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
    "desc": "NC Deburring technical support area for catalog downloads, cutting data, NC programming support, and knowledge-base FAQ.",
    "href": ""
  },
  "faqs": [
    {
      "topic": "Technical FAQ",
      "question": "`07_NC_Deburring` 裡沒有信件，這份知識來源可靠嗎？",
      "answer": "本次檢查時 `07_NC_Deburring` 為空資料夾。知識來源是工作區內其他資料夾與 NC Deburring / Deburring Mill 高度相關的信件。來源清單列於最後，可回溯。"
    },
    {
      "topic": "Technical FAQ",
      "question": "`99616` 和 `99626` 都可以倒角，差別是什麼？",
      "answer": "`99616` 多屬 NC spot drill / 單刃可換刀片系統，搭配 `V9MT`、`N9MT` 進行中心孔、倒角、開槽、刻字等。`99626` 是 Deburring mill / 毛邊輪，較偏上下倒角、去毛邊、毛邊輪示範，也延伸到銑牙 / 管牙應用。實際選型要看孔徑、工件空間、是否要加工背面倒角、刀桿剛性與加工路徑。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶刀片破損，第一個要問什麼？",
      "answer": "先問：\n\n- 刀桿與刀片完整料號。\n- 材料與硬度。\n- 轉速、進給、每轉進給、切深、分刀。\n- 刀具懸出長度。\n- 工件尺寸、是否薄板、夾持方式。\n- 破損照片、刀片座照片、加工影片。\n- 破損發生在第幾刀、是否有異音或振動。"
    },
    {
      "topic": "Technical FAQ",
      "question": "參數在建議範圍內，為什麼還會斷刀？",
      "answer": "信件中多次顯示，參數正常仍可能斷刀。常見原因是懸出太長、板件振動、夾持不足、每轉進給接近上限、切削瞬間負荷大、下倒角過切、非切削刃碰撞。"
    },
    {
      "topic": "Technical FAQ",
      "question": "快削鋼使用 `99616-13V + V9MT12T3CT-NC2071` 破損，如何調？",
      "answer": "信件建議可改為：\n\nS = 7000 rpm\nf = 0.04 mm/rev\n\n理由是高轉速、輕切削可降低加工聲音與振動，相較低轉速重切更穩。仍需確認機台與夾持。"
    },
    {
      "topic": "Technical FAQ",
      "question": "SUS316L 使用 `99616-13V + V9MT12T3CT-NC2071` 的建議？",
      "answer": "信件建議：\n\nS = 1500~3000 rpm\nf = 0.02~0.05 mm/rev\n\n若要決定切深，需先知道目標倒角尺寸、孔徑、預孔與剛性。"
    },
    {
      "topic": "Technical FAQ",
      "question": "Inconel 716 應選 `NC2071` 還是 `NC5071`？",
      "answer": "信件中技術部判斷 `NC2071` 刃口比 `NC5071` 銳利，較適合 Inconel 716 這類耐熱合金。建議：\n\nVc = 10~40 m/min\nf = 0.02~0.06 mm/rev"
    },
    {
      "topic": "Technical FAQ",
      "question": "`N9MT1704CT-NC2071` R 角量到 `1.4 mm`，但客戶以為應該 `1.2 mm`，怎麼回？",
      "answer": "可說明 R 角受刀片刃口尺寸、模具成型公差、Z 軸高度公差影響，可能有浮動。壽命差異可能與刃口 honing 線寬造成切削阻力增加有關。若客戶加工精密，可提供檢測紀錄或安排特定批次測試。"
    },
    {
      "topic": "Technical FAQ",
      "question": "`N9MT05T1CT-NC9076` STEP 檔與實測不同怎麼辦？",
      "answer": "以修正後資料為準：\n\nDmax = 5.5 mm\nTmax = 2.43 mm\n\n並提供 2024-02-20 後修正的 STEP 檔。若客戶用舊 STEP，需更新。"
    },
    {
      "topic": "Technical FAQ",
      "question": "99626 長頸特殊刀桿可以做嗎？",
      "answer": "若是 `99626-CR07` 頸部約 `5 mm`，要求 `L1 >= 50 mm`，徑長比超過 `10D`，信件中技術部不建議製作。原因包含剛性不足、下部倒角可能過切、可能產生二次毛邊。"
    },
    {
      "topic": "Technical FAQ",
      "question": "99626 加工還有毛邊怎麼排查？",
      "answer": "依序檢查：\n\n- 是否加工到正確深度。\n- 刀片是否為正確角度與尺寸。\n- 是否有過切造成二次毛邊。\n- 下倒角是否有足夠逃料。\n- 工件是否振動。\n- 進退刀路徑是否造成刮傷。\n- 是否使用舊版有逃料問題的刀片 / 刀桿。"
    },
    {
      "topic": "Technical FAQ",
      "question": "99626 的 STEP 檔可以提供完整設計嗎？",
      "answer": "不建議提供完整設計細節。信件中原則是提供 cutting simulation 所需資料，例如外輪廓、切刃曲線、螺絲孔、刀片座與裝配位置，不一定提供 chip breaker 或排屑槽完整曲面。"
    },
    {
      "topic": "Technical FAQ",
      "question": "99626 可做銑牙嗎？",
      "answer": "信件中有 `M6P075`、`M18P150`、PT / G 管牙等案例，表示 99626 系列可延伸用於特定銑牙應用。但必須確認牙型、Pitch / TPI、內外牙、刀片外徑、NC 程式，不可直接套用倒角路徑。"
    },
    {
      "topic": "Technical FAQ",
      "question": "PT1/4-19 可以用 14TPI 刀片加工嗎？",
      "answer": "不建議。信件中特別比較 `14TPI` 與 `19TPI` 差異，`PT1/4-19` 應使用對應 `19TPI` 與正確 D 值的刀片 / 程式。錯用會造成牙型或尺寸差異。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶問 55 度 CR05 是否可做，怎麼處理？",
      "answer": "先問應用目的。信件中技術部先回覆：「客人需要 CR05 的 55 度刀片是要應用在哪？」代表 55 度刀片通常需連結到管牙、G / PT 或特定輪廓，不能只以角度判斷可不可做。\n\n---"
    }
  ]
};
