/* 將英數與中文字的單線筆畫排列成共用的毫米雕刻路徑。 */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EngravingSingleLine = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  async function create(text, options = {}) {
    const latin = options.latin || root.EngravingLatin;
    const chinese = options.chinese || root.EngravingChinese;
    const x = Number(options.x ?? 0), y = Number(options.y ?? 0), height = Number(options.height);
    text = String(text ?? '');
    if (!latin || !chinese) throw new Error('單線字型模組未載入。');
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1e6 || Math.abs(y) > 1e6) throw new Error('文字座標無效。');
    if (!Number.isFinite(height) || height <= 0 || height > 1000) throw new Error('文字高度需大於 0 且不超過 1000 mm。');
    if (!text.trim()) throw new Error('請輸入文字。');
    const chars = [...text];
    if (chars.length > 100) throw new Error('文字最多 100 個字元。');
    if (chars.some(ch => /[\r\n\t\p{M}\u200d\ufe0f]/u.test(ch))) throw new Error('目前只支援單行文字，不支援組合字元。');
    const latinGlyphs = chars.map(ch => latin.getGlyph(ch, height));
    if (latinGlyphs.some(glyph => glyph == null)) await chinese.load();
    const paths = []; let cursor = 0; let count = 0;
    for (let i = 0; i < chars.length; i++) {
      let glyph = latinGlyphs[i];
      if (!glyph) {
        try { glyph = chinese.getGlyph(chars[i]); }
        catch (_) { throw new Error(`單線字型不支援「${chars[i]}」，請更換字元。`); }
      }
      if (!glyph || !Array.isArray(glyph.paths) || !Number.isFinite(glyph.advance) || glyph.advance <= 0) throw new Error(`字元「${chars[i]}」的筆畫資料無效。`);
      for (const path of glyph.paths) {
        if (!Array.isArray(path.points) || path.points.length < 2 || path.points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) throw new Error(`字元「${chars[i]}」的筆畫資料不完整。`);
        count += path.points.length;
        if (count > 100000) throw new Error('文字筆畫過於複雜，請縮短文字。');
        paths.push({points:path.points.map(p=>({x:p.x+cursor,y:p.y})),closed:false});
      }
      cursor += glyph.advance;
    }
    if (!paths.length) throw new Error('文字沒有可雕刻筆畫。');
    let minX=Infinity,minY=Infinity;
    for (const path of paths) for (const p of path.points) {minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);}
    // 字高按字體設計框縮放，避免「一」等水平筆畫因外框高度太小而被放大。
    const scale=height;
    for (const path of paths) for (const p of path.points) {p.x=x+(p.x-minX)*scale;p.y=y+(p.y-minY)*scale;}
    return paths;
  }
  return {create};
}));
