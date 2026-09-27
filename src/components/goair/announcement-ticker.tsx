import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { fetchActiveAnnouncements } from "@/lib/announcements";
import { useTranslation } from "@/lib/i18n/language-context";
import { localize } from "@/lib/i18n/localize";
import { cn } from "@/lib/utils";

/**
 * Scrolling ticker of active admin-managed announcements, top of homepage.
 *
 * Previously this looped a CSS `infinite` animation unconditionally — even
 * when the announcement text was short enough to fit without scrolling, even
 * while the tab was in the background, and with no way to pause and read it.
 * That's the "بيقف نهائي" bug: an animation that never has a reason to stop.
 * Fixes:
 * - Only animates when the text actually overflows the bar; short
 *   announcements render static and centered instead of looping forever.
 * - Pauses while the browser tab is hidden (visibilitychange), so it isn't
 *   burning GPU/battery in the background.
 * - Pauses on hover/keyboard focus so people can actually read it.
 * - Respects prefers-reduced-motion.
 * - The duplicated text used for the seamless loop is aria-hidden so screen
 *   readers don't read the announcement twice.
 */
export function AnnouncementTicker() {
  const { language } = useTranslation();
  const { data } = useQuery({
    queryKey: ["site-announcements"],
    queryFn: fetchActiveAnnouncements,
    refetchInterval: 5 * 60_000,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);

  const text =
    data && data.length > 0
      ? data.map((a) => localize(a.message, a.messageEn, language)).join("      •      ")
      : "";

  // Re-measure whenever the text changes or the bar is resized (e.g. rotating
  // device, sidebar toggling) so we never animate content that already fits.
  useEffect(() => {
    if (!text || !containerRef.current || !textRef.current) {
      setIsOverflowing(false);
      return;
    }
    const container = containerRef.current;
    const el = textRef.current;
    const check = () => setIsOverflowing(el.scrollWidth > container.clientWidth);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(container);
    return () => observer.disconnect();
  }, [text]);

  useEffect(() => {
    const onVisibilityChange = () => setIsTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  if (!text) return null;

  const shouldAnimate = isOverflowing && isTabVisible;

  return (
    <div
      ref={containerRef}
      className="group overflow-hidden border-b border-accent/30 bg-primary py-2 text-primary-foreground"
    >
      <div
        className={cn(
          "flex items-center gap-2",
          isOverflowing ? "whitespace-nowrap" : "justify-center",
        )}
      >
        <Megaphone className="mr-3 size-4 shrink-0 text-accent" aria-hidden />
        <div
          ref={textRef}
          className={cn(
            "text-sm font-bold",
            isOverflowing && "whitespace-nowrap",
            shouldAnimate &&
              "animate-[ticker_25s_linear_infinite] motion-reduce:animate-none group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]",
          )}
        >
          {text}
          {isOverflowing ? (
            <>
              <span className="mx-8" />
              <span aria-hidden="true">{text}</span>
            </>
          ) : null}
        </div>
      </div>
      {isOverflowing ? (
        <style>{`
          @keyframes ticker {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
        `}</style>
      ) : null}
    </div>
  );
}
