(() => {
  'use strict';
  const NC = window.NCProgram, Core = window.ThreadMotion, Diagrams = window.ThreadDiagrams;
  const $ = id => document.getElementById(id);
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fixed = (v, places = 3) => Number(v).toFixed(places);
  const compact = v => String(Number(Number(v).toFixed(3)));
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const state = { selection: 'thread', standard: 'M', size: 'M 7 x 1.0', insert: 'R06005-05010', time: 0, playing: !reducedMotion.matches, motion: null, code: '', request: null, lastFrame: null };
  const phases = document.querySelectorAll('[data-phase]');
  const passes = { 1: [100], 2: [60, 100], 3: [50, 80, 100] };
  const numericFields = ['depth', 'vc', 'fz', 'teeth', 'centerX', 'centerY', 'safeZ', 'surfaceZ', 'toolNumber'];

  function option(value, label, selected) { return `<option value="${escapeHTML(value)}"${selected ? ' selected' : ''}>${escapeHTML(label)}</option>`; }
  function setText(id, text) { $(id).textContent = text; }
  function renderSelection() {
    const owned = state.selection === 'insert';
    $('ownedInsertField').hidden = !owned;
    document.querySelectorAll('[data-selection]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.selection === state.selection)));
    $('ownedInsert').innerHTML = Object.values(NC.toolGroups).flat().map(item => option(item.v, `${item.v} · Ø${compact(NC.getDcFromTool(item.v))}`, item.v === state.insert)).join('');
    const allowed = Core.standards.filter(standard => Core.getSizes(standard.id, owned ? state.insert : null).length);
    if (!allowed.some(s => s.id === state.standard)) state.standard = allowed[0].id;
    $('standardButtons').innerHTML = Core.standards.map(standard => `<button type="button" data-standard="${standard.id}" aria-pressed="${standard.id === state.standard}" title="${escapeHTML(standard.label)}"${allowed.includes(standard) ? '' : ' disabled'}>${standard.id}</button>`).join('');
    const sizes = Core.getSizes(state.standard, owned ? state.insert : null);
    if (!sizes.includes(state.size)) state.size = sizes[0];
    $('threadSize').innerHTML = sizes.map(key => option(key, key.replace(/ x /g, ' × '), key === state.size)).join('');
    const inserts = Core.getInserts(state.standard, state.size);
    if (!inserts.some(item => item.v === state.insert)) state.insert = inserts[0].v;
    $('ownedInsert').value = state.insert;
    const shown = owned ? inserts.filter(item => item.v === state.insert) : inserts;
    $('insertChoices').innerHTML = shown.map((item, index) => `<button type="button" class="insert-choice" data-insert="${escapeHTML(item.v)}" aria-pressed="${item.v === state.insert}">${Diagrams.insertIcon(index)}<span><strong>${escapeHTML(item.v)}</strong><small>刀徑 Ø${compact(NC.getDcFromTool(item.v))} mm</small></span><span class="selection-tick" aria-hidden="true">${item.v === state.insert ? '✓' : ''}</span></button>`).join('');
    setText('insertCount', `${shown.length} 款${owned ? '已選刀片' : '可選'}`);
    const standard = Core.standardFor(state.standard), data = NC.threadData[state.size];
    setText('threadKind', `${standard.family.startsWith('tapered') ? '錐牙' : '平行牙'} · ${standard.angle}°`);
    setText('majorValue', `${compact(data.MajorDiameter)} mm`);
    setText('pitchValue', `${compact(data.Pitch)} mm`);
    setText('fitHint', NC.getDcFromTool(state.insert) === data.TapDrillDiameter ? '刀徑等於資料表下孔徑，需確認實際進刀間隙。' : '依現有 Thread Milling 資料配對。');
  }

  function setDepthPreset() { $('depth').value = compact(NC.calculateAutoDepth({ threadSize: state.size, pitch: NC.threadData[state.size].Pitch })); }
  function restoreMaterial() {
    const preset = NC.getMaterialPreset($('material').value);
    $('vc').value = preset.vc; $('fz').value = preset.fz;
  }
  function readInput() {
    numericFields.forEach(id => $(id).removeAttribute('aria-invalid'));
    for (const id of numericFields) {
      if (!$(id).checkValidity() || $(id).value.trim() === '') {
        $(id).setAttribute('aria-invalid', 'true');
        throw new Error(`請檢查「${document.querySelector(`label[for="${id}"]`).textContent}」的數值範圍。`);
      }
    }
    const data = NC.threadData[state.size], standard = Core.standardFor(state.standard), toolDiameter = NC.getDcFromTool(state.insert);
    const rpm = NC.calculateSpindleSpeed({ toolDiameter, cuttingSpeed: Number($('vc').value) });
    const feed = NC.calculateFeedRate({ spindleSpeed: rpm, feedPerTooth: Number($('fz').value), teeth: Number($('teeth').value) });
    return { mode: standard.family.startsWith('tapered') ? 'tapered' : 'parallel', threadSize: state.size, toolNo: Number($('toolNumber').value), toolDiameter,
      od: data.MajorDiameter, tapDrill: data.TapDrillDiameter, pitch: data.Pitch, depth: Number($('depth').value), rpm, feed,
      safeRelative: Number($('safeZ').value) - Number($('surfaceZ').value), passPercents: passes[$('passCount').value],
      coordinate: { x: Number($('centerX').value), y: Number($('centerY').value), zSafe: Number($('safeZ').value), zSurface: Number($('surfaceZ').value), workOffset: $('workOffset').value } };
  }

  function renderCode(code) {
    // 先跳脫完整一行，再加入僅限固定格式的語法色彩；原始程式保留供複製與下載。
    $('ncCode').innerHTML = code.split('\n').map((line, index) => {
      const safe = escapeHTML(line);
      const content = line.startsWith('(') ? `<span class="nc-comment">${safe}</span>` : safe.replace(/\b([GM]\d+)/g, '<span class="nc-command">$1</span>').replace(/([XYZIJRFDH])(-?\d+(?:\.\d+)?)/g, '$1<span class="nc-number">$2</span>');
      return `<span class="code-line" data-line="${index + 1}">${content}</span>`;
    }).join('');
    setText('lineCount', `${code.split('\n').length} 行`);
  }

  function rebuild() {
    cancelAnimationFrame(state.request); state.request = null; state.lastFrame = null;
    try {
      const input = readInput(), motion = Core.build(input);
      // 明確保留產生器既有輸出；示意動畫不改寫 G41/G42 或控制器補正行為。
      const code = NC.generateGCode(input);
      state.motion = motion; state.code = code; state.time = 0;
      $('validationMessage').hidden = true;
      ['playButton', 'replayButton', 'progress', 'copyCode', 'downloadCode'].forEach(id => $(id).disabled = false);
      setText('selectedInsert', state.insert);
      setText('toolPitch', `Ø${fixed(input.toolDiameter, 1)} / P${fixed(input.pitch)}`);
      setText('directionValue', motion.tapered ? 'G02 ↻ 順時針' : 'G03 ↺ 逆時針');
      setText('zDirection', motion.tapered ? '由上往下 · Z−' : '由下往上 · Z+');
      setText('drillValue', `Ø ${fixed(input.tapDrill, 2)} mm`);
      setText('depthValue', `${compact(input.depth)} mm`);
      setText('turnsValue', `${compact(motion.turns)} 圈`);
      setText('angleValue', `${Core.standardFor(state.standard).angle}° / ${motion.tapered ? '1:16' : '平行'}`);
      setText('rpmValue', Math.round(input.rpm).toLocaleString('en-US'));
      setText('feedValue', fixed(input.feed, 1));
      setText('codeSummary', `${input.coordinate.workOffset} · T${input.toolNo} · ${motion.tapered ? 'G42 / G02' : 'G41 / G03'} · ${input.passPercents.length} 次加工`);
      setText('copyStatus', '現有 NC 產生器輸出');
      const preset = NC.getMaterialPreset($('material').value);
      setText('presetHint', Number($('vc').value) === preset.vc && Number($('fz').value) === preset.fz ? '已帶入材料建議值；刃數沿用原頁預設 6，可調整。' : '目前使用自訂切削值；可還原材料建議值。');
      const end = motion.points.findLast(q => q.phase === 'cut');
      setText('motionNote', `名義路徑示意；${motion.tapered ? '沿用現有錐牙每段 10° 的路徑' : '依現有產生器取完整圈數'}，螺旋終點 Z${fixed(end.z)}（相對工件表面）。播放速度獨立於加工時間。`);
      renderCode(code);
      Diagrams.prepare(motion, Core.standardFor(state.standard).angle);
      renderFrame(); syncPlayer(); schedule();
    } catch (error) {
      state.motion = null; state.code = '';
      $('validationMessage').hidden = false; setText('validationMessage', error.message);
      ['playButton', 'replayButton', 'progress', 'copyCode', 'downloadCode'].forEach(id => $(id).disabled = true);
      $('axialView').innerHTML = '<text x="240" y="175" text-anchor="middle" class="diagram-label">請先檢查加工設定</text>';
      $('radialView').innerHTML = '<text x="240" y="175" text-anchor="middle" class="diagram-label">有效設定後顯示刀路</text>';
      ['selectedInsert', 'toolPitch', 'directionValue', 'zDirection', 'drillValue', 'depthValue', 'turnsValue', 'angleValue', 'rpmValue', 'feedValue', 'positionX', 'positionY', 'positionZ', 'turnPosition', 'passPosition'].forEach(id => setText(id, '—'));
      setText('ncCode', '請先修正加工設定，再產生程式。'); setText('lineCount', ''); setText('codeSummary', '設定待修正');
      setText('copyStatus', ''); setText('motionStatus', '設定待修正'); $('motionStatus').dataset.state = 'paused';
      setText('progressValue', '0%'); $('progress').value = 0; setText('phaseLabel', '等待設定');
    }
  }

  function renderFrame() {
    if (!state.motion) return;
    const current = Diagrams.draw(state.time), p = state.motion.input;
    const progress = state.time / state.motion.duration;
    $('progress').value = Math.round(progress * 1000);
    $('progress').setAttribute('aria-valuetext', `${Math.round(progress * 100)}%，${Core.phaseLabels[current.phase]}`);
    setText('progressValue', `${Math.round(progress * 100)}%`);
    setText('phaseLabel', state.time >= state.motion.duration ? '加工完成' : Core.phaseLabels[current.phase]);
    setText('positionX', fixed(current.x + p.coordinate.x));
    setText('positionY', fixed(current.y + p.coordinate.y));
    setText('positionZ', fixed(current.z + p.coordinate.zSurface));
    setText('turnPosition', `${fixed(current.turn, 1)} / ${compact(state.motion.turns)}`);
    setText('passPosition', `第 ${current.pass} / ${p.passPercents.length} 次`);
    phases.forEach(item => item.classList.toggle('active', item.dataset.phase === current.phase));
  }
  function syncPlayer() {
    const done = state.motion && state.time >= state.motion.duration;
    $('playButton').setAttribute('aria-pressed', String(state.playing));
    $('playButton').querySelector('span').textContent = state.playing ? '暫停' : done ? '重播' : '播放';
    $('playButton').querySelector('svg').innerHTML = state.playing ? '<path d="M4 3h3v10H4zm5 0h3v10H9z"/>' : '<path d="M4 2.5v11l9-5.5z"/>';
    if (state.motion) { setText('motionStatus', state.playing ? '模擬播放中' : done ? '模擬完成' : '模擬已暫停'); $('motionStatus').dataset.state = state.playing ? 'playing' : 'paused'; }
  }
  function schedule() {
    if (state.playing && state.motion && !document.hidden && state.request == null) state.request = requestAnimationFrame(tick);
  }
  function tick(timestamp) {
    state.request = null;
    if (!state.playing || !state.motion || document.hidden) return;
    const dt = state.lastFrame == null ? 0 : Math.min((timestamp - state.lastFrame) / 1000, .1);
    state.lastFrame = timestamp;
    state.time = Math.min(state.motion.duration, state.time + dt * Number($('speed').value));
    renderFrame();
    if (state.time >= state.motion.duration) { state.playing = false; state.lastFrame = null; syncPlayer(); }
    else schedule();
  }
  function setPlaying(playing) {
    cancelAnimationFrame(state.request); state.request = null; state.lastFrame = null;
    state.playing = playing; syncPlayer(); schedule();
  }

  $('setupForm').addEventListener('submit', event => event.preventDefault());
  document.querySelectorAll('[data-selection]').forEach(button => button.addEventListener('click', () => { state.selection = button.dataset.selection; renderSelection(); rebuild(); }));
  $('standardButtons').addEventListener('click', event => {
    const button = event.target.closest('[data-standard]'); if (!button || button.disabled) return;
    state.standard = button.dataset.standard; renderSelection(); setDepthPreset(); rebuild();
  });
  $('threadSize').addEventListener('change', () => { state.size = $('threadSize').value; renderSelection(); setDepthPreset(); rebuild(); });
  $('ownedInsert').addEventListener('change', () => { state.insert = $('ownedInsert').value; renderSelection(); setDepthPreset(); rebuild(); });
  $('insertChoices').addEventListener('click', event => { const button = event.target.closest('[data-insert]'); if (!button) return; state.insert = button.dataset.insert; renderSelection(); rebuild(); });
  $('material').innerHTML = Core.materials.map(material => option(material.id, material.label, material.id === 'Material01')).join('');
  $('material').addEventListener('change', () => { restoreMaterial(); rebuild(); });
  $('restorePreset').addEventListener('click', () => { restoreMaterial(); rebuild(); });
  numericFields.forEach(id => $(id).addEventListener('input', rebuild));
  ['passCount', 'workOffset'].forEach(id => $(id).addEventListener('change', rebuild));
  $('playButton').addEventListener('click', () => { if (state.time >= state.motion.duration) { state.time = 0; renderFrame(); } setPlaying(!state.playing); });
  $('replayButton').addEventListener('click', () => { state.time = 0; renderFrame(); setPlaying(true); });
  $('progress').addEventListener('input', () => { state.time = Number($('progress').value) / 1000 * state.motion.duration; setPlaying(false); renderFrame(); });
  $('copyCode').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(state.code); setText('copyStatus', '已複製完整 NC 程式'); }
    catch { setText('copyStatus', '無法存取剪貼簿，請選取程式文字複製。'); }
  });
  $('downloadCode').addEventListener('click', () => {
    const blob = new Blob([state.code + '\n'], { type: 'text/plain;charset=utf-8' }), url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = `Nine9-${state.size.replace(/[^a-zA-Z0-9.-]+/g, '-')}.nc`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('resetSetup').addEventListener('click', () => {
    $('setupForm').reset(); Object.assign(state, { selection: 'thread', standard: 'M', size: 'M 7 x 1.0', insert: 'R06005-05010', playing: !reducedMotion.matches });
    $('material').value = 'Material01'; $('speed').value = '1'; renderSelection(); setDepthPreset(); restoreMaterial(); rebuild();
  });
  document.addEventListener('visibilitychange', () => { state.lastFrame = null; if (document.hidden) { cancelAnimationFrame(state.request); state.request = null; } else schedule(); });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) setPlaying(false); });
  renderSelection(); setDepthPreset(); restoreMaterial(); rebuild();
})();
