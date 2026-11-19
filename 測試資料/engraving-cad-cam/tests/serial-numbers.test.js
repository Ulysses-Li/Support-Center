const test = require('node:test');
const assert = require('node:assert/strict');
const {create} = require('../serial-numbers.js');

test('依前後綴、起始號碼、遞增量及位數建立流水號', () => {
  assert.deepEqual(create({prefix:'N9-', suffix:'A', start:'7', step:'2', count:'3', digits:'4'}),
    ['N9-0007A', 'N9-0009A', 'N9-0011A']);
  assert.deepEqual(create({prefix:'批次', suffix:'', start:98, step:1, count:4, digits:2}),
    ['批次98', '批次99', '批次100', '批次101']);
});

test('拒絕無效數值與超過安全整數的最後號碼', () => {
  const base = {start:'0', step:'1', count:'2', digits:'4'};
  for (const options of [
    {start:''}, {start:'-1'}, {start:'1.2'}, {start:'9e2'},
    {step:'0'}, {count:'0'}, {count:'101'}, {digits:'0'}, {digits:'17'},
    {start:'9007199254740991'}
  ]) assert.throws(() => create({...base, ...options}));
  assert.deepEqual(create({...base, start:'9007199254740990', digits:'1'}),
    ['9007199254740990', '9007199254740991']);
});

test('拒絕無法安全交由文字模組處理的前後綴與過長文字', () => {
  const base = {start:'1', step:'1', count:'1', digits:'4'};
  assert.throws(() => create({...base, prefix:'A\nB'}), /單行/);
  assert.throws(() => create({...base, prefix:'A'.repeat(97)}), /100/);
});
