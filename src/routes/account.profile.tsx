import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ListSkeleton, PageTitle } from "@/components/account/account-ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  customerDeleteAccount,
  customerDeletePassenger,
  customerGetProfile,
  customerListPassengers,
  customerSavePassenger,
  customerSignOut,
  customerUpdateProfile,
  updateOwnPassword,
  type SavedPassenger,
} from "@/lib/customer-account";
import { useLanguage, useTranslation } from "@/lib/i18n/language-context";

export const Route = createFileRoute("/account/profile")({
  component: ProfilePage,
});

const errMsg = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PersonalForm() {
  const { t } = useTranslation();
  const { setLanguage } = useLanguage();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["customer", "profile"], queryFn: customerGetProfile });
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!q.data) return;
    setFullName(q.data.fullName ?? "");
    setPhone(q.data.phoneNumber ?? "");
    setLang(q.data.preferredLanguage);
    setMarketing(q.data.marketingOptIn);
  }, [q.data]);

  const save = useMutation({
    mutationFn: () =>
      customerUpdateProfile({
        fullName,
        phoneNumber: phone,
        preferredLanguage: lang,
        marketingOptIn: marketing,
      }),
    onSuccess: async () => {
      toast.success(t("account.profile.saved"));
      await qc.invalidateQueries({ queryKey: ["customer", "profile"] });
    },
    onError: (err) => toast.error(errMsg(err, t("account.common.error"))),
  });

  if (q.isPending) return <ListSkeleton rows={1} />;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="grid gap-4 sm:grid-cols-2"
    >
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="p-email">{t("account.profile.email")}</Label>
        <Input id="p-email" value={q.data?.email ?? ""} readOnly disabled dir="ltr" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-name">{t("account.profile.fullName")}</Label>
        <Input
          id="p-name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          maxLength={120}
          autoComplete="name"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="p-phone">{t("account.profile.phone")}</Label>
        <Input
          id="p-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={30}
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t("account.profile.language")}</Label>
        <div className="flex gap-2">
          {(["ar", "en"] as const).map((l) => (
            <Button
              key={l}
              type="button"
              size="sm"
              variant={lang === l ? "default" : "outline"}
              onClick={() => {
                setLang(l);
                setLanguage(l);
              }}
            >
              {l === "ar" ? "العربية" : "English"}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Switch id="p-marketing" checked={marketing} onCheckedChange={setMarketing} />
        <Label htmlFor="p-marketing" className="cursor-pointer">
          {t("account.profile.marketing")}
        </Label>
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={save.isPending}>
          {t("account.common.save")}
        </Button>
      </div>
    </form>
  );
}

function Passengers() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["customer", "passengers"], queryFn: customerListPassengers });
  const [editing, setEditing] = useState<Partial<SavedPassenger> | null>(null);
  const [toDelete, setToDelete] = useState<SavedPassenger | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["customer", "passengers"] });

  const save = useMutation({
    mutationFn: (p: Partial<SavedPassenger>) =>
      customerSavePassenger({
        id: p.id ?? null,
        fullName: p.fullName ?? "",
        phoneNumber: p.phoneNumber ?? "",
        relation: p.relation ?? "",
      }),
    onSuccess: async () => {
      setEditing(null);
      await refresh();
    },
    onError: (err) => toast.error(errMsg(err, t("account.common.error"))),
  });

  const remove = useMutation({
    mutationFn: (id: string) => customerDeletePassenger(id),
    onSuccess: async () => {
      setToDelete(null);
      await refresh();
    },
    onError: (err) => toast.error(errMsg(err, t("account.common.error"))),
  });

  return (
    <>
      {q.isPending ? (
        <ListSkeleton rows={1} />
      ) : (q.data ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("account.profile.noPassengers")}</p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {q.data!.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{p.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[p.relation, p.phoneNumber].filter(Boolean).join(" • ")}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={t("account.common.edit")}
                  onClick={() => setEditing(p)}
                >
                  <Pencil className="size-4" aria-hidden />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={t("account.common.delete")}
                  onClick={() => setToDelete(p)}
                >
                  <Trash2 className="size-4 text-destructive" aria-hidden />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-3 gap-1.5"
        onClick={() => setEditing({})}
      >
        <Plus className="size-4" aria-hidden />
        {t("account.profile.addPassenger")}
      </Button>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editing) save.mutate(editing);
            }}
            className="space-y-4"
          >
            <DialogHeader>
              <DialogTitle>
                {editing?.id ? t("account.common.edit") : t("account.profile.addPassenger")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="sp-name">{t("account.profile.passengerName")}</Label>
              <Input
                id="sp-name"
                required
                minLength={2}
                maxLength={120}
                value={editing?.fullName ?? ""}
                onChange={(e) => setEditing((p) => ({ ...p, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-phone">{t("account.profile.passengerPhone")}</Label>
              <Input
                id="sp-phone"
                maxLength={30}
                inputMode="tel"
                dir="ltr"
                value={editing?.phoneNumber ?? ""}
                onChange={(e) => setEditing((p) => ({ ...p, phoneNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sp-rel">{t("account.profile.passengerRelation")}</Label>
              <Input
                id="sp-rel"
                maxLength={40}
                value={editing?.relation ?? ""}
                onChange={(e) => setEditing((p) => ({ ...p, relation: e.target.value }))}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={save.isPending}>
                {t("account.common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{toDelete?.fullName}</AlertDialogTitle>
            <AlertDialogDescription>{t("account.profile.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("account.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (toDelete) remove.mutate(toDelete.id);
              }}
            >
              {t("account.common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PasswordForm() {
  const { t } = useTranslation();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) {
      toast.error(t("account.login.errPasswordShort"));
      return;
    }
    setBusy(true);
    try {
      await updateOwnPassword(pw);
      toast.success(t("account.profile.passwordUpdated"));
      setPw("");
    } catch (err) {
      toast.error(errMsg(err, t("account.common.error")));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div className="min-w-56 flex-1 space-y-1.5">
        <Label htmlFor="new-pw">{t("account.profile.newPassword")}</Label>
        <Input
          id="new-pw"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          dir="ltr"
        />
      </div>
      <Button type="submit" variant="outline" disabled={busy || pw.length === 0}>
        {t("account.profile.updatePassword")}
      </Button>
    </form>
  );
}

function DangerZone() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const del = useMutation({
    mutationFn: customerDeleteAccount,
    onSuccess: () => {
      toast.success(t("account.profile.deleted"));
      void navigate({ to: "/" });
    },
    onError: (err) => {
      setOpen(false);
      toast.error(errMsg(err, t("account.common.error")));
    },
  });

  return (
    <>
      <p className="text-sm text-muted-foreground">{t("account.profile.dangerBody")}</p>
      <Button
        type="button"
        variant="outline"
        className="mt-3 text-destructive"
        onClick={() => setOpen(true)}
      >
        {t("account.profile.deleteBtn")}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("account.profile.danger")}</AlertDialogTitle>
            <AlertDialogDescription>{t("account.profile.deleteConfirm")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("account.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                del.mutate();
              }}
              disabled={del.isPending}
            >
              {t("account.profile.deleteBtn")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ProfilePage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-5">
      <PageTitle title={t("account.profile.title")} subtitle={t("account.profile.subtitle")} />
      <Section title={t("account.profile.personal")}>
        <PersonalForm />
      </Section>
      <Section title={t("account.profile.passengers")} hint={t("account.profile.passengersHint")}>
        <Passengers />
      </Section>
      <Section title={t("account.profile.security")} hint={t("account.profile.securityHint")}>
        <PasswordForm />
      </Section>
      <Section title={t("account.profile.danger")}>
        <DangerZone />
      </Section>
      <Button
        type="button"
        variant="ghost"
        className="gap-2 md:hidden"
        onClick={() => void customerSignOut()}
      >
        <LogOut className="size-4" aria-hidden />
        {t("account.nav.signOut")}
      </Button>
    </div>
  );
}
