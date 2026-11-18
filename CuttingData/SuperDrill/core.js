/* Super Drill 純函式核心：僅接受本產品資料，不補齊型錄空白。 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SuperDrillCore = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var EPSILON = 1e-8;
  var ORDER = { ready: 0, review: 1, missing: 2, blocked: 3 };
  var APPLICATIONS = { regular_surface: '一般平面', cross_holes: '交叉孔', stack_drilling: '疊板鑽孔', round_offset: '圓件偏心鑽孔', plunge: '插銑', concave: '凹面', angled: '斜面', cone_offset: '錐件偏心鑽孔' };
  function blank(v) { return v === null || v === undefined || (typeof v === 'string' && v.trim() === ''); }
  function number(v) { if (blank(v) || (typeof v !== 'number' && typeof v !== 'string')) return null; var n = Number(v); return Number.isFinite(n) ? n : null; }
  function positive(v) { var n = number(v); return n !== null && n > 0 ? n : null; }
  function equal(a, b) { return a !== null && b !== null && Math.abs(a - b) <= EPSILON; }
  function page(s) { return s ? s.catalog_page || s.printed_page || null : null; }
  function note(r, status, text) { if (ORDER[status] > ORDER[r.status]) r.status = status; if (r.notes.indexOf(text) === -1) r.notes.push(text); }
  function range(v) { if (!v) return null; var a = positive(v.min), b = positive(v.max); return a !== null && b !== null && b >= a ? [a, b] : null; }

  function normalizeCatalog(product, cutting) {
    product = product || {}; cutting = cutting || {};
    var holders = product.product && product.product !== 'Super Drill' ? [] : product.holders || [];
    var tools = holders.filter(function (h) { return !h.family || h.family === 'sd'; }).map(function (h) {
      var positions = h.insert_positions || [];
      return { id: h.id || h.part_no, family: 'sd', ratio: h.depth_ratio === 3 || h.depth_ratio === 4 ? h.depth_ratio : null,
        D: positive(h.diameter_D_mm), T: positive(h.drilling_depth_T_mm), L: positive(h.length_L_mm), L1: positive(h.shank_length_L1_mm), shank: positive(h.shank_diameter_d_mm), d1: positive(h.collar_diameter_d1_mm),
        raw: h, sourcePage: page(h.source), insertModel: h.insert_model || null, centerModel: h.insert_model || null, peripheryModel: h.insert_model || null,
        centerQty: positions.indexOf('inner') !== -1 ? 1 : null, peripheryQty: positions.indexOf('outer') !== -1 ? 1 : null };
    });
    return { tools: tools, materials: (cutting.materials || []).map(function (m) { return Object.assign({}, m); }), raw: product, cutting: cutting };
  }

  function geometry(tool, state, result) {
    ['diameter', 'depth', 'shank'].forEach(function (key) {
      if (!blank(state[key]) && positive(state[key]) === null) note(result, 'blocked', { diameter: '孔徑', depth: '深度', shank: '柄徑' }[key] + '必須為大於零的有效數字。');
    });
    var d = positive(state.diameter), t = positive(state.depth), shank = positive(state.shank);
    if (d !== null && !equal(d, tool.D)) note(result, 'blocked', '此版只按標稱孔徑配對，不以車床 Dmax 延伸可用孔徑。');
    if (t !== null && (tool.T === null || t > tool.T + EPSILON)) note(result, 'blocked', '需求深度超過此刀體的型錄鑽孔深度 T。');
    if (shank !== null && !equal(shank, tool.shank)) note(result, 'blocked', '所選柄徑與此刀體的型錄柄徑不符。');
    if (blank(state.diameter)) note(result, 'review', '請先填寫完工孔徑。');
    if (blank(state.depth)) note(result, 'review', '請先填寫需求鑽孔深度。');
    var mode = state.machineMode || 'rotating';
    if (mode !== 'rotating' && mode !== 'lathe') note(result, 'review', '請選擇旋轉刀具或車床加工方式。');
    if (mode === 'lathe') note(result, 'review', '車床設定需另行確認徑向調整與中心偏差；此版仍按標稱孔徑選型，不套用 Dmax。');
    if (state.coolant === 'no') note(result, 'review', 'Super Drill 為內冷設計，請確認供液方式；型錄沒有最低壓力與流量數值。');
  }

  function applyApplication(catalog, state, result) {
    var id = state.application || 'regular_surface';
    var entry = (catalog.cutting.section.application_multipliers || []).find(function (x) { return x.id === id; });
    if (!entry) { result.vcRange = null; result.feedRange = null; note(result, 'review', '型錄沒有此加工方式的倍率，請確認後再套用。'); return; }
    var speeds = entry.vc_factor_raw_sequence || [], feeds = entry.f_factor_raw_sequence || [];
    if (!speeds.length || !feeds.length || speeds.concat(feeds).some(function (v) { return positive(v) === null; })) {
      result.vcRange = null; result.feedRange = null; note(result, 'missing', '此加工方式的切速或進給倍率尚未刊載。'); return;
    }
    var speedRange = [Math.min.apply(null, speeds), Math.max.apply(null, speeds)];
    var feedRange = [Math.min.apply(null, feeds), Math.max.apply(null, feeds)];
    result.applicationFactorRange = speedRange; result.feedApplicationFactorRange = feedRange; result.applicationSourcePage = page(entry.source);
    var speedFactor = speedRange[0], feedFactor = feedRange[0];
    if (speedRange[0] !== speedRange[1] || feedRange[0] !== feedRange[1]) {
      var percent = positive(state.applicationFactor), chosen = percent === null ? null : percent / 100;
      if (chosen === null || chosen < speedRange[0] - EPSILON || chosen > speedRange[1] + EPSILON || chosen < feedRange[0] - EPSILON || chosen > feedRange[1] + EPSILON) {
        result.applicationFactor = null; result.vcRange = null; result.feedRange = null;
        note(result, 'review', '「' + APPLICATIONS[id] + '」型錄倍率為 ' + Math.round(speedRange[0] * 100) + '–' + Math.round(speedRange[1] * 100) + '%，請明確選擇區間內的倍率；不自動取中間值。'); return;
      }
      speedFactor = chosen; feedFactor = chosen;
      result.notes.push('應用倍率 ' + percent + '% 由使用者選定，型錄保留為區間。');
    }
    result.applicationFactor = speedFactor; result.feedApplicationFactor = feedFactor;
    result.vcRange = result.baseVcRange ? result.baseVcRange.map(function (v) { return v * speedFactor; }) : null;
    result.feedRange = result.baseFeedRange ? result.baseFeedRange.map(function (v) { return v * feedFactor; }) : null;
  }

  function selectCutting(catalog, tool, state) {
    state = state || {};
    var r = { status: 'ready', vcRange: null, feedRange: null, baseVcRange: null, baseFeedRange: null, centerGrade: null, peripheryGrade: null, insertGrade: null,
      centerModel: tool ? tool.centerModel : null, peripheryModel: tool ? tool.peripheryModel : null, sourcePage: null, sourcePdfPage: null, notes: [],
      applicationFactorRange: [1, 1], feedApplicationFactorRange: [1, 1], applicationFactor: 1, feedApplicationFactor: 1, applicationSourcePage: null, depthClass: null, diameterBand: null, rowId: null, vcMedian: null, feedMedian: null };
    if (tool && tool.family !== 'sd') { note(r, 'blocked', '此核心只接受 Super Drill 刀體。'); return r; }
    if (!catalog || !catalog.cutting || !catalog.cutting.section || !tool) { note(r, 'missing', '請先選擇有型錄資料的 Super Drill 刀體。'); return r; }
    var section = catalog.cutting.section;
    r.sourcePage = page(section.source); r.sourcePdfPage = section.source ? section.source.pdf_page : null;
    geometry(tool, state, r);
    if (!state.material) { note(r, 'missing', '請先選擇工件材料。'); return r; }
    var band = (section.diameter_bands || []).find(function (x) { var limits = x.nominal_diameter_mm || []; return tool.D !== null && tool.D >= limits[0] - EPSILON && tool.D <= limits[1] + EPSILON; });
    if (!band) { note(r, 'missing', '此標稱孔徑未列出對應的切削資料欄。'); return r; }
    r.diameterBand = band.id;
    var rows = (section.cutting_rows || []).filter(function (row) { return row.material_id === state.material; });
    if (!rows.length) { note(r, 'missing', '型錄未刊載所選材料的切速與進給，不借用其他材料數據。'); return r; }
    if (tool.ratio !== 3 && tool.ratio !== 4) { note(r, 'missing', '此刀體缺少 3D／4D 型錄分區。'); return r; }
    r.depthClass = 'T=' + tool.ratio + 'D';
    var row = rows.find(function (x) { return x.tool_depth_class_raw === r.depthClass; });
    if (!row) { note(r, 'missing', '沒有對應材料與刀體分區的切削資料列。'); return r; }
    r.rowId = row.id || null; r.sourcePage = page(row.source) || r.sourcePage; r.sourcePdfPage = row.source ? row.source.pdf_page : r.sourcePdfPage; r.insertGrade = row.insert_grade || null;
    r.baseVcRange = range(row.vc); r.baseFeedRange = range((row.feed_per_revolution || {})[band.id]);
    r.vcRange = r.baseVcRange ? r.baseVcRange.slice() : null; r.feedRange = r.baseFeedRange ? r.baseFeedRange.slice() : null;
    if (!r.baseVcRange) note(r, 'missing', '此資料列未刊載切削速度 Vc。');
    if (!r.baseFeedRange) note(r, 'missing', '此直徑與分區的每轉進給 f 在型錄為空白，不以零值或其他欄位代替。');
    applyApplication(catalog, state, r);
    if (r.status === 'blocked' || r.status === 'missing') { r.vcRange = null; r.feedRange = null; }
    if (r.vcRange) r.vcMedian = (r.vcRange[0] + r.vcRange[1]) / 2;
    if (r.feedRange) r.feedMedian = (r.feedRange[0] + r.feedRange[1]) / 2;
    return r;
  }

  function filterTools(catalog, state) {
    state = state || {};
    if (!catalog || !Array.isArray(catalog.tools) || ['diameter', 'depth', 'shank'].some(function (key) { return !blank(state[key]) && positive(state[key]) === null; })) return [];
    var d = positive(state.diameter), t = positive(state.depth), shank = positive(state.shank);
    return catalog.tools.filter(function (tool) { return tool.family === 'sd' && (d === null || equal(d, tool.D)) && (t === null || (tool.T !== null && t <= tool.T + EPSILON)) && (shank === null || equal(shank, tool.shank)); }).map(function (tool) {
      var cutting = selectCutting(catalog, tool, state);
      return { tool: tool, eligibility: cutting.status === 'missing' ? 'review' : cutting.status, notes: cutting.notes.slice(), diameterFits: d === null ? null : true, depthFits: t === null ? null : true, shankFits: shank === null ? null : true, cuttingStatus: cutting.status };
    });
  }

  function calculate(input) {
    input = input || {};
    var D = positive(input.D), vc = positive(input.vc), feed = positive(input.feed), max = blank(input.machineMax) ? null : positive(input.machineMax);
    if (D === null || vc === null || feed === null || (!blank(input.machineMax) && max === null)) return null;
    var uncapped = vc * 1000 / (Math.PI * D), rpm = max === null ? uncapped : Math.min(uncapped, max), rate = rpm * feed;
    if (!Number.isFinite(uncapped) || !Number.isFinite(rpm) || !Number.isFinite(rate)) return null;
    // f 為每轉進給，與內外刃片數及可轉刃數無關。
    return { rpm: rpm, feedRate: rate, rpmUncapped: uncapped, capped: max !== null && uncapped > max };
  }
  return { normalizeCatalog: normalizeCatalog, filterTools: filterTools, selectCutting: selectCutting, calculate: calculate };
}));
