/**
 * Regenerates the tables in docs/kit-logic.md from the real engine (src/lib/kitLogic.ts),
 * so the doc always shows what the calculator actually does.
 *
 *   pnpm docs:kit          rewrite the generated sections
 *   pnpm docs:kit:check    exit 1 if the doc is out of date (e.g. after changing kitLogic)
 *
 * Only the blocks between <!-- gen:name --> and <!-- /gen:name --> are touched.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const { getKitRecommendation, scoreLabel, KIT_CONSTANTS } = await import('../src/lib/kitLogic.ts')
const { itemRanges, rangePhrase, INTENSITIES } = await import('../src/lib/kitRanges.ts')
const { KIT_ROWS } = await import('../src/lib/kitRows.ts')
const { TEMP_PAGES, kitAt, kitSentence, toF } = await import('../src/lib/guideData.ts')
const { ROUTE_CONSTANTS } = await import('../src/lib/routeForecast.ts')
const { INTENSITY_FLAT_SPEED } = await import('../src/lib/rideDuration.ts')

const DOC = new URL('../docs/kit-logic.md', import.meta.url)
const ZONES = ['head', 'torso', 'hands', 'legs', 'feet']
const ZONE_LABEL = { head: 'Head', torso: 'Upper body', hands: 'Hands', legs: 'Legs', feet: 'Feet' }
const BASE = { windspeed: 10, precipProb: 0, warmthBias: 0, intensity: 'moderate' }
const t = (c) => `${c}°C (${toF(c)}°F)`
const items = (zone) => zone.items.map(i => i.name + (i.optional ? ' *(opt)*' : '')).join(', ')

// Same scan step as src/lib/kitRanges.ts, so band edges match the ranges on the site
const STEP = 0.25

/** Feels-like bands where a zone's kit stays the same, scanning -15…40°C */
function bands(zone, overrides = {}) {
  const out = []
  for (let c = -15; c <= 40; c += STEP) {
    const kit = getKitRecommendation({ ...BASE, ...overrides, apparentTemp: c })
    const text = items(kit[zone])
    const last = out.at(-1)
    if (last && last.text === text) last.to = c + STEP
    else out.push({ from: c, to: c + STEP, text })
  }
  return out.map((b, i) => ({
    range: i === 0 ? `below ${t(Math.round(b.to))}` : i === out.length - 1 ? `${t(Math.round(b.from))} and warmer` : `${Math.round(b.from)} to ${Math.round(b.to)}°C (${toF(Math.round(b.from))} to ${toF(Math.round(b.to))}°F)`,
    text: b.text,
  }))
}

const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => ' --- ').join('|')}|`, ...rows.map(r => `| ${r.join(' | ')} |`)].join('\n')

const sections = {
  constants: () => table(['Constant', 'Value', 'Meaning'], [
    ['`RAIN_SHOWERS`', `${KIT_CONSTANTS.RAIN_SHOWERS}%`, 'chance of rain from which a packable rain jacket (and light rain overshoes) become optional'],
    ['`RAIN_LIKELY`', `${KIT_CONSTANTS.RAIN_LIKELY}%`, 'rain is "likely": full rain kit, scaled to the temperature; also the route "rain from km X" note'],
    ['`HEAT_FROM_C`', `${KIT_CONSTANTS.HEAT_FROM_C}°C`, 'forecast feels-like from which the heat note (extra bottle, sunscreen) shows'],
    ['`WINDY_KMH`', `> ${KIT_CONSTANTS.WINDY_KMH} km/h`, 'windy: optional wind gilet (score < 74, no rain) and a windproof note'],
    ['`WARMTH_STEP`', `${KIT_CONSTANTS.WARMTH_STEP} points`, 'per step of warmth tendency (-2 always cold … +2 always warm)'],
    ['`EXTREMITY_EFFORT`', `${KIT_CONSTANTS.EXTREMITY_EFFORT}`, 'share of the effort bonus that counts for head, hands and feet'],
    ['`EXTREMITY_WARMTH`', `${KIT_CONSTANTS.EXTREMITY_WARMTH}`, 'share of the warmth tendency that counts for head, hands and feet'],
    ['`INTENSITY_BONUS`', Object.entries(KIT_CONSTANTS.INTENSITY_BONUS).map(([k, v]) => `${k} ${v > 0 ? '+' : ''}${v}`).join(', '), 'score points added for effort'],
    ['`WIND_PENALTY`', KIT_CONSTANTS.WIND_PENALTY.map(w => `> ${w.overKmh} km/h: -${w.points}`).join(', '), 'score points subtracted for riding into the wind'],
  ]),

  effort: () => table(['Forecast feels-like', ...INTENSITIES.map(i => `${i}`), 'always cold (moderate)', 'always warm (moderate)'],
    [0, 10, 20].map(c => [t(c),
      ...INTENSITIES.map(intensity => `${getKitRecommendation({ ...BASE, intensity, apparentTemp: c }).feelsLikeC}°C`),
      `${getKitRecommendation({ ...BASE, warmthBias: -2, apparentTemp: c }).feelsLikeC}°C`,
      `${getKitRecommendation({ ...BASE, warmthBias: 2, apparentTemp: c }).feelsLikeC}°C`])),

  conditions: () => table(['Forecast feels-like', 'Score', 'Label'],
    [-10, -5, 0, 5, 8, 10, 12, 15, 18, 20, 22, 25, 30].map(c => {
      const k = getKitRecommendation({ ...BASE, apparentTemp: c })
      return [t(c), String(k.score), scoreLabel(k.score).label]
    })),

  zones: () => ZONES.map(z => `**${ZONE_LABEL[z]}**\n\n` + table(['Feels-like (moderate, light wind, dry)', 'Kit'], bands(z).map(b => [b.range, b.text]))).join('\n\n'),

  rain: () => ['torso', 'hands', 'feet'].map(z => `**${ZONE_LABEL[z]}, rain likely (${KIT_CONSTANTS.RAIN_LIKELY}%+)**\n\n` + table(['Feels-like (moderate, light wind)', 'Kit'], bands(z, { precipProb: 80 }).map(b => [b.range, b.text]))).join('\n\n'),

  wind: () => `**Upper body, strong wind (35 km/h)**\n\n` + table(['Feels-like (moderate, dry)', 'Kit'], bands('torso', { windspeed: 35 }).map(b => [b.range, b.text])),

  items: () => table(['Item', ...INTENSITIES.map(i => `${i}: wear`), 'moderate: optional'],
    KIT_ROWS.map(row => {
      const per = INTENSITIES.map(intensity => itemRanges(row.match, { intensity }))
      const mod = per[INTENSITIES.indexOf('moderate')]
      return [row.label, ...per.map(r => r.required ? rangePhrase(r.required) : '–'), mod.optional ? rangePhrase(mod.optional) : '–']
    })),

  temps: () => TEMP_PAGES.map(({ tempC }) => `- **${t(tempC)}**: ${kitSentence(kitAt(tempC))}`).join('\n'),

  route: () => table(['Constant', 'Value', 'Meaning'], [
    ['`STEP_KM` / `MAX_POINTS`', `${ROUTE_CONSTANTS.STEP_KM} km / ${ROUTE_CONSTANTS.MAX_POINTS}`, 'forecast point every ~6 km, at most 24 points (+ start, finish, highest point)'],
    ['`HEADWIND_KMH`', `${ROUTE_CONSTANTS.HEADWIND_KMH} km/h`, 'headwind component from which a stretch counts as "headwind"'],
    ['`DESCENT_MIN_DROP_M` / `DESCENT_MIN_KM`', `${ROUTE_CONSTANTS.DESCENT_MIN_DROP_M} m / ${ROUTE_CONSTANTS.DESCENT_MIN_KM} km`, 'minimum size of a "long descent"'],
    ['`DESCENT_COOL_BELOW`', `${ROUTE_CONSTANTS.DESCENT_COOL_BELOW}°C`, 'only descents colder than this feels-like get a note'],
    ['`INTENSITY_FLAT_SPEED`', Object.entries(INTENSITY_FLAT_SPEED).map(([k, v]) => `${k} ${v}`).join(', ') + ' km/h', 'default flat speed for GPX duration estimates, minus 5 min per 100 m climbing'],
  ]),
}

let doc = readFileSync(DOC, 'utf8')
for (const [name, render] of Object.entries(sections)) {
  const re = new RegExp(`(<!-- gen:${name} -->)[\\s\\S]*?(<!-- /gen:${name} -->)`)
  if (!re.test(doc)) throw new Error(`docs/kit-logic.md is missing the <!-- gen:${name} --> block`)
  doc = doc.replace(re, (_, open, close) => `${open}\n${render()}\n${close}`)
}

const current = readFileSync(DOC, 'utf8')
if (process.argv.includes('--check')) {
  if (doc !== current) {
    console.error('docs/kit-logic.md is out of date with kitLogic. Run `pnpm docs:kit` and review the diff.')
    process.exit(1)
  }
  console.log('docs/kit-logic.md matches the engine.')
} else {
  writeFileSync(DOC, doc)
  console.log(doc === current ? 'docs/kit-logic.md already up to date.' : 'docs/kit-logic.md updated: review the diff.')
}
