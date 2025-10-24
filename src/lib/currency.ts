export const CURRENCY_STORAGE_KEY = 'app_preferred_currency';

export const getPreferredCurrency = (fallback: string = 'USD'): string => {
  try {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    return stored || fallback;
  } catch {
    return fallback;
  }
};

export const setPreferredCurrency = (code: string): void => {
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, code);
  } catch {
    // ignore storage errors (private mode, etc.)
  }
};


