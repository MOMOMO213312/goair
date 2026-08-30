import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { fetchActiveAnnouncements } from "@/lib/announcements";

/** Scrolling ticker of active admin-managed announcements, top of homepage. */
export function AnnouncementTicker() {
  const { data } = useQuery({
    queryKey: ["site-announcements"],
    queryFn: fetchActiveAnnouncements,
    refetchInterval: 5 * 60_000,
  });

  if (!data || data.length === 0) return null;
  const text = data.map((a) => a.message).join("      •      ");

  return (
    <div className="overflow-hidden border-b border-accent/30 bg-primary py-2 text-primary-foreground">
      <div className="flex items-center gap-2 whitespace-nowrap">
        <Megaphone className="mr-3 size-4 shrink-0 text-accent" aria-hidden />
        <div className="animate-[ticker_25s_linear_infinite] text-sm font-bold">
          {text}
          <span className="mx-8" />
          {text}
        </div>
      </div>
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
