import { BaseStarSettings } from './baseStarSettings'
import type { StarPreset } from './types'

export const blueSupergiantPreset: StarPreset = {
  id: 'builtin-blue-supergiant',
  name: 'Blue Supergiant',
  settings: {
    ...BaseStarSettings,
    palette: 'Blue',
    brightness: 1.2,
    saturation: 1.5,
    contrast: 1.2,
  },
}
