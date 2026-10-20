/* 切削速度／進給讀取正式 ACE 產品資料；剖面幾何使用已核對型錄的共用尺寸。 */
const $ = id => document.getElementById(id);
const fields = Object.fromEntries(["operation", "material", "insertSize", "angle", "diameter", "cuttingSpeed", "feedPerRev"].map(id => [id, $(id)]));
const isoGroups = { carbonLow: "P", carbonHigh: "P", lowAlloy: "P", highAlloy: "P", stainless: "M", castIron: "K", nonFerrous: "N" };
const operations = PRODUCT_PAGE_DATA.cuttingData.operations;
let copyText = "";
let previousContactReference = $("contactReference").value;

// 點鑽剖面保持相同 X／Z 比例；橘色為切削刃，虛線延伸至理論尖點，實際深度扣除型錄 ℓ。
function renderSpottingDiagram(result) {
  const svg = $("spottingDiagram");
  const g = result.geometry;
  $("spottingAngleLabel").textContent = g ? `${g.angle}° insert · axial section` : "";
  if (!result.valid) {
    svg.innerHTML = '<title id="spottingDiagramTitle">Spotting section unavailable</title><desc id="spottingDiagramDescription">Enter a valid diameter within the modeled cutting edge and catalog depth limit.</desc><text x="360" y="190" text-anchor="middle" fill="#5c7183" font-size="18">Adjust D to display the spotting section.</text>';
    $("spottingCaption").textContent = result.errors.join(" ");
    return;
  }
  const { diameter, depth, theoreticalDepth, z } = result;
  const scale = Math.min(80, 350 / diameter, 160 / theoreticalDepth);
  const axisX = 320, topY = 140;
  const leftX = axisX - diameter / 2 * scale, rightX = axisX + diameter / 2 * scale;
  const tipY = topY + depth * scale, theoreticalY = topY + theoreticalDepth * scale;
  const tipR = g.tipCorrection / g.depthPerWidth * scale;
  const halfAngle = g.angle * Math.PI / 360;
  const arcRadius = Math.min(32, theoreticalDepth * scale * .55);
  const arcX = arcRadius * Math.sin(halfAngle), arcY = theoreticalY - arcRadius * Math.cos(halfAngle);
  const material = `M36 ${topY}H${leftX}L${axisX - tipR} ${tipY}H${axisX + tipR}L${rightX} ${topY}H684V325H36Z`;
  svg.innerHTML = `
    <title id="spottingDiagramTitle">${g.angle} degree spotting: diameter ${numberText(diameter, 4)} mm, actual tip depth ${numberText(depth, 4)} mm, Z ${numberText(z, 4)} mm</title>
    <desc id="spottingDiagramDescription">A centered axial section through the spotted hole. D is measured at the work surface Z0. The solid tool tip stops above the dashed theoretical sharp point by the catalog correction ℓ. Depth t and negative Z use the actual insert tip. Nose radius is not modeled.</desc>
    <defs><pattern id="spottingHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="10" stroke="#cfdee8" stroke-width="2"/></pattern>
      <marker id="spottingArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#0067ad"/></marker></defs>
    <path d="${material}" fill="#edf3f7"/><path d="${material}" fill="url(#spottingHatch)" stroke="#9eb5c5"/>
    <path d="M${leftX} ${topY}H${rightX}L${axisX + tipR} ${tipY}H${axisX - tipR}Z" fill="#0067ad15"/>
    <path d="M${leftX} ${topY}L${axisX - tipR} ${tipY}M${rightX} ${topY}L${axisX + tipR} ${tipY}" stroke="#f05a1a" stroke-width="4"/>
    <path d="M${axisX - tipR} ${tipY}H${axisX + tipR}" stroke="#0067ad" stroke-width="2"/>
    <path d="M${axisX - tipR} ${tipY}L${axisX} ${theoreticalY}L${axisX + tipR} ${tipY}" fill="none" stroke="#0067ad" stroke-dasharray="3 3"/>
    <path d="M36 ${topY}H684M${axisX} 45V340" fill="none" stroke="#839caf" stroke-dasharray="6 4"/>
    <text x="${axisX}" y="30" text-anchor="middle" class="diagram-label">Tool / hole center</text>
    <text x="40" y="${topY - 13}" class="diagram-label">Work surface · Z0</text><text x="55" y="288" class="diagram-label">Material</text>
    <path d="M${leftX} ${topY - 7}V73M${rightX} ${topY - 7}V73M${leftX} 84H${rightX}" fill="none" stroke="#0067ad" marker-end="url(#spottingArrow)"/>
    <path d="M${rightX} 84H${leftX}" stroke="#0067ad" marker-end="url(#spottingArrow)"/>
    <text x="${axisX}" y="68" text-anchor="middle" class="diagram-contact">D Ø${numberText(diameter, 4)} mm</text>
    <path d="M${axisX - arcX} ${arcY}A${arcRadius} ${arcRadius} 0 0 1 ${axisX + arcX} ${arcY}" stroke="#0067ad" fill="none"/>
    <text x="${axisX}" y="${theoreticalY - arcRadius - 12}" text-anchor="middle" class="diagram-contact">${g.angle}°</text>
    <path d="M${axisX + tipR} ${tipY}H629M620 ${topY}V${tipY}" fill="none" stroke="#0067ad"/>
    <path d="M620 ${topY}V${tipY}" stroke="#0067ad" marker-start="url(#spottingArrow)" marker-end="url(#spottingArrow)"/>
    <text x="642" y="${(topY + tipY) / 2}" text-anchor="middle" transform="rotate(-90 642 ${(topY + tipY) / 2})" class="diagram-label">t ${numberText(depth, 4)} mm</text>
    <text x="475" y="${tipY - 12}" class="diagram-label">Actual insert tip</text>
    <path d="M${axisX} ${theoreticalY}H540" stroke="#839caf" stroke-dasharray="3 3"/>
    <text x="470" y="${theoreticalY + 22}" class="diagram-label">Theoretical point</text>
    <text x="36" y="365" class="diagram-label">Catalog tip correction ℓ = ${g.tipCorrection} mm</text>
    <text x="36" y="394" class="diagram-contact">Z target ${numberText(z, 4)} mm · actual insert tip</text>`;
  $("spottingCaption").textContent = `D Ø${numberText(diameter, 4)} mm at Z0 → depth t ${numberText(depth, 4)} mm. Z ${numberText(z, 4)} mm assumes the actual insert tip is touched off at the work surface. Idealized section; nose radius is not shown.`;
}

// 用 SVG 原生幾何呈現局部直邊剖面；不以圖形比例推算數字，所有尺寸由純函式提供。
function renderChamferDiagram(result) {
  const svg = $("chamferDiagram");
  if (!result?.valid) {
    svg.innerHTML = '<title id="diagramTitle">Chamfer section unavailable</title><desc id="diagramDescription">Enter valid chamfer width and contact diameter values to display the section.</desc><text x="360" y="190" text-anchor="middle" fill="#5c7183" font-size="18">Adjust width and contact D to display the section.</text>';
    $("diagramCaption").textContent = "The full chamfer must fit inside the modeled diameter band and catalog Tmax.";
    return;
  }
  const { geometry: g, radius, c, height, diameter, position, actualDrop, z, reference } = result;
  const maxR = g.maxDiameter / 2;
  const scale = Math.min(58, 320 / (2 * maxR + c), 190 / (Math.max(actualDrop + g.tipCorrection, height) + .6));
  const edgeX = 210, topY = 130, axisX = edgeX + radius * scale;
  const upperX = edgeX - c * scale, lowerY = topY + height * scale;
  const tipY = topY + actualDrop * scale, theoreticalY = tipY + g.tipCorrection * scale;
  const tipR = g.tipCorrection / g.depthPerWidth;
  // 若錐體在圖框上方延伸，只裁切顯示長度；斜面角度和所有尺寸仍用真實比例。
  const toolTopY = Math.max(55, tipY - (maxR * g.depthPerWidth - g.tipCorrection) * scale);
  const visibleTopR = (tipY - toolTopY) / (g.depthPerWidth * scale) + tipR;
  const refY = topY + (1 - position) * height * scale;
  const leftRef = axisX - diameter / 2 * scale, rightRef = axisX + diameter / 2 * scale;
  const shownDatumY = result.datum === "actual" ? tipY : theoreticalY;
  const refLabel = { upper: "upper edge", middle: "middle", lower: "lower edge" }[reference];
  const beta = g.faceAngle * Math.PI / 180;
  const arcEndX = upperX + 25 * Math.cos(beta), arcEndY = topY + 25 * Math.sin(beta);
  svg.innerHTML = `
    <title id="diagramTitle">${g.faceAngle} degree chamfer: W${numberText(c, 4)}, H${numberText(height, 4)}, compensation R${numberText(radius, 4)}, Z${numberText(z, 4)}</title>
    <desc id="diagramDescription">The material is on the left. The original contour is the vertical dashed line. The tool center is R millimeters toward the free side. The selected diameter meets the ${refLabel} of the orange chamfer. Negative Z is measured from the work surface to the selected tool tip datum. Local straight section only.</desc>
    <defs><pattern id="sectionHatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="10" stroke="#cfdee8" stroke-width="2"/></pattern>
      <marker id="dimArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#0067ad"/></marker></defs>
    <path d="M36 ${topY}H${upperX}L${edgeX} ${lowerY}V320H36Z" fill="#edf3f7"/><path d="M36 ${topY}H${upperX}L${edgeX} ${lowerY}V320H36Z" fill="url(#sectionHatch)" stroke="#9eb5c5"/>
    <path d="M${axisX - visibleTopR * scale} ${toolTopY}H${axisX + visibleTopR * scale}L${axisX + tipR * scale} ${tipY}H${axisX - tipR * scale}Z" fill="#0067ad15" stroke="#0067ad" stroke-width="2"/>
    <path d="M${axisX - tipR * scale} ${tipY}L${axisX} ${theoreticalY}L${axisX + tipR * scale} ${tipY}" fill="none" stroke="#0067ad" stroke-dasharray="3 3"/>
    <path d="M36 ${topY}H665M${edgeX} 86V342" stroke="#839caf" stroke-dasharray="5 5" fill="none"/>
    <path d="M${axisX} 45V342" stroke="#0067ad" stroke-dasharray="7 4"/><text x="${axisX}" y="30" text-anchor="middle" class="diagram-label">Tool center</text>
    <path d="M${upperX} ${topY}L${edgeX} ${lowerY}" stroke="#f05a1a" stroke-width="5"/>
    <path d="M${upperX + 25} ${topY}A25 25 0 0 1 ${arcEndX} ${arcEndY}" stroke="#b53a0a" fill="none"/>
    <text x="${upperX + 45 * Math.cos(beta / 2)}" y="${topY + 45 * Math.sin(beta / 2) + 4}" class="diagram-contact">${g.faceAngle}°</text>
    <path d="M${leftRef} ${refY}H${rightRef}" stroke="#f05a1a" stroke-dasharray="4 3"/><circle cx="${leftRef}" cy="${refY}" r="5" fill="#f05a1a"/>
    <text x="${rightRef + 12}" y="${refY - 8}" class="diagram-contact">Ø${numberText(diameter, 4)}</text>
    <text x="40" y="${topY - 12}" class="diagram-label">Work surface · Z0</text><text x="55" y="280" class="diagram-label">Material</text>
    <path d="M${upperX} ${topY - 8}V84M${edgeX} ${topY - 8}V84M${upperX} 94H${edgeX}" stroke="#0067ad" fill="none"/>
    <text x="${(upperX + edgeX) / 2}" y="77" text-anchor="middle" class="diagram-label">${g.angle === 90 ? "C" : "W"} ${numberText(c, 4)}</text>
    <path d="M550 ${topY}V${lowerY}" stroke="#0067ad" fill="none" marker-start="url(#dimArrow)" marker-end="url(#dimArrow)"/>
    <path d="M550 ${(topY + lowerY) / 2}V100H530" stroke="#0067ad" fill="none"/>
    <text x="535" y="92" text-anchor="end" class="diagram-label">H ${numberText(height, 4)} mm</text>
    <path d="M${edgeX} 350H${axisX}" stroke="#0067ad" marker-start="url(#dimArrow)" marker-end="url(#dimArrow)"/>
    <text x="${(edgeX + axisX) / 2}" y="374" text-anchor="middle" class="diagram-label">R ${numberText(radius, 4)} mm</text>
    <text x="36" y="398" class="diagram-label">Dashed vertical at material edge = original XY contour</text>
    <path d="M615 ${topY}V${shownDatumY}" stroke="#0067ad" fill="none" marker-start="url(#dimArrow)" marker-end="url(#dimArrow)"/><path d="M${axisX} ${shownDatumY}H624" stroke="#0067ad"/>
    <text x="632" y="${(topY + shownDatumY) / 2}" text-anchor="middle" transform="rotate(-90 632 ${(topY + shownDatumY) / 2})" class="diagram-label">Z ${numberText(z, 4)} mm</text>`;
  $("diagramCaption").textContent = `${g.angle}° insert → ${g.faceAngle}° face. Horizontal width W = ${numberText(c, 4)} mm; vertical depth H = ${numberText(height, 4)} mm. Contact D is at the ${refLabel}; Z uses the ${result.datum === "actual" ? "actual insert tip" : "theoretical sharp point"}.`;
}

function renderChamferSetup(operation, insert, angle, diameter) {
  const chamfering = operation.id === "chamfering";
  const enabled = chamfering && Boolean(getChamferGeometry(insert.id, angle));
  document.body.classList.toggle("chamfer-active", enabled);
  ["chamferInputs", "chamferSetup", "chamferFigure", "chamferDetails"].forEach(id => { $(id).hidden = !enabled; });
  $("chamferMessage").hidden = !chamfering;
  $("chamferMessage").textContent = "";
  $("cuttingValuesTitle").textContent = enabled ? "Chamfer & cutting values" : "Cutting values";
  $("diameterLabel").textContent = enabled ? "Contact Ø" : "Diameter";
  $("depthLabel").textContent = "Spotting depth t";
  $("maxDepthLabel").textContent = "Max. depth";
  ["compensationR", "zTarget", "compensationDiameter"].forEach(id => { $(id).textContent = "—"; });
  if (!chamfering) return null;
  if (!enabled) {
    $("chamferMessage").textContent = "Geometry is not available for this insert and angle.";
    return null;
  }
  const c = Number($("chamferC").value);
  const reference = $("contactReference").value;
  const datum = $("zDatum").value;
  const result = calculateChamfer({ size: insert.id, angle, c, diameter, reference, datum });
  const g = result.geometry;
  const widthLabel = g.angle === 90 ? "C" : "W";
  $("chamferWidthLabel").textContent = g.angle === 90 ? "Chamfer size C" : "Horizontal width W";
  $("chamferFaceLabel").textContent = `× ${g.faceAngle}°`;
  $("diagramAngleLabel").textContent = `${g.angle}° insert · ${g.faceAngle}° face`;
  $("depthLabel").textContent = "Chamfer size";
  $("spotDepth").textContent = Number.isFinite(c) && c > 0 ? `${widthLabel}${numberText(c, 4)} × ${g.faceAngle}°` : "—";
  $("maxDepthLabel").textContent = "Max. tool depth";
  $("tmax").textContent = `${g.maxDepth} mm`;
  $("chamferC").max = g.maxC;
  const validC = Number.isFinite(c) && c > 0 && c <= g.maxC;
  $("chamferC").setAttribute("aria-invalid", String(!validC));
  $("chamferC").classList.toggle("is-invalid", !validC);
  $("chamferCError").textContent = validC ? "" : `Enter ${widthLabel} above 0 and up to ${g.maxC} mm.`;
  $("chamferCHint").textContent = g.maxWidthSource === "catalog" ? `Catalog Cmax ${g.maxC} mm` : `Geometric W limit ${numberText(g.maxC, 4)} mm (Dmax / Tmax; not a rated Cmax)`;
  $("tipCorrectionNote").textContent = `Catalog tip correction ℓ = ${g.tipCorrection} mm. Z0 is the work surface.`;
  $("compensationDatum").textContent = `Z0 = work surface · ${datum === "actual" ? "actual insert tip" : "theoretical sharp point"} tool-length reference.`;
  $("chamferDepthHint").textContent = validC ? `Horizontal W ${numberText(c, 4)} mm → vertical H ${numberText(c * g.depthPerWidth, 4)} mm` : "";
  const slider = $("contactDiameterRange");
  const sliderMin = Math.ceil((result.minD - 1e-10) * 10000) / 10000;
  const sliderMax = Math.floor((result.maxD + 1e-10) * 10000) / 10000;
  slider.disabled = !Number.isFinite(result.minD) || sliderMin > sliderMax;
  if (!slider.disabled) {
    slider.min = sliderMin;
    slider.max = sliderMax;
    slider.value = Math.max(sliderMin, Math.min(sliderMax, diameter || sliderMin));
    slider.setAttribute("aria-valuetext", `Contact diameter ${numberText(Number(slider.value), 4)} mm`);
    $("diameterHint").textContent = `Contact range Ø${numberText(result.minD, 4)}–${numberText(result.maxD, 4)} mm`;
  }
  if (validC && !result.valid) {
    fields.diameter.classList.add("is-invalid");
    fields.diameter.setAttribute("aria-invalid", "true");
    $("diameterError").textContent = `The chamfer exceeds the modeled band or Tmax. Adjust contact D or ${widthLabel}.`;
  }
  const messages = [...result.errors];
  if (result.valid) {
    $("compensationR").textContent = numberText(result.radius, 4);
    $("zTarget").textContent = numberText(result.z, 4);
    $("compensationDiameter").textContent = `Ø${numberText(result.compensationDiameter, 4)} mm`;
    if (result.reduceFeed) messages.push(`Catalog guidance: reduce feed above C${g.reduceFeedAbove}. At Cmax, use the minimum feed ${selection().feedRange[0]} mm/rev.`);
  }
  $("chamferMessage").textContent = messages.join(" ");
  $("geometryFormula").textContent = `${g.angle}° insert / ${g.faceAngle}° face: q = cot(${g.angle}°/2); H = W×q; R = D/2 − k×W (upper k=1, middle k=0.5, lower k=0). Z = −((R+W)×q${datum === "actual" ? "−ℓ" : ""}). ℓ = ${g.tipCorrection} mm. ${g.minDiameterSource === "catalog" ? "Lower band uses catalog d1." : "Lower band is the geometric tip-plane intersection; catalog d1 and nose radius are not specified for this angle."}`;
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
function resetValues({ resetDiameter = true, fitDiameter = false } = {}) {
  const { operation, insert, angle, material, feedRange } = selection();
  if (resetDiameter) fields.diameter.value = insert.diameter;
  // 換角度／刀片時同步配對 D，尤其 60° 需同時滿足 Tmax；材質變更不改使用者的 D。
  if ((resetDiameter || fitDiameter) && operation.id === "chamfering") {
    const band = calculateChamfer({ size: insert.id, angle, c: Number($("chamferC").value), diameter: Number(fields.diameter.value), reference: $("contactReference").value, datum: $("zDatum").value });
    if (Number.isFinite(band.minD) && band.minD <= band.maxD) {
      const lower = Math.ceil((band.minD - 1e-10) * 10000) / 10000;
      const upper = Math.floor((band.maxD + 1e-10) * 10000) / 10000;
      const fitted = lower <= upper ? Math.max(lower, Math.min(upper, Number(fields.diameter.value))) : (band.minD + band.maxD) / 2;
      fields.diameter.value = numberText(fitted, lower <= upper ? 4 : 10);
    }
  }
  // 點鑽同樣以 Dmax／Tmax 配對新選擇；手動輸入不自動修正，保留錯誤提示供使用者判讀。
  if ((resetDiameter || fitDiameter) && operation.id === "spotting") {
    const g = getChamferGeometry(insert.id, angle);
    if (g) {
      let lower = Math.ceil((g.minDiameter - 1e-10) * 10000) / 10000;
      if (lower / 2 * g.depthPerWidth <= g.tipCorrection) lower += .0001;
      const upper = Math.floor((g.maxContactDiameter + 1e-10) * 10000) / 10000;
      fields.diameter.value = numberText(Math.max(lower, Math.min(upper, Number(fields.diameter.value))), 4);
    }
  }
  fields.cuttingSpeed.value = numberText(midpoint(material.vc), 1);
  fields.feedPerRev.value = numberText(midpoint(feedRange), 3);
  renderResults();
}

// 轉速／進給沿用現有計算器；幾何統一使用已核對的型錄 ℓ／Tmax，無效時不保留上一筆結果。
function renderResults() {
  const { operation, insert, material, angle, feedRange } = selection();
  const diameter = Number(fields.diameter.value);
  const vc = Number(fields.cuttingSpeed.value);
  const feed = Number(fields.feedPerRev.value);
  const spotting = operation.id === "spotting" ? calculateSpotting({ size: insert.id, angle, diameter }) : null;
  const validD = Number.isFinite(diameter) && diameter > 0 && diameter <= insert.diameter && (!spotting || spotting.valid);
  const validVc = Number.isFinite(vc) && vc > 0;
  const validFeed = Number.isFinite(feed) && feed > 0;
  const rpm = validD && validVc ? 1000 * vc / (Math.PI * diameter) : NaN;
  const feedRate = validFeed ? rpm * feed : NaN;
  const valid = Number.isFinite(rpm) && Number.isFinite(feedRate);
  const depth = spotting?.valid ? spotting.depth : NaN;
  const model = `${insert.label.split(" - ").slice(1).join(" - ")}-${angle}`;
  $("materialBadge").textContent = isoGroups[fields.material.value] || "—";
  $("materialBadge").dataset.iso = isoGroups[fields.material.value];
  fields.diameter.max = spotting?.geometry?.maxContactDiameter ?? insert.diameter;
  fields.diameter.min = spotting?.geometry?.minDiameter ?? .1;
  [["diameter", validD, "diameterError", spotting ? spotting.errors.join(" ") : `Enter a diameter above 0 and up to ${insert.diameter} mm.`], ["cuttingSpeed", validVc, "vcError", "Enter a speed above 0."], ["feedPerRev", validFeed, "feedError", "Enter a feed above 0."]].forEach(([id, isValid, error, message]) => {
    fields[id].classList.toggle("is-invalid", !isValid);
    fields[id].setAttribute("aria-invalid", String(!isValid));
    $(error).textContent = isValid ? "" : message;
  });
  $("diameterHint").textContent = spotting?.geometry ? `Modeled Ø${numberText(spotting.geometry.minDiameter, 4)}–${numberText(spotting.geometry.maxContactDiameter, 4)} mm · Dmax / Tmax` : `Max. ${insert.diameter} mm`;
  $("vcHint").textContent = `${material.vc[0]}–${material.vc[1]} m/min`;
  $("feedHint").textContent = `${feedRange[0]}–${feedRange[1]} mm/rev`;
  $("rpm").textContent = Number.isFinite(rpm) ? Math.round(rpm).toLocaleString("en-US") : "—";
  $("feedRate").textContent = numberText(feedRate, 1);
  $("insertModel").textContent = model;
  $("selectionSummary").textContent = `${operation.label} · ${material.label} · ${angle}°`;
  $("grade").textContent = material.grade;
  $("dmax").textContent = `${insert.diameter} mm`;
  $("spotDepth").textContent = Number.isFinite(depth) ? `${numberText(depth, 4)} mm` : "—";
  const maxDepth = spotting?.geometry?.maxDepth ?? insert.spotDepth?.tmax?.[angle];
  $("tmax").textContent = Number.isFinite(maxDepth) ? `${maxDepth} mm` : "—";
  $("peckNote").textContent = operation.showQ ? `Peck depth Q: ${material.q || "See product catalog"}.` : "Feed is specified per revolution (mm/rev).";
  const messages = [];
  if (!valid) messages.push("Check the highlighted cutting values to calculate a result.");
  if (validVc && (vc < material.vc[0] || vc > material.vc[1])) messages.push("Cutting speed is outside the recommended range.");
  if (validFeed && (feed < feedRange[0] || feed > feedRange[1])) messages.push("Feed is outside the recommended range.");
  if (operation.id === "spotting" && angle === "60") messages.push(`60° spotting requires a peck cycle. Q: ${material.q}; select Q by material and t/Tmax.`);
  $("calculationMessage").textContent = messages.join(" ");
  const chamfer = renderChamferSetup(operation, insert, angle, diameter);
  ["spottingFigure", "spottingZNote", "spottingFormula"].forEach(id => { $(id).hidden = !spotting; });
  if (spotting) {
    renderSpottingDiagram(spotting);
    $("spottingZNote").textContent = spotting.valid ? `Z target ${numberText(spotting.z, 4)} mm · work surface Z0, actual insert tip datum.` : "Enter a valid D to calculate the actual-tip Z target.";
    const g = spotting.geometry;
    $("spottingFormula").textContent = g ? `t = D / (2 × tan(${g.angle}° / 2)) − ℓ; Z = −t. Catalog ℓ = ${g.tipCorrection} mm; Tmax = ${g.maxDepth} mm. D is the diameter at the work surface. ${g.minDiameterSource === "catalog" ? "Minimum modeled D uses catalog d1." : "Minimum D is the theoretical tip-plane intersection, not a catalog-rated minimum; nose radius is not modeled."} Source: ACE catalog, pp. 16–19.` : "Geometry unavailable.";
  }
  $("copyButton").disabled = !valid || (chamfer && !chamfer.valid);
  $("copyFeedback").textContent = "";
  const geometryLines = chamfer?.valid ? [
    `Chamfer: ${chamfer.geometry.angle === 90 ? "C" : "W"}${numberText(chamfer.c, 4)} x ${chamfer.geometry.faceAngle} deg | Vertical depth H: ${numberText(chamfer.height, 4)} mm | Contact D at ${chamfer.reference} of chamfer`,
    `Full geometry compensation: R ${numberText(chamfer.radius, 4)} mm / diameter ${numberText(chamfer.compensationDiameter, 4)} mm`,
    `Z target: ${numberText(chamfer.z, 4)} mm | Work surface Z0 | ${chamfer.datum === "actual" ? "Actual insert tip" : "Theoretical sharp point"} datum`,
    `Catalog tip correction: ${chamfer.geometry.tipCorrection} mm`,
    ...(chamfer.geometry.maxWidthSource === "geometry" ? [`Width limit is geometric from Dmax/Tmax, not a catalog-rated Cmax. Lower diameter source: ${chamfer.geometry.minDiameterSource}. Nose radius is not modeled.`] : []),
    `Program the original contour. Apply full geometry compensation once; select G41/G42 from travel direction and the free side. D address is an offset register.`,
    `Local straight-edge geometry only; check corners, hole clearance and lead-in/out separately.`,
    ...(chamfer.reduceFeed ? [$("chamferMessage").textContent] : [])
  ] : spotting?.valid ? [
    `Spotting depth t: ${numberText(spotting.depth, 4)} mm | Z target: ${numberText(spotting.z, 4)} mm`,
    `D is measured at the work surface Z0. Tool length datum: actual insert tip. Catalog tip correction ℓ: ${spotting.geometry.tipCorrection} mm | Tmax: ${spotting.geometry.maxDepth} mm`,
    `Idealized section; nose radius is not modeled.`
  ] : [];
  copyText = !$("copyButton").disabled ? [`ACE Spot Drill | ${operation.label}`, `Insert: ${model} | Grade: ${material.grade}`, `Material: ${material.label}`, `D: ${diameter} mm | Vc: ${vc} m/min | f: ${feed} mm/rev`, `Spindle speed: ${Math.round(rpm)} rpm`, `Feed rate: ${numberText(feedRate, 1)} mm/min`, ...geometryLines, ...messages].join("\n") : "";
}

$("calculatorForm").addEventListener("submit", event => event.preventDefault());
fields.operation.addEventListener("change", () => { refreshOptions(); resetValues(); });
fields.insertSize.addEventListener("change", () => { refreshOptions(); resetValues(); });
fields.material.addEventListener("change", () => resetValues({ resetDiameter: false }));
fields.angle.addEventListener("change", () => resetValues({ resetDiameter: false, fitDiameter: true }));
[fields.diameter, fields.cuttingSpeed, fields.feedPerRev].forEach(field => field.addEventListener("input", renderResults));
["chamferC", "zDatum"].forEach(id => $(id).addEventListener(id === "chamferC" ? "input" : "change", renderResults));
$("contactReference").addEventListener("change", () => {
  const nextReference = $("contactReference").value;
  const { operation, angle } = selection();
  if (operation.id === "chamfering" && getChamferGeometry(selection().insert.id, angle)) {
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
if (Object.hasOwn(selection().insert.angles, initialParams.get("angle"))) fields.angle.value = initialParams.get("angle");
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
