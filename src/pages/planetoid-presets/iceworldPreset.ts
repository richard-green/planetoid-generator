import { DefaultPlanetoidSettings } from '../../lib/components/Threlte/Objects/PlanetoidSettings'
import type { PlanetoidPreset } from './types'

export const iceworldPreset: PlanetoidPreset = {
  id: 'builtin-iceworld',
  name: 'Iceworld',
  settings: {
    ...DefaultPlanetoidSettings,
    palette: 'icy',
    surfaceTint: '#d8ecff',
    colorScale: 0.82,
    tintShadowFloor: 0.32,
    roughness: 0.35,
    metalness: 0.18,
    largeScale: 0.35,
    mediumScale: 0.2,
    smallScale: 0.15,
  },
}
