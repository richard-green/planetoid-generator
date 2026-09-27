import { BaseStarSettings } from './baseStarSettings'
import type { StarPreset } from './types'

export const yellowDwarfPreset: StarPreset = {
  id: 'builtin-yellow-dwarf',
  name: 'Yellow Dwarf',
  settings: {
    ...BaseStarSettings,
    palette: 'Yellow',
    saturation: 1,
  },
}
