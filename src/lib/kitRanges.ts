/**
 * Temperature ranges per kit item, read off kitLogic by scanning feels-like temperatures.
 * Item pages, the chart and llms.txt quote these, so the numbers always match the calculator.
 */
import { getKitRecommendation, type Intensity, type KitResult, type RiderInput } from './kitLogic'
import { BASELINE, ZONES } from './guideData'

export type ItemStatus = 'required' | 'optional' | null

/** Open-ended ranges use null: { from: null, to: 8 } means "below 8°C" */
export interface TempRange { from: number | null; to: number | null }
export interface ItemRanges { required: TempRange | null; optional: TempRange | null }

const SCAN_FROM = -15
const SCAN_TO = 40
const STEP = 0.25

export function itemStatus(kit: KitResult, match: (name: string) => boolean): ItemStatus {
  const items = ZONES.flatMap(z => kit[z].items).filter(i => match(i.name))
  if (items.some(i => !i.optional)) return 'required'
  return items.length ? 'optional' : null
}

function toRange(temps: number[]): TempRange | null {
  if (!temps.length) return null
  const lo = Math.min(...temps), hi = Math.max(...temps)
  return {
    from: lo <= SCAN_FROM ? null : Math.round(lo),
    // The range ends where the next scan step no longer has the item
    to: hi >= SCAN_TO ? null : Math.round(hi + STEP),
  }
}

export function itemRanges(match: (name: string) => boolean, overrides: Partial<RiderInput> = {}): ItemRanges {
  const required: number[] = [], optional: number[] = []
  for (let t = SCAN_FROM; t <= SCAN_TO; t += STEP) {
    const status = itemStatus(getKitRecommendation({ ...BASELINE, apparentTemp: t, ...overrides }), match)
    if (status === 'required') required.push(t)
    else if (status === 'optional') optional.push(t)
  }
  return { required: toRange(required), optional: toRange(optional) }
}

export const INTENSITIES: Intensity[] = ['easy', 'moderate', 'hard', 'race']

export function itemRangesByIntensity(match: (name: string) => boolean, overrides: Partial<RiderInput> = {}) {
  return INTENSITIES.map(intensity => ({ intensity, ...itemRanges(match, { ...overrides, intensity }) }))
}

const tc = (c: number) => `${c}°C (${Math.round(c * 9 / 5 + 32)}°F)`

/** "11–14°C (52–57°F)", "8°C (46°F) or colder", "24°C (75°F) or warmer" */
export function rangePhrase(r: TempRange): string {
  if (r.from === null && r.to === null) return 'at any temperature'
  if (r.from === null) return `${tc(r.to!)} or colder`
  if (r.to === null) return `${tc(r.from)} or warmer`
  return `${r.from}–${r.to}°C (${Math.round(r.from * 9 / 5 + 32)}–${Math.round(r.to * 9 / 5 + 32)}°F)`
}

/** The quotable one-liner for an item page, at a moderate pace */
export function itemSentence(item: { name: string; plural: boolean; condition?: string }, r: ItemRanges): string {
  const parts: string[] = []
  const pronoun = item.plural ? "they're" : "it's"
  const when = `At a moderate pace${item.condition ? ` ${item.condition}` : ''}`
  if (r.required) parts.push(`${when}, wear ${item.name} when the feels-like temperature is ${rangePhrase(r.required)}.`)
  if (r.optional) parts.push(r.required
    ? `At ${rangePhrase(r.optional)} ${pronoun} optional.`
    : `${when}, ${item.name} ${item.plural ? 'are' : 'is'} optional when the feels-like temperature is ${rangePhrase(r.optional)}.`)
  parts.push('Ride harder and the range moves colder; ride easier and it moves warmer.')
  return parts.join(' ')
}
