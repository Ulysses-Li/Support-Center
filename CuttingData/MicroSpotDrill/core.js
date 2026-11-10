/* Micro Spot Drill 純計算核心：逐刀片、牌號及材料表交集選型。
 * 直接使用型錄 S（rpm）與 f（mm/rev），Vf = S × f，不把可轉位刃數乘進去。
 * Wmin/Wmax 是名義選型界線；Z 使用短平底直面模型或同組裝實測基準，不冒稱原廠對刀公式。
 */
const MICRO_SPOT_CORE = (() => {
  "use strict";
  const blank = value => value === undefined || value === null || (typeof value === "string" && value.trim() === "");
  const unrestricted = value => blank(value) || value === "all";
  const finiteNumber = value => {
    if (blank(value) || !["number", "string"].includes(typeof value)) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const positiveNumber = value => {
    const parsed = finiteNumber(value);
    return parsed !== null && parsed > 0 ? parsed : null;
  };
  const steelIds = new Set(["carbonSteel", "alloySteel", "stainless", "hardenedSteel"]);
  const rangeValid = range => Array.isArray(range) && range.length === 2
    && range.every(value => positiveNumber(value) !== null) && range[0] <= range[1];

  function hardnessLimit(data, material, variant) {
    if (!steelIds.has(material.id)) return null;
    const grade = (data.grades || []).find(item => item.id === variant.gradeId);
    const limits = [grade?.steelHardnessMaxExclusive, grade?.steelHardnessAutoRecommendationMaxExclusive, material.hardnessHrc?.maxExclusive]
      .filter(Number.isFinite);
    return limits.length ? Math.min(...limits) : null;
  }

  function findCandidates(data, criteria = {}) {
    const { material, angle, diameter, hardness } = criteria;
    const angleNumber = unrestricted(angle) ? null : positiveNumber(angle);
    const diameterNumber = unrestricted(diameter) ? null : positiveNumber(diameter);
    const hardnessNumber = blank(hardness) ? null : finiteNumber(hardness);
    if ((!unrestricted(angle) && angleNumber === null) || (!unrestricted(diameter) && diameterNumber === null)
      || (!blank(hardness) && (hardnessNumber === null || hardnessNumber < 0))) return [];
    const candidates = [];
    for (const materialData of data.materials || []) {
      if (!unrestricted(material) && materialData.id !== material) continue;
      for (const insert of data.inserts || []) {
        if (angleNumber !== null && insert.includedAngleDeg !== angleNumber) continue;
        if (diameterNumber !== null && (diameterNumber < insert.WminMm || diameterNumber > insert.WmaxMm)) continue;
        const feedRange = materialData.feedsByInsert?.[insert.id]?.rangeMmPerRev;
        if (!rangeValid(feedRange)) continue;
        for (const variant of insert.variants || []) {
          // 有供貨牌號不等於該材料有推薦；必須與材料切削列推薦牌號交集。
          if (!materialData.recommendedGrades?.includes(variant.gradeId)) continue;
          const hardnessMax = hardnessLimit(data, materialData, variant);
          if (hardnessMax !== null && hardnessNumber !== null && hardnessNumber >= hardnessMax) continue;
          const conditions = [];
          // 介面可明確暫停硬度確認；保留來源 HRC 資料及已知數值驗證，不憑空擴張牌號適用範圍。
          if (hardnessMax !== null && hardnessNumber === null && criteria.requireHardnessConfirmation !== false) conditions.push(`Confirm workpiece hardness below HRC ${hardnessMax} for ${variant.gradeId}.`);
          if (diameterNumber !== null && diameterNumber === insert.WminMm) conditions.push("D equals catalog Wmin. This is a nominal selection boundary; a positive cutting depth has not been verified.");
          candidates.push({
            id: variant.orderCode, insert, variant, material: materialData,
            feedRange: [...feedRange], spindleRange: [materialData.spindleRpm.min, materialData.spindleRpm.max],
            hardnessMax, conditions
          });
        }
      }
    }
    return candidates;
  }

  function holderOptions(data, criteria = {}) {
    return (data.holders || []).map(holder => {
      // XL 限制是鋁／鋁合金；不能用「N 非鐵」泛類放行銅、黃銅、塑膠等材料。
      const available = !holder.workpieceRestriction
        || (criteria.material === "nonFerrous" && holder.workpieceRestriction.includes(criteria.nonFerrousType));
      return { ...holder, available, reason: available ? "" : "XL is listed only for aluminum or aluminum alloy. Confirm that material subtype to use this holder." };
    });
  }

  function calculateGeometry(data, input = {}) {
    const requestedMode = blank(input.geometryMode) ? (blank(input.datum) ? "nominal" : input.datum) : input.geometryMode;
    const mode = requestedMode;
    const errors = [], conditions = [], notes = [], missingFields = [];
    let insert = null;
    if (!blank(input.variant)) insert = (data.inserts || []).find(item => item.variants?.some(variant => variant.orderCode === input.variant)) || null;
    else if (!blank(input.insert)) insert = (data.inserts || []).find(item => item.id === input.insert) || null;
    const diameter = positiveNumber(input.diameter);
    const referenceDiameter = finiteNumber(input.referenceDiameter);
    const referenceDepth = finiteNumber(input.referenceDepth);
    const result = {
      valid: false, mode, status: "empty", insert, diameter,
      angle: insert?.includedAngleDeg ?? null, maxDepth: insert?.TmaxMm ?? null,
      depth: null, z: null, nominalDepth: null, computedDepth: null, computedZ: null,
      referenceDiameter, referenceDepth, tipOffset: null, withinDepthLimit: null,
      roundingMismatch: false, conditions, errors, notes, missingFields,
      label: mode === "measured" ? "Z from measured reference" : "Nominal short-flat tip Z",
      geometryBasis: mode === "measured"
        ? "Same-assembly measured diameter/depth reference with nominal straight-face slope; Re is not modeled. Z0 is the work surface."
        : "Nominal straight-face model referenced to the short-flat insert tip; Re is not modeled. This is not a manufacturer-verified Z formula. Z0 is the work surface."
    };
    if (!["nominal", "measured"].includes(mode)) errors.push("Select nominal geometry or a measured diameter/depth reference.");
    if (!insert) {
      if (blank(input.variant) && blank(input.insert)) missingFields.push("variant");
      else errors.push("Select a catalog-listed insert before calculating its geometry.");
    }
    if (blank(input.diameter)) missingFields.push("diameter");
    else if (diameter === null) errors.push("Enter a finite spot diameter greater than zero for the geometry.");
    if (insert && !blank(input.insert) && input.insert !== insert.id) errors.push("The selected insert model does not match the SKU used for this geometry.");
    if (errors.length || missingFields.length) {
      result.status = errors.length ? "invalid" : "empty"; return result;
    }
    if (diameter < insert.WminMm || diameter > insert.WmaxMm) {
      errors.push(`Spot diameter must stay within the selected insert's nominal ${insert.WminMm}–${insert.WmaxMm} mm range.`);
      result.status = "invalid"; return result;
    }
    const halfAngle = insert.includedAngleDeg * Math.PI / 360;
    const depthPerDiameter = 1 / (2 * Math.tan(halfAngle));
    const nominalDepth = (diameter - insert.WminMm) * depthPerDiameter;
    Object.assign(result, { depthPerDiameter, nominalDepth });
    notes.push("The face is idealized as straight; the actual Re transition and tool profile are not modeled.");
    let computedDepth = nominalDepth;
    if (mode === "measured") {
      if (blank(input.referenceDiameter)) missingFields.push("referenceDiameter");
      else if (referenceDiameter === null || referenceDiameter < insert.WminMm || referenceDiameter > insert.WmaxMm) errors.push(`Measured Dref must be within ${insert.WminMm}–${insert.WmaxMm} mm for this insert.`);
      if (blank(input.referenceDepth)) missingFields.push("referenceDepth");
      else if (referenceDepth === null || referenceDepth <= 0 || referenceDepth > insert.TmaxMm + 1e-10) errors.push(`Measured tref must be greater than zero and no greater than catalog Tmax ${insert.TmaxMm} mm.`);
      if (errors.length || missingFields.length) {
        result.status = errors.length ? "invalid" : "empty"; return result;
      }
      // 單點實測只平移同一組裝的軸向基準；不把此偏移量當作 ACE 的 ℓ 或原廠刀尖尺寸。
      computedDepth = referenceDepth + (diameter - referenceDiameter) * depthPerDiameter;
    }
    const withinDepthLimit = computedDepth <= insert.TmaxMm + 1e-10;
    Object.assign(result, {
      computedDepth, computedZ: computedDepth === 0 ? 0 : -computedDepth,
      tipOffset: nominalDepth - computedDepth, withinDepthLimit
    });
    if (diameter === insert.WminMm) conditions.push("D equals catalog Wmin. This is a nominal selection boundary; a positive cutting depth has not been verified.");
    if (computedDepth <= 0) {
      if (mode === "measured" || diameter !== insert.WminMm) errors.push("The calculated depth is not positive. Check the diameter and measured reference.");
      result.status = errors.length ? "invalid" : "conditional"; return result;
    }
    if (!withinDepthLimit) {
      if (mode === "nominal") {
        // 型錄 Wmax 與直面模型的 Tmax 可有取位／輪廓差；保留原始估算，不能夾成 Tmax 後宣稱有效 Z。
        result.roundingMismatch = true;
        conditions.push(`The straight-face estimate ${Number(computedDepth.toFixed(8))} mm exceeds catalog Tmax ${insert.TmaxMm} mm. The nominal catalog range and this model do not coincide; rounding or the unmodeled profile may contribute. Add a measured reference before using a Z target.`);
        result.status = "nominal-only";
      } else {
        errors.push(`Depth from the measured reference exceeds catalog Tmax ${insert.TmaxMm} mm. Reduce D or check the reference.`);
        result.status = "invalid";
      }
      return result;
    }
    if (conditions.length) { result.status = "conditional"; return result; }
    Object.assign(result, { valid: true, status: "valid", depth: computedDepth, z: -computedDepth });
    return result;
  }

  function calculate(data, input = {}) {
    const fieldErrors = {}, missingFields = [], conditions = [], warnings = [];
    const addError = (field, message) => { fieldErrors[field] = message; };
    const requireField = (field, label) => { if (unrestricted(input[field])) missingFields.push(field); return label; };
    requireField("material"); requireField("angle"); requireField("diameter");
    const material = (data.materials || []).find(item => item.id === input.material) || null;
    const angle = positiveNumber(input.angle), diameter = positiveNumber(input.diameter);
    const hardness = blank(input.hardness) ? null : finiteNumber(input.hardness);
    const rpmValue = positiveNumber(input.rpm), feedValue = positiveNumber(input.feedPerRev);
    const machineMax = blank(input.machineMaxRpm) ? null : positiveNumber(input.machineMaxRpm);
    if (!unrestricted(input.material) && !material) addError("material", "Select a catalog-listed workpiece material.");
    if (!unrestricted(input.angle) && !(data.inserts || []).some(item => item.includedAngleDeg === angle)) addError("angle", "Select a catalog-listed point angle: 90°, 120° or 142°.");
    if (!unrestricted(input.diameter) && diameter === null) addError("diameter", "Enter a finite spot diameter greater than zero.");
    if (!blank(input.hardness) && (hardness === null || hardness < 0)) addError("hardness", "Enter a finite hardness value of zero or more HRC.");
    if (!blank(input.machineMaxRpm) && machineMax === null) addError("machineMaxRpm", "Enter a finite machine maximum speed greater than zero.");
    if (!blank(input.rpm) && rpmValue === null) addError("rpm", "Enter a finite spindle speed greater than zero.");
    if (!blank(input.feedPerRev) && feedValue === null) addError("feedPerRev", "Enter a finite feed per revolution greater than zero.");
    if (blank(input.rpm)) missingFields.push("rpm");
    if (blank(input.feedPerRev)) missingFields.push("feedPerRev");

    const requireHardnessConfirmation = input.requireHardnessConfirmation !== false;
    const hardnessApplies = requireHardnessConfirmation || !blank(input.hardness);
    const criteria = { material: input.material, angle: input.angle, diameter: input.diameter, hardness: input.hardness, nonFerrousType: input.nonFerrousType, requireHardnessConfirmation };
    const candidates = findCandidates(data, criteria);
    const options = holderOptions(data, criteria);
    const availableHolders = options.filter(holder => holder.available);
    const hasVariant = !blank(input.variant);
    const hasPair = !blank(input.insert) && !blank(input.grade);
    const selected = candidates.find(candidate => hasVariant ? candidate.variant.orderCode === input.variant
      : hasPair && candidate.insert.id === input.insert && candidate.variant.gradeId === input.grade) || null;
    const sourceVariants = (data.inserts || []).flatMap(insert => (insert.variants || []).map(variant => ({ insert, variant })));
    const requestedExists = hasVariant ? sourceVariants.some(row => row.variant.orderCode === input.variant)
      : hasPair ? sourceVariants.some(row => row.insert.id === input.insert && row.variant.gradeId === input.grade) : false;
    if (!hasVariant && !hasPair) missingFields.push("variant");
    else if (!requestedExists) addError("variant", "Select a catalog-listed insert and grade.");
    else if (!selected) addError("variant", `The selected insert and grade do not match the material, angle or diameter${hardnessApplies ? ", or the specified hardness" : ""}. Choose a matching option.`);

    const holderOption = options.find(holder => holder.partNumber === input.holder || holder.orderCode === input.holder) || null;
    let holder = null;
    if (blank(input.holder)) missingFields.push("holder");
    else if (!holderOption) addError("holder", "Select a catalog-listed compatible holder.");
    else if (!holderOption.available) addError("holder", holderOption.reason);
    else holder = (data.holders || []).find(item => item.partNumber === holderOption.partNumber);
    if (selected && holder && holder.compatibleInsertSeries !== selected.insert.series) {
      addError("holder", "This holder is not listed for the selected insert series."); holder = null;
    }

    let spindleRange = material ? [material.spindleRpm.min, material.spindleRpm.max] : null;
    if (spindleRange && machineMax !== null) {
      if (machineMax < spindleRange[0]) {
        addError("machineMaxRpm", `Machine maximum ${machineMax} rpm is below the catalog minimum ${spindleRange[0]} rpm. There is no supported speed range.`);
        spindleRange = null;
      } else spindleRange[1] = Math.min(spindleRange[1], machineMax);
    }
    const feedRange = selected ? [...selected.feedRange] : null;
    if (selected) conditions.push(...selected.conditions);
    if (rpmValue !== null && spindleRange && (rpmValue < spindleRange[0] || rpmValue > spindleRange[1])) addError("rpm", `Spindle speed must stay within ${spindleRange[0]}–${spindleRange[1]} rpm for the catalog and machine limits.`);
    if (feedValue !== null && feedRange && (feedValue < feedRange[0] || feedValue > feedRange[1])) addError("feedPerRev", `Feed per revolution must stay within ${feedRange[0]}–${feedRange[1]} mm/rev for this material and insert.`);
    const geometry = calculateGeometry(data, { ...input, ...(selected ? { variant: selected.variant.orderCode } : {}) });
    // 實測點僅適用同一刀片／刀柄組裝；刀柄尚未識別時可保留算式估值，不能顯示為有效實測 Z。
    if (geometry.mode === "measured" && !holder) {
      geometry.valid = false;
      geometry.depth = null;
      geometry.z = null;
      geometry.status = blank(input.holder) ? "empty" : "invalid";
      geometry.conditions.push("Select a valid compatible holder before applying this same-assembly measured reference.");
      if (blank(input.holder) && !geometry.missingFields.includes("holder")) geometry.missingFields.push("holder");
    }
    if (selected) {
      conditions.push(...geometry.conditions);
      warnings.push(geometry.geometryBasis);
      for (const field of geometry.missingFields) if (!missingFields.includes(field)) missingFields.push(field);
    }

    const completeGeometry = material && angle !== null && diameter !== null && !fieldErrors.material && !fieldErrors.angle && !fieldErrors.diameter && !fieldErrors.hardness;
    const noMatch = Boolean(completeGeometry && !candidates.length);
    const errors = Object.values(fieldErrors);
    if (noMatch) {
      const withoutDiameter = findCandidates(data, { material: input.material, angle: input.angle, hardness: input.hardness, requireHardnessConfirmation });
      if (!withoutDiameter.length) errors.unshift(`No catalog-listed insert and grade match this material and point angle${hardnessApplies ? " with the specified hardness" : ""}.`);
      else {
        const min = Math.min(...withoutDiameter.map(candidate => candidate.insert.WminMm));
        const max = Math.max(...withoutDiameter.map(candidate => candidate.insert.WmaxMm));
        errors.unshift(diameter > max ? `Spot diameter ${diameter} mm is too large. The maximum for this material and angle is ${max} mm.`
          : diameter < min ? `Spot diameter ${diameter} mm is too small. The minimum for this material and angle is ${min} mm.`
            : "No catalog-listed insert covers this spot diameter for the selected conditions.");
      }
    }
    // 缺資料、越界或選型失效都不保留上一筆有效轉速／進給；條件式候選可顯示數值但不能複製為確認設定。
    const cuttingMissingFields = missingFields.filter(field => !["referenceDiameter", "referenceDepth"].includes(field));
    const cuttingValid = Boolean(!errors.length && !cuttingMissingFields.length && selected && holder && rpmValue !== null && feedValue !== null && spindleRange && feedRange);
    // 切削數字與幾何有效性獨立；即使 Z 需實測，仍可檢視有效 S／f／Vf，但不能複製成有效整組設定。
    const cuttingErrors = [...errors];
    if (selected) errors.push(...geometry.errors);
    const allConditions = [...new Set(conditions)];
    const valid = cuttingValid && !allConditions.length && geometry.valid;
    const status = noMatch ? "no-match" : errors.length ? "invalid" : missingFields.length ? "empty" : (allConditions.length || !geometry.valid) ? "conditional" : "valid";
    return {
      status, valid, canCopy: valid, cuttingValid, candidates, selected, holder, holderOptions: options, availableHolders,
      material, angle, diameter, hardness, fieldErrors, missingFields: [...new Set(missingFields)], errors, cuttingErrors, warnings, conditions: allConditions,
      geometry, geometryBasis: geometry.geometryBasis,
      feedRange, spindleRange, rpm: cuttingValid ? rpmValue : null,
      feedPerRev: cuttingValid ? feedValue : null, feedRate: cuttingValid ? rpmValue * feedValue : null,
      // 僅供展開檢視的換算值，不作型錄推薦 Vc，也不回饋到 S 或 f。
      derivedVc: cuttingValid ? Math.PI * diameter * rpmValue / 1000 : null
    };
  }
  return Object.freeze({ finiteNumber, findCandidates, holderOptions, calculateGeometry, calculate });
})();
if (typeof module !== "undefined") module.exports = MICRO_SPOT_CORE;
