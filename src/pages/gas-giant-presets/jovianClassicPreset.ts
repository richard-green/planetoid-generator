import { DefaultGasGiantSettings } from '../../lib/components/Threlte/Objects/GasGiantSettings'
import type { GasGiantPreset } from './types'

export const jovianClassicPreset: GasGiantPreset = {
  id: 'builtin-jovian-classic',
  name: 'Jovian Classic',
  settings: {
    ...DefaultGasGiantSettings,
    autoRotate: true,
    palette: 'jovianBands',
    surfaceTint: '#d8d1b8',
    colorScale: 1.25,
    tintShadowFloor: 0.3,
    cloudBandCount: 9,
    cloudBandSharpness: 0.62,
    cloudChaos: 0.2,
    enableStorms: true,
    stormCount: 4,
    stormScale: 0.1,
    stormPower: 2.2,
    stormStrength: 0.45,
    stormColorStrength: 0.5,
    bumpScale: 0.4,
    roughness: 0.85,
    metalness: 0.05,
    bumpTextureSize: 1024,
    colorTextureSize: 1024,
  },
}
