import { DefaultPlanetoidSettings } from '../../lib/components/Threlte/Objects/PlanetoidSettings'
import type { PlanetoidPreset } from './types'

export const metallicCratersPreset: PlanetoidPreset = {
  id: 'builtin-metallic-craters',
  name: 'Metallic Craters',
  settings: {
    ...DefaultPlanetoidSettings,
    palette: 'mineralVeins',
    surfaceTint: '#b8b4ad',
    craterCount: 44,
    craterStrength: 6.8,
    craterColorStrength: 1.4,
    craterRayStrength: 2.6,
    roughness: 0.38,
    metalness: 0.72,
  },
}
