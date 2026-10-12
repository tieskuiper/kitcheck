/**
 * Route-aware weather: the forecast at each point of a GPX route, for the moment the
 * rider gets there — instead of the start point's forecast for the whole ride.
 */
import { haversineKm, type GpxRoute } from './gpx'
import type { HourWeather } from './kitLogic'

export interface RoutePoint { km: number; lat: number; lon: number; ele?: number }

export interface RouteSample extends HourWeather {
  km: number
  offsetH: number      // hours after the start
  ele?: number
}

export interface RouteHighlights {
  /** Coldest point, only when clearly colder than the start */
  coldest?: { km: number; offsetH: number; apparentTemp: number; ele?: number }
  /** First point where rain becomes likely, only when it isn't at the start already */
  rain?: { km: number; offsetH: number; precipProb: number }
}

// About one point every 15–20 minutes of riding; capped to keep the request small
const STEP_KM = 6
const MAX_POINTS = 24

/**
 * Evenly spaced points along the route by distance, always including start, finish and
 * the highest point (on hilly routes the summit decides what you need to wear)
 */
export function sampleRoute(route: GpxRoute): RoutePoint[] {
  const pts = route.points
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + haversineKm(pts[i - 1], pts[i]))
  const total = cum[cum.length - 1]
  const at = (i: number): RoutePoint => ({ km: (cum[i] / (total || 1)) * route.distanceKm, lat: pts[i].lat, lon: pts[i].lon, ele: pts[i].ele })

  const n = Math.min(MAX_POINTS, Math.max(2, Math.ceil(route.distanceKm / STEP_KM) + 1))
  const indices = new Set<number>()
  let j = 0
  for (let t = 0; t < n; t++) {
    const target = (total * t) / (n - 1)
    while (j < pts.length - 1 && cum[j] < target) j++
    indices.add(j)
  }

  let top = -1
  pts.forEach((p, i) => { if (p.ele !== undefined && (top < 0 || p.ele > pts[top].ele!)) top = i })
  if (top >= 0) indices.add(top)

  return [...indices].sort((a, b) => a - b).map(at)
}

/**
 * Weather at each route point at the time the rider passes it.
 * Arrival times follow from the ride duration (constant average speed).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function routeWeather(forecasts: any[], points: RoutePoint[], distanceKm: number,
  dayIndex: number, startHour: number, durationH: number): RouteSample[] {
  const samples: RouteSample[] = []
  points.forEach((pt, i) => {
    const fc = forecasts[i]
    if (!fc) return
    const offsetH = distanceKm > 0 ? (pt.km / distanceKm) * durationH : 0
    const at = dayIndex * 24 + startHour + offsetH
    const h0 = Math.floor(at), frac = at - h0
    const hr = fc.hourly
    if (h0 + 1 >= hr.time.length) return   // beyond the 7-day forecast
    const lerp = (key: string) => hr[key][h0] + (hr[key][h0 + 1] - hr[key][h0]) * frac
    samples.push({
      km: pt.km, offsetH, ele: pt.ele,
      apparentTemp: Math.round(lerp('apparent_temperature')),
      windspeed:    Math.round(lerp('windspeed_10m')),
      precipProb:   Math.max(hr.precipitation_probability[h0] ?? 0, hr.precipitation_probability[h0 + 1] ?? 0),
    })
  })
  return samples
}

/**
 * Collapse route samples into one entry per ride hour for the kit logic:
 * the coldest feel, strongest wind and highest rain chance seen in that hour.
 */
export function hourlyFromRoute(samples: RouteSample[], durationH: number): HourWeather[] {
  const hours = Math.max(1, Math.ceil(durationH))
  const out: HourWeather[] = []
  for (let h = 0; h < hours; h++) {
    const inHour = samples.filter(s => s.offsetH >= h && (s.offsetH < h + 1 || h === hours - 1))
    const pool = inHour.length ? inHour : [nearest(samples, h + 0.5)]
    out.push({
      apparentTemp: Math.min(...pool.map(s => s.apparentTemp)),
      windspeed:    Math.max(...pool.map(s => s.windspeed)),
      precipProb:   Math.max(...pool.map(s => s.precipProb)),
    })
  }
  return out
}

export function routeHighlights(samples: RouteSample[]): RouteHighlights {
  if (samples.length < 2) return {}
  const start = samples[0]
  const result: RouteHighlights = {}

  const coldest = samples.reduce((a, b) => (b.apparentTemp < a.apparentTemp ? b : a))
  if (start.apparentTemp - coldest.apparentTemp >= 2) {
    result.coldest = { km: coldest.km, offsetH: coldest.offsetH, apparentTemp: coldest.apparentTemp, ele: coldest.ele }
  }

  if (start.precipProb < 50) {
    const wet = samples.find(s => s.precipProb >= 50)
    if (wet) result.rain = { km: wet.km, offsetH: wet.offsetH, precipProb: wet.precipProb }
  }
  return result
}

function nearest(samples: RouteSample[], offsetH: number): RouteSample {
  return samples.reduce((a, b) => (Math.abs(b.offsetH - offsetH) < Math.abs(a.offsetH - offsetH) ? b : a))
}

