import type { Intensity } from './kitLogic'
import type { GpxRoute } from './gpx'

// Average cycling speeds (km/h) per intensity, used for duration estimation
export const INTENSITY_SPEED: Record<Intensity, number> = {
  easy: 18, moderate: 23, hard: 28, race: 33,
}

// Estimate ride duration (hours) from GPX route + intensity
export function estimateRideDuration(route: GpxRoute, int: Intensity): number {
  const speed = INTENSITY_SPEED[int]
  // Base time from distance + 5 min per 100m elevation gain
  const hours = route.distanceKm / speed + (route.elevationGainM / 100) * (5 / 60)
  return Math.max(0.5, Math.min(8, Math.round(hours * 2) / 2))
}
