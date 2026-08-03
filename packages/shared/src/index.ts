/**
 * Shared enums and types for CCounter (used by both server and client).
 */

// ---------------------------------------------------------------------------
// Chat / Analytics period
// ---------------------------------------------------------------------------

export enum Period {
  Day      = 'day',
  Week     = 'week',
  Month    = 'month',
  AllTime  = 'all-time',
}

/** Validate and normalize any string to a Period (case-insensitive). */
export function parsePeriod(value: string): Period | null {
  const normalized = value.toLowerCase() as Period;
  return Object.values(Period).includes(normalized) ? normalized : null;
}
