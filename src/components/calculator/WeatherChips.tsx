import { IconThermostat, IconWind, IconRainy, IconCloud } from '@central-icons-react/round-outlined-radius-3-stroke-2'
import type { HourlySlice } from '../../lib/openmeteo'
import { toF, fmtWind, type Unit } from './format'

// ── Weather chips ─────────────────────────────────────────────────────────────
export default function WeatherChips({ weather, unit }: { weather: HourlySlice; unit: Unit }) {
  const temp = unit === 'F' ? `${toF(weather.temperature)}°F` : `${weather.temperature}°C`
  const chips = [
    { icon: <IconThermostat size={18} className="text-coral shrink-0" />, label: 'Temperature', value: temp },
    { icon: <IconWind size={18} className="text-coral shrink-0" />, label: 'Wind', value: fmtWind(weather.windspeed, unit) },
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
