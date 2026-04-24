/**
 * KitCheck — Recommendation Engine
 * Pure functions. No framework dependency.
 * Comfort score: 0 (freezing) → 75 (perfect) → 110+ (too hot)
 */

export type Intensity = 'easy' | 'moderate' | 'hard' | 'race'
export type Level     = 'heavy' | 'medium' | 'light' | 'none'

export interface ZoneItem {
  name:      string
  optional?: boolean
}

export interface ZoneRecommendation {
  item:    string
  detail:  string | null
  level:   Level
  icon:    string
  items:   ZoneItem[]
  layers?: string[]
}

export interface KitResult {
  score: number
  head:  ZoneRecommendation
  torso: ZoneRecommendation
  hands: ZoneRecommendation
  legs:  ZoneRecommendation
  feet:  ZoneRecommendation
}

export interface RiderInput {
  apparentTemp: number
  windspeed:    number
  precipProb:   number
  warmthBias:   number   // -2 (cold runner) → +2 (warm runner)
  intensity:    Intensity
}

function tempToScore(temp: number): number {
  if (temp <= -5) return 5
  if (temp <=  0) return 10 + (temp + 5) * 2
  if (temp <=  8) return 20 + (temp / 8) * 20
  if (temp <= 15) return 40 + ((temp - 8)  / 7)  * 25
  if (temp <= 22) return 65 + ((temp - 15) / 7)  * 25
  return 90 + (temp - 22) * 2
}

export function calcComfortScore(input: RiderInput): number {
  let score = tempToScore(input.apparentTemp)
  const intensityBonus: Record<Intensity, number> = {
    easy: -5, moderate: 0, hard: 12, race: 18,
  }
  score += intensityBonus[input.intensity]
  score += input.warmthBias * 7.5
  if      (input.windspeed > 30) score -= 10
  else if (input.windspeed > 20) score -= 6
  else if (input.windspeed > 12) score -= 3
  return Math.round(Math.max(0, Math.min(110, score)))
}

export function getKitRecommendation(input: RiderInput): KitResult {
  const score   = calcComfortScore(input)
  const isRainy = input.precipProb >= 60
  const isWindy = input.windspeed  > 25
  return {
    score,
    head:  getHead(score),
    torso: getTorso(score, isRainy, isWindy),
    hands: getHands(score, isRainy),
    legs:  getLegs(score),
    feet:  getFeet(score, isRainy),
  }
}

// Score → approx apparent temp: 20≈0°C  35≈6°C  50≈11°C  62≈14°C  74≈17°C  86≈20°C  90≈22°C
// "Optional" band for all zones: score 62–74 (≈14–17°C). Required below 62, gone above 74.

function getHead(score: number): ZoneRecommendation {
  if (score < 20) return { item: 'Thermal skull cap', items: [{ name: 'Thermal skull cap' }, { name: 'Helmet' }],  detail: 'Full ear coverage essential. Wear under helmet.', level: 'heavy',  icon: '🧢' }
  if (score < 40) return { item: 'Cycling cap',       items: [{ name: 'Cycling cap' }, { name: 'Helmet' }],        detail: 'Ear and forehead coverage recommended.',          level: 'medium', icon: '🧢' }
  if (score < 62) return { item: 'Helmet',       items: [{ name: 'Helmet' }, { name: 'Light cap', optional: true }], detail: 'A thin summer cap under your helmet gives some wind protection.',   level: 'light',  icon: '🧢' }
  return                 { item: 'Helmet',       items: [{ name: 'Helmet' }],                                       detail: 'No head covering needed.',                        level: 'none',   icon: '⛑️' }
}

function getTorso(score: number, isRainy: boolean, isWindy: boolean): ZoneRecommendation {
  let items: ZoneItem[] = []
  let level: Level = 'none'
  if      (score < 20) { items = [{ name: 'Thermal long-sleeve base layer' }, { name: 'Winter jersey' }, { name: 'Insulated jacket' }]; level = 'heavy'  }
  else if (score < 35) { items = [{ name: 'Thermal base layer' }, { name: 'Winter jersey or softshell' }];                              level = 'heavy'  }
  else if (score < 50) { items = [{ name: 'Long-sleeve jersey' }, { name: 'Base layer', optional: true }];                              level = 'medium' }
  else if (score < 62) { items = [{ name: 'Jersey' }, { name: 'Arm warmers' }];                                                         level = 'medium' }
  else if (score < 74) { items = [{ name: 'Jersey' }, { name: 'Arm warmers', optional: true }];                                         level = 'light'  }
  else if (score < 86) { items = [{ name: 'Summer jersey' }];                                                                           level = 'light'  }
  else                 { items = [{ name: 'Lightweight summer jersey' }];                                                                level = 'none'   }
  if (isRainy)                    { items.push({ name: 'Rain jacket (waterproof)' }); level = 'heavy' }
  else if (isWindy && score < 74)   items.push({ name: 'Wind gilet', optional: true })
  return {
    item:   items[0].name,
    items,
    layers: items.map(i => i.name),
    detail: isRainy  ? 'Rain is likely — a waterproof outer layer is essential.'
           : isWindy ? 'Wind is significant — a gilet or windproof layer adds comfort.'
           : score < 50 ? 'A base layer underneath adds warmth and wicks sweat — recommended when it\'s this cold.'
           : null,
    level,
    icon: '🚴',
  }
}

function getHands(score: number, isRainy: boolean): ZoneRecommendation {
  if (isRainy || score < 20) return { item: 'Waterproof winter gloves', items: [{ name: 'Waterproof winter gloves' }],                                              detail: isRainy ? 'Rain + cold hands = miserable ride.' : 'Maximum insulation needed.',  level: 'heavy',  icon: '🧤' }
  if (score < 35)            return { item: 'Thermal winter gloves',    items: [{ name: 'Thermal winter gloves' }],                                                  detail: 'Insulated gloves. Hands lose heat fast at pace.',                               level: 'heavy',  icon: '🧤' }
  if (score < 50)            return { item: 'Light cycling gloves',     items: [{ name: 'Light cycling gloves' }],                                                   detail: 'Wind protection needed. Fingerless gloves won\'t cut it.',                      level: 'medium', icon: '🧤' }
  if (score < 62)            return { item: 'Fingerless gloves',        items: [{ name: 'Fingerless gloves or no gloves' }, { name: 'Thin full-finger gloves', optional: true }], detail: 'Fingerless work well — full-finger if you run cold, bare hands if you prefer.',  level: 'light',  icon: '🧤' }
  if (score < 74)            return { item: 'Fingerless gloves',        items: [{ name: 'Fingerless gloves or no gloves', optional: true }],                                detail: 'Gloves optional — useful on descents or into a headwind.',                       level: 'light',  icon: '🧤' }
  return                            { item: 'No gloves',                items: [{ name: 'No gloves or fingerless gloves' }],                                                 detail: 'Warm enough for bare hands — fingerless optional for grip or comfort.',   level: 'none',   icon: '✋' }
}

function getLegs(score: number): ZoneRecommendation {
  // Leg warmers (colder) → knee warmers (milder) — not the other way around
  if (score < 22) return { item: 'Thermal bib tights', items: [{ name: 'Thermal bib tights' }, { name: 'Leg warmers' }],             detail: 'Double insulation. Fleece-lined tights recommended.',                              level: 'heavy',  icon: '🦵' }
  if (score < 40) return { item: 'Bib tights',         items: [{ name: 'Bib tights' }],                                              detail: 'Full leg coverage. Winter-weight tights.',                                         level: 'heavy',  icon: '🦵' }
  if (score < 52) return { item: 'Bib shorts',         items: [{ name: 'Bib shorts' }, { name: 'Leg warmers' }],                     detail: 'Full leg coverage — legs need time to warm up at these temperatures.',              level: 'medium', icon: '🦵' }
  if (score < 62) return { item: 'Bib shorts',         items: [{ name: 'Bib shorts' }, { name: 'Knee warmers' }],                    detail: 'Knees chill quickly even when your legs are working hard. Easy to pocket mid-ride.', level: 'medium', icon: '🦵' }
  if (score < 74) return { item: 'Bib shorts',         items: [{ name: 'Bib shorts' }, { name: 'Knee warmers', optional: true }],    detail: 'Legs should stay warm enough, but knee warmers help on cold starts or descents.',   level: 'light',  icon: '🦵' }
  return                 { item: 'Bib shorts',         items: [{ name: 'Bib shorts' }],                                              detail: 'Full summer shorts. Enjoy.',                                                       level: 'none',   icon: '🩳' }
}

function getFeet(score: number, isRainy: boolean): ZoneRecommendation {
  if (isRainy || score < 20) return { item: 'Waterproof overshoes', items: [{ name: 'Waterproof overshoes' }, { name: 'Thermal socks' }], detail: isRainy ? 'Wet feet ruin rides. Full neoprene overshoes.' : 'Maximum insulation needed.',     level: 'heavy',  icon: '👟' }
  if (score < 35)            return { item: 'Thermal overshoes',    items: [{ name: 'Thermal overshoes' }, { name: 'Thermal socks' }],    detail: 'Wind and cold protection essential. Fleece-lined overshoes.',                               level: 'heavy',  icon: '👟' }
  if (score < 50)            return { item: 'Light overshoes',      items: [{ name: 'Light overshoes or toe covers' }],                   detail: 'Feet cool fast at speed — wind protection makes a noticeable difference.',                   level: 'medium', icon: '👟' }
  if (score < 62)            return { item: 'Regular socks',        items: [{ name: 'Regular cycling socks' }, { name: 'Toe covers', optional: true }],  detail: 'Toe covers take the edge off the windchill, especially on longer descents.',  level: 'light',  icon: '👟' }
  return                            { item: 'Regular socks',        items: [{ name: 'Regular cycling socks' }],                                               detail: 'Normal summer socks.',                                                       level: 'none',   icon: '🧦' }
}

export function scoreLabel(score: number): { label: string; color: string } {
  if (score < 20) return { label: 'Extreme cold', color: '#60a5fa' }
  if (score < 40) return { label: 'Cold',         color: '#93c5fd' }
  if (score < 60) return { label: 'Cool',         color: '#86efac' }
  if (score < 75) return { label: 'Comfortable',  color: '#d4f000' }
  if (score < 90) return { label: 'Warm',         color: '#fbbf24' }
  return              { label: 'Hot',          color: '#f87171' }
}
