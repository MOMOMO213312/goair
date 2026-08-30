import { Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/goair/empty-state";
import { Button } from "@/components/ui/button";

export function ConfirmationNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <EmptyState
        icon={SearchX}
        title="لم نتمكن من العثور على بيانات الحجز"
        description="تأكد من فتح رابط التأكيد الصحيح أو تواصل مع فريق GoAir."
      />
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="outline" className="font-bold">
          <Link to="/my-bookings">البحث عن حجز</Link>
        </Button>
        <Button asChild className="bg-accent font-bold text-accent-foreground hover:bg-accent/90">
          <Link to="/">العودة للرئيسية</Link>
        </Button>
      </div>
    </div>
  );
}
