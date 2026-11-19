/* 雕刻樣板核心：DXF 幾何轉成毫米中心線，再依工件上表面 Z0 產生名義刀路。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GCodeEngrave = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const point = (x, y) => ({ x, y });
  const valid = n => Number.isFinite(n) && Math.abs(n) < 1e7;
  const fmt = n => (Math.abs(n) < 0.0005 ? 0 : n).toFixed(3);
  const positive = (n, label) => { n = Number(n); if (!valid(n) || n <= 0) throw new Error(`${label}必須大於 0`); return n; };
  function line(x1, y1, x2, y2) {
    const p = [point(Number(x1), Number(y1)), point(Number(x2), Number(y2))];
    if (!p.every(v => valid(v.x) && valid(v.y)) || Math.hypot(p[1].x-p[0].x,p[1].y-p[0].y)<1e-8) throw new Error('直線座標無效或長度為零');
    return { points: p, closed: false };
  }
  function rectangle(x, y, width, height) {
    x=Number(x); y=Number(y); width=positive(width,'寬度'); height=positive(height,'高度');
    if (!valid(x) || !valid(y) || !valid(x+width) || !valid(y+height)) throw new Error('矩形座標無效');
    return { points: [point(x,y),point(x+width,y),point(x+width,y+height),point(x,y+height)], closed: true };
  }
  // 依圓弧弦高 0.01 mm 拆線，避免大圓弧因固定角度造成過大誤差。
  function arc(cx, cy, r, start, sweep) {
    if (![cx,cy,r,start,sweep].every(valid) || r<=0 || Math.abs(sweep)<1e-9) throw new Error('圓弧參數無效');
    const angleStep = Math.min(Math.PI / 36, 2 * Math.acos(Math.max(-1, 1 - 0.01 / r)));
    const count = Math.max(1, Math.ceil(Math.abs(sweep) / angleStep));
    if (!Number.isFinite(count) || count > 20000) throw new Error('圓弧細分段數過多，請縮小圖形或分割圓弧');
    return Array.from({length:count+1},(_,i)=>point(cx+r*Math.cos(start+sweep*i/count),cy+r*Math.sin(start+sweep*i/count)));
  }
  function circle(x,y,radius) {
    x=Number(x);y=Number(y);radius=positive(radius,'半徑');
    if (!valid(x)||!valid(y)) throw new Error('圓心座標無效');
    const points=arc(x,y,radius,0,Math.PI*2); points.pop(); return {points,closed:true};
  }
  // bulge = tan(夾角 / 4)，含負值與跨半圓情況；端點固定為原始資料。
  function bulgeArc(a,b,bulge) {
    if (!bulge) return [a,b];
    const dx=b.x-a.x,dy=b.y-a.y,chord=Math.hypot(dx,dy);
    if (chord<1e-8 || !valid(bulge)) throw new Error('多段線圓弧端點無效');
    const sweep=4*Math.atan(bulge), offset=chord*(1-bulge*bulge)/(4*bulge);
    const cx=(a.x+b.x)/2-dy/chord*offset,cy=(a.y+b.y)/2+dx/chord*offset;
    const points=arc(cx,cy,Math.hypot(a.x-cx,a.y-cy),Math.atan2(a.y-cy,a.x-cx),sweep);
    points[0]=a; points[points.length-1]=b; return points;
  }
  function parseDXF(text, unitOverride) {
    const warnings=[], paths=[]; let blocked=false, needsUnits=false, units='';
    const fail = message => { warnings.push(message); blocked=true; };
    const rows=String(text||'').replace(/^\uFEFF/,'').replace(/\r/g,'').split('\n');
    if (rows.length%2 && !rows[rows.length-1].trim()) rows.pop();
    if (rows.length%2) return {paths,warnings:['DXF 群組碼與內容不成對，請確認為 ASCII DXF。'],blocked:true,needsUnits:false,units:''};
    const pairs=[];
    for(let i=0;i<rows.length;i+=2) {
      const code=Number(rows[i].trim());
      if (!Number.isInteger(code) || !rows[i].trim()) return {paths,warnings:['無法解析 DXF 群組碼，請確認為 ASCII DXF。'],blocked:true,needsUnits:false,units:''};
      pairs.push([code,rows[i+1].trim()]);
    }
    let ins=0;
    for(let i=0;i<pairs.length;i++) if(pairs[i][0]===9 && pairs[i][1].toUpperCase()==='$INSUNITS') {
      if (pairs[i+1]?.[0]===70) ins=Number(pairs[i+1][1]);
    }
    let scale;
    if(ins===4){scale=1;units='mm';} else if(ins===1){scale=25.4;units='inch';}
    else if(ins===0 && (unitOverride==='mm'||unitOverride==='inch')) {units=unitOverride;scale=unitOverride==='inch'?25.4:1;warnings.push(`圖檔未指定單位，使用者選擇 ${units}。`);}
    else if(ins===0) {needsUnits=true;fail('圖檔未指定單位，請先選擇毫米或英吋。');return {paths,warnings,blocked,needsUnits,units:''};}
    else {fail(`DXF 單位代碼 ${ins} 尚未支援，請先轉為毫米或英吋。`);return {paths,warnings,blocked,needsUnits:false,units:''};}
    let inEntities=false, foundEntities=false;
    for(let i=0;i<pairs.length;i++) {
      const [code,value]=pairs[i];
      if(code===0 && value.toUpperCase()==='SECTION' && pairs[i+1]?.[0]===2) {inEntities=pairs[i+1][1].toUpperCase()==='ENTITIES';foundEntities ||= inEntities;i++;continue;}
      if(code===0 && value.toUpperCase()==='ENDSEC'){inEntities=false;continue;}
      if(!inEntities || code!==0) continue;
      const type=value.toUpperCase(), entity=[];
      while(i+1<pairs.length && pairs[i+1][0]!==0) entity.push(pairs[++i]);
      if(!['LINE','LWPOLYLINE','POLYLINE','CIRCLE','ARC'].includes(type)) {fail(`不支援 DXF ${type} 圖形，請轉成直線、圓弧或多段線。`);continue;}
      const get=(c,d=undefined)=>{const p=entity.find(q=>q[0]===c);return p?Number(p[1]):d;};
      const ex=get(210,0),ey=get(220,0),ez=get(230,1);
      const invalidPlane=![ex,ey,ez].every(valid) || Math.abs(ex)>1e-8 || Math.abs(ey)>1e-8 || Math.abs(ez-1)>1e-8 || [30,31,38,39].some(c=>!valid(get(c,0)) || Math.abs(get(c,0))>1e-8);
      // 舊版 DXF 的多段線是一個 POLYLINE、數個 VERTEX，再以 SEQEND 結束；一起讀取才能保留輪廓與 bulge。
      if (type==='POLYLINE') {
        let j=i+1, ended=false, childInvalid=false;
        const vertices=[];
        while(j<pairs.length && pairs[j][0]===0) {
          const childType=pairs[j][1].toUpperCase();
          if(childType!=='VERTEX' && childType!=='SEQEND') break;
          j++;
          const child=[];
          while(j<pairs.length && pairs[j][0]!==0) child.push(pairs[j++]);
          if(childType==='SEQEND') { ended=true; break; }
          const read=(c,d=undefined)=>{const p=child.find(q=>q[0]===c);return p?Number(p[1]):d;};
          const x=read(10),y=read(20),z=read(30,0),bulge=read(42,0),flags=read(70,0);
          if(![x,y,z,bulge,flags].every(valid) || Math.abs(z)>1e-8 || !Number.isInteger(flags) || flags!==0) childInvalid=true;
          vertices.push({x:x*scale,y:y*scale,bulge});
        }
        i=j-1;
        const flags=get(70,0);
        if(!ended) { fail('POLYLINE 缺少 SEQEND 結束標記。'); continue; }
        if(invalidPlane || childInvalid || !Number.isInteger(flags) || flags<0 || (flags & ~129)!==0) { fail('POLYLINE 含非 XY 平面、3D、網格或擬合曲線，尚未支援。'); continue; }
        if(vertices.length<2) { fail('POLYLINE 頂點資料不完整。'); continue; }
        try {
          const closed=(flags&1)!==0, points=[point(vertices[0].x,vertices[0].y)];
          for(let n=0;n<vertices.length-(closed?0:1);n++) {
            const a=vertices[n],b=vertices[(n+1)%vertices.length];
            points.push(...bulgeArc(point(a.x,a.y),point(b.x,b.y),a.bulge).slice(1));
          }
          if(closed) points.pop();
          paths.push({points,closed});
        } catch(error) {fail(`POLYLINE：${error.message}`);}
        continue;
      }
      if (invalidPlane) {fail(`${type} 包含非 XY 平面或座標轉換，尚未支援。`);continue;}
      try {
        if(type==='LINE') paths.push(line(get(10)*scale,get(20)*scale,get(11)*scale,get(21)*scale));
        else if(type==='CIRCLE') paths.push(circle(get(10)*scale,get(20)*scale,get(40)*scale));
        else if(type==='ARC') {
          const a=get(50)*Math.PI/180,b=get(51)*Math.PI/180; let sweep=((b-a)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);
          if (sweep<1e-9) throw new Error('圓弧起點與終點相同');
          paths.push({points:arc(get(10)*scale,get(20)*scale,get(40)*scale,a,sweep),closed:false});
        } else {
          const vertices=[]; let current=null;
          for (const [c,v] of entity) {
            if(c===10) {current={x:Number(v)*scale,y:NaN,bulge:0};vertices.push(current);}
            else if(c===20 && current) current.y=Number(v)*scale;
            else if(c===42 && current) current.bulge=Number(v);
          }
          if(vertices.length<2 || vertices.some(p=>!valid(p.x)||!valid(p.y)||!valid(p.bulge))) throw new Error('多段線頂點資料不完整');
          if(get(90,vertices.length)!==vertices.length) throw new Error('多段線頂點數不一致');
          const closed=(get(70,0)&1)!==0, points=[point(vertices[0].x,vertices[0].y)];
          for(let n=0;n<vertices.length-(closed?0:1);n++) {
            const a=vertices[n],b=vertices[(n+1)%vertices.length];
            points.push(...bulgeArc(point(a.x,a.y),point(b.x,b.y),a.bulge).slice(1));
          }
          if(closed) points.pop();
          paths.push({points,closed});
        }
      } catch(error) {fail(`${type}：${error.message}`);}
    }
    if(!foundEntities) fail('DXF 沒有 ENTITIES 區段。');
    if(!paths.length && !blocked) fail('找不到可用的圖形。');
    return {paths,warnings,blocked,needsUnits,units};
  }
  function generate(paths, options) {
    if(!Array.isArray(paths)||!paths.length) throw new Error('請先建立或匯入圖形');
    const depth=positive(options.depth,'雕刻深度'),stepdown=positive(options.stepdown,'每層深度');
    const safeZ=positive(options.safeZ,'安全高度'),feed=positive(options.feed,'切削進給'),plunge=positive(options.plunge,'下刀進給'),spindle=positive(options.spindle,'主軸轉速');
    if (!Number.isInteger(spindle)) throw new Error('主軸轉速需為整數 rpm');
    const passCount=Math.ceil(depth/stepdown);
    if(passCount>100) throw new Error('分層次數超過 100，請檢查設定');
    let vertices=0;
    for(const path of paths) {
      if(!Array.isArray(path.points)||path.points.length<2||path.points.some(p=>!valid(p.x)||!valid(p.y))) throw new Error('圖形座標無效');
      vertices+=path.points.length;
    }
    if(vertices*passCount>100000) throw new Error('刀路點數過多，請簡化圖形或分層設定');
    const out=['(Engraving centre-line preview; verify controller and setup)', '(Z0 = workpiece top; tool radius compensation is not applied)', 'G21 G90 G17 G94', `G00 Z${fmt(safeZ)}`, `M03 S${Math.round(spindle)}`];
    for(let pass=1;pass<=passCount;pass++) {
      const z=-Math.min(depth,pass*stepdown); out.push(`(Pass ${pass} depth ${fmt(z)})`);
      for(const path of paths) {
        const first=path.points[0];
        out.push(`G00 Z${fmt(safeZ)}`,`G00 X${fmt(first.x)} Y${fmt(first.y)}`,`G01 Z${fmt(z)} F${fmt(plunge)}`);
        for(let i=1;i<path.points.length;i++) out.push(`G01 X${fmt(path.points[i].x)} Y${fmt(path.points[i].y)} F${fmt(feed)}`);
        if(path.closed) out.push(`G01 X${fmt(first.x)} Y${fmt(first.y)} F${fmt(feed)}`);
        out.push(`G00 Z${fmt(safeZ)}`);
      }
    }
    out.push('M05','M30');
    return {code:out.join('\n'),paths,passCount};
  }
  return {parseDXF,rectangle,circle,line,generate};
}));
