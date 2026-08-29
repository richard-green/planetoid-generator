import {
  DefaultValues,
  toPlanetoidPresetSettings,
} from '../../lib/components/Threlte/Objects/PlanetoidSettings'
import type { PlanetoidPreset } from './types'

export const volcanicRiftPreset: PlanetoidPreset = {
  id: 'builtin-volcanic-rift',
  name: 'Volcanic Rift',
  settings: toPlanetoidPresetSettings({
    ...DefaultValues,
    palette: 'emberFaults',
    surfaceTint: '#cf9b7d',
    colorScale: 0.92,
    volcanoCount: 24,
    volcanoStrength: 2.2,
    volcanoColorStrength: 1.7,
    ridgeStrength: 0.9,
    ridgeFrequency: 3.1,
    ridgeSharpness: 2.8,
    riftStrength: 1.0,
    riftFrequency: 5.2,
    riftWidth: 0.06,
    riftSharpness: 3.1,
  }),
}
