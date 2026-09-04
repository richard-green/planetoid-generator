import { GasGiantPaletteNames, type GasGiantPaletteName } from './GasGiantPalettes'
import {
  sanitizeBoolean,
  sanitizeEnum,
  sanitizeHexColor,
  sanitizeNumericMap,
  toRecord,
  type NumericSanitizeSpec,
} from '../../../utils/sanitize'

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

export const DefaultValues: GasGiantSettings = {
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

export const MinValues: GasGiantRangeValues = {
  seed: 0,
  colorScale: 0,
  tintShadowFloor: 0,
  cloudBandCount: 1,
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
  seed: 1000000000,
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
  bumpTextureSize: 4096,
  colorTextureSize: 4096,
}

export const StepValues: GasGiantRangeValues = {
  seed: 1,
  colorScale: 0.05,
  tintShadowFloor: 0.01,
  cloudBandCount: 1,
  cloudBandSharpness: 0.01,
  cloudChaos: 0.01,
  stormCount: 1,
  stormScale: 0.01,
  stormPower: 0.1,
  stormStrength: 0.01,
  stormColorStrength: 0.01,
  bumpScale: 0.05,
  roughness: 0.01,
  metalness: 0.01,
  bumpTextureSize: 1,
  colorTextureSize: 1,
}

const NUMERIC_SANITIZE_SPECS: Record<GasGiantRangeKey, NumericSanitizeSpec> = {
  seed: {
    defaultValue: DefaultValues.seed,
    min: MinValues.seed,
    max: MaxValues.seed,
    round: true,
  },
  colorScale: {
    defaultValue: DefaultValues.colorScale,
    min: MinValues.colorScale,
    max: MaxValues.colorScale,
  },
  tintShadowFloor: {
    defaultValue: DefaultValues.tintShadowFloor,
    min: MinValues.tintShadowFloor,
    max: MaxValues.tintShadowFloor,
  },
  cloudBandCount: {
    defaultValue: DefaultValues.cloudBandCount,
    min: MinValues.cloudBandCount,
    max: MaxValues.cloudBandCount,
    round: true,
  },
  cloudBandSharpness: {
    defaultValue: DefaultValues.cloudBandSharpness,
    min: MinValues.cloudBandSharpness,
    max: MaxValues.cloudBandSharpness,
  },
  cloudChaos: {
    defaultValue: DefaultValues.cloudChaos,
    min: MinValues.cloudChaos,
    max: MaxValues.cloudChaos,
  },
  stormCount: {
    defaultValue: DefaultValues.stormCount,
    min: MinValues.stormCount,
    max: MaxValues.stormCount,
    round: true,
  },
  stormScale: {
    defaultValue: DefaultValues.stormScale,
    min: MinValues.stormScale,
    max: MaxValues.stormScale,
  },
  stormPower: {
    defaultValue: DefaultValues.stormPower,
    min: MinValues.stormPower,
    max: MaxValues.stormPower,
  },
  stormStrength: {
    defaultValue: DefaultValues.stormStrength,
    min: MinValues.stormStrength,
    max: MaxValues.stormStrength,
  },
  stormColorStrength: {
    defaultValue: DefaultValues.stormColorStrength,
    min: MinValues.stormColorStrength,
    max: MaxValues.stormColorStrength,
  },
  bumpScale: {
    defaultValue: DefaultValues.bumpScale,
    min: MinValues.bumpScale,
    max: MaxValues.bumpScale,
  },
  roughness: {
    defaultValue: DefaultValues.roughness,
    min: MinValues.roughness,
    max: MaxValues.roughness,
  },
  metalness: {
    defaultValue: DefaultValues.metalness,
    min: MinValues.metalness,
    max: MaxValues.metalness,
  },
  bumpTextureSize: {
    defaultValue: DefaultValues.bumpTextureSize,
    min: MinValues.bumpTextureSize,
    max: MaxValues.bumpTextureSize,
    round: true,
  },
  colorTextureSize: {
    defaultValue: DefaultValues.colorTextureSize,
    min: MinValues.colorTextureSize,
    max: MaxValues.colorTextureSize,
    round: true,
  },
}

export function sanitizeGasGiantSettings(input: unknown): GasGiantSettings {
  const raw = toRecord(input)
  const numeric = sanitizeNumericMap(raw, NUMERIC_SANITIZE_SPECS)

  const palette = sanitizeEnum(raw, 'palette', GasGiantPaletteNames, DefaultValues.palette)
  const surfaceTint = sanitizeHexColor(raw, 'surfaceTint', DefaultValues.surfaceTint)

  return {
    seed: numeric.seed,
    autoRotate: sanitizeBoolean(raw, 'autoRotate', DefaultValues.autoRotate),
    palette,
    surfaceTint,
    colorScale: numeric.colorScale,
    tintShadowFloor: numeric.tintShadowFloor,
    cloudBandCount: numeric.cloudBandCount,
    cloudBandSharpness: numeric.cloudBandSharpness,
    cloudChaos: numeric.cloudChaos,
    enableStorms: sanitizeBoolean(raw, 'enableStorms', DefaultValues.enableStorms),
    stormCount: numeric.stormCount,
    stormScale: numeric.stormScale,
    stormPower: numeric.stormPower,
    stormStrength: numeric.stormStrength,
    stormColorStrength: numeric.stormColorStrength,
    bumpScale: numeric.bumpScale,
    roughness: numeric.roughness,
    metalness: numeric.metalness,
    bumpTextureSize: numeric.bumpTextureSize,
    colorTextureSize: numeric.colorTextureSize,
  }
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
  bumpTextureSize: 'Bump texture size',
  colorTextureSize: 'Color texture size',
}

export const GasGiantUiLabels = {
  scene: 'Scene',
  autoRotate: 'Auto-rotate',
  seed: 'Seed',
  texture: 'Texture',
  features: 'Features',
  material: 'Material',
  colorSettings: 'Color settings',
  textureResolution: 'Texture resolution',
  cloudBands: 'Cloud bands',
  stormSystems: 'Storm systems',
  properties: 'Properties',
  palette: 'Palette',
  surfaceTint: 'Surface tint',
  enableStorms: 'Enable storm systems',
} as const

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
