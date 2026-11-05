const test = require('node:test');
const assert = require('node:assert/strict');
const lookup = require('../lookup.js');
const data = require('../data.js');

test('exact insert lookup identifies the selected catalog model', () => {
  const matches = lookup.find(' n9mt220408ct-nc40 ', data);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].familyId, 'nc25');
  assert.equal(matches[0].insertId, 'N9MT220408CT-NC40');
});
test('a shared holder retains all compatible angle assemblies', () => {
  const matches = lookup.find('99616-14', data);
  assert.ok(matches.some(item => item.familyId === 'p60'));
  assert.ok(matches.some(item => item.familyId === 'nc14'));
  assert.ok(matches.every(item => item.holderPart === '00-99616-14'));
});
test('starter code resolves the matching holder and fitted insert', () => {
  const [match] = lookup.find('603201-3401', data);
  assert.equal(match.familyId, 'nc10');
  assert.equal(match.insertId, 'N9MT080208CT-NC40');
  assert.equal(match.holderPart, '00-99616-10');
});
test('partial model search keeps distinct variants and unknown text returns no result', () => {
  assert.ok(lookup.find('N9MT11T3', data).length > 2);
  assert.deepEqual(lookup.find('missing-part-000', data), []);
  assert.deepEqual(lookup.find('', data), []);
});
test('shared CT2T part round-trips the exact 90/100/120/142-degree URL assembly', () => {
  const insertId = 'N9MT11T3CT2T-H-NC40';
  for (const [seriesId, angle] of [['nc14',90], ['nc100',100], ['nc120',120], ['nc142',142]]) {
    const result = lookup.resolveAssembly({ seriesId, insertId, angle: String(angle) }, data.series);
    assert.equal(result.series.id, seriesId);
    assert.equal(result.series.angle, angle);
  }
  assert.equal(lookup.resolveAssembly({ insertId, angle:'120' }, data.series).series.id, 'nc120');
});
test('a shared insert without an angle is ambiguous instead of silently selecting the first family', () => {
  const result = lookup.resolveAssembly({ insertId:'N9MT11T3CT2T-H-NC40' }, data.series);
  assert.equal(result.series, null);
  assert.ok(result.candidates.length >= 4);
});
