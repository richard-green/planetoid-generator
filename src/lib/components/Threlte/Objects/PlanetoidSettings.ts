import { PlanetoidPaletteNames, type PlanetoidPaletteName } from './PlanetoidPalettes'
import {
  sanitizeBoolean,
  sanitizeEnum,
  sanitizeHexColor,
  sanitizeNumericMap,
  toRecord,
  type NumericSanitizeSpec,
} from '../../../utils/sanitize'

export type PlanetoidViewMode = 'mesh' | 'bump' | 'texture' | 'ray'

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
  craterStrength: number
  craterColorStrength: number
  volcanoCount: number
  volcanoScale: number
  volcanoStrength: number
  volcanoColorStrength: number
  ridgeColorWeight: number
  riftColorWeight: number
  craterRayStrength: number
  craterRayVisibility: number
  craterRayDensity: number
  craterRaySharpness: number
  craterRayLengthPower: number
  ridgeStrength: number
  ridgeScale: number
  ridgeSharpness: number
  riftStrength: number
  riftScale: number
  riftWidth: number
  riftSharpness: number
  ridgesRiftsBlend: number
  bumpTextureSize: number
  colorTextureSize: number
  bumpScale: number
  roughness: number
  metalness: number
  largeScale: number
  mediumScale: number
  smallScale: number
  triangleDetail: number
}

export type PlanetoidRangeValues = Pick<
  PlanetoidSettings,
  | 'seed'
  | 'colorScale'
  | 'tintShadowFloor'
  | 'swirliness'
  | 'craterCount'
  | 'craterStrength'
  | 'craterColorStrength'
  | 'volcanoCount'
  | 'volcanoScale'
  | 'volcanoStrength'
  | 'volcanoColorStrength'
  | 'ridgeColorWeight'
  | 'riftColorWeight'
  | 'craterRayStrength'
  | 'craterRayVisibility'
  | 'craterRayDensity'
  | 'craterRaySharpness'
  | 'craterRayLengthPower'
  | 'ridgeStrength'
  | 'ridgeScale'
  | 'ridgeSharpness'
  | 'riftStrength'
  | 'riftScale'
  | 'riftWidth'
  | 'riftSharpness'
  | 'ridgesRiftsBlend'
  | 'bumpTextureSize'
  | 'colorTextureSize'
  | 'bumpScale'
  | 'roughness'
  | 'metalness'
  | 'largeScale'
  | 'mediumScale'
  | 'smallScale'
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
  craterStrength: 5,
  craterColorStrength: 0.95,
  volcanoCount: 12,
  volcanoScale: 2,
  volcanoStrength: 2,
  volcanoColorStrength: 1.2,
  craterRayStrength: 2,
  craterRayVisibility: 1,
  craterRayDensity: 1,
  craterRaySharpness: 1,
  craterRayLengthPower: 2.8,
  ridgeStrength: 2,
  ridgeScale: 2.5,
  ridgeSharpness: 2.5,
  ridgeColorWeight: 0.1,
  ridgesRiftsBlend: 0.5,
  riftStrength: 0.75,
  riftScale: 1.5,
  riftWidth: 0.05,
  riftSharpness: 2,
  riftColorWeight: 0.25,
  bumpTextureSize: 1024,
  colorTextureSize: 1024,
  bumpScale: 1,
  roughness: 0.75,
  metalness: 0.4,
  largeScale: 0.4,
  mediumScale: 0.2,
  smallScale: 0.1,
  triangleDetail: 15,
}

export const MinValues: PlanetoidRangeValues = {
  seed: 0,
  colorScale: 0.0,
  tintShadowFloor: 0,
  swirliness: 0,
  craterCount: 0,
  craterStrength: 0,
  craterColorStrength: 0,
  volcanoCount: 0,
  volcanoScale: 0.35,
  volcanoStrength: 0,
  volcanoColorStrength: 0,
  ridgeColorWeight: 0,
  riftColorWeight: 0,
  craterRayStrength: 0,
  craterRayVisibility: 0,
  craterRayDensity: 0.3,
  craterRaySharpness: 0.5,
  craterRayLengthPower: 1,
  ridgeStrength: 0,
  ridgeScale: 0.5,
  ridgeSharpness: 0.5,
  riftStrength: 0,
  riftScale: 0.5,
  riftWidth: 0.01,
  riftSharpness: 0.5,
  ridgesRiftsBlend: 0,
  bumpTextureSize: 128,
  colorTextureSize: 64,
  bumpScale: 0,
  roughness: 0,
  metalness: 0,
  largeScale: 0,
  mediumScale: 0,
  smallScale: 0,
  triangleDetail: 1,
}

export const MaxValues: PlanetoidRangeValues = {
  seed: 1000000000,
  colorScale: 1,
  tintShadowFloor: 0.8,
  swirliness: 2,
  craterCount: 120,
  craterStrength: 10,
  craterColorStrength: 3,
  volcanoCount: 96,
  volcanoScale: 2.5,
  volcanoStrength: 3,
  volcanoColorStrength: 2.5,
  ridgeColorWeight: 4,
  riftColorWeight: 4,
  craterRayStrength: 6,
  craterRayVisibility: 4,
  craterRayDensity: 3,
  craterRaySharpness: 4,
  craterRayLengthPower: 5,
  ridgeStrength: 2,
  ridgeScale: 8,
  ridgeSharpness: 4,
  riftStrength: 2,
  riftScale: 12,
  riftWidth: 0.25,
  riftSharpness: 6,
  ridgesRiftsBlend: 1,
  bumpTextureSize: 4096,
  colorTextureSize: 4096,
  bumpScale: 10,
  roughness: 1,
  metalness: 1,
  largeScale: 2,
  mediumScale: 2,
  smallScale: 2,
  triangleDetail: 40,
}

export const StepValues: PlanetoidRangeValues = {
  seed: 1,
  colorScale: 0.1,
  tintShadowFloor: 0.01,
  swirliness: 0.05,
  craterCount: 1,
  craterStrength: 0.1,
  craterColorStrength: 0.05,
  volcanoCount: 1,
  volcanoScale: 0.05,
  volcanoStrength: 0.05,
  volcanoColorStrength: 0.05,
  ridgeColorWeight: 0.05,
  riftColorWeight: 0.05,
  craterRayStrength: 0.05,
  craterRayVisibility: 0.05,
  craterRayDensity: 0.05,
  craterRaySharpness: 0.05,
  craterRayLengthPower: 0.1,
  ridgeStrength: 0.05,
  ridgeScale: 0.1,
  ridgeSharpness: 0.05,
  riftStrength: 0.05,
  riftScale: 0.1,
  riftWidth: 0.01,
  riftSharpness: 0.05,
  ridgesRiftsBlend: 0.05,
  bumpTextureSize: 1,
  colorTextureSize: 1,
  bumpScale: 0.1,
  roughness: 0.1,
  metalness: 0.1,
  largeScale: 0.1,
  mediumScale: 0.1,
  smallScale: 0.1,
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
  craterStrength: {
    defaultValue: DefaultValues.craterStrength,
    min: MinValues.craterStrength,
    max: MaxValues.craterStrength,
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
  craterRayStrength: {
    defaultValue: DefaultValues.craterRayStrength,
    min: MinValues.craterRayStrength,
    max: MaxValues.craterRayStrength,
  },
  craterRayVisibility: {
    defaultValue: DefaultValues.craterRayVisibility,
    min: MinValues.craterRayVisibility,
    max: MaxValues.craterRayVisibility,
  },
  craterRayDensity: {
    defaultValue: DefaultValues.craterRayDensity,
    min: MinValues.craterRayDensity,
    max: MaxValues.craterRayDensity,
  },
  craterRaySharpness: {
    defaultValue: DefaultValues.craterRaySharpness,
    min: MinValues.craterRaySharpness,
    max: MaxValues.craterRaySharpness,
  },
  craterRayLengthPower: {
    defaultValue: DefaultValues.craterRayLengthPower,
    min: MinValues.craterRayLengthPower,
    max: MaxValues.craterRayLengthPower,
  },
  ridgeStrength: {
    defaultValue: DefaultValues.ridgeStrength,
    min: MinValues.ridgeStrength,
    max: MaxValues.ridgeStrength,
  },
  ridgeScale: {
    defaultValue: DefaultValues.ridgeScale,
    min: MinValues.ridgeScale,
    max: MaxValues.ridgeScale,
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
  riftScale: {
    defaultValue: DefaultValues.riftScale,
    min: MinValues.riftScale,
    max: MaxValues.riftScale,
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
    craterStrength: numeric.craterStrength,
    craterColorStrength: numeric.craterColorStrength,
    volcanoCount: numeric.volcanoCount,
    volcanoScale: numeric.volcanoScale,
    volcanoStrength: numeric.volcanoStrength,
    volcanoColorStrength: numeric.volcanoColorStrength,
    ridgeColorWeight: numeric.ridgeColorWeight,
    riftColorWeight: numeric.riftColorWeight,
    craterRayStrength: numeric.craterRayStrength,
    craterRayVisibility: numeric.craterRayVisibility,
    craterRayDensity: numeric.craterRayDensity,
    craterRaySharpness: numeric.craterRaySharpness,
    craterRayLengthPower: numeric.craterRayLengthPower,
    enableCraters,
    enableVolcanoes,
    enableRidges,
    enableRifts,
    ridgeStrength: numeric.ridgeStrength,
    ridgeScale: numeric.ridgeScale,
    ridgeSharpness: numeric.ridgeSharpness,
    riftStrength: numeric.riftStrength,
    riftScale: numeric.riftScale,
    riftWidth: numeric.riftWidth,
    riftSharpness: numeric.riftSharpness,
    ridgesRiftsBlend: numeric.ridgesRiftsBlend,
    bumpTextureSize: numeric.bumpTextureSize,
    colorTextureSize: numeric.colorTextureSize,
    seed: numeric.seed,
    largeScale: numeric.largeScale,
    mediumScale: numeric.mediumScale,
    smallScale: numeric.smallScale,
    triangleDetail: numeric.triangleDetail,
    bumpScale: numeric.bumpScale,
    roughness: numeric.roughness,
    metalness: numeric.metalness,
    autoRotate,
    showDebugMeshes,
  }
}

export const PlanetoidRangeLabels: Record<PlanetoidRangeKey, string> = {
  seed: 'Seed',
  colorScale: 'Color scale',
  tintShadowFloor: 'Tint shadow floor',
  swirliness: 'Swirliness',
  craterCount: 'Crater count',
  craterStrength: 'Crater strength',
  craterColorStrength: 'Crater color',
  volcanoCount: 'Volcano count',
  volcanoScale: 'Volcano scale',
  volcanoStrength: 'Volcano strength',
  volcanoColorStrength: 'Volcano color',
  ridgeColorWeight: 'Ridge color weight',
  riftColorWeight: 'Rift color weight',
  craterRayStrength: 'Crater rays',
  craterRayVisibility: 'Ray visibility',
  craterRayDensity: 'Ray density',
  craterRaySharpness: 'Ray sharpness',
  craterRayLengthPower: 'Ray length power',
  ridgeStrength: 'Ridge strength',
  ridgeScale: 'Ridge scale',
  ridgeSharpness: 'Ridge sharpness',
  riftStrength: 'Rift strength',
  riftScale: 'Rift scale',
  riftWidth: 'Rift width',
  riftSharpness: 'Rift sharpness',
  ridgesRiftsBlend: 'Ridges/rifts blend',
  bumpTextureSize: 'Bump texture size',
  colorTextureSize: 'Color texture size',
  bumpScale: 'Bump scale',
  roughness: 'Roughness',
  metalness: 'Metalness',
  largeScale: 'Large-scale',
  mediumScale: 'Medium-scale',
  smallScale: 'Small-scale',
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
  craterStrength: '--crater-strength',
  craterColorStrength: '--crater-color',
  volcanoCount: '--volcano-count',
  volcanoScale: '--volcano-scale',
  volcanoStrength: '--volcano-strength',
  volcanoColorStrength: '--volcano-color',
  ridgeColorWeight: '--ridge-color-weight',
  riftColorWeight: '--rift-color-weight',
  craterRayStrength: '--crater-rays',
  craterRayVisibility: '--ray-visibility',
  craterRayDensity: '--ray-density',
  craterRaySharpness: '--ray-sharpness',
  craterRayLengthPower: '--ray-length-power',
  ridgeStrength: '--ridge-strength',
  ridgeScale: '--ridge-scale',
  ridgeSharpness: '--ridge-sharpness',
  riftStrength: '--rift-strength',
  riftScale: '--rift-scale',
  riftWidth: '--rift-width',
  riftSharpness: '--rift-sharpness',
  ridgesRiftsBlend: '--ridges-rifts-blend',
  bumpTextureSize: '--bump-tex-height',
  colorTextureSize: '--color-tex-height',
  bumpScale: '--bump-scale',
  roughness: '--roughness',
  metalness: '--metalness',
  largeScale: '--large-scale',
  mediumScale: '--medium-scale',
  smallScale: '--small-scale',
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
