import type { HourlySlice, getDayLabels } from '../../lib/openmeteo'
import type { GpxRoute } from '../../lib/gpx'
import type { Intensity } from '../../lib/kitLogic'
import type { SpeedSource } from '../../lib/rideDuration'
import { fmtTime, fmtDuration, type Unit } from './format'
import { Card, Label } from './ui'
import DayTabs from './DayTabs'
import WeatherChips from './WeatherChips'
import RouteDuration from './RouteDuration'

// ── Day, departure time and duration ─────────────────────────────────────────
export default function RideTiming({
  days, selectedDay, onDayChange,
  selectedHour, onHourChange, rideDuration, onDurationChange,
  gpxRoute, intensity, weather, unit,
  speedKmh, speedSource, onSpeedChange, onSpeedReset,
}: {
  days: ReturnType<typeof getDayLabels>; selectedDay: number; onDayChange: (d: number) => void
  selectedHour: number; onHourChange: (h: number) => void
  rideDuration: number; onDurationChange: (d: number) => void
  gpxRoute: GpxRoute | null; intensity: Intensity
  weather: HourlySlice | null; unit: Unit
  speedKmh: number; speedSource: SpeedSource
  onSpeedChange: (kmh: number) => void; onSpeedReset: () => void
}) {
  const startH = Math.floor(selectedHour)
  const startM = (selectedHour % 1) * 60
  const hourLabel = fmtTime(startH, startM, unit)
  // End time to the nearest 5 minutes (GPX durations aren't whole half hours)
  const endTotalMin = Math.round((selectedHour + rideDuration) * 12) * 5
  const endDayOffset = Math.floor(endTotalMin / (24 * 60))
  const endLabel = fmtTime(Math.floor(endTotalMin / 60) % 24, endTotalMin % 60, unit) + (endDayOffset > 0 ? ' +1d' : '')

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
        <RouteDuration
          route={gpxRoute} duration={rideDuration}
          speedKmh={speedKmh} speedSource={speedSource}
          intensity={intensity} unit={unit}
          onSpeedChange={onSpeedChange} onReset={onSpeedReset} />
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
