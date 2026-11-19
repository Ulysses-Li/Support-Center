/* G-code 名義刀路解析：所有位置及進給統一轉換成 mm 與 mm/min。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GCodeParser = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const TAU = Math.PI * 2;
  const copy = p => ({ x: p.x, y: p.y, z: p.z });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const planes = { 17: ['x', 'y', 'z', 'I', 'J'], 18: ['z', 'x', 'y', 'K', 'I'], 19: ['y', 'z', 'x', 'J', 'K'] };

  // 平面座標使用右手定則，G18 以 Z、X 排列以保持圓弧方向正確。
  function arcPoints(start, end, words, plane, clockwise, scale) {
    const [u, v, w, iu, iv] = planes[plane];
    const x1 = start[u], y1 = start[v], x2 = end[u], y2 = end[v];
    const dx = x2 - x1, dy = y2 - y1, chord = Math.hypot(dx, dy);
    let cx, cy;
    const sweepFor = (x, y) => {
      const a = Math.atan2(y1 - y, x1 - x);
      const b = Math.atan2(y2 - y, x2 - x);
      let delta = b - a;
      if (clockwise) { while (delta >= -1e-10) delta -= TAU; }
      else { while (delta <= 1e-10) delta += TAU; }
      return delta;
    };
    if (words.R !== undefined) {
      const radius = Math.abs(words.R * scale);
      if (chord < 1e-9 || radius < 1e-9 || chord > 2 * radius + 0.002 * scale) throw new Error('R 圓弧半徑與端點不相容');
      const h = Math.sqrt(Math.max(0, radius * radius - chord * chord / 4));
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const candidates = [[mx - dy / chord * h, my + dx / chord * h], [mx + dy / chord * h, my - dx / chord * h]];
      [cx, cy] = candidates.find(p => words.R >= 0 ? Math.abs(sweepFor(...p)) <= Math.PI + 1e-7 : Math.abs(sweepFor(...p)) >= Math.PI - 1e-7) || candidates[0];
    } else {
      if (words[iu] === undefined && words[iv] === undefined) throw new Error('圓弧缺少圓心 I/J/K 或半徑 R');
      cx = x1 + (words[iu] || 0) * scale;
      cy = y1 + (words[iv] || 0) * scale;
      const r1 = Math.hypot(x1 - cx, y1 - cy), r2 = Math.hypot(x2 - cx, y2 - cy);
      if (r1 < 1e-9 || Math.abs(r1 - r2) > Math.max(0.01 * scale, r1 * 0.001)) throw new Error('圓弧起點與終點到圓心的半徑不一致');
    }
    const radius = Math.hypot(x1 - cx, y1 - cy);
    const angle = Math.atan2(y1 - cy, x1 - cx), sweep = sweepFor(cx, cy);
    const steps = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 36)));
    const points = [];
    for (let i = 1; i <= steps; i++) {
      const t = i / steps, p = copy(start);
      p[u] = cx + radius * Math.cos(angle + sweep * t);
      p[v] = cy + radius * Math.sin(angle + sweep * t);
      p[w] = start[w] + (end[w] - start[w]) * t;
      points.push(i === steps ? copy(end) : p);
    }
    return points;
  }

  function parse(source) {
    const lines = String(source || '').split(/\r?\n/), segments = [], warnings = [];
    let pos = { x: 0, y: 0, z: 0 }, scale = 1, abs = true, plane = 17, motion = 0, feed = null, stopped = false, workOffset = null;
    const warn = (line, message) => warnings.push({ line, message });
    const stop = (line, message) => { warn(line, message + '；後續刀路未預覽'); stopped = true; };
    const add = (a, b, line, rapid) => { if (distance(a, b) > 1e-10) segments.push({ start: copy(a), end: copy(b), line, kind: rapid ? 'rapid' : 'cut', rapid, feed }); };
    for (let index = 0; index < lines.length && !stopped; index++) {
      const line = index + 1;
      // 括號及分號後的註解不參與指令解讀，未知表示式必須停止推算。
      let raw = lines[index].replace(/\([^)]*\)/g, '').replace(/;.*/, '').trim().toUpperCase();
      if (!raw || raw === '%') continue;
      if (/[#\[\]{}]/.test(raw)) { stop(line, '不支援變數或運算式'); break; }
      if (raw.includes('/')) { stop(line, '不支援選擇性跳段'); break; }
      const words = {}, gs = [], ms = [];
      const token = /([A-Z])\s*([+-]?(?:\d+\.?\d*|\.\d+))/g;
      let match, last = 0, bad = false;
      while ((match = token.exec(raw))) {
        if (raw.slice(last, match.index).trim()) { bad = true; break; }
        const letter = match[1], value = Number(match[2]); last = token.lastIndex;
        if (letter === 'G') gs.push(value); else if (letter === 'M') ms.push(value);
        else { if (words[letter] !== undefined) { bad = true; break; } words[letter] = value; }
      }
      if (bad || raw.slice(last).trim()) { stop(line, '無法辨識的程式內容'); break; }
      if (Object.keys(words).some(k => !'XYZIJKRFSTHDNOP'.includes(k))) { stop(line, '含不支援的軸或參數'); break; }
      if (ms.some(m => ![0, 1, 2, 3, 4, 5, 6, 8, 9, 30].includes(m))) { stop(line, '含不支援的 M 指令或子程式'); break; }
      if (ms.some(m => m === 0 || m === 1)) warn(line, '程式暫停指令未計入預覽時間');
      let dwell = false, cancel = false;
      for (const g of gs) {
        if ([0, 1, 2, 3].includes(g)) motion = g;
        else if ([17, 18, 19].includes(g)) plane = g;
        else if (g === 20 || g === 21) scale = g === 20 ? 25.4 : 1;
        else if (g === 90 || g === 91) abs = g === 90;
        else if ([40, 49, 94].includes(g)) { /* 已取消補正，或採每分鐘進給。 */ }
        else if ([41, 42, 43].includes(g)) warn(line, `G${g} 補正未計算，顯示程式名義路徑`);
        else if (g >= 54 && g <= 59 && Number.isInteger(g)) {
          if (workOffset !== null && workOffset !== g) { stop(line, '工件座標系切換的偏移量未知'); break; }
          workOffset = g;
        } else if (g === 80) { motion = null; cancel = true; }
        else if (g === 4) { dwell = true; warn(line, 'G4 暫停未計入預覽時間'); }
        else if (g === 28) { stop(line, 'G28 返回位置取決於機台設定'); break; }
        else { stop(line, `不支援 G${g} 指令`); break; }
      }
      if (stopped) break;
      if (words.F !== undefined) { if (words.F <= 0) { stop(line, '進給率必須大於零'); break; } feed = words.F * scale; }
      if (dwell) continue;
      const axes = ['X', 'Y', 'Z'];
      const hasAxis = axes.some(k => words[k] !== undefined);
      const hasCenter = ['I', 'J', 'K', 'R'].some(k => words[k] !== undefined);
      if (!hasAxis && !hasCenter) { if (ms.includes(2) || ms.includes(30)) break; continue; }
      if (motion === null || cancel) { stop(line, '未設定有效的移動模式'); break; }
      const end = copy(pos);
      for (const key of axes) if (words[key] !== undefined) { const k = key.toLowerCase(); end[k] = (abs ? 0 : pos[k]) + words[key] * scale; }
      if (motion === 0 || motion === 1) {
        if (hasCenter) { stop(line, '直線移動含圓弧參數'); break; }
        add(pos, end, line, motion === 0);
      } else {
        const [, , , centerU, centerV] = planes[plane];
        if (words.P !== undefined || (words.R !== undefined && ['I', 'J', 'K'].some(k => words[k] !== undefined)) || ['I', 'J', 'K'].some(k => k !== centerU && k !== centerV && words[k] !== undefined)) {
          stop(line, '不支援此圓弧參數組合'); break;
        }
        try {
          let prev = pos;
          for (const p of arcPoints(pos, end, words, plane, motion === 2, scale)) { add(prev, p, line, false); prev = p; }
        } catch (error) { stop(line, error.message); break; }
      }
      pos = end;
      if (ms.includes(2) || ms.includes(30)) break;
    }
    return { segments, warnings, lines, stopped };
  }
  return { parse };
}));
