/* 從既有產生器的輸出反查動畫關鍵座標，避免動畫與 NC 各自通過、實際卻不一致。 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../../..');
const context = vm.createContext({ window: {}, console });
for (const relative of [
  'NCProgram/Thread_Milling/src/data/materials.js', 'NCProgram/Thread_Milling/src/data/tools.js', 'NCProgram/Thread_Milling/src/data/threads.js',
  'NCProgram/Thread_Milling/src/services/thread-filter.js', 'NCProgram/Thread_Milling/src/services/depth.js',
  'NCProgram/Thread_Milling/src/services/cutting-params.js', 'NCProgram/Thread_Milling/src/services/gcode-generator.js',
  '測試資料/thread-milling-simulator/motion.js'
]) vm.runInContext(fs.readFileSync(path.join(root, relative), 'utf8'), context, { filename: relative });
const NC = context.window.NCProgram, Core = context.window.ThreadMotion;
const near = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const base = { mode: 'parallel', threadSize: 'M 7 x 1.0', toolDiameter: 5, od: 7, tapDrill: 6, pitch: 1, depth: 14, feed: 229.2, toolNo: 99, safeRelative: 20, passPercents: [100], coordinate: { x: 0, y: 0, zSafe: 20, zSurface: 0, workOffset: 'G54' } };

test('all selectable standards, sizes and inserts resolve to the original data', () => {
  let pairings = 0;
  for (const standard of Core.standards) {
    const sizes = Core.getSizes(standard.id);
    assert.ok(sizes.length > 0, standard.id);
    for (const size of sizes) {
      assert.ok(NC.threadData[size]);
      for (const insert of Core.getInserts(standard.id, size)) {
        assert.ok(NC.toolThreadMap[insert.v].includes(size));
        assert.ok(Core.getSizes(standard.id, insert.v).includes(size));
        assert.ok(NC.getDcFromTool(insert.v) > 0);
        pairings++;
      }
    }
  }
  assert.ok(pairings > 200);
});

test('parallel default follows 14 G03 revolutions from Z-14 to Z0 and returns to safety', () => {
  const motion = Core.build(base), cut = motion.points.filter(p => p.phase === 'cut');
  assert.equal(motion.turns, 14);
  near(cut[0].z, -14 + 1 / 72);
  near(cut[cut.length - 1].z, 0);
  for (const point of cut) near(Math.hypot(point.x, point.y), 1);
  assert.ok(cut[0].y > 0);
  const nc = NC.generateGCode(base);
  assert.equal(nc.split('\n').filter(line => /^G03 I/.test(line)).length, motion.turns);
  assert.match(nc, /G03 I-1\.000 Z0\.000/);
  const last = Core.sample(motion, motion.duration);
  near(last.x, 0); near(last.y, 0); near(last.z, 20);
});

test('partial depth retains original whole-turn endpoint instead of silently changing pitch', () => {
  const input = { ...base, depth: 14.3 };
  const motion = Core.build(input), last = motion.points.filter(p => p.phase === 'cut').at(-1);
  assert.equal(motion.turns, 15);
  near(last.z, .7);
  assert.match(NC.generateGCode(input), /G03 I-1\.000 Z0\.700/);
});

test('tapered animated cutting coordinates match every original emitted G02 vertex', () => {
  const input = { ...base, mode: 'tapered', threadSize: 'NPT 1/4', toolDiameter: 9.8, od: 13.716, tapDrill: 11.113, pitch: 1.411, depth: 12 };
  const motion = Core.build(input), cut = motion.points.filter(p => p.phase === 'cut');
  const commands = NC.generateGCode(input).split('\n').filter(line => /^G02 X.* Y.* Z.* R/.test(line));
  assert.equal(cut.length, commands.length);
  commands.forEach((line, i) => {
    const coordinates = Object.fromEntries([...line.matchAll(/([XYZ])(-?[\d.]+)/g)].map(m => [m[1], Number(m[2])]));
    near(cut[i].x, coordinates.X, .00051); near(cut[i].y, coordinates.Y, .00051); near(cut[i].z, coordinates.Z, .00051);
  });
  assert.ok(cut[0].y < 0);
  assert.ok(cut.at(-1).z <= -12);
  assert.ok(Math.hypot(cut[0].x, cut[0].y) > Math.hypot(cut.at(-1).x, cut.at(-1).y));
});

test('each radial pass uses its own radius and returns to safety before the next', () => {
  const motion = Core.build({ ...base, passPercents: [50, 80, 100] });
  for (const [pass, radius] of [[1, .75], [2, .9], [3, 1]]) {
    const points = motion.points.filter(p => p.pass === pass);
    near(Math.hypot(...[points.find(p => p.phase === 'cut').x, points.find(p => p.phase === 'cut').y]), radius);
    near(points.at(-1).z, 20);
  }
});

test('time sampling is bounded, continuous and independent of frame rate', () => {
  const motion = Core.build(base);
  near(Core.sample(motion, -5).z, 20);
  near(Core.sample(motion, motion.duration + 5).z, 20);
  const a = Core.sample(motion, 4), b = Core.sample(motion, 4.000001);
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < .001);
  assert.deepEqual(Core.sample(motion, 4), Core.sample(motion, 4));
});

test('invalid depths, unsafe planes and collapsed tapered radii are rejected', () => {
  for (const overrides of [{ depth: 0 }, { depth: NaN }, { depth: 201 }, { safeRelative: 0 }, { toolDiameter: 7 }, { feed: 0 }, { passPercents: [0] }]) assert.throws(() => Core.build({ ...base, ...overrides }));
  assert.throws(() => Core.build({ ...base, mode: 'tapered', depth: 1 }));
  assert.throws(() => Core.build({ ...base, mode: 'tapered', depth: 100 }));
  assert.throws(() => Core.build({ ...base, safeRelative: 20, coordinate: { ...base.coordinate, zSafe: 0, zSurface: -20 } }), /非 0/);
});
