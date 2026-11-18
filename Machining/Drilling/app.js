/* 鑽孔分類頁只負責需求篩選與導流；計算、刀片及圖面由兩個產品各自維護。 */
(() => {
  'use strict';
  const scriptRoot = new URL('.', document.currentScript.src);
  const siteRoot = new URL('../../', scriptRoot);
  const Selector = window.DrillingSelector;
  // 對外預設英文；繁體中文只由網址明確指定，切換時保留目前的加工需求。
  const language = new URLSearchParams(location.search).get('lang') === 'zh-TW' ? 'zh-TW' : 'en';
  const chinese = language === 'zh-TW';
  const t = (zh, en) => chinese ? zh : en;
  document.documentElement.lang = chinese ? 'zh-Hant' : 'en';
  document.querySelectorAll('[data-zh]').forEach(element => { if (chinese) element.textContent = element.dataset.zh; });
  document.querySelectorAll('[data-zh-placeholder]').forEach(element => { if (chinese) element.placeholder = element.dataset.zhPlaceholder; });
  document.querySelectorAll('[data-zh-label]').forEach(element => { if (chinese) element.setAttribute('aria-label', element.dataset.zhLabel); });
  document.querySelectorAll('[data-zh-content]').forEach(element => { if (chinese) element.content = element.dataset.zhContent; });
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const number = Selector.number;
  const fmt = (value, decimals = 2) => Number.isFinite(value) ? value.toLocaleString(chinese ? 'zh-TW' : 'en-US', { maximumFractionDigits: decimals }) : '—';
  let packages, materials, state = { ...Selector.defaults };
  const selected = { sd: '', spd: '' };

  async function fetchJson(path) {
    const response = await fetch(new URL(path, siteRoot));
    if (!response.ok) throw new Error(t('型錄資料載入失敗', 'Could not load catalog data'));
    return response.json();
  }

  async function sharedComponent(path, target) {
    const response = await fetch(new URL(path, siteRoot));
    if (!response.ok) throw new Error(t('共用元件載入失敗', 'Could not load the shared component'));
    $(target).innerHTML = await response.text();
    if (target !== 'header-placeholder') return;
    const button = $('mobileMenuBtn'), nav = $('topNav');
    if (!button || !nav) return;
    button.innerHTML = '<svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M2 12a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 12m0-4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8m0-4a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 4"/></svg>';
    button.setAttribute('aria-controls', 'topNav');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', t('開啟選單', 'Open menu'));
    button.addEventListener('click', () => { button.setAttribute('aria-expanded', String(nav.classList.toggle('active'))); });
  }

  function configure() {
    // 只合併相同材料 ID，不讓分類頁另存兩產品的切削資料副本。
    materials = [...new Map(Object.values(packages).flatMap(entry => entry.catalog.materials).map(material => [material.id, material])).values()];
    $('material').innerHTML = `<option value="">${t('請選擇材料', 'Select material')}</option>` + materials.map(material => `<option value="${esc(material.id)}">${esc(material.iso)} · ${esc(chinese ? material.label_zh : material.catalog_label)}</option>`).join('') + `<option value="non_ferrous">${t('N · 非鐵金屬（不建議使用）', 'N · Non-ferrous metals (not recommended)')}</option><option value="heat_resistant">${t('S · 耐熱合金（無適用配對）', 'S · Heat-resistant alloys (no suitable pairing)')}</option>`;
    const query = new URLSearchParams(location.search);
    // 未知材料保留為不推薦狀態，不能因舊網址無對應選項就默默回到未選材料。
    const requestedMaterial = query.get('material');
    if (requestedMaterial && !Array.from($('material').options).some(option => option.value === requestedMaterial)) {
      const option = document.createElement('option');
      option.value = requestedMaterial; option.textContent = t('型錄未列材料（不提供推薦）', 'Unlisted material (no recommendation)');
      $('material').append(option);
    }
    Selector.fields.forEach(key => {
      if (query.has(key)) state[key] = query.get(key);
      if ($(key)) { $(key).value = state[key]; state[key] = $(key).value; }
    });
    selected.sd = query.get('sdTool') || '';
    selected.spd = query.get('spdTool') || '';
  }

  function validation() {
    if (state.diameter !== '' && !(number(state.diameter) > 0)) return t('請輸入大於 0 的完成孔徑。', 'Enter a finished hole diameter greater than 0.');
    if (state.depth !== '' && !(number(state.depth) > 0)) return t('請輸入大於 0 的鑽孔深度。', 'Enter a drilling depth greater than 0.');
    const upper = number(state.toleranceUpper), lower = number(state.toleranceLower);
    if ((state.toleranceUpper !== '' && upper === null) || (state.toleranceLower !== '' && lower === null)) return t('公差請填帶正負號的數字，例如 +0.05、−0.02。', 'Enter numeric tolerance deviations, such as +0.05 and −0.02.');
    if (upper !== null && lower !== null && lower > upper) return t('下偏差不可大於上偏差，請檢查公差。', 'The lower deviation must not exceed the upper deviation.');
    if (number(state.diameter) > 0 && lower !== null && number(state.diameter) + lower <= 0) return t('要求孔徑的下限必須大於 0。', 'The minimum required hole diameter must be greater than 0.');
    return '';
  }

  function render() {
    const issue = validation();
    const diameter = number(state.diameter), upper = number(state.toleranceUpper), lower = number(state.toleranceLower);
    $('toleranceSummary').textContent = diameter > 0 && upper !== null && lower !== null && lower <= upper ? t(`要求孔徑範圍：${fmt(diameter + lower, 4)}–${fmt(diameter + upper, 4)} mm；公差作為加工需求紀錄。`, `Required hole range: ${fmt(diameter + lower, 4)}–${fmt(diameter + upper, 4)} mm. Tolerances are recorded as job requirements.`) : t('公差選填：上偏差／下偏差，單位 mm。', 'Optional tolerance: upper / lower deviation in mm.');
    const specialName = state.material === 'non_ferrous' ? t('非鐵金屬', 'Non-ferrous metals') : state.material === 'heat_resistant' ? t('耐熱合金', 'Heat-resistant alloys') : '';
    const material = materials.find(item => item.id === state.material)?.[chinese ? 'label_zh' : 'catalog_label'] || specialName || (state.material ? t('型錄未列材料', 'Unlisted material') : t('材料未選', 'Material not selected'));
    $('resultSummary').textContent = issue || [diameter > 0 ? `Ø${fmt(diameter, 4)} mm` : t('孔徑未填', 'Diameter not entered'), number(state.depth) > 0 ? t(`深 ${fmt(number(state.depth))} mm`, `${fmt(number(state.depth))} mm deep`) : t('深度未填', 'Depth not entered'), material].join(' · ');
    $('dataStatus').textContent = issue || (diameter > 0 && number(state.depth) > 0 ? t('已依孔徑、深度與材料適用性篩選，優先推薦最短可用刀體。', 'Filtered by diameter, depth and material suitability. The shortest suitable body is recommended first.') : t('先填孔徑與深度；材料可接著補齊。', 'Enter the hole diameter and depth first. You can add the material next.'));
    const groups = issue ? [] : Selector.selectFamilies(packages, state, selected, language);
    $('recommendationSummary').hidden = groups.length === 0;
    if (!issue && groups.length === 0) $('dataStatus').textContent = t('目前沒有符合需求的標準刀具，原因如下。', 'No standard tool meets these requirements. See the reasons below.');
    const filtering = ['diameter', 'depth', 'material'].some(key => state[key] !== '');
    const preferred = groups.find(group => group.recommended);
    $('recommendationSummary').textContent = preferred ? t(`優先推薦 ${preferred.product.name}${preferred.chosen.tool.ratio ? ` ${preferred.chosen.tool.ratio}D` : ''} · ${preferred.chosen.tool.id}：可鑽深 T${fmt(preferred.chosen.tool.T)} mm，為符合需求的最短尺寸。`, `Recommended: ${preferred.product.name}${preferred.chosen.tool.ratio ? ` ${preferred.chosen.tool.ratio}D` : ''} · ${preferred.chosen.tool.id}. Drilling depth T${fmt(preferred.chosen.tool.T)} mm — the shortest size that meets your requirements.`) : t('依型錄可鑽深 T 由短到長排列，優先選擇滿足需求深度的最短刀體。', 'Bodies are sorted by catalog drilling depth T. Choose the shortest body that meets your required depth.');
    $('resultCount').textContent = diameter > 0 && number(state.depth) > 0 ? t(`${groups.filter(group => group.canSelect).length} 個系列可選 · ${groups.reduce((sum, group) => sum + group.matching.length, 0)} 個刀體尺寸符合`, `${groups.filter(group => group.canSelect).length} selectable ${groups.filter(group => group.canSelect).length === 1 ? 'family' : 'families'} · ${groups.reduce((sum, group) => sum + group.matching.length, 0)} matching bodies`) : t(`${groups.length} 個鑽孔系列 · 先填孔徑與深度`, `${groups.length} drill families · Enter diameter and depth first`);
    $('toolList').innerHTML = groups.map(({ key, product, matching, chosen, shortest, recommended, canSelect, selectionNote }) => {
      const tool = chosen.tool;
      selected[key] = tool.id;
      const status = filtering ? chosen.eligibility : 'ready';
      const options = matching.map(({ tool: option }) => `<option value="${esc(option.id)}" ${option.id === tool.id ? 'selected' : ''}>${option.id === shortest.tool.id ? t('最短尺寸 · ', 'Shortest · ') : ''}${esc(option.id)} · Ø${fmt(option.D)}${option.ratio ? ` · ${option.ratio}D` : ''} · T${fmt(option.T)} · ${t('柄', 'Shank ')}Ø${fmt(option.shank)}</option>`).join('');
      const meta = tool.ratio ? `${tool.ratio}D · ${esc(tool.insertModel)} · NC2032` : t(`中心 ${esc(tool.centerModel)} ×${tool.centerQty}／外刃 ${esc(tool.peripheryModel)} ×${tool.peripheryQty}`, `Center ${esc(tool.centerModel)} ×${tool.centerQty} / Periphery ${esc(tool.peripheryModel)} ×${tool.peripheryQty}`);
      const pdf = new URL(product.directory + 'sources/' + product.pdf, siteRoot);
      // 停用系列不輸出選型網址，並使用原生 disabled 控制，鍵盤操作也無法誤選。
      const action = canSelect ? `<a class="btn ${recommended ? 'btn-brand' : 'btn-tool'} m-0" href="${esc(Selector.productUrl(siteRoot, key, state, tool, language))}">${recommended ? t('使用推薦刀體', 'Use recommended body') : t('帶入這支刀體', 'Use this body')} <span aria-hidden="true">→</span></a>` : `<button type="button" class="btn btn-tool m-0" disabled aria-describedby="hub-${key}-availability">${t('暫不開放選用', 'Selection unavailable')}</button>`;
      const note = selectionNote || (filtering ? chosen.notes[0] || t('尺寸與已填條件符合，進入產品頁取得切削設定。', 'The dimensions and entered conditions match. Continue to the product tool for cutting settings.') : t('先填寫孔徑與深度，開始選型。', 'Enter diameter and depth to start selecting.'));
      return `<article class="finder-family-card${recommended ? ' is-recommended' : ''}${!canSelect ? ' is-unavailable' : ''}"><div class="finder-card-heading"><span class="finder-family-icon"><img src="${new URL('img/drilling.png', siteRoot)}" alt=""></span><div><span class="tool-family">${esc(product.eyebrow)}</span><h3>${esc(product.name)}</h3>${recommended ? `<span class="recommendation-tag">${t('最短尺寸・優先推薦', 'Shortest · Recommended')}</span>` : ''}</div></div><p class="family-note">${esc(product.note)}</p><span class="match-tag ${canSelect ? esc(status) : 'unavailable'}">${t(`${matching.length} 個${filtering ? '刀體尺寸符合' : '標準刀體'}${!canSelect ? '・暫不開放' : ''}`, `${matching.length} ${filtering ? 'matching' : 'standard'} ${matching.length === 1 ? 'body' : 'bodies'}${!canSelect ? ' · Unavailable' : ''}`)}</span><label class="form-label mt-3" for="hub-${key}-tool">${t('符合條件的刀體', 'Matching body')}</label><select class="form-select family-setup-select" id="hub-${key}-tool" data-family="${key}"${!canSelect ? ` disabled aria-describedby="hub-${key}-availability"` : ''}>${options}</select><p class="family-selected-spec">Ø${fmt(tool.D)} mm · ${t('可鑽深', 'Drilling depth')} T${fmt(tool.T)} mm · ${t('後柄', 'Shank')} Ø${fmt(tool.shank)} mm</p><p class="family-setup-meta">${meta} · ${t('型錄', 'Catalog')} p${tool.sourcePage}</p><p class="family-note" id="hub-${key}-availability">${esc(note)}</p><div class="finder-family-action">${action}<a class="family-catalog-link" href="${pdf}" target="_blank" rel="noopener">${t('產品型錄 PDF', 'Product catalog PDF')} ↗</a></div></article>`;
    }).join('');
    $('emptyState').hidden = groups.length > 0;
    const diagnosis = !issue && groups.length === 0 ? Selector.explainNoMatch(packages, state, language) : null;
    $('emptyState').classList.toggle('no-match-explanation', Boolean(diagnosis));
    if (diagnosis) {
      if (diagnosis.families.some(item => item.reason === 'material')) $('resultCount').textContent = t('0 個材料適用系列', '0 material-compatible families');
      // 數值與型錄頁碼皆由各系列實際料號產生；缺資料不補上推估值。
      const reasons = diagnosis.families.map(item => {
        const product = Selector.products[item.key];
        const source = new URL(product.directory + 'sources/' + product.pdf, siteRoot);
        if (item.sourcePage) source.hash = `page=${item.sourcePage - product.firstPage + 1}`;
        return `<li class="col-12 col-md-6"><strong>${esc(item.name)}</strong><p class="mt-1 mb-0">${esc(item.message)}</p><a class="family-catalog-link" href="${esc(source.href)}" target="_blank" rel="noopener">${item.sourcePage ? `${t('型錄', 'Catalog')} p${item.sourcePage}` : t('產品型錄 PDF', 'Product catalog PDF')} ↗</a></li>`;
      }).join('');
      $('emptyState').innerHTML = `<h3>${esc(diagnosis.title)}</h3><p class="no-match-summary">${esc(diagnosis.summary)}</p><ul class="row g-3 list-unstyled mt-1 mb-0">${reasons}</ul><p class="no-match-guidance">${esc(diagnosis.guidance)}</p>`;
    } else $('emptyState').textContent = issue || t('目前尚無可核對的標準配對資料，請查看產品型錄。', 'No verified standard pairing is available. Please refer to the product catalog.');
    const query = Selector.queryFor(state);
    if (chinese) query.set('lang', 'zh-TW');
    const alternate = new URL(location.href);
    alternate.search = query.toString();
    if (chinese) alternate.searchParams.delete('lang'); else alternate.searchParams.set('lang', 'zh-TW');
    Object.entries(selected).forEach(([key, value]) => { if (value) alternate.searchParams.set(`${key}Tool`, value); });
    $('languageSwitch').href = alternate.href;
    $('languageSwitch').textContent = chinese ? 'English' : '繁體中文';
    $('languageSwitch').setAttribute('lang', chinese ? 'en' : 'zh-Hant');
    $('languageSwitch').setAttribute('hreflang', chinese ? 'en' : 'zh-Hant');
    document.querySelectorAll('a[data-language-link]').forEach(link => { const url = new URL(link.href); if (chinese) url.searchParams.set('lang', 'zh-TW'); else url.searchParams.delete('lang'); link.href = url.href; });
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
    .catch(error => { $('dataStatus').textContent = `${error.message}${t('。請重新整理頁面，或查看型錄與資料說明。', '. Reload the page or refer to the catalog notes.')}`; console.error(error); });
})();
