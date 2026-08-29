import {
  DefaultValues,
  toPlanetoidPresetSettings,
} from '../../lib/components/Threlte/Objects/PlanetoidSettings'
import type { PlanetoidPreset } from './types'

export const rockyClassicPreset: PlanetoidPreset = {
  id: 'builtin-rocky-classic',
  name: 'Rocky Classic',
  settings: toPlanetoidPresetSettings({ ...DefaultValues }),
}
