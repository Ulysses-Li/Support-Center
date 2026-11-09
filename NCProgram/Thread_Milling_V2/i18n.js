/* 中英文字集中管理；兩種語言共用 HTML、產品資料與計算，不建立另一套頁面。 */
window.ThreadI18n = (() => {
  let language = new URLSearchParams(location.search).get('lang') === 'zh' ? 'zh' : 'en';
  const messages = {
    'MCC 螺紋銑削動態模擬 V2.0 | Nine9 Support Center': 'MCC Thread Milling V2.0 | Nine9 Support Center',
    '麵包屑': 'Breadcrumb',
    '看懂每一圈，掌握每一道牙。': 'See every turn. Master every thread.',
    '選擇螺紋與刀片，同步預覽加工路徑與 NC 程式。': 'Choose a thread and insert to preview synchronized toolpaths and NC code.',
    '查看動畫 ↓': 'View simulation ↓',
    '加工設定': 'Machining setup',
    '重設': 'Reset',
    '內螺紋加工': 'Internal threading',
    'Internal threading': 'MCC Thread Mill',
    '選型方式': 'Selection method',
    '從螺紋開始': 'By thread',
    '已有刀片型號': 'By insert',
    '螺紋規格': 'Thread',
    '刀片型號': 'Insert model',
    '螺紋系統': 'Thread standard',
    '螺紋尺寸': 'Thread size',
    '螺紋外徑': 'Major Ø',
    '螺距 P': 'Pitch P',
    '配對刀片': 'Matched inserts',
    '切削條件': 'Cutting conditions',
    '工件材料': 'Workpiece material',
    '加工深度': 'Cutting depth',
    '徑向加工次數': 'Radial passes',
    '1 次 · 100%': '1 pass · 100%',
    '2 次 · 60 / 100%': '2 passes · 60 / 100%',
    '3 次 · 50 / 80 / 100%': '3 passes · 50 / 80 / 100%',
    '切削速度 Vc': 'Cutting speed Vc',
    '每刃進給 fz': 'Feed per tooth fz',
    '有效刃數 z': 'Active teeth z',
    '還原材料建議值': 'Restore presets',
    '主軸轉速': 'Spindle speed',
    '切削進給': 'Feed rate',
    '材料建議值取自現有切削資料。': 'Material presets use the existing cutting data.',
    'NC 座標與刀號': 'NC coordinates & tool',
    '中心 X': 'Center X',
    '中心 Y': 'Center Y',
    '安全高度 Z': 'Safe plane Z',
    '工件表面 Z': 'Surface Z',
    '刀號 / H / D': 'Tool no. / H / D',
    '工件座標系': 'Work offset',
    '資料來源：現有 Thread Milling 刀片配對、螺紋尺寸與材料參數。': 'Source: existing Thread Milling insert pairings, thread dimensions and material data.',
    '雙視圖・同步刀路': 'Two views. One toolpath.',
    '選用刀片': 'Selected insert',
    '刀徑 / 螺距': 'Tool Ø / pitch',
    '加工方向': 'Cutting direction',
    '側視圖': 'Side view',
    '俯視圖': 'Top view',
    '螺紋剖面與刀具深度動畫': 'Thread section and tool depth animation',
    '刀具繞螺紋中心運動的俯視動畫': 'Top view of the tool orbiting the thread center',
    '圈數': 'Turns',
    '刀具': 'Tool',
    '切削路徑': 'Cutting path',
    '進退刀': 'Lead-in / out',
    '完整路徑': 'Full path',
    '下孔徑': 'Pre-hole Ø',
    '設定深度': 'Cutting depth',
    '每次螺旋圈數': 'Turns / pass',
    '牙型 / 錐度': 'Profile / taper',
    '暫停': 'Pause',
    '播放': 'Play',
    '重播': 'Replay',
    '↺ 重播': '↺ Replay',
    '從頭重播': 'Replay from the beginning',
    '播放速度': 'Speed',
    '加工進度': 'Progress',
    '加工階段': 'Machining phases',
    '01 下刀': '01 Position',
    '02 進刀': '02 Lead-in',
    '03 螺旋切削': '03 Helix',
    '04 退刀': '04 Lead-out',
    '05 抬刀': '05 Retract',
    '下刀定位': 'Positioning',
    '圓弧進刀': 'Lead-in arc',
    '螺旋切削': 'Helical cutting',
    '圓弧退刀': 'Lead-out arc',
    '安全抬刀': 'Retracting',
    '名義路徑示意；動畫速度獨立於實際加工時間。': 'Nominal toolpath illustration. Playback speed is independent of machining time.',
    '加工程式預覽': 'NC program preview',
    '複製程式': 'Copy code',
    '下載 .nc': 'Download .nc',
    'NC 程式碼': 'NC program code',
    '現有 NC 產生器輸出': 'Existing NC generator output',
    '程式沿用現有產生器；圖中顯示補正前名義座標。機台補正、刀長與實際試切仍依原作業流程確認。': 'Code uses the existing generator; the views show nominal coordinates before compensation. Verify machine compensation, tool length and trial cuts using your usual setup procedure.',
    '開啟現有 Thread Milling 程式頁 ↗': 'Open the existing Thread Milling generator ↗',
    '公制粗牙': 'Metric coarse',
    '公制細牙': 'Metric fine',
    '美制粗牙': 'Unified coarse',
    '美制細牙': 'Unified fine',
    '美制超細牙': 'Unified extra fine',
    '平行管牙': 'Parallel pipe thread',
    '錐管牙': 'Tapered pipe thread',
    '美制錐管牙': 'NPT tapered pipe thread',
    '平行牙': 'Parallel',
    '錐牙': 'Tapered',
    '平行': 'Parallel',
    '碳鋼 · Carbon steel': 'Carbon steel',
    '合金鋼 · Alloy steel': 'Alloy steel',
    '不鏽鋼 · Stainless steel': 'Stainless steel',
    '鑄鐵 · Cast iron': 'Cast iron',
    '非鐵金屬 · Non-ferrous': 'Non-ferrous metal',
    '硬化鋼 < HRC50 · Hardened steel': 'Hardened steel < HRC50',
    '刀徑 Ø{diameter} mm': 'Tool Ø{diameter} mm',
    '{count} 款可選': '{count} available',
    '{count} 款已選刀片': '{count} selected',
    '刀徑等於資料表下孔徑，需確認實際進刀間隙。': 'Tool diameter equals the listed pre-hole diameter. Confirm entry clearance.',
    '依現有 Thread Milling 資料配對。': 'Pairings use the existing Thread Milling data.',
    '請檢查「{field}」的數值範圍。': 'Check the allowed range for “{field}”.',
    '{count} 行': '{count} lines',
    'G02 ↻ 順時針': 'G02 ↻ CW',
    'G03 ↺ 逆時針': 'G03 ↺ CCW',
    '由上往下 · Z−': 'Top → bottom · Z−',
    '由下往上 · Z+': 'Bottom → top · Z+',
    '{count} 圈': '{count} turns',
    '{count} 次加工': 'Passes: {count}',
    '已帶入材料建議值；刃數沿用原頁預設 6，可調整。': 'Material presets loaded. Active teeth default to 6, as in the original page; adjust as needed.',
    '目前使用自訂切削值；可還原材料建議值。': 'Custom cutting values are active. Restore the material presets at any time.',
    '沿用現有錐牙每段 10° 的路徑': 'uses the existing 10° tapered segments',
    '依現有產生器取完整圈數': 'uses whole turns from the existing generator',
    '名義路徑示意；{strategy}，螺旋終點 Z{z}（相對工件表面）。播放速度獨立於加工時間。': 'Nominal toolpath: {strategy}. Helix ends at Z{z} relative to the surface. Playback speed is independent of machining time.',
    '請先檢查加工設定': 'Check the machining setup',
    '有效設定後顯示刀路': 'Enter valid settings to preview the path',
    '請先修正加工設定，再產生程式。': 'Correct the machining settings to generate code.',
    '設定待修正': 'Check settings',
    '等待設定': 'Waiting for setup',
    '加工完成': 'Machining complete',
    '第 {pass} / {total} 次': 'Pass {pass} / {total}',
    '模擬播放中': 'Simulation running',
    '模擬完成': 'Simulation complete',
    '模擬已暫停': 'Simulation paused',
    '已複製完整 NC 程式': 'Full NC program copied',
    '無法存取剪貼簿，請選取程式文字複製。': 'Clipboard unavailable. Select and copy the code manually.',
    '工件表面 Z0': 'Surface Z0',
    '錐度 1:16': 'Taper 1:16',
    '平行螺紋': 'Parallel thread',
    '螺紋 Ø{diameter}': 'Thread Ø{diameter}',
    '請填入有效的加工數值。': 'Enter valid machining values.',
    '加工深度需介於 0 與 200 mm 之間，切削參數需大於 0。': 'Cutting depth must be greater than 0 and no more than 200 mm. Cutting values must be positive.',
    '刀徑需小於螺紋外徑，且不可大於下孔徑。': 'Tool diameter must be smaller than the thread major diameter and no larger than the pre-hole diameter.',
    '下孔徑需大於 0 且小於螺紋外徑。': 'Pre-hole diameter must be positive and smaller than the thread major diameter.',
    '安全高度需高於工件表面與進刀位置。': 'The safe plane must be above the work surface and the entry position.',
    '現有產生器的安全高度 Z 需使用非 0 數值。': 'Safe plane Z must be nonzero for the existing generator.',
    '此預覽每次最多顯示 250 圈，請縮小加工深度。': 'This preview supports up to 250 turns per pass. Reduce the cutting depth.',
    '錐牙加工深度需大於進刀高度 1.5P。': 'Tapered cutting depth must exceed the 1.5P entry height.',
    '請選擇有效的徑向加工次數。': 'Select valid radial passes.',
    '目前深度使錐牙名義路徑半徑小於等於 0，請調整深度或刀片。': 'This depth makes the tapered path radius zero or negative. Adjust the depth or insert.',
    '缺少刀徑 (Insert Diameter)': 'Enter a valid insert diameter.',
    '請提供外徑 (OD)': 'Enter a valid major diameter (OD).',
    '請提供有效螺距 (Pitch)': 'Enter a valid pitch.',
    '請提供 Tap Drill Diameter': 'Enter a valid pre-hole diameter.',
    'Depth of Cut 必須 > 0': 'Cutting depth must be greater than zero.',
    '請提供有效進給 (Feed Rate)': 'Enter a valid feed rate.',
    '產生結果包含無效數值，請檢查輸入參數': 'The generated code contains invalid values. Check the inputs.',
    '外徑需大於刀徑': 'Major diameter must exceed tool diameter.',
    'Tap Drill 需大於刀徑': 'Pre-hole diameter must be at least the tool diameter.',
    'Angle 迴圈過多，請檢查參數': 'The path exceeds the segment limit. Check the inputs.'
  };

  function t(key, values = {}) {
    const text = language === 'en' ? (messages[key] ?? key) : key;
    return text.replace(/\{(\w+)\}/g, (match, name) => values[name] ?? match);
  }

  // 只記錄初始靜態文字與無障礙標籤；動態內容由 app.js 透過 t() 產生。
  // 保留原文字節點與空白，切換語言時不取代 SVG、按鈕圖示或使用者輸入。
  const staticTexts = [], staticAttributes = [];
  for (const root of [document.querySelector('main'), document.querySelector('title')]) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode, key = node.nodeValue.trim();
      if (Object.hasOwn(messages, key)) staticTexts.push({ node, key, original: node.nodeValue });
    }
  }
  document.querySelectorAll('main [aria-label]').forEach(node => {
    const key = node.getAttribute('aria-label');
    if (Object.hasOwn(messages, key)) staticAttributes.push({ node, key });
  });

  function apply() {
    staticTexts.forEach(({ node, key, original }) => { node.nodeValue = original.replace(key, t(key)); });
    staticAttributes.forEach(({ node, key }) => node.setAttribute('aria-label', t(key)));
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-Hant';
    document.title = t('MCC 螺紋銑削動態模擬 V2.0 | Nine9 Support Center');
    const button = document.getElementById('languageToggle');
    button.textContent = language === 'en' ? '繁體中文' : 'English';
    button.setAttribute('aria-label', language === 'en' ? 'Switch to Traditional Chinese' : '切換為英文');
    button.lang = language === 'en' ? 'zh-Hant' : 'en';
  }
  function setLanguage(next) {
    language = next === 'en' ? 'en' : 'zh';
    const url = new URL(location.href);
    url.searchParams.set('lang', language);
    history.replaceState(null, '', url);
    apply();
  }
  apply();
  return { t, setLanguage, get language() { return language; } };
})();
