import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";

import { formatUsd } from "./goair";
import { useLanguage } from "./i18n/language-context";
import { supabase } from "./supabase";

/**
 * Display currencies.
 *
 * USD stays the single source of truth for every price, booking, payment and statement in the
 * database. This module only converts USD amounts for DISPLAY on customer-facing pages, using the
 * indicative rates exposed by the `get_display_currencies` RPC. Nothing here changes what is
 * charged: the amount due is always the USD figure stored on the booking.
 */

const STORAGE_KEY = "goair_currency";
const BASE_CODE = "USD";

export type DisplayCurrency = {
  code: string;
  nameAr: string;
  nameEn: string;
  symbolAr: string;
  symbolEn: string;
  decimals: number;
  roundingStep: number;
  /** Units of this currency per 1 USD. */
  rateToUsd: number;
  sortOrder: number;
};

export async function fetchDisplayCurrencies(): Promise<DisplayCurrency[]> {
  const { data, error } = await supabase.rpc("get_display_currencies");
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[])
    .map((row) => ({
      code: String(row["code"]),
      nameAr: String(row["name_ar"]),
      nameEn: String(row["name_en"]),
      symbolAr: String(row["symbol_ar"]),
      symbolEn: String(row["symbol_en"]),
      decimals: Number(row["decimals"] ?? 2),
      roundingStep: Number(row["rounding_step"] ?? 0.01),
      rateToUsd: Number(row["rate_to_usd"]),
      sortOrder: Number(row["sort_order"] ?? 100),
    }))
    .filter((c) => c.code && Number.isFinite(c.rateToUsd) && c.rateToUsd > 0);
}

/** Convert a USD amount to `currency`, rounded to that currency's display step. */
export function convertUsd(amountUsd: number, currency: DisplayCurrency): number {
  const raw = Number(amountUsd) * currency.rateToUsd;
  const step = currency.roundingStep > 0 ? currency.roundingStep : 0.01;
  const rounded = Number((Math.round(raw / step) * step).toFixed(currency.decimals));
  // Never show a non-zero price as 0 just because of rounding.
  return rounded === 0 && raw > 0 ? Number(raw.toFixed(currency.decimals)) : rounded;
}

function formatConverted(amountUsd: number, currency: DisplayCurrency, symbol: string): string {
  const value = convertUsd(amountUsd, currency);
  const text = value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: currency.decimals,
  });
  return `${text} ${symbol}`;
}

type CurrencyContextValue = {
  currencies: DisplayCurrency[];
  /** Selected display currency code ("USD" when nothing else is chosen or rates failed to load). */
  code: string;
  setCode: (code: string) => void;
  /** Name of a currency in the current UI language. */
  currencyLabel: (currency: DisplayCurrency) => string;
  /** "≈ 37.5 SAR" in a non-USD currency, or the plain USD string. Use for per-unit price tags. */
  formatPrice: (amountUsd: number) => string;
  /** "≈ 37.5 SAR" or null when USD is selected. Use for the secondary line under a USD total. */
  formatApprox: (amountUsd: number) => string | null;
  /** "12$ (≈ 45 SAR)" or just "12$". Use for inline totals owed. */
  formatDual: (amountUsd: number) => string;
};

const FALLBACK: CurrencyContextValue = {
  currencies: [],
  code: BASE_CODE,
  setCode: () => {},
  currencyLabel: (c) => c.nameEn,
  formatPrice: formatUsd,
  formatApprox: () => null,
  formatDual: formatUsd,
};

const CurrencyContext = createContext<CurrencyContextValue>(FALLBACK);

function readStoredCode(): string {
  if (typeof window === "undefined") return BASE_CODE;
  try {
    return window.localStorage.getItem(STORAGE_KEY) || BASE_CODE;
  } catch {
    return BASE_CODE;
  }
}

/**
 * Mount once in __root.tsx inside <LanguageProvider>. Like the language toggle, SSR and the first
 * client render use USD, and the saved choice is applied right after mount to avoid hydration
 * mismatches.
 */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [storedCode, setStoredCode] = useState<string>(BASE_CODE);

  useEffect(() => {
    setStoredCode(readStoredCode());
  }, []);

  const { data: currencies = [] } = useQuery({
    queryKey: ["display-currencies"],
    queryFn: fetchDisplayCurrencies,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  const selected = useMemo(
    () =>
      storedCode === BASE_CODE
        ? null
        : (currencies.find((c) => c.code === storedCode && c.code !== BASE_CODE) ?? null),
    [currencies, storedCode],
  );

  const setCode = useCallback((next: string) => {
    setStoredCode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the choice then lasts for this visit only.
    }
  }, []);

  const value = useMemo<CurrencyContextValue>(() => {
    const symbolOf = (c: DisplayCurrency) => (language === "ar" ? c.symbolAr : c.symbolEn);
    const formatApprox = (amountUsd: number) =>
      selected ? `≈ ${formatConverted(amountUsd, selected, symbolOf(selected))}` : null;

    return {
      currencies,
      code: selected ? selected.code : BASE_CODE,
      setCode,
      currencyLabel: (c) => (language === "ar" ? c.nameAr : c.nameEn),
      formatPrice: (amountUsd) => formatApprox(amountUsd) ?? formatUsd(amountUsd),
      formatApprox,
      formatDual: (amountUsd) => {
        const approx = formatApprox(amountUsd);
        return approx ? `${formatUsd(amountUsd)} (${approx})` : formatUsd(amountUsd);
      },
    };
  }, [currencies, selected, language, setCode]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
