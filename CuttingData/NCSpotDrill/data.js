/* NC Spot Drill 產品資料：逐頁核對使用者提供的 2025–2026 英文型錄。
 * 規格：印刷頁 30–41 的普通型刀具；幾何說明：52；切削表：53–54。
 * NC Spot Drill 的刀片有偏心及不同刃形；不得將 ACE 的刀尖修正量搬入本資料。
 */
const NC_SPOT_DATA = (() => {
  const materialIds = ["carbonLow", "carbonHigh", "lowAlloy", "highAlloy", "stainless", "castIron", "nonFerrous", "titanium", "heatResistant", "hardened"];
  const materials = [
    { id: "carbonLow", label: "Carbon steel · C < 0.3%", iso: "P", vc: [150, 320] },
    { id: "carbonHigh", label: "Carbon steel · C > 0.3%", iso: "P", vc: [100, 250] },
    { id: "lowAlloy", label: "Low alloy steel · C < 0.3%", iso: "P", vc: [100, 250] },
    { id: "highAlloy", label: "High alloy steel", iso: "P", vc: [60, 180] },
    { id: "stainless", label: "Stainless steel", iso: "M", vc: [65, 125] },
    { id: "castIron", label: "Cast iron", iso: "K", vc: [150, 250] },
    { id: "nonFerrous", label: "Non-ferrous metal", iso: "N", vc: [150, 320] },
    { id: "titanium", label: "Titanium / titanium alloy", iso: "S", vc: [40, 80] },
    { id: "heatResistant", label: "Heat resistant alloy", iso: "S", vc: [30, 60] },
    { id: "hardened", label: "Hardened steel · check HRC limit", iso: "H", vc: [30, 60] }
  ];

  // 每轉進給 mm/rev；型錄的可轉用刃數不乘入 F = S × f。
  const makeFeedRows = rows => Object.fromEntries(materialIds.map((id, index) => [id, {
    spotting: rows[index][0], chamfering: rows[index][1]
  }]));
  const feedTables = {
    small: makeFeedRows([
      [[.03, .07], [.05, .15]], [[.02, .06], [.03, .12]],
      [[.02, .06], [.04, .12]], [[.02, .05], [.03, .10]],
      [[.02, .04], [.03, .08]], [[.03, .07], [.05, .15]],
      [[.03, .07], [.05, .15]], [[.02, .06], [.02, .06]],
      [null, [.03, .07]], [[.02, .06], [.02, .06]]
    ]),
    standard: makeFeedRows([
      [[.05, .10], [.10, .24]], [[.04, .08], [.08, .20]],
      [[.04, .08], [.08, .20]], [[.03, .07], [.05, .15]],
      [[.03, .06], [.08, .20]], [[.05, .10], [.10, .25]],
      [[.05, .10], [.10, .25]], [[.03, .08], [.03, .08]],
      [null, [.05, .10]], [[.03, .08], [.03, .08]]
    ]),
    large: makeFeedRows([
      [[.05, .10], [.10, .24]], [[.04, .08], [.08, .20]],
      [[.04, .08], [.08, .20]], [[.03, .07], [.05, .15]],
      [[.03, .06], [.08, .20]], [[.05, .10], [.10, .25]],
      [[.05, .10], [.10, .25]], [[.03, .08], [.03, .08]],
      [null, [.05, .10]], [[.03, .08], [.03, .08]]
    ])
  };

  // 逐欄抄錄型錄的 ● Best / ◎ Suit / ○ Possible，未標示的材質不自動推薦。
  const gradeRows = {
    small: {
      NC2071: [3, 0, 3, 0, 3, 2, 2, 3, 1, 0],
      NC5071: [0, 3, 0, 3, 1, 3, 0, 0, 2, 1],
      NC9076: [0, 0, 0, 0, 2, 0, 3, 2, 0, 0]
    },
    standard: {
      NC40: [3, 3, 3, 0, 1, 3, 0, 0, 0, 0],
      NC10: [0, 0, 0, 2, 3, 3, 2, 0, 0, 0],
      NC60: [0, 0, 2, 3, 0, 0, 0, 0, 0, 3],
      "H-NC5071": [0, 3, 0, 3, 1, 3, 0, 0, 2, 1],
      "H-NC40": [3, 0, 3, 0, 3, 2, 2, 3, 1, 0],
      "H-NC9076": [0, 0, 0, 0, 2, 0, 3, 2, 0, 0]
    },
    large: {
      NC2071: [3, 0, 3, 0, 3, 2, 2, 3, 1, 0],
      NC5071: [0, 3, 0, 3, 1, 3, 0, 0, 2, 1],
      NC9076: [0, 0, 0, 0, 2, 0, 3, 2, 0, 0],
      NC9036: [0, 0, 0, 0, 2, 0, 3, 2, 0, 0],
      NC40: [3, 0, 3, 0, 1, 2, 0, 0, 0, 0],
      NC2033: [0, 3, 0, 3, 1, 3, 0, 0, 0, 2],
      XP9000: [0, 0, 0, 0, 0, 0, 3, 0, 0, 0]
    }
  };
  const ratingLabels = { 3: "Best", 2: "Suitable", 1: "Possible" };
  const pdfPageFor = page => page >= 28 && page <= 43 ? page - 27 : page === 52 ? 17 : page === 53 ? 18 : 19;
  function makeInsert(base, grade, table, spec) {
    if (!gradeRows[table]?.[grade]) throw new Error(`Missing verified catalog grade matrix: ${table}/${grade}`);
    const materialRatings = Object.fromEntries(materialIds.flatMap((id, index) => gradeRows[table][grade][index] ? [[id, gradeRows[table][grade][index]]] : []));
    const isWiper = grade === "NC40" || grade === "NC60";
    return {
      id: `${base}-${grade}`, part: `${base}-${grade}`, label: `${base}-${grade}`, familyLabel: base, grade,
      materialIds: Object.keys(materialRatings), materialRatings,
      materialRatingSourcePage: table === "large" ? 54 : 53,
      edgeProfile: isWiper ? "wiper" : "rounded",
      minSpotDepth: isWiper ? 1 : null,
      tipCorrection: null,
      geometryMode: "nominal-or-measured",
      // supporting edge 的 +50% 是型錄條件性建議，預設仍使用原始進給範圍。
      supportingEdgeFeedFactor: grade.startsWith("H-") ? 1.5 : null,
      feedMultiplier: 1,
      ...spec
    };
  }
  const smallInserts = (base, maxDiameter, maxDepth, sourcePage, radius) => ["NC2071", "NC5071", "NC9076"].map(grade => makeInsert(base, grade, "small", {
    maxDiameter, maxDepth, cornerRadius: radius, indexableEdges: 2, sourcePage, pdfPage: pdfPageFor(sourcePage)
  }));
  const series = [
    {
      id: "p60", familyLabel: "N9MT11T3P60", label: "N9MT11T3P60 · 60° · Ø5 max", angle: 60, operations: ["spotting"],
      maxDiameter: 5, maxDepth: 3, sourcePage: 30, pdfPage: 3,
      feedTable: "standard", cuttingPresetAvailable: true, manualInput: false,
      // 使用者確認 P60 由 N9MT11T3CT 改製；只引用同牌號切削起始值，幾何與材料評級仍獨立管理。
      cuttingReference: { familyLabel: "N9MT0802 / N9MT11T3CT", parentInsert: "N9MT11T3CT-NC40", grade: "NC40", materialIds: ["carbonLow", "carbonHigh", "lowAlloy", "castIron"], basis: "user-confirmed-parent", confirmedOn: "2026-11-05", sourcePdf: "./sources/NC-Spot-Drill-2025-2026-ENG.pdf", sourcePage: 53, pdfPage: 18, note: "User confirmed P60 is reground from N9MT11T3CT. Use the NC40 CT table as reference starting values, not a dedicated P60 cutting table." },
      maxHardness: null,
      materialCompatibilityNote: "Catalog p. 30 lists unhardened steel and cast iron. CT reference values require a matching NC40 material entry.",
      holders: [
        { part: "00-99616-14-12", shankDiameter: 12, length: 100, shank: "Steel" },
        { part: "00-99616-14", shankDiameter: 16, length: 100, shank: "Steel" }
      ],
      // P60 單獨建規格，不呼叫 CT 牌號矩陣產生器，避免連帶繼承評級、硬度與最低深度。
      inserts: [{
        id: "N9MT11T3P60-NC40", part: "N9MT11T3P60-NC40", label: "N9MT11T3P60-NC40", familyLabel: "N9MT11T3P60",
        code: "014204", grade: "NC40", coating: "TiN", carbideGrade: "P35",
        length: 11, thickness: 3.97, cornerRadius: .8, maxDiameter: 5, maxDepth: 3, indexableEdges: 2,
        materialIds: ["carbonLow", "carbonHigh", "lowAlloy", "highAlloy", "castIron"],
        materialRatings: {}, materialApplicabilitySource: "Catalog p. 30 prose: all unhardened steel and cast iron; not the CT cutting-data matrix.",
        materialMaxHardness: null,
        edgeProfile: "rounded", minSpotDepth: null, tipCorrection: null, geometryMode: "nominal-or-measured",
        feedMultiplier: 1, supportingEdgeFeedFactor: null,
        sourcePage: 30, pdfPage: 3
      }]
    },
    {
      id: "nc06", familyLabel: "N9MT05T1CT", label: "N9MT05T1CT · 90° · Ø5.5 max", angle: 90,
      maxDiameter: 5.5, maxDepth: 2.4, sourcePage: 33, pdfPage: 6, feedTable: "small",
      holders: [
        { part: "00-99616-06-6", shankDiameter: 6, length: 35, shank: "Steel" },
        { part: "00-99616-06-5", shankDiameter: 5, length: 35, shank: "Steel" },
        { part: "00-99616-06-6L", shankDiameter: 6, length: 60, shank: "Carbide" }
      ],
      inserts: smallInserts("N9MT05T1CT", 5.5, 2.4, 33, .4)
    },
    {
      id: "nc08", familyLabel: "N9MT0602CT", label: "N9MT0602CT · 90° · Ø8 max", angle: 90,
      maxDiameter: 8, maxDepth: 3.7, sourcePage: 33, pdfPage: 6, feedTable: "small",
      holders: [{ part: "00-99616-08-8", shankDiameter: 8, length: 60, shank: "Steel" }],
      inserts: smallInserts("N9MT0602CT", 8, 3.7, 33, .4)
    },
    {
      id: "nc10", familyLabel: "N9MT0802", label: "N9MT0802 · 90° · Ø10 max", angle: 90,
      maxDiameter: 10, maxDepth: 4.7, sourcePage: 34, pdfPage: 7, feedTable: "standard",
      holders: [
        { part: "00-99616-10", shankDiameter: 10, length: 90, shank: "Steel" },
        { part: "00-99616-10-SL10", shankDiameter: 10, length: 90, shank: "Weldon" },
        { part: "00-99616-3/8", shankDiameter: 9.525, shankLabel: '3/8"', length: 90, shank: "Steel" },
        { part: "00-99616-10-M5", shankDiameter: null, length: 25, thread: "M5×0.8", shank: "Threaded" },
        { part: "00-99616-10-M6", shankDiameter: null, length: 25, thread: "M6×1.0", shank: "Threaded" }
      ],
      inserts: [
        makeInsert("N9MT080208CT", "NC40", "standard", { maxDiameter: 10, maxDepth: 4.5, cornerRadius: .8, indexableEdges: 4 }),
        makeInsert("N9MT080204CT", "NC40", "standard", { maxDiameter: 10, maxDepth: 4.7, cornerRadius: .4, indexableEdges: 4 }),
        makeInsert("N9MT080204CT", "NC10", "standard", { maxDiameter: 10, maxDepth: 4.7, cornerRadius: .4, indexableEdges: 4 }),
        ...["H-NC5071", "H-NC40", "H-NC9076"].map(grade => makeInsert("N9MT0802CT2T", grade, "standard", { maxDiameter: 10, maxDepth: 4.7, cornerRadius: .8, indexableEdges: 2 }))
      ]
    },
    {
      id: "nc14", familyLabel: "N9MT11T3CT / CT2T", label: "N9MT11T3CT / CT2T · 90° · Ø14 max", angle: 90,
      maxDiameter: 14, maxDepth: 6.3, sourcePage: 36, pdfPage: 9, feedTable: "standard",
      holders: [
        { part: "00-99616-14-12", shankDiameter: 12, length: 100, shank: "Steel" },
        { part: "00-99616-14", shankDiameter: 16, length: 100, shank: "Steel" },
        { part: "00-99616-14-150L", shankDiameter: 16, length: 150, shank: "Steel" },
        { part: "00-99616-14-220L", shankDiameter: 20, length: 220, shank: "Steel" },
        { part: "00-99616-14-1/2", shankDiameter: 12.7, shankLabel: '1/2"', length: 100, shank: "Steel" },
        { part: "00-99616-14-5/8", shankDiameter: 15.875, shankLabel: '5/8"', length: 100, shank: "Steel" },
        { part: "00-99616-14-M8", shankDiameter: null, length: 30, thread: "M8×1.25", shank: "Threaded" }
      ],
      inserts: [
        ...["NC40", "NC10", "NC60"].map(grade => makeInsert("N9MT11T3CT", grade, "standard", { maxDiameter: 14, maxDepth: 6.3, cornerRadius: grade === "NC10" ? .3 : .8, indexableEdges: 4 })),
        ...["H-NC5071", "H-NC40", "H-NC9076"].map(grade => makeInsert("N9MT11T3CT2T", grade, "standard", { maxDiameter: 14, maxDepth: 6.3, cornerRadius: .8, indexableEdges: 2 }))
      ]
    },
    {
      id: "v09", familyLabel: "V9MT0802CT", label: "V9MT0802CT · 60° · Ø9 max", angle: 60,
      maxDiameter: 9, maxDepth: 7.2, sourcePage: 31, pdfPage: 4, feedTable: "small",
      holders: [{ part: "00-99616-09V", shankDiameter: 8, length: 60, shank: "Steel" }],
      inserts: smallInserts("V9MT0802CT", 9, 7.2, 31, .4)
    },
    {
      id: "v13", familyLabel: "V9MT12T3CT", label: "V9MT12T3CT · 60° · Ø13 max", angle: 60,
      maxDiameter: 13, maxDepth: 10.1, sourcePage: 31, pdfPage: 4, feedTable: "large",
      holders: [
        { part: "00-99616-13V", shankDiameter: 16, length: 100, shank: "Steel" },
        { part: "00-99616-13V-5/8", shankDiameter: 15.875, shankLabel: '5/8"', length: 100, shank: "Steel" }
      ],
      inserts: ["NC2071", "NC5071", "NC9076"].map(grade => makeInsert("V9MT12T3CT", grade, "large", { maxDiameter: 13, maxDepth: 10.1, cornerRadius: .8, indexableEdges: 2, sourcePage: 31, pdfPage: 4 }))
    },
    {
      id: "v08208", familyLabel: "V0820802", label: "V0820802 · 82° · Ø9 max", angle: 82,
      maxDiameter: 9, maxDepth: 4.7, sourcePage: 32, pdfPage: 5, feedTable: "large",
      holders: [{ part: "00-99619-V082-3/8", code: "693001", shankDiameter: 9.525, shankLabel: '3/8"', length: 90, shank: "Steel" }],
      inserts: [
        makeInsert("V0820802", "NC2071", "large", { code: "0108201", maxDiameter: 9, maxDepth: 4.7, cornerRadius: .4, length: 8, thickness: 2.38, indexableEdges: 2 }),
        makeInsert("V0820802", "NC5071", "large", { code: "0108203", maxDiameter: 9, maxDepth: 4.7, cornerRadius: .4, length: 8, thickness: 2.38, indexableEdges: 2 }),
        makeInsert("V0820802", "NC9076", "large", { code: "0108202", maxDiameter: 9, maxDepth: 4.7, cornerRadius: .4, length: 8, thickness: 2.38, indexableEdges: 2 })
      ]
    },
    {
      id: "v08212", familyLabel: "V08212T3", label: "V08212T3 · 82° · Ø14 max", angle: 82,
      maxDiameter: 14, maxDepth: 7.5, sourcePage: 32, pdfPage: 5, feedTable: "large",
      holders: [{ part: "00-99619-V082-5/8", code: "693002", shankDiameter: 15.875, shankLabel: '5/8"', length: 100, shank: "Steel" }],
      inserts: [
        makeInsert("V08212T3", "NC2071", "large", { code: "0108211", maxDiameter: 14, maxDepth: 7.5, cornerRadius: .8, length: 12.7, thickness: 3.97, indexableEdges: 2 }),
        makeInsert("V08212T3", "NC5071", "large", { code: "0108213", maxDiameter: 14, maxDepth: 7.5, cornerRadius: .8, length: 12.7, thickness: 3.97, indexableEdges: 2 }),
        makeInsert("V08212T3", "NC9076", "large", { code: "0108212", maxDiameter: 14, maxDepth: 7.5, cornerRadius: .8, length: 12.7, thickness: 3.97, indexableEdges: 2 })
      ]
    },
    {
      id: "nc22", familyLabel: "N9MT1704CT", label: "N9MT1704CT · 90° · Ø22 max", angle: 90,
      maxDiameter: 22, maxDepth: 10.4, sourcePage: 38, pdfPage: 11, feedTable: "large",
      holders: [
        { part: "00-99616-22", code: "606001", shankDiameter: 20, length: 100, shank: "Steel" },
        { part: "00-99616-22-25", code: "606002", shankDiameter: 25, length: 150, shank: "Steel" }
      ],
      inserts: [
        makeInsert("N9MT1704CT", "NC2071", "large", { code: "016201", maxDiameter: 22, maxDepth: 10.4, cornerRadius: 1.2, length: 17, thickness: 4.76, indexableEdges: 2 }),
        makeInsert("N9MT1704CT", "NC5071", "large", { code: "016216", maxDiameter: 22, maxDepth: 10.4, cornerRadius: 1.2, length: 17, thickness: 4.76, indexableEdges: 2 }),
        makeInsert("N9MT1704CT", "NC9036", "large", { code: "016211", maxDiameter: 22, maxDepth: 10.4, cornerRadius: 1.2, length: 17, thickness: 4.76, indexableEdges: 2 })
      ]
    },
    {
      id: "nc25", familyLabel: "N9MT220408CT", label: "N9MT220408CT · 90° · Ø25 max", angle: 90,
      maxDiameter: 25, maxDepth: 11.3, sourcePage: 39, pdfPage: 12, feedTable: "large",
      holders: [
        { part: "00-99616-25-CT28", code: "607001", shankDiameter: 25, length: 120, neckLength: 30, shank: "Steel" },
        { part: "00-99616-1-CT28", code: "617001", shankDiameter: 25.4, shankLabel: '1"', length: 120, neckLength: 30, shank: "Steel" }
      ],
      inserts: [makeInsert("N9MT220408CT", "NC40", "large", {
        code: "017301", maxDiameter: 25, maxDepth: 11.3, cornerRadius: null, length: 20.83, thickness: 4.76, indexableEdges: 3,
        // p39 用途文字補充碳鋼／合金鋼；評級仍保持 p54 的原始符號，不能把空白補成 Best。
        materialIds: ["carbonLow", "carbonHigh", "lowAlloy", "highAlloy", "stainless", "castIron"],
        materialApplicabilitySource: "Catalog p. 39 prose lists carbon steel, alloy steel and cast iron; p. 54 additionally rates stainless as Possible. Blank matrix ratings remain blank.",
        materialMaxHardness: null,
        edgeProfile: "catalog-nominal"
      })]
    },
    {
      id: "nc32", familyLabel: "N9MT2506CT", label: "N9MT2506CT · 90° · Ø32 max", angle: 90,
      maxDiameter: 32, maxDepth: 15.4, sourcePage: 39, pdfPage: 12, feedTable: "large",
      holders: [
        { part: "00-99616-32-25", code: "608001", shankDiameter: 25, length: 120, neckLength: 64, shank: "Steel" },
        { part: "00-99616-32-1", code: "618001", shankDiameter: 25.4, shankLabel: '1"', length: 120, neckLength: 64, shank: "Steel" }
      ],
      inserts: [
        makeInsert("N9MT2506CT", "NC2033", "large", {
          code: "018201", maxDiameter: 32, maxDepth: 15.4, cornerRadius: 1.2, length: 25, thickness: 6.35, indexableEdges: 2,
          materialIds: ["carbonLow", "carbonHigh", "lowAlloy", "highAlloy", "stainless", "castIron", "hardened"],
          materialApplicabilitySource: "Catalog p. 39 prose lists carbon/alloy/high-alloy steel, cast iron and hardened steel < HRC50. p. 54 matrix adds stainless as Possible; no missing rating is invented."
        }),
        makeInsert("N9MT2506CT", "XP9000", "large", {
          code: "018202", maxDiameter: 32, maxDepth: 15.4, cornerRadius: 1.2, length: 25, thickness: 6.35, indexableEdges: 2,
          materialIds: ["nonFerrous", "titanium"],
          materialApplicabilitySource: "Catalog p. 39 prose lists non-ferrous metal including titanium. p. 54 marks only non-ferrous metal as Best; titanium compatibility is prose-based with no matrix rating."
        })
      ]
    },
    {
      id: "nc100", familyLabel: "N9MT11T3CT2T-H · 100°", label: "N9MT11T3CT2T-H · 100° · Ø16 max", angle: 100,
      maxDiameter: 16, maxDepth: 6.2, sourcePage: 40, pdfPage: 13, feedTable: "standard",
      operationSourceUrl: "https://nine9.jic-tools.com.tw/100nc-spot-drill.html",
      holders: [{ part: "00-99616-20-100", code: "604011", shankDiameter: 20, length: 100, shank: "Steel" }],
      inserts: [
        makeInsert("N9MT11T3CT2T", "H-NC5071", "standard", { code: "014234", maxDiameter: 16, maxDepth: 6.2, cornerRadius: .8, length: 11, thickness: 3.97, indexableEdges: 2 }),
        makeInsert("N9MT11T3CT2T", "H-NC40", "standard", { code: "014202", maxDiameter: 16, maxDepth: 6.2, cornerRadius: .8, length: 11, thickness: 3.97, indexableEdges: 2 }),
        makeInsert("N9MT11T3CT2T", "H-NC9076", "standard", { code: "014203", maxDiameter: 16, maxDepth: 6.2, cornerRadius: .8, length: 11, thickness: 3.97, indexableEdges: 2 })
      ],
      setupNote: "100° aircraft rivet/screw-hole holder. The two-edge insert must be installed in the illustrated orientation. The same insert family in a 90° holder has different Dmax/Tmax."
    },
    {
      id: "nc120", familyLabel: "N9MT11T3CT2T-H · 120°", label: "N9MT11T3CT2T-H · 120° · Ø17 max", angle: 120,
      maxDiameter: 17, maxDepth: 4.76, sourcePage: "1-13", pdfPage: 13, feedTable: "standard",
      sourcePdf: "./sources/NC-Spot-Drill-Legacy.pdf",
      sourceVersion: "Legacy official catalog; current product page cross-checked 2026-11-05",
      sourceUrl: "https://nine9.jic-tools.com.tw/100nc-spot-drill.html",
      cuttingSourcePdf: "./sources/NC-Spot-Drill-2025-2026-ENG.pdf",
      holders: [
        { part: "00-99616-20-120", code: "604013", shankDiameter: 20, length: 100, shank: "Steel" },
        { part: "00-99616-3/4-120", code: "614003", shankDiameter: 19.05, shankLabel: '3/4"', length: 100, shank: "Steel", catalogMaxDiameterInch: .669, catalogMaxDepthInch: .187 }
      ],
      inserts: ["H-NC5071", "H-NC40", "H-NC9076"].map(grade => makeInsert("N9MT11T3CT2T", grade, "standard", {
        code: grade === "H-NC5071" ? "014234" : grade === "H-NC40" ? "014202" : "014203",
        maxDiameter: 17, maxDepth: 4.76, cornerRadius: .8, length: 11, thickness: 3.97, indexableEdges: 2,
        gradeSourceUrl: "https://nine9.jic-tools.com.tw/100nc-spot-drill.html",
        gradeSourceNote: grade === "H-NC5071" ? "This grade is listed on the current official product page, not in the two-grade legacy PDF table." : "Listed in both the legacy PDF and current official product page."
      })),
      setupNote: "For spotting before an 118° drill and 60° face chamfering. The CT2T insert must be installed in the illustrated orientation. Metric limits are used; inch-table numbers are rounded equivalents."
    },
    {
      id: "nc142", familyLabel: "N9MT11T3CT2T-H · 142°", label: "N9MT11T3CT2T-H · 142° · Ø18.5 max", angle: 142,
      maxDiameter: 18.5, maxDepth: 3.16, sourcePage: "1-13", pdfPage: 13, feedTable: "standard",
      sourcePdf: "./sources/NC-Spot-Drill-Legacy.pdf",
      sourceVersion: "Legacy official catalog; current product page cross-checked 2026-11-05",
      sourceUrl: "https://nine9.jic-tools.com.tw/100nc-spot-drill.html",
      cuttingSourcePdf: "./sources/NC-Spot-Drill-2025-2026-ENG.pdf",
      holders: [
        { part: "00-99616-20-142", code: "604014", shankDiameter: 20, length: 100, shank: "Steel" },
        { part: "00-99616-3/4-142", code: "614004", shankDiameter: 19.05, shankLabel: '3/4"', length: 100, shank: "Steel", catalogMaxDiameterInch: .728, catalogMaxDepthInch: .124 }
      ],
      inserts: ["H-NC5071", "H-NC40", "H-NC9076"].map(grade => makeInsert("N9MT11T3CT2T", grade, "standard", {
        code: grade === "H-NC5071" ? "014234" : grade === "H-NC40" ? "014202" : "014203",
        maxDiameter: 18.5, maxDepth: 3.16, cornerRadius: .8, length: 11, thickness: 3.97, indexableEdges: 2,
        gradeSourceUrl: "https://nine9.jic-tools.com.tw/100nc-spot-drill.html",
        gradeSourceNote: grade === "H-NC5071" ? "This grade is listed on the current official product page, not in the two-grade legacy PDF table." : "Listed in both the legacy PDF and current official product page."
      })),
      setupNote: "For spotting before a 135–140° high-performance drill. This N9MT CT2T assembly is different from the V1420803/V1421604 family."
    },
    {
      id: "v14208", familyLabel: "V1420803", label: "V1420803 · 142° · Ø15 max", angle: 142, operations: ["spotting"],
      maxDiameter: 15, maxDepth: 2.5, sourcePage: 41, pdfPage: 14, feedTable: "large",
      holders: [{ part: "00-99619-V142-16", code: "696001", shankDiameter: 16, length: 100, shank: "Steel" }],
      inserts: [makeInsert("V1420803", "NC2071", "large", {
        code: "0114201", maxDiameter: 15, maxDepth: 2.5, cornerRadius: .8, length: 8, thickness: 3.18, indexableEdges: 2,
        materialIds: ["carbonLow", "carbonHigh", "lowAlloy", "highAlloy", "stainless", "castIron", "nonFerrous", "titanium", "heatResistant"],
        materialApplicabilitySource: "Catalog p. 41 prose lists all unhardened steel and cast iron; additional material compatibility/rating is only taken from the NC2071 column in p. 54."
      })],
      setupNote: "Spot before a 135–140° high-performance drill. The insert table Dmax is 15 mm, not the holder shank Ø16 or the page's generic max Ø32 illustration."
    },
    {
      id: "v14216", familyLabel: "V1421604", label: "V1421604 · 142° · Ø30 max", angle: 142, operations: ["spotting"],
      maxDiameter: 30, maxDepth: 5, sourcePage: 41, pdfPage: 14, feedTable: "large",
      holders: [{ part: "00-99619-V142-32", code: "696002", shankDiameter: 25, length: 120, shank: "Steel" }],
      inserts: [makeInsert("V1421604", "NC2071", "large", {
        code: "0114211", maxDiameter: 30, maxDepth: 5, cornerRadius: 1.2, length: 14, thickness: 4.76, indexableEdges: 2,
        materialIds: ["carbonLow", "carbonHigh", "lowAlloy", "highAlloy", "stainless", "castIron", "nonFerrous", "titanium", "heatResistant"],
        materialApplicabilitySource: "Catalog p. 41 prose lists all unhardened steel and cast iron; additional material compatibility/rating is only taken from the NC2071 column in p. 54."
      })],
      setupNote: "Spot before a 135–140° high-performance drill. The insert table Dmax is 30 mm, despite the page headline/holder drawing mentioning 32 mm."
    }
  ];

  const catalogInsertCodes = {
    "N9MT05T1CT-NC2071": "011201", "N9MT05T1CT-NC5071": "011209", "N9MT05T1CT-NC9076": "011202",
    "N9MT0602CT-NC2071": "012201", "N9MT0602CT-NC5071": "012204", "N9MT0602CT-NC9076": "012202",
    "N9MT080208CT-NC40": "013401", "N9MT080204CT-NC40": "013402", "N9MT080204CT-NC10": "013403",
    "N9MT0802CT2T-H-NC5071": "013206", "N9MT0802CT2T-H-NC40": "013201", "N9MT0802CT2T-H-NC9076": "013202",
    "N9MT11T3CT-NC40": "014401", "N9MT11T3CT-NC10": "014402", "N9MT11T3CT-NC60": "014403",
    "N9MT11T3CT2T-H-NC5071": "014234", "N9MT11T3CT2T-H-NC40": "014202", "N9MT11T3CT2T-H-NC9076": "014203",
    "V9MT0802CT-NC2071": "019201", "V9MT0802CT-NC5071": "019202", "V9MT0802CT-NC9076": "019203",
    "V9MT12T3CT-NC2071": "015201", "V9MT12T3CT-NC5071": "015204", "V9MT12T3CT-NC9076": "015202"
  };
  const catalogHolderCodes = {
    "00-99616-14-12": "604002", "00-99616-14": "604004",
    "00-99616-06-6": "601001", "00-99616-06-5": "601002", "00-99616-06-6L": "601003", "00-99616-08-8": "602001",
    "00-99616-10": "603001", "00-99616-10-SL10": "603003", "00-99616-3/8": "613001", "00-99616-10-M5": "623001", "00-99616-10-M6": "623002",
    "00-99616-14-150L": "604007", "00-99616-14-220L": "604009", "00-99616-14-1/2": "614001", "00-99616-14-5/8": "614002", "00-99616-14-M8": "624001",
    "00-99616-09V": "609001", "00-99616-13V": "605001", "00-99616-13V-5/8": "615001"
  };
  const systemMinDiameters = { v09: 1, v13: 2, v08208: 2, v08212: 2, nc06: 1, nc08: 1, nc10: 2, nc14: 3, nc22: 3, nc25: 4, nc32: 4, nc100: 3, v14208: 2, v14216: 2 };
  for (const item of series) {
    item.operations ??= ["spotting", "chamfering"];
    item.sourcePdf ??= "./sources/NC-Spot-Drill-2025-2026-ENG.pdf";
    item.sourceVersion ??= "2025–2026 English excerpt supplied by user";
    item.tipCorrection = null;
    item.geometryMode = "nominal-or-measured";
    item.cuttingPresetAvailable ??= Boolean(item.feedTable);
    item.manualInput ??= false;
    item.cuttingSourcePage = item.feedTable ? (item.feedTable === "large" ? 54 : 53) : null;
    item.cuttingPdfPage = item.feedTable ? (item.feedTable === "large" ? 19 : 18) : null;
    item.cuttingSourcePdf = item.feedTable ? (item.cuttingSourcePdf || "./sources/NC-Spot-Drill-2025-2026-ENG.pdf") : null;
    // 切削表的共用硬度不可覆蓋已明示的個別型號限制（null 代表未確認）。
    if (!Object.hasOwn(item, "maxHardness")) item.maxHardness = item.feedTable ? (item.feedTable === "standard" ? 56 : 50) : null;
    item.minChamferClearance = item.operations.includes("chamfering") ? 1 : null;
    item.minDiameter = systemMinDiameters[item.id] ?? null;
    if (item.minDiameter !== null) {
      item.minDiameterSource = "./sources/NC-Spot-Drill-System-2026-p15.png";
      item.minDiameterSourcePage = 15;
      item.minDiameterEdition = "2026-08";
      item.minDiameterSourceNote = "Nine9 Spot Drill System, full main catalog EN.202608 p. 15; not the user's 19-page excerpt.";
    }
    if (["p60", "nc120", "nc142"].includes(item.id)) {
      item.minDiameter = item.id === "p60" ? 2 : 3;
      item.minDiameterSource = null;
      item.minDiameterSourceUrl = "https://nine9.jic-tools.com.tw/nc-spot-drill.htm";
      item.minDiameterChecked = "2026-11-05";
      item.minDiameterSourceNote = item.id === "p60"
        ? "Current official NC Spot Drill Application System lists P60 Dmin 2 mm. Its web Dmax is 6.2 mm; this tool retains the supplied page-30 insert table Dmax 5 mm. This minimum is not from the 2026 p. 15 image."
        : "Current official NC Spot Drill Application System lists Dmin 3 mm for the combined 100°/120°/142° CT2T group; these assemblies are not listed in the 2026 p. 15 image.";
    }
    item.catalogOperations = [...item.operations];
    // 用途文字與切削表評級分開；文字允許但矩陣空白的材料不能自動升成 Best。
    item.recommendedByMaterial = {};
    for (const materialId of materialIds) {
      const ranked = item.inserts.filter(insert => insert.materialRatings[materialId] > 0).sort((a, b) => b.materialRatings[materialId] - a.materialRatings[materialId]);
      if (ranked.length && item.cuttingPresetAvailable) item.recommendedByMaterial[materialId] = ranked[0].id;
    }
    for (const insert of item.inserts) {
      insert.code ??= catalogInsertCodes[insert.part];
      insert.sourcePage ??= item.sourcePage;
      insert.pdfPage ??= item.pdfPage;
      insert.minDiameter = item.minDiameter;
      // P60 的 NC40 是 p30 獨立規格，不能從 CT 版 NC40 移植 <HRC48 的數值限制。
      if (item.cuttingPresetAvailable && !Object.hasOwn(insert, "materialMaxHardness")) insert.materialMaxHardness = insert.grade === "NC40" && item.feedTable === "standard" ? 48 : item.maxHardness;
    }
    for (const holder of item.holders) holder.code ??= catalogHolderCodes[holder.part];
  }

  // 套裝料號對應同一組已核對的刀柄與刀片；不為包裝複製另一份加工幾何。
  const packageRow = (code, part, familyId, insertId, holderPart, sourcePage, type) => ({
    code, part, familyId, insertId, holderPart, sourcePage, pdfPage: pdfPageFor(sourcePage), type,
    totalInsertQuantity: type === "starter" ? 6 : null
  });
  const catalogPackages = [
    packageRow("603101-3401", "00-99616-10-02S", "nc10", "N9MT080208CT-NC40", "00-99616-10", 35, "single-set"),
    packageRow("603101-3403", "00-99616-10-02SAL", "nc10", "N9MT080204CT-NC10", "00-99616-10", 35, "single-set"),
    packageRow("603201-3401", "00-99616-10-ME6", "nc10", "N9MT080208CT-NC40", "00-99616-10", 35, "starter"),
    packageRow("603201-3403", "00-99616-10-ME6AL", "nc10", "N9MT080204CT-NC10", "00-99616-10", 35, "starter"),
    packageRow("613201-3401", "00-99616-10-IN6", "nc10", "N9MT080208CT-NC40", "00-99616-3/8", 35, "starter"),
    packageRow("613201-3403", "00-99616-10-IN6AL", "nc10", "N9MT080204CT-NC10", "00-99616-3/8", 35, "starter"),
    packageRow("604104-4401", "00-99616-14-02S", "nc14", "N9MT11T3CT-NC40", "00-99616-14", 37, "single-set"),
    packageRow("604104-4402", "00-99616-14-02SAL", "nc14", "N9MT11T3CT-NC10", "00-99616-14", 37, "single-set"),
    packageRow("614102-4401", "00-99616-14-5/8-02S", "nc14", "N9MT11T3CT-NC40", "00-99616-14-5/8", 37, "single-set"),
    packageRow("614102-4402", "00-99616-14-5/8-02SAL", "nc14", "N9MT11T3CT-NC10", "00-99616-14-5/8", 37, "single-set"),
    packageRow("604204-4401", "00-99616-14-ME6", "nc14", "N9MT11T3CT-NC40", "00-99616-14", 37, "starter"),
    packageRow("604204-4402", "00-99616-14-ME6AL", "nc14", "N9MT11T3CT-NC10", "00-99616-14", 37, "starter"),
    packageRow("614204-4401", "00-99616-14-IN6", "nc14", "N9MT11T3CT-NC40", "00-99616-14-5/8", 37, "starter"),
    packageRow("614204-4402", "00-99616-14-IN6AL", "nc14", "N9MT11T3CT-NC10", "00-99616-14-5/8", 37, "starter")
  ];

  // 逐印刷頁盤點。overview 的其他產品只做來源提示，沒有規格頁就不建立假型號。
  const catalogCoverage = [
    { sourcePages: [28, 29], pdfPages: [1, 2], kind: "overview", familyIds: [], status: "reference", note: "NC Spot Drill overview; RC, SW and other engraving references are separate product sections whose detailed specification pages are not included in this 19-page PDF." },
    { sourcePages: [30], pdfPages: [3], kind: "ordinary", familyIds: ["p60"], status: "specifications-parent-reference", note: "P60 specifications are on p. 30. The user-confirmed N9MT11T3CT regrind relationship permits NC40 CT reference starting values from p. 53; no dedicated P60 cutting table is claimed." },
    { sourcePages: [31], pdfPages: [4], kind: "ordinary", familyIds: ["v09", "v13"], status: "covered" },
    { sourcePages: [32], pdfPages: [5], kind: "ordinary", familyIds: ["v08208", "v08212"], status: "covered" },
    { sourcePages: [33], pdfPages: [6], kind: "ordinary", familyIds: ["nc06", "nc08"], status: "covered" },
    { sourcePages: [34, 35], pdfPages: [7, 8], kind: "ordinary-and-packages", familyIds: ["nc10"], status: "covered", note: "Page 35 single sets/starter packages map to the page 34 assembly." },
    { sourcePages: [36, 37], pdfPages: [9, 10], kind: "ordinary-and-packages", familyIds: ["nc14"], status: "covered", note: "Page 37 single sets/starter packages map to the page 36 assembly." },
    { sourcePages: [38], pdfPages: [11], kind: "ordinary", familyIds: ["nc22"], status: "covered" },
    { sourcePages: [39], pdfPages: [12], kind: "ordinary", familyIds: ["nc25", "nc32"], status: "covered" },
    { sourcePages: [40], pdfPages: [13], kind: "ordinary", familyIds: ["nc100"], status: "covered" },
    { sourcePages: [41], pdfPages: [14], kind: "ordinary", familyIds: ["v14208", "v14216"], status: "covered", note: "Per-insert table limits 15/30 mm take precedence over generic 32 mm headline/drawing." },
    { sourcePages: [42, 43], pdfPages: [15, 16], kind: "wsp", familyIds: [], status: "separate-model", note: "WSP is managed by its independent dual-angle model and data, not by this ordinary-cone series list." },
    { sourcePages: [52], pdfPages: [17], kind: "geometry", familyIds: [], status: "reference", note: "120° appears in this excerpt only as a chart line; its assembly specifications are supplied separately by the official legacy PDF and current product page." },
    { sourcePages: ["1-13"], pdfPages: [13], kind: "legacy-ordinary", familyIds: ["nc120", "nc142"], status: "covered", sourcePdf: "./sources/NC-Spot-Drill-Legacy.pdf", note: "120° and N9MT CT2T-142° assemblies; H-NC5071 grade is additionally verified on the current official product page, not in the two-grade legacy PDF table." },
    { sourcePages: [53, 54], pdfPages: [18, 19], kind: "cutting-data", familyIds: series.filter(item => item.cuttingPresetAvailable).map(item => item.id), status: "covered", note: "Three ordinary feed tables; P60 uses a user-confirmed CT parent-family reference. WSP has its own table/model. Heat-resistant spotting feed is explicitly absent." }
  ];

  return {
    productName: "NC Spot Drill",
    source: {
      title: "NC Spot Drill · 2025–2026 English catalog",
      pdf: "./sources/NC-Spot-Drill-2025-2026-ENG.pdf",
      version: "2025–2026 ENG", checked: "2026-11-05", pageCount: 19,
      geometryPage: 52, geometryPdfPage: 17,
      cuttingPages: [53, 54], cuttingPdfPages: [18, 19]
    },
    operations: [{ id: "spotting", label: "Spotting" }, { id: "chamfering", label: "Chamfering" }],
    materials, series, feedTables, ratingLabels, catalogPackages, catalogCoverage,
    limitations: [
      "All 15 ordinary families in supplied catalog pp. 30–41 plus two legacy/current-page-confirmed 120° and N9MT-142° assemblies are represented; WSP uses a separate model.",
      "N9MT11T3P60-NC40 uses NC40 CT reference starting values for matching materials, based on the user-confirmed N9MT11T3CT regrind origin. Its geometry, material ratings and hardness limits remain independent.",
      "The selected insert/holder combination determines the point angle. P60 and 90° CT inserts can share a holder; CT2T inserts in the 100° holder have different limits from the 90° assembly.",
      "NC Spot Drill inserts are offset from the holder centre. Nominal cone geometry does not reproduce every actual cutting profile.",
      "No ACE tip correction, minimum diameter, Cmax or depth table is reused.",
      "Chamfer compensation is a local straight-edge model for assemblies whose catalog lists chamfering; it does not verify corners, hole/holder clearance, or lead-in/out moves.",
      "The CT-series NC40 and NC60 spotting diagrams show 1 mm tip clearance. The P60 specification page does not state that same minimum. Chamfering requires 1 mm tip clearance.",
      "H-type supporting-edge feed increases are not applied automatically. The copied feed range remains the unboosted catalog range.",
      "Heat resistant alloy has no catalog spotting feed; do not invent a spotting recommendation.",
      "Grade prose compatibility and Best/Suit/Possible table symbols are separate evidence. A prose-listed material does not receive an invented matrix rating.",
      "120°/N9MT-142° assembly specifications come from the separately stored legacy PDF and current official page; RC/SW remain separate product sections rather than ordinary-cone calculator models.",
      "Dmin is sourced from the 2026-08 full-catalog p. 15 system table or the current official Application System page, as recorded per family. These minimums are not attributed to the user's 19-page excerpt."
    ]
  };
})();

if (typeof module !== "undefined") module.exports = NC_SPOT_DATA;
