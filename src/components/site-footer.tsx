import { Link } from "@tanstack/react-router";
import { Plane } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletter } from "@/lib/goair";

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubscribe(event: React.FormEvent) {
    event.preventDefault();
    if (!email.includes("@")) {
      toast.error("اكتب بريد إلكتروني صحيح.");
      return;
    }
    setBusy(true);
    try {
      await subscribeNewsletter(email);
      setEmail("");
      toast.success("تم تسجيلك في القائمة البريدية.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "لم نتمكن من تسجيل بريدك.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <footer className="mt-24 bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-accent">
              <Plane className="size-5 -rotate-45" />
            </span>
            <span className="font-display text-xl font-extrabold">GoAir</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-primary-foreground/75">
            نقل مشترك من وإلى المطارات في مصر ولبنان — سعر ثابت، مواعيد معروفة، ومندوب باسمك في
            صالة الوصول.
          </p>
          <form onSubmit={onSubscribe} className="mt-6 flex max-w-sm gap-2">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="بريدك الإلكتروني"
              className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/50"
            />
            <Button type="submit" disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90">
              اشترك
            </Button>
          </form>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold">GoAir</h3>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/75">
            <li><Link to="/my-bookings">حجوزاتي</Link></li>
            <li><Link to="/partner">برامج الشراكات</Link></li>
            <li><Link to="/contact">تواصل معنا</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold">سياسات</h3>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/75">
            <li>
              <Link to="/faq" className="transition-colors hover:text-primary-foreground">
                الأسئلة الشائعة
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="transition-colors hover:text-primary-foreground">
                سياسة الخصوصية
              </Link>
            </li>
            <li>
              <Link to="/terms" className="transition-colors hover:text-primary-foreground">
                الشروط والأحكام
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15 py-5 text-center text-xs text-primary-foreground/60">
        © {new Date().getFullYear()} GoAir — Hand on the land, eye on the sky.
      </div>
    </footer>
  );
}