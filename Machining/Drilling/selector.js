/* 分類頁僅彙整兩個獨立產品的 API；各產品的配刀與工況規則仍由產品目錄維護。 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.DrillingSelector = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const fields = ['diameter', 'toleranceUpper', 'toleranceLower', 'depth', 'material', 'shank', 'machineMode', 'application', 'coolant', 'pressure', 'machineMax', 'spdDepthClass', 'applicationFactor'];
  const defaults = { diameter: '', toleranceUpper: '', toleranceLower: '', depth: '', material: '', shank: '', machineMode: 'rotating', application: 'regular_surface', coolant: 'unknown', pressure: '', machineMax: '', spdDepthClass: '', applicationFactor: '' };
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
    const job = { ...defaults, ...state };
    ['diameter', 'depth', 'shank', 'pressure', 'machineMax', 'applicationFactor'].forEach(key => { job[key] = number(job[key]); });
    return job;
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

  function selectFamilies(packages, state, selected) {
    const job = currentJob(state);
    return Object.entries(products).flatMap(([key, product]) => {
      const entry = packages[key];
      if (!entry) return [];
      const matching = entry.core.filterTools(entry.catalog, job).slice().sort((a, b) => a.tool.T - b.tool.T || a.tool.id.localeCompare(b.tool.id));
      if (!matching.length) return [];
      const chosen = matching.find(row => row.tool.id === selected[key]) || matching[0];
      return [{ key, product, matching, chosen }];
    });
  }

  return { fields, defaults, products, number, currentJob, queryFor, productUrl, selectFamilies };
}));
