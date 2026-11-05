/* NC Spot Drill 純計算核心。
 * 型錄依據：NC Spot Drill 2025–2026，印刷頁 52–54。
 * 型錄明示依最大加工直徑計算轉速、f 為每轉進給，且刀片不在刀柄中心。
 * 因此本模型僅作直線錐面名義幾何；絕不沿用 ACE 的刀尖修正、Tmax 或 Cmax。
 * measured 的 tipOffset 由同一組裝刀具的實測直徑／深度基準推導，不能當作整支刀具的碰撞驗證。
 */
const NC_SPOT_CORE = (() => {
  const CONTACT_POSITIONS = Object.freeze({ upper: 1, middle: 0.5, lower: 0 });
  const EPSILON = 1e-9;

  // 避免空白、null、布林值被 Number() 默默轉成可用的 0／1。
  function finiteNumber(value) {
    if (typeof value !== "number" && typeof value !== "string") return null;
    if (typeof value === "string" && value.trim() === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function positiveNumber(value) {
    const number = finiteNumber(value);
    return number !== null && number > 0 ? number : null;
  }

  function calculate(input = {}) {
    const errors = [];
    const geometryErrors = [];
    const cuttingErrors = [];
    const warnings = [];
    const operation = input.operation || "spotting";
    const angle = finiteNumber(input.angle);
    const diameter = positiveNumber(input.diameter);
    const vc = positiveNumber(input.vc);
    const feed = positiveNumber(input.feed);
    const datum = input.datum || "theoretical";
    const isNominal = datum === "theoretical";
    const reference = input.reference || "upper";
    const position = CONTACT_POSITIONS[reference];
    const width = operation === "chamfering" ? positiveNumber(input.width) : 0;
    const tipOffset = datum === "measured" ? finiteNumber(input.tipOffset) : 0;
    const hasMaxDiameter = input.maxDiameter !== undefined && input.maxDiameter !== null;
    const maxDiameter = hasMaxDiameter ? positiveNumber(input.maxDiameter) : null;
    const hasMinSpotDepth = input.minSpotDepth !== undefined && input.minSpotDepth !== null;
    const minSpotDepth = hasMinSpotDepth ? finiteNumber(input.minSpotDepth) : null;
    const minClearance = input.minClearance === undefined ? 1 : finiteNumber(input.minClearance);
    const nominalRatio = angle !== null && angle > 0 && angle < 180
      ? (angle === 90 ? 1 : 1 / Math.tan(angle * Math.PI / 360)) : null;
    const depthPerWidth = Number.isFinite(nominalRatio) && nominalRatio > 0 ? nominalRatio : null;

    if (!["spotting", "chamfering"].includes(operation)) geometryErrors.push("Choose Spotting or Chamfering.");
    if (depthPerWidth === null) geometryErrors.push("Select a valid holder point angle between 0° and 180°.");
    if (diameter === null) geometryErrors.push("Enter a positive diameter D.");
    if (!["theoretical", "measured"].includes(datum)) geometryErrors.push("Select a valid tool-length reference.");
    if (datum === "measured" && tipOffset === null) geometryErrors.push("Enter a valid measured tool reference before using a calibrated Z target.");
    if (hasMaxDiameter && maxDiameter === null) geometryErrors.push("The selected maximum diameter must be positive.");
    if (hasMinSpotDepth && (minSpotDepth === null || minSpotDepth < 0)) geometryErrors.push("The minimum spotting depth must be zero or positive.");
    if (operation === "chamfering") {
      // 型錄 52 頁的 1 mm 刀尖避讓圖僅明示 90°；其他角度另行核對後再開放。
      if (angle !== 90) geometryErrors.push("Chamfer geometry in this preview supports the catalog's 90° holder diagram only.");
      if (width === null) geometryErrors.push("Enter a positive chamfer width C.");
      if (position === undefined) geometryErrors.push("Select where contact D touches the chamfer.");
      if (minClearance === null || minClearance < 0) geometryErrors.push("The required tip clearance must be zero or positive.");
    }
    if (vc === null) cuttingErrors.push("Enter a positive cutting speed Vc.");
    if (feed === null) cuttingErrors.push("Enter a positive feed per revolution f.");

    let lowerDiameter = operation === "spotting" ? 0 : null;
    let upperDiameter = operation === "spotting" ? diameter : null;
    let radius = null;
    let height = null;
    let minD = null;
    let maxD = maxDiameter;
    let theoreticalDepth = null;
    let depth = null;
    let tipClearance = null;
    if (operation === "chamfering" && diameter !== null && width !== null && position !== undefined) {
      radius = diameter / 2 - position * width;
      lowerDiameter = 2 * radius;
      upperDiameter = lowerDiameter + 2 * width;
      if (radius <= 0) geometryErrors.push("The contact position leaves no positive tool-center offset. Increase D or reduce C.");
      if (depthPerWidth !== null) height = width * depthPerWidth;
      if (depthPerWidth !== null && tipOffset !== null && minClearance !== null && minClearance >= 0) {
        minD = Math.max(0, 2 * (minClearance + tipOffset) / depthPerWidth) + 2 * position * width;
      }
      if (maxDiameter !== null) maxD = maxDiameter - 2 * (1 - position) * width;
    }

    if (depthPerWidth !== null && upperDiameter !== null && upperDiameter > 0) {
      theoreticalDepth = upperDiameter * depthPerWidth / 2;
      if (tipOffset !== null && ["theoretical", "measured"].includes(datum)) {
        depth = theoreticalDepth - tipOffset;
        if (!Number.isFinite(depth) || depth <= 0) geometryErrors.push("This diameter does not reach the modeled cutting face from the selected tool reference.");
        if (operation === "chamfering" && lowerDiameter !== null) {
          tipClearance = lowerDiameter * depthPerWidth / 2 - tipOffset;
          if (minClearance !== null && minClearance >= 0 && tipClearance < minClearance - EPSILON) {
            geometryErrors.push(`The modeled axial tip clearance is below ${minClearance} mm. Increase contact D or reduce C.`);
          }
        }
        if (operation === "spotting" && minSpotDepth !== null && minSpotDepth >= 0) {
          minD = Math.max(0, 2 * (minSpotDepth + tipOffset) / depthPerWidth);
          if (depth < minSpotDepth - EPSILON) geometryErrors.push(`This insert grade requires at least ${minSpotDepth} mm modeled spotting depth.`);
        }
      }
    }

    if (maxDiameter !== null && upperDiameter !== null && upperDiameter > maxDiameter + EPSILON) {
      geometryErrors.push("The full cutting diameter exceeds the selected catalog maximum diameter.");
    }
    if (maxD !== null && minD !== null && maxD < minD - EPSILON) {
      geometryErrors.push("No contact diameter fits both the chamfer width and the selected limits.");
    }

    // 上、下緣之間的標示 D 只決定選刀位置；S 一律用實際最大加工直徑。
    const maxCuttingDiameter = upperDiameter !== null && upperDiameter > 0 ? upperDiameter : null;
    const rawSpindle = vc !== null && maxCuttingDiameter !== null ? 1000 * vc / (Math.PI * maxCuttingDiameter) : null;
    const spindle = rawSpindle !== null && Number.isFinite(rawSpindle) && rawSpindle >= 0.5 ? Math.round(rawSpindle) : null;
    if (rawSpindle !== null && spindle === null) cuttingErrors.push("The spindle calculation is outside a usable finite range.");
    const feedRate = spindle !== null && feed !== null && Number.isFinite(spindle * feed) ? spindle * feed : null;
    if (spindle !== null && feed !== null && feedRate === null) cuttingErrors.push("The feed calculation is outside a finite range.");

    const outsideRange = (value, range) => Array.isArray(range) && range.length === 2
      && range.every(item => finiteNumber(item) !== null)
      && (value < Number(range[0]) - EPSILON || value > Number(range[1]) + EPSILON);
    if (vc !== null && outsideRange(vc, input.vcRange)) warnings.push("Vc is outside the selected catalog range.");
    if (feed !== null && outsideRange(feed, input.feedRange)) warnings.push("Feed per revolution is outside the selected catalog range.");
    if (isNominal) {
      warnings.push("Depth and Z use the nominal theoretical point. The catalog notes an offset insert; verify the assembled tool reference before programming Z.");
      if (operation === "chamfering" || hasMinSpotDepth) warnings.push("Tip clearance is a nominal geometric check until the same assembled tool is measured.");
    } else if (datum === "measured") {
      warnings.push("The measured reference calibrates this assembled tool locally; the straight-face model does not verify its complete rotated profile or holder clearance.");
    }
    const geometryValid = geometryErrors.length === 0;
    const cuttingValid = cuttingErrors.length === 0 && spindle !== null && feedRate !== null;
    errors.push(...geometryErrors, ...cuttingErrors);

    return {
      valid: geometryValid && cuttingValid, geometryValid, cuttingValid, errors, geometryErrors, cuttingErrors, warnings,
      operation, angle, diameter, vc, feedPerRev: feed, datum, isNominal, reference, position, tipOffset,
      width, height, depthPerWidth, radius, compensationDiameter: radius !== null ? 2 * radius : null,
      lowerDiameter, upperDiameter, maxCuttingDiameter, maxDiameter, minD, maxD,
      theoreticalDepth, depth, actualDepth: datum === "measured" ? depth : null,
      z: depth !== null && Number.isFinite(depth) ? -depth : null,
      requestedMinClearance: operation === "chamfering" ? minClearance : null,
      minSpotDepth, tipClearance,
      clearanceVerified: datum === "measured" && tipClearance !== null && minClearance !== null && tipClearance >= minClearance - EPSILON,
      clearanceBasis: datum === "measured" ? "measured local model" : "nominal theoretical point",
      rawSpindle, spindle, feedRate,
      // feed 為結果進給的舊式別名；輸入的每轉進給獨立保留於 feedPerRev。
      feed: feedRate,
      geometryModel: "nominal straight cutting face"
    };
  }

  // 切換上緣／中央／下緣僅改 D 的標示位置，保持同一組局部 R、Z 與切削帶。
  function convertContactDiameter({ diameter, width, c, from, to } = {}) {
    const current = positiveNumber(diameter);
    const chamferWidth = positiveNumber(width === undefined ? c : width);
    const previous = CONTACT_POSITIONS[from];
    const next = CONTACT_POSITIONS[to];
    if (current === null || chamferWidth === null || previous === undefined || next === undefined) return NaN;
    return current + 2 * chamferWidth * (next - previous);
  }

  return Object.freeze({ calculate, convertContactDiameter, finiteNumber, CONTACT_POSITIONS });
})();

if (typeof module !== "undefined") module.exports = NC_SPOT_CORE;
