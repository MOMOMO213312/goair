import { Coins } from "lucide-react";

import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n/language-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Display-currency picker. Only changes how prices are SHOWN — the amount due stays in USD.
 * Renders nothing until the rates have loaded (or if they fail), so the site degrades to USD.
 */
export function CurrencySwitcher({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { currencies, code, setCode, currencyLabel } = useCurrency();

  if (currencies.length < 2) return null;

  return (
    <Select value={code} onValueChange={setCode}>
      <SelectTrigger
        className={`h-9 w-auto gap-1.5 border-0 bg-transparent px-2 font-bold shadow-none ${className ?? ""}`}
        aria-label={t("currencySwitcher.label")}
      >
        <Coins className="size-4" aria-hidden />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.code} — {currencyLabel(c)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
