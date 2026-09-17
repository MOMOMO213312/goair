import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CircleDot, Navigation, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateDriverLocation } from "@/lib/goair";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/driver-track")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: String(search["token"] ?? ""),
  }),
  head: () => ({
    meta: [{ title: "مشاركة موقع السائق — GoAir" }],
  }),
  component: DriverTrackPage,
});

// Post at most this often, no matter how fast watchPosition fires — a
// phone's GPS can report several times a second, and the customer side
// only needs a fresh pin every few seconds, not a live firehose.
const MIN_POST_INTERVAL_MS = 8_000;

function DriverTrackPage() {
  const { token } = Route.useSearch();
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastPostRef = useRef(0);

  function stopSharing() {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setSharing(false);
  }

  function startSharing() {
    if (!token) {
      setError("رابط التتبع ده غير صالح — تأكد من الرابط اللي بعتهولك فريق GoAir.");
      return;
    }
    if (!("geolocation" in navigator)) {
      setError("متصفحك مش بيدعم تحديد الموقع.");
      return;
    }
    setError(null);
    setSharing(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastPostRef.current < MIN_POST_INTERVAL_MS) return;
        lastPostRef.current = now;
        updateDriverLocation(
          token,
          position.coords.latitude,
          position.coords.longitude,
          position.coords.heading,
          position.coords.speed != null ? position.coords.speed * 3.6 : null,
        )
          .then(() => setLastSentAt(new Date()))
          .catch((err) => {
            setError(err instanceof Error ? err.message : "حصل خطأ في إرسال الموقع.");
            stopSharing();
          });
      },
      (geoError) => {
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "لازم توافق على إذن الموقع عشان تقدر تشارك موقعك مع العميل."
            : "مش قادرين نحدد موقعك دلوقتي — تأكد إن الـGPS مفعّل.",
        );
        stopSharing();
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 20_000 },
    );
  }

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col items-center justify-center px-4 py-12 text-center">
      <Card className="w-full rounded-2xl p-6 shadow-[var(--shadow-card)]">
        <span
          className={cn(
            "mx-auto flex size-16 items-center justify-center rounded-full",
            sharing ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary",
          )}
        >
          <Navigation className="size-7" aria-hidden />
        </span>

        <h1 className="mt-4 font-display text-lg font-extrabold text-primary">
          مشاركة موقعك مع عميل GoAir
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          خليك على الصفحة دي وموقعك هيتحدث تلقائي — من غير ما تحتاج تسجّل دخول أو تنزّل أي تطبيق.
        </p>

        {error ? (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm font-bold text-destructive">
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}

        {sharing ? (
          <>
            <p className="mt-5 flex items-center justify-center gap-1.5 text-sm font-bold text-accent">
              <CircleDot className="size-3.5 animate-pulse" aria-hidden />
              جاري مشاركة موقعك
            </p>
            {lastSentAt ? (
              <p className="mt-1 text-xs text-muted-foreground">
                آخر تحديث: {lastSentAt.toLocaleTimeString("ar-EG")}
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">بنستنى أول إشارة GPS...</p>
            )}
            <Button
              variant="outline"
              onClick={stopSharing}
              className="mt-5 w-full gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              <Square className="size-4" aria-hidden />
              إيقاف المشاركة
            </Button>
          </>
        ) : (
          <Button
            onClick={startSharing}
            size="lg"
            className="mt-5 w-full bg-accent font-bold text-accent-foreground hover:bg-accent/90"
          >
            <Navigation className="size-4" aria-hidden />
            بدء مشاركة الموقع
          </Button>
        )}
      </Card>
    </div>
  );
}
