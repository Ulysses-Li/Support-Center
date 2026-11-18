'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const Locale=require('../locale.js'),base=path.resolve(__dirname,'..');

test('initial documents have a real doctype, English content and local locale dependency',()=>{
 for(const name of ['index.html','catalog-notes.html']){
  const html=fs.readFileSync(path.join(base,name),'utf8');
  assert.match(html,/^<!doctype html>/i);assert.match(html,/<html lang="en">/);
  const visible=html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<!--[\s\S]*?-->/g,'').replace(/<[^>]+>/g,'').replace(/繁體中文/g,'');
  assert.doesNotMatch(visible,/[\u3400-\u9fff]/,name);
  assert.match(html,/\.\/locale\.js\?v=locale-3/);
 }
 assert.equal(Locale.markup('<!doctype html><p>本系列不建議用於非鐵金屬</p>'),'<!doctype html><p>This series is not recommended for non-ferrous metals</p>');
});

test('notes language switch and return links preserve language, job fields and chosen body',async()=>{
 const source=fs.readFileSync(path.join(base,'notes.js'),'utf8');
 for(const lang of ['en','zh-TW']){
  const leaf={nodeType:3,nodeValue:'Manufacturer questions'};
  const main={nodeType:1,tagName:'MAIN',childNodes:[leaf],hasAttribute:()=>false,getAttribute:()=>null};
  const map=new Map([['main-content',main]]);
  for(const id of ['languageToggle','header-placeholder','footer-placeholder','printNotes'])map.set(id,{textContent:'',listeners:{},setAttribute(k,v){this[k]=v;},addEventListener(t,f){this.listeners[t]=f;}});
  const product={href:'http://localhost/CuttingData/SuperDrill/index.html'},hub={href:'http://localhost/Machining/Drilling/index.html'};
  const href=`http://localhost/CuttingData/SuperDrill/catalog-notes.html?lang=${lang}&diameter=24&depth=36&tool=00-99313-24`;
  const location=new URL(href),history={replaceState(a,b,url){this.url=url;}};
  const document={documentElement:{lang:'en'},getElementById:id=>map.get(id)||null,querySelectorAll:s=>s==='[data-product-return]'?[product]:s==='[data-hub-link]'?[hub]:[]};
  vm.runInNewContext(source,{window:{SuperDrillLocale:Locale,print(){}},document,location,history,URL,URLSearchParams,fetch:async()=>({ok:true,text:async()=>''}),console:{warn(){}}});
  await new Promise(resolve=>setImmediate(resolve));
  assert.equal(document.documentElement.lang,lang==='en'?'en':'zh-Hant');assert.equal(leaf.nodeValue,lang==='en'?'Manufacturer questions':'原廠待確認清單');
  const returned=new URL(product.href);assert.equal(returned.searchParams.get('lang'),lang);assert.equal(returned.searchParams.get('tool'),'00-99313-24');assert.equal(returned.searchParams.get('depth'),'36');
  assert.equal(new URL(hub.href).searchParams.get('lang'),lang);assert.equal(new URL(hub.href).searchParams.get('sdTool'),'00-99313-24');
  assert.equal(new URL(map.get('languageToggle').href,'http://localhost').searchParams.get('lang'),lang==='en'?'zh-TW':'en');
 }
});
