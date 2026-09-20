import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  Building2,
  Car,
  ClipboardList,
  FileText,
  Handshake,
  Inbox,
  LayoutDashboard,
  Megaphone,
  Package,
  PackagePlus,
  PlaneTakeoff,
  Sparkles,
  Tag,
  Truck,
  Users,
} from "lucide-react";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { PortalShell, type PortalNavEntry } from "@/components/portal/portal-shell";
import { AdminSessionProvider, useAdminSession } from "@/lib/admin-session";

export const Route = createFileRoute("/admin")({
  component: () => (
    <AdminSessionProvider>
      <AdminLayout />
    </AdminSessionProvider>
  ),
});

const ADMIN_NAV: PortalNavEntry[] = [
  { to: "/admin/overview", label: "نظرة عامة", icon: LayoutDashboard },
  { to: "/admin", label: "الحجوزات", icon: ClipboardList, exact: true },
  { heading: "التشغيل" },
  { to: "/admin/fleet", label: "السائقين والعربيات", icon: Truck },
  { to: "/admin/ground-handling", label: "التشغيل الأرضي", icon: PlaneTakeoff },
  { to: "/admin/requests", label: "الطلبات والتواصل", icon: Inbox },
  { heading: "التسعير والمنتجات" },
  { to: "/admin/pricing", label: "الأسعار", icon: Tag },
  { to: "/admin/packages", label: "الباقات", icon: Package },
  { to: "/admin/addon-services", label: "الخدمات الإضافية", icon: PackagePlus },
  { to: "/admin/subscription-plans", label: "خطط الاشتراك", icon: Sparkles },
  { heading: "الشركاء" },
  { to: "/admin/partners", label: "الوكالات والشركاء", icon: Handshake },
  { to: "/admin/rental-partners", label: "مزوّدو التأجير", icon: Building2 },
  { to: "/admin/rental-applications", label: "طلبات تأجير السيارات", icon: FileText },
  { to: "/admin/rental-vehicles", label: "عربيات التأجير", icon: Car },
  { heading: "النظام" },
  { to: "/admin/announcements", label: "الإشعارات", icon: Megaphone },
  { to: "/admin/team", label: "فريق العمل", icon: Users },
];

function AdminLayout() {
  const { state, signOut } = useAdminSession();

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-sm text-muted-foreground">
        جاري التحقق...
      </div>
    );
  }

  if (state === "signed-out") {
    return <AdminLoginForm />;
  }

  if (state === "not-staff") {
    return <AdminLoginForm notStaff />;
  }

  return (
    <PortalShell
      theme="admin"
      portalLabel="لوحة تشغيل GoAir"
      roleLabel="إدارة المنصة"
      userName="فريق GoAir"
      nav={ADMIN_NAV}
      onSignOut={() => signOut()}
    >
      <Outlet />
    </PortalShell>
  );
}
