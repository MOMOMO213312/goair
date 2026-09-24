import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Route as RouteIcon,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import { OperatorLoginForm } from "@/components/operator/operator-login-form";
import { PortalShell, type PortalNavEntry } from "@/components/portal/portal-shell";
import { getOperatorDashboard } from "@/lib/operator";
import {
  OperatorSessionProvider,
  useOperatorSession,
  useOperatorToken,
} from "@/lib/operator-session";

export const Route = createFileRoute("/operator")({
  component: () => (
    <OperatorSessionProvider>
      <OperatorLayout />
    </OperatorSessionProvider>
  ),
});

const OPERATOR_NAV: PortalNavEntry[] = [
  { to: "/operator", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { to: "/operator/trips", label: "الرحلات المخصصة", icon: RouteIcon },
  { to: "/operator/fleet", label: "أسطولي", icon: Truck },
  { to: "/operator/statements", label: "كشوف الحساب", icon: Wallet },
  { to: "/operator/team", label: "الأعضاء", icon: Users },
];

function OperatorLayout() {
  const { state, signOut } = useOperatorSession();
  const token = useOperatorToken();
  // Same query key as the overview page, so this only costs one request.
  const dashboardQuery = useQuery({
    queryKey: ["operator-dashboard", token],
    queryFn: () => getOperatorDashboard(token),
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
    return <OperatorLoginForm />;
  }

  if (state === "not-operator") {
    return <OperatorLoginForm notOperator />;
  }

  return (
    <PortalShell
      theme="operator"
      portalLabel="بوابة شركة النقل"
      roleLabel="شركة نقل"
      userName={dashboardQuery.data?.name}
      nav={OPERATOR_NAV}
      onSignOut={() => signOut()}
    >
      <Outlet />
    </PortalShell>
  );
}
