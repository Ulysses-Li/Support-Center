/* 99151 型錄外形向量線稿：以原稿六個圖塊的固定座標重畫，不從使用者尺寸推算幾何。 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.NINEBORE_CATALOG_LINEWORK = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const INK = '#0c2237';
  const BODY = '#f0f5f8';
  const INSERT = '#fff0dd';

  // 數字僅是既有 PNG/viewBox 中的位置。尺寸文字仍由 manifest 的 overlay_labels 統一輸出。
  // L1 尺寸的終點不代表外徑階差；只有 1500W 在該站位畫出原稿可見的前細後粗肩差。
  const PROFILES = Object.freeze({
    '99151_d6': {
      key: '99151_d6', width: 1096, height: 404,
      outline: 'M213 138H876Q886 138 886 164Q886 191 876 191H213Z',
      detail: 'M215 140H249Q282 144 286 164Q281 181 250 188M448 139V190M877 141Q881 164 877 188',
      insert: 'M213 158L242 154L246 186L213 190Z',
      screw: [229, 173, 6], axis: [199, 903, 164],
      front: 213, rear: 885, l1End: 448, l1Y: 260, lY: 333,
      frontExtension: [201, 359], l1Extension: [202, 291], rearExtension: [205, 359],
      cuttingDiameter: { x: 146, from: 43, to: 190, witness: [77, 199] },
      shankDiameter: { x: 970, top: 136, bottom: 194, upper: 43, lower: 336, witness: [895, 996] }
    },
    '99151_d8': {
      key: '99151_d8', width: 1173, height: 420,
      outline: 'M183 125L201 121H983Q995 121 995 159Q995 197 983 197H183Z',
      detail: 'M188 126H216Q253 132 260 157Q256 181 230 190M509 122V196M985 125Q990 159 985 193',
      insert: 'M184 162L219 154L229 188L184 197Z',
      screw: [205, 177, 8], axis: [171, 1011, 159],
      front: 183, rear: 993, l1End: 509, l1Y: 270, lY: 341,
      frontExtension: [210, 370], l1Extension: [209, 296], rearExtension: [210, 370],
      cuttingDiameter: { x: 110, from: 58, to: 198, witness: [42, 167] },
      shankDiameter: { x: 1067, top: 120, bottom: 198, upper: 28, lower: 343, witness: [999, 1089] }
    },
    '99151_d10': {
      key: '99151_d10', width: 1260, height: 436,
      outline: 'M183 123L203 118H1107Q1120 118 1120 161Q1120 204 1107 204H183Z',
      detail: 'M187 124H235Q267 137 270 160Q265 187 241 198M561 119V203M1109 123Q1115 161 1109 199',
      insert: 'M185 169L228 160L241 193L185 204Z',
      screw: [213, 183, 9], axis: [171, 1136, 161],
      front: 183, rear: 1119, l1End: 561, l1Y: 284, lY: 358,
      frontExtension: [217, 387], l1Extension: [217, 296], rearExtension: [212, 387],
      cuttingDiameter: { x: 121, from: 64, to: 204, witness: [53, 176] },
      shankDiameter: { x: 1199, top: 118, bottom: 204, upper: 24, lower: 345, witness: [1127, 1215] }
    },
    '99151_d11_WS': {
      key: '99151_d11_WS', width: 1358, height: 453,
      outline: 'M159 155L192 158Q218 160 239 164H1204Q1218 164 1218 208Q1218 253 1204 253H215L193 258H159Z',
      detail: 'M184 157C229 163 246 191 236 222L214 252M1206 168Q1212 208 1206 249',
      insert: 'M160 228L194 220L201 252L160 258Z',
      screw: [180, 240, 7], axis: [147, 1234, 208],
      front: 159, rear: 1216, l1End: 661, l1Y: 339, lY: 409,
      frontExtension: [272, 429], l1Extension: [264, 358], rearExtension: [264, 429],
      cuttingDiameter: { x: 98, from: 124, to: 258, witness: [30, 151] },
      shoulderDiameter: { x: 312, from: 32, to: 163 },
      shankDiameter: { x: 1304, top: 164, bottom: 253, upper: 79, lower: 384, witness: [1224, 1328] }
    },
    '99151_1500W': {
      key: '99151_1500W', width: 1380, height: 507,
      outline: 'M162 185H220Q268 185 305 181H552V170H1209Q1224 170 1224 224Q1224 278 1209 278H552V267H305L226 278L162 289Z',
      detail: 'M214 186C264 189 298 205 302 232C298 254 267 275 227 278M552 171V277M1211 175Q1218 224 1211 273',
      insert: 'M164 223L217 208L226 279L163 289Z',
      screw: [193, 247, 11], axis: [150, 1240, 224],
      front: 162, rear: 1222, l1End: 552, l1Y: 373, lY: 440,
      frontExtension: [303, 467], l1Extension: [303, 385], rearExtension: [290, 467],
      cuttingDiameter: { x: 93, from: 138, to: 289, witness: [31, 154] },
      shoulderDiameter: { x: 400, from: 31, to: 181 },
      shankDiameter: { x: 1277, top: 170, bottom: 278, upper: 82, lower: 369, witness: [1225, 1328] }
    },
    '99151_1600_2000W': {
      key: '99151_1600_2000W', width: 1418, height: 447,
      outline: 'M187 135H222Q248 137 273 145H1247Q1262 145 1262 189Q1262 233 1247 233H237L216 240H187Z',
      detail: 'M222 137C255 143 271 162 274 188C271 207 253 222 232 232M1249 150Q1256 189 1249 228',
      insert: 'M188 209L224 200L232 232L188 240Z',
      screw: [208, 220, 8], axis: [175, 1278, 189],
      front: 187, rear: 1260, l1End: 697, l1Y: 322, lY: 393,
      frontExtension: [253, 412], l1Extension: [246, 341], rearExtension: [246, 412],
      cuttingDiameter: { x: 125, from: 104, to: 240, witness: [56, 179] },
      shoulderDiameter: { x: 342, from: 11, to: 145 },
      shankDiameter: { x: 1350, top: 144, bottom: 234, upper: 58, lower: 368, witness: [1268, 1373] }
    }
  });

  function line(x1, y1, x2, y2) {
    return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '"/>';
  }

  // 尺寸箭頭直接使用路徑，不建立 marker id，避免同頁主圖與放大視窗互相干擾。
  function horizontalDimension(x1, x2, y) {
    const length = 42;
    const halfHeight = 7;
    return line(x1, y, x2, y) + '<path d="M' + x1 + ' ' + y + 'l' + length + ' -' + halfHeight + 'v' + (halfHeight * 2) + 'zM' + x2 + ' ' + y + 'l-' + length + ' -' + halfHeight + 'v' + (halfHeight * 2) + 'z" fill="' + INK + '" stroke="none"/>';
  }

  function verticalArrow(x, fromY, toY) {
    const direction = fromY < toY ? -1 : 1;
    const baseY = toY + direction * 42;
    return line(x, fromY, x, toY) + '<path d="M' + x + ' ' + toY + 'L' + (x - 7) + ' ' + baseY + 'H' + (x + 7) + 'Z" fill="' + INK + '" stroke="none"/>';
  }

  function dimensions(profile) {
    const cut = profile.cuttingDiameter;
    const shank = profile.shankDiameter;
    let paths = line(profile.front, profile.frontExtension[0], profile.front, profile.frontExtension[1]) +
      line(profile.l1End, profile.l1Extension[0], profile.l1End, profile.l1Extension[1]) +
      line(profile.rear, profile.rearExtension[0], profile.rear, profile.rearExtension[1]) +
      horizontalDimension(profile.front, profile.l1End, profile.l1Y) +
      horizontalDimension(profile.front, profile.rear, profile.lY) +
      line(cut.witness[0], cut.to, cut.witness[1], cut.to) + verticalArrow(cut.x, cut.from, cut.to - 3) +
      line(shank.witness[0], shank.top, shank.witness[1], shank.top) +
      line(shank.witness[0], shank.bottom, shank.witness[1], shank.bottom) +
      verticalArrow(shank.x, shank.upper, shank.top) + verticalArrow(shank.x, shank.lower, shank.bottom);
    if (profile.shoulderDiameter) {
      const shoulder = profile.shoulderDiameter;
      paths += verticalArrow(shoulder.x, shoulder.from, shoulder.to);
    }
    return '<g class="catalog-linework-dimensions" fill="none" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="butt">' + paths + '</g>';
  }

  function tool(profile) {
    const screw = profile.screw;
    const screwCross = line(screw[0] - screw[2] * 0.5, screw[1], screw[0] + screw[2] * 0.5, screw[1]) + line(screw[0], screw[1] - screw[2] * 0.5, screw[0], screw[1] + screw[2] * 0.5);
    return '<g class="catalog-linework-tool" stroke="' + INK + '" stroke-linejoin="round">' +
      '<path class="catalog-linework-outline" d="' + profile.outline + '" fill="' + BODY + '" stroke-width="4"/>' +
      '<path class="catalog-linework-seat" d="' + profile.detail + '" fill="none" stroke-width="2.6"/>' +
      '<path class="catalog-linework-insert" d="' + profile.insert + '" fill="' + INSERT + '" stroke-width="3"/>' +
      '<circle cx="' + screw[0] + '" cy="' + screw[1] + '" r="' + screw[2] + '" fill="#ffffff" stroke-width="2.4"/>' +
      '<g stroke-width="1.8">' + screwCross + '</g></g>' +
      '<path class="catalog-linework-centerline" d="M' + profile.axis[0] + ' ' + profile.axis[2] + 'H' + profile.axis[1] + '" fill="none" stroke="#61798a" stroke-width="1.8" stroke-dasharray="24 9 5 9"/>';
  }

  function render(drawing) {
    if (!drawing || typeof drawing !== 'object' || Array.isArray(drawing) || typeof drawing.key !== 'string' || !Object.hasOwn(PROFILES, drawing.key)) return '';
    const profile = PROFILES[drawing.key];
    // 嚴格核對原圖尺寸，避免錯誤 manifest 或外部輸入造成文字、尺寸線與刀身錯位。
    if (drawing.width_px !== profile.width || drawing.height_px !== profile.height) return '';
    // 下方所有屬性皆出自上方可信固定表；不將任何呼叫端字串插入 SVG。
    return '<g class="catalog-linework" data-linework-profile="' + profile.key + '">' +
      '<rect x="0" y="0" width="' + profile.width + '" height="' + profile.height + '" fill="#ffffff"/>' +
      tool(profile) + dimensions(profile) + '</g>';
  }

  return Object.freeze({ render });
});
