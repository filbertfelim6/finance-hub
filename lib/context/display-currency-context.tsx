"use client";

import { createContext, useContext, useState, useEffect } from "react";

export interface DisplayCurrencyOption {
  code: string;
  label: string;
}

export const DISPLAY_CURRENCIES: DisplayCurrencyOption[] = [
  { code: "IDR", label: "IDR — Indonesian Rupiah" },
  { code: "USD", label: "USD — US Dollar" },
  { code: "EUR", label: "EUR — Euro" },
  { code: "SGD", label: "SGD — Singapore Dollar" },
  { code: "GBP", label: "GBP — British Pound" },
  { code: "JPY", label: "JPY — Japanese Yen" },
];

interface DisplayCurrencyContextValue {
  displayCurrency: string;
  setDisplayCurrency: (c: string) => void;
}

const DisplayCurrencyContext = createContext<DisplayCurrencyContextValue>({
  displayCurrency: "IDR",
  setDisplayCurrency: () => {},
});

export function DisplayCurrencyProvider({ children }: { children: React.ReactNode }) {
  const [displayCurrency, setDisplayCurrencyState] = useState("IDR");

  useEffect(() => {
    const stored = localStorage.getItem("display-currency");
    if (stored) setDisplayCurrencyState(stored);
  }, []);

  function setDisplayCurrency(c: string) {
    setDisplayCurrencyState(c);
    localStorage.setItem("display-currency", c);
  }

  return (
    <DisplayCurrencyContext.Provider value={{ displayCurrency, setDisplayCurrency }}>
      {children}
    </DisplayCurrencyContext.Provider>
  );
}

export function useDisplayCurrency() {
  return useContext(DisplayCurrencyContext);
}
