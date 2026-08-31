import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" && search["token"] ? String(search["token"]) : "",
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { token } = Route.useSearch();

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-xl font-bold text-primary">لوحة تشغيل GoAir</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          الصفحة دي داخلية لفريق GoAir بس. محتاج رابط بالتوكن الخاص بيك.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-mist/30 pb-16 pt-6 sm:pt-8">
      <div className="mx-auto max-w-6xl px-4">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-extrabold text-primary">لوحة تشغيل GoAir</h1>
          <nav className="flex gap-2">
            <Link
              to="/admin"
              search={{ token }}
              activeOptions={{ exact: true }}
              className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
            >
              الحجوزات
            </Link>
            <Link
              to="/admin/fleet"
              search={{ token }}
              className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
            >
              السائقين والعربيات
            </Link>
            <Link
              to="/admin/requests"
              search={{ token }}
              className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
            >
              الطلبات والتواصل
            </Link>
            <Link
              to="/admin/announcements"
              search={{ token }}
              className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
            >
              الإشعارات
            </Link>
            <Link
              to="/admin/packages"
              search={{ token }}
              className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
            >
              الباقات
            </Link>
          </nav>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
