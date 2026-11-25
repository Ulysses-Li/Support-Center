/* 將 Make Me a Hanzi 筆畫中線轉為毫米系統可縮放的開放路徑。 */
(function (root, factory) {
  const source = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : '';
  const api = factory(source);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EngravingChinese = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (source) {
  'use strict';
  let glyphs = null, pending = null;

  // 原始座標：1024 × 1024，頂端 y=900、底端 y=-124；不壓扁個別筆畫。
  function glyphFromData(data, character) {
    if (typeof character !== 'string' || [...character].length !== 1) throw new Error('請提供一個中文字元。');
    const strokes = data && data[character];
    if (!Array.isArray(strokes) || !strokes.length) throw new Error(`單線字型不支援「${character}」。`);
    const paths = strokes.map(stroke => {
      if (!Array.isArray(stroke) || stroke.length < 2 || stroke.some(point => !Array.isArray(point) || point.length !== 2 || !point.every(Number.isFinite))) throw new Error(`「${character}」的筆畫資料有誤。`);
      const points = stroke.map(([x, y]) => ({ x: x / 1024, y: (y + 124) / 1024 }));
      if (!points.some((point, i) => i && (point.x !== points[i - 1].x || point.y !== points[i - 1].y))) throw new Error(`「${character}」有長度為零的筆畫。`);
      return { points, closed: false };
    });
    return { paths, advance: 1.15 };
  }
  async function load() {
    if (glyphs) return;
    if (!source) throw new Error('單線中文字型無法載入，請使用本機伺服器開啟。');
    if (!pending) pending = fetch(new URL('vendor/hanzi-strokes/medians.json', source)).then(response => {
      if (!response.ok) throw new Error('無法讀取單線中文字型。');
      return response.json();
    }).then(data => {
      if (!data || !data.glyphs || typeof data.glyphs !== 'object') throw new Error('單線中文字型資料有誤。');
      glyphs = data.glyphs;
    }).catch(() => { pending = null; throw new Error('無法載入本機單線中文字資料，請以本機伺服器開啟頁面。'); });
    await pending;
  }
  function getGlyph(character) {
    if (!glyphs) throw new Error('單線中文字型尚未載入。');
    return glyphFromData(glyphs, character);
  }
  return { load, getGlyph, glyphFromData };
}));
