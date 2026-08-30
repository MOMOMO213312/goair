import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";

import {
  PartnerAuthError,
  PartnerDashboardShell,
  PartnerLoading,
} from "@/components/partner/partner-shell";
import { getPartnerDashboard } from "@/lib/partner";

export const Route = createFileRoute("/partner")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" && search["token"] ? String(search["token"]) : "",
  }),
  component: PartnerLayout,
});

function PartnerLayout() {
  const { token } = Route.useSearch();
  const query = useQuery({
    queryKey: ["partner-dashboard", token],
    queryFn: () => getPartnerDashboard(token),
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
        <PartnerLoading />
      </div>
    );
  }
  if (query.isError || !query.data) return <PartnerAuthError />;

  return (
    <PartnerDashboardShell token={token} data={query.data}>
      <Outlet />
    </PartnerDashboardShell>
  );
}
