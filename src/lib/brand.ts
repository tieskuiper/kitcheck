/**
 * kitcheck.cc brand devices: the temperature scale (the kit card's tier colours, cold → hot)
 * and a road-stage elevation profile. Used instead of generic glows and grids.
 */
import { TIER_ACCENT } from '../components/calculator/constants'

const TIERS = ['Extreme cold', 'Cold', 'Cool', 'Comfortable', 'Warm', 'Hot'] as const
export const THERMO_GRADIENT = `linear-gradient(90deg, ${TIERS.map(t => TIER_ACCENT[t]).join(', ')})`

// A made-up road stage: rolling start, two climbs, a long summit finish (relative heights 0–100)
const STAGE = [8, 10, 9, 14, 12, 18, 30, 44, 52, 40, 26, 20, 24, 22, 30, 46, 62, 70, 58, 42, 36, 40, 52, 66, 78, 88, 96, 92]

/** Smooth SVG path through the stage profile (Catmull-Rom → Bézier), in a w×h box */
export function stagePath(w: number, h: number, pad = 4, points = STAGE): { line: string; area: string } {
  const pts = points.map((v, i) => [(i / (points.length - 1)) * w, h - pad - (v / 100) * (h - pad * 2)])
  let line = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    line += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return { line, area: `${line} L${w},${h} L0,${h} Z` }
}

/** Short profile for heading underlines */
export const MINI_STAGE = [10, 30, 22, 60, 40, 85, 70]
