/* NineBore 互動工具：四問、候選與切削結果共用同一狀態；共用型錄主檔與已確認選配資料。 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), core = NINEBORE_CORE;
  // 語言只影響顯示；網址與表單的原始材料／料號識別碼共用同一份資料與計算。
  const isChinese=new URLSearchParams(location.search).get('lang')==='zh-TW';
  const translate=text=>isChinese?NINEBORE_UI_LOCALE.translate(text):text;
  const localize=()=>{if(isChinese)NINEBORE_UI_LOCALE.apply(document.body);};
  document.documentElement.lang=isChinese?'zh-Hant':'en';
  if(isChinese){document.title='NineBore｜搪孔選型與切削設定';document.querySelector('meta[name="description"]').content='輸入完工孔徑、搪孔深度、材料與夾持介面，配對NineBore刀桿、刀柄及切削設定。';}
  const ids = ['diameter','toleranceUpper','toleranceLower','depth','material','holderId','shankDiameter','insertId','condition','vc','feed','prebore','machineMaxRpm'];
  const controls = Object.fromEntries(ids.map(id => [id,$(id)]));
  const pdf = './sources/13_NineBore%20Boring%20Tool_p148-166.pdf';
  const esc = core.escapeHTML;
  const fmt = (value,digits=3) => Number.isFinite(value) ? Number(value.toFixed(digits)).toLocaleString('en-US',{maximumFractionDigits:digits}) : '—';
  const raw = value => Number.isFinite(value) ? String(Number(value.toFixed(6))) : '';
  const toleranceFmt=value=>Number.isFinite(value)?value.toLocaleString('en-US',{maximumFractionDigits:12}):'—';
  const seriesNames = {'99101':'Adjustable straight shank','99121':'Fine-adjustment straight shank','99146':'Quick-change boring bar','99151':'Deep-hole boring bar'};
  const drawingPreviews=new Map();
  let model, drawingManifest, findings, selected, selectedId='', calculation, diameterTolerance, origin='median', example=true, copyText='', rejectedInsert=null, manualCuttingValues=false;
  const straightShank = () => controls.holderId.value==='straight_shank';
  const input = () => {
    const values=Object.fromEntries(ids.map(id => [id,controls[id].value]));
    // 直柄是介面選項而非虛構刀柄料號；只在此選項啟用Ød，快換路徑忽略舊柄徑。
    return straightShank() ? {...values,holderId:'',clamping:'existing_general',gripDiameter:values.shankDiameter} : {...values,clamping:'purchase_holder',gripDiameter:''};
  };
  function options(select,items,value,placeholder) {
    select.replaceChildren(...(placeholder ? [new Option(placeholder,'')] : []), ...items.map(item => new Option(item.label,item.id)));
    select.value = items.some(item => item.id === value) ? value : placeholder ? '' : items[0]?.id || '';
  }
  function conditions(previous=controls.condition.value) {
    const rows=model.cuttingRows.filter(row=>row.workpiece_material===controls.material.value);
    const names=[...new Set((rows.length?rows:model.cuttingRows).map(row=>row.cutting_condition_or_surface_finish))];
    options(controls.condition,names.map(name=>({id:name,label:name})),previous);
  }
  function clampUI() {
    const holder=model.holders.find(item=>item.id===controls.holderId.value);
    $('shankGroup').hidden=!straightShank();controls.shankDiameter.disabled=!straightShank();
    // 圖上尺寸與選單共用已選值；未選顯示Ød，輪廓仍為非比例定位示意。
    const shankDiameter=Number(controls.shankDiameter.value);
    const shankLabel=Number.isFinite(shankDiameter)&&shankDiameter>0?`Ø${fmt(shankDiameter)} mm`:'Ød';
    $('shankReferenceValue').textContent=shankLabel;
    $('shankReferenceTitle').textContent=`${translate('Rear clamping section')} ${shankLabel}`;
    $('holderHint').textContent=straightShank() ? '99101 / 99121 · choose bar shank Ød below.' : holder?.requiresExternal32 ? 'Ø32 Weldon shank · requires an external Ø32 chuck.' : holder ? '99146 fits directly. 99151 adds a matching adapter.' : 'Choose a catalog holder or straight-shank clamping.';
    const variants=model.bars.find(bar=>bar.series==='99121');
    const variantSizes=(variants?.shankOptions||[]).map(size=>`Ø${fmt(size)}`).join(' / ');
    $('shankHint').textContent=variants?.shankOptionsConfirmed?`${translate('99121 shank options')}${isChinese?'：':': '}${variantSizes} mm${isChinese?'。 ':'. '}${translate('99101 uses Ø20 mm. Select the rear clamping diameter to suit your holder.')}`:controls.shankDiameter.value==='13' ? 'Ø13 appears in the 99121 drawing. Its applicable part number needs confirmation.' : controls.shankDiameter.value==='20' ? '99101: Ø20 listed. 99121: drawing option; confirm the applicable part number.' : 'Rear clamping diameter Ød, separate from the finished hole diameter D.';
    const material=model.materials.find(item=>item.id===controls.material.value);
    $('materialBadge').textContent=material?.iso||'—';$('materialBadge').dataset.iso=material?.iso||'';
  }
  function renderFind({resetValues=false,restoreBar='',restoreInsert=''}={}) {
    clampUI();findings=core.find(model,input());
    const candidates=findings.criteria.diameter!==null ? findings.candidates : [];
    selectedId=candidates.some(item=>item.id===(restoreBar||selectedId)) ? restoreBar||selectedId : candidates[0]?.id||'';
    selected=candidates.find(item=>item.id===selectedId)||null;
    const missingDepth=findings.criteria.depth===null;
    $('resultCount').textContent=findings.criteria.diameter===null ? '' : `${candidates.length} bars fit the diameter${missingDepth?' · add depth':''}`;
    const fields=[findings.criteria.diameter!==null?`Ø${fmt(findings.criteria.diameter)} mm`:'Any diameter',findings.criteria.depth!==null?`${fmt(findings.criteria.depth)} mm depth`:'Depth not set',controls.material.value||'Material not set'];
    if(straightShank())fields.push(findings.criteria.gripDiameter!==null?`Shank Ø${fmt(findings.criteria.gripDiameter)} mm`:'Choose shank Ød');
    $('criteria').textContent=fields.join(' · ');
    $('inputIssues').hidden=!findings.errors.length;$('inputIssues').textContent=findings.errors.map(translate).join(' ');
    for(const id of ['diameter','depth']){const value=controls[id].value;const invalid=value!==''&&(!Number.isFinite(Number(value))||Number(value)<=0);controls[id].setAttribute('aria-invalid',String(invalid));controls[id].classList.toggle('is-invalid',invalid);}
    $('emptyState').hidden=!!candidates.length;
    if(!candidates.length){
      $('emptyTitle').textContent=findings.criteria.diameter===null&&!findings.errors.length?'Define your hole to begin':'No matching bar for this job';
      $('emptyReason').textContent=findings.criteria.diameter===null&&!findings.errors.length?'Enter the finished diameter and depth. Then choose your material and holder.':findings.errors.length?findings.errors.map(translate).join(' '):findings.diagnosis.message;
    }
    $('candidateList').innerHTML=candidates.map((candidate,index)=>{
      const b=candidate.bar;
      // 刻度由型錄主資料讀取；推薦理由是調整增量較細，不把每格刻度寫成加工精度保證。
      const alternative=candidates.find(item=>item.bar.series==='99101');
      const divisionUnit=translate('mm / division');
      const precisionBadge=candidate.precisionPreferred?`<div class="precision-recommendation"><span class="precision-preference">${esc(translate('Finer adjustment · recommended'))}</span><p>${esc(translate('Adjustment per division'))}${isChinese?'：':': '}99121 ${fmt(b.division)} ${esc(divisionUnit)}${isChinese?'；':'; '}99101 ${fmt(alternative?.bar.division)} ${esc(divisionUnit)}${isChinese?'。':'.'}</p></div>`:'';
      const actualShank=Number.isFinite(candidate.selectedShankD)?candidate.selectedShankD:b.shankD;
      const shankText=Number.isFinite(actualShank)?`Ø${fmt(actualShank)} mm`:b.shankOptionsConfirmed?(b.shankOptions||[]).map(size=>`Ø${fmt(size)}`).join(' / ')+' mm':findings.criteria.gripDiameter!==null?`Ø${fmt(findings.criteria.gripDiameter)} · confirm`:(b.shankOptions||[]).map(size=>`Ø${fmt(size)}`).join(' / ')+' · confirm';
      return `<label class="tool-choice"><input type="radio" name="barChoice" id="barChoice${index}" value="${esc(candidate.id)}" ${candidate.id===selectedId?'checked':''}><div class="tool-card"><p class="tool-series">${esc(b.series)} · ${esc(seriesNames[b.series]||b.name)}</p><h3 class="tool-part">${esc(b.id)}</h3>${precisionBadge}<div class="tool-card-facts"><div><span>Adjustable hole Ø</span><strong>${fmt(b.minD)}–${fmt(b.maxD)} mm</strong></div><div><span>${b.depthKind==='front_neck'?'Front-neck L1':'Boring depth L1'}</span><strong>${fmt(b.l1)} mm</strong></div>${candidate.adapter||straightShank()?`<div><span>Bar shank Ød${candidate.shankStatus==='review'?' · unconfirmed':''}</span><strong>${esc(shankText)}</strong></div>`:''}</div>${straightShank()&&b.shankD===null&&!b.shankOptionsConfirmed?'<p class="field-help mt-3">Drawing option only · confirm the shank for this part number.</p>':''}<div class="tool-card-bottom"><span class="match-tag">Hole diameter fits</span><span class="tool-source">Catalog p. ${fmt(b.sourcePage,0)}</span></div></div></label>`;
    }).join('');
    $('exampleNote').hidden=!example;
    const oldInsert=restoreInsert||controls.insertId.value;
    // 能裝入刀桿不等於適合目前材料；舊網址明選不適材牌號時請客戶重選，不暗中換成另一牌號。
    const incompatible=(selected?.insertOptions||[]).find(item=>item.id===oldInsert&&item.materialSuitable===false);
    if(incompatible)rejectedInsert={grade:incompatible.grade,material:controls.material.value};
    const applicable=core.applicableInserts(model,selected,controls.material.value);
    const insertItems=applicable.map(item=>({id:item.id,label:`${item.parts} · ${item.grade}${item.recommended?' · recommended':item.materialSuitable===true?' · material suitable':item.exactGeometry?'':' · confirm geometry'}`}));
    const direct=applicable.filter(item=>item.recommended);
    const recommended=direct.length?direct:applicable.filter(item=>item.referenceRecommended);
    const nextInsert=rejectedInsert?'':insertItems.some(item=>item.id===oldInsert) ? oldInsert : recommended.length===1?recommended[0].id:'';
    options(controls.insertId,insertItems,nextInsert,'Choose an insert / grade');controls.insertId.disabled=!selected;
    // 手動值（含刻意清空）不因材料篩選被覆寫；自動值才隨新條件重算。
    if(resetValues&&!manualCuttingValues){origin='median';controls.vc.value='';controls.feed.value='';}
    if(origin==='median')fillMedian();
    renderSetup();
  }
  function calculate(useMedian=false) {
    const values=input();
    return core.calculate(model,selected,{...values,vc:useMedian?'':values.vc,feed:useMedian?'':values.feed,useRecommendations:useMedian,allowReference:true,autoSelectInsert:!!controls.insertId.value});
  }
  function fillMedian() {
    const result=calculate(true);
    controls.vc.value=raw(result.recommendation?.vc);controls.feed.value=raw(result.recommendation?.feed);
  }
  function assembly() {
    if(!selected){$('assemblyChain').innerHTML='';return;}
    const holderText=straightShank() ? findings.criteria.gripDiameter!==null?`Ø${fmt(findings.criteria.gripDiameter)} mm shank`:'Choose shank Ød' : selected.holder?.partsNo||'Choose a holder';
    const steps=[['H',straightShank()?'Straight-shank clamping':'Machine-side holder',holderText]];
    if(selected.adapter)steps.push(['A','Matching 99151 adapter',selected.adapter.partsNo]);
    steps.push(['B','Boring bar',selected.bar.id]);
    $('assemblyChain').innerHTML=`<h3 class="section-title">Selected assembly</h3>`+steps.map(([icon,label,value])=>`<div class="assembly-step"><span class="assembly-icon" aria-hidden="true">${icon}</span><div><small>${esc(label)}</small><strong>${esc(value)}</strong></div></div>`).join('');
  }
  // 原圖只提供刀具外形與尺寸線；SVG遮罩與文字依目前選中資料替換尺寸，不修改來源PNG。
  function catalogImage(entry, label, compact=false, dimensions={}) {
    const preview={drawing:entry,dimensions,partLabel:label,language:isChinese?'zh-TW':'en'};
    const svg=NINEBORE_CATALOG_DIAGRAM.render(preview);
    if(!svg)return `<p class="field-help">${esc(translate('The dimension drawing for this part is unavailable.'))}</p>`;
    drawingPreviews.set(entry.key,preview);
    return `<div class="catalog-image-block${compact?' is-component':''}"><button type="button" class="catalog-image-link" data-enlarge-drawing="${esc(entry.key)}" aria-label="${esc(translate('Enlarge dimension drawing')+' · '+label)}">${svg}</button><div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2"><button type="button" class="btn text-button" data-enlarge-drawing="${esc(entry.key)}">${esc(translate('Enlarge dimension drawing'))}</button><a href="${pdf}#page=${entry.pdf_page}" target="_blank" rel="noopener">${esc(translate('Catalog p. '+entry.printed_page))} ↗</a></div></div>`;
  }
  function renderCatalogDrawings() {
    drawingPreviews.clear();
    const drawings=NINEBORE_CATALOG_DRAWINGS,b=selected?.bar;
    const entry=drawings.resolve(drawingManifest,drawings.barKey(b));
    if(!entry){
      $('diagramCanvas').innerHTML=`<p class="field-help py-4">${esc(translate(b?'The catalog drawing for this bar is unavailable.':'Choose a bar to view its catalog drawing.'))}</p>`;
      $('geometryCaption').textContent='';return;
    }
    const shank=Number.isFinite(selected.selectedShankD)?selected.selectedShankD:b.shankD;
    const facts=[
      [b.depthKind==='front_neck'?'Front-neck L1':'Boring depth L1',`${fmt(b.l1)} mm`],
      [Number.isFinite(b.l)?'Catalog length L':'Adjustable hole Ø',Number.isFinite(b.l)?`${fmt(b.l)} mm`:`${fmt(b.minD)}–${fmt(b.maxD)} mm`],
      ['Selected bar shank Ød',Number.isFinite(shank)?`Ø${fmt(shank)} mm`:translate('Choose shank Ød')]
    ];
    const components=[];
    if(selected.holder){const holderDrawing=drawings.resolve(drawingManifest,drawings.holderKey(selected.holder));if(holderDrawing)components.push({entry:holderDrawing,label:selected.holder.partsNo,title:'Machine-side holder',dimensions:selected.holder.dimensions_mm,thread:selected.holder.catalog_fields_original?.M});}
    if(selected.adapter){const adapterDrawing=drawings.resolve(drawingManifest,drawings.adapterKey(selected.adapter));if(adapterDrawing)components.push({entry:adapterDrawing,label:selected.adapter.partsNo,title:'Matching 99151 adapter',dimensions:selected.adapter.dimensions_mm});}
    const componentMarkup=components.length?`<details class="technical-details catalog-components mt-4"><summary>${esc(translate('Holder & adapter drawings'))}</summary><div class="catalog-component-list">${components.map(item=>`<section><p class="section-title mb-1">${esc(translate(item.title))}</p><p class="field-help mb-3">${esc(item.label)}</p>${catalogImage(item.entry,item.label,true,{holderD:item.dimensions?.['ØD'],holderL:item.dimensions?.L,thread:item.thread})}<p class="catalog-component-dimensions">${Object.entries(item.dimensions||{}).filter(([,value])=>Number.isFinite(value)).map(([label,value])=>`${esc(label)} ${fmt(value)} mm`).join(' · ')}</p></section>`).join('')}</div></details>`:'';
    $('diagramCanvas').innerHTML=`<p class="catalog-current-part">${esc(b.id)}</p>${catalogImage(entry,b.id,false,{diameter:Number(controls.diameter.value)||null,l1:b.l1,l:b.l,shankD:shank,shoulderD:b.shoulderD})}<p class="field-help mt-3">${esc(translate('Drawing dimensions update with your selected part and hole diameter.'))}</p><dl class="catalog-dimensions mt-3">${facts.map(([label,value])=>`<div><dt>${esc(translate(label))}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${b.series==='99121'?`<p class="field-help">${esc(translate('99121 rear length 50 (48) mm is a shared catalog label; its shank-option mapping is not specified.'))}</p>`:''}${componentMarkup}`;
    $('geometryCaption').textContent=translate(b.depthKind==='front_neck'?'This L1 is the front-neck dimension. Actual reach and workpiece clearance still need confirmation.':'Catalog L1 is compared with your required depth. Assembly projection and workpiece clearance remain setup checks.');
  }
  // 放大的是本次數字已更新的同一張SVG，而非重新開啟仍帶L/L1代號的來源圖片。
  $('diagramCanvas').addEventListener('click',event=>{
    const trigger=event.target.closest('[data-enlarge-drawing]'),preview=trigger&&drawingPreviews.get(trigger.dataset.enlargeDrawing);
    if(!preview)return;
    $('dimensionDialogTitle').textContent=preview.partLabel;
    $('largeDrawingCanvas').innerHTML=NINEBORE_CATALOG_DIAGRAM.render(preview);
    $('dimensionDialog').showModal();
  });
  $('closeDimensionDialog').addEventListener('click',()=>$('dimensionDialog').close());
  // 公差只描述工件尺寸需求，不自動改動名目孔徑、刀桿選擇或使用者切削值。
  function renderTolerance() {
    diameterTolerance=NINEBORE_DIAMETER_TOLERANCE.evaluate({diameter:controls.diameter.value,upper:controls.toleranceUpper.value,lower:controls.toleranceLower.value});
    const state=diameterTolerance,errors=state.errors||[];
    for(const [field,id] of [['upper','toleranceUpper'],['lower','toleranceLower']])controls[id].setAttribute('aria-invalid',String(errors.some(error=>error.field===field||error.field==='range')));
    $('diameterToleranceStack').classList.toggle('has-error',state.status==='invalid');
    const hint=$('diameterToleranceHint');hint.dataset.state=state.status;
    const messages={'invalid-number':'Enter a signed decimal deviation.','inverted':'Upper deviation must be greater than or equal to lower deviation.','nonpositive-limit':'Both hole limits must be greater than zero.','invalid-diameter':'Enter the nominal hole diameter to calculate limits.'};
    hint.textContent=state.status==='valid'?`${translate('Hole limits:')} ${toleranceFmt(state.min)}–${toleranceFmt(state.max)} mm`:state.status==='invalid'?translate(messages[errors[0]?.code]||'Enter a signed decimal deviation.'):state.status==='partial'?translate('Enter both deviations to show hole limits.'):state.status==='missing-diameter'?translate('Enter the nominal hole diameter to calculate limits.'):translate('Tolerance optional · upper / lower');
  }
  function renderSetup() {
    renderTolerance();
    calculation=calculate(origin==='median');const c=calculation,b=selected?.bar,toleranceComplete=['empty','valid'].includes(diameterTolerance.status);
    $('setupTitle').textContent=b?.id||'Select a boring bar';$('selectedType').textContent=b?`${b.series} · ${seriesNames[b.series]} · ${b.type}`:'Your assembly and cutting values will appear here.';
    $('setupStatus').textContent=!selected?'':c.errors.length||diameterTolerance.status==='invalid'?'Check inputs':c.referenceMode&&origin==='median'?'Trial reference values':Number.isFinite(c.rpm)?'Cutting values calculated':'Select cutting values';
    $('setupStatus').dataset.state=c.referenceMode?'reference':c.canCopy&&toleranceComplete?'ready':'review';
    $('resultRpm').textContent=$('mobileRpm').textContent=fmt(c.rpm,0);$('resultFeed').textContent=$('mobileFeed').textContent=fmt(c.feedRate,1);
    $('resultDepth').textContent=Number.isFinite(c.depth)?`${fmt(c.depth)} mm`:'—';$('mobileDepth').textContent=fmt(c.depth);
    $('resultL1').textContent=b?`${fmt(b.l1)} mm`:'—';$('l1Label').textContent=b?.depthKind==='front_neck'?'Front-neck L1':'Boring depth L1';
    renderChecks();
    $('referenceNote').hidden=!c.referenceMode;
    $('referenceNote').textContent=c.referenceMode?`${c.insert.parts} / NC30${isChinese?'：':': '}${translate('Suitable for the selected material.')}\n${translate('The regular-cutting table specifies')} ${c.cuttingRow.grade_candidates.join(' / ')}${isChinese?'；':'; '}${translate('this insert does not have that listed grade.')}\n${translate(origin==='manual'?'The displayed cutting values are your manual inputs.':'Shown values use the same-material NC30 interrupted-cutting row as a trial reference. Regular-cutting values are listed for manufacturer confirmation.')}`:'';
    $('referenceQuestions').hidden=!selected||!!c.recommendation&&!c.referenceMode;
    $('insertMaterialNotice').hidden=!rejectedInsert;
    $('insertMaterialNotice').textContent=rejectedInsert?`${translate('This grade is not listed for the selected material:')} ${rejectedInsert.grade}${isChinese?'。 ':'. '}${translate('Choose an applicable grade from the insert list.')}`:'';
    assembly();
    $('insertHint').textContent=c.insert?`${c.insert.coating} · ${c.insert.matchEvidence==='manufacturer_series_and_p162_part'?'Manufacturer-listed compatible insert':c.insert.exactGeometry?'Listed insert geometry':'Family shown in catalog; confirm the exact insert'}${c.insert.gradeMatch?' · Grade matches this cutting row':c.referenceMode?' · Material match / trial reference':''}`:selected?.cuttingStatus==='geometry_review'?'The catalog lists a 0602 family. Choose the actual insert to review the setup; its exact pairing needs confirmation.':selected?'Choose a listed insert / grade to set cutting values.':'';
    $('medianButton').disabled=!c.recommendation;
    $('medianButton').textContent=c.referenceMode?'Restore reference values':'Use median values';
    $('valueOrigin').textContent=origin==='median'&&c.recommendation?(c.referenceMode?'Trial reference · catalog middle values':'Site median · adjustable'):origin==='manual'?'Your cutting values':'Enter cutting values';
    const cut=c.usedCuttingRow||c.cuttingRow;
    $('cuttingSource').textContent=cut?`${cut.workpiece_material} · ${cut.cutting_condition_or_surface_finish}. Listed Vc: ${cut.cutting_speed.catalog_sequence.join(' / ')} m/min; f: ${cut.feed_per_revolution.catalog_sequence.join(' / ')} mm/rev. Catalog p. 162.`:'No confirmed cutting row for this material and condition. Manual values remain separate from catalog recommendations.';
    $('aeResult').textContent=c.ae!==null?`Radial Ae ${(fmt(c.ae))} mm${c.aeLimit!==null?` · table value ${fmt(c.aeLimit)} mm for this Re`:''}.`:'Ae = (finished D − pre-bored D) / 2.';
    const messages=selected?[...new Set([...c.errors,...c.warnings.filter(text=>!text.includes('user-entered cutting values')&&!text.includes('manually entered cutting'))])]:[];
    $('setupIssues').hidden=!messages.length;
    // 材料參考與一般夾持的長篇依據可展開閱讀；真正輸入錯誤與超量警告仍直接顯示。
    const detailedNotes=!c.errors.length&&(c.referenceMode||straightShank())&&!c.warnings.some(text=>text.includes('exceeds the listed')||text.includes('HRC < 50')||text.includes('physical geometry'));
    $('setupIssues').innerHTML=messages.length?detailedNotes?`<details><summary>Pairing evidence & pending checks (${messages.length})</summary><ul class="mt-2">${messages.map(text=>`<li>${esc(text)}</li>`).join('')}</ul></details>`:`<ul>${messages.slice(0,3).map(text=>`<li>${esc(text)}</li>`).join('')}</ul>${messages.length>3?`<details class="mt-2"><summary>More setup notes (${messages.length-3})</summary><ul class="mt-2">${messages.slice(3).map(text=>`<li>${esc(text)}</li>`).join('')}</ul></details>`:''}`:'';
    for(const id of ['vc','feed']){const invalid=origin==='manual'&&(!Number.isFinite(Number(controls[id].value))||Number(controls[id].value)<=0);controls[id].classList.toggle('is-invalid',invalid&&!!selected);controls[id].setAttribute('aria-invalid',String(invalid&&!!selected));}
    $('copyButton').disabled=!c.canCopy||!toleranceComplete;$('copyFeedback').textContent='';copyText=c.canCopy&&toleranceComplete?buildCopy():'';
    $('barSource').hidden=!b;if(b)$('barSource').href=`${pdf}#page=${b.sourcePage-147}`;
    renderCatalogDrawings();
    $('mobileSummary').hidden=!selected||(!Number.isFinite(c.rpm)&&!Number.isFinite(c.depth));
    $('mobileSummary').setAttribute('aria-label',`View boring setup: S ${fmt(c.rpm,0)} rpm, feed ${fmt(c.feedRate,1)} mm/min, requested depth ${fmt(c.depth)} mm.`);
    saveURL();localize();
  }
  function renderChecks() {
    if(!selected){$('selectionChecks').innerHTML='';return;}
    const c=calculation,b=selected.bar;
    const material=translate(controls.material.value||'Material not set');
    const materialText=c.insert?`${material} → ${c.insert.grade}${c.referenceMode?' · '+translate('material suitable'):c.insert.gradeMatch?' · '+translate('Material grade matched'):''}`:material+' · '+translate('Choose an insert / grade');
    const shankText=straightShank() ? findings.criteria.gripDiameter===null?translate('Choose shank Ød'):Number.isFinite(b.shankD)?`Ø${fmt(b.shankD)} mm · ${translate('Catalog shank listed')}`:selected.shankStatus==='confirmed'?`Ø${fmt(selected.selectedShankD)} mm · ${translate('Available shank option')}`:`Ø${fmt(findings.criteria.gripDiameter)} mm · ${translate('Drawing option; confirm applicable part')}` : selected.holder?selected.holder.partsNo+(selected.holder.requiresExternal32?' · '+translate('External Ø32 chuck required'):''):translate('Choose a holder');
    const reachText=c.depth===null?translate('Enter depth to compare reach'):b.depthKind==='front_neck'?translate('Front-neck dimension only; check actual projection'):selected.adapter?translate('Adapter insertion / projection to confirm'):translate('Requested depth within catalog L1');
    const checks=[['Material & insert',materialText],['Clamping / shank',shankText],['Reach check',reachText]];
    $('selectionChecks').innerHTML=checks.map(([label,value])=>`<div><dt>${esc(translate(label))}</dt><dd>${esc(value)}</dd></div>`).join('');
  }
  function buildCopy() {
    const c=calculation,b=selected.bar;
    const lines=['NineBore | Boring setup',`Finished hole: Ø${fmt(c.diameter)} mm | Requested depth: ${fmt(c.depth)} mm`,`Material: ${controls.material.value} | ${controls.condition.value}`,`Bar: ${b.id} | ${b.type}`,`Catalog hole range: Ø${fmt(b.minD)}–${fmt(b.maxD)} mm | L1 ${fmt(b.l1)} mm (${b.depthKind})`,`Holder: ${selected.holder?.partsNo||'Existing chuck'}`];
    if(diameterTolerance.status==='valid')lines.splice(2,0,`${translate('Hole tolerance:')} ${diameterTolerance.upperText} / ${diameterTolerance.lowerText} mm | ${translate('Hole limits:')} Ø${toleranceFmt(diameterTolerance.min)}–Ø${toleranceFmt(diameterTolerance.max)} mm`);
    if(selected.adapter)lines.push(`Adapter: ${selected.adapter.partsNo}`);
    if(straightShank()&&findings.criteria.gripDiameter!==null)lines.push(`Bar shank diameter: Ø${fmt(findings.criteria.gripDiameter)} mm`);
    lines.push(`Insert: ${c.insert.parts} | Grade: ${c.insert.grade}`,`Vc: ${fmt(c.vc)} m/min | f: ${fmt(c.feed)} mm/rev`,`Spindle speed: ${fmt(c.rpm,0)} rpm | Feed rate: ${fmt(c.feedRate,1)} mm/min`,`Values: ${origin==='median'?'Site median starting values':'User cutting values'}`);
    if(c.ae!==null)lines.push(`Radial stock Ae: ${fmt(c.ae)} mm`);
    lines.push('Requested depth is not a programmed Z or machining cycle. Confirm machine/clamping limits and workpiece clearance.',...c.warnings,new URL(`${pdf}#page=${b.sourcePage-147}`,location.href).href);
    return lines.map(translate).join('\n');
  }
  function saveURL() {
    const params=new URLSearchParams();for(const id of ids)if(controls[id].value&&(id!=='shankDiameter'||straightShank()))params.set(id,controls[id].value);
    if(isChinese)params.set('lang','zh-TW');
    if(selectedId)params.set('bar',selectedId);params.set('values',origin);history.replaceState(null,'',location.pathname+'?'+params+location.hash);
    const alternate=new URL(location.href);if(isChinese)alternate.searchParams.delete('lang');else alternate.searchParams.set('lang','zh-TW');
    $('languageSwitch').href=alternate.href;$('languageSwitch').textContent=isChinese?'English':'繁體中文';$('languageSwitch').setAttribute('hreflang',isChinese?'en':'zh-Hant');$('languageSwitch').setAttribute('lang',isChinese?'en':'zh-Hant');
  }
  function loadExample() {
    rejectedInsert=null;manualCuttingValues=false;
    controls.diameter.value='8';controls.depth.value='12';controls.material.value='Non-ferrous metal';controls.holderId.value='00-99146-BT40H';
    for(const id of ['toleranceUpper','toleranceLower','shankDiameter','prebore','machineMaxRpm','insertId'])controls[id].value='';conditions('Regular cutting');selectedId='';example=true;origin='median';renderFind({resetValues:true});
  }
  for(const id of ['diameter','depth','material','holderId','shankDiameter'])controls[id].addEventListener(['diameter','depth'].includes(id)?'input':'change',()=>{if(!model)return;example=false;if(id==='material'){conditions();controls.insertId.value='';rejectedInsert=null;}renderFind({resetValues:true});});
  $('candidateList').addEventListener('change',event=>{if(event.target.name!=='barChoice')return;selectedId=event.target.value;example=false;controls.insertId.value='';rejectedInsert=null;renderFind({resetValues:true});});
  controls.insertId.addEventListener('change',()=>{rejectedInsert=null;example=false;if(!manualCuttingValues){origin='median';fillMedian();}renderSetup();});
  controls.condition.addEventListener('change',()=>{example=false;controls.insertId.value='';rejectedInsert=null;renderFind({resetValues:true});});
  for(const id of ['vc','feed','prebore','machineMaxRpm'])controls[id].addEventListener('input',()=>{if(!model)return;example=false;if(id==='vc'||id==='feed'){origin='manual';manualCuttingValues=true;}renderSetup();});
  for(const id of ['toleranceUpper','toleranceLower']){
    controls[id].addEventListener('input',()=>{if(!model)return;example=false;$('exampleNote').hidden=true;renderSetup();});
    controls[id].addEventListener('blur',()=>{if(!model)return;const value=NINEBORE_DIAMETER_TOLERANCE.evaluate({diameter:controls.diameter.value,upper:controls.toleranceUpper.value,lower:controls.toleranceLower.value});const field=id==='toleranceUpper'?'upper':'lower';if(Number.isFinite(value[field]))controls[id].value=value[field+'Text'];renderSetup();});
  }
  // 精調保留手動小數位；聚焦後滾輪及方向鍵採指定增量，不讓欄位以1mm跳動。
  for(const [id,step] of [['diameter',.1],['depth',.1],['prebore',.1],['vc',1],['feed',.01]]){
    const control=controls[id],adjust=sign=>{if(!control.value||!Number.isFinite(Number(control.value)))return;const next=Number((Number(control.value)+sign*step).toFixed(6));if(next<=0)return;control.value=String(next);control.dispatchEvent(new Event('input',{bubbles:true}));};
    control.addEventListener('keydown',event=>{if(!['ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();adjust(event.key==='ArrowUp'?1:-1);});
    control.addEventListener('wheel',event=>{if(document.activeElement!==control||!event.deltaY||event.ctrlKey)return;event.preventDefault();adjust(event.deltaY<0?1:-1);},{passive:false});
  }
  $('medianButton').addEventListener('click',()=>{origin='median';manualCuttingValues=false;example=false;fillMedian();renderSetup();});$('exampleButton').addEventListener('click',loadExample);
  $('resetButton').addEventListener('click',()=>{for(const id of ids)controls[id].value='';selectedId='';origin='manual';manualCuttingValues=false;example=false;rejectedInsert=null;conditions('Regular cutting');renderFind();});
  $('finderForm').addEventListener('submit',event=>event.preventDefault());
  $('copyButton').addEventListener('click',async()=>{if(!copyText)return;const text=copyText;try{await navigator.clipboard.writeText(text);if(copyText===text)$('copyFeedback').textContent=translate('Boring setup copied.');}catch{$('copyFeedback').textContent=translate('Copy is unavailable. Select the displayed values to copy.');}});
  async function layout(part) {
    const response=await fetch(`../../${part}/${part}.html`);if(!response.ok)return;$(part+'-placeholder').innerHTML=await response.text();
    localize();
    if(part==='header'){const button=$('mobileMenuBtn'),nav=$('topNav');if(!button||!nav)return;button.setAttribute('aria-controls','topNav');button.setAttribute('aria-expanded','false');button.addEventListener('click',()=>{const open=nav.classList.toggle('active');button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',translate(open?'Close Menu':'Open Menu'));});}
  }
  async function start() {
    try {
      const paths=['./data/product-inventory.json','./data/clamping-data.json','./data/cutting-data.json','./confirmed-specs.json','./assets/line-drawings/manifest.json'];
      const data=await Promise.all(paths.map(async path=>{const response=await fetch(path);if(!response.ok)throw Error(path);return response.json();}));
      model=core.normalize(...data.slice(0,4));drawingManifest=data[4];
      options(controls.material,model.materials,'','Choose material');
      options(controls.holderId,[...model.holders.map(holder=>({id:holder.id,label:`${holder.machineInterface==='SB32'?'Ø32 Weldon':holder.machineInterface} · ${holder.partsNo}`})),{id:'straight_shank',label:'Straight shank · Ød'}],'','Choose holder / shank');
      // 只提供來源明列的直柄尺寸；99121圖面選項與已確認柄徑仍分開標示。
      const generalBars=model.bars.filter(bar=>['99101','99121'].includes(bar.series));
      const shankSizes=[...new Set(generalBars.flatMap(bar=>Number.isFinite(bar.shankD)?[bar.shankD]:bar.shankOptions||[]))].sort((a,b)=>b-a);
      options(controls.shankDiameter,shankSizes.map(size=>({id:String(size),label:`Ø${fmt(size)} mm${generalBars.some(bar=>bar.shankD===size||(bar.shankOptionsConfirmed&&bar.shankOptions.includes(size)))?'':' · confirm part number'}`})),'','Choose shank diameter');
      const params=new URLSearchParams(location.search);
      if(!ids.some(id=>params.has(id))&&!params.has('bar'))loadExample();else {
        for(const id of ids)if(params.has(id))controls[id].value=params.get(id);
        conditions(params.get('condition')||'Regular cutting');
        origin=params.get('values')==='median'?'median':'manual';manualCuttingValues=origin==='manual'&&(params.get('values')==='manual'||params.has('vc')||params.has('feed'));example=false;renderFind({restoreBar:params.get('bar')||'',restoreInsert:params.get('insertId')||''});
      }
      $('loading').hidden=true;$('workbench').hidden=false;
    } catch(error) {$('loading').hidden=true;$('loadError').hidden=false;$('loadError').textContent=translate('NineBore catalog data could not be loaded. Reload the page to try again.');console.error(error);}
  }
  localize();Promise.all([layout('header'),layout('footer')]).catch(()=>{});start();
})();
