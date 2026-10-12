import { useRef, useEffect, useState } from 'react'
import { IconMap, IconPlusMedium, IconMinusMedium } from '@central-icons-react/round-outlined-radius-3-stroke-2'
import type { HourlySlice } from '../../lib/openmeteo'
import type { GpxRoute } from '../../lib/gpx'
import { VECTOR_STYLE_URL, VECTOR_ATTRIBUTION, FALLBACK_RASTER } from '../../lib/mapTiles'
import { cumulativeKm, type RouteSample, type RouteHighlights } from '../../lib/routeForecast'
import { fmtDistance, fmtElevation, fmtWind, fmtTime, toF, type Unit } from './format'
import 'leaflet/dist/leaflet.css'

const WIND_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const STYLE_TIMEOUT_MS = 8000

// Feels-like colour scale, same tones as the kit card tiers (cold blue → hot red)
const TEMP_STOPS: [number, [number, number, number]][] = [
  [0, [13, 71, 161]], [6, [21, 101, 192]], [11, [74, 144, 217]],
  [15, [46, 158, 90]], [20, [245, 166, 35]], [25, [217, 48, 37]],
]
export function tempColor(c: number): string {
  if (c <= TEMP_STOPS[0][0]) return rgb(TEMP_STOPS[0][1])
  for (let i = 1; i < TEMP_STOPS.length; i++) {
    const [t1, c1] = TEMP_STOPS[i], [t0, c0] = TEMP_STOPS[i - 1]
    if (c <= t1) {
      const f = (c - t0) / (t1 - t0)
      return rgb(c0.map((v, k) => Math.round(v + (c1[k] - v) * f)) as [number, number, number])
    }
  }
  return rgb(TEMP_STOPS[TEMP_STOPS.length - 1][1])
}
const rgb = ([r, g, b]: [number, number, number]) => `rgb(${r},${g},${b})`

/** Feels-like at any km, interpolated between the forecast samples */
function tempAtKm(samples: RouteSample[], km: number): number {
  if (km <= samples[0].km) return samples[0].apparentTemp
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i]
    if (km <= b.km) return a.apparentTemp + (b.apparentTemp - a.apparentTemp) * ((km - a.km) / ((b.km - a.km) || 1))
  }
  return samples[samples.length - 1].apparentTemp
}

// ── Wind badge ────────────────────────────────────────────────────────────────
function WindBadge({ weather, unit }: { weather: HourlySlice; unit: Unit }) {
  const fromLabel = WIND_DIRS[Math.round(weather.windDirection / 45) % 8]
  return (
    <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-sm rounded-lg px-[10px] py-[8px] shadow-[0_2px_12px_rgba(0,0,0,0.12)] flex items-center gap-[10px] border border-border pointer-events-none">
      <div style={{ transform: `rotate(${weather.windDirection}deg)` }} className="flex items-center justify-center text-[#4A90D9] shrink-0">
        <svg viewBox="0 0 14 18" fill="currentColor" width="13" height="17">
          <path d="M7 0 L13.5 15 L7 10.5 L0.5 15 Z" />
        </svg>
      </div>
      <div>
        <div className="font-head text-[12px] font-bold text-text leading-[1.2]">{fmtWind(weather.windspeed, unit)}</div>
        <div className="text-[10px] text-text-light mt-[1px]">From {fromLabel}</div>
      </div>
    </div>
  )
}

// ── Route map ─────────────────────────────────────────────────────────────────
export default function RouteMap({ route, unit, weather, samples = [], highlights, startHour }: {
  route: GpxRoute; unit: Unit; weather: HourlySlice | null
  /** Forecast along the route — colours the line by how it feels */
  samples?: RouteSample[]; highlights?: RouteHighlights | null; startHour: number
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<import('leaflet').Map | null>(null)
  const leafletRef = useRef<typeof import('leaflet') | null>(null)
  const overlayRef = useRef<import('leaflet').LayerGroup | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!mapRef.current) return
    let map: import('leaflet').Map | null = null
    let cancelled = false

    Promise.all([
      import('leaflet'),
      import('@maplibre/maplibre-gl-leaflet'),
      import('maplibre-gl'),
      // MapLibre 6 runs its worker as a separate module; let Vite bundle it and hand over the URL
      import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'),
      import('maplibre-gl/dist/maplibre-gl.css'),
    ]).then(([L, { maplibreGL }, { setWorkerUrl }, { default: workerUrl }]) => {
      if (cancelled || !mapRef.current) return
      setWorkerUrl(workerUrl)

      const latlngs = route.points.map(p => [p.lat, p.lon] as [number, number])

      map = L.map(mapRef.current!, { zoomControl: false, attributionControl: true, scrollWheelZoom: false })
      leafletMapRef.current = map
      leafletRef.current = L
      const leafletMap = map

      // Set the view first — Leaflet only initialises layers (incl. the MapLibre base) once the map has one
      map.fitBounds(L.latLngBounds(latlngs), { padding: [24, 24] })
      // Route line + markers live in their own pane above the base map, redrawn when the forecast changes
      map.createPane('route').style.zIndex = '450'
      overlayRef.current = L.layerGroup().addTo(map)

      // Raster fallback — swaps in at most once
      let fellBack = false
      const useFallback = (base?: import('leaflet').Layer) => {
        if (fellBack || cancelled) return
        fellBack = true
        if (base) leafletMap.removeLayer(base)
        L.tileLayer(FALLBACK_RASTER.url, {
          attribution: FALLBACK_RASTER.attribution,
          maxZoom: FALLBACK_RASTER.maxZoom,
        }).addTo(leafletMap)
      }

      try {
        const vector = maplibreGL({ style: VECTOR_STYLE_URL, attributionControl: false })
        vector.getAttribution = () => VECTOR_ATTRIBUTION
        vector.addTo(leafletMap)
        // Fall back only when the style never loads — a single failed tile shouldn't swap the whole map
        const gl = vector.getMaplibreMap()
        let loaded = false
        gl.once('load', () => { loaded = true })
        gl.on('error', () => { if (!loaded) useFallback(vector) })
        setTimeout(() => { if (!loaded) useFallback(vector) }, STYLE_TIMEOUT_MS)
      } catch {
        // No WebGL (old device, blocked GPU) — MapLibre throws on init
        useFallback()
      }

      setReady(true)
    })

    return () => { cancelled = true; map?.remove(); leafletMapRef.current = null; overlayRef.current = null; setReady(false) }
  }, [route])

  // Route line coloured by feels-like temperature, plus coldest-point and rain markers
  useEffect(() => {
    const L = leafletRef.current, layer = overlayRef.current
    if (!ready || !L || !layer) return
    layer.clearLayers()

    const pts = route.points
    const latlng = (i: number) => [pts[i].lat, pts[i].lon] as [number, number]
    const line = { pane: 'route', weight: 5, opacity: 0.95, lineCap: 'round' as const, lineJoin: 'round' as const }

    if (samples.length >= 2) {
      // Short chunks (~1/60 of the route) each in the colour of its feels-like temperature
      const cum = cumulativeKm(route)
      const chunkKm = Math.max(0.3, route.distanceKm / 60)
      let from = 0
      for (let i = 1; i < pts.length; i++) {
        if (cum[i] - cum[from] >= chunkKm || i === pts.length - 1) {
          const mid = (cum[from] + cum[i]) / 2
          L.polyline(pts.slice(from, i + 1).map((_, k) => latlng(from + k)), { ...line, color: tempColor(tempAtKm(samples, mid)) }).addTo(layer)
          from = i
        }
      }
    } else {
      L.polyline(pts.map((_, i) => latlng(i)), { ...line, color: '#FF5130' }).addTo(layer)
    }

    const dot = (color: string) => L.divIcon({
      html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.35)"></div>`,
      className: '', iconSize: [14, 14], iconAnchor: [7, 7],
    })
    L.marker(latlng(0), { icon: dot('#2E9E5A'), pane: 'route', keyboard: false }).addTo(layer)
    L.marker(latlng(pts.length - 1), { icon: dot('#111110'), pane: 'route', keyboard: false }).addTo(layer)

    // Small labelled pins for what the kit card mentions
    const cum = cumulativeKm(route)
    const pointAtKm = (km: number) => { let i = 0; while (i < cum.length - 1 && cum[i] < km) i++; return latlng(i) }
    const clock = (offsetH: number) => { const m = Math.round((startHour + offsetH) * 12) * 5; return fmtTime(Math.floor(m / 60) % 24, m % 60, unit) }
    const pin = (text: string, color: string) => L.divIcon({
      html: `<div style="position:absolute;left:0;bottom:8px;transform:translateX(-50%);width:max-content;white-space:nowrap;background:white;color:${color};border:1.5px solid ${color};border-radius:8px;padding:3px 7px;font:600 11px/1.2 'Space Grotesk',sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.18)">${text}</div>`,
      className: '', iconSize: [0, 0],
    })
    const temp = (c: number) => unit === 'F' ? `${toF(c)}°F` : `${c}°C`
    if (highlights?.coldest) {
      const c = highlights.coldest
      L.marker(pointAtKm(c.km), { icon: pin(`Coldest ${temp(c.apparentTemp)} · ${clock(c.offsetH)}`, tempColor(c.apparentTemp)), pane: 'route', keyboard: false }).addTo(layer)
    }
    if (highlights?.rain) {
      const r = highlights.rain
      L.marker(pointAtKm(r.km), { icon: pin(`Rain from ${clock(r.offsetH)}`, '#4A90D9'), pane: 'route', keyboard: false }).addTo(layer)
    }
  }, [ready, route, samples, highlights, unit, startHour])

  const temps = samples.map(s => s.apparentTemp)
  const tMin = temps.length ? Math.min(...temps) : 0, tMax = temps.length ? Math.max(...temps) : 0
  const legendTemp = (c: number) => unit === 'F' ? `${toF(c)}°` : `${c}°`

  return (
    <div className="mt-7 animate-fade-up">
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 sm:px-[22px] border-b border-border">
          <div className="flex items-center gap-2">
            <IconMap size={16} className="text-coral shrink-0" />
            <span className="font-head text-[14px] font-bold text-text truncate max-w-[140px] sm:max-w-[220px]">{route.name}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-head text-[12px] text-text-mid">{fmtDistance(route.distanceKm, unit)}</span>
            <span className="text-border">·</span>
            <span className="font-head text-[12px] text-text-mid">↑ {fmtElevation(route.elevationGainM, unit)}</span>
          </div>
        </div>
        <div className="relative">
          <div ref={mapRef} className="w-full h-[320px] sm:h-[400px]" />
          {/* Custom zoom controls */}
          <div className="absolute top-3 left-3 z-[400] flex flex-col bg-white/95 backdrop-blur-sm rounded-lg border border-border shadow-[0_2px_12px_rgba(0,0,0,0.12)] overflow-hidden">
            <button onClick={() => leafletMapRef.current?.zoomIn()} aria-label="Zoom in"
              className="p-[9px] flex items-center justify-center text-text hover:bg-black/5 transition-colors cursor-pointer">
              <IconPlusMedium size={14} />
            </button>
            <div className="h-px bg-border" />
            <button onClick={() => leafletMapRef.current?.zoomOut()} aria-label="Zoom out"
              className="p-[9px] flex items-center justify-center text-text hover:bg-black/5 transition-colors cursor-pointer">
              <IconMinusMedium size={14} />
            </button>
          </div>

          {weather && <WindBadge weather={weather} unit={unit} />}
        </div>

        {/* Legend: feels-like range along the route, under the map so it never covers the line */}
        {samples.length >= 2 && (
          <div className="flex items-center gap-3 px-4 py-[10px] sm:px-[22px] border-t border-border">
            <span className="font-head text-[11px] font-semibold uppercase tracking-[0.06em] text-text-light">Feels like on the route</span>
            <div className="flex items-center gap-2 font-head text-[12px] font-semibold text-text">
              <span>{legendTemp(tMin)}</span>
              <span className="block w-16 sm:w-24 h-1.5 rounded-full"
                style={{ background: `linear-gradient(to right, ${tempColor(tMin)}, ${tempColor((tMin + tMax) / 2)}, ${tempColor(tMax)})` }} />
              <span>{legendTemp(tMax)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
