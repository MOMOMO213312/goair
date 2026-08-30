import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/operator")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" && search["token"] ? String(search["token"]) : "",
  }),
  component: OperatorLayout,
});

function OperatorLayout() {
  const { token } = Route.useSearch();
  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-xl font-bold text-primary">بوابة شركة النقل الشريكة</h1>
        <p className="mt-2 text-sm text-muted-foreground">الصفحة دي محتاجة رابط بالتوكن الخاص بشركتك.</p>
      </div>
    );
  }
  return (
    <div className="bg-mist/30 pb-16 pt-6 sm:pt-8">
      <div className="mx-auto max-w-5xl px-4">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-extrabold text-primary">بوابة شركة النقل</h1>
          <nav className="flex flex-wrap gap-2">
            {[
              { to: "/operator", label: "نظرة عامة", exact: true },
              { to: "/operator/trips", label: "الرحلات المخصصة" },
              { to: "/operator/fleet", label: "أسطولي" },
              { to: "/operator/statements", label: "كشوف الحساب" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                search={{ token }}
                activeOptions={{ exact: item.exact }}
                className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
