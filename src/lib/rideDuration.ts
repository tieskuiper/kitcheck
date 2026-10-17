import type { Intensity } from './kitLogic'
import type { GpxRoute } from './gpx'

// Typical flat-road speeds (km/h) per intensity for amateur road cyclists — only the
// starting point when the rider hasn't set their own speed and the GPX has no recorded
// time. Tune against the speed_kmh values from the GA4 speed_adjusted event.
export const INTENSITY_FLAT_SPEED: Record<Intensity, number> = {
  easy: 22, moderate: 26, hard: 30, race: 35,
}

export const SPEED_MIN_KMH = 10
export const SPEED_MAX_KMH = 45

export type SpeedSource = 'estimate' | 'recorded' | 'saved' | 'custom'

const clampSpeed = (kmh: number) => Math.min(SPEED_MAX_KMH, Math.max(SPEED_MIN_KMH, kmh))
const roundHalf = (n: number) => Math.round(n * 2) / 2

/**
 * Average speed over the whole route, like the "avg speed" riders know from Strava.
 * Estimate = flat speed for the intensity, slowed down by 5 min per 100 m of climbing.
 */
export function estimatedAvgSpeed(route: GpxRoute, int: Intensity): number {
  const hours = route.distanceKm / INTENSITY_FLAT_SPEED[int] + (route.elevationGainM / 100) * (5 / 60)
  return clampSpeed(roundHalf(route.distanceKm / hours))
}

export function recordedAvgSpeed(route: GpxRoute): number | undefined {
  if (!route.recordedMovingHours) return undefined
  return clampSpeed(roundHalf(route.distanceKm / route.recordedMovingHours))
}

/** Ride duration in hours, rounded to 5 minutes */
export function durationFor(route: GpxRoute, avgKmh: number): number {
  const hours = route.distanceKm / avgKmh
  return Math.max(0.25, Math.min(12, Math.round(hours * 12) / 12))
}

/** Starting speed for a freshly loaded route: recorded > the rider's own > estimate */
export function initialSpeed(route: GpxRoute, int: Intensity): { kmh: number; source: SpeedSource } {
  const recorded = recordedAvgSpeed(route)
  if (recorded) return { kmh: recorded, source: 'recorded' }
  const saved = loadSavedSpeed()
  if (saved) return { kmh: saved, source: 'saved' }
  return { kmh: estimatedAvgSpeed(route, int), source: 'estimate' }
}

// ── The rider's own speed, remembered in this browser only ───────────────────
// Functional preference the rider sets themselves → no consent needed (listed in the cookie policy)
const SPEED_KEY = 'kitcheck-speed'

export function loadSavedSpeed(): number | undefined {
  try {
    const v = Number(localStorage.getItem(SPEED_KEY))
    return v >= SPEED_MIN_KMH && v <= SPEED_MAX_KMH ? v : undefined
  } catch { return undefined }
}

export function saveSpeed(kmh: number | undefined) {
  try {
    if (kmh === undefined) localStorage.removeItem(SPEED_KEY)
    else localStorage.setItem(SPEED_KEY, String(kmh))
  } catch { /* storage blocked — the speed still applies to this visit */ }
}
