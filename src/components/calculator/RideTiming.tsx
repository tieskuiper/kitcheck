import type { HourlySlice, getDayLabels } from '../../lib/openmeteo'
import type { GpxRoute } from '../../lib/gpx'
import type { Intensity } from '../../lib/kitLogic'
import { INTENSITY_OPTIONS } from './constants'
import { fmtTime, fmtDuration, fmtDistance, fmtElevation, type Unit } from './format'
import { Card, Label } from './ui'
import DayTabs from './DayTabs'
import WeatherChips from './WeatherChips'

// ── Day, departure time and duration ─────────────────────────────────────────
export default function RideTiming({
  days, selectedDay, onDayChange,
  selectedHour, onHourChange, rideDuration, onDurationChange,
  gpxRoute, intensity, weather, unit,
}: {
  days: ReturnType<typeof getDayLabels>; selectedDay: number; onDayChange: (d: number) => void
  selectedHour: number; onHourChange: (h: number) => void
  rideDuration: number; onDurationChange: (d: number) => void
  gpxRoute: GpxRoute | null; intensity: Intensity
  weather: HourlySlice | null; unit: Unit
}) {
  const startH = Math.floor(selectedHour)
  const startM = (selectedHour % 1) * 60
  const hourLabel = fmtTime(startH, startM, unit)
  const endAbsHour = selectedHour + rideDuration
  const endHourOfDay = Math.floor(endAbsHour) % 24
  const endMinutes = (endAbsHour % 1) * 60
  const endDayOffset = Math.floor(endAbsHour / 24)
  const endLabel = fmtTime(endHourOfDay, endMinutes, unit) + (endDayOffset > 0 ? ' +1d' : '')

  return (
    <Card>
      <div className="font-head text-[14px] font-bold mb-4">Day & departure time</div>
      <DayTabs days={days} selected={selectedDay} onChange={onDayChange} />

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
        onChange={e => onHourChange(Number(e.target.value))} />
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
            <strong>{fmtDistance(gpxRoute.distanceKm, unit)}</strong>
            {' '}·{' '}
            <strong>↑ {fmtElevation(gpxRoute.elevationGainM, unit)}</strong>
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
            onChange={e => onDurationChange(Number(e.target.value))} />
          <div className="flex justify-between mt-1 font-head text-[11px] text-text-light">
            <span>1h</span><span>4h 30m</span><span>8h</span>
          </div>
        </div>
      )}

      {weather && <WeatherChips weather={weather} unit={unit} />}
    </Card>
  )
}
