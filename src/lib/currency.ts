/**
 * Frontend Currency Utility
 * Handles currency formatting and display
 */

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  decimals?: number;
}

export const CURRENCIES: Record<string, CurrencyConfig> = {
  NGN: { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', decimals: 2 },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2 },
};

/**
 * Format currency with symbol
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'NGN'
): string {
  if (amount === null || amount === undefined) return '--';

  const config = CURRENCIES[currency] || CURRENCIES.NGN;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: config.decimals || 2,
    maximumFractionDigits: config.decimals || 2,
  });

  return `${config.symbol}${formatted}`;
}

/**
 * Format currency with code (e.g., "NGN 500,000.00")
 */
export function formatCurrencyWithCode(
  amount: number | null | undefined,
  currency: string = 'NGN'
): string {
  if (amount === null || amount === undefined) return '--';

  const config = CURRENCIES[currency] || CURRENCIES.NGN;
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: config.decimals || 2,
    maximumFractionDigits: config.decimals || 2,
  });

  return `${currency} ${formatted}`;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCIES[currency]?.symbol || currency;
}

/**
 * Get currency name
 */
export function getCurrencyName(currency: string): string {
  return CURRENCIES[currency]?.name || currency;
}

/**
 * Format amount with both original and converted currency
 * Example: "$2,000 (₦1,640,000)"
 */
export function formatDualCurrency(
  originalAmount: number,
  originalCurrency: string,
  convertedAmount: number,
  convertedCurrency: string
): string {
  if (originalCurrency === convertedCurrency) {
    return formatCurrency(originalAmount, originalCurrency);
  }

  return `${formatCurrency(convertedAmount, convertedCurrency)} (${formatCurrency(originalAmount, originalCurrency)})`;
}

/**
 * Get list of supported currencies for dropdown
 */
export function getSupportedCurrencies(): CurrencyConfig[] {
  return Object.values(CURRENCIES);
}

/**
 * Parse currency string to number
 */
export function parseCurrency(value: string): number {
  // Remove currency symbols and commas
  const cleaned = value.replace(/[₦$€£,]/g, '').trim();
  return parseFloat(cleaned) || 0;
}

/**
 * Get preferred currency from localStorage
 */
export function getPreferredCurrency(defaultCurrency: string = 'NGN'): string {
  if (typeof window === 'undefined') return defaultCurrency;
  return localStorage.getItem('preferredCurrency') || defaultCurrency;
}

/**
 * Set preferred currency in localStorage
 */
export function setPreferredCurrency(currency: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('preferredCurrency', currency);
}
