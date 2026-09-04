import {
  DefaultValues,
  toPlanetoidPresetSettings,
} from '../../lib/components/Threlte/Planetoid/PlanetoidSettings'
import type { PlanetoidPreset } from './types'

export const metallicCratersPreset: PlanetoidPreset = {
  id: 'builtin-metallic-craters',
  name: 'Metallic Craters',
  settings: toPlanetoidPresetSettings({
    ...DefaultValues,
    palette: 'mineralVeins',
    surfaceTint: '#b8b4ad',
    craterCount: 44,
    craterStrength: 6.8,
    craterColorStrength: 1.4,
    roughness: 0.7,
    metalness: 0.7,
  }),
}
