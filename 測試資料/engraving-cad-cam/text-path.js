/* 本機字體向量輪廓：使用 Noto Sans TC 字形輪廓，不把像素圖當作雕刻路徑。 */
(function (root, factory) {
  const source = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : '';
  const api = factory(root, source);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EngravingText = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root, source) {
  'use strict';
  const tolerance = 0.01;
  const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const midpoint = (a,b) => ({x:(a.x+b.x)/2,y:(a.y+b.y)/2});
  // 控制點到弦的距離限制幾何誤差；多邊形長度差值另用於偵測控制點折返。
  function flatEnough(points) {
    let length=0;
    for(let i=1;i<points.length;i++) length+=dist(points[i-1],points[i]);
    const a=points[0],b=points[points.length-1],dx=b.x-a.x,dy=b.y-a.y,len2=dx*dx+dy*dy;
    const deviation=p=>{
      if(len2<1e-20)return dist(p,a);
      const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len2));
      return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
    };
    return points.slice(1,-1).every(p=>deviation(p)<=tolerance) && length-dist(a,b)<=tolerance;
  }
  function quadratic(a,b,c,out,depth=0) {
    if(flatEnough([a,b,c])) {out.push(c);return;}
    if(depth>=16)throw new Error('字形曲線精度不足，請縮小文字。');
    const ab=midpoint(a,b),bc=midpoint(b,c),m=midpoint(ab,bc);
    quadratic(a,ab,m,out,depth+1);quadratic(m,bc,c,out,depth+1);
  }
  function cubic(a,b,c,d,out,depth=0) {
    if(flatEnough([a,b,c,d])) {out.push(d);return;}
    if(depth>=16)throw new Error('字形曲線精度不足，請縮小文字。');
    const ab=midpoint(a,b),bc=midpoint(b,c),cd=midpoint(c,d),abc=midpoint(ab,bc),bcd=midpoint(bc,cd),m=midpoint(abc,bcd);
    cubic(a,ab,abc,m,out,depth+1);cubic(m,bcd,cd,d,out,depth+1);
  }
  function pathsFromFont(font, text, options = {}) {
    text = String(text ?? '');
    const x=Number(options.x ?? 0), y=Number(options.y ?? 0), height=Number(options.height), spacing=Number(options.spacing ?? 0);
    if(!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>1e6||Math.abs(y)>1e6) throw new Error('文字座標無效。');
    if(!Number.isFinite(height)||height<=0||height>1000) throw new Error('文字高度需大於 0 且不超過 1000 mm。');
    if(!Number.isFinite(spacing)||spacing<0||spacing>1000) throw new Error('字距需為 0 至 1000 mm。');
    if(!text.trim()) throw new Error('請輸入文字。');
    const chars=[...text];
    if(chars.length>100) throw new Error('文字最多 100 個字元。');
    if(chars.some(ch=>/[\r\n\t\p{M}\u200d\ufe0f]/u.test(ch))) throw new Error('目前只支援單行文字，不支援組合字元。');
    for(const ch of chars) if(ch!==' ' && font.charToGlyphIndex(ch)===0) throw new Error(`字型不支援「${ch}」，請更換字元。`);
    // 以實際字形高度縮放，而非使用字型 em 方格推估字高。
    const bbox=font.getPath(text,0,0,1).getBoundingBox();
    if(!Number.isFinite(bbox.y1)||!Number.isFinite(bbox.y2)||bbox.y2-bbox.y1<=0) throw new Error('文字沒有可雕刻輪廓。');
    const size=height/(bbox.y2-bbox.y1), glyphs=chars.map(ch=>font.charToGlyph(ch));
    const paths=[];let pen=0, prev=null, points=null, current=null, count=0;
    const toPoint=(px,py)=>({x:px,y:bbox.y2*size-py});
    function push(p) { if(!points)throw new Error('字形輪廓資料有誤。'); if(!current||dist(current,p)>1e-9){points.push(p);current=p;count++;if(count>100000)throw new Error('文字輪廓過於複雜，請縮短文字。');} }
    function finish() { if(!points)return; if(points.length>1&&dist(points[0],points[points.length-1])<1e-8)points.pop(); if(points.length>=2)paths.push({points,closed:true}); points=null;current=null; }
    for(const glyph of glyphs) {
      if(prev)pen+=font.getKerningValue(prev,glyph)*size/font.unitsPerEm;
      const commands=glyph.getPath(pen,0,size).commands;
      for(const cmd of commands) {
        if(cmd.type==='M'){finish();points=[];push(toPoint(cmd.x,cmd.y));}
        else if(cmd.type==='L')push(toPoint(cmd.x,cmd.y));
        else if(cmd.type==='Q') {
          if(!current)throw new Error('字形輪廓資料有誤。');
          const out=[];quadratic(current,toPoint(cmd.x1,cmd.y1),toPoint(cmd.x,cmd.y),out);out.forEach(push);
        } else if(cmd.type==='C') {
          if(!current)throw new Error('字形輪廓資料有誤。');
          const out=[];cubic(current,toPoint(cmd.x1,cmd.y1),toPoint(cmd.x2,cmd.y2),toPoint(cmd.x,cmd.y),out);out.forEach(push);
        } else if(cmd.type==='Z')finish();
        else throw new Error('不支援此字形輪廓。');
      }
      finish();
      pen+=(glyph.advanceWidth || 0)*size/font.unitsPerEm+spacing;
      prev=glyph;
    }
    if(!paths.length)throw new Error('文字沒有可雕刻輪廓。');
    const minX=Math.min(...paths.flatMap(path=>path.points.map(p=>p.x)));
    for(const path of paths)for(const p of path.points){p.x+=x-minX;p.y+=y;}
    return paths;
  }
  let pending;
  async function create(text, options) {
    if(!root.opentype || !source)throw new Error('字型解析模組未載入。');
    if(!pending) pending=fetch(new URL('vendor/NotoSansTC.ttf',source)).then(response=>{
      if(!response.ok)throw new Error('無法讀取本機字型，請透過本機伺服器開啟頁面。');
      return response.arrayBuffer();
    }).then(data=>root.opentype.parse(data)).catch(()=>{pending=null;throw new Error('無法載入本機字型，請透過本機伺服器開啟工作台。');});
    return pathsFromFont(await pending,text,options);
  }
  return {create,pathsFromFont};
}));
