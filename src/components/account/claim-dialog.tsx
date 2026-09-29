import { useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { customerClaimByCode } from "@/lib/customer-account";
import { useTranslation } from "@/lib/i18n/language-context";

/** Links an existing ticket / rental / subscription code to the signed-in account. */
export function ClaimDialog({ trigger }: { trigger: ReactNode }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await customerClaimByCode(code);
      toast.success(t("account.claim.success"));
      await qc.invalidateQueries({ queryKey: ["customer"] });
      setCode("");
      setOpen(false);
    } catch {
      setError(t("account.claim.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{t("account.claim.title")}</DialogTitle>
            <DialogDescription>{t("account.claim.body")}</DialogDescription>
          </DialogHeader>
          <Input
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t("account.claim.placeholder")}
            dir="ltr"
            className="text-center font-bold tracking-wider"
          />
          {error ? (
            <p role="alert" className="text-sm font-semibold text-destructive">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button type="submit" disabled={busy || code.trim().length < 4}>
              {t("account.claim.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
