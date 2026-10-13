/** Shared by the guide pages and the interactive chart (kept tiny: the chart ships it to the browser) */
import type { RiderInput } from './kitLogic'

export const ZONES = ['head', 'torso', 'hands', 'legs', 'feet'] as const
export type Zone = typeof ZONES[number]

/** Reference conditions for every guide page: moderate effort, light wind, dry, average rider */
export const BASELINE: Omit<RiderInput, 'apparentTemp'> = {
  windspeed: 10, precipProb: 0, warmthBias: 0, intensity: 'moderate',
}
