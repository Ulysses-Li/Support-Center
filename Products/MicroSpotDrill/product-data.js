/** Micro Spot Drill 頁面資料：欄位格式請參考 docs/CODE_GUIDE.zh-TW.md。 */
const PRODUCT_PAGE_DATA = {
  "productName": "Micro Spot Drill",
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
    "desc": "Micro Spot Drill technical support area for catalog downloads, cutting data, NC programming support, and knowledge-base FAQ.",
    "href": ""
  },
  "faqs": [
    {
      "topic": "Technical FAQ",
      "question": "X060 是什麼產品？",
      "answer": "X060 在資料中是 Nine9 的微型刻字 / engraving 用工具，也可支援微小點鑽、細溝、小倒角等精細加工。它的特色是高速主軸、小進給、小下刀深度、多段加工。"
    },
    {
      "topic": "Technical FAQ",
      "question": "X060A90W020R 的最大加工深度是多少？",
      "answer": "附件切削資料標示 `X060A90W020R (Tmax.: 1.0mm)`。但實際下刀要依材料使用表格中的多段深度，不應直接一次下到 1.0 mm。"
    },
    {
      "topic": "Technical FAQ",
      "question": "X060A90W020R 建議轉速是多少？",
      "answer": "切削資料中此系列表格標示 `S = 8000-40000 rpm`。實際轉速仍需依加工直徑、機台最高轉速、刀具伸出、材料與振動狀況調整。"
    },
    {
      "topic": "Technical FAQ",
      "question": "X060A90W020R 的進給很小，這正常嗎？",
      "answer": "正常。表格的 `f` 是 `mm/rev`，範圍約 0.002-0.020 mm/rev，屬於微細刻字 / 微型點加工用條件。若套用一般鑽頭或倒角刀的進給，容易崩刃、毛邊、震刀或折損。"
    },
    {
      "topic": "Technical FAQ",
      "question": "加工鋁、銅、黃銅時用什麼刀片材質？",
      "answer": "X060A90W020R 表格建議非鐵金屬、銅、黃銅使用 `XP9001`，進給 `0.002-0.020 mm/rev`，多段下刀建議為 `0.40 / 0.30 / 0.20 / 0.10 / 0.05 / finishing 0.03 mm`。"
    },
    {
      "topic": "Technical FAQ",
      "question": "加工硬化鋼可以嗎？",
      "answer": "X060A90W020R 表格列出 `Hardened steel up to 56 HRC`，建議 `NC2035`，進給 `0.002-0.006 mm/rev`，分段下刀 `0.20 / 0.10 / 0.05 / 0.05 / 0.03 / finishing 0.02 mm`。硬材加工必須保守，並確認機台剛性與刀具伸出。"
    },
    {
      "topic": "Technical FAQ",
      "question": "不鏽鋼建議怎麼開？",
      "answer": "X060A90W020R 對不鏽鋼建議 `NC2032`，進給 `0.002-0.010 mm/rev`，分段下刀 `0.20 / 0.10 / 0.10 / 0.05 / 0.05 / finishing 0.03 mm`。若出現積屑、毛邊或震刀，應降低切深、檢查冷卻與刀具伸出。"
    },
    {
      "topic": "Technical FAQ",
      "question": "為什麼表格有 1st、2nd、3rd、4th、5th~、Finishing？",
      "answer": "這表示建議多次分層加工，不是單刀完成。微細刀具通常需要逐步下刀，最後用 finishing depth 做精加工，以降低崩刃與振動。"
    },
    {
      "topic": "Technical FAQ",
      "question": "X060A90W010R 和 X060A90W020R 差在哪？",
      "answer": "本資料夾可確認兩者都有圖面附件，但信件與切削資料明確補充的是 `X060A90W020R` 下刀深度。兩者的實際幾何差異、尺寸與圖號需開 PDF 圖面核對，AI 不應未核對就回答具體尺寸差異。"
    },
    {
      "topic": "Technical FAQ",
      "question": "圖面在哪裡？",
      "answer": "圖面在 `X060A90W010R-X060A90W020R圖面.eml` 的附件內，包含 `99401-D69.pdf`、`99401-I80.pdf`、`99616-IC10-12F.pdf`。信件文字說明附件是 `X060A90W010R / X060A90W020R / 99616-IC10-12F` 圖面。"
    },
    {
      "topic": "Technical FAQ",
      "question": "可以拿 X060 做刻字嗎？",
      "answer": "可以。資料夾中的影片信件明確稱為 `X060刻字刀影片參考`，並指出 YouTube 影片 3:39 到 4:00 有 X060 刻字刀加工。"
    },
    {
      "topic": "Technical FAQ",
      "question": "切削條件可以直接給客戶嗎？",
      "answer": "可以作為初始建議，但要加上條件限制。正式提供時應說明資料來源、材料、刀片材質、轉速範圍、進給、分段下刀，並提醒依機台剛性、夾持、伸出量、冷卻、實際加工聲音與切屑狀態微調。"
    },
    {
      "topic": "Technical FAQ",
      "question": "如何算主軸轉速？",
      "answer": "NC Spot Drill 資料中明確說明：主軸轉速應依點鑽、倒角、溝加工的最大直徑計算。常用公式是 `RPM = 1000 x Vc / (pi x D)`，其中 `D` 使用實際最大加工直徑。X060 表格直接提供 8000-40000 rpm 的範圍。"
    },
    {
      "topic": "Technical FAQ",
      "question": "刀片不在刀桿中心是異常嗎？",
      "answer": "NC Spot Drill 資料註記「因技術結構原因，刀片不在刀桿中心」。若客戶看到刀片位置非中心，不能直接判定為瑕疵，需依該系列圖面與結構說明確認。"
    },
    {
      "topic": "Technical FAQ",
      "question": "支撐刃有什麼作用？",
      "answer": "資料註記有支撐刃的刀片可增加 50% 進給率。這是針對有支撐刃設計的刀片，不代表所有 X060 或所有刀片都可自動加 50%。"
    },
    {
      "topic": "Technical FAQ",
      "question": "AI 回答時最容易犯的錯是什麼？",
      "answer": "- 把 `X060A90W020R` 的資料套到 `X060A90W010R`。\n- 把 `Tmax 1.0mm` 解讀成每刀都能下 1.0 mm。\n- 把 `mm/rev` 看成 `mm/min`。\n- 混淆 X060 engraving、NC Spot Drill、WSP Spotting 三組不同資料。\n- 未開圖面就回答柄徑、總長、角度細節或螺絲規格。"
    }
  ]
};
