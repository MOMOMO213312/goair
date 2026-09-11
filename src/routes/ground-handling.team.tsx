import { createFileRoute } from "@tanstack/react-router";

import { PortalMembersPage } from "@/components/portal/portal-members-page";
import { useGroundHandlingToken } from "@/lib/ground-handling-session";

export const Route = createFileRoute("/ground-handling/team")({
  head: () => ({
    meta: [
      { title: "الأعضاء — بوابة GOAIR للخدمات الأرضية" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GroundHandlingTeamPage,
});

// دي حسابات الدخول للوحة نفسها (owner/member) — مختلفة عن صفحة "الموظفون"
// (ground_handling_staff) اللي بتمثل موظفي التشغيل على الأرض اللي بيتسندلهم طلبات.
function GroundHandlingTeamPage() {
  const token = useGroundHandlingToken();
  if (!token) return null;
  return <PortalMembersPage portalType="ground_handling" token={token} />;
}
