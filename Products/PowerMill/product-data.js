/** Power Mill 頁面資料：欄位格式請參考 docs/CODE_GUIDE.zh-TW.md。 */
const PRODUCT_PAGE_DATA = {
  "productName": "Power Mill",
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
    "desc": "Power Mill technical support area for catalog downloads, cutting data, NC programming support, and knowledge-base FAQ.",
    "href": ""
  },
  "faqs": [
    {
      "topic": "Technical FAQ",
      "question": "Power Mill / ERgo Power Mill 是什麼？",
      "answer": "A：它是 Nine9 ERgo 系統中用於小徑銑削的工具組合，常搭配 `99816` 系列 holder 與 `A9GT0602` 系列刀片使用。信件情境多集中在自動車床、小空間加工、切削直徑與 run-out 精度要求高的應用。"
    },
    {
      "topic": "Technical FAQ",
      "question": "ER16 Power Mill 為什麼在 STAR SB-20R-typeG 會有問題？",
      "answer": "A：信件中指出，現行 ER16 Power Mill 的 `M19` 螺帽外徑約 `Ø25mm`，加上當時 holder stroke length `14.5mm`，在部分工件上會因螺帽外徑與長度不足造成干涉或加工受限。"
    },
    {
      "topic": "Technical FAQ",
      "question": "日本代理希望改善哪些尺寸？",
      "answer": "A：希望將 ER16 Power Mill 納入新的標準尺寸：螺帽外徑改為 `Ø22mm`，holder stroke length 從 `14.5mm` 增加至 `18.5~20mm`。這是代理提出的需求，不能當作已量產標準品回答。"
    },
    {
      "topic": "Technical FAQ",
      "question": "`A9GT060201 / A9GT060202` 的 Re 公差是多少？",
      "answer": "A：信件中回覆為 `±0.02mm`。"
    },
    {
      "topic": "Technical FAQ",
      "question": "`A9GT060205 / A9GT060210` 的 Re 公差是多少？",
      "answer": "A：信件中回覆為 `±0.05mm`。"
    },
    {
      "topic": "Technical FAQ",
      "question": "同一刀座更換刀片的公差是多少？",
      "answer": "A：信件中回覆為 `±0.02mm`。但這是同一刀座上更換刀片的公差，不等同於整組 mounted cutting diameter 或 run-out 的所有規格。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶量到 `99816-12A06 + A9GT0602 05H-NC2033` 超過 `Ø12`，怎麼回？",
      "answer": "A：先不要直接判定不良。應確認客戶量測的是 cutting diameter、run-out 還是刀片 R；並要求 holder 型號、insert 型號、批號、量測設備、鎖付方式、量測位置與是否同一刀片重複裝拆。信件中日本代理量測結果約 `Ø12.007~Ø12.018mm`，他們質疑是否應為負公差。需依圖面與 mounted assembly 公差判定。"
    },
    {
      "topic": "Technical FAQ",
      "question": "ERgo 的 run-out 可以只用 ISO15488 AT3 回覆嗎？",
      "answer": "A：不建議。`ISO15488 AT3` 是 taper grade / 錐度等級概念，客戶實際關心的是 cutting edge assembled runout。應分開說明 taper 精度與組裝後刀刃偏擺，並說明影響因素。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶量到 cutting edge runout 約 `0.020mm`，是否正常？",
      "answer": "A：不能單靠信件判定。信件中代理認為 `0.020mm` 對切削刀具不算好，但也承認此值高度受 holder taper runout、筒夾、螺帽、鎖付、刀片座面、刀片幾何影響。回覆時應要求完整量測條件與照片，再做判斷。"
    },
    {
      "topic": "Technical FAQ",
      "question": "刀片側邊磨耗是否正常？",
      "answer": "A：若每次加工切深相同，最大磨耗點會出現在切深位置，這可以是正常磨耗型態。若出現 chipping、破裂或單刃受損，需檢查刀片是否磨耗後續用、是否鎖緊、是否振動、切削條件是否過重。"
    },
    {
      "topic": "Technical FAQ",
      "question": "發生側邊 chipping 有哪些改善方向？",
      "answer": "A：信件中建議可調整為 `Vc=120 m/min` 或 `f=0.03 mm/tooth`。同時要檢查刀片鎖付、工件夾持、刀具伸出、切削液、是否使用已磨耗刀片繼續加工。"
    },
    {
      "topic": "Technical FAQ",
      "question": "`01H / 02H` 適合什麼場合？",
      "answer": "A：刃口 R 較尖銳，適合工件有直角要求或需要輕切削的場合。"
    },
    {
      "topic": "Technical FAQ",
      "question": "`05H / 10H` 適合什麼場合？",
      "answer": "A：刃口 R 較大，通常可用較高進給，屬於一般加工使用。若 `05H` 能用，`10H` 多數情況也可用，但仍需依工件圖面與干涉判斷。"
    },
    {
      "topic": "Technical FAQ",
      "question": "`A9MT060205` 適合什麼場合？",
      "answer": "A：`A9MT060205` 是 M 級刀片，honing 較大，適合高速加工，多用於粗加工或中胚加工。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶問 R1.0 是否適合時怎麼答？",
      "answer": "A：不能只看 R 值回答。需確認工件圖面、角落要求、切深、干涉、表面粗糙度與是否需要清角。若沒有圖面，只能說信件中提到 `05H` 可用的場合 `10H` 多數也能使用，但仍需圖面確認。"
    },
    {
      "topic": "Technical FAQ",
      "question": "CK50 / S50C HRC24 可用什麼切削參數？",
      "answer": "A：信件中針對 CK50/S50C、HRC24 建議 `NC2032`，參數範圍為 `Vc=80~150 m/min`、`f=0.04~0.08 mm/rev`，初始建議 `Vc=100 m/min`、`S=2195 rpm`、`f=0.06 mm/rev`、`F=131.7 mm/min`。但需確認刀具、刀徑與加工方式後再套用。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶要求標準品新增尺寸時，AI 應怎麼處理？",
      "answer": "A：先整理需求與原因，不要承諾開發或交期。可回覆：「代理希望新增 `Ø22mm` 螺帽與 `18.5~20mm` stroke，以降低 STAR SB-20R-typeG 上的干涉風險。此需求需由產品/研發確認是否納入標準品。」"
    }
  ]
};
