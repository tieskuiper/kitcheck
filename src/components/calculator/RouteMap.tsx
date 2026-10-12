import { useRef, useEffect } from 'react'
import { IconMap, IconPlusMedium, IconMinusMedium } from '@central-icons-react/round-outlined-radius-3-stroke-2'
import type { HourlySlice } from '../../lib/openmeteo'
import type { GpxRoute } from '../../lib/gpx'
import { VECTOR_STYLE_URL, VECTOR_ATTRIBUTION, FALLBACK_RASTER } from '../../lib/mapTiles'
import { fmtDistance, fmtElevation, fmtWind, type Unit } from './format'
import 'leaflet/dist/leaflet.css'

const WIND_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
const STYLE_TIMEOUT_MS = 8000

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
export default function RouteMap({ route, unit, weather }: { route: GpxRoute; unit: Unit; weather: HourlySlice | null }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<import('leaflet').Map | null>(null)

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
      const leafletMap = map

      // Set the view first — Leaflet only initialises layers (incl. the MapLibre base) once the map has one
      const polyline = L.polyline(latlngs, { color: '#FF5130', weight: 4, opacity: 0.9 }).addTo(map)
      map.fitBounds(polyline.getBounds(), { padding: [24, 24] })

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
        polyline.bringToFront()
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

      const dotIcon = (color: string) => {
        const safe = /^#[0-9A-Fa-f]{6}$/.test(color) ? color : '#888888'
        return L.divIcon({
          html: `<div style="width:14px;height:14px;border-radius:50%;background:${safe};border:2.5px solid white;box-shadow:0 1px 6px rgba(0,0,0,0.35)"></div>`,
          className: '', iconSize: [14, 14], iconAnchor: [7, 7],
        })
      }
      L.marker(latlngs[0], { icon: dotIcon('#2E9E5A') }).addTo(map)
      L.marker(latlngs[latlngs.length - 1], { icon: dotIcon('#FF5130') }).addTo(map)
    })

    return () => { cancelled = true; map?.remove(); leafletMapRef.current = null }
  }, [route])

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
      </div>
    </div>
  )
}
