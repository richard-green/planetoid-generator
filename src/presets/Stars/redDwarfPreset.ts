import { DefaultValues } from '../../lib/components/Threlte/Star/StarSettings'
import type { StarPreset } from './types'

export const redDwarfPreset: StarPreset = {
  id: 'builtin-red-dwarf',
  name: 'Red Dwarf',
  settings: {
    ...DefaultValues,
    palette: 'Red',
    brightness: 0.9,
    saturation: 1.6,
    contrast: 1.2,
    limbBrightness: 0.45,
    granularity: 5.5,
    turbulence: 5,
    convection: 0.8,
    sunspotCount: 12,
    sunspotScale: 0.8,
    sunspotDarkness: 1,
    haloIntensity: 1.6,
    haloFalloff: 8.5,
    haloSize: 1.16,
    plasmaIntensity: 6,
    plasmaExtent: 0.03,
  },
}
