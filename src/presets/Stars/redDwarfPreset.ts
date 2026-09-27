import { BaseStarSettings } from './baseStarSettings'
import type { StarPreset } from './types'

export const redDwarfPreset: StarPreset = {
  id: 'builtin-red-dwarf',
  name: 'Red Dwarf',
  settings: {
    ...BaseStarSettings,
    palette: 'Red',
    brightness: 1.1,
    saturation: 1.4,
  },
}
