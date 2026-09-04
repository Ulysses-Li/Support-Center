/** Ergo ER 刀桿頁面資料：欄位格式請參考 docs/CODE_GUIDE.zh-TW.md。 */
const PRODUCT_PAGE_DATA = {
  "productName": "Ergo ER Taper-Shank Cutter",
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
    "desc": "Ergo ER Taper-Shank Cutter technical support area for catalog downloads, cutting data, NC programming support, and knowledge-base FAQ.",
    "href": ""
  },
  "faqs": [
    {
      "topic": "Technical FAQ",
      "question": "ERgo 是什麼？",
      "answer": "ERgo 是 Nine9 針對 ER 夾頭設備開發的刀具系統，可讓走心車床、車銑複合機、動力刀塔與專用機更容易導入可轉位刀具。主要訴求是剛性、重現性、快速換刀、降低校刀時間，以及在有限空間內使用較有效率的刀具尺寸。"
    },
    {
      "topic": "Technical FAQ",
      "question": "ERgo 適合哪些設備？",
      "answer": "信件中明確提到：\n\n- 走心車床。\n- 車銑複合機。\n- 動力刀塔。\n- 專用機。\n- 使用 ER 夾頭的設備。\n- Tornos、Star、凸輪機相關量產應用。"
    },
    {
      "topic": "Technical FAQ",
      "question": "ERgo 的主要客戶痛點是什麼？",
      "answer": "- 小徑刀具壽命差。\n- 校刀耗時。\n- 量產配刀後不易更換，導入窗口短。\n- 傳統小徑碳化鎢車刀或中心鑽在特定倒角應用中效率或壽命不佳。\n- 終端客戶要求 cycle time、刀具壽命與加工穩定性。"
    },
    {
      "topic": "Technical FAQ",
      "question": "ERgo 是否可以免校刀？",
      "answer": "行銷文案可說「快速更換刀片，降低校刀需求」或「優秀的重現性」。但技術回答不應保證所有情況完全免校刀。實際重現性會受刀桿、刀片批次、鎖固扭力、ER holder、機台與量測方式影響。"
    },
    {
      "topic": "Technical FAQ",
      "question": "為什麼客戶量到切削直徑大於名目值？",
      "answer": "可能原因包括：\n\n- 刀片尺寸公差。\n- 刀片鎖上刀桿後尺寸略放大。\n- 小徑刀桿因刃尖提高造成尺寸變化更明顯。\n- 刀片 R 角與刀尖幾何差異。\n- 量測方式與基準不同。\n\n信件附件中提到，銑刀類刀具設定公差曾以 `-0.1 mm` 討論，但實際允收仍應以最新圖面/QC 文件為準。"
    },
    {
      "topic": "Technical FAQ",
      "question": "A9GT060205H 的 R0.5 為什麼量起來可差到 0.1 mm？",
      "answer": "因為 R 角公差是 `0.5 ± 0.05 mm`。如果客戶用直徑方式觀察，半徑兩側加總後可能呈現約 `0.10 mm` 的差異。"
    },
    {
      "topic": "Technical FAQ",
      "question": "ERgo 的 Run-out 是多少？",
      "answer": "信件附件回覆中提到 `99816-**A06` 系列刀桿 Run-out 為 `0.02 mm`。但回答客戶時要先確認量測位置與條件，因為切削刃 Run-out 不等同於 ER 錐度本身的 ISO15488 AT3 精度。"
    },
    {
      "topic": "Technical FAQ",
      "question": "ISO15488 AT3 是否能代表切削刃 Run-out？",
      "answer": "不能完全代表。ISO15488 AT3 可描述 ER 錐度介面精度，但終端客戶通常關心裝上刀片後的切削刃 Run-out。切削刃 Run-out 還受 holder、主軸、刀桿、刀片座、刀片、鎖固扭力與量測方法影響。"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶問 Run-out 時，AI 應追問什麼？",
      "answer": "至少追問：\n\n- 使用哪個 ERgo 型號與刀片？\n- 使用哪種 holder、螺帽、筒夾或 ER 座？\n- 量測位置是刀尖、頭部、根部圓柱，還是檢測棒 L 長度？\n- 使用 Zoller、雷射、百分表或其他設備？\n- 是否固定同一角度重複量測？\n- 鎖固扭力是多少？"
    },
    {
      "topic": "Technical FAQ",
      "question": "99816 是否需要改設計？",
      "answer": "根據 2020-09-02 測試討論，`99811` 與 `99816` 系列維持原樣，不做任何變更。但這是當時信件結論；若有後續設變，應以最新設變通知為準。"
    },
    {
      "topic": "Technical FAQ",
      "question": "99820/99825 為什麼需要測試？",
      "answer": "信件提到 99820/99825 若新設計可能影響拉緊力，需安排：\n\n- 靜態測試：鎖放後量測刀尖 X/Z 變化，判斷刀桿是否歪斜。\n- 動態測試：不同扭力鎖固後上機切削，觀察切削能力、加工面與磨耗。\n- 壓點耐磨耗測試：PIN 與中心孔接觸點小、壓力大，需確認磨耗是否造成歪斜。"
    },
    {
      "topic": "Technical FAQ",
      "question": "鎖放 1000 次測試要注意什麼？",
      "answer": "不能只做形式上的量測。需注意：\n\n- 圓棒量測需固定角度，避免偏擺誤差。\n- 平面端面用投影量測可能對焦不清。\n- 螺牙間隙會造成鎖緊漂移，因此某些 X/Z 點位意義有限。\n- 需同時規劃靜態與動態測試，不能只看尺寸表。"
    },
    {
      "topic": "Technical FAQ",
      "question": "99820 圖面要用哪一版？",
      "answer": "2023-03-30 信件明確說「前張圖面作廢，請以此份為準」，因此 `99820-Mxx-1.pdf` 優先於前一張 `99820-Mxx.pdf`。正式使用仍應確認公司圖面版次管理系統。"
    },
    {
      "topic": "Technical FAQ",
      "question": "ERgo 搪刀頭能否支援美國標準英制搪刀？",
      "answer": "信件顯示美國市場需要英制孔徑，常見為：\n\n- `0.1875\"` / `3/16\"`\n- `0.25\"` / `1/4\"`\n- `0.3125\"` / `5/16\"`\n\n若只提供公制孔徑，會增加美國市場推廣難度。應確認相應圖面是否已提供英制內孔版本。"
    },
    {
      "topic": "Technical FAQ",
      "question": "Tornos 走心機倒角應用如何推薦？",
      "answer": "以信件案例：\n\n- 材料：硼鋼，熱處理 `HRC 32-34`。\n- `15°` 倒角，允許 `12°-18°`：建議 `V9MT0802CT NC2071` 訂製特殊角度刀桿。\n- `45°` 倒角，允許 `42°-48°`：建議 `99816-IC10BH + I9MT1003CT090 NC2057`。\n- 加工方式建議工件旋轉或刀具旋轉，且直進直出。"
    },
    {
      "topic": "Technical FAQ",
      "question": "為什麼 ERgo 在 Tornos 配刀階段重要？",
      "answer": "走心機量產通常由 Tornos 應用工程師在機台出貨前完成配刀、cycle time 與驗收。一旦客戶量產後，刀具不容易更換。若 Nine9 能在 Tornos 配刀階段被納入，就比後續再推廣更有效。"
    },
    {
      "topic": "Technical FAQ",
      "question": "ERgo 是否可做客製刀？",
      "answer": "信件中有多個客製或特殊圖面案例：\n\n- 特殊角度倒角刀桿 `C230036`。\n- 特殊成型刀 `C230037`。\n- 英制內孔搪刀頭。\n- 延長接桿。\n- 刀長設定器。\n\n因此可判斷 ERgo 系統可支援一定程度客製，但正式可行性需由設計/技術部確認。"
    },
    {
      "topic": "Technical FAQ",
      "question": "AI 回答 ERgo 問題時有哪些禁忌？",
      "answer": "- 不要把舊圖當最新版。\n- 不要把 `ISO15488 AT3` 直接等同於切削刃 Run-out。\n- 不要保證完全免校刀。\n- 不要忽略刀片批次、公差、R 角與量測方式。\n- 不要外流 Tornos 或客戶圖紙資訊。\n- 不要用信件中的暫定測試討論取代正式圖面與 QC 文件。"
    }
  ]
};
