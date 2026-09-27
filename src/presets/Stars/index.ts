import { blueSupergiantPreset } from './blueSupergiantPreset'
import { orangeGiantPreset } from './orangeGiantPreset'
import { redDwarfPreset } from './redDwarfPreset'
import { whiteDwarfPreset } from './whiteDwarfPreset'
import { yellowDwarfPreset } from './yellowDwarfPreset'

export type { StarPreset } from './types'

export const BUILTIN_STAR_PRESETS = [
  blueSupergiantPreset,
  whiteDwarfPreset,
  yellowDwarfPreset,
  orangeGiantPreset,
  redDwarfPreset,
]
