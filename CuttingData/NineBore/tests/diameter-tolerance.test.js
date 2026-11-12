/* 有號孔徑公差契約：不補零、不限制必須跨零，也不以公差改變完工孔徑。 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const tolerance = require('../diameter-tolerance.js');

test('D5 with +0.05/-0.02 gives exact decimal limits and canonical signed text', () => {
  assert.deepEqual(tolerance.evaluate({ diameter: 5, upper: '+0.05', lower: '-0.02' }), {
    status: 'valid', upper: 0.05, lower: -0.02, min: 4.98, max: 5.05, upperText: '+0.05', lowerText: '-0.02', errors: []
  });
});

test('empty and partial tolerances never infer zero or require the other field', () => {
  const empty = tolerance.evaluate({ diameter: -1, upper: ' ', lower: '' });
  assert.deepEqual(empty, { status: 'empty', upper: null, lower: null, min: null, max: null, upperText: '', lowerText: '', errors: [] });
  for (const input of [{ upper: '+0.05', lower: '' }, { upper: '', lower: '-.02' }]) {
    const result = tolerance.evaluate({ diameter: 5, ...input });
    assert.equal(result.status, 'partial');
    assert.equal(result.min, null);
    assert.equal(result.max, null);
    assert.deepEqual(result.errors, []);
  }
  assert.equal(tolerance.evaluate({ diameter: 5, upper: '+0.05' }).lower, null);
  assert.equal(tolerance.evaluate({ diameter: 5, lower: null }).status, 'empty');
  assert.equal(tolerance.evaluate().status, 'empty');
});

test('both positive, both negative and equal bounds are valid one-sided tolerance ranges', () => {
  for (const [upper, lower, min, max] of [[0.05, 0.02, 5.02, 5.05], [-0.02, -0.05, 4.95, 4.98], [0, 0, 5, 5], [0.02, 0.02, 5.02, 5.02]]) {
    const result = tolerance.evaluate({ diameter: '5', upper, lower });
    assert.equal(result.status, 'valid');
    assert.equal(result.min, min);
    assert.equal(result.max, max);
    assert.deepEqual(result.errors, []);
  }
});

test('inverted tolerance and nonpositive derived limits report a range error', () => {
  for (const [upper, lower] of [[-0.05, -0.02], [0.02, 0.05], [-0.02, 0.05]]) {
    const result = tolerance.evaluate({ diameter: 5, upper, lower });
    assert.equal(result.status, 'invalid');
    assert.deepEqual(result.errors, [{ field: 'range', code: 'inverted' }]);
    assert.equal(result.min, null);
  }
  for (const lower of [-5, -6]) {
    const result = tolerance.evaluate({ diameter: 5, upper: 0, lower });
    assert.equal(result.status, 'invalid');
    assert.deepEqual(result.errors, [{ field: 'range', code: 'nonpositive-limit' }]);
    assert.equal(result.min, null);
    assert.equal(result.max, null);
  }
});

test('complete tolerances require a finite positive decimal diameter', () => {
  for (const diameter of [undefined, null, '', 0, -1, 'abc', '0x10', '1e3', true, {}, [], NaN, Infinity]) {
    const result = tolerance.evaluate({ diameter, upper: '+.05', lower: '-.02' });
    assert.equal(result.status, 'missing-diameter', String(diameter));
    assert.deepEqual(result.errors, [{ field: 'diameter', code: 'invalid-diameter' }]);
    assert.equal(result.min, null);
    assert.equal(result.max, null);
  }
});

test('invalid, injected and nondecimal tolerance values are rejected by field', () => {
  for (const value of [true, false, {}, [], NaN, Infinity, 'Infinity', 'NaN', '0x10', '0b10', '1e-2', '1,2', '1 2', '+', '.', '--.02', '<svg onload="alert(1)">', '0.02 mm']) {
    for (const field of ['upper', 'lower']) {
      const result = tolerance.evaluate({ diameter: 5, upper: 0.05, lower: -0.02, [field]: value });
      assert.equal(result.status, 'invalid', `${field}: ${String(value)}`);
      assert.deepEqual(result.errors, [{ field, code: 'invalid-number' }]);
      assert.equal(result[field], null);
      assert.equal(result[`${field}Text`], '');
    }
  }
  assert.deepEqual(tolerance.evaluate({ upper: 'bad', lower: 'bad' }).errors, [{ field: 'upper', code: 'invalid-number' }, { field: 'lower', code: 'invalid-number' }]);
});

test('decimal formats normalize signs and floating tails while retaining the supplied numeric tolerance', () => {
  const result = tolerance.evaluate({ diameter: ' 5.00 ', upper: ' +.0500 ', lower: '-.0200' });
  assert.equal(result.status, 'valid');
  assert.equal(result.upperText, '+0.05');
  assert.equal(result.lowerText, '-0.02');
  assert.equal(result.min, 4.98);
  assert.equal(result.max, 5.05);
  const zero = tolerance.evaluate({ diameter: 5, upper: '+0.000', lower: -0 });
  assert.equal(zero.upperText, '0');
  assert.equal(zero.lowerText, '0');
  assert.equal(Object.is(zero.lower, -0), false);
  const precision = tolerance.evaluate({ diameter: 5, upper: 0.1234567890126, lower: -0.1234567890126 });
  assert.equal(precision.upperText, '+0.123456789013');
  assert.equal(precision.lowerText, '-0.123456789013');
  assert.equal(precision.upper, 0.1234567890126);
  const floating = tolerance.evaluate({ diameter: 0.1, upper: 0.2, lower: 0.1 });
  assert.equal(floating.min, 0.2);
  assert.equal(floating.max, 0.3);
  const floatingInput = tolerance.evaluate({ diameter: 5, upper: 0.1 + 0.2, lower: 0 });
  assert.equal(floatingInput.upperText, '+0.3');
  assert.equal(floatingInput.max, 5.3);
  const small = tolerance.evaluate({ diameter: 5, upper: 1e-7, lower: -1e-7 });
  assert.equal(small.upperText, '+0.0000001');
  assert.equal(small.lowerText, '-0.0000001');
  assert.equal(small.max, 5.0000001);
  assert.equal(tolerance.evaluate({ diameter: 5, upper: 1e21, lower: 0 }).upperText, '+1000000000000000000000');
});

test('an overflowing derived limit cannot become a valid infinite range', () => {
  const result = tolerance.evaluate({ diameter: 1e308, upper: 1e308, lower: 0 });
  assert.equal(result.status, 'invalid');
  assert.deepEqual(result.errors, [{ field: 'range', code: 'invalid-number' }]);
  assert.equal(result.max, null);
});

test('the browser UMD exposes the same frozen evaluator without mutating its input', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'diameter-tolerance.js'), 'utf8'), context);
  const input = Object.freeze({ diameter: 5, upper: '+0.05', lower: '-0.02' });
  assert.equal(Object.isFrozen(context.NINEBORE_DIAMETER_TOLERANCE), true);
  assert.equal(JSON.stringify(context.NINEBORE_DIAMETER_TOLERANCE.evaluate(input)), JSON.stringify(tolerance.evaluate(input)));
  assert.deepEqual(input, { diameter: 5, upper: '+0.05', lower: '-0.02' });
});
