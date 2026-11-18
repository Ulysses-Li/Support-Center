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
    sd: { name: 'Super Drill', eyebrow: 'SD · 3D／4D', directory: 'CuttingData/SuperDrill/', pdf: 'Super_Drill_p136-141.pdf', note: '同型內、外刃刀片，依所選 3D／4D 刀體配對切削條件。' },
    spd: { name: 'Super Power Drill', eyebrow: 'SPD · 中心導引＋外刃', directory: 'CuttingData/SuperPowerDrill/', pdf: 'Super_Power_Drill_p128-135.pdf', note: '中心導引與外刃分開配對，供液至少需要 10 bar 內冷。' }
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

  return { fields, defaults, products, number, currentJob, queryFor, productUrl, selectFamilies };
}));
