import { useEffect, useMemo, useRef, useState } from 'react'
import { IconRainy, IconWind } from '@central-icons-react/round-outlined-radius-3-stroke-2'
import { getKitRecommendation, scoreLabel, type Intensity, type KitResult, type RiderInput } from '../../lib/kitLogic'
import { BASELINE, ZONES, type Zone } from '../../lib/guideBase'
import { preferredUnit, saveUnit, type Unit } from '../../lib/units'
import KitCard from '../calculator/KitCard'
import { INTENSITY_OPTIONS, CAT_LABELS, CAT_ICONS } from '../calculator/constants'

// ── Interactive temperature chart ─────────────────────────────────────────────
// Everything is computed in the browser from kitLogic, so it always matches the calculator.
// Server-rendered with the defaults (10°C, moderate), so crawlers see a full kit list too.

const MIN_C = -10
const MAX_C = 35
const STEP = 0.5
const WINDY_KMH = 35
const RAIN_PCT = 80

interface Row { label: string; zone: Zone; match: (name: string) => boolean; href?: string }

const ROWS: Row[] = [
  { label: 'Cap under helmet', zone: 'head', match: n => /cap$/i.test(n) },
  { label: 'Insulated jacket', zone: 'torso', match: n => n === 'Insulated jacket' },
  { label: 'Winter jersey', zone: 'torso', match: n => /winter jersey/i.test(n) },
  { label: 'Base layer', zone: 'torso', match: n => /base layer/i.test(n), href: '/guide/when-to-wear-a-base-layer-cycling/' },
  { label: 'Long-sleeve jersey', zone: 'torso', match: n => n === 'Long-sleeve jersey' },
  { label: 'Short-sleeve jersey', zone: 'torso', match: n => /^(jersey|summer jersey|lightweight summer jersey)$/i.test(n) },
  { label: 'Arm warmers', zone: 'torso', match: n => n === 'Arm warmers', href: '/guide/when-to-wear-arm-warmers/' },
  { label: 'Gilet', zone: 'torso', match: n => /gilet/i.test(n), href: '/guide/when-to-wear-a-cycling-gilet/' },
  { label: 'Rain jacket', zone: 'torso', match: n => /rain jacket/i.test(n), href: '/guide/what-to-wear-cycling-in-the-rain/' },
  { label: 'Winter gloves', zone: 'hands', match: n => /winter gloves/i.test(n), href: '/guide/when-to-wear-winter-cycling-gloves/' },
  { label: 'Light full-finger gloves', zone: 'hands', match: n => /light cycling gloves|full-finger/i.test(n) },
  { label: 'Fingerless or none', zone: 'hands', match: n => /fingerless/i.test(n) },
  { label: 'Thermal bib tights', zone: 'legs', match: n => n === 'Thermal bib tights', href: '/guide/bib-tights-or-bib-shorts/' },
  { label: 'Bib tights', zone: 'legs', match: n => n === 'Bib tights', href: '/guide/bib-tights-or-bib-shorts/' },
  { label: 'Leg warmers', zone: 'legs', match: n => n === 'Leg warmers', href: '/guide/when-to-wear-leg-warmers/' },
  { label: 'Knee warmers', zone: 'legs', match: n => n === 'Knee warmers', href: '/guide/when-to-wear-knee-warmers/' },
  { label: 'Bib shorts', zone: 'legs', match: n => n === 'Bib shorts' },
  { label: 'Winter overshoes', zone: 'feet', match: n => /(thermal|waterproof)( winter)? overshoes/i.test(n), href: '/guide/when-to-wear-overshoes-cycling/' },
  { label: 'Light overshoes / toe covers', zone: 'feet', match: n => /light( rain)? overshoes|toe covers/i.test(n), href: '/guide/when-to-wear-overshoes-cycling/' },
]

type Status = 'required' | 'optional' | null
interface Segment { from: number; to: number; status: Exclude<Status, null> }

const toF = (c: number) => Math.round(c * 9 / 5 + 32)
const fToC = (f: number) => (f - 32) * 5 / 9
const pct = (c: number) => ((c - MIN_C) / (MAX_C - MIN_C)) * 100
const fmt = (c: number, unit: Unit) => unit === 'F' ? `${toF(c)}°F` : `${Math.round(c)}°C`

function statusIn(kit: KitResult, row: Row): Status {
  const items = kit[row.zone].items.filter(i => row.match(i.name))
  if (!items.length) return null
  return items.some(i => !i.optional) ? 'required' : 'optional'
}

function segmentsFor(kits: { t: number; kit: KitResult }[], row: Row): Segment[] {
  const segs: Segment[] = []
  for (const { t, kit } of kits) {
    const s = statusIn(kit, row)
    const last = segs[segs.length - 1]
    if (s && last && last.status === s && Math.abs(last.to - t) < 1e-6) last.to = t + STEP
    else if (s) segs.push({ from: t, to: t + STEP, status: s })
  }
  return segs
}

export default function ChartExplorer() {
  const [unit, setUnit] = useState<Unit>('C')
  const [tempC, setTempC] = useState(10)
  const [intensity, setIntensity] = useState<Intensity>('moderate')
  const [windy, setWindy] = useState(false)
  const [rain, setRain] = useState(false)
  const plotRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setUnit(preferredUnit()) }, [])
  const changeUnit = (u: Unit) => { setUnit(u); saveUnit(u) }

  const input: Omit<RiderInput, 'apparentTemp'> = {
    ...BASELINE, intensity,
    windspeed: windy ? WINDY_KMH : BASELINE.windspeed,
    precipProb: rain ? RAIN_PCT : 0,
  }
  const kit = getKitRecommendation({ ...input, apparentTemp: tempC })
  const score = scoreLabel(kit.score)

  const rows = useMemo(() => {
    const kits: { t: number; kit: KitResult }[] = []
    for (let t = MIN_C; t < MAX_C; t += STEP) kits.push({ t, kit: getKitRecommendation({ ...input, apparentTemp: t }) })
    return ROWS.map(r => ({ ...r, segments: segmentsFor(kits, r) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intensity, windy, rain])

  // Slider works in the unit on screen; state stays in °C
  const sliderMin = unit === 'F' ? toF(MIN_C) : MIN_C
  const sliderMax = unit === 'F' ? toF(MAX_C) : MAX_C
  const sliderVal = unit === 'F' ? toF(tempC) : Math.round(tempC)
  const onSlide = (v: number) => setTempC(unit === 'F' ? fToC(v) : v)

  // Fewer labels on phones; `wide` ones only show from sm up
  const ticks = (unit === 'F'
    ? [20, 30, 40, 50, 60, 70, 80, 90].map(f => ({ c: fToC(f), wide: f % 20 !== 0 }))
    : [-10, -5, 0, 5, 10, 15, 20, 25, 30, 35].map(c => ({ c, wide: c % 10 !== 0 })))

  // Click or drag on the chart to move the temperature
  const pickFromPointer = (clientX: number) => {
    const el = plotRef.current
    if (!el) return
    const { left, width } = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - left) / width))
    const c = MIN_C + ratio * (MAX_C - MIN_C)
    setTempC(unit === 'F' ? fToC(Math.round(toF(c))) : Math.round(c))
  }

  const toggle = (on: boolean, set: (v: boolean) => void, label: string, Icon: typeof IconWind) => (
    <button type="button" aria-pressed={on} onClick={() => set(!on)}
      className={`flex items-center gap-2 px-3 py-2 rounded-[10px] border-[1.5px] font-head text-[12px] font-bold cursor-pointer transition-colors ${on ? 'border-coral bg-coral/6 text-coral' : 'border-border text-text-mid hover:border-text-light'}`}>
      <Icon size={16} />{label}
    </button>
  )

  return (
    <div className="flex flex-col gap-10 md:gap-14">

      {/* ── Kit finder ── */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 md:gap-7 items-start">
        <div className="bg-white rounded-2xl border border-border p-5 sm:p-7 md:sticky md:top-[88px]">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <p className="font-head text-[11px] font-semibold tracking-[0.08em] uppercase text-coral mb-1">Feels like</p>
              <p className="font-head font-bold text-5xl sm:text-6xl tracking-tight text-text tabular-nums leading-none">
                {fmt(tempC, unit)}
              </p>
              <p className="text-sm text-text-light mt-1.5 tabular-nums">{unit === 'F' ? `${Math.round(tempC)}°C` : `${toF(tempC)}°F`}</p>
            </div>
            <div className="flex rounded-lg border border-border overflow-hidden font-head text-[13px] font-semibold leading-none" role="group" aria-label="Temperature unit">
              {(['C', 'F'] as const).map(u => (
                <button key={u} type="button" aria-pressed={unit === u} onClick={() => changeUnit(u)}
                  className={`px-3 py-[9px] cursor-pointer transition-colors ${unit === u ? 'bg-coral text-white' : 'text-text-mid'}`}>°{u}</button>
              ))}
            </div>
          </div>

          <input type="range" min={sliderMin} max={sliderMax} step={1} value={sliderVal}
            aria-label="Feels-like temperature" onChange={e => onSlide(Number(e.target.value))} />
          <div className="flex justify-between mt-1.5 font-head text-[11px] text-text-light tabular-nums">
            <span>{fmt(MIN_C, unit)}</span><span>{fmt(MAX_C, unit)}</span>
          </div>

          <p className="font-head text-[11px] font-semibold tracking-[0.08em] uppercase text-coral mt-6 mb-2">Effort</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-2 lg:grid-cols-4 gap-1.5">
            {INTENSITY_OPTIONS.map(o => (
              <button key={o.value} type="button" aria-pressed={intensity === o.value} onClick={() => setIntensity(o.value)}
                className={`flex items-center gap-2 px-3 py-[9px] rounded-[10px] border-[1.5px] cursor-pointer text-left transition-colors ${intensity === o.value ? 'border-coral bg-coral/6' : 'border-border hover:border-text-light'}`}>
                {o.icon(intensity === o.value)}
                <span className={`font-head text-[12px] font-bold ${intensity === o.value ? 'text-coral' : 'text-text'}`}>{o.label}</span>
              </button>
            ))}
          </div>

          <p className="font-head text-[11px] font-semibold tracking-[0.08em] uppercase text-coral mt-6 mb-2">Conditions</p>
          <div className="flex flex-wrap gap-1.5">
            {toggle(windy, setWindy, unit === 'F' ? `Windy (${Math.round(WINDY_KMH * 0.621)} mph)` : `Windy (${WINDY_KMH} km/h)`, IconWind)}
            {toggle(rain, setRain, 'Rain likely', IconRainy)}
          </div>
        </div>

        <KitCard kitResult={kit} score={score} unit={unit} />
      </div>

      {/* ── Range chart ── */}
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div className="max-w-xl">
            <h2 className="font-head font-bold text-2xl md:text-[2rem] tracking-tight leading-tight text-text">When each piece of kit comes in</h2>
            <p className="text-text-mid leading-relaxed mt-2">
              Every bar is the temperature range where you need it, for the effort and conditions above. Click the chart to jump to a temperature.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-text-mid">
            <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-2.5 rounded-full bg-coral" />Recommended</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-5 h-2.5 rounded-full bar-optional" />Optional</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-4 sm:p-6 select-none">
          {/* Axis */}
          <div className="grid grid-cols-[96px_1fr] sm:grid-cols-[180px_1fr] gap-3 mb-2">
            <span />
            <div className="relative h-5">
              {ticks.map(t => (
                <span key={t.c} className={`absolute -translate-x-1/2 font-head text-[10px] sm:text-[11px] font-semibold text-text-light tabular-nums ${t.wide ? 'max-sm:hidden' : ''}`}
                  style={{ left: `${pct(t.c)}%` }}>{fmt(t.c, unit)}</span>
              ))}
            </div>
          </div>

          {ZONES.map(zone => {
            const zoneRows = rows.filter(r => r.zone === zone)
            const Icon = CAT_ICONS[zone]
            return (
              <div key={zone} className="border-t border-border first-of-type:border-t-0 py-2">
                <div className="flex items-center gap-1.5 py-1.5 text-text-light">
                  <Icon size={13} />
                  <span className="font-head text-[10px] font-bold tracking-[0.07em] uppercase">{CAT_LABELS[zone]}</span>
                </div>
                {zoneRows.map(r => (
                  <div key={r.label} className="grid grid-cols-[96px_1fr] sm:grid-cols-[180px_1fr] gap-3 items-center py-[5px]">
                    {r.href
                      ? <a href={r.href} className="text-[11px] sm:text-[13px] text-text hover:text-coral transition-colors leading-tight">{r.label}</a>
                      : <span className="text-[11px] sm:text-[13px] text-text leading-tight">{r.label}</span>}
                    <div className="relative h-3.5 rounded-full bg-bg-card cursor-pointer"
                      ref={zone === 'head' ? plotRef : undefined}
                      onPointerDown={e => pickFromPointer(e.clientX)}
                      onPointerMove={e => { if (e.buttons === 1) pickFromPointer(e.clientX) }}>
                      {r.segments.map((s, i) => (
                        <span key={i} title={`${r.label}: ${s.status} from ${fmt(s.from, unit)} to ${fmt(s.to, unit)}`}
                          className={`absolute inset-y-0 rounded-full transition-all duration-300 ${s.status === 'required' ? 'bg-coral' : 'bar-optional'}`}
                          style={{ left: `${pct(s.from)}%`, width: `${pct(s.to) - pct(s.from)}%` }} />
                      ))}
                      <span aria-hidden="true" className="absolute -inset-y-1.5 w-0.5 -translate-x-1/2 bg-text rounded-full pointer-events-none"
                        style={{ left: `${pct(tempC)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
