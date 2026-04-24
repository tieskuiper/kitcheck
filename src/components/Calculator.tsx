import { useState, useRef, useMemo, useEffect, type ReactNode } from 'react'
import {
  fetchForecast, reverseGeocode, searchCity,
  getHourlySlice, getDayLabels,
  type HourlySlice, type CityResult,
} from '../lib/openmeteo'
import {
  getKitRecommendation, scoreLabel,
  type KitResult, type Intensity, type Level, type ZoneItem,
} from '../lib/kitLogic'

// ── Tier / level accent colours (dynamic, must stay inline) ──────────────────
const TIER_ACCENT: Record<string, string> = {
  'Extreme cold': '#9B5EA7', 'Cold': '#7B5EA7', 'Cool': '#4A90D9',
  'Comfortable': '#2E9E5A', 'Warm': '#F5A623', 'Hot': '#FF5130',
}
const TIER_BG: Record<string, string> = {
  'Extreme cold': '#F5EDFF', 'Cold': '#F0EDFF', 'Cool': '#EDF4FF',
  'Comfortable': '#EDFFEF', 'Warm': '#FFFAED', 'Hot': '#FFF3ED',
}
const LEVEL_ACCENT: Record<Level, string> = {
  heavy: '#4A90D9', medium: '#F5A623', light: '#FF5130', none: '#9E9D9A',
}

const INTENSITY_OPTIONS: { value: Intensity; label: string; desc: string; emoji: string }[] = [
  { value: 'easy', label: 'Easy', desc: 'Recovery / leisure', emoji: '🐢' },
  { value: 'moderate', label: 'Moderate', desc: 'Endurance ride', emoji: '⚡' },
  { value: 'hard', label: 'Hard', desc: 'Training / fast group', emoji: '🔥' },
  { value: 'race', label: 'Race', desc: 'Full effort', emoji: '🏁' },
]

const CAT_ICONS: Record<string, string> = { head: '🪖', torso: '🧥', hands: '🧤', legs: '🩲', feet: '🥾' }
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
  loading, locating, locationError, locationName, weatherLoaded, isLive,
}: {
  query: string; setQuery: (v: string) => void
  suggestions: CityResult[]; onSearch: () => void
  onAutoDetect: () => void; onSelectCity: (c: CityResult) => void
  loading: boolean; locating: boolean
  locationError: string; locationName: string; weatherLoaded: boolean; isLive: boolean
}) {
  return (
    <div>
      <div className="flex gap-2 relative">
        {/* Input */}
        <div className="flex-1 min-w-0 flex items-center bg-bg-card border-[1.5px] border-border rounded-[10px] px-3 gap-2">
          <span className="opacity-40 text-sm sm:text-[15px]">🔍</span>
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
            <button onClick={() => setQuery('')}
              className="shrink-0 bg-transparent border-none cursor-pointer text-text-light text-[16px] hover:opacity-75">
              ×
            </button>
          )}
        </div>
        {/* Search */}
        <button onClick={onSearch} disabled={loading || !query.trim()}
          className="shrink-0 px-3 sm:px-4 bg-coral text-white border-none rounded-[10px] font-head text-[14px] font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90">
          {loading ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="size-4 animate-spin-slow"><path d="M12 4V2M12 22v-2M4 12H2M22 12h-2M6.34 6.34 4.93 4.93M19.07 19.07l-1.41-1.41M17.66 6.34l1.41-1.41M4.93 19.07l1.41-1.41" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="size-4"><path d="M14 6L20 12L14 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M19 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
        </button>

        {/* Dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full mt-[6px] left-0 right-0 bg-white border border-border rounded-xl overflow-hidden z-20 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => onSelectCity(s)}
                className={`w-full text-left px-[14px] py-[11px] bg-transparent border-none cursor-pointer font-body text-[13px] text-text-mid flex items-center gap-2 hover:opacity-75 ${i < suggestions.length - 1 ? 'border-b border-border' : ''
                  }`}>
                <span className="text-[11px] text-text-light">📍</span>{s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Or divider + location button */}
      <div className="flex items-center gap-3 my-3">
        <div className="flex-1 h-px bg-border" />
        <span className="font-head text-[11px] text-text-light uppercase tracking-[0.08em]">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>
      <button onClick={onAutoDetect} disabled={locating}
        className="w-full flex items-center justify-center gap-[6px] py-[8px] px-4 rounded-[10px] border border-border bg-transparent font-head text-[13px] font-semibold text-text-mid hover:border-text-mid hover:text-text transition-all disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed">
        <span className="text-[13px]">📍</span>
        {locating ? 'Detecting…' : 'Use current location'}
      </button>

      {locationError && (
        <div className="mt-2 text-[12px] text-[#e53] py-[7px] px-[11px] bg-[#fff5f5] rounded-lg border border-[#fdd]">
          {locationError}
        </div>
      )}

      {weatherLoaded && locationName && (
        <div className="mt-2.5 flex flex-wrap items-center gap-[6px]">
          <span className="w-[6px] h-[6px] rounded-full bg-coral inline-block shrink-0" />
          <span className="font-head text-[12px] font-semibold text-text">{locationName}</span>
          <span className="text-[11px] text-text-light">— {isLive ? 'live conditions' : 'forecast'} loaded</span>
        </div>
      )}
    </div>
  )
}

function toF(c: number) { return Math.round(c * 9 / 5 + 32) }

// ── Weather chips ─────────────────────────────────────────────────────────────
function WeatherChips({ weather, unit }: { weather: HourlySlice; unit: 'C' | 'F' }) {
  const temp = unit === 'F' ? `${toF(weather.temperature)}°F` : `${weather.temperature}°C`
  const chips = [
    { icon: '🌡️', label: 'Temperature', value: temp },
    { icon: '🌬️', label: 'Wind', value: `${weather.windspeed} km/h` },
    { icon: '🌧️', label: 'Rain', value: `${weather.precipProb}%` },
    { icon: '☁️', label: 'Cloud', value: `${weather.cloudcover}%` },
  ]
  return (
    <div className="grid grid-cols-2 gap-2 mt-3 animate-fade-up">
      {chips.map(c => (
        <div key={c.label} className="bg-coral/5 border border-coral/[13%] rounded-[10px] py-[10px] px-3 flex items-center gap-2">
          <span className="text-[18px]">{c.icon}</span>
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
function KitCard({ kitResult, score }: { kitResult: KitResult; score: ReturnType<typeof scoreLabel> }) {
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
      {/* Header — background is dynamic (tier colour) */}
      <div style={{ background: accent }} className="rounded-2xl py-4 px-4 sm:py-5 sm:px-[22px] mb-[14px] text-white">
        <div className="text-[11px] font-head font-semibold tracking-[0.08em] uppercase opacity-80 mb-1">
          Kit recommendation
        </div>
        <div className="font-head text-[18px] sm:text-[22px] font-bold tracking-[-0.02em] mb-[6px]">
          {score.label} conditions
        </div>
        <div className="flex items-center gap-2">
          <div className="text-[12px] opacity-80">
            Score: <strong>{kitResult.score}</strong> / 110
          </div>
          <div className="relative group">
            <button
              className="w-[18px] h-[18px] rounded-full border border-white/40 bg-white/15 flex items-center justify-center cursor-pointer hover:bg-white/25 transition-colors shrink-0"
              aria-label="How the score is calculated"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" fill="none" className="w-[10px] h-[10px]">
                <path d="M7 6.5v4M7 4.5v.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            <div className="absolute top-full left-0 mt-2 w-[260px] bg-white text-text rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.15)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 pointer-events-none">
              <div className="font-head font-semibold mb-[6px] text-[11px] uppercase tracking-[0.06em] text-coral">How the score works</div>
              <p className="text-[11px] leading-[1.6] m-0">
                A comfort score based on how the conditions actually feel on the bike factoring in temperature, wind, your ride intensity, and how warm you naturally run.
              </p>
              <div className="mt-[6px] text-[10px] text-text-light">Lower = more kit needed · Higher = less kit needed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Zone grid — background is dynamic (tier bg) */}
      <div className="flex flex-col gap-2 mb-2">
        {zones.map(z => {
          const a = LEVEL_ACCENT[z.level as Level]
          return (
            <div key={z.key} style={{ background: bg }} className="rounded-xl py-2.5 px-3 sm:py-3 sm:px-[14px] border border-black/5">
              <div className="flex items-center gap-[6px] mb-[6px]">
                <span className="text-[14px]">{CAT_ICONS[z.key]}</span>
                <span style={{ color: a }} className="font-head text-[10px] font-bold tracking-[0.07em] uppercase">
                  {CAT_LABELS[z.key]}
                </span>
              </div>
              <ul className="p-0 m-0 list-none">
                {(z.items as ZoneItem[]).map((zitem, i) => (
                  <li key={i} className="flex gap-[6px] items-baseline text-[12px] font-head font-semibold text-text mb-[3px] last:mb-0">
                    <span style={{ color: a }} className="text-[7px] shrink-0 relative top-[-1px]">●</span>
                    <span>{zitem.name}</span>
                    {zitem.optional && (
                      <span className="font-normal text-[10px] text-text-light">Optional</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Rain alert */}
      {kitResult.torso.detail?.includes('waterproof') && (
        <div className="bg-[#4A90D9]/[8%] rounded-xl py-[11px] px-[14px] border border-[#4A90D9]/20 flex gap-2 items-start">
          <span className="shrink-0">🌧️</span>
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

// ── Main Calculator ───────────────────────────────────────────────────────────
export default function Calculator() {
  const [cityQuery, setCityQuery] = useState('')
  const [suggestions, setSuggestions] = useState<CityResult[]>([])
  const [locationName, setLocationName] = useState('')
  const [locationError, setLocationError] = useState('')
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [weatherLoaded, setWeatherLoaded] = useState(false)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [forecast, setForecast] = useState<any>(null)
  const [weather, setWeather] = useState<HourlySlice | null>(null)
  const DAY_LABELS = getDayLabels()
  const [selectedDay, setSelectedDay] = useState(0)
  const [selectedHour, setSelectedHour] = useState(8)
  const [intensity, setIntensity] = useState<Intensity>('moderate')
  const [warmthBias, setWarmthBias] = useState(0)
  const [kitResult, setKitResult] = useState<KitResult | null>(null)
  const [unit, setUnit] = useState<'C' | 'F'>('C')

  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hourLabel = `${String(selectedHour).padStart(2, '0')}:00`
  const isLive = selectedDay === 0 && selectedHour === new Date().getHours()
  const sl = useMemo(() => kitResult ? scoreLabel(kitResult.score) : null, [kitResult])

  function calculate(w: HourlySlice, wb: number, int: Intensity) {
    setKitResult(getKitRecommendation({
      apparentTemp: w.apparentTemp, windspeed: w.windspeed,
      precipProb: w.precipProb, warmthBias: wb, intensity: int,
    }))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function updateWeather(fc: any, day: number, hour: number, wb: number, int: Intensity) {
    const w = getHourlySlice(fc, day, hour)
    setWeather(w)
    calculate(w, wb, int)
  }

  async function loadForecast(lat: number, lon: number, hour = selectedHour) {
    setLoading(true); setForecast(null); setKitResult(null); setLocationError('')
    try {
      const fc = await fetchForecast(lat, lon)
      setForecast(fc)
      setWeatherLoaded(true)
      updateWeather(fc, selectedDay, hour, warmthBias, intensity)
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
      setLocationName(name); setCityQuery(name); setLocating(false)
      await loadForecast(lat, lon, currentHour)
    }, () => { setLocationError('Location denied. Please search manually.'); setLocating(false) })
  }

  function handleDayChange(day: number) {
    setSelectedDay(day)
    if (forecast) updateWeather(forecast, day, selectedHour, warmthBias, intensity)
  }

  function handleHourChange(hour: number) {
    setSelectedHour(hour)
    if (forecast) updateWeather(forecast, selectedDay, hour, warmthBias, intensity)
  }

  function handleIntensityChange(int: Intensity) {
    setIntensity(int)
    if (weather) calculate(weather, warmthBias, int)
  }

  function handleWarmthChange(wb: number) {
    setWarmthBias(wb)
    if (weather) calculate(weather, wb, intensity)
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
                  loading={loading} locating={locating}
                  locationError={locationError}
                  locationName={locationName} weatherLoaded={weatherLoaded} isLive={isLive} />
              </Card>

              <Card>
                <div className="font-head text-[14px] font-bold mb-4">Rider profile</div>
                <div className="mb-4">
                  <Label text="Intensity" />
                  <div className="grid grid-cols-2 gap-[6px]">
                    {INTENSITY_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => handleIntensityChange(o.value)}
                        className={`flex items-center gap-2 px-3 py-[10px] rounded-[10px] cursor-pointer text-left transition-all hover:opacity-90 ${intensity === o.value
                          ? 'border-[1.5px] border-coral bg-coral/[6%]'
                          : 'border-[1.5px] border-border bg-transparent'
                          }`}>
                        <span className="text-[18px]">{o.emoji}</span>
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
                  <div className="mb-1 flex justify-between items-baseline">
                    <Label text="Departure" />
                    <span className="font-head text-[22px] font-bold text-coral">{hourLabel}</span>
                  </div>
                  <input type="range" min={0} max={23} value={selectedHour}
                    aria-label="Departure time"
                    onChange={e => handleHourChange(Number(e.target.value))} />
                  <div className="flex justify-between mt-1 font-head text-[11px] text-text-light">
                    {['00:00', '06:00', '12:00', '18:00', '23:00'].map(t => <span key={t}>{t}</span>)}
                  </div>
                  {weather && <WeatherChips weather={weather} unit={unit} />}
                </Card>
              )}
            </div>

            {/* Right: output */}
            <div className="md:sticky md:top-[88px] min-w-0">
              {kitResult && sl && weatherLoaded ? (
                <KitCard kitResult={kitResult} score={sl} />
              ) : (
                <div className="hidden md:block bg-white rounded-2xl p-12 border-[1.5px] border-dashed border-border text-center text-text-light">
                  <div className="text-[44px] mb-3">📍</div>
                  <div className="font-head text-[15px] font-semibold text-text-mid mb-[6px]">
                    Enter your ride location
                  </div>
                  <div className="text-[13px]">Search a city or tap auto-detect to get your kit</div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
