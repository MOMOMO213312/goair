import { createFileRoute } from "@tanstack/react-router";

import { PortalMembersPage } from "@/components/portal/portal-members-page";
import { usePartnerToken } from "@/lib/partner-session";

export const Route = createFileRoute("/partner/team")({
  head: () => ({
    meta: [{ title: "الأعضاء — بوابة شريك الطيران" }, { name: "robots", content: "noindex" }],
  }),
  component: PartnerTeamPage,
});

function PartnerTeamPage() {
  const token = usePartnerToken();
  return <PortalMembersPage portalType="partner" token={token} />;
}
