/** i-Center 中心鑽頁面資料：欄位格式請參考 docs/CODE_GUIDE.zh-TW.md。 */
const PRODUCT_PAGE_DATA = {
  "productName": "i-Center Center Drill",
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
    "desc": "i-Center Center Drill technical support area for catalog downloads, cutting data, NC programming support, and knowledge-base FAQ.",
    "href": ""
  },
  "faqs": [
    {
      "topic": "Technical FAQ",
      "question": "i-Center 的最大賣點是壽命嗎？",
      "answer": "不是只看壽命。i-Center 的重要價值是可更換刀片後減少重新校刀時間，提升換刀效率與中心高度重複性。壽命會受材料、孔深、冷卻、機台剛性、中心高、懸伸與參數影響。"
    },
    {
      "topic": "Technical FAQ",
      "question": "型錄進給 `f` 是 `mm/min` 還是 `mm/rev`？",
      "answer": "信件中確認 i-Center 型錄加工條件的 `f` 指每轉進給 `mm/rev`。若客戶程式採 `mm/min`，轉速改變時必須同步換算 F 值。"
    },
    {
      "topic": "Technical FAQ",
      "question": "轉速降低 30% 時，進給要不要改？",
      "answer": "如果使用 `mm/rev` 模式，進給值可維持相同，控制器會自動調整每分鐘進給。若使用 `mm/min` 模式，轉速降低時 F 值也要降低，否則每轉切屑變厚。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶說刀片崩刃，第一步要看什麼？",
      "answer": "先確認材料、刀片型號、塗層、孔深、轉速、每轉進給、冷卻、中心高、工件懸伸、機台剛性、刀片照片與崩刃位置。若是 A+B 或多角度刀片，也要確認是切削刃、非切削刃、60/120 度連接處、chisel 或 shoulder 哪個位置受損。"
    },
    {
      "topic": "Technical FAQ",
      "question": "不鏽鋼 17-4 / SUS630 要注意什麼？",
      "answer": "要特別注意冷卻，建議由保守參數開始，例如 `S=1200 rpm`, `f=0.02 mm/rev`。車床刀架使用時，必須校正刀片中心與工件旋轉中心。"
    },
    {
      "topic": "Technical FAQ",
      "question": "標準品倒角直徑不符合客戶 GO/NG 檢具，是否代表不良？",
      "answer": "不一定。需確認客戶檢測基準與 Nine9 製造檢測基準是否一致。若 d2 未定公差，d2 會隨 d1 與角度公差浮動。若客戶要求特定 GO/NG 全數符合，可能需要特殊刀片訂製。"
    },
    {
      "topic": "Technical FAQ",
      "question": "i-Center 檢測片表面有研磨紋是否可拋光？",
      "answer": "檢測片由研磨製程生產，測棒部分沒有拋光程序，且因結構關係無法拋光。可嘗試改善研磨製程讓紋路更細，但不能承諾拋光。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶要求一把刀同時中心鑽、倒角、面銑，可以做嗎？",
      "answer": "需謹慎。若面銑直徑大、前端細，阻力可能造成前端扭斷。墨西哥案例中，面銑直徑 31 mm 被判斷不建議一次成型，建議中心鑽與面銑分開處理。"
    },
    {
      "topic": "Technical FAQ",
      "question": "i-Center Ergo 可以做 ER25 特殊柄嗎？",
      "answer": "目前信件回覆為 i-Center Ergo 不開放特殊訂製。若客戶使用 ER25，應先確認標準 IC10 刀桿柄徑 12 mm 是否可由 ER25 筒夾夾持。"
    },
    {
      "topic": "Technical FAQ",
      "question": "車床上 i-Center 對不準中心怎麼排查？",
      "answer": "先確認刀桿中心高、刀片厚度、刀體厚度、X0.0 位置、機台中心校正、刀片與工件旋轉中心是否一致。IC12-L2525 案例中，快速檢測值為 `25 - 1.27 = 23.73 mm`。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶問低碳鋼 7000 孔是否保證？",
      "answer": "不可直接保證。可以說網站或資料曾提及低碳鋼案例，但刀具壽命取決於實際材料、機台、冷卻、中心高、參數、孔深與工件狀態。若需判斷，請客戶提供完整加工條件與磨耗照片。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶要求改善 A64 壽命，要怎麼回？",
      "answer": "應要求用後刀片與照片，分析實際磨耗/干涉位置。A64/A65 案例顯示，客戶認為第三離隙可能干涉，但 Nine9 研判主因在最大刃口下方非切削刃位置。改善需以圖面調整、修磨樣品與測試驗證進行。"
    }
  ]
};
