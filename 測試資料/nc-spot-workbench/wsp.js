/* WSP 專用資料、計算與剖面圖：依 2025–2026 英文型錄印刷頁 42、43、54 核對。
 * WSP 的 Lreq = Dreq × 0.5 − P 是型錄直接給的複合刀刃公式。
 * 不借用一般點鑽的理論錐尖、實測校正或沿輪廓補正模型；145° 與 90° 刀刃不能合併成單一錐角。
 */
const NC_SPOT_WSP = (() => {
  "use strict";
  const EPSILON = 1e-9;
  const source = Object.freeze({
    title: "NC Spot Drill · WSP · 2025–2026 English catalog",
    pdf: "./sources/NC-Spot-Drill-2025-2026-ENG.pdf",
    version: "2025–2026 ENG", checked: "2026-11-05",
    specificationPage: 42, specificationPdfPage: 15,
    applicationPage: 43, applicationPdfPage: 16,
    formulaPage: 54, formulaPdfPage: 19
  });
  const materials = [
    { id: "carbonSteel", label: "Carbon steel", iso: "P", vc: [150, 300], feed: [.05, .15], grade: "NC2033" },
    { id: "alloySteel", label: "Alloy steel", iso: "P", vc: [120, 250], feed: [.05, .10], grade: "NC2033" },
    { id: "stainless", label: "Stainless steel", iso: "M", vc: [80, 150], feed: [.04, .08], grade: "NC2033" },
    { id: "castIron", label: "Cast iron", iso: "K", vc: [100, 200], feed: [.05, .10], grade: "NC2033" },
    { id: "hardened", label: "Hardened steel · HRC < 50", iso: "H", vc: [30, 60], feed: [.03, .08], grade: "NC2033", maxHardnessExclusive: 50 }
  ];
  // L 為 WSP 裝配圖的總長與公差，不能當作可加工深度或裸刀柄長度。
  const holders = [
    { id: "nc10", code: "603001", part: "00-99616-10", base: "N9MT0802", shankDiameter: 10, assembledLength: 89.08, lengthTolerance: .29, screw: "NS-30055", torque: 2, key: "NK-T8" },
    { id: "nc10inch", code: "613001", part: "00-99616-3/8", base: "N9MT0802", shankDiameter: 9.525, shankLabel: '3/8"', assembledLength: 89.08, lengthTolerance: .29, screw: "NS-30055", torque: 2, key: "NK-T8" },
    { id: "nc14", code: "604004", part: "00-99616-14", base: "N9MT11T3", shankDiameter: 16, assembledLength: 97.55, lengthTolerance: .55, screw: "NS-35080", torque: 2.5, key: "NK-T15" },
    { id: "nc14inch", code: "614002", part: "00-99616-14-5/8", base: "N9MT11T3", shankDiameter: 15.875, shankLabel: '5/8"', assembledLength: 97.55, lengthTolerance: .55, screw: "NS-35080", torque: 2.5, key: "NK-T15" },
    { id: "nc22", code: "606001", part: "00-99616-22", base: "N9MT1704", shankDiameter: 20, assembledLength: 96.24, lengthTolerance: .64, screw: "NS-50125", torque: 5.5, key: "NK-T20" },
    { id: "nc22inch", code: "616001", part: "00-99616-22-3/4", base: "N9MT1704", shankDiameter: 19.05, shankLabel: '3/4"', assembledLength: 96.24, lengthTolerance: .64, screw: "NS-50125", torque: 5.5, key: "NK-T20" }
  ].map(holder => ({ ...holder, sourcePage: 42, pdfPage: 15 }));

  // 欄位：ID、Code、完整刀片基碼、螺紋、名目牙徑、D1、P、Dmax、Tmax、牙距或TPI。
  const metricRows = [
    ["m4", "013203", "N9MT0802M04C", "M4×0.7", 4, 3.30, 1.17, 8, 2.8, .7],
    ["m5", "013204", "N9MT0802M05C", "M5×0.8", 5, 4.20, 1.48, 8, 2.5, .8],
    ["m6", "013205", "N9MT0802M06C", "M6×1.0", 6, 5.00, 1.76, 8, 2.2, 1],
    ["m8", "014219", "N9MT11T3M08C", "M8×1.25", 8, 6.80, 2.39, 13, 4.1, 1.25],
    ["m10", "014220", "N9MT11T3M10C", "M10×1.5", 10, 8.50, 2.97, 13, 3.5, 1.5],
    ["m12", "016205", "N9MT1704M12C", "M12×1.75", 12, 10.25, 3.59, 20, 6.4, 1.75],
    ["m14", "016206", "N9MT1704M14C", "M14×2.0", 14, 12.00, 4.19, 20, 5.8, 2],
    ["m16", "016207", "N9MT1704M16C", "M16×2.0", 16, 14.00, 4.88, 20, 5.1, 2]
  ];
  const uncRows = [
    ["unc25", "014221", "N9MT11T3UNC25", "1/4-20 UNC", 6.35, 5.08, 1.80, 13, 4.6, 20],
    ["unc31", "014222", "N9MT11T3UNC31", "5/16-18 UNC", 7.9375, 6.53, 2.30, 13, 4.2, 18],
    ["unc38", "014223", "N9MT11T3UNC38", "3/8-16 UNC", 9.525, 7.94, 2.78, 13, 3.7, 16]
  ];
  function variantFrom(row, threadSystem) {
    const [id, code, partBase, threadLabel, nominalThreadDiameter, d1, p, maxDiameter, maxDepth, threadIncrement] = row;
    const base = partBase.startsWith("N9MT0802") ? "N9MT0802" : partBase.startsWith("N9MT11T3") ? "N9MT11T3" : "N9MT1704";
    return {
      id, code, part: `${partBase}-NC2033`, label: `${partBase}-NC2033 · ${threadLabel}`,
      base, familyId: base === "N9MT0802" ? "wsp0802" : base === "N9MT11T3" ? "wsp11t3" : "wsp1704",
      threadSystem, threadLabel, nominalThreadDiameter,
      threadPitch: threadSystem === "metric" ? threadIncrement : 25.4 / threadIncrement,
      tpi: threadSystem === "UNC" ? threadIncrement : null,
      preDrillDiameter: d1, preDrillTolerance: .05, d1, p, P: p, maxDiameter, maxDepth,
      recommendedDiameter: nominalThreadDiameter * 1.05,
      holderIds: holders.filter(holder => holder.base === base).map(holder => holder.id),
      grade: "NC2033", coating: "TiAlN", carbideGrade: "K20F", indexableEdges: 2,
      pointAngle: 145, chamferAngle: 90, sourcePage: 42, pdfPage: 15,
      formulaPage: 54, formulaPdfPage: 19
    };
  }
  const variants = [...metricRows.map(row => variantFrom(row, "metric")), ...uncRows.map(row => variantFrom(row, "UNC"))];
  const families = [
    { id: "wsp0802", base: "N9MT0802", label: "N9MT0802M · WSP", holderIds: ["nc10", "nc10inch"] },
    { id: "wsp11t3", base: "N9MT11T3", label: "N9MT11T3M / UNC · WSP", holderIds: ["nc14", "nc14inch"] },
    { id: "wsp1704", base: "N9MT1704", label: "N9MT1704M · WSP", holderIds: ["nc22", "nc22inch"] }
  ].map(family => ({ ...family, variantIds: variants.filter(variant => variant.familyId === family.id).map(variant => variant.id) }));
  const data = {
    source, variants, families, materials, holders, grade: "NC2033", feedUnit: "mm/rev", fixedFactor: .5,
    pointAngle: 145, chamferAngle: 90,
    limitations: [
      "WSP combines a 145° spotting face with a 90° chamfer face. It is not a single-angle cone.",
      "D1 is the nominal tap pre-drill / transition diameter with ±0.05 mm catalog tolerance.",
      "The listed Dmax, Tmax and P are checked together. Their rounded values can produce a slightly lower effective Dreq limit.",
      "The 5% example means Dreq = 1.05 × nominal thread diameter, not C = 5% of diameter.",
      "The catalog WSP formula defines Z from the WSP insert tip. Ordinary-point corrections and G41/G42 contour offsets are not used.",
      "The diagram identifies the two faces and the P reference; the exact tip radius / rotated assembly profile is not reconstructed."
    ]
  };

  function finiteNumber(value) {
    if (typeof value !== "number" && typeof value !== "string") return null;
    if (typeof value === "string" && value.trim() === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  function positiveNumber(value) {
    const number = finiteNumber(value);
    return number !== null && number > 0 ? number : null;
  }
  function calculate(input = {}) {
    const variant = variants.find(item => item.id === input.variantId || item.part === input.variantId) || null;
    const suppliedMaterial = input.materialId !== undefined && input.materialId !== null;
    const material = materials.find(item => item.id === input.materialId) || null;
    const diameter = positiveNumber(input.diameter), vc = positiveNumber(input.vc), feedPerRev = positiveNumber(input.feed);
    const geometryErrors = [], cuttingErrors = [], warnings = [];
    if (!variant) geometryErrors.push("Choose a catalog-listed WSP insert.");
    if (diameter === null) geometryErrors.push("Enter a positive required diameter Dreq.");
    if (vc === null) cuttingErrors.push("Enter a positive cutting speed Vc.");
    if (feedPerRev === null) cuttingErrors.push("Enter a positive feed per revolution f.");
    if (suppliedMaterial && !material) cuttingErrors.push("Choose a material listed in the dedicated WSP cutting table.");

    const p = variant?.p ?? null;
    const minDiameter = variant?.d1 ?? null;
    const catalogMaxDiameter = variant?.maxDiameter ?? null;
    const maxDepth = variant?.maxDepth ?? null;
    const maxDiameter = variant ? Math.min(variant.maxDiameter, 2 * (variant.maxDepth + variant.p)) : null;
    const depth = variant && diameter !== null ? diameter * .5 - variant.p : null;
    const chamferWidth = variant && diameter !== null ? (diameter - variant.d1) / 2 : null;
    if (variant && diameter !== null) {
      // 型錄公式以 90° 外刃上的 Dreq 定義深度；Dreq 小於 D1 時不能沿用這個固定係數。
      if (diameter < variant.d1 - EPSILON) geometryErrors.push("Dreq is below the nominal D1 transition. The catalog's 90°-face depth formula is not used inside the 145° face.");
      if (diameter > variant.maxDiameter + EPSILON) geometryErrors.push("Dreq exceeds this insert's catalog Dmax.");
      if (!Number.isFinite(depth) || depth <= 0) geometryErrors.push("The required diameter does not produce a positive WSP insert-tip depth.");
      if (Number.isFinite(depth) && depth > variant.maxDepth + EPSILON) geometryErrors.push(`Lreq exceeds catalog Tmax ${variant.maxDepth} mm. The effective Dreq limit is ${Number(maxDiameter.toFixed(4))} mm.`);
      if (Math.abs(diameter - variant.d1) <= EPSILON) warnings.push("Dreq equals nominal D1; increase Dreq to create a 90° chamfer band. D1 has ±0.05 mm catalog tolerance.");
    }
    if (material) {
      if (vc !== null && (vc < material.vc[0] - EPSILON || vc > material.vc[1] + EPSILON)) warnings.push("Vc is outside the dedicated WSP catalog range.");
      if (feedPerRev !== null && (feedPerRev < material.feed[0] - EPSILON || feedPerRev > material.feed[1] + EPSILON)) warnings.push("Feed per revolution is outside the dedicated WSP catalog range.");
      if (material.maxHardnessExclusive) {
        const hardness = finiteNumber(input.hardness);
        if (hardness !== null && hardness >= material.maxHardnessExclusive) cuttingErrors.push("The dedicated WSP hardened-steel table is for HRC below 50.");
        else warnings.push("The hardened-steel recommendation applies only below HRC 50.");
      }
    }
    const rawSpindle = diameter !== null && vc !== null ? 1000 * vc / (Math.PI * diameter) : null;
    const spindle = rawSpindle !== null && Number.isFinite(rawSpindle) && rawSpindle >= .5 ? Math.round(rawSpindle) : null;
    const feedRate = spindle !== null && feedPerRev !== null && Number.isFinite(spindle * feedPerRev) ? spindle * feedPerRev : null;
    if (rawSpindle !== null && spindle === null) cuttingErrors.push("The spindle calculation is outside a usable finite range.");
    if (spindle !== null && feedPerRev !== null && feedRate === null) cuttingErrors.push("The feed calculation is outside a finite range.");
    const geometryValid = geometryErrors.length === 0;
    const cuttingValid = cuttingErrors.length === 0 && spindle !== null && feedRate !== null;
    // 145° 的構圖僅說明名義角度；P 已由型錄給定，不由 D1 或 145° 反推。
    const nominal145Ratio = 1 / Math.tan(145 * Math.PI / 360);
    const transitionDepth = chamferWidth;
    const nominal145PointDepth = variant && transitionDepth !== null ? transitionDepth + variant.d1 / 2 * nominal145Ratio : null;
    return {
      valid: geometryValid && cuttingValid, geometryValid, cuttingValid,
      errors: [...geometryErrors, ...cuttingErrors], geometryErrors, cuttingErrors, warnings,
      operation: "wsp", variant, variantId: variant?.id ?? null, material, materialId: material?.id ?? null,
      diameter, D: diameter, d1: minDiameter, preDrillDiameter: minDiameter, transitionDiameter: minDiameter,
      p, P: p, fixedFactor: .5, depth, Lreq: depth, actualDepth: depth,
      z: depth !== null && Number.isFinite(depth) ? -depth : null,
      datum: "catalog-wsp-insert-tip", depthReference: "Catalog WSP insert tip; Z0 = work surface",
      minDiameter, maxDiameter, catalogMaxDiameter, maxDepth,
      recommendedDiameter: variant?.recommendedDiameter ?? null,
      pointAngle: 145, chamferAngle: 90, chamferWidth, chamferHeight: chamferWidth,
      transitionDepth, nominal145PointDepth,
      section90: { includedAngle: 90, width: chamferWidth, height: chamferWidth },
      section145: { includedAngle: 145, nominalTransitionDiameter: minDiameter, nominalTransitionDepth: transitionDepth, nominalPointDepth: nominal145PointDepth },
      vc, feedPerRev, rawSpindle, spindle, feedRate, feed: feedRate,
      grade: "NC2033", indexableEdges: 2, source
    };
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  }
  const format = (value, digits = 4) => Number.isFinite(value) ? String(Number(value.toFixed(digits))) : "—";
  function renderSection(result = {}) {
    const title = `WSP 145° + 90° section${result.variant?.threadLabel ? ` · ${result.variant.threadLabel}` : ""}`;
    const safeTitle = escapeHTML(title);
    if (!result.geometryValid || ![result.diameter, result.d1, result.depth, result.p].every(value => Number.isFinite(value) && value > 0)) {
      const message = result.geometryErrors?.length ? result.geometryErrors.join(" ") : "Choose a WSP insert and a valid required diameter Dreq.";
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 430" role="img" aria-labelledby="wspSectionTitle wspSectionDesc"><title id="wspSectionTitle">${safeTitle}</title><desc id="wspSectionDesc">${escapeHTML(message)}</desc><rect x="24" y="24" width="672" height="382" rx="12" fill="#f5f9fc"/><text x="360" y="190" text-anchor="middle" fill="#0c2237" font-family="Arial,sans-serif" font-size="20">WSP 145° + 90°</text><text x="360" y="224" text-anchor="middle" fill="#5c7183" font-family="Arial,sans-serif" font-size="16">Set Dreq within the selected insert's range.</text></svg>`;
    }
    const s = 340 / result.diameter;
    const cx = 320, y0 = 124, left = cx - result.diameter / 2 * s, right = cx + result.diameter / 2 * s;
    const halfD1 = result.d1 / 2 * s;
    const kinkY = y0 + result.chamferWidth * s;
    const actualY = y0 + result.depth * s;
    const theoreticalY = y0 + result.diameter / 2 * s;
    const nominalY = y0 + (result.nominal145PointDepth ?? result.depth) * s;
    const kl = cx - halfD1, kr = cx + halfD1;
    const values = [s, cx, y0, left, right, halfD1, kinkY, actualY, theoreticalY, nominalY, kl, kr];
    if (!values.every(Number.isFinite)) return renderSection({ geometryValid: false, geometryErrors: ["The section cannot be drawn from non-finite dimensions."] });
    const n = value => format(value, 3);
    const materialPath = `M44 ${y0} H${n(left)} L${n(kl)} ${n(kinkY)} L${cx} ${n(nominalY)} L${n(kr)} ${n(kinkY)} L${n(right)} ${y0} H652 V350 H44 Z`;
    const voidPath = `M${n(left)} ${y0} L${n(kl)} ${n(kinkY)} L${cx} ${n(nominalY)} L${n(kr)} ${n(kinkY)} L${n(right)} ${y0} Z`;
    const desc = `${title}. Dreq ${format(result.diameter)} mm, D1 ${format(result.d1)} mm, catalog P ${format(result.p)} mm. Lreq = Dreq × 0.5 − P = ${format(result.depth)} mm; insert-tip Z ${format(result.z)} mm from the work surface. The outer face is 90° and inner spotting face is 145°. The small tip profile is schematic; P is taken from the catalog, not reconstructed from the nominal face. No contour compensation or holder clearance verification is included.`;
    const actualMid = (y0 + actualY) / 2;
    const pMid = (actualY + theoreticalY) / 2;
    return `<svg xmlns="http://www.w3.org/2000/svg" class="wsp-responsive" viewBox="0 0 720 430" role="img" aria-labelledby="wspSectionTitle wspSectionDesc">
      <title id="wspSectionTitle">${safeTitle}</title><desc id="wspSectionDesc">${escapeHTML(desc)}</desc>
      <style>
        /* 手機沿用同一組剖面與尺寸，只放大關鍵標示；長說明由外部圖說承接。 */
        @media (max-width: 575px) {
          .wsp-responsive .wsp-key-label { font-size: 32px; }
          .wsp-responsive .wsp-angle-label { font-size: 30px; }
          .wsp-responsive .wsp-context-label { font-size: 28px; }
          .wsp-responsive .wsp-key-label, .wsp-responsive .wsp-angle-label, .wsp-responsive .wsp-context-label { paint-order: stroke; stroke: #fff; stroke-width: 4px; stroke-linejoin: round; }
          .wsp-responsive .wsp-bottom-label { transform: translateY(16px); }
          .wsp-responsive .wsp-mobile-hide { display: none; }
        }
      </style>
      <defs><pattern id="wspMaterialHatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0V9" stroke="#b9cedd" stroke-width="1"/></pattern><marker id="wspDimensionArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#0067ad"/></marker></defs>
      <g font-family="Arial,sans-serif" font-size="16" fill="#3b5f78">
        <path d="${materialPath}" fill="#edf3f7" stroke="#adc4d5"/><path d="${materialPath}" fill="url(#wspMaterialHatch)"/>
        <path d="${voidPath}" fill="#e9f4fb"/>
        <path d="M44 ${y0}H660 M${cx} 36V340" fill="none" stroke="#7ea8c6" stroke-dasharray="5 5"/>
        <path d="M${n(kl)} ${n(kinkY)}L${cx} ${n(theoreticalY)}L${n(kr)} ${n(kinkY)}" fill="none" stroke="#82a8c3" stroke-width="1.5" stroke-dasharray="6 5"/>
        <path d="M${n(left)} ${y0}L${n(kl)} ${n(kinkY)} M${n(kr)} ${n(kinkY)}L${n(right)} ${y0}" fill="none" stroke="#f05a1a" stroke-width="3.5"/>
        <path d="M${n(kl)} ${n(kinkY)}L${cx} ${n(nominalY)}L${n(kr)} ${n(kinkY)}" fill="none" stroke="#0067ad" stroke-width="3" stroke-dasharray="7 3"/>
        <path d="M${n(left)} 65V114 M${n(right)} 65V114" fill="none" stroke="#0067ad"/>
        <path d="M${n(left)} 72H${n(right)}" fill="none" stroke="#0067ad" marker-start="url(#wspDimensionArrow)" marker-end="url(#wspDimensionArrow)"/>
        <text class="wsp-key-label" x="${cx}" y="59" text-anchor="middle" font-size="18" font-weight="700" fill="#b53a0a">Dreq Ø${format(result.diameter)} mm</text>
        <text class="wsp-context-label" x="44" y="112"><tspan class="wsp-mobile-hide">Work surface · </tspan>Z0</text><text class="wsp-mobile-hide" x="${cx}" y="29" text-anchor="middle">Tool / hole center</text>
        <text class="wsp-mobile-hide" x="58" y="320">Material</text>
        <path d="M${n(kl)} ${n(kinkY + 8)}V366 M${n(kr)} ${n(kinkY + 8)}V366 M${n(kl)} 358H${n(kr)}" fill="none" stroke="#7ea8c6"/>
        <path d="M${n(kl)} 358H${n(kr)}" fill="none" stroke="#0067ad" marker-start="url(#wspDimensionArrow)" marker-end="url(#wspDimensionArrow)"/>
        <text class="wsp-key-label wsp-bottom-label" x="${cx}" y="382" text-anchor="middle">D1 Ø${format(result.d1)} mm<tspan class="wsp-mobile-hide"> · tap pre-drill / transition</tspan></text>
        <path d="M${n(right + 10)} ${y0}H553 M${cx + 8} ${n(actualY)}H553 M548 ${y0}V${n(actualY)}" fill="none" stroke="#0067ad"/>
        <path d="M548 ${y0}V${n(actualY)}" fill="none" stroke="#0067ad" marker-start="url(#wspDimensionArrow)" marker-end="url(#wspDimensionArrow)"/>
        <text class="wsp-key-label" x="570" y="${n(actualMid)}" text-anchor="middle" transform="rotate(-90 570 ${n(actualMid)})">Lreq ${format(result.depth)} mm</text>
        <path d="M${cx + 8} ${n(theoreticalY)}H626 M${cx + 8} ${n(actualY)}H626 M620 ${n(actualY)}V${n(theoreticalY)}" fill="none" stroke="#7ea8c6"/>
        <path d="M620 ${n(actualY)}V${n(theoreticalY)}" fill="none" stroke="#0067ad" marker-start="url(#wspDimensionArrow)" marker-end="url(#wspDimensionArrow)"/>
        <text class="wsp-key-label" x="644" y="${n(pMid)}" text-anchor="middle" transform="rotate(-90 644 ${n(pMid)})">P ${format(result.p)} mm</text>
        <circle cx="${cx}" cy="${n(actualY)}" r="4" fill="#f05a1a"/>
        <path d="M${cx - 5} ${n(theoreticalY - 5)}L${cx + 5} ${n(theoreticalY + 5)} M${cx + 5} ${n(theoreticalY - 5)}L${cx - 5} ${n(theoreticalY + 5)}" stroke="#7ea8c6"/>
        <text class="wsp-angle-label" x="${n(left - 7)}" y="${n(y0 + 28)}" text-anchor="end" fill="#b53a0a" font-weight="700">90°</text>
        <text class="wsp-angle-label" x="${cx}" y="${n(kinkY - 12)}" text-anchor="middle" fill="#0067ad" font-weight="700">145°</text>
        <text class="wsp-mobile-hide" x="${cx - 14}" y="${n(actualY + 20)}" text-anchor="end" fill="#b53a0a">Insert tip · Z ${format(result.z)}</text>
        <text class="wsp-mobile-hide" x="${cx - 14}" y="${n(theoreticalY + 19)}" text-anchor="end">90° theoretical intersection</text>
        <text class="wsp-mobile-hide" x="44" y="414" font-size="15">Compound section schematic · tip profile not reconstructed · dimensions in mm</text>
      </g></svg>`;
  }

  return Object.freeze({ data, calculate, renderSection });
})();

if (typeof module !== "undefined") module.exports = NC_SPOT_WSP;
