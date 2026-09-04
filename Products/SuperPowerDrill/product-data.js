/** Super Power Drill 頁面資料：欄位格式請參考 docs/CODE_GUIDE.zh-TW.md。 */
const PRODUCT_PAGE_DATA = {
  "productName": "Super Power Drill",
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
    "desc": "Super Power Drill technical support area for catalog downloads, cutting data, NC programming support, and knowledge-base FAQ.",
    "href": ""
  },
  "faqs": [
    {
      "topic": "Technical FAQ",
      "question": "SPD 可以保證孔徑公差嗎？",
      "answer": "不建議承諾小公差。SPD 有中心刀片導引，孔精度通常比 Super Drill 好，但它仍是捨棄式刀片刀具，孔尺寸會受刀片公差、長徑比、機台剛性、冷卻、刀柄與工件狀態影響。內部信件建議 SPD 與 Super Drill 的加工孔公差均以 `±0.2 mm` 看待。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶要求 φ32 +0.03/-0 或類似小公差，可以直接答應嗎？",
      "answer": "不可以直接答應。應回覆 SPD 不是鉸刀、搪刀或精孔保證刀具。如需此類精度，建議鑽孔後安排精加工，或以試切驗證實際結果。"
    },
    {
      "topic": "Technical FAQ",
      "question": "SPD 可以用來擴孔嗎？",
      "answer": "不建議。SPD 需要中心刀片作為定位導引。如果工件已有孔，中心刀片可能沒有材料可導引，容易失去穩定性。信件中明確回覆「超倍比不適合為做擴孔的加工刀具」。"
    },
    {
      "topic": "Technical FAQ",
      "question": "「前端開始 3 mm 降低進給 50%」怎麼解釋？",
      "answer": "從中心刀片刃尖接觸工件開始的前 3 mm，f 值降低 50%。當外刀片完整嚙合後，可以回到 100% 進給率。"
    },
    {
      "topic": "Technical FAQ",
      "question": "如果工件有兩個凸起面或肋件，要怎麼加工？",
      "answer": "每次刀具接觸新的工件面都要降低 f 值。案例中兩端凸起的兩翼型肋件，第一個接觸面要降 f；貫穿後接觸第二個面時也要再次降 f。"
    },
    {
      "topic": "Technical FAQ",
      "question": "雙向鑽孔可以嗎？",
      "answer": "可以評估，但要特別注意兩側中心位置。若工件很長並從兩側鑽到中間貫穿，建議先加工導引中心孔，並確認機台、夾持、旋轉中心與刀具中心是否對正。"
    },
    {
      "topic": "Technical FAQ",
      "question": "99307-32300 的中心導引孔建議多少？",
      "answer": "信件案例中，99307-32300 的中心刃為 99307-CD8，建議加工導引孔尺寸 7 mm。"
    },
    {
      "topic": "Technical FAQ",
      "question": "99307 訂製最大可以做到多少？",
      "answer": "目前信件資料整理如下：最大加工直徑 D max 50 mm、最大加工深 T max 450 mm、最大刀長 L1 max 490 mm。小直徑的長徑比限制為 12D 以下。"
    },
    {
      "topic": "Technical FAQ",
      "question": "φ45、L=450 可以訂製嗎？",
      "answer": "信件中日本客戶詢問 φ45、L=450 特殊 99307，回覆引用的訂製限制為 D max 50 mm、T max 450 mm、L1 max 490 mm，因此從尺寸限制看屬於可討論範圍，但實際仍需出圖、報價、確認刀片搭配與標準規格差異。"
    },
    {
      "topic": "Technical FAQ",
      "question": "316L 不鏽鋼 φ35 深 350 mm 可用什麼初始參數？",
      "answer": "信件建議：Vc 60 m/min、f 0.06 mm/rev、S 545 rpm、F 33 mm/min，約 4 m 更換刀片。此為案例參數，回覆客戶前仍需確認刀具、刀片、冷卻與機台條件。"
    },
    {
      "topic": "Technical FAQ",
      "question": "1.4313+QT780 不鏽鋼，φ32、40 bar 中心出水，99307-32300 可用什麼參數？",
      "answer": "信件建議範圍 Vc 40-100 m/min、f 0.05-0.08 mm/rev；初始值 Vc 80 m/min、S 795 rpm、f 0.06 mm/rev、F 47.7 mm/min。若雙向加工，必須注意中心對正並建議先做導引孔。"
    },
    {
      "topic": "Technical FAQ",
      "question": "FCD500 用 SPD 取代 Big Daishowa，應注意什麼？",
      "answer": "可參考 Vc 40-100 m/min、f 0.06-0.10 mm/rev 的目錄範圍，進入前 3 mm 降低 50% 進給。若客戶已有前加工孔或是要從 φ33 擴到 φ35，則 SPD 不適合當擴孔使用。"
    },
    {
      "topic": "Technical FAQ",
      "question": "不連續切削案例可以直接提供參數嗎？",
      "answer": "不建議直接提供。應先要求完整三視圖與加工前工件狀態圖。局部圖面不足以判斷孔的交錯、斷續量、壁厚、中心偏移與走刀風險。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶問最大 IPR 或最高進給，AI 可以直接推算嗎？",
      "answer": "不應只用公式推最大值。SPD 深孔加工受材料、孔徑、深度、刀片、冷卻壓力、剛性、斷續切削、刀柄與機台限制影響。應先用保守初始條件，進入穩定切削後再逐步調整。"
    },
    {
      "topic": "Technical FAQ",
      "question": "SPD 是否需要 pilot hole？",
      "answer": "標準實體鑽孔時，SPD 依靠中心刀片導引，不一定需要先做導引孔。但特殊情況如雙向長孔、中心對正要求高、工件旋轉或深孔貫穿，信件案例建議先加工導引中心孔。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶想用 SPD 做螺絲導孔可以嗎？",
      "answer": "若螺絲導孔需要嚴格孔徑公差，不能只靠 SPD 承諾。內部信件對 SD/SPD 的孔公差認知為 ±0.2 mm。若後續攻牙、鉸孔或精加工有要求，應確認實際孔徑需求與後加工流程。"
    },
    {
      "topic": "Technical FAQ",
      "question": "SPD 影片資料可以說明什麼？",
      "answer": "信件提到 99307 影片腳本與 3xD to 10xD indexable insert drills、超倍比工件量測影片。AI 可知道這些是行銷或技術展示素材，但若未讀附件，不應捏造影片內容細節。"
    },
    {
      "topic": "Technical FAQ",
      "question": "如果客戶要求孔表面粗糙度或孔精度文件？",
      "answer": "可引用已有孔表面粗糙度量測影片或資料，但信件中對孔精度的回覆重點是：SPD 雖比 Super Drill 好，仍不適合制定更小孔徑公差。若客戶要正式數據，應提供實測報告或安排試切，不要憑空給公差表。"
    }
  ]
};
