const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createHash } = require('node:crypto');
const data = require('../data.js');

// 以型錄頁面的代表數據作獨立 fixture，避免只確認資料結構或重複實作公式。
test('page 30: P60 uses the two listed holders and its own 60-degree specification', () => {
  const p60 = data.series.find(item => item.id === 'p60');
  assert.equal(p60.familyLabel, 'N9MT11T3P60');
  assert.equal(p60.angle, 60);
  assert.deepEqual(p60.operations, ['spotting']);
  assert.deepEqual([p60.sourcePage, p60.pdfPage, p60.maxDiameter, p60.maxDepth], [30, 3, 5, 3]);
  assert.deepEqual(p60.holders.map(item => [item.part, item.shankDiameter, item.length]), [
    ['00-99616-14-12', 12, 100], ['00-99616-14', 16, 100]
  ]);
  assert.equal(p60.inserts.length, 1);
  const insert = p60.inserts[0];
  assert.deepEqual([insert.part, insert.code, insert.grade, insert.coating, insert.carbideGrade], ['N9MT11T3P60-NC40', '014204', 'NC40', 'TiN', 'P35']);
  assert.deepEqual([insert.length, insert.thickness, insert.cornerRadius, insert.indexableEdges], [11, 3.97, .8, 2]);
});

test('P60 does not inherit CT cutting presets, material ratings or hardness/depth assumptions', () => {
  const p60 = data.series.find(item => item.id === 'p60');
  assert.equal(p60.feedTable, null);
  assert.equal(p60.cuttingPresetAvailable, false);
  assert.equal(p60.manualInput, true);
  assert.equal(p60.cuttingSourcePage, null);
  assert.equal(p60.cuttingPdfPage, null);
  assert.equal(p60.maxHardness, null);
  assert.deepEqual(p60.recommendedByMaterial, {});
  const insert = p60.inserts[0];
  assert.deepEqual(insert.materialIds, ['carbonLow', 'carbonHigh', 'lowAlloy', 'highAlloy', 'castIron']);
  assert.deepEqual(insert.materialRatings, {});
  assert.equal(insert.materialMaxHardness, null);
  assert.equal(insert.minSpotDepth, null);
  assert.equal(insert.tipCorrection, null);
});

test('page 33: NC06 and NC08 holder/insert pairs retain their distinct limits', () => {
  const nc06 = data.series.find(item => item.id === 'nc06');
  const nc08 = data.series.find(item => item.id === 'nc08');
  assert.equal(nc06.angle, 90);
  assert.equal(nc06.holders[0].part, '00-99616-06-6');
  assert.equal(nc06.holders[2].shank, 'Carbide');
  assert.equal(nc06.inserts[0].part, 'N9MT05T1CT-NC2071');
  assert.equal(nc06.maxDiameter, 5.5);
  assert.equal(nc06.maxDepth, 2.4);
  assert.equal(nc08.holders[0].part, '00-99616-08-8');
  assert.equal(nc08.inserts[0].part, 'N9MT0602CT-NC2071');
  assert.equal(nc08.maxDiameter, 8);
  assert.equal(nc08.maxDepth, 3.7);
});

test('pages 34 and 36: per-insert limits and holder-set angles are preserved', () => {
  const nc10 = data.series.find(item => item.id === 'nc10');
  assert.equal(nc10.inserts.find(item => item.part === 'N9MT080208CT-NC40').maxDepth, 4.5);
  assert.equal(nc10.inserts.find(item => item.part === 'N9MT080204CT-NC10').maxDepth, 4.7);
  assert.ok(!nc10.inserts.some(item => item.grade === 'NC60'));
  const nc14 = data.series.find(item => item.id === 'nc14');
  assert.equal(nc14.angle, 90);
  assert.equal(nc14.maxDiameter, 14);
  assert.equal(nc14.maxDepth, 6.3);
  assert.equal(nc14.inserts.find(item => item.grade === 'NC60').indexableEdges, 4);
  assert.ok(nc14.holders.some(item => item.part === '00-99616-14-220L' && item.length === 220));
});

test('page 31: V09 and V13 are 60-degree holders with different cutting-table groups', () => {
  const v09 = data.series.find(item => item.id === 'v09');
  const v13 = data.series.find(item => item.id === 'v13');
  assert.deepEqual([v09.angle, v09.maxDiameter, v09.maxDepth, v09.feedTable], [60, 9, 7.2, 'small']);
  assert.equal(v09.holders[0].part, '00-99616-09V');
  assert.equal(v09.inserts[0].part, 'V9MT0802CT-NC2071');
  assert.deepEqual([v13.angle, v13.maxDiameter, v13.maxDepth, v13.feedTable], [60, 13, 10.1, 'large']);
  assert.equal(v13.inserts[0].part, 'V9MT12T3CT-NC2071');
  assert.deepEqual(v13.operations, ['spotting']);
});

test('page 53 small cutting table: stainless and high alloy retain mm/rev ranges', () => {
  assert.deepEqual(data.materials.find(item => item.id === 'stainless').vc, [65, 125]);
  assert.deepEqual(data.feedTables.small.stainless, { spotting: [.02, .04], chamfering: [.03, .08] });
  assert.deepEqual(data.feedTables.small.highAlloy, { spotting: [.02, .05], chamfering: [.03, .10] });
  assert.equal(data.feedTables.small.heatResistant.spotting, null);
  assert.deepEqual(data.feedTables.small.heatResistant.chamfering, [.03, .07]);
});

test('pages 53-54 larger cutting tables and grade ratings remain distinct', () => {
  assert.deepEqual(data.feedTables.standard.stainless, { spotting: [.03, .06], chamfering: [.08, .20] });
  assert.deepEqual(data.feedTables.large.carbonLow, { spotting: [.05, .10], chamfering: [.10, .24] });
  assert.deepEqual(data.feedTables.large.castIron.chamfering, [.10, .25]);
  const v09 = data.series.find(item => item.id === 'v09');
  const v13 = data.series.find(item => item.id === 'v13');
  assert.equal(v09.inserts.find(item => item.grade === 'NC2071').materialRatings.castIron, 2);
  assert.equal(v13.inserts.find(item => item.grade === 'NC5071').materialRatings.hardened, 2);
  assert.equal(v09.inserts.find(item => item.grade === 'NC5071').materialRatings.hardened, 1);
});

test('grade recommendations select catalog-listed material pairings; supporting edges are not auto boosted', () => {
  for (const series of data.series) {
    for (const [materialId, insertId] of Object.entries(series.recommendedByMaterial)) {
      const insert = series.inserts.find(item => item.id === insertId);
      assert.ok(insert.materialIds.includes(materialId));
      assert.ok(insert.materialRatings[materialId] > 0);
    }
    for (const insert of series.inserts) {
      assert.equal(insert.feedMultiplier, 1);
      assert.equal(insert.tipCorrection, null);
      if (insert.grade.startsWith('H-')) assert.equal(insert.supportingEdgeFeedFactor, 1.5);
      if (series.id !== 'p60' && ['NC40', 'NC60'].includes(insert.grade)) assert.equal(insert.minSpotDepth, 1);
      else assert.equal(insert.minSpotDepth, null);
    }
  }
  const nc14 = data.series.find(item => item.id === 'nc14');
  assert.equal(nc14.recommendedByMaterial.hardened, 'N9MT11T3CT-NC60');
  assert.equal(nc14.recommendedByMaterial.stainless, 'N9MT11T3CT-NC10');
});

test('model-first labels expose insert families while retaining existing URL IDs', () => {
  const expected = { nc06: 'N9MT05T1CT', nc08: 'N9MT0602CT', nc10: 'N9MT0802', nc14: 'N9MT11T3CT / CT2T', v09: 'V9MT0802CT', v13: 'V9MT12T3CT' };
  for (const [id, family] of Object.entries(expected)) {
    const series = data.series.find(item => item.id === id);
    assert.equal(series.familyLabel, family);
    assert.ok(series.label.startsWith(family));
    assert.equal(series.cuttingPresetAvailable, true);
    assert.equal(series.manualInput, false);
    for (const insert of series.inserts) assert.ok(insert.familyLabel);
  }
});

test('the linked on-site catalog is the unchanged user-supplied PDF', () => {
  const source = resolve(__dirname, '..', data.source.pdf);
  const bytes = readFileSync(source);
  assert.ok(bytes.subarray(0, 5).equals(Buffer.from('%PDF-')));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), 'ef41440ca6dfbce802ccd7aacbfafeb99247c3ed72c80ede7b4ac7b7e0b3fb1f');
  assert.equal(data.source.pageCount, 19);
});
