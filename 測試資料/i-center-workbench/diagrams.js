/* i-Center 孔形圖：依型錄孔形示意區分 A、A+B、R 與 ANSI；刻意不重建未確認的完整實體輪廓。
 * 圖形不是比例尺，真實 d／L／R 值直接讀所選刀片表格；手動深度與孔形分開，不反推加工 Z。
 */
const ICENTER_DIAGRAMS = (() => {
  "use strict";
  const escape = value => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
  const finite = value => {
    if (!["number", "string"].includes(typeof value) || String(value).trim() === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const number = value => value !== 0 && Math.abs(value) < .001 ? String(Number(value.toPrecision(6))) : String(Number(value.toFixed(5)));
  const formInfo = Object.freeze({
    A: { label: "DIN332 Form A", short: "Form A", family: "DIN332 Form A", note: "60° bearing cone; no outer protective countersink is shown." },
    AB: { label: "DIN332 Form A+B", short: "Form A+B", family: "DIN332 Form A+B", note: "60° main bearing cone with a separate 120° outer protective countersink." },
    R: { label: "DIN332 Form R", short: "Form R", family: "DIN332 Form R", note: "Curved bearing surface. R is a radius, not a constant cone angle." },
    ANSI: { label: "ANSI 60°", short: "ANSI 60°", family: "ANSI 60°", note: "60° center-hole form; ANSI number sizes remain separate from DIN metric Form A." }
  });
  function normalize(form) {
    const input = String(form ?? "").trim();
    for (const [id, info] of Object.entries(formInfo)) if ([id, info.label, info.short].includes(input)) return id;
    return ({ "A+B": "AB", "DIN332_A": "A", "DIN332_A+B": "AB", "DIN332_AB": "AB", "DIN332_R": "R", "ANSI_60": "ANSI" })[input] || null;
  }
  const iconPaths = Object.freeze({
    A: "M29 22L52 61V79L60 85L68 79V61L91 22",
    AB: "M13 22L34 35L52 66V79L60 85L68 79V66L86 35L107 22",
    R: "M28 22Q46 30 52 63V79L60 85L68 79V63Q74 30 92 22",
    ANSI: "M29 22L52 61V79L60 85L68 79V61L91 22"
  });

  function formIcon(form) {
    const id = normalize(form), info = formInfo[id];
    if (!info) return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 104" role="img" aria-label="Choose a center-hole form"><rect x="8" y="8" width="104" height="88" rx="10" fill="#eef7fd"/><text x="60" y="63" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" fill="#0067ad">?</text></svg>';
    const profile = iconPaths[id];
    const fill = `${profile}H111V94H9V22Z`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 104" role="img" aria-label="${escape(`${info.label}: ${info.note}`)}" class="icenter-form-icon"><title>${escape(info.label)}</title><desc>${escape(info.note)} Concept only; not to scale.</desc><path d="${fill}" fill="#e0edf6" stroke="#adcadf"/><path d="${profile}" fill="none" stroke="#0067ad" stroke-width="3.3" stroke-linejoin="round"/><path d="M60 13V94" fill="none" stroke="#9fbdd2" stroke-dasharray="4 3"/>${id === "AB" ? '<path d="M13 22L34 35M86 35L107 22" stroke="#f05a1a" stroke-width="4" fill="none"/>' : id === "R" ? '<path d="M28 22Q46 30 52 63M68 63Q74 30 92 22" stroke="#f05a1a" stroke-width="4" fill="none"/>' : '<path d="M29 22L52 61M68 61L91 22" stroke="#f05a1a" stroke-width="4"/>'}${id === "ANSI" ? '<rect x="82" y="71" width="32" height="26" rx="6" fill="#0067ad"/><text x="98" y="91" text-anchor="middle" font-family="Arial,sans-serif" font-size="23" font-weight="700" fill="white">#</text>' : ""}</svg>`;
  }

  function unavailable(message) {
    return `<div class="icenter-section-unavailable" style="padding:24px;color:#536d82;font:16px/1.6 Arial,sans-serif;background:#f4f9fc;border-radius:10px"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 160" role="img" aria-label="Center-hole profile unavailable" style="display:block;width:100%;max-width:420px;margin:auto"><title>Center-hole profile unavailable</title><desc>${escape(message)}</desc><path d="M60 55H360M210 25V115" stroke="#bdd2e1" stroke-dasharray="5 4"/><text x="210" y="140" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" fill="#536d82">Select a catalog cutting insert</text></svg><p style="margin:12px 0 0">${escape(message)}</p></div>`;
  }

  function renderSection({ insert, form, depth } = {}) {
    const selectedForm = normalize(form || insert?.family), info = formInfo[selectedForm];
    if (!info) return unavailable("Choose Form A, A+B, R or ANSI to view its center-hole concept.");
    if (!insert) return unavailable(`Choose a ${info.label} cutting insert to view its catalog dimensions.`);
    if (insert.category !== "cutting_insert") return unavailable("Measuring masters are alignment tools. Select a catalog cutting insert to view a center-hole profile.");
    if (normalize(insert.family) !== selectedForm) return unavailable(`This insert belongs to ${insert.family || "another family"}. Choose a matching ${info.label} insert before viewing its profile.`);
    const dims = insert.dimensions || {};
    const d1 = finite(dims.d1), d2 = finite(dims.d2), d3 = finite(dims.d3);
    if (d1 === null || d2 === null || d1 <= 0 || d2 <= d1 || selectedForm === "AB" && (d3 === null || d3 <= d2)) return unavailable("The selected insert does not have valid catalog diameter dimensions for this profile.");
    if (selectedForm === "R" && (finite(dims.R) === null || finite(dims.R) <= 0)) return unavailable("Select a Form R insert with a valid catalog radius R.");
    const prefix = `icenter-${String(insert.id || insert.parts_no || "insert").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 90)}`;
    const label = String(insert.parts_no || insert.id || info.label);
    const manualDepth = finite(depth), hasDepth = manualDepth !== null && manualDepth > 0;
    const selectedNote = info.note;
    const plotted = {
      A: "M80 100L129 215V262L145 274L161 262V215L210 100",
      AB: "M43 100L85 135L129 215V262L145 274L161 262V215L205 135L247 100",
      R: "M80 100Q115 122 129 215V262L145 274L161 262V215Q175 122 210 100",
      ANSI: "M80 100L129 215V262L145 274L161 262V215L210 100"
    }[selectedForm];
    const shapeLeft = selectedForm === "AB" ? 43 : 80, shapeRight = selectedForm === "AB" ? 247 : 210;
    const mouthLeft = selectedForm === "AB" ? 85 : 80, mouthRight = selectedForm === "AB" ? 205 : 210;
    const arrow = `url(#${prefix}-arrow)`;
    const dimension = (x1, x2, y, text) => `<path d="M${x1} ${y - 8}V${y + 8}M${x2} ${y - 8}V${y + 8}M${x1} ${y}H${x2}" fill="none" stroke="#0067ad" marker-start="${arrow}" marker-end="${arrow}"/><text x="${(x1 + x2) / 2}" y="${y - 10}" text-anchor="middle" class="icd-label">${escape(text)}</text>`;
    const axial = (x, upper, text) => `<path d="M${x - 6} ${upper}H${x + 6}M${x - 6} 274H${x + 6}M${x} ${upper}V274" stroke="#0067ad" fill="none" marker-start="${arrow}" marker-end="${arrow}"/><text x="${x + 18}" y="${(upper + 274) / 2}" text-anchor="middle" transform="rotate(-90 ${x + 18} ${(upper + 274) / 2})" class="icd-label">${escape(text)}</text>`;
    const pilotDimension = dimension(129, 161, 245, "d1");
    const upperDimensions = selectedForm === "AB" ? `${dimension(mouthLeft, mouthRight, 48, "d2")}${dimension(shapeLeft, shapeRight, 80, "d3")}` : dimension(mouthLeft, mouthRight, 80, "d2");
    const bearingLabel = selectedForm === "R" ? `<text x="145" y="164" text-anchor="middle" class="icd-main">R profile</text><path d="M78 173L111 185" stroke="#f05a1a"/><text x="34" y="169" class="icd-label">R</text>` : `<text x="145" y="178" text-anchor="middle" class="icd-main">60°</text>`;
    const guard = selectedForm === "AB" ? '<path d="M43 100L85 135M205 135L247 100" stroke="#f05a1a" stroke-width="4" fill="none"/><text x="145" y="121" text-anchor="middle" class="icd-guard">120° guard</text>' : "";
    const axialDims = `${axial(292, 215, "L1")}${axial(334, selectedForm === "AB" ? 135 : 100, "L2")}${selectedForm === "AB" ? axial(376, 100, "L3") : ""}`;
    const diagram = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 330" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" class="icenter-profile-svg" style="display:block;width:100%;height:auto;max-width:520px;margin:0 auto"><title id="${prefix}-title">${escape(`${info.label} catalog profile: ${label}`)}</title><desc id="${prefix}-desc">${escape(`${selectedNote} Catalog profile schematic, not to scale. Diagram letters refer to the unchanged catalog dimensions listed below. The complete form shown is not computed from manual drilling depth. The pilot drill-point shape is separate from the bearing and protective surfaces.`)}</desc><style>.icd-label{font:18px Arial,sans-serif;fill:#365b75;paint-order:stroke;stroke:#fff;stroke-width:3px;stroke-linejoin:round}.icd-main{font:700 20px Arial,sans-serif;fill:#0067ad}.icd-guard{font:700 18px Arial,sans-serif;fill:#bf4210}</style><defs><pattern id="${prefix}-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="9" stroke="#c9dce9" stroke-width="2"/></pattern><marker id="${prefix}-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#0067ad"/></marker></defs><path d="M20 100H${shapeLeft}${plotted.slice(plotted.indexOf("L") >= 0 && selectedForm !== "R" ? plotted.indexOf("L") : plotted.indexOf("Q"))}H270V300H20Z" fill="#eff5f9"/><path d="M20 100H${shapeLeft}${plotted.slice(selectedForm === "R" ? plotted.indexOf("Q") : plotted.indexOf("L"))}H270V300H20Z" fill="url(#${prefix}-hatch)" stroke="#9bb8cc"/><path class="icd-profile" data-form="${selectedForm}" d="${plotted}" fill="none" stroke="#0067ad" stroke-width="3" stroke-linejoin="round"/>${guard}<path d="M145 28V298" stroke="#9fb8ca" stroke-dasharray="5 4"/><text x="145" y="21" text-anchor="middle" class="icd-label">${escape(info.short)}${selectedForm === "ANSI" ? ` ${escape(insert.size_designation || "")}` : ""}</text>${upperDimensions}${pilotDimension}${bearingLabel}${axialDims}<text x="210" y="325" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" fill="#536d82">Catalog profile · schematic · not to scale</text></svg>`;

    // 尺寸保留原表值。A 的 d3/L3 屬刀片外形尺寸，不把它畫成 Form B 保護沉錐。
    const keys = ["d1", "d2", "d3", "L1", "L2", "L3", "R"];
    const dimensions = keys.filter(key => finite(dims[key]) !== null && finite(dims[key]) > 0).map(key => {
      const extra = selectedForm === "A" && ["d3", "L3"].includes(key) ? " · insert geometry" : "";
      return `<div><dt style="font-size:14px;color:#536d82;font-weight:400">${escape(key + extra)}</dt><dd style="font-size:16px;color:#0c2237;font-weight:700;margin:5px 0 0">${number(finite(dims[key]))} mm</dd></div>`;
    }).join("");
    const inch = selectedForm === "ANSI" && insert.inch_dimensions_catalog ? `<p style="font-size:14px;line-height:1.55;color:#536d82;margin:12px 0 0">Catalog inch values: ${["d1", "d2", "L1"].filter(key => insert.inch_dimensions_catalog[key] !== undefined).map(key => `${escape(key)} ${escape(insert.inch_dimensions_catalog[key])}″`).join(" · ")}. Values are preserved as printed.</p>` : "";
    const hasD3Exception = selectedForm === "AB" && (insert.notes_zh || []).some(note => String(note).includes("d3") && String(note).includes("DIN332"));
    const exception = hasD3Exception ? '<p style="margin:12px 0 0;color:#9d421c;font-size:14px;line-height:1.55">Catalog exception: this insert’s d3 differs from the DIN332 center-hole standard.</p>' : "";
    const manual = hasDepth ? `<p style="margin:0;font-size:16px;font-weight:700;color:#0c2237">Manual depth ${number(manualDepth)} mm · Z ${number(-manualDepth)} mm</p><p style="margin:7px 0 0;font-size:14px;line-height:1.6;color:#536d82">Z = − entered depth, assuming the actual insert tip was touched off at work surface Z0. This manual value does not determine or verify the formed profile above.</p>` : '<p style="margin:0;font-size:15px;line-height:1.6;color:#536d82">Enter a positive manual depth to show its negative Z value. No depth is derived from d1, L1, L2 or L3.</p>';
    return `<div class="icenter-section">${diagram}<p class="icenter-profile-note" style="margin:16px 0;font-size:15px;line-height:1.6;color:#536d82">${escape(selectedNote)} The pilot drill point is a separate feature.</p><dl class="icenter-catalog-dimensions" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:14px;margin:0">${dimensions}</dl>${inch}${exception}<div class="icenter-manual-depth" style="margin-top:20px;padding-top:16px;border-top:1px solid #d7e6f0">${manual}</div><p style="margin:14px 0 0;font-size:14px;line-height:1.55;color:#536d82">Dimensions: catalog p. ${escape(insert.source?.printed_page || "—")}, as listed for ${escape(label)}. The diagram does not reconstruct the full insert or prescribe a cutting cycle.</p></div>`;
  }
  return Object.freeze({ formIcon, renderSection });
})();

if (typeof module !== "undefined") module.exports = ICENTER_DIAGRAMS;
