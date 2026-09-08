import { SlidersHorizontal } from "lucide-react";

import { SearchFiltersPanel, type SearchFiltersState } from "@/components/goair/search/search-filters-panel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Trip } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";

type SearchFiltersSheetProps = {
  trip: Trip | undefined;
  country: string;
  airportCode: string;
  priceFloor: number;
  priceCeiling: number;
  activeMaxPrice: number;
  filters: SearchFiltersState;
  onMaxPriceChange: (value: number) => void;
  onReset: () => void;
  activeFilterCount: number;
};

export function SearchFiltersSheet(props: SearchFiltersSheetProps) {
  const { t } = useTranslation();
  const { activeFilterCount, onReset, ...panelProps } = props;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full gap-2 font-bold lg:hidden"
          aria-label={t("search.filters.title")}
        >
          <SlidersHorizontal className="size-4" />
          {t("search.filters.title")}
          {activeFilterCount > 0 ? (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
              {activeFilterCount}
            </span>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="font-display text-right">{t("search.filters.title")}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 pb-6">
          <SearchFiltersPanel {...panelProps} showReset={false} />
          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full font-bold"
            onClick={onReset}
          >
            {t("search.filters.clearFilters")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
