import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showTokenLogin, setShowTokenLogin] = useState(false);
  const [tokenValue, setTokenValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("البريد أو كلمة السر غلط.");
      setLoading(false);
      return;
    }
    // GroundHandlingSessionProvider listens to onAuthStateChange and will
    // re-check automatically — no need to navigate manually here.
  }

  async function handleTokenSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenValue.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await getGroundHandlingDashboard(tokenValue.trim());
      onSignedIn(tokenValue.trim());
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
        {invalid ? "الجلسة انتهت. سجّل دخولك تاني." : "سجّل دخولك بحساب شركتك."}
      </p>

      {!showTokenLogin ? (
        <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="gh-email">البريد الإلكتروني</Label>
            <Input
              id="gh-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gh-password">كلمة السر</Label>
            <Input
              id="gh-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm font-bold text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "بيتحقق..." : "دخول"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setShowTokenLogin(true);
              setError(null);
            }}
            className="w-full text-center text-xs font-bold text-muted-foreground underline"
          >
            عندك رمز دخول بدل كده؟
          </button>
        </form>
      ) : (
        <form onSubmit={handleTokenSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="gh-token">رمز الدخول</Label>
            <Input
              id="gh-token"
              type="text"
              required
              value={tokenValue}
              onChange={(e) => setTokenValue(e.target.value)}
              autoComplete="off"
              dir="ltr"
            />
          </div>
          {error && <p className="text-sm font-bold text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "بيتحقق..." : "دخول"}
          </Button>
          <button
            type="button"
            onClick={() => {
              setShowTokenLogin(false);
              setError(null);
            }}
            className="w-full text-center text-xs font-bold text-muted-foreground underline"
          >
            الدخول بالبريد وكلمة السر
          </button>
        </form>
      )}
    </div>
  );
}
