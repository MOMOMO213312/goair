import { MapPin } from "lucide-react";

import { FlightPath } from "@/components/flight-path";
import { cn } from "@/lib/utils";

type DestinationPlaceholderProps = {
  destination: string;
  className?: string;
};

/**
 * Brand-consistent gradient palette. A destination without a real photo
 * gets a deterministic pick from this set (by name hash) — so a grid of
 * 20 destination cards shows a mix of tones instead of the exact same
 * gray gradient repeated 20 times, while still using only design tokens
 * (no fabricated photography).
 */
const PALETTE = [
  "from-secondary to-mist",
  "from-primary/15 to-mist",
  "from-accent/20 to-secondary",
  "from-mist to-accent/10",
  "from-secondary to-primary/10",
] as const;

function paletteFor(destination: string): string {
  let hash = 0;
  for (let i = 0; i < destination.length; i++) {
    hash = (hash * 31 + destination.charCodeAt(i)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

export function DestinationPlaceholder({ destination, className }: DestinationPlaceholderProps) {
  return (
    <div
      className={cn(
        "relative flex aspect-[16/10] flex-col items-center justify-center overflow-hidden bg-gradient-to-br",
        paletteFor(destination),
        className,
      )}
    >
      <FlightPath className="absolute inset-x-4 top-4 h-8 text-primary/15" />
      <span className="relative flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MapPin className="size-5" />
      </span>
      <p className="relative mt-2 max-w-[85%] truncate px-2 text-center text-xs font-bold text-primary/70">
        {destination}
      </p>
    </div>
  );
}
