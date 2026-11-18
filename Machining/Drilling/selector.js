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

  function number(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const result = Number(String(value).trim().replace(/[−－]/g, '-').replace(/＋/g, '+'));
    return Number.isFinite(result) ? result : null;
  }

  function currentJob(state) {
    const job = Object.fromEntries(fields.map(key => [key, state[key] ?? defaults[key]]));
    ['diameter', 'depth'].forEach(key => { job[key] = number(job[key]); });
    // 分類頁只收基本加工需求，舊網址的機台、內冷及柄徑不得形成隱藏篩選。
    // 實際工況交由產品頁另行設定與核對，此處不假定使用者已有內冷供液。
    return { ...job, machineMode: 'rotating', application: 'regular_surface', coolant: 'unknown', shank: null, pressure: null, machineMax: null, spdDepthClass: '', applicationFactor: null };
  }

  function queryFor(state) {
    const query = new URLSearchParams();
    fields.forEach(key => {
      const value = state[key];
      if (value !== '' && value !== null && value !== undefined && value !== defaults[key]) query.set(key, String(value));
    });
    return query;
  }

  function productUrl(siteRoot, key, state, tool) {
    const url = new URL(products[key].directory + 'index.html', siteRoot);
    const query = queryFor(state);
    if (tool) {
      query.set('tool', tool.id);
      // 料號可提供名目孔徑；加工深度只能由使用者指定，不以刀體 T 自動代填。
      if (!(number(state.diameter) > 0)) query.set('diameter', String(tool.D));
    }
    url.search = query.toString();
    return url.href;
  }

  function selectFamilies(packages, state, selected = {}) {
    const job = currentJob(state);
    const groups = Object.entries(products).flatMap(([key, product]) => {
      const entry = packages[key];
      if (!entry) return [];
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
      const selectionNote = !complete ? '請先填寫加工孔徑與鑽孔深度。'
        : group.chosen.eligibility === 'blocked' || !preferred ? '目前機台與加工條件不適用，暫不開放選用。'
          : !canSelect ? `${preferred.product.name} 已能滿足需求深度，先使用較短刀體；本系列暫不開放選用。` : '';
      return { ...group, canSelect, selectionNote, recommended: canSelect && group.chosen.tool.id === group.shortest.tool.id };
    });
  }

  function explainNoMatch(packages, state = {}) {
    const job = currentJob(state);
    const fmt = value => value.toLocaleString('zh-TW', { maximumFractionDigits: 8 });
    const hasValue = key => state[key] !== null && state[key] !== undefined && String(state[key]).trim() !== '';
    if (['diameter', 'depth'].some(key => hasValue(key) && !(job[key] > 0))) return null;
    if (!(job.diameter > 0) && !(job.depth > 0)) return null;
    if (selectFamilies(packages, state).length) return null;

    // 原因來自各產品實際標準料號，不將孔徑範圍視為連續規格，也不把缺值當作零。
    const families = Object.entries(products).map(([key, product]) => {
      const tools = (packages[key]?.catalog?.tools || []).filter(tool => number(tool.D) > 0);
      const diameters = [...new Set(tools.map(tool => tool.D))].sort((a, b) => a - b);
      const diameterRange = diameters.length ? [diameters[0], diameters[diameters.length - 1]] : null;
      const base = { key, name: product.name, reason: 'data', message: '此系列尚缺可核對的標準刀體資料，無法確認是否符合需求。', maxDepth: null, shortfall: null, toolId: null, sourcePage: tools[0]?.sourcePage || null, diameterRange, nearbyDiameters: [] };
      if (!tools.length) return base;
      const sameDiameter = job.diameter > 0 ? tools.filter(tool => Math.abs(tool.D - job.diameter) <= 1e-8) : tools;
      if (!sameDiameter.length) {
        const insideRange = job.diameter > diameterRange[0] && job.diameter < diameterRange[1];
        const nearbyDiameters = insideRange ? diameters.slice().sort((a, b) => Math.abs(a - job.diameter) - Math.abs(b - job.diameter) || a - b).slice(0, 2).sort((a, b) => a - b) : [];
        const nearbyText = nearbyDiameters.length ? `鄰近標準孔徑為 ${nearbyDiameters.map(value => `Ø${fmt(value)}`).join('、')} mm，需按實際名目刀徑配對。` : `本系列標準孔徑範圍為 Ø${fmt(diameterRange[0])}–${fmt(diameterRange[1])} mm。`;
        return { ...base, reason: 'diameter', nearbyDiameters, message: `型錄未列 Ø${fmt(job.diameter)} mm 的標準刀體。${nearbyText}` };
      }
      const deepest = sameDiameter.filter(tool => number(tool.T) > 0).sort((a, b) => b.T - a.T || a.id.localeCompare(b.id))[0];
      if (!deepest) return { ...base, message: '此孔徑尚缺可核對的可鑽深度 T 資料，無法確認是否滿足需求。' };
      if (!(job.depth > deepest.T + 1e-8)) return base;
      const shortfall = Number((job.depth - deepest.T).toFixed(8));
      const scope = job.diameter > 0 ? `Ø${fmt(job.diameter)} mm 最長可鑽深 T${fmt(deepest.T)} mm` : `全系列中最長可鑽深 T${fmt(deepest.T)} mm（Ø${fmt(deepest.D)} mm）`;
      return { ...base, reason: 'depth', maxDepth: deepest.T, shortfall, toolId: deepest.id, sourcePage: deepest.sourcePage || null, message: `${scope}，料號 ${deepest.id}；需求深度 ${fmt(job.depth)} mm 超出 ${fmt(shortfall)} mm。` };
    });
    const best = families.filter(family => family.reason === 'depth').sort((a, b) => b.maxDepth - a.maxDepth)[0];
    if (best) {
      return {
        title: job.diameter > 0 ? `Ø${fmt(job.diameter)} mm 的標準刀體深度不足` : '目前標準刀體的鑽孔深度不足',
        summary: `需求深度 ${fmt(job.depth)} mm；${job.diameter > 0 ? '此孔徑可核對資料中' : '目前型錄全系列可核對資料中'}最大可鑽深 T${fmt(best.maxDepth)} mm，仍短 ${fmt(best.shortfall)} mm。`,
        guidance: job.diameter > 0 ? '若孔徑與深度必須維持此需求，請洽詢較長刀體或其他刀具方案。' : '各刀徑的可用深度不同，請填寫孔徑核對；若需維持此深度，請洽詢其他刀具方案。',
        families
      };
    }
    const missingDiameter = job.diameter > 0 && families.every(family => family.reason === 'diameter');
    return {
      title: missingDiameter ? `型錄未列 Ø${fmt(job.diameter)} mm 的標準刀體` : '尚無可核對的標準配對資料',
      summary: missingDiameter ? '本頁按標準名目刀徑配對，兩系列均未列出此尺寸，無法直接選用標準料號。' : '目前型錄資料不足以確認這組需求，請依下方原因核對。',
      guidance: '請核對各系列型錄；若需求孔徑必須維持此尺寸，請洽詢其他刀具方案。',
      families
    };
  }

  return { fields, defaults, products, number, currentJob, queryFor, productUrl, selectFamilies, explainNoMatch };
}));
