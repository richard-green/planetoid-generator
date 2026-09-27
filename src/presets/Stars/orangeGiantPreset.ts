import { BaseStarSettings } from './baseStarSettings'
import type { StarPreset } from './types'

export const orangeGiantPreset: StarPreset = {
  id: 'builtin-orange-giant',
  name: 'Orange Giant',
  settings: {
    ...BaseStarSettings,
    palette: 'Orange',
    granularity: 6,
    convection: 0.6,
  },
}
