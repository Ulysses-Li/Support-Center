/* NineBore 繁體中文訊息層：僅轉換顯示文字，料號、資料值與計算規則維持原樣。 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.NINEBORE_ZH_TW = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MATERIALS = Object.freeze({
    'Carbon Steel': '碳鋼',
    'Alloy Steel': '合金鋼',
    'Stainless Steel': '不鏽鋼',
    'Cast Iron': '鑄鐵',
    'Non-ferrous metal': '非鐵金屬',
    'Hardened Steel <HRC 50': '淬硬鋼（HRC < 50）'
  });
  const CONDITIONS = Object.freeze({
    'Regular cutting': '一般切削',
    'Interrupted cutting': '斷續切削',
    'Super mirror finish': '超鏡面加工'
  });

  // 核心訊息與圖面固定字串集中管理；未列出的文字原樣回傳，避免誤翻產品資料。
  const MESSAGES = Object.freeze({
    'A same-material NC30 interrupted-cutting row is available only as a separately labeled trial reference.':'同材料 NC30 的斷續切削資料僅能獨立標示為試切參考，不代表一般切削建議。',
    'Reference values use the same material with NC30 under interrupted cutting; they are not catalog recommendations for the selected regular-cutting condition.':'參考值來自相同材料、NC30 的斷續切削資料，不是型錄對目前一般切削條件的推薦值。',
    'Same-material NC30 interrupted-cutting trial reference (selected regular cutting remains unconfirmed)':'同材料 NC30 斷續切削試切參考（尚非一般切削原廠推薦）',
    ...MATERIALS,
    ...CONDITIONS,
    'Target diameter D (mm)': '目標孔徑 D（mm）',
    'Boring depth (mm)': '搪孔深度（mm）',
    'Gripping diameter (mm)': '夾持直徑（mm）',
    'Machine / assembly maximum speed (rpm)': '機台／總成最高轉速（rpm）',
    'Prebore diameter (mm)': '預加工孔徑（mm）',
    'Cutting speed Vc (m/min)': '切削速度 Vc（m/min）',
    'Feed per revolution f (mm/rev)': '每轉進給 f（mm/rev）',
    'This bar lists only the CC...0602... family. Confirm the official mapping between CCGH060204 and the physical inserts on p162 with the manufacturer.': '此刀桿僅列出 CC...0602... 刀片系列。請向原廠確認 CCGH060204 與第 162 頁實體刀片的正式對應關係。',
    'Boring depth has not been provided, so the depth check is incomplete.': '尚未提供搪孔深度，深度檢查尚未完成。',
    'L1 on p152/153 is the front-neck geometry. Confirm actual projection, shoulder clearance and workpiece interference.': '第 152／153 頁的 L1 為前端頸長幾何尺寸。請確認實際伸出長度、肩部間隙及工件干涉情形。',
    'Confirm that the general holder is side-lock, hydraulic or spring-collet.': '請確認通用刀柄為側固式、液壓式或彈簧筒夾式。',
    'Select the gripping diameter of the general holder to check the bar shank.': '請選擇通用刀柄的夾持直徑，以檢查刀桿柄徑。',
    'The catalog does not list a minimum effective clamping length for general holders. Check actual insertion and interference.': '型錄未列出通用刀柄的最小有效夾持長度。請檢查實際插入長度及干涉情形。',
    'No catalog NineBore holder part number is selected. Confirm the machine-side connection.': '尚未選擇型錄中的 NineBore 刀柄料號。請確認機台端連接介面。',
    'SB32 is a Ø32×60 Weldon straight shank. Confirm an external machine holder that grips Ø32; SB32 is not a direct spindle taper.': 'SB32 為 Ø32×60 Weldon 直柄。請確認可夾持 Ø32 的外部機台刀柄；SB32 並非直接接合主軸的錐柄。',
    'No confirmed 99151 adapter is listed for this bar shank diameter.': '尚未列出已確認可搭配此刀桿柄徑的 99151 轉接座。',
    'The selected holder is not listed as compatible with this adapter.': '型錄未列出所選刀柄與此轉接座相容。',
    'Clamping remains unconfirmed. Candidates matching diameter and depth are retained for review.': '夾持方式待確認。保留符合孔徑與深度的候選刀桿供檢查。',
    'Although within the listed 99151 L1, actual insertion into the adapter, assembly projection and shoulder clearance still require confirmation.': '雖然深度在型錄所列的 99151 L1 範圍內，仍須確認刀桿插入轉接座的實際長度、總成伸出長度及肩部間隙。',
    'Select the workpiece material to check insert grade and cutting data.': '請選擇工件材質，以檢查刀片材種與切削資料。',
    'No confirmed catalog cutting row exists for this material and condition. Geometric candidates remain available with manual cutting inputs.': '此材質與加工條件沒有已確認的型錄切削資料列。仍可檢視幾何尺寸符合的候選刀桿，並手動輸入切削值。',
    'The cutting-row grade exists, but the mapping from CC...0602... to a physical insert part remains unconfirmed. Compatibility is not assumed.': '切削資料列所需材種存在，但 CC...0602... 與實體刀片料號的對應關係待確認。目前不視為相容。',
    'The H-material condition applies only to HRC < 50. Confirm the actual workpiece hardness.': 'H 類材質條件僅適用於 HRC < 50。請確認工件的實際硬度。',
    'No confirmed bar route matches the clamping inputs. Check the gripping diameter and holder details.': '沒有已確認的刀桿搭配方式符合目前夾持輸入。請檢查夾持直徑及刀柄資料。',
    'Correct the input values to continue.': '請修正輸入值後繼續。',
    'Browse candidates while the four requirements remain incomplete.': '四項需求尚未填妥，可先瀏覽候選刀桿。',
    'Select a bar combination first.': '請先選擇刀桿組合。',
    'The selected insert / grade is not a listed physical candidate for this bar.': '所選刀片／材種不在此刀桿列出的實體候選刀片中。',
    'Select a physical insert and grade. No insert is chosen automatically without a unique confirmed match.': '請選擇實體刀片與材種。沒有唯一且已確認的配對時，不會自動選擇刀片。',
    'Site median starting point (adjustable; not a catalog optimum)': '本站中間值起始點（可調整；並非型錄最佳值）',
    'No confirmed catalog cutting row exists for this material and condition. Manual values are not catalog recommendations.': '此材質與加工條件沒有已確認的型錄切削資料列。手動輸入值不屬於型錄建議。',
    'This insert matches only a family wildcard. Confirm the physical geometry with the manufacturer; cutting recommendations are not applied automatically.': '此刀片僅符合系列通配條件。請向原廠確認實體幾何尺寸；不會自動套用切削建議。',
    'The selected physical insert grade is absent from this row. Conditions from another material or operation are not substituted.': '此資料列未列出所選實體刀片的材種。不會以其他材質或加工方式的條件替代。',
    'This H-material cutting row applies only to HRC < 50. Confirm actual hardness.': '此 H 類材質切削資料列僅適用於 HRC < 50。請確認實際硬度。',
    'No confirmed automatic cutting speed is available. Enter manual Vc.': '沒有已確認可自動套用的切削速度。請手動輸入 Vc。',
    'Enter manual cutting speed Vc, or use the Use median button.': '請手動輸入切削速度 Vc，或按「套用中間值」。',
    'No confirmed automatic feed per revolution is available. Enter manual f.': '沒有已確認可自動套用的每轉進給。請手動輸入 f。',
    'Enter manual feed per revolution f, or use the Use median button.': '請手動輸入每轉進給 f，或按「套用中間值」。',
    'These conditions include user-entered values and are labeled as manual inputs.': '這些條件包含使用者輸入值，已標示為手動輸入。',
    'The speed calculation exceeds the finite numeric range. Adjust the inputs.': '轉速計算超出有限數值範圍。請調整輸入值。',
    'The feed calculation exceeds the finite numeric range. Adjust the inputs.': '進給計算超出有限數值範圍。請調整輸入值。',
    'Prebore diameter must be smaller than the target diameter to calculate radial stock Ae.': '預加工孔徑必須小於目標孔徑，才能計算徑向餘量 Ae。',
    'The physical insert Re or its catalog Ae mapping is unconfirmed. Radial stock cannot be marked as verified.': '實體刀片的 Re 或其型錄 Ae 對應關係待確認。徑向餘量尚無法標示為已驗證。',
    'This combination still requires review. Calculated values do not approve the complete assembly.': '此組合仍須檢查。計算值不代表整組總成已通過確認。',
    'S × f (no tooth-count factor)': 'S × f（不乘刃數）',
    '(D − prebore) ÷ 2': '（D − 預加工孔徑）÷ 2',
    'not set': '未設定',
    'Select a bar to compare L1.': '請選擇刀桿以比較 L1。',
    'L1 unavailable. Check the catalog.': '沒有 L1 資料，請查閱型錄。',
    'Depth exceeds front-neck L1.': '需求深度超過前端頸長 L1。',
    'Usable depth and clearance need checking.': '須檢查可用深度與間隙。',
    'L1 describes front-neck geometry.': 'L1 表示前端頸長幾何尺寸。',
    'Usable boring depth needs checking.': '可用搪孔深度待確認。',
    'Enter a positive depth to compare L1.': '請輸入大於 0 的深度以比較 L1。',
    'Depth exceeds catalog L1: insufficient.': '需求深度超過型錄 L1：長度不足。',
    'Requested depth is within catalog L1.': '需求深度在型錄 L1 範圍內。',
    'Check clamping and workpiece clearance.': '請檢查夾持與工件間隙。',
    'L1 meaning is unconfirmed.': 'L1 的定義待確認。',
    'Confirm the usable boring depth.': '請確認可用搪孔深度。',
    'Workpiece': '工件',
    'Select a bar': '請選擇刀桿',
    'Holder': '刀柄',
    'Adapter': '轉接座',
    'Quick': '快換',
    'Cutting tip': '切削刀尖',
    'Axial section': '軸向剖面',
    'Schematic · Not to scale': '概念示意・非等比例',
    'Depth requested': '需求深度',
    'Hatching: workpiece · Dashed: original hole': '斜線：工件・虛線：原始孔',
    'L1: catalog value unconfirmed': 'L1：型錄數值待確認',
    'Select a bar to show the assembly chain.': '請選擇刀桿以顯示組裝順序。',
    'NineBore holder: not selected': 'NineBore 刀柄：未選擇',
    'Compatible general holder: unconfirmed': '相容通用刀柄：待確認',
    'Dedicated adapter': '專用轉接座',
    '99151 adapter: not selected': '99151 轉接座：未選擇',
    'Boring bar': '搪孔刀桿',
    'Match adapter ØD to bar Ød. Check clamping and workpiece clearance.': '轉接座 ØD 須與刀桿 Ød 相符。請檢查夾持與工件間隙。',
    '99146 uses the NineBore quick-change interface directly. Check clamping and clearance.': '99146 直接使用 NineBore 快換介面。請檢查夾持與間隙。',
    'Check actual shank diameter, effective clamping and workpiece clearance.': '請檢查實際柄徑、有效夾持及工件間隙。',
    'Assembly order from holder to boring bar': '從刀柄至搪孔刀桿的組裝順序',
    'Axial schematic, not to scale. Gray hatching represents the workpiece, light blue the finished bore, and dashed lines the original hole.': '軸向概念示意，非等比例。灰色斜線代表工件，淡藍色代表完成孔，虛線代表原始孔。',
    'The catalog lists L1 as Boring Depth for this series.': '型錄將此系列的 L1 列為搪孔深度。',
    'L1 is front-neck geometry, not a verified boring depth.': 'L1 為前端頸長幾何尺寸，並非已確認的搪孔深度。',
    'The meaning of L1 for this bar needs confirmation.': '此刀桿的 L1 定義待確認。',
    '99151 assembly order: holder, dedicated adapter, bar. The adapter bore diameter must match the bar shank diameter.': '99151 組裝順序：刀柄、專用轉接座、刀桿。轉接座孔徑必須與刀桿柄徑相符。',
    '99146 uses the NineBore quick-change holder directly; no 99151 adapter is required.': '99146 直接搭配 NineBore 快換刀柄，不需要 99151 轉接座。',
    'A general straight-shank bar requires compatible clamping.': '通用直柄刀桿須搭配相容的夾持方式。',
    'SB32 requires a separate compatible Ø32 Weldon machine-side holder.': 'SB32 另需搭配相容的 Ø32 Weldon 機台端刀柄。',
    'Do not add holder L, adapter L and bar L to calculate usable boring depth. Assembly projection and workpiece clearance need confirmation.': '不可將刀柄 L、轉接座 L 與刀桿 L 相加計算可用搪孔深度。總成伸出長度及工件間隙待確認。'
  });

  const NUM = '[+]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:e[+-]?\\d+)?';
  const DIMENSION = '(?:not set|≈?' + NUM + ' mm)';
  const numberRule = (source, replacement) => [new RegExp(source, 'i'), replacement];
  // 插值規則皆限定完整訊息；擷取的數字、範圍及材種名稱不做換算或改寫。
  const RULES = [
    [/^Enter (.+)\.$/, (all, label) => MESSAGES[label] ? '請輸入' + MESSAGES[label] + '。' : all],
    [/^(.+) must be a finite number greater than 0\.$/, (all, label) => MESSAGES[label] ? MESSAGES[label] + '必須為大於 0 的有限數值。' : all],
    numberRule('^The requested Ø(' + NUM + ') mm shank is shown in the 99121 drawing \\(Ø20（Ø13）\\), but the per-part mapping is unconfirmed\\. Confirm the actual bar shank before matching this holder\\.$', (all, d) => '所需 Ø' + d + ' mm 柄徑出現在 99121 圖面（Ø20（Ø13））中，但各料號的對應關係待確認。搭配此刀柄前，請先確認刀桿的實際柄徑。'),
    [/^This row specifies (.+), but no matching physical grade is listed for this insert geometry\. A missing item is not invented(?: and another cutting row is not substituted|; the selected cutting row remains unconfirmed)\.$/, (all, grades) => '此切削資料列指定 ' + grades + '，但這款刀片未列出相同牌號；目前沒有此組合在所選加工條件下的型錄推薦數據。'],
    numberRule('^The target diameter is below the smallest listed diameter of (' + NUM + ') mm for this clamping route\\.$', (all, d) => '目標孔徑小於此夾持方式列出的最小孔徑 ' + d + ' mm。'),
    numberRule('^The target diameter exceeds the largest listed diameter of (' + NUM + ') mm for this clamping route\\.$', (all, d) => '目標孔徑超過此夾持方式列出的最大孔徑 ' + d + ' mm。'),
    numberRule('^The target diameter falls in a gap between actual adjustable ranges(?: \\(between (' + NUM + ') and (' + NUM + ') mm\\))?\\. No standard item is listed here; confirm a special size\\.$', (all, min, max) => '目標孔徑落在實際可調範圍之間的缺口' + (min ? '（' + min + ' 至 ' + max + ' mm 之間）' : '') + '。此處沒有列出的標準品，請確認特殊尺寸。'),
    numberRule('^General-holder bars match the entered diameter and depth, but no listed or drawing-supported shank matches the requested Ø(' + NUM + ') mm\\. Check the holder gripping diameter or confirm a suitable bar shank with the manufacturer\\.$', (all, d) => '通用刀柄用刀桿符合輸入的孔徑與深度，但型錄及圖面沒有可對應所需 Ø' + d + ' mm 的柄徑。請檢查刀柄夾持直徑，或向原廠確認合適的刀桿柄徑。'),
    numberRule('^Listed bars match the diameter, but the required depth exceeds their largest L1 of (' + NUM + ') mm\\. Holder length and depth-ratio summaries do not extend that limit\\.$', (all, l1) => '列出的刀桿符合孔徑，但需求深度超過其最大 L1 ' + l1 + ' mm。刀柄長度與深徑比摘要不會延長此上限。'),
    [/^(\d+) bar\(s\) match the diameter and listed L1\. Check each combination for clamping and insert pairing status\.$/, (all, count) => count + ' 支刀桿符合孔徑與型錄 L1。請逐一檢查各組合的夾持與刀片配對狀態。'],
    numberRule("^The target diameter is outside this bar's listed range of (" + NUM + ')–(' + NUM + ') mm\\.$', (all, min, max) => '目標孔徑超出此刀桿列出的 ' + min + '–' + max + ' mm 範圍。'),
    numberRule("^Boring depth exceeds this bar's listed L1 of (" + NUM + ') mm\\.$', (all, l1) => '搪孔深度超過此刀桿列出的 L1 ' + l1 + ' mm。'),
    numberRule('^Calculated speed (' + NUM + ') rpm exceeds the entered limit of (' + NUM + ') rpm\\. Adjust Vc; speed has not been clipped automatically\\.$', (all, speed, limit) => '計算轉速 ' + speed + ' rpm 超過輸入上限 ' + limit + ' rpm。請調整 Vc；系統未自動限制轉速。'),
    numberRule('^Radial stock Ae (' + NUM + ') mm exceeds the listed (' + NUM + ') mm for this row and insert radius\\. Review the cutting conditions\\.$', (all, ae, limit) => '徑向餘量 Ae ' + ae + ' mm 超過此資料列與刀片鼻端半徑對應的 ' + limit + ' mm。請檢查切削條件。'),
    [/^NineBore axial section schematic(?: · (\d+))?$/, (all, series) => 'NineBore 軸向剖面示意' + (series ? '・' + series : '')],
    [/^(\d+) bar$/, (all, series) => series + ' 刀桿'],
    numberRule('^D: (' + DIMENSION + ') · Depth: (' + DIMENSION + ')$', (all, d, depth) => 'D：' + dimension(d) + '・深度：' + dimension(depth)),
    numberRule('^(Front-neck L1: |Catalog L1: |L1: )(' + DIMENSION + ') · (Boring Depth|geometry|meaning unconfirmed)$', (all, prefix, value, meaning) => ({'Front-neck L1: ':'前端頸長 L1：','Catalog L1: ':'型錄 L1：','L1: ':'L1：'}[prefix]) + value + '・' + ({'Boring Depth':'搪孔深度','geometry':'幾何尺寸','meaning unconfirmed':'定義待確認'}[meaning])),
    numberRule('^L1: (≈?' + NUM + ' mm)$', (all, value) => 'L1：' + value),
    numberRule('^Diameter requested, D: (' + NUM + ' mm|no valid positive value)\\.$', (all, value) => '需求孔徑 D：' + (value === 'no valid positive value' ? '尚無有效正數' : value) + '。'),
    numberRule('^Depth requested: (' + NUM + ' mm|no valid positive value)\\.$', (all, value) => '需求深度：' + (value === 'no valid positive value' ? '尚無有效正數' : value) + '。'),
    [/^Bar series: (\d+)\. Orange indicates the conceptual cutting location\.$/, (all, series) => '刀桿系列：' + series + '。橘色表示概念切削位置。'],
    numberRule('^L1: (' + NUM + ') mm\\.$', (all, l1) => 'L1：' + l1 + ' mm。'),
    numberRule('^Bar diameter range: (' + NUM + ') to (' + NUM + ') mm\\.$', (all, min, max) => '刀桿孔徑範圍：' + min + ' 至 ' + max + ' mm。'),
    [/^Catalog page: (\d+)\.$/, (all, page) => '型錄頁碼：' + page + '。']
  ];

  function dimension(value) { return value === 'not set' ? '未設定' : value; }

  function singleMessage(text) {
    if (Object.prototype.hasOwnProperty.call(MESSAGES, text)) return MESSAGES[text];
    for (const [pattern, replacement] of RULES) {
      if (pattern.test(text)) return text.replace(pattern, replacement);
    }
    return text;
  }

  // SVG desc / aria-label 由多句已知文字組成；逐句確認後才翻譯，未知內容不做部分替換。
  const DESCRIPTION_START = 'Axial schematic, not to scale. Gray hatching represents the workpiece, light blue the finished bore, and dashed lines the original hole.';
  const DESCRIPTION_PARTS = Object.keys(MESSAGES).filter(message => message.endsWith('.')).sort((a, b) => b.length - a.length);
  const DESCRIPTION_PATTERNS = [
    new RegExp('^Diameter requested, D: (?:' + NUM + ' mm|no valid positive value)\\.' , 'i'),
    new RegExp('^Depth requested: (?:' + NUM + ' mm|no valid positive value)\\.', 'i'),
    /^Bar series: \d+\. Orange indicates the conceptual cutting location\./,
    new RegExp('^L1: ' + NUM + ' mm\\.', 'i'),
    new RegExp('^Bar diameter range: ' + NUM + ' to ' + NUM + ' mm\\.', 'i'),
    /^Catalog page: \d+\./
  ];

  function compoundDescription(text) {
    let remaining = text;
    const translated = [];
    const title = remaining.match(/^NineBore axial section schematic(?: · \d+)?\. /);
    if (title) {
      translated.push(singleMessage(title[0].slice(0, -2)) + '。');
      remaining = remaining.slice(title[0].length);
    }
    if (!remaining.startsWith(DESCRIPTION_START)) return null;
    while (remaining) {
      let sentence = DESCRIPTION_PARTS.find(part => remaining === part || remaining.startsWith(part + ' '));
      if (!sentence) {
        for (const pattern of DESCRIPTION_PATTERNS) {
          const match = remaining.match(pattern);
          if (match && (remaining.length === match[0].length || remaining[match[0].length] === ' ')) {
            sentence = match[0];
            break;
          }
        }
      }
      if (!sentence) return null;
      translated.push(singleMessage(sentence));
      remaining = remaining.slice(sentence.length).replace(/^ /, '');
    }
    return translated.join(' ');
  }

  function translate(value) {
    if (typeof value !== 'string') return value;
    const message = singleMessage(value);
    if (message !== value) return message;
    const description = compoundDescription(value);
    if (description !== null) return description;
    // 組裝說明僅額外串接固定的 SB32 提醒；不將任意文字當作可翻譯句子切割。
    const sb32 = ' SB32 requires a separate compatible Ø32 Weldon machine-side holder.';
    if (value.endsWith(sb32)) {
      const first = value.slice(0, -sb32.length), translated = singleMessage(first);
      if (translated !== first) return translated + ' ' + MESSAGES[sb32.trim()];
    }
    return value;
  }

  function material(value) { return Object.prototype.hasOwnProperty.call(MATERIALS, value) ? MATERIALS[value] : value; }
  function condition(value) { return Object.prototype.hasOwnProperty.call(CONDITIONS, value) ? CONDITIONS[value] : value; }

  function decodeEntities(value) {
    return value.replace(/&(?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[\da-f]+);/gi, entity => {
      const named = {'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':'\u00a0'};
      if (named[entity.toLowerCase()] !== undefined) return named[entity.toLowerCase()];
      const code = entity[2].toLowerCase() === 'x' ? parseInt(entity.slice(3, -1), 16) : parseInt(entity.slice(2, -1), 10);
      return Number.isInteger(code) && code >= 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
    });
  }
  function escapeText(value) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function translatedContent(value, quote) {
    const parts = value.match(/^(\s*)([\s\S]*?)(\s*)$/), decoded = decodeEntities(parts[2]), translated = translate(decoded);
    if (translated === decoded) return value;
    let safe = escapeText(translated);
    if (quote === '"') safe = safe.replace(/"/g, '&quot;');
    if (quote === "'") safe = safe.replace(/'/g, '&#39;');
    return parts[1] + safe + parts[3];
  }

  function translateMarkup(markup) {
    if (typeof markup !== 'string') return markup;
    let opaque = '';
    // 純字串掃描保留原始標籤；只處理可見文字、title 與 aria-label，不碰座標、class、id、value 或 data-*。
    return markup.replace(/<!--[\s\S]*?-->|<(?:[^>"']|"[^"]*"|'[^']*')*>|[^<]+|</g, token => {
      if (token.startsWith('<!--')) return token;
      if (token[0] === '<') {
        const tag = token.match(/^<\s*(\/?)\s*([\w:-]+)/);
        if (tag && /^(script|style)$/i.test(tag[2])) {
          if (tag[1]) opaque = '';
          else opaque = tag[2].toLowerCase();
          return token;
        }
        if (opaque) return token;
        return token.replace(/(\s(?:aria-label|title)\s*=\s*)(["'])([\s\S]*?)\2/gi, (all, prefix, quote, content) => prefix + quote + translatedContent(content, quote) + quote);
      }
      return opaque ? token : translatedContent(token);
    });
  }

  return Object.freeze({ translate, translateMarkup, material, condition });
});
