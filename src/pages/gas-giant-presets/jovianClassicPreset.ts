import { DefaultGasGiantSettings } from '../../lib/components/Threlte/Objects/GasGiantSettings'
import type { GasGiantPreset } from './types'

export const jovianClassicPreset: GasGiantPreset = {
  id: 'builtin-jovian-classic',
  name: 'Jovian Classic',
  settings: {
    ...DefaultGasGiantSettings,
    palette: 'jovianBands',
    colorScale: 1.35,
    cloudBandCount: 13,
    cloudBandSharpness: 0.62,
    cloudChaos: 0.62,
    enableStorms: true,
    stormCount: 10,
    stormScale: 0.2,
    stormPower: 2.1,
    stormStrength: 0.55,
    stormColorStrength: 0.45,
    roughness: 0.8,
    metalness: 0.04,
  },
}
