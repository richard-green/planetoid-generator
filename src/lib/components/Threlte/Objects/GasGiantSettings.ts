import type { GasGiantPaletteName } from './GasGiantPalettes'

export type GasGiantSettings = {
  seed: number
  autoRotate: boolean
  palette: GasGiantPaletteName
  surfaceTint: string
  colorScale: number
  tintShadowFloor: number
  cloudBandCount: number
  cloudBandSharpness: number
  cloudChaos: number
  enableStorms: boolean
  stormCount: number
  stormScale: number
  stormPower: number
  stormStrength: number
  stormColorStrength: number
  bumpScale: number
  roughness: number
  metalness: number
  bumpTextureSize: number
  colorTextureSize: number
}

export type GasGiantRangeValues = Pick<
  GasGiantSettings,
  | 'seed'
  | 'colorScale'
  | 'tintShadowFloor'
  | 'cloudBandCount'
  | 'cloudBandSharpness'
  | 'cloudChaos'
  | 'stormCount'
  | 'stormScale'
  | 'stormPower'
  | 'stormStrength'
  | 'stormColorStrength'
  | 'bumpScale'
  | 'roughness'
  | 'metalness'
  | 'bumpTextureSize'
  | 'colorTextureSize'
>

export type GasGiantRangeKey = keyof GasGiantRangeValues

export const GasGiantCliFlagByRangeKey: Record<GasGiantRangeKey, string> = {
  seed: '--seed',
  colorScale: '--color-scale',
  tintShadowFloor: '--tint-shadow-floor',
  cloudBandCount: '--cloud-band-count',
  cloudBandSharpness: '--cloud-band-sharpness',
  cloudChaos: '--cloud-chaos',
  stormCount: '--storm-count',
  stormScale: '--storm-scale',
  stormPower: '--storm-power',
  stormStrength: '--storm-strength',
  stormColorStrength: '--storm-color-strength',
  bumpScale: '--bump-scale',
  roughness: '--roughness',
  metalness: '--metalness',
  bumpTextureSize: '--bump-tex-height',
  colorTextureSize: '--color-tex-height',
}

export const GasGiantCliToggleFlags = {
  autoRotate: '--auto-rotate',
  stormsEnabled: '--storms-enabled',
} as const

export const DefaultGasGiantSettings: GasGiantSettings = {
  seed: 21,
  autoRotate: true,
  palette: 'jovianBands',
  surfaceTint: '#d8d1b8',
  colorScale: 1.15,
  tintShadowFloor: 0.3,
  cloudBandCount: 6,
  cloudBandSharpness: 0.2,
  cloudChaos: 0.6,
  enableStorms: true,
  stormCount: 4,
  stormScale: 0.1,
  stormPower: 2.2,
  stormStrength: 0.45,
  stormColorStrength: 0.4,
  bumpScale: 0.4,
  roughness: 0.82,
  metalness: 0.05,
  bumpTextureSize: 1024,
  colorTextureSize: 1024,
}

export const GasGiantRangeLabels: Record<GasGiantRangeKey, string> = {
  seed: 'Seed',
  colorScale: 'Palette influence',
  tintShadowFloor: 'Tint shadow floor',
  cloudBandCount: 'Cloud band count',
  cloudBandSharpness: 'Band sharpness',
  cloudChaos: 'Cloud chaos',
  stormCount: 'Storm count',
  stormScale: 'Storm scale',
  stormPower: 'Storm falloff power',
  stormStrength: 'Storm strength',
  stormColorStrength: 'Storm color strength',
  bumpScale: 'Bump scale',
  roughness: 'Roughness',
  metalness: 'Metalness',
  bumpTextureSize: 'Bump texture height',
  colorTextureSize: 'Color texture height',
}

export const GasGiantUiLabels = {
  seed: 'Seed',
  palette: 'Palette',
  surfaceTint: 'Surface tint',
  autoRotate: 'Auto-rotate',
  enableStorms: 'Enable storm systems',
} as const

export const MinValues: GasGiantRangeValues = {
  seed: 0,
  colorScale: 0,
  tintShadowFloor: 0,
  cloudBandCount: 2,
  cloudBandSharpness: 0,
  cloudChaos: 0,
  stormCount: 0,
  stormScale: 0,
  stormPower: 0.5,
  stormStrength: 0,
  stormColorStrength: 0,
  bumpScale: 0,
  roughness: 0,
  metalness: 0,
  bumpTextureSize: 128,
  colorTextureSize: 64,
}

export const MaxValues: GasGiantRangeValues = {
  seed: 999999,
  colorScale: 2,
  tintShadowFloor: 0.9,
  cloudBandCount: 28,
  cloudBandSharpness: 1,
  cloudChaos: 2,
  stormCount: 32,
  stormScale: 0.45,
  stormPower: 6,
  stormStrength: 1.5,
  stormColorStrength: 1.5,
  bumpScale: 10,
  roughness: 1,
  metalness: 1,
  bumpTextureSize: 2048,
  colorTextureSize: 2048,
}
