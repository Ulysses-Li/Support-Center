/* Spotting 選刀篩選核心：直接讀取產品原資料，不另外手抄總角度或總孔徑。
 * 一筆候選代表同一產品、組裝／尺寸、角度及材料；三項條件必須命中同一筆。
 */
const SPOTTING_SELECTOR = (() => {
  "use strict";
  const EPSILON = 1e-9;
  const unrestricted = value => value === undefined || value === null
    || (typeof value === "string" && ["", "all"].includes(value.trim()));
  const positiveNumber = value => {
    if (!["number", "string"].includes(typeof value) || (typeof value === "string" && !value.trim())) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  };
  const validRange = range => Array.isArray(range) && range.length === 2
    && range.every(value => positiveNumber(value) !== null) && Number(range[0]) <= Number(range[1]);

  function buildCandidates({ aceData, aceGeometry, ncData } = {}) {
    const records = [];
    const aceOperation = aceData?.cuttingData?.operations?.find(item => item.id === "spotting");
    if (aceOperation && typeof aceGeometry?.getChamferGeometry === "function"
      && typeof aceGeometry?.calculateSpotting === "function") {
      for (const size of aceOperation.insertGroups || []) {
        for (const [angleKey, angleData] of Object.entries(size.angles || {})) {
          const angle = positiveNumber(angleKey);
          const geometry = aceGeometry.getChamferGeometry(size.id, angle);
          if (!geometry || !Number.isFinite(geometry.minDiameter) || !Number.isFinite(geometry.maxContactDiameter)) continue;
          for (const [materialId, material] of Object.entries(aceOperation.materials || {})) {
            const feedRange = angleData.f?.[materialId];
            // 只有產品資料明列該尺寸、角度與材料的組合才建立候選。
            if (!feedRange) continue;
            const diameterValidator = diameter => aceGeometry.calculateSpotting({ size: size.id, angle, diameter }).valid === true;
            records.push({
              id: `ace:${size.id}:${angle}:${materialId}`,
              productId: "ace", productName: aceData.productName || "ACE Spot Drill",
              label: size.label || size.id, angle, materialId,
              minDiameter: geometry.minDiameter, maxDiameter: geometry.maxContactDiameter,
              minDiameterInclusive: diameterValidator(geometry.minDiameter),
              selection: { size: size.id, angle: String(angle), material: materialId },
              geometryNote: geometry.minDiameterSource === "catalog"
                ? "Catalog diameter / tip-correction model; Dmax and Tmax are checked together."
                : "Geometric lower limit; catalog Dmin is unconfirmed for this angle.",
              cuttingAvailable: validRange(material.vc) && validRange(feedRange),
              // ACE 資料給推薦牌號但沒有 Best/Suitable/Possible 矩陣，不能虛構評級。
              rank: 0, diameterValidator
            });
          }
        }
      }
    }

    for (const series of ncData?.series || []) {
      if (!series.operations?.includes("spotting")) continue;
      for (const insert of series.inserts || []) {
        const minDiameter = insert.minDiameter ?? series.minDiameter;
        const maxDiameter = insert.maxDiameter ?? series.maxDiameter;
        if (!Number.isFinite(minDiameter) || positiveNumber(maxDiameter) === null || minDiameter > maxDiameter) continue;
        for (const materialId of insert.materialIds || []) {
          const material = ncData.materials?.find(item => item.id === materialId);
          if (!material) continue;
          const reference = series.cuttingReference;
          const referenceAvailable = !reference || (reference.grade === insert.grade && reference.materialIds?.includes(materialId) === true);
          const feedRange = ncData.feedTables?.[series.feedTable]?.[materialId]?.spotting;
          records.push({
            id: `nc:${series.id}:${insert.id}:${series.angle}:${materialId}`,
            productId: "nc", productName: ncData.productName || "NC Spot Drill",
            label: insert.part || insert.label || insert.id, angle: series.angle, materialId,
            minDiameter, maxDiameter, minDiameterInclusive: true,
            selection: { series: series.id, insert: insert.id, angle: String(series.angle), material: materialId },
            // NC 未知實際刀尖補正，選型只比型錄孔徑，不能拿理論尖點深度淘汰實體 Tmax。
            geometryNote: "Catalog diameter range; assembled-tool depth / Z requires a measured reference.",
            cuttingAvailable: series.cuttingPresetAvailable !== false && series.manualInput !== true && referenceAvailable
              && validRange(material.vc) && validRange(feedRange),
            rank: insert.materialRatings?.[materialId] || 0
          });
        }
      }
    }
    return records;
  }

  function buildMicroCandidates(contract = {}) {
    const records = [];
    // 僅對接材料名稱，不把 ACE 的硬度、速度或進給套用到 Micro。
    const aliases = {
      carbonLow: "carbonSteel", carbonHigh: "carbonSteel",
      lowAlloy: "alloySteel", highAlloy: "alloySteel",
      stainless: "stainless", castIron: "castIron", nonFerrous: "nonFerrous", hardened: "hardenedSteel"
    };
    for (const rule of contract.materialInsertRules || []) {
      const angle = positiveNumber(rule.angle);
      const minDiameter = positiveNumber(rule.diameterMm?.min);
      const maxDiameter = positiveNumber(rule.diameterMm?.max);
      if (angle === null || minDiameter === null || maxDiameter === null || minDiameter > maxDiameter) continue;
      // 用逐刀片規則的牌號交集，不能從產品摘要把 90° 專用牌號擴到 120°／142°。
      for (const [materialId, sourceMaterialId] of Object.entries(aliases)) {
        if (rule.material !== sourceMaterialId) continue;
        for (const grade of rule.grades || []) {
          if (typeof grade !== "string" || !grade.trim()) continue;
          const hardness = rule.hardnessByGrade?.[grade] || null;
          records.push({
            id: `micro:${rule.insert}:${grade}:${materialId}`,
            productId: "micro", productName: "Micro Spot Drill",
            label: `${rule.insert} · ${grade}`, angle, materialId, sourceMaterialId,
            minDiameter, maxDiameter, minDiameterInclusive: rule.diameterMm.inclusive !== false,
            selection: { insert: rule.insert, grade, angle: String(angle), material: materialId },
            geometryNote: `Catalog nominal Wmin–Wmax selection; confirm the actual cut depth${hardness?.maxExclusive ? ` and hardness < HRC ${hardness.maxExclusive}` : " and grade application"}.`,
            // 目前目的地是研究規劃頁；有型錄匹配不代表正式切削計算器已完成。
            cuttingAvailable: false, rank: 0, hardness
          });
        }
      }
    }
    return records;
  }

  function filterCandidates(records, { material, angle, diameter } = {}) {
    const materialFilter = unrestricted(material) ? null : String(material).trim();
    const angleFilter = unrestricted(angle) ? null : positiveNumber(angle);
    const diameterFilter = unrestricted(diameter) ? null : positiveNumber(diameter);
    // 非法輸入不等同「全部」；保持零結果，讓 UI 顯示輸入提示。
    if ((!unrestricted(angle) && angleFilter === null) || (!unrestricted(diameter) && diameterFilter === null)) return [];
    return (records || []).filter(record => {
      if (materialFilter !== null && record.materialId !== materialFilter) return false;
      if (angleFilter !== null && Number(record.angle) !== angleFilter) return false;
      if (diameterFilter === null) return true;
      if (!Number.isFinite(record.minDiameter) || !Number.isFinite(record.maxDiameter)
        || diameterFilter < record.minDiameter - EPSILON || diameterFilter > record.maxDiameter + EPSILON) return false;
      if (record.minDiameterInclusive === false && diameterFilter <= record.minDiameter) return false;
      if (record.maxDiameterInclusive === false && diameterFilter >= record.maxDiameter) return false;
      return typeof record.diameterValidator !== "function" || record.diameterValidator(diameterFilter) === true;
    });
  }

  // 合併真正重疊或銜接且包含接點的區間；保留開區間，避免把中間缺口冒稱可加工孔徑。
  function mergedRanges(records) {
    const intervals = records.filter(record => Number.isFinite(record.minDiameter)
      && Number.isFinite(record.maxDiameter) && record.minDiameter <= record.maxDiameter)
      .map(record => ({
        minDiameter: record.minDiameter, maxDiameter: record.maxDiameter,
        minDiameterInclusive: record.minDiameterInclusive !== false,
        maxDiameterInclusive: record.maxDiameterInclusive !== false
      }))
      .sort((a, b) => a.minDiameter - b.minDiameter || Number(b.minDiameterInclusive) - Number(a.minDiameterInclusive));
    const ranges = [];
    for (const interval of intervals) {
      const previous = ranges[ranges.length - 1];
      const touchesIncludedPoint = previous && interval.minDiameter === previous.maxDiameter
        && (previous.maxDiameterInclusive || interval.minDiameterInclusive);
      if (!previous || (interval.minDiameter >= previous.maxDiameter && !touchesIncludedPoint)) {
        ranges.push({ ...interval });
        continue;
      }
      if (interval.minDiameter === previous.minDiameter) previous.minDiameterInclusive ||= interval.minDiameterInclusive;
      if (interval.maxDiameter > previous.maxDiameter) {
        previous.maxDiameter = interval.maxDiameter;
        previous.maxDiameterInclusive = interval.maxDiameterInclusive;
      } else if (interval.maxDiameter === previous.maxDiameter) previous.maxDiameterInclusive ||= interval.maxDiameterInclusive;
    }
    return ranges;
  }

  function explainNoMatch(records, { material, angle, diameter } = {}) {
    if (!unrestricted(material) && typeof material !== "string") return { reason: "invalid-input", field: "material" };
    if (!unrestricted(angle) && positiveNumber(angle) === null) return { reason: "invalid-input", field: "angle" };
    if (!unrestricted(diameter) && positiveNumber(diameter) === null) return { reason: "invalid-input", field: "diameter" };
    const source = records || [];
    const filters = { material, angle, diameter };
    if (filterCandidates(source, filters).length) return null;
    const materialRows = filterCandidates(source, { material });
    const angleRows = filterCandidates(source, { angle });
    const availableAngles = [...new Set(materialRows.map(record => Number(record.angle)).filter(Number.isFinite))].sort((a, b) => a - b);
    if (!unrestricted(material) && !materialRows.length) return { reason: "material-unavailable", availableAngles };
    if (!unrestricted(angle) && !angleRows.length) return { reason: "angle-unavailable", availableAngles };
    const eligibleRows = filterCandidates(source, { material, angle });
    if (!eligibleRows.length) return { reason: "material-angle-unavailable", availableAngles };

    // 孔徑上下限僅來自目前材料＋角度交集；不能借用其他角度／材質的較大產品。
    const ranges = mergedRanges(eligibleRows);
    const value = positiveNumber(diameter);
    const details = { diameter: value, ranges };
    if (!ranges.length) return { reason: "boundary-invalid", ...details };
    const minDiameter = ranges[0].minDiameter;
    const maxDiameter = ranges[ranges.length - 1].maxDiameter;
    Object.assign(details, { minDiameter, maxDiameter });
    if (value < minDiameter) return { reason: "diameter-too-small", ...details };
    if (value > maxDiameter) return { reason: "diameter-too-large", ...details };
    const withinClosedInterval = ranges.some(range => value >= range.minDiameter && value <= range.maxDiameter);
    return { reason: withinClosedInterval ? "boundary-invalid" : "diameter-gap", ...details };
  }
  return Object.freeze({ buildCandidates, buildMicroCandidates, filterCandidates, explainNoMatch });
})();

if (typeof module !== "undefined") module.exports = SPOTTING_SELECTOR;
