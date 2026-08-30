export function FlightPath({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 120"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path
        d="M0 104C140 104 240 12 400 12C560 12 660 104 800 104"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="9 10"
        strokeLinecap="round"
      />
    </svg>
  );
}