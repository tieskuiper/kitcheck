import { useRef, type ComponentType } from 'react'
import { IconMagnifyingGlass, IconMapPin, IconPinLocation, IconMap, IconCrossLarge, IconArrowRight, IconLoadingCircle } from '@central-icons-react/round-outlined-radius-3-stroke-2'
import type { CityResult } from '../../lib/openmeteo'

type TileIcon = ComponentType<{ size?: number; className?: string }>

// ── Option tile — idle button or confirmed (green) state ─────────────────────
function OptionTile({ icon: Icon, confirmed, busy, title, busyTitle, subtitle, confirmedTitle, confirmedSubtitle, onClick, onReset }: {
  icon: TileIcon; confirmed: boolean; busy: boolean
  title: string; busyTitle: string; subtitle: string
  confirmedTitle: string; confirmedSubtitle: string
  onClick: () => void; onReset: () => void
}) {
  if (confirmed) {
    return (
      <div className="relative flex items-center gap-2 sm:gap-3 px-1.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-green-700/40 bg-green-600/5">
        <div className="w-8 h-8 shrink-0 rounded-lg bg-white border border-green-700/40 flex items-center justify-center">
          <Icon size={15} className="text-green-700" />
        </div>
        <div className="min-w-0 pr-5 shrink-0">
          <div className="font-head text-[12px] font-bold text-green-700 leading-[1.2]">{confirmedTitle}</div>
          <div className="text-[11px] text-green-700/70 mt-[2px]">{confirmedSubtitle}</div>
        </div>
        <button onClick={onReset} className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-3 cursor-pointer text-text-light hover:text-text transition-colors flex items-center">
          <IconCrossLarge size={13} className="shrink-0" />
        </button>
      </div>
    )
  }
  return (
    <button onClick={onClick} disabled={busy}
      className="flex items-center gap-2 sm:gap-3 px-1.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-border bg-bg-card hover:border-dark/25 cursor-pointer transition-all text-left disabled:opacity-50">
      <div className="w-8 h-8 shrink-0 rounded-lg bg-white border border-border flex items-center justify-center">
        {busy
          ? <IconLoadingCircle size={15} className="text-dark animate-spin-slow" />
          : <Icon size={15} className="text-dark" />}
      </div>
      <div className="min-w-0">
        <div className="font-head text-[12px] font-bold text-text leading-[1.2]">{busy ? busyTitle : title}</div>
        <div className="text-[11px] text-text-light mt-[2px]">{subtitle}</div>
      </div>
    </button>
  )
}

// ── Location search ───────────────────────────────────────────────────────────
export default function LocationSearch({
  query, setQuery, suggestions, onSearch, onAutoDetect, onSelectCity,
  onGpxUpload, onReset, loading, locating, gpxLoading, gpxRouteName,
  locationError, isGeolocated,
}: {
  query: string; setQuery: (v: string) => void
  suggestions: CityResult[]; onSearch: () => void
  onAutoDetect: () => void; onSelectCity: (c: CityResult) => void
  onGpxUpload: (file: File) => void; onReset: () => void
  loading: boolean; locating: boolean; gpxLoading: boolean; gpxRouteName: string
  locationError: string; isGeolocated: boolean
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
        <OptionTile
          icon={IconPinLocation} confirmed={isGeolocated} busy={locating}
          title="My location" busyTitle="Detecting…" subtitle="Auto-detect"
          confirmedTitle="Location set" confirmedSubtitle="Auto-detected"
          onClick={onAutoDetect} onReset={onReset} />
        <OptionTile
          icon={IconMap} confirmed={!!gpxRouteName} busy={gpxLoading}
          title="Upload GPX" busyTitle="Loading…" subtitle="From route file"
          confirmedTitle="GPX loaded" confirmedSubtitle="Route uploaded"
          onClick={() => gpxInputRef.current?.click()} onReset={onReset} />
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
