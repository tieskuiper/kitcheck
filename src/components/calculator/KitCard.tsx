import { IconCircleInfo, IconRainy, IconClock, IconMap, IconSun } from '@central-icons-react/round-outlined-radius-3-stroke-2'
import type { KitResult, ZoneItem, PhaseNote, scoreLabel } from '../../lib/kitLogic'
import { TIER_ACCENT, TIER_BG, CAT_ICONS, CAT_LABELS } from './constants'
import type { RouteHighlights } from '../../lib/routeForecast'
import { formatNote, fmtTime, fmtWind, toF, type Unit } from './format'

// ── Kit output card ───────────────────────────────────────────────────────────
export default function KitCard({ kitResult, score, unit, highlights, startHour }: {
  kitResult: KitResult; score: ReturnType<typeof scoreLabel>; unit: Unit
  /** GPX only: what stands out along the route */
  highlights?: RouteHighlights | null; startHour?: number
}) {
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
        <div className="font-head text-[20px] sm:text-[24px] font-bold tracking-[-0.02em] mb-1.5">
          {score.label} conditions
        </div>
        {/* Feels like on the bike — what the whole kit list is based on */}
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] opacity-85">
            Feels like <strong className="opacity-100">{unit === 'F' ? `${toF(kitResult.feelsLikeC)}°F` : `${kitResult.feelsLikeC}°C`}</strong> on the bike
          </span>
          <div className="relative group">
            <button aria-label="What 'feels like on the bike' means" className="flex items-center">
              <IconCircleInfo size={15} className="text-white/60 hover:text-white/90 transition-colors" />
            </button>
            <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-[260px] max-w-[calc(100vw-3rem)] bg-white text-text rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.15)] opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all duration-150 z-50 pointer-events-none">
              <div className="font-head font-semibold mb-[6px] text-[11px] uppercase tracking-[0.06em] text-coral">Feels like on the bike</div>
              <p className="text-[11px] leading-[1.6] m-0">
                The forecast's feels-like temperature, adjusted for how hard you ride, how warm you naturally run and riding into the wind. Your hands and feet don't warm up as much from effort, so their kit is chosen a bit warmer.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Zone list — single card with dividers ── */}
      <div style={{ background: bg }} className="rounded-b-2xl border-t-none border border-black/[6%] overflow-hidden">
        {zones.map((z, idx) => {
          const Icon = CAT_ICONS[z.key]
          return (
            <div key={z.key} className={`px-4 py-3 sm:px-5 sm:py-[14px]${idx > 0 ? ' border-t border-black/[6%]' : ''}`}>

              {/* Zone header */}
              <div className="flex items-center gap-[6px] mb-[10px]">
                <Icon size={14} style={{ color: accent }} className="shrink-0" />
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
          )
        })}
      </div>

      {/* ── Along the route (GPX) ── */}
      {highlights && Object.keys(highlights).length > 0 && startHour !== undefined && (
        <RouteNotes highlights={highlights} startHour={startHour} unit={unit} />
      )}

      {/* ── Rain / heat alerts ── */}
      {kitResult.rain && (
        <div className="mt-2 bg-[#4A90D9]/[8%] rounded-xl py-[11px] px-[14px] border border-[#4A90D9]/20 flex gap-2 items-center">
          <IconRainy size={16} className="text-[#4A90D9] shrink-0" />
          <span className="text-[12px] text-[#4A90D9] leading-[1.5]">
            {kitResult.rain === 'likely'
              ? <><strong>Rain is likely</strong> — rain gear included above.</>
              : <><strong>Chance of showers</strong> — a packable jacket is listed as optional.</>}
          </span>
        </div>
      )}
      {kitResult.heat && (
        <div className="mt-2 bg-[#F5A623]/[10%] rounded-xl py-[11px] px-[14px] border border-[#F5A623]/30 flex gap-2 items-center">
          <IconSun size={16} className="text-[#B7791F] shrink-0" />
          <span className="text-[12px] text-[#8A5A12] leading-[1.5]">
            <strong>Hot ride</strong> — take an extra bottle and put on sunscreen.
          </span>
        </div>
      )}
    </div>
  )
}

function RouteNotes({ highlights, startHour, unit }: { highlights: RouteHighlights; startHour: number; unit: Unit }) {
  const clock = (offsetH: number) => {
    const min = Math.round((startHour + offsetH) * 12) * 5
    return fmtTime(Math.floor(min / 60) % 24, min % 60, unit)
  }
  const dist = (km: number) => unit === 'F' ? `mile ${Math.round(km * 0.621371)}` : `km ${Math.round(km)}`
  const temp = (c: number) => unit === 'F' ? `${toF(c)}°F` : `${c}°C`
  const { coldest, rain, headwind, descent } = highlights
  const span = (a: number, b: number) => unit === 'F'
    ? `miles ${Math.round(a * 0.621371)}–${Math.round(b * 0.621371)}`
    : `km ${Math.round(a)}–${Math.round(b)}`
  return (
    <div className="mt-2 bg-white rounded-xl py-[11px] px-[14px] border border-black/[6%] flex gap-2 items-start">
      <IconMap size={16} className="text-text-mid shrink-0 mt-[2px]" />
      <div className="text-[12px] text-text-mid leading-[1.5]">
        <strong className="text-text">Along your route</strong>
        {coldest && (
          <div>
            Coldest around {dist(coldest.km)}
            {coldest.ele !== undefined && ` (${unit === 'F' ? `${Math.round(coldest.ele * 3.28084)} ft` : `${Math.round(coldest.ele)} m`})`}
            {' '}at {clock(coldest.offsetH)}: feels like {temp(coldest.apparentTemp)}
          </div>
        )}
        {rain && (
          <div>Rain likely from {dist(rain.km)}, around {clock(rain.offsetH)} ({rain.precipProb}%)</div>
        )}
        {headwind && (
          <div>Headwind {span(headwind.fromKm, headwind.toKm)} from {clock(headwind.offsetH)}, about {fmtWind(headwind.kmh, unit)}</div>
        )}
        {descent && (
          <div>
            Long descent {span(descent.fromKm, descent.toKm)} (−{unit === 'F' ? `${Math.round(descent.dropM * 3.28084)} ft` : `${descent.dropM} m`})
            {' '}at {clock(descent.offsetH)}: a gilet or jacket for it helps
          </div>
        )}
      </div>
    </div>
  )
}
