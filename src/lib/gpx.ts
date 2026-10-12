export interface GpxPoint {
  lat: number
  lon: number
  ele?: number
  time?: number   // ms since epoch, only in recorded rides
}

export interface GpxRoute {
  name: string
  points: GpxPoint[]
  distanceKm: number
  elevationGainM: number
  startLat: number
  startLon: number
  /** Moving time of a recorded ride (Strava/Garmin export); absent for planned routes */
  recordedMovingHours?: number
}

function haversineKm(a: GpxPoint, b: GpxPoint): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLon = ((b.lon - a.lon) * Math.PI) / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLon = Math.sin(dLon / 2)
  const h = sinLat * sinLat + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinLon * sinLon
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function parseGpx(xml: string): GpxRoute {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'application/xml')

  const nameEl = doc.querySelector('trk > name') || doc.querySelector('metadata > name')
  const name = nameEl?.textContent?.trim() || 'Uploaded Route'

  const trkpts = Array.from(doc.querySelectorAll('trkpt'))
  if (!trkpts.length) throw new Error('No track points found in GPX file')

  const points: GpxPoint[] = trkpts.map(pt => ({
    lat: parseFloat(pt.getAttribute('lat') || '0'),
    lon: parseFloat(pt.getAttribute('lon') || '0'),
    ele: pt.querySelector('ele') ? parseFloat(pt.querySelector('ele')!.textContent || '0') : undefined,
    time: parseTime(pt.querySelector('time')?.textContent),
  }))

  for (const pt of points) {
    if (Math.abs(pt.lat) > 90 || Math.abs(pt.lon) > 180) {
      throw new Error('GPX contains invalid coordinates.')
    }
  }

  let distanceKm = 0
  let elevationGainM = 0
  let movingMs = 0
  for (let i = 1; i < points.length; i++) {
    const segKm = haversineKm(points[i - 1], points[i])
    distanceKm += segKm
    movingMs += movingTimeMs(points[i - 1], points[i], segKm)
    if (points[i].ele !== undefined && points[i - 1].ele !== undefined) {
      const diff = points[i].ele! - points[i - 1].ele!
      if (diff > 0) elevationGainM += diff
    }
  }

  return {
    name,
    points,
    distanceKm: Math.round(distanceKm * 10) / 10,
    elevationGainM: Math.round(elevationGainM),
    startLat: points[0].lat,
    startLon: points[0].lon,
    recordedMovingHours: hasTimestamps(points) && movingMs > 5 * 60_000 ? movingMs / 3_600_000 : undefined,
  }
}

function parseTime(text: string | null | undefined): number | undefined {
  if (!text) return undefined
  const t = Date.parse(text.trim())
  return Number.isNaN(t) ? undefined : t
}

// Treat it as a recorded ride only if (nearly) every point has a time
function hasTimestamps(points: GpxPoint[]): boolean {
  return points.filter(p => p.time !== undefined).length >= points.length * 0.9
}

// Count a segment as riding only when moving (> 3 km/h) and not a long gap (coffee stop,
// paused recording) — so the result matches "moving time" in Strava/Garmin
function movingTimeMs(a: GpxPoint, b: GpxPoint, segKm: number): number {
  if (a.time === undefined || b.time === undefined) return 0
  const dt = b.time - a.time
  if (dt <= 0 || dt > 5 * 60_000) return 0
  const kmh = segKm / (dt / 3_600_000)
  return kmh > 3 ? dt : 0
}
