import { DefaultValues } from '../../lib/components/Threlte/Star/StarSettings'
import type { StarPreset } from './types'

export const orangeGiantPreset: StarPreset = {
  id: 'builtin-orange-giant',
  name: 'Orange Giant',
  settings: {
    ...DefaultValues,
    palette: 'Orange',
    brightness: 1.3,
    saturation: 1.45,
    contrast: 1.3,
    limbBrightness: 0.85,
    granularity: 6.5,
    turbulence: 6.5,
    convection: 1.4,
    sunspotCount: 6,
    sunspotScale: 1.1,
    sunspotDarkness: 0.75,
    haloIntensity: 2.4,
    haloFalloff: 6,
    haloSize: 1.32,
    plasmaIntensity: 12,
    plasmaExtent: 0.08,
    plasmaTurbulence: 3,
  },
}
