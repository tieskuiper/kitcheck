/**
 * Every distinct piece of kit the engine can recommend, grouped by zone. Used by the interactive
 * chart (range bars) and the generated tables in docs/kit-logic.md, so both cover the same items.
 * When kitLogic gets a new item name, add (or extend) a row here.
 */
import type { Zone } from './guideBase'

export interface KitRow { label: string; zone: Zone; match: (name: string) => boolean; href?: string }

export const KIT_ROWS: KitRow[] = [
  { label: 'Cap under helmet', zone: 'head', match: n => /cap$/i.test(n) },
  { label: 'Insulated jacket', zone: 'torso', match: n => n === 'Insulated jacket' },
  { label: 'Winter jersey', zone: 'torso', match: n => /winter jersey/i.test(n) },
  { label: 'Base layer', zone: 'torso', match: n => /base layer/i.test(n), href: '/guide/when-to-wear-a-base-layer-cycling/' },
  { label: 'Long-sleeve jersey', zone: 'torso', match: n => n === 'Long-sleeve jersey' },
  { label: 'Short-sleeve jersey', zone: 'torso', match: n => /^(jersey|summer jersey|lightweight summer jersey)$/i.test(n) },
  { label: 'Arm warmers', zone: 'torso', match: n => n === 'Arm warmers', href: '/guide/when-to-wear-arm-and-knee-warmers/' },
  { label: 'Gilet', zone: 'torso', match: n => /gilet/i.test(n), href: '/guide/what-to-wear-cycling-in-wind/' },
  { label: 'Rain jacket', zone: 'torso', match: n => /rain jacket/i.test(n), href: '/guide/what-to-wear-cycling-in-the-rain/' },
  { label: 'Winter gloves', zone: 'hands', match: n => /winter gloves/i.test(n), href: '/guide/when-to-wear-winter-cycling-gloves/' },
  { label: 'Light full-finger gloves', zone: 'hands', match: n => /light cycling gloves|full-finger/i.test(n) },
  { label: 'Fingerless or none', zone: 'hands', match: n => /fingerless/i.test(n) },
  { label: 'Thermal bib tights', zone: 'legs', match: n => n === 'Thermal bib tights', href: '/guide/bib-tights-or-bib-shorts/' },
  { label: 'Bib tights', zone: 'legs', match: n => n === 'Bib tights', href: '/guide/bib-tights-or-bib-shorts/' },
  { label: 'Leg warmers', zone: 'legs', match: n => n === 'Leg warmers', href: '/guide/bib-tights-or-bib-shorts/' },
  { label: 'Knee warmers', zone: 'legs', match: n => n === 'Knee warmers', href: '/guide/when-to-wear-arm-and-knee-warmers/' },
  { label: 'Bib shorts', zone: 'legs', match: n => n === 'Bib shorts' },
  { label: 'Winter overshoes', zone: 'feet', match: n => /(thermal|waterproof)( winter)? overshoes/i.test(n), href: '/guide/when-to-wear-overshoes-cycling/' },
  { label: 'Light overshoes / toe covers', zone: 'feet', match: n => /light( rain)? overshoes|toe covers/i.test(n), href: '/guide/when-to-wear-overshoes-cycling/' },
]
