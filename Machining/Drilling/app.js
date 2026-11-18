/* 鑽孔分類頁只負責需求篩選與導流；計算、刀片及圖面由兩個產品各自維護。 */
(() => {
  'use strict';
  const scriptRoot = new URL('.', document.currentScript.src);
  const siteRoot = new URL('../../', scriptRoot);
  const Selector = window.DrillingSelector;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const number = Selector.number;
  const fmt = (value, decimals = 2) => Number.isFinite(value) ? value.toLocaleString('zh-TW', { maximumFractionDigits: decimals }) : '—';
  let packages, materials, state = { ...Selector.defaults };
  const selected = { sd: '', spd: '' };

  async function fetchJson(path) {
    const response = await fetch(new URL(path, siteRoot));
    if (!response.ok) throw new Error('型錄資料載入失敗');
    return response.json();
  }

  async function sharedComponent(path, target) {
    const response = await fetch(new URL(path, siteRoot));
    if (!response.ok) throw new Error('共用元件載入失敗');
    $(target).innerHTML = await response.text();
    if (target !== 'header-placeholder') return;
    const button = $('mobileMenuBtn'), nav = $('topNav');
    if (!button || !nav) return;
    button.innerHTML = '<svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M2 12a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 12m0-4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8m0-4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 4"/></svg>';
    button.setAttribute('aria-controls', 'topNav');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', '開啟選單');
    button.addEventListener('click', () => { button.setAttribute('aria-expanded', String(nav.classList.toggle('active'))); });
  }

  function configure() {
    // 只合併相同材料 ID，不讓分類頁另存兩產品的切削資料副本。
    materials = [...new Map(Object.values(packages).flatMap(entry => entry.catalog.materials).map(material => [material.id, material])).values()];
    $('material').innerHTML = '<option value="">請選擇材料</option>' + materials.map(material => `<option value="${esc(material.id)}">${esc(material.iso)} · ${esc(material.label_zh)}</option>`).join('') + '<option value="non_ferrous">N · 非鐵金屬（本章未列切削值）</option><option value="heat_resistant">S · 耐熱合金（本章未列切削值）</option>';
    const query = new URLSearchParams(location.search);
    Selector.fields.forEach(key => {
      if (query.has(key)) state[key] = query.get(key);
      if ($(key)) { $(key).value = state[key]; state[key] = $(key).value; }
    });
    selected.sd = query.get('sdTool') || '';
    selected.spd = query.get('spdTool') || '';
  }

  function validation() {
    if (state.diameter !== '' && !(number(state.diameter) > 0)) return '請輸入大於 0 的完成孔徑。';
    if (state.depth !== '' && !(number(state.depth) > 0)) return '請輸入大於 0 的鑽孔深度。';
    const upper = number(state.toleranceUpper), lower = number(state.toleranceLower);
    if ((state.toleranceUpper !== '' && upper === null) || (state.toleranceLower !== '' && lower === null)) return '公差請填帶正負號的數字，例如 +0.05、−0.02。';
    if (upper !== null && lower !== null && lower > upper) return '下偏差不可大於上偏差，請檢查公差。';
    if (number(state.diameter) > 0 && lower !== null && number(state.diameter) + lower <= 0) return '要求孔徑的下限必須大於 0。';
    return '';
  }

  function render() {
    const issue = validation();
    const diameter = number(state.diameter), upper = number(state.toleranceUpper), lower = number(state.toleranceLower);
    $('toleranceSummary').textContent = diameter > 0 && upper !== null && lower !== null && lower <= upper ? `要求孔徑範圍：${fmt(diameter + lower, 4)}–${fmt(diameter + upper, 4)} mm；公差作為加工需求紀錄。` : '公差選填：上偏差／下偏差，單位 mm。';
    const material = materials.find(item => item.id === state.material)?.label_zh || ({ non_ferrous: '非鐵金屬', heat_resistant: '耐熱合金' }[state.material]) || '材料未選';
    $('resultSummary').textContent = issue || [diameter > 0 ? `Ø${fmt(diameter, 4)} mm` : '孔徑未填', number(state.depth) > 0 ? `深 ${fmt(number(state.depth))} mm` : '深度未填', material].join(' · ');
    $('dataStatus').textContent = issue || (diameter > 0 && number(state.depth) > 0 ? '已依孔徑與深度篩選，優先推薦最短可用刀體。' : '先填孔徑與深度；材料可接著補齊。');
    const groups = issue ? [] : Selector.selectFamilies(packages, state, selected);
    $('recommendationSummary').hidden = groups.length === 0;
    if (!issue && groups.length === 0) $('dataStatus').textContent = '型錄中沒有同時符合需求的標準刀體，原因如下。';
    const filtering = ['diameter', 'depth', 'material'].some(key => state[key] !== '');
    const preferred = groups.find(group => group.recommended);
    $('recommendationSummary').textContent = preferred ? `優先推薦 ${preferred.product.name}${preferred.chosen.tool.ratio ? ` ${preferred.chosen.tool.ratio}D` : ''} · ${preferred.chosen.tool.id}：可鑽深 T${fmt(preferred.chosen.tool.T)} mm，為符合需求的最短尺寸。` : '依型錄可鑽深 T 由短到長排列，優先選擇滿足需求深度的最短刀體。';
    $('resultCount').textContent = diameter > 0 && number(state.depth) > 0 ? `${groups.filter(group => group.canSelect).length} 個系列可選 · ${groups.reduce((sum, group) => sum + group.matching.length, 0)} 個刀體尺寸符合` : `${groups.length} 個鑽孔系列 · 先填孔徑與深度`;
    $('toolList').innerHTML = groups.map(({ key, product, matching, chosen, shortest, recommended, canSelect, selectionNote }) => {
      const tool = chosen.tool;
      selected[key] = tool.id;
      const status = filtering ? chosen.eligibility : 'ready';
      const options = matching.map(({ tool: option }) => `<option value="${esc(option.id)}" ${option.id === tool.id ? 'selected' : ''}>${option.id === shortest.tool.id ? '最短尺寸 · ' : ''}${esc(option.id)} · Ø${fmt(option.D)}${option.ratio ? ` · ${option.ratio}D` : ''} · T${fmt(option.T)} · 柄Ø${fmt(option.shank)}</option>`).join('');
      const meta = tool.ratio ? `${tool.ratio}D · ${esc(tool.insertModel)} · NC2032` : `中心 ${esc(tool.centerModel)} ×${tool.centerQty}／外刃 ${esc(tool.peripheryModel)} ×${tool.peripheryQty}`;
      const pdf = new URL(product.directory + 'sources/' + product.pdf, siteRoot);
      // 停用系列不輸出選型網址，並使用原生 disabled 控制，鍵盤操作也無法誤選。
      const action = canSelect ? `<a class="btn ${recommended ? 'btn-brand' : 'btn-tool'} m-0" href="${esc(Selector.productUrl(siteRoot, key, state, tool))}">${recommended ? '使用推薦刀體' : '帶入這支刀體'} <span aria-hidden="true">→</span></a>` : `<button type="button" class="btn btn-tool m-0" disabled aria-describedby="hub-${key}-availability">暫不開放選用</button>`;
      const note = selectionNote || (filtering ? chosen.notes[0] || '尺寸與已填條件符合，進入產品頁取得切削設定。' : '先填寫孔徑與深度，開始選型。');
      return `<article class="finder-family-card${recommended ? ' is-recommended' : ''}${!canSelect ? ' is-unavailable' : ''}"><div class="finder-card-heading"><span class="finder-family-icon"><img src="${new URL('img/drilling.png', siteRoot)}" alt=""></span><div><span class="tool-family">${esc(product.eyebrow)}</span><h3>${esc(product.name)}</h3>${recommended ? '<span class="recommendation-tag">最短尺寸・優先推薦</span>' : ''}</div></div><p class="family-note">${esc(product.note)}</p><span class="match-tag ${canSelect ? esc(status) : 'unavailable'}">${matching.length} 個${filtering ? '刀體尺寸符合' : '標準刀體'}${!canSelect ? '・暫不開放' : ''}</span><label class="form-label mt-3" for="hub-${key}-tool">符合條件的刀體</label><select class="form-select family-setup-select" id="hub-${key}-tool" data-family="${key}"${!canSelect ? ` disabled aria-describedby="hub-${key}-availability"` : ''}>${options}</select><p class="family-selected-spec">Ø${fmt(tool.D)} mm · 可鑽深 T${fmt(tool.T)} mm · 後柄 Ø${fmt(tool.shank)} mm</p><p class="family-setup-meta">${meta} · 型錄 p${tool.sourcePage}</p><p class="family-note" id="hub-${key}-availability">${esc(note)}</p><div class="finder-family-action">${action}<a class="family-catalog-link" href="${pdf}" target="_blank" rel="noopener">產品型錄 PDF ↗</a></div></article>`;
    }).join('');
    $('emptyState').hidden = groups.length > 0;
    const diagnosis = !issue && groups.length === 0 ? Selector.explainNoMatch(packages, state) : null;
    $('emptyState').classList.toggle('no-match-explanation', Boolean(diagnosis));
    if (diagnosis) {
      // 數值與型錄頁碼皆由各系列實際料號產生；缺資料不補上推估值。
      const reasons = diagnosis.families.map(item => {
        const product = Selector.products[item.key];
        const source = new URL(product.directory + 'sources/' + product.pdf, siteRoot);
        if (item.sourcePage) source.hash = `page=${item.sourcePage - product.firstPage + 1}`;
        return `<li class="col-12 col-md-6"><strong>${esc(item.name)}</strong><p class="mt-1 mb-0">${esc(item.message)}</p><a class="family-catalog-link" href="${esc(source.href)}" target="_blank" rel="noopener">${item.sourcePage ? `型錄 p${item.sourcePage}` : '產品型錄 PDF'} ↗</a></li>`;
      }).join('');
      $('emptyState').innerHTML = `<h3>${esc(diagnosis.title)}</h3><p class="no-match-summary">${esc(diagnosis.summary)}</p><ul class="row g-3 list-unstyled mt-1 mb-0">${reasons}</ul><p class="no-match-guidance">${esc(diagnosis.guidance)}</p>`;
    } else $('emptyState').textContent = issue || '目前尚無可核對的標準配對資料，請查看產品型錄。';
    const query = Selector.queryFor(state);
    Object.entries(selected).forEach(([key, value]) => { if (value) query.set(`${key}Tool`, value); });
    history.replaceState(null, '', `${location.pathname}${query.size ? `?${query}` : ''}${location.hash}`);
  }

  function bindEvents() {
    $('jobForm').addEventListener('submit', event => event.preventDefault());
    $('jobForm').addEventListener('input', event => {
      if (!Selector.fields.includes(event.target.id)) return;
      // 孔徑／深度一改就重新推薦最短尺寸；其餘條件保留使用者明確選定的刀體。
      if (['diameter', 'depth'].includes(event.target.id) && number(state[event.target.id]) !== number(event.target.value)) {
        selected.sd = ''; selected.spd = '';
      }
      Selector.fields.forEach(key => { if ($(key)) state[key] = $(key).value; });
      render();
    });
    $('toolList').addEventListener('change', event => {
      if (!event.target.matches('.family-setup-select') || event.target.disabled) return;
      selected[event.target.dataset.family] = event.target.value;
      render();
    });
    $('exampleButton').addEventListener('click', () => {
      state = { ...Selector.defaults, diameter: '24', depth: '36', material: 'low_alloy_low' };
      Selector.fields.forEach(key => { if ($(key)) $(key).value = state[key]; });
      selected.sd = ''; selected.spd = ''; render();
    });
    $('resetButton').addEventListener('click', () => {
      state = { ...Selector.defaults }; selected.sd = ''; selected.spd = '';
      Selector.fields.forEach(key => { if ($(key)) $(key).value = state[key]; });
      render();
    });
  }

  Promise.allSettled([sharedComponent('header/header.html', 'header-placeholder'), sharedComponent('footer/footer.html', 'footer-placeholder')]);
  Promise.all(Object.entries(Selector.products).map(async ([key, product]) => {
    const [catalog, cutting] = await Promise.all(['catalog.json', 'cutting-data.json'].map(name => fetchJson(product.directory + 'data/' + name)));
    const core = key === 'sd' ? window.SuperDrillCore : window.SuperPowerDrillCore;
    return [key, { core, catalog: core.normalizeCatalog(catalog, cutting) }];
  })).then(entries => { packages = Object.fromEntries(entries); configure(); bindEvents(); render(); })
    .catch(error => { $('dataStatus').textContent = `${error.message}。請重新整理頁面，或查看型錄與資料說明。`; console.error(error); });
})();
