import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";

import { RentalProviderLoginForm } from "@/components/rental-provider/rental-provider-login-form";
import {
  RentalProviderSessionProvider,
  useRentalProviderSession,
  useRentalProviderToken,
} from "@/lib/rental-provider-session";
import { getRentalProviderProfile } from "@/lib/rental-provider";

export const Route = createFileRoute("/rental-provider")({
  component: () => (
    <RentalProviderSessionProvider>
      <RentalProviderLayout />
    </RentalProviderSessionProvider>
  ),
});

function RentalProviderLayout() {
  const { state, signOut } = useRentalProviderSession();
  const token = useRentalProviderToken();

  const profileQuery = useQuery({
    queryKey: ["rental-provider", "profile", token],
    queryFn: () => getRentalProviderProfile(token),
    enabled: state === "authorized",
    retry: false,
  });

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-sm text-muted-foreground">
        جاري التحقق...
      </div>
    );
  }

  if (state === "signed-out") {
    return <RentalProviderLoginForm />;
  }

  if (state === "not-provider") {
    return <RentalProviderLoginForm notProvider />;
  }

  const isCompany = profileQuery.data?.providerType === "company";
  const displayName = profileQuery.data?.companyName || profileQuery.data?.fullName;

  const navItems = [
    { to: "/rental-provider", label: "نظرة عامة", exact: true },
    { to: "/rental-provider/vehicles", label: "عرباتي" },
    { to: "/rental-provider/bookings", label: "الحجوزات" },
    ...(isCompany ? [{ to: "/rental-provider/team", label: "الأعضاء" }] : []),
  ];

  return (
    <div className="bg-mist/30 pb-16 pt-6 sm:pt-8">
      <div className="mx-auto max-w-5xl px-4">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-primary">بوابة مزوّد التأجير</h1>
            {displayName ? <p className="text-sm text-muted-foreground">{displayName}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.exact ?? false }}
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
