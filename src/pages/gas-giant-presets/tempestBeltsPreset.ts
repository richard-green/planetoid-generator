import { DefaultGasGiantSettings } from '../../lib/components/Threlte/Objects/GasGiantSettings'
import type { GasGiantPreset } from './types'

export const tempestBeltsPreset: GasGiantPreset = {
  id: 'builtin-tempest-belts',
  name: 'Tempest Belts',
  settings: {
    ...DefaultGasGiantSettings,
    palette: 'stormAzure',
    colorScale: 1.6,
    cloudBandCount: 16,
    cloudBandSharpness: 0.72,
    cloudChaos: 1.2,
    enableStorms: true,
    stormCount: 16,
    stormScale: 0.22,
    stormPower: 1.8,
    stormStrength: 0.78,
    stormColorStrength: 0.66,
    roughness: 0.74,
    metalness: 0.08,
  },
}
