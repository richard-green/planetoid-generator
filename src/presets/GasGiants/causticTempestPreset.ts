import { DefaultValues } from '../../lib/components/Threlte/GasGiant/GasGiantSettings'
import type { GasGiantPreset } from './types'

export const causticTempestPreset: GasGiantPreset = {
  id: 'builtin-caustic-tempest',
  name: 'Caustic Tempest',
  settings: {
    ...DefaultValues,
    palette: 'causticEmber',
    surfaceTint: '#c9f52b',
    colorScale: 2,
    tintShadowFloor: 0.18,
    normalTextureSize: 4096,
    colorTextureSize: 4096,
    normalStrength: 0.58,
    roughness: 0.8,
    metalness: 0.04,
    cloudBandCount: 1,
    cloudBandSharpness: 0.68,
    cloudChaos: 2,
    cloudTurbulence: 0.22,
    enableStorms: false,
    enableRings: false,
    enableAtmosphere: true,
    atmospherePalette: 'toxic',
    atmosphereIntensity: 1,
    atmosphereThickness: 0.06,
    atmosphereDropoff: 4,
    atmosphereTerminatorWrap: 0.3,
  },
}
