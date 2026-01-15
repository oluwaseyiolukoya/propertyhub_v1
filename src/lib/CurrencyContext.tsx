import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getPreferredCurrency, setPreferredCurrency } from "./currency";

type CurrencyInfo = {
  code: string;
  symbol: string;
  name: string;
  rate: number;
};

type CurrencyContextValue = {
  currency: string;
  setCurrency: (code: string) => void;
  currencies: CurrencyInfo[];
  getCurrency: (code: string | undefined) => CurrencyInfo;
  convertAmount: (amount: number, fromCode: string, toCode?: string) => number;
  formatCurrency: (amount: number, code?: string) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(
  undefined
);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const currencies: CurrencyInfo[] = useMemo(
    () => [
      { code: "USD", symbol: "$", name: "US Dollar", rate: 1 },
      { code: "EUR", symbol: "€", name: "Euro", rate: 0.85 },
      { code: "GBP", symbol: "£", name: "British Pound", rate: 0.73 },
      { code: "CAD", symbol: "C$", name: "Canadian Dollar", rate: 1.25 },
      { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 1.35 },
      { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: 110 },
      { code: "CHF", symbol: "CHF", name: "Swiss Franc", rate: 0.92 },
      { code: "SEK", symbol: "kr", name: "Swedish Krona", rate: 8.5 },
      { code: "NGN", symbol: "₦", name: "Nigerian Naira", rate: 1650 },
    ],
    []
  );

  const [currency, setCurrency] = useState<string>(() =>
    getPreferredCurrency("USD")
  );

  useEffect(() => {
    setPreferredCurrency(currency);
  }, [currency]);

  const getCurrency = (code?: string) => {
    if (!code) return currencies[0];
    // Case-insensitive search
    const found = currencies.find(
      (c) => c.code.toUpperCase() === code.toUpperCase()
    );
    return found || currencies[0];
  };

  const convertAmount = (amount: number, fromCode: string, toCode?: string) => {
    const from = getCurrency(fromCode);
    const to = getCurrency(toCode || currency);
    const converted = amount * (to.rate / from.rate);
    return to.code === "JPY"
      ? Math.round(converted)
      : Math.round(converted * 100) / 100;
  };

  const formatCurrency = (amount: number, code?: string) => {
    const currencyCode = code || currency;
    const c = getCurrency(currencyCode);
    // Prices are now stored in Naira (major unit), not kobo
    // Format with proper decimal places
    return `${c.symbol}${Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const value: CurrencyContextValue = {
    currency,
    setCurrency,
    currencies,
    getCurrency,
    convertAmount,
    formatCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextValue => {
  const ctx = useContext(CurrencyContext);
  if (!ctx)
    throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
};
