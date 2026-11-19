/* 雕刻樣板的工件視圖：只將名義圖線投影在毛坯上，不模擬切屑或材料移除。 */
(function () {
  'use strict';
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const valid = n => typeof n === 'number' && Number.isFinite(n);

  class EngravingStockViewer extends window.GCodeViewer {
    constructor(canvas) {
      // 父類建構時會呼叫 draw；覆寫方法須能接受尚未設定的 stock/outline。
      super(canvas);
      this.stock = null;
      this.outline = [];
    }

    setStock(stock) {
      const fields = ['minX', 'maxX', 'minY', 'maxY', 'thickness'];
      if (stock && fields.every(k => valid(stock[k])) && stock.maxX > stock.minX && stock.maxY > stock.minY && stock.thickness > 0) {
        this.stock = Object.fromEntries(fields.map(k => [k, stock[k]]));
      } else {
        this.stock = null;
      }
      this.fit();
    }

    setOutline(paths) {
      // 只保存有效的 XY 座標；圖形與播放中的切削段分開管理。
      this.outline = Array.isArray(paths) ? paths.filter(path => path && Array.isArray(path.points) && path.points.length > 1 &&
        path.points.every(p => p && valid(p.x) && valid(p.y))) : [];
      this.draw();
    }

    fit() {
      const min = { x: Infinity, y: Infinity, z: Infinity }, max = { x: -Infinity, y: -Infinity, z: -Infinity };
      const include = p => { for (const a of ['x','y','z']) { min[a] = Math.min(min[a], Number(p[a])); max[a] = Math.max(max[a], Number(p[a])); } };
      for (const segment of this.segments || []) { include(segment.start); include(segment.end); }
      if (this.stock) {
        include({ x: this.stock.minX, y: this.stock.minY, z: -this.stock.thickness });
        include({ x: this.stock.maxX, y: this.stock.maxY, z: 0 });
      }
      if (min.x === Infinity) {
        this.center = { x: 0, y: 0, z: 0 }; this.extent = 10;
      } else {
        this.center = { x: (min.x + max.x) / 2, y: (min.y + max.y) / 2, z: (min.z + max.z) / 2 };
        this.extent = Math.max(0.01, Math.hypot(max.x - min.x, max.y - min.y, max.z - min.z) / 2);
      }
      this.zoom = 1; this.panX = 0; this.panY = 0; this.draw();
    }

    draw() {
      const rect = this.canvas.getBoundingClientRect();
      const width = rect.width, height = rect.height;
      if (!width || !height || !this.ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.max(1, Math.round(width * dpr)), pixelHeight = Math.max(1, Math.round(height * dpr));
      if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) { this.canvas.width = pixelWidth; this.canvas.height = pixelHeight; }
      const ctx = this.ctx;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
      const scale = Math.min(width, height) * 0.37 / this.extent * this.zoom;
      const cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), sp = Math.sin(this.pitch), cp = Math.cos(this.pitch);
      const project = p => {
        const x = Number(p.x) - this.center.x, y = Number(p.y) - this.center.y, z = Number(p.z) - this.center.z;
        return [width / 2 + this.panX + (x * cy + y * sy) * scale,
          height / 2 + this.panY - (-x * sy * sp + y * cy * sp + z * cp) * scale];
      };
      const line = (a, b) => { const p = project(a), q = project(b); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
      const polygon = (points, color) => {
        ctx.beginPath(); const first = project(points[0]); ctx.moveTo(first[0], first[1]);
        for (let i=1; i<points.length; i++) { const p = project(points[i]); ctx.lineTo(p[0],p[1]); }
        ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = 'rgba(28,87,121,.32)'; ctx.lineWidth = 1; ctx.stroke();
      };

      // 底部網格只輔助辨識空間位置；頂面及側面以簡單投影呈現長方體。
      const gridSize = Math.max(1, this.extent * 2);
      const step = Math.pow(10, Math.floor(Math.log10(gridSize / 5)));
      const half = Math.ceil(gridSize / step / 2) * step;
      const gx = Math.round(this.center.x / step) * step, gy = Math.round(this.center.y / step) * step;
      const gridZ = this.stock ? -this.stock.thickness : 0;
      ctx.beginPath(); ctx.strokeStyle = '#dcebf4'; ctx.lineWidth = 1; ctx.setLineDash([]);
      for (let n = -Math.min(20, Math.ceil(half / step)); n <= Math.min(20, Math.ceil(half / step)); n++) {
        line({ x: gx+n*step, y: gy-half, z:gridZ }, { x:gx+n*step, y:gy+half, z:gridZ });
        line({ x:gx-half, y:gy+n*step, z:gridZ }, { x:gx+half, y:gy+n*step, z:gridZ });
      }
      ctx.stroke();

      if (this.stock) {
        const s = this.stock, x0=s.minX, x1=s.maxX, y0=s.minY, y1=s.maxY, bottom=-s.thickness;
        const p = (x,y,z) => ({x,y,z});
        const faces = [
          { pts:[p(x0,y0,bottom),p(x1,y0,bottom),p(x1,y1,bottom),p(x0,y1,bottom)], color:'#8eabbc' },
          { pts:[p(x0,y0,bottom),p(x1,y0,bottom),p(x1,y0,0),p(x0,y0,0)], color:'#9bb7c6' },
          { pts:[p(x1,y0,bottom),p(x1,y1,bottom),p(x1,y1,0),p(x1,y0,0)], color:'#87a7ba' },
          { pts:[p(x1,y1,bottom),p(x0,y1,bottom),p(x0,y1,0),p(x1,y1,0)], color:'#9bb7c6' },
          { pts:[p(x0,y1,bottom),p(x0,y0,bottom),p(x0,y0,0),p(x0,y1,0)], color:'#87a7ba' },
          { pts:[p(x0,y0,0),p(x1,y0,0),p(x1,y1,0),p(x0,y1,0)], color:'#dcecf4' }
        ];
        // 依照視線方向排序六面，使旋轉至任一方向時靠近觀察者的面覆蓋遠面。
        const depth = face => face.pts.reduce((v,q) => v + q.x*sy*cp-q.y*cy*cp+q.z*sp, 0) / face.pts.length;
        faces.sort((a,b) => depth(a)-depth(b));
        for (const face of faces) polygon(face.pts,face.color);
      }

      // 原始圖形投影於 Z0 頂面，和真正的 G-code 路段分開繪製。
      if (this.stock && this.pitch >= 0) {
        ctx.strokeStyle = 'rgba(0,103,173,.45)'; ctx.lineWidth = 1.4; ctx.setLineDash([]);
        for (const path of this.outline || []) {
          ctx.beginPath();
          const first = project({ x:path.points[0].x, y:path.points[0].y, z:0 }); ctx.moveTo(first[0],first[1]);
          for (let i=1;i<path.points.length;i++) { const pt=project({x:path.points[i].x,y:path.points[i].y,z:0});ctx.lineTo(pt[0],pt[1]); }
          if(path.closed)ctx.closePath(); ctx.stroke();
        }
      }
      for (const completed of [false,true]) for (const rapid of [true,false]) {
        if (rapid && !this.showRapid) continue;
        ctx.beginPath(); ctx.setLineDash(rapid ? [5,4] : []); ctx.lineWidth = completed ? 2 : 1.2;
        ctx.strokeStyle = rapid ? (completed ? '#f05a1a' : 'rgba(240,90,26,.22)') : (completed ? '#0067ad' : 'rgba(0,103,173,.20)');
        for (let i=0;i<(this.segments || []).length;i++) {
          const s=this.segments[i], isRapid=s.rapid===true || s.kind==='rapid' || s.type==='rapid';
          if ((i < this.progress) !== completed || isRapid !== rapid) continue;
          line(s.start,s.end);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);
      if ((this.segments || []).length) {
        const current = this.progress ? this.segments[this.progress-1].end : this.segments[0].start;
        const p=project(current); ctx.beginPath(); ctx.arc(p[0],p[1],5,0,Math.PI*2);ctx.fillStyle='#f05a1a';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#fff';ctx.stroke();
      }
    }
  }
  window.EngravingStockViewer = EngravingStockViewer;
}());
