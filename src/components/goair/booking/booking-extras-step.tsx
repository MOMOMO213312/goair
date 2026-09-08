import { Luggage } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type BookingExtrasStepProps = {
  luggage: number;
  onLuggageChange: (value: number) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  onContinue: () => void;
  className?: string;
};

export function BookingExtrasStep({
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
