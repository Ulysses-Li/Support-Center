'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..'),Core=require('../core.js'),Diagrams=require('../diagrams.js'),Locale=require('../locale.js');
const source=fs.readFileSync(path.join(base,'app.js'),'utf8');
const html=fs.readFileSync(path.join(base,'index.html'),'utf8');
const attributes=s=>Object.fromEntries([...s.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(x=>[x[1],x[2]??'']));

// 只模擬本頁用到的原生 DOM，資料僅能讀本產品 data/；不引入瀏覽器或別的產品。
function element(tag,a){
 let value=a.value||'',markup='';
 const e={id:a.id,name:a.name||'',href:a.href||'',dataset:{},hidden:'hidden'in a,disabled:'disabled'in a,textContent:'',className:a.class||'',listeners:{},options:null,classList:{add(){},remove(){},toggle(){return true}},setAttribute(k,v){this[k]=v;},addEventListener(t,f){this.listeners[t]=f;},showModal(){},close(){}};
 Object.defineProperty(e,'value',{get(){return value;},set(v){v=String(v??'');value=e.options&&!e.options.some(o=>o.value===v)?'':v;}});
 Object.defineProperty(e,'innerHTML',{get(){return markup;},set(v){markup=String(v);if(tag==='select'){e.options=[...markup.matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/g)].map(m=>{const a=attributes(m[1]);return{value:a.value||'',textContent:m[2],hidden:'hidden'in a,disabled:'disabled'in a};});value=e.options.some(o=>o.value===value)?value:e.options[0]?.value||'';}}});
 e.add=option=>{e.options.push({value:option.value,textContent:option.textContent,hidden:option.hidden,disabled:option.disabled});markup+=`<option value="${option.value}"${option.hidden?' hidden':''}${option.disabled?' disabled':''}>${option.textContent}</option>`;};
 Object.defineProperty(e,'innerText',{get(){return markup.replace(/<[^>]*>/g,' ').trim()||e.textContent;}});
 return e;
}
async function page(search=''){
 const els=new Map(),listeners={},errors=[],requests=[],links=[];
 const pageUrl=new URL('http://localhost/CuttingData/SuperDrill/index.html'+search);
 for(const m of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi)){
  const a=attributes(m[2]);if(a.id){const e=element(m[1],a);if(m[1]==='select'){const rest=html.slice(m.index+m[0].length);e.innerHTML=rest.slice(0,rest.indexOf('</select>'));}els.set(a.id,e);}
  if(m[1]==='a'&&'data-hub-link'in a)links.push({...element('a',a),href:new URL(a.href,pageUrl).href});
 }
 const get=id=>els.get(id)||null,history={last:'',replaceState(a,b,c){this.last=c;}};
 let clipboard='';
 get('main-content').childNodes=[...els.values()].filter(e=>e.id!=='main-content'&&e.id!=='diagramDialog'&&e.id!=='languageToggle');
 const context={window:{SuperDrillCore:Core,SuperDrillDiagrams:Diagrams,SuperDrillLocale:Locale},document:{documentElement:{lang:'en'},currentScript:{src:new URL('app.js',pageUrl).href},getElementById:get,createElement:tag=>element(tag,{}),querySelectorAll:s=>s==='[data-hub-link]'?links:[],addEventListener(t,f){listeners[t]=f;}},location:{search,pathname:pageUrl.pathname,hash:''},history,URL,URLSearchParams,Promise,Number,Math,Set,console:{error:e=>errors.push(e.message)},navigator:{clipboard:{writeText:async text=>{clipboard=text;}}},fetch:async url=>{
  const u=new URL(url);requests.push(u.pathname);
  if(u.pathname==='/header/header.html'||u.pathname==='/footer/footer.html')return{ok:true,text:async()=>''};
  assert.ok(u.pathname.startsWith('/CuttingData/SuperDrill/data/'),u.pathname);
  return{ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(base,'data',path.basename(u.pathname)),'utf8'))};
 }};
 vm.runInNewContext(source,context);await new Promise(resolve=>setImmediate(resolve));
 return{get,history,errors,requests,links,document:context.document,input(id,value){const e=get(id);e.value=value;if(e.listeners.input)e.listeners.input({target:e});listeners.input({target:e});},choose(id){get('toolList').listeners.change({target:{name:'tool',value:id}});},async copy(){await get('copyButton').listeners.click();return clipboard;}};
}

test('產品只載入自己的兩份資料及程式，不依賴舊共用產品套件',async()=>{
 const p=await page('?diameter=20&depth=20&material=carbon_low');assert.deepEqual(p.errors,[]);
 assert.deepEqual(p.requests.filter(x=>x.endsWith('.json')).sort(),['/CuttingData/SuperDrill/data/catalog.json','/CuttingData/SuperDrill/data/cutting-data.json']);
 for(const filename of ['app.js','core.js','diagrams.js','index.html','catalog-notes.html','data/catalog.json','data/cutting-data.json','assets/manifest.json']){
  const text=fs.readFileSync(path.join(base,filename),'utf8');
  assert.doesNotMatch(text,/SuperPowerDrill|super-power-drill|super-drill-plan|測試資料|CuttingData\/Drilling|\.\.\/Drilling\//,filename);
 }
 for(const local of ['app.js','core.js','diagrams.js','styles.css'])assert.ok(html.includes(`./${local}`));
 assert.doesNotMatch(html,/data-product-link|spdDepthClass/);
});

test('未填深度的跨頁刀體選擇保留，補齊及更改材料仍使用所選4D刀體',async()=>{
 const p=await page('?diameter=20&tool=00-99314-20');assert.deepEqual(p.errors,[]);assert.equal(p.get('depth').value,'');
 assert.equal(new URL(p.history.last,'http://localhost').searchParams.get('tool'),'00-99314-20');
 p.input('depth','20');p.input('material','carbon_low');assert.equal(p.get('selectedId').textContent,'00-99314-20');assert.equal(p.get('vc').value,'120');
 p.input('material','stainless');assert.equal(p.get('selectedId').textContent,'00-99314-20');assert.equal(p.get('vc').value,'75');
 assert.equal(new URL(p.links[0].href).searchParams.get('sdTool'),'00-99314-20');
});

test('需求條件與選料異動清除手動值，URL保留公差且自家PDF映射正確',async()=>{
 const p=await page('?diameter=20&depth=20&material=carbon_low&shank=25&tool=00-99313-20&toleranceUpper=%2B0.05&toleranceLower=-0.02&values=manual&vc=100&feed=0.06');
 assert.equal(p.get('vc').value,'100');assert.match(p.get('toleranceSummary').textContent,/19.98–20.05/);
 p.input('material','stainless');assert.equal(p.get('vc').value,'105');
 assert.equal(new URL(p.history.last,'http://localhost').searchParams.has('values'),false);
 assert.match(p.get('diagramSource').href,/sources\/Super_Drill_p136-141\.pdf#page=3$/);
 const copied=await p.copy();assert.match(copied,/sources\/Super_Drill_p136-141\.pdf#page=6/);assert.match(copied,/upper deviation \+0.05/);
});

test('結果欄工況百分數參與同一狀態更新，未選倍率不暗算',async()=>{
 const p=await page('?diameter=20&depth=20&material=carbon_low&shank=25&tool=00-99313-20');
 p.input('application','stack_drilling');assert.equal(p.get('vc').value,'');assert.equal(p.get('factorGroup').hidden,false);
 p.input('applicationFactor','75');assert.equal(p.get('vc').value,'123.75');assert.equal(p.get('feed').value,'0.06');assert.equal(p.get('copyButton').disabled,false);
});

test('不支援材料不列刀體，手動值與舊URL都無法繞過',async()=>{
 for(const material of ['non_ferrous','heat_resistant','unlisted_old_material','toString','__proto__']){
  const p=await page(`?diameter=20&depth=20&material=${material}&shank=25&tool=00-99313-20&values=manual&vc=100&feed=0.06`);
  assert.deepEqual(p.errors,[]);assert.equal(p.get('material').value,material);
  assert.equal(new URL(p.history.last,'http://localhost').searchParams.get('material'),material);
  assert.equal(p.get('toolList').innerHTML,'');assert.equal(p.get('emptyState').hidden,false);
  if (!['non_ferrous','heat_resistant'].includes(material)) assert.match(p.get('resultSummary').textContent,/Unlisted material/);
  assert.equal(p.get('emptyState').textContent,Locale.text(material==='non_ferrous'?'本系列不建議用於非鐵金屬':'型錄未列此材料適用配對，不提供推薦'));
  assert.equal(p.get('vc').value,'');assert.equal(p.get('vc').disabled,true);assert.equal(p.get('feed').disabled,true);
  p.input('vc','100');p.input('feed','0.06');assert.equal(p.get('copyButton').disabled,true);assert.equal(p.get('rpmResult').textContent,'—');assert.equal(await p.copy(),'');
  p.input('material','carbon_low');assert.equal(p.get('selectedId').textContent,'00-99313-20');assert.equal(p.get('vc').disabled,false);assert.equal(p.get('copyButton').disabled,false);
 }
});

test('已支援材料缺工況參數仍可手動試算並標明限制',async()=>{
 const p=await page('?diameter=20&depth=20&material=carbon_low&shank=25&tool=00-99313-20&application=stack_drilling');
 assert.match(p.get('resultCount').textContent,/2 body/);assert.equal(p.get('vc').value,'');assert.equal(p.get('vc').disabled,false);
 p.input('vc','100');p.input('feed','0.06');assert.equal(p.get('copyButton').disabled,false);
 assert.match(p.get('selectedStatus').textContent,/not a catalog recommendation/);assert.match(await p.copy(),/cutting conditions for the supported material are incomplete/);
});

test('未選材料可看幾何，但手動值及清空不適用材料均不能算或複製',async()=>{
 const p=await page('?diameter=20&depth=20&shank=25&tool=00-99313-20&values=manual&vc=100&feed=0.06');
 assert.match(p.get('resultCount').textContent,/2 body/);assert.equal(p.get('material').value,'');
 p.input('vc','100');p.input('feed','0.06');assert.equal(p.get('rpmResult').textContent,'—');assert.equal(p.get('copyButton').disabled,true);assert.equal(await p.copy(),'');
 p.input('material','non_ferrous');p.input('material','');
 assert.match(p.get('resultCount').textContent,/2 body/);
 p.input('vc','100');p.input('feed','0.06');assert.equal(p.get('rpmResult').textContent,'—');assert.equal(p.get('copyButton').disabled,true);
 p.input('material','carbon_low');assert.equal(p.get('copyButton').disabled,false);assert.notEqual(p.get('rpmResult').textContent,'—');
});

test('拆分來源頁次在1–6內，且來源原頁碼逐筆保留',()=>{
 for(const name of ['catalog.json','cutting-data.json']){
  const data=JSON.parse(fs.readFileSync(path.join(base,'data',name),'utf8'));
  const visit=x=>{if(Array.isArray(x))x.forEach(visit);else if(x&&typeof x==='object'){if('pdf_page'in x){assert.ok(x.pdf_page>=1&&x.pdf_page<=6);assert.equal(x.original_pdf_page,x.pdf_page+8);}Object.values(x).forEach(visit);}};visit(data);
 }
 const manifest=JSON.parse(fs.readFileSync(path.join(base,'assets/manifest.json'),'utf8'));
 assert.ok(fs.existsSync(path.resolve(base,'assets',manifest.source_pdf)));assert.equal(manifest.images.length,1);assert.equal(manifest.images[0].file,'product.jpg');
});

test('English is default; Chinese switch preserves job, selected body, manual values and return links',async()=>{
 const q='?diameter=24&depth=36&material=low_alloy_low&shank=25&tool=00-99313-24&toleranceUpper=%2B0.05&toleranceLower=-0.02&values=manual&vc=120&feed=0.08';
 const en=await page(q);assert.deepEqual(en.errors,[]);assert.equal(en.document.documentElement.lang,'en');
 assert.match(en.get('selectedStatus').textContent,/Cutting data matched/);assert.equal(new URL(en.history.last,'http://localhost').searchParams.get('lang'),'en');
 for(const id of ['pageTitle','pageIntro','selectedStatus','resultSummary','assemblySummary','recommendationNotes','machineLimitNote','diagramCanvas','cuttingSource'])assert.doesNotMatch(en.get(id).innerText,/[\u3400-\u9fff]/,id);
 const englishCopy=await en.copy();assert.doesNotMatch(englishCopy,/[\u3400-\u9fff]/);assert.match(englishCopy,/Finished diameter/);
 const switched=new URL(en.get('languageToggle').href,'http://localhost');assert.equal(switched.searchParams.get('lang'),'zh-TW');assert.equal(switched.searchParams.get('vc'),'120');assert.equal(switched.searchParams.get('tool'),'00-99313-24');assert.equal(switched.searchParams.get('toleranceUpper'),'+0.05');
 const zh=await page(switched.search);assert.equal(zh.document.documentElement.lang,'zh-Hant');assert.match(zh.get('selectedStatus').textContent,/切削條件已配對/);assert.equal(zh.get('vc').value,'120');assert.match(await zh.copy(),/完成孔徑/);
 assert.equal(new URL(zh.links[0].href).searchParams.get('lang'),'zh-TW');assert.equal(new URL(zh.get('languageToggle').href,'http://localhost').searchParams.get('lang'),'en');
});

test('material blocking and prototype-safe labels work in both languages',async()=>{
 for(const lang of ['en','zh-TW'])for(const material of ['non_ferrous','toString','__proto__']){
  const p=await page(`?lang=${lang}&diameter=24&depth=36&material=${material}&tool=00-99313-24&values=manual&vc=120&feed=0.08`);
  assert.deepEqual(p.errors,[]);assert.equal(p.get('material').value,material);assert.equal(p.get('copyButton').disabled,true);
  assert.equal(p.get('emptyState').textContent,Locale.text(material==='non_ferrous'?'本系列不建議用於非鐵金屬':'型錄未列此材料適用配對，不提供推薦',lang));
  assert.doesNotMatch(p.get('resultSummary').textContent,/function|native code|object Object/);
 }
});

test('dropdown shows only the eight supported materials; rejected URL values stay hidden and blocked',async()=>{
 const supported=JSON.parse(fs.readFileSync(path.join(base,'data/cutting-data.json'),'utf8')).materials.map(m=>m.id);
 for(const lang of ['en','zh-TW']){
  for(const material of ['','non_ferrous','heat_resistant','old_unknown_material']){
   const p=await page(`?lang=${lang}&diameter=24&depth=36&material=${material}&tool=00-99313-24&values=manual&vc=120&feed=0.08`);
   assert.deepEqual(p.errors,[]);
   const visible=p.get('material').options.filter(o=>!o.hidden&&!o.disabled&&o.value);
   assert.deepEqual(visible.map(o=>o.value),supported);
   assert.ok(visible.every(o=>!['non_ferrous','heat_resistant','old_unknown_material'].includes(o.value)));
   if(material){const held=p.get('material').options.find(o=>o.value===material);assert.equal(held.hidden,true);assert.equal(held.disabled,true);assert.equal(held.textContent,lang==='en'?'Select material':'請選擇材料');assert.equal(p.get('material').value,material);assert.equal(p.get('copyButton').disabled,true);assert.equal(p.get('rpmResult').textContent,'—');}
  }
  for(const material of supported){
   const p=await page(`?lang=${lang}&diameter=24&depth=36&shank=25&material=${material}&tool=00-99313-24`);
   assert.equal(p.get('material').value,material);assert.equal(p.get('copyButton').disabled,false);
   const option=p.get('material').options.find(o=>o.value===material);assert.equal(option.hidden,false);assert.equal(option.disabled,false);
   if(lang==='en')assert.doesNotMatch(option.textContent,/[\u3400-\u9fff]/);
   else assert.match(option.textContent,/[\u3400-\u9fff]/);
  }
 }
});
