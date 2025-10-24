/**
 * Currency Conversion Service
 * Handles multi-currency operations and conversions
 */

// Exchange rates (you can update these or fetch from API)
const EXCHANGE_RATES: Record<string, Record<string, number>> = {
  NGN: {
    NGN: 1,
    USD: 0.0012,     // 1 NGN = 0.0012 USD (approx $1 = ₦820)
    EUR: 0.0011,     // 1 NGN = 0.0011 EUR
    GBP: 0.00095,    // 1 NGN = 0.00095 GBP
  },
  USD: {
    NGN: 820,        // 1 USD = 820 NGN
    USD: 1,
    EUR: 0.92,       // 1 USD = 0.92 EUR
    GBP: 0.79,       // 1 USD = 0.79 GBP
  },
  EUR: {
    NGN: 890,        // 1 EUR = 890 NGN
    USD: 1.09,       // 1 EUR = 1.09 USD
    EUR: 1,
    GBP: 0.86,       // 1 EUR = 0.86 GBP
  },
  GBP: {
    NGN: 1040,       // 1 GBP = 1040 NGN
    USD: 1.27,       // 1 GBP = 1.27 USD
    EUR: 1.16,       // 1 GBP = 1.16 EUR
    GBP: 1,
  },
};

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  exchangeRate: number;
  formattedOriginal: string;
  formattedConverted: string;
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): ConversionResult {
  // If same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: amount,
      convertedCurrency: toCurrency,
      exchangeRate: 1,
      formattedOriginal: formatCurrency(amount, fromCurrency),
      formattedConverted: formatCurrency(amount, toCurrency),
    };
  }

  // Get exchange rate
  const rate = getExchangeRate(fromCurrency, toCurrency);
  const convertedAmount = amount * rate;

  return {
    originalAmount: amount,
    originalCurrency: fromCurrency,
    convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimals
    convertedCurrency: toCurrency,
    exchangeRate: rate,
    formattedOriginal: formatCurrency(amount, fromCurrency),
    formattedConverted: formatCurrency(convertedAmount, toCurrency),
  };
}

/**
 * Get exchange rate between two currencies
 */
export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return 1;

  const rates = EXCHANGE_RATES[fromCurrency];
  if (!rates || !rates[toCurrency]) {
    console.warn(`Exchange rate not found for ${fromCurrency} to ${toCurrency}, using 1:1`);
    return 1; // Fallback to 1:1 if rate not found
  }

  return rates[toCurrency];
}

/**
 * Format currency with symbol
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  const symbol = symbols[currency] || currency;
  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${symbol}${formattedAmount}`;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  return symbols[currency] || currency;
}

/**
 * Convert multiple amounts to base currency and sum them
 * Useful for dashboard totals
 */
export function convertAndSum(
  amounts: Array<{ amount: number; currency: string }>,
  baseCurrency: string
): { total: number; breakdown: ConversionResult[] } {
  const breakdown: ConversionResult[] = amounts.map((item) =>
    convertCurrency(item.amount, item.currency, baseCurrency)
  );

  const total = breakdown.reduce((sum, item) => sum + item.convertedAmount, 0);

  return {
    total: Math.round(total * 100) / 100,
    breakdown,
  };
}

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
];

/**
 * Update exchange rates (call this from API or admin panel)
 */
export function updateExchangeRate(fromCurrency: string, toCurrency: string, rate: number): void {
  if (!EXCHANGE_RATES[fromCurrency]) {
    EXCHANGE_RATES[fromCurrency] = {};
  }
  EXCHANGE_RATES[fromCurrency][toCurrency] = rate;
  
  // Also update reverse rate
  if (!EXCHANGE_RATES[toCurrency]) {
    EXCHANGE_RATES[toCurrency] = {};
  }
  EXCHANGE_RATES[toCurrency][fromCurrency] = 1 / rate;
}

/**
 * Get all current exchange rates
 */
export function getAllExchangeRates(): Record<string, Record<string, number>> {
  return EXCHANGE_RATES;
}

