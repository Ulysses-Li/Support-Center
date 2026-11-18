/* 分類頁僅彙整兩個獨立產品的 API；各產品的配刀與工況規則仍由產品目錄維護。 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DrillingSelector = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const fields = ['diameter', 'toleranceUpper', 'toleranceLower', 'depth', 'material'];
  const defaults = { diameter: '', toleranceUpper: '', toleranceLower: '', depth: '', material: '' };
  const products = {
    sd: { name: 'Super Drill', eyebrow: 'SD · 3D／4D', directory: 'CuttingData/SuperDrill/', pdf: 'Super_Drill_p136-141.pdf', firstPage: 136, note: '同型內、外刃刀片，依所選 3D／4D 刀體配對切削條件。' },
    spd: { name: 'Super Power Drill', eyebrow: 'SPD · 中心導引＋外刃', directory: 'CuttingData/SuperPowerDrill/', pdf: 'Super_Power_Drill_p128-135.pdf', firstPage: 128, note: '中心導引與外刃分開配對，供液至少需要 10 bar 內冷。' }
  };

  // 純資料 API 預設保留繁中相容性；頁面明確傳 en 即可取得英文文案，不改變選型規則。
  function languageCode(language) {
    return /^en(?:-|$)/i.test(String(language || '')) ? 'en' : 'zh-TW';
  }

  function productText(key, language) {
    if (languageCode(language) !== 'en') return products[key];
    const english = key === 'sd' ? {
      eyebrow: 'SD · 3D / 4D',
      note: 'The inner and outer positions use the same insert. Cutting values follow the selected 3D or 4D body.'
    } : {
      eyebrow: 'SPD · Center pilot + periphery',
      note: 'Match the center pilot and periphery inserts separately. Internal coolant of at least 10 bar is required.'
    };
    return { ...products[key], ...english };
  }

  function materialName(packages, materialId, language) {
    const item = Object.values(packages).flatMap(entry => entry.catalog?.materials || []).find(material => material.id === materialId);
    if (languageCode(language) === 'en') {
      const special = materialId === 'non_ferrous' ? 'non-ferrous metals' : materialId === 'heat_resistant' ? 'heat-resistant alloys' : '';
      return item?.label_en || item?.catalog_label || special || 'the selected material';
    }
    const special = materialId === 'non_ferrous' ? '非鐵金屬' : materialId === 'heat_resistant' ? '耐熱合金' : '';
    return item?.label_zh || special || '所選材料';
  }

  function number(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const result = Number(String(value).trim().replace(/[−－]/g, '-').replace(/＋/g, '+'));
    return Number.isFinite(result) ? result : null;
  }

  function currentJob(state, language) {
    const job = Object.fromEntries(fields.map(key => [key, state[key] ?? defaults[key]]));
    ['diameter', 'depth'].forEach(key => { job[key] = number(job[key]); });
    // 分類頁只收基本加工需求，舊網址的機台、內冷及柄徑不得形成隱藏篩選。
    // 實際工況交由產品頁另行設定與核對，此處不假定使用者已有內冷供液。
    return { ...job, lang: languageCode(language ?? state.lang), machineMode: 'rotating', application: 'regular_surface', coolant: 'unknown', shank: null, pressure: null, machineMax: null, spdDepthClass: '', applicationFactor: null };
  }

  function queryFor(state) {
    const query = new URLSearchParams();
    fields.forEach(key => {
      const value = state[key];
      if (value !== '' && value !== null && value !== undefined && value !== defaults[key]) query.set(key, String(value));
    });
    return query;
  }

  function productUrl(siteRoot, key, state, tool, language) {
    const url = new URL(products[key].directory + 'index.html', siteRoot);
    const query = queryFor(state);
    if (tool) {
      query.set('tool', tool.id);
      // 料號可提供名目孔徑；加工深度只能由使用者指定，不以刀體 T 自動代填。
      if (!(number(state.diameter) > 0)) query.set('diameter', String(tool.D));
    }
    // 語言不是加工篩選條件，獨立於五欄白名單；明示參數優先於網址中的有效語言。
    if (language !== undefined) query.set('lang', languageCode(language));
    else if (state.lang === 'en' || state.lang === 'zh-TW') query.set('lang', state.lang);
    url.search = query.toString();
    return url.href;
  }

  function materialSupport(entry, materialId, language = 'zh-TW') {
    if (!materialId) return { supported: null, sourcePage: null, note: '' };
    const support = entry?.core.getMaterialSupport
      ? entry.core.getMaterialSupport(entry.catalog, materialId, languageCode(language))
      : { supported: false, sourcePage: null, note: '尚無可核對的材料適用配對，不提供推薦。' };
    // 舊版／外部產品 API 可能仍只回繁中原因；英文介面以相同支持狀態提供通用材料說明。
    if (languageCode(language) === 'en' && support.supported === false && (!support.note || /[\u3400-\u9fff]/.test(support.note))) {
      const material = materialName({ product: entry || {} }, materialId, 'en');
      return { ...support, note: `This series has no recommended catalog pairing for ${material}.` };
    }
    return support;
  }

  function selectFamilies(packages, state, selected = {}, language = 'zh-TW') {
    const en = languageCode(language) === 'en';
    const job = currentJob(state, language);
    const groups = Object.keys(products).flatMap(key => {
      const product = productText(key, language);
      const entry = packages[key];
      if (!entry) return [];
      // 適用材料由各產品自己的切削表確認；沒有配對就不列為候選，不以尺寸符合代替。
      if (materialSupport(entry, job.material, language).supported === false) return [];
      const matching = entry.core.filterTools(entry.catalog, job).slice().sort((a, b) => a.tool.T - b.tool.T || a.tool.id.localeCompare(b.tool.id));
      if (!matching.length) return [];
      const chosen = matching.find(row => row.tool.id === selected[key]) || matching[0];
      return [{ key, product, matching, chosen, shortest: matching[0] }];
    });
    // T 是各系列共同刊載的可鑽深度。先滿足需求，再依 T 由短到長；不跨系列混比定義不同的 L／L1。
    groups.sort((a, b) => a.shortest.tool.T - b.shortest.tool.T);
    const preferred = groups.find(group => group.shortest.eligibility !== 'blocked');
    const complete = job.diameter > 0 && job.depth > 0;
    return groups.map(group => {
      // 僅開放目前最短可用的系列；換成較長的手選刀體或舊網址都不能解鎖另一系列。
      const canSelect = complete && group === preferred && group.chosen.eligibility !== 'blocked';
      const selectionNote = !complete ? (en ? 'Enter the finished hole diameter and drilling depth first.' : '請先填寫加工孔徑與鑽孔深度。')
        : group.chosen.eligibility === 'blocked' || !preferred ? (en ? 'These machining conditions are not applicable; selection is unavailable.' : '目前機台與加工條件不適用，暫不開放選用。')
          : !canSelect ? (en ? `${preferred.product.name} meets the required depth with a shorter drill body. This series is not available for selection.` : `${preferred.product.name} 已能滿足需求深度，先使用較短刀體；本系列暫不開放選用。`) : '';
      return { ...group, canSelect, selectionNote, recommended: canSelect && group.chosen.tool.id === group.shortest.tool.id };
    });
  }

  function explainNoMatch(packages, state = {}, language = 'zh-TW') {
    const en = languageCode(language) === 'en';
    const text = (zh, english) => en ? english : zh;
    const job = currentJob(state, language);
    const fmt = value => value.toLocaleString(en ? 'en-US' : 'zh-TW', { maximumFractionDigits: 8 });
    const hasValue = key => state[key] !== null && state[key] !== undefined && String(state[key]).trim() !== '';
    if (['diameter', 'depth'].some(key => hasValue(key) && !(job[key] > 0))) return null;
    if (!(job.diameter > 0) && !(job.depth > 0) && !job.material) return null;
    if (selectFamilies(packages, state, {}, language).length) return null;

    // 原因來自各產品實際標準料號，不將孔徑範圍視為連續規格，也不把缺值當作零。
    const families = Object.entries(products).map(([key, product]) => {
      const tools = (packages[key]?.catalog?.tools || []).filter(tool => number(tool.D) > 0);
      const diameters = [...new Set(tools.map(tool => tool.D))].sort((a, b) => a - b);
      const diameterRange = diameters.length ? [diameters[0], diameters[diameters.length - 1]] : null;
      const base = { key, name: product.name, reason: 'data', message: text('此系列尚缺可核對的標準刀體資料，無法確認是否符合需求。', 'Verified standard drill-body data is unavailable for this series; a match cannot be confirmed.'), maxDepth: null, shortfall: null, toolId: null, sourcePage: tools[0]?.sourcePage || null, diameterRange, nearbyDiameters: [] };
      const support = materialSupport(packages[key], job.material, language);
      if (support.supported === false) return { ...base, reason: 'material', sourcePage: support.sourcePage, message: support.note };
      if (!tools.length) return base;
      const sameDiameter = job.diameter > 0 ? tools.filter(tool => Math.abs(tool.D - job.diameter) <= 1e-8) : tools;
      if (!sameDiameter.length) {
        const insideRange = job.diameter > diameterRange[0] && job.diameter < diameterRange[1];
        const nearbyDiameters = insideRange ? diameters.slice().sort((a, b) => Math.abs(a - job.diameter) - Math.abs(b - job.diameter) || a - b).slice(0, 2).sort((a, b) => a - b) : [];
        const nearbyText = nearbyDiameters.length
          ? text(`鄰近標準孔徑為 ${nearbyDiameters.map(value => `Ø${fmt(value)}`).join('、')} mm，需按實際名目刀徑配對。`, `Nearby listed nominal diameters are ${nearbyDiameters.map(value => `Ø${fmt(value)}`).join(', ')} mm. Match the actual nominal diameter.`)
          : text(`本系列標準孔徑範圍為 Ø${fmt(diameterRange[0])}–${fmt(diameterRange[1])} mm。`, `This series lists nominal diameters within Ø${fmt(diameterRange[0])}–${fmt(diameterRange[1])} mm.`);
        return { ...base, reason: 'diameter', nearbyDiameters, message: text(`型錄未列 Ø${fmt(job.diameter)} mm 的標準刀體。`, `No standard Ø${fmt(job.diameter)} mm drill body is listed in the catalog. `) + nearbyText };
      }
      const deepest = sameDiameter.filter(tool => number(tool.T) > 0).sort((a, b) => b.T - a.T || a.id.localeCompare(b.id))[0];
      if (!deepest) return { ...base, message: text('此孔徑尚缺可核對的可鑽深度 T 資料，無法確認是否滿足需求。', 'Catalog drilling depth T is unavailable for this diameter; the required reach cannot be confirmed.') };
      if (!(job.depth > deepest.T + 1e-8)) return base;
      const shortfall = Number((job.depth - deepest.T).toFixed(8));
      const scope = job.diameter > 0
        ? text(`Ø${fmt(job.diameter)} mm 最長可鑽深 T${fmt(deepest.T)} mm`, `For Ø${fmt(job.diameter)} mm, the longest listed drilling depth is T${fmt(deepest.T)} mm`)
        : text(`全系列中最長可鑽深 T${fmt(deepest.T)} mm（Ø${fmt(deepest.D)} mm）`, `Across this series, the greatest listed drilling depth is T${fmt(deepest.T)} mm (Ø${fmt(deepest.D)} mm)`);
      return { ...base, reason: 'depth', maxDepth: deepest.T, shortfall, toolId: deepest.id, sourcePage: deepest.sourcePage || null, message: text(`${scope}，料號 ${deepest.id}；需求深度 ${fmt(job.depth)} mm 超出 ${fmt(shortfall)} mm。`, `${scope}; part ${deepest.id}. The required depth of ${fmt(job.depth)} mm exceeds this capacity by ${fmt(shortfall)} mm.`) };
    });
    const materialFailures = families.filter(family => family.reason === 'material');
    if (materialFailures.length) {
      const material = materialName(packages, job.material, language);
      const allUnsupported = materialFailures.length === families.length;
      return {
        title: allUnsupported ? text(`目前沒有適用「${material}」的標準刀具`, `No recommended standard tool for ${material}`) : text('沒有同時符合材料與尺寸的標準刀具', 'No standard tool matches both the material and dimensions'),
        summary: allUnsupported ? text(`已選材料為${material}，這兩個系列均無適用的推薦配對。`, `For ${material}, neither series has a recommended catalog pairing.`) : text(`已選材料為${material}，目前沒有同時滿足材料適用性與需求尺寸的標準配對。`, `For ${material}, no standard pairing meets both material suitability and the required dimensions.`),
        guidance: text('請洽詢適合此材料的其他刀具系列。', 'Ask about another tool series suitable for this material.'),
        families
      };
    }
    const best = families.filter(family => family.reason === 'depth').sort((a, b) => b.maxDepth - a.maxDepth)[0];
    if (best) {
      return {
        title: job.diameter > 0 ? text(`Ø${fmt(job.diameter)} mm 的標準刀體深度不足`, `Standard Ø${fmt(job.diameter)} mm drill bodies cannot reach this depth`) : text('目前標準刀體的鑽孔深度不足', 'Standard drill bodies cannot reach this depth'),
        summary: text(`需求深度 ${fmt(job.depth)} mm；${job.diameter > 0 ? '此孔徑可核對資料中' : '目前型錄全系列可核對資料中'}最大可鑽深 T${fmt(best.maxDepth)} mm，仍短 ${fmt(best.shortfall)} mm。`, `Required depth: ${fmt(job.depth)} mm. The greatest verified catalog drilling depth ${job.diameter > 0 ? 'at this diameter' : 'across both series'} is T${fmt(best.maxDepth)} mm, short by ${fmt(best.shortfall)} mm.`),
        guidance: job.diameter > 0 ? text('若孔徑與深度必須維持此需求，請洽詢較長刀體或其他刀具方案。', 'If this diameter and depth must be maintained, ask about a longer drill body or another tool solution.') : text('各刀徑的可用深度不同，請填寫孔徑核對；若需維持此深度，請洽詢其他刀具方案。', 'Available depth varies by diameter. Enter the diameter to check; if this depth must be maintained, ask about another tool solution.'),
        families
      };
    }
    const missingDiameter = job.diameter > 0 && families.every(family => family.reason === 'diameter');
    return {
      title: missingDiameter ? text(`型錄未列 Ø${fmt(job.diameter)} mm 的標準刀體`, `No standard Ø${fmt(job.diameter)} mm drill body is listed`) : text('尚無可核對的標準配對資料', 'No verified standard pairing data is available'),
      summary: missingDiameter ? text('本頁按標準名目刀徑配對，兩系列均未列出此尺寸，無法直接選用標準料號。', 'This finder matches listed nominal diameters. Neither series lists this size, so no standard part can be selected directly.') : text('目前型錄資料不足以確認這組需求，請依下方原因核對。', 'The available catalog data cannot confirm this job. Check the reasons below.'),
      guidance: text('請核對各系列型錄；若需求孔徑必須維持此尺寸，請洽詢其他刀具方案。', 'Check each series catalog. If this diameter must be maintained, ask about another tool solution.'),
      families
    };
  }

  return { fields, defaults, products, number, currentJob, queryFor, productUrl, selectFamilies, explainNoMatch };
}));
