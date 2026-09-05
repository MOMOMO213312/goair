import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AgencyLoginForm } from "@/components/agency/agency-login-form";
import {
  AgencyAuthError,
  AgencyDashboardShell,
  AgencyLoading,
} from "@/components/agency/agency-shell";
import { getAgencyDashboard } from "@/lib/agency";
import { AgencySessionProvider, useAgencySession, useAgencyToken } from "@/lib/agency-session";

export const Route = createFileRoute("/agency")({
  component: () => (
    <AgencySessionProvider>
      <AgencyLayout />
    </AgencySessionProvider>
  ),
});

function AgencyLayout() {
  const { state, signOut } = useAgencySession();
  const token = useAgencyToken();
  const query = useQuery({
    queryKey: ["agency-dashboard", token],
    queryFn: () => getAgencyDashboard(token),
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
    return <AgencyLoginForm />;
  }

  if (state === "not-agency") {
    return <AgencyLoginForm notAgency />;
  }

  if (query.isPending) {
    return (
      <div className="bg-mist/30 py-20">
        <AgencyLoading />
      </div>
    );
  }
  if (query.isError || !query.data) return <AgencyAuthError />;

  return (
    <AgencyDashboardShell data={query.data}>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => signOut()}
          className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-muted"
        >
          خروج
        </button>
      </div>
      <Outlet />
    </AgencyDashboardShell>
  );
}
