import { useState, useRef, useMemo, useEffect, type ReactNode } from 'react'
import { IconBlip, IconLightning, IconFire2, IconRacingFlag, IconMagnifyingGlass, IconMapPin, IconPinLocation, IconThermostat, IconWind, IconRainy, IconCloud, IconMap, IconCircleInfo, IconCrossLarge, IconArrowRight, IconLoadingCircle, IconConstructionHelmet, IconFashion, IconHand5Finger, IconBathMan1, IconFootsteps, IconClock, IconPlusMedium, IconMinusMedium } from '@central-icons-react/round-outlined-radius-3-stroke-2'
import {
  fetchForecast, reverseGeocode, searchCity,
  getHourlyRange, getDayLabels,
  type HourlySlice, type CityResult,
} from '../lib/openmeteo'
import {
  getRideKitRecommendation, scoreLabel,
  type KitResult, type Intensity, type ZoneItem, type PhaseNote,
} from '../lib/kitLogic'
import { parseGpx, type GpxRoute } from '../lib/gpx'
import 'leaflet/dist/leaflet.css'

// ── Tier / level accent colours (dynamic, must stay inline) ──────────────────
const TIER_ACCENT: Record<string, string> = {
  'Extreme cold': '#0D47A1',
  'Cold': '#1565C0',
  'Cool': '#4A90D9',
  'Comfortable': '#2E9E5A',
  'Warm': '#F5A623',
  'Hot': '#D93025',
}
const TIER_BG: Record<string, string> = {
  'Extreme cold': '#E3F2FD',
  'Cold': '#EAF4FD',
  'Cool': '#EDF4FF',
  'Comfortable': '#EDFFEF',
  'Warm': '#FFFAED',
  'Hot': '#FFF3ED',
}

const intensityIcon = (active: boolean) => `shrink-0 ${active ? 'text-coral' : 'text-dark'}`

const INTENSITY_OPTIONS: { value: Intensity; label: string; desc: string; icon: (active: boolean) => ReactNode }[] = [
  { value: 'easy', label: 'Easy', desc: 'Recovery / leisure', icon: (a) => <IconBlip size={18} className={intensityIcon(a)} /> },
  { value: 'moderate', label: 'Moderate', desc: 'Endurance ride', icon: (a) => <IconLightning size={18} className={intensityIcon(a)} /> },
  { value: 'hard', label: 'Hard', desc: 'Training / fast group', icon: (a) => <IconFire2 size={18} className={intensityIcon(a)} /> },
  { value: 'race', label: 'Race', desc: 'Full effort', icon: (a) => <IconRacingFlag size={18} className={intensityIcon(a)} /> },
]

// Average cycling speeds (km/h) per intensity, used for duration estimation
const INTENSITY_SPEED: Record<Intensity, number> = {
  easy: 18, moderate: 23, hard: 28, race: 33,
}

const CAT_ICONS: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties; className?: string }>> = {
  head: IconConstructionHelmet,
  torso: IconFashion,
  hands: IconHand5Finger,
  legs: IconBathMan1,
  feet: IconFootsteps,
}
const CAT_LABELS: Record<string, string> = { head: 'Head & Eyes', torso: 'Upper Body', hands: 'Hands', legs: 'Lower Body', feet: 'Feet' }

// ── Shared primitives ─────────────────────────────────────────────────────────
function Label({ text }: { text: string }) {
  return (
    <p className="font-head text-[11px] font-semibold tracking-[0.08em] uppercase text-coral mb-2">{text}</p>
  )
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 sm:p-[22px]">
      {children}
    </div>
  )
}

// ── Location search ───────────────────────────────────────────────────────────
function LocationSearch({
  query, setQuery, suggestions, onSearch, onAutoDetect, onSelectCity,
  onGpxUpload, onReset, loading, locating, gpxLoading, gpxRouteName,
  locationError, locationName, weatherLoaded, isLive, isGeolocated,
}: {
  query: string; setQuery: (v: string) => void
  suggestions: CityResult[]; onSearch: () => void
  onAutoDetect: () => void; onSelectCity: (c: CityResult) => void
  onGpxUpload: (file: File) => void; onReset: () => void
  loading: boolean; locating: boolean; gpxLoading: boolean; gpxRouteName: string
  locationError: string; locationName: string; weatherLoaded: boolean; isLive: boolean
  isGeolocated: boolean
}) {
  const gpxInputRef = useRef<HTMLInputElement>(null)
  return (
    <div>
      <div className="flex gap-2 relative">
        {/* Input */}
        <div className="flex-1 min-w-0 flex items-center bg-bg-card border-[1.5px] border-border rounded-[10px] px-3 gap-2">
          <IconMagnifyingGlass size={16} className="text-text-light" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSearch() }}
            placeholder="City or location…"
            className="flex-1 min-w-0 border-none bg-transparent font-body text-[14px]! text-text outline-none py-[8px] sm:py-[11px]"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            data-form-type="other"
          />
          {query && (
            <button onClick={onReset} className="cursor-pointer text-text-light">
              <IconCrossLarge size={14} className="shrink-0" />
            </button>
          )}
        </div>
        {/* Search */}
        <button onClick={onSearch} disabled={loading || !query.trim()}
          className="shrink-0 px-3 sm:px-4 bg-coral text-white border-none rounded-[10px] font-head text-[14px] font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90">
          {loading ? (
            <IconLoadingCircle size={16} className="text-white animate-spin-slow" />
          ) : (
            <IconArrowRight size={16} className="text-white" />
          )}
        </button>

        {/* Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full mt-[6px] left-0 right-0 bg-white border border-border rounded-xl overflow-hidden z-20 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => onSelectCity(s)}
                className={`w-full text-left px-[14px] py-[11px] bg-transparent border-none cursor-pointer font-body text-[13px] text-text-mid flex items-center gap-2 hover:opacity-75 ${i < suggestions.length - 1 ? 'border-b border-border' : ''
                  }`}>
                <IconMapPin size={16} className="text-dark" />{s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Or divider */}
      <div className="flex items-center gap-3 my-3">
        <div className="flex-1 h-px bg-border" />
        <span className="font-head text-[11px] text-text-light uppercase tracking-[0.08em]">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Option tiles */}
      <div className="grid grid-cols-2 gap-2">
        {/* Auto-detect tile */}
        {isGeolocated ? (
          <div className="relative flex items-center gap-3 px-3 py-[10px] rounded-xl border border-green-700/40 bg-green-600/5">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-white border border-green-700/40 flex items-center justify-center">
              <IconPinLocation size={15} className="text-green-700" />
            </div>
            <div className="min-w-0 pr-5">
              <div className="font-head text-[12px] font-bold text-green-700 leading-[1.2]">Location set</div>
              <div className="text-[11px] text-green-700/70 mt-[2px]">Auto-detected</div>
            </div>
            <button onClick={onReset} className="absolute top-1/2 -translate-y-1/2 right-3 cursor-pointer text-text-light hover:text-text transition-colors flex items-center">
              <IconCrossLarge size={13} className="shrink-0" />
            </button>
          </div>
        ) : (
          <button onClick={onAutoDetect} disabled={locating}
            className="flex items-center gap-3 px-3 py-[10px] rounded-xl border border-border bg-bg-card hover:border-dark/25 cursor-pointer transition-all text-left disabled:opacity-50">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-white border border-border flex items-center justify-center">
              {locating
                ? <IconLoadingCircle size={15} className="text-dark animate-spin-slow" />
                : <IconPinLocation size={15} className="text-dark" />}
            </div>
            <div className="min-w-0">
              <div className="font-head text-[12px] font-bold text-text leading-[1.2]">{locating ? 'Detecting…' : 'My location'}</div>
              <div className="text-[11px] text-text-light mt-[2px]">Auto-detect</div>
            </div>
          </button>
        )}

        {/* GPX tile */}
        {gpxRouteName ? (
          <div className="relative flex items-center gap-3 px-3 py-[10px] rounded-xl border border-green-700/40 bg-green-600/5">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-white border border-green-700/40 flex items-center justify-center">
              <IconMap size={15} className="text-green-700" />
            </div>
            <div className="min-w-0 pr-5">
              <div className="font-head text-[12px] font-bold text-green-700 leading-[1.2]">GPX loaded</div>
              <div className="text-[11px] text-green-700/70 mt-[2px]">Route uploaded</div>
            </div>
            <button onClick={onReset} className="absolute top-1/2 -translate-y-1/2 right-3 cursor-pointer text-text-light hover:text-text transition-colors flex items-center">
              <IconCrossLarge size={13} className="shrink-0" />
            </button>
          </div>
        ) : (
          <button onClick={() => gpxInputRef.current?.click()} disabled={gpxLoading}
            className="flex items-center gap-3 px-3 py-[10px] rounded-xl border border-border bg-bg-card hover:border-dark/25 cursor-pointer transition-all text-left disabled:opacity-50">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-white border border-border flex items-center justify-center">
              {gpxLoading
                ? <IconLoadingCircle size={15} className="text-dark animate-spin-slow" />
                : <IconMap size={15} className="text-dark" />}
            </div>
            <div className="min-w-0">
              <div className="font-head text-[12px] font-bold text-text leading-[1.2]">{gpxLoading ? 'Loading…' : 'Upload GPX'}</div>
              <div className="text-[11px] text-text-light mt-[2px]">From route file</div>
            </div>
          </button>
        )}
      </div>

      <input
        ref={gpxInputRef}
        type="file"
        accept=".gpx"
        className="hidden"
        onChange={e => {
          if (e.target.files?.[0]) {
            onGpxUpload(e.target.files[0])
            e.target.value = ''
          }
        }}
      />

      {locationError && (
        <div className="mt-2 text-[12px] text-[#e53] py-[7px] px-[11px] bg-[#fff5f5] rounded-lg border border-[#fdd]">
          {locationError}
        </div>
      )}
    </div>
  )
}

function toF(c: number) { return Math.round(c * 9 / 5 + 32) }
function toMph(kmh: number) { return Math.round(kmh * 0.621371) }
function fmtTime(h: number, m: number, unit: 'C' | 'F'): string {
  if (unit === 'C') return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}
function formatNote(pn: PhaseNote, unit: 'C' | 'F'): string {
  if (pn.tempC === undefined) return pn.note
  const t = unit === 'F' ? `${toF(pn.tempC)}°F` : `${pn.tempC}°C`
  return pn.note.replace('{T}', t)
}
function fmtDuration(h: number): string {
  return h % 1 === 0 ? `${h}h` : `${Math.floor(h)}h 30m`
}

// Estimate ride duration (hours) from GPX route + intensity
function estimateRideDuration(route: GpxRoute, int: Intensity): number {
  const speed = INTENSITY_SPEED[int]
  // Base time from distance + 5 min per 100m elevation gain
  const hours = route.distanceKm / speed + (route.elevationGainM / 100) * (5 / 60)
  return Math.max(0.5, Math.min(8, Math.round(hours * 2) / 2))
}

// ── Weather chips ─────────────────────────────────────────────────────────────
function WeatherChips({ weather, unit }: { weather: HourlySlice; unit: 'C' | 'F' }) {
  const temp = unit === 'F' ? `${toF(weather.temperature)}°F` : `${weather.temperature}°C`
  const wind = unit === 'F' ? `${toMph(weather.windspeed)} mph` : `${weather.windspeed} km/h`
  const chips = [
    { icon: <IconThermostat size={18} className="text-coral shrink-0" />, label: 'Temperature', value: temp },
    { icon: <IconWind size={18} className="text-coral shrink-0" />, label: 'Wind', value: wind },
    { icon: <IconRainy size={18} className="text-coral shrink-0" />, label: 'Rain', value: `${weather.precipProb}%` },
    { icon: <IconCloud size={18} className="text-coral shrink-0" />, label: 'Cloud', value: `${weather.cloudcover}%` },
  ]
  return (
    <div className="grid grid-cols-2 gap-2 mt-3 animate-fade-up">
      {chips.map(c => (
        <div key={c.label} className="bg-coral/5 border border-coral/[13%] rounded-[10px] py-[10px] px-3 flex items-center gap-2 md:gap-3">
          {c.icon}
          <div>
            <div className="font-head text-[15px] font-bold text-text leading-[1.1]">{c.value}</div>
            <div className="text-[10px] text-text-light uppercase tracking-[0.05em]">{c.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Kit output card ───────────────────────────────────────────────────────────
function KitCard({ kitResult, score, unit }: { kitResult: KitResult; score: ReturnType<typeof scoreLabel>; unit: 'C' | 'F' }) {
  const accent = TIER_ACCENT[score.label] || '#FF5130'
  const bg = TIER_BG[score.label] || '#FFF3ED'
  const zones = [
    { key: 'head', ...kitResult.head },
    { key: 'torso', ...kitResult.torso },
    { key: 'hands', ...kitResult.hands },
    { key: 'legs', ...kitResult.legs },
    { key: 'feet', ...kitResult.feet },
  ]
  return (
    <div className="animate-fade-up">

      {/* ── Header ── */}
      <div style={{ background: accent }} className="rounded-t-2xl py-5 px-5 sm:px-6 text-white">
        <div className="text-[11px] font-head font-semibold tracking-[0.08em] uppercase opacity-70 mb-1">
          Kit recommendation
        </div>
        <div className="font-head text-[20px] sm:text-[24px] font-bold tracking-[-0.02em] mb-4">
          {score.label} conditions
        </div>
        {/* Score bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-white/25 rounded-full overflow-hidden">
            <div className="h-full bg-white/80 rounded-full" style={{ width: `${(kitResult.score / 110) * 100}%` }} />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[12px] opacity-75">Score <strong className="opacity-100">{kitResult.score}</strong>/110</span>
            <div className="relative group">
              <button aria-label="How the score is calculated" className="flex items-center">
                <IconCircleInfo size={15} className="text-white/60 hover:text-white/90 transition-colors" />
              </button>
              <div className="absolute top-full right-0 mt-2 w-[260px] max-w-[calc(100vw-3rem)] bg-white text-text rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.15)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none">
                <div className="font-head font-semibold mb-[6px] text-[11px] uppercase tracking-[0.06em] text-coral">How the score works</div>
                <p className="text-[11px] leading-[1.6] m-0">
                  A comfort score based on how the conditions actually feel on the bike — factoring in temperature, wind, your ride intensity, and how warm you naturally run.
                </p>
                <div className="mt-[6px] text-[10px] text-text-light">Lower = more kit needed · Higher = less kit needed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Zone list — single card with dividers ── */}
      <div style={{ background: bg }} className="rounded-b-2xl border-t-none border border-black/[6%] overflow-hidden">
        {zones.map((z, idx) => (
          <div key={z.key} className={`px-4 py-3 sm:px-5 sm:py-[14px]${idx > 0 ? ' border-t border-black/[6%]' : ''}`}>

            {/* Zone header */}
            <div className="flex items-center gap-[6px] mb-[10px]">
              {(() => { const Icon = CAT_ICONS[z.key]; return <Icon size={14} style={{ color: accent }} className="shrink-0" /> })()}
              <span style={{ color: accent }} className="font-head text-[10px] font-bold tracking-[0.07em] uppercase">
                {CAT_LABELS[z.key]}
              </span>
            </div>

            {/* Items as chips */}
            <div className="flex flex-wrap gap-[6px]">
              {(z.items as ZoneItem[]).map((zitem, i) => (
                zitem.optional ? (
                  <span key={i} className="inline-flex items-center gap-1 font-head text-[12px] font-medium text-text-light px-[10px] py-[5px] rounded-lg border border-dashed border-black/15 bg-black/[3%]">
                    {zitem.name}
                    <span className="text-[9px] font-semibold uppercase tracking-[0.05em] opacity-60">opt</span>
                  </span>
                ) : (
                  <span key={i} className="inline-flex items-center font-head text-[12px] font-semibold text-text px-[10px] py-[5px] rounded-lg bg-white shadow-[0_1px_3px_rgba(0,0,0,0.07)] border border-black/[5%]">
                    {zitem.name}
                  </span>
                )
              ))}
            </div>

            {/* Phase notes */}
            {(z as { phaseNotes?: PhaseNote[] }).phaseNotes?.map((pn, pi) => (
              <div key={pi} style={{ borderColor: `${accent}50` }} className="mt-3 flex items-center gap-2 text-xs text-text-mid/80">
                <IconClock size={12} className="shrink-0" />
                {formatNote(pn, unit)}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Rain alert ── */}
      {kitResult.torso.detail?.includes('waterproof') && (
        <div className="bg-[#4A90D9]/[8%] rounded-xl py-[11px] px-[14px] border border-[#4A90D9]/20 flex gap-2 items-center">
          <IconRainy size={16} className="text-[#4A90D9] shrink-0" />
          <span className="text-[12px] text-[#4A90D9] leading-[1.5]">
            <strong>Rain is likely</strong> — waterproof layers included above.
          </span>
        </div>
      )}
    </div>
  )
}

// ── Day tabs ──────────────────────────────────────────────────────────────────
function DayTabs({ days, selected, onChange }: {
  days: ReturnType<typeof getDayLabels>; selected: number; onChange: (i: number) => void
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
      {days.map(d => {
        const active = d.index === selected
        return (
          <button key={d.index} onClick={() => onChange(d.index)}
            className={`shrink-0 flex flex-col items-center px-[14px] py-[9px] rounded-[10px] cursor-pointer font-head text-[12px] font-semibold transition-all min-w-[68px] hover:opacity-90 ${active
              ? 'border-[1.5px] border-coral bg-coral/[6%] text-coral'
              : 'border-[1.5px] border-border bg-transparent text-text-mid'
              }`}>
            <span>{d.label}</span>
            <span className="text-[10px] font-normal opacity-70 mt-0.5">{d.date}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Route map ─────────────────────────────────────────────────────────────────
function RouteMap({ route, unit, weather }: { route: GpxRoute; unit: 'C' | 'F'; weather: HourlySlice | null }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const leafletMapRef = useRef<import('leaflet').Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return
    let map: import('leaflet').Map | null = null

    import('leaflet').then(L => {
      if (!mapRef.current) return

      const latlngs = route.points.map(p => [p.lat, p.lon] as [number, number])

      map = L.map(mapRef.current!, { zoomControl: false, attributionControl: true, scrollWheelZoom: false })
      leafletMapRef.current = map
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      }).addTo(map)

      const polyline = L.polyline(latlngs, { color: '#FF5130', weight: 4, opacity: 0.9 }).addTo(map)
      map.fitBounds(polyline.getBounds(), { padding: [24, 24] })

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

    return () => { map?.remove(); leafletMapRef.current = null }
  }, [route])


  const dist = unit === 'F'
    ? `${Math.round(route.distanceKm * 0.621371 * 10) / 10} mi`
    : `${route.distanceKm} km`
  const elev = unit === 'F'
    ? `${Math.round(route.elevationGainM * 3.28084)} ft`
    : `${route.elevationGainM} m`

  return (
    <div className="mt-7 animate-fade-up">
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 sm:px-[22px] border-b border-border">
          <div className="flex items-center gap-2">
            <IconMap size={16} className="text-coral shrink-0" />
            <span className="font-head text-[14px] font-bold text-text truncate max-w-[140px] sm:max-w-[220px]">{route.name}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-head text-[12px] text-text-mid">{dist}</span>
            <span className="text-border">·</span>
            <span className="font-head text-[12px] text-text-mid">↑ {elev}</span>
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

          {weather && (() => {
            const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
            const fromLabel = dirs[Math.round(weather.windDirection / 45) % 8]
            const speed = unit === 'F' ? `${toMph(weather.windspeed)} mph` : `${weather.windspeed} km/h`
            return (
              <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-sm rounded-lg px-[10px] py-[8px] shadow-[0_2px_12px_rgba(0,0,0,0.12)] flex items-center gap-[10px] border border-border pointer-events-none">
                <div style={{ transform: `rotate(${weather.windDirection}deg)` }} className="flex items-center justify-center text-[#4A90D9] shrink-0">
                  <svg viewBox="0 0 14 18" fill="currentColor" width="13" height="17">
                    <path d="M7 0 L13.5 15 L7 10.5 L0.5 15 Z" />
                  </svg>
                </div>
                <div>
                  <div className="font-head text-[12px] font-bold text-text leading-[1.2]">{speed}</div>
                  <div className="text-[10px] text-text-light mt-[1px]">From {fromLabel}</div>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

// ── Main Calculator ───────────────────────────────────────────────────────────
export default function Calculator() {
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
  const [hourlySlices, setHourlySlices] = useState<HourlySlice[]>([])
  const DAY_LABELS = getDayLabels()
  const [selectedDay, setSelectedDay] = useState(0)
  // Stored as float with 0.5 precision (e.g. 8.5 = 08:30)
  const [selectedHour, setSelectedHour] = useState<number>(8)
  const [rideDuration, setRideDuration] = useState(2)
  const [intensity, setIntensity] = useState<Intensity>('moderate')
  const [warmthBias, setWarmthBias] = useState(0)
  const [kitResult, setKitResult] = useState<KitResult | null>(null)
  const [unit, setUnit] = useState<'C' | 'F'>('C')

  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const startH = Math.floor(selectedHour)
  const startM = (selectedHour % 1) * 60
  const hourLabel = fmtTime(startH, startM, unit)
  const endAbsHour = selectedHour + rideDuration
  const endHourOfDay = Math.floor(endAbsHour) % 24
  const endMinutes = (endAbsHour % 1) * 60
  const endDayOffset = Math.floor(endAbsHour / 24)
  const endLabel = fmtTime(endHourOfDay, endMinutes, unit) + (endDayOffset > 0 ? ' +1d' : '')
  const isLive = selectedDay === 0 && startH === new Date().getHours()
  const sl = useMemo(() => kitResult ? scoreLabel(kitResult.score) : null, [kitResult])

  function recalculate(slices: HourlySlice[], wb: number, int: Intensity) {
    setKitResult(getRideKitRecommendation(
      slices.map(s => ({ apparentTemp: s.apparentTemp, windspeed: s.windspeed, precipProb: s.precipProb })),
      wb, int,
    ))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function updateWeather(fc: any, day: number, hour: number, duration: number, wb: number, int: Intensity) {
    // Floor hour so fractional start times (08:30) still use whole-hour forecast slices
    const slices = getHourlyRange(fc, day, Math.floor(hour), duration)
    setHourlySlices(slices)
    if (slices.length) { setWeather(slices[0]); recalculate(slices, wb, int) }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function loadForecast(lat: number, lon: number, hour = selectedHour, duration = rideDuration) {
    setLoading(true); setForecast(null); setKitResult(null); setLocationError('')
    try {
      const fc = await fetchForecast(lat, lon)
      setForecast(fc)
      setWeatherLoaded(true)
      updateWeather(fc, selectedDay, hour, duration, warmthBias, intensity)
    } catch { setLocationError('Could not load forecast. Please try again.') }
    finally { setLoading(false) }
  }

  async function handleSearch() {
    if (!cityQuery.trim()) return
    if (weatherLoaded && cityQuery === locationName) return
    setSuggestions([])
    const results = await searchCity(cityQuery)
    if (results[0]) { await selectCity(results[0]) }
    else setLocationError(`Could not find "${cityQuery}". Try a different location.`)
  }

  function handleSearchInput(val: string) {
    setCityQuery(val)
    clearTimeout(searchTimer.current)
    if (val.length < 2) { setSuggestions([]); return }
    searchTimer.current = setTimeout(async () => {
      try { setSuggestions(await searchCity(val)) } catch { setSuggestions([]) }
    }, 350)
  }

  async function selectCity(s: CityResult) {
    setGpxRoute(null); setIsGeolocated(false)
    setLocationName(s.name); setCityQuery(s.name); setSuggestions([])
    const currentHour = new Date().getHours()
    setSelectedHour(currentHour)
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
      await loadForecast(lat, lon, currentHour)
    }, () => { setLocationError('Location denied. Please search manually.'); setLocating(false) })
  }

  async function handleGpxUpload(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setLocationError('GPX file is too large (max 10 MB).')
      return
    }
    setGpxLoading(true); setLocationError('')
    try {
      const text = await file.text()
      const route = parseGpx(text)
      const estDuration = estimateRideDuration(route, intensity)
      setGpxRoute(route); setIsGeolocated(false)
      setRideDuration(estDuration)
      const name = await reverseGeocode(route.startLat, route.startLon)
      const currentHour = new Date().getHours()
      setSelectedHour(currentHour)
      setLocationName(name); setCityQuery(name)
      await loadForecast(route.startLat, route.startLon, currentHour, estDuration)
    } catch (err) {
      setLocationError(err instanceof Error ? err.message : 'Could not read GPX file.')
    } finally {
      setGpxLoading(false)
    }
  }

  function resetAll() {
    setCityQuery('')
    setLocationName('')
    setSuggestions([])
    setLocationError('')
    setForecast(null)
    setWeather(null)
    setHourlySlices([])
    setWeatherLoaded(false)
    setKitResult(null)
    setGpxRoute(null)
    setIsGeolocated(false)
    setRideDuration(2)
  }

  function handleDayChange(day: number) {
    setSelectedDay(day)
    if (forecast) updateWeather(forecast, day, selectedHour, rideDuration, warmthBias, intensity)
  }

  function handleHourChange(hour: number) {
    setSelectedHour(hour)
    if (forecast) updateWeather(forecast, selectedDay, hour, rideDuration, warmthBias, intensity)
  }

  function handleDurationChange(dur: number) {
    setRideDuration(dur)
    if (forecast) updateWeather(forecast, selectedDay, selectedHour, dur, warmthBias, intensity)
  }

  function handleIntensityChange(int: Intensity) {
    setIntensity(int)
    if (gpxRoute && forecast) {
      // Re-estimate duration based on new intensity and reload weather slices
      const estDuration = estimateRideDuration(gpxRoute, int)
      setRideDuration(estDuration)
      updateWeather(forecast, selectedDay, selectedHour, estDuration, warmthBias, int)
    } else if (hourlySlices.length) {
      recalculate(hourlySlices, warmthBias, int)
    }
  }

  function handleWarmthChange(wb: number) {
    setWarmthBias(wb)
    if (hourlySlices.length) recalculate(hourlySlices, wb, intensity)
  }

  useEffect(() => {
    const handler = () => geolocate()
    window.addEventListener('kitcheck:geolocate', handler)
    return () => window.removeEventListener('kitcheck:geolocate', handler)
  }, [])

  useEffect(() => {
    const handler = (e: Event) => setUnit((e as CustomEvent<{ unit: 'C' | 'F' }>).detail.unit)
    window.addEventListener('kitcheck:unit', handler)
    return () => window.removeEventListener('kitcheck:unit', handler)
  }, [])

  return (
    <section id="calculator" className="bg-bg">
      <div className="container">
        <div className="pt-6 md:pt-10 pb-10 md:pb-16 lg:pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-7 items-start">

            {/* Left: inputs */}
            <div className="flex flex-col gap-3.5 min-w-0">

              <Card>
                <div className="font-head text-[14px] font-bold mb-4">Where are you riding?</div>
                <LocationSearch
                  query={cityQuery} setQuery={handleSearchInput}
                  suggestions={suggestions} onSearch={handleSearch}
                  onAutoDetect={geolocate} onSelectCity={selectCity}
                  onGpxUpload={handleGpxUpload} onReset={resetAll}
                  loading={loading} locating={locating} gpxLoading={gpxLoading}
                  gpxRouteName={gpxRoute?.name ?? ''}
                  locationError={locationError}
                  locationName={locationName} weatherLoaded={weatherLoaded} isLive={isLive}
                  isGeolocated={isGeolocated} />
              </Card>

              <Card>
                <div className="font-head text-[14px] font-bold mb-4">Rider profile</div>
                <div className="mb-4">
                  <Label text="Intensity" />
                  <div className="grid grid-cols-2 gap-[6px]">
                    {INTENSITY_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => handleIntensityChange(o.value)}
                        className={`flex items-center gap-2 md:gap-3 px-3 py-[10px] rounded-[10px] cursor-pointer text-left transition-all hover:opacity-90 ${intensity === o.value
                          ? 'border-[1.5px] border-coral bg-coral/[6%]'
                          : 'border-[1.5px] border-border bg-transparent'
                          }`}>
                        {o.icon(intensity === o.value)}
                        <div>
                          <div className={`font-head text-[12px] font-bold ${intensity === o.value ? 'text-coral' : 'text-text'}`}>
                            {o.label}
                          </div>
                          <div className="text-[11px] text-text-mid">{o.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <Label text="Warmth tendency" />
                    <span className="font-head text-[13px] font-semibold text-coral">
                      {['Always cold', 'Runs cold', 'Average', 'Runs warm', 'Always warm'][warmthBias + 2]}
                    </span>
                  </div>
                  <input type="range" min={-2} max={2} step={1} value={warmthBias}
                    aria-label="Warmth tendency"
                    onChange={e => handleWarmthChange(Number(e.target.value))} />
                  <div className="flex justify-between mt-1 font-head text-[11px] text-text-light">
                    <span>Always cold</span><span>Always warm</span>
                  </div>
                </div>
              </Card>

              {forecast && (
                <Card>
                  <div className="font-head text-[14px] font-bold mb-4">Day & departure time</div>
                  <DayTabs days={DAY_LABELS} selected={selectedDay} onChange={handleDayChange} />

                  {/* Start time — 30-minute steps */}
                  <div className="mb-1 flex justify-between items-baseline">
                    <Label text="Start time" />
                    <div className="flex items-center gap-1.5">
                      <span className="font-head text-[22px] font-bold text-coral">{hourLabel}</span>
                      <span className="text-text-light text-base">→</span>
                      <span className="font-head text-[22px] font-bold text-coral">{endLabel}</span>
                    </div>
                  </div>
                  <input type="range" min={0} max={23.5} step={0.5} value={selectedHour}
                    aria-label="Start time"
                    onChange={e => handleHourChange(Number(e.target.value))} />
                  <div className="flex justify-between mt-1 font-head text-[10px] sm:text-[11px] text-text-light">
                    {([[0, 0], [6, 0], [12, 0], [18, 0], [23, 0]] as [number, number][]).map(([h, m]) => (
                      <span key={h}>{fmtTime(h, m, unit)}</span>
                    ))}
                  </div>

                  {/* Duration — slider when no GPX, estimated badge when GPX loaded */}
                  {gpxRoute ? (
                    <div className="mt-4">
                      <div className="flex justify-between items-baseline mb-2">
                        <Label text="Est. duration" />
                        <span className="font-head text-[22px] font-bold text-coral">{fmtDuration(rideDuration)}</span>
                      </div>
                      <div className="bg-bg-card rounded-[10px] px-3 py-[10px] text-[11px] text-text-mid leading-[1.5]">
                        Based on{' '}
                        <strong>
                          {unit === 'F'
                            ? `${Math.round(gpxRoute.distanceKm * 0.621371 * 10) / 10} mi`
                            : `${gpxRoute.distanceKm} km`}
                        </strong>
                        {' '}·{' '}
                        <strong>
                          ↑ {unit === 'F'
                            ? `${Math.round(gpxRoute.elevationGainM * 3.28084)} ft`
                            : `${gpxRoute.elevationGainM} m`}
                        </strong>
                        {' '}·{' '}
                        {INTENSITY_OPTIONS.find(o => o.value === intensity)?.label.toLowerCase()} pace
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <div className="flex justify-between items-baseline mb-1">
                        <Label text="Ride duration" />
                        <span className="font-head text-[22px] font-bold text-coral">{fmtDuration(rideDuration)}</span>
                      </div>
                      <input type="range" min={1} max={8} step={0.5} value={rideDuration}
                        aria-label="Ride duration"
                        onChange={e => handleDurationChange(Number(e.target.value))} />
                      <div className="flex justify-between mt-1 font-head text-[11px] text-text-light">
                        <span>1h</span><span>4h 30m</span><span>8h</span>
                      </div>
                    </div>
                  )}

                  {weather && <WeatherChips weather={weather} unit={unit} />}
                </Card>
              )}
            </div>

            {/* Right: output */}
            <div className="md:sticky md:top-[88px] min-w-0">
              {kitResult && sl && weatherLoaded ? (
                <KitCard kitResult={kitResult} score={sl} unit={unit} />
              ) : (
                <div className="bg-white rounded-2xl p-12 border-[1.5px] border-dashed border-border text-center text-text-light">
                  <IconPinLocation size={26} className="mx-auto mb-3" />
                  <div className="font-head text-[15px] font-semibold text-text-mid mb-[6px]">
                    Enter your ride location
                  </div>
                  <div className="text-[13px]">Search a city or tap auto-detect to get your kit</div>
                </div>
              )}
            </div>

          </div>

          {/* Route map — full width below the grid */}
          {gpxRoute && weatherLoaded && (
            <RouteMap route={gpxRoute} unit={unit} weather={weather} />
          )}

        </div>
      </div>
    </section>
  )
}
