import { createFileRoute, Link } from "@tanstack/react-router";

import { SectionHeader } from "@/components/goair/section-header";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqContent } from "@/lib/i18n/faq-content";
import { useTranslation } from "@/lib/i18n/language-context";
import { translations, DEFAULT_LANGUAGE } from "@/lib/i18n/translations";

const pageMeta = translations[DEFAULT_LANGUAGE].faqPage.meta;

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: pageMeta.title },
      {
        name: "description",
        content: pageMeta.description,
      },
      { property: "og:title", content: pageMeta.title },
      { property: "og:description", content: pageMeta.ogDescription },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  const { t, language } = useTranslation();
  const groups = faqContent[language];

  return (
    <div className="bg-mist/30 pb-16 pt-10 sm:pt-14">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeader title={t("faqPage.title")} description={t("faqPage.subtitle")} />

        <div className="mt-8 space-y-8">
          {groups.map((group) => (
            <div key={group.title}>
              <h2 className="font-display text-lg font-extrabold text-primary">{group.title}</h2>
              <Accordion type="single" collapsible className="mt-3">
                {group.items.map((item, index) => (
                  <AccordionItem key={item.q} value={`${group.title}-${index}`}>
                    <AccordionTrigger className="text-right font-display font-bold text-primary">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="leading-relaxed text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          {t("faqPage.noAnswer")}{" "}
          <Link to="/contact" search={{ package: undefined }} className="font-bold text-accent hover:underline">
            {t("faqPage.contactCta")}
          </Link>
        </p>
      </div>
    </div>
  );
}
