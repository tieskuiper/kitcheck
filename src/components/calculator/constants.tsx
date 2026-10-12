import type { ComponentType, CSSProperties, ReactNode } from 'react'
import { IconBlip, IconLightning, IconFire2, IconRacingFlag, IconConstructionHelmet, IconFashion, IconHand5Finger, IconBathMan1, IconFootsteps } from '@central-icons-react/round-outlined-radius-3-stroke-2'
import type { Intensity } from '../../lib/kitLogic'

// ── Tier / level accent colours (dynamic, must stay inline) ──────────────────
export const TIER_ACCENT: Record<string, string> = {
  'Extreme cold': '#0D47A1',
  'Cold': '#1565C0',
  'Cool': '#4A90D9',
  'Comfortable': '#2E9E5A',
  'Warm': '#F5A623',
  'Hot': '#D93025',
}
export const TIER_BG: Record<string, string> = {
  'Extreme cold': '#E3F2FD',
  'Cold': '#EAF4FD',
  'Cool': '#EDF4FF',
  'Comfortable': '#EDFFEF',
  'Warm': '#FFFAED',
  'Hot': '#FFF3ED',
}

const intensityIcon = (active: boolean) => `shrink-0 ${active ? 'text-coral' : 'text-dark'}`

export const INTENSITY_OPTIONS: { value: Intensity; label: string; desc: string; icon: (active: boolean) => ReactNode }[] = [
  { value: 'easy', label: 'Easy', desc: 'Recovery / leisure', icon: (a) => <IconBlip size={18} className={intensityIcon(a)} /> },
  { value: 'moderate', label: 'Moderate', desc: 'Endurance ride', icon: (a) => <IconLightning size={18} className={intensityIcon(a)} /> },
  { value: 'hard', label: 'Hard', desc: 'Training / fast group', icon: (a) => <IconFire2 size={18} className={intensityIcon(a)} /> },
  { value: 'race', label: 'Race', desc: 'Full effort', icon: (a) => <IconRacingFlag size={18} className={intensityIcon(a)} /> },
]

export const WARMTH_LABELS = ['Always cold', 'Runs cold', 'Average', 'Runs warm', 'Always warm']

export const CAT_ICONS: Record<string, ComponentType<{ size?: number; style?: CSSProperties; className?: string }>> = {
  head: IconConstructionHelmet,
  torso: IconFashion,
  hands: IconHand5Finger,
  legs: IconBathMan1,
  feet: IconFootsteps,
}
export const CAT_LABELS: Record<string, string> = { head: 'Head & Eyes', torso: 'Upper Body', hands: 'Hands', legs: 'Lower Body', feet: 'Feet' }
