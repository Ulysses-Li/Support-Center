/* i-Center 純選型／換算：只接原型錄 IC、d1 與已核對切削欄，不以近似直徑補缺值。
 * S 與 f 直接採使用者輸入；F=S×f，不乘兩個刃口。Z 只代表手動正深度的負號換算。
 */
const ICENTER_CORE = (() => {
  "use strict";
  const blank = value => value === null || value === undefined || (typeof value === "string" && value.trim() === "");
  const finiteNumber = value => {
    if (blank(value) || !["number", "string"].includes(typeof value)) return null;
    const result = Number(value);
    return Number.isFinite(result) ? result : null;
  };
  const positiveNumber = value => { const number = finiteNumber(value); return number !== null && number > 0 ? number : null; };
  const rows = data => data?.insert_inventory?.items || [];
  const cuttingRows = data => data?.cutting_data?.cutting_conditions || [];
  const formFamilies = Object.freeze({ A: "DIN332 Form A", AB: "DIN332 Form A+B", R: "DIN332 Form R" });
  const lookupInsert = (data, id) => rows(data).find(insert => insert.id === id || insert.parts_no === id) || null;

  function materials(data) {
    const distinct = new Map();
    for (const row of cuttingRows(data)) if (!distinct.has(row.material_id)) distinct.set(row.material_id, { id: row.material_id, label: row.material_name_en, iso: row.iso_group });
    return [...distinct.values()];
  }

  function findInserts(data, { standard, form, diameter } = {}) {
    if (!blank(standard) && !["DIN", "ANSI"].includes(standard)) return [];
    if (!blank(form) && !Object.hasOwn(formFamilies, form)) return [];
    const requestedDiameter = blank(diameter) ? null : positiveNumber(diameter);
    if (!blank(diameter) && requestedDiameter === null) return [];
    return rows(data).filter(insert => {
      // ANSI 獨立分表；明選 ANSI 時，DIN 的 form 控制不套用、不把它改稱 DIN Form A。
      if (standard === "ANSI" && insert.family !== "ANSI 60°") return false;
      if (standard === "DIN" && insert.family === "ANSI 60°") return false;
      if (standard !== "ANSI" && !blank(form) && insert.family !== formFamilies[form]) return false;
      // ANSI 也只比原表 mm 值；不重新換算英吋分數，不使用公差或最近值擴張名目配對。
      return requestedDiameter === null || insert.dimensions?.d1 === requestedDiameter;
    });
  }

  function holdersFor(data, insertId) {
    const insert = lookupInsert(data, insertId);
    if (!insert) return [];
    return (data?.holders_accessories?.holders || []).filter(holder => holder.ic === insert.ic);
  }

  function cuttingFor(data, insertId, materialId) {
    const insert = lookupInsert(data, insertId);
    const result = (reasonCode, reason, column = null, row = null) => ({ row, column, reason, reasonCode });
    if (!insert) return result("insert-not-found", "Choose a listed i-Center cutting insert.");
    if (insert.family === "ANSI 60°") return result("ansi-unconfirmed", "The cutting-table ANSI labels do not match the listed ANSI pilot diameters. No automatic cutting range is assigned; enter your established S and f manually.");
    const join = (data.cutting_column_join || []).find(item => item.insert_parts_no === insert.parts_no);
    if (!join?.column_ids?.length) return result("column-unconfirmed", `No confirmed cutting-table column is listed for IC${insert.ic}, d1 ${insert.dimensions?.d1} mm. Enter S and f manually; a neighboring diameter is not substituted.`);
    if (join.column_ids.length !== 1) return result("ambiguous-column", "More than one cutting-table column is linked to this insert. Confirm the source before applying cutting values.");
    const column = (data.cutting_data?.columns || []).find(item => item.id === join.column_ids[0]);
    if (!column) return result("column-not-found", "The linked cutting-table column is unavailable. Enter established cutting values manually.");
    if (!materials(data).some(item => item.id === materialId)) return result("material-not-found", "Choose a listed workpiece material to view its cutting-table row.", column);
    const row = cuttingRows(data).find(item => item.column_id === column.id && item.material_id === materialId);
    if (!row) return result("material-row-missing", "No cutting row is listed for this material and column. Enter established S and f manually.", column);
    return result("available", "Cutting row matched by catalog IC and pilot d1; individual insert grade and hole form applicability are not specified in this table.", column, row);
  }

  function recommendation(data, { insertId, materialId, machineMaxRpm } = {}) {
    const unavailable = reason => ({ valid: false, rpm: null, feed: null, reason });
    const cutting = cuttingFor(data, insertId, materialId);
    if (!cutting.row) return unavailable(cutting.reason);
    const speed = cutting.row.spindle_speed_rpm;
    const lower = positiveNumber(speed?.min), catalogUpper = positiveNumber(speed?.max);
    if (lower === null || catalogUpper === null || lower > catalogUpper) return unavailable("The listed spindle range is unavailable or invalid; no median recommendation can be calculated.");
    const machineMax = blank(machineMaxRpm) ? null : positiveNumber(machineMaxRpm);
    if (!blank(machineMaxRpm) && machineMax === null) return unavailable("Enter a finite machine maximum greater than zero before requesting a recommendation.");
    const upper = machineMax === null ? catalogUpper : Math.min(catalogUpper, machineMax);
    if (upper < lower) return unavailable("The machine limit does not overlap the listed spindle range; no catalog-based median recommendation is available.");

    const feedData = cutting.row.feed_mm_per_rev;
    let feed;
    if (Array.isArray(feedData?.catalog_sequence) && feedData.catalog_sequence.length) {
      // 使用表列序列的統計中位數，不把三值表的中間值冒稱為原廠 best；排序副本以保留原始順序。
      const sequence = feedData.catalog_sequence.map(positiveNumber);
      if (sequence.some(value => value === null)) return unavailable("The listed feed sequence contains an invalid value; no median recommendation is available.");
      sequence.sort((a, b) => a - b);
      const middle = Math.floor(sequence.length / 2);
      feed = sequence.length % 2 ? sequence[middle] : (sequence[middle - 1] + sequence[middle]) / 2;
    } else {
      const feedMin = positiveNumber(feedData?.min), feedMax = positiveNumber(feedData?.max);
      if (feedMin === null || feedMax === null || feedMin > feedMax) return unavailable("The listed feed range is unavailable or invalid; no median recommendation can be calculated.");
      feed = (feedMin + feedMax) / 2;
    }
    return {
      valid: true, rpm: (lower + upper) / 2, feed,
      reason: "Site median recommendation based on listed catalog values; adjustable."
    };
  }

  function calculate(data, input = {}) {
    const errors = [], warnings = [], missingFields = [], fieldErrors = {};
    const error = (field, message) => { fieldErrors[field] = message; errors.push(message); };
    const insert = lookupInsert(data, input.insertId);
    const material = materials(data).find(item => item.id === input.materialId) || null;
    const availableHolders = holdersFor(data, input.insertId);
    const requestedHolder = (data?.holders_accessories?.holders || []).find(item => item.parts_no === input.holderId || item.code === input.holderId) || null;
    const holder = requestedHolder && insert && requestedHolder.ic === insert.ic ? requestedHolder : null;
    const cutting = cuttingFor(data, input.insertId, input.materialId);
    for (const field of ["insertId", "holderId", "materialId", "rpm", "feed", "depth"]) if (blank(input[field])) missingFields.push(field);
    if (!blank(input.insertId) && !insert) error("insertId", "Select a listed cutting insert.");
    if (!blank(input.holderId) && !requestedHolder) error("holderId", "Select a listed i-Center holder.");
    else if (requestedHolder && insert && !holder) error("holderId", `The holder IC${requestedHolder.ic} does not match insert IC${insert.ic}. Select a holder with the same IC.`);
    if (!blank(input.materialId) && !material) error("materialId", "Select a material listed in the i-Center cutting table.");
    const rpmValue = positiveNumber(input.rpm), feedValue = positiveNumber(input.feed), depthValue = positiveNumber(input.depth);
    const machineMax = blank(input.machineMaxRpm) ? null : positiveNumber(input.machineMaxRpm);
    if (!blank(input.rpm) && rpmValue === null) error("rpm", "Enter a finite spindle speed greater than zero.");
    if (!blank(input.feed) && feedValue === null) error("feed", "Enter a finite feed per revolution greater than zero.");
    if (!blank(input.depth) && depthValue === null) error("depth", "Enter a finite positive manual depth below work surface Z0.");
    if (!blank(input.machineMaxRpm) && machineMax === null) error("machineMaxRpm", "Enter a finite machine maximum speed greater than zero.");
    if (rpmValue !== null && machineMax !== null && rpmValue > machineMax) error("rpm", `Spindle speed ${rpmValue} rpm exceeds the entered machine maximum ${machineMax} rpm.`);

    const row = cutting.row;
    const spindleRange = row ? [row.spindle_speed_rpm.min, row.spindle_speed_rpm.max] : null;
    const feedRange = row ? [row.feed_mm_per_rev.min, row.feed_mm_per_rev.max] : null;
    let machineCatalogRange = spindleRange ? [...spindleRange] : null;
    if (machineCatalogRange && machineMax !== null) {
      if (machineMax < machineCatalogRange[0]) {
        machineCatalogRange = null;
        warnings.push("The machine limit does not overlap the catalog spindle range. Any lower-speed setup is user-entered, not a catalog starting value.");
      } else machineCatalogRange[1] = Math.min(machineCatalogRange[1], machineMax);
    }
    const withinCatalogRpm = !spindleRange || rpmValue === null || (rpmValue >= spindleRange[0] && rpmValue <= spindleRange[1]);
    const withinCatalogFeed = !feedRange || feedValue === null || (feedValue >= feedRange[0] && feedValue <= feedRange[1]);
    if (!withinCatalogRpm) warnings.push(`Entered S is outside the listed ${spindleRange[0]}–${spindleRange[1]} rpm range; it is a custom value.`);
    if (!withinCatalogFeed) warnings.push(`Entered f is outside the listed ${feedRange[0]}–${feedRange[1]} mm/rev range; it is a custom value.`);
    if (insert && material) warnings.push(cutting.reason);
    if (insert) warnings.push("Material rows are not a per-insert grade approval matrix. Verify the selected grade for the actual workpiece.");
    if (holder) warnings.push("Same-IC holder pairing is inferred from the catalog interface. The actual holder/clamping speed limit must be confirmed; the pre-balance reference speed is not a maximum safe speed.");
    if (depthValue !== null) warnings.push("Z is the negative of your manually entered depth. It assumes the actual insert tip is touched off at work surface Z0; catalog L1/L2/L3 are not automatically programmed depths.");
    if (insert && depthValue !== null && Number.isFinite(insert.dimensions?.L3) && depthValue > insert.dimensions.L3) warnings.push(`Manual depth ${depthValue} mm exceeds the listed L3 dimension ${insert.dimensions.L3} mm. Check the insert drawing and intended hole form; the entered depth has not been clamped.`);

    const cuttingValid = Boolean(insert && holder && material && rpmValue !== null && feedValue !== null && !errors.length);
    const valid = cuttingValid && depthValue !== null && !missingFields.length;
    const rule = (data.cutting_data?.technical_rules || []).find(item => item.id === "ab-slowdown");
    let stage = null;
    if (insert?.family === "DIN332 Form A+B" && rule && Number.isFinite(insert.dimensions?.L2)) {
      const reductionFactor = 1 - rule.spindle_reduction_percent / 100;
      stage = {
        applicable: true, triggerDimension: "L2", triggerDepth: insert.dimensions.L2, reductionFactor,
        reached: depthValue === null ? null : depthValue >= insert.dimensions.L2,
        rpm: cuttingValid ? rpmValue * reductionFactor : null,
        feed: cuttingValid ? feedValue : null,
        feedRate: cuttingValid ? rpmValue * reductionFactor * feedValue : null,
        source: rule.source,
        note: "At catalog L2, reduce S by 30% and keep f unchanged. The derived Vf also becomes 70%. L2 is a stage dimension, not automatically the final programmed Z."
      };
    }
    return {
      insert, holder, material, cutting, availableHolders, errors, fieldErrors, warnings, missingFields,
      valid, canCopy: valid, cuttingValid, status: errors.length ? "invalid" : missingFields.length ? "empty" : "valid",
      rpm: cuttingValid ? rpmValue : null, feed: cuttingValid ? feedValue : null, feedRate: cuttingValid ? rpmValue * feedValue : null,
      depth: valid ? depthValue : null, z: valid ? -depthValue : null,
      spindleRange, feedRange, machineCatalogRange,
      valueBasis: row && withinCatalogRpm && withinCatalogFeed ? "catalog-range" : "manual", stage,
      depthBasis: "User-entered positive depth from work surface Z0, assuming the actual insert tip tool-length reference. Z = −depth; no automatic hole-form depth is derived."
    };
  }
  return Object.freeze({ finiteNumber, materials, findInserts, holdersFor, cuttingFor, recommendation, calculate });
})();
if (typeof module !== "undefined") module.exports = ICENTER_CORE;
