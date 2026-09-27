import { BaseStarSettings } from './baseStarSettings'
import type { StarPreset } from './types'

export const whiteDwarfPreset: StarPreset = {
  id: 'builtin-white-dwarf',
  name: 'White Dwarf',
  settings: {
    ...BaseStarSettings,
    palette: 'White',
  },
}
