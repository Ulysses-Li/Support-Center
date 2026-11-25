/* 流水號格式化與輸入檢查；不依賴畫面，可供其他雕刻流程重用。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EngravingSerial = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

  function integer(value, label, min, max) {
    const input = String(value ?? '').trim();
    if (!/^\d+$/.test(input) || input.length > 32) throw new Error(`${label}必須是整數。`);
    const number = BigInt(input);
    if (number < min || number > max) throw new Error(`${label}超出允許範圍。`);
    return number;
  }

  function create(options = {}) {
    const prefix = String(options.prefix ?? ''), suffix = String(options.suffix ?? '');
    if (/[\r\n\t\p{M}\u200d\ufe0f]/u.test(prefix + suffix)) throw new Error('前綴與後綴限單行文字，不支援組合字元。');
    const start = integer(options.start, '起始號碼', 0n, MAX_SAFE);
    const step = integer(options.step, '遞增量', 1n, MAX_SAFE);
    const count = integer(options.count, '數量', 1n, 100n);
    const digits = integer(options.digits, '數字位數', 1n, 16n);
    // 使用 BigInt 計算末號，避免 JavaScript 浮點數溢位造成號碼重複。
    if (start + (count - 1n) * step > MAX_SAFE) throw new Error('最後號碼超出安全整數範圍。');
    const result = [];
    for (let index = 0n; index < count; index++) {
      const value = prefix + (start + index * step).toString().padStart(Number(digits), '0') + suffix;
      if ([...value].length > 100) throw new Error('流水號文字最多 100 個字元。');
      result.push(value);
    }
    return result;
  }
  return {create};
}));
