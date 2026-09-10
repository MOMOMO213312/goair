import { createFileRoute } from "@tanstack/react-router";

import { PortalMembersPage } from "@/components/portal/portal-members-page";
import { useAgencyToken } from "@/lib/agency-session";

export const Route = createFileRoute("/agency/team")({
  head: () => ({
    meta: [{ title: "الأعضاء — بوابة وكالة السياحة" }, { name: "robots", content: "noindex" }],
  }),
  component: AgencyTeamPage,
});

function AgencyTeamPage() {
  const token = useAgencyToken();
  return <PortalMembersPage portalType="agency" token={token} />;
}
