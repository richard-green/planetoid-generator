import { DefaultGasGiantSettings } from '../../lib/components/Threlte/Objects/GasGiantSettings'
import type { GasGiantPreset } from './types'

export const bandedNoStormsPreset: GasGiantPreset = {
  id: 'builtin-serene-green',
  name: 'Serene Green',
  settings: {
    ...DefaultGasGiantSettings,
    palette: 'verdantCeruleanDrift',
    surfaceTint: '#AAE6CE',
    colorScale: 1.15,
    tintShadowFloor: 0.3,
    cloudBandCount: 12,
    cloudBandSharpness: 0.58,
    cloudChaos: 0.04,
    enableStorms: false,
    stormCount: 0,
    stormScale: 0,
    stormPower: 2.2,
    stormStrength: 0,
    stormColorStrength: 0,
    bumpScale: 0.4,
    roughness: 0.84,
    metalness: 0.03,
  },
}
