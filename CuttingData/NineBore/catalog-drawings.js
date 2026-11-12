/* 型錄原圖對應：只連結已核對的實際品項，不從相似料號推測圖面。 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.NINEBORE_CATALOG_DRAWINGS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const barMappings = new Map();
  const drawingPages = new Map([
    ['99101', [152, 5]], ['99121', [153, 6]],
    ['99146_S', [155, 8]], ['99146_A_26_39', [156, 9]], ['99146_A_40_50', [156, 9]],
    ['99151_d6', [159, 12]], ['99151_d8', [159, 12]], ['99151_d10', [159, 12]],
    ['99151_d11_WS', [159, 12]], ['99151_1500W', [159, 12]], ['99151_1600_2000W', [159, 12]],
    ['holder_HSK63A', [154, 7]], ['holder_CAT40', [154, 7]], ['holder_BT', [154, 7]], ['holder_SB32', [154, 7]],
    ['adapter_99151', [158, 11]]
  ]);

  function registerBars(series, key, suffixes, shankD) {
    suffixes.trim().split(/\s+/).forEach(suffix => barMappings.set(`00-${series}-${suffix}`, { series, key, shankD }));
  }

  // 以下白名單逐項對照 product-inventory 的 167 支刀桿；缺號及訂製 H 型不自動納入。
  registerBars('99101', '99101', '07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25');
  registerBars('99121', '99121', '05 06 07 08 09 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25');
  registerBars('99146', '99146_S', `
    0500S 0600S 0700S 0800S 0900S 1000S 1025S 1050S 1075S 1100S 1125S 1150S 1175S
    1200S 1225S 1250S 1275S 1300S 1325S 1350S 1375S 1400S 1425S 1450S 1475S
    1500S 1525S 1550S 1575S 1600S 1625S 1650S 1675S 1700S 1725S 1750S 1775S
    1800S 1825S 1850S 1875S 1900S 1925S 1950S 1975S 2000S 2025S 2050S 2075S
    2100S 2125S 2150S 2175S 2200S 2225S 2250S 2275S 2300S 2325S 2350S 2375S
    2400S 2425S 2450S 2475S 2500S 2525S 2550S`);
  registerBars('99146', '99146_A_26_39', '26A 27A 28A 29A 30A 31A 32A 33A 34A 35A 36A 37A 38A 39A');
  registerBars('99146', '99146_A_40_50', '40A 41A 42A 43A 44A 45A 46A 47A 48A 49A 50A');
  registerBars('99151', '99151_d6', '0500W 0525W 0550W 0575W 0600W 0625W 0650W 0675W', 6);
  registerBars('99151', '99151_d8', '0700W 0725W 0750W 0775W 0800W 0825W 0850W 0875W', 8);
  registerBars('99151', '99151_d10', '0900W 0925W 0950W 0975W 1000W 1025W 1050W 1075W 1100W', 10);
  registerBars('99151', '99151_d11_WS', '1200WS 1300WS 1400WS', 11);
  // 同為 Ø15.5 的 1500W 與 1600W～2000W 在原頁有不同圖形，不能只以柄徑分圖。
  registerBars('99151', '99151_1500W', '1500W', 15.5);
  registerBars('99151', '99151_1600_2000W', '1600W 1700W 1800W 1900W 2000W', 15.5);

  const holderMappings = new Map([
    ['00-99146-HSK63AH', 'holder_HSK63A'], ['00-99146-CAT40H', 'holder_CAT40'],
    ['00-99146-BT30H', 'holder_BT'], ['00-99146-BT40H', 'holder_BT'], ['00-99146-BT50H', 'holder_BT'],
    ['00-99146-SB32H', 'holder_SB32']
  ]);
  const adapterParts = new Set(['00-99151A-06', '00-99151A-08', '00-99151A-10', '00-99151A-11', '00-99151A-15.5']);
  const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

  function barKey(bar) {
    if (!isObject(bar) || typeof bar.id !== 'string') return null;
    const mapping = barMappings.get(bar.id);
    if (!mapping || bar.series !== mapping.series) return null;
    if (bar.partsNo !== undefined && bar.partsNo !== bar.id) return null;
    if (mapping.shankD !== undefined && bar.shankD !== mapping.shankD) return null;
    return mapping.key;
  }

  function partIdentity(item) {
    if (!isObject(item) || typeof item.partsNo !== 'string') return null;
    // normalized 物件若同時提供 id 與 partsNo，兩欄不能互相矛盾。
    return item.id === undefined || item.id === item.partsNo ? item.partsNo : null;
  }

  function holderKey(holder) {
    return holderMappings.get(partIdentity(holder)) || null;
  }

  function adapterKey(adapter) {
    return adapterParts.has(partIdentity(adapter)) ? 'adapter_99151' : null;
  }

  function resolve(manifest, key) {
    if (!isObject(manifest) || !Array.isArray(manifest.drawings) || typeof key !== 'string' || !drawingPages.has(key)) return null;
    const entries = manifest.drawings.filter(entry => isObject(entry) && entry.key === key);
    // 重複 key 無法確定來源；禁止任選第一張，亦不接受 URL、路徑穿越或帶參數的檔名。
    if (entries.length !== 1) return null;
    const entry = entries[0];
    if (typeof entry.file !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.png$/i.test(entry.file) || entry.file.includes('..')) return null;
    const positiveInteger = value => Number.isSafeInteger(value) && value > 0;
    if (![entry.printed_page, entry.pdf_page, entry.width_px, entry.height_px].every(positiveInteger)) return null;
    const [printedPage, pdfPage] = drawingPages.get(key);
    if (entry.printed_page !== printedPage || entry.pdf_page !== pdfPage) return null;
    return entry;
  }

  return Object.freeze({ barKey, holderKey, adapterKey, resolve });
});
