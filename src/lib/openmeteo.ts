/**
 * Open-Meteo API utility
 * Fetches 7-day hourly forecast — no API key required
 */

export interface HourlySlice {
  time:          string
  temperature:   number
  apparentTemp:  number
  windspeed:     number
  windDirection: number
  precipProb:    number
  weathercode:   number
  cloudcover:    number
  humidity:      number
}

export interface CityResult {
  name: string
  lat:  number
  lon:  number
}

// Round to 2 decimals (~1 km): plenty for a forecast or a place name, and the
// exact position of the rider never leaves the browser (data minimisation)
const coarse = (deg: number) => Math.round(deg * 100) / 100

const HOURLY_FIELDS = [
  'temperature_2m',
  'apparent_temperature',
  'windspeed_10m',
  'winddirection_10m',
  'precipitation_probability',
  'weathercode',
  'cloudcover',
  'relativehumidity_2m',
].join(',')

/**
 * Forecasts for several points in one request (used along a GPX route).
 * Passing the route's own elevation matters: with rounded coordinates the terrain model
 * can be hundreds of metres off in hilly areas, which is several degrees.
 */
export async function fetchForecasts(points: { lat: number; lon: number; ele?: number }[]) {
  const withEle = points.every(p => p.ele !== undefined)
  const params = new URLSearchParams({
    latitude:        points.map(p => coarse(p.lat)).join(','),
    longitude:       points.map(p => coarse(p.lon)).join(','),
    hourly:          HOURLY_FIELDS,
    forecast_days:   '7',
    wind_speed_unit: 'kmh',
    timezone:        'auto',
  })
  if (withEle) params.set('elevation', points.map(p => Math.round(p.ele!)).join(','))
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) throw new Error('Weather data unavailable')
  const data = await res.json()
  // One point → a single object, several → an array
  return Array.isArray(data) ? data : [data]
}

export async function fetchForecast(lat: number, lon: number) {
  const params = new URLSearchParams({
    latitude:      String(coarse(lat)),
    longitude:     String(coarse(lon)),
    hourly:        HOURLY_FIELDS,
    forecast_days:   '7',
    wind_speed_unit: 'kmh',
    timezone:        'auto',
  })
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!res.ok) throw new Error('Weather data unavailable')
  return res.json()
}

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${coarse(lat)}&lon=${coarse(lon)}&zoom=10&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    return data.address?.city || data.address?.town || data.address?.village || 'Your location'
  } catch {
    return 'Your location'
  }
}

export async function searchCity(query: string): Promise<CityResult[]> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
  )
  const data = await res.json()
  return (data.results || []).map((r: Record<string, unknown>) => ({
    name: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
    lat:  r.latitude,
    lon:  r.longitude,
  }))
}

export function getHourlySlice(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forecast: any,
  dayIndex:  number,
  hourIndex: number
): HourlySlice {
  const i = dayIndex * 24 + hourIndex
  const h = forecast.hourly
  return {
    time:         h.time[i],
    temperature:  Math.round(h.temperature_2m[i]),
    apparentTemp: Math.round(h.apparent_temperature[i]),
    windspeed:     Math.round(h.windspeed_10m[i]),
    windDirection: Math.round(h.winddirection_10m[i]),
    precipProb:   h.precipitation_probability[i],
    weathercode:  h.weathercode[i],
    cloudcover:   h.cloudcover[i],
    humidity:     h.relativehumidity_2m[i],
  }
}

export function getHourlyRange(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forecast: any,
  dayIndex:      number,
  startHour:     number,
  durationHours: number
): HourlySlice[] {
  const slices: HourlySlice[] = []
  for (let h = 0; h < Math.ceil(durationHours); h++) {
    const absHour = startHour + h
    const d  = dayIndex + Math.floor(absHour / 24)
    const hr = absHour % 24
    if (d < 7) slices.push(getHourlySlice(forecast, d, hr))
  }
  return slices
}

export function getDayLabels() {
  const days   = []
  const now    = new Date()
  const dNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    days.push({
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dNames[d.getDay()],
      date:  `${d.getDate()} ${mNames[d.getMonth()]}`,
      index: i,
    })
  }
  return days
}
