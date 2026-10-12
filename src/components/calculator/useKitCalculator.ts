import { useState, useRef, useMemo, useEffect } from 'react'
import {
  fetchForecast, reverseGeocode, searchCity,
  getHourlyRange, getDayLabels,
  fetchForecasts,
  type HourlySlice, type CityResult,
} from '../../lib/openmeteo'
import {
  getRideKitRecommendation, scoreLabel,
  type KitResult, type Intensity, type HourWeather,
} from '../../lib/kitLogic'
import { parseGpx, type GpxRoute } from '../../lib/gpx'
import {
  sampleRoute, routeWeather, hourlyFromRoute, routeHighlights,
  type RoutePoint, type RouteHighlights,
} from '../../lib/routeForecast'
import {
  durationFor, estimatedAvgSpeed, initialSpeed, saveSpeed, type SpeedSource,
} from '../../lib/rideDuration'
import { track } from '../../lib/consent'
import type { Unit } from './format'

// ── Calculator state + handlers ───────────────────────────────────────────────
export function useKitCalculator() {
  const [cityQuery, setCityQuery] = useState('')
  const [suggestions, setSuggestions] = useState<CityResult[]>([])
  const [locationName, setLocationName] = useState('')
  const [locationError, setLocationError] = useState('')
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [gpxLoading, setGpxLoading] = useState(false)
  const [weatherLoaded, setWeatherLoaded] = useState(false)
  const [gpxRoute, setGpxRoute] = useState<GpxRoute | null>(null)
  const [isGeolocated, setIsGeolocated] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [forecast, setForecast] = useState<any>(null)
  const [weather, setWeather] = useState<HourlySlice | null>(null)
  // Weather per ride hour that the kit logic works on (start point, or along the GPX route)
  const [kitHours, setKitHours] = useState<HourWeather[]>([])
  const [highlights, setHighlights] = useState<RouteHighlights | null>(null)
  const days = getDayLabels()
  const [selectedDay, setSelectedDay] = useState(0)
  // Stored as float with 0.5 precision (e.g. 8.5 = 08:30)
  const [selectedHour, setSelectedHour] = useState<number>(8)
  const [rideDuration, setRideDuration] = useState(2)
  // GPX only: average speed drives the duration (manual slider is for rides without a route)
  const [speedKmh, setSpeedKmh] = useState(0)
  const [speedSource, setSpeedSource] = useState<SpeedSource>('estimate')
  const [intensity, setIntensity] = useState<Intensity>('moderate')
  const [warmthBias, setWarmthBias] = useState(0)
  const [kitResult, setKitResult] = useState<KitResult | null>(null)
  const [unit, setUnit] = useState<Unit>('C')

  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  // Forecasts along the loaded GPX route; a ref so handlers always see the current route
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeRef = useRef<{ points: RoutePoint[]; forecasts: any[]; distanceKm: number } | null>(null)
  const score = useMemo(() => kitResult ? scoreLabel(kitResult.score) : null, [kitResult])

  function recalculate(hours: HourWeather[], wb: number, int: Intensity) {
    setKitResult(getRideKitRecommendation(hours, wb, int))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function updateWeather(fc: any, day: number, hour: number, duration: number, wb: number, int: Intensity) {
    // Floor hour so fractional start times (08:30) still use whole-hour forecast slices
    const slices = getHourlyRange(fc, day, Math.floor(hour), duration)
    if (slices.length) setWeather(slices[0])
    let hours: HourWeather[] = slices.map(s => ({ apparentTemp: s.apparentTemp, windspeed: s.windspeed, precipProb: s.precipProb }))

    // GPX: weather at each point of the route for the moment the rider gets there
    const route = routeRef.current
    if (route) {
      const samples = routeWeather(route.forecasts, route.points, route.distanceKm, day, hour, duration)
      if (samples.length) hours = hourlyFromRoute(samples, duration)
      setHighlights(samples.length ? routeHighlights(samples) : null)
    } else {
      setHighlights(null)
    }

    setKitHours(hours)
    if (hours.length) recalculate(hours, wb, int)
  }

  async function loadForecast(lat: number, lon: number, hour = selectedHour, duration = rideDuration, route?: GpxRoute) {
    setLoading(true); setForecast(null); setKitResult(null); setLocationError('')
    try {
      let fc
      if (route) {
        // One request for all route points; the first is the start
        const points = sampleRoute(route)
        const forecasts = await fetchForecasts(points)
        routeRef.current = { points, forecasts, distanceKm: route.distanceKm }
        fc = forecasts[0]
      } else {
        routeRef.current = null
        fc = await fetchForecast(lat, lon)
      }
      setForecast(fc)
      setWeatherLoaded(true)
      updateWeather(fc, selectedDay, hour, duration, warmthBias, intensity)
    } catch {
      setLocationError('Could not load forecast. Please try again.')
      track('forecast_error')
    }
    finally { setLoading(false) }
  }

  async function handleSearch() {
    if (!cityQuery.trim()) return
    if (weatherLoaded && cityQuery === locationName) return
    clearTimeout(searchTimer.current)
    setSuggestions([])
    const results = await searchCity(cityQuery)
    if (results[0]) { await selectCity(results[0], 'search') }
    else {
      setLocationError(`Could not find "${cityQuery}". Try a different location.`)
      track('search_no_result')
    }
  }

  function handleSearchInput(val: string) {
    setCityQuery(val)
    clearTimeout(searchTimer.current)
    if (val.length < 2) { setSuggestions([]); return }
    searchTimer.current = setTimeout(async () => {
      try { setSuggestions(await searchCity(val)) } catch { setSuggestions([]) }
    }, 350)
  }

  async function selectCity(s: CityResult, method: 'search' | 'suggestion' = 'suggestion') {
    // Cancel a pending suggestion lookup so the dropdown doesn't reopen after choosing
    clearTimeout(searchTimer.current)
    setGpxRoute(null); setIsGeolocated(false)
    setLocationName(s.name); setCityQuery(s.name); setSuggestions([])
    const currentHour = new Date().getHours()
    setSelectedHour(currentHour)
    track('location_selected', { method })
    await loadForecast(s.lat, s.lon, currentHour)
  }

  async function geolocate() {
    if (!navigator.geolocation) { setLocationError('Geolocation not supported.'); return }
    setLocating(true); setLocationError('')
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lon } = pos.coords
      const name = await reverseGeocode(lat, lon)
      const currentHour = new Date().getHours()
      setSelectedHour(currentHour)
      setGpxRoute(null); setIsGeolocated(true)
      setLocationName(name); setCityQuery(name); setLocating(false)
      track('location_selected', { method: 'geolocation' })
      await loadForecast(lat, lon, currentHour)
    }, () => {
      setLocationError('Location denied. Please search manually.'); setLocating(false)
      track('geolocation_denied')
    })
  }

  async function handleGpxUpload(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setLocationError('GPX file is too large (max 10 MB).')
      track('gpx_error', { reason: 'too_large' })
      return
    }
    setGpxLoading(true); setLocationError('')
    try {
      const text = await file.text()
      const route = parseGpx(text)
      const speed = initialSpeed(route, intensity)
      const estDuration = durationFor(route, speed.kmh)
      setGpxRoute(route); setIsGeolocated(false)
      setSpeedKmh(speed.kmh); setSpeedSource(speed.source)
      setRideDuration(estDuration)
      const name = await reverseGeocode(route.startLat, route.startLon)
      const currentHour = new Date().getHours()
      setSelectedHour(currentHour)
      setLocationName(name); setCityQuery(name)
      track('location_selected', { method: 'gpx', distance_km: Math.round(route.distanceKm), speed_source: speed.source })
      await loadForecast(route.startLat, route.startLon, currentHour, estDuration, route)
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Could not read GPX file.')
      track('gpx_error')
    } finally {
      setGpxLoading(false)
    }
  }

  function resetAll() {
    track('location_reset')
    setCityQuery('')
    setLocationName('')
    setSuggestions([])
    setLocationError('')
    setForecast(null)
    setWeather(null)
    setKitHours([])
    setHighlights(null)
    routeRef.current = null
    setWeatherLoaded(false)
    setKitResult(null)
    setGpxRoute(null)
    setIsGeolocated(false)
    setRideDuration(2)
  }

  function handleDayChange(day: number) {
    setSelectedDay(day)
    track('day_change', { day_offset: day })
    if (forecast) updateWeather(forecast, day, selectedHour, rideDuration, warmthBias, intensity)
  }

  function handleHourChange(hour: number) {
    setSelectedHour(hour)
    track('start_time_change', { start_hour: hour }, 1000)
    if (forecast) updateWeather(forecast, selectedDay, hour, rideDuration, warmthBias, intensity)
  }

  function handleDurationChange(dur: number) {
    setRideDuration(dur)
    track('duration_change', { duration_h: dur }, 1000)
    if (forecast) updateWeather(forecast, selectedDay, selectedHour, dur, warmthBias, intensity)
  }

  function applySpeed(kmh: number, source: SpeedSource, int = intensity) {
    if (!gpxRoute) return
    const dur = durationFor(gpxRoute, kmh)
    setSpeedKmh(kmh); setSpeedSource(source); setRideDuration(dur)
    if (forecast) updateWeather(forecast, selectedDay, selectedHour, dur, warmthBias, int)
  }

  /** Rider sets their own average speed: used for this and future routes */
  function handleSpeedChange(kmh: number) {
    saveSpeed(kmh)
    applySpeed(kmh, 'custom')
    track('speed_adjusted', { speed_kmh: kmh }, 1000)
  }

  /** Back to the estimate from intensity + climbing, and forget the saved speed */
  function resetSpeed() {
    if (!gpxRoute) return
    saveSpeed(undefined)
    applySpeed(estimatedAvgSpeed(gpxRoute, intensity), 'estimate')
    track('speed_reset')
  }

  function handleIntensityChange(int: Intensity) {
    setIntensity(int)
    track('intensity_change', { intensity: int })
    if (gpxRoute && speedSource === 'estimate') {
      // Only an estimated speed follows intensity; a recorded or own speed stays put
      applySpeed(estimatedAvgSpeed(gpxRoute, int), 'estimate', int)
    } else if (kitHours.length) {
      recalculate(kitHours, warmthBias, int)
    }
  }

  function handleWarmthChange(wb: number) {
    setWarmthBias(wb)
    track('warmth_change', { warmth_bias: wb }, 1000)
    if (kitHours.length) recalculate(kitHours, wb, intensity)
  }

  // Header buttons (outside the React island) talk to the calculator via window events
  useEffect(() => {
    const handler = () => geolocate()
    window.addEventListener('kitcheck:geolocate', handler)
    return () => window.removeEventListener('kitcheck:geolocate', handler)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const next = (e as CustomEvent<{ unit: Unit }>).detail.unit
      setUnit(next)
      track('unit_change', { unit: next })
    }
    window.addEventListener('kitcheck:unit', handler)
    return () => window.removeEventListener('kitcheck:unit', handler)
  }, [])

  // One event per settled recommendation (debounced so slider drags count once)
  useEffect(() => {
    if (!kitResult || !score) return
    track('recommendation_shown', {
      conditions: score.label, score: kitResult.score, intensity, warmth_bias: warmthBias,
      ride_hours: rideDuration, source: gpxRoute ? 'gpx' : 'location',
    }, 1500)
  }, [kitResult])

  return {
    // location
    cityQuery, suggestions, locationError, loading, locating, gpxLoading, gpxRoute, isGeolocated,
    handleSearch, handleSearchInput, selectCity, geolocate, handleGpxUpload, resetAll,
    // ride + rider
    forecast, weather, weatherLoaded, days, selectedDay, selectedHour, rideDuration, intensity, warmthBias, unit,
    handleDayChange, handleHourChange, handleDurationChange, handleIntensityChange, handleWarmthChange,
    speedKmh, speedSource, handleSpeedChange, resetSpeed,
    // result
    kitResult, score, highlights,
  }
}
