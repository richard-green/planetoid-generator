import { DefaultGasGiantSettings } from '../../lib/components/Threlte/Objects/GasGiantSettings'
import type { GasGiantPreset } from './types'

export const iceCalmPreset: GasGiantPreset = {
  id: 'builtin-ice-calm',
  name: 'Ice Calm',
  settings: {
    ...DefaultGasGiantSettings,
    palette: 'iceGiantTeal',
    colorScale: 1.15,
    cloudBandCount: 9,
    cloudBandSharpness: 0.35,
    cloudChaos: 0.24,
    enableStorms: true,
    stormCount: 4,
    stormScale: 0.12,
    stormPower: 2.8,
    stormStrength: 0.22,
    stormColorStrength: 0.22,
    roughness: 0.88,
    metalness: 0.02,
  },
}
