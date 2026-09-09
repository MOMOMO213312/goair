import { createFileRoute } from "@tanstack/react-router";

import { LegalDraftNotice } from "@/components/goair/legal/legal-draft-notice";
import { SectionHeader } from "@/components/goair/section-header";
import { Card } from "@/components/ui/card";
import { privacyContent, type LegalBlock } from "@/lib/i18n/legal-content";
import { useTranslation } from "@/lib/i18n/language-context";
import { translations, DEFAULT_LANGUAGE } from "@/lib/i18n/translations";

const pageMeta = translations[DEFAULT_LANGUAGE].privacyPage.meta;

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: pageMeta.title },
      { name: "description", content: pageMeta.description },
      { property: "og:title", content: pageMeta.title },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrivacyPage,
});

function Block({ block }: { block: LegalBlock }) {
  if (block.type === "list") {
    return (
      <ul className="list-inside list-disc space-y-1.5">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  return <p>{block.text}</p>;
}

function PrivacyPage() {
  const { t, language } = useTranslation();
  const sections = privacyContent[language];

  return (
    <div className="bg-mist/30 pb-16 pt-10 sm:pt-14">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeader title={t("privacyPage.title")} description={t("privacyPage.lastUpdated")} />

        <LegalDraftNotice text={t("privacyPage.draftNotice")} />

        <Card className="p-6 sm:p-8">
          {sections.map((section) => (
            <section key={section.title} className="mt-8 first:mt-0">
              <h2 className="font-display text-lg font-extrabold text-primary">{section.title}</h2>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                {section.blocks.map((block, index) => (
                  <Block key={index} block={block} />
                ))}
              </div>
            </section>
          ))}
        </Card>
      </div>
    </div>
  );
}
