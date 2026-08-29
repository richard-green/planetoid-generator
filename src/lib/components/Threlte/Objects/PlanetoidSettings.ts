import { PlanetoidPaletteNames, type PlanetoidPaletteName } from './PlanetoidPalettes'
import {
  sanitizeBoolean,
  sanitizeEnum,
  sanitizeHexColor,
  sanitizeNumericMap,
  toRecord,
  type NumericSanitizeSpec,
} from '../../../utils/sanitize'

export type PlanetoidViewMode = 'mesh' | 'normal' | 'texture'

export type PlanetoidPresetExcludedKey =
  'seed' | 'autoRotate' | 'showDebugMeshes' | 'normalTextureSize' | 'colorTextureSize'

export type PlanetoidSettings = {
  autoRotate: boolean
  showDebugMeshes: boolean
  enableCraters: boolean
  enableRidges: boolean
  enableRifts: boolean
  enableVolcanoes: boolean
  seed: number
  palette: PlanetoidPaletteName
  surfaceTint: string
  colorScale: number
  tintShadowFloor: number
  swirliness: number
  craterCount: number
  craterScale: number
  craterStrength: number
  craterSharpness: number
  craterColorStrength: number
  volcanoCount: number
  volcanoScale: number
  volcanoStrength: number
  volcanoColorStrength: number
  ridgeColorWeight: number
  riftColorWeight: number
  ridgeStrength: number
  ridgeFrequency: number
  ridgeSharpness: number
  riftStrength: number
  riftFrequency: number
  riftWidth: number
  riftSharpness: number
  ridgesRiftsBlend: number
  normalTextureSize: number
  colorTextureSize: number
  normalStrength: number
  roughness: number
  metalness: number
  largeScale: number
  mediumScale: number
  smallScale: number
  mediumFrequency: number
  smallFrequency: number
  triangleDetail: number
}

export type PlanetoidPresetSettings = Omit<PlanetoidSettings, PlanetoidPresetExcludedKey>

export type PlanetoidViewSettings = Pick<
  PlanetoidSettings,
  'autoRotate' | 'showDebugMeshes' | 'normalTextureSize' | 'colorTextureSize'
> & {
  viewMode: PlanetoidViewMode
}

export type PlanetoidRangeValues = Pick<
  PlanetoidSettings,
  | 'seed'
  | 'colorScale'
  | 'tintShadowFloor'
  | 'swirliness'
  | 'craterCount'
  | 'craterScale'
  | 'craterStrength'
  | 'craterSharpness'
  | 'craterColorStrength'
  | 'volcanoCount'
  | 'volcanoScale'
  | 'volcanoStrength'
  | 'volcanoColorStrength'
  | 'ridgeColorWeight'
  | 'riftColorWeight'
  | 'ridgeStrength'
  | 'ridgeFrequency'
  | 'ridgeSharpness'
  | 'riftStrength'
  | 'riftFrequency'
  | 'riftWidth'
  | 'riftSharpness'
  | 'ridgesRiftsBlend'
  | 'normalTextureSize'
  | 'colorTextureSize'
  | 'normalStrength'
  | 'roughness'
  | 'metalness'
  | 'largeScale'
  | 'mediumScale'
  | 'smallScale'
  | 'mediumFrequency'
  | 'smallFrequency'
  | 'triangleDetail'
>

export type PlanetoidRangeKey = keyof PlanetoidRangeValues

export const DefaultValues: PlanetoidSettings = {
  autoRotate: false,
  showDebugMeshes: false,
  enableCraters: true,
  enableRidges: false,
  enableRifts: false,
  enableVolcanoes: false,
  seed: 1,
  palette: 'rocky',
  surfaceTint: '#fff',
  colorScale: 1,
  tintShadowFloor: 0.18,
  swirliness: 1,
  craterCount: 20,
  craterScale: 1,
  craterStrength: 5,
  craterSharpness: 3.5,
  craterColorStrength: 0.95,
  volcanoCount: 12,
  volcanoScale: 2,
  volcanoStrength: 2,
  volcanoColorStrength: 1.2,
  ridgeStrength: 2,
  ridgeFrequency: 2.5,
  ridgeSharpness: 2.5,
  ridgeColorWeight: 0.1,
  ridgesRiftsBlend: 0.5,
  riftStrength: 0.75,
  riftFrequency: 1.5,
  riftWidth: 0.05,
  riftSharpness: 2,
  riftColorWeight: 0.25,
  normalTextureSize: 1024,
  colorTextureSize: 1024,
  normalStrength: 1,
  roughness: 0.75,
  metalness: 0.4,
  largeScale: 0.4,
  mediumScale: 0.2,
  smallScale: 0.1,
  mediumFrequency: 1,
  smallFrequency: 4,
  triangleDetail: 15,
}

export const MinValues: PlanetoidRangeValues = {
  seed: 0,
  colorScale: 0.0,
  tintShadowFloor: 0,
  swirliness: 0,
  craterCount: 0,
  craterScale: 0.25,
  craterStrength: 0,
  craterSharpness: 0.5,
  craterColorStrength: 0,
  volcanoCount: 0,
  volcanoScale: 0.35,
  volcanoStrength: 0,
  volcanoColorStrength: 0,
  ridgeColorWeight: 0,
  riftColorWeight: 0,
  ridgeStrength: 0,
  ridgeFrequency: 0.5,
  ridgeSharpness: 0.5,
  riftStrength: 0,
  riftFrequency: 0.5,
  riftWidth: 0.01,
  riftSharpness: 0.5,
  ridgesRiftsBlend: 0,
  normalTextureSize: 128,
  colorTextureSize: 64,
  normalStrength: 0,
  roughness: 0,
  metalness: 0,
  largeScale: 0,
  mediumScale: 0,
  smallScale: 0,
  mediumFrequency: 0.5,
  smallFrequency: 1,
  triangleDetail: 1,
}

export const MaxValues: PlanetoidRangeValues = {
  seed: 1000000000,
  colorScale: 2,
  tintShadowFloor: 0.8,
  swirliness: 2,
  craterCount: 120,
  craterScale: 3,
  craterStrength: 10,
  craterSharpness: 8,
  craterColorStrength: 3,
  volcanoCount: 96,
  volcanoScale: 2.5,
  volcanoStrength: 3,
  volcanoColorStrength: 2.5,
  ridgeColorWeight: 4,
  riftColorWeight: 4,
  ridgeStrength: 2,
  ridgeFrequency: 8,
  ridgeSharpness: 4,
  riftStrength: 2,
  riftFrequency: 12,
  riftWidth: 0.25,
  riftSharpness: 6,
  ridgesRiftsBlend: 1,
  normalTextureSize: 4096,
  colorTextureSize: 4096,
  normalStrength: 10,
  roughness: 1,
  metalness: 1,
  largeScale: 2,
  mediumScale: 2,
  smallScale: 2,
  mediumFrequency: 5,
  smallFrequency: 20,
  triangleDetail: 40,
}

export const StepValues: PlanetoidRangeValues = {
  seed: 1,
  colorScale: 0.1,
  tintShadowFloor: 0.01,
  swirliness: 0.05,
  craterCount: 1,
  craterScale: 0.05,
  craterStrength: 0.1,
  craterSharpness: 0.1,
  craterColorStrength: 0.05,
  volcanoCount: 1,
  volcanoScale: 0.05,
  volcanoStrength: 0.05,
  volcanoColorStrength: 0.05,
  ridgeColorWeight: 0.05,
  riftColorWeight: 0.05,
  ridgeStrength: 0.05,
  ridgeFrequency: 0.1,
  ridgeSharpness: 0.05,
  riftStrength: 0.05,
  riftFrequency: 0.1,
  riftWidth: 0.01,
  riftSharpness: 0.05,
  ridgesRiftsBlend: 0.05,
  normalTextureSize: 1,
  colorTextureSize: 1,
  normalStrength: 0.1,
  roughness: 0.1,
  metalness: 0.1,
  largeScale: 0.1,
  mediumScale: 0.1,
  smallScale: 0.1,
  mediumFrequency: 0.1,
  smallFrequency: 0.1,
  triangleDetail: 1,
}

const NUMERIC_SANITIZE_SPECS: Record<PlanetoidRangeKey, NumericSanitizeSpec> = {
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
  swirliness: {
    defaultValue: DefaultValues.swirliness,
    min: MinValues.swirliness,
    max: MaxValues.swirliness,
  },
  craterCount: {
    defaultValue: DefaultValues.craterCount,
    min: MinValues.craterCount,
    max: MaxValues.craterCount,
    round: true,
  },
  craterScale: {
    defaultValue: DefaultValues.craterScale,
    min: MinValues.craterScale,
    max: MaxValues.craterScale,
  },
  craterStrength: {
    defaultValue: DefaultValues.craterStrength,
    min: MinValues.craterStrength,
    max: MaxValues.craterStrength,
  },
  craterSharpness: {
    defaultValue: DefaultValues.craterSharpness,
    min: MinValues.craterSharpness,
    max: MaxValues.craterSharpness,
  },
  craterColorStrength: {
    defaultValue: DefaultValues.craterColorStrength,
    min: MinValues.craterColorStrength,
    max: MaxValues.craterColorStrength,
  },
  volcanoCount: {
    defaultValue: DefaultValues.volcanoCount,
    min: MinValues.volcanoCount,
    max: MaxValues.volcanoCount,
    round: true,
  },
  volcanoScale: {
    defaultValue: DefaultValues.volcanoScale,
    min: MinValues.volcanoScale,
    max: MaxValues.volcanoScale,
  },
  volcanoStrength: {
    defaultValue: DefaultValues.volcanoStrength,
    min: MinValues.volcanoStrength,
    max: MaxValues.volcanoStrength,
  },
  volcanoColorStrength: {
    defaultValue: DefaultValues.volcanoColorStrength,
    min: MinValues.volcanoColorStrength,
    max: MaxValues.volcanoColorStrength,
  },
  ridgeColorWeight: {
    defaultValue: DefaultValues.ridgeColorWeight,
    min: MinValues.ridgeColorWeight,
    max: MaxValues.ridgeColorWeight,
  },
  riftColorWeight: {
    defaultValue: DefaultValues.riftColorWeight,
    min: MinValues.riftColorWeight,
    max: MaxValues.riftColorWeight,
  },
  ridgeStrength: {
    defaultValue: DefaultValues.ridgeStrength,
    min: MinValues.ridgeStrength,
    max: MaxValues.ridgeStrength,
  },
  ridgeFrequency: {
    defaultValue: DefaultValues.ridgeFrequency,
    min: MinValues.ridgeFrequency,
    max: MaxValues.ridgeFrequency,
  },
  ridgeSharpness: {
    defaultValue: DefaultValues.ridgeSharpness,
    min: MinValues.ridgeSharpness,
    max: MaxValues.ridgeSharpness,
  },
  riftStrength: {
    defaultValue: DefaultValues.riftStrength,
    min: MinValues.riftStrength,
    max: MaxValues.riftStrength,
  },
  riftFrequency: {
    defaultValue: DefaultValues.riftFrequency,
    min: MinValues.riftFrequency,
    max: MaxValues.riftFrequency,
  },
  riftWidth: {
    defaultValue: DefaultValues.riftWidth,
    min: MinValues.riftWidth,
    max: MaxValues.riftWidth,
  },
  riftSharpness: {
    defaultValue: DefaultValues.riftSharpness,
    min: MinValues.riftSharpness,
    max: MaxValues.riftSharpness,
  },
  ridgesRiftsBlend: {
    defaultValue: DefaultValues.ridgesRiftsBlend,
    min: MinValues.ridgesRiftsBlend,
    max: MaxValues.ridgesRiftsBlend,
  },
  normalTextureSize: {
    defaultValue: DefaultValues.normalTextureSize,
    min: MinValues.normalTextureSize,
    max: MaxValues.normalTextureSize,
    round: true,
  },
  colorTextureSize: {
    defaultValue: DefaultValues.colorTextureSize,
    min: MinValues.colorTextureSize,
    max: MaxValues.colorTextureSize,
    round: true,
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
  largeScale: {
    defaultValue: DefaultValues.largeScale,
    min: MinValues.largeScale,
    max: MaxValues.largeScale,
  },
  mediumScale: {
    defaultValue: DefaultValues.mediumScale,
    min: MinValues.mediumScale,
    max: MaxValues.mediumScale,
  },
  smallScale: {
    defaultValue: DefaultValues.smallScale,
    min: MinValues.smallScale,
    max: MaxValues.smallScale,
  },
  mediumFrequency: {
    defaultValue: DefaultValues.mediumFrequency,
    min: MinValues.mediumFrequency,
    max: MaxValues.mediumFrequency,
  },
  smallFrequency: {
    defaultValue: DefaultValues.smallFrequency,
    min: MinValues.smallFrequency,
    max: MaxValues.smallFrequency,
  },
  triangleDetail: {
    defaultValue: DefaultValues.triangleDetail,
    min: MinValues.triangleDetail,
    max: MaxValues.triangleDetail,
    round: true,
  },
}

export function sanitizePlanetoidSettings(input: unknown): PlanetoidSettings {
  const raw = toRecord(input)
  const numeric = sanitizeNumericMap(raw, NUMERIC_SANITIZE_SPECS)

  const autoRotate = sanitizeBoolean(raw, 'autoRotate', DefaultValues.autoRotate)
  const showDebugMeshes = sanitizeBoolean(raw, 'showDebugMeshes', DefaultValues.showDebugMeshes)
  const enableCraters = sanitizeBoolean(raw, 'enableCraters', DefaultValues.enableCraters)
  const enableVolcanoes = sanitizeBoolean(raw, 'enableVolcanoes', DefaultValues.enableVolcanoes)
  const enableRidges = sanitizeBoolean(raw, 'enableRidges', DefaultValues.enableRidges)
  const enableRifts = sanitizeBoolean(raw, 'enableRifts', DefaultValues.enableRifts)

  const palette = sanitizeEnum(raw, 'palette', PlanetoidPaletteNames, DefaultValues.palette)
  const surfaceTint = sanitizeHexColor(raw, 'surfaceTint', DefaultValues.surfaceTint)
  return {
    palette,
    surfaceTint,
    colorScale: numeric.colorScale,
    tintShadowFloor: numeric.tintShadowFloor,
    swirliness: numeric.swirliness,
    craterCount: numeric.craterCount,
    craterScale: numeric.craterScale,
    craterStrength: numeric.craterStrength,
    craterSharpness: numeric.craterSharpness,
    craterColorStrength: numeric.craterColorStrength,
    volcanoCount: numeric.volcanoCount,
    volcanoScale: numeric.volcanoScale,
    volcanoStrength: numeric.volcanoStrength,
    volcanoColorStrength: numeric.volcanoColorStrength,
    ridgeColorWeight: numeric.ridgeColorWeight,
    riftColorWeight: numeric.riftColorWeight,
    enableCraters,
    enableVolcanoes,
    enableRidges,
    enableRifts,
    ridgeStrength: numeric.ridgeStrength,
    ridgeFrequency: numeric.ridgeFrequency,
    ridgeSharpness: numeric.ridgeSharpness,
    riftStrength: numeric.riftStrength,
    riftFrequency: numeric.riftFrequency,
    riftWidth: numeric.riftWidth,
    riftSharpness: numeric.riftSharpness,
    ridgesRiftsBlend: numeric.ridgesRiftsBlend,
    normalTextureSize: numeric.normalTextureSize,
    colorTextureSize: numeric.colorTextureSize,
    seed: numeric.seed,
    largeScale: numeric.largeScale,
    mediumScale: numeric.mediumScale,
    smallScale: numeric.smallScale,
    mediumFrequency: numeric.mediumFrequency,
    smallFrequency: numeric.smallFrequency,
    triangleDetail: numeric.triangleDetail,
    normalStrength: numeric.normalStrength,
    roughness: numeric.roughness,
    metalness: numeric.metalness,
    autoRotate,
    showDebugMeshes,
  }
}

export function toPlanetoidPresetSettings(settings: PlanetoidSettings): PlanetoidPresetSettings {
  const {
    seed: _seed,
    autoRotate: _autoRotate,
    showDebugMeshes: _showDebugMeshes,
    normalTextureSize: _normalTextureSize,
    colorTextureSize: _colorTextureSize,
    ...presetSettings
  } = settings

  return presetSettings
}

export function sanitizePlanetoidPresetSettings(input: unknown): PlanetoidPresetSettings {
  const settings = sanitizePlanetoidSettings(input)
  return toPlanetoidPresetSettings(settings)
}

export function mergePlanetoidPresetSettings(
  currentSettings: PlanetoidSettings,
  presetSettings: PlanetoidPresetSettings
): PlanetoidSettings {
  return sanitizePlanetoidSettings({
    ...currentSettings,
    ...presetSettings,
  })
}

export const PlanetoidRangeLabels: Record<PlanetoidRangeKey, string> = {
  seed: 'Seed',
  colorScale: 'Color scale',
  tintShadowFloor: 'Tint shadow floor',
  swirliness: 'Swirliness',
  craterCount: 'Crater count',
  craterScale: 'Crater scale',
  craterStrength: 'Crater strength',
  craterSharpness: 'Crater sharpness',
  craterColorStrength: 'Crater color',
  volcanoCount: 'Volcano count',
  volcanoScale: 'Volcano scale',
  volcanoStrength: 'Volcano strength',
  volcanoColorStrength: 'Volcano color',
  ridgeColorWeight: 'Ridge color weight',
  riftColorWeight: 'Rift color weight',
  ridgeStrength: 'Ridge strength',
  ridgeFrequency: 'Ridge frequency',
  ridgeSharpness: 'Ridge sharpness',
  riftStrength: 'Rift strength',
  riftFrequency: 'Rift frequency',
  riftWidth: 'Rift width',
  riftSharpness: 'Rift sharpness',
  ridgesRiftsBlend: 'Ridges/rifts blend',
  normalTextureSize: 'Normal texture size',
  colorTextureSize: 'Color texture size',
  normalStrength: 'Normal strength',
  roughness: 'Roughness',
  metalness: 'Metalness',
  largeScale: 'Large-scale',
  mediumScale: 'Medium-scale',
  smallScale: 'Small-scale',
  mediumFrequency: 'Medium frequency',
  smallFrequency: 'Small frequency',
  triangleDetail: 'Triangle detail',
}

export const PlanetoidUiLabels = {
  scene: 'Scene',
  viewMode: 'View mode',
  autoRotate: 'Auto-rotate',
  showDebugMeshes: 'Show debug meshes',
  seed: 'Seed',
  texture: 'Texture',
  colorSettings: 'Color settings',
  palette: 'Palette',
  surfaceTint: 'Surface tint',
  textureResolution: 'Texture resolution',
  material: 'Material',
  properties: 'Properties',
  features: 'Features',
  craters: 'Craters',
  volcanoes: 'Volcanoes',
  ridges: 'Ridges',
  rifts: 'Rifts',
  geometry: 'Geometry',
  deformation: 'Deformation',
} as const

export const PlanetoidCliFlagByRangeKey: Record<PlanetoidRangeKey, string> = {
  seed: '--seed',
  colorScale: '--color-scale',
  tintShadowFloor: '--tint-shadow-floor',
  swirliness: '--swirliness',
  craterCount: '--crater-count',
  craterScale: '--crater-scale',
  craterStrength: '--crater-strength',
  craterSharpness: '--crater-sharpness',
  craterColorStrength: '--crater-color',
  volcanoCount: '--volcano-count',
  volcanoScale: '--volcano-scale',
  volcanoStrength: '--volcano-strength',
  volcanoColorStrength: '--volcano-color',
  ridgeColorWeight: '--ridge-color-weight',
  riftColorWeight: '--rift-color-weight',
  ridgeStrength: '--ridge-strength',
  ridgeFrequency: '--ridge-frequency',
  ridgeSharpness: '--ridge-sharpness',
  riftStrength: '--rift-strength',
  riftFrequency: '--rift-frequency',
  riftWidth: '--rift-width',
  riftSharpness: '--rift-sharpness',
  ridgesRiftsBlend: '--ridges-rifts-blend',
  normalTextureSize: '--normal-tex-height',
  colorTextureSize: '--color-tex-height',
  normalStrength: '--normal-strength',
  roughness: '--roughness',
  metalness: '--metalness',
  largeScale: '--large-scale',
  mediumScale: '--medium-scale',
  smallScale: '--small-scale',
  mediumFrequency: '--medium-frequency',
  smallFrequency: '--small-frequency',
  triangleDetail: '--triangle-detail',
}

export const PlanetoidCliToggleFlags = {
  autoRotate: '--auto-rotate',
  showDebugMeshes: '--show-debug-meshes',
  cratersEnabled: '--craters-enabled',
  ridgesEnabled: '--ridges-enabled',
  riftsEnabled: '--rifts-enabled',
  volcanoesEnabled: '--volcanoes-enabled',
} as const
