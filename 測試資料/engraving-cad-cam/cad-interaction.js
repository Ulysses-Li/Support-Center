/* 2D 草圖互動：顯示與刀路沿用相同的毫米座標，畫面縮放不改變圖形尺寸。 */
(function (root) {
  'use strict';
  const copyPaths = paths => paths.map(path => ({ ...path, points: path.points.map(point => ({ x: point.x, y: point.y })) }));
  const segmentDistance = (p, a, b) => {
    const dx=b.x-a.x, dy=b.y-a.y, len=dx*dx+dy*dy;
    const t=len ? Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/len)) : 0;
    return Math.hypot(p.x-(a.x+t*dx),p.y-(a.y+t*dy));
  };
  class EngravingCAD {
    constructor(canvas, options) {
      this.canvas=canvas; this.ctx=canvas.getContext('2d'); this.options=options;
      this.tool='select'; this.selected=-1; this.enabled=true; this.view=null;
      this.drag=null; this.history=[];
      canvas.style.touchAction='none';
      canvas.addEventListener('pointerdown',event=>this.down(event));
      canvas.addEventListener('pointermove',event=>this.move(event));
      canvas.addEventListener('pointerup',event=>this.up(event));
      canvas.addEventListener('pointercancel',()=>{this.drag=null;this.render();});
      canvas.addEventListener('keydown',event=>{
        if (event.key==='Escape') {this.drag=null;this.clearSelection();}
        if (event.key==='Delete' || event.key==='Backspace') {event.preventDefault();this.deleteSelected();}
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase()==='z') {event.preventDefault();this.undo();}
      });
      if (typeof ResizeObserver !== 'undefined') {this.observer=new ResizeObserver(()=>this.render());this.observer.observe(canvas);}
      else window.addEventListener('resize',()=>this.render());
      this.render();
    }
    paths() { return this.options.getPaths() || []; }
    canEdit() { return this.enabled && (!this.options.canEdit || this.options.canEdit()); }
    setEnabled(enabled) {this.enabled=!!enabled;if(!this.enabled){this.drag=null;this.clearSelection();}this.render();}
    setTool(tool) {
      if (!['select','line','rectangle','circle'].includes(tool)) return;
      this.tool=tool;this.drag=null;
      if (tool!=='select') this.clearSelection();
      this.canvas.style.cursor=tool==='select'?'default':'crosshair';this.render();
    }
    getSelection() {return this.selected;}
    // 字形的多個外框共用 groupId，選取、移動與刪除時維持同一段文字。
    selectedIndices(index = this.selected) {
      const paths=this.paths(), selected=paths[index];
      if (!selected) return [];
      if (!selected.groupId) return [index];
      return paths.map((path,i)=>path.groupId===selected.groupId ? i : -1).filter(i=>i>=0);
    }
    select(index) {
      this.selected=index;
      if(this.options.onSelectionChange)this.options.onSelectionChange(index);
      this.render();
    }
    clearSelection() {this.select(-1);}
    checkpoint() {
      this.history.push(copyPaths(this.paths()));
      if(this.history.length>50)this.history.shift();
    }
    resetHistory() {this.history=[];this.drag=null;this.clearSelection();}
    undo() {
      if(!this.canEdit() || !this.history.length)return false;
      const paths=this.history.pop();this.drag=null;this.selected=-1;
      this.options.onChange(paths);if(this.options.onSelectionChange)this.options.onSelectionChange(-1);
      this.render();return true;
    }
    deleteSelected() {
      if(!this.canEdit() || this.selected<0 || this.selected>=this.paths().length)return false;
      this.checkpoint(); const selected=new Set(this.selectedIndices());const paths=this.paths().filter((_,index)=>!selected.has(index));
      this.selected=-1;this.options.onChange(paths);if(this.options.onSelectionChange)this.options.onSelectionChange(-1);
      this.render();return true;
    }
    resetView() {this.view=null;this.render();}
    resize() {this.render();}
    // 維持可逆的投影，使滑鼠座標與畫布上顯示的毫米位置一致。
    transform() {
      const width=this.canvas.clientWidth,height=this.canvas.clientHeight;
      if(!this.view) {
        const paths=this.paths();let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
        for(const path of paths)for(const p of path.points){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
        if(minX===Infinity){minX=0;minY=0;maxX=60;maxY=40;}
        const spanX=Math.max(maxX-minX,20),spanY=Math.max(maxY-minY,20);
        this.view={cx:(minX+maxX)/2,cy:(minY+maxY)/2,spanX,spanY};
      }
      const scale=Math.max(.000001,Math.min(Math.max(1,width-72)/this.view.spanX,Math.max(1,height-72)/this.view.spanY));
      return {width,height,scale,cx:this.view.cx,cy:this.view.cy};
    }
    project(p,t) {return {x:t.width/2+(p.x-t.cx)*t.scale,y:t.height/2-(p.y-t.cy)*t.scale};}
    coordinates(event) {
      const r=this.canvas.getBoundingClientRect(),t=this.transform();
      return {x:(event.clientX-r.left-t.width/2)/t.scale+t.cx,y:(t.height/2-(event.clientY-r.top))/t.scale+t.cy};
    }
    hit(point) {
      const threshold=10/this.transform().scale,paths=this.paths();let best=-1,dist=threshold;
      paths.forEach((path,index)=>{
        if(!path.points || path.points.length<2)return;
        const n=path.points.length+(path.closed?1:0);
        for(let i=1;i<n;i++){
          const d=segmentDistance(point,path.points[i-1],path.points[i%path.points.length]);
          if(d<dist){dist=d;best=index;}
        }
      });return best;
    }
    down(event) {
      if(!this.canEdit() || (event.pointerType==='mouse' && event.button!==0))return;
      event.preventDefault();this.canvas.focus();this.canvas.setPointerCapture(event.pointerId);
      const p=this.coordinates(event);
      if(this.tool==='select') {
        const selected=this.hit(p);this.select(selected);
        if(selected>=0)this.drag={kind:'move',start:p,current:p,index:selected};
      } else this.drag={kind:'draw',start:p,current:p,tool:this.tool};
      this.render();
    }
    move(event) {
      if(!this.drag || !this.canEdit())return;
      event.preventDefault();this.drag.current=this.coordinates(event);this.render();
    }
    makePath(drag) {
      const a=drag.start,b=drag.current,core=root.GCodeEngrave;
      if(drag.tool==='line')return core.line(a.x,a.y,b.x,b.y);
      if(drag.tool==='rectangle')return core.rectangle(Math.min(a.x,b.x),Math.min(a.y,b.y),Math.abs(b.x-a.x),Math.abs(b.y-a.y));
      return core.circle(a.x,a.y,Math.hypot(b.x-a.x,b.y-a.y));
    }
    up(event) {
      if(!this.drag)return;
      const drag=this.drag;drag.current=this.coordinates(event);this.drag=null;
      if(!this.canEdit()){this.render();return;}
      // 低於兩個畫素視為點擊，避免誤建極小的刀路。
      if(Math.hypot(drag.current.x-drag.start.x,drag.current.y-drag.start.y)*this.transform().scale<2){this.render();return;}
      try {
        const paths=this.paths().slice();this.checkpoint();
        if(drag.kind==='move') {
          const dx=drag.current.x-drag.start.x,dy=drag.current.y-drag.start.y;
          for(const index of this.selectedIndices(drag.index)) {
            const path=paths[index];paths[index]={...path,points:path.points.map(p=>({x:p.x+dx,y:p.y+dy}))};
          }
        } else {
          const path=this.makePath(drag);paths.push(path);this.selected=-1;
        }
        this.options.onChange(paths);
        if(this.options.onSelectionChange)this.options.onSelectionChange(this.selected);
      } catch(error) {this.history.pop();if(this.options.onError)this.options.onError(error.message);}
      this.render();
    }
    render() {
      const t=this.transform();if(!t.width||!t.height||!this.ctx)return;
      const dpr=Math.min(window.devicePixelRatio||1,2),w=Math.round(t.width*dpr),h=Math.round(t.height*dpr);
      if(this.canvas.width!==w || this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
      const ctx=this.ctx;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,t.width,t.height);
      ctx.fillStyle='#f4f9fd';ctx.fillRect(0,0,t.width,t.height);
      ctx.beginPath();ctx.strokeStyle='#dcecf5';ctx.lineWidth=1;ctx.setLineDash([]);
      for(let x=0;x<t.width;x+=24){ctx.moveTo(x,0);ctx.lineTo(x,t.height);}
      for(let y=0;y<t.height;y+=24){ctx.moveTo(0,y);ctx.lineTo(t.width,y);}ctx.stroke();
      const draw=(path,colour,dash,offsetX=0,offsetY=0)=>{
        if(!path.points.length)return;
        ctx.strokeStyle=colour;ctx.lineWidth=2.2;ctx.lineJoin='round';ctx.lineCap='round';ctx.setLineDash(dash);
        ctx.beginPath();let p=this.project({x:path.points[0].x+offsetX,y:path.points[0].y+offsetY},t);ctx.moveTo(p.x,p.y);
        for(const point of path.points.slice(1)){p=this.project({x:point.x+offsetX,y:point.y+offsetY},t);ctx.lineTo(p.x,p.y);}
        if(path.closed)ctx.closePath();ctx.stroke();
      };
      const selected=new Set(this.selectedIndices());
      this.paths().forEach((path,i)=>{
        const move=this.drag?.kind==='move' && selected.has(i) ? this.drag : null;
        draw(path,selected.has(i)?'#f05a1a':'#0067ad',[],move?move.current.x-move.start.x:0,move?move.current.y-move.start.y:0);
      });
      if(this.drag?.kind==='draw') {
        try {draw(this.makePath(this.drag),'#f05a1a',[6,4]);} catch (_) { /* 移動距離尚不足時不繪製草稿。 */ }
      }
      ctx.setLineDash([]);
      const origin=this.project({x:0,y:0},t);
      if(origin.x>=0 && origin.x<=t.width && origin.y>=0 && origin.y<=t.height) {
        ctx.fillStyle='#f05a1a';ctx.beginPath();ctx.arc(origin.x,origin.y,4,0,Math.PI*2);ctx.fill();ctx.font='12px sans-serif';ctx.fillText('0, 0',origin.x+7,origin.y-7);
      }
    }
  }
  root.EngravingCAD=EngravingCAD;
}(typeof window !== 'undefined' ? window : globalThis));
