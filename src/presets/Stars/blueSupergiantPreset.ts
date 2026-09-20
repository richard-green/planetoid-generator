import { DefaultValues } from '../../lib/components/Threlte/Star/StarSettings'
import type { StarPreset } from './types'

export const blueSupergiantPreset: StarPreset = {
  id: 'builtin-blue-supergiant',
  name: 'Blue Supergiant',
  settings: {
    ...DefaultValues,
    palette: 'Blue',
    brightness: 2.4,
    saturation: 1.1,
    contrast: 1.6,
    limbBrightness: 1.4,
    textureScale: 2.6,
    granularity: 7.5,
    turbulence: 7.5,
    convection: 2.2,
    sunspotCount: 3,
    sunspotScale: 0.6,
    sunspotDarkness: 0.5,
    haloIntensity: 3,
    haloFalloff: 5,
    haloSize: 1.38,
    plasmaIntensity: 16,
    plasmaExtent: 0.12,
    plasmaTurbulence: 4.5,
    plasmaSharpness: 4,
  },
}
