import type { Intensity } from '../../lib/kitLogic'
import { INTENSITY_OPTIONS, WARMTH_LABELS } from './constants'
import { Card, Label } from './ui'

// ── Rider profile — intensity + warmth tendency ──────────────────────────────
export default function RiderProfile({ intensity, onIntensityChange, warmthBias, onWarmthChange }: {
  intensity: Intensity; onIntensityChange: (i: Intensity) => void
  warmthBias: number; onWarmthChange: (wb: number) => void
}) {
  return (
    <Card>
      <div className="font-head text-[14px] font-bold mb-4">Rider profile</div>
      <div className="mb-4">
        <Label text="Intensity" />
        <div className="grid grid-cols-2 gap-[6px]">
          {INTENSITY_OPTIONS.map(o => (
            <button key={o.value} onClick={() => onIntensityChange(o.value)}
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
            {WARMTH_LABELS[warmthBias + 2]}
          </span>
        </div>
        <input type="range" min={-2} max={2} step={1} value={warmthBias}
          aria-label="Warmth tendency"
          onChange={e => onWarmthChange(Number(e.target.value))} />
        <div className="flex justify-between mt-1 font-head text-[11px] text-text-light">
          <span>Always cold</span><span>Always warm</span>
        </div>
      </div>
    </Card>
  )
}
