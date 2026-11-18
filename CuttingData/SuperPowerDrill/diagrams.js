/* 鑽孔刀具動態尺寸圖：依型錄 p130 外形重繪，不從圖形比例反算尺寸。
 * 只接受選定料號的標準尺寸；T 為可用鑽深，L1 是前段尺寸，後柄另列 58 mm。
 * 圖形採固定的非比例排版，避免不同長度造成尺寸文字重疊或手機縮圖失讀。
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SuperPowerDrillDiagrams = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var serial = 0;
  var ink = "#0c2237", blue = "#0067ad", orange = "#f05a1a";

  // 所有外部文字先跳脫；幾何座標與 SVG 屬性均由本模組固定產生。
  function escape(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }
  function positive(value) {
    if (typeof value !== "number" && !(typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value))) return null;
    var number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  }
  function number(value) {
    var parsed = positive(value);
    if (parsed === null) return "未提供";
    if (parsed >= 1000000 || parsed < 0.001) return parsed.toExponential(3);
    return String(Number(parsed.toFixed(3)));
  }
  function mm(value, diameter) {
    return positive(value) === null ? "未提供" : (diameter ? "Ø" : "") + number(value) + " mm";
  }
  function label(x, y, value, className, extra) {
    return '<text x="' + x + '" y="' + y + '" class="' + (className || "dd-dimension-label") + '"' + (extra || "") + '>' + escape(value) + '</text>';
  }
  function line(x1, y1, x2, y2, className, extra) {
    return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" class="' + className + '"' + (extra || "") + '/>';
  }
  function path(d, className, extra) {
    return '<path d="' + d + '" class="' + className + '"' + (extra || "") + '/>';
  }
  function extension(x, y1, y2) {
    return path('M' + x + ' ' + y1 + 'V' + y2, "dd-extension");
  }
  function horizontal(id, from, to, y, objectY, text, key) {
    return '<g data-dimension="' + key + '">' + extension(from, objectY, y + (y > objectY ? 8 : -8)) + extension(to, objectY, y + (y > objectY ? 8 : -8)) +
      line(from, y, to, y, "dd-dimension", ' marker-start="url(#' + id + '-arrow)" marker-end="url(#' + id + '-arrow)"') + label((from + to) / 2, y - 12, text, "dd-dimension-label", ' text-anchor="middle"') + '</g>';
  }
  function vertical(id, x, from, to, objectX, text, key, textX) {
    return '<g data-dimension="' + key + '">' + line(objectX, from, x + (x > objectX ? 7 : -7), from, "dd-extension") + line(objectX, to, x + (x > objectX ? 7 : -7), to, "dd-extension") +
      path('M' + x + ' ' + from + 'V' + to, "dd-dimension", ' marker-start="url(#' + id + '-arrow)" marker-end="url(#' + id + '-arrow)"') +
      label(textX, (from + to) / 2, text, "dd-dimension-label", ' text-anchor="middle" transform="rotate(-90 ' + textX + ' ' + ((from + to) / 2) + ')"') + '</g>';
  }
  function insert(x, y, size, className) {
    var half = size / 2;
    return '<g class="dd-insert ' + className + '" transform="translate(' + x + ' ' + y + ') rotate(-5)"><rect x="-' + half + '" y="-' + half + '" width="' + size + '" height="' + size + '" rx="2.5"/><circle r="' + (size * .24) + '"/><path d="M-3 0H3M0 -3V3"/></g>';
  }
  function shank(id, start, end, top, bottom) {
    return '<g class="dd-shank">' + path('M' + start + ' ' + top + 'H' + (end - 6) + 'L' + end + ' ' + (top + 6) + 'V' + (bottom - 6) + 'L' + (end - 6) + ' ' + bottom + 'H' + start + 'Z', "dd-metal", ' fill="url(#' + id + '-metal)"') +
      path('M' + (end - 7) + ' ' + top + 'V' + bottom, "dd-edge") +
      path('M' + (start + 12) + ' ' + (top + 13) + 'H' + (end - 13) + 'V' + (bottom - 13) + 'H' + (start + 12) + 'Z', "dd-flat") +
      path('M' + (start + 12) + ' ' + (top + 13) + 'L' + (end - 13) + ' ' + (bottom - 13) + 'M' + (start + 12) + ' ' + (bottom - 13) + 'L' + (end - 13) + ' ' + (top + 13), "dd-flat-line") + '</g>';
  }

  function definitions(id) {
    return '<defs><linearGradient id="' + id + '-metal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8f0f5"/><stop offset=".22" stop-color="#f9fcfe"/><stop offset=".52" stop-color="#c9d7e1"/><stop offset="1" stop-color="#9eb3c2"/></linearGradient><linearGradient id="' + id + '-channel" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#afc1ce"/><stop offset=".55" stop-color="#f8fbfd"/><stop offset="1" stop-color="#e2ebf1"/></linearGradient><marker id="' + id + '-arrow" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L8 4L0 8Z" fill="' + blue + '"/></marker></defs>';
  }
  var styles = '<style>' +
    '.dd-tool-diagram text{font-family:Arial,"Microsoft JhengHei",sans-serif}' +
    '.dd-tool-diagram .dd-part{fill:' + ink + ';font-size:20px;font-weight:700}' +
    '.dd-tool-diagram .dd-caption{fill:#5c7183;font-size:16px}' +
    '.dd-tool-diagram .dd-badge{fill:' + blue + ';font-size:15px;font-weight:700;letter-spacing:.6px}' +
    '.dd-tool-diagram .dd-dimension-label{fill:' + blue + ';font-size:19px;font-weight:600;paint-order:stroke;stroke:#fff;stroke-width:5px;stroke-linejoin:round}' +
    '.dd-tool-diagram .dd-dimension{fill:none;stroke:' + blue + ';stroke-width:1.5}' +
    '.dd-tool-diagram .dd-extension{fill:none;stroke:#9db5c7;stroke-width:1}' +
    '.dd-tool-diagram .dd-metal{stroke:#3a5366;stroke-width:1.8;stroke-linejoin:round}' +
    '.dd-tool-diagram .dd-edge{fill:none;stroke:#3a5366;stroke-width:1.2}' +
    '.dd-tool-diagram .dd-flat{fill:#f5f9fc;fill-opacity:.35;stroke:#71899b;stroke-width:1}' +
    '.dd-tool-diagram .dd-flat-line{fill:none;stroke:#8ca1b2;stroke-width:1}' +
    '.dd-tool-diagram .dd-flute-edge{fill:none;stroke:#526e83;stroke-width:1.4}' +
    '.dd-tool-diagram .dd-axis{fill:none;stroke:#90a8bb;stroke-width:1;stroke-dasharray:16 5 3 5}' +
    '.dd-tool-diagram .dd-insert rect,.dd-tool-diagram .dd-pilot-shape{fill:#f9d56a;stroke:#85651a;stroke-width:1.2;stroke-linejoin:round}' +
    '.dd-tool-diagram .dd-insert circle,.dd-tool-diagram .dd-pilot-hole{fill:#edf2f5;stroke:#6b5c2c;stroke-width:1.2}' +
    '.dd-tool-diagram .dd-insert path{fill:none;stroke:#5d5266;stroke-width:1}' +
    '.dd-tool-diagram .dd-legend{fill:' + ink + ';font-size:16px}' +
    '.dd-tool-diagram .dd-legend-dot{fill:' + orange + '}' +
    '.dd-tool-diagram .dd-empty-label{fill:#526e83;font-size:23px;font-weight:600}' +
    '</style>';

  function frame(id, family, title, description, body) {
    return '<svg xmlns="http://www.w3.org/2000/svg" class="dd-tool-diagram" viewBox="0 0 900 420" role="img" aria-labelledby="' + id + '-title ' + id + '-desc" data-family="' + family + '"><title id="' + id + '-title">' + escape(title) + '</title><desc id="' + id + '-desc">' + escape(description) + '</desc>' + styles + definitions(id) + body + '</svg>';
  }
  function toolSpd(id, tool) {
    var content = '<g class="dd-tool dd-tool-spd">';
    content += path('M123 173H609L630 150H658V260H630L609 237H123Z', "dd-metal", ' fill="url(#' + id + '-metal)"');
    // 型錄 p130 顯示長直排屑槽、突出中心刀片與外周刀片。
    content += path('M138 174H603Q613 174 614 185V225Q613 237 603 237H146L126 219V190Z', "dd-long-flute", ' fill="url(#' + id + '-channel)" stroke="#71899b" stroke-width="1.2"');
    content += path('M140 196H594Q607 196 612 181M141 219H594Q607 219 612 235M630 150V260M651 150V260', "dd-flute-edge");
    content += shank(id, 658, 790, 166, 244);
    content += path('M100 205H805', "dd-axis");
    content += '<g class="dd-center-pilot">' + path('M114 192L125 196L135 193L139 204L134 215L123 214L117 223L111 214L103 207L111 200Z', "dd-pilot-shape") + '<circle class="dd-pilot-hole" cx="122" cy="206" r="5"/></g>';
    content += insert(126, 181, 17, "dd-periphery-insert");
    if (Number(tool.peripheryQty) === 2) content += insert(126, 230, 17, "dd-periphery-insert");
    content += '</g>';
    content += horizontal(id, 123, 658, 72, 150, 'L1 前段 ' + mm(tool.L1), "L1");
    content += horizontal(id, 123, 609, 114, 173, 'L ' + mm(tool.L), "L");
    content += horizontal(id, 123, 580, 307, 239, '可鑽深 T ' + mm(tool.T), "T");
    content += horizontal(id, 658, 790, 348, 248, '後柄 58 mm', "rear-shank");
    content += vertical(id, 77, 173, 237, 120, mm(tool.D, true), "D", 53);
    content += vertical(id, 810, 166, 244, 794, mm(tool.shank, true), "d", 832);
    content += vertical(id, 869, 150, 260, 661, mm(tool.d1, true), "d1", 891);
    var qty = Number(tool.peripheryQty) === 2 ? '2' : (Number(tool.peripheryQty) === 1 ? '1' : '未提供');
    content += '<circle class="dd-legend-dot" cx="125" cy="353" r="4"/>' + label(138, 359, '中心刀片 1 片 · 外刃 ' + qty + ' 片', "dd-legend");
    return content;
  }
  function renderTool(tool, options) {
    if (!tool || tool.family !== "spd") return renderEmpty();
    options = options || {};
    var id = "drilling-diagram-" + (++serial);
    var family = "spd";
    var name = "Super Power Drill";
    var part = typeof tool.id === "string" || typeof tool.id === "number" ? String(tool.id) : "未選料號";
    var source = positive(tool.sourcePage);
    var target = positive(options.diameter);
    var title = name + ' · ' + part + '；刀具 ØD ' + mm(tool.D) + '；可鑽深 T ' + mm(tool.T) + '；L ' + mm(tool.L) + '；L1 ' + mm(tool.L1) + '；柄徑 Ød ' + mm(tool.shank) + '；肩徑 Ød1 ' + mm(tool.d1);
    if (target !== null) title += '；目標孔徑 ' + mm(target, true);
    var description = '依原型錄外形重繪的非比例示意。尺寸單位 mm，標註採所選料號的實際型錄數值；未提供的尺寸不推算。' + 'L1 為前段尺寸，後柄長度 58 mm；T 為可用鑽深。中心與外刃採不同刀片。' + '本圖不表示夾持長度、避讓間隙或機台可用行程。';
    var body = label(35, 28, part, "dd-part") + label(865, 28, name + (source ? ' · 型錄 p' + number(source) : ''), "dd-badge", ' text-anchor="end"');
    body += toolSpd(id, tool);
    body += label(35, 397, (target !== null ? '目標孔徑 ' + mm(target, true) + '　·　' : '') + '非比例示意 · 尺寸單位 mm', "dd-caption");
    body += label(865, 397, 'L1 = 前段尺寸', "dd-caption", ' text-anchor="end"');
    return frame(id, family, title, description, body);
  }
  function renderEmpty() {
    var family = "spd";
    var id = "drilling-diagram-" + (++serial);
    var name = "Super Power Drill";
    var body = '<rect x="30" y="40" width="840" height="340" rx="16" fill="#f3f8fc"/>';
    body += '<g opacity=".28">' + path('M160 166H555L585 144H612V248H585L555 226H160Z', "dd-metal", ' fill="#d2e1ec"') + shank(id, 612, 766, 159, 233) + path('M171 177C300 178 347 225 449 212S548 178 562 177', "dd-flute-edge") + path('M145 196H783', "dd-axis") + '</g>';
    body += label(450, 305, '選擇刀桿後，顯示實際尺寸圖', "dd-empty-label", ' text-anchor="middle"');
    body += label(450, 340, name + ' · 尺寸單位 mm · 非比例示意', "dd-caption", ' text-anchor="middle"');
    return frame(id, family, name + ' 尺寸圖待選擇', '選擇料號後顯示實際型錄尺寸，目前未提供尺寸數值。', body);
  }
  return Object.freeze({ renderTool: renderTool, renderEmpty: renderEmpty });
});
