import type { PhaseNote } from '../../lib/kitLogic'

export type Unit = 'C' | 'F'

export function toF(c: number) { return Math.round(c * 9 / 5 + 32) }
export function toMph(kmh: number) { return Math.round(kmh * 0.621371) }

export function fmtTime(h: number, m: number, unit: Unit): string {
  if (unit === 'C') return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export function formatNote(pn: PhaseNote, unit: Unit): string {
  if (pn.tempC === undefined) return pn.note
  const t = unit === 'F' ? `${toF(pn.tempC)}°F` : `${pn.tempC}°C`
  return pn.note.replace('{T}', t)
}

export function fmtDuration(h: number): string {
  const total = Math.round(h * 12) * 5   // minutes, to the nearest 5
  const hh = Math.floor(total / 60), mm = total % 60
  if (!hh) return `${mm}m`
  return mm ? `${hh}h ${String(mm).padStart(2, '0')}m` : `${hh}h`
}

export function fmtSpeed(kmh: number, unit: Unit): string {
  return unit === 'F' ? `${Math.round(kmh * 0.621371 * 2) / 2} mph` : `${kmh} km/h`
}

export function fmtDistance(km: number, unit: Unit): string {
  return unit === 'F' ? `${Math.round(km * 0.621371 * 10) / 10} mi` : `${km} km`
}

export function fmtElevation(m: number, unit: Unit): string {
  return unit === 'F' ? `${Math.round(m * 3.28084)} ft` : `${m} m`
}

export function fmtWind(kmh: number, unit: Unit): string {
  return unit === 'F' ? `${toMph(kmh)} mph` : `${kmh} km/h`
}
