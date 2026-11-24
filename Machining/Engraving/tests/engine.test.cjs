const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../engraving-engine.js');

const family = (result, id) => result.families.find(item => item.id === id);
const ids = matches => matches.map(item => item.id);

test('沒有尺寸時可探索全部系列；空白不能被當成 0 mm', () => {
  const result = engine.match({ width: ' ', depth: '', angle: '', material: '' });
  assert.equal(result.state, 'idle');
  assert.equal(result.input.width, null);
  assert.equal(result.input.depth, null);
  assert.equal(result.families.length, 5);
  assert.ok(result.families.every(item => item.status === 'idle'));
  assert.ok(family(result, 'N9MT-W').summary.shankLabels.includes('Ø10 mm'));
});

test('負值、0、非有限數與非型錄角度不產生推薦', () => {
  for (const width of [-0.1, 0, Infinity, 'abc', true]) {
    const result = engine.match({ width });
    assert.equal(result.state, 'invalid');
    assert.equal(result.matchCount, 0);
    assert.ok(result.errors.width);
  }
  assert.equal(engine.match({ width: 0.2, angle: 120 }).state, 'invalid');
  assert.equal(engine.match({ width: 0.2, material: 'unknown' }).state, 'invalid');
});

test('W060 的寬深必須屬於同一片刀片，不能使用系列總包絡拼湊', () => {
  const edge = family(engine.match({ width: 0.1, depth: 0.2, material: 'carbon_steel', angle: 60 }), 'W060');
  assert.equal(edge.status, 'match');
  assert.deepEqual(ids(edge.matches), ['W06004S101|NC2032']);
  const tooDeep = family(engine.match({ width: 0.1, depth: 0.201, material: 'carbon_steel', angle: 60 }), 'W060');
  assert.equal(tooDeep.status, 'no-match');
  assert.equal(tooDeep.matches.length, 0);
  const belowMinimum = family(engine.match({ width: 0.099, angle: 60 }), 'W060');
  assert.equal(belowMinimum.status, 'no-match');
});

test('改變角度會篩掉不相容的實體尺寸，不能只看系列最大寬度', () => {
  const narrowAngle = family(engine.match({ width: 1.3, angle: 30, material: 'carbon_steel' }), 'X060');
  assert.equal(narrowAngle.status, 'no-match');
  const wideAngle = family(engine.match({ width: 1.3, angle: 60, material: 'carbon_steel' }), 'X060');
  assert.ok(ids(wideAngle.matches).includes('X060A60W020R|NC2032'));
  assert.ok(wideAngle.matches.every(item => item.angle === 60));
});

test('材料改變時，W03 的實體牌號一起改變，不借用 W06 的牌號', () => {
  const input = { width: 0.3, depth: 0.1, angle: 60 };
  const carbon = family(engine.match({ ...input, material: 'carbon_steel' }), 'V060');
  assert.deepEqual(ids(carbon.matches), ['V06006T1W03|NC2032']);
  const stainless = family(engine.match({ ...input, material: 'stainless_steel' }), 'V060');
  assert.deepEqual(ids(stainless.matches), ['V06006T1W03|NC9036']);
  const titanium = family(engine.match({ ...input, material: 'titanium' }), 'V060');
  assert.deepEqual(ids(titanium.matches), ['V06006T1W03|NC9036']);
  assert.ok(titanium.matches.every(item => item.cuttingSourcePages.includes(83)));
});

test('V045 小線寬只可使用有對應材種表的 NC9031，不能配到碳鋼', () => {
  const input = { width: 0.5, depth: 0.1, angle: 45 };
  const carbon = family(engine.match({ ...input, material: 'carbon_steel' }), 'V045');
  assert.equal(carbon.status, 'no-match');
  const nonFerrous = family(engine.match({ ...input, material: 'non_ferrous' }), 'V045');
  assert.deepEqual(ids(nonFerrous.matches), ['V04506T1W06|NC9031']);
});

test('硬鋼共表不能產生不存在的 V045 NC2035 實體訂購料號', () => {
  const result = engine.match({ width: 1, depth: 1, material: 'hardened_steel' });
  assert.equal(family(result, 'V045').status, 'no-match');
  assert.deepEqual(ids(family(result, 'V060').matches), ['V06006T1W06|NC2035']);
  assert.deepEqual(result.requiredNext, ['hardness']);
});

test('N9MT 90°的 0.8 / 0.9 mm 差異保留待核對，不當作切削表已涵蓋', () => {
  const input = { width: 1.5, angle: 90, material: 'alloy_steel' };
  assert.equal(family(engine.match({ ...input, depth: 0.8 }), 'N9MT-W').status, 'match');
  const gap = family(engine.match({ ...input, depth: 0.85 }), 'N9MT-W');
  assert.equal(gap.status, 'review');
  assert.equal(gap.matches.length, 0);
  assert.deepEqual(ids(gap.reviewMatches), ['N9MT080201W|NC40']);
  assert.equal(family(engine.match({ ...input, depth: 0.91 }), 'N9MT-W').status, 'no-match');
  assert.equal(family(engine.match({ ...input, material: 'stainless_steel', depth: 0.8 }), 'N9MT-W').status, 'no-match');
});

test('Radius Form 未列最小寬，低於已知平底下限時只保留待核對候選', () => {
  const x060 = family(engine.match({ width: 0.05, angle: 30, material: 'carbon_steel' }), 'X060');
  assert.equal(x060.status, 'review');
  assert.equal(x060.matches.length, 0);
  assert.deepEqual(ids(x060.reviewMatches), ['X060A30R020|NC2032']);
  assert.equal(x060.reviewMatches[0].limits.Wmin, null);
  assert.equal(x060.reviewMatches[0].limits.Tmin, null);
  assert.equal(x060.matchedSummary.widthRange.min, null);
});

test('寬與深同時填寫仍是獨立尺寸初篩，明示實際槽形要再核對', () => {
  const result = engine.match({ width: 0.2, depth: 0.6, angle: 30, material: 'carbon_steel' });
  assert.equal(family(result, 'X060').status, 'match');
  assert.match(result.geometryCaution, /分別比對/);
  assert.match(result.geometryCaution, /實際槽形/);
  const widthOnly = engine.match({ width: 0.2, angle: 30, material: 'carbon_steel' });
  assert.equal(widthOnly.geometryCaution, '');
});

test('每次篩選不改寫原始規格與 null，重複輸入結果一致', () => {
  const original = JSON.stringify(engine.data);
  const first = engine.match({ width: 0.5, depth: 0.2, material: 'stainless_steel', angle: 60 });
  engine.match({ width: 2.5, depth: 2, material: 'hardened_steel' });
  const second = engine.match({ width: 0.5, depth: 0.2, material: 'stainless_steel', angle: 60 });
  assert.deepEqual(first, second);
  assert.equal(JSON.stringify(engine.data), original);
  assert.ok(engine.data.inserts.every(item => typeof item.orderCode === 'string'));
});
