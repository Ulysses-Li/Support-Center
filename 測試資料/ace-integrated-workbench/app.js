/** ACE 整合式加工工作台：共用產品頁既有 Cutting Data，不另外複製資料表。 */
const controls = {
  operation: document.getElementById("operation"),
  size: document.getElementById("insertSize"),
  angle: document.getElementById("angle"),
  material: document.getElementById("material"),
  diameter: document.getElementById("diameter"),
  cuttingSpeed: document.getElementById("cuttingSpeed"),
  feedPerRev: document.getElementById("feedPerRev")
};

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = String(value ?? "-");
}

function midpoint(range) {
  return Array.isArray(range) && range.length === 2 ? (Number(range[0]) + Number(range[1])) / 2 : null;
}

function formatNumber(value, digits = 2) {
  return Number.isFinite(value) ? value.toFixed(digits).replace(/\.?0+$/, "") : "-";
}

function formatRange(range, unit) {
  return Array.isArray(range) ? `${range[0]}–${range[1]} ${unit}` : "-";
}

function currentOperation() {
  const operations = PRODUCT_PAGE_DATA.cuttingData.operations;
  return operations.find(item => item.id === controls.operation.value) || operations[0];
}

function currentInsert(operation = currentOperation()) {
  return operation.insertGroups.find(item => item.id === controls.size.value) || operation.insertGroups[0];
}

function currentMaterial(operation = currentOperation()) {
  return operation.materials[controls.material.value] || Object.values(operation.materials)[0];
}

function currentSelection() {
  const operation = currentOperation();
  const insert = currentInsert(operation);
  const material = currentMaterial(operation);
  const angle = controls.angle.value;
  const feedRange = insert.angles[angle]?.f?.[controls.material.value];
  return { operation, insert, material, angle, feedRange };
}

/** 依照上游條件重建選項，並盡量保留使用者目前選擇。 */
function refreshDependentOptions({ resetValues = false } = {}) {
  const operation = currentOperation();
  const previousSize = controls.size.value;
  controls.size.innerHTML = operation.insertGroups.map(item =>
    `<option value="${escapeHTML(item.id)}">${escapeHTML(item.label)}</option>`
  ).join("");
  controls.size.value = operation.insertGroups.some(item => item.id === previousSize) ? previousSize : operation.insertGroups[0].id;

  const insert = currentInsert(operation);
  const previousAngle = controls.angle.value;
  controls.angle.innerHTML = Object.keys(insert.angles).map(angle =>
    `<option value="${escapeHTML(angle)}">${escapeHTML(angle)}°</option>`
  ).join("");
  controls.angle.value = insert.angles[previousAngle] ? previousAngle : "90";

  const previousMaterial = controls.material.value;
  controls.material.innerHTML = Object.entries(operation.materials).map(([id, material]) =>
    `<option value="${escapeHTML(id)}">${escapeHTML(material.label)}</option>`
  ).join("");
  controls.material.value = operation.materials[previousMaterial] ? previousMaterial : "stainless";

  if (resetValues) resetRecommendedValues();
}

function resetRecommendedValues() {
  const { insert, material, feedRange } = currentSelection();
  controls.diameter.value = insert.diameter;
  controls.cuttingSpeed.value = formatNumber(midpoint(material.vc), 1);
  controls.feedPerRev.value = formatNumber(midpoint(feedRange), 3);
}

/** 點鑽深度公式與正式 Cutting Data Calculator 相同。 */
function calculateSpotDepth(diameter, angle, insert) {
  const factors = { 60: 0.866, 90: 0.5, 120: 0.289, 142: 0.172 };
  const offset = insert.spotDepth?.l?.[angle];
  if (!Number.isFinite(diameter) || !factors[angle] || !Number.isFinite(Number(offset))) return null;
  return Math.max(diameter * factors[angle] - Number(offset), 0);
}

/** 將一組選擇同步輸出到產品摘要與切削參數結果。 */
function updateDashboard() {
  const { operation, insert, material, angle, feedRange } = currentSelection();
  const diameter = Number(controls.diameter.value);
  const cuttingSpeed = Number(controls.cuttingSpeed.value);
  const feedPerRev = Number(controls.feedPerRev.value);
  const invalidDiameter = !Number.isFinite(diameter) || diameter <= 0 || diameter > Number(insert.diameter);
  const rpm = !invalidDiameter && cuttingSpeed > 0 ? (1000 * cuttingSpeed) / (Math.PI * diameter) : null;
  const feedRate = Number.isFinite(rpm) && feedPerRev > 0 ? rpm * feedPerRev : null;
  const spotDepth = operation.id === "spotting" && !invalidDiameter
    ? calculateSpotDepth(diameter, angle, insert)
    : null;
  const tmax = insert.spotDepth?.tmax?.[angle];

  controls.diameter.max = insert.diameter;
  controls.diameter.classList.toggle("is-invalid", invalidDiameter);
  setText("diameterError", invalidDiameter ? `D 不可超過 Dmax ${insert.diameter} mm。` : "");

  const insertModel = insert.label.split(" - ").slice(1).join(" - ") || insert.label;
  setText("insertModel", `${insertModel}-${angle}`);
  setText("angleBadge", `${angle}°`);
  setText("grade", material.grade);
  setText("dmax", `${insert.diameter} mm`);
  setText("tmax", tmax ? `${tmax} mm` : "不適用");
  setText("spotDepth", spotDepth == null ? "不適用" : `${formatNumber(spotDepth)} mm`);
  setText("applicationNote", operation.id === "spotting"
    ? `${material.label}定位點鑽，${angle}° 刀片。`
    : `${material.label}倒角加工，${angle}° 刀片。`
  );

  setText("vcRange", formatRange(material.vc, "m/min"));
  setText("feedRange", formatRange(feedRange, "mm/rev"));
  setText("peckDepth", operation.showQ ? (material.q || "依深度比計算") : "不適用");
  setText("rpm", rpm == null ? "-" : Math.round(rpm));
  setText("feedRate", feedRate == null ? "-" : formatNumber(feedRate, 1));

  const note = document.getElementById("calculationNote");
  const requiresPeck = operation.id === "spotting" && angle === "60";
  note.classList.toggle("is-warning", requiresPeck || invalidDiameter);
  note.textContent = invalidDiameter
    ? `加工直徑超出 ${insert.label} 的 Dmax，請先修正輸入值。`
    : requiresPeck
      ? "60° 點鑽依型錄要求使用啄鑽循環，請依材料與 t/Tmax 選擇 Q。"
      : `以 Vc ${formatNumber(cuttingSpeed, 1)} m/min、f ${formatNumber(feedPerRev, 3)} mm/rev 計算。`;
}

function initializeWorkbench() {
  const operations = PRODUCT_PAGE_DATA.cuttingData.operations;
  controls.operation.innerHTML = operations.map(item =>
    `<option value="${escapeHTML(item.id)}">${escapeHTML(item.label)}</option>`
  ).join("");
  controls.operation.value = "spotting";
  refreshDependentOptions();
  controls.size.value = "SI10";
  controls.angle.value = "90";
  controls.material.value = "stainless";
  resetRecommendedValues();
  updateDashboard();
}

/** 載入根目錄共用 Header 與 Footer。 */
function loadSharedLayout() {
  fetch("../../header/header.html?v=20260520-news")
    .then(response => response.text())
    .then(html => {
      document.getElementById("header-placeholder").innerHTML = html;
      const button = document.getElementById("mobileMenuBtn");
      const nav = document.getElementById("topNav");
      button?.addEventListener("click", () => nav?.classList.toggle("active"));
    });
  fetch("../../footer/footer.html")
    .then(response => response.text())
    .then(html => { document.getElementById("footer-placeholder").innerHTML = html; });
}

controls.operation.addEventListener("change", () => { refreshDependentOptions({ resetValues: true }); updateDashboard(); });
controls.size.addEventListener("change", () => { refreshDependentOptions({ resetValues: true }); updateDashboard(); });
controls.angle.addEventListener("change", () => { resetRecommendedValues(); updateDashboard(); });
controls.material.addEventListener("change", () => { resetRecommendedValues(); updateDashboard(); });
[controls.diameter, controls.cuttingSpeed, controls.feedPerRev].forEach(input => input.addEventListener("input", updateDashboard));
document.getElementById("resetButton").addEventListener("click", () => { resetRecommendedValues(); updateDashboard(); });

initializeWorkbench();
loadSharedLayout();
