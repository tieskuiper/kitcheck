/**
 * Kit guide data — derived from kitLogic so the guide and the calculator never disagree.
 * Each temperature page shows the calculator's own recommendation for that feels-like
 * temperature, plus what changes with effort, wind, rain and warmth tendency.
 */
import { getKitRecommendation, scoreLabel, type KitResult, type RiderInput, type ZoneItem } from './kitLogic'

export const ZONES = ['head', 'torso', 'hands', 'legs', 'feet'] as const
export type Zone = typeof ZONES[number]

/** Reference conditions for every guide page: moderate effort, light wind, dry, average rider */
export const BASELINE: Omit<RiderInput, 'apparentTemp'> = {
  windspeed: 10, precipProb: 0, warmthBias: 0, intensity: 'moderate',
}

export const toF = (c: number) => Math.round(c * 9 / 5 + 32)
export const slugFor = (c: number) => `what-to-wear-cycling-${c}-degrees`
export const pathFor = (c: number) => `/guide/${slugFor(c)}/`

// Intros are hand-written per temperature (unique content per page) but must stay in line
// with what kitLogic recommends — re-read them when the thresholds change.
export const TEMP_PAGES: { tempC: number; intro: string }[] = [
  {
    tempC: 0,
    intro: "Zero degrees is proper winter riding. The cold itself is manageable; it's the wind you make by riding that bites, especially on your hands and feet. Layer up fully, accept feeling a bit cold for the first ten minutes, and keep the pace steady so you don't soak your base layer on the first climb.",
  },
  {
    tempC: 5,
    intro: "At 5°C it's still winter kit, but regular bib tights are enough on the legs. Hands and feet decide whether this is a good ride or a long count back home: thermal gloves and overshoes matter more here than an extra layer on your chest.",
  },
  {
    tempC: 10,
    intro: "Ten degrees is the trickiest temperature in cycling: cold at the start, warm on the first climb. A long-sleeve jersey with leg warmers gives you room to adjust, and this is where effort changes the most. Ride hard and you'll drop a layer; go easy and the optional base layer earns its place.",
  },
  {
    tempC: 15,
    intro: "Fifteen degrees is the sweet spot. A normal jersey and bib shorts do the job, with arm and knee warmers as cheap insurance for the first half hour or a long descent. Once you're warm they roll down and disappear into a back pocket.",
  },
  {
    tempC: 20,
    intro: "At 20°C it's summer kit, plain and simple: summer jersey, bib shorts, gloves only if you like the grip. The things to think about at this temperature aren't clothes: sunscreen and a second bottle.",
  },
  {
    tempC: 25,
    intro: "From 25°C the question isn't what to wear but how little. The lightest jersey you own and bib shorts, and the rest is about heat: ride early or late, drink more than you think you need, and don't forget sunscreen on the back of your neck.",
  },
]

export function kitAt(tempC: number, overrides: Partial<RiderInput> = {}): KitResult {
  return getKitRecommendation({ ...BASELINE, apparentTemp: tempC, ...overrides })
}

export function conditionsAt(tempC: number) {
  return scoreLabel(kitAt(tempC).score)
}

export const ZONE_LABELS: Record<Zone, string> = {
  head: 'Head', torso: 'Upper body', hands: 'Hands', legs: 'Legs', feet: 'Feet',
}

/** Required items, without the helmet (always worn) — used for summaries and meta descriptions */
export function keyItems(kit: KitResult): string[] {
  return ZONES.flatMap(z => kit[z].items.filter(i => !i.optional).map(i => i.name)).filter(n => n !== 'Helmet')
}

export interface Variation {
  key: string
  title: string
  detail: string
  /** Only the body zones whose kit differs from the baseline, with what to wear instead */
  changes: { zone: Zone; items: ZoneItem[] }[]
}

const VARIATIONS: { key: string; title: string; detail: string; overrides: Partial<RiderInput> }[] = [
  { key: 'race', title: 'Riding hard or racing', detail: 'Race pace or a fast group ride', overrides: { intensity: 'race' } },
  { key: 'easy', title: 'Easy or recovery pace', detail: 'Coffee ride, recovery spin', overrides: { intensity: 'easy' } },
  { key: 'wind', title: 'Strong wind', detail: '30 km/h (19 mph) or more', overrides: { windspeed: 30 } },
  { key: 'rain', title: 'Rain likely', detail: '60% chance or higher', overrides: { precipProb: 80 } },
  { key: 'cold', title: 'You always run cold', detail: 'Warmth tendency: always cold', overrides: { warmthBias: -2 } },
  { key: 'warm', title: 'You always run warm', detail: 'Warmth tendency: always warm', overrides: { warmthBias: 2 } },
]

const signature = (items: ZoneItem[]) => items.map(i => `${i.name}${i.optional ? '?' : ''}`).join('|')

/** What to wear instead, per condition — zone by zone, only where it differs */
export function variationsAt(tempC: number): Variation[] {
  const base = kitAt(tempC)
  return VARIATIONS.map(v => {
    const kit = kitAt(tempC, v.overrides)
    return {
      key: v.key, title: v.title, detail: v.detail,
      changes: ZONES
        .filter(z => signature(kit[z].items) !== signature(base[z].items))
        .map(z => {
          const items = kit[z].items.filter(i => i.name !== 'Helmet')
          return { zone: z, items: items.length ? items : [{ name: 'Just your helmet' }] }
        }),
    }
  })
}
