/* 完工孔徑公差：僅解讀使用者輸入與上下限，不參與刀桿篩選或切削計算。 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.NINEBORE_DIAMETER_TOLERANCE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function parse(value) {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) return { empty: true, valid: true, value: null };
    if (typeof value !== 'number' && typeof value !== 'string') return { empty: false, valid: false, value: null };
    if (typeof value === 'string' && !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim())) return { empty: false, valid: false, value: null };
    const number = Number(value);
    return Number.isFinite(number) ? { empty: false, valid: true, value: number === 0 ? 0 : number } : { empty: false, valid: false, value: null };
  }

  // 先把有限數字拆成十進位整數與小數位數，再相加；避免 5 + 0.05 出現浮點尾數。
  function decimalParts(value) {
    const [mantissa, exponentText = '0'] = String(value).split('e');
    const [whole, fraction = ''] = mantissa.split('.');
    let coefficient = BigInt(`${whole}${fraction}`);
    let scale = fraction.length - Number(exponentText);
    if (scale < 0) {
      coefficient *= 10n ** BigInt(-scale);
      scale = 0;
    }
    return { coefficient, scale };
  }

  function decimalText({ coefficient, scale }) {
    const negative = coefficient < 0n;
    const digits = String(negative ? -coefficient : coefficient).padStart(scale + 1, '0');
    const text = scale ? `${digits.slice(0, -scale)}.${digits.slice(-scale)}`.replace(/0+$/, '').replace(/\.$/, '') : digits;
    return `${negative && coefficient !== 0n ? '-' : ''}${text}`;
  }

  function signedText(value) {
    if (value === null) return '';
    let { coefficient, scale } = decimalParts(value);
    // 顯示最多十二位小數；只收斂文字，不把輸入公差暗中改成另一個數字。
    if (scale > 12) {
      const divisor = 10n ** BigInt(scale - 12);
      const absolute = coefficient < 0n ? -coefficient : coefficient;
      const rounded = absolute / divisor + (absolute % divisor * 2n >= divisor ? 1n : 0n);
      coefficient = coefficient < 0n ? -rounded : rounded;
      scale = 12;
    }
    const text = decimalText({ coefficient, scale });
    return coefficient > 0n ? `+${text}` : text;
  }

  function addDecimal(left, right) {
    const a = decimalParts(left);
    const b = decimalParts(right);
    const scale = Math.max(a.scale, b.scale);
    const coefficient = a.coefficient * 10n ** BigInt(scale - a.scale) + b.coefficient * 10n ** BigInt(scale - b.scale);
    return Number(decimalText({ coefficient, scale }));
  }

  function evaluate(input = {}) {
    const source = input !== null && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const upper = parse(source.upper);
    const lower = parse(source.lower);
    const result = { status: 'empty', upper: upper.value, lower: lower.value, min: null, max: null, upperText: signedText(upper.value), lowerText: signedText(lower.value), errors: [] };
    if (!upper.valid) result.errors.push({ field: 'upper', code: 'invalid-number' });
    if (!lower.valid) result.errors.push({ field: 'lower', code: 'invalid-number' });
    if (result.errors.length) return { ...result, status: 'invalid' };
    if (upper.empty && lower.empty) return result;
    // 未填的一格不是零；保留已填數字，等兩格齊全才檢查範圍與孔徑。
    if (upper.empty || lower.empty) return { ...result, status: 'partial' };
    if (upper.value < lower.value) return { ...result, status: 'invalid', errors: [{ field: 'range', code: 'inverted' }] };
    const diameter = parse(source.diameter);
    if (!diameter.valid || diameter.empty || diameter.value <= 0) return { ...result, status: 'missing-diameter', errors: [{ field: 'diameter', code: 'invalid-diameter' }] };
    const min = addDecimal(diameter.value, lower.value);
    const max = addDecimal(diameter.value, upper.value);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return { ...result, status: 'invalid', errors: [{ field: 'range', code: 'invalid-number' }] };
    if (min <= 0 || max <= 0) return { ...result, status: 'invalid', errors: [{ field: 'range', code: 'nonpositive-limit' }] };
    return { ...result, status: 'valid', min, max };
  }

  return Object.freeze({ evaluate });
});
