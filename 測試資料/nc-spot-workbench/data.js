/* NC Spot Drill 樣板資料：逐頁核對使用者提供的 2025–2026 英文型錄。
 * 規格：印刷頁 30、31、33、34、36；幾何說明：52；切削表：53–54。
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
      NC2071: [3, 0, 3, 0, 3, 2, 2, 3, 2, 0],
      NC5071: [0, 3, 0, 3, 1, 3, 0, 0, 2, 2],
      NC9076: [0, 0, 0, 0, 2, 0, 3, 2, 0, 0]
    }
  };
  const ratingLabels = { 3: "Best", 2: "Suitable", 1: "Possible" };
  const pdfPageFor = page => page === 30 ? 3 : page === 31 ? 4 : page === 33 ? 6 : page === 34 ? 7 : page === 36 ? 9 : page === 52 ? 17 : page === 53 ? 18 : 19;
  function makeInsert(base, grade, table, spec) {
    const materialRatings = Object.fromEntries(materialIds.flatMap((id, index) => gradeRows[table][grade][index] ? [[id, gradeRows[table][grade][index]]] : []));
    const isWiper = grade === "NC40" || grade === "NC60";
    return {
      id: `${base}-${grade}`, part: `${base}-${grade}`, label: `${base}-${grade}`, familyLabel: base, grade,
      materialIds: Object.keys(materialRatings), materialRatings,
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
      id: "p60", familyLabel: "N9MT11T3P60", label: "N9MT11T3P60 · 60° · Ø5 max", angle: 60,
      maxDiameter: 5, maxDepth: 3, sourcePage: 30, pdfPage: 3,
      feedTable: null, cuttingPresetAvailable: false, manualInput: true,
      cuttingSourcePage: null, cuttingPdfPage: null, maxHardness: null,
      materialCompatibilityNote: "Catalog p. 30 lists unhardened steel and cast iron. It gives no numerical HRC limit or P60-specific cutting preset.",
      holders: [
        { part: "00-99616-14-12", shankDiameter: 12, length: 100, shank: "Steel" },
        { part: "00-99616-14", shankDiameter: 16, length: 100, shank: "Steel" }
      ],
      // P60 不在 p53 的 N9MT11T3CT 切削表內；單獨建規格，不呼叫 CT 牌號矩陣產生器。
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
    }
  ];

  for (const item of series) {
    item.operations = item.angle === 90 ? ["spotting", "chamfering"] : ["spotting"];
    item.tipCorrection = null;
    item.geometryMode = "nominal-or-measured";
    item.cuttingPresetAvailable ??= Boolean(item.feedTable);
    item.manualInput ??= false;
    item.cuttingSourcePage = item.feedTable ? (item.feedTable === "large" ? 54 : 53) : null;
    item.cuttingPdfPage = item.feedTable ? (item.feedTable === "large" ? 19 : 18) : null;
    item.maxHardness = item.feedTable ? (item.feedTable === "standard" ? 56 : 50) : null;
    item.minChamferClearance = item.operations.includes("chamfering") ? 1 : null;
    // 僅沿輪廓的 90° 倒角在第一版開放補正；其他角度的切削表保留以供後續擴充。
    item.recommendedByMaterial = {};
    for (const materialId of materialIds) {
      const ranked = item.inserts.filter(insert => insert.materialIds.includes(materialId)).sort((a, b) => b.materialRatings[materialId] - a.materialRatings[materialId]);
      if (ranked.length && item.cuttingPresetAvailable) item.recommendedByMaterial[materialId] = ranked[0].id;
    }
    for (const insert of item.inserts) {
      insert.sourcePage ??= item.sourcePage;
      insert.pdfPage ??= item.pdfPage;
      // P60 的 NC40 是 p30 獨立規格，不能從 CT 版 NC40 移植 <HRC48 的數值限制。
      if (item.cuttingPresetAvailable) insert.materialMaxHardness = insert.grade === "NC40" ? 48 : item.maxHardness;
    }
  }

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
    materials, series, feedTables, ratingLabels,
    limitations: [
      "This prototype covers N9MT11T3P60, N9MT05T1CT, N9MT0602CT, N9MT0802, N9MT11T3CT/CT2T, V9MT0802CT and V9MT12T3CT.",
      "N9MT11T3P60-NC40 has verified catalog specifications but no P60-specific cutting preset in the supplied PDF. Enter its cutting speed and feed manually.",
      "The selected insert/holder combination determines the point angle. P60 and 90° CT inserts can share a holder. 82°, 100°, 120°, 142° and WSP combinations are outside this prototype.",
      "NC Spot Drill inserts are offset from the holder centre. Nominal cone geometry does not reproduce every actual cutting profile.",
      "No ACE tip correction, minimum diameter, Cmax or depth table is reused.",
      "The first version limits chamfer compensation to 90° holders and the local straight-edge model.",
      "The CT-series NC40 and NC60 spotting diagrams show 1 mm tip clearance. The P60 specification page does not state that same minimum. Chamfering requires 1 mm tip clearance.",
      "H-type supporting-edge feed increases are not applied automatically. The copied feed range remains the unboosted catalog range.",
      "Heat resistant alloy has no catalog spotting feed; do not invent a spotting recommendation."
    ]
  };
})();

if (typeof module !== "undefined") module.exports = NC_SPOT_DATA;
