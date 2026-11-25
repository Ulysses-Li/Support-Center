const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('Beta 正式入口與必要資源不依賴測試資料', () => {
  const betaRoot=path.resolve(__dirname,'..');
  const siteRoot=path.resolve(betaRoot,'../..');
  const home=fs.readFileSync(path.join(siteRoot,'NCProgram/index.html'),'utf8');
  const html=fs.readFileSync(path.join(betaRoot,'index.html'),'utf8');
  assert.match(home,/href="\.\/Engraving_Beta\/index\.html"/);
  assert.match(home,/Engraving CAD\/CAM[\s\S]*?<span class="program-version">Beta<\/span>/);
  assert.doesNotMatch(html,/測試資料/);
  // 檢查頁面載入的本機樣式與腳本，以及執行時才讀取的字庫和範例。
  for(const match of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)="([^"]+)"/g)) {
    const resource=match[1].split('?')[0];
    if(/^(?:https?:)?\/\//.test(resource))continue;
    const absolute=resource.startsWith('/')?path.join(siteRoot,resource.slice(1)):path.resolve(betaRoot,resource);
    assert.ok(fs.existsSync(absolute),`缺少正式資源：${resource}`);
  }
  for(const resource of ['nine9-example.dxf','vendor/hanzi-strokes/medians.json','vendor/NotoSansTC.ttf']) {
    assert.ok(fs.existsSync(path.join(betaRoot,resource)),`缺少執行時資源：${resource}`);
  }
});
