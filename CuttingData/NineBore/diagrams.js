(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.NINEBORE_DIAGRAMS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // 所有圖形皆為固定座標的概念示意；不從零件 L 推算總成伸出或可加工深度。
  const COLORS = Object.freeze({ blue: '#0067ad', orange: '#f05a1a', ink: '#0c2237', pale: '#edf7fc', steel: '#d7e3ec', hatch: '#b2bcc5' });
  const SERIES = Object.freeze({ general: ['99101', '99121'], depth: ['99146', '99151'] });

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }

  // 拒絕空字串、非十進位、無限值及非正數；不讓輸入進入 SVG 的座標或屬性。
  function positiveNumber(value) {
    if (typeof value !== 'number' && typeof value !== 'string') return null;
    if (typeof value === 'string' && !/^[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) return null;
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  function numberText(number) {
    const text = String(number);
    // 極端輸入用近似科學記號避免溢出；完整數值仍保留於無障礙描述。
    return text.length > 12 ? '≈' + number.toExponential(4) : text;
  }

  function millimetres(number) {
    return number === null ? 'not set' : numberText(number) + ' mm';
  }

  function objectOrEmpty(value) {
    return value && typeof value === 'object' ? value : {};
  }

  function stringValue(value) {
    return typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  }

  function partLabel(component, fallback) {
    if (typeof component === 'string' && component.trim()) return component;
    const part = objectOrEmpty(component);
    const fields = ['partNo', 'part_no', 'partsNo', 'part_number', 'code', 'label', 'name', 'id', 'type'];
    for (const field of fields) {
      const value = stringValue(part[field]);
      if (value.trim()) return value;
    }
    return fallback;
  }

  function hasComponent(component) {
    return partLabel(component, '') !== '';
  }

  function sectionState(options) {
    const input = objectOrEmpty(options);
    const bar = objectOrEmpty(input.bar);
    const series = stringValue(bar.series);
    const hasBar = !!input.bar && !!series;
    const diameter = positiveNumber(input.diameter);
    const depth = positiveNumber(input.depth);
    const l1 = positiveNumber(bar.l1);
    const depthKind = SERIES.depth.includes(series) ? 'boring-depth' : SERIES.general.includes(series) ? 'front-neck-geometry' : 'unconfirmed';
    let status = 'selection-needed';
    let noteLines = ['Select a bar to compare L1.'];

    if (hasBar && l1 === null) {
      status = 'unconfirmed';
      noteLines = ['L1 unavailable. Check the catalog.'];
    } else if (hasBar && depthKind === 'front-neck-geometry') {
      status = depth !== null && depth > l1 ? 'geometry-insufficient' : 'geometry-check';
      noteLines = status === 'geometry-insufficient' ? ['Depth exceeds front-neck L1.', 'Usable depth and clearance need checking.'] : ['L1 describes front-neck geometry.', 'Usable boring depth needs checking.'];
    } else if (hasBar && depthKind === 'boring-depth') {
      status = depth === null ? 'need-depth' : depth > l1 ? 'insufficient' : 'catalog-check';
      noteLines = status === 'need-depth' ? ['Enter a positive depth to compare L1.'] : status === 'insufficient' ? ['Depth exceeds catalog L1: insufficient.'] : ['Requested depth is within catalog L1.', 'Check clamping and workpiece clearance.'];
    } else if (hasBar) {
      status = 'unconfirmed';
      noteLines = ['L1 meaning is unconfirmed.', 'Confirm the usable boring depth.'];
    }
    return { input, bar, series, hasBar, diameter, depth, l1, depthKind, status, noteLines, note: noteLines.join(' ') };
  }

  // 直接產生矩形內的斜線，避免多張 SVG 使用相同 pattern / marker id 而互相干擾。
  function hatchRectangle(x, y, width, height) {
    let paths = '';
    for (let offset = -height + 9; offset < width; offset += 9) {
      const startX = x + Math.max(offset, 0);
      const startY = y + height - Math.max(-offset, 0);
      const endX = x + Math.min(offset + height, width);
      const endY = y + Math.max(offset + height - width, 0);
      paths += 'M' + startX + ' ' + startY + 'L' + endX + ' ' + endY;
    }
    return '<rect x="' + x + '" y="' + y + '" width="' + width + '" height="' + height + '" fill="#f4f6f8"/><path d="' + paths + '" fill="none" stroke="' + COLORS.hatch + '" stroke-width="1"/>';
  }

  function horizontalDimension(x1, x2, y) {
    return '<path d="M' + x1 + ' ' + (y - 7) + 'V' + (y + 5) + 'M' + x2 + ' ' + (y - 7) + 'V' + (y + 5) + 'M' + x1 + ' ' + y + 'H' + x2 + '" fill="none" stroke="' + COLORS.blue + '" stroke-width="1.5"/><path d="M' + x1 + ' ' + y + 'l6 -3v6zM' + x2 + ' ' + y + 'l-6 -3v6z" fill="' + COLORS.blue + '"/>';
  }

  function workpiece() {
    return '<g class="nb-diagram-workpiece">' +
      hatchRectangle(177, 71, 220, 37) + hatchRectangle(177, 152, 220, 32) + hatchRectangle(341, 108, 56, 44) +
      '<path d="M177 71H397V184H177M177 108H341V152H177" fill="none" stroke="#8d9ca9" stroke-width="1.5"/>' +
      '<path d="M177 108H341V152H177Z" fill="' + COLORS.pale + '"/><path d="M177 108H341V152H177" fill="none" stroke="#8d9ca9" stroke-width="1.5"/>' +
      '<path d="M177 117H341M177 143H341" fill="none" stroke="#8399a9" stroke-width="1.5" stroke-dasharray="5 4"/>' +
      '<text x="320" y="92" fill="' + COLORS.ink + '">Workpiece</text></g>';
  }

  function toolAssembly(state) {
    if (!state.hasBar) return '<text x="21" y="134" fill="' + COLORS.blue + '">Select a bar</text>';
    const quick = state.series === '99146' || state.series === '99151';
    const holderDash = hasComponent(state.input.holder) ? '' : ' stroke-dasharray="4 3"';
    let svg = '<g class="nb-diagram-tool"><path d="M20 105L33 100H70V160H33L20 155Z" fill="' + COLORS.steel + '" stroke="' + COLORS.ink + '" stroke-width="1.5"' + holderDash + '/>' +
      '<path d="M37 96H45V164H37Z" fill="#f8fbfd" stroke="' + COLORS.ink + '"/>' +
      '<text x="22" y="88" fill="' + COLORS.ink + '">Holder</text>';
    if (state.series === '99151') {
      const adapterDash = hasComponent(state.input.adapter) ? '' : ' stroke-dasharray="4 3"';
      svg += '<g class="nb-diagram-adapter"><path d="M72 119H87L98 111H130V149H98L87 141H72Z" fill="#bdd9eb" stroke="' + COLORS.blue + '" stroke-width="1.5"' + adapterDash + '/>' +
        '<text x="84" y="88" fill="' + COLORS.blue + '">Adapter</text></g>';
    } else if (quick) {
      svg += '<g class="nb-diagram-quick-interface"><path d="M72 119H87L100 111H126V149H100L87 141H72Z" fill="#bdd9eb" stroke="' + COLORS.blue + '" stroke-width="1.5"/>' +
        '<text x="84" y="88" fill="' + COLORS.blue + '">Quick</text></g>';
    } else {
      svg += '<path d="M70 118H112L126 124V136L112 142H70Z" fill="' + COLORS.steel + '" stroke="' + COLORS.ink + '" stroke-width="1.5"/>';
    }
    // 橘色刀尖僅表示切削位置，不宣稱還原任何未知刀片座或刀尖輪廓。
    svg += '<path d="M126 124H323L333 114H337V136H126Z" fill="#b9cad8" stroke="' + COLORS.ink + '" stroke-width="1.5"/>' +
      '<path class="nb-diagram-cutting-tip" d="M328 108H339L335 120H328Z" fill="' + COLORS.orange + '" stroke="' + COLORS.orange + '"/>' +
      '<path d="M310 62L330 104" fill="none" stroke="' + COLORS.orange + '" stroke-width="1.3"/>' +
      '<text x="239" y="64" fill="' + COLORS.orange + '">Cutting tip</text></g>';
    return svg;
  }

  function description(state) {
    const pieces = [
      'Axial schematic, not to scale. Gray hatching represents the workpiece, light blue the finished bore, and dashed lines the original hole.',
      'Diameter requested, D: ' + (state.diameter === null ? 'no valid positive value' : String(state.diameter) + ' mm') + '.',
      'Depth requested: ' + (state.depth === null ? 'no valid positive value' : String(state.depth) + ' mm') + '.'
    ];
    if (state.hasBar) {
      pieces.push('Bar series: ' + state.series + '. Orange indicates the conceptual cutting location.');
      pieces.push(state.depthKind === 'boring-depth' ? 'The catalog lists L1 as Boring Depth for this series.' : state.depthKind === 'front-neck-geometry' ? 'L1 is front-neck geometry, not a verified boring depth.' : 'The meaning of L1 for this bar needs confirmation.');
      if (state.l1 !== null) pieces.push('L1: ' + String(state.l1) + ' mm.');
      const minimum = positiveNumber(state.bar.minD);
      const maximum = positiveNumber(state.bar.maxD);
      if (minimum !== null && maximum !== null && minimum <= maximum) pieces.push('Bar diameter range: ' + String(minimum) + ' to ' + String(maximum) + ' mm.');
      const page = stringValue(state.bar.sourcePage);
      if (page) pieces.push('Catalog page: ' + page + '.');
      pieces.push(state.series === '99151' ? '99151 assembly order: holder, dedicated adapter, bar. The adapter bore diameter must match the bar shank diameter.' : state.series === '99146' ? '99146 uses the NineBore quick-change holder directly; no 99151 adapter is required.' : 'A general straight-shank bar requires compatible clamping.');
      if (objectOrEmpty(state.input.holder).requiresExternal32 === true) pieces.push('SB32 requires a separate compatible Ø32 Weldon machine-side holder.');
    }
    pieces.push(state.note, 'Do not add holder L, adapter L and bar L to calculate usable boring depth. Assembly projection and workpiece clearance need confirmation.');
    return pieces.join(' ');
  }

  function renderSection(options) {
    const state = sectionState(options);
    const l1Label = !state.hasBar ? 'Hatching: workpiece · Dashed: original hole' : state.l1 === null ? 'L1: catalog value unconfirmed' : (state.depthKind === 'front-neck-geometry' ? 'Front-neck L1: ' : state.depthKind === 'boring-depth' ? 'Catalog L1: ' : 'L1: ') + millimetres(state.l1) + (state.depthKind === 'boring-depth' ? ' · Boring Depth' : state.depthKind === 'front-neck-geometry' ? ' · geometry' : ' · meaning unconfirmed');
    const warning = state.status === 'insufficient' || state.status === 'geometry-insufficient';
    const svgTitle = 'NineBore axial section schematic' + (state.hasBar ? ' · ' + state.series : '');
    // aria-label 同步 title/desc，不依賴 id，因此一個畫面可安全放入多張示意圖。
    return '<svg class="nb-section-diagram" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 450 300" width="450" height="300" role="img" aria-label="' + escapeHtml(svgTitle + '. ' + description(state)) + '" data-depth-kind="' + state.depthKind + '" data-depth-status="' + state.status + '" style="display:block;max-width:100%;height:auto;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;font-size:14px">' +
      '<title>' + escapeHtml(svgTitle) + '</title><desc>' + escapeHtml(description(state)) + '</desc>' +
      '<text x="16" y="23" font-size="16" font-weight="700" fill="' + COLORS.ink + '">Axial section</text>' +
      '<text x="16" y="45" fill="#52697c">Schematic · Not to scale</text>' +
      workpiece() + '<path d="M16 130H399" stroke="#8399a9" stroke-width="1" stroke-dasharray="8 4 2 4"/>' + toolAssembly(state) +
      '<g class="nb-diagram-dimensions" fill="' + COLORS.blue + '"><path d="M402 108H422M402 152H422M414 108V152" fill="none" stroke="' + COLORS.blue + '" stroke-width="1.5"/><path d="M414 108l-3 6h6zM414 152l-3 -6h6z"/><text x="424" y="135">D</text>' +
      horizontalDimension(177, 335, 198) + '<text x="204" y="219">Depth requested</text></g>' +
      '<text x="16" y="237" fill="' + COLORS.blue + '">' + escapeHtml('D: ' + millimetres(state.diameter) + ' · Depth: ' + millimetres(state.depth)) + '</text>' +
      '<text x="16" y="257" fill="' + COLORS.ink + '">' + escapeHtml(l1Label) + '</text>' +
      '<text class="nb-diagram-note" x="16" y="277" fill="' + (warning ? COLORS.orange : '#52697c') + '">' + state.noteLines.map(function (line, index) { return '<tspan x="16" dy="' + (index ? 16 : 0) + '">' + escapeHtml(line) + '</tspan>'; }).join('') + '</text></svg>';
  }

  function renderAssembly(options) {
    const state = sectionState(options);
    if (!state.hasBar) return '<div class="nb-assembly"><p class="nb-assembly-note">Select a bar to show the assembly chain.</p></div>';
    const quick = state.series === '99146' || state.series === '99151';
    const nodes = [{ type: 'holder', title: 'Holder', label: partLabel(state.input.holder, quick ? 'NineBore holder: not selected' : 'Compatible general holder: unconfirmed'), missing: !hasComponent(state.input.holder) }];
    if (state.series === '99151') nodes.push({ type: 'adapter', title: 'Dedicated adapter', label: partLabel(state.input.adapter, '99151 adapter: not selected'), missing: !hasComponent(state.input.adapter) });
    nodes.push({ type: 'bar', title: 'Boring bar', label: partLabel(state.input.bar, state.series + ' bar'), missing: false });
    const chain = nodes.map(function (node, index) {
      return (index ? '<span class="nb-assembly-arrow" aria-hidden="true">→</span>' : '') +
        '<div class="nb-assembly-node nb-assembly-node--' + node.type + (node.missing ? ' is-pending' : '') + '"><span class="nb-assembly-label">' + node.title + '</span><strong>' + escapeHtml(node.label) + '</strong></div>';
    }).join('');
    let note = state.series === '99151' ? 'Match adapter ØD to bar Ød. Check clamping and workpiece clearance.' : state.series === '99146' ? '99146 uses the NineBore quick-change interface directly. Check clamping and clearance.' : 'Check actual shank diameter, effective clamping and workpiece clearance.';
    if (objectOrEmpty(state.input.holder).requiresExternal32 === true) note += ' SB32 requires a separate compatible Ø32 Weldon machine-side holder.';
    return '<div class="nb-assembly"><div class="nb-assembly-chain" role="group" aria-label="Assembly order from holder to boring bar">' + chain + '</div><p class="nb-assembly-note">' + note + '</p></div>';
  }

  return Object.freeze({ renderSection, renderAssembly });
});
