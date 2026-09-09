import { CreditCard, Loader2 } from "lucide-react";

import { PaymentAfterNote } from "@/components/goair/payment/payment-after-note";
import { PaymentProofUpload } from "@/components/goair/payment/payment-proof-upload";
import { PaymentTrustNote } from "@/components/goair/payment/payment-trust-note";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PaymentMethod } from "@/lib/goair";
import { useTranslation } from "@/lib/i18n/language-context";
import { localize } from "@/lib/i18n/localize";
import { cn } from "@/lib/utils";

type PaymentMethodsFormProps = {
  formId: string;
  ticket: string;
  methods: PaymentMethod[];
  methodsLoading: boolean;
  selectedMethod: string;
  reference: string;
  busy: boolean;
  onMethodChange: (value: string) => void;
  onReferenceChange: (value: string) => void;
  onProofUploaded: (url: string) => void;
  onProofCleared: () => void;
  onSubmit: (event: React.FormEvent) => void;
  showSubmitButton?: boolean;
  className?: string;
};

export function PaymentMethodsForm({
  formId,
  ticket,
  methods,
  methodsLoading,
  selectedMethod,
  reference,
  busy,
  onMethodChange,
  onReferenceChange,
  onProofUploaded,
  onProofCleared,
  onSubmit,
  showSubmitButton = true,
  className,
}: PaymentMethodsFormProps) {
  const { t, language } = useTranslation();
  const selected = methods.find((item) => item.method === selectedMethod);
  const selectedDetails = selected?.details ? localize(selected.details, selected.details_en, language) : null;

  return (
    <Card className={cn("border-border/80 p-5 shadow-[var(--shadow-card)] sm:p-6", className)}>
      <h2 className="font-display text-lg font-extrabold text-primary">{t("payment.methodsForm.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("payment.methodsForm.subtitle")}</p>

      <form id={formId} onSubmit={onSubmit} className="mt-6 space-y-6">
        <div className="space-y-3">
          {methodsLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" aria-label={t("payment.methodsForm.loadingAria")} />
            </div>
          ) : methods.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              {t("payment.methodsForm.noMethods")}
            </p>
          ) : (
            <RadioGroup
              value={selectedMethod}
              onValueChange={onMethodChange}
              className="gap-3"
              aria-label={t("payment.methodsForm.chooseMethodAria")}
            >
              {methods.map((item) => {
                const itemLabel = item.label ? localize(item.label, item.label_en, language) : item.method;
                const itemDetails = item.details ? localize(item.details, item.details_en, language) : null;
                return (
                  <label
                    key={item.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 transition-colors",
                      "hover:border-accent/40 hover:bg-accent/5",
                      "has-[[data-state=checked]]:border-accent has-[[data-state=checked]]:bg-accent/5 has-[[data-state=checked]]:shadow-sm",
                    )}
                  >
                    <RadioGroupItem value={item.method} className="mt-0.5" id={`method-${item.id}`} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <CreditCard className="size-4 shrink-0 text-accent" aria-hidden />
                        <span className="block font-display text-sm font-bold text-primary">
                          {itemLabel}
                        </span>
                      </span>
                      {itemDetails && selectedMethod !== item.method ? (
                        <span className="mt-1.5 line-clamp-2 block text-xs text-muted-foreground">
                          {itemDetails}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          )}
        </div>

        {selectedDetails ? (
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
            <p className="font-display text-sm font-bold text-primary">{t("payment.methodsForm.instructionsTitle")}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {selectedDetails}
            </p>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="reference" className="font-medium">
            {t("payment.methodsForm.referenceLabel")}{" "}
            <span className="text-xs text-muted-foreground">{t("payment.methodsForm.optional")}</span>
          </Label>
          <Input
            id="reference"
            value={reference}
            onChange={(event) => onReferenceChange(event.target.value)}
            placeholder={t("payment.methodsForm.referencePlaceholder")}
            className="h-11"
            autoComplete="off"
          />
        </div>

        <PaymentProofUpload
          ticket={ticket}
          onUploaded={onProofUploaded}
          onCleared={onProofCleared}
        />

        <PaymentAfterNote />
        <PaymentTrustNote />

        {showSubmitButton ? (
          <Button
            type="submit"
            size="lg"
            disabled={busy || methods.length === 0}
            className="hidden h-12 w-full bg-accent text-base font-bold text-accent-foreground hover:bg-accent/90 md:flex lg:hidden"
          >
            {busy ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden />
                {t("payment.methodsForm.confirming")}
              </>
            ) : (
              t("payment.methodsForm.submitButton")
            )}
          </Button>
        ) : null}
      </form>
    </Card>
  );
}
