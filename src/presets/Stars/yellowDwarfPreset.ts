import { DefaultValues } from '../../lib/components/Threlte/Star/StarSettings'
import type { StarPreset } from './types'

export const yellowDwarfPreset: StarPreset = {
  id: 'builtin-yellow-dwarf',
  name: 'Yellow Dwarf',
  settings: {
    ...DefaultValues,
    palette: 'Yellow',
    brightness: 1.5,
    saturation: 1.3,
    contrast: 1.4,
    granularity: 8,
    turbulence: 8,
    sunspotCount: 8,
    sunspotDarkness: 0.9,
    haloIntensity: 2.8,
    haloSize: 1.27,
    plasmaIntensity: 10,
  },
}
