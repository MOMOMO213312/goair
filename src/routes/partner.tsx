import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarPlus,
  ClipboardList,
  FileText,
  LayoutDashboard,
  PackageSearch,
  ScrollText,
  Sparkles,
  Users,
} from "lucide-react";

import { PartnerLoginForm } from "@/components/partner/partner-login-form";
import { PartnerAuthError, PartnerLoading } from "@/components/partner/partner-shell";
import { PortalShell, type PortalNavEntry } from "@/components/portal/portal-shell";
import { getPartnerDashboard } from "@/lib/partner";
import { PartnerSessionProvider, usePartnerSession, usePartnerToken } from "@/lib/partner-session";

export const Route = createFileRoute("/partner")({
  component: () => (
    <PartnerSessionProvider>
      <PartnerLayout />
    </PartnerSessionProvider>
  ),
});

const PARTNER_NAV: PortalNavEntry[] = [
  { to: "/partner", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { to: "/partner/book", label: "احجز لعميل", icon: CalendarPlus },
  { to: "/partner/bookings", label: "الحجوزات", icon: ClipboardList },
  { to: "/partner/services", label: "خدماتك", icon: PackageSearch },
  { to: "/partner/subscriptions", label: "الاشتراكات", icon: Sparkles },
  { to: "/partner/statements", label: "كشوف الحساب", icon: ScrollText },
  { to: "/partner/capacity", label: "التوقعات", icon: BarChart3 },
  { to: "/partner/terms", label: "شروط الشراكة", icon: FileText },
  { to: "/partner/team", label: "الأعضاء", icon: Users },
];

function PartnerLayout() {
  const { state, signOut } = usePartnerSession();
  const token = usePartnerToken();
  const query = useQuery({
    queryKey: ["partner-dashboard", token],
    queryFn: () => getPartnerDashboard(token),
    retry: false,
    enabled: state === "authorized",
  });

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-sm text-muted-foreground">
        جاري التحقق...
      </div>
    );
  }

  if (state === "signed-out") {
    return <PartnerLoginForm />;
  }

  if (state === "not-partner") {
    return <PartnerLoginForm notPartner />;
  }

  if (query.isPending) {
    return (
      <div className="bg-mist/30 py-20">
        <PartnerLoading />
      </div>
    );
  }
  if (query.isError || !query.data) return <PartnerAuthError />;

  const isAgency = query.data.partnerType === "agency";

  return (
    <PortalShell
      theme="partner"
      portalLabel={isAgency ? "بوابة وكالات السياحة" : "بوابة شركاء الطيران"}
      roleLabel={isAgency ? "وكالة سياحة" : "شركة طيران"}
      userName={query.data.partnerName}
      nav={PARTNER_NAV}
      onSignOut={() => signOut()}
    >
      <Outlet />
    </PortalShell>
  );
}
