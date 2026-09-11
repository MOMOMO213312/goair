import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { PartnerAuthError, PartnerLoading } from "@/components/partner/partner-shell";
import { PortalMembersPage } from "@/components/portal/portal-members-page";
import { getPartnerDashboard, isPartnerAuthError } from "@/lib/partner";
import { usePartnerToken } from "@/lib/partner-session";
import type { PortalType } from "@/lib/portal-members";

export const Route = createFileRoute("/partner/team")({
  head: () => ({
    meta: [{ title: "الأعضاء — بوابة الشركاء" }, { name: "robots", content: "noindex" }],
  }),
  component: PartnerTeamPage,
});

// بعد دمج بوابة الوكالات مع بوابة شركاء الطيران في بوابة واحدة (/partner)،
// الحساب اللي داخل ممكن يكون "airline" (شريك طيران) أو "agency" (وكالة سياحة) —
// وكل نوع منهم لسه متسجل في جدول portal_members بـ entity_type مختلف
// ("partner" للطيران، "agency" للوكالات). لازم نعرف نوع الحساب الأول قبل
// ما نكلم نظام إدارة الأعضاء، وإلا هيفشل بخطأ تسجيل دخول لأصحاب الوكالات.
function PartnerTeamPage() {
  const token = usePartnerToken();

  const dashboardQuery = useQuery({
    queryKey: ["partner-dashboard", token],
    queryFn: () => getPartnerDashboard(token),
    retry: false,
  });

  if (dashboardQuery.isPending) return <PartnerLoading />;
  if (dashboardQuery.isError) {
    return isPartnerAuthError(dashboardQuery.error) ? (
      <PartnerAuthError />
    ) : (
      <PartnerAuthError message="حصل خطأ مؤقت." />
    );
  }

  const portalType: PortalType =
    dashboardQuery.data?.partnerType === "agency" ? "agency" : "partner";

  return <PortalMembersPage portalType={portalType} token={token} />;
}
