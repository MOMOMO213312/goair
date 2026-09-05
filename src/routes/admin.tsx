import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { AdminSessionProvider, useAdminSession } from "@/lib/admin-session";

export const Route = createFileRoute("/admin")({
  component: () => (
    <AdminSessionProvider>
      <AdminLayout />
    </AdminSessionProvider>
  ),
});

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
    <div className="bg-mist/30 pb-16 pt-6 sm:pt-8">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-extrabold text-primary">لوحة تشغيل GoAir</h1>
          <div className="flex items-center gap-2">
            <nav className="flex gap-2">
              <Link
                to="/admin"
                activeOptions={{ exact: true }}
                className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
              >
                الحجوزات
              </Link>
              <Link
                to="/admin/fleet"
                className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
              >
                السائقين والعربيات
              </Link>
              <Link
                to="/admin/requests"
                className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
              >
                الطلبات والتواصل
              </Link>
              <Link
                to="/admin/announcements"
                className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
              >
                الإشعارات
              </Link>
              <Link
                to="/admin/packages"
                className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
              >
                الباقات
              </Link>
            </nav>
            <button
              onClick={() => signOut()}
              className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground hover:bg-muted"
            >
              خروج
            </button>
          </div>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
