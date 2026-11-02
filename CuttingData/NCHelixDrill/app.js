/* NC Helix 一般單孔設定：串接選刀、原表條件與同步示意。 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  // 來源圖片以實際載入的腳本為基準，正式頁與舊樣板都讀取同一份站內資源。
  const resourceBase = new URL("./", document.currentScript.src);
  const sourceURL = relative => new URL(relative, resourceBase).href;
  const escapeHTML = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
  const num = id => $(id).value.trim() === "" ? NaN : Number($(id).value);
  const textNumber = (value, decimals = 3) => Number.isFinite(value) ? String(Number(value.toFixed(decimals))) : "—";
  const state = {mode: "hole", toolId: "99323-012-1525", view: "top", custom: false, playing: false};
  let candidates = [], currentTool = null, currentResult = null, copyText = "", animationId = 0, animationStart = 0;

  const input = () => ({diameter: num("holeDiameter"), depth: num("holeDepth"), coolant: $("coolant").value});
  const material = () => HELIX_DATA.materials.find(item => item.id === $("material").value);
  function selectedTool() {
    const tool = HELIX_DATA.tools.find(item => item.id === state.toolId);
    return state.mode === "tool" || candidates.some(item => item.id === state.toolId) ? tool : null;
  }
  function catalogValue(tool) {
    // Vc/grade 由該刀具原表取值，保留不同刀具尺寸的差異。
    return tool?.table?.[0]?.values?.[$("material").value];
  }
  function presetSource(preset) {
    if (!preset) return "Manual values; no catalog interval is available.";
    return preset.kind === "estimated"
      ? `Linear estimate between Ø${textNumber(preset.bounds[0])} and Ø${textNumber(preset.bounds[1])} mm catalog columns.`
      : `Catalog Ø${textNumber(preset.diameter)} mm column.`;
  }
  function applyPresets() {
    currentTool = selectedTool();
    const row = currentTool && HELIX_CORE.getSuggestedPresets(currentTool, $("material").value, num("holeDiameter"));
    const values = catalogValue(currentTool);
    $("vc").value = values?.vc?.[currentTool?.series] ?? "";
    // 保留足夠輸入精度，避免線性計算的浮點尾數直接出現在欄位。
    $("fz").value = row ? textNumber(row.fz, 6) : "";
    $("pitch").value = row ? textNumber(row.pitches[Number($("power").value)], 6) : "";
    state.custom = false;
  }

  function renderTools() {
    candidates = HELIX_CORE.getCandidates(HELIX_DATA.tools, input());
    currentTool = selectedTool();
    $("ownedToolField").hidden = state.mode !== "tool";
    $("candidateList").hidden = state.mode === "tool";
    $("candidateEmpty").hidden = state.mode === "tool" || candidates.length > 0;
    $("candidateCount").textContent = state.mode === "hole" ? `${candidates.length} ${candidates.length === 1 ? "match" : "matches"}` : "Your tool";
    $("ownedTool").value = state.toolId;
    $("candidateList").innerHTML = candidates.map(tool => `<button type="button" class="candidate" data-tool="${escapeHTML(tool.id)}" aria-pressed="${tool.id === state.toolId}"><span class="candidate-head"><strong>Ø${textNumber(tool.dc)} mm</strong><span class="candidate-check" aria-hidden="true"></span></span><span class="candidate-part">${escapeHTML(tool.id)}</span><small>Hole Ø${tool.dmin}–${tool.dmax} · L ≤ ${tool.maxDepth} mm</small></button>`).join("");
    const values = catalogValue(currentTool);
    $("toolNote").innerHTML = currentTool ? `<strong>${escapeHTML(currentTool.insert)} · ${escapeHTML(values?.grade || "")}</strong><br>${currentTool.coolant === "internal" ? "Screw-fit cutter · through coolant" : "Cylindrical shank · external coolant"}. ${escapeHTML(currentTool.depthNote)}` : "Select a matching cutter to see its setup.";
  }

  function stopPlayback() {
    state.playing = false;
    cancelAnimationFrame(animationId);
    $("playButton").textContent = "Play path";
    $("playButton").setAttribute("aria-pressed", "false");
  }

  function renderDiagram() {
    const result = currentResult;
    const values = input();
    const toolFits = currentTool && candidates.some(tool => tool.id === currentTool.id);
    const canShow = toolFits && Number.isFinite(result?.radius) && result.radius > 0;
    const canAnimate = canShow && result?.turns && result.actualPitch > 0 && result.actualPitch <= currentTool.maxPitch + 1e-8 && result.rampAngle <= currentTool.rampMax + 1e-8;
    const diagramValues = {diameter: canShow ? values.diameter : NaN, dc: currentTool?.dc, depth: values.depth, actualPitch: canAnimate ? result.actualPitch : NaN, turns: canAnimate ? result.turns : NaN, progress: num("progress")};
    $("diagramCanvas").innerHTML = state.view === "top" ? HELIX_DIAGRAMS.renderTop(diagramValues) : HELIX_DIAGRAMS.renderSection(diagramValues);
    $("motionLegend").hidden = state.view === "top";
    $("diagramCaption").textContent = state.view === "top" ? "Center orbit · CCW (counterclockwise). D / Dc shown to scale; cutter orientation is schematic." : "Helical-motion schematic. Holder length and bottom finishing are not shown.";
    $("motionPosition").textContent = canAnimate ? `· Z ${textNumber(-values.depth * num("progress") / 100)} mm` : "";
    $("progress").disabled = !canAnimate;
    $("playButton").disabled = $("progress").disabled;
    if ($("playButton").disabled && state.playing) stopPlayback();
  }

  function renderResults() {
    currentTool = selectedTool();
    const values = input(), mat = material(), catalog = catalogValue(currentTool);
    const row = currentTool && HELIX_CORE.getSuggestedPresets(currentTool, $("material").value, values.diameter);
    const result = HELIX_CORE.calculate({...values, dc: currentTool?.dc, vc: num("vc"), fz: num("fz"), pitch: num("pitch"), teeth: num("teeth"), rampMax: currentTool?.rampMax, maxPitch: currentTool?.maxPitch, dmin: currentTool?.dmin, dmax: currentTool?.dmax, maxDepth: currentTool?.maxDepth});
    currentResult = result;
    const toolFits = currentTool && candidates.some(tool => tool.id === currentTool.id);
    const coolantFits = currentTool?.coolant === values.coolant;
    const valid = Boolean(currentTool && toolFits && coolantFits && result.valid);
    $("copyButton").disabled = !valid;
    $("copyFeedback").textContent = "";
    $("selectedPart").textContent = currentTool?.id || "Choose your cutter";
    $("selectedContext").textContent = currentTool ? `Cutter Ø${textNumber(currentTool.dc)} · ${mat?.label || ""} · ${catalog?.grade || ""}` : "Start with the hole requirements and select a listed cutter.";
    $("resultStatus").textContent = valid ? row?.kind === "estimated" && !state.custom ? "Estimated setup" : "Live calculation" : "Check conditions";
    $("resultStatus").dataset.estimated = String(valid && row?.kind === "estimated" && !state.custom);
    $("spindleResult").textContent = valid ? result.spindle.toLocaleString("en-US") : "—";
    $("feedResult").textContent = valid ? result.feed.toLocaleString("en-US", {maximumFractionDigits: 1}) : "—";
    $("mobileGeometry").textContent = toolFits ? `R ${textNumber(result.radius)} · Z ${textNumber(result.zTarget)} mm` : "Choose a matching cutter";
    $("mobileCutting").textContent = valid ? `${result.spindle.toLocaleString("en-US")} rpm · F ${textNumber(result.feed, 1)} mm/min` : "Check your setup values";
    $("radiusResult").textContent = toolFits ? textNumber(result.radius) : "—";
    $("zResult").textContent = toolFits ? textNumber(result.zTarget) : "—";
    $("inputPitchResult").textContent = toolFits && num("pitch") > 0 ? `${textNumber(num("pitch"))} mm` : "—";
    $("actualPitchResult").textContent = toolFits && result.actualPitch ? `${textNumber(result.actualPitch, 4)} mm` : "—";
    $("turnsResult").textContent = toolFits ? textNumber(result.turns, 0) : "—";
    $("distributionNote").textContent = toolFits && result.turns ? `${textNumber(values.depth)} mm distributed over ${result.turns} complete ${result.turns === 1 ? "orbit" : "orbits"}.` : "Choose valid hole and Pitch values to see the helical motion.";
    $("rampResult").textContent = toolFits && result.rampAngle ? `${textNumber(result.rampAngle, 2)}° ramp` : "";
    const estimated = row?.kind === "estimated";
    const referenceLabel = row ? estimated ? `Ø${textNumber(row.bounds[0])}–${textNumber(row.bounds[1])} mm` : `Ø${textNumber(row.diameter)} column` : "";
    $("presetNote").textContent = !currentTool ? "Choose a cutter first." : row ? `${state.custom ? "Custom values" : estimated ? "Estimated starting values" : "Catalog starting values"} · ${referenceLabel}` : state.custom && valid ? "Custom values · manual setup" : "No catalog interval for this diameter. Enter your setup values.";
    $("presetNote").dataset.manual = String(state.custom || !row);
    $("presetNote").dataset.estimated = String(estimated);
    $("restoreButton").disabled = !row;
    $("materialBadge").textContent = mat?.iso || "";
    $("materialBadge").style.backgroundColor = mat?.color || "#0067ad";
    $("materialBadge").style.color = mat?.iso === "M" ? "#263b4d" : "#fff";
    $("sourceLink").href = sourceURL(currentTool?.sourceUrl || HELIX_DATA.source.localUrl);
    const issues = [];
    if (!currentTool) issues.push("Choose a cutter that fits the hole diameter, depth and coolant.");
    else {
      issues.push(...result.errors);
      if (!coolantFits) issues.push(`This cutter requires ${currentTool.coolant === "internal" ? "through coolant" : "external coolant"}.`);
    }
    $("validationMessage").hidden = issues.length === 0;
    $("validationMessage").textContent = issues.join(" ");
    for (const [id, condition] of [["holeDiameter", !Number.isFinite(values.diameter) || values.diameter <= 0 || currentTool && (values.diameter < currentTool.dmin || values.diameter > currentTool.dmax)], ["holeDepth", !Number.isFinite(values.depth) || values.depth <= 0 || currentTool && values.depth > currentTool.maxDepth], ["vc", !Number.isFinite(num("vc")) || num("vc") <= 0], ["fz", !Number.isFinite(num("fz")) || num("fz") <= 0], ["pitch", !Number.isFinite(num("pitch")) || num("pitch") <= 0 || result.rampAngle > (currentTool?.rampMax || 20) || result.actualPitch > currentTool?.maxPitch], ["teeth", !Number.isInteger(num("teeth")) || num("teeth") <= 0]]) {
      $(id).classList.toggle("is-invalid", Boolean(condition));
      $(id).setAttribute("aria-invalid", String(Boolean(condition)));
    }
    $("formulaText").textContent = "R = (D − Dc) / 2 · n = 1000 × Vc / (π × Dc) · F = n × fz × z. F uses the rounded spindle speed shown above.";
    $("catalogText").textContent = `${HELIX_DATA.source.title}. Checked ${HELIX_DATA.source.checked}. ${presetSource(row)} ${estimated ? "fz and Pitch are estimated starting values; verify them for your setup. " : ""}${state.custom ? "Input values have been adjusted. " : ""}Active teeth z = ${textNumber(num("teeth"), 0)} must match your assembly.`;
    copyText = valid ? ["NC Helix Drill | Single-hole setup", `Cutter: ${currentTool.id} | Dc ${currentTool.dc} mm`, `Insert: ${currentTool.insert} | Table grade: ${catalog?.grade}`, `Hole D ${values.diameter} mm | Tool-tip depth L ${values.depth} mm`, `Material: ${mat.label} | ${$("coolant").selectedOptions[0].textContent}`, `Cutting-value basis: ${state.custom ? "Custom inputs. Reference: " : ""}${presetSource(row)}`, `Vc ${num("vc")} m/min | fz ${num("fz")} mm/tooth | Active teeth ${num("teeth")}`, `Spindle ${result.spindle} rpm | Feed ${textNumber(result.feed, 2)} mm/min`, `Input P ${num("pitch")} mm/orbit | Actual P ${textNumber(result.actualPitch, 4)} mm/orbit | ${result.turns} complete orbits`, `Center-path R ${textNumber(result.radius)} mm | Tool-tip Z ${textNumber(result.zTarget)} mm (work surface Z0)`, `Ramp ${textNumber(result.rampAngle, 3)}°`, "Confirm holder reach, active teeth, bottom strategy and controller settings.", sourceURL(currentTool.sourceUrl)].join("\n") : "";
    renderDiagram();
  }

  function refresh({presets = false} = {}) {
    stopPlayback();
    renderTools();
    if (presets) applyPresets();
    renderResults();
  }
  function reset() {
    Object.assign(state, {mode: "hole", toolId: "99323-012-1525", view: "top", custom: false});
    $("holeDiameter").value = "20"; $("holeDepth").value = "20";
    $("material").value = "carbon025"; $("coolant").value = "internal";
    $("power").value = "0"; $("teeth").value = "2"; $("progress").value = "35";
    document.querySelectorAll("[data-mode]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.mode === state.mode)));
    document.querySelectorAll("[data-view]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.view === state.view)));
    refresh({presets: true});
  }

  $("material").innerHTML = HELIX_DATA.materials.map(item => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.label)}</option>`).join("");
  $("ownedTool").innerHTML = HELIX_DATA.tools.map(tool => `<option value="${escapeHTML(tool.id)}">${escapeHTML(tool.id)} · Ø${tool.dc}</option>`).join("");
  $("sourceTables").innerHTML = [1, 2, 3].map(index => `<a href="${escapeHTML(sourceURL(`./sources/cutting-data-${index}.jpg`))}" target="_blank" rel="noopener">Table ${index} ↗</a>`).join("") + `<a href="${escapeHTML(sourceURL("./sources/formula.jpg"))}" target="_blank" rel="noopener">Formula ↗</a>`;
  $("setupForm").addEventListener("submit", event => event.preventDefault());
  $("resetButton").addEventListener("click", reset);
  $("restoreButton").addEventListener("click", () => refresh({presets: true}));
  document.querySelectorAll("[data-mode]").forEach(button => button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach(item => item.setAttribute("aria-pressed", String(item.dataset.mode === state.mode)));
    refresh({presets: true});
  }));
  $("candidateList").addEventListener("click", event => {
    const button = event.target.closest("button[data-tool]");
    if (!button) return;
    state.toolId = button.dataset.tool;
    refresh({presets: true});
  });
  $("ownedTool").addEventListener("change", event => {state.toolId = event.target.value; refresh({presets: true});});
  $("coolant").addEventListener("change", () => {
    if (state.mode === "hole") {
      const previous = HELIX_DATA.tools.find(tool => tool.id === state.toolId);
      const next = HELIX_DATA.tools.find(tool => tool.suffix === previous?.suffix && tool.coolant === $("coolant").value);
      if (next) state.toolId = next.id;
    }
    refresh({presets: true});
  });
  ["holeDiameter", "material", "power"].forEach(id => $(id).addEventListener(id === "holeDiameter" ? "input" : "change", () => refresh({presets: true})));
  $("holeDepth").addEventListener("input", () => refresh());
  ["vc", "fz", "pitch", "teeth"].forEach(id => $(id).addEventListener("input", () => {state.custom = true; stopPlayback(); renderResults();}));
  document.querySelectorAll("[data-view]").forEach(button => button.addEventListener("click", () => {
    state.view = button.dataset.view;
    document.querySelectorAll("[data-view]").forEach(item => item.setAttribute("aria-pressed", String(item.dataset.view === state.view)));
    renderDiagram();
  }));
  $("progress").addEventListener("input", () => {stopPlayback(); renderDiagram();});
  $("playButton").addEventListener("click", () => {
    if (state.playing) {stopPlayback(); return;}
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      $("progress").value = String((num("progress") + 10) % 101); renderDiagram(); return;
    }
    state.playing = true;
    animationStart = performance.now() - num("progress") * 100;
    $("playButton").textContent = "Pause path";
    $("playButton").setAttribute("aria-pressed", "true");
    const frame = time => {
      if (!state.playing) return;
      $("progress").value = String(((time - animationStart) / 100) % 100);
      renderDiagram();
      animationId = requestAnimationFrame(frame);
    };
    animationId = requestAnimationFrame(frame);
  });
  document.addEventListener("visibilitychange", () => {if (document.hidden) stopPlayback();});
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", stopPlayback);
  $("copyButton").addEventListener("click", async () => {
    if (!copyText) return;
    const snapshot = copyText;
    try {await navigator.clipboard.writeText(snapshot); if (copyText === snapshot) $("copyFeedback").textContent = "Setup copied, including actual Pitch and source.";}
    catch {$("copyFeedback").textContent = "Copy is unavailable in this browser. The setup values are shown above.";}
  });

  // 固定增減差，保留 .065 等手動精度，不讓原生 step 對齊偷偷改變增量。
  document.querySelectorAll('input[type="number"]').forEach(field => {
    const step = direction => {
      const value = field.value.trim() === "" ? 0 : Number(field.value);
      if (!Number.isFinite(value)) return;
      let next = Number((value + direction * Number(field.step || 1)).toFixed(6));
      if (field.min !== "") next = Math.max(next, Number(field.min));
      if (field.max !== "") next = Math.min(next, Number(field.max));
      field.value = String(next);
      field.dispatchEvent(new Event("input", {bubbles: true}));
    };
    field.addEventListener("keydown", event => {if (["ArrowUp", "ArrowDown"].includes(event.key)) {event.preventDefault(); step(event.key === "ArrowUp" ? 1 : -1);}});
    field.addEventListener("wheel", event => {if (document.activeElement === field && event.deltaY) {event.preventDefault(); step(event.deltaY < 0 ? 1 : -1);}}, {passive: false});
  });
  reset();
  // 手機輸入時保留精簡結果；正式結果區進入視窗後收起浮動摘要。
  new IntersectionObserver(entries => {$("mobileSummary").hidden = entries[0].isIntersecting;}).observe(document.querySelector(".results-panel"));
  // 使用根目錄唯一 Header/Footer，手機導覽同步更新 ARIA。
  async function loadLayout(part) {
    const response = await fetch(`../../${part}/${part}.html`);
    if (!response.ok) throw new Error(`Unable to load ${part}.`);
    $(`${part}-placeholder`).innerHTML = await response.text();
    if (part !== "header") return;
    const button = $("mobileMenuBtn"), nav = $("topNav");
    if (!button || !nav) return;
    button.setAttribute("aria-controls", "topNav"); button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", () => {const expanded = nav.classList.toggle("active"); button.setAttribute("aria-expanded", String(expanded)); button.setAttribute("aria-label", expanded ? "Close Menu" : "Open Menu");});
  }
  Promise.all([loadLayout("header"), loadLayout("footer")]).catch(error => console.warn(error.message));
})();
