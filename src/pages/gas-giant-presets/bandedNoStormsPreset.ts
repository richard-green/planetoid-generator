import { DefaultGasGiantSettings } from '../../lib/components/Threlte/Objects/GasGiantSettings'
import type { GasGiantPreset } from './types'

export const bandedNoStormsPreset: GasGiantPreset = {
  id: 'builtin-banded-no-storms',
  name: 'Banded No Storms',
  settings: {
    ...DefaultGasGiantSettings,
    palette: 'opalStratosphere',
    colorScale: 1.3,
    cloudBandCount: 12,
    cloudBandSharpness: 0.58,
    cloudChaos: 0.38,
    enableStorms: false,
    stormCount: 0,
    stormScale: 0,
    stormPower: 2.2,
    stormStrength: 0,
    stormColorStrength: 0,
    roughness: 0.84,
    metalness: 0.03,
  },
}
