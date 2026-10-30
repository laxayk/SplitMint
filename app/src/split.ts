/**
 * Client-side preview of a split, mirroring the backend's SplitService.
 * The server is always authoritative; this only drives the UI preview so the
 * user sees the shares before saving. Rounding leftover goes to members
 * sorted by user id, exactly like the server.
 */
export type SplitMode = 'EQUAL' | 'EXACT' | 'PERCENT';

export function splitPreview(
  mode: SplitMode,
  amountMinor: number,
  memberIds: string[],
  exact?: Record<string, number>,
  percent?: Record<string, number>,
): Record<string, number> {
  const ordered = [...memberIds].sort();
  const result: Record<string, number> = {};
  if (mode === 'EQUAL') {
    const base = Math.floor(amountMinor / ordered.length);
    let remainder = amountMinor % ordered.length;
    for (const id of ordered) {
      result[id] = base + (remainder-- > 0 ? 1 : 0);
    }
  } else if (mode === 'EXACT') {
    for (const id of ordered) result[id] = exact?.[id] ?? 0;
  } else {
    let assigned = 0;
    for (const id of ordered) {
      result[id] = Math.floor((amountMinor * (percent?.[id] ?? 0)) / 100);
      assigned += result[id];
    }
    let leftover = amountMinor - assigned;
    let i = 0;
    while (leftover > 0 && ordered.length > 0) {
      result[ordered[i % ordered.length]]++;
      leftover--;
      i++;
    }
  }
  return result;
}
