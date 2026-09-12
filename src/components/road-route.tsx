/**
 * Decorative road-route line for rental/mobility pages — the ground
 * counterpart to `FlightPath` (used on the airport-transfer hero). Same
 * abstraction level (a single dashed path animated in via `draw-route`),
 * shaped as a winding road curving toward the horizon instead of a flight
 * arc.
 */
export function RoadRoute({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 120"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path
        d="M0 24C110 24 150 96 260 96C370 96 410 24 520 24C610 24 650 96 740 96C770 96 785 90 800 78"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="9 10"
        strokeLinecap="round"
      />
    </svg>
  );
}
