/* Micro 互動樣板：選型、原始轉速／進給與結果使用同一份研究 JSON。
 * 上游切換保留有效輸入，失效選刀清空並說明；不把輸入悄悄夾進範圍。
 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const ids = ["material","angle","diameter","nonFerrousType","variant","holder","rpm","feedPerRev","machineMaxRpm","geometryMode","referenceDiameter","referenceDepth"];
  const controls = Object.fromEntries(ids.map(id=>[id,$(id)]));
  const core = MICRO_SPOT_CORE;
  const esc = value => String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const fmt = (value,digits=4) => Number.isFinite(value)?Number(value.toFixed(digits)).toLocaleString("en-US",{maximumFractionDigits:digits}):"—";
  const raw = value => Number.isFinite(value)?String(Number(value.toFixed(8))):"";
  const range = (values,unit) => values?`${fmt(values[0],6)}–${fmt(values[1],6)} ${unit}`:"—";
  let data, state, copyText="", origin="manual", example=false, calibrationAssembly=null;
  const urlIssues = new Map();
  const input = () => ({...Object.fromEntries(ids.map(id=>[id,controls[id].value])),requireHardnessConfirmation:false});
  function fillOptions(select,entries,previous) {
    select.replaceChildren(new Option(select.id==="variant"?"Select an insert":"Select a holder",""),...entries.map(entry=>{const option=new Option(entry.label,entry.value);option.disabled=entry.disabled===true;return option;}));
    select.value=entries.some(entry=>entry.value===previous&&!entry.disabled)?previous:"";
  }
  function completeWorkpiece(values) {return Boolean(values.material&&values.angle&&values.diameter&&Number(values.diameter)>0);}
  function matchingText(values,candidates) {
    if(!completeWorkpiece(values))return "Choose a material, point angle and spot diameter to find matching inserts.";
    if(candidates.length)return `${candidates.length} matching insert / grade ${candidates.length===1?"option":"options"} · dimensions and material checked together.`;
    const base=core.findCandidates(data,{material:values.material,angle:values.angle});
    if(!base.length) {
      const angles=[...new Set(core.findCandidates(data,{material:values.material}).map(candidate=>candidate.insert.includedAngleDeg))];
      return `No ${values.angle}° Micro insert is listed for this material. Available angles: ${angles.map(angle=>`${angle}°`).join(", ")||"none"}.`;
    }
    const rows=base;
    const min=Math.min(...rows.map(candidate=>candidate.insert.WminMm)), max=Math.max(...rows.map(candidate=>candidate.insert.WmaxMm));
    const d=Number(values.diameter);
    if(d>max)return `Ø${fmt(d,6)} mm is too large. Maximum for this material and angle: Ø${fmt(max)} mm.`;
    if(d<min)return `Ø${fmt(d,6)} mm is too small. Minimum nominal opening: Ø${fmt(min)} mm.`;
    return "No insert and grade match this material, angle and diameter.";
  }
  function refreshSelections({reportCleared=false}={}) {
    const values=input();
    const candidates=completeWorkpiece(values)?core.findCandidates(data,values):[];
    const previousVariant=controls.variant.value, previousHolder=controls.holder.value;
    fillOptions(controls.variant,candidates.map(candidate=>({value:candidate.id,label:`${candidate.insert.id} · ${candidate.variant.gradeId} · ${candidate.id}`})),previousVariant);
    const holderOptions=core.holderOptions(data,values);
    fillOptions(controls.holder,holderOptions.map(holder=>({value:holder.partNumber,label:`${holder.partNumber} · Ø${holder.shankDiameterMm} · L${holder.lengthMm} · ${holder.shankMaterial}${holder.available?"":" · Al / Al-alloy only"}`,disabled:!holder.available})),previousHolder);
    const cleared=[];
    if(previousVariant&&!controls.variant.value)cleared.push("The previous insert was cleared because it no longer matches the workpiece and spot.");
    if(previousHolder&&!controls.holder.value)cleared.push("The previous holder was cleared. The XL holder requires aluminum or aluminum alloy.");
    if(reportCleared){$("selectionNotice").textContent=cleared.join(" ");$("selectionNotice").hidden=!cleared.length;}
    controls.variant.disabled=!candidates.length;
    $("matchingMessage").textContent=matchingText(values,candidates);
    $("matchingMessage").classList.toggle("no-match",completeWorkpiece(values)&&!candidates.length);
  }
  function render() {
    if(!data)return;
    // 校正僅限同一刀片／刀柄／角度；更換後清除參考點，不把舊 Z 套到新組裝。
    const assembly=[controls.variant.value,controls.holder.value,controls.angle.value].join("|");
    if(calibrationAssembly!==null&&calibrationAssembly!==assembly&&(controls.referenceDiameter.value||controls.referenceDepth.value)) {
      controls.referenceDiameter.value="";controls.referenceDepth.value="";
      $("selectionNotice").textContent="The measured reference was cleared after changing the insert, holder or point angle.";$("selectionNotice").hidden=false;
    }
    calibrationAssembly=assembly;
    const values=input(); state=core.calculate(data,values);
    const selected=state.selected, insert=selected?.insert, holder=state.holder;
    const iso=state.material?.isoGroup||"";$("materialBadge").dataset.iso=iso;$("materialBadge").textContent=iso||"—";
    const geometry=state.geometry, measured=values.geometryMode==="measured";
    $("subtypeGroup").hidden=values.material!=="nonFerrous";
    $("measuredInputs").hidden=!measured;
    $("datumHint").textContent=measured?"Use one measured diameter / positive depth from the same assembled tool. This corrects the depth offset using the nominal face angle.":"Z0 is the work surface; the short flat tip is touched off there. Nominal depth uses an ideal straight face and catalog Wmin; Re is not modeled.";
    $("diameterHint").textContent=insert?`Catalog nominal Ø${fmt(insert.WminMm)}–${fmt(insert.WmaxMm)} mm. Adjust by 0.001 mm.`:"Nominal spot opening at the work surface. Adjust by 0.001 mm.";
    for(const id of ids) {
      const error=state.fieldErrors[id]||(id==="referenceDiameter"?geometry.errors.find(text=>text.includes("Dref")):id==="referenceDepth"?geometry.errors.find(text=>text.includes("tref")):null);const target=$(`${id}Error`);
      if(target)target.textContent=error||"";
      controls[id].classList.toggle("is-invalid",Boolean(error));controls[id].setAttribute("aria-invalid",String(Boolean(error)));
    }
    $("insertSummary").hidden=!selected;
    $("insertSummary").innerHTML=selected?`<strong>${esc(selected.variant.gradeId)}</strong><span>${esc(selected.variant.coating)} · K20F · ${insert.indexableCuttingEdges} indexable edges</span>`:"";
    $("holderHint").textContent=holder?`Holder code ${holder.orderCode} · ${holder.shankMaterial} · Ø${holder.shankDiameterMm} mm · overall L ${holder.lengthMm} mm${holder.rawUnbalanceNote?` · ${holder.rawUnbalanceNote}`:""}.`:"Holder L is overall length. All listed holders support X060 inserts.";
    $("rpmHint").textContent=state.spindleRange?`Available ${range(state.spindleRange,"rpm")}`:"No speed range meets the machine limit.";
    if(!values.material)$("rpmHint").textContent="Catalog 8,000–40,000 rpm. Select a material first.";
    $("feedHint").textContent=state.feedRange?`Catalog ${range(state.feedRange,"mm/rev")}`:"Select an insert to see its range.";
    $("midpointButton").disabled=!state.feedRange||!state.spindleRange;
    $("valueOrigin").textContent=origin==="midpoint"?"Range midpoints · adjustable starting values.":origin==="example"?"Example values · adjustable starting setup.":origin==="retained"?"Retained speed and feed · check the new ranges.":"Your spindle speed and feed settings.";
    $("exampleNote").hidden=!example;
    $("depthLabel").textContent=measured?"Depth t · measured reference":"Nominal depth t";
    $("zLabel").textContent=measured?"Z · measured reference":"Nominal Z";
    $("resultDepth").textContent=selected&&geometry.valid?fmt(geometry.depth,8):"—";
    $("resultZ").textContent=selected&&geometry.valid?fmt(geometry.z,8):"—";
    // 手機底列與結果卡使用相同的有效 Z；無效或未完成時顯示破折號。
    $("mobileZ").textContent=$("resultZ").textContent;
    $("mobileZLabel").textContent=measured?"Measured Z · mm":"Nominal Z · mm";
    $("depthReference").textContent=measured?"Z0 = work surface · single-point measured calibration, using the nominal face slope.":"Z0 = work surface · nominal flat-tip tool-length reference; Re is not modeled.";
    $("geometryFeedback").textContent=selected?[...geometry.errors,...geometry.conditions].join(" "):"Select a matching insert to calculate depth and Z.";
    if(selected&&geometry.roundingMismatch)$("geometryFeedback").textContent+=` Model estimate: t ${fmt(geometry.computedDepth,8)} mm, Z ${fmt(geometry.computedZ,8)} mm; not a valid Z target.`;
    $("diagramModeLabel").textContent=measured?"Measured reference · mm":"Nominal flat-tip model · mm";
    $("geometryCaption").textContent=measured?"The measured datum corrects the axial offset for this tool assembly. The nominal face angle and unmodeled Re still apply.":"Depth and Z assume the short flat tip is touched off at work surface Z0. Nominal straight-face estimate; Re and actual insert profile are not modeled.";
    $("resultRpm").textContent=$("mobileRpm").textContent=fmt(state.rpm,0);
    $("resultFeed").textContent=$("mobileFeed").textContent=fmt(state.feedRate,3);
    $("provisionalNote").hidden=!state.cuttingValid||state.valid;
    $("resultInsert").textContent=insert?.id||"Choose a matching insert";
    $("resultGrade").textContent=selected?`${selected.variant.gradeId} · ${selected.variant.coating}`:"";
    $("resultCode").textContent=selected?.id||"—";
    $("resultAngle").textContent=insert?`${insert.includedAngleDeg}°`:"—";
    $("resultRange").textContent=insert?`${fmt(insert.WminMm)}–${fmt(insert.WmaxMm)} mm`:"—";
    $("resultTmax").textContent=insert?`${fmt(insert.TmaxMm)} mm`:"—";
    $("resultHolder").textContent=holder?.partNumber||"—";
    $("setupStatus").dataset.status=state.status;
    $("setupStatus").textContent={valid:"Setup ready",conditional:"Confirm conditions",invalid:"Check input","no-match":"No matching tool",empty:"Complete setup"}[state.status];
    const messages=[...state.errors,...state.conditions,...urlIssues.values()];
    if(!messages.length&&state.missingFields.length) {
      const labels={material:"workpiece material",angle:"point angle",diameter:"spot diameter",variant:"insert / grade",holder:"holder",rpm:"spindle speed",feedPerRev:"feed per revolution",referenceDiameter:"measured diameter Dref",referenceDepth:"measured depth tref"};
      messages.push(`To complete your setup, choose or enter: ${state.missingFields.map(id=>labels[id]||id).join(", ")}.`);
    }
    $("setupIssues").hidden=!messages.length;
    $("setupIssues").classList.toggle("error-notice",Boolean(state.errors.length||urlIssues.size));
    $("setupIssues").innerHTML=messages.length?`<ul>${[...new Set(messages)].map(message=>`<li>${esc(message)}</li>`).join("")}</ul>`:"";
    $("urlMessage").hidden=!urlIssues.size;$("urlMessage").textContent=[...urlIssues.values()].join(" ");
    $("copyButton").disabled=!state.canCopy||urlIssues.size>0;
    $("copyFeedback").textContent="";
    $("conversionNote").textContent=state.derivedVc!==null?`Converted Vc = π × D × S / 1000 = ${fmt(state.derivedVc,3)} m/min. This is a conversion, not a catalog Vc recommendation.`:"Converted Vc can be viewed after a complete cutting setup is entered.";
    $("assemblyNote").textContent=holder?`Screw ${holder.screw} · tightening torque ${holder.torqueNm} Nm · key ${holder.key}. A torque screwdriver is recommended.${holder.rawUnbalanceNote?` XL catalog note: ${holder.rawUnbalanceNote}.`:""}`:"Select a holder for its screw, torque and key information.";
    $("geometryFormula").textContent=measured?`t = tref + (D − Dref) / [2 × tan(α/2)]; Z = −t. Dref ${fmt(geometry.referenceDiameter,8)} mm at tref ${fmt(geometry.referenceDepth,8)} mm. Single-point calibration of the same assembly; Re is not modeled.`:"Nominal t = (D − Wmin) / [2 × tan(α/2)]; Z = −t. This is a derived straight-face / short-flat-tip model, not a manufacturer-verified Z formula. The tool axis is perpendicular to a flat/local-flat work surface; Re is not modeled.";
    $("diagramCanvas").innerHTML=MICRO_SPOT_DIAGRAMS.renderSection({insert,diameter:core.finiteNumber(values.diameter),geometry});
    $("mobileResults").hidden=!state.cuttingValid;
    $("mobileResults").setAttribute("aria-label",`View cutting setup: spindle speed ${fmt(state.rpm,0)} rpm, feed rate ${fmt(state.feedRate,3)} mm/min, ${measured?"measured-reference":"nominal"} Z ${selected&&geometry.valid?`${fmt(geometry.z,8)} mm`:"unavailable"}.`);
    copyText=state.canCopy&&!urlIssues.size?buildCopy(values):"";
    if(!urlIssues.size)updateURL(values);
  }
  function updateURL(values) {
    const params=new URLSearchParams();
    for(const name of ids)if(values[name]!=="")params.set(name,values[name]);
    const search=params.toString();history.replaceState(null,"",`${location.pathname}${search?`?${search}`:""}${location.hash}`);
  }
  function buildCopy(values) {
    const item=state.selected, insert=item.insert, geometry=state.geometry;
    const basis=origin==='midpoint'?'catalog-range midpoints used as adjustable starting values':origin==='example'?'example starting values':origin==='retained'?'values retained from previous selections and checked against the current catalog range':'user-entered values within the catalog range';
    const lines=[
      'Micro Spot Drill | Spotting',
      `Material: ${item.material.catalogLabel}${values.nonFerrousType?` | ${values.nonFerrousType}`:''}`,
      `Insert: ${insert.id} | Grade: ${item.variant.gradeId} | Coating: ${item.variant.coating}`,
      `Insert order code: ${item.id}`,
      `Holder: ${state.holder.partNumber} | Code: ${state.holder.orderCode}`,
      `Point angle: ${insert.includedAngleDeg}° | Nominal opening D: ${values.diameter} mm`,
      `Spindle speed S: ${fmt(state.rpm,0)} rpm`,
      `Feed per revolution f: ${fmt(state.feedPerRev,6)} mm/rev`,
      `Feed rate Vf = S × f: ${fmt(state.feedRate,3)} mm/min`,
      values.machineMaxRpm?`Machine maximum: ${values.machineMaxRpm} rpm`:'Machine maximum: not specified',
      `Value basis: ${basis}`,
      `${geometry.mode==='measured'?'Measured-reference estimate':'Nominal flat-tip model'} depth t: ${fmt(geometry.depth,8)} mm | Z: ${fmt(geometry.z,8)} mm`,
      'Z0 = work surface; downward Z is negative. Tool axis perpendicular to a flat/local-flat surface.',
      `Depth / Z basis: ${state.geometryBasis}`
    ];
    if(geometry.mode==='measured')lines.push(`Same-assembly reference: Dref ${fmt(geometry.referenceDiameter,8)} mm at positive depth tref ${fmt(geometry.referenceDepth,8)} mm.`);
    lines.push(`Catalog Wmin–Wmax: ${insert.WminMm}–${insert.WmaxMm} mm | Tmax: ${insert.TmaxMm} mm | Re: ${insert.ReMm} mm`,
      'Derived straight-face model; Re, angle tolerance and actual cutting profile are not reconstructed.',
      'Source dimensions: Micro Spot Drill, printed p. 25 (PDF page 2)',
      new URL('../micro-spot-plan/sources/micro-spot-catalog-p24-25.pdf#page=2',location.href).href);
    return lines.join('\n');
  }
  function readInitial() {
    const params=new URLSearchParams(location.search);
    const alias={carbonLow:"carbonSteel",carbonHigh:"carbonSteel",lowAlloy:"alloySteel",highAlloy:"alloySteel",hardened:"hardenedSteel"};
    const enumValues={material:data.materials.map(item=>item.id),angle:["90","120","142"],variant:data.inserts.flatMap(item=>item.variants.map(variant=>variant.orderCode)),holder:data.holders.map(item=>item.partNumber),nonFerrousType:["aluminum","aluminumAlloy","brass","copper","plastic","acrylic"],geometryMode:["nominal","measured"]};
    for(const id of ids) if(params.has(id)) {
      let value=params.get(id);if(id==="material")value=alias[value]||value;
      const valid=enumValues[id]?enumValues[id].includes(value):value.trim()!==""&&Number.isFinite(Number(value))&&Number(value)>0;
      if(valid)controls[id].value=value;
      else urlIssues.set(id,`The URL value for ${id} could not be applied. Choose a valid value.`);
    }
    if(!params.has("variant")&&params.has("insert")) {
      const insert=data.inserts.find(item=>item.id===params.get("insert"));
      const variants=insert?.variants.filter(item=>!params.has("grade")||item.gradeId===params.get("grade"))||[];
      if(variants.length===1)controls.variant.value=variants[0].orderCode;
      else if(!insert||params.has("grade")&&!variants.length)urlIssues.set("variant","The insert / grade in the URL is not a listed Micro combination.");
    }
  }
  // 樣板範例清楚標示為示範條件，不假稱每個工件都有單一最佳轉速。
  function loadExample() {
    for(const id of ids)controls[id].value="";
    controls.material.value="stainless";controls.angle.value="90";controls.diameter.value="0.5";controls.geometryMode.value="nominal";calibrationAssembly=null;
    refreshSelections();controls.variant.value="01X0082";controls.holder.value="00-99619-X060-06";controls.rpm.value="16000";controls.feedPerRev.value="0.005";
    example=true;origin="example";urlIssues.clear();$("selectionNotice").hidden=true;render();
  }
  async function start() {
    try {
      const response=await fetch("../micro-spot-plan/research-data.json");if(!response.ok)throw Error("Catalog data failed to load");data=await response.json();
      for(const material of data.materials)controls.material.add(new Option(material.catalogLabel,material.id));
      fillOptions(controls.variant,data.inserts.flatMap(insert=>insert.variants.map(variant=>({value:variant.orderCode,label:variant.partNumber}))),"");
      fillOptions(controls.holder,data.holders.map(holder=>({value:holder.partNumber,label:holder.partNumber})),"");
      for(const id of ids){const existing=controls[id].getAttribute("aria-describedby")||"";if($(`${id}Error`))controls[id].setAttribute("aria-describedby",`${existing} ${id}Error`.trim());}
      readInitial();refreshSelections({reportCleared:true});render();$("loading").hidden=true;$("workspace").hidden=false;
    } catch(error){$("loading").hidden=true;$("loadError").hidden=false;$("loadError").textContent="Micro Spot Drill data could not be loaded. Reload this local preview to try again.";}
  }
  $("calculatorForm").addEventListener("submit",event=>event.preventDefault());
  for(const id of ids)controls[id].addEventListener(["material","angle","nonFerrousType","variant","holder","geometryMode"].includes(id)?"change":"input",()=>{
    urlIssues.delete(id);example=false;
    // 保留舊 S/f 時重新標示來源，不能仍宣稱它們是新材料／機台範圍的中點。
    if(["material","angle","variant","machineMaxRpm"].includes(id)&&origin!=="manual")origin="retained";
    if(id==="material"&&controls.material.value!=="nonFerrous")controls.nonFerrousType.value="";
    if(["material","angle","diameter","nonFerrousType"].includes(id))refreshSelections({reportCleared:true});
    if(["rpm","feedPerRev"].includes(id))origin="manual";render();
  });
  for(const [id,step,digits] of [["diameter",.001,6],["referenceDiameter",.001,6],["referenceDepth",.001,6],["rpm",100,0],["feedPerRev",.001,6]]) {
    const adjust=direction=>{controls[id].value=raw(Math.max(step,Number((Number(controls[id].value||0)+direction*step).toFixed(digits))));controls[id].dispatchEvent(new Event("input",{bubbles:true}));};
    controls[id].addEventListener("keydown",event=>{if(!["ArrowUp","ArrowDown"].includes(event.key))return;event.preventDefault();adjust(event.key==="ArrowUp"?1:-1);});
    controls[id].addEventListener("wheel",event=>{if(document.activeElement!==controls[id])return;event.preventDefault();adjust(event.deltaY<0?1:-1);},{passive:false});
  }
  $("exampleButton").addEventListener("click",loadExample);
  $("resetButton").addEventListener("click",()=>{for(const id of ids)controls[id].value="";controls.geometryMode.value="nominal";calibrationAssembly=null;urlIssues.clear();origin="manual";example=false;$("selectionNotice").hidden=true;refreshSelections();render();});
  $("midpointButton").addEventListener("click",()=>{if(!state?.spindleRange||!state?.feedRange)return;controls.rpm.value=raw((state.spindleRange[0]+state.spindleRange[1])/2);controls.feedPerRev.value=raw((state.feedRange[0]+state.feedRange[1])/2);origin="midpoint";example=false;render();});
  $("copyButton").addEventListener("click",async()=>{if(!copyText)return;const text=copyText;try{await navigator.clipboard.writeText(text);if(copyText===text)$("copyFeedback").textContent="Cutting setup copied.";}catch{$("copyFeedback").textContent="Copy is unavailable. Select the displayed results to copy them.";}});
  async function layout(part){const response=await fetch(`../../${part}/${part}.html`);if(!response.ok)return;$(`${part}-placeholder`).innerHTML=await response.text();if(part==="header"){const button=$("mobileMenuBtn"),nav=$("topNav");if(!button||!nav)return;button.setAttribute("aria-controls","topNav");button.setAttribute("aria-expanded","false");button.addEventListener("click",()=>{const open=nav.classList.toggle("active");button.setAttribute("aria-expanded",String(open));button.setAttribute("aria-label",open?"Close Menu":"Open Menu");});}}
  Promise.all([layout("header"),layout("footer")]).catch(()=>{});start();
})();
