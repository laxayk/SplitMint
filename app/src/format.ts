/** Money is integer minor units end to end; format only at the edge. */
export function formatMoney(minor: number, currency: string): string {
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  const major = (abs / 100).toFixed(2);
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
  return `${sign}${symbol}${major}`;
}

/** "12.34" -> 1234 minor units. Returns null when not a clean amount. */
export function parseMoney(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  return Math.round(parseFloat(trimmed) * 100);
}
