/**
 * KitCheck — Recommendation Engine
 * Pure functions. No framework dependency.
 * Comfort score: 0 (freezing) → 75 (perfect) → 110+ (too hot)
 */

export type Intensity = 'easy' | 'moderate' | 'hard' | 'race'
export type Level     = 'heavy' | 'medium' | 'light' | 'none'

export interface ZoneRecommendation {
  item:    string
  detail:  string | null
  level:   Level
  icon:    string
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

function getHead(score: number): ZoneRecommendation {
  if (score < 20) return { item: 'Thermal skull cap + helmet',  detail: 'Full ear coverage essential. Wear under helmet.', level: 'heavy',  icon: '🧢' }
  if (score < 38) return { item: 'Cycling cap under helmet',    detail: 'Ear and forehead coverage recommended.',          level: 'medium', icon: '🧢' }
  if (score < 55) return { item: 'Light cap or nothing',        detail: 'A thin summer cap gives some wind protection.',   level: 'light',  icon: '🧢' }
  return                 { item: 'Helmet only',                 detail: 'No head coverage needed.',                        level: 'none',   icon: '⛑️' }
}

function getTorso(score: number, isRainy: boolean, isWindy: boolean): ZoneRecommendation {
  let layers: string[] = []
  let level: Level = 'none'
  if      (score < 20) { layers = ['Thermal long-sleeve base layer', 'Winter jersey', 'Insulated jacket']; level = 'heavy'  }
  else if (score < 35) { layers = ['Long-sleeve base layer', 'Winter jersey or softshell'];                level = 'heavy'  }
  else if (score < 50) { layers = ['Short-sleeve base layer', 'Long-sleeve jersey or arm warmers'];        level = 'medium' }
  else if (score < 65) { layers = ['Summer jersey', 'Arm warmers (removable)'];                            level = 'medium' }
  else if (score < 80) { layers = ['Summer jersey'];                                                        level = 'light'  }
  else                 { layers = ['Lightweight summer jersey'];                                            level = 'none'   }
  if (isRainy)                  { layers.push('Rain jacket (waterproof)'); level = 'heavy' }
  else if (isWindy && score < 70) layers.push('Wind gilet')
  return {
    item:   layers[0],
    layers,
    detail: isRainy  ? 'Rain is likely — a waterproof outer layer is essential.'
           : isWindy ? 'Wind is significant — a gilet or windproof layer adds comfort.'
           : null,
    level,
    icon: '🚴',
  }
}

function getHands(score: number, isRainy: boolean): ZoneRecommendation {
  if (isRainy || score < 20) return { item: 'Waterproof winter gloves',              detail: isRainy ? 'Rain + cold hands = miserable ride.' : 'Maximum insulation needed.', level: 'heavy',  icon: '🧤' }
  if (score < 35)            return { item: 'Thermal winter gloves',                 detail: 'Insulated gloves. Hands lose heat fast at pace.',                              level: 'heavy',  icon: '🧤' }
  if (score < 50)            return { item: 'Light cycling gloves',                  detail: 'Wind protection needed. Fingerless not enough.',                               level: 'medium', icon: '🧤' }
  if (score < 65)            return { item: 'Fingerless or thin full-finger gloves', detail: 'Fingerless works, but carry a spare pair.',                                    level: 'light',  icon: '🧤' }
  return                            { item: 'No gloves needed',                      detail: 'Optionally fingerless for grip.',                                              level: 'none',   icon: '✋' }
}

function getLegs(score: number): ZoneRecommendation {
  if (score < 25) return { item: 'Thermal bib tights + leg warmers',    detail: 'Double insulation. Fleece-lined tights recommended.', level: 'heavy',  icon: '🦵' }
  if (score < 42) return { item: 'Bib tights',                          detail: 'Full leg coverage. Winter weight.',                   level: 'heavy',  icon: '🦵' }
  if (score < 58) return { item: 'Bib shorts + knee warmers',           detail: 'Knee warmers easy to roll down if you warm up.',      level: 'medium', icon: '🦵' }
  if (score < 68) return { item: 'Bib shorts + leg warmers (optional)', detail: 'You might not need them, but pack just in case.',     level: 'light',  icon: '🦵' }
  return                 { item: 'Bib shorts',                          detail: 'Full summer shorts. Enjoy.',                          level: 'none',   icon: '🩳' }
}

function getFeet(score: number, isRainy: boolean): ZoneRecommendation {
  if (isRainy || score < 20) return { item: 'Waterproof overshoes + thermal socks', detail: isRainy ? 'Wet feet ruin rides. Full neoprene overshoes.' : 'Maximum insulation needed.', level: 'heavy',  icon: '👟' }
  if (score < 35)            return { item: 'Thermal overshoes + thermal socks',    detail: 'Wind and cold protection. Fleece-lined overshoes.',                                       level: 'heavy',  icon: '👟' }
  if (score < 50)            return { item: 'Light overshoes or toe covers',        detail: 'Toe covers take the edge off, especially descending.',                                    level: 'medium', icon: '👟' }
  if (score < 65)            return { item: 'Thermal cycling socks',                detail: 'Thicker socks only. No overshoes needed.',                                                level: 'light',  icon: '🧦' }
  return                            { item: 'Regular cycling socks',                detail: 'Normal summer socks.',                                                                    level: 'none',   icon: '🧦' }
}

export function scoreLabel(score: number): { label: string; color: string } {
  if (score < 20) return { label: 'Extreme cold', color: '#60a5fa' }
  if (score < 40) return { label: 'Cold',         color: '#93c5fd' }
  if (score < 60) return { label: 'Cool',         color: '#86efac' }
  if (score < 75) return { label: 'Comfortable',  color: '#d4f000' }
  if (score < 90) return { label: 'Warm',         color: '#fbbf24' }
  return              { label: 'Hot',          color: '#f87171' }
}
