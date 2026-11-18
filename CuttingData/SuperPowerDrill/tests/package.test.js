'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('產品執行檔與入口沒有其他產品或舊共用目錄相依', () => {
  for (const file of ['app.js', 'core.js', 'diagrams.js', 'styles.css', 'index.html', 'catalog-notes.html']) {
    const text = read(file);
    assert.doesNotMatch(text, /\.\.\/Drilling\/|SuperDrill\/|super-drill\.json|super-drill-plan|測試資料\/|output\//, file);
    assert.doesNotMatch(text, /applicationFactor|3D／4D|3D\/4D|data-product-link|body\[data-view=hub\]/, file);
  }
  const html = read('index.html');
  for (const file of ['core.js', 'diagrams.js', 'app.js', 'styles.css']) {
    assert.ok(html.includes('./' + file), file);
    assert.ok(fs.existsSync(path.join(root, file)));
  }
  assert.match(html, /href="\/Machining\/Drilling\/index\.html"/);
  assert.match(html, /href="\/CuttingData\/index\.html"/);
  assert.match(html, /href="\.\/catalog-notes\.html"/);
  assert.doesNotMatch(html, /id="factorGroup"/);
});

test('JSON 與文件來源只指向自有 8 頁型錄，保留原始頁次', () => {
  const walk = value => {
    if (!value || typeof value !== 'object') return;
    if ('pdf_page' in value) {
      assert.ok(value.pdf_page >= 1 && value.pdf_page <= 8);
      assert.equal(value.original_pdf_page, value.pdf_page);
    }
    const printed = value.printed_page || value.catalog_page;
    if (printed) assert.ok(printed >= 128 && printed <= 135);
    Object.values(value).forEach(walk);
  };
  for (const file of ['data/catalog.json', 'data/cutting-data.json']) {
    const text = read(file);
    assert.doesNotMatch(text, /super_drill|sd_operating|sd_standard|p141|p138|p139|p140|p128-141\.pdf/);
    walk(JSON.parse(text));
  }
  const notes = read('catalog-notes.html');
  assert.doesNotMatch(notes, /p141|p138|p139|p140|Super_Drill/);
  const pdf = fs.readFileSync(path.join(root, 'sources/Super_Power_Drill_p128-135.pdf'));
  assert.equal(pdf.subarray(0, 4).toString(), '%PDF');
  assert.ok(pdf.length > 100000);
  assert.ok(fs.existsSync(path.join(root, 'assets/product.jpg')));
  const asset = JSON.parse(read('assets/manifest.json'));
  assert.equal(asset.images.length, 1);
  assert.equal(asset.images[0].file, 'product.jpg');
  assert.equal(asset.images[0].printed_page, 128);
});
