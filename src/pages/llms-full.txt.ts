/**
 * /llms-full.txt — every guide answer in one plain-text file, for AI tools that read a site
 * before citing it. Generated from the same data as the pages, so the two never disagree.
 */
import type { APIRoute } from 'astro'
import { TEMP_PAGES, ZONES, ZONE_LABELS, kitAt, kitSentence, variationsAt, toF, pathFor } from '../lib/guideData'
import { KIT_ITEM_PAGES, CONDITION_PAGES } from '../lib/guideContent'
import { itemRanges, itemRangesByIntensity, itemSentence, rangePhrase } from '../lib/kitRanges'
import { abs, AUTHOR, CONTENT_UPDATED } from '../lib/site'
import type { KitResult } from '../lib/kitLogic'

const kitLines = (kit: KitResult) => ZONES.map(z => {
  const items = kit[z].items.filter(i => i.name !== 'Helmet')
  return `- ${ZONE_LABELS[z]}: ${items.length ? items.map(i => i.name + (i.optional ? ' (optional)' : '')).join(', ') : 'helmet only'}`
})

export const GET: APIRoute = () => {
  const out: string[] = [
    '# kitcheck.cc — what to wear cycling, full guide',
    '',
    `> Free, brand-neutral cycling kit calculator for road cyclists (${abs('/')}). It turns the hourly forecast for a ride (feels-like temperature, wind, rain) into a kit list for head, upper body, hands, legs and feet, adjusted for effort and how warm the rider runs. No app or account. By ${AUTHOR.name}, updated ${CONTENT_UPDATED}.`,
    '',
    'All kit lists below are for a moderate (endurance) pace, light wind and no rain unless stated otherwise. Temperatures are the feels-like temperature from the forecast. Riding harder makes it feel warmer on the bike; hands, feet and head benefit much less from effort than the body does.',
    '',
  ]

  out.push('## What to wear cycling by temperature', '')
  for (const { tempC, intro } of TEMP_PAGES) {
    const kit = kitAt(tempC)
    out.push(`### ${tempC}°C (${toF(tempC)}°F)`, `Source: ${abs(pathFor(tempC))}`, '', intro, '', `Short answer: ${kitSentence(kit)}`, '', ...kitLines(kit), '')
    for (const v of variationsAt(tempC)) {
      out.push(v.changes.length
        ? `- ${v.title} (${v.detail}): ${v.changes.map(ch => `${ZONE_LABELS[ch.zone].toLowerCase()}: ${ch.items.map(i => i.name + (i.optional ? ' (optional)' : '')).join(', ')}`).join('; ')}`
        : `- ${v.title} (${v.detail}): no change`)
    }
    out.push('')
  }

  out.push('## When to wear each piece of kit', '')
  for (const p of KIT_ITEM_PAGES) {
    const parts = [p, ...(p.extra ? [p.extra] : [])]
    out.push(`### ${p.title}`, `Source: ${abs(`/guide/${p.slug}/`)}`, '')
    for (const part of parts) {
      out.push(itemSentence(part, itemRanges(part.match, { ...p.overrides, intensity: 'moderate' })), '')
      for (const r of itemRangesByIntensity(part.match, p.overrides)) {
        out.push(`- ${part.name}, ${r.intensity} pace: ${r.required ? rangePhrase(r.required) : 'not needed'}${r.optional ? `; optional ${rangePhrase(r.optional)}` : ''}`)
      }
      out.push('')
    }
    out.push(...p.intro, '', ...p.tips.map(t => `- ${t}`), '', ...p.faq.flatMap(f => [`Q: ${f.q}`, `A: ${f.a}`, '']))
  }

  out.push('## Weather', '')
  for (const p of CONDITION_PAGES) {
    out.push(`### ${p.title}`, `Source: ${abs(`/guide/${p.slug}/`)}`, '', p.intro, '')
    if (p.table) {
      out.push(`${p.table.heading} (${p.table.caption})`, '')
      for (const c of p.table.temps) {
        const kit = kitAt(c, p.table.overrides)
        out.push(`- ${c}°C (${toF(c)}°F): ${ZONES.map(z => kit[z].items.filter(i => i.name !== 'Helmet').map(i => i.name + (i.optional ? ' (optional)' : '')).join(', ')).filter(Boolean).join('; ')}`)
      }
      out.push('')
    }
    for (const s of p.sections) out.push(`#### ${s.heading}`, ...s.body, '')
    out.push(...p.faq.flatMap(f => [`Q: ${f.q}`, `A: ${f.a}`, '']))
  }

  out.push('## Method', '', `How kitcheck.cc decides: ${abs('/how-it-works/')}`, `Interactive temperature chart: ${abs('/guide/cycling-temperature-chart/')}`, '')
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
