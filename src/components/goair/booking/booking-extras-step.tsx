import { Check, Luggage, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PackageTier } from "@/lib/goair";
import { formatUsd } from "@/lib/goair";
import { cn } from "@/lib/utils";

type BookingExtrasStepProps = {
  packages: PackageTier[];
  packagesLoading: boolean;
  selectedPackageId: string | null;
  onSelectPackage: (id: string | null) => void;
  luggage: number;
  onLuggageChange: (value: number) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  onContinue: () => void;
  className?: string;
};

export function BookingExtrasStep({
  packages,
  packagesLoading,
  selectedPackageId,
  onSelectPackage,
  luggage,
  onLuggageChange,
  notes,
  onNotesChange,
  onContinue,
  className,
}: BookingExtrasStepProps) {
  return (
    <Card className={cn("border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6", className)}>
      <h2 className="font-display text-lg font-extrabold text-primary">إضافات على رحلتك</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        اختياري — تقدر تكمل من غير أي إضافة.
      </p>

      {/* Package add-ons */}
      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={() => onSelectPackage(null)}
          className={cn(
            "flex w-full items-center justify-between gap-3 rounded-xl border p-4 text-start transition-colors",
            selectedPackageId === null
              ? "border-accent bg-accent/5"
              : "border-border/80 hover:border-accent/40",
          )}
        >
          <div>
            <p className="font-display text-sm font-bold text-primary">من غير إضافات</p>
            <p className="mt-0.5 text-xs text-muted-foreground">النقل بس، بالسعر الأساسي</p>
          </div>
          {selectedPackageId === null ? (
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Check className="size-3.5" aria-hidden />
            </span>
          ) : null}
        </button>

        {packagesLoading ? (
          <div className="h-16 animate-pulse rounded-xl bg-secondary/50" />
        ) : (
          packages.map((pkg) => {
            const isSelected = selectedPackageId === pkg.id;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => onSelectPackage(pkg.id)}
                className={cn(
                  "flex w-full items-start justify-between gap-3 rounded-xl border p-4 text-start transition-colors",
                  isSelected ? "border-accent bg-accent/5" : "border-border/80 hover:border-accent/40",
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Sparkles className="size-3.5" aria-hidden />
                    </span>
                    <p className="font-display text-sm font-bold text-primary">{pkg.name}</p>
                    {pkg.isHighlighted ? (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                        الأكثر طلبًا
                      </span>
                    ) : null}
                  </div>
                  {pkg.tagline ? (
                    <p className="mt-1 text-xs text-muted-foreground">{pkg.tagline}</p>
                  ) : null}
                  {pkg.features.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {pkg.features.slice(0, 3).map((feature) => (
                        <li key={feature} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                          <Check className="mt-0.5 size-3 shrink-0 text-accent" aria-hidden />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="shrink-0 text-end">
                  <p className="font-display text-base font-extrabold text-accent">
                    +{formatUsd(pkg.priceUsd)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">للمقعد</p>
                  {isSelected ? (
                    <span className="mt-2 flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Check className="size-3.5" aria-hidden />
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Luggage stepper */}
      <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-border/80 p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
            <Luggage className="size-4" aria-hidden />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-primary">عدد الشنط</p>
            <p className="text-xs text-muted-foreground">حقيبة كبيرة لكل مقعد + شنطة يد</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onLuggageChange(Math.max(0, luggage - 1))}
            className="flex size-8 items-center justify-center rounded-full border border-border text-lg font-bold text-primary hover:bg-secondary"
            aria-label="تقليل عدد الشنط"
          >
            −
          </button>
          <span className="w-6 text-center font-display font-extrabold text-primary">{luggage}</span>
          <button
            type="button"
            onClick={() => onLuggageChange(Math.min(20, luggage + 1))}
            className="flex size-8 items-center justify-center rounded-full border border-border text-lg font-bold text-primary hover:bg-secondary"
            aria-label="زيادة عدد الشنط"
          >
            +
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6 space-y-2">
        <Label htmlFor="extras-notes" className="font-medium">
          ملاحظات <span className="text-xs text-muted-foreground">(اختياري)</span>
        </Label>
        <Textarea
          id="extras-notes"
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="كرسي أطفال، مساعدة في الشنط…"
          rows={3}
          className="resize-none"
        />
      </div>

      <Button
        type="button"
        size="lg"
        onClick={onContinue}
        className="mt-6 h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90"
      >
        متابعة لبيانات المسافر
      </Button>
    </Card>
  );
}
