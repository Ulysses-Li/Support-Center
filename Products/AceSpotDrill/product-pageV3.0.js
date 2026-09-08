/** ACE 整合式加工工作台：共用產品頁既有 Cutting Data，不另外複製資料表。 */
const controls = {
  operation: document.getElementById("operation"),
  size: document.getElementById("insertSize"),
  angle: document.getElementById("angle"),
  material: document.getElementById("material"),
  holderType: document.getElementById("holderType"),
  cadFormat: document.getElementById("cadFormat"),
  diameter: document.getElementById("diameter"),
  cuttingSpeed: document.getElementById("cuttingSpeed"),
  feedPerRev: document.getElementById("feedPerRev")
};

let cadAvailabilityRequest = 0;

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

function holderDimensionRows(holder) {
  if (holder.type === "cylindrical") {
    return [["Code", holder.code], ["Ød", holder.dimensions.d], ["ØD", holder.dimensions.od], ["L1", holder.dimensions.l1], ["L2", holder.dimensions.l2], ["Screw", holder.screw], ["Key", holder.key]];
  }
  return [["Code", holder.code], ["ØD", holder.dimensions.od], ["L", holder.dimensions.l], ["M", holder.dimensions.m], ["DPM", holder.dimensions.dpm], ["Screw", holder.screw], ["Key", holder.key]];
}

function setCadAvailability(state, message, href = "", filename = "") {
  const pill = document.getElementById("cadStatusPill");
  const button = document.getElementById("cadDownloadButton");
  pill.className = `cad-status-pill is-${state}`;
  pill.textContent = state === "available" ? "AVAILABLE" : state === "checking" ? "CHECKING" : "WAITING";
  setText("cadStatus", message);

  button.classList.toggle("is-disabled", state !== "available");
  button.setAttribute("aria-disabled", state === "available" ? "false" : "true");
  button.href = state === "available" ? href : "#";
  if (state === "available") button.download = filename;
  else button.removeAttribute("download");
}

/** 以目前選到的 SI、角度與刀桿型式配對 CAD；只在實體檔案存在時開放下載。 */
async function updateCadPanel() {
  const requestId = ++cadAvailabilityRequest;
  const { insert, angle } = currentSelection();
  const holderType = controls.holderType.value;
  const cadFormat = controls.cadFormat.value;
  const holder = ACE_CAD_CONFIG.holders.find(item => item.type === holderType && item.si === insert.id);
  const matchedFile = holder && ACE_CAD_FILES.find(file => file.holderPart === holder.filePart && Number(file.angle) === Number(angle));

  if (!holder) {
    setText("holderPartNumber", "No compatible holder");
    setText("holderDescription", `${insert.id} / ${angle}°`);
    document.getElementById("holderDimensions").innerHTML = "";
    setText("cadFileName", "-");
    setCadAvailability("waiting", "No holder data is available for this selection.");
    return;
  }

  const holderTypeLabel = ACE_CAD_CONFIG.holderTypes.find(item => item.id === holderType)?.label || holderType;
  setText("holderPartNumber", holder.partsNo);
  setText("holderDescription", `${holder.si} / ${holderTypeLabel} / ${insert.label.split(" - ").pop()}-${angle}`);
  document.getElementById("holderDimensions").innerHTML = holderDimensionRows(holder).map(([label, value]) =>
    `<div><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value)}</dd></div>`
  ).join("");

  const extension = cadFormat === "step" ? "STEP" : "DXF";
  const expectedName = matchedFile ? `${matchedFile.value}.${extension}` : `${holder.filePart}.${extension}`;
  setText("cadFileName", expectedName);

  if (cadFormat === "dxf") {
    setCadAvailability("waiting", "Holder matched. A 2D DXF file is not available yet.");
    return;
  }
  if (!matchedFile) {
    setCadAvailability("waiting", "Holder matched. No STEP mapping exists for this angle.");
    return;
  }

  const href = `./cadV2.0/${encodeURIComponent(matchedFile.value)}.STEP`;
  setCadAvailability("checking", "Match found. Checking the local CAD file.");
  try {
    const response = await fetch(href, { method: "HEAD", cache: "no-store" });
    if (requestId !== cadAvailabilityRequest) return;
    if (response.ok) {
      setCadAvailability("available", "The CAD file is ready to download.", href, expectedName);
    } else {
      setCadAvailability("waiting", "Match found, but the CAD file has not been added yet.");
    }
  } catch {
    if (requestId === cadAvailabilityRequest) {
      setCadAvailability("waiting", "Match found, but the CAD file cannot be accessed.");
    }
  }
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
  setText("diameterError", invalidDiameter ? `D must not exceed Dmax ${insert.diameter} mm.` : "");

  const insertModel = insert.label.split(" - ").slice(1).join(" - ") || insert.label;
  setText("insertModel", `${insertModel}-${angle}`);
  setText("angleBadge", `${angle}°`);
  setText("grade", material.grade);
  setText("dmax", `${insert.diameter} mm`);
  setText("tmax", tmax ? `${tmax} mm` : "N/A");
  setText("spotDepth", spotDepth == null ? "N/A" : `${formatNumber(spotDepth)} mm`);
  setText("applicationNote", operation.id === "spotting"
    ? `${material.label} spotting with a ${angle}° insert.`
    : `${material.label} chamfering with a ${angle}° insert.`
  );

  setText("vcRange", formatRange(material.vc, "m/min"));
  setText("feedRange", formatRange(feedRange, "mm/rev"));
  setText("peckDepth", operation.showQ ? (material.q || "Use the depth ratio") : "N/A");
  setText("rpm", rpm == null ? "-" : Math.round(rpm));
  setText("feedRate", feedRate == null ? "-" : formatNumber(feedRate, 1));

  const note = document.getElementById("calculationNote");
  const requiresPeck = operation.id === "spotting" && angle === "60";
  note.classList.toggle("is-warning", requiresPeck || invalidDiameter);
  note.textContent = invalidDiameter
    ? `The diameter exceeds the Dmax for ${insert.label}.`
    : requiresPeck
      ? "A 60° spotting operation requires a peck cycle. Select Q by material and t/Tmax."
      : `Calculated with Vc ${formatNumber(cuttingSpeed, 1)} m/min and f ${formatNumber(feedPerRev, 3)} mm/rev.`;

  updateCadPanel();
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

/** 控制桌面圖示列收合、目前入口狀態，以及手機選取後自動關閉 Offcanvas。 */
function initializeProductSidebar() {
  const layout = document.getElementById("productLayout");
  const sidebar = document.getElementById("productSidebar");
  const collapseButton = document.getElementById("sidebarCollapseButton");
  const links = [...document.querySelectorAll(".sidebar-nav .nav-link")];

  collapseButton?.addEventListener("click", () => {
    const isCollapsed = layout.classList.toggle("is-sidebar-collapsed");
    collapseButton.setAttribute("aria-expanded", String(!isCollapsed));
    collapseButton.setAttribute("aria-label", isCollapsed ? "Expand product tools" : "Collapse product tools");
  });

  links.forEach(link => link.addEventListener("click", () => {
    links.forEach(item => item.classList.remove("active"));
    link.classList.add("active");

    const target = document.querySelector(link.getAttribute("href"));
    if (target?.matches("details")) target.open = true;

    if (window.innerWidth < 992 && window.bootstrap?.Offcanvas) {
      window.bootstrap.Offcanvas.getOrCreateInstance(sidebar).hide();
    }
  }));
}

controls.operation.addEventListener("change", () => { refreshDependentOptions({ resetValues: true }); updateDashboard(); });
controls.size.addEventListener("change", () => { refreshDependentOptions({ resetValues: true }); updateDashboard(); });
controls.angle.addEventListener("change", () => { resetRecommendedValues(); updateDashboard(); });
controls.material.addEventListener("change", () => { resetRecommendedValues(); updateDashboard(); });
[controls.holderType, controls.cadFormat].forEach(select => select.addEventListener("change", updateDashboard));
[controls.diameter, controls.cuttingSpeed, controls.feedPerRev].forEach(input => input.addEventListener("input", updateDashboard));
document.getElementById("resetButton").addEventListener("click", () => { resetRecommendedValues(); updateDashboard(); });
document.getElementById("cadDownloadButton").addEventListener("click", event => {
  if (event.currentTarget.getAttribute("aria-disabled") === "true") event.preventDefault();
});

initializeWorkbench();
initializeProductSidebar();
loadSharedLayout();
