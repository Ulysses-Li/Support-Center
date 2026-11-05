/* NC Spot Drill 名義剖面：只由計算結果繪圖，不從畫面比例反算加工數字。
 * 型錄 p.52 明示刀片有偏置，NC40／NC60 與其他牌號的實際剖面不同。
 * 因此錐面固定使用虛線，實測對刀位置只畫成基準平面，不虛構實際刃口外形。
 */
const NC_SPOT_DIAGRAMS = (() => {
  "use strict";
  const blue = "#0067ad", orange = "#f05a1a", ink = "#0c2237", muted = "#5c7183";
  const finite = value => typeof value === "number" && Number.isFinite(value);
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const number = value => finite(value) ? String(Number(value.toFixed(4))) : "—";
  const n = value => finite(value) ? Number(value.toFixed(3)) : 0;
  const text = (x, y, value, cls = "ncs-label", extra = "") => `<text x="${n(x)}" y="${n(y)}" class="${cls}" ${extra}>${escape(value)}</text>`;
  const line = (x1, y1, x2, y2, extra = "") => `<path d="M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}" fill="none" ${extra}/>`;

  // 圖中的關鍵尺寸在小螢幕加大；較長的解說由圖下方 caption 承接。
  const style = `<style>
    .ncs-label,.ncs-key,.ncs-note{font-family:Arial,"Microsoft JhengHei",sans-serif;fill:${muted};paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round}
    .ncs-label{font-size:20px}.ncs-key{font-size:25px;font-weight:700;fill:${ink}}.ncs-note{font-size:17px}
    .ncs-contact{fill:#b53a0a}.ncs-blue{fill:${blue}}
    @media(max-width:575px){.ncs-key{font-size:31px}.ncs-label{font-size:27px}.ncs-note{font-size:24px}.ncs-helper{display:none}}
  </style>`;
  function defs(prefix) {
    return `<defs><pattern id="${prefix}Hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><path d="M0 0V10" stroke="#cfdee8" stroke-width="2"/></pattern><marker id="${prefix}Arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${blue}"/></marker></defs>`;
  }
  function dimension(prefix, x1, y1, x2, y2) {
    return line(x1, y1, x2, y2, `stroke="${blue}" stroke-width="1.6" marker-start="url(#${prefix}Arrow)" marker-end="url(#${prefix}Arrow)"`);
  }
  function frame(prefix, title, description, content) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 420" role="img" aria-labelledby="${prefix}Title ${prefix}Description"><title id="${prefix}Title">${escape(title)}</title><desc id="${prefix}Description">${escape(description)}</desc>${style}${defs(prefix)}${content}</svg>`;
  }
  function placeholder(kind) {
    const label = kind === "spotting" ? "spotting diameter" : "chamfer width and contact diameter";
    return frame(`ncs${kind}`, `${kind === "spotting" ? "Spotting" : "Chamfer"} section unavailable`, `Enter valid ${label} to display a nominal section.`, `<rect x="24" y="24" width="672" height="360" rx="12" fill="#f4f9fc"/>${text(360, 180, "Nominal section", "ncs-key", 'text-anchor="middle"')}${text(360, 222, "Check geometry inputs.", "ncs-label", 'text-anchor="middle"')}`);
  }
  function isGeometryValid(input) {
    return input && (input.geometryValid === true || (input.geometryValid === undefined && input.valid === true));
  }
  function angleOf(input) { return input.angle ?? input.geometry?.angle; }

  function renderSpotting(input) {
    const angle = angleOf(input || {});
    if (!isGeometryValid(input) || ![angle, input.diameter, input.depth, input.theoreticalDepth, input.z].every(finite) || angle <= 0 || angle >= 180 || input.diameter <= 0 || input.depth <= 0 || input.theoreticalDepth <= 0) return placeholder("spotting");
    const measured = input.datum === "measured";
    if (measured && !finite(input.tipOffset)) return placeholder("spotting");
    const prefix = "ncsSpot", { diameter, depth, theoreticalDepth, z } = input;
    const scale = Math.min(300 / diameter, 175 / Math.max(depth, theoreticalDepth), 100);
    if (!finite(scale) || scale <= 0) return placeholder("spotting");
    const axis = 320, surface = 140, tip = surface + theoreticalDepth * scale;
    const datumY = surface + depth * scale;
    const left = axis - diameter / 2 * scale, right = axis + diameter / 2 * scale;
    const halfAngle = angle * Math.PI / 360;
    const arcRadius = Math.min(34, (tip - surface) * .5);
    const arcX = arcRadius * Math.sin(halfAngle), arcY = tip - arcRadius * Math.cos(halfAngle);
    const contour = `M40 ${surface}H${n(left)}L${axis} ${n(tip)}L${n(right)} ${surface}H680V350H40Z`;
    let content = `<path d="${contour}" fill="#edf3f7"/><path d="${contour}" fill="url(#${prefix}Hatch)" stroke="#a6bdcd"/>`;
    content += `<path d="M${n(left)} ${surface}H${n(right)}L${axis} ${n(tip)}Z" fill="#0067ad0c"/>`;
    content += line(left, surface, axis, tip, `stroke="${orange}" stroke-width="4" stroke-dasharray="8 5"`);
    content += line(right, surface, axis, tip, `stroke="${orange}" stroke-width="4" stroke-dasharray="8 5"`);
    content += line(40, surface, 680, surface, 'stroke="#91aabd" stroke-dasharray="6 5"');
    content += line(axis, 44, axis, 354, `stroke="${blue}" stroke-dasharray="7 5"`);
    content += text(axis, 30, "Tool / hole center", "ncs-label", 'text-anchor="middle"');
    content += text(40, 126, "Z0", "ncs-key ncs-blue");
    content += text(60, 303, "Material", "ncs-label ncs-helper");
    content += line(left, surface - 8, left, 84, `stroke="${blue}"`) + line(right, surface - 8, right, 84, `stroke="${blue}"`);
    content += dimension(prefix, left, 92, right, 92) + text(axis, 76, `D Ø${number(diameter)} mm`, "ncs-key ncs-contact", 'text-anchor="middle"');
    content += `<path d="M${n(axis - arcX)} ${n(arcY)}A${n(arcRadius)} ${n(arcRadius)} 0 0 1 ${n(axis + arcX)} ${n(arcY)}" fill="none" stroke="${blue}"/>`;
    content += text(axis, tip - arcRadius - 10, `${number(angle)}°`, "ncs-key ncs-contact", 'text-anchor="middle"');
    content += line(axis, datumY, 632, datumY, `stroke="${blue}" stroke-dasharray="4 4"`);
    content += dimension(prefix, 620, surface, 620, datumY);
    content += text(653, (surface + datumY) / 2, `Z ${number(z)} mm`, "ncs-key ncs-blue", `text-anchor="middle" transform="rotate(-90 653 ${n((surface + datumY) / 2)})"`);
    content += `<circle cx="${axis}" cy="${n(tip)}" r="4" fill="${orange}"/>`;
    if (measured) {
      // 實測值可能在理論尖點上方或下方，兩者都只表示對刀基準，不畫成真實平底刀尖。
      content += line(axis - 32, datumY, axis + 32, datumY, `stroke="${blue}" stroke-width="3"`);
      content += `<circle cx="${axis}" cy="${n(datumY)}" r="5" fill="${blue}"/>`;
      content += text(40, 382, `Measured datum · Δz ${number(input.tipOffset)} mm`, "ncs-label");
    } else content += text(40, 382, "Z uses the theoretical point", "ncs-label");
    content += text(40, 408, "Nominal section · actual insert profile not shown", "ncs-note ncs-helper");
    const description = `Nominal ${number(angle)} degree axial section. D ${number(diameter)} millimeters is measured at work surface Z0. The dashed orange lines represent ideal geometry, not the actual offset insert. Theoretical point depth ${number(theoreticalDepth)} millimeters. ${measured ? `Measured tool-length datum depth ${number(depth)} millimeters, offset ${number(input.tipOffset)} millimeters from the theoretical point.` : "No measured tip calibration has been applied."} Z ${number(z)} millimeters. Holder offset, insert profile and collision clearance are not modeled.`;
    return frame(prefix, `NC Spot Drill ${number(angle)}° nominal spotting section`, description, content);
  }

  function renderChamfer(input) {
    const angle = angleOf(input || {});
    const required = [angle, input?.diameter, input?.depth, input?.theoreticalDepth, input?.width, input?.height, input?.upperDiameter, input?.lowerDiameter, input?.radius, input?.z];
    if (!isGeometryValid(input) || !required.every(finite) || angle !== 90 || input.width <= 0 || input.height <= 0 || input.lowerDiameter <= 0 || input.radius <= 0 || input.depth <= 0 || input.theoreticalDepth <= 0 || !["upper", "middle", "lower"].includes(input.reference)) return placeholder("chamfering");
    const measured = input.datum === "measured";
    if (measured && !finite(input.tipOffset)) return placeholder("chamfering");
    const prefix = "ncsChamfer", { width, height, radius, diameter, upperDiameter, lowerDiameter, theoreticalDepth, depth, z } = input;
    const position = { upper: 1, middle: .5, lower: 0 }[input.reference];
    const scale = Math.min(435 / upperDiameter, 175 / Math.max(theoreticalDepth, depth, height), 90);
    if (!finite(scale) || scale <= 0) return placeholder("chamfering");
    const surface = 135, upperX = 70, edge = upperX + width * scale, axis = edge + radius * scale;
    const lowerY = surface + height * scale, tipY = surface + theoreticalDepth * scale, datumY = surface + depth * scale;
    const referenceY = surface + (1 - position) * height * scale;
    const leftRef = axis - diameter / 2 * scale, rightRef = axis + diameter / 2 * scale;
    const top = surface - 16;
    // 只多畫少量頂面上方錐面，保留同一 X/Z 比例，避免把刀柄畫成未經核對的形狀。
    const topR = (theoreticalDepth * scale + surface - top);
    const contour = `M40 ${surface}H${n(upperX)}L${n(edge)} ${n(lowerY)}V335H40Z`;
    let content = `<path d="${contour}" fill="#edf3f7"/><path d="${contour}" fill="url(#${prefix}Hatch)" stroke="#a6bdcd"/>`;
    content += `<path d="M${n(axis - topR)} ${top}H${n(axis + topR)}L${n(axis)} ${n(tipY)}Z" fill="#0067ad0c" stroke="${blue}" stroke-width="2" stroke-dasharray="7 4"/>`;
    content += line(40, surface, 680, surface, 'stroke="#91aabd" stroke-dasharray="6 5"');
    content += line(edge, 105, edge, 350, 'stroke="#91aabd" stroke-dasharray="6 5"');
    content += line(axis, 45, axis, 350, `stroke="${blue}" stroke-dasharray="7 4"`);
    content += text(axis, 31, "Tool center", "ncs-label", 'text-anchor="middle"');
    content += text(40, 120, "Z0", "ncs-key ncs-blue");
    content += text(44, 301, "Material", "ncs-label ncs-helper");
    content += line(upperX, surface, edge, lowerY, `stroke="${orange}" stroke-width="5"`);
    content += line(upperX, surface - 5, upperX, 80, `stroke="${blue}"`) + line(edge, surface - 5, edge, 80, `stroke="${blue}"`);
    content += dimension(prefix, upperX, 88, edge, 88) + text((upperX + edge) / 2, 72, `C ${number(width)}`, "ncs-key", 'text-anchor="middle"');
    content += line(leftRef, referenceY, rightRef, referenceY, `stroke="${orange}" stroke-dasharray="5 4"`);
    content += `<circle cx="${n(leftRef)}" cy="${n(referenceY)}" r="5" fill="${orange}"/>`;
    content += text(rightRef + 10, referenceY - 9, `Ø${number(diameter)}`, "ncs-key ncs-contact");
    content += dimension(prefix, edge, 361, axis, 361) + text((edge + axis) / 2, 391, `R ${number(radius)} mm`, "ncs-key ncs-blue", 'text-anchor="middle"');
    content += line(axis, datumY, 638, datumY, `stroke="${blue}" stroke-dasharray="4 4"`);
    content += dimension(prefix, 625, surface, 625, datumY);
    content += text(659, (surface + datumY) / 2, `Z ${number(z)} mm`, "ncs-key ncs-blue", `text-anchor="middle" transform="rotate(-90 659 ${n((surface + datumY) / 2)})"`);
    content += `<circle cx="${n(axis)}" cy="${n(tipY)}" r="4" fill="${orange}"/>`;
    if (measured) {
      content += line(axis - 28, datumY, axis + 28, datumY, `stroke="${blue}" stroke-width="3"`);
      content += `<circle cx="${n(axis)}" cy="${n(datumY)}" r="5" fill="${blue}"/>`;
      if (finite(input.tipClearance) && input.tipClearance > 0) {
        content += dimension(prefix, 561, lowerY, 561, datumY);
        content += text(582, (lowerY + datumY) / 2, `${number(input.tipClearance)} mm`, "ncs-note ncs-helper", `text-anchor="middle" transform="rotate(-90 582 ${n((lowerY + datumY) / 2)})"`);
      }
    }
    content += text(40, 416, measured ? "Tip clearance: 1 mm min. · measured datum" : "Tip clearance: 1 mm min. · calibration needed", "ncs-note ncs-helper");
    const description = `Nominal local straight-edge 90 degree chamfer section. Material is left of the original dashed XY contour, free side is right. C ${number(width)} millimeters; vertical height ${number(height)} millimeters. The selected contact diameter ${number(diameter)} millimeters meets the ${input.reference} edge. Upper and lower contact diameters are ${number(upperDiameter)} and ${number(lowerDiameter)} millimeters. R ${number(radius)} millimeters is the tool-center distance toward the free side from the original contour, not a hole-center path radius or wear offset. Z ${number(z)} millimeters uses ${measured ? "the measured tool-length datum" : "the theoretical point"}. Catalog requires at least 1 millimeter tip clearance; ${measured && finite(input.tipClearance) ? `modeled clearance ${number(input.tipClearance)} millimeters.` : "actual clearance is unverified without measured calibration."} This is nominal geometry, not the actual insert shape or collision verification.`;
    return frame(prefix, "NC Spot Drill 90° nominal chamfer section", description, content);
  }
  return Object.freeze({ renderSpotting, renderChamfer });
})();

if (typeof module !== "undefined") module.exports = NC_SPOT_DIAGRAMS;
