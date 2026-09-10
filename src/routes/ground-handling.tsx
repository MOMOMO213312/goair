import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGroundHandlingDashboard, isGroundHandlingAuthError } from "@/lib/ground-handling";
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
  const { state, signIn, signOut } = useGroundHandlingSession();

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center text-sm text-muted-foreground">
        جاري التحقق...
      </div>
    );
  }

  if (state === "signed-out" || state === "invalid") {
    return <GroundHandlingLoginForm invalid={state === "invalid"} onSignedIn={signIn} />;
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

function GroundHandlingLoginForm({
  invalid,
  onSignedIn,
}: {
  invalid: boolean;
  onSignedIn: (token: string) => void;
}) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await getGroundHandlingDashboard(value.trim());
      onSignedIn(value.trim());
    } catch (err) {
      setError(
        isGroundHandlingAuthError(err)
          ? "رمز الدخول غير صحيح أو الحساب غير مفعّل."
          : "حصل خطأ مؤقت. حاول تاني.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-24">
      <h1 className="font-display text-xl font-bold text-primary text-center">
        بوابة شركاء التشغيل الأرضي
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {invalid
          ? "الرمز المحفوظ بقى غير صالح. سجّل دخولك تاني برمز الدخول اللي وصلك من GoAir."
          : "ادخل رمز الدخول اللي وصلك من فريق GoAir."}
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="gh-token">رمز الدخول</Label>
          <Input
            id="gh-token"
            type="text"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            dir="ltr"
          />
        </div>
        {error && <p className="text-sm font-bold text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "بيتحقق..." : "دخول"}
        </Button>
      </form>
    </div>
  );
}
