/** Super Drill 頁面資料：欄位格式請參考 docs/CODE_GUIDE.zh-TW.md。 */
const PRODUCT_PAGE_DATA = {
  "productName": "Super Drill",
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
    "desc": "Super Drill technical support area for catalog downloads, cutting data, NC programming support, and knowledge-base FAQ.",
    "href": ""
  },
  "faqs": [
    {
      "topic": "Technical FAQ",
      "question": "Super Drill 可以加工盲孔嗎？",
      "answer": "可以，但必須確認孔底形狀是否符合零件功能需求。Super Drill 可用於鑽孔，但加工盲孔時孔底不是完全平底。"
    },
    {
      "topic": "Technical FAQ",
      "question": "`99313-11 + N9GX04T002-NC2032` 加工後孔底會是平的嗎？",
      "answer": "不是完全平底。客戶若只看型錄示意圖，可能會覺得接近平底，但實際孔底應以原廠提供的 `99313-11` 底面 profile 圖、CAD 或試切結果確認。"
    },
    {
      "topic": "Technical FAQ",
      "question": "本案例是否已確認孔底 gap 小於 `1.0 mm`？",
      "answer": "信件正文沒有寫出這個保證。技術部只回覆「底面如附件，請參考附件」。因此不能只根據信件文字回答「一定小於 1.0 mm」。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶要求 gap 小於 `1.0 mm` 時，應如何處理？",
      "answer": "應提供 `99313-11-20220527.pdf` 的孔底形狀圖給客戶確認。若客戶需要正式保證，應請原廠提供標註尺寸的 2D 圖或安排試切量測。"
    },
    {
      "topic": "Technical FAQ",
      "question": "Super Drill 是否需要中心鑽或預鑽？",
      "answer": "官方資料說明 Super Drill 可在斜面等條件下鑽孔，某些應用可不預鑽。但實務上仍需依工件形狀、剛性、機台、夾持與精度要求判斷。"
    },
    {
      "topic": "Technical FAQ",
      "question": "超過 1xD 是否需要內冷？",
      "answer": "是。官方頁面明確提到超過 1xD 需要 coolant supply。對 3xD 或 4xD 深孔加工，內冷與排屑尤其重要。"
    },
    {
      "topic": "Technical FAQ",
      "question": "`N9GX04T002-NC2032` 適合哪些材料？",
      "answer": "官方資料列出適用 P / M / K / S 材料群。NC2032 為 AlTiN 塗層、K20F 等級，常見應用包含碳鋼、合金鋼、鑄鐵、不鏽鋼與硬度到 HRC50 左右的淬硬鋼類應用。實際切削條件仍需依材料與孔深調整。"
    },
    {
      "topic": "Technical FAQ",
      "question": "99313-11 的直徑與深度是多少？",
      "answer": "`99313-11` 是 Ø11.0 mm 的 3xD Super Drill，T 約 33.0 mm。"
    },
    {
      "topic": "Technical FAQ",
      "question": "同一片刀片可以當內刃與外刃嗎？",
      "answer": "可以。官方資料說明 Super Drill 使用相同刀片作為 outer insert 與 inner insert。"
    },
    {
      "topic": "Technical FAQ",
      "question": "每片刀片有幾個切削刃？",
      "answer": "每片刀片有 4 個切削刃。"
    },
    {
      "topic": "Technical FAQ",
      "question": "如果客戶要孔底平坦，是否推薦 Super Drill 一次完成？",
      "answer": "不推薦直接承諾一次完成平底。若孔底平坦度是關鍵要求，建議 Super Drill 先鑽孔，再用修底刀具完成孔底。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶只要求底部很接近平，該怎麼回答？",
      "answer": "可以說 Super Drill 的孔底輪廓可接近某些客戶認知中的「近似平底」，但應以該直徑刀具的 profile 圖確認。對 `99313-11`，請參考附件 `99313-11-20220527.pdf`。"
    },
    {
      "topic": "Technical FAQ",
      "question": "若 AI 要生成業務回信，應避免哪些說法？",
      "answer": "避免：\n\n- 「Yes, the gap is less than 1.0 mm.」\n- 「It is a flat bottom drill.」\n- 「The blind hole bottom will be flat.」\n- 「No additional operation is needed.」\n\n建議：\n\n- 「Please refer to the attached bottom profile.」\n- 「The Super Drill does not generate a perfectly flat bottom.」\n- 「If the gap requirement is critical, please confirm by drawing or test cut.」\n\n---"
    }
  ]
};
