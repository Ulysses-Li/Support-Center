#!/usr/bin/env node
'use strict';

/* 型錄資料維護工具：只使用 Node.js 內建模組，不改寫資料庫。 */
const fs = require('node:fs');
const path = require('node:path');
const DEFAULT_FILE = path.resolve(__dirname, '../data/catalog/nine9-catalog-2025-2026.json');

function validate(db) {
  const errors = [];
  const fail = (location, message) => errors.push(`${location}: ${message}`);
  const collections = ['sources', 'categories', 'product_families', 'items', 'cutting_data',
    'tables', 'identifier_index', 'technical_notes', 'pages', 'site_resources'];
  if (!db || typeof db !== 'object' || Array.isArray(db)) return ['資料庫必須是 JSON 物件'];
  for (const key of collections) {
    if (!Array.isArray(db[key])) fail(key, '必須是陣列');
  }
  if (errors.length) return errors;
  if (db.metadata?.schema_version !== '1.0.0') fail('metadata.schema_version', '不支援的格式版本');

  const indexes = {};
  for (const key of collections) {
    const index = new Map();
    db[key].forEach((row, n) => {
      const at = `${key}[${n}]`;
      if (!row || typeof row !== 'object' || Array.isArray(row)) {
        fail(at, '必須是物件'); return;
      }
      if (typeof row.id !== 'string' || !row.id) fail(at, '缺少固定 id');
      else if (index.has(row.id)) fail(at, `重複 id ${row.id}`);
      else index.set(row.id, row);
    });
    indexes[key] = index;
  }
  if (errors.length) return errors;
  function refs(row, at) {
    if (!Array.isArray(row.source_refs) || !row.source_refs.length) {
      fail(at, '必須保留至少一個來源'); return;
    }
    for (const ref of row.source_refs) {
      const source = indexes.sources.get(ref.source_id);
      if (!source) { fail(at, `來源不存在 ${ref.source_id}`); continue; }
      if (!Number.isInteger(ref.pdf_page) || ref.pdf_page < 1 || ref.pdf_page > source.page_count) {
        fail(at, `PDF 頁碼超出範圍 ${ref.pdf_page}`);
      }
      if (typeof ref.printed_page !== 'string') fail(at, 'printed_page 必須是文字');
      if (ref.table_id) {
        const table = indexes.tables.get(ref.table_id);
        if (!table) fail(at, `表格不存在 ${ref.table_id}`);
        else if (!table.source_refs.some(r => r.source_id === ref.source_id && r.pdf_page === ref.pdf_page)) {
          fail(at, `表格與來源頁碼不符 ${ref.table_id}`);
        }
      }
    }
  }
  const statuses = new Set(['source_checked', 'needs_review', 'text_index_only']);
  for (const key of ['product_families', 'items', 'cutting_data', 'tables', 'identifier_index', 'technical_notes', 'pages']) {
    db[key].forEach((row, n) => {
      const at = `${key}[${n}]`;
      refs(row, at);
      if (!statuses.has(row.review_status)) fail(at, '缺少有效 review_status');
      if (row.family_id && !indexes.product_families.has(row.family_id)) fail(at, `產品家族不存在 ${row.family_id}`);
      for (const familyId of row.family_ids || []) {
        if (!indexes.product_families.has(familyId)) fail(at, `產品家族不存在 ${familyId}`);
      }
    });
  }
  db.product_families.forEach((family, n) => {
    for (const categoryId of family.category_ids || []) {
      if (!indexes.categories.has(categoryId)) fail(`product_families[${n}]`, `分類不存在 ${categoryId}`);
    }
  });
  const partKeys = new Set();
  db.items.forEach((item, n) => {
    const at = `items[${n}]`;
    if (typeof item.part_number !== 'string' || !item.part_number) fail(at, '缺少料號');
    const partKey = `${item.part_number}\u0000${item.grade || ''}`;
    if (partKeys.has(partKey)) fail(at, `重複料號與牌號 ${item.part_number}`);
    partKeys.add(partKey);
    if (!Array.isArray(item.attributes)) fail(at, 'attributes 必須是陣列');
    else {
      const keys = new Set();
      for (const attr of item.attributes) {
        if (!attr.key || keys.has(attr.key)) fail(at, `規格 key 空白或重複 ${attr.key}`);
        keys.add(attr.key);
        if (!['string', 'number', 'boolean'].includes(typeof attr.value) && attr.value !== null) fail(at, '規格值必須是文字、數值、布林值或 null');
        if (typeof attr.unit !== 'string' || typeof attr.raw_value !== 'string') fail(at, '規格須有 unit 與 raw_value');
      }
    }
  });
  // 缺值可為 null；已有數值的範圍不可倒置，以免錯誤進入計算器。
  db.cutting_data.forEach((record, n) => {
    for (const key of ['cutting_speed', 'feed_per_rev', 'peck_depth']) {
      const range = record[key];
      if (!range || typeof range !== 'object') { fail(`cutting_data[${n}]`, `缺少 ${key}`); continue; }
      for (const bound of ['min', 'max']) {
        if (range[bound] !== null && (typeof range[bound] !== 'number' || !Number.isFinite(range[bound]))) {
          fail(`cutting_data[${n}].${key}`, `${bound} 必須是數值或 null`);
        }
      }
      if (typeof range.min === 'number' && typeof range.max === 'number' && range.min > range.max) {
        fail(`cutting_data[${n}].${key}`, '範圍倒置；請保留 raw_value，將不確定數值留 null');
      }
    }
  });
  db.identifier_index.forEach((record, n) => {
    for (const id of record.item_ids || []) {
      if (!indexes.items.has(id)) fail(`identifier_index[${n}]`, `型號不存在 ${id}`);
    }
  });
  db.site_resources.forEach((record, n) => {
    if (!indexes.product_families.has(record.family_id)) fail(`site_resources[${n}]`, '產品家族不存在');
  });
  db.sources.forEach(source => {
    const pages = db.pages.filter(p => p.source_refs.some(r => r.source_id === source.id));
    if (pages.length !== source.page_count) fail('pages', `${source.id} 應有 ${source.page_count} 頁，目前 ${pages.length} 頁`);
    const pageNumbers = new Set(pages.flatMap(p => p.source_refs.filter(r => r.source_id === source.id).map(r => r.pdf_page)));
    if (pageNumbers.size !== source.page_count) fail('pages', `${source.id} 頁碼重複或缺漏`);
  });
  return errors;
}

function stats(db) {
  const counts = Object.fromEntries(['sources', 'categories', 'product_families', 'items', 'cutting_data',
    'tables', 'identifier_index', 'technical_notes', 'pages'].map(k => [k, db[k].length]));
  counts.items_by_status = countBy(db.items, 'review_status');
  counts.cutting_data_by_status = countBy(db.cutting_data, 'review_status');
  counts.tables_by_kind = countBy(db.tables, 'kind');
  return counts;
}

function countBy(rows, key) {
  return rows.reduce((out, row) => { out[row[key]] = (out[row[key]] || 0) + 1; return out; }, {});
}

function search(db, query) {
  const needle = query.toLocaleLowerCase();
  const output = {};
  for (const key of ['product_families', 'items', 'cutting_data', 'tables', 'identifier_index', 'technical_notes', 'pages']) {
    const matches = db[key].filter(row => JSON.stringify(row).toLocaleLowerCase().includes(needle));
    output[key] = {
      total: matches.length,
      results: matches.slice(0, 20).map(row => ({
        id: row.id, name: row.name_en || row.part_number || row.title_en || row.operation || (row.text || '').slice(0, 100),
        review_status: row.review_status,
        pdf_pages: [...new Set(row.source_refs.map(ref => ref.pdf_page))]
      }))
    };
  }
  return output;
}

function main() {
  const [command = 'stats', argument, customFile] = process.argv.slice(2);
  const file = ['search', 'template'].includes(command) ? customFile : argument;
  const db = JSON.parse(fs.readFileSync(file ? path.resolve(file) : DEFAULT_FILE, 'utf8').replace(/^\uFEFF/, ''));
  if (command === 'validate') {
    const errors = validate(db);
    if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
    else console.log('驗證通過：JSON、唯一 ID、來源頁碼、外鍵、缺值與數值範圍均正確。');
  } else if (command === 'stats') console.log(JSON.stringify(stats(db), null, 2));
  else if (command === 'search' && argument) console.log(JSON.stringify(search(db, argument), null, 2));
  else if (command === 'template' && Object.hasOwn(db.templates, argument)) console.log(JSON.stringify(db.templates[argument], null, 2));
  else {
    console.error('用法：node tools/catalog-db.js stats|validate [資料庫路徑]\n      node tools/catalog-db.js search <關鍵字> [資料庫路徑]\n      node tools/catalog-db.js template item|product_family|cutting_record|source');
    process.exitCode = 1;
  }
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { validate, stats, search };
