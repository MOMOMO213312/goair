import { Link } from "@tanstack/react-router";
import { Home, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmationActionsProps = {
  ticket: string;
  className?: string;
};

export function ConfirmationActions({ ticket, className }: ConfirmationActionsProps) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row", className)}>
      <Button
        asChild
        size="lg"
        className="h-12 flex-1 bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90"
      >
        <Link to="/my-bookings" search={{ ticket }}>
          عرض حجوزاتي
        </Link>
      </Button>
      <Button asChild variant="outline" size="lg" className="h-12 flex-1 font-bold">
        <Link to="/">
          <Home className="size-4" aria-hidden />
          العودة للرئيسية
        </Link>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="h-12 font-bold sm:w-auto print:hidden"
        onClick={() => window.print()}
      >
        <Printer className="size-4" aria-hidden />
        طباعة التذكرة
      </Button>
    </div>
  );
}
