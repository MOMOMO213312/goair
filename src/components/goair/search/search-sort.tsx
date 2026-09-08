import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/language-context";

export type SortKey = "recommended" | "cheapest" | "earliest";

type SearchSortProps = {
  value: SortKey;
  onChange: (value: SortKey) => void;
  className?: string;
};

export function SearchSortDesktop({ value, onChange, className }: SearchSortProps) {
  const { t } = useTranslation();
  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "recommended", label: t("search.sort.recommended") },
    { key: "cheapest", label: t("search.sort.cheapest") },
    { key: "earliest", label: t("search.sort.earliest") },
  ];
  return (
    <div
      className={cn("hidden items-center gap-1 rounded-lg border border-border bg-secondary/40 p-1 lg:flex", className)}
      role="tablist"
      aria-label={t("search.filters.sortLabel")}
    >
      {SORT_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          role="tab"
          aria-selected={value === option.key}
          onClick={() => onChange(option.key)}
          className={cn(
            "rounded-md px-3 py-2 text-xs font-bold transition-colors sm:text-sm",
            value === option.key
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-background hover:text-primary",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function SearchSortMobile({ value, onChange, className }: SearchSortProps) {
  const { t } = useTranslation();
  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "recommended", label: t("search.sort.recommended") },
    { key: "cheapest", label: t("search.sort.cheapest") },
    { key: "earliest", label: t("search.sort.earliest") },
  ];
  return (
    <div className={cn("lg:hidden", className)}>
      <Select value={value} onValueChange={(v) => onChange(v as SortKey)}>
        <SelectTrigger className="h-10 w-full font-bold" aria-label={t("search.filters.sortLabel")}>
          <SelectValue placeholder={t("search.filters.sortPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.key} value={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
