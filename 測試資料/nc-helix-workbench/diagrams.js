/* NC Helix 單孔運動示意：俯視維持刀具／孔徑比例，側視說明中心運動與刀尖 Z。
 * 本圖不模擬刀片刃形、刀桿干涉、孔底形狀或實際加工後的表面。
 */
const HELIX_DIAGRAMS = (() => {
  "use strict";
  const color = { blue: "#0067ad", orange: "#f05a1a", ink: "#0c2237", muted: "#5c7183", line: "#a8c4d7" };
  const finite = value => typeof value === "number" && Number.isFinite(value);
  const textNumber = value => String(Number(value.toFixed(3)));
  const coordinate = value => Number(value.toFixed(3));
  const clampProgress = value => finite(value) ? Math.max(0, Math.min(100, value)) / 100 : 0;

  function validGeometry(input) {
    return input && [input.diameter, input.dc, input.depth].every(value => finite(value) && value > 0)
      && input.diameter > input.dc;
  }

  function frame(id, title, description, body) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 340" role="img" aria-labelledby="${id}Title ${id}Description" style="display:block;width:100%;height:auto;font-family:Arial,sans-serif">
      <title id="${id}Title">${title}</title><desc id="${id}Description">${description}</desc>
      ${body}
    </svg>`;
  }

  function placeholder(id, label) {
    return frame(id, label, "Enter a valid hole diameter, cutter diameter and depth to display the machining geometry.", `<rect x="20" y="25" width="460" height="285" rx="12" fill="#f2f8fc"/>
      <circle cx="250" cy="134" r="52" fill="none" stroke="${color.line}" stroke-width="2" stroke-dasharray="5 6"/>
      <path d="M238 134h24m-12-12v24" stroke="${color.line}" stroke-width="2"/>
      <text x="250" y="224" text-anchor="middle" font-size="16" fill="${color.muted}">Set valid geometry and Pitch.</text>`);
  }

  function definitions(id) {
    return `<defs>
      <pattern id="${id}Hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(32)"><rect width="8" height="8" fill="#eaf2f8"/><path d="M0 0v8" stroke="#c7dce9" stroke-width="1.4"/></pattern>
      <marker id="${id}Arrow" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M6 3L0 0v6z" fill="${color.blue}"/></marker>
    </defs>`;
  }

  function cross(x, y, stroke, size = 5) {
    return `<path d="M${coordinate(x - size)} ${coordinate(y)}h${size * 2}M${coordinate(x)} ${coordinate(y - size)}v${size * 2}" stroke="${stroke}" stroke-width="1.6"/>`;
  }

  function renderTop(input) {
    const id = "helixTop";
    if (!validGeometry(input)) return placeholder(id, "Helical milling top view");
    const { diameter, dc } = input;
    const progress = clampProgress(input.progress);
    const turns = finite(input.turns) && input.turns > 0 ? input.turns : 1;
    // SVG 的 Y 軸朝下，使用負角度讓俯視刀具中心依逆時針方向公轉。
    const angle = -Math.PI * 2 * ((turns * progress) % 1);
    const cx = 250, cy = 145, holeRadius = 90;
    const radius = (diameter - dc) / 2, cutterRatio = dc / diameter;
    const orbitRadius = holeRadius * (1 - cutterRatio), cutterRadius = holeRadius * cutterRatio;
    const tx = cx + Math.cos(angle) * orbitRadius, ty = cy + Math.sin(angle) * orbitRadius;
    // 只示意刀具中心公轉；刃口符號保持固定，不把公轉速度冒充主軸自轉。
    const cutterRotation = 0;
    const rightOrbit = cx + orbitRadius;
    return frame(id, "Counterclockwise helical milling top view", `Hole diameter ${textNumber(diameter)} mm. Cutter diameter ${textNumber(dc)} mm. The cutter center follows a counterclockwise circular path with radius ${textNumber(radius)} mm.`, `${definitions(id)}
      <path d="M140 145a110 110 0 1 0 220 0a110 110 0 1 0-220 0M160 145a90 90 0 1 1 180 0a90 90 0 1 1-180 0" fill="url(#${id}Hatch)" fill-rule="evenodd" stroke="${color.line}"/>
      <circle cx="${cx}" cy="${cy}" r="${holeRadius}" fill="#f5fbff" stroke="${color.blue}" stroke-width="1.5"/>
      <path d="M160 55V25m180 30V25M160 29H340" fill="none" stroke="${color.blue}" stroke-width="1" marker-start="none"/>
      <path d="M160 29H340" stroke="${color.blue}" marker-start="url(#${id}Arrow)" marker-end="url(#${id}Arrow)"/>
      <text x="250" y="18" text-anchor="middle" font-size="16" fill="${color.ink}">Hole Ø${textNumber(diameter)} mm</text>
      <circle cx="${cx}" cy="${cy}" r="${coordinate(orbitRadius)}" fill="none" stroke="${color.blue}" stroke-width="1.6" stroke-dasharray="5 5"/>
      <path d="M${cx} 47v196M152 ${cy}h196" stroke="${color.line}" stroke-dasharray="3 5" stroke-width="1"/>
      <circle cx="${coordinate(tx)}" cy="${coordinate(ty)}" r="${coordinate(cutterRadius)}" fill="#fff1e8" fill-opacity=".76" stroke="${color.orange}" stroke-width="2.2"/>
      <g transform="translate(${coordinate(tx)} ${coordinate(ty)}) rotate(${coordinate(cutterRotation)})" stroke="${color.orange}" stroke-width="3.5" stroke-linecap="round">
        <path d="M${coordinate(cutterRadius * .65)} ${coordinate(-cutterRadius * .65)}l${coordinate(cutterRadius * .18)} ${coordinate(cutterRadius * .15)}M${coordinate(-cutterRadius * .65)} ${coordinate(cutterRadius * .65)}l${coordinate(-cutterRadius * .18)} ${coordinate(-cutterRadius * .15)}"/>
      </g>
      ${cross(cx, cy, color.blue)}${cross(tx, ty, color.orange)}
      <path d="M${cx} 241v26M${coordinate(rightOrbit)} ${cy}v122" stroke="${color.line}" stroke-dasharray="3 4"/>
      <path d="M${cx} 263H${coordinate(rightOrbit)}" stroke="${color.blue}" stroke-width="1.2" marker-start="url(#${id}Arrow)" marker-end="url(#${id}Arrow)"/>
      <text x="250" y="289" text-anchor="middle" font-size="17" font-weight="700" fill="${color.blue}">Center orbit R ${textNumber(radius)} mm</text>
      <circle cx="98" cy="317" r="5" fill="none" stroke="${color.orange}" stroke-width="2"/>
      <text x="111" y="322" font-size="15" fill="${color.orange}">Cutter ØDc ${textNumber(dc)} mm</text>
      <path d="M306 317h22" stroke="${color.blue}" stroke-width="1.6" stroke-dasharray="4 3"/>
      <text x="336" y="322" font-size="15" fill="${color.muted}">Center path</text>`);
  }

  function renderSection(input) {
    const id = "helixSection";
    if (!validGeometry(input) || !finite(input.actualPitch) || input.actualPitch <= 0 || !finite(input.turns) || input.turns <= 0) return placeholder(id, "Helical milling side view");
    const { diameter, dc, depth, actualPitch, turns } = input;
    const progress = clampProgress(input.progress);
    const cx = 230, surface = 76, target = 245;
    const orbitRadius = 85 * (1 - dc / diameter);
    const toolWidth = 170 * (dc / diameter), shownTurns = Math.min(turns, 20);
    // 圈數多時僅畫代表性投影，避免線條密成色塊；實際 P 與圈數仍用真值標示。
    const drawPath = end => {
      const count = Math.max(2, Math.ceil(shownTurns * 48 * end));
      return Array.from({ length: count + 1 }, (_, index) => {
        const t = end * index / count;
        return `${index ? "L" : "M"}${coordinate(cx + Math.cos(Math.PI * 2 * shownTurns * t) * orbitRadius)} ${coordinate(surface + (target - surface) * t)}`;
      }).join(" ");
    };
    const tx = cx + Math.cos(Math.PI * 2 * shownTurns * progress) * orbitRadius;
    const tip = surface + (target - surface) * progress;
    const left = tx - toolWidth / 2, right = tx + toolWidth / 2;
    const p = textNumber(actualPitch), currentZ = textNumber(-depth * progress);
    return frame(id, "Helical milling side view", `Illustrative projection of the cutter-center helix. Total depth ${textNumber(depth)} mm, ${textNumber(turns)} orbits, actual descent ${p} mm per orbit. Tool-tip position Z ${currentZ} mm. Holder reach and the finished hole bottom are not represented.`, `${definitions(id)}
      <text x="38" y="24" font-size="15" fill="${color.muted}">Side projection · motion schematic</text>
      <text x="462" y="48" text-anchor="end" font-size="16" font-weight="700" fill="${color.blue}">P ${p} mm / orbit</text>
      <path d="M38 ${surface}h107v194H38zM315 ${surface}h100v194H315z" fill="url(#${id}Hatch)" stroke="${color.line}"/>
      <path d="M145 ${surface}V270M315 ${surface}V270" stroke="${color.blue}" stroke-width="1.5"/>
      <path d="M38 ${surface}H415" stroke="${color.line}" stroke-dasharray="4 4"/>
      <text x="38" y="65" font-size="15" fill="${color.muted}">Work surface · Z0</text>
      <path d="M${cx} 85V270" stroke="${color.line}" stroke-dasharray="4 5"/>
      <path d="${drawPath(1)}" fill="none" stroke="#bad2e3" stroke-width="1.7"/>
      ${progress > 0 ? `<path d="${drawPath(progress)}" fill="none" stroke="${color.blue}" stroke-width="2"/>` : ""}
      <g stroke="${color.orange}" stroke-width="1.7">
        <rect x="${coordinate(left)}" y="${coordinate(tip - 45)}" width="${coordinate(toolWidth)}" height="45" rx="2" fill="#fff1e8" fill-opacity=".88"/>
        <path d="M${coordinate(left)} ${coordinate(tip)}H${coordinate(right)}" stroke-width="3.5"/>
        <path d="M${coordinate(left + toolWidth * .16)} ${coordinate(tip - 8)}v8m${coordinate(toolWidth * .34)}-8v8m${coordinate(toolWidth * .34)}-8v8" opacity=".7"/>
      </g>
      ${cross(tx, tip, color.orange, 4)}
      <path d="M321 ${target}h121M420 ${surface}h22M435 ${surface}V${target}" fill="none" stroke="${color.blue}" stroke-width="1.1"/>
      <path d="M435 ${surface}V${target}" stroke="${color.blue}" marker-start="url(#${id}Arrow)" marker-end="url(#${id}Arrow)"/>
      <text x="457" y="${coordinate((surface + target) / 2)}" text-anchor="middle" transform="rotate(-90 457 ${coordinate((surface + target) / 2)})" font-size="16" fill="${color.blue}">L ${textNumber(depth)} mm</text>
      <path d="M145 ${target}H415" stroke="${color.line}" stroke-dasharray="4 5"/>
      <text x="230" y="294" text-anchor="middle" font-size="17" font-weight="700" fill="${color.orange}">Tool-tip Z ${currentZ} mm</text>
      <text x="230" y="320" text-anchor="middle" font-size="14" fill="${color.muted}">${turns > 20 ? `20 coils shown · actual ${textNumber(turns)} orbits · holder not shown` : `${textNumber(turns)} orbits · holder and bottom geometry not shown`}</text>`);
  }

  return { renderTop, renderSection };
})();

if (typeof module !== "undefined") module.exports = HELIX_DIAGRAMS;
