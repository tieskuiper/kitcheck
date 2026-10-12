import { useState } from 'react'
import type { GpxRoute } from '../../lib/gpx'
import type { Intensity } from '../../lib/kitLogic'
import { SPEED_MIN_KMH, SPEED_MAX_KMH, type SpeedSource } from '../../lib/rideDuration'
import { fmtDuration, fmtDistance, fmtElevation, fmtSpeed, type Unit } from './format'
import { Label } from './ui'

const KMH_PER_MPH = 1.609344

// ── GPX ride duration: estimate up front, speed tweak tucked behind "Adjust" ─
export default function RouteDuration({ route, duration, speedKmh, speedSource, intensity, unit, onSpeedChange, onReset }: {
  route: GpxRoute; duration: number; speedKmh: number; speedSource: SpeedSource
  intensity: Intensity; unit: Unit
  onSpeedChange: (kmh: number) => void; onReset: () => void
}) {
  const [open, setOpen] = useState(false)

  const sourceLabel = {
    estimate: `estimated for ${intensity === 'easy' ? 'an' : 'a'} ${intensity} pace`,
    recorded: 'from your recorded ride',
    saved: 'your average speed',
    custom: 'your average speed',
  }[speedSource]

  // Slider works in the unit the rider thinks in; state stays in km/h
  const mph = unit === 'F'
  const toDisplay = (kmh: number) => mph ? Math.round(kmh / KMH_PER_MPH * 2) / 2 : kmh
  const fromDisplay = (v: number) => mph ? Math.round(v * KMH_PER_MPH * 2) / 2 : v
  const min = toDisplay(SPEED_MIN_KMH), max = toDisplay(SPEED_MAX_KMH)

  return (
    <div className="mt-4">
      <div className="flex justify-between items-baseline mb-2">
        <Label text="Est. duration" />
        <span className="font-head text-[22px] font-bold text-coral">{fmtDuration(duration)}</span>
      </div>

      <div className="bg-bg-card rounded-[10px] px-3 py-[10px] text-[11px] text-text-mid leading-[1.5]">
        <div className="flex items-start justify-between gap-3">
          <p className="m-0">
            <strong>{fmtDistance(route.distanceKm, unit)}</strong>
            {' · '}
            <strong>↑ {fmtElevation(route.elevationGainM, unit)}</strong>
            {' · '}
            <strong>{fmtSpeed(speedKmh, unit)}</strong> avg, {sourceLabel}
          </p>
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-controls="route-speed"
            className="shrink-0 font-head text-[11px] font-semibold text-coral cursor-pointer hover:opacity-75"
          >
            {open ? 'Done' : 'Adjust'}
          </button>
        </div>

        {open && (
          <div id="route-speed" className="mt-3 pt-3 border-t border-black/[6%]">
            <div className="flex justify-between items-baseline mb-1">
              <label htmlFor="route-speed-input" className="font-head text-[11px] font-semibold text-text">
                Your average speed
              </label>
              <span className="font-head text-[13px] font-bold text-coral">{fmtSpeed(speedKmh, unit)}</span>
            </div>
            <input
              id="route-speed-input"
              type="range"
              min={min} max={max} step={0.5}
              value={toDisplay(speedKmh)}
              onChange={e => onSpeedChange(fromDisplay(Number(e.target.value)))}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-text-light">Like the avg speed in Strava or on your bike computer. Remembered for your next route.</span>
              {speedSource !== 'estimate' && (
                <button type="button" onClick={onReset} className="shrink-0 ml-3 font-head text-[11px] font-semibold text-text-mid underline underline-offset-2 cursor-pointer hover:text-text">
                  Use estimate
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
