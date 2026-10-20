/**
 * Universal date utilities for CrossLink
 * Handles .NET serialized dates, standard ISO dates, and UK/SEA display formatting (DD-MMM-YYYY).
 */

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Parses a date value that may be an ISO string, timestamp, or .NET `/Date(1672531199000)/` format.
 */
export function parseDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    if (trimmed.includes('/Date(')) {
      const match = trimmed.match(/\/Date\((\d+)/);
      if (match) {
        const d = new Date(Number(match[1]));
        return isNaN(d.getTime()) ? null : d;
      }
    }

    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof val === 'number') {
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

/**
 * Formats a date into authentic enterprise format: `DD-MMM-YYYY` (e.g. `19-Oct-2024`).
 */
export function formatDisplayDate(val: any, fallback = ''): string {
  const d = parseDate(val);
  if (!d) return fallback;

  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Checks whether a given expiry date is strictly in the past (before today 00:00:00).
 */
export function isExpired(endDateVal: any): boolean {
  const endDate = parseDate(endDateVal);
  if (!endDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return endDate < today;
}
