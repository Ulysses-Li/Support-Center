/** MCC 螺紋銑刀頁面資料：欄位格式請參考 docs/CODE_GUIDE.zh-TW.md。 */
const PRODUCT_PAGE_DATA = {
  "productName": "MCC Thread Mill",
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
    "desc": "MCC Thread Mill technical support area for catalog downloads, cutting data, NC programming support, and knowledge-base FAQ.",
    "href": "../../NCProgram/ThreadMilling/index.html"
  },
  "faqs": [
    {
      "topic": "Technical FAQ",
      "question": "MCC Mill / 99626 是做什麼的？",
      "answer": "它是 Nine9 的可換刀片式毛邊輪 / deburring mill 系統。依刀桿與刀片組合，可做正面倒角、背倒角、上下倒角、去毛邊、內外銑牙，以及 PT / G 管牙相關加工。"
    },
    {
      "topic": "Technical FAQ",
      "question": "MCC Mill 可以銑牙嗎？",
      "answer": "可以。資料夾內有 M6、M12、M16、M18、PT、G 管牙等銑牙案例與程式資料。但是否可加工要看螺紋規格、內外牙、pitch、深度、材料、硬度、控制器與刀片範圍。"
    },
    {
      "topic": "Technical FAQ",
      "question": "M16 x P2.0 / M12 x P1.75 深度 32 mm 可以加工嗎？",
      "answer": "信件中 Nine9 建議使用 `99626-CR10-08-069 + R06010-10010-32`，但此刀具最大加工深度為 `30 mm`。若客戶要求 `32 mm`，信件明確指出會有加工干涉問題，需重新評估。"
    },
    {
      "topic": "Technical FAQ",
      "question": "Pitch 1.5 外牙可用 R06010-08510-32 嗎？",
      "answer": "要小心。信件指出相同 pitch 時外牙加工深度需要比較深，Pitch 1.5 外牙可能超過 `R06010-08510-32` 的加工範圍；若要使用，建議改用 `R06010-10010-32`。"
    },
    {
      "topic": "Technical FAQ",
      "question": "MCC Mill 可以加工 HRC60 的 SKD11 嗎？",
      "answer": "信件中 `SKD11 HRC60~62` 被判定超過建議值 `HRC50`。因此不應直接推薦標準 MCC Mill 加工 HRC60~62，需改刀具或由技術部重新評估。"
    },
    {
      "topic": "Technical FAQ",
      "question": "PT 內牙與外牙是否要不同刀片？",
      "answer": "信件指出 PT 牙的內外牙型一樣，所以 MCC 銑牙刀片內外牙都可以使用。但仍要確認牙規、TPI、刀片外徑與加工深度。"
    },
    {
      "topic": "Technical FAQ",
      "question": "PT1/4-19 應選 14TPI 還是 19TPI？",
      "answer": "應選正確的 19TPI 規格。信件指出用 14TPI、D10 mm 加工 PT1/4-19 時牙峰太尖，栓規不到標準深度；使用 D9.5 mm、19TPI 時牙峰有小弧平面，栓規剛好切齊基準。"
    },
    {
      "topic": "Technical FAQ",
      "question": "為什麼 Heidenhain 會出現刀具半徑太大？",
      "answer": "Heidenhain Cycle 262 可能檢查刀具半徑是否小於「螺紋公稱直徑 - pitch」。若刀片 D2 或實測半徑接近限制，控制器可能報錯。處理方向包含確認 CAM / 控制器參數、量測公差、刀片 D2 單向公差與刀具強度，不建議單純把刀徑大幅縮小。"
    },
    {
      "topic": "Technical FAQ",
      "question": "90 度毛邊輪刀片箭頭處是平面還是 R？",
      "answer": "信件回覆：客人詢問的位置是直線的，尺寸請參考附件毛邊輪目錄資料。若要精確寬度或幾何尺寸，需查 `MCC Mill_0709_rev.pdf`。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客製 MCC 刀片可以接單嗎？",
      "answer": "目前信件顯示客製特殊刀片尚未完全開放。Nine9 需先完成美國特殊 MCC 刀片後，再決定是否接其他特殊尺寸。回覆客戶時應先要求完整應用資料與圖面，再交技術部評估，不要直接承諾可製作。"
    },
    {
      "topic": "Technical FAQ",
      "question": "CR06 是正式標準品嗎？",
      "answer": "信件把 CR06 與 CR05~CR07 放在「新品醞釀中」，用途是解決 M8 背倒角原刀片刀刃長度不足。除非有正式型錄或料號確認，AI 應稱為新增規格規劃或開發中資料。"
    },
    {
      "topic": "Technical FAQ",
      "question": "99626 毛邊輪是否有設計變更？",
      "answer": "有。信件提到倒角尺寸與逃料問題，Nine9 會修正廠內產品並與竣貿做更換處理。若客戶遇到倒角尺寸或逃料異常，要確認是否為設計變更前後版本。"
    },
    {
      "topic": "Technical FAQ",
      "question": "可以直接提供 G-code 給客戶嗎？",
      "answer": "可以協助，但不能不問條件就提供。至少要確認控制器、刀具完整料號、材料、硬度、牙規、內外牙、加工深度、孔或外徑尺寸、加工方向與是否陣列。現有附件有範例程式，可作模板但需按機台改寫與試跑。"
    },
    {
      "topic": "Technical FAQ",
      "question": "MCC Mill 的 STEP 檔在哪些組合有？",
      "answer": "信件附件列出：\n\n- `99626-CR10-08-070+R06010-10010.STEP`\n- `99626-CR10-08-070+R06010-08510.STEP`\n- `99626-CR07-06-052+R06007-06810.STEP`\n- `99626-CR05-05-043+R06005-05010.STEP`\n- `99626-CR05-05-043+R06005-05006.STEP`\n\n需要干涉檢查、CAM 或 3D 模擬時，優先使用 STEP 檔。"
    }
  ]
};
