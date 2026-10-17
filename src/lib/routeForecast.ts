/**
 * Route-aware weather: the forecast at each point of a GPX route, for the moment the
 * rider gets there — instead of the start point's forecast for the whole ride.
 * Also works out the wind relative to the riding direction and where the long descents are.
 */
import { haversineKm, type GpxRoute } from './gpx'
import { RAIN_LIKELY } from './kitLogic'
import type { HourWeather } from './kitLogic'

export interface RoutePoint {
  km: number; lat: number; lon: number; ele?: number
  bearing: number      // riding direction at this point, degrees (0 = north)
}

export interface RouteSample extends HourWeather {
  km: number
  offsetH: number      // hours after the start
  ele?: number
  /** Wind along the riding direction, km/h: positive = headwind, negative = tailwind */
  headwind: number
  windDirection: number
}

export interface Descent { fromKm: number; toKm: number; dropM: number }

export interface RouteHighlights {
  /** Coldest point, only when clearly colder than the start */
  coldest?: { km: number; offsetH: number; apparentTemp: number; ele?: number }
  /** First point where rain becomes likely, only when it isn't at the start already */
  rain?: { km: number; offsetH: number; precipProb: number }
  /** Longest stretch of real headwind */
  headwind?: { fromKm: number; toKm: number; offsetH: number; kmh: number }
  /** Biggest descent, only when it's cool enough to feel it */
  descent?: Descent & { offsetH: number; apparentTemp: number }
}

/** Precomputed once per uploaded route */
export interface RouteModel {
  points: RoutePoint[]
  distanceKm: number
  descents: Descent[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forecasts: any[]
}

// About one point every 15–20 minutes of riding; capped to keep the request small
const STEP_KM = 6
const MAX_POINTS = 24
// Fallback when the full route request is too slow: start, finish, highest point and a few between
const FALLBACK_POINTS = 5
const HEADWIND_KMH = 12        // from here a headwind is worth mentioning
const DESCENT_MIN_DROP_M = 150
const DESCENT_MIN_KM = 2
const DESCENT_COOL_BELOW = 20  // feels-like °C below which a descent gets a note

/** For docs/kit-logic.md */
export const ROUTE_CONSTANTS = { STEP_KM, MAX_POINTS, FALLBACK_POINTS, HEADWIND_KMH, DESCENT_MIN_DROP_M, DESCENT_MIN_KM, DESCENT_COOL_BELOW } as const

/** Cumulative distance (km) at every GPX point, scaled to the route's reported distance */
export function cumulativeKm(route: GpxRoute): number[] {
  const pts = route.points
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + haversineKm(pts[i - 1], pts[i]))
  const scale = route.distanceKm / (cum[cum.length - 1] || 1)
  return cum.map(c => c * scale)
}

/**
 * Evenly spaced points along the route by distance, always including start, finish and
 * the highest point (on hilly routes the summit decides what you need to wear)
 */
export function sampleRoute(route: GpxRoute): RoutePoint[] {
  const pts = route.points
  const cum = cumulativeKm(route)
  const n = Math.min(MAX_POINTS, Math.max(2, Math.ceil(route.distanceKm / STEP_KM) + 1))

  const indices = new Set<number>()
  let j = 0
  for (let t = 0; t < n; t++) {
    const target = (route.distanceKm * t) / (n - 1)
    while (j < pts.length - 1 && cum[j] < target) j++
    indices.add(j)
  }
  let top = -1
  pts.forEach((p, i) => { if (p.ele !== undefined && (top < 0 || p.ele > pts[top].ele!)) top = i })
  if (top >= 0) indices.add(top)

  return [...indices].sort((a, b) => a - b).map(i => ({
    km: cum[i], lat: pts[i].lat, lon: pts[i].lon, ele: pts[i].ele,
    bearing: bearingAt(route, cum, i),
  }))
}

/**
 * A few decisive points out of the sampled ones: start, finish, the highest point, then each
 * time the point furthest from those already picked, until there are `FALLBACK_POINTS`
 */
export function keyPoints(points: RoutePoint[]): RoutePoint[] {
  if (points.length <= FALLBACK_POINTS) return points
  const picked = new Set([0, points.length - 1])
  let top = -1
  points.forEach((p, i) => { if (p.ele !== undefined && (top < 0 || p.ele > points[top].ele!)) top = i })
  if (top >= 0) picked.add(top)
  while (picked.size < FALLBACK_POINTS) {
    let best = 0, bestGap = -1
    for (let i = 0; i < points.length; i++) {
      const gap = Math.min(...[...picked].map(j => Math.abs(i - j)))
      if (gap > bestGap) { best = i; bestGap = gap }
    }
    picked.add(best)
  }
  return [...picked].sort((a, b) => a - b).map(i => points[i])
}

/** Riding direction around point i: towards a point ~400 m further (or from one before, at the end) */
function bearingAt(route: GpxRoute, cum: number[], i: number): number {
  const pts = route.points
  let k = i
  while (k < pts.length - 1 && cum[k] - cum[i] < 0.4) k++
  if (k === i) {
    let b = i
    while (b > 0 && cum[i] - cum[b] < 0.4) b--
    return bearing(pts[b], pts[i])
  }
  return bearing(pts[i], pts[k])
}

function bearing(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180
  const y = Math.sin((b.lon - a.lon) * rad) * Math.cos(b.lat * rad)
  const x = Math.cos(a.lat * rad) * Math.sin(b.lat * rad) - Math.sin(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos((b.lon - a.lon) * rad)
  return (Math.atan2(y, x) / rad + 360) % 360
}

/**
 * Long descents: from a high point, keep going while the road mostly drops (bumps of up to
 * 20 m allowed). GPX elevation is noisy, so only clear descents count.
 */
export function findDescents(route: GpxRoute): Descent[] {
  const pts = route.points
  if (pts.some(p => p.ele === undefined)) return []
  const cum = cumulativeKm(route)
  const found: Descent[] = []
  let peak = 0, low = 0
  const close = () => {
    const drop = pts[peak].ele! - pts[low].ele!
    if (drop >= DESCENT_MIN_DROP_M && cum[low] - cum[peak] >= DESCENT_MIN_KM) {
      found.push({ fromKm: cum[peak], toKm: cum[low], dropM: Math.round(drop) })
    }
  }
  for (let i = 1; i < pts.length; i++) {
    const e = pts[i].ele!
    if (e < pts[low].ele!) low = i
    else if (e > pts[low].ele! + 20) {
      close()
      peak = i; low = i
    }
    if (pts[low].ele! >= pts[peak].ele! && e > pts[peak].ele!) { peak = i; low = i }
  }
  close()
  return found
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
    const windDirection = hr.winddirection_10m[frac < 0.5 ? h0 : h0 + 1]
    const windspeed = Math.round(lerp('windspeed_10m'))
    // Wind "from" the direction you ride into = headwind
    const headwind = Math.round(windspeed * Math.cos((windDirection - pt.bearing) * Math.PI / 180))
    samples.push({
      km: pt.km, offsetH, ele: pt.ele,
      apparentTemp: Math.round(lerp('apparent_temperature')),
      windspeed, windDirection, headwind,
      precipProb: Math.max(hr.precipitation_probability[h0] ?? 0, hr.precipitation_probability[h0 + 1] ?? 0),
    })
  })
  return samples
}

/**
 * Wind as the rider feels it: full strength into a headwind, about 60% from the side,
 * 20% from behind. Without a route the full wind is used (direction unknown).
 */
export function feltWind(s: RouteSample): number {
  const cos = s.headwind / (s.windspeed || 1)
  return Math.round(s.windspeed * (0.6 + 0.4 * cos))
}

/**
 * Collapse route samples into one entry per ride hour for the kit logic:
 * the coldest feel, strongest felt wind and highest rain chance seen in that hour.
 */
export function hourlyFromRoute(samples: RouteSample[], durationH: number): HourWeather[] {
  const hours = Math.max(1, Math.ceil(durationH))
  const out: HourWeather[] = []
  for (let h = 0; h < hours; h++) {
    const inHour = samples.filter(s => s.offsetH >= h && (s.offsetH < h + 1 || h === hours - 1))
    const pool = inHour.length ? inHour : [nearest(samples, h + 0.5)]
    out.push({
      apparentTemp: Math.min(...pool.map(s => s.apparentTemp)),
      windspeed:    Math.max(...pool.map(feltWind)),
      precipProb:   Math.max(...pool.map(s => s.precipProb)),
    })
  }
  return out
}

export function routeHighlights(samples: RouteSample[], descents: Descent[], distanceKm: number, durationH: number): RouteHighlights {
  if (samples.length < 2) return {}
  const start = samples[0]
  const result: RouteHighlights = {}

  const coldest = samples.reduce((a, b) => (b.apparentTemp < a.apparentTemp ? b : a))
  if (start.apparentTemp - coldest.apparentTemp >= 2) {
    result.coldest = { km: coldest.km, offsetH: coldest.offsetH, apparentTemp: coldest.apparentTemp, ele: coldest.ele }
  }

  // Same threshold as the kit's rain gear, so "rain likely" on the route matches the kit list
  if (start.precipProb < RAIN_LIKELY) {
    const wet = samples.find(s => s.precipProb >= RAIN_LIKELY)
    if (wet) result.rain = { km: wet.km, offsetH: wet.offsetH, precipProb: wet.precipProb }
  }

  // Longest run of consecutive samples into a real headwind (at least 5 km)
  let best: RouteSample[] = [], run: RouteSample[] = []
  for (const s of samples) {
    if (s.headwind >= HEADWIND_KMH) run.push(s)
    else run = []
    if (run.length && run[run.length - 1].km - run[0].km > (best.length ? best[best.length - 1].km - best[0].km : -1)) best = [...run]
  }
  if (best.length && (best[best.length - 1].km - best[0].km >= 5 || best.length >= 2)) {
    result.headwind = {
      fromKm: best[0].km, toKm: best[best.length - 1].km, offsetH: best[0].offsetH,
      kmh: Math.round(best.reduce((t, s) => t + s.headwind, 0) / best.length),
    }
  }

  // Biggest descent, if it's cool enough to need an extra layer for it
  const biggest = descents.reduce<Descent | undefined>((a, d) => (!a || d.dropM > a.dropM ? d : a), undefined)
  if (biggest) {
    const at = nearestKm(samples, biggest.fromKm)
    if (at.apparentTemp < DESCENT_COOL_BELOW) {
      result.descent = { ...biggest, offsetH: (biggest.fromKm / (distanceKm || 1)) * durationH, apparentTemp: at.apparentTemp }
    }
  }
  return result
}

function nearest(samples: RouteSample[], offsetH: number): RouteSample {
  return samples.reduce((a, b) => (Math.abs(b.offsetH - offsetH) < Math.abs(a.offsetH - offsetH) ? b : a))
}

function nearestKm(samples: RouteSample[], km: number): RouteSample {
  return samples.reduce((a, b) => (Math.abs(b.km - km) < Math.abs(a.km - km) ? b : a))
}
