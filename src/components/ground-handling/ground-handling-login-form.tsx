import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

export function GroundHandlingLoginForm({ notGroundHandling = false }: { notGroundHandling?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
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

  return (
    <div className="mx-auto max-w-sm px-4 py-24">
      <h1 className="font-display text-xl font-bold text-primary text-center">
        بوابة شركاء التشغيل الأرضي
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {notGroundHandling
          ? "الحساب ده مش مربوط بشريك تشغيل أرضي مفعّل. كلم فريق GoAir يضيفلك صلاحية."
          : "سجّل دخولك بحساب شركتك."}
      </p>

      {!notGroundHandling && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">كلمة السر</Label>
            <Input
              id="password"
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
        </form>
      )}
    </div>
  );
}
