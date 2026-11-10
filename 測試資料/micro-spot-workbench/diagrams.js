/* Micro Spot Drill 剖面：X／Z 使用同一比例；深度與 Z 僅讀取計算核心的 geometry 結果。
 * 名義平底／實測對刀基準分開繪製，不把實測深度硬套到名義 Wmin 平底而破壞斜面角度。
 * Tmax、Re 以型錄規格分別標示，不重建未確認的 Re 過渡；未提供 geometry 時保留舊選型圖。
 */
const MICRO_SPOT_DIAGRAMS = (() => {
  "use strict";
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  const finite = value => {
    if (!["number", "string"].includes(typeof value) || String(value).trim() === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  // 微小正切深不能因四位小數顯示成零；極小值保留有效位數。
  const number = value => value !== 0 && Math.abs(value) < .001
    ? String(Number(value.toPrecision(6))) : String(Number(value.toFixed(4)));
  const styles = `<style>.ms-label{font:16px Arial,sans-serif;fill:#536d82}.ms-key{font:700 18px Arial,sans-serif;fill:#0c2237}.ms-contact{font:700 18px Arial,sans-serif;fill:#c34610}.ms-note{font:14px Arial,sans-serif;fill:#536d82}.ms-value{font:700 19px Arial,sans-serif;fill:#0c2237}</style>`;

  function frame(prefix, title, description, content, height = 420) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 ${height}" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" class="micro-section-svg" style="display:block;width:100%;height:auto"><title id="${prefix}-title">${escape(title)}</title><desc id="${prefix}-desc">${escape(description)}</desc>${styles}${content}</svg>`;
  }

  const messageText = value => typeof value === "string" ? value : String(value?.message || value?.text || "");
  function lines(value, length = 76) {
    const result = [];
    for (const word of String(value).split(/\s+/)) {
      if (!result.length || result[result.length - 1].length + word.length + 1 > length) result.push(word);
      else result[result.length - 1] += ` ${word}`;
    }
    return result;
  }
  function depthSection({ insert, target, geometry, prefix, angle, minimum, maximum, depth: catalogDepth, radius }) {
    const nominalDepth = finite(geometry.nominalDepth), targetDepth = finite(geometry.depth), z = finite(geometry.z);
    const measured = geometry.mode === "measured";
    const valid = geometry.valid === true && targetDepth !== null && targetDepth > 0 && z !== null && z < 0;
    const messages = [...(geometry.errors || []), ...(geometry.conditions || [])].map(messageText).filter(Boolean);
    const profileValid = target !== null && target >= minimum - 1e-9 && target <= maximum + 1e-9 && nominalDepth !== null && nominalDepth >= 0;
    if (!profileValid) {
      const why = messages.join(" ") || "Enter a diameter inside this insert's catalog width range and a valid tool-length reference.";
      return frame(prefix, "Micro spotting depth section unavailable", `${why} No valid Z target is available.`, `<rect x="24" y="24" width="672" height="372" rx="12" fill="#f4f9fc"/><text x="360" y="115" text-anchor="middle" class="ms-key">Depth section unavailable</text>${lines(why, 66).slice(0, 5).map((line, index) => `<text x="360" y="${158 + 25 * index}" text-anchor="middle" class="ms-label">${escape(line)}</text>`).join("")}<text x="360" y="330" text-anchor="middle" class="ms-contact">Z unavailable</text><text x="360" y="365" text-anchor="middle" class="ms-note">Catalog nominal range: Ø${number(minimum)}–${number(maximum)} mm</text>`);
    }

    const wholeHeight = (maximum - minimum) / (2 * Math.tan(angle * Math.PI / 360));
    const scale = Math.min(280 / maximum, 140 / Math.max(wholeHeight, nominalDepth, valid ? targetDepth : 0, .01));
    const axis = 220, surface = 165, flat = surface + nominalDepth * scale;
    const tipY = valid ? surface + targetDepth * scale : null;
    const top = flat - wholeHeight * scale;
    const left = axis - target / 2 * scale, right = axis + target / 2 * scale;
    const outerLeft = axis - maximum / 2 * scale, outerRight = axis + maximum / 2 * scale;
    const innerLeft = axis - minimum / 2 * scale, innerRight = axis + minimum / 2 * scale;
    const fill = `M38 ${surface}H${number(left)}L${number(innerLeft)} ${number(flat)}H${number(innerRight)}L${number(right)} ${surface}H420V355H38Z`;
    const marker = `url(#${prefix}-arrow)`;
    const half = angle * Math.PI / 360, arcRadius = 22;
    const virtual = flat + minimum / (2 * Math.tan(half)) * scale;
    const arcX = arcRadius * Math.sin(half), arcY = virtual - arcRadius * Math.cos(half);
    const label = measured ? "Measured tool-length datum" : "Nominal flat-tip datum";
    const title = `${insert.id}: ${measured ? "measured-reference" : "nominal"} spotting depth${valid ? ` ${number(targetDepth)} mm, Z ${number(z)} mm` : " unavailable"}`;
    const description = `${angle} degree Micro Spot Drill nominal straight-face section. Spot diameter ${number(target)} millimeters at work surface Z0. The nominal flat-tip plane is ${number(nominalDepth)} millimeters below the surface. ${valid ? `${label}: depth ${number(targetDepth)} millimeters, Z ${number(z)} millimeters.` : `No valid Z target. ${messages.join(" ")}`} ${measured ? "The measured tool-length datum is an independent plane; it does not move the nominal flat or reconstruct the actual corner profile." : "Nominal depth ignores the Re transition and needs a suitable tool-length reference before use."} X and Z use the same drawing scale. Catalog Wmin ${number(minimum)}, Wmax ${number(maximum)}, Tmax ${number(catalogDepth)}, Re ${number(radius)} millimeters.`;
    const footer = valid
      ? measured ? "Orange datum: measured tool-length reference. Dashed profile: nominal geometry; Re not reconstructed." : "Nominal flat-tip model; Re transition is not modeled. Confirm the physical tool-length reference."
      : messages.join(" ") || "No usable Z from this nominal estimate; confirm a measured tool-length reference.";
    const datum = valid ? `<path class="ms-depth-dimension" d="M430 ${surface}V${number(tipY)}" stroke="#0067ad" fill="none" marker-start="${marker}" marker-end="${marker}"/><path d="M${measured ? 250 : number(innerRight)} ${number(tipY)}H439" stroke="${measured ? "#f05a1a" : "#0067ad"}" stroke-dasharray="${measured ? "5 3" : "none"}"/><text x="451" y="${number((surface + tipY) / 2)}" text-anchor="middle" class="ms-label" transform="rotate(-90 451 ${number((surface + tipY) / 2)})">t ${number(targetDepth)} mm</text>${measured ? `<path d="M198 ${number(tipY)}H242M220 ${number(tipY - 7)}V${number(tipY + 7)}" stroke="#f05a1a" stroke-width="2.5"/><text x="${number(Math.min(outerRight + 12, 322))}" y="${number(tipY + 20)}" class="ms-note">Measured datum</text>` : ""}` : "";

    return frame(prefix, title, description, `
      <defs><pattern id="${prefix}-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="10" stroke="#ccdfec" stroke-width="2"/></pattern><marker id="${prefix}-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#0067ad"/></marker></defs>
      <text x="220" y="20" text-anchor="middle" class="ms-label">Tool / hole center</text>
      <path d="${fill}" fill="#edf4f8"/><path d="${fill}" fill="url(#${prefix}-hatch)" stroke="#adc6d8"/>
      <path d="M${number(outerLeft)} ${number(top)}L${number(innerLeft)} ${number(flat)}H${number(innerRight)}L${number(outerRight)} ${number(top)}Z" fill="#e8f4fc"/>
      <path class="ms-tool-edge" d="M${number(outerLeft)} ${number(top)}L${number(innerLeft)} ${number(flat)}M${number(innerRight)} ${number(flat)}L${number(outerRight)} ${number(top)}" stroke="#f05a1a" stroke-width="3" stroke-dasharray="${measured ? "6 4" : "none"}" fill="none"/>
      <path class="ms-nominal-flat" d="M${number(innerLeft)} ${number(flat)}H${number(innerRight)}" stroke="#0067ad" stroke-width="2"/>
      <path d="M220 30V359M38 ${surface}H439" stroke="#9cb9cc" stroke-dasharray="5 4" fill="none"/><text x="38" y="150" class="ms-label">Work surface · Z0</text>
      <path d="M${number(left)} 117V158M${number(right)} 117V158M${number(left)} 126H${number(right)}" stroke="#0067ad" fill="none" marker-start="${marker}" marker-end="${marker}"/><text x="220" y="109" text-anchor="middle" class="ms-contact">D Ø${number(target)} mm</text>
      <path d="M${number(axis - arcX)} ${number(arcY)}A${arcRadius} ${arcRadius} 0 0 1 ${number(axis + arcX)} ${number(arcY)}" stroke="#0067ad" fill="none"/><text x="220" y="${number(arcY - 10)}" text-anchor="middle" class="ms-key">${number(angle)}°</text>
      <path d="M${number(innerLeft)} ${number(flat + 7)}V${number(flat + 39)}M${number(innerRight)} ${number(flat + 7)}V${number(flat + 39)}M${number(innerLeft)} ${number(flat + 29)}H${number(innerRight)}" stroke="#0067ad" fill="none" marker-start="${marker}" marker-end="${marker}"/><text x="220" y="${number(flat + 57)}" text-anchor="middle" class="ms-label">Nominal flat Wmin ${number(minimum)} mm</text>
      ${datum}
      <text x="490" y="47" class="ms-label">${measured ? "MEASURED REFERENCE" : "NOMINAL MODEL"}</text><text x="490" y="82" class="ms-contact">${valid ? `Z ${number(z)} mm` : "Z unavailable"}</text>
      <text x="490" y="115" class="ms-label">${valid ? `Depth t ${number(targetDepth)} mm` : "Check depth / datum"}</text><text x="490" y="146" class="ms-note">${measured ? "Same assembled-tool reference" : "Nominal flat-tip reference"}</text>
      <text x="490" y="196" class="ms-label">Catalog Wmax ${number(maximum)} mm</text><text x="490" y="229" class="ms-label">Catalog Tmax ${number(catalogDepth)} mm</text><text x="490" y="262" class="ms-label">Corner Re ${number(radius)} mm</text><text x="490" y="294" class="ms-note">Re transition not reconstructed.</text><text x="490" y="316" class="ms-note">Profile uses equal X/Z scale.</text>
      ${lines(footer, 86).slice(0, 3).map((line, index) => `<text x="38" y="${390 + index * 23}" class="ms-note">${escape(line)}</text>`).join("")}
      <text x="38" y="464" class="ms-note">Catalog p. 25 · Confirm tool-length datum, radius effects and actual cutting depth.</text>`, 480);
  }

  function renderSection({ insert, diameter, geometry } = {}) {
    const id = String(insert?.id || "unselected");
    const prefix = `micro-section-${id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || "unselected"}`;
    const angle = finite(insert?.includedAngleDeg), minimum = finite(insert?.WminMm), maximum = finite(insert?.WmaxMm);
    const depth = finite(insert?.TmaxMm), radius = finite(insert?.ReMm), target = finite(diameter);
    if (angle === null || minimum === null || maximum === null || depth === null || radius === null
      || angle <= 0 || angle >= 180 || minimum <= 0 || maximum <= minimum || depth <= 0 || radius < 0) {
      return frame(prefix, "Micro spotting section unavailable", "Choose a catalog Micro Spot Drill insert to see its nominal width and angle diagram. No machine depth is calculated.", `<rect x="24" y="24" width="672" height="352" rx="12" fill="#f4f9fc"/><text x="360" y="170" text-anchor="middle" class="ms-key">Select a Micro insert</text><text x="360" y="205" text-anchor="middle" class="ms-label">Its catalog geometry will appear here.</text><text x="360" y="245" text-anchor="middle" class="ms-note">No tool-length or machine-depth reference is assumed.</text>`);
    }
    if (geometry && typeof geometry === "object") return depthSection({ insert, target, geometry, prefix, angle, minimum, maximum, depth, radius });

    // 繪圖高度只定位理想直面，不能當成實體切深；型錄 Tmax 不參與近似公式或邊界否決。
    const straightHeight = (maximum - minimum) / (2 * Math.tan(angle * Math.PI / 360));
    const scale = Math.min(310 / maximum, 140 / straightHeight);
    const axis = 220, top = 145, bottom = top + straightHeight * scale;
    const outerLeft = axis - maximum / 2 * scale, outerRight = axis + maximum / 2 * scale;
    const innerLeft = axis - minimum / 2 * scale, innerRight = axis + minimum / 2 * scale;
    const targetValid = target !== null && target >= minimum - 1e-9 && target <= maximum + 1e-9;
    const atMinimum = targetValid && Math.abs(target - minimum) < 1e-9;
    const title = `${id}: ${number(angle)} degree Micro spotting nominal section`;
    const description = `Catalog ${id}, included angle ${number(angle)} degrees, nominal width Wmin ${number(minimum)} to Wmax ${number(maximum)} millimeters, Tmax ${number(depth)} millimeters, Re ${number(radius)} millimeters. ${targetValid ? `Required spot diameter ${number(target)} millimeters is shown as an independent width dimension.` : "The required diameter is absent or outside this insert's nominal width range."} X and Z drawing directions use the same scale. The straight-face envelope is idealized and the corner-radius transition is not reconstructed. Tmax is an independent catalog specification. No programmed Z or actual cutting depth is calculated.`;
    const path = `M38 ${top}H${number(outerLeft)}L${number(innerLeft)} ${number(bottom)}H${number(innerRight)}L${number(outerRight)} ${top}H420V345H38Z`;
    const arrow = `url(#${prefix}-arrow)`;
    const dimension = (x1, x2, y, color = "#0067ad") => `<path d="M${number(x1)} ${y}H${number(x2)}" fill="none" stroke="${color}" stroke-width="1.3" marker-start="${arrow}" marker-end="${arrow}"/>`;
    const halfAngle = angle * Math.PI / 360;
    const virtualPointY = bottom + minimum / 2 / Math.tan(halfAngle) * scale;
    const arcR = Math.min(28, straightHeight * scale * .52);
    const arcX = arcR * Math.sin(halfAngle), arcY = virtualPointY - arcR * Math.cos(halfAngle);
    // 角度弧的理論交點只作繪圖參考，沒有在畫面輸出其座標或切深。
    const arc = `<path d="M${number(axis - arcX)} ${number(arcY)}A${number(arcR)} ${number(arcR)} 0 0 1 ${number(axis + arcX)} ${number(arcY)}" stroke="#0067ad" fill="none"/><text x="220" y="${number(Math.min(arcY - 8, bottom - 13))}" text-anchor="middle" class="ms-key">${number(angle)}°</text>`;
    let requiredDimension;
    if (targetValid) {
      const targetLeft = axis - target / 2 * scale, targetRight = axis + target / 2 * scale;
      requiredDimension = `<text x="220" y="36" text-anchor="middle" class="ms-contact">Required spot D Ø${number(target)} mm</text>${dimension(targetLeft, targetRight, 58, "#f05a1a")}<path d="M${number(targetLeft)} 49V67M${number(targetRight)} 49V67" stroke="#f05a1a"/><text x="220" y="87" text-anchor="middle" class="ms-note">Width selection · not a depth setting</text>`;
    } else {
      requiredDimension = `<text x="220" y="42" text-anchor="middle" class="ms-contact">${target === null || target <= 0 ? "Enter a positive spot diameter D" : `D Ø${number(target)} mm is outside this range`}</text><text x="220" y="72" text-anchor="middle" class="ms-note">Nominal range: Ø${number(minimum)}–${number(maximum)} mm</text>`;
    }

    return frame(prefix, title, description, `
      <defs><pattern id="${prefix}-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="10" stroke="#ccdfec" stroke-width="2"/></pattern><marker id="${prefix}-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#0067ad"/></marker></defs>
      ${requiredDimension}
      <path d="${path}" fill="#edf4f8"/><path d="${path}" fill="url(#${prefix}-hatch)" stroke="#adc6d8"/>
      <path d="M${number(outerLeft)} ${top}L${number(innerLeft)} ${number(bottom)}H${number(innerRight)}L${number(outerRight)} ${top}Z" fill="#e8f4fc"/>
      <path class="ms-tool-edge" d="M${number(outerLeft)} ${top}L${number(innerLeft)} ${number(bottom)}M${number(innerRight)} ${number(bottom)}L${number(outerRight)} ${top}" stroke="#f05a1a" stroke-width="3.5" fill="none"/>
      <path d="M${number(innerLeft)} ${number(bottom)}H${number(innerRight)}" stroke="#0067ad" stroke-width="2"/>
      <path d="M220 100V350M38 ${top}H420" stroke="#9cb9cc" stroke-dasharray="5 4" fill="none"/>
      <path d="M${number(outerLeft)} 109V137M${number(outerRight)} 109V137" stroke="#0067ad"/>${dimension(outerLeft, outerRight, 119)}<text x="220" y="110" text-anchor="middle" class="ms-label">Wmax ${number(maximum)} mm</text>
      ${arc}
      <path d="M${number(innerLeft)} ${number(bottom + 8)}V${number(bottom + 40)}M${number(innerRight)} ${number(bottom + 8)}V${number(bottom + 40)}" stroke="#0067ad"/>${dimension(innerLeft, innerRight, number(bottom + 31))}<text x="220" y="${number(bottom + 57)}" text-anchor="middle" class="ms-label">Wmin ${number(minimum)} mm</text>
      <text x="480" y="145" class="ms-label">Catalog Tmax</text><text x="480" y="173" class="ms-value">${number(depth)} mm</text>
      <text x="480" y="209" class="ms-label">Corner radius Re</text><text x="480" y="237" class="ms-value">${number(radius)} mm</text>
      <text x="480" y="273" class="ms-note">Re transition not reconstructed.</text><text x="480" y="296" class="ms-note">Tmax is a catalog limit,</text><text x="480" y="317" class="ms-note">not a programmed Z value.</text>
      <text x="38" y="378" class="${atMinimum ? "ms-contact" : "ms-note"}">${atMinimum ? "Nominal lower bound: positive cutting depth is unconfirmed." : "Idealized straight-face envelope · X/Z shown at the same scale."}</text>
      <text x="38" y="402" class="ms-note">Catalog p. 25 · Nominal selection only; no machine-depth output.</text>`);
  }
  return Object.freeze({ renderSection });
})();

if (typeof module !== "undefined") module.exports = MICRO_SPOT_DIAGRAMS;
