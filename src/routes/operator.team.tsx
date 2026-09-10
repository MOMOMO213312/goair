import { createFileRoute } from "@tanstack/react-router";

import { PortalMembersPage } from "@/components/portal/portal-members-page";
import { useOperatorToken } from "@/lib/operator-session";

export const Route = createFileRoute("/operator/team")({
  head: () => ({
    meta: [{ title: "الأعضاء — بوابة شركة النقل" }, { name: "robots", content: "noindex" }],
  }),
  component: OperatorTeamPage,
});

function OperatorTeamPage() {
  const token = useOperatorToken();
  return <PortalMembersPage portalType="operator" token={token} />;
}
