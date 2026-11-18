/* Super Power Drill 獨立互動：只載入本目錄的資料、照片、圖形與來源 PDF。 */
(() => {
  'use strict';
  const scriptRoot = new URL('.', document.currentScript.src);
  const dataRoot = new URL('data/', scriptRoot);
  const siteRoot = new URL('../../', scriptRoot);
  const Core = window.SuperPowerDrillCore;
  const Locale = window.SuperPowerDrillLocale;
  const lang = Locale.normalize(new URLSearchParams(location.search).get('lang'));
  const t = text => Locale.translate(text, lang);
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant';
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  const number = value => {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const normalized = String(value).trim().replace(/[−－]/g, '-').replace(/＋/g, '+');
    return Number.isFinite(Number(normalized)) ? Number(normalized) : null;
  };
  const fmt = (value, decimals = 2) => Number.isFinite(value) ? value.toLocaleString('zh-TW', { maximumFractionDigits: decimals }) : '—';
  const sourceHref = page => `${new URL('sources/Super_Power_Drill_p128-135.pdf', scriptRoot)}#page=${Number.isInteger(page) && page >= 128 && page <= 135 ? page - 127 : 1}`;
  const sourceLink = page => `<a href="${sourceHref(page)}" target="_blank" rel="noopener">型錄 p${page} ↗</a>`;
  const product = { name: 'Super Power Drill', eyebrow: 'SPD · 中心導引＋外刃', title: '長孔鑽削，先配好整組刀具。', intro: '從孔徑與深度找刀體，分開配對中心刀片、外刃及內冷條件。' };
  const applications = { regular_surface: '一般平面', cross_holes: '交叉孔', stack_drilling: '疊板鑽孔', round_offset: '圓形工件偏心鑽孔', plunge: '插銑／下鑽', concave: '凹面', angled: '斜面', cone_offset: '錐形工件偏心鑽孔' };
  const jobFields = ['diameter', 'toleranceUpper', 'toleranceLower', 'depth', 'material', 'shank', 'machineMode', 'application', 'coolant', 'pressure', 'machineMax'];
  const defaults = { diameter: '', toleranceUpper: '', toleranceLower: '', depth: '', material: '', shank: '', machineMode: 'rotating', application: 'regular_surface', coolant: 'unknown', pressure: '', machineMax: '' };
  let catalog, state = { ...defaults }, selectedId = '', valuesMode = 'median', candidates = [], activeTool = null, activeCutting = null, activeCalculation = null;

  async function fetchJson(name) {
    const response = await fetch(new URL(name, dataRoot));
    if (!response.ok) throw new Error(`型錄資料載入失敗：${name}`);
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
    button.setAttribute('aria-label', t('開啟選單'));
    button.addEventListener('click', () => {
      const opened = nav.classList.toggle('active');
      button.setAttribute('aria-expanded', String(opened));
    });
  }

  // 僅翻譯本工具主內容與尺寸 dialog，不處理全站或其他產品 DOM。
  function refreshLocale() {
    Locale.renderScoped($('main-content'), lang);
    Locale.renderScoped($('diagramDialog'), lang);
    document.title = t(document.title);
  }
  function refreshLanguageLinks() {
    const query = queryFor(selectedId);
    const switchUrl = new URL('index.html', scriptRoot);
    switchUrl.search = query.toString();
    switchUrl.searchParams.set('lang', lang === 'en' ? 'zh-TW' : 'en');
    switchUrl.hash = location.hash;
    $('languageToggle').href = switchUrl.href;
    $('languageToggle').textContent = lang === 'en' ? '繁體中文' : 'English';
    document.querySelectorAll('[data-notes-link]').forEach(link => {
      const url = new URL('catalog-notes.html', scriptRoot);
      url.search = query.toString(); url.hash = link.dataset.notesLink || '';
      link.href = url.href;
    });
  }

  function configurePage() {
    $('pageEyebrow').textContent = product.eyebrow + ' · 鑽孔選型';
    $('pageTitle').textContent = product.title;
    $('pageIntro').textContent = product.intro;
    $('heroImage').innerHTML = `<img src="${new URL('assets/product.jpg', scriptRoot)}" alt="Super Power Drill 型錄實際產品圖"><span class="hero-image-caption">Ø19–40 mm · 表列 T100–350 mm</span>`;
    $('catalogLink').href = sourceHref(128);
    $('material').innerHTML = '<option value="">請選擇材料</option>' + catalog.materials.filter(material => Core.getMaterialSupport(catalog, material.id, lang).supported === true).map(material => `<option value="${esc(material.id)}">${esc(material.iso)} · ${esc(material.label_zh)}</option>`).join('');
    $('shank').innerHTML = '<option value="">不限／尚未確認</option><option value="32">Ø32 mm</option>';
    $('application').innerHTML = Object.entries(applications).map(([id, label]) => `<option value="${id}">${esc(label)}</option>`).join('');
    $('shankHelp').textContent = '本系列標準後端柄徑為 Ø32 mm。';
  }

  function restoreUrl() {
    const query = new URLSearchParams(location.search);
    // 舊網址的不適用材料保留於狀態，僅以隱藏停用項承接，不加入可選清單。
    const requestedMaterial = query.get('material');
    if (requestedMaterial && !Array.from($('material').options).some(option => option.value === requestedMaterial)) {
      const option = document.createElement('option');
      option.value = requestedMaterial;
      option.textContent = t('請選擇材料');
      option.hidden = true;
      option.disabled = true;
      $('material').appendChild(option);
    }
    jobFields.forEach(key => {
      if (query.has(key)) state[key] = query.get(key);
      if ($(key)) $(key).value = state[key];
    });
    // 用 DOM 的有效選項讀回，避免任意網址字串繞過選單。
    jobFields.forEach(key => { if ($(key)) state[key] = $(key).value; });
    selectedId = query.get('tool') || query.get('bar') || '';
    valuesMode = query.get('values') === 'manual' ? 'manual' : 'median';
    $('vc').value = valuesMode === 'manual' ? query.get('vc') || '' : '';
    $('feed').value = valuesMode === 'manual' ? query.get('feed') || '' : '';
  }

  function queryFor(toolId = '') {
    const query = new URLSearchParams();
    query.set('lang', lang);
    jobFields.forEach(key => {
      const value = state[key];
      if (value !== '' && value !== undefined && value !== defaults[key]) query.set(key, String(value));
    });
    if (toolId) query.set('tool', toolId);
    if (valuesMode === 'manual') {
      query.set('values', 'manual');
      if ($('vc').value !== '') query.set('vc', $('vc').value);
      if ($('feed').value !== '') query.set('feed', $('feed').value);
    }
    return query;
  }

  function updateUrl() {
    const query = queryFor(selectedId);
    history.replaceState(null, '', `${location.pathname}${query.size ? `?${query}` : ''}${location.hash}`);
    refreshLanguageLinks();
  }

  function currentJob() {
    return { ...state, lang, diameter: number(state.diameter), depth: number(state.depth), shank: number(state.shank), pressure: number(state.pressure), machineMax: number(state.machineMax), valuesMode };
  }

  function rangeText(value, unit) { return value ? `${fmt(value[0], 4)}–${fmt(value[1], 4)} ${unit}` : '尚無可套用範圍'; }
  function materialLabel() {
    const listed = catalog.materials.find(material => material.id === state.material);
    if (listed) return listed.label_zh;
    if (state.material === 'non_ferrous') return '非鐵金屬';
    if (state.material === 'heat_resistant') return '耐熱合金';
    return state.material ? '型錄未列材料' : '材料未選';
  }

  function validation() {
    if (state.diameter !== '' && !(number(state.diameter) > 0)) return '請輸入大於 0 的完成孔徑。';
    if (state.depth !== '' && !(number(state.depth) > 0)) return '請輸入大於 0 的鑽孔深度。';
    if (state.pressure !== '' && !(number(state.pressure) >= 0)) return '內冷壓力請填 0 或正數。';
    if (state.machineMax !== '' && !(number(state.machineMax) > 0)) return '機台最高轉速請填正數。';
    const upper = number(state.toleranceUpper), lower = number(state.toleranceLower);
    if ((state.toleranceUpper !== '' && upper === null) || (state.toleranceLower !== '' && lower === null)) return '公差請填帶正負號的數字，例如 +0.05、−0.02。';
    if (upper !== null && lower !== null && lower > upper) return '下偏差不可大於上偏差，請檢查公差。';
    if (number(state.diameter) > 0 && lower !== null && number(state.diameter) + lower <= 0) return '要求孔徑的下限必須大於 0。';
    return '';
  }

  function showTolerance() {
    const target = $('toleranceSummary');
    if (!target) return;
    const diameter = number(state.diameter), upper = number(state.toleranceUpper), lower = number(state.toleranceLower);
    target.textContent = diameter > 0 && upper !== null && lower !== null && lower <= upper ? `要求孔徑範圍：${fmt(diameter + lower, 4)}–${fmt(diameter + upper, 4)} mm；公差作為加工需求紀錄。` : '公差選填：上偏差／下偏差，單位 mm。';
  }

  function renderToolCards() {
    $('toolList').innerHTML = candidates.map(({ tool, eligibility, notes }) => `<label class="tool-choice"><input type="radio" name="tool" value="${esc(tool.id)}" ${selectedId === tool.id ? 'checked' : ''}><span class="tool-card ${selectedId === tool.id ? 'is-selected' : ''}"><span class="tool-family">${esc(product.name)}</span><strong class="tool-card-title">${esc(tool.id)}</strong><dl class="tool-facts"><div><dt>標準孔徑</dt><dd>Ø${fmt(tool.D)} mm</dd></div><div><dt>鑽孔深度 T</dt><dd>${fmt(tool.T)} mm</dd></div><div><dt>後端柄徑</dt><dd>Ø${fmt(tool.shank)} mm</dd></div></dl><span class="tool-bottom"><span class="match-tag ${eligibility}">${eligibility === 'blocked' ? '工況不適用' : eligibility === 'review' ? '尺寸符合・條件待補' : '尺寸與條件符合'}</span><span class="unit-muted">型錄 p${tool.sourcePage}</span></span>${eligibility === 'blocked' && notes[0] ? `<span class="cutting-note">${esc(notes[0])}</span>` : ''}</span></label>`).join('');
  }

  function clearSelection(message) {
    activeTool = null; activeCutting = null; activeCalculation = null;
    $('selectedFamily').textContent = product.eyebrow;
    $('selectedId').textContent = '先選好你的刀具';
    $('selectedStatus').textContent = '等待條件';
    $('selectedStatus').className = 'match-tag review';
    $('assemblySummary').innerHTML = `<p class="mb-0">${esc(message)}</p>`;
    $('cuttingSource').textContent = '選好材料與刀體後，顯示該列切削依據。';
    $('recommendationNotes').innerHTML = '';
    $('vcRange').textContent = '—'; $('feedRange').textContent = '—';
    $('vc').value = ''; $('feed').value = '';
    $('rpmResult').textContent = '—'; $('feedResult').textContent = '—';
    $('machineLimitNote').textContent = '';
    $('copyButton').disabled = true; $('medianButton').disabled = true;
    $('diagramCanvas').innerHTML = window.SuperPowerDrillDiagrams?.renderEmpty({ lang }) || '<p>選定料號後，顯示實際尺寸。</p>';
    $('diagramTitle').textContent = '選定刀體，查看尺寸';
    $('diagramSource').href = sourceHref(130);
    $('zoomDiagram').disabled = true;
    renderDepthClass(null, null);
  }

  // 分組是所選實體刀體的固定屬性，唯讀顯示核心計算結果，不從表單或網址取值。
  function renderDepthClass(tool, cutting) {
    $('spdDepthClassValue').textContent = cutting?.depthClass || (Number.isFinite(cutting?.depthRatio) ? 'T = 7D · 型錄未列資料列' : '待選刀體');
    $('spdDepthClassHelp').textContent = tool && Number.isFinite(cutting?.depthRatio)
      ? `T ${fmt(tool.T)} mm ÷ D ${fmt(tool.D)} mm = ${fmt(cutting.depthRatio, 6)}`
      : '依所選刀體的型錄鑽孔深度 T 與標準孔徑 D 自動計算。';
  }

  function renderAssembly(tool, cutting) {
    const items = [
      ['後端夾持', `Ø${fmt(tool.shank)} mm`],
      ['中心導引', `${tool.centerModel} · ${cutting.centerGrade || '待選切削列'} ×${tool.centerQty}`],
      ['外刃', `${tool.peripheryModel} · ${cutting.peripheryGrade || '待選切削列'} ×${tool.peripheryQty}`],
      ['外刃螺絲／扭矩', `${tool.raw.periphery_insert_as_listed.screw} · ${tool.raw.periphery_insert_as_listed.torque_Nm} Nm`]
    ];
    $('assemblySummary').innerHTML = `<ol class="assembly-steps list-unstyled">${items.map(([label, value], index) => `<li><span class="assembly-index">${index + 1}</span><div><span>${esc(label)}</span><strong>${esc(value)}</strong></div></li>`).join('')}</ol>`;
  }

  function renderSelected() {
    const candidate = candidates.find(item => item.tool.id === selectedId);
    if (!candidate) return clearSelection('先輸入完成孔徑與需求深度，選擇符合的標準刀體。');
    const tool = candidate.tool;
    const cutting = Core.selectCutting(catalog, tool, currentJob());
    activeTool = tool; activeCutting = cutting;
    renderDepthClass(tool, cutting);
    $('selectedFamily').textContent = product.name;
    $('selectedId').textContent = tool.id;
    $('selectedStatus').textContent = cutting.status === 'blocked' ? '工況不適用' : cutting.vcRange && cutting.feedRange ? (cutting.status === 'review' || candidate.eligibility === 'review' ? '條件式參考' : '切削條件已配對') : '補充加工條件';
    $('selectedStatus').dataset.status = cutting.status;
    $('selectedStatus').className = `match-tag ${cutting.status === 'blocked' ? 'blocked' : cutting.status === 'ready' && candidate.eligibility === 'ready' ? 'ready' : 'review'}`;
    renderAssembly(tool, cutting);
    $('cuttingSource').innerHTML = cutting.sourcePage ? `${esc(materialLabel())} · ${cutting.depthClass ? t('自動採用') + ' ' + esc(cutting.depthClass) : t('無可套用資料列')} · ${sourceLink(cutting.sourcePage)}` : '請補齊材料與刀體資料。';
    const notes = [...new Set([...candidate.notes, ...cutting.notes])];
    if (!number(state.shank)) {
      notes.push(`尚未確認機台可夾持的柄徑；這支刀體需要 Ø${fmt(tool.shank)} mm 後端夾持。`);
      if (cutting.vcRange && cutting.feedRange && cutting.status !== 'blocked') {
        $('selectedStatus').textContent = '切削已配對・夾持待確認';
        $('selectedStatus').className = 'match-tag review';
      }
    }
    if (tool.D >= 30 && tool.D <= 34) notes.push('此刀徑的螺絲在刀體表為 NS-22055、刀片表為 NS-22062；備料前請原廠確認。');
    if (tool.id === '00-99307-39300') notes.push('此料號 L=346 mm 依原表保留，尺寸疑點待原廠確認。');
    $('recommendationNotes').innerHTML = notes.length ? `<div class="cutting-note"><ul class="mb-0 ps-3">${notes.slice(0, 2).map(note => `<li>${esc(note)}</li>`).join('')}</ul>${notes.length > 2 ? `<details class="mt-2"><summary>其他條件說明（${notes.length - 2}）</summary><ul class="mb-0 ps-3">${notes.slice(2).map(note => `<li>${esc(note)}</li>`).join('')}</ul></details>` : ''}</div>` : '<p class="cutting-note is-positive">材料、刀體與型錄切削列已配對。</p>';
    $('vcRange').textContent = rangeText(cutting.vcRange || cutting.baseVcRange, 'm/min');
    $('feedRange').textContent = rangeText(cutting.feedRange || cutting.baseFeedRange, 'mm/rev');
    const hasRanges = cutting.vcRange && cutting.feedRange;
    $('medianButton').disabled = !hasRanges || cutting.status === 'blocked';
    if (valuesMode === 'median') {
      $('vc').value = hasRanges ? String(Number(((cutting.vcRange[0] + cutting.vcRange[1]) / 2).toFixed(4))) : '';
      $('feed').value = hasRanges ? String(Number(((cutting.feedRange[0] + cutting.feedRange[1]) / 2).toFixed(5))) : '';
    }
    $('diagramTitle').textContent = `${tool.id} · 尺寸圖`;
    $('diagramCanvas').innerHTML = window.SuperPowerDrillDiagrams?.renderTool(tool, { diameter: number(state.diameter), lang }) || '';
    $('diagramSource').href = sourceHref(tool.sourcePage);
    $('zoomDiagram').disabled = false;
    renderCalculation();
  }

  function renderCalculation() {
    const materialSupport = Core.getMaterialSupport(catalog, state.material, lang);
    const blocked = !activeTool || materialSupport.supported !== true || activeCutting?.status === 'blocked' || Boolean(validation());
    activeCalculation = blocked ? null : Core.calculate({ D: activeTool.D, vc: number($('vc').value), feed: number($('feed').value), machineMax: number(state.machineMax) });
    const manualOnly = valuesMode === 'manual' && !(activeCutting?.vcRange && activeCutting?.feedRange);
    $('rpmResult').textContent = activeCalculation ? fmt(activeCalculation.rpm, 0) : '—';
    $('feedResult').textContent = activeCalculation ? fmt(activeCalculation.feedRate, 1) : '—';
    const outside = activeCutting?.vcRange && number($('vc').value) > 0 && (number($('vc').value) < activeCutting.vcRange[0] || number($('vc').value) > activeCutting.vcRange[1]);
    const outsideFeed = activeCutting?.feedRange && number($('feed').value) > 0 && (number($('feed').value) < activeCutting.feedRange[0] || number($('feed').value) > activeCutting.feedRange[1]);
    $('machineLimitNote').textContent = activeCalculation ? [activeCalculation.capped ? `已依機台最高 ${fmt(number(state.machineMax), 0)} rpm 限速，進給同步更新。` : '', valuesMode === 'median' ? '網站起始中值・可調整；未乘刀片數。' : manualOnly ? '手動試算，非型錄推薦；材料或切削條件尚未完整。' : '使用你輸入的切速與每轉進給。', outside || outsideFeed ? '手動值超出該列範圍，請核對。' : ''].filter(Boolean).join(' ') : blocked ? '目前工況不適用，請先調整上方條件。' : '選好切削條件或手動填入正數 Vc 與 f，可計算轉速及進給。';
    if (activeCalculation && manualOnly) {
      $('selectedStatus').textContent = '手動試算・非型錄推薦';
      $('selectedStatus').className = 'match-tag review';
    }
    $('copyButton').disabled = !activeCalculation;
    refreshLocale();
  }

  function render() {
    showTolerance();
    const issue = validation();
    const complete = number(state.diameter) > 0 && number(state.depth) > 0;
    const materialSupport = Core.getMaterialSupport(catalog, state.material, lang);
    const materialReason = materialSupport.supported === false ? materialSupport.note : '';
    $('vc').disabled = materialSupport.supported !== true;
    $('feed').disabled = materialSupport.supported !== true;
    candidates = issue ? [] : Core.filterTools(catalog, currentJob());
    const summary = [number(state.diameter) > 0 ? `Ø${fmt(number(state.diameter), 4)} mm` : '孔徑未填', number(state.depth) > 0 ? `深 ${fmt(number(state.depth))} mm` : '深度未填', materialLabel(), number(state.shank) ? `後柄 Ø${fmt(number(state.shank))} mm` : '後柄不限'].join(' · ');
    $('resultSummary').textContent = materialReason || issue || summary;
    $('dataStatus').textContent = materialReason || issue || (complete ? '已依輸入條件篩選標準規格。' : '先填孔徑與深度；材料、柄徑可接著補齊。');
    $('copyStatus').textContent = '';
    if (materialReason) {
      selectedId = '';
      $('resultCount').textContent = '此材料不提供推薦';
      $('toolList').innerHTML = '';
      $('emptyState').hidden = false;
      $('emptyState').textContent = materialReason;
      clearSelection(materialReason);
      $('selectedStatus').textContent = '材料不適用';
      $('selectedStatus').dataset.status = 'blocked';
      $('selectedStatus').className = 'match-tag blocked';
    } else if (!complete || issue) {
      $('resultCount').textContent = '等待孔徑與深度';
      $('toolList').innerHTML = '';
      $('emptyState').hidden = false;
      $('emptyState').textContent = issue || '先輸入你要加工的孔徑與深度，或載入範例看看。';
      clearSelection(issue || '孔徑與深度填好後，會在這裡配對標準刀體。');
    } else {
      candidates.sort((a, b) => a.tool.T - b.tool.T || a.tool.id.localeCompare(b.tool.id));
      if (!candidates.some(candidate => candidate.tool.id === selectedId)) {
        selectedId = (candidates.find(candidate => candidate.eligibility !== 'blocked') || candidates[0])?.tool.id || '';
        valuesMode = 'median';
      }
      $('resultCount').textContent = `${candidates.length} 個刀體尺寸符合`;
      $('emptyState').hidden = candidates.length > 0;
      $('emptyState').textContent = '沒有符合的標準規格。請確認精確孔徑、需求深度與後端柄徑，或回到鑽孔篩選調整條件。';
      renderToolCards();
      renderSelected();
    }
    updateUrl();
    document.querySelectorAll('[data-hub-link]').forEach(link => {
      const url = new URL('Machining/Drilling/index.html', siteRoot);
      const query = queryFor();
      if (selectedId) query.set('spdTool', selectedId);
      url.search = query.toString();
      link.href = url.href;
    });
    refreshLocale();
  }

  function bindEvents() {
    $('jobForm').addEventListener('submit', event => event.preventDefault());
    // 加工需求異動時重算選型；深度分組由所選刀體固定計算。
    document.addEventListener('input', event => {
      if (!jobFields.includes(event.target.id)) return;
      jobFields.forEach(key => { if ($(key)) state[key] = $(key).value; });
      valuesMode = 'median';
      render();
    });
    $('toolList').addEventListener('change', event => {
      if (event.target.name !== 'tool') return;
      selectedId = event.target.value; valuesMode = 'median'; render();
    });
    ['vc', 'feed'].forEach(id => $(id).addEventListener('input', () => { valuesMode = 'manual'; renderCalculation(); updateUrl(); }));
    $('medianButton').addEventListener('click', () => { valuesMode = 'median'; renderSelected(); updateUrl(); });
    $('exampleButton').addEventListener('click', () => {
      state = { ...defaults, diameter: '25', depth: '100', material: 'carbon_low', shank: '32', coolant: 'yes', pressure: '20' };
      jobFields.forEach(key => { if ($(key)) $(key).value = state[key]; });
      selectedId = ''; valuesMode = 'median'; render();
    });
    $('resetButton').addEventListener('click', () => {
      state = { ...defaults }; selectedId = ''; valuesMode = 'median';
      jobFields.forEach(key => { if ($(key)) $(key).value = state[key]; });
      render();
    });
    $('copyButton').addEventListener('click', async () => {
      if (!activeTool || !activeCalculation) return;
      const text = [
        `${product.name} 鑽孔設定`,
        `取值方式：${valuesMode === 'median' ? '網站起始中值，可調整' : !(activeCutting.vcRange && activeCutting.feedRange) ? '手動試算，非型錄推薦；材料或切削條件尚未完整' : '使用者手動設定'}`,
        `完成孔徑 Ø${state.diameter} mm；上偏差 ${state.toleranceUpper || '未填'} mm；下偏差 ${state.toleranceLower || '未填'} mm`,
        `需求深度 ${state.depth} mm；材料 ${materialLabel()}；${applications[state.application]}`,
        `SPD 切削表分組：${activeCutting.depthClass || t('無可套用資料列')} · ${t('自動判定')} · T ${fmt(activeTool.T)} mm ÷ D ${fmt(activeTool.D)} mm = ${fmt(activeCutting.depthRatio, 6)}`,
        `刀體 ${activeTool.id}；表列 T${activeTool.T} mm；後柄 Ø${activeTool.shank} mm`,
        $('assemblySummary').innerText.trim(),
        `Vc ${$('vc').value} m/min；f ${$('feed').value} mm/rev`,
        `S ${fmt(activeCalculation.rpm, 0)} rpm；F ${fmt(activeCalculation.feedRate, 1)} mm/min`,
        `供液：${state.coolant === 'yes' ? '有內冷' : state.coolant === 'no' ? '無內冷' : '未確認'}${state.pressure !== '' ? ` ${state.pressure} bar` : ''}`,
        `來源：${sourceHref(activeCutting.sourcePage || activeTool.sourcePage)}`,
        '需求深度不等於程式刀尖 Z；此頁不自動產生程式深度。',
        $('recommendationNotes').innerText.trim()
      ].filter(Boolean).join('\n');
      try { await navigator.clipboard.writeText(t(text)); $('copyStatus').textContent = '已複製選型與切削設定。'; }
      catch { $('copyStatus').textContent = '瀏覽器未允許複製，請選取右側設定內容。'; }
      refreshLocale();
    });
    $('zoomDiagram').addEventListener('click', () => {
      if (!activeTool) return;
      $('dialogTitle').textContent = activeTool.id;
      $('dialogCanvas').innerHTML = window.SuperPowerDrillDiagrams.renderTool(activeTool, { diameter: number(state.diameter), lang });
      $('diagramDialog').showModal();
    });
    $('closeDiagram').addEventListener('click', () => $('diagramDialog').close());
    $('diagramDialog').addEventListener('click', event => { if (event.target === $('diagramDialog')) $('diagramDialog').close(); });
  }

  Promise.allSettled([sharedComponent('header/header.html', 'header-placeholder'), sharedComponent('footer/footer.html', 'footer-placeholder')]);
  Promise.all(['catalog.json', 'cutting-data.json'].map(fetchJson))
    .then(([productCatalog, cutting]) => {
      catalog = Core.normalizeCatalog(productCatalog, cutting);
      configurePage(); restoreUrl(); bindEvents(); render();
    })
    .catch(error => {
      $('dataStatus').textContent = t(`${error.message}。請重新整理頁面，或查看型錄與資料說明。`);
      console.error(error);
    });
})();
