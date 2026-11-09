/* 路徑核心只讀正式資料，不依賴 DOM；與既有 NC 相同的方向、圈數、徑向分次及進退刀座標。 */
window.ThreadMotion = (() => {
  const NC = window.NCProgram;
  const standards = [
    { id: 'M', label: '公制粗牙', family: 'parallel60', angle: 60 },
    { id: 'MF', label: '公制細牙', family: 'parallel60', angle: 60 },
    { id: 'UNC', label: '美制粗牙', family: 'parallel60', angle: 60 },
    { id: 'UNF', label: '美制細牙', family: 'parallel60', angle: 60 },
    { id: 'UNEF', label: '美制超細牙', family: 'parallel60', angle: 60 },
    { id: 'G', label: '平行管牙', family: 'parallel55', angle: 55 },
    { id: 'PT', label: '錐管牙', family: 'tapered55', angle: 55 },
    { id: 'NPT', label: '美制錐管牙', family: 'tapered60', angle: 60 }
  ];
  // 材料文字是原頁選單的呈現資料；數值仍由 getMaterialPreset() 提供。
  const materials = [
    { id: 'Material01', label: '碳鋼 · Carbon steel' }, { id: 'Material04', label: '合金鋼 · Alloy steel' },
    { id: 'Material06', label: '不鏽鋼 · Stainless steel' }, { id: 'Material07', label: '鑄鐵 · Cast iron' },
    { id: 'Material08', label: '非鐵金屬 · Non-ferrous' }, { id: 'Material12', label: '硬化鋼 < HRC50 · Hardened steel' }
  ];
  const phaseLabels = { position: '下刀定位', entry: '圓弧進刀', cut: '螺旋切削', exit: '圓弧退刀', retract: '安全抬刀' };
  const standardFor = id => standards.find(s => s.id === id);
  const belongs = (key, standard) => standard.id === 'G' ? key.startsWith('G (PF) ') : ['PT', 'NPT'].includes(standard.id) ? key.startsWith(standard.id + ' ') : NC.seriesOfSize(key) === standard.id;
  const getSizes = (id, insert = null) => {
    const standard = standardFor(id);
    const sizes = insert ? (NC.toolThreadMap[insert] || []) : NC.getFamilySizes(standard.family);
    return [...new Set(sizes)].filter(key => belongs(key, standard) && NC.threadData[key]);
  };
  const getInserts = (id, size) => NC.getFamilyInserts(standardFor(id).family).filter(item => (NC.toolThreadMap[item.v] || []).includes(size));

  function validate(p) {
    for (const key of ['od', 'tapDrill', 'toolDiameter', 'pitch', 'depth', 'feed', 'safeRelative']) {
      if (!Number.isFinite(p[key])) throw new Error('請填入有效的加工數值。');
    }
    if (p.od <= 0 || p.pitch <= 0 || p.depth <= 0 || p.depth > 200 || p.feed <= 0) throw new Error('加工深度需介於 0 與 200 mm 之間，切削參數需大於 0。');
    if (p.toolDiameter <= 0 || p.toolDiameter >= p.od || p.toolDiameter > p.tapDrill) throw new Error('刀徑需小於螺紋外徑，且不可大於下孔徑。');
    if (p.tapDrill <= 0 || p.tapDrill >= p.od) throw new Error('下孔徑需大於 0 且小於螺紋外徑。');
    if (p.safeRelative <= (p.mode === 'tapered' ? 1.5 * p.pitch : 0)) throw new Error('安全高度需高於工件表面與進刀位置。');
    // 原產生器會將安全 Z=0 回退成 20；在樣板擋下此例，避免圖面與輸出高度不同。
    if (p.coordinate?.zSafe === 0) throw new Error('現有產生器的安全高度 Z 需使用非 0 數值。');
    if (p.depth / p.pitch > 250) throw new Error('此預覽每次最多顯示 250 圈，請縮小加工深度。');
    if (p.mode === 'tapered' && p.depth <= 1.5 * p.pitch) throw new Error('錐牙加工深度需大於進刀高度 1.5P。');
    if (!p.passPercents?.length || p.passPercents.some(v => !Number.isFinite(v) || v <= 0 || v > 100)) throw new Error('請選擇有效的徑向加工次數。');
  }

  function build(p) {
    validate(p);
    const points = [], finishR = (p.od - p.toolDiameter) / 2, startR = (p.tapDrill - p.toolDiameter) / 2;
    const tapered = p.mode === 'tapered';
    const turns = tapered ? Math.ceil((p.depth + 1.5 * p.pitch) / p.pitch * 36 - 1e-9) / 36 : Math.ceil(p.depth / p.pitch);
    let time = 0, pass = 1;
    const add = (x, y, z, phase, dt, turn = 0) => { time += dt; points.push({ x, y, z, phase, t: time, pass, turn }); };
    add(0, 0, p.safeRelative, 'position', 0);
    // 直線和圓弧均離散取樣；時間只為清楚展示運動，不代表切削進給的實際秒數。
    const line = (x, y, z, phase, duration, turn = 0) => {
      const from = points[points.length - 1], n = 16;
      for (let i = 1; i <= n; i++) { const f = i / n; add(from.x + (x - from.x) * f, from.y + (y - from.y) * f, from.z + (z - from.z) * f, phase, duration / n, turn); }
    };
    const arc = (cx, cy, radius, a0, delta, z, phase, duration, turn = 0) => {
      const n = Math.ceil(Math.abs(delta) / (Math.PI / 36));
      for (let i = 1; i <= n; i++) { const angle = a0 + delta * i / n; add(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle), z, phase, duration / n, turn); }
    };
    p.passPercents.forEach((percent, passIndex) => {
      pass = passIndex + 1;
      const r = startR + (finishR - startR) * percent / 100;
      if (tapered) {
        const lift = 1.5 * p.pitch, entryR = r + lift / 32;
        const lastR = entryR - p.pitch / 32 * turns;
        if (lastR <= 0) throw new Error('目前深度使錐牙名義路徑半徑小於等於 0，請調整深度或刀片。');
        line(entryR / 2, entryR / 2, lift, 'position', .85);
        arc(entryR / 2, 0, entryR / 2, Math.PI / 2, -Math.PI / 2, lift, 'entry', .65);
        // 正式產生器的錐牙為 G02，每段 10°，半徑每下降 1 mm 減少 1/32 mm。
        for (let k = 1; k <= Math.round(turns * 36); k++) {
          const turn = k / 36, angle = -2 * Math.PI * turn, radius = entryR - p.pitch / 32 * turn;
          add(radius * Math.cos(angle), radius * Math.sin(angle), lift - p.pitch * turn, 'cut', .7 / 36, turn);
        }
        const last = points[points.length - 1];
        arc(last.x / 2, last.y / 2, Math.hypot(last.x, last.y) / 2, Math.atan2(last.y, last.x), -Math.PI, last.z, 'exit', .7, turns);
        line(0, 0, 0, 'retract', .5, turns);
      } else {
        line(0, 0, -p.depth, 'position', .85);
        line(r / 2, -r / 2, -p.depth, 'entry', .35);
        arc(r / 2, 0, r / 2, -Math.PI / 2, Math.PI / 2, -p.depth, 'entry', .65);
        for (let k = 1; k <= turns * 72; k++) {
          const turn = k / 72, angle = 2 * Math.PI * turn;
          add(r * Math.cos(angle), r * Math.sin(angle), -p.depth + p.pitch * turn, 'cut', .7 / 72, turn);
        }
        const zEnd = -p.depth + p.pitch * turns;
        arc(r / 2, 0, r / 2, 0, Math.PI / 2, zEnd, 'exit', .65, turns);
        line(0, 0, zEnd, 'exit', .35, turns);
      }
      line(0, 0, p.safeRelative, 'retract', .85, turns);
    });
    return { points, duration: time, turns, finishR, startR, tapered, input: p };
  }

  // 以二分搜尋定位時間，再線性插值；同一結果同時驅動兩個視圖與座標讀值。
  function sample(motion, time) {
    const points = motion.points, tt = Math.max(0, Math.min(time, motion.duration));
    let lo = 0, hi = points.length - 1;
    while (lo + 1 < hi) { const mid = (lo + hi) >> 1; if (points[mid].t <= tt) lo = mid; else hi = mid; }
    if (tt >= motion.duration) return { ...points[points.length - 1], index: points.length - 1 };
    const a = points[lo], b = points[hi], f = (tt - a.t) / Math.max(1e-9, b.t - a.t);
    return { ...b, x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, z: a.z + (b.z - a.z) * f, turn: b.phase === 'cut' && a.pass === b.pass ? a.turn + (b.turn - a.turn) * f : b.turn, index: lo };
  }
  return { standards, materials, phaseLabels, standardFor, getSizes, getInserts, build, sample };
})();
