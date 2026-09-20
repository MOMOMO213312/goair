import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CalendarCheck, Car, LayoutDashboard, Users } from "lucide-react";

import { PortalShell, type PortalNavEntry } from "@/components/portal/portal-shell";
import { RentalProviderLoginForm } from "@/components/rental-provider/rental-provider-login-form";
import {
  RentalProviderSessionProvider,
  useRentalProviderSession,
  useRentalProviderToken,
} from "@/lib/rental-provider-session";
import { getRentalProviderProfile } from "@/lib/rental-provider";

export const Route = createFileRoute("/rental-provider")({
  component: () => (
    <RentalProviderSessionProvider>
      <RentalProviderLayout />
    </RentalProviderSessionProvider>
  ),
});

function RentalProviderLayout() {
  const { state, signOut } = useRentalProviderSession();
  const token = useRentalProviderToken();

  const profileQuery = useQuery({
    queryKey: ["rental-provider", "profile", token],
    queryFn: () => getRentalProviderProfile(token),
    enabled: state === "authorized",
    retry: false,
  });

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-sm text-muted-foreground">
        جاري التحقق...
      </div>
    );
  }

  if (state === "signed-out") {
    return <RentalProviderLoginForm />;
  }

  if (state === "not-provider") {
    return <RentalProviderLoginForm notProvider />;
  }

  const isCompany = profileQuery.data?.providerType === "company";
  const displayName = profileQuery.data?.companyName || profileQuery.data?.fullName;

  const nav: PortalNavEntry[] = [
    { to: "/rental-provider", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
    { to: "/rental-provider/vehicles", label: "عرباتي", icon: Car },
    { to: "/rental-provider/bookings", label: "الحجوزات", icon: CalendarCheck },
    ...(isCompany
      ? [{ to: "/rental-provider/team", label: "الأعضاء", icon: Users } satisfies PortalNavEntry]
      : []),
  ];

  return (
    <PortalShell
      theme="rental"
      portalLabel="بوابة مزوّد التأجير"
      roleLabel={isCompany ? "شركة تأجير" : "مزوّد تأجير"}
      userName={displayName}
      nav={nav}
      onSignOut={() => signOut()}
    >
      <Outlet />
    </PortalShell>
  );
}
