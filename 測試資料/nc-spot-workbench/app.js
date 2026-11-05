/* NC Spot Drill 本機樣板：只組合型錄資料、計算核心與剖面圖。
 * 刀具、材質與校正基準互相連動；所有結果及複製內容都由同一份計算結果產生。
 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const data = NC_SPOT_DATA, core = NC_SPOT_CORE;
  const controls = Object.fromEntries(["operation", "material", "series", "insert", "holder", "diameter", "vc", "feedPerRev", "chamferWidth", "contactReference", "datum", "referenceDiameter", "referenceDepth"].map(id => [id, $(id)]));
  const finite = core.finiteNumber;
  const format = (value, digits = 4) => Number.isFinite(value) ? Number(value.toFixed(digits)).toLocaleString("en-US", { maximumFractionDigits: digits }) : "—";
  const plain = (value, digits = 8) => Number.isFinite(value) ? String(Number(value.toFixed(digits))) : "";
  const midpoint = range => (range[0] + range[1]) / 2;
  const rangeLabel = range => range ? `${plain(range[0])}–${plain(range[1])}` : "Not listed";
  const sourceURL = page => new URL(`${data.source.pdf}${page ? `#page=${page}` : ""}`, location.href).href;
  let copyText = "", previousReference = "upper", latestResult = null;
  let calibrationAssembly = null;

  // 用原生 Option 寫入資料，避免產品料號或標籤被當成 HTML。
  function fillOptions(select, entries, requested) {
    select.replaceChildren(...entries.map(([value, label]) => new Option(label, value)));
    select.value = entries.some(([value]) => value === requested) ? requested : (entries[0]?.[0] ?? "");
    select.disabled = !entries.length;
  }
  function selected() {
    const series = data.series.find(item => item.id === controls.series.value);
    const material = data.materials.find(item => item.id === controls.material.value);
    const insert = series?.inserts.find(item => item.id === controls.insert.value);
    const holder = series?.holders.find(item => item.part === controls.holder.value);
    const operation = controls.operation.value;
    const feedRange = data.feedTables[series?.feedTable]?.[material?.id]?.[operation] ?? null;
    return { series, material, insert, holder, operation, feedRange };
  }
  function assemblyKey() {
    return `${controls.series.value}|${controls.holder.value}|${controls.insert.value}`;
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
    const availableSeries = data.series.filter(item => item.operations.includes(operation));
    fillOptions(controls.series, availableSeries.map(item => [item.id, item.label]), previousSeries || "nc10");
    const series = data.series.find(item => item.id === controls.series.value);
    const previousMaterial = controls.material.value;
    const materials = data.materials.filter(item => {
      const row = data.feedTables[series.feedTable][item.id];
      return row?.[operation] && series.inserts.some(insert => insert.materialIds.includes(item.id));
    });
    fillOptions(controls.material, materials.map(item => [item.id, item.label]), previousMaterial || "carbonLow");
    const inserts = series.inserts.filter(item => item.materialIds.includes(controls.material.value));
    const preferred = preferRecommendation ? series.recommendedByMaterial[controls.material.value] : controls.insert.value;
    fillOptions(controls.insert, inserts.map(item => [item.id, item.label]), preferred || series.recommendedByMaterial[controls.material.value]);
    fillOptions(controls.holder, series.holders.map(item => [item.part, `${item.part} · ${item.thread || `Ø${item.shankLabel || plain(item.shankDiameter)}`} · L ${plain(item.length)} mm`]), controls.holder.value);
    clearMeasuredReference();
  }
  function setCuttingPresets() {
    const { material, feedRange } = selected();
    controls.vc.value = material ? plain(midpoint(material.vc)) : "";
    controls.feedPerRev.value = feedRange ? plain(midpoint(feedRange)) : "";
  }
  function fitDiameter() {
    const { series, insert, operation } = selected();
    const maximum = insert?.maxDiameter ?? series?.maxDiameter;
    if (!maximum) return;
    const current = finite(controls.diameter.value);
    if (current === null || current <= 0 || current > maximum) controls.diameter.value = plain(Math.min(6, maximum));
    if (operation === "chamfering") {
      const width = finite(controls.chamferWidth.value);
      if (width === null || width <= 0) controls.chamferWidth.value = "0.5";
    }
  }
  function calculateSelection() {
    const selection = selected();
    const { series, insert, material, feedRange, operation } = selection;
    const referenceDiameter = finite(controls.referenceDiameter.value);
    const referenceDepth = finite(controls.referenceDepth.value);
    const measured = controls.datum.value === "measured";
    const ratio = series.angle === 90 ? 1 : 1 / Math.tan(series.angle * Math.PI / 360);
    const referenceValid = referenceDiameter !== null && referenceDiameter > 0 && referenceDepth !== null && referenceDepth > 0 && referenceDiameter <= insert.maxDiameter && referenceDepth <= insert.maxDepth + 1e-9 && (insert.minSpotDepth === null || referenceDepth >= insert.minSpotDepth - 1e-9);
    const referenceProblem = measured && !referenceValid ? `Enter a measured diameter above 0 and no larger than ${format(insert.maxDiameter)} mm, with depth ${insert.minSpotDepth ? `from ${format(insert.minSpotDepth)}` : "above 0 and"} up to ${format(insert.maxDepth)} mm. The reference point must be within this insert's catalog limits.` : "";
    const tipOffset = measured && referenceValid ? referenceDiameter * ratio / 2 - referenceDepth : null;
    const result = core.calculate({
      operation, angle: series.angle, diameter: controls.diameter.value,
      vc: controls.vc.value, feed: controls.feedPerRev.value,
      width: controls.chamferWidth.value, reference: controls.contactReference.value,
      datum: controls.datum.value, tipOffset, maxDiameter: insert.maxDiameter,
      minSpotDepth: insert.minSpotDepth, minClearance: series.minChamferClearance,
      vcRange: material.vc, feedRange
    });
    if (!feedRange) {
      result.valid = false; result.cuttingValid = false;
      result.errors.push("No catalog feed is listed for this operation and material.");
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
    const { series, insert, holder, material, operation, feedRange, result } = state;
    latestResult = result;
    const chamfer = operation === "chamfering", measured = controls.datum.value === "measured";
    const validGeometry = result.geometryValid;
    document.body.classList.toggle("chamfer-active", chamfer);
    $("chamferInputs").hidden = !chamfer;
    $("chamferOutput").hidden = !chamfer;
    $("compensationNote").hidden = !chamfer;
    $("measuredInputs").hidden = !measured;
    $("diameterLabel").textContent = chamfer ? "Contact Ø" : "Spot diameter";
    $("cuttingTitle").textContent = chamfer ? "Chamfer & cutting values" : "Cutting values";
    $("materialBadge").textContent = material.iso;
    $("materialBadge").dataset.iso = material.iso;
    $("angleTag").textContent = `${series.angle}°`;
    $("toolHint").textContent = `Angle set by holder · ${holder.shank} · ${holder.shankLabel || (holder.shankDiameter ? `Ø${plain(holder.shankDiameter)} mm` : holder.thread)}`;
    const rating = data.ratingLabels[insert.materialRatings[material.id]];
    $("gradeHint").textContent = `${rating} catalog match for this material.${material.id === "hardened" ? ` Check hardness < HRC ${insert.materialMaxHardness}.` : ""}`;
    $("diameterHint").textContent = chamfer ? (result.minD !== null && result.maxD !== null ? `Nominal contact range Ø${format(result.minD)}–${format(result.maxD)} mm` : `Catalog Dmax ${format(insert.maxDiameter)} mm`) : `Catalog Dmax ${format(insert.maxDiameter)} mm`;
    $("vcHint").textContent = `${rangeLabel(material.vc)} m/min`;
    $("feedHint").textContent = `${rangeLabel(feedRange)} mm/rev`;
    $("diameterError").textContent = result.geometryErrors.filter(text => /diameter|offset|clearance|depth|reach|contact/i.test(text)).join(" ");
    controls.diameter.classList.toggle("is-invalid", !validGeometry);
    controls.diameter.setAttribute("aria-invalid", String(!validGeometry));
    for (const field of ["vc", "feedPerRev"]) {
      const invalid = finite(controls[field].value) === null || Number(controls[field].value) <= 0;
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
    const practicalWarnings = result.warnings.filter(text => /outside/.test(text));
    if (insert.supportingEdgeFeedFactor) practicalWarnings.push("Supporting-edge feed increases are not applied automatically.");
    if (insert.minSpotDepth && operation === "spotting") practicalWarnings.push("NC40 / NC60: keep at least 1 mm tip clearance as shown in the catalog.");
    $("calculationMessage").textContent = [...result.errors, ...practicalWarnings].join(" ");
    $("rpm").textContent = $("mobileRpm").textContent = result.valid ? format(result.spindle, 0) : "—";
    $("feedRate").textContent = $("mobileFeed").textContent = result.valid ? format(result.feedRate, 1) : "—";
    $("compensationR").textContent = validGeometry ? format(result.radius) : "—";
    $("zTarget").textContent = validGeometry ? format(result.z) : "—";
    $("zLabel").textContent = measured ? "Z from measured reference" : "Nominal Z";
    $("compensationHint").textContent = validGeometry ? `Radius R ${format(result.radius)} mm · diameter setting Ø${format(result.compensationDiameter)} mm` : "Check chamfer width, contact D and tool-length reference.";
    $("insertModel").textContent = insert.part;
    $("selectionSummary").textContent = `${holder.part} · ${material.label}`;
    $("resultAngle").textContent = `${series.angle}°`;
    $("resultDmax").textContent = `${format(insert.maxDiameter)} mm`;
    $("resultTmax").textContent = `${format(insert.maxDepth)} mm`;
    $("depthLabel").textContent = measured ? "Depth from measured reference" : "Nominal depth t";
    $("depthResult").textContent = validGeometry ? `${format(result.depth)} mm` : "—";
    $("resultReference").textContent = measured ? "Z0 = work surface. Depth uses your measured assembly reference and the nominal holder angle." : "Depth / Z uses the theoretical point. Set a measured tool-length reference to relate Z to your assembled tool.";
    $("sectionTitle").textContent = chamfer ? "Chamfer section" : "Spotting section";
    $("diagramAngleLabel").textContent = `${series.angle}° holder · ${measured ? "measured reference" : "nominal section"}`;
    $("diagramCanvas").innerHTML = chamfer ? NC_SPOT_DIAGRAMS.renderChamfer(result) : NC_SPOT_DIAGRAMS.renderSpotting(result);
    $("diagramCaption").textContent = chamfer ? "Local straight-edge section. Dashed tool outline is nominal; insert offset, actual profile and holder clearance are not modeled. Maintain at least 1 mm actual tip clearance." : "D is measured at work surface Z0. Dashed edges show nominal geometry; the actual offset insert profile varies by grade. A measured reference applies only to the same tool assembly.";
    $("formulaText").textContent = `S = 1000 × Vc / (π × Dmax cut); F = S × f. ${chamfer ? `Maximum cutting diameter = upper-edge Ø${format(result.upperDiameter)} mm.` : "Dmax cut = spot diameter at Z0."} ${insert.indexableEdges} indexable edges do not multiply this mm/rev feed.`;
    $("geometryNote").textContent = `Nominal t = Dupper / [2 × tan(α / 2)]. ${measured ? `Measured correction Δz = ${format(result.tipOffset)} mm; Z = −(t − Δz).` : "Z = −t at the theoretical point. Catalog Tmax uses the actual insert; it is checked after a measured reference is supplied."} The model uses a straight face; it does not reproduce all grade-specific tip sections.`;
    $("catalogScope").textContent = `Six verified families: NC06, NC08, NC10, NC14, V09 and V13. This preview covers 60° spotting and 90° spotting / local contour chamfering. Tool: printed p. ${series.sourcePage}; cutting data: p. ${series.cuttingSourcePage}.`;
    $("catalogGradeNote").textContent = `Grade match: ${rating}. Cutting values are catalog mid-range starting values. ${insert.supportingEdgeFeedFactor ? "The conditional +50% supporting-edge feed is not included. " : ""}Holder length is overall length, not a verified usable reach.`;
    $("dataSourceLink").href = sourceURL(series.cuttingPdfPage);
    $("catalogLink").href = sourceURL();
    $("copyButton").disabled = !result.valid;
    $("copyFeedback").textContent = "";
    copyText = result.valid ? buildCopy(state) : "";
    updateURL();
  }
  function buildCopy({ series, insert, holder, material, operation, result, referenceDiameter, referenceDepth }) {
    const lines = [
      `NC Spot Drill | ${operation === "spotting" ? "Spotting" : "Chamfering"}`,
      `Holder: ${holder.part} | Angle: ${series.angle}°`, `Insert: ${insert.part}`,
      `Material: ${material.label}`, `D: ${format(result.diameter)} mm | Vc: ${format(result.vc)} m/min | f: ${format(result.feedPerRev)} mm/rev`,
      `Spindle speed: ${format(result.spindle, 0)} rpm`, `Feed rate: ${format(result.feedRate, 1)} mm/min`,
      `Maximum cutting diameter used for S: ${format(result.maxCuttingDiameter)} mm`
    ];
    if (operation === "chamfering") lines.push(`Chamfer: C${format(result.width)} × 45° | Contact D at: ${result.reference}`, `Full geometry R: ${format(result.radius)} mm | diameter equivalent: ${format(result.compensationDiameter)} mm`, "R is from original contour toward free side, not CAM wear. G41/G42 depends on travel direction.");
    lines.push(`${result.isNominal ? "Nominal theoretical-point" : "Measured-reference"} depth: ${format(result.depth)} mm | Z: ${format(result.z)} mm`, "Z0 = work surface.");
    if (result.isNominal) lines.push("Depth / Z is nominal geometry, not an assembled-tool target. Add a measured reference for the same assembly.");
    else lines.push(`Measured reference: Dref ${format(referenceDiameter)} mm at depth ${format(referenceDepth)} mm | Δz ${format(result.tipOffset)} mm`);
    lines.push("Nominal straight-face model; actual offset insert profile, holder clearance and lead-in/out are not verified.", `Source: ${data.source.version}; tool p. ${series.sourcePage}, cutting data p. ${series.cuttingSourcePage}`, sourceURL(series.cuttingPdfPage));
    return lines.join("\n");
  }
  function updateURL() {
    const url = new URL(location.href);
    for (const field of ["operation", "series", "material", "insert"]) url.searchParams.set(field, controls[field].value);
    // 只保留選型；不在網址傳遞未經確認的機台對刀基準。
    history.replaceState(null, "", url);
  }

  function onSelectionChange(kind) {
    refreshToolOptions({ preferRecommendation: kind !== "insert" && kind !== "holder" });
    if (kind !== "holder") setCuttingPresets();
    fitDiameter(); render();
  }
  for (const key of ["operation", "material", "series", "insert", "holder"]) controls[key].addEventListener("change", () => onSelectionChange(key));
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
    controls.chamferWidth.value = "0.5"; controls.diameter.value = plain(Math.min(6, selected().insert.maxDiameter));
    setCuttingPresets(); render();
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

  const params = new URLSearchParams(location.search);
  controls.operation.value = ["spotting", "chamfering"].includes(params.get("operation")) ? params.get("operation") : "spotting";
  fillOptions(controls.series, data.series.map(item => [item.id, item.label]), params.get("series") || "nc10");
  fillOptions(controls.material, data.materials.map(item => [item.id, item.label]), params.get("material") || "carbonLow");
  refreshToolOptions({ preferRecommendation: true });
  if ([...controls.insert.options].some(item => item.value === params.get("insert"))) controls.insert.value = params.get("insert");
  setCuttingPresets(); fitDiameter(); render();

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
