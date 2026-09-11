import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { useTranslation } from "@/lib/i18n/language-context";

// Same terminal photo already used in the hero carousel — proven asset,
// on-brand for the page's closing beat.
const CTA_IMAGE =
  "https://images.unsplash.com/photo-1642035148715-7cc0c7538904?q=80&w=1920&auto=format&fit=crop";

/**
 * "جاهز تتحرك؟" — the page's single closing beat, separate from the hero's
 * opening headline so the homepage doesn't just trail off after the last
 * content section into the B2B banner.
 */
export function FinalCtaSection() {
  const { t } = useTranslation();
  return (
    <section className="relative isolate overflow-hidden">
      <img src={CTA_IMAGE} alt="" loading="lazy" className="absolute inset-0 -z-10 size-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/95 via-ink/80 to-ink/60" />

      <div className="goair-container goair-section text-center">
        <h2 className="font-display text-2xl font-extrabold text-primary-foreground sm:text-4xl">
          {t("finalCta.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
          {t("finalCta.subtitle")}
        </p>
        <Link
          to="/"
          hash="find-your-ride"
          className="mt-7 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-base font-bold text-accent-foreground transition-colors hover:bg-accent/90"
        >
          {t("finalCta.cta")}
          <ArrowLeft className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
