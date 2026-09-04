/** Chamfer Mill 頁面資料：欄位格式請參考 docs/CODE_GUIDE.zh-TW.md。 */
const PRODUCT_PAGE_DATA = {
  "productName": "Chamfer Mill",
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
    "desc": "Chamfer Mill technical support area for catalog downloads, cutting data, NC programming support, and knowledge-base FAQ.",
    "href": ""
  },
  "faqs": [
    {
      "topic": "Technical FAQ",
      "question": "客戶問倒角刀刀片方向要如何管理，應該怎麼回答？",
      "answer": "先確認機台主軸是否能控制定位角度。若可以，就量測刀具裝入主軸後，刀片刃尖相對 X 軸或 Y 軸差幾度，再用主軸定向功能修正，使刀片刃尖對齊 X/Y 軸。若主軸不能改變定位角度，就必須在刀具裝入刀把時控制裝夾角度，讓刀片方向平行 X/Y 軸。"
    },
    {
      "topic": "Technical FAQ",
      "question": "是否有通用程式可以控制刀片方向？",
      "answer": "不應直接提供通用程式，因為主軸定位、角度指定、M-code 或控制器語法與機台品牌、控制器、選配功能有關。正確做法是請客戶提供機台品牌、控制器型號、是否支援主軸定向角度控制，再由客戶或機台商依控制器語法設定。"
    },
    {
      "topic": "Technical FAQ",
      "question": "網站上的 STEP 檔為什麼客戶說不夠？",
      "answer": "網站 STEP 檔通常偏向刀具旋轉外形或簡化模型，適合看外觀與基本干涉。但若客戶要模擬定位、偏移、穿孔、回中心線、實際倒角、離刀、離開孔等完整動作，需要知道刀片座、夾持區、刀片方向與刀桿局部幾何，旋轉模型可能不足。"
    },
    {
      "topic": "Technical FAQ",
      "question": "什麼情況需要非旋轉的 3D STEP？",
      "answer": "當客戶需要進行 cutting simulation、車削相關模擬、軸向進出孔、背面倒角、或需要確認刀片與刀桿在非旋轉狀態下的實際相對位置時，可能需要非旋轉的 3D STEP。"
    },
    {
      "topic": "Technical FAQ",
      "question": "刀桿與刀片是否要做在同一個 STEP 檔？",
      "answer": "依 2020 年德國客戶案例，客戶要求一個 holder 檔案、一個 insert 檔案，分開提供。分開檔案可讓客戶在 CAD/CAM 中自行組裝、定義刀片方向、設定夾持區與避碰關係。若客戶明確要求分件，應盡量分件提供。"
    },
    {
      "topic": "Technical FAQ",
      "question": "可否提供完整刀片設計細節？",
      "answer": "不建議。可提供足以做 cutting simulation 的外形、安裝位置與基本幾何，但不應提供完整斷屑槽、特殊後逃料曲面、防呆設計與其他產品設計細節。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶問能不能提供更詳細 STEP 檔，要先問什麼？",
      "answer": "應先問：\n\n- 需要哪個品號。\n- 需要 holder、insert，還是組合件。\n- 是否需要分開檔案。\n- 用途是 cutting simulation、碰撞檢查、CAM 刀具庫建置，還是產品設計。\n- 使用的 CAD/CAM 軟體名稱與版本。\n- 現有檔案無法使用的具體原因，例如無法匯入、無法辨識刀片座、無法設定 orientation、或缺少夾持區。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶說「STEP 檔只能看到刀具旋轉」，該怎麼回覆？",
      "answer": "可以回覆：目前一般 STEP 可能以旋轉模型呈現，對一般外形參考可用；但若要做完整刀具路徑與碰撞模擬，尤其需要定位、偏移、穿孔、回中心線與離刀動作，可能需要非旋轉模型與刀片/刀桿分件資料。我們可評估提供 simulation 用模型，但模型不會包含 chip breaker 或非必要設計細節。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶要求確認刀具路徑並避免碰撞，單靠 STEP 檔可以保證嗎？",
      "answer": "不能保證。STEP 檔只提供幾何參考，實際碰撞風險還取決於：\n\n- 機台運動限制。\n- 主軸定向功能。\n- 刀具裝夾長度。\n- 刀把與夾持系統。\n- 工件幾何與夾治具。\n- CAM 軟體設定。\n- 加工程式與進退刀路徑。\n\n因此回覆時要避免承諾「一定不會碰撞」，應說明 STEP 檔可協助模擬與確認，但最終仍需由客戶在其機台/CAM 環境中驗證。"
    },
    {
      "topic": "Technical FAQ",
      "question": "CT 系列刀片的 3D 模型為什麼可能不完全真實？",
      "answer": "信件中提到，CT 系列刀片後逃料曲面屬於變異曲面，難以建立完全真實的 3D 模型；此外排屑槽等設計細節也可能因保護產品設計而不提供。只要刀片切刃邊緣曲線符合實際切削狀況，且可裝在刀桿模型上，通常可接受作為 cutting simulation 用模型。"
    },
    {
      "topic": "Technical FAQ",
      "question": "銑削模擬與車削模擬對 3D 模型需求是否不同？",
      "answer": "是。信件中提到，通常銑削模擬只需要旋轉圖面即可；車削模擬或需要刀片方向、刀片座、夾持區的應用，才更可能需要非旋轉 3D STEP。實際仍需依客戶 CAM 軟體與模擬目的確認。"
    },
    {
      "topic": "Technical FAQ",
      "question": "DWG 檔與 STEP 檔各自用途是什麼？",
      "answer": "依案例，客戶可能收到 DWG 或 STEP。一般可理解為：\n\n- DWG：可提供 2D 輪廓、尺寸參考，或讓 CAM 系統取輪廓建立簡化模型。\n- STEP：提供 3D 幾何給 CAD/CAM 匯入與模擬。\n\n若客戶需要軸向進出孔與碰撞模擬，通常 STEP 比 DWG 更直接；但若只是取輪廓或建立刀具庫，DWG 可能有用。"
    }
  ]
};
