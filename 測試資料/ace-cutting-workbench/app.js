/* 樣板僅負責互動與呈現，切削範圍一律讀取正式 ACE 產品資料。 */
const $ = id => document.getElementById(id);
const fields = Object.fromEntries(["operation", "material", "insertSize", "angle", "diameter", "cuttingSpeed", "feedPerRev"].map(id => [id, $(id)]));
const isoGroups = { carbonLow: "P", carbonHigh: "P", lowAlloy: "P", highAlloy: "P", stainless: "M", castIron: "K", nonFerrous: "N" };
const operations = PRODUCT_PAGE_DATA.cuttingData.operations;
let copyText = "";

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
  $("copyButton").disabled = !valid;
  $("copyFeedback").textContent = "";
  copyText = valid ? [`ACE Spot Drill | ${operation.label}`, `Insert: ${model} | Grade: ${material.grade}`, `Material: ${material.label}`, `D: ${diameter} mm | Vc: ${vc} m/min | f: ${feed} mm/rev`, `Spindle speed: ${Math.round(rpm)} rpm`, `Feed rate: ${numberText(feedRate, 1)} mm/min`, ...messages].join("\n") : "";
}

$("calculatorForm").addEventListener("submit", event => event.preventDefault());
fields.operation.addEventListener("change", () => { refreshOptions(); resetValues(); });
fields.insertSize.addEventListener("change", () => { refreshOptions(); resetValues(); });
[fields.material, fields.angle].forEach(field => field.addEventListener("change", () => resetValues({ resetDiameter: false })));
[fields.diameter, fields.cuttingSpeed, fields.feedPerRev].forEach(field => field.addEventListener("input", renderResults));
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

fillOptions(fields.operation, operations.map(item => [item.id, item.label]), "spotting");
refreshOptions();
fields.insertSize.value = "SI10";
refreshOptions();
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
