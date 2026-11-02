/* 首頁樣板只負責導覽與示意；產品分類和切削幾何沿用正式資料，避免維護第二份數據。 */
(() => {
  "use strict";

  const byId = id => document.getElementById(id);
  const escapeHTML = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  const numberText = value => Number.isFinite(value) ? String(Number(value.toFixed(4))) : "—";

  // 既有分類資料以 /nine9/ 為相對位置；樣板放在測試資料下，先轉為站內根路徑。
  function applicationPath(value) {
    const url = new URL(value, new URL("/nine9/", window.location.origin));
    if (url.origin !== window.location.origin) return "";
    return `${url.pathname}${url.search}${url.hash}`;
  }

  function renderApplications() {
    const target = byId("applicationLinks");
    if (!target || typeof PRODUCT_FAMILIES === "undefined") return;
    const choices = [
      { title: "Spotting" },
      { title: "Chamfering & Corner Radii", label: "Chamfering" },
      { title: "Drilling" },
      { title: "Threading" },
      { title: "Engraving" },
      { title: "Helical Drilling" }
    ];

    target.innerHTML = choices.map(choice => {
      const application = PRODUCT_FAMILIES.find(item => item.title === choice.title);
      if (!application) return "";
      const href = applicationPath(application.href);
      const image = applicationPath(application.image);
      if (!href || !image) return "";
      return `<a class="application-link" href="${escapeHTML(href)}">
        <img src="${escapeHTML(image)}" alt="" width="44" height="44" loading="lazy">
        <span>${escapeHTML(choice.label || application.title)}</span>
      </a>`;
    }).join("");
  }

  function diagramDefinitions() {
    return `<defs>
      <pattern id="homePlotHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
        <line x1="0" y1="0" x2="0" y2="7" stroke="#cbdce8" stroke-width="1.4"/>
      </pattern>
      <marker id="homePlotArrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10z" fill="#0067ad"/>
      </marker>
    </defs>`;
  }

  // X、Z 使用同一比例；實際刀尖由型錄修正量 ℓ 決定，虛線才延伸到理論尖點。
  function spottingDiagram(result) {
    const { diameter, depth, theoreticalDepth, z, geometry } = result;
    const scale = 31, axis = 190, surface = 70;
    const left = axis - diameter / 2 * scale;
    const right = axis + diameter / 2 * scale;
    const tip = surface + depth * scale;
    const theoreticalTip = surface + theoreticalDepth * scale;
    const tipRadius = geometry.tipCorrection / geometry.depthPerWidth * scale;
    const material = `M24 ${surface}H${left}L${axis - tipRadius} ${tip}H${axis + tipRadius}L${right} ${surface}H376V178H24Z`;

    return `<title id="homeDiagramTitle">Spotting example: diameter ${numberText(diameter)} mm, actual tip depth ${numberText(depth)} mm</title>
      <desc id="homeDiagramDescription">A centered section through a spotted hole. The diameter is measured at work surface Z0. The actual insert tip target is Z ${numberText(z)} mm; the dashed extension marks the theoretical point.</desc>
      ${diagramDefinitions()}
      <path d="${material}" fill="#edf4f8"/>
      <path d="${material}" fill="url(#homePlotHatch)" stroke="#b3c9d8"/>
      <path d="M${left} ${surface}H${right}L${axis + tipRadius} ${tip}H${axis - tipRadius}Z" fill="#0067ad12"/>
      <path d="M${left} ${surface}L${axis - tipRadius} ${tip}M${right} ${surface}L${axis + tipRadius} ${tip}" fill="none" stroke="#f05a1a" stroke-width="3"/>
      <path d="M${axis - tipRadius} ${tip}H${axis + tipRadius}" stroke="#0067ad" stroke-width="2"/>
      <path d="M${axis - tipRadius} ${tip}L${axis} ${theoreticalTip}L${axis + tipRadius} ${tip}" fill="none" stroke="#0067ad" stroke-dasharray="3 3"/>
      <path d="M24 ${surface}H376M${axis} 43V186" fill="none" stroke="#8ba6b9" stroke-dasharray="4 4"/>
      <path d="M${left} 62V31M${right} 62V31M${left} 37H${right}" fill="none" stroke="#0067ad" marker-start="url(#homePlotArrow)" marker-end="url(#homePlotArrow)"/>
      <path d="M${axis + tipRadius} ${tip}H338M330 ${surface}V${tip}" fill="none" stroke="#0067ad"/>
      <path d="M330 ${surface}V${tip}" stroke="#0067ad" marker-start="url(#homePlotArrow)" marker-end="url(#homePlotArrow)"/>
      <g font-family="Arial, sans-serif" font-size="14" fill="#36586f" paint-order="stroke" stroke="#fff" stroke-width="3" stroke-linejoin="round">
        <text x="${axis}" y="23" text-anchor="middle" fill="#b53a0a">D Ø${numberText(diameter)} mm</text>
        <text x="26" y="61">Z0</text>
        <text x="38" y="166">Material</text>
        <text x="${axis}" y="119" text-anchor="middle" fill="#b53a0a">90°</text>
        <text x="351" y="${(surface + tip) / 2}" text-anchor="middle" transform="rotate(-90 351 ${(surface + tip) / 2})">Z ${numberText(z)} mm</text>
        <text x="24" y="207">Actual insert tip · work surface Z0</text>
      </g>`;
  }

  function chamferDiagram(result) {
    const { geometry, diameter, radius, c, height, actualDrop, z } = result;
    const scale = 31, edge = 140, surface = 70;
    const axis = edge + radius * scale;
    const upper = edge - c * scale;
    const lower = surface + height * scale;
    const right = axis + diameter / 2 * scale;
    const tip = surface + actualDrop * scale;
    const theoreticalTip = tip + geometry.tipCorrection * scale;
    const tipRadius = geometry.tipCorrection / geometry.depthPerWidth * scale;
    const material = `M24 ${surface}H${upper}L${edge} ${lower}V175H24Z`;

    return `<title id="homeDiagramTitle">Chamfer example: C${numberText(c)}, full compensation R${numberText(radius)} mm, Z ${numberText(z)} mm</title>
      <desc id="homeDiagramDescription">A local straight-edge chamfer section with material on the left. Program the original contour at the dashed vertical material edge. The tool center is offset R ${numberText(radius)} mm toward the free side. D is at the upper chamfer edge, and Z uses the actual insert tip datum.</desc>
      ${diagramDefinitions()}
      <path d="${material}" fill="#edf4f8"/>
      <path d="${material}" fill="url(#homePlotHatch)" stroke="#b3c9d8"/>
      <path d="M${upper} ${surface}H${right}L${axis + tipRadius} ${tip}H${axis - tipRadius}Z" fill="#0067ad12" stroke="#0067ad" stroke-width="1.5"/>
      <path d="M${axis - tipRadius} ${tip}L${axis} ${theoreticalTip}L${axis + tipRadius} ${tip}" fill="none" stroke="#0067ad" stroke-dasharray="3 3"/>
      <path d="M24 ${surface}H376M${edge} 51V190M${axis} 44V190" fill="none" stroke="#8ba6b9" stroke-dasharray="4 4"/>
      <path d="M${upper} ${surface}L${edge} ${lower}" stroke="#f05a1a" stroke-width="4"/>
      <circle cx="${upper}" cy="${surface}" r="3.5" fill="#f05a1a"/>
      <path d="M${upper} 62V31M${right} 62V31M${upper} 37H${right}" fill="none" stroke="#0067ad" marker-start="url(#homePlotArrow)" marker-end="url(#homePlotArrow)"/>
      <path d="M${axis + tipRadius} ${tip}H346M338 ${surface}V${tip}" fill="none" stroke="#0067ad"/>
      <path d="M338 ${surface}V${tip}" stroke="#0067ad" marker-start="url(#homePlotArrow)" marker-end="url(#homePlotArrow)"/>
      <path d="M${edge} 193H${axis}" stroke="#0067ad" marker-start="url(#homePlotArrow)" marker-end="url(#homePlotArrow)"/>
      <path d="M${upper + 3} ${surface + 5}L101 110H76" stroke="#b53a0a" fill="none"/>
      <g font-family="Arial, sans-serif" font-size="14" fill="#36586f" paint-order="stroke" stroke="#fff" stroke-width="3" stroke-linejoin="round">
        <text x="${(upper + right) / 2}" y="23" text-anchor="middle" fill="#b53a0a">D Ø${numberText(diameter)} mm</text>
        <text x="26" y="61">Z0</text>
        <text x="38" y="165">Material</text>
        <text x="38" y="113" fill="#b53a0a">C${numberText(c)}</text>
        <text x="359" y="${(surface + tip) / 2}" text-anchor="middle" transform="rotate(-90 359 ${(surface + tip) / 2})">Z ${numberText(z)} mm</text>
        <text x="${(edge + axis) / 2}" y="214" text-anchor="middle">R ${numberText(radius)} mm</text>
      </g>`;
  }

  function renderPreview(operation) {
    const svg = byId("previewDiagram");
    if (!svg) return;
    const isChamfering = operation === "chamfering";
    const selected = isChamfering ? "chamfering" : "spotting";
    document.querySelectorAll("button[data-preview-operation]").forEach(button => {
      const active = button.dataset.previewOperation === selected;
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("is-active", active);
    });

    // 首頁只展示固定例子，完整輸入、範圍驗證與數值調整交給正式計算器。
    const input = { size: "SI06", angle: 90, diameter: 5.5 };
    const result = isChamfering
      ? calculateChamfer({ ...input, c: .5, reference: "upper", datum: "actual" })
      : calculateSpotting(input);
    svg.setAttribute("viewBox", "0 0 400 220");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-labelledby", "homeDiagramTitle homeDiagramDescription");
    svg.innerHTML = result.valid ? (isChamfering ? chamferDiagram(result) : spottingDiagram(result)) : "";

    byId("previewPrimaryLabel").textContent = isChamfering ? "Compensation R" : "Spotting depth t";
    byId("previewPrimaryValue").textContent = result.valid ? numberText(isChamfering ? result.radius : result.depth) : "—";
    byId("previewZ").textContent = result.valid ? numberText(result.z) : "—";
    byId("previewConditions").textContent = isChamfering
      ? "Example: SI06 · 90° · C0.5 · upper-edge Ø5.5 mm · actual-tip datum, surface Z0"
      : "Example: SI06 · 90° · Ø5.5 mm · actual-tip datum, surface Z0";
    const params = new URLSearchParams({ operation: selected, size: "SI06", angle: "90", material: "highAlloy" });
    byId("assistantLink").href = `/CuttingData/AceSpotDrill/index.html?${params}`;
  }

  // 直接引用根目錄的頁首／頁尾；僅綁定插入後的手機選單，不複製共用版型。
  async function loadLayout(part) {
    const target = byId(`${part}-placeholder`);
    if (!target) return;
    const response = await fetch(`/${part}/${part}.html`);
    if (!response.ok) throw new Error(`Unable to load shared ${part}.`);
    target.innerHTML = await response.text();
    if (part !== "header") return;
    const button = byId("mobileMenuBtn");
    const nav = byId("topNav");
    if (!button || !nav) return;
    button.setAttribute("aria-controls", nav.id);
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", () => {
      const expanded = nav.classList.toggle("active");
      button.setAttribute("aria-expanded", String(expanded));
      button.setAttribute("aria-label", expanded ? "Close Menu" : "Open Menu");
    });
  }

  function initialize() {
    renderApplications();
    const buttons = document.querySelectorAll("button[data-preview-operation]");
    buttons.forEach(button => button.addEventListener("click", () => renderPreview(button.dataset.previewOperation)));
    const initial = document.querySelector('button[data-preview-operation][aria-pressed="true"]');
    renderPreview(initial?.dataset.previewOperation || "spotting");
    Promise.all([loadLayout("header"), loadLayout("footer")]).catch(error => console.warn(error.message));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
