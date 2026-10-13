/**
 * /llms.txt — a plain-text map of the site for AI tools (llmstxt.org). The quick reference is
 * generated from kitLogic, so what AI tools quote matches the calculator.
 */
import type { APIRoute } from 'astro'
import { TEMP_PAGES, kitAt, kitSentence, toF, pathFor } from '../lib/guideData'
import { KIT_ITEM_PAGES, CONDITION_PAGES } from '../lib/guideContent'
import { itemRanges, itemSentence } from '../lib/kitRanges'
import { abs } from '../lib/site'

export const GET: APIRoute = () => {
  const lines = [
    '# kitcheck.cc',
    '',
    '> Free cycling kit calculator for road cyclists. Enter a location (or upload a GPX route), pick an effort level and get a kit list for head, upper body, hands, legs and feet, based on the hourly forecast (feels-like temperature, wind, rain) for the whole ride. Works in °C and °F, no account needed.',
    '',
    'Recommendations depend on the feels-like temperature, effort (easy, moderate, hard, race), how warm the rider runs, wind and chance of rain. Gloves, overshoes and head covering respond less to effort than body layers. The guide pages below use the same logic as the calculator.',
    '',
    '## Quick reference (moderate pace, light wind, no rain)',
    '',
    ...TEMP_PAGES.map(({ tempC }) => `- ${tempC}°C (${toF(tempC)}°F): ${kitSentence(kitAt(tempC))}`),
    '',
    '## When to wear each item',
    '',
    ...KIT_ITEM_PAGES.map(p => `- ${p.title.replace(/:.*$/, '')}: ${itemSentence(p, itemRanges(p.match, { ...p.overrides, intensity: 'moderate' }))}`),
    '',
    '## Tool',
    '',
    `- [Cycling kit calculator](${abs('/')}): what to wear for a ride today or in the next 7 days, from the real forecast`,
    `- [How it works](${abs('/how-it-works/')}): the method behind the recommendations`,
    '',
    '## Guides',
    '',
    `- [Cycling clothing temperature chart](${abs('/guide/cycling-temperature-chart/')}): interactive: kit per temperature from -10°C to 35°C (14°F to 95°F), by effort, wind and rain`,
    `- [Kit guide](${abs('/guide/')}): overview of all guides`,
    ...TEMP_PAGES.map(({ tempC }) => `- [What to wear cycling at ${tempC}°C (${toF(tempC)}°F)](${abs(pathFor(tempC))})`),
    ...KIT_ITEM_PAGES.map(p => `- [${p.title}](${abs(`/guide/${p.slug}/`)}): ${p.description}`),
    ...CONDITION_PAGES.map(p => `- [${p.title}](${abs(`/guide/${p.slug}/`)}): ${p.description}`),
    '',
    '## Optional',
    '',
    `- [About](${abs('/about/')}): who makes kitcheck.cc`,
    `- [Privacy](${abs('/privacy/')})`,
    '',
  ]
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
