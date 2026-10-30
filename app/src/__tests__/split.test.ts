import { describe, expect, it } from 'vitest';
import { splitPreview } from '../split';
import { formatMoney, parseMoney } from '../format';

describe('splitPreview', () => {
  const a = '00000000-0000-0000-0000-000000000001';
  const b = '00000000-0000-0000-0000-000000000002';
  const c = '00000000-0000-0000-0000-000000000003';

  it('matches the server rule: leftover by sorted id, sums exactly', () => {
    const r = splitPreview('EQUAL', 10000, [c, a, b]);
    expect(r[a]).toBe(3334);
    expect(r[b]).toBe(3333);
    expect(r[c]).toBe(3333);
    expect(Object.values(r).reduce((x, y) => x + y, 0)).toBe(10000);
  });
});

describe('money parsing', () => {
  it('parses clean amounts to minor units', () => {
    expect(parseMoney('12.34')).toBe(1234);
    expect(parseMoney('100')).toBe(10000);
    expect(parseMoney('0.05')).toBe(5);
  });
  it('rejects junk', () => {
    expect(parseMoney('abc')).toBeNull();
    expect(parseMoney('12.345')).toBeNull();
    expect(parseMoney('-5')).toBeNull();
  });
  it('formats with sign and symbol', () => {
    expect(formatMoney(1234, 'INR')).toBe('₹12.34');
    expect(formatMoney(-500, 'USD')).toBe('-$5.00');
  });
});
