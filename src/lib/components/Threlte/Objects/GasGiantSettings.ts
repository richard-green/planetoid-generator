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
  | 'bumpScale'
  | 'roughness'
  | 'metalness'
  | 'bumpTextureSize'
  | 'colorTextureSize'
>

export type GasGiantRangeKey = keyof GasGiantRangeValues

export const DefaultGasGiantSettings: GasGiantSettings = {
  seed: 21,
  autoRotate: true,
  palette: 'jovianBands',
  surfaceTint: '#d8d1b8',
  colorScale: 1.25,
  tintShadowFloor: 0.3,
  cloudBandCount: 11,
  cloudBandSharpness: 0.58,
  cloudChaos: 0.8,
  bumpScale: 0.7,
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
  autoRotate: 'Auto-rotate giant',
} as const

export const MinValues: GasGiantRangeValues = {
  seed: 0,
  colorScale: 0,
  tintShadowFloor: 0,
  cloudBandCount: 2,
  cloudBandSharpness: 0,
  cloudChaos: 0,
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
  bumpScale: 10,
  roughness: 1,
  metalness: 1,
  bumpTextureSize: 2048,
  colorTextureSize: 2048,
}

