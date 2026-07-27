"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { type Locale, getLocaleFromCookie, setLocaleCookie } from "@/lib/translations";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("th");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(getLocaleFromCookie());
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocaleCookie(newLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "th" ? "en" : "th");
  }, [locale, setLocale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, toggleLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
