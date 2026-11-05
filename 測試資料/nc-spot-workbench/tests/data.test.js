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

test('P60 uses the confirmed CT parent cutting reference without inheriting ratings or geometry', () => {
  const p60 = data.series.find(item => item.id === 'p60');
  assert.equal(p60.feedTable, 'standard');
  assert.equal(p60.cuttingPresetAvailable, true);
  assert.equal(p60.manualInput, false);
  assert.deepEqual([p60.cuttingSourcePage, p60.cuttingPdfPage], [53, 18]);
  assert.equal(p60.cuttingReference.basis, 'user-confirmed-parent');
  assert.equal(p60.cuttingReference.parentInsert, 'N9MT11T3CT-NC40');
  const parent = data.series.find(item => item.id === 'nc14').inserts.find(item => item.part === p60.cuttingReference.parentInsert);
  // 引用母型號的 NC40 適用材料與 P60 用途交集，不把其他牌號的高合金鋼或硬度限制搬進來。
  assert.deepEqual(p60.cuttingReference.materialIds, ['carbonLow', 'carbonHigh', 'lowAlloy', 'castIron']);
  for (const materialId of p60.cuttingReference.materialIds) {
    assert.ok(parent.materialRatings[materialId] > 0);
    assert.ok(p60.inserts[0].materialIds.includes(materialId));
  }
  assert.deepEqual(data.feedTables[p60.feedTable].carbonLow.spotting, [.05, .10]);
  assert.deepEqual(data.materials.find(item => item.id === 'carbonLow').vc, [150, 320]);
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
  assert.deepEqual(v13.operations, ['spotting', 'chamfering']);
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
  assert.equal(v13.inserts.find(item => item.grade === 'NC5071').materialRatings.hardened, 1);
  assert.equal(v13.inserts.find(item => item.grade === 'NC2071').materialRatings.heatResistant, 1);
  assert.equal(v09.inserts.find(item => item.grade === 'NC5071').materialRatings.hardened, 1);
});

test('pages 32 and 54: both V082 sizes use their matching inch holders and the large cutting table', () => {
  const small = data.series.find(item => item.id === 'v08208');
  const large = data.series.find(item => item.id === 'v08212');
  assert.deepEqual([small.angle, small.maxDiameter, small.maxDepth, small.feedTable], [82, 9, 4.7, 'large']);
  assert.deepEqual([large.angle, large.maxDiameter, large.maxDepth, large.feedTable], [82, 14, 7.5, 'large']);
  assert.deepEqual([small.holders[0].part, small.holders[0].shankDiameter, small.holders[0].shankLabel], ['00-99619-V082-3/8', 9.525, '3/8"']);
  assert.deepEqual([large.holders[0].part, large.holders[0].shankDiameter, large.holders[0].shankLabel], ['00-99619-V082-5/8', 15.875, '5/8"']);
  assert.deepEqual(small.inserts.map(item => item.part), ['V0820802-NC2071', 'V0820802-NC5071', 'V0820802-NC9076']);
  assert.equal(large.inserts.find(item => item.grade === 'NC5071').code, '0108213');
  assert.deepEqual(small.operations, ['spotting', 'chamfering']);
});

test('pages 38-39: large ordinary inserts retain NC9036, triangular NC40 and NC2033/XP9000', () => {
  const nc22 = data.series.find(item => item.id === 'nc22');
  const nc25 = data.series.find(item => item.id === 'nc25');
  const nc32 = data.series.find(item => item.id === 'nc32');
  assert.deepEqual([nc22.maxDiameter, nc22.maxDepth], [22, 10.4]);
  assert.equal(nc22.inserts.find(item => item.grade === 'NC9036').part, 'N9MT1704CT-NC9036');
  assert.ok(!nc22.inserts.some(item => item.grade === 'NC9076'));
  assert.deepEqual(nc22.holders.map(item => [item.part, item.shankDiameter, item.length]), [['00-99616-22', 20, 100], ['00-99616-22-25', 25, 150]]);
  assert.deepEqual([nc25.inserts[0].part, nc25.inserts[0].indexableEdges, nc25.inserts[0].maxDiameter, nc25.inserts[0].maxDepth], ['N9MT220408CT-NC40', 3, 25, 11.3]);
  assert.equal(nc25.holders[1].part, '00-99616-1-CT28');
  assert.equal(nc25.holders[1].shankDiameter, 25.4);
  assert.deepEqual([nc32.maxDiameter, nc32.maxDepth], [32, 15.4]);
  assert.deepEqual(nc32.inserts.map(item => item.part), ['N9MT2506CT-NC2033', 'N9MT2506CT-XP9000']);
  assert.equal(nc32.holders[0].neckLength, 64);
});

test('page 54 matrix remains separate from page 39 prose compatibility', () => {
  const nc25 = data.series.find(item => item.id === 'nc25');
  const nc32 = data.series.find(item => item.id === 'nc32');
  const tri = nc25.inserts[0];
  assert.equal(tri.materialRatings.carbonLow, 3);
  assert.equal(tri.materialRatings.castIron, 2);
  assert.equal(tri.materialRatings.stainless, 1);
  assert.equal(tri.materialRatings.carbonHigh, undefined);
  assert.ok(tri.materialIds.includes('carbonHigh'));
  assert.equal(tri.materialMaxHardness, null);
  assert.equal(nc25.recommendedByMaterial.carbonHigh, undefined);
  const uncoated = nc32.inserts.find(item => item.grade === 'XP9000');
  assert.ok(uncoated.materialIds.includes('titanium'));
  assert.equal(uncoated.materialRatings.titanium, undefined);
  assert.equal(uncoated.materialRatings.nonFerrous, 3);
  const coated = nc32.inserts.find(item => item.grade === 'NC2033');
  assert.equal(coated.materialRatings.hardened, 2);
  assert.equal(coated.materialMaxHardness, 50);
});

test('page 40: same CT2T insert has independent 90 and 100-degree assembly limits', () => {
  const ninety = data.series.find(item => item.id === 'nc14');
  const hundred = data.series.find(item => item.id === 'nc100');
  const part = 'N9MT11T3CT2T-H-NC40';
  assert.equal(ninety.inserts.find(item => item.part === part).maxDiameter, 14);
  assert.deepEqual([hundred.angle, hundred.maxDiameter, hundred.maxDepth], [100, 16, 6.2]);
  assert.equal(hundred.holders[0].part, '00-99616-20-100');
  assert.deepEqual(hundred.operations, ['spotting', 'chamfering']);
  assert.equal(hundred.inserts.find(item => item.part === part).code, '014202');
  assert.ok(!hundred.holders.some(item => item.part === '00-99616-14'));
});

test('page 41: V142 uses per-insert 15/30 mm limits rather than 16/32 holder names or headline', () => {
  const small = data.series.find(item => item.id === 'v14208');
  const large = data.series.find(item => item.id === 'v14216');
  assert.deepEqual([small.angle, small.maxDiameter, small.maxDepth], [142, 15, 2.5]);
  assert.deepEqual([large.angle, large.maxDiameter, large.maxDepth], [142, 30, 5]);
  assert.equal(small.inserts[0].part, 'V1420803-NC2071');
  assert.equal(large.inserts[0].part, 'V1421604-NC2071');
  assert.equal(small.holders[0].part, '00-99619-V142-16');
  assert.equal(large.holders[0].part, '00-99619-V142-32');
  assert.deepEqual(large.operations, ['spotting']);
  assert.equal(large.inserts[0].materialRatings.carbonHigh, undefined);
  assert.ok(large.inserts[0].materialIds.includes('carbonHigh'));
});

test('ordinary coverage accounts for all specification pages and keeps unknown overview references separate', () => {
  assert.equal(data.series.length, 17);
  assert.equal(data.series.reduce((sum, item) => sum + item.inserts.length, 0), 48);
  assert.equal(data.series.reduce((sum, item) => sum + item.holders.length, 0), 36);
  for (const family of data.series) {
    for (const insert of family.inserts) assert.match(insert.code, /^\d+$/);
    for (const holder of family.holders) assert.match(holder.code, /^\d+$/);
  }
  const covered = new Set(data.catalogCoverage.flatMap(row => row.familyIds));
  for (const family of data.series) assert.ok(covered.has(family.id));
  assert.ok(data.series.some(item => item.id === 'nc120' && item.angle === 120));
  assert.ok(data.catalogCoverage.some(row => row.sourcePages.includes(52) && row.note.includes('120°')));
  assert.ok(data.catalogCoverage.some(row => row.kind === 'wsp' && row.status === 'separate-model'));
});

test('legacy p1-13 plus the current official page complete 120 and CT2T-142 without merging V142', () => {
  const oneTwenty = data.series.find(item => item.id === 'nc120');
  const n142 = data.series.find(item => item.id === 'nc142');
  assert.deepEqual([oneTwenty.angle, oneTwenty.maxDiameter, oneTwenty.maxDepth, oneTwenty.sourcePage, oneTwenty.pdfPage], [120, 17, 4.76, '1-13', 13]);
  assert.deepEqual([n142.angle, n142.maxDiameter, n142.maxDepth], [142, 18.5, 3.16]);
  assert.deepEqual(oneTwenty.holders.map(item => [item.part, item.shankDiameter, item.length]), [['00-99616-20-120', 20, 100], ['00-99616-3/4-120', 19.05, 100]]);
  assert.deepEqual(n142.holders.map(item => item.part), ['00-99616-20-142', '00-99616-3/4-142']);
  for (const family of [oneTwenty, n142]) {
    assert.equal(family.sourcePdf, './sources/NC-Spot-Drill-Legacy.pdf');
    assert.equal(family.cuttingSourcePdf, './sources/NC-Spot-Drill-2025-2026-ENG.pdf');
    assert.deepEqual(family.operations, ['spotting', 'chamfering']);
    assert.deepEqual(family.inserts.map(item => item.grade), ['H-NC5071', 'H-NC40', 'H-NC9076']);
    assert.ok(family.inserts.find(item => item.grade === 'H-NC5071').gradeSourceNote.includes('not in'));
  }
  assert.notEqual(n142.inserts[0].part, data.series.find(item => item.id === 'v14216').inserts[0].part);
});

test('Dmin values use independent system-table or live overview evidence rather than shank diameter', () => {
  const expected = { p60: 2, v09: 1, v13: 2, v08208: 2, v08212: 2, nc06: 1, nc08: 1, nc10: 2, nc14: 3, nc22: 3, nc25: 4, nc32: 4, nc100: 3, nc120: 3, nc142: 3, v14208: 2, v14216: 2 };
  for (const [id, diameter] of Object.entries(expected)) {
    const family = data.series.find(item => item.id === id);
    assert.equal(family.minDiameter, diameter);
    for (const insert of family.inserts) assert.equal(insert.minDiameter, diameter);
    if (['p60', 'nc120', 'nc142'].includes(id)) {
      assert.equal(family.minDiameterSource, null);
      assert.equal(family.minDiameterSourceUrl, 'https://nine9.jic-tools.com.tw/nc-spot-drill.htm');
    } else {
      assert.equal(family.minDiameterSource, './sources/NC-Spot-Drill-System-2026-p15.png');
      assert.equal(family.minDiameterEdition, '2026-08');
    }
  }
  assert.equal(data.series.find(item => item.id === 'p60').maxDiameter, 5);
  assert.equal(data.series.find(item => item.id === 'nc100').maxDepth, 6.2);
});

test('page 35/37 package numbers resolve to catalog-matched family, insert and holder without new geometry', () => {
  assert.equal(data.catalogPackages.length, 14);
  assert.equal(new Set(data.catalogPackages.map(item => item.part)).size, 14);
  for (const pack of data.catalogPackages) {
    const family = data.series.find(item => item.id === pack.familyId);
    assert.ok(family.inserts.some(item => item.id === pack.insertId));
    assert.ok(family.holders.some(item => item.part === pack.holderPart));
    assert.ok([35, 37].includes(pack.sourcePage));
    if (pack.type === 'starter') assert.equal(pack.totalInsertQuantity, 6);
  }
  const inch = data.catalogPackages.find(item => item.part === '00-99616-14-IN6AL');
  assert.deepEqual([inch.familyId, inch.insertId, inch.holderPart], ['nc14', 'N9MT11T3CT-NC10', '00-99616-14-5/8']);
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
