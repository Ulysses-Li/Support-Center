/* 使用 Canvas 正交投影繪製刀路，避免樣板依賴外部 3D 套件。 */
(function () {
  'use strict';

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const point = p => ({ x: Number(p.x), y: Number(p.y), z: Number(p.z) });

  class GCodeViewer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.segments = [];
      this.progress = 0;
      this.showRapid = true;
      this.yaw = -Math.PI / 4;
      this.pitch = Math.PI / 5;
      this.zoom = 1;
      this.panX = 0;
      this.panY = 0;
      this.center = { x: 0, y: 0, z: 0 };
      this.extent = 10;
      this.pointers = new Map();
      this.gesture = null;
      this.bindControls();
      if (typeof ResizeObserver !== 'undefined') {
        this.observer = new ResizeObserver(() => this.draw());
        this.observer.observe(canvas);
      } else {
        window.addEventListener('resize', () => this.draw());
      }
      this.draw();
    }

    setSegments(segments) {
      this.segments = Array.isArray(segments) ? segments.filter(s => s && s.start && s.end &&
        ['x', 'y', 'z'].every(a => Number.isFinite(Number(s.start[a])) && Number.isFinite(Number(s.end[a])))) : [];
      this.progress = this.segments.length;
      this.fit();
    }

    setProgress(count) {
      this.progress = clamp(Math.floor(Number(count) || 0), 0, this.segments.length);
      this.draw();
    }

    setShowRapid(show) { this.showRapid = !!show; this.draw(); }

    setView(view) {
      const views = {
        top: [0, Math.PI / 2], front: [0, 0], side: [Math.PI / 2, 0],
        iso: [-Math.PI / 4, Math.PI / 5]
      };
      if (!views[view]) return;
      [this.yaw, this.pitch] = views[view];
      this.draw();
    }

    fit() {
      const min = { x: Infinity, y: Infinity, z: Infinity };
      const max = { x: -Infinity, y: -Infinity, z: -Infinity };
      for (const s of this.segments) for (const p of [s.start, s.end]) {
        for (const a of ['x', 'y', 'z']) {
          min[a] = Math.min(min[a], Number(p[a]));
          max[a] = Math.max(max[a], Number(p[a]));
        }
      }
      if (!this.segments.length) {
        this.center = { x: 0, y: 0, z: 0 };
        this.extent = 10;
      } else {
        this.center = { x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 };
        // 球形包圍範圍讓切換視角後仍能看見完整路徑。
        this.extent = Math.max(0.01, Math.hypot(max.x - min.x, max.y - min.y, max.z - min.z) / 2);
      }
      this.zoom = 1; this.panX = 0; this.panY = 0;
      this.draw();
    }

    bindControls() {
      const canvas = this.canvas;
      canvas.style.touchAction = 'none';
      canvas.addEventListener('contextmenu', e => e.preventDefault());
      canvas.addEventListener('wheel', e => {
        e.preventDefault();
        this.zoom = clamp(this.zoom * Math.exp(-e.deltaY * 0.001), 0.1, 50);
        this.draw();
      }, { passive: false });
      const updateGesture = () => {
        const p = [...this.pointers.values()];
        if (p.length >= 2) {
          this.gesture = { mode: 'pinch', x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2,
            distance: Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y) || 1 };
        } else if (p.length === 1) {
          this.gesture = { mode: p[0].pan ? 'pan' : 'orbit', x: p[0].x, y: p[0].y };
        } else this.gesture = null;
      };
      canvas.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 1 && e.button !== 2) return;
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, pan: e.button === 1 || e.button === 2 || e.shiftKey });
        updateGesture();
      });
      canvas.addEventListener('pointermove', e => {
        if (!this.pointers.has(e.pointerId)) return;
        const p = this.pointers.get(e.pointerId);
        p.x = e.clientX; p.y = e.clientY;
        const values = [...this.pointers.values()];
        if (values.length >= 2 && this.gesture?.mode === 'pinch') {
          const x = (values[0].x + values[1].x) / 2, y = (values[0].y + values[1].y) / 2;
          const distance = Math.hypot(values[1].x - values[0].x, values[1].y - values[0].y) || 1;
          this.panX += x - this.gesture.x; this.panY += y - this.gesture.y;
          this.zoom = clamp(this.zoom * distance / this.gesture.distance, 0.1, 50);
          this.gesture = { mode: 'pinch', x, y, distance };
        } else if (values.length === 1 && this.gesture) {
          const dx = p.x - this.gesture.x, dy = p.y - this.gesture.y;
          if (this.gesture.mode === 'pan') { this.panX += dx; this.panY += dy; }
          else { this.yaw += dx * 0.008; this.pitch = clamp(this.pitch + dy * 0.008, -Math.PI / 2, Math.PI / 2); }
          this.gesture.x = p.x; this.gesture.y = p.y;
        }
        this.draw();
      });
      const release = e => { this.pointers.delete(e.pointerId); updateGesture(); };
      canvas.addEventListener('pointerup', release);
      canvas.addEventListener('pointercancel', release);
      canvas.addEventListener('lostpointercapture', release);
    }

    draw() {
      const rect = this.canvas.getBoundingClientRect();
      const width = rect.width, height = rect.height;
      if (!width || !height || !this.ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pxWidth = Math.max(1, Math.round(width * dpr)), pxHeight = Math.max(1, Math.round(height * dpr));
      if (this.canvas.width !== pxWidth || this.canvas.height !== pxHeight) {
        this.canvas.width = pxWidth; this.canvas.height = pxHeight;
      }
      const ctx = this.ctx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const scale = Math.min(width, height) * 0.37 / this.extent * this.zoom;
      const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), sp = Math.sin(this.pitch), cp = Math.cos(this.pitch);
      const project = p => {
        const x = Number(p.x) - this.center.x, y = Number(p.y) - this.center.y, z = Number(p.z) - this.center.z;
        return [width / 2 + this.panX + (x * cy + y * sy) * scale,
          height / 2 + this.panY - (-x * sy * sp + y * cy * sp + z * cp) * scale];
      };
      const line = (a, b) => { const p = project(a), q = project(b); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };

      // 格線依刀路尺寸自動選取刻度；限縮線數，避免放大資料時拖慢畫面。
      const gridSize = Math.max(1, this.extent * 2);
      const step = Math.pow(10, Math.floor(Math.log10(gridSize / 5)));
      const half = Math.ceil(gridSize / step / 2) * step;
      const gx = Math.round(this.center.x / step) * step, gy = Math.round(this.center.y / step) * step;
      ctx.beginPath(); ctx.strokeStyle = '#dcebf4'; ctx.lineWidth = 1; ctx.setLineDash([]);
      for (let n = -Math.min(20, Math.ceil(half / step)); n <= Math.min(20, Math.ceil(half / step)); n++) {
        line({ x: gx + n * step, y: gy - half, z: 0 }, { x: gx + n * step, y: gy + half, z: 0 });
        line({ x: gx - half, y: gy + n * step, z: 0 }, { x: gx + half, y: gy + n * step, z: 0 });
      }
      ctx.stroke();

      // 顏色分組批次畫線，已播放與未播放路徑使用不同透明度。
      for (const completed of [false, true]) for (const rapid of [true, false]) {
        if (rapid && !this.showRapid) continue;
        ctx.beginPath(); ctx.setLineDash(rapid ? [5, 4] : []);
        ctx.lineWidth = completed ? 2 : 1.2;
        ctx.strokeStyle = rapid ? (completed ? '#f05a1a' : 'rgba(240,90,26,.22)') : (completed ? '#0067ad' : 'rgba(0,103,173,.20)');
        for (let i = 0; i < this.segments.length; i++) {
          const s = this.segments[i], isRapid = s.rapid === true || s.kind === 'rapid' || s.type === 'rapid';
          if ((i < this.progress) !== completed || isRapid !== rapid) continue;
          line(s.start, s.end);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      const origin = { x: 0, y: 0, z: 0 }, axisLength = Math.max(this.extent * 0.32, 0.1);
      for (const [a, color] of [['x', '#e65532'], ['y', '#389869'], ['z', '#2874c0']]) {
        const end = { x: 0, y: 0, z: 0 }; end[a] = axisLength;
        ctx.beginPath(); ctx.strokeStyle = color; ctx.lineWidth = 1.5; line(origin, end); ctx.stroke();
        const p = project(end); ctx.fillStyle = color; ctx.font = 'bold 13px sans-serif'; ctx.fillText(a.toUpperCase(), p[0] + 4, p[1] - 4);
      }
      if (this.segments.length) {
        const current = point(this.progress ? this.segments[this.progress - 1].end : this.segments[0].start);
        const p = project(current);
        ctx.beginPath(); ctx.arc(p[0], p[1], 5, 0, Math.PI * 2); ctx.fillStyle = '#f05a1a'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
      }
    }
  }
  window.GCodeViewer = GCodeViewer;
}());
