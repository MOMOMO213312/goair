import { createFileRoute } from "@tanstack/react-router";

import { PortalMembersPage } from "@/components/portal/portal-members-page";
import { useRentalProviderToken } from "@/lib/rental-provider-session";

export const Route = createFileRoute("/rental-provider/team")({
  head: () => ({
    meta: [{ title: "الأعضاء — بوابة مزوّد التأجير" }, { name: "robots", content: "noindex" }],
  }),
  component: RentalProviderTeamPage,
});

function RentalProviderTeamPage() {
  const token = useRentalProviderToken();
  return <PortalMembersPage portalType="rental" token={token} />;
}
