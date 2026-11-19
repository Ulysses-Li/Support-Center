/* 直接模擬畫布事件，驗證文字群組與一般圖形的編輯行為。 */
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

const directory = path.join(__dirname, '..');
const context = { console, addEventListener() {} };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(directory, 'core.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(directory, 'cad-interaction.js'), 'utf8'), context);

function makeWorkspace(initialPaths, canEdit = () => true) {
  let paths = initialPaths.map(p => ({ ...p, points: p.points.map(point => ({ ...point })) }));
  const events = {};
  const paint = new Proxy({}, {
    get(target, key) { return target[key] || (() => {}); },
    set(target, key, value) { target[key] = value; return true; }
  });
  const canvas = {
    clientWidth: 400, clientHeight: 300, width: 400, height: 300, style: {},
    getContext() { return paint; },
    addEventListener(name, callback) { events[name] = callback; },
    getBoundingClientRect() { return { left: 0, top: 0 }; },
    focus() {}, setPointerCapture() {}
  };
  const cad = new context.EngravingCAD(canvas, {
    getPaths: () => paths,
    onChange: value => { paths = value; },
    canEdit
  });
  const pointer = point => {
    const pixel = cad.project(point, cad.transform());
    return { clientX: pixel.x, clientY: pixel.y, pointerType: 'mouse', pointerId: 1, button: 0, preventDefault() {} };
  };
  const drag = (start, end) => {
    events.pointerdown(pointer(start));
    events.pointermove(pointer(end));
    events.pointerup(pointer(end));
  };
  const click = point => {
    const event = pointer(point); events.pointerdown(event); events.pointerup(event);
  };
  return { cad, canvas, drag, click, getPaths: () => paths };
}

function line(y, groupId) {
  return { points: [{ x: 0, y }, { x: 10, y }], closed: false, ...(groupId ? { groupId } : {}) };
}
function firstPoint(path) { return [path.points[0].x, path.points[0].y]; }
function near(actual, expected) { assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} 與 ${expected} 不一致`); }

test('畫布座標逆投影在偏移與尺寸變化後仍對應毫米 XY', () => {
  const work=makeWorkspace([line(0),line(20)]);
  work.canvas.getBoundingClientRect=()=>({left:100,top:60});
  for(const size of [[400,300],[620,250]]) {
    [work.canvas.clientWidth,work.canvas.clientHeight]=size;
    work.cad.resetView();
    const expected={x:7.5,y:-3};
    const projected=work.cad.project(expected,work.cad.transform());
    const actual=work.cad.coordinates({clientX:projected.x+100,clientY:projected.y+60});
    near(actual.x,expected.x);near(actual.y,expected.y);
  }
});

test('選取文字輪廓後，拖曳會同時移動同一文字群組', () => {
  const work = makeWorkspace([line(0, 'text-1'), line(20), line(10, 'text-1')]);
  work.drag({ x: 5, y: 0 }, { x: 8, y: 2 });
  const paths = work.getPaths();
  near(paths[0].points[0].x, 3); near(paths[0].points[0].y, 2);
  near(paths[2].points[0].x, 3); near(paths[2].points[0].y, 12);
  assert.deepEqual(firstPoint(paths[1]), [0, 20]);
  assert.equal(work.cad.getSelection(), 0);
  assert.equal(work.cad.undo(), true);
  assert.deepEqual(firstPoint(work.getPaths()[0]), [0, 0]);
  assert.deepEqual(firstPoint(work.getPaths()[2]), [0, 10]);
  assert.equal(work.getPaths()[2].groupId, 'text-1');
});

test('刪除文字只移除該文字所有輪廓，復原後保留原本順序', () => {
  const work = makeWorkspace([line(0, 'text-1'), line(20), line(10, 'text-1'), line(30, 'text-2')]);
  work.click({ x: 5, y: 10 });
  assert.equal(work.cad.deleteSelected(), true);
  assert.deepEqual(Array.from(work.getPaths(), firstPoint), [[0, 20], [0, 30]]);
  assert.equal(work.cad.undo(), true);
  assert.deepEqual(Array.from(work.getPaths(), firstPoint), [[0, 0], [0, 20], [0, 10], [0, 30]]);
  assert.equal(work.getPaths()[0].groupId, 'text-1');
  assert.equal(work.getPaths()[3].groupId, 'text-2');
});

test('一般圖形的繪製與刪除不影響其他圖形', () => {
  const work = makeWorkspace([line(0, 'text-1'), line(10, 'text-1'), line(20)]);
  work.click({ x: 5, y: 20 });
  assert.equal(work.cad.deleteSelected(), true);
  assert.equal(work.getPaths().length, 2);
  assert.ok(work.getPaths().every(item => item.groupId === 'text-1'));
  work.cad.setTool('line');
  work.drag({ x: 15, y: 0 }, { x: 20, y: 5 });
  assert.equal(work.getPaths().length, 3);
  near(work.getPaths()[2].points[0].x, 15);
  near(work.getPaths()[2].points[1].y, 5);
  assert.equal(work.cad.undo(), true);
  assert.equal(work.getPaths().length, 2);
});

test('資料受封鎖時不能繪圖、移動、刪除或復原', () => {
  let allowed = true;
  const work = makeWorkspace([line(0, 'text-1'), line(10, 'text-1')], () => allowed);
  work.click({ x: 5, y: 0 });
  work.cad.checkpoint();
  allowed = false;
  work.drag({ x: 5, y: 0 }, { x: 8, y: 2 });
  assert.equal(work.cad.deleteSelected(), false);
  assert.equal(work.cad.undo(), false);
  work.cad.setTool('line'); work.drag({ x: 1, y: 1 }, { x: 3, y: 3 });
  assert.deepEqual(Array.from(work.getPaths(), firstPoint), [[0, 0], [0, 10]]);
  allowed = true;
  work.cad.setEnabled(false);
  work.drag({ x: 1, y: 1 }, { x: 3, y: 3 });
  assert.equal(work.getPaths().length, 2);
});
