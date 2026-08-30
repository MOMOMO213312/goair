import { AlertTriangle } from "lucide-react";

import { Card } from "@/components/ui/card";

type LegalDraftNoticeProps = {
  text: string;
};

/** Prominent "this is a draft, needs lawyer review" banner for /privacy and /terms. */
export function LegalDraftNotice({ text }: LegalDraftNoticeProps) {
  return (
    <Card className="mb-8 flex items-start gap-3 border-accent/40 bg-accent/5 p-4">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
      <p className="text-sm leading-relaxed text-primary">{text}</p>
    </Card>
  );
}
