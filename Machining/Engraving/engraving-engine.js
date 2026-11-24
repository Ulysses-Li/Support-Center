/* 雕刻系列初篩：只比對型錄尺寸範圍與實體刀片／材料交集。
 * 寬與深不在此互相換算；槽底幾何需在選定刀片後另行確認。 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(require("./engraving-data.js"));
  } else {
    // 正式頁從共用產品資料載入；待資料就緒才建立篩選引擎。
    root.EngravingEngineReady = Promise.resolve(root.EngravingDataReady)
      .then(data => (root.EngravingEngine = factory(data)));
  }
})(typeof window !== "undefined" ? window : globalThis, function (data) {
  "use strict";

  const EPSILON = 1e-9;
  const ANGLES = [30, 45, 60, 90];
  const FORM_LABELS = {
    radius_angled: "圓角 V 形／小平底",
    radius: "圓弧底",
    angled: "角形刀尖"
  };
  const materialById = new Map(data.materials.map(item => [item.id, item]));

  function numberOrEmpty(value) {
    if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) return null;
    if (typeof value !== "number" && typeof value !== "string") return NaN;
    return Number(value);
  }

  function formatNumber(value) {
    return String(Number(value.toFixed(4)));
  }

  function unique(items) {
    return [...new Set(items)];
  }

  function dimensionRange(inserts, minKey, maxKey) {
    const mins = inserts.map(item => item.limits[minKey]).filter(Number.isFinite);
    const maxs = inserts.map(item => item.limits[maxKey]).filter(Number.isFinite);
    return {
      min: mins.length ? Math.min(...mins) : null,
      max: maxs.length ? Math.max(...maxs) : null,
      hasUnlistedMin: inserts.some(item => !Number.isFinite(item.limits[minKey]))
    };
  }

  function summarize(inserts, familyId) {
    const holders = data.holders.filter(item => item.family === familyId);
    return {
      widthRange: dimensionRange(inserts, "Wmin", "Wmax"),
      depthRange: dimensionRange(inserts, "Tmin", "Tmax"),
      angles: unique(inserts.map(item => item.angle)).sort((a, b) => a - b),
      shankLabels: unique(holders.map(item => item.shankLabel)),
      grades: unique(inserts.map(item => item.grade)),
      sourcePages: unique(inserts.map(item => item.sourcePage)).sort((a, b) => a - b),
      forms: unique(inserts.map(item => item.form)),
      insertCount: inserts.length
    };
  }

  // V045 與 V060 的 W06 共表只能供既有實體刀片交集使用，不增造牌號。
  function cuttingRowsFor(insert, material) {
    return data.cuttingRows.filter(row => {
      const sameModel = row.model === insert.partBase ||
        (row.model === "V045/V060 T1W06" && /^(V045|V060)06T1W06$/.test(insert.partBase));
      return sameModel && row.material === material && row.grades.includes(insert.grade);
    });
  }

  function candidate(insert, input) {
    const excluded = [];
    const review = [];
    const notes = [];
    const limits = insert.limits;

    if (input.angle !== null && insert.angle !== input.angle) excluded.push("角度不符");
    if (input.width !== null) {
      if (Number.isFinite(limits.Wmax) && input.width > limits.Wmax + EPSILON) excluded.push("刻線寬度超出此刀片上限");
      if (Number.isFinite(limits.Wmin) && input.width < limits.Wmin - EPSILON) excluded.push("刻線寬度小於此刀片最小值");
      if (limits.Wmin === null) review.push("圓弧底刀片未列最小線寬，需確認實際槽形");
    }
    if (input.depth !== null) {
      if (Number.isFinite(limits.Tmax) && input.depth > limits.Tmax + EPSILON) excluded.push("雕刻深度超出此刀片上限");
      if (Number.isFinite(limits.Tmin) && input.depth < limits.Tmin - EPSILON) excluded.push("雕刻深度小於此刀片最小值");
      // 未列 Tmin 時保留 null，只判定有列出的上限，不創造 0 mm 下限。
      if (limits.Tmin === null) notes.push("型錄未列最小深度，本次僅比對深度上限");
    }

    let cuttingRows = [];
    if (input.material) {
      cuttingRows = cuttingRowsFor(insert, input.material);
      if (!cuttingRows.length) excluded.push("此刀片牌號沒有該材料的直接切削表配對");
      else if (input.depth !== null && cuttingRows.every(row => Number.isFinite(row.maxDepth) && input.depth > row.maxDepth + EPSILON)) {
        // N9MT 90°尺寸表 0.9 mm 與切削表 0.8 mm 的差異保留為待核對。
        review.push("尺寸表可達此深度，但材料切削表未涵蓋，需補充加工條件");
      }
      if (input.material === "hardened_steel") {
        unique(cuttingRows.map(row => row.hardnessLimit).filter(Boolean))
          .forEach(limit => notes.push("需確認工件硬度符合 " + limit));
      }
    }

    return {
      ...insert,
      limits: { ...limits },
      status: excluded.length ? "no-match" : review.length ? "review" : "match",
      formLabel: FORM_LABELS[insert.form] || insert.form,
      cuttingSourcePages: unique(cuttingRows.map(row => row.sourcePage)),
      hardnessLimits: unique(cuttingRows.map(row => row.hardnessLimit).filter(Boolean)),
      notes: unique(notes.concat(review)),
      reviewReasons: review,
      excludedReasons: excluded
    };
  }

  function baseFamily(family) {
    const inserts = data.inserts.filter(item => item.family === family.id);
    return {
      ...family,
      summary: summarize(inserts, family.id),
      matches: [],
      reviewMatches: [],
      matchedSummary: null,
      status: "idle",
      reasons: [],
      excludedReasons: []
    };
  }

  function familyResult(family, input) {
    const result = baseFamily(family);
    const candidates = data.inserts.filter(item => item.family === family.id).map(item => candidate(item, input));
    result.matches = candidates.filter(item => item.status === "match");
    result.reviewMatches = candidates.filter(item => item.status === "review");
    result.excludedReasons = unique(candidates.flatMap(item => item.excludedReasons));
    result.status = result.matches.length ? "match" : result.reviewMatches.length ? "review" : "no-match";
    const viable = result.matches.length ? result.matches : result.reviewMatches;
    result.matchedSummary = viable.length ? summarize(viable, family.id) : null;

    if (viable.length) {
      if (input.width !== null) result.reasons.push("刻線寬 " + formatNumber(input.width) + " mm 有候選刀片");
      if (input.depth !== null) result.reasons.push("深度 " + formatNumber(input.depth) + " mm 未超過候選刀片尺寸上限");
      if (input.angle !== null) result.reasons.push("有 " + input.angle + "° 刀片");
      if (input.material) result.reasons.push(materialById.get(input.material).label + "有實體刀片／牌號配對");
      else result.reasons.push("先依尺寸初篩，材料與牌號於選定後確認");
      if (result.status === "review") result.reasons = unique(viable.flatMap(item => item.reviewReasons));
    } else {
      // 提供可理解的排除原因，避免使用者只看到空結果。
      if (input.angle !== null && !result.summary.angles.includes(input.angle)) result.reasons.push("此系列沒有 " + input.angle + "° 刀片");
      else if (input.material && !data.inserts.filter(item => item.family === family.id).some(item => cuttingRowsFor(item, input.material).length)) {
        result.reasons.push("型錄沒有此系列與" + materialById.get(input.material).label + "的實體刀片配對");
      } else result.reasons.push("目前尺寸、角度與材料沒有同一片刀片可配對");
    }
    return result;
  }

  function match(rawInput) {
    const raw = rawInput || {};
    const input = {
      width: numberOrEmpty(raw.width),
      depth: numberOrEmpty(raw.depth),
      material: raw.material === null || raw.material === undefined ? "" : String(raw.material).trim(),
      angle: numberOrEmpty(raw.angle)
    };
    const errors = {};
    if (input.width !== null && (!Number.isFinite(input.width) || input.width <= 0)) errors.width = "請輸入大於 0 的刻線寬度";
    if (input.depth !== null && (!Number.isFinite(input.depth) || input.depth <= 0)) errors.depth = "請輸入大於 0 的雕刻深度";
    if (input.angle !== null && !ANGLES.includes(input.angle)) errors.angle = "請選擇型錄列出的角度";
    if (input.material && !materialById.has(input.material)) errors.material = "請選擇清單中的工件材料";
    const idle = input.width === null && input.depth === null;
    const invalid = Object.keys(errors).length > 0;
    const families = invalid || idle ? data.families.map(baseFamily) : data.families.map(family => familyResult(family, input));
    const matchCount = families.filter(item => item.status === "match").length;
    const reviewCount = families.filter(item => item.status === "review").length;

    return {
      state: invalid ? "invalid" : idle ? "idle" : "ready",
      input,
      errors,
      message: invalid ? Object.values(errors)[0] : idle ? "刻線寬度或雕刻深度，先填一個就能開始找。" :
        matchCount ? "有 " + matchCount + " 個系列符合初篩條件" :
        reviewCount ? "有 " + reviewCount + " 個系列需再核對槽形或切削範圍" : "目前沒有符合條件的刀片，請調整尺寸或角度。",
      geometryCaution: !invalid && input.width !== null && input.depth !== null ?
        "目前分別比對線寬與深度的型錄範圍；兩者組成的實際槽形，選定刀片後再確認。" : "",
      requiredNext: input.material === "hardened_steel" ? ["hardness"] : [],
      families,
      matchCount,
      reviewCount,
      matchingInsertCount: families.reduce((sum, item) => sum + item.matches.length, 0),
      reviewInsertCount: families.reduce((sum, item) => sum + item.reviewMatches.length, 0)
    };
  }

  return Object.freeze({ match, data, formatNumber });
});
