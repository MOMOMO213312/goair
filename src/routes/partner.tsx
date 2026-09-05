import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";

import { PartnerLoginForm } from "@/components/partner/partner-login-form";
import {
  PartnerAuthError,
  PartnerDashboardShell,
  PartnerLoading,
} from "@/components/partner/partner-shell";
import { getPartnerDashboard } from "@/lib/partner";
import { PartnerSessionProvider, usePartnerSession, usePartnerToken } from "@/lib/partner-session";

export const Route = createFileRoute("/partner")({
  component: () => (
    <PartnerSessionProvider>
      <PartnerLayout />
    </PartnerSessionProvider>
  ),
});

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

  return (
    <PartnerDashboardShell data={query.data}>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => signOut()}
          className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-muted"
        >
          خروج
        </button>
      </div>
      <Outlet />
    </PartnerDashboardShell>
  );
}
