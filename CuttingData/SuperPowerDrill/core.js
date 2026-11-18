/* Super Power Drill 獨立核心：只讀取本產品的刀體、中心／外刃與切削表。 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./locale.js'));
  } else {
    root.SuperPowerDrillCore = factory(root.SuperPowerDrillLocale);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (Locale) {
  'use strict';

  // 核心只處理資料與數學；不讀取 DOM、不寫入原始型錄，也不自動補齊缺值。
  var EPSILON = 1e-8;
  var STATUS_ORDER = { ready: 0, review: 1, missing: 2, blocked: 3 };
  var APPLICATION_NAMES = {
    regular_surface: '一般平面',
    cross_holes: '交叉孔',
    stack_drilling: '疊板鑽孔',
    round_offset: '圓件偏心鑽孔',
    plunge: '插銑',
    concave: '凹面',
    angled: '斜面',
    cone_offset: '錐件偏心鑽孔'
  };

  function blank(value) {
    return value === null || value === undefined ||
      (typeof value === 'string' && value.trim() === '');
  }

  function number(value) {
    if (blank(value) || (typeof value !== 'number' && typeof value !== 'string')) return null;
    var result = Number(value);
    return Number.isFinite(result) ? result : null;
  }

  function positive(value) {
    var result = number(value);
    return result !== null && result > 0 ? result : null;
  }

  function equal(a, b) {
    return a !== null && b !== null && Math.abs(a - b) <= EPSILON;
  }

  function sourcePage(source) {
    return source ? (source.catalog_page || source.printed_page || null) : null;
  }

  function addNote(result, status, text) {
    if (STATUS_ORDER[status] > STATUS_ORDER[result.status]) result.status = status;
    if (text && result.notes.indexOf(text) === -1) result.notes.push(text);
  }

  function range(value) {
    if (!value) return null;
    var min = number(value.min);
    var max = number(value.max);
    return min !== null && max !== null && min > 0 && max >= min ? [min, max] : null;
  }

  function normalizeCatalog(product, cutting) {
    product = product || {}; cutting = cutting || {};
    var tools = (product.holders || []).filter(function (holder) {
      return /^00-99307-\d+$/.test(holder.part_no || '');
    }).map(function (holder) {
      var center = holder.center_pilot_insert || {};
      var periphery = holder.periphery_insert_as_listed || {};
      return {
        id: holder.part_no, family: 'spd', ratio: null,
        D: positive(holder.diameter_mm), T: positive(holder.drilling_depth_T_mm),
        L: positive(holder.length_L_mm), L1: positive(holder.length_L1_mm),
        shank: positive(holder.shank_diameter_mm), d1: positive(holder.collar_diameter_d1_mm),
        raw: holder, sourcePage: sourcePage(holder.source), insertModel: null,
        centerModel: center.part_no || null, peripheryModel: periphery.part_no || null,
        centerQty: positive(center.quantity), peripheryQty: positive(periphery.quantity)
      };
    });
    return { tools: tools, materials: (cutting.materials || []).map(function (m) { return Object.assign({}, m); }), product: product, cutting: cutting };
  }

  // 材料適用性只看本產品自己的切削列；未選材料與明確不適用分開處理。
  function getMaterialSupport(catalog, materialId, lang) {
    if (blank(materialId)) return { supported: null, sourcePage: null, note: '' };
    var section = catalog && catalog.cutting ? catalog.cutting.section || {} : {};
    var rows = Array.isArray(section.cutting_rows) ? section.cutting_rows : [];
    var supported = rows.some(function (row) { return row.material_id === materialId; });
    var page = positive(sourcePage(section.source));
    if (supported) return { supported: true, sourcePage: page, note: '' };
    var nonFerrous = materialId === 'non_ferrous' || materialId === 'N';
    return {
      supported: false,
      sourcePage: page,
      note: Locale.translate(nonFerrous ? '本系列不建議用於非鐵金屬' : '型錄未列此材料適用配對，不提供推薦', lang)
    };
  }

  function checkGeometry(tool, state, result) {
    ['diameter', 'depth', 'shank'].forEach(function (key) {
      if (!blank(state[key]) && positive(state[key]) === null) {
        addNote(result, 'blocked', { diameter: '孔徑', depth: '深度', shank: '柄徑' }[key] + '必須為大於零的有效數字。');
      }
    });
    var diameter = positive(state.diameter);
    var depth = positive(state.depth);
    var shank = positive(state.shank);
    if (diameter !== null && !equal(diameter, tool.D)) {
      addNote(result, 'blocked', '本工具按標稱孔徑配對，不以車床 Dmax 延伸可用孔徑。');
    }
    if (depth !== null && (tool.T === null || depth > tool.T + EPSILON)) {
      addNote(result, 'blocked', '需求深度超過此刀體的型錄鑽孔深度 T。');
    }
    if (shank !== null && !equal(shank, tool.shank)) {
      addNote(result, 'blocked', '所選柄徑與此刀體的型錄柄徑不符。');
    }
    if (blank(state.diameter)) addNote(result, 'review', '請先填寫完工孔徑。');
    if (blank(state.depth)) addNote(result, 'review', '請先填寫需求鑽孔深度。');
  }

  function checkOperatingConditions(catalog, tool, state, result) {
    var mode = state.machineMode || 'rotating';
    var application = state.application || 'regular_surface';
    if (mode !== 'rotating' && mode !== 'lathe') {
      addNote(result, 'review', '請選擇旋轉刀具或車床加工方式。');
    }
    if (application === 'stack_drilling' || application === 'angled') {
      addNote(result, 'blocked', 'SPD 型錄 p135 禁止' + APPLICATION_NAMES[application] + '。');
    } else if (application !== 'regular_surface') {
      addNote(result, 'review', 'SPD 未刊載「' + (APPLICATION_NAMES[application] || application) + '」的可套用倍率，請補充適用條件後再設定。');
    }
    var coolant = state.coolant || 'unknown';
    var pressure = number(state.pressure);
    var minimum = positive((catalog.cutting.coolant_reference || {}).spd_minimum_pressure_bar) || 10;
    if (coolant === 'no') {
      addNote(result, 'blocked', 'SPD 需要內冷供液；目前選擇沒有內冷。');
    } else if (coolant !== 'yes') {
      addNote(result, 'review', 'SPD 內冷供液尚未確認。');
    }
    if (pressure !== null && pressure < minimum) {
      addNote(result, 'blocked', 'SPD 內冷壓力須至少 ' + minimum + ' bar（型錄 p135）。');
    } else if (pressure === null) {
      addNote(result, 'review', blank(state.pressure) ? '請確認 SPD 內冷壓力至少 ' + minimum + ' bar。' : '內冷壓力必須為有效數字。');
    }
    if (mode === 'lathe') {
      addNote(result, 'review', 'SPD 車床加工請確認中心偏差 E<0.05 mm、預點孔與實際夾持。');
    }
  }

  function localizeResult(result, lang) {
    result.notes = result.notes.map(function (note) { return Locale.translate(note, lang); });
    return result;
  }

  function selectCutting(catalog, tool, state) {
    state = state || {};
    var result = {
      status: 'ready',
      vcRange: null,
      feedRange: null,
      baseVcRange: null,
      baseFeedRange: null,
      centerGrade: null,
      peripheryGrade: null,
      centerModel: tool ? tool.centerModel : null,
      peripheryModel: tool ? tool.peripheryModel : null,
      materialSupported: null,
      sourcePage: null,
      notes: [],
      depthClass: null,
      diameterBand: null,
      rowId: null,
      vcMedian: null,
      feedMedian: null
    };
    if (!catalog || !catalog.cutting || !Array.isArray(catalog.tools) || !tool || tool.family !== 'spd' || !catalog.tools.some(function (entry) { return entry.id === tool.id && entry.family === 'spd'; })) {
      addNote(result, 'missing', '請先選擇有型錄資料的刀體。');
      return localizeResult(result, state.lang);
    }
    var section = catalog.cutting.section || {};
    result.sourcePage = sourcePage(section.source);
    var materialSupport = getMaterialSupport(catalog, state.material, state.lang);
    result.materialSupported = materialSupport.supported;
    if (materialSupport.supported === false) {
      addNote(result, 'blocked', materialSupport.note);
      return localizeResult(result, state.lang);
    }
    checkGeometry(tool, state, result);
    checkOperatingConditions(catalog, tool, state, result);
    if (!state.material) {
      addNote(result, 'missing', '請先選擇工件材料。');
      return localizeResult(result, state.lang);
    }
    var band = (section.diameter_bands || []).find(function (item) {
      var limits = item.nominal_diameter_mm || [];
      return tool.D !== null && tool.D >= limits[0] - EPSILON && tool.D <= limits[1] + EPSILON;
    });
    if (!band) {
      addNote(result, 'missing', '此標稱孔徑未列出對應的切削資料欄。');
      return localizeResult(result, state.lang);
    }
    result.diameterBand = band.id;
    var materialRows = (section.cutting_rows || []).filter(function (row) {
      return row.material_id === state.material;
    });
    if (!materialRows.length) {
      addNote(result, 'missing', '此系列型錄未刊載所選材料的切速與進給，不借用其他材料數據。');
      return localizeResult(result, state.lang);
    }
    var row;
    if (state.spdDepthClass !== 'lt7d' && state.spdDepthClass !== 'gt7d') {
      addNote(result, 'review', '請明確選擇 SPD 的 T<7D 或 T>7D 資料列；型錄尚未釐清分區應以需求深度還是刀體 T 為準。');
      var depthWithoutClass = positive(state.depth);
      if (depthWithoutClass !== null && tool.D !== null && equal(depthWithoutClass / tool.D, 7)) {
        addNote(result, 'review', '需求深度恰為 7D，型錄未定義等號邊界，請原廠確認。');
      }
      return localizeResult(result, state.lang);
    }
    result.depthClass = state.spdDepthClass === 'lt7d' ? 'T<7D' : 'T>7D';
    // 採型錄既有的外周 NC2032 配對；中心牌號仍依材料列分別決定。
    row = materialRows.find(function (item) {
      return item.depth_class_raw === result.depthClass && item.periphery_grade === 'NC2032';
    });
    result.notes.push('SPD ' + result.depthClass + ' 列由使用者指定；分區採用需求深度或刀體 T 的依據仍待原廠確認。');
    var depth = positive(state.depth);
    if (depth !== null && tool.D !== null && equal(depth / tool.D, 7)) {
      addNote(result, 'review', '需求深度恰為 7D；即使手動指定資料列，也須原廠確認等號邊界。');
    }
    if (!row) {
      addNote(result, 'missing', '沒有對應材料、刀體分區與已列實體刀片的切削資料列。');
      return localizeResult(result, state.lang);
    }
    result.rowId = row.id || null;
    result.sourcePage = sourcePage(row.source) || result.sourcePage;
    result.centerGrade = row.center_grade || null;
    result.peripheryGrade = row.periphery_grade || null;
    result.baseVcRange = range(row.vc);
    result.baseFeedRange = range((row.feed_per_revolution || {})[band.id]);
    result.vcRange = result.baseVcRange ? result.baseVcRange.slice() : null;
    result.feedRange = result.baseFeedRange ? result.baseFeedRange.slice() : null;
    if (!result.baseVcRange) addNote(result, 'missing', '此資料列未刊載切削速度 Vc。');
    if (!result.baseFeedRange) addNote(result, 'missing', '此直徑與分區的每轉進給 f 在型錄為空白，不以零值或其他欄位代替。');
    if (result.centerGrade) {
      var centerIsListed = (catalog.product.center_pilot_inserts || []).some(function (insert) {
        return insert.part_no_as_printed === tool.centerModel && insert.grade === result.centerGrade;
      });
      var peripheryIsListed = (catalog.product.periphery_inserts || []).some(function (insert) {
        return insert.part_no_as_printed === tool.peripheryModel && insert.grade === result.peripheryGrade;
      });
      if (!centerIsListed || !peripheryIsListed) {
        addNote(result, 'missing', '資料列牌號尚未找到對應的實體中心或外周刀片，不自動拼造訂購料號。');
        result.vcRange = null;
        result.feedRange = null;
      }
    }
    if (result.status === 'blocked' || result.status === 'missing') {
      result.vcRange = null;
      result.feedRange = null;
    }
    if (result.vcRange) result.vcMedian = (result.vcRange[0] + result.vcRange[1]) / 2;
    if (result.feedRange) result.feedMedian = (result.feedRange[0] + result.feedRange[1]) / 2;
    return localizeResult(result, state.lang);
  }

  function filterTools(catalog, state) {
    state = state || {};
    if (!catalog || !Array.isArray(catalog.tools)) return [];
    if (getMaterialSupport(catalog, state.material, state.lang).supported === false) return [];
    // 空白代表尚未限制條件；非空白的錯誤數值不能偷偷變成「全部」。
    if (['diameter', 'depth', 'shank'].some(function (key) {
      return !blank(state[key]) && positive(state[key]) === null;
    })) return [];
    var diameter = positive(state.diameter);
    var depth = positive(state.depth);
    var shank = positive(state.shank);
    return catalog.tools.filter(function (tool) {
      return tool.family === 'spd' &&
        (diameter === null || equal(tool.D, diameter)) &&
        (depth === null || (tool.T !== null && depth <= tool.T + EPSILON)) &&
        (shank === null || equal(tool.shank, shank));
    }).map(function (tool) {
      var cutting = selectCutting(catalog, tool, state);
      return {
        tool: tool,
        eligibility: cutting.status === 'missing' ? 'review' : cutting.status,
        notes: cutting.notes.slice(),
        diameterFits: diameter === null ? null : true,
        depthFits: depth === null ? null : true,
        shankFits: shank === null ? null : true,
        cuttingStatus: cutting.status
      };
    });
  }

  function calculate(input) {
    input = input || {};
    var D = positive(input.D);
    var vc = positive(input.vc);
    var feed = positive(input.feed);
    var machineMax = blank(input.machineMax) ? null : positive(input.machineMax);
    if (D === null || vc === null || feed === null || (!blank(input.machineMax) && machineMax === null)) return null;
    var rpmUncapped = vc * 1000 / (Math.PI * D);
    var rpm = machineMax === null ? rpmUncapped : Math.min(rpmUncapped, machineMax);
    var feedRate = rpm * feed;
    if (!Number.isFinite(rpmUncapped) || !Number.isFinite(rpm) || !Number.isFinite(feedRate)) return null;
    // f 是每轉進給；內外刀片、外周片數與可轉刃數均不構成乘數。
    return { rpm: rpm, feedRate: feedRate, rpmUncapped: rpmUncapped, capped: machineMax !== null && rpmUncapped > machineMax };
  }

  return Object.freeze({ normalizeCatalog: normalizeCatalog, getMaterialSupport: getMaterialSupport, filterTools: filterTools, selectCutting: selectCutting, calculate: calculate });
}));
