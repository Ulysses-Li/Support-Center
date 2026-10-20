/* 樣板僅負責互動與呈現，切削範圍一律讀取正式 ACE 產品資料。 */
const $ = id => document.getElementById(id);
const fields = Object.fromEntries(["operation", "material", "insertSize", "angle", "diameter", "cuttingSpeed", "feedPerRev"].map(id => [id, $(id)]));
const isoGroups = { carbonLow: "P", carbonHigh: "P", lowAlloy: "P", highAlloy: "P", stainless: "M", castIron: "K", nonFerrous: "N" };
const operations = PRODUCT_PAGE_DATA.cuttingData.operations;
let copyText = "";
let previousContactReference = $("contactReference").value;

// 用 SVG 原生幾何呈現局部直邊剖面；不以圖形比例推算數字，所有尺寸由純函式提供。
function renderChamferDiagram(result) {
  const svg = $("chamferDiagram");
  if (!result?.valid) {
    svg.innerHTML = '<title id="diagramTitle">Chamfer section unavailable</title><desc id="diagramDescription">Enter valid C and contact diameter values to display the section.</desc><text x="360" y="190" text-anchor="middle" fill="#5c7183" font-size="18">Adjust C and contact D to display the section.</text>';
    $("diagramCaption").textContent = "The full chamfer must fit inside the usable cutting edge.";
    return;
  }
  const { geometry: g, radius, c, diameter, position, actualDrop, z, reference } = result;
  const maxR = g.maxDiameter / 2;
  const scale = Math.min(58, 320 / (2 * maxR + c), 195 / (actualDrop + g.tipCorrection + 1));
  const edgeX = 210, topY = 130, axisX = edgeX + radius * scale;
  const upperX = edgeX - c * scale, lowerY = topY + c * scale;
  const tipY = topY + actualDrop * scale, theoreticalY = tipY + g.tipCorrection * scale;
  const toolTopY = tipY - (maxR - g.tipCorrection) * scale;
  const refY = topY + (1 - position) * c * scale;
  const leftRef = axisX - diameter / 2 * scale, rightRef = axisX + diameter / 2 * scale;
  const shownDatumY = result.datum === "actual" ? tipY : theoreticalY;
  const refLabel = { upper: "upper edge", middle: "middle", lower: "lower edge" }[reference];
  svg.innerHTML = `
    <title id="diagramTitle">45 degree chamfer: C${numberText(c, 4)}, compensation R${numberText(radius, 4)}, Z${numberText(z, 4)}</title>
    <desc id="diagramDescription">The material is on the left. The original contour is the vertical dashed line. The tool center is R millimeters toward the free side. The selected diameter meets the ${refLabel} of the orange chamfer. Negative Z is measured from the work surface to the selected tool tip datum. Local straight section only.</desc>
    <defs><pattern id="sectionHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="10" stroke="#cfdee8" stroke-width="2"/></pattern>
      <marker id="dimArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#0067ad"/></marker></defs>
    <path d="M36 ${topY}H${upperX}L${edgeX} ${lowerY}V320H36Z" fill="#edf3f7"/><path d="M36 ${topY}H${upperX}L${edgeX} ${lowerY}V320H36Z" fill="url(#sectionHatch)" stroke="#9eb5c5"/>
    <path d="M${axisX - maxR * scale} ${toolTopY}H${axisX + maxR * scale}L${axisX + g.tipCorrection * scale} ${tipY}H${axisX - g.tipCorrection * scale}Z" fill="#0067ad15" stroke="#0067ad" stroke-width="2"/>
    <path d="M${axisX - g.tipCorrection * scale} ${tipY}L${axisX} ${theoreticalY}L${axisX + g.tipCorrection * scale} ${tipY}" fill="none" stroke="#0067ad" stroke-dasharray="3 3"/>
    <path d="M36 ${topY}H665M${edgeX} 86V342" stroke="#839caf" stroke-dasharray="5 5" fill="none"/>
    <path d="M${axisX} 45V342" stroke="#0067ad" stroke-dasharray="7 4"/><text x="${axisX}" y="30" text-anchor="middle" class="diagram-label">Tool center</text>
    <path d="M${upperX} ${topY}L${edgeX} ${lowerY}" stroke="#f05a1a" stroke-width="5"/>
    <path d="M${leftRef} ${refY}H${rightRef}" stroke="#f05a1a" stroke-dasharray="4 3"/><circle cx="${leftRef}" cy="${refY}" r="5" fill="#f05a1a"/>
    <text x="${rightRef + 12}" y="${refY - 8}" class="diagram-contact">Ø${numberText(diameter, 4)}</text>
    <text x="40" y="${topY - 12}" class="diagram-label">Work surface · Z0</text><text x="55" y="280" class="diagram-label">Material</text>
    <path d="M${upperX} ${topY - 8}V84M${edgeX} ${topY - 8}V84M${upperX} 94H${edgeX}" stroke="#0067ad" fill="none"/>
    <text x="${(upperX + edgeX) / 2}" y="77" text-anchor="middle" class="diagram-label">C ${numberText(c, 4)}</text>
    <path d="M${edgeX} 350H${axisX}" stroke="#0067ad" marker-start="url(#dimArrow)" marker-end="url(#dimArrow)"/>
    <text x="${(edgeX + axisX) / 2}" y="374" text-anchor="middle" class="diagram-label">R ${numberText(radius, 4)} mm</text>
    <text x="36" y="398" class="diagram-label">Dashed vertical at material edge = original XY contour</text>
    <path d="M615 ${topY}V${shownDatumY}M${axisX} ${shownDatumY}H624" stroke="#0067ad" fill="none" marker-start="url(#dimArrow)" marker-end="url(#dimArrow)"/>
    <text x="632" y="${(topY + shownDatumY) / 2}" text-anchor="middle" transform="rotate(-90 632 ${(topY + shownDatumY) / 2})" class="diagram-label">Z ${numberText(z, 4)} mm</text>`;
  $("diagramCaption").textContent = `Contact D is at the ${refLabel}. Z uses the ${result.datum === "actual" ? "actual insert tip" : "theoretical sharp point"}. Local section; dimensions in mm.`;
}

function renderChamferSetup(operation, insert, angle, diameter) {
  const chamfering = operation.id === "chamfering";
  const enabled = chamfering && angle === "90";
  document.body.classList.toggle("chamfer-active", enabled);
  ["chamferInputs", "chamferSetup", "chamferFigure", "chamferDetails"].forEach(id => { $(id).hidden = !enabled; });
  $("chamferMessage").hidden = !chamfering;
  $("chamferMessage").textContent = "";
  $("cuttingValuesTitle").textContent = enabled ? "Chamfer & cutting values" : "Cutting values";
  $("diameterLabel").textContent = enabled ? "Contact Ø" : "Diameter";
  $("depthLabel").textContent = "Spotting depth";
  $("maxDepthLabel").textContent = "Max. depth";
  ["compensationR", "zTarget", "compensationDiameter"].forEach(id => { $(id).textContent = "—"; });
  if (!chamfering) return null;
  if (!enabled) {
    $("chamferMessage").textContent = "C-chamfer compensation supports 90° inserts (45° face). Select 90° to use the geometry assistant. Speeds and feeds remain available for this angle.";
    return null;
  }
  const c = Number($("chamferC").value);
  const reference = $("contactReference").value;
  const datum = $("zDatum").value;
  const result = calculateChamfer({ size: insert.id, angle, c, diameter, reference, datum });
  const g = result.geometry;
  $("depthLabel").textContent = "Chamfer size";
  $("spotDepth").textContent = Number.isFinite(c) && c > 0 ? `C${numberText(c, 4)} × 45°` : "—";
  $("maxDepthLabel").textContent = "Max. tool depth";
  $("tmax").textContent = `${g.maxDepth} mm`;
  $("chamferC").max = g.maxC;
  const validC = Number.isFinite(c) && c > 0 && c <= g.maxC;
  $("chamferC").setAttribute("aria-invalid", String(!validC));
  $("chamferC").classList.toggle("is-invalid", !validC);
  $("chamferCError").textContent = validC ? "" : `Enter C above 0 and up to ${g.maxC} mm.`;
  $("chamferCHint").textContent = `Catalog Cmax ${g.maxC} mm`;
  $("tipCorrectionNote").textContent = `Catalog tip correction ℓ = ${g.tipCorrection} mm. Z0 is the work surface.`;
  $("compensationDatum").textContent = `Z0 = work surface · ${datum === "actual" ? "actual insert tip" : "theoretical sharp point"} tool-length reference.`;
  const slider = $("contactDiameterRange");
  slider.disabled = !Number.isFinite(result.minD) || result.minD > result.maxD;
  if (!slider.disabled) {
    slider.min = result.minD;
    slider.max = result.maxD;
    slider.value = Math.max(result.minD, Math.min(result.maxD, diameter || result.minD));
    slider.setAttribute("aria-valuetext", `Contact diameter ${numberText(Number(slider.value), 4)} mm`);
    $("diameterHint").textContent = `Contact range Ø${numberText(result.minD, 4)}–${numberText(result.maxD, 4)} mm`;
  }
  if (validC && !result.valid) {
    fields.diameter.classList.add("is-invalid");
    fields.diameter.setAttribute("aria-invalid", "true");
    $("diameterError").textContent = "The full chamfer extends outside the usable edge. Adjust contact D or C.";
  }
  const messages = [...result.errors];
  if (result.valid) {
    $("compensationR").textContent = numberText(result.radius, 4);
    $("zTarget").textContent = numberText(result.z, 4);
    $("compensationDiameter").textContent = `Ø${numberText(result.compensationDiameter, 4)} mm`;
    if (result.reduceFeed) messages.push(`Catalog guidance: reduce feed above C${g.reduceFeedAbove}. At Cmax, use the minimum feed ${selection().feedRange[0]} mm/rev.`);
  }
  $("chamferMessage").textContent = messages.join(" ");
  $("geometryFormula").textContent = `90° insert / 45° face: R = D/2 − k×C (upper k=1, middle k=0.5, lower k=0). Z = −(R+C${datum === "actual" ? "−ℓ" : ""}). ℓ = ${g.tipCorrection} mm.`;
  renderChamferDiagram(result);
  return result;
}

function escapeHTML(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
const numberText = (value, digits = 2) => Number.isFinite(value) ? String(Number(value.toFixed(digits))) : "—";
const midpoint = range => (Number(range[0]) + Number(range[1])) / 2;
function selection() {
  const operation = operations.find(item => item.id === fields.operation.value);
  const insert = operation.insertGroups.find(item => item.id === fields.insertSize.value);
  const material = operation.materials[fields.material.value];
  const angle = fields.angle.value;
  return { operation, insert, material, angle, feedRange: insert.angles[angle].f[fields.material.value] };
}

// 保留仍相容的選擇；上游改變時重新配對刀片、角度與材料。
function fillOptions(select, options, fallback) {
  const previous = select.value;
  select.innerHTML = options.map(([value, label]) => `<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`).join("");
  select.value = options.some(([value]) => value === previous) ? previous : fallback;
}
function refreshOptions() {
  const operation = operations.find(item => item.id === fields.operation.value);
  fillOptions(fields.insertSize, operation.insertGroups.map(item => [item.id, item.label]), operation.insertGroups[0].id);
  const insert = operation.insertGroups.find(item => item.id === fields.insertSize.value);
  const angles = Object.keys(insert.angles);
  fillOptions(fields.angle, angles.map(angle => [angle, `${angle}°`]), angles.includes("90") ? "90" : angles[0]);
  const materials = Object.entries(operation.materials);
  fillOptions(fields.material, materials.map(([id, item]) => [id, item.label]), operation.materials.stainless ? "stainless" : materials[0][0]);
}
function resetValues({ resetDiameter = true } = {}) {
  const { insert, material, feedRange } = selection();
  if (resetDiameter) fields.diameter.value = insert.diameter;
  fields.cuttingSpeed.value = numberText(midpoint(material.vc), 1);
  fields.feedPerRev.value = numberText(midpoint(feedRange), 3);
  renderResults();
}

// 公式沿用現有計算器，無效數值不產生可複製結果，避免保留上一筆有效值。
function renderResults() {
  const { operation, insert, material, angle, feedRange } = selection();
  const diameter = Number(fields.diameter.value);
  const vc = Number(fields.cuttingSpeed.value);
  const feed = Number(fields.feedPerRev.value);
  const validD = Number.isFinite(diameter) && diameter > 0 && diameter <= insert.diameter;
  const validVc = Number.isFinite(vc) && vc > 0;
  const validFeed = Number.isFinite(feed) && feed > 0;
  const rpm = validD && validVc ? 1000 * vc / (Math.PI * diameter) : NaN;
  const feedRate = validFeed ? rpm * feed : NaN;
  const valid = Number.isFinite(rpm) && Number.isFinite(feedRate);
  const factors = { "60": .866, "90": .5, "120": .289, "142": .172 };
  const offset = insert.spotDepth?.l?.[angle];
  const depth = operation.id === "spotting" && validD && Number.isFinite(offset) ? Math.max(0, diameter * factors[angle] - offset) : NaN;
  const model = `${insert.label.split(" - ").slice(1).join(" - ")}-${angle}`;
  $("materialBadge").textContent = isoGroups[fields.material.value] || "—";
  $("materialBadge").dataset.iso = isoGroups[fields.material.value];
  fields.diameter.max = insert.diameter;
  [["diameter", validD, "diameterError", `Enter a diameter above 0 and up to ${insert.diameter} mm.`], ["cuttingSpeed", validVc, "vcError", "Enter a speed above 0."], ["feedPerRev", validFeed, "feedError", "Enter a feed above 0."]].forEach(([id, isValid, error, message]) => {
    fields[id].classList.toggle("is-invalid", !isValid);
    fields[id].setAttribute("aria-invalid", String(!isValid));
    $(error).textContent = isValid ? "" : message;
  });
  $("diameterHint").textContent = `Max. ${insert.diameter} mm`;
  $("vcHint").textContent = `${material.vc[0]}–${material.vc[1]} m/min`;
  $("feedHint").textContent = `${feedRange[0]}–${feedRange[1]} mm/rev`;
  $("rpm").textContent = Number.isFinite(rpm) ? Math.round(rpm).toLocaleString("en-US") : "—";
  $("feedRate").textContent = numberText(feedRate, 1);
  $("insertModel").textContent = model;
  $("selectionSummary").textContent = `${operation.label} · ${material.label} · ${angle}°`;
  $("grade").textContent = material.grade;
  $("dmax").textContent = `${insert.diameter} mm`;
  $("spotDepth").textContent = Number.isFinite(depth) ? `${numberText(depth)} mm` : "—";
  const maxDepth = insert.spotDepth?.tmax?.[angle];
  $("tmax").textContent = Number.isFinite(maxDepth) ? `${maxDepth} mm` : "—";
  $("peckNote").textContent = operation.showQ ? `Peck depth Q: ${material.q || "See product catalog"}.` : "Feed is specified per revolution (mm/rev).";
  const messages = [];
  if (!valid) messages.push("Check the highlighted cutting values to calculate a result.");
  if (validVc && (vc < material.vc[0] || vc > material.vc[1])) messages.push("Cutting speed is outside the recommended range.");
  if (validFeed && (feed < feedRange[0] || feed > feedRange[1])) messages.push("Feed is outside the recommended range.");
  if (operation.id === "spotting" && angle === "60") messages.push(`60° spotting requires a peck cycle. Q: ${material.q}; select Q by material and t/Tmax.`);
  $("calculationMessage").textContent = messages.join(" ");
  const chamfer = renderChamferSetup(operation, insert, angle, diameter);
  $("copyButton").disabled = !valid || (chamfer && !chamfer.valid);
  $("copyFeedback").textContent = "";
  const geometryLines = chamfer?.valid ? [
    `Chamfer: C${numberText(chamfer.c, 4)} x 45 deg | Contact D at ${chamfer.reference} of chamfer`,
    `Full geometry compensation: R ${numberText(chamfer.radius, 4)} mm / diameter ${numberText(chamfer.compensationDiameter, 4)} mm`,
    `Z target: ${numberText(chamfer.z, 4)} mm | Work surface Z0 | ${chamfer.datum === "actual" ? "Actual insert tip" : "Theoretical sharp point"} datum`,
    `Catalog tip correction: ${chamfer.geometry.tipCorrection} mm`,
    `Program the original contour. Apply full geometry compensation once; select G41/G42 from travel direction and the free side. D address is an offset register.`,
    `Local straight-edge geometry only; check corners, hole clearance and lead-in/out separately.`,
    ...(chamfer.reduceFeed ? [$("chamferMessage").textContent] : [])
  ] : [];
  copyText = !$("copyButton").disabled ? [`ACE Spot Drill | ${operation.label}`, `Insert: ${model} | Grade: ${material.grade}`, `Material: ${material.label}`, `D: ${diameter} mm | Vc: ${vc} m/min | f: ${feed} mm/rev`, `Spindle speed: ${Math.round(rpm)} rpm`, `Feed rate: ${numberText(feedRate, 1)} mm/min`, ...geometryLines, ...messages].join("\n") : "";
}

$("calculatorForm").addEventListener("submit", event => event.preventDefault());
fields.operation.addEventListener("change", () => { refreshOptions(); resetValues(); });
fields.insertSize.addEventListener("change", () => { refreshOptions(); resetValues(); });
[fields.material, fields.angle].forEach(field => field.addEventListener("change", () => resetValues({ resetDiameter: false })));
[fields.diameter, fields.cuttingSpeed, fields.feedPerRev].forEach(field => field.addEventListener("input", renderResults));
["chamferC", "zDatum"].forEach(id => $(id).addEventListener(id === "chamferC" ? "input" : "change", renderResults));
$("contactReference").addEventListener("change", () => {
  const nextReference = $("contactReference").value;
  const { operation, angle } = selection();
  if (operation.id === "chamfering" && angle === "90") {
    const diameter = convertContactDiameter({
      diameter: Number(fields.diameter.value), c: Number($("chamferC").value),
      from: previousContactReference, to: nextReference
    });
    // 先同步數字輸入，再由同一輪 render 更新滑桿、剖面、轉速進給與複製內容。
    if (Number.isFinite(diameter)) fields.diameter.value = numberText(diameter, 10);
  }
  previousContactReference = nextReference;
  renderResults();
});
$("contactDiameterRange").addEventListener("input", () => { fields.diameter.value = $("contactDiameterRange").value; renderResults(); });
$("resetButton").addEventListener("click", () => resetValues());
$("copyButton").addEventListener("click", async () => {
  if (!copyText) return;
  const text = copyText;
  try {
    await navigator.clipboard.writeText(text);
    if (copyText === text) $("copyFeedback").textContent = "Cutting data copied.";
  } catch {
    $("copyFeedback").textContent = "Copy is unavailable. Select the displayed results to copy them.";
  }
});

// 預覽連結可指定既有產品條件；只接受資料表中存在的值，不接受任意 HTML。
const initialParams = new URLSearchParams(window.location.search);
const initialOperation = operations.find(item => item.id === initialParams.get("operation")) || operations[0];
fillOptions(fields.operation, operations.map(item => [item.id, item.label]), initialOperation.id);
refreshOptions();
fields.insertSize.value = initialOperation.insertGroups.some(item => item.id === initialParams.get("size")) ? initialParams.get("size") : "SI10";
refreshOptions();
if (initialOperation.materials[initialParams.get("material")]) fields.material.value = initialParams.get("material");
resetValues();

// 沿用全站 Header／Footer，並補齊手機選單的語意狀態。
async function loadLayout(part) {
  const response = await fetch(`../../${part}/${part}.html`);
  if (!response.ok) return;
  $(`${part}-placeholder`).innerHTML = await response.text();
  if (part === "header") {
    const button = $("mobileMenuBtn");
    const nav = $("topNav");
    button.setAttribute("aria-controls", "topNav");
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", () => {
      const expanded = nav.classList.toggle("active");
      button.setAttribute("aria-expanded", String(expanded));
      button.setAttribute("aria-label", expanded ? "Close Menu" : "Open Menu");
    });
  }
}
Promise.all([loadLayout("header"), loadLayout("footer")]).catch(() => {});
