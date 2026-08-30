import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatUsd } from "@/lib/goair";
import { cn } from "@/lib/utils";

type BookingMobileCtaProps = {
  formId: string;
  total: number;
  busy: boolean;
  className?: string;
};

export function BookingMobileCta({ formId, total, busy, className }: BookingMobileCtaProps) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-4 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-sm md:hidden",
        className,
      )}
    >
      <div className="mx-auto flex max-w-lg items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">الإجمالي</p>
          <p className="font-display text-xl font-extrabold text-accent">{formatUsd(total)}</p>
        </div>
        <Button
          type="submit"
          form={formId}
          size="lg"
          disabled={busy}
          className="h-12 min-w-[9rem] flex-1 bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90"
        >
          {busy ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              جاري التجهيز...
            </>
          ) : (
            "متابعة الحجز"
          )}
        </Button>
      </div>
    </div>
  );
}
