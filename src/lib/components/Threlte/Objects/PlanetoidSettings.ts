import { PlanetoidPaletteNames, type PlanetoidPaletteName } from './PlanetoidPalettes'
import {
  sanitizeBoolean,
  sanitizeEnum,
  sanitizeHexColor,
  sanitizeNumericMap,
  toRecord,
  type NumericSanitizeSpec,
} from '../../../utils/sanitize'

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

export const DefaultPlanetoidSettings: PlanetoidSettings = {
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

const NUMERIC_SANITIZE_SPECS: Record<PlanetoidRangeKey, NumericSanitizeSpec> = {
  seed: {
    defaultValue: DefaultPlanetoidSettings.seed,
    min: MinValues.seed,
    max: MaxValues.seed,
    round: true,
  },
  colorScale: {
    defaultValue: DefaultPlanetoidSettings.colorScale,
    min: MinValues.colorScale,
    max: MaxValues.colorScale,
  },
  tintShadowFloor: {
    defaultValue: DefaultPlanetoidSettings.tintShadowFloor,
    min: MinValues.tintShadowFloor,
    max: MaxValues.tintShadowFloor,
  },
  swirliness: {
    defaultValue: DefaultPlanetoidSettings.swirliness,
    min: MinValues.swirliness,
    max: MaxValues.swirliness,
  },
  craterCount: {
    defaultValue: DefaultPlanetoidSettings.craterCount,
    min: MinValues.craterCount,
    max: MaxValues.craterCount,
    round: true,
  },
  craterStrength: {
    defaultValue: DefaultPlanetoidSettings.craterStrength,
    min: MinValues.craterStrength,
    max: MaxValues.craterStrength,
  },
  craterColorStrength: {
    defaultValue: DefaultPlanetoidSettings.craterColorStrength,
    min: MinValues.craterColorStrength,
    max: MaxValues.craterColorStrength,
  },
  volcanoCount: {
    defaultValue: DefaultPlanetoidSettings.volcanoCount,
    min: MinValues.volcanoCount,
    max: MaxValues.volcanoCount,
    round: true,
  },
  volcanoScale: {
    defaultValue: DefaultPlanetoidSettings.volcanoScale,
    min: MinValues.volcanoScale,
    max: MaxValues.volcanoScale,
  },
  volcanoStrength: {
    defaultValue: DefaultPlanetoidSettings.volcanoStrength,
    min: MinValues.volcanoStrength,
    max: MaxValues.volcanoStrength,
  },
  volcanoColorStrength: {
    defaultValue: DefaultPlanetoidSettings.volcanoColorStrength,
    min: MinValues.volcanoColorStrength,
    max: MaxValues.volcanoColorStrength,
  },
  ridgeColorWeight: {
    defaultValue: DefaultPlanetoidSettings.ridgeColorWeight,
    min: MinValues.ridgeColorWeight,
    max: MaxValues.ridgeColorWeight,
  },
  riftColorWeight: {
    defaultValue: DefaultPlanetoidSettings.riftColorWeight,
    min: MinValues.riftColorWeight,
    max: MaxValues.riftColorWeight,
  },
  craterRayStrength: {
    defaultValue: DefaultPlanetoidSettings.craterRayStrength,
    min: MinValues.craterRayStrength,
    max: MaxValues.craterRayStrength,
  },
  craterRayVisibility: {
    defaultValue: DefaultPlanetoidSettings.craterRayVisibility,
    min: MinValues.craterRayVisibility,
    max: MaxValues.craterRayVisibility,
  },
  craterRayDensity: {
    defaultValue: DefaultPlanetoidSettings.craterRayDensity,
    min: MinValues.craterRayDensity,
    max: MaxValues.craterRayDensity,
  },
  craterRaySharpness: {
    defaultValue: DefaultPlanetoidSettings.craterRaySharpness,
    min: MinValues.craterRaySharpness,
    max: MaxValues.craterRaySharpness,
  },
  craterRayLengthPower: {
    defaultValue: DefaultPlanetoidSettings.craterRayLengthPower,
    min: MinValues.craterRayLengthPower,
    max: MaxValues.craterRayLengthPower,
  },
  ridgeStrength: {
    defaultValue: DefaultPlanetoidSettings.ridgeStrength,
    min: MinValues.ridgeStrength,
    max: MaxValues.ridgeStrength,
  },
  ridgeScale: {
    defaultValue: DefaultPlanetoidSettings.ridgeScale,
    min: MinValues.ridgeScale,
    max: MaxValues.ridgeScale,
  },
  ridgeSharpness: {
    defaultValue: DefaultPlanetoidSettings.ridgeSharpness,
    min: MinValues.ridgeSharpness,
    max: MaxValues.ridgeSharpness,
  },
  riftStrength: {
    defaultValue: DefaultPlanetoidSettings.riftStrength,
    min: MinValues.riftStrength,
    max: MaxValues.riftStrength,
  },
  riftScale: {
    defaultValue: DefaultPlanetoidSettings.riftScale,
    min: MinValues.riftScale,
    max: MaxValues.riftScale,
  },
  riftWidth: {
    defaultValue: DefaultPlanetoidSettings.riftWidth,
    min: MinValues.riftWidth,
    max: MaxValues.riftWidth,
  },
  riftSharpness: {
    defaultValue: DefaultPlanetoidSettings.riftSharpness,
    min: MinValues.riftSharpness,
    max: MaxValues.riftSharpness,
  },
  ridgesRiftsBlend: {
    defaultValue: DefaultPlanetoidSettings.ridgesRiftsBlend,
    min: MinValues.ridgesRiftsBlend,
    max: MaxValues.ridgesRiftsBlend,
  },
  bumpTextureSize: {
    defaultValue: DefaultPlanetoidSettings.bumpTextureSize,
    min: MinValues.bumpTextureSize,
    max: MaxValues.bumpTextureSize,
    round: true,
  },
  colorTextureSize: {
    defaultValue: DefaultPlanetoidSettings.colorTextureSize,
    min: MinValues.colorTextureSize,
    max: MaxValues.colorTextureSize,
    round: true,
  },
  bumpScale: {
    defaultValue: DefaultPlanetoidSettings.bumpScale,
    min: MinValues.bumpScale,
    max: MaxValues.bumpScale,
  },
  roughness: {
    defaultValue: DefaultPlanetoidSettings.roughness,
    min: MinValues.roughness,
    max: MaxValues.roughness,
  },
  metalness: {
    defaultValue: DefaultPlanetoidSettings.metalness,
    min: MinValues.metalness,
    max: MaxValues.metalness,
  },
  largeScale: {
    defaultValue: DefaultPlanetoidSettings.largeScale,
    min: MinValues.largeScale,
    max: MaxValues.largeScale,
  },
  mediumScale: {
    defaultValue: DefaultPlanetoidSettings.mediumScale,
    min: MinValues.mediumScale,
    max: MaxValues.mediumScale,
  },
  smallScale: {
    defaultValue: DefaultPlanetoidSettings.smallScale,
    min: MinValues.smallScale,
    max: MaxValues.smallScale,
  },
  triangleDetail: {
    defaultValue: DefaultPlanetoidSettings.triangleDetail,
    min: MinValues.triangleDetail,
    max: MaxValues.triangleDetail,
    round: true,
  },
}

export function sanitizePlanetoidSettings(input: unknown): PlanetoidSettings {
  const raw = toRecord(input)

  const numeric = sanitizeNumericMap(raw, NUMERIC_SANITIZE_SPECS)

  const autoRotate = sanitizeBoolean(raw, 'autoRotate', DefaultPlanetoidSettings.autoRotate)
  const showDebugMeshes = sanitizeBoolean(
    raw,
    'showDebugMeshes',
    DefaultPlanetoidSettings.showDebugMeshes
  )
  const enableCraters = sanitizeBoolean(
    raw,
    'enableCraters',
    DefaultPlanetoidSettings.enableCraters
  )
  const enableVolcanoes = sanitizeBoolean(
    raw,
    'enableVolcanoes',
    DefaultPlanetoidSettings.enableVolcanoes
  )
  const enableRidges = sanitizeBoolean(raw, 'enableRidges', DefaultPlanetoidSettings.enableRidges)
  const enableRifts = sanitizeBoolean(raw, 'enableRifts', DefaultPlanetoidSettings.enableRifts)

  const palette = sanitizeEnum(
    raw,
    'palette',
    PlanetoidPaletteNames,
    DefaultPlanetoidSettings.palette
  )
  const surfaceTint = sanitizeHexColor(raw, 'surfaceTint', DefaultPlanetoidSettings.surfaceTint)

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

export const PlanetoidUiLabels = {
  seed: 'Seed',
  palette: 'Palette',
  surfaceTint: 'Surface tint',
  autoRotate: 'Auto-rotate',
  showDebugMeshes: 'Show debug meshes',
  sections: {
    craters: 'Craters',
    ridges: 'Ridges',
    rifts: 'Rifts',
    volcanoes: 'Volcanoes',
  },
} as const
