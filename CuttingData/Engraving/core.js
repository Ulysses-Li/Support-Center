/* 雕刻切削核心：只以實體料號、型錄材料列和單一刀片幾何共同配對。
 * 此檔不讀取DOM、不推算未提供的槽形，也不把道次表累加為完整刀路。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EngravingCore = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const EPSILON = 1e-9;
  const FORM_LABELS = { radius_angled: "圓角 V 形／小平底", radius: "圓弧底", angled: "角形刀尖" };
  const unique = values => [...new Set(values)];
  const numberOrEmpty = value => value === null || value === undefined || (typeof value === "string" && value.trim() === "") ? null :
    (typeof value === "string" || typeof value === "number") ? Number(value) : NaN;
  const formatNumber = value => Number.isFinite(value) ? String(Number(value.toFixed(5))) : "—";
  const copyRange = value => Array.isArray(value) && value.length === 2 && value.every(Number.isFinite) ? [...value] : null;

  function normalizeCatalog(catalogJSON, cuttingJSON, commonJSON) {
    const source = catalogJSON || {};
    const cutting = cuttingJSON || {};
    const pairings = new Map((cutting.pairings || []).map(pairing => [pairing.row_id, pairing]));
    const inserts = (source.inserts || []).map(insert => ({
      ...insert,
      partBase: insert.part_base,
      angle: insert.angle_deg,
      formLabel: FORM_LABELS[insert.form] || insert.form,
      limits: { ...insert.engraving_limits_mm },
      dimensions: { ...insert.insert_dimensions_mm },
      radiusMaxDepth: insert.radius_max_depth_mm ?? null,
      sourcePage: insert.source_catalog_page
    }));
    const holders = (source.holders || []).map(holder => ({
      ...holder,
      id: holder.part_number,
      partNumber: holder.part_number,
      shankLabel: holder.shank_diameter ? `Ø${formatNumber(holder.shank_diameter.value)} ${holder.shank_diameter.unit}` : "柄徑未列",
      length: holder.length_L_mm,
      L1: holder.length_L1_mm,
      sourcePages: [...(holder.source_catalog_pages || [])]
    }));
    const rows = (cutting.rows || []).map(row => ({
      ...row,
      material: row.material_id,
      rpmRange: copyRange(row.spindle_speed_rpm),
      feedRange: copyRange(row.feed_per_revolution_mm),
      maxDepth: row.Tmax_mm,
      sourcePage: row.source_catalog_page,
      insertIds: [...(pairings.get(row.id)?.insert_ids || [])]
    }));
    const materials = (cutting.materials || []).map(material => ({ ...material, label: material.label_zh_TW, iso: material.iso_group }));
    return {
      group: source.product_group,
      title: source.title,
      families: [...(source.families || [])],
      inserts, holders, rows, materials,
      source: { ...(source.source || {}) },
      common: commonJSON || {},
      gaps: [...(cutting.gaps || [])],
      starterKits: [...(source.starter_kits || [])]
    };
  }

  function parseInput(catalog, rawState) {
    const raw = rawState || {};
    const input = {
      width: numberOrEmpty(raw.width), depth: numberOrEmpty(raw.depth),
      angle: numberOrEmpty(raw.angle), hrc: numberOrEmpty(raw.hrc ?? raw.hardness),
      material: raw.material == null ? "" : String(raw.material).trim(),
      form: raw.form == null ? "" : String(raw.form).trim(),
      materialDetail: raw.materialDetail == null ? "unknown" : String(raw.materialDetail).trim(),
      machineMax: numberOrEmpty(raw.machineMax), machineFeedMax: numberOrEmpty(raw.machineFeedMax),
      rpm: numberOrEmpty(raw.rpm), feed: numberOrEmpty(raw.feed),
      insertId: raw.insertId == null ? "" : String(raw.insertId),
      holderId: raw.holderId == null ? "" : String(raw.holderId)
    };
    if (input.form === "all") input.form = "";
    const errors = [];
    if (input.width !== null && (!Number.isFinite(input.width) || input.width <= 0)) errors.push("刻線寬度需為大於 0 的數值。");
    if (input.depth !== null && (!Number.isFinite(input.depth) || input.depth <= 0)) errors.push("雕刻深度需為大於 0 的數值。");
    if (input.angle !== null && ![30, 45, 60, 90].includes(input.angle)) errors.push("請選擇型錄提供的刻槽角度。");
    if (input.form && !Object.hasOwn(FORM_LABELS, input.form)) errors.push("請選擇清單中的刀尖底形。");
    if (input.material && !catalog.materials.some(material => material.id === input.material)) errors.push("此產品沒有該材料的直接切削資料，請選擇清單中的材料。");
    if (input.hrc !== null && (!Number.isFinite(input.hrc) || input.hrc <= 0)) errors.push("HRC 硬度需為大於 0 的數值。");
    return { input, errors, ready: input.width !== null || input.depth !== null };
  }

  function resolveInsert(catalog, insertOrId) {
    const id = typeof insertOrId === "string" ? insertOrId : insertOrId?.id;
    return catalog.inserts.find(insert => insert.id === id) || null;
  }

  function hardnessLimit(row) {
    const text = row.hardness_limit || "";
    const match = /HRC\s*(<=|<)\s*([\d.]+)/i.exec(text) || /(<=|<)\s*HRC\s*([\d.]+)/i.exec(text);
    return match ? { max: Number(match[2]), exclusive: match[1] === "<", label: text } : null;
  }

  function passesHardness(row, hrc) {
    const limit = hardnessLimit(row);
    if (!limit) return true;
    return limit.exclusive ? hrc < limit.max : hrc <= limit.max;
  }

  function rowsFor(catalog, insert, material) {
    return catalog.rows.filter(row => row.material === material && row.insertIds.includes(insert.id));
  }

  // 每一片刀片分別核對尺寸，不能將不同刀片的最大寬與最大深拼成一個可用規格。
  function evaluateInsert(catalog, insert, input) {
    const errors = [], review = [], notes = [];
    const limits = insert.limits;
    if (input.angle !== null && insert.angle !== input.angle) errors.push("刀尖角度不符合。");
    if (input.form && insert.form !== input.form) errors.push("刀尖底形不符合。");
    if (input.width !== null) {
      if (Number.isFinite(limits.Wmax) && input.width > limits.Wmax + EPSILON) errors.push("刻線寬度超過此刀片上限。");
      if (Number.isFinite(limits.Wmin) && input.width < limits.Wmin - EPSILON) errors.push("刻線寬度小於此刀片最小值。");
      if (limits.Wmin === null) review.push("此圓弧底刀片未列最小線寬，需確認實際槽形。");
    }
    if (input.depth !== null) {
      if (Number.isFinite(limits.Tmax) && input.depth > limits.Tmax + EPSILON) errors.push("雕刻深度超過此刀片尺寸上限。");
      if (Number.isFinite(limits.Tmin) && input.depth < limits.Tmin - EPSILON) errors.push("雕刻深度小於此刀片最小值。");
      if (limits.Tmin === null) notes.push("型錄未列最小雕刻深度，本次只核對最大深度。");
    }
    let cuttingRows = [];
    if (input.material) {
      cuttingRows = rowsFor(catalog, insert, input.material);
      if (!cuttingRows.length) errors.push("此實體刀片／牌號沒有該材料的直接切削配對。");
      if (input.material === "hardened_steel" && cuttingRows.length) {
        if (input.hrc === null) review.push("請填寫工件 HRC 硬度，以確認此材料切削列的適用上限。");
        else {
          cuttingRows = cuttingRows.filter(row => passesHardness(row, input.hrc));
          if (!cuttingRows.length) errors.push("工件 HRC 硬度不符合此刀片的型錄切削條件。");
        }
      }
      if (cuttingRows.length && input.depth !== null && cuttingRows.every(row => Number.isFinite(row.maxDepth) && input.depth > row.maxDepth + EPSILON)) {
        review.push("刀片尺寸表可達此深度，但材料切削表未涵蓋；需原廠補充條件。");
      }
    }
    return {
      ...insert,
      limits: { ...limits },
      status: errors.length ? "no-match" : review.length ? "review" : "match",
      notes: unique([...notes, ...review]), errors, reviewReasons: review,
      cuttingRows,
      hardnessLimits: unique(cuttingRows.map(row => row.hardness_limit).filter(Boolean))
    };
  }

  function filterInserts(catalog, state) {
    const parsed = parseInput(catalog, state);
    const warnings = [];
    const geometryCaution = parsed.input.width !== null && parsed.input.depth !== null ?
      "線寬與深度目前分別比對型錄範圍；實際槽底形狀及兩者的精確對應，需依選定刀片確認。" : "";
    if (geometryCaution) warnings.push(geometryCaution);
    const evaluated = parsed.errors.length ? [] : catalog.inserts.map(insert => evaluateInsert(catalog, insert, parsed.input));
    const matches = evaluated.filter(insert => insert.status === "match");
    const reviewMatches = evaluated.filter(insert => insert.status === "review");
    return {
      valid: parsed.errors.length === 0,
      ready: parsed.ready && parsed.errors.length === 0,
      status: parsed.errors.length ? "invalid" : parsed.ready ? "ready" : "idle",
      input: parsed.input, errors: parsed.errors, warnings,
      matches, reviewMatches, candidates: [...matches, ...reviewMatches],
      excluded: evaluated.filter(insert => insert.status === "no-match"),
      geometryCaution
    };
  }

  function holderAllowed(holder, insert, input) {
    if (!insert || holder.family !== insert.family) return false;
    const restrictedXL = Boolean(holder.material_restriction) || /XL$/.test(holder.id);
    if (restrictedXL && !(input.material === "non_ferrous" && ["aluminum", "aluminum_alloy"].includes(input.materialDetail))) return false;
    return true;
  }

  function getHolders(catalog, insertOrId, state) {
    const insert = resolveInsert(catalog, insertOrId);
    const input = parseInput(catalog, state).input;
    return catalog.holders.filter(holder => holderAllowed(holder, insert, input)).map(holder => ({ ...holder }));
  }

  function selectCutting(catalog, insertOrId, state) {
    const parsed = parseInput(catalog, state);
    const insert = resolveInsert(catalog, insertOrId);
    const errors = [...parsed.errors], warnings = [];
    const blank = { valid: false, status: "pending", insert, row: null, rpmRange: null, feedRange: null, depthPasses: null, sourcePage: null, errors, warnings };
    if (!insert) errors.push("請選擇實體刀片／牌號。");
    if (!parsed.ready) errors.push("刻線寬度或雕刻深度至少填寫一項。");
    if (!parsed.input.material) errors.push("請先選擇工件材料。");
    if (errors.length) return blank;
    const evaluated = evaluateInsert(catalog, insert, parsed.input);
    if (evaluated.status === "no-match") return { ...blank, status: "unavailable", errors: [...evaluated.errors] };
    if (evaluated.status === "review") return { ...blank, status: "review", errors: [...evaluated.reviewReasons], warnings: [...evaluated.notes] };
    const row = evaluated.cuttingRows.find(item =>
      (parsed.input.depth === null || !Number.isFinite(item.maxDepth) || parsed.input.depth <= item.maxDepth + EPSILON) &&
      (parsed.input.material !== "hardened_steel" || passesHardness(item, parsed.input.hrc))
    );
    if (!row || !row.rpmRange || !row.feedRange) return { ...blank, status: "unavailable", errors: ["此配對沒有完整的型錄轉速與每轉進給範圍。"] };
    if (parsed.input.width !== null && parsed.input.depth !== null) warnings.push("寬、深為分別通過型錄範圍，未作精確槽形換算。");
    warnings.push("型錄轉速是切削範圍，並非每一刀柄、夾具及突出量的額定最高轉速。");
    return {
      valid: true, status: "supported", insert,
      row: { ...row }, rpmRange: [...row.rpmRange], feedRange: [...row.feedRange],
      depthPasses: { ...(row.depth_of_cut_mm || {}), numbered_passes: [...(row.depth_of_cut_mm?.numbered_passes || [])] },
      sourcePage: row.sourcePage, errors: [], warnings: unique([...evaluated.notes, ...warnings])
    };
  }

  function recommendValues(cutting, rawState) {
    const state = rawState || {};
    const machineMax = numberOrEmpty(state.machineMax);
    const machineFeedMax = numberOrEmpty(state.machineFeedMax);
    const errors = [], warnings = [];
    if (!cutting?.valid || !cutting.rpmRange || !cutting.feedRange) errors.push("尚無可直接套用的刀片與材料切削配對。");
    if (machineMax !== null && (!Number.isFinite(machineMax) || machineMax <= 0)) errors.push("機台最高轉速需為大於 0 的數值。");
    if (machineFeedMax !== null && (!Number.isFinite(machineFeedMax) || machineFeedMax <= 0)) errors.push("機台進給上限需為大於 0 的數值。");
    if (errors.length) return { valid: false, rpm: null, feed: null, errors, warnings, mode: "site_midpoint" };
    const [rpmMin, rpmMax] = cutting.rpmRange;
    const [feedMin, feedMax] = cutting.feedRange;
    let rpm = (rpmMin + rpmMax) / 2;
    const feed = (feedMin + feedMax) / 2;
    if (machineMax !== null) {
      if (machineMax < rpmMin - EPSILON) errors.push("機台最高轉速低於此型錄轉速範圍，無法自動給起始參考值。");
      else if (rpm > machineMax) { rpm = machineMax; warnings.push("起始轉速已受機台最高轉速限制。"); }
    }
    if (machineFeedMax !== null && rpm * feed > machineFeedMax + EPSILON) errors.push("型錄中間值換算後超過機台進給上限，請調整轉速或每轉進給。");
    return { valid: errors.length === 0, rpm: errors.length ? null : rpm, feed: errors.length ? null : feed, errors, warnings, mode: "site_midpoint", label: "網站預設：型錄範圍中間值" };
  }

  // 進給以mm/rev給定，F=S×f；刀片可換刃角數不再乘入。
  function calculate(catalog, state) {
    const parsed = parseInput(catalog, state);
    const input = parsed.input;
    const insert = resolveInsert(catalog, input.insertId);
    const holder = catalog.holders.find(item => item.id === input.holderId) || null;
    const cutting = selectCutting(catalog, insert, state);
    const recommendation = recommendValues(cutting, state);
    const errors = [...cutting.errors];
    const warnings = [...cutting.warnings];
    if (!holder) errors.push("請選擇夾持刀柄。");
    else if (!holderAllowed(holder, insert, input)) errors.push(/XL$/.test(holder.id) ? "100 mm XL 刀柄僅供鋁／鋁合金，請確認材料細分。" : "此刀柄與刀片系列不相容。");
    if (input.machineMax !== null && (!Number.isFinite(input.machineMax) || input.machineMax <= 0)) errors.push("機台最高轉速需為大於 0 的數值。");
    if (input.machineFeedMax !== null && (!Number.isFinite(input.machineFeedMax) || input.machineFeedMax <= 0)) errors.push("機台進給上限需為大於 0 的數值。");
    const useSiteDefault = state?.valueMode === "site_midpoint";
    const manualRpm = !useSiteDefault && input.rpm !== null;
    const manualFeed = !useSiteDefault && input.feed !== null;
    const mode = manualRpm || manualFeed ? "manual" : "site_midpoint";
    const rpm = manualRpm ? input.rpm : recommendation.rpm;
    const feed = manualFeed ? input.feed : recommendation.feed;
    if (!manualRpm && recommendation.rpm === null && cutting.valid) errors.push(...recommendation.errors);
    if (!manualFeed && recommendation.feed === null && cutting.valid) errors.push(...recommendation.errors);
    if (rpm !== null && (!Number.isFinite(rpm) || rpm <= 0)) errors.push("主軸轉速需為大於 0 的數值。");
    if (feed !== null && (!Number.isFinite(feed) || feed <= 0)) errors.push("每轉進給需為大於 0 的數值。");
    if (cutting.valid && Number.isFinite(rpm) && Number.isFinite(feed)) {
      if (rpm < cutting.rpmRange[0] - EPSILON || rpm > cutting.rpmRange[1] + EPSILON) warnings.push("手動轉速超出此配對的型錄範圍，結果僅為手動數值換算。");
      if (feed < cutting.feedRange[0] - EPSILON || feed > cutting.feedRange[1] + EPSILON) warnings.push("手動每轉進給超出此配對的型錄範圍，結果僅為手動數值換算。");
      if (Number.isFinite(input.machineMax) && rpm > input.machineMax + EPSILON) errors.push("設定轉速超過機台最高轉速。");
      if (Number.isFinite(holder?.rpm_limit) && rpm > holder.rpm_limit + EPSILON) errors.push("設定轉速超過已列出的刀柄額定上限。");
      if (Number.isFinite(input.machineFeedMax) && rpm * feed > input.machineFeedMax + EPSILON) errors.push("換算進給超過機台進給上限。");
    }
    if (!manualRpm && !manualFeed) warnings.push(...recommendation.warnings);
    if (mode === "manual") warnings.push("目前使用手動輸入值；不代表型錄另外推薦此組起始值。");
    const valid = errors.length === 0 && cutting.valid && Number.isFinite(rpm) && rpm > 0 && Number.isFinite(feed) && feed > 0;
    return {
      valid, mode, input, insert, holder, cutting, recommendation,
      errors: unique(errors), warnings: unique(warnings),
      rpm: valid ? rpm : null,
      feed: valid ? feed : null,
      feedRate: valid ? rpm * feed : null,
      plungeFeed: valid ? rpm * feed * 0.5 : null,
      sourcePage: cutting.sourcePage,
      geometryCaution: input.width !== null && input.depth !== null ? "線寬與深度只作型錄範圍比對，未作精確槽形換算。" : "",
      label: mode === "manual" ? "手動數值換算" : "網站預設：型錄範圍中間值"
    };
  }

  return Object.freeze({ normalizeCatalog, filterInserts, getHolders, selectCutting, recommendValues, calculate, numberOrEmpty, formatNumber, formLabels: Object.freeze(FORM_LABELS) });
});
