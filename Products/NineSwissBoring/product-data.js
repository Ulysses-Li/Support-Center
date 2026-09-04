/** NineSwiss 模組式搪孔刀頁面資料：欄位格式請參考 docs/CODE_GUIDE.zh-TW.md。 */
const PRODUCT_PAGE_DATA = {
  "productName": "NineSwiss Modular Head Boring Tool",
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
    "desc": "NineSwiss Modular Head Boring Tool technical support area for catalog downloads, cutting data, NC programming support, and knowledge-base FAQ.",
    "href": ""
  },
  "faqs": [
    {
      "topic": "Technical FAQ",
      "question": "客戶問 `99121-40.5` 是否有標準品？",
      "answer": "答：\n\n`99121-40.5` 需訂製，尺寸可先參考 `99121-40`。信件中提到 `99121` 系列最大尺寸為 `99121-52`。實際尺寸仍需參考附件圖面或最新型錄。\n\n---"
    },
    {
      "topic": "Technical FAQ",
      "question": "薄壁管件從 `φ20.2` 搪到 `φ21.2`，單邊 `0.5 mm` 可以一次完成嗎？",
      "answer": "答：\n\n不建議一次完成。此案屬薄件加工，單邊 `0.5 mm` 預留量偏大，會不利於最終公差穩定，也增加震刀風險。建議分兩把刀或兩道加工，例如第一把到 `φ20.9 mm`，第二把到 `φ21.2 mm`。\n\n---"
    },
    {
      "topic": "Technical FAQ",
      "question": "`99101-21` 加工薄壁管件 YST590N 的建議參數？",
      "answer": "答：\n\n信件案例建議：\n\n- `S = 600~1000 rpm`\n- `f = 0.05~0.1 mm/rev`\n\n若機台是專用機或油壓進給，需特別注意進刀速度控制。轉速不要太高，以降低薄件震刀風險。\n\n---"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶使用 `99146-34A + CCFT060204-NC2033` 壽命從 180~190 pcs 降到 30~70 pcs，原因可能是什麼？",
      "answer": "答：\n\n信件案例判斷主因是工件焊接後硬度變化。即使加工速度與材料名稱不變，焊接熱影響可能造成局部硬度變化，使刀片壽命大幅下降。\n\n建議方向：\n\n- 改用 `CCGH060204-NC60` 瓷金刀片以提高壽命。\n- 若希望更多刃口，可評估 `N9MT11T308LA` 四刃口刀片。\n- 需確認材料實際硬度、焊接區位置、切削速度、冷卻方式與刀片磨耗型態。\n\n---"
    },
    {
      "topic": "Technical FAQ",
      "question": "`N9MT11T308LA` 可以做到 `Rz < 6.3 μm` 嗎？",
      "answer": "答：\n\n可以用理論面粗度公式先估算，但不能直接保證。信件中使用：\n\nRmax = (fn^2 / (8 * re)) * 1000\nRmax ≒ Rz\n\n以 `N9MT11T308LA` 的 `re = 0.8 mm`：\n\n- `fn = 0.1 mm/rev` 時，`Rmax = 1.5625 μm`\n- `fn = 0.2 mm/rev` 時，`Rmax = 6.25 μm`\n\n因客戶要求 `Rz < 6.3 μm`，建議 `fn` 不要超過 `0.2 mm/rev`。雖然刀片有 Wiper 可改善面粗度，但仍需考慮機台剛性、刀具伸出、材料硬度、夾持與冷卻。\n\n---"
    },
    {
      "topic": "Technical FAQ",
      "question": "C2D0183A 加工 Steel CT35 纏屑嚴重，怎麼改善？",
      "answer": "答：\n\n先確認：\n\n- 刀具：`C2D0183A / C20-146-C30-29.7`\n- 材料：`Steel CT35`\n- 條件：`S = 900 rpm`, `F = 90 mm/min`, `Ae = 0.5 mm`\n- 換算：`f = 90 / 900 = 0.1 mm/rev`\n\n初步建議：\n\n- `Ae = 0.5 mm` 偏大，可分兩刀加工。\n- 單邊預留量可先改為 `0.1~0.15 mm`。\n- 進給可先試 `f = 0.05~0.07 mm/rev`。\n- 需確認刀片型號，因斷屑槽會影響切屑捲曲。\n\n後續測試補充：\n\n- 低碳材料如 `SAE8620` 可能不易斷屑。\n- 測試顯示降低轉速到 `600 rpm` 後，切屑捲曲改善。\n- 在 `S = 600 rpm`, `F = 90 mm/min`，也就是 `f = 0.15 mm/rev` 時，切屑最小捲。\n- 因此實務上可能需朝「降低轉速、適度提高每轉進給」測試。\n\n---"
    },
    {
      "topic": "Technical FAQ",
      "question": "為什麼有時建議降低進給，有時又建議增加每轉進給？",
      "answer": "答：\n\n斷屑與纏屑不是單一規則。切屑形狀受下列因素共同影響：\n\n- 材料延展性\n- 刀片斷屑槽\n- 切寬 `Ae`\n- 每轉進給 `f`\n- 轉速 `S`\n- 切深\n- 冷卻與排屑空間\n\n若切屑太寬太厚，可能要降低 `Ae` 或分刀。若低碳鋼切屑拉長不斷，可能需要降低轉速並提高每轉進給，讓切屑進入斷屑槽有效工作區。AI 回答時應依案例條件說明，不要把某個參數當成固定答案。\n\n---"
    },
    {
      "topic": "Technical FAQ",
      "question": "特殊搪刀詢價需要客戶提供哪些資料？",
      "answer": "答：\n\n至少需要：\n\n- 目標孔徑\n- 完成孔尺寸與公差\n- 前孔尺寸與公差\n- 加工深度\n- 刀具總長或有效長度\n- 柄徑、接口或夾持方式\n- 是否需要倒角、端面加工或複合加工\n- 工件材料與硬度\n- 是否有焊接、熱處理或硬度變化\n- 機台型式與主軸轉速範圍\n- 進給單位與可調範圍\n- 冷卻方式\n- 需求數量\n- 交期要求\n- 是否接受特殊訂製價格\n\n---"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶問 `99151` 是否可做 `φ12.2`, `120L` 特殊搪刀？",
      "answer": "答：\n\n信件案例中客戶詢問 `Boring holder C11-12.2-120L`，技術部回覆提供附件報價與圖面。AI 不應直接回答價格或交期，需要求打開附件或重新詢價確認。此類問題應以特殊品流程處理。\n\n---"
    },
    {
      "topic": "Technical FAQ",
      "question": "客戶只提供舊型錄或參考標準品，可以直接報價嗎？",
      "answer": "答：\n\n不建議。舊型錄只能作為參考，仍需重新確認技術圖面、關鍵尺寸、公差、材質、數量與交期。若是特殊搪刀，應先出圖確認後再報價。\n\n---"
    }
  ]
};
