/**
 * GOAIR hourly departure schedule — business layer.
 *
 * Transfer departures run on a fixed hourly operating window (an intentional
 * GOAIR operating rule, not fabricated availability). The window is
 * CONFIGURABLE per route and per market so GOAIR can run 06:00–22:00,
 * 08:00–20:00 or 24-hour service without an application change:
 *
 *   trip.service_start_time / service_end_time / departure_interval_minutes
 *     ↳ falls back to launch_markets.<same columns> (market default)
 *       ↳ falls back to the platform default below.
 *
 * Availability is NEVER invented here: the slots produced by this module are
 * always joined against real `schedules` rows and real remaining capacity by
 * `get_schedule_availability` (or the readable catalog tables). A sold-out
 * departure stays in the list and is marked unavailable.
 */

/** Platform default operating window, used only when neither trip nor market configures one. */
export const DEFAULT_SERVICE_START = "06:00";
export const DEFAULT_SERVICE_END = "22:00";
export const DEFAULT_INTERVAL_MINUTES = 60;

export type ServiceWindow = {
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  enabled: boolean;
};

/** Anything carrying the optional schedule-configuration columns (trip or market row). */
export type ScheduleConfigSource = {
  service_start_time?: string | null;
  service_end_time?: string | null;
  departure_interval_minutes?: number | null;
  hourly_service_enabled?: boolean | null;
} | null | undefined;

function normalizeTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || hours < 0 || hours > 23) return null;
  if (!Number.isFinite(minutes) || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":");
  return Number(h) * 60 + Number(m);
}

/**
 * Effective operating window: route config wins, then market config, then the
 * platform default. A 24-hour route is configured as 00:00 → 23:00.
 */
export function resolveServiceWindow(
  trip: ScheduleConfigSource,
  market?: ScheduleConfigSource,
): ServiceWindow {
  const startTime =
    normalizeTime(trip?.service_start_time) ??
    normalizeTime(market?.service_start_time) ??
    DEFAULT_SERVICE_START;
  const endTime =
    normalizeTime(trip?.service_end_time) ??
    normalizeTime(market?.service_end_time) ??
    DEFAULT_SERVICE_END;

  const rawInterval = trip?.departure_interval_minutes ?? market?.departure_interval_minutes ?? null;
  const parsedInterval = Number(rawInterval);
  const intervalMinutes =
    Number.isFinite(parsedInterval) && parsedInterval >= 5 && parsedInterval <= 720
      ? Math.floor(parsedInterval)
      : DEFAULT_INTERVAL_MINUTES;

  const enabled = trip?.hourly_service_enabled ?? market?.hourly_service_enabled ?? true;

  return { startTime, endTime, intervalMinutes, enabled: enabled !== false };
}

/**
 * Departure times inside the configured window, inclusive of both ends.
 * 06:00–22:00 at 60 minutes → 06:00, 07:00, … , 22:00.
 */
export function generateDepartureTimes(window: ServiceWindow): string[] {
  if (!window.enabled) return [];

  const start = toMinutes(window.startTime);
  const end = toMinutes(window.endTime);
  if (end < start) return [];

  const times: string[] = [];
  for (let minutes = start; minutes <= end; minutes += window.intervalMinutes) {
    const h = String(Math.floor(minutes / 60) % 24).padStart(2, "0");
    const m = String(minutes % 60).padStart(2, "0");
    times.push(`${h}:${m}`);
    // Safety valve: never emit an unbounded list.
    if (times.length >= 96) break;
  }
  return times;
}

/** Compare two departure times regardless of "HH:MM" vs "HH:MM:SS" storage. */
export function sameDeparture(a: string, b: string): boolean {
  return a.slice(0, 5) === b.slice(0, 5);
}
