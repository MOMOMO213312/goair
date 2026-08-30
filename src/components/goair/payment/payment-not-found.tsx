import { Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/goair/empty-state";
import { Button } from "@/components/ui/button";

export function PaymentNotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <EmptyState
        icon={SearchX}
        title="مش لاقيين الحجز ده"
        description="راجع كود التذكرة وحاول تاني، أو تواصل مع الدعم."
      />
      <Button asChild variant="outline" className="mt-6 font-bold">
        <Link to="/my-bookings">البحث عن حجز</Link>
      </Button>
    </div>
  );
}
