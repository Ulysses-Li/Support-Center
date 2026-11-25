(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const core = window.GCodeEngrave;
  const viewer = new window.EngravingStockViewer($('viewerCanvas'));
  const state = { paths: [], source: null, blocked: false, warnings: [], generated: '', segments: [], progress: 0, playing: false, frame: null, last: null, carry: 0, revision: 0, textGroup: 0 };
  let sourceRequest=0, pendingExample=0;
  const fmt = n => Number(n).toFixed(2);
  const number = id => Number($(id).value);
  const cad = new window.EngravingCAD($('drawingCanvas'), {
    getPaths: () => state.paths,
    canEdit: () => !state.blocked,
    onChange: paths => {
      state.paths = paths; state.source = null;
      invalidate(); updateShapes(); report('圖形已更新，請重新產生刀路。');
    },
    onSelectionChange: index => {
      $('cadDelete').disabled = index < 0;
      $('cadStatus').textContent = index < 0 ? '選取工具：點選圖形；繪圖工具：在畫布上拖曳建立。' : state.paths[index]?.groupId ? '已選取文字，可整段拖曳移動或刪除。' : `已選取圖形 ${index + 1}，可拖曳移動或刪除。`;
    },
    onError: message => { $('cadStatus').textContent = message; }
  });

  // 直接使用 CAD 的逆投影，游標讀值與繪圖及 NC 的 XY 毫米座標一致。
  const drawingCanvas=$('drawingCanvas'), cursorCoordinates=$('cursorCoordinates');
  const clearCursor=()=>{cursorCoordinates.textContent='X —　Y — mm';};
  function showCursor(event) {
    const rect=drawingCanvas.getBoundingClientRect();
    if(event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom){clearCursor();return;}
    const point=cad.coordinates(event);
    const display=value=>(Math.abs(value)<0.005?0:value).toFixed(2);
    cursorCoordinates.textContent=`X ${display(point.x)}　Y ${display(point.y)} mm`;
  }
  drawingCanvas.addEventListener('pointerdown',showCursor);
  drawingCanvas.addEventListener('pointermove',showCursor);
  drawingCanvas.addEventListener('pointerleave',clearCursor);
  drawingCanvas.addEventListener('pointercancel',clearCursor);
  drawingCanvas.addEventListener('pointerup',event=>{if(event.pointerType==='touch')clearCursor();});
  // 畫面位置或縮放改變後，等游標再次移動再顯示，避免保留過期座標。
  window.addEventListener('scroll',clearCursor,{passive:true});
  if(window.ResizeObserver)new ResizeObserver(clearCursor).observe(drawingCanvas);

  // 資料修改後清除舊輸出，避免把過期刀路當成目前設定。
  function invalidate() {
    state.revision++;
    stopPlayback(); state.segments = []; setProgress(0);
    state.generated = '';
    $('gcodeOutput').value = '';
    $('summaryMoves').textContent = '—';
    $('copyButton').disabled = true; $('downloadButton').disabled = true;
    viewer.setSegments([]);
  }
  function stopPlayback() {
    state.playing = false;
    if (state.frame !== null) cancelAnimationFrame(state.frame);
    state.frame = null; state.last = null; state.carry = 0;
    $('playButton').textContent = '播放刀路'; $('playButton').setAttribute('aria-pressed', 'false');
  }
  function setProgress(value) {
    state.progress = Math.max(0, Math.min(state.segments.length, Math.floor(value)));
    $('progress').max = state.segments.length; $('progress').value = state.progress;
    $('progressLabel').textContent = `${state.progress} / ${state.segments.length} 段`;
    $('playButton').disabled = !state.segments.length;
    viewer.setProgress(state.progress);
  }
  function tick(now) {
    if (!state.playing) return;
    if (state.last !== null) {
      state.carry += Math.min(now - state.last, 100) * 0.03 * Number($('playSpeed').value);
      const n = Math.floor(state.carry);
      if (n) { state.carry -= n; setProgress(state.progress + n); }
    }
    state.last = now;
    if (state.progress >= state.segments.length) { stopPlayback(); return; }
    state.frame = requestAnimationFrame(tick);
  }
  function report(message, warnings = state.warnings) {
    $('status').textContent = message;
    const box = $('warnings'); box.replaceChildren();
    box.hidden = !warnings.length;
    if (!warnings.length) return;
    const list = document.createElement('ul');
    warnings.forEach(w => { const item = document.createElement('li'); item.textContent = typeof w === 'string' ? w : (w.message || String(w)); list.append(item); });
    box.append(list);
  }
  function bounds() {
    const points = state.paths.flatMap(p => p.points);
    if (!points.length) return null;
    const b = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    points.forEach(p => { b.minX = Math.min(b.minX,p.x); b.maxX = Math.max(b.maxX,p.x); b.minY = Math.min(b.minY,p.y); b.maxY = Math.max(b.maxY,p.y); });
    return b;
  }
  // 2D 草圖、文字與 3D 刀路共用同一份毫米座標資料。
  function updateShapes() {
    clearCursor();
    $('summaryShapes').textContent = state.paths.length;
    const b = bounds(); $('summarySize').textContent = b ? `${fmt(b.maxX-b.minX)} × ${fmt(b.maxY-b.minY)} mm` : '—';
    const list=$('shapeList'); list.replaceChildren();
    if (!state.paths.length) { const p=document.createElement('p');p.textContent='尚無圖形';list.append(p); }
    else state.paths.forEach((path,i) => { const item=document.createElement('div');item.textContent=`圖形 ${i+1} · ${path.closed ? '閉合輪廓' : '開放線條'} · ${path.points.length} 點`;list.append(item); });
    cad.render(); updateStock();
  }
  // 工件框以圖形外框加邊距繪製；此設定只影響視覺，不改動 NC 座標。
  function updateStock() {
    const b = bounds(), margin = number('stockMargin'), thickness = number('stockThickness');
    viewer.setOutline(state.paths);
    if (!b || $('stockMargin').value === '' || $('stockThickness').value === '' || !Number.isFinite(margin) || margin < 0 || !Number.isFinite(thickness) || thickness <= 0) {
      viewer.setStock(null);
      return;
    }
    const extraX = b.maxX === b.minX && margin === 0 ? 0.5 : margin;
    const extraY = b.maxY === b.minY && margin === 0 ? 0.5 : margin;
    viewer.setStock({minX:b.minX-extraX,maxX:b.maxX+extraX,minY:b.minY-extraY,maxY:b.maxY+extraY,thickness});
    viewer.fit();
  }
  for (const id of ['stockMargin','stockThickness']) $(id).addEventListener('input', updateStock);
  // 範例沿用 DXF 匯入器，保留原始輪廓；載入期間有其他編輯時不覆寫使用者資料。
  async function loadExample() {
    const request=++sourceRequest, revision=state.revision;
    pendingExample=request;
    $('generateButton').disabled=true;
    report('正在載入 Nine-9 範例…');
    try {
      const response=await fetch('./nine9-example.dxf');
      if(!response.ok)throw new Error('無法讀取 Nine-9 範例圖檔。');
      const source=await response.text(), result=core.parseDXF(source);
      if(result.blocked||result.needsUnits||!result.paths.length)throw new Error('Nine-9 範例圖檔無法解析。');
      if(request!==sourceRequest || state.revision!==revision)return;
      state.source=null;state.blocked=false;state.warnings=[];$('dxfFile').value='';
      state.paths=result.paths;$('textStatus').textContent='';
      cad.setEnabled(true);cad.resetHistory();cad.resetView();
      invalidate();updateShapes();report('已載入 Nine-9 DXF 輪廓範例，請設定參數後產生刀路。');
    } catch(error){if(request===sourceRequest && state.revision===revision)report('無法載入雕刻範例。',[error.message]);}
    finally {if(pendingExample===request){pendingExample=0;$('generateButton').disabled=false;}}
  }
  function importDXF() {
    try {
      const unit=$('dxfUnits').value;
      const result=core.parseDXF(state.source,unit === 'auto' ? undefined : unit);
      state.paths=result.paths || [];state.blocked=!!result.blocked || !!result.needsUnits;
      state.warnings=result.warnings || [];
      cad.setEnabled(!state.blocked); cad.resetHistory(); cad.resetView();
      if (result.needsUnits) state.warnings.push('DXF 未指定單位，請在匯入單位中選擇毫米或英吋。');
      $('textStatus').textContent='';
      invalidate();updateShapes();
      report(state.blocked ? '圖檔尚有未支援內容或單位未確認，請先處理提示。' : `已匯入 ${state.paths.length} 個圖形，單位已換算為 mm。`);
    } catch(error) { state.paths=[];state.blocked=true;state.warnings=[error.message];cad.setEnabled(false);cad.resetHistory();cad.resetView();invalidate();updateShapes();report('DXF 無法匯入。'); }
  }
  $('dxfFile').addEventListener('change',async event => {
    const file=event.target.files[0];if (!file)return;
    // 最後啟動的匯入或範例載入才可套用；讀檔期間的畫布編輯也會保留。
    const request=++sourceRequest,revision=state.revision;
    pendingExample=0;$('generateButton').disabled=false;
    try {const source=await file.text();if(request!==sourceRequest||revision!==state.revision)return;state.source=source;importDXF();}
    catch(error) {if(request!==sourceRequest||revision!==state.revision)return;state.blocked=true;invalidate();report('讀取檔案失敗。',[error.message]);}
  });
  $('dxfUnits').addEventListener('change',()=>{if(state.source !== null)importDXF();});
  $('loadExample').addEventListener('click',loadExample);
  $('clearShapes').addEventListener('click',()=>{sourceRequest++;pendingExample=0;$('generateButton').disabled=false;if(!state.blocked)cad.checkpoint();else cad.resetHistory();state.paths=[];state.source=null;state.blocked=false;state.warnings=[];$('dxfFile').value='';cad.setEnabled(true);cad.clearSelection();cad.resetView();invalidate();updateShapes();report('畫布已清空。');});
  // 工具列只切換目前繪圖方式；每次實際繪製、移動或刪除都會清除舊 NC。
  const tools = {cadSelect:'select',cadLine:'line',cadRect:'rectangle',cadCircle:'circle'};
  Object.entries(tools).forEach(([id, tool]) => $(id).addEventListener('click', () => {
    if(state.blocked){$('cadStatus').textContent='請先處理 DXF 匯入警示或清除圖形。';return;}
    cad.setTool(tool);
    Object.keys(tools).forEach(key => $(key).setAttribute('aria-pressed',String(key===id)));
    $('cadStatus').textContent = tool === 'select' ? '點選線條以選取，拖曳可移動。' : tool === 'circle' ? '從圓心向外拖曳，建立圓形。' : '在畫布上拖曳起點與終點。';
  }));
  $('cadUndo').addEventListener('click',()=>{if(!cad.undo())$('cadStatus').textContent='目前沒有可復原的操作。';});
  $('cadDelete').addEventListener('click',()=>{if(!cad.deleteSelected())$('cadStatus').textContent='請先選取圖形。';});
  $('cadFit').addEventListener('click',()=>{cad.resetView();clearCursor();});

  // 每種英文字型沿用相同排版流程；中文單線使用共同的筆畫資料。
  function textPaths(text, options, font) {
    if(font==='default') return window.EngravingText.create(text,options);
    if(font==='single') return window.EngravingSingleLine.create(text,options);
    const ids={'single:ems-tech':'ems-tech','single:ems-hand':'ems-hand',
      'single:ems-swiss':'ems-swiss','single:ems-capitol':'ems-capitol',
      'single:ems-league':'ems-league','single:ems-neato':'ems-neato'};
    const id=ids[font];
    if(!id || !window.EngravingLatinExtra) throw new Error('所選單線字型未載入。');
    const latin={getGlyph:(character,height)=>window.EngravingLatinExtra.getGlyph(id,character,height)};
    return window.EngravingSingleLine.create(text,{...options,latin});
  }
  // 預覽使用與正式產生相同的向量路徑，切換時不修改已加入的圖形。
  let previewVersion=0, previewTimer=null, previewPaths=[];
  function drawFontPreview() {
    const canvas=$('fontPreview'),ctx=canvas.getContext('2d'),width=canvas.clientWidth,height=canvas.clientHeight;
    if(!width || !height)return;
    const ratio=Math.min(window.devicePixelRatio||1,2);
    const w=Math.round(width*ratio),h=Math.round(height*ratio);
    if(canvas.width!==w || canvas.height!==h){canvas.width=w;canvas.height=h;}
    ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,width,height);
    if(!previewPaths.length)return;
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const path of previewPaths)for(const p of path.points){minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y);}
    const scale=Math.min((width-16)/Math.max(maxX-minX,1),(height-16)/Math.max(maxY-minY,1));
    const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
    ctx.strokeStyle='#0067ad';ctx.lineWidth=1.6;ctx.lineJoin='round';ctx.lineCap='round';
    for(const path of previewPaths){ctx.beginPath();path.points.forEach((p,i)=>{const px=width/2+(p.x-cx)*scale,py=height/2-(p.y-cy)*scale;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});if(path.closed)ctx.closePath();ctx.stroke();}
  }
  async function updateFontPreview(version) {
    const text=$('textInput').value, font=$('textFont').value;
    if(!text.trim()){previewPaths=[];drawFontPreview();$('fontPreviewMessage').textContent='輸入文字後顯示預覽。';return;}
    try {
      const paths=await textPaths(text,{x:0,y:0,height:10},font);
      if(version!==previewVersion)return;
      previewPaths=paths;drawFontPreview();$('fontPreviewMessage').textContent='';
    } catch(error){if(version!==previewVersion)return;previewPaths=[];drawFontPreview();$('fontPreviewMessage').textContent=error.message;}
  }
  function scheduleFontPreview() {
    const version=++previewVersion;
    clearTimeout(previewTimer);
    previewTimer=setTimeout(()=>updateFontPreview(version),180);
  }
  $('textInput').addEventListener('input',scheduleFontPreview);
  $('textFont').addEventListener('change',()=>{
    $('textFontHelp').textContent=$('textFont').value==='default'
      ? 'Noto Sans TC 沿字形外框雕刻，加入後可整段選取及移動。'
      : '單線體的英數字形各有不同；中文共用近似筆畫，字高以字型框為準。';
    $('textStatus').textContent='';scheduleFontPreview();
  });
  if(window.ResizeObserver)new ResizeObserver(drawFontPreview).observe($('fontPreview'));
  scheduleFontPreview();
  // 使用本機字形資料建立向量刀路；載入期間若設定改變，不套用過期結果。
  $('textAdd').addEventListener('click',async()=>{
    const button=$('textAdd');
    try {
      if(state.blocked)throw new Error('請先處理 DXF 匯入警示，或清除圖形。');
      const revision=state.revision;
      const options={x:number('textX'),y:number('textY'),height:number('textHeight')};
      const text=$('textInput').value;
      const font=$('textFont').value;
      if(['textX','textY','textHeight'].some(id=>$(id).value===''))throw new Error('請填入文字位置與高度。');
      button.disabled=true;$('textStatus').textContent='正在載入字型並建立文字輪廓…';
      const paths=await textPaths(text,options,font);
      if(state.revision!==revision || state.blocked || $('textInput').value!==text || $('textFont').value!==font || number('textX')!==options.x || number('textY')!==options.y || number('textHeight')!==options.height)throw new Error('圖形或文字設定已變更，請重新加入文字。');
      const groupId = `text-${++state.textGroup}`;
      cad.checkpoint(); state.source=null; state.paths=state.paths.concat(paths.map(path=>({...path,groupId})));
      cad.clearSelection();cad.resetView();invalidate();updateShapes();
      $('textStatus').textContent=`已加入文字，共 ${paths.length} 條${font==='default'?'字形輪廓':'單線筆畫'}。`;
      report('文字已加入，請重新產生刀路。');
    }catch(error){$('textStatus').textContent=error.message;}
    finally{button.disabled=false;}
  });
  const serialFields=['serialPrefix','serialSuffix','serialStart','serialDigits','serialStep','serialCount','serialPitch'];
  function serialOptions() {
    return {prefix:$('serialPrefix').value,suffix:$('serialSuffix').value,start:$('serialStart').value,digits:$('serialDigits').value,step:$('serialStep').value,count:$('serialCount').value};
  }
  // 預覽完整號碼的首尾，實際加入時再以選定字型產生完整筆畫。
  function updateSerialPreview() {
    try {
      const items=window.EngravingSerial.create(serialOptions());
      $('serialPreview').textContent=items.length===1 ? `預覽：${items[0]}` : `預覽：${items[0]} → ${items[items.length-1]}（共 ${items.length} 個）`;
    } catch(error){$('serialPreview').textContent=error.message;}
    $('serialStatus').textContent='';
  }
  serialFields.forEach(id=>$(id).addEventListener('input',updateSerialPreview));
  updateSerialPreview();
  // 先產生並驗證整批筆畫，成功後才一次加入；各號碼仍可各自選取移動。
  $('serialAdd').addEventListener('click',async()=>{
    const button=$('serialAdd');
    try {
      if(state.blocked)throw new Error('請先處理 DXF 匯入警示，或清除圖形。');
      const revision=state.revision, font=$('textFont').value;
      const watched=[...serialFields,'textFont','textHeight','textX','textY'];
      const snapshot=watched.map(id=>$(id).value);
      if(['textX','textY','textHeight','serialPitch'].some(id=>$(id).value===''))throw new Error('請填入文字位置、高度與列間距。');
      const x=number('textX'),y=number('textY'),height=number('textHeight'),pitch=number('serialPitch');
      if(!Number.isFinite(pitch)||pitch<=0||pitch>1000000)throw new Error('列間距需大於 0 且不超過 1000000 mm。');
      const items=window.EngravingSerial.create(serialOptions()), batches=[];
      button.disabled=true;$('serialStatus').textContent='正在建立流水號筆畫…';
      let pointCount=0,maxHeight=0;
      for(let i=0;i<items.length;i++){
        const paths=await textPaths(items[i],{x,y:y-i*pitch,height},font);
        let minY=Infinity,maxY=-Infinity;
        for(const path of paths)for(const point of path.points){pointCount++;minY=Math.min(minY,point.y);maxY=Math.max(maxY,point.y);}
        if(pointCount>100000)throw new Error('整批筆畫過於複雜，請減少數量或縮短文字。');
        maxHeight=Math.max(maxHeight,maxY-minY);batches.push(paths);
      }
      if(items.length>1 && pitch+1e-9<maxHeight)throw new Error(`列間距不足；目前字形高度約 ${maxHeight.toFixed(2)} mm，請增加列間距。`);
      if(state.revision!==revision||state.blocked||watched.some((id,i)=>$(id).value!==snapshot[i]))throw new Error('圖形或流水號設定已變更，請重新加入。');
      cad.checkpoint();state.source=null;
      for(const paths of batches){const groupId=`text-${++state.textGroup}`;state.paths.push(...paths.map(path=>({...path,groupId})));}
      cad.clearSelection();cad.resetView();invalidate();updateShapes();
      $('serialStatus').textContent=`已加入 ${items.length} 個流水號：${items[0]}${items.length>1?' 至 '+items[items.length-1]:''}。`;
      report('流水號已加入，請重新產生刀路。');
    }catch(error){$('serialStatus').textContent=error.message;}
    finally{button.disabled=false;}
  });
  for(const id of ['depth','stepdown','safeZ','cutFeed','plungeFeed','toolDiameter','spindle']) $(id).addEventListener('input',()=>{if(state.generated){invalidate();report('設定已變更，請重新產生刀路。');}});
  $('generateButton').addEventListener('click',()=>{
    try {
      if(state.blocked)throw new Error('圖檔仍有未支援內容或單位未確認，無法產生程式。');
      if(!state.paths.length)throw new Error('請先匯入或新增圖形。');
      if(!Number.isFinite(number('toolDiameter')) || number('toolDiameter')<=0)throw new Error('刀具直徑必須大於零。');
      const result=core.generate(state.paths,{depth:number('depth'),stepdown:number('stepdown'),safeZ:number('safeZ'),feed:number('cutFeed'),plunge:number('plungeFeed'),spindle:number('spindle')});
      const parsed=window.GCodeParser.parse(result.code);
      if(parsed.stopped)throw new Error('輸出的刀路無法完整預覽，請檢查程式。');
      state.generated=result.code; $('gcodeOutput').value=result.code;
      stopPlayback(); state.segments = parsed.segments; viewer.setSegments(parsed.segments); setProgress(parsed.segments.length);
      $('summaryMoves').textContent=parsed.segments.length;
      $('copyButton').disabled=false;$('downloadButton').disabled=false;
      report(`已產生 ${result.passCount} 層雕刻路徑。`,state.warnings.concat(parsed.warnings.map(w=>`第 ${w.line} 行：${w.message}`)));
    }catch(error){invalidate();report('無法產生刀路。',[error.message]);}
  });
  $('copyButton').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(state.generated);report('程式已複製。');}catch(error){report('無法複製，請手動選取程式內容。',[error.message]);}});
  $('downloadButton').addEventListener('click',()=>{if(!state.generated)return;const url=URL.createObjectURL(new Blob([state.generated],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='engraving-sample.nc';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('playButton').addEventListener('click',()=>{
    if(state.playing){stopPlayback();return;}
    if(!state.segments.length)return;
    if(state.progress>=state.segments.length)setProgress(0);
    state.playing=true;$('playButton').textContent='暫停';$('playButton').setAttribute('aria-pressed','true');state.frame=requestAnimationFrame(tick);
  });
  $('progress').addEventListener('input',event=>{stopPlayback();setProgress(Number(event.target.value));});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlayback();});
  for(const view of ['Iso','Top','Front','Side']) $(`view${view}`).addEventListener('click',()=>viewer.setView(view.toLowerCase()));
  $('viewFit').addEventListener('click',()=>viewer.fit());
  // 手機上的畫布可能一開始在可視範圍之外，進入畫面時補繪以符合實際大小。
  if (window.IntersectionObserver) {
    const visibilityObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (entry.target === $('drawingCanvas')) cad.render();
      else viewer.draw();
    }));
    visibilityObserver.observe($('drawingCanvas')); visibilityObserver.observe($('viewerCanvas'));
  }
  loadExample();
})();
