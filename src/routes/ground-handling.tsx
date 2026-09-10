import { createFileRoute, Outlet } from "@tanstack/react-router";

import { GroundHandlingLoginForm } from "@/components/ground-handling/ground-handling-login-form";
import { Button } from "@/components/ui/button";
import {
  GroundHandlingSessionProvider,
  useGroundHandlingSession,
} from "@/lib/ground-handling-session";

export const Route = createFileRoute("/ground-handling")({
  head: () => ({
    meta: [{ title: "بوابة شركاء التشغيل الأرضي — GoAir" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <GroundHandlingSessionProvider>
      <GroundHandlingLayout />
    </GroundHandlingSessionProvider>
  ),
});

function GroundHandlingLayout() {
  const { state, signOut } = useGroundHandlingSession();

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-sm text-muted-foreground">
        جاري التحقق...
      </div>
    );
  }

  if (state === "signed-out") {
    return <GroundHandlingLoginForm />;
  }

  if (state === "not-ground-handling") {
    return <GroundHandlingLoginForm notGroundHandling />;
  }

  return (
    <div className="bg-mist/30 pb-16 pt-6 sm:pt-8">
      <div className="mx-auto max-w-4xl px-4">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="font-display text-2xl font-extrabold text-primary">بوابة التشغيل الأرضي</h1>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            خروج
          </Button>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
