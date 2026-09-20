import { GasGiantPaletteNames, type GasGiantPaletteName } from './GasGiantPalettes'
import { sanitizeTextureSize, type TextureSize } from '../../../types/textureSize'
import { DefaultRingValues, sanitizeRingSettings, type RingSettings } from '../Rings/RingSettings'
import {
  sanitizeBoolean,
  sanitizeEnum,
  sanitizeHexColor,
  sanitizeNumericMap,
  toRecord,
  type NumericSanitizeSpec,
} from '../../../utils/sanitize'

export type GasGiantViewMode = 'mesh' | 'normal' | 'texture'

export type GasGiantSettings = RingSettings & {
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
  normalStrength: number
  roughness: number
  metalness: number
  normalTextureSize: TextureSize
  colorTextureSize: TextureSize
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
  | 'normalStrength'
  | 'roughness'
  | 'metalness'
>

export type GasGiantRangeKey = keyof GasGiantRangeValues

export const DefaultValues: GasGiantSettings = {
  ...DefaultRingValues,
  seed: 1,
  autoRotate: false,
  palette: 'verdantCeruleanDrift',
  surfaceTint: '#c1d9b7',
  colorScale: 0.8,
  tintShadowFloor: 0.3,
  cloudBandCount: 6,
  cloudBandSharpness: 0.2,
  cloudChaos: 0.6,
  enableStorms: true,
  stormCount: 2,
  stormScale: 0.1,
  stormPower: 2.2,
  stormStrength: 0.45,
  stormColorStrength: 0.4,
  normalStrength: 0.5,
  roughness: 0.82,
  metalness: 0.05,
  normalTextureSize: 1024,
  colorTextureSize: 1024,
}

export const MinValues: GasGiantRangeValues = {
  seed: 1,
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
  normalStrength: 0,
  roughness: 0,
  metalness: 0,
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
  normalStrength: 1,
  roughness: 1,
  metalness: 1,
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
  normalStrength: 0.05,
  roughness: 0.01,
  metalness: 0.01,
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
  normalStrength: {
    defaultValue: DefaultValues.normalStrength,
    min: MinValues.normalStrength,
    max: MaxValues.normalStrength,
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
}

export function sanitizeGasGiantSettings(input: unknown): GasGiantSettings {
  const raw = toRecord(input)
  const migratedRaw = {
    ...raw,
    normalStrength: raw.normalStrength ?? raw.bumpScale,
    normalTextureSize: raw.normalTextureSize ?? raw.bumpTextureSize,
  }
  const numeric = sanitizeNumericMap(migratedRaw, NUMERIC_SANITIZE_SPECS)

  const palette = sanitizeEnum(raw, 'palette', GasGiantPaletteNames, DefaultValues.palette)
  const surfaceTint = sanitizeHexColor(raw, 'surfaceTint', DefaultValues.surfaceTint)

  return {
    ...sanitizeRingSettings(raw),
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
    normalStrength: numeric.normalStrength,
    roughness: numeric.roughness,
    metalness: numeric.metalness,
    normalTextureSize: sanitizeTextureSize(
      migratedRaw.normalTextureSize,
      DefaultValues.normalTextureSize
    ),
    colorTextureSize: sanitizeTextureSize(raw.colorTextureSize, DefaultValues.colorTextureSize),
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
  normalStrength: 'Normal strength',
  roughness: 'Roughness',
  metalness: 'Metalness',
}

export const GasGiantUiLabels = {
  scene: 'Scene',
  viewMode: 'View mode',
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
  normalStrength: '--normal-strength',
  roughness: '--roughness',
  metalness: '--metalness',
}

export const GasGiantCliToggleFlags = {
  autoRotate: '--auto-rotate',
  stormsEnabled: '--storms-enabled',
} as const
