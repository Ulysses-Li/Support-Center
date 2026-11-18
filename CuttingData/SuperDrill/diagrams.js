/* 鑽孔刀具動態尺寸圖：依型錄 p138 外形重繪，不從圖形比例反算尺寸。
 * 只接受選定料號的標準尺寸；T 為可用鑽深，L 為前段尺寸、L1 為後柄長度。
 * 圖形採固定的非比例排版，避免不同長度造成尺寸文字重疊或手機縮圖失讀。
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.SuperDrillDiagrams = api;
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
  function toolSd(id, tool) {
    var content = '<g class="dd-tool dd-tool-sd">';
    // 雙排屑槽以兩條反向曲線表達，呈現本產品的螺旋外形。
    content += path('M125 175H482Q509 175 528 155L548 145H568V265H548L528 255Q509 235 482 235H125Z', "dd-metal", ' fill="url(#' + id + '-metal)"');
    content += path('M135 176C219 171 264 228 348 229C421 230 483 199 528 175L530 187C480 224 423 244 347 238C260 233 213 187 135 191Z', "dd-helical-flute", ' fill="url(#' + id + '-channel)" stroke="#6a8295" stroke-width="1.2"');
    content += path('M136 233C225 235 266 180 349 180C427 180 480 225 528 235', "dd-flute-edge");
    content += path('M136 218C217 220 267 171 349 173C421 173 479 217 526 220', "dd-flute-edge", ' stroke-dasharray="8 5" opacity=".55"');
    content += path('M548 145V265M561 145V265M568 145V265', "dd-edge");
    content += shank(id, 568, 762, 163, 247);
    content += path('M109 205H782', "dd-axis");
    content += insert(136, 184, 18, "dd-inner-insert") + insert(136, 227, 18, "dd-outer-insert");
    content += '</g>';
    content += horizontal(id, 125, 568, 111, 147, 'L ' + mm(tool.L), "L");
    content += horizontal(id, 568, 762, 72, 163, 'L1 後柄 ' + mm(tool.L1), "L1");
    content += horizontal(id, 125, 495, 307, 237, '可鑽深 T ' + mm(tool.T), "T");
    content += vertical(id, 77, 175, 235, 122, mm(tool.D, true), "D", 53);
    content += vertical(id, 803, 163, 247, 766, mm(tool.shank, true), "d", 826);
    content += vertical(id, 866, 145, 265, 571, mm(tool.d1, true), "d1", 889);
    content += '<circle class="dd-legend-dot" cx="127" cy="353" r="4"/>' + label(140, 359, '內、外刃使用相同刀片 · 各 1 片', "dd-legend");
    return content;
  }
  function renderTool(tool, options) {
    if (!tool || tool.family !== "sd") return renderEmpty();
    options = options || {};
    var id = "super-drill-diagram-" + (++serial);
    var family = tool.family;
    var name = "Super Drill";
    var part = typeof tool.id === "string" || typeof tool.id === "number" ? String(tool.id) : "未選料號";
    var source = positive(tool.sourcePage);
    var target = positive(options.diameter);
    var title = name + ' · ' + part + '；刀具 ØD ' + mm(tool.D) + '；可鑽深 T ' + mm(tool.T) + '；L ' + mm(tool.L) + '；L1 ' + mm(tool.L1) + '；柄徑 Ød ' + mm(tool.shank) + '；肩徑 Ød1 ' + mm(tool.d1);
    if (target !== null) title += '；目標孔徑 ' + mm(target, true);
    var description = '依原型錄外形重繪的非比例示意。尺寸單位 mm，標註採所選料號的實際型錄數值；未提供的尺寸不推算。' + 'L1 為後柄長度，T 為可用鑽深；內、外刃各使用一片相同型號刀片。' + '本圖不表示夾持長度、避讓間隙或機台可用行程。';
    var body = label(35, 28, part, "dd-part") + label(865, 28, name + (source ? ' · 型錄 p' + number(source) : ''), "dd-badge", ' text-anchor="end"');
    body += toolSd(id, tool);
    body += label(35, 397, (target !== null ? '目標孔徑 ' + mm(target, true) + '　·　' : '') + '非比例示意 · 尺寸單位 mm', "dd-caption");
    body += label(865, 397, 'L1 = 後柄長度', "dd-caption", ' text-anchor="end"');
    return frame(id, family, title, description, body);
  }
  function renderEmpty() {
    var family = "sd";
    var id = "super-drill-diagram-" + (++serial);
    var name = "Super Drill";
    var body = '<rect x="30" y="40" width="840" height="340" rx="16" fill="#f3f8fc"/>';
    body += '<g opacity=".28">' + path('M160 166H555L585 144H612V248H585L555 226H160Z', "dd-metal", ' fill="#d2e1ec"') + shank(id, 612, 766, 159, 233) + path('M171 177C300 178 347 225 449 212S548 178 562 177', "dd-flute-edge") + path('M145 196H783', "dd-axis") + '</g>';
    body += label(450, 305, '選擇刀桿後，顯示實際尺寸圖', "dd-empty-label", ' text-anchor="middle"');
    body += label(450, 340, name + ' · 尺寸單位 mm · 非比例示意', "dd-caption", ' text-anchor="middle"');
    return frame(id, family, name + ' 尺寸圖待選擇', '選擇料號後顯示實際型錄尺寸，目前未提供尺寸數值。', body);
  }
  return Object.freeze({ renderTool: renderTool, renderEmpty: renderEmpty });
});
