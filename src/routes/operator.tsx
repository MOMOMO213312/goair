import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { OperatorLoginForm } from "@/components/operator/operator-login-form";
import { OperatorSessionProvider, useOperatorSession } from "@/lib/operator-session";

export const Route = createFileRoute("/operator")({
  component: () => (
    <OperatorSessionProvider>
      <OperatorLayout />
    </OperatorSessionProvider>
  ),
});

function OperatorLayout() {
  const { state, signOut } = useOperatorSession();

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-sm text-muted-foreground">
        جاري التحقق...
      </div>
    );
  }

  if (state === "signed-out") {
    return <OperatorLoginForm />;
  }

  if (state === "not-operator") {
    return <OperatorLoginForm notOperator />;
  }

  return (
    <div className="bg-mist/30 pb-16 pt-6 sm:pt-8">
      <div className="mx-auto max-w-5xl px-4">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-extrabold text-primary">بوابة شركة النقل</h1>
          <div className="flex flex-wrap items-center gap-2">
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
                  activeOptions={{ exact: item.exact }}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-bold text-muted-foreground data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground"
                >
                  {item.label}
                </Link>
              ))}
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
