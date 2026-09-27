import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "@/lib/i18n/language-context";

const DISMISS_KEY = "goair-install-banner-dismissed-at";
const DISMISS_DAYS = 14;

// Chrome/Edge/Android fire this event; it's not yet in lib.dom.d.ts.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  if (typeof window === "undefined") return true;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function wasDismissedRecently() {
  if (typeof window === "undefined") return false;
  const raw = window.localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  if (Number.isNaN(dismissedAt)) return false;
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
  return daysSince < DISMISS_DAYS;
}

/**
 * Slim, dismissible "install this as an app" banner. Shown only on mobile web
 * (not already installed, not recently dismissed). Uses the native install
 * prompt on Android/Chrome; falls back to Share-sheet instructions on iOS,
 * which has no programmatic install API.
 */
export function InstallAppBanner() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setDismissed(wasDismissedRecently() || isStandalone());
    setIos(isIOS());

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  const canShow = isMobile && !dismissed && (ios || deferredPrompt);
  if (!canShow) return null;

  return (
    <div
      data-site-chrome
      className="fixed inset-x-3 z-40 rounded-2xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-float)] md:hidden"
      style={{ bottom: "calc(64px + env(safe-area-inset-bottom, 0px))" }}
      role="region"
      aria-label={t("installBanner.title")}
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Download className="size-4.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-foreground">{t("installBanner.title")}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {ios && !deferredPrompt ? t("installBanner.iosBody") : t("installBanner.androidBody")}
          </p>
          {!ios || deferredPrompt ? (
            <Button size="sm" className="mt-2 h-8" onClick={install}>
              {t("installBanner.install")}
            </Button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t("installBanner.dismiss")}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
