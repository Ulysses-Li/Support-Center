/* 三條件在同一候選上判斷；結果連結只從白名單產品及原資料產生。 */
(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const number = value => Number(Number(value).toFixed(4)).toLocaleString("en-US", {maximumFractionDigits:4});
  const smallScreen = matchMedia("(max-width:575.98px)");
  const products = [
    {id:"ace",name:"ACE Spot Drill",kicker:"REPLACEABLE INSERT",description:"Spotting with catalog-based depth and cutting data.",href:"../../CuttingData/AceSpotDrill/index.html"},
    {id:"micro",name:"Micro Spot Drill",kicker:"MICRO SPOTTING",description:"Small spot diameters for precise drill positioning.",href:"../micro-spot-plan/index.html"},
    {id:"nc",name:"NC Spot Drill",kicker:"MULTI-FUNCTION",description:"Choose the insert, grade and compatible holder.",href:"../../CuttingData/NCSpotDrill/index.html"}
  ];
  let records = SPOTTING_SELECTOR.buildCandidates({aceData:PRODUCT_PAGE_DATA,aceGeometry:{getChamferGeometry,calculateSpotting},ncData:NC_SPOT_DATA});
  const materials = NC_SPOT_DATA.materials;
  for (const item of materials) $("material").add(new Option(`${item.iso} · ${item.label}`, item.id));
  for (const option of $("angle").options) if(option.value) option.textContent += "°";
  const params = new URLSearchParams(location.search);
  if (materials.some(item=>item.id===params.get("material"))) $("material").value=params.get("material");
  if ([...$("angle").options].some(item=>item.value===params.get("angle"))) $("angle").value=params.get("angle");
  if (params.has("diameter")) $("diameter").value=params.get("diameter");
  const filters = () => ({material:$("material").value,angle:$("angle").value,diameter:$("diameter").value});
  const key = record => JSON.stringify({...record.selection,material:undefined});
  // 同一組裝可能配多種材料；未篩材質時只列一次，但保留可帶進計算器的實際材料配對。
  function uniqueSetups(matches) {
    const sorted = [...matches].sort((a,b)=>Number(b.cuttingAvailable)-Number(a.cuttingAvailable)||a.maxDiameter-b.maxDiameter||b.rank-a.rank||a.angle-b.angle);
    return [...new Map(sorted.map(item=>[key(item),item]).reverse()).values()].sort((a,b)=>a.maxDiameter-b.maxDiameter||a.angle-b.angle||b.rank-a.rank);
  }
  function resultURL(product, record, diameter) {
    const url = new URL(product.href,location.href);
    if(product.id!=="micro") {
      url.searchParams.set("operation","spotting");
      for(const [name,value] of Object.entries(record.selection)) url.searchParams.set(name,value);
      if(diameter) url.searchParams.set("diameter",diameter);
    }
    return url.href;
  }
  function updateCard(card, product, options) {
    const record=options[Number(card.querySelector("select").value)]||options[0];
    card.querySelector(".setup-range").textContent=`${record.angle}° · Ø${number(record.minDiameter)}–${number(record.maxDiameter)} mm`;
    card.querySelector(".setup-note").textContent=record.geometryNote + (product.id==="micro" ? " Calculator planning is in progress." : !record.cuttingAvailable ? " Cutting values need confirmation." : "");
    card.querySelector("a.card-action").href=resultURL(product,record,filters().diameter);
  }
  // 保留原條件，用相同候選資料解釋原因；範圍有缺口時不可只顯示一個總最小／最大值。
  function showNoMatch(f, diagnosis) {
    const material=f.material?materials.find(item=>item.id===f.material)?.label:"all listed materials";
    const scope=`${material}${f.angle?` at ${f.angle}°`:" across the listed angles"}`;
    const action=$("clearUnmatched");
    let title="No matching tool for this combination.", reason=`No listed setup matches ${scope}.`;
    action.hidden=true;
    delete action.dataset.field;
    if(diagnosis?.reason==="diameter-too-large") {
      title=`Spot diameter Ø${number(diagnosis.diameter)} mm is too large.`;
      reason=`The maximum available spot diameter for ${scope} is Ø${number(diagnosis.maxDiameter)} mm. No listed tool supports Ø${number(diagnosis.diameter)} mm with these selections.`;
    } else if(diagnosis?.reason==="diameter-too-small") {
      title=`Spot diameter Ø${number(diagnosis.diameter)} mm is too small.`;
      reason=`The available ranges for ${scope} start at Ø${number(diagnosis.minDiameter)} mm. No listed tool supports Ø${number(diagnosis.diameter)} mm with these selections.`;
    } else if(diagnosis?.reason==="diameter-gap") {
      title=`Spot diameter Ø${number(diagnosis.diameter)} mm falls between the available ranges.`;
      reason=`No listed tool covers this diameter for ${scope}. The supported ranges are shown below.`;
    } else if(diagnosis?.reason==="boundary-invalid") {
      title=`Spot diameter Ø${number(diagnosis.diameter)} mm is outside the usable cutting section.`;
      reason=`For ${scope}, this boundary does not give a valid cutting depth. Choose a diameter inside one of the available ranges below.`;
    } else if(diagnosis?.reason==="material-angle-unavailable") {
      title=`No ${f.angle}° tool is listed for ${material}.`;
      reason=`The available point angles for this material are ${(diagnosis.availableAngles||[]).map(angle=>`${angle}°`).join(", ")}.`;
      action.dataset.field="angle";
    } else if(diagnosis?.reason==="angle-unavailable") {
      title=`Point angle ${f.angle}° is not available.`;
      reason=`Listed point angles: ${(diagnosis.availableAngles||[]).map(angle=>`${angle}°`).join(", ")}.`;
      action.dataset.field="angle";
    } else if(diagnosis?.reason==="material-unavailable") {
      title=`No tool is listed for ${material}.`;
      reason="There is no confirmed material match in the current selection data.";
      action.dataset.field="material";
    }
    if(["diameter-too-large","diameter-too-small","diameter-gap","boundary-invalid"].includes(diagnosis?.reason)) action.dataset.field="diameter";
    if(action.dataset.field) {
      action.hidden=false;
      action.textContent={diameter:"Clear diameter",angle:"Clear angle",material:"Clear material"}[action.dataset.field];
    }
    $("emptyTitle").textContent=title;
    $("emptyReason").textContent=reason;
    const ranges=diagnosis?.ranges||[];
    $("emptyRanges").hidden=!ranges.length;
    $("emptyRanges").textContent=ranges.length?`Available ranges: ${ranges.map(range=>`${range.minDiameterInclusive?"":"above "}Ø${number(range.minDiameter)}–${number(range.maxDiameter)} mm`).join("; ")}${ranges.some(range=>!range.minDiameterInclusive)?" (open lower limits are excluded)":""}.`:"";
  }
  function render() {
    const f=filters(), input=$("diameter"), invalid=input.validity.badInput || (input.value!==""&&(!Number.isFinite(Number(input.value))||Number(input.value)<=0));
    input.classList.toggle("is-invalid",invalid);input.setAttribute("aria-invalid",String(invalid));$("diameterError").hidden=!invalid;
    const matches=invalid?[]:SPOTTING_SELECTOR.filterCandidates(records,f);
    const groups=products.map(product=>({product,options:uniqueSetups(matches.filter(item=>item.productId===product.id))})).filter(item=>item.options.length);
    $("resultCount").textContent=`${groups.length} product ${groups.length===1?"family":"families"} match`;
    $("criteria").textContent=[f.material?materials.find(item=>item.id===f.material).label:"All materials",f.angle?`${f.angle}°`:"All angles",f.diameter?`Ø${f.diameter} mm`:"Any spot diameter"].join("  ·  ");
    $("emptyState").hidden=Boolean(groups.length)||invalid;
    if(!groups.length&&!invalid) showNoMatch(f,SPOTTING_SELECTOR.explainNoMatch(records,f));
    $("productResults").innerHTML=groups.map(({product,options})=>`<div class="col-12 col-lg-4"><details class="finder-card" ${smallScreen.matches?"":"open"} data-product="${escape(product.id)}"><summary id="summary-${product.id}" aria-controls="body-${product.id}" aria-expanded="${!smallScreen.matches}"><span class="product-icon"><img src="../../img/spotting.png" alt=""></span><span><span class="card-kicker">${escape(product.kicker)}</span><h3>${escape(product.name)}</h3></span><svg class="mobile-chevron" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708"/></svg></summary><div class="card-body-content" id="body-${product.id}"><p class="product-note">${escape(product.description)}</p><span class="match-badge ${product.id==="micro"?"review":""}">${options.length} matching ${options.length===1?"setup":"setups"}${product.id==="micro"?" · catalog selection":""}</span><label class="model-label" for="setup-${product.id}">Matching tool / angle</label><select class="form-select setup-select" id="setup-${product.id}" aria-label="${escape(product.name)} matching setup">${options.map((record,index)=>`<option value="${index}">${escape(record.label)} · ${record.angle}°</option>`).join("")}</select><p class="setup-range"></p><p class="setup-note"></p><a class="card-action ${product.id==="micro"?"secondary":""}" href="${escape(product.href)}"><span>${product.id==="micro"?"View Micro catalog plan":"Get cutting data"}</span><span aria-hidden="true">→</span></a></div></details></div>`).join("");
    for(const {product,options} of groups) {
      const card=$("productResults").querySelector(`[data-product="${product.id}"]`);
      updateCard(card,product,options);
      card.querySelector("select").addEventListener("change",()=>updateCard(card,product,options));
      // 手機共用同一份 HTML：原生 details 保留鍵盤語意，且同時最多展開一張。
      card.addEventListener("toggle",()=>{card.querySelector("summary").setAttribute("aria-expanded",String(card.open));if(card.open&&smallScreen.matches) for(const other of $("productResults").querySelectorAll("details")) if(other!==card) other.open=false;});
      card.querySelector("summary").addEventListener("click",event=>{if(!smallScreen.matches)event.preventDefault();});
    }
  }
  function reset() {$("filterForm").reset();render();}
  $("filterForm").addEventListener("submit",event=>event.preventDefault());
  for(const id of ["material","angle"]) $(id).addEventListener("change",render);
  $("diameter").addEventListener("input",render);
  $("diameter").addEventListener("wheel",event=>{if(document.activeElement!==event.currentTarget)return;event.preventDefault();const next=Math.round((Number(event.currentTarget.value||0)+(event.deltaY<0?.1:-.1))*10)/10;event.currentTarget.value=String(Math.max(.1,next));render();},{passive:false});
  $("resetFilters").addEventListener("click",reset);$("resetEmpty").addEventListener("click",reset);smallScreen.addEventListener("change",render);
  $("clearUnmatched").addEventListener("click",()=>{const field=$("clearUnmatched").dataset.field;if(!["material","angle","diameter"].includes(field))return;$(field).value="";render();$(field).focus();});
  render();
  // Micro 研究只供這個未確認樣板使用；套用正式頁時須先整理成正式產品資料。
  fetch("../micro-spot-plan/filter-contract.json").then(response=>{if(!response.ok)throw Error("Micro catalog not available");return response.json();}).then(data=>{
    records.push(...SPOTTING_SELECTOR.buildMicroCandidates(data));
    $("microStatus").textContent="Micro: local catalog pp. 24–25. Wmin–Wmax are nominal selection limits. Steel grade hardness must be confirmed; calculator planning is separate.";render();
  }).catch(()=>{$("microStatus").textContent="Micro catalog data could not be loaded. Results currently cover ACE and NC only.";});
  async function loadLayout(part){const response=await fetch(`../../${part}/${part}.html`);if(!response.ok)return;$(`${part}-placeholder`).innerHTML=await response.text();if(part==="header"){const button=$("mobileMenuBtn"),nav=$("topNav");if(!button||!nav)return;button.setAttribute("aria-controls","topNav");button.setAttribute("aria-expanded","false");button.addEventListener("click",()=>{const open=nav.classList.toggle("active");button.setAttribute("aria-expanded",String(open));button.setAttribute("aria-label",open?"Close Menu":"Open Menu");});}}
  Promise.all([loadLayout("header"),loadLayout("footer")]).catch(()=>{});
})();
