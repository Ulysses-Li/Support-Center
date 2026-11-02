/* NC Helix 一般單孔設定：幾何、選刀與轉速／進給共用核心。
 * 原表查詢與明確標示的區間估算分開提供；不輸出 NC。
 * Z0 為工件面，深度指刀尖的幾何位置。
 */
const HELIX_CORE = (() => {
  "use strict";
  const EPSILON = 1e-8;
  const MAX_TURNS = 10000;

  // 接受數字與有效數字文字；空欄、布林值等不能被轉成 0 或 1。
  const number = value => {
    if (typeof value !== "number" && typeof value !== "string") return NaN;
    if (typeof value === "string" && !value.trim()) return NaN;
    return Number(value);
  };
  const positive = value => Number.isFinite(value) && value > 0;

  function getCandidates(tools, { diameter, depth, coolant = "all" } = {}) {
    const d = number(diameter), h = number(depth);
    if (!positive(d) || !positive(h) || !["all", "internal", "external"].includes(coolant)) return [];
    return (Array.isArray(tools) ? tools : []).filter(tool => {
      const dc = number(tool.dc), min = number(tool.dmin), max = number(tool.dmax), maxDepth = number(tool.maxDepth);
      return positive(dc) && positive(min) && positive(max) && positive(maxDepth)
        && d > dc && d >= min - EPSILON && d <= max + EPSILON && h <= maxDepth + EPSILON
        && (coolant === "all" || tool.coolant === coolant);
    });
  }

  function getCatalogPresets(tool, materialId, diameter) {
    const d = number(diameter);
    if (!positive(d) || !tool || !Array.isArray(tool.table)) return null;
    // 原表查詢僅回傳明列孔徑；區間估算另由 getSuggestedPresets 處理。
    const row = tool.table.find(item => Math.abs(number(item.diameter) - d) <= EPSILON);
    const preset = row?.values?.[materialId];
    if (!preset || !positive(number(preset.fz)) || !Array.isArray(preset.pitches)
        || preset.pitches.length !== 3 || !preset.pitches.every(value => positive(number(value)))) return null;
    return { diameter: number(row.diameter), fz: number(preset.fz), pitches: preset.pitches.map(number) };
  }

  function getSuggestedPresets(tool, materialId, diameter) {
    const d = number(diameter);
    if (!positive(d) || !tool || !Array.isArray(tool.table) || !tool.table.length) return null;
    // 若有刀具範圍資料，原表命中與區間估算都必須先符合範圍。
    for (const key of ["dmin", "dmax", "dc"]) {
      if (tool[key] !== undefined && !positive(number(tool[key]))) return null;
    }
    const min = number(tool.dmin), max = number(tool.dmax), dc = number(tool.dc);
    if ((positive(min) && d < min - EPSILON) || (positive(max) && d > max + EPSILON)
        || (positive(dc) && d <= dc) || (positive(min) && positive(max) && min > max)) return null;

    // 先依全部原表節點排序，保留材料缺值節點，避免跨過缺資料的尺寸。
    const rows = [...tool.table];
    if (rows.some(row => !row || !positive(number(row.diameter)))) return null;
    rows.sort((a, b) => number(a.diameter) - number(b.diameter));
    if (rows.some((row, index) => index > 0 && number(row.diameter) - number(rows[index - 1].diameter) <= EPSILON)) return null;
    const exact = rows.find(row => Math.abs(number(row.diameter) - d) <= EPSILON);
    if (exact) {
      const preset = getCatalogPresets(tool, materialId, d);
      return preset ? { ...preset, kind: "catalog", bounds: [preset.diameter, preset.diameter] } : null;
    }
    const upperIndex = rows.findIndex(row => number(row.diameter) > d);
    if (upperIndex <= 0) return null; // 不外推至原表首末節點以外。
    const lower = getCatalogPresets(tool, materialId, rows[upperIndex - 1].diameter);
    const upper = getCatalogPresets(tool, materialId, rows[upperIndex].diameter);
    if (!lower || !upper) return null;

    // 線性估算是本工具的操作選擇，未宣稱官方核准此插值方法；顯示端必須保留 estimated 標示。
    const ratio = (d - lower.diameter) / (upper.diameter - lower.diameter);
    const fz = lower.fz + (upper.fz - lower.fz) * ratio;
    const pitches = lower.pitches.map((value, index) => value + (upper.pitches[index] - value) * ratio);
    if (!positive(fz) || !pitches.every(positive)) return null;
    return { diameter: d, fz, pitches, kind: "estimated", bounds: [lower.diameter, upper.diameter] };
  }

  function calculate(input = {}) {
    const d = number(input.diameter), h = number(input.depth), dc = number(input.dc);
    const pitch = number(input.pitch), vc = number(input.vc), fz = number(input.fz);
    const teeth = number(input.teeth === undefined ? 2 : input.teeth);
    const rampMax = number(input.rampMax === undefined ? 20 : input.rampMax);
    const result = {
      valid: false, errors: [], radius: null, orbitDiameter: null, turns: null,
      actualPitch: null, rampAngle: null, spindle: null, feed: null, zTarget: null, pitchLimit: null
    };
    const error = message => result.errors.push(message);
    [[d, "Hole diameter"], [h, "Depth"], [dc, "Tool diameter"], [pitch, "Pitch"],
      [vc, "Cutting speed"], [fz, "Feed per tooth"]].forEach(([value, label]) => {
      if (!positive(value)) error(`${label} must be greater than zero.`);
    });
    if (!positive(teeth) || !Number.isInteger(teeth)) error("Number of teeth must be a positive integer.");
    if (!positive(rampMax) || rampMax >= 90) error("Maximum ramp angle must be between 0° and 90°.");

    // 型錄範圍作為獨立限制，不將單純幾何可行冒稱符合刀具規格。
    [["dmin", "Minimum hole diameter"], ["dmax", "Maximum hole diameter"], ["maxDepth", "Maximum depth"], ["maxPitch", "Maximum insert Pitch"]].forEach(([key, label]) => {
      if (input[key] !== undefined && !positive(number(input[key]))) error(`${label} is invalid.`);
    });
    if (positive(d) && positive(dc)) {
      if (d <= dc) error("Hole diameter must be larger than the tool diameter.");
      else {
        result.orbitDiameter = d - dc;
        result.radius = result.orbitDiameter / 2;
      }
    }
    const min = number(input.dmin), max = number(input.dmax), maxDepth = number(input.maxDepth);
    if (positive(d) && positive(min) && d < min - EPSILON) error("Hole diameter is below the tool range.");
    if (positive(d) && positive(max) && d > max + EPSILON) error("Hole diameter exceeds the tool range.");
    if (positive(h) && positive(maxDepth) && h > maxDepth + EPSILON) error("Depth exceeds the catalog limit.");
    if (positive(min) && positive(max) && min > max) error("Tool diameter range is invalid.");
    if (positive(h)) result.zTarget = -h;

    if (positive(h) && positive(pitch)) {
      // 保持整圈並平均下降；同時回傳輸入 Pitch 對應的實際每圈下降量。
      const turns = Math.max(1, Math.ceil(h / pitch - 1e-10));
      if (!Number.isFinite(turns) || turns > MAX_TURNS) error("Helix exceeds the 10,000-orbit calculation limit.");
      else {
        result.turns = turns;
        result.actualPitch = h / turns;
        // 刀片的 Pitch 上限與刀具斜坡角上限分開驗證；依實際每圈下降量判定。
        const maxPitch = number(input.maxPitch);
        if (positive(maxPitch) && result.actualPitch > maxPitch + EPSILON) error("Actual Pitch exceeds the insert limit.");
      }
    }
    if (positive(result.orbitDiameter)) {
      const circumference = Math.PI * result.orbitDiameter;
      if (positive(rampMax) && rampMax < 90) result.pitchLimit = circumference * Math.tan(rampMax * Math.PI / 180);
      if (positive(result.actualPitch)) {
        result.rampAngle = Math.atan(result.actualPitch / circumference) * 180 / Math.PI;
        if (positive(rampMax) && result.rampAngle > rampMax + EPSILON) error("Actual ramp angle exceeds the tool limit.");
      }
    }
    if (positive(vc) && positive(dc)) {
      const spindle = Math.round(1000 * vc / (Math.PI * dc));
      if (!positive(spindle)) error("Spindle speed is outside the supported range.");
      else {
        result.spindle = spindle;
        if (positive(fz) && positive(teeth) && Number.isInteger(teeth)) {
          const feed = spindle * fz * teeth;
          if (!positive(feed)) error("Feed rate is outside the supported range.");
          else result.feed = feed;
        }
      }
    }
    // 極端輸入即使本身有限，也可能使衍生計算溢位；不讓 Infinity 進入摘要或圖形。
    let overflow = false;
    Object.keys(result).forEach(key => {
      if (typeof result[key] === "number" && !Number.isFinite(result[key])) {
        result[key] = null;
        overflow = true;
      }
    });
    if (overflow) error("Calculated values exceed the supported range.");
    result.valid = result.errors.length === 0;
    return result;
  }

  return { getCandidates, getCatalogPresets, getSuggestedPresets, calculate };
})();

if (typeof module !== "undefined") module.exports = HELIX_CORE;
