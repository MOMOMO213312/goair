import { Link } from "@tanstack/react-router";

import heroImage from "@/assets/hero-airport.jpg";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/language-context";

/** CTA banner routing agencies/airlines to the existing partner portal. */
export function BusinessPromoBanner() {
  const { t } = useTranslation();
  return (
    <section id="business" className="scroll-mt-20 py-14 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative isolate overflow-hidden rounded-2xl">
          <img
            src={heroImage}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className="absolute inset-0 -z-10 size-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-l from-primary/95 via-primary/85 to-primary/60" />

          <div className="max-w-lg px-6 py-10 sm:px-10 sm:py-14">
            <h2 className="font-display text-2xl font-extrabold text-primary-foreground sm:text-3xl">
              {t("businessPromoBanner.title")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
              {t("businessPromoBanner.description")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/agency">{t("businessPromoBanner.agencyCta")}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/partner">{t("businessPromoBanner.partnerCta")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
