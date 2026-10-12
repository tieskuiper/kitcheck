/**
 * KitCheck — Recommendation Engine
 * Pure functions. No framework dependency.
 *
 * Two scores, both on the 0 (freezing) → 75 (perfect) → 110 (too hot) scale:
 * - core: feels-like temperature + effort + warmth tendency + wind → upper body and legs
 * - extremities: the same, but effort and warmth tendency count only partly, because
 *   riding hard warms your body much more than your fingers, toes and ears → head, hands, feet
 */

export type Intensity = 'easy' | 'moderate' | 'hard' | 'race'
export type Level     = 'heavy' | 'medium' | 'light' | 'none'
export type RainLevel = 'likely' | 'showers' | null

export interface ZoneItem {
  name:      string
  optional?: boolean
}

export interface PhaseNote {
  hour:   number
  note:   string    // may contain {T} as a placeholder for the apparent temperature
  tempC?: number    // raw °C value substituted for {T} — UI converts based on unit
}

export interface ZoneRecommendation {
  item:        string
  detail:      string | null
  level:       Level
  icon:        string
  items:       ZoneItem[]
  layers?:     string[]
  phaseNotes?: PhaseNote[]
}

export interface KitResult {
  score: number
  /** How the conditions feel on the bike (°C): forecast feels-like adjusted for effort, warmth tendency and wind */
  feelsLikeC: number
  rain:  RainLevel
  /** Hot enough to mention water and sunscreen */
  heat:  boolean
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

export interface HourWeather {
  apparentTemp: number
  windspeed:    number
  precipProb:   number
}

const RAIN_LIKELY  = 60   // % — full rain kit (scaled to temperature)
const RAIN_SHOWERS = 40   // % — packable jacket as an option
const HEAT_FROM_C  = 27   // forecast feels-like °C

// Effort and warmth tendency reach the hands, feet and head only partly
const EXTREMITY_EFFORT = 0.35
const EXTREMITY_WARMTH = 0.75

function tempToScore(temp: number): number {
  if (temp <= -5) return 5
  if (temp <=  0) return 10 + (temp + 5) * 2
  if (temp <=  8) return 20 + (temp / 8) * 20
  if (temp <= 15) return 40 + ((temp - 8)  / 7)  * 25
  if (temp <= 22) return 65 + ((temp - 15) / 7)  * 25
  return 90 + (temp - 22) * 2
}

/** Inverse of tempToScore: the temperature a score "feels like" */
function scoreToTemp(score: number): number {
  if (score <= 10) return -5 - (10 - score) / 2   // flattened below -5°C; rough on purpose
  if (score <= 20) return (score - 10) / 2 - 5
  if (score <= 40) return ((score - 20) / 20) * 8
  if (score <= 65) return 8 + ((score - 40) / 25) * 7
  if (score <= 90) return 15 + ((score - 65) / 25) * 7
  return 22 + (score - 90) / 2
}

const INTENSITY_BONUS: Record<Intensity, number> = { easy: -5, moderate: 0, hard: 12, race: 18 }

// The forecast feels-like already includes wind chill; this only adds the extra airflow
// of riding into it, so it's deliberately small
function windPenalty(kmh: number): number {
  if (kmh > 30) return 6
  if (kmh > 20) return 4
  if (kmh > 12) return 2
  return 0
}

const clampScore = (s: number) => Math.round(Math.max(0, Math.min(110, s)))

export function calcComfortScore(input: RiderInput): number {
  return clampScore(
    tempToScore(input.apparentTemp) + INTENSITY_BONUS[input.intensity]
    + input.warmthBias * 7.5 - windPenalty(input.windspeed),
  )
}

function calcExtremityScore(input: RiderInput): number {
  return clampScore(
    tempToScore(input.apparentTemp) + INTENSITY_BONUS[input.intensity] * EXTREMITY_EFFORT
    + input.warmthBias * 7.5 * EXTREMITY_WARMTH - windPenalty(input.windspeed),
  )
}

export function getKitRecommendation(input: RiderInput): KitResult {
  const score  = calcComfortScore(input)
  const ext    = calcExtremityScore(input)
  const rain: RainLevel = input.precipProb >= RAIN_LIKELY ? 'likely' : input.precipProb >= RAIN_SHOWERS ? 'showers' : null
  const isWindy = input.windspeed > 25
  return {
    score,
    feelsLikeC: Math.round(scoreToTemp(score)),
    rain,
    heat:  input.apparentTemp >= HEAT_FROM_C,
    head:  getHead(ext),
    torso: getTorso(score, rain, isWindy),
    hands: getHands(ext, rain),
    legs:  getLegs(score),
    feet:  getFeet(ext, rain),
  }
}

// Score → approx temp: 20≈0°C  35≈6°C  47≈10°C  50≈11°C  62≈14°C  74≈17°C  86≈20°C  90≈22°C
// "Optional" band for all zones: score 62–74 (≈14–17°C). Required below 62, gone above 74.

function getHead(score: number): ZoneRecommendation {
  if (score < 20) return { item: 'Thermal skull cap', items: [{ name: 'Thermal skull cap' }, { name: 'Helmet' }],  detail: 'Full ear coverage essential. Wear under helmet.', level: 'heavy',  icon: '🧢' }
  if (score < 40) return { item: 'Cycling cap',       items: [{ name: 'Cycling cap' }, { name: 'Helmet' }],        detail: 'Ear and forehead coverage recommended.',          level: 'medium', icon: '🧢' }
  if (score < 62) return { item: 'Helmet',       items: [{ name: 'Helmet' }, { name: 'Light cap', optional: true }], detail: 'A thin summer cap under your helmet gives some wind protection.',   level: 'light',  icon: '🧢' }
  return                 { item: 'Helmet',       items: [{ name: 'Helmet' }],                                       detail: 'No head covering needed.',                        level: 'none',   icon: '⛑️' }
}

function getTorso(score: number, rain: RainLevel, isWindy: boolean): ZoneRecommendation {
  let items: ZoneItem[] = []
  let level: Level = 'none'
  if      (score < 20) { items = [{ name: 'Thermal long-sleeve base layer' }, { name: 'Winter jersey' }, { name: 'Insulated jacket' }]; level = 'heavy'  }
  else if (score < 35) { items = [{ name: 'Thermal base layer' }, { name: 'Winter jersey or softshell' }];                              level = 'heavy'  }
  else if (score < 50) { items = [{ name: 'Long-sleeve jersey' }, { name: 'Base layer', optional: true }];                              level = 'medium' }
  else if (score < 62) { items = [{ name: 'Jersey' }, { name: 'Arm warmers' }];                                                         level = 'medium' }
  else if (score < 74) { items = [{ name: 'Jersey' }, { name: 'Arm warmers', optional: true }];                                         level = 'light'  }
  else if (score < 86) { items = [{ name: 'Summer jersey' }];                                                                           level = 'light'  }
  else                 { items = [{ name: 'Lightweight summer jersey' }];                                                                level = 'none'   }

  // Rain gear scales with temperature: proper jacket when cool, packable when mild,
  // optional when it's warm enough that a wet jersey is fine
  if (rain === 'likely') {
    if      (score < 65) { items.push({ name: 'Rain jacket (waterproof)' }); level = 'heavy' }
    else if (score < 90) items.push({ name: 'Packable rain jacket' })
    else                 items.push({ name: 'Packable rain jacket', optional: true })
  } else if (rain === 'showers') {
    items.push({ name: 'Packable rain jacket', optional: true })
  } else if (isWindy && score < 74) {
    items.push({ name: 'Wind gilet', optional: true })
  }

  return {
    item:   items[0].name,
    items,
    layers: items.map(i => i.name),
    detail: rain === 'likely' ? 'Rain is likely — a rain layer is included.'
           : rain === 'showers' ? 'A chance of showers — a packable jacket in your pocket covers it.'
           : isWindy ? 'Wind is significant — a gilet or windproof layer adds comfort.'
           : score < 50 ? 'A base layer underneath adds warmth and wicks sweat — recommended when it\'s this cold.'
           : null,
    level,
    icon: '🚴',
  }
}

function getHands(score: number, rain: RainLevel): ZoneRecommendation {
  const wet = rain === 'likely'
  if (score < 20 || (wet && score < 47)) return { item: 'Waterproof winter gloves', items: [{ name: 'Waterproof winter gloves' }], detail: wet ? 'Cold and wet hands are the quickest way to ruin a ride.' : 'Maximum insulation needed.', level: 'heavy', icon: '🧤' }
  if (score < 35)            return { item: 'Thermal winter gloves',    items: [{ name: 'Thermal winter gloves' }],                                                  detail: 'Insulated gloves. Hands lose heat fast at pace.',                               level: 'heavy',  icon: '🧤' }
  if (score < 50)            return { item: 'Light cycling gloves',     items: [{ name: 'Light cycling gloves' }],                                                   detail: 'Wind protection needed. Fingerless gloves won\'t cut it.',                      level: 'medium', icon: '🧤' }
  if (wet && score < 74)     return { item: 'Fingerless gloves',        items: [{ name: 'Fingerless gloves or no gloves' }, { name: 'Light full-finger gloves', optional: true }], detail: 'Light full-finger gloves keep wet hands from going numb.', level: 'light', icon: '🧤' }
  if (score < 62)            return { item: 'Fingerless gloves',        items: [{ name: 'Fingerless gloves or no gloves' }, { name: 'Thin full-finger gloves', optional: true }], detail: 'Fingerless work well — full-finger if you run cold, bare hands if you prefer.',  level: 'light',  icon: '🧤' }
  if (score < 74)            return { item: 'Fingerless gloves',        items: [{ name: 'Fingerless gloves or no gloves', optional: true }],                                detail: 'Gloves optional — useful on descents or into a headwind.',                       level: 'light',  icon: '🧤' }
  return                            { item: 'No gloves',                items: [{ name: 'No gloves or fingerless gloves' }],                                                 detail: 'Warm enough for bare hands — fingerless optional for grip or comfort.',   level: 'none',   icon: '✋' }
}

function getLegs(score: number): ZoneRecommendation {
  // Leg warmers (colder) → knee warmers (milder) — not the other way around
  if (score < 22) return { item: 'Thermal bib tights', items: [{ name: 'Thermal bib tights' }],                                       detail: 'Fleece-lined winter tights.',                                                      level: 'heavy',  icon: '🦵' }
  if (score < 40) return { item: 'Bib tights',         items: [{ name: 'Bib tights' }],                                              detail: 'Full leg coverage. Winter-weight tights.',                                         level: 'heavy',  icon: '🦵' }
  if (score < 52) return { item: 'Bib shorts',         items: [{ name: 'Bib shorts' }, { name: 'Leg warmers' }],                     detail: 'Full leg coverage — legs need time to warm up at these temperatures.',              level: 'medium', icon: '🦵' }
  if (score < 62) return { item: 'Bib shorts',         items: [{ name: 'Bib shorts' }, { name: 'Knee warmers' }],                    detail: 'Knees chill quickly even when your legs are working hard. Easy to pocket mid-ride.', level: 'medium', icon: '🦵' }
  if (score < 74) return { item: 'Bib shorts',         items: [{ name: 'Bib shorts' }, { name: 'Knee warmers', optional: true }],    detail: 'Legs should stay warm enough, but knee warmers help on cold starts or descents.',   level: 'light',  icon: '🦵' }
  return                 { item: 'Bib shorts',         items: [{ name: 'Bib shorts' }],                                              detail: 'Full summer shorts. Enjoy.',                                                       level: 'none',   icon: '🩳' }
}

function getFeet(score: number, rain: RainLevel): ZoneRecommendation {
  const wet = rain === 'likely'
  // Overshoes range from warm neoprene to thin rain covers: the cold decides which kind
  if (score < 20 || (wet && score < 35)) return { item: 'Waterproof overshoes', items: [{ name: 'Waterproof winter overshoes' }, { name: 'Thermal socks' }], detail: wet ? 'Wet feet ruin rides. Full neoprene overshoes.' : 'Maximum insulation needed.', level: 'heavy', icon: '👟' }
  if (score < 35)            return { item: 'Thermal overshoes',    items: [{ name: 'Thermal overshoes' }, { name: 'Thermal socks' }],    detail: 'Wind and cold protection essential. Fleece-lined overshoes.',                               level: 'heavy',  icon: '👟' }
  if (wet && score < 50)     return { item: 'Waterproof overshoes', items: [{ name: 'Waterproof overshoes' }],                            detail: 'Keeps your feet dry and takes the edge off the cold.',                                      level: 'medium', icon: '👟' }
  if (score < 50)            return { item: 'Light overshoes',      items: [{ name: 'Light overshoes or toe covers' }],                   detail: 'Feet cool fast at speed — wind protection makes a noticeable difference.',                   level: 'medium', icon: '👟' }
  if (wet && score < 90)     return { item: 'Regular socks',        items: [{ name: 'Regular cycling socks' }, { name: 'Light rain overshoes', optional: true }], detail: 'Thin rain covers keep your shoes and socks dry.', level: 'light', icon: '👟' }
  if (rain === 'showers' && score < 74) return { item: 'Regular socks', items: [{ name: 'Regular cycling socks' }, { name: 'Light rain overshoes', optional: true }], detail: 'Thin rain covers if you want dry shoes.', level: 'light', icon: '👟' }
  if (score < 62)            return { item: 'Regular socks',        items: [{ name: 'Regular cycling socks' }, { name: 'Toe covers', optional: true }],  detail: 'Toe covers take the edge off the windchill, especially on longer descents.',  level: 'light',  icon: '👟' }
  return                            { item: 'Regular socks',        items: [{ name: 'Regular cycling socks' }],                                               detail: 'Normal summer socks.',                                                       level: 'none',   icon: '🧦' }
}

/** Kit label for a comfort score — bands match the kit thresholds above */
export function scoreLabel(score: number): { label: string; color: string } {
  if (score < 20) return { label: 'Extreme cold', color: '#0D47A1' }
  if (score < 35) return { label: 'Cold',         color: '#1565C0' }
  if (score < 50) return { label: 'Cool',         color: '#4A90D9' }
  if (score < 74) return { label: 'Comfortable',  color: '#2E9E5A' }
  if (score < 86) return { label: 'Warm',         color: '#F5A623' }
  return              { label: 'Hot',          color: '#D93025' }
}

// ── Multi-hour ride recommendations ──────────────────────────────────────────

function levelNum(level: Level): number {
  return { none: 0, light: 1, medium: 2, heavy: 3 }[level]
}

function getTorsoNotes(results: KitResult[], hours: HourWeather[]): PhaseNote[] {
  const notes: PhaseNote[] = []
  const startScore = results[0].score

  // Rain onset: no rain at start but arrives during ride
  if (hours[0].precipProb < RAIN_LIKELY) {
    const rainHour = hours.findIndex((h, i) => i > 0 && h.precipProb >= RAIN_LIKELY)
    if (rainHour > 0) {
      notes.push({ hour: rainHour, note: `Rain expected from hour ${rainHour} — pack a rain jacket` })
      return notes
    }
  }

  // Rain stops: wet at the start, dry for the rest of the ride
  if (hours[0].precipProb >= RAIN_LIKELY) {
    const dryFrom = hours.findIndex((_, i) => i > 0 && hours.slice(i).every(h => h.precipProb < RAIN_SHOWERS))
    if (dryFrom > 0) notes.push({ hour: dryFrom, note: `Dry from hour ${dryFrom} — the rain jacket can go in your pocket` })
  }

  // Warming: arm warmers required at start → optional or gone as it heats up
  // Guard with score > startScore so a colder switch to long-sleeve jersey doesn't trigger this
  const startHasArmWarmers = results[0].torso.items.some(
    i => i.name.toLowerCase().includes('arm warmer') && !i.optional
  )
  if (startHasArmWarmers) {
    for (let h = 1; h < results.length; h++) {
      if (results[h].score <= startScore) continue           // getting colder — skip
      const awItem = results[h].torso.items.find(i => i.name.toLowerCase().includes('arm warmer'))
      if (!awItem || awItem.optional) {
        const temp = hours[h].apparentTemp
        const verb = awItem ? 'Consider removing' : 'Remove'
        notes.push({ hour: h, note: `${verb} arm warmers after hour ${h} — warms to {T}°`, tempC: temp })
        break
      }
    }
  }

  // Cooling: starts comfortable (no arm warmers needed) → cools into arm-warmer territory
  if (!notes.length && !startHasArmWarmers && startScore >= 62) {
    for (let h = 1; h < results.length; h++) {
      const awRequired = results[h].torso.items.some(
        i => i.name.toLowerCase().includes('arm warmer') && !i.optional
      )
      if (awRequired && results[h].score < startScore) {
        notes.push({ hour: h, note: `Arm warmers needed from hour ${h} as it cools (feels like {T}°)`, tempC: hours[h].apparentTemp })
        break
      }
    }
  }

  // Cooling: significant score drop (≥20 pts) that needs heavier kit — use score not level
  // (level is too coarse: jersey+arm warmers and long-sleeve jersey both map to 'medium')
  if (!notes.length) {
    let coldestScore = startScore
    let coldestHour  = 0
    for (let h = 1; h < results.length; h++) {
      if (results[h].score < coldestScore) { coldestScore = results[h].score; coldestHour = h }
    }
    if (startScore - coldestScore >= 20 && coldestHour > 0) {
      const temp       = hours[coldestHour].apparentTemp
      const startNames = new Set(results[0].torso.items.map(i => i.name))
      // Find a genuinely new required item at the coldest point
      const newItem    = results[coldestHour].torso.items.find(
        i => !i.optional && !startNames.has(i.name) && !i.name.toLowerCase().includes('arm warmer')
      )
      const suffix = newItem
        ? `take a ${newItem.name.toLowerCase()} with you`
        : 'take an extra layer with you'
      notes.push({ hour: coldestHour, note: `Gets colder from hour ${coldestHour} (feels like {T}°) — ${suffix}`, tempC: temp })
    }
  }

  return notes
}

/**
 * Gloves and overshoes stay on for the whole ride — nobody carries a second pair.
 * So pick the warmest pair the ride needs, and only mention when they can come off.
 */
function forWholeRide(zone: 'hands' | 'feet', results: KitResult[]): ZoneRecommendation {
  let pick = 0
  for (let h = 1; h < results.length; h++) {
    if (levelNum(results[h][zone].level) > levelNum(results[pick][zone].level)) pick = h
  }
  const chosen = results[pick][zone]
  const notes: PhaseNote[] = []
  if (pick > 0) {
    const why = results[pick].rain === 'likely' && results[0].rain !== 'likely' ? 'Rain' : 'Colder'
    notes.push({ hour: pick, note: zone === 'hands'
      ? `${why} from hour ${pick} — start in these gloves, you won't want to swap halfway`
      : why === 'Rain'
        ? `Rain from hour ${pick} — easiest to put the overshoes on before you leave`
        : `Colder from hour ${pick} — worth wearing these from the start` })
  } else if (zone === 'hands' && levelNum(chosen.level) === 1) {
    // Light pair at the start: say when it's warm enough to pocket them
    const off = results.findIndex((r, h) => h > 0 && r.hands.level === 'none')
    if (off > 0) notes.push({ hour: off, note: `Warm enough to pocket your gloves after hour ${off}` })
  }
  return { ...chosen, phaseNotes: notes }
}

function getLegsNotes(results: KitResult[]): PhaseNote[] {
  const warmerNames = ['knee warmer', 'leg warmer']
  const startItems  = results[0].legs.items
  const startScore  = results[0].score
  const startHasRequired = startItems.some(
    i => warmerNames.some(n => i.name.toLowerCase().includes(n)) && !i.optional
  )
  if (!startHasRequired) return []

  // Only suggest removing warmers when score actually increases (getting warmer)
  // If score drops, bib tights replace warmers — that's colder, not warmer
  for (let h = 1; h < results.length; h++) {
    if (results[h].score <= startScore) continue              // getting colder — skip
    const items      = results[h].legs.items
    const warmerItem = items.find(i => warmerNames.some(n => i.name.toLowerCase().includes(n)))
    if (!warmerItem || warmerItem.optional) {
      const name = startItems.find(i => warmerNames.some(n => i.name.toLowerCase().includes(n)))?.name ?? 'warmers'
      const verb = warmerItem ? 'Consider removing' : 'Remove'
      return [{ hour: h, note: `${verb} ${name.toLowerCase()} after hour ${h} as legs warm up` }]
    }
  }
  return []
}

export function getRideKitRecommendation(
  hours:      HourWeather[],
  warmthBias: number,
  intensity:  Intensity
): KitResult {
  if (!hours.length) throw new Error('No hours provided')
  const inputs  = hours.map(h => ({ ...h, warmthBias, intensity }))
  const results = inputs.map(getKitRecommendation)
  const base    = results[0]
  if (hours.length <= 1) return base
  return {
    ...base,
    heat:  results.some(r => r.heat),
    torso: { ...base.torso, phaseNotes: getTorsoNotes(results, hours) },
    hands: forWholeRide('hands', results),
    feet:  forWholeRide('feet', results),
    legs:  { ...base.legs,  phaseNotes: getLegsNotes(results) },
  }
}
