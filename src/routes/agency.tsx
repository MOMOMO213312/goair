import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";

import {
  AgencyAuthError,
  AgencyDashboardShell,
  AgencyLoading,
} from "@/components/agency/agency-shell";
import { getAgencyDashboard } from "@/lib/agency";

export const Route = createFileRoute("/agency")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" && search["token"] ? String(search["token"]) : "",
  }),
  component: AgencyLayout,
});

function AgencyLayout() {
  const { token } = Route.useSearch();
  const query = useQuery({
    queryKey: ["agency-dashboard", token],
    queryFn: () => getAgencyDashboard(token),
    retry: false,
    enabled: Boolean(token),
  });

  if (!token) {
    return (
      <section className="bg-mist/30">
        <Outlet />
      </section>
    );
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
    <AgencyDashboardShell token={token} data={query.data}>
      <Outlet />
    </AgencyDashboardShell>
  );
}
