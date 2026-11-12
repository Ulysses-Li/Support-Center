/* 型錄尺寸圖：99151使用清晰向量線稿，其餘保留原圖；尺寸均依選中資料連動。 */
(function (root, factory) {
  'use strict';
  const api = factory(typeof module === 'object' && module.exports ? require('./catalog-linework.js') : root.NINEBORE_CATALOG_LINEWORK);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.NINEBORE_CATALOG_DIAGRAM = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (linework) {
  'use strict';

  const fieldLabels = {
    'zh-TW': { diameter: '目標孔徑', l1: '刀桿 L1', l: '刀桿 L', shankD: '刀桿柄徑', shoulderD: '刀桿頸部徑', holderD: '配件直徑 ØD', holderL: '刀柄／轉接座 L', thread: '螺紋', constant: '圖面固定尺寸' },
    en: { diameter: 'Target diameter', l1: 'Bar L1', l: 'Bar L', shankD: 'Bar shank diameter', shoulderD: 'Bar neck diameter', holderD: 'Accessory diameter ØD', holderL: 'Holder / adapter L', thread: 'Thread', constant: 'Fixed drawing dimension' }
  };
  const diameterFields = new Set(['diameter', 'shankD', 'shoulderD', 'holderD']);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const finiteNumber = value => typeof value === 'number' && Number.isFinite(value);
  const positiveNumber = value => finiteNumber(value) && value > 0;
  const within = (value, maximum) => finiteNumber(value) && value >= 0 && value <= maximum;
  // 常數只容許實際尺寸格式，例如 27 mm、50 (48) mm、MAX 30 mm、Ø32 mm。
  const validConstant = value => typeof value === 'string' && value.length <= 80 && /^(?:MAX )?Ø?\d+(?:\.\d+)?(?: ?\(Ø?\d+(?:\.\d+)?\))? mm$/.test(value);

  function validLabel(label, width, height) {
    if (!isObject(label) || !Object.hasOwn(fieldLabels.en, label.field) || !isObject(label.box)) return false;
    const { box } = label;
    if (!within(box.x, width) || !within(box.y, height) || !positiveNumber(box.width) || !positiveNumber(box.height)) return false;
    if (box.x + box.width > width || box.y + box.height > height) return false;
    if (!within(label.x, width) || !within(label.y, height) || !positiveNumber(label.font_size) || label.font_size > Math.max(width, height)) return false;
    if (![0, -90, 90].includes(label.rotate) || typeof label.fill !== 'string' || !/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(label.fill)) return false;
    return label.field !== 'constant' || validConstant(label.value);
  }

  function fieldValue(label, dimensions) {
    if (label.field === 'constant') return label.value;
    const value = dimensions[label.field];
    if (label.field === 'thread') {
      // 保留型錄 M12xP1.75 及 CAT40 的 5/8"-11 原文；不補 mm，也不接受任意文字。
      if (typeof value !== 'string' || value.length > 64) return '—';
      const metric = value.match(/^M(\d+(?:\.\d+)?)(?:[xX×]P?(\d+(?:\.\d+)?))?$/);
      const imperial = value.match(/^(\d+)(?:\/(\d+))?"-(\d+)$/);
      const validMetric = metric && positiveNumber(Number(metric[1])) && (metric[2] === undefined || positiveNumber(Number(metric[2])));
      const validImperial = imperial && positiveNumber(Number(imperial[1])) && (imperial[2] === undefined || positiveNumber(Number(imperial[2]))) && positiveNumber(Number(imperial[3]));
      return validMetric || validImperial ? value : '—';
    }
    if (!positiveNumber(value)) return '—';
    return `${diameterFields.has(label.field) ? 'Ø' : ''}${value} mm`;
  }

  function render(input = {}) {
    if (!isObject(input) || !isObject(input.drawing)) return '';
    const { drawing } = input;
    const width = drawing.width_px;
    const height = drawing.height_px;
    if (!Number.isSafeInteger(width) || width <= 0 || !Number.isSafeInteger(height) || height <= 0) return '';
    if (typeof drawing.file !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.png$/i.test(drawing.file) || drawing.file.includes('..')) return '';
    if (!Array.isArray(drawing.overlay_labels) || !drawing.overlay_labels.length || !drawing.overlay_labels.every(label => validLabel(label, width, height))) return '';
    const language = input.language === 'en' ? 'en' : 'zh-TW';
    const dimensions = isObject(input.dimensions) ? input.dimensions : {};
    const values = drawing.overlay_labels.map(label => ({ label, value: fieldValue(label, dimensions) }));
    const partLabel = typeof input.partLabel === 'string' ? input.partLabel : '';
    const title = [partLabel, language === 'en' ? 'Catalog dimensions' : '型錄尺寸圖'].filter(Boolean).join(' — ');
    const description = values.map(({ label, value }) => `${fieldLabels[language][label.field]}: ${value}`).join('; ');
    const ariaLabel = `${title}; ${description}`;
    const labels = values.map(({ label, value }) => {
      const { box } = label;
      const transform = label.rotate ? ` transform="rotate(${escapeHTML(label.rotate)} ${escapeHTML(label.x)} ${escapeHTML(label.y)})"` : '';
      // 遮罩只覆蓋原稿尺寸文字；底圖與產品輪廓維持原始 viewBox 比例。
      return `<g data-dimension="${escapeHTML(label.field)}"><rect x="${escapeHTML(box.x)}" y="${escapeHTML(box.y)}" width="${escapeHTML(box.width)}" height="${escapeHTML(box.height)}" fill="${escapeHTML(label.fill)}"/><text x="${escapeHTML(label.x)}" y="${escapeHTML(label.y)}" font-family="Arial, sans-serif" font-size="${escapeHTML(label.font_size)}" fill="#0c2237" text-anchor="middle" dominant-baseline="central"${transform}>${escapeHTML(value)}</text></g>`;
    }).join('');
    // 線稿底圖和尺寸文字共用同一座標系，不把照片放大或改變數值幾何關係。
    const vectorBase = linework && typeof linework.render === 'function' ? linework.render(drawing) : '';
    const needsLinework = typeof drawing.key === 'string' && /^99151_(?:d6|d8|d10|d11_WS|1500W|1600_2000W)$/.test(drawing.key);
    if(needsLinework&&!vectorBase)return '';
    const base = vectorBase || `<image href="./assets/line-drawings/${escapeHTML(drawing.file)}" x="0" y="0" width="${escapeHTML(width)}" height="${escapeHTML(height)}" preserveAspectRatio="xMidYMid meet"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" class="catalog-dimension-drawing" data-drawing-style="${vectorBase?'linework':'catalog-image'}" role="img" aria-label="${escapeHTML(ariaLabel)}" width="${escapeHTML(width)}" height="${escapeHTML(height)}" viewBox="0 0 ${escapeHTML(width)} ${escapeHTML(height)}" preserveAspectRatio="xMidYMid meet"><title>${escapeHTML(ariaLabel)}</title><desc>${escapeHTML(description)}</desc>${base}${labels}</svg>`;
  }

  return Object.freeze({ render });
});
