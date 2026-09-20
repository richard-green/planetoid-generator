import { DefaultValues } from '../../lib/components/Threlte/Star/StarSettings'
import type { StarPreset } from './types'

export const whiteDwarfPreset: StarPreset = {
  id: 'builtin-white-dwarf',
  name: 'White Dwarf',
  settings: {
    ...DefaultValues,
    palette: 'White',
    brightness: 2.1,
    saturation: 0.5,
    contrast: 1.1,
    limbBrightness: 1.1,
    textureScale: 1.4,
    granularity: 4,
    turbulence: 3.5,
    convection: 0.2,
    sunspotCount: 1,
    sunspotScale: 0.35,
    sunspotDarkness: 0.4,
    haloIntensity: 2,
    haloFalloff: 9,
    haloSize: 1.12,
    plasmaIntensity: 5,
    plasmaExtent: 0.02,
    plasmaTurbulence: 1,
  },
}
