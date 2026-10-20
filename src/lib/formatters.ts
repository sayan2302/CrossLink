/**
 * Universal formatting helpers for CrossLink
 */

/**
 * Formats a numeric currency value with thousands separators.
 */
export function formatCurrency(amount: number | string, currencySymbol = ''): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return amount ? String(amount) : '0.00';

  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return currencySymbol ? `${currencySymbol} ${formatted}` : formatted;
}

/**
 * Truncates text with ellipsis if it exceeds the maximum length.
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text || '';
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Normalizes a phone prefix based on portal key (+66- for Lawton Thailand, +91- for Mayfair India, etc.).
 */
export function getPortalPhonePrefix(portalKey: string): string {
  if (portalKey.includes('Lawton')) return '+66-';
  return '+91-';
}
