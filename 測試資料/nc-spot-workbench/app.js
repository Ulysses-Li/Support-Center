/* NC Spot Drill 本機樣板：只組合型錄資料、計算核心與剖面圖。
 * 刀具、材質與校正基準互相連動；所有結果及複製內容都由同一份計算結果產生。
 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const data = NC_SPOT_DATA, core = NC_SPOT_CORE;
  const wsp = NC_SPOT_WSP;
  const wspMaterialMap = { carbonLow: "carbonSteel", carbonHigh: "carbonSteel", lowAlloy: "alloySteel", highAlloy: "alloySteel", stainless: "stainless", castIron: "castIron", hardened: "hardened" };
  // WSP 以獨立公式管理；只把選型資料轉為共同表單結構，不併入普通錐尖幾何。
  const wspFamilies = wsp.data.families.map(family => {
    const variants = wsp.data.variants.filter(item => item.familyId === family.id);
    return {
      id: family.id, familyLabel: family.label, angle: 145, angleLabel: "145° + 90°", geometryMode: "wsp",
      operations: ["wsp"], maxDiameter: Math.max(...variants.map(item => item.maxDiameter)),
      sourcePage: 42, pdfPage: 15, cuttingSourcePage: 54, cuttingPdfPage: 19,
      sourcePdf: wsp.data.source.pdf, sourceVersion: wsp.data.source.version,
      manualInput: false, recommendedByMaterial: {},
      materialCompatibilityNote: "Dedicated WSP cutting table · NC2033 · mm/rev.",
      holders: wsp.data.holders.filter(item => family.holderIds.includes(item.id)).map(item => ({ ...item, length: item.assembledLength, shank: "Steel", assembled: true })),
      inserts: variants.map(item => ({ ...item, id: item.part, wspVariantId: item.id, materialIds: Object.keys(wspMaterialMap), materialRatings: {}, materialMaxHardness: 50, minSpotDepth: null }))
    };
  });
  const allSeries = [...data.series, ...wspFamilies];
  const controls = Object.fromEntries(["operation", "material", "angle", "series", "insert", "holder", "diameter", "vc", "feedPerRev", "chamferWidth", "contactReference", "datum", "referenceDiameter", "referenceDepth"].map(id => [id, $(id)]));
  const finite = core.finiteNumber;
  const format = (value, digits = 4) => Number.isFinite(value) ? Number(value.toFixed(digits)).toLocaleString("en-US", { maximumFractionDigits: digits }) : "—";
  const plain = (value, digits = 8) => Number.isFinite(value) ? String(Number(value.toFixed(digits))) : "";
  const midpoint = range => (range[0] + range[1]) / 2;
  const rangeLabel = range => range ? `${plain(range[0])}–${plain(range[1])}` : "Not listed";
  const sourceURL = (page, pdf) => new URL(`${pdf || selected().series?.sourcePdf || data.source.pdf}${page ? `#page=${page}` : ""}`, location.href).href;
  let copyText = "", previousReference = "upper", latestResult = null;
  let calibrationAssembly = null;
  let needsAssemblyConfirmation = false;

  // 用原生 Option 寫入資料，避免產品料號或標籤被當成 HTML。
  function fillOptions(select, entries, requested) {
    select.replaceChildren(...entries.map(([value, label]) => new Option(label, value)));
    select.value = entries.some(([value]) => value === requested) ? requested : (entries[0]?.[0] ?? "");
    select.disabled = !entries.length;
  }
  function selected() {
    const series = allSeries.find(item => item.id === controls.series.value);
    const material = data.materials.find(item => item.id === controls.material.value);
    const insert = series?.inserts.find(item => item.id === controls.insert.value);
    const holder = series?.holders.find(item => item.part === controls.holder.value);
    const operation = controls.operation.value;
    const wspMaterial = series?.geometryMode === "wsp" ? wsp.data.materials.find(item => item.id === wspMaterialMap[material?.id]) : null;
    // 改製參考只帶入母型號同牌號有標示、且 P60 本身也列出的材料，不擴大適用範圍。
    const referenceAvailable = !series?.cuttingReference || (series.cuttingReference.grade === insert?.grade && series.cuttingReference.materialIds.includes(material?.id));
    const feedRange = referenceAvailable ? (wspMaterial?.feed ?? data.feedTables[series?.feedTable]?.[material?.id]?.[operation] ?? null) : null;
    const vcRange = series?.geometryMode === "wsp" ? (wspMaterial?.vc ?? null) : material?.vc;
    const manualInput = series?.manualInput === true || !referenceAvailable;
    const materialConfirmed = insert?.materialIds.includes(material?.id) === true;
    return { series, material, insert, holder, operation, feedRange, vcRange, wspMaterial, manualInput, materialConfirmed };
  }
  function assemblyKey() {
    return `${selected().series.angle}|${controls.series.value}|${controls.holder.value}|${controls.insert.value}`;
  }
  function clearMeasuredReference() {
    // 換刀柄／刀片後，舊的 Dref/tref 不可沿用到新組裝。
    if (calibrationAssembly !== null && calibrationAssembly !== assemblyKey()) {
      controls.datum.value = "theoretical";
      controls.referenceDiameter.value = "";
      controls.referenceDepth.value = "";
      calibrationAssembly = null;
    }
  }
  function refreshToolOptions({ preferRecommendation = false } = {}) {
    const operation = controls.operation.value;
    const previousSeries = controls.series.value;
    const operationSeries = allSeries.filter(item => item.operations.includes(operation));
    const angles = [...new Set(operationSeries.map(item => item.angle))].sort((a, b) => a - b);
    const angleEntries = angles.length > 1 ? [["all", "All angles"], ...angles.map(value => [String(value), `${value}°`])] : angles.map(value => [String(value), operationSeries[0].angleLabel || `${value}°`]);
    fillOptions(controls.angle, angleEntries, controls.angle.value || "all");
    controls.angle.disabled = angles.length === 1;
    const availableSeries = operationSeries.filter(item => controls.angle.value === "all" || item.angle === Number(controls.angle.value));
    const requestedSeries = availableSeries.some(item => item.id === previousSeries) ? previousSeries : (availableSeries.some(item => item.id === "nc10") ? "nc10" : availableSeries[0].id);
    fillOptions(controls.series, availableSeries.map(item => [item.id, `${item.familyLabel} · Ø${plain(item.maxDiameter)} max`]), requestedSeries);
    const series = allSeries.find(item => item.id === controls.series.value);
    const previousMaterial = controls.material.value;
    // 保留材料與完整型號，不把找不到推薦牌號的刀具藏起來或偷偷換掉工件材質。
    const materials = data.materials;
    fillOptions(controls.material, materials.map(item => [item.id, item.label]), previousMaterial || "carbonLow");
    const inserts = series.inserts;
    const preferred = preferRecommendation ? (series.recommendedByMaterial[controls.material.value] || controls.insert.value) : controls.insert.value;
    fillOptions(controls.insert, inserts.map(item => [item.id, item.label]), preferred || series.recommendedByMaterial[controls.material.value]);
    fillOptions(controls.holder, series.holders.map(item => [item.part, `${item.part} · ${item.thread || `Ø${item.shankLabel || plain(item.shankDiameter)}`} · ${item.assembled ? "assembled L" : "L"} ${plain(item.length)} mm`]), controls.holder.value);
    clearMeasuredReference();
  }
  function setCuttingPresets() {
    const { material, feedRange, vcRange, manualInput, materialConfirmed } = selected();
    controls.vc.value = material && !manualInput && materialConfirmed && feedRange ? plain(midpoint(vcRange)) : "";
    controls.feedPerRev.value = feedRange && materialConfirmed ? plain(midpoint(feedRange)) : "";
  }
  function fitDiameter() {
    const { series, insert, operation } = selected();
    const maximum = insert?.maxDiameter ?? series?.maxDiameter;
    if (!maximum) return;
    const current = finite(controls.diameter.value);
    const minimum = insert?.minDiameter ?? series?.minDiameter ?? 0;
    if (series.geometryMode === "wsp") {
      const variant = wsp.data.variants.find(item => item.id === insert.wspVariantId);
      const upper = Math.min(variant.maxDiameter, 2 * (variant.maxDepth + variant.p));
      if (current === null || current < variant.d1 || current > upper) controls.diameter.value = plain(variant.recommendedDiameter);
    } else if (current === null || current <= 0 || current < minimum || current > maximum) controls.diameter.value = plain(Math.max(minimum, Math.min(6, maximum)));
    if (operation === "chamfering") {
      const width = finite(controls.chamferWidth.value);
      if (width === null || width <= 0) controls.chamferWidth.value = "0.5";
    }
  }
  function calculateSelection() {
    const selection = selected();
    const { series, insert, material, feedRange, vcRange, operation, manualInput, materialConfirmed, wspMaterial } = selection;
    if (series.geometryMode === "wsp") {
      const result = wsp.calculate({ variantId: insert.wspVariantId, diameter: controls.diameter.value, vc: controls.vc.value, feed: controls.feedPerRev.value, materialId: wspMaterial?.id || "unlisted" });
      Object.assign(result, { isNominal: false, angle: 145, maxD: result.maxDiameter, minD: result.minDiameter });
      return { ...selection, result, referenceDiameter: null, referenceDepth: null, referenceValid: true, referenceProblem: "" };
    }
    const referenceDiameter = finite(controls.referenceDiameter.value);
    const referenceDepth = finite(controls.referenceDepth.value);
    const measured = controls.datum.value === "measured";
    const ratio = series.angle === 90 ? 1 : 1 / Math.tan(series.angle * Math.PI / 360);
    const referenceMinimumDiameter = insert.minDiameter ?? series.minDiameter ?? 0;
    const referenceValid = referenceDiameter !== null && referenceDiameter > 0 && referenceDiameter >= referenceMinimumDiameter - 1e-9 && referenceDepth !== null && referenceDepth > 0 && referenceDiameter <= insert.maxDiameter && referenceDepth <= insert.maxDepth + 1e-9 && (insert.minSpotDepth === null || referenceDepth >= insert.minSpotDepth - 1e-9);
    const referenceProblem = measured && !referenceValid ? `Enter a measured diameter ${referenceMinimumDiameter ? `from ${format(referenceMinimumDiameter)}` : "above 0 and"} up to ${format(insert.maxDiameter)} mm, with depth ${insert.minSpotDepth ? `from ${format(insert.minSpotDepth)}` : "above 0 and"} up to ${format(insert.maxDepth)} mm. The reference point must be within this insert's catalog limits.` : "";
    const tipOffset = measured && referenceValid ? referenceDiameter * ratio / 2 - referenceDepth : null;
    const result = core.calculate({
      operation, angle: series.angle, diameter: controls.diameter.value,
      vc: controls.vc.value, feed: controls.feedPerRev.value,
      width: controls.chamferWidth.value, reference: controls.contactReference.value,
      datum: controls.datum.value, tipOffset, maxDiameter: insert.maxDiameter,
      minSpotDepth: insert.minSpotDepth, minClearance: series.angle === 90 ? series.minChamferClearance : 0,
      minDiameter: insert.minDiameter ?? series.minDiameter,
      vcRange: manualInput ? null : vcRange, feedRange
    });
    if (!feedRange && !manualInput) {
      result.valid = false; result.cuttingValid = false;
      result.errors.push("No catalog feed is listed for this operation and material.");
    }
    if (!materialConfirmed) {
      result.valid = false; result.cuttingValid = false;
      result.errors.push("This insert / material match is not confirmed in the catalog data. Choose a listed material or a different insert.");
    }
    if (needsAssemblyConfirmation) {
      result.valid = false; result.geometryValid = false;
      result.errors.push("This insert fits multiple assembly angles. Choose the model / angle in the part-number results.");
    }
    // Tmax 是實際工具深度限制，不能拿未知刀尖修正的理論尖點深度直接比較。
    if (measured && referenceValid && (referenceDepth > insert.maxDepth + 1e-9 || (result.actualDepth !== null && result.actualDepth > insert.maxDepth + 1e-9))) {
      result.valid = false; result.geometryValid = false;
      result.geometryErrors.push("The measured reference or calculated depth exceeds catalog Tmax.");
      result.errors.push("The measured reference or calculated depth exceeds catalog Tmax.");
    }
    return { ...selection, result, referenceDiameter, referenceDepth, referenceValid, referenceProblem };
  }

  function render() {
    const state = calculateSelection();
    const { series, insert, holder, material, operation, feedRange, vcRange, result, manualInput, materialConfirmed } = state;
    latestResult = result;
    const chamfer = operation === "chamfering", isWsp = operation === "wsp", measured = !isWsp && controls.datum.value === "measured";
    const angleText = series.angleLabel || `${series.angle}°`;
    const validGeometry = result.geometryValid;
    document.body.classList.toggle("chamfer-active", chamfer);
    $("chamferInputs").hidden = !chamfer;
    $("chamferOutput").hidden = !chamfer;
    $("compensationNote").hidden = !chamfer;
    $("referenceSettings").hidden = isWsp;
    $("wspInputs").hidden = !isWsp;
    $("wspD1Spec").hidden = !isWsp;
    $("wspPSpec").hidden = !isWsp;
    $("measuredInputs").hidden = !measured;
    $("diameterLabel").textContent = isWsp ? "Required diameter" : chamfer ? "Contact Ø" : "Spot diameter";
    $("cuttingTitle").textContent = isWsp ? "WSP diameter & cutting values" : chamfer ? "Chamfer & cutting values" : "Cutting values";
    $("chamferWidthLabel").textContent = series.angle === 90 ? "Chamfer size C × 45°" : `Horizontal width W × ${format(90 - series.angle / 2)}°`;
    $("materialBadge").textContent = material.iso;
    $("materialBadge").dataset.iso = material.iso;
    $("angleTag").textContent = angleText;
    $("toolHint").textContent = `Matched insert + holder · ${holder.shank} · ${holder.shankLabel || (holder.shankDiameter ? `Ø${plain(holder.shankDiameter)} mm` : holder.thread)}`;
    const rating = data.ratingLabels[insert.materialRatings[material.id]];
    $("gradeHint").textContent = materialConfirmed ? `${rating ? `${rating} catalog match for this material.` : (series.materialCompatibilityNote || "Catalog-listed application.")}${material.id === "hardened" && insert.materialMaxHardness ? ` Check hardness < HRC ${insert.materialMaxHardness}.` : ""}` : `No confirmed ${material.label.toLowerCase()} match for this insert in the catalog data. ${series.materialCompatibilityNote || "Choose a listed material or another insert."}`;
    $("toolSpecLink").href = sourceURL(series.pdfPage);
    $("toolSpecLink").textContent = `View ${series.familyLabel} · catalog p. ${series.sourcePage} ↗`;
    $("presetNotice").hidden = !manualInput && !series.cuttingReference;
    $("presetNotice").textContent = series.cuttingReference ? manualInput ? "No matching NC40 CT reference entry for this material. Enter Vc and f from your established setup." : "P60 is reground from N9MT11T3CT. Starting Vc and f use the NC40 CT reference table; adjust them for your setup." : "Manual cutting values: no dedicated range has been confirmed for this model. Enter Vc and f from your established setup.";
    $("presetNote").textContent = isWsp ? "WSP uses its dedicated cutting table and catalog P formula. Choose the thread variant before setting Dreq." : manualInput ? "This model uses your manual cutting values for this material." : series.cuttingReference ? "Changing the material restores available NC40 CT reference starting values. P60 dimensions stay editable." : "Changing the model or material restores its available catalog cutting values. Dimensions stay editable.";
    $("diameterHint").textContent = isWsp ? `Dreq Ø${format(result.minDiameter)}–${format(result.maxDiameter)} mm · Dmax / Tmax checked together` : chamfer ? (result.minD !== null && result.maxD !== null ? `Local contact range Ø${format(result.minD)}–${format(result.maxD)} mm` : `Catalog Dmax ${format(insert.maxDiameter)} mm`) : `Catalog Ø${format(insert.minDiameter ?? series.minDiameter ?? 0)}–${format(insert.maxDiameter)} mm${!(insert.minDiameter ?? series.minDiameter) ? " · lower limit unconfirmed" : ""}`;
    $("vcHint").textContent = manualInput ? "Manual value · m/min" : `${rangeLabel(vcRange)} m/min${series.cuttingReference ? " · CT reference" : ""}`;
    $("feedHint").textContent = manualInput ? "Manual value · mm/rev" : `${rangeLabel(feedRange)} mm/rev${series.cuttingReference ? " · CT reference" : ""}`;
    $("diameterError").textContent = result.geometryErrors.filter(text => /diameter|offset|clearance|depth|reach|contact/i.test(text)).join(" ");
    controls.diameter.classList.toggle("is-invalid", !validGeometry);
    controls.diameter.setAttribute("aria-invalid", String(!validGeometry));
    for (const field of ["vc", "feedPerRev"]) {
      // 缺少專用預設時，尚未輸入不是操作錯誤；輸入零或無效值才顯示紅框。
      const emptyManualValue = manualInput && controls[field].value.trim() === "";
      const invalid = !emptyManualValue && (finite(controls[field].value) === null || Number(controls[field].value) <= 0);
      controls[field].classList.toggle("is-invalid", invalid);
      controls[field].setAttribute("aria-invalid", String(invalid));
    }
    const range = $("diameterRange");
    const rangeMin = Math.ceil((result.minD ?? 0.1) * 10 - 1e-8) / 10;
    const rangeMax = Math.floor((result.maxD ?? insert.maxDiameter) * 10 + 1e-8) / 10;
    range.disabled = !Number.isFinite(rangeMin) || !Number.isFinite(rangeMax) || rangeMin > rangeMax;
    if (!range.disabled) {
      range.min = plain(rangeMin); range.max = plain(rangeMax);
      range.value = controls.diameter.value;
      range.setAttribute("aria-valuetext", `Contact diameter ${format(finite(controls.diameter.value))} millimeters`);
    }
    $("referenceState").textContent = measured ? "Measured reference" : "Nominal geometry";
    $("referenceError").textContent = state.referenceProblem;
    for (const key of ["referenceDiameter", "referenceDepth"]) {
      controls[key].classList.toggle("is-invalid", measured && !state.referenceValid);
      controls[key].setAttribute("aria-invalid", String(measured && !state.referenceValid));
    }
    $("datumHint").textContent = measured ? "The reference applies to this holder and insert assembly, at the selected nominal angle." : "The catalog shows different tip sections by insert grade. Add a measured reference to relate the section to your tool-length setting.";
    const practicalWarnings = isWsp ? [...result.warnings] : result.warnings.filter(text => /outside/.test(text));
    if (insert.supportingEdgeFeedFactor) practicalWarnings.push("Supporting-edge feed increases are not applied automatically.");
    if (insert.minSpotDepth && operation === "spotting") practicalWarnings.push("NC40 / NC60: keep at least 1 mm tip clearance as shown in the catalog.");
    if (chamfer && series.angle !== 90) practicalWarnings.push("Check the actual tip avoidance for this angle. The catalog's 1 mm clearance illustration is drawn for a 90° assembly.");
    const visibleErrors = result.errors.filter(text => !(manualInput && ((controls.vc.value.trim() === "" && text === "Enter a positive cutting speed Vc.") || (controls.feedPerRev.value.trim() === "" && text === "Enter a positive feed per revolution f."))));
    $("calculationMessage").textContent = [...visibleErrors, ...practicalWarnings].join(" ");
    $("rpm").textContent = $("mobileRpm").textContent = result.valid ? format(result.spindle, 0) : "—";
    $("feedRate").textContent = $("mobileFeed").textContent = result.valid ? format(result.feedRate, 1) : "—";
    $("compensationR").textContent = validGeometry ? format(result.radius) : "—";
    $("zTarget").textContent = validGeometry ? format(result.z) : "—";
    $("zLabel").textContent = measured ? "Z from measured reference" : "Nominal Z";
    $("compensationHint").textContent = validGeometry ? `Radius R ${format(result.radius)} mm · diameter setting Ø${format(result.compensationDiameter)} mm` : "Check chamfer width, contact D and tool-length reference.";
    $("insertModel").textContent = insert.part;
    $("selectionSummary").textContent = `${holder.part} · ${material.label}`;
    $("resultAngle").textContent = angleText;
    $("resultDmax").textContent = `${format(insert.maxDiameter)} mm`;
    $("resultTmax").textContent = `${format(insert.maxDepth)} mm`;
    $("depthLabel").textContent = isWsp ? "Required depth Lreq" : measured ? "Depth from measured reference" : "Nominal depth t";
    $("depthResult").textContent = validGeometry ? `${format(result.depth)} mm` : "—";
    $("resultReference").textContent = isWsp ? `Z0 = work surface · WSP insert-tip Z ${validGeometry ? format(result.z) : "—"} mm. P is the catalog correction for this thread variant.` : measured ? "Z0 = work surface. Depth uses your measured assembly reference and the nominal assembly angle." : "Depth / Z uses the theoretical point. Set a measured tool-length reference to relate Z to your assembled tool.";
    $("sectionTitle").textContent = isWsp ? "WSP spot + chamfer section" : chamfer ? "Chamfer section" : "Spotting section";
    $("diagramAngleLabel").textContent = `${angleText} · ${isWsp ? "catalog WSP formula" : measured ? "measured reference" : "nominal section"}`;
    $("diagramCanvas").innerHTML = isWsp ? wsp.renderSection(result) : chamfer ? NC_SPOT_DIAGRAMS.renderChamfer(result) : NC_SPOT_DIAGRAMS.renderSpotting(result);
    $("diagramCaption").textContent = isWsp ? "WSP combines 145° spotting and a 90° chamfer face. Lreq = Dreq × 0.5 − P uses the catalog P for the selected thread. Tip shape is schematic; no contour compensation is applied." : chamfer ? `Local straight-edge section. Dashed tool outline is nominal; actual insert profile and holder clearance are not modeled. ${series.angle === 90 ? "Maintain at least 1 mm actual tip clearance." : "Confirm actual tip avoidance for the selected angle."}` : "D is measured at work surface Z0. Dashed edges show nominal geometry; the actual offset insert profile varies by grade. A measured reference applies only to the same tool assembly.";
    $("formulaText").textContent = `S = 1000 × Vc / (π × ${isWsp ? "Dreq" : "Dmax cut"}); F = S × f. ${chamfer ? `Maximum cutting diameter = upper-edge Ø${format(result.upperDiameter)} mm.` : "D is measured at work surface Z0."} ${insert.indexableEdges} indexable edges do not multiply this mm/rev feed.`;
    $("geometryNote").textContent = isWsp ? `Lreq = Dreq × 0.5 − P = ${format(result.diameter)} × 0.5 − ${format(result.p)} = ${format(result.depth)} mm. D1 = ${format(result.d1)} mm. The 5% example means Dreq = nominal thread diameter × 1.05; it is not a 5% C-width setting.` : `Nominal t = Dupper / [2 × tan(α / 2)]. ${measured ? `Measured correction Δz = ${format(result.tipOffset)} mm; Z = −(t − Δz).` : "Z = −t at the theoretical point. Catalog Tmax uses the actual insert; it is checked after a measured reference is supplied."} The model uses a straight face; it does not reproduce all grade-specific tip sections.`;
    if (isWsp) {
      $("wspThreadHint").textContent = `${result.variant.threadLabel} · tap pre-drill D1 ${format(result.d1)} mm · P ${format(result.p)} mm`;
      $("wspD1").textContent = `${format(result.d1)} mm`;
      $("wspP").textContent = `${format(result.p)} mm`;
    }
    $("catalogScope").textContent = `${data.series.length} ordinary model families and ${wsp.data.variants.length} WSP thread variants. Tool: printed p. ${series.sourcePage}. ${series.cuttingReference ? `NC40 CT reference: p. ${series.cuttingReference.sourcePage}, ${series.cuttingReference.familyLabel}. P60's N9MT11T3CT regrind origin is user-confirmed; the table is not dedicated P60 data.` : manualInput ? "No dedicated cutting range is confirmed for this model; cutting values are entered manually." : `Cutting data: p. ${series.cuttingSourcePage}.`}`;
    $("catalogGradeNote").textContent = `${rating ? `Grade match: ${rating}. ` : ""}${manualInput ? "Cutting values are user-entered, not catalog recommendations. " : series.cuttingReference ? "Reference starting values use the NC40 CT table mid-range. P60 retains its own geometry and material scope. " : "Available cutting values start at catalog mid-range. "}${insert.supportingEdgeFeedFactor ? "The conditional +50% supporting-edge feed is not included. " : ""}Holder length is overall length, not a verified usable reach.`;
    $("dataSourceLink").href = series.cuttingReference ? sourceURL(series.cuttingReference.pdfPage, series.cuttingReference.sourcePdf) : manualInput ? sourceURL(series.pdfPage) : sourceURL(series.cuttingPdfPage, series.cuttingSourcePdf || data.source.pdf);
    $("dataSourceLink").textContent = series.cuttingReference ? "View NC40 / CT reference table · not P60-specific ↗" : manualInput ? "Open model specifications ↗" : "Open cutting table ↗";
    $("sourceEdition").textContent = `Specifications: ${series.sourceVersion || data.source.version}. ${isWsp ? "WSP formula: printed p. 54." : ""}`;
    $("diameterSourceLink").hidden = !series.minDiameterSource;
    if (series.minDiameterSource) $("diameterSourceLink").href = new URL(series.minDiameterSource, location.href).href;
    $("catalogLink").href = sourceURL();
    $("copyButton").disabled = !result.valid;
    $("copyFeedback").textContent = "";
    copyText = result.valid ? (isWsp ? buildWspCopy(state) : buildCopy(state)) : "";
    updateURL();
  }
  function buildCopy({ series, insert, holder, material, operation, result, referenceDiameter, referenceDepth, manualInput }) {
    const lines = [
      `NC Spot Drill | ${operation === "spotting" ? "Spotting" : "Chamfering"}`,
      `Holder: ${holder.part} | Angle: ${series.angle}°`, `Insert: ${insert.part}`,
      `Material: ${material.label}`, `D: ${format(result.diameter)} mm | Vc: ${format(result.vc)} m/min | f: ${format(result.feedPerRev)} mm/rev`,
      `Spindle speed: ${format(result.spindle, 0)} rpm`, `Feed rate: ${format(result.feedRate, 1)} mm/min`,
      `Maximum cutting diameter used for S: ${format(result.maxCuttingDiameter)} mm`,
      `Cutting values: ${manualInput ? "Manual user input; no confirmed reference range for this material" : series.cuttingReference ? `NC40 CT reference starting values / user adjustments; P60 reground from ${series.cuttingReference.parentInsert} (user-confirmed), not a dedicated P60 table` : "Catalog ranges / user adjustments"}`
    ];
    if (operation === "chamfering") lines.push(`Chamfer: ${series.angle === 90 ? "C" : "W"}${format(result.width)} × ${format(90 - series.angle / 2)}° | H ${format(result.height)} mm | Contact D at: ${result.reference}`, `Full geometry R: ${format(result.radius)} mm | diameter equivalent: ${format(result.compensationDiameter)} mm`, "R is from original contour toward free side, not CAM wear. G41/G42 depends on travel direction.");
    lines.push(`${result.isNominal ? "Nominal theoretical-point" : "Measured-reference"} depth: ${format(result.depth)} mm | Z: ${format(result.z)} mm`, "Z0 = work surface.");
    if (result.isNominal) lines.push("Depth / Z is nominal geometry, not an assembled-tool target. Add a measured reference for the same assembly.");
    else lines.push(`Measured reference: Dref ${format(referenceDiameter)} mm at depth ${format(referenceDepth)} mm | Δz ${format(result.tipOffset)} mm`);
    lines.push("Nominal straight-face model; actual offset insert profile, holder clearance and lead-in/out are not verified.", `Specifications: ${series.sourceVersion || data.source.version}; tool p. ${series.sourcePage}`, sourceURL(series.pdfPage));
    lines.push(manualInput ? "Cutting values entered manually." : `${series.cuttingReference ? "CT reference table" : "Cutting data"}: ${data.source.version}, p. ${series.cuttingSourcePage}\n${sourceURL(series.cuttingPdfPage, series.cuttingSourcePdf || data.source.pdf)}`);
    return lines.join("\n");
  }
  function buildWspCopy({ series, insert, holder, material, result }) {
    return ["NC Spot Drill | WSP 145° + 90°", `Insert: ${insert.part} | ${result.variant.threadLabel}`, `Holder: ${holder.part}`, `Material: ${material.label}`, `Dreq: ${format(result.diameter)} mm | D1: ${format(result.d1)} mm | P: ${format(result.p)} mm`, `Lreq = Dreq × 0.5 − P = ${format(result.depth)} mm`, `WSP insert-tip Z: ${format(result.z)} mm | Z0 = work surface`, `Vc: ${format(result.vc)} m/min | f: ${format(result.feedPerRev)} mm/rev`, `Spindle speed: ${format(result.spindle, 0)} rpm | Feed rate: ${format(result.feedRate, 1)} mm/min`, "Dedicated WSP catalog formula; no ordinary cone correction or contour G41/G42 offset is applied.", `Source: ${data.source.version}, specifications p. 42; formula/cutting data p. 54`, sourceURL(series.cuttingPdfPage, data.source.pdf)].join("\n");
  }
  function updateURL() {
    if (needsAssemblyConfirmation) return;
    const url = new URL(location.href);
    for (const field of ["operation", "angle", "series", "material", "insert"]) url.searchParams.set(field, controls[field].value);
    // 只保留選型；不在網址傳遞未經確認的機台對刀基準。
    history.replaceState(null, "", url);
  }

  function onSelectionChange(kind) {
    if (["angle", "series"].includes(kind)) needsAssemblyConfirmation = false;
    refreshToolOptions({ preferRecommendation: kind !== "insert" && kind !== "holder" });
    if (kind !== "holder") setCuttingPresets();
    if (selected().operation === "wsp" && ["operation", "series", "insert"].includes(kind)) controls.diameter.value = plain(wsp.data.variants.find(item => item.id === selected().insert.wspVariantId).recommendedDiameter);
    fitDiameter(); render();
  }
  for (const key of ["operation", "material", "angle", "series", "insert", "holder"]) controls[key].addEventListener("change", () => onSelectionChange(key));
  controls.datum.addEventListener("change", () => {
    if (controls.datum.value === "measured") calibrationAssembly = assemblyKey();
    render();
  });
  for (const key of ["diameter", "vc", "feedPerRev", "chamferWidth", "referenceDiameter", "referenceDepth"]) controls[key].addEventListener("input", render);
  controls.contactReference.addEventListener("change", () => {
    const diameter = core.convertContactDiameter({ diameter: controls.diameter.value, width: controls.chamferWidth.value, from: previousReference, to: controls.contactReference.value });
    if (Number.isFinite(diameter)) controls.diameter.value = plain(diameter);
    previousReference = controls.contactReference.value;
    render();
  });
  $("diameterRange").addEventListener("input", () => { controls.diameter.value = $("diameterRange").value; render(); });
  $("calculatorForm").addEventListener("submit", event => event.preventDefault());
  $("resetButton").addEventListener("click", () => {
    controls.datum.value = "theoretical"; controls.referenceDiameter.value = ""; controls.referenceDepth.value = "";
    calibrationAssembly = null; controls.contactReference.value = previousReference = "upper";
    controls.chamferWidth.value = "0.5"; controls.diameter.value = selected().operation === "wsp" ? plain(wsp.data.variants.find(item => item.id === selected().insert.wspVariantId).recommendedDiameter) : plain(Math.min(6, selected().insert.maxDiameter));
    setCuttingPresets(); render();
  });
  $("wspDiameterButton").addEventListener("click", () => {
    const variant = wsp.data.variants.find(item => item.id === selected().insert.wspVariantId);
    if (variant) { controls.diameter.value = plain(variant.recommendedDiameter); render(); }
  });
  $("copyButton").addEventListener("click", async () => {
    if (!copyText) return;
    const text = copyText;
    try { await navigator.clipboard.writeText(text); if (copyText === text) $("copyFeedback").textContent = "Cutting data copied."; }
    catch { $("copyFeedback").textContent = "Copy is unavailable. Select the displayed results to copy them."; }
  });

  // 滾輪只在欄位聚焦時生效。加減固定增量並保留人工輸入精度，不用原生step把小數強制吸附。
  for (const [key, increment] of [["diameter", .1], ["chamferWidth", .1], ["vc", 1], ["feedPerRev", .01], ["referenceDiameter", .1], ["referenceDepth", .01]]) {
    const field = controls[key];
    const change = direction => {
      const current = finite(field.value);
      if (current === null) return;
      const next = Number((current + direction * increment).toFixed(8));
      if (next <= 0) return;
      field.value = plain(next); field.dispatchEvent(new Event("input", { bubbles: true }));
    };
    field.addEventListener("keydown", event => {
      if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); change(event.key === "ArrowUp" ? 1 : -1); }
    });
    field.addEventListener("wheel", event => {
      if (document.activeElement !== field || event.deltaY === 0 || event.ctrlKey) return;
      event.preventDefault(); change(event.deltaY < 0 ? 1 : -1);
    }, { passive: false });
  }

  // 完整料號查找支援刀片、共用刀柄與套裝；多種組合命中時由使用者明確選角度。
  const lookupCatalog = { series: allSeries, packages: data.catalogPackages };
  function applyLookup(match) {
    const family = allSeries.find(item => item.id === match.familyId);
    if (!family) return;
    needsAssemblyConfirmation = false;
    controls.operation.value = family.operations.includes(controls.operation.value) ? controls.operation.value : family.operations[0];
    fillOptions(controls.angle, [[String(family.angle), family.angleLabel || `${family.angle}°`]], String(family.angle));
    fillOptions(controls.series, allSeries.map(item => [item.id, item.familyLabel]), family.id);
    refreshToolOptions({ preferRecommendation: true });
    if (family.inserts.some(item => item.id === match.insertId)) controls.insert.value = match.insertId;
    if (family.holders.some(item => item.part === match.holderPart)) controls.holder.value = match.holderPart;
    clearMeasuredReference(); setCuttingPresets();
    if (selected().operation === "wsp") controls.diameter.value = plain(wsp.data.variants.find(item => item.id === selected().insert.wspVariantId).recommendedDiameter);
    fitDiameter(); render();
    $("lookupResults").replaceChildren();
    $("lookupStatus").textContent = `Selected ${selected().insert.part} · ${family.angleLabel || `${family.angle}°`} · ${selected().holder.part}.`;
  }
  function findPart() {
    const matches = NC_SPOT_LOOKUP.find($("partLookup").value, lookupCatalog);
    $("lookupResults").replaceChildren();
    if (!matches.length) { $("lookupStatus").textContent = "No match in the supported catalog. Enter an insert, holder or set part number."; return; }
    if (matches.length === 1) { applyLookup(matches[0]); return; }
    $("lookupStatus").textContent = `${matches.length} matching assemblies. Choose the model / angle${matches.length > 12 ? " or refine the part number" : ""}.`;
    for (const match of matches.slice(0, 12)) {
      const family = allSeries.find(item => item.id === match.familyId);
      const button = document.createElement("button"), title = document.createElement("strong"), description = document.createElement("span");
      button.type = "button"; button.className = "lookup-choice";
      title.textContent = match.part;
      description.textContent = `${family.familyLabel} · ${family.angleLabel || `${family.angle}°`}${match.holderPart ? ` · ${match.holderPart}` : ""}`;
      button.append(title, description); button.addEventListener("click", () => applyLookup(match));
      $("lookupResults").append(button);
    }
  }
  $("lookupButton").addEventListener("click", findPart);
  $("partLookup").addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); findPart(); } });
  const suggestions = [...new Set([...allSeries.flatMap(item => [...item.inserts.map(insert => insert.part), ...item.holders.map(holder => holder.part)]), ...data.catalogPackages.map(item => item.part)])];
  $("partSuggestions").replaceChildren(...suggestions.map(value => new Option(value, value)));
  $("modelCoverage").textContent = `${data.series.length} ordinary assemblies · ${wsp.data.variants.length} WSP variants · ${data.catalogPackages.length} catalog sets`;

  const params = new URLSearchParams(location.search);
  // 深連結先解析完整刀片料號；舊 nc10/nc14 等ID保持相容，不讓新角度篩選沖掉指定型號。
  const requestedOperation = ["spotting", "chamfering", "wsp"].includes(params.get("operation")) ? params.get("operation") : "spotting";
  const resolvedAssembly = NC_SPOT_LOOKUP.resolveAssembly({ seriesId: params.get("series"), insertId: params.get("insert"), angle: params.get("angle") }, allSeries);
  needsAssemblyConfirmation = !resolvedAssembly.series && resolvedAssembly.candidates.length > 1;
  const initialSeries = resolvedAssembly.series || resolvedAssembly.candidates[0] || (requestedOperation === "wsp" ? wspFamilies[0] : allSeries.find(item => item.id === "nc10"));
  controls.operation.value = initialSeries.operations.includes(requestedOperation) ? requestedOperation : initialSeries.operations[0];
  fillOptions(controls.angle, [["all", "All angles"], ...[...new Set(allSeries.map(item => item.angle))].map(value => [String(value), `${value}°`])], params.get("angle") === "all" ? "all" : String(initialSeries.angle));
  fillOptions(controls.series, allSeries.map(item => [item.id, item.familyLabel]), initialSeries.id);
  fillOptions(controls.material, data.materials.map(item => [item.id, item.label]), params.get("material") || "carbonLow");
  refreshToolOptions({ preferRecommendation: true });
  if ([...controls.insert.options].some(item => item.value === params.get("insert"))) controls.insert.value = params.get("insert");
  if (initialSeries.geometryMode === "wsp") controls.diameter.value = plain(wsp.data.variants.find(item => item.id === selected().insert.wspVariantId).recommendedDiameter);
  setCuttingPresets(); fitDiameter(); render();
  if (needsAssemblyConfirmation) { $("partLookup").value = params.get("insert"); findPart(); }

  // 共用Header/Footer沿用根目錄資源，不在產品子目錄複製。
  async function loadLayout(part) {
    const response = await fetch(`../../${part}/${part}.html`);
    if (!response.ok) return;
    $(`${part}-placeholder`).innerHTML = await response.text();
    if (part === "header") {
      const button = $("mobileMenuBtn"), nav = $("topNav");
      if (!button || !nav) return;
      button.setAttribute("aria-controls", "topNav"); button.setAttribute("aria-expanded", "false");
      button.addEventListener("click", () => {
        const expanded = nav.classList.toggle("active");
        button.setAttribute("aria-expanded", String(expanded)); button.setAttribute("aria-label", expanded ? "Close Menu" : "Open Menu");
      });
    }
  }
  Promise.all([loadLayout("header"), loadLayout("footer")]).catch(() => {});
  if ("IntersectionObserver" in window) new IntersectionObserver(entries => {
    $("mobileSummary").classList.toggle("is-hidden", entries[0].isIntersecting);
  }, { threshold: .15 }).observe($("resultTitle").closest(".result-panel"));
})();
