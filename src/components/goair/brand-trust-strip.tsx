import { CreditCard, MapPinned, ShieldCheck, Users2, Wallet } from "lucide-react";

const STATS = [
  { icon: ShieldCheck, value: "آمن وموثوق", label: "سلامتك أولويتنا في كل رحلة" },
  { icon: Users2, value: "+10,000", label: "راكب وثق برحلته معانا" },
  { icon: MapPinned, value: "مصر ولبنان", label: "أهم المدن والمطارات" },
];

const PAYMENT_METHODS = ["Visa", "Mastercard", "Apple Pay", "الدفع كاش"];

/** Closing brand-trust band, just above the footer. */
export function BrandTrustStrip() {
  return (
    <section className="border-t border-border bg-mist/40 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-6 sm:grid-cols-3">
          {STATS.map((item) => (
            <div key={item.value} className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                <item.icon className="size-5" aria-hidden />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-primary">{item.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border/70 pt-6">
          <p className="text-xs font-bold text-muted-foreground">طرق دفع آمنة ومقبولة</p>
          <div className="flex flex-wrap items-center gap-2.5">
            {PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-bold text-primary"
              >
                {method === "Apple Pay" ? (
                  <Wallet className="size-3.5 text-muted-foreground" aria-hidden />
                ) : (
                  <CreditCard className="size-3.5 text-muted-foreground" aria-hidden />
                )}
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
