import { PlanetoidPaletteNames, type PlanetoidPaletteName } from './PlanetoidPalettes'
import { DustCloudPaletteNames, type DustCloudPaletteName } from './DustCloudPalettes'
import { AtmospherePaletteNames, type AtmospherePaletteName } from '../Atmosphere/AtmospherePalettes'
import { sanitizeTextureSize, type TextureSize } from '../../../types/textureSize'
import {
  sanitizeBoolean,
  sanitizeEnum,
  sanitizeHexColor,
  sanitizeNumericMap,
  toRecord,
  type NumericSanitizeSpec,
} from '../../../utils/sanitize'

export const PlanetoidViewModeNames = [
  'mesh',
  'normal',
  'texture',
  'cloudTexture',
  'cloudNormal',
] as const
export type PlanetoidViewMode = (typeof PlanetoidViewModeNames)[number]
export const PlanetoidViewModeLabels: Record<PlanetoidViewMode, string> = {
  mesh: '3D',
  normal: 'Normal map',
  texture: 'Texture map',
  cloudTexture: 'Cloud texture map',
  cloudNormal: 'Cloud normal map',
}

export const DustCloudStyleNames = ['wisps', 'ribs', 'curls', 'mixed', 'worley'] as const
export type DustCloudStyle = (typeof DustCloudStyleNames)[number]
export const DustCloudStyleLabels: Record<DustCloudStyle, string> = {
  wisps: 'Wisps',
  ribs: 'Ribs',
  curls: 'Curls',
  mixed: 'Mixed',
  worley: 'Worley cells',
}

export type PlanetoidPresetExcludedKey =
  'seed' | 'autoRotate' | 'showDebugMeshes' | 'normalTextureSize' | 'colorTextureSize'

export type PlanetoidSettings = {
  autoRotate: boolean
  showDebugMeshes: boolean
  enableCraters: boolean
  enableRidges: boolean
  enableRifts: boolean
  enableVolcanoes: boolean
  enableDustClouds: boolean
  enableAtmosphere: boolean
  seed: number
  palette: PlanetoidPaletteName
  surfaceTint: string
  colorScale: number
  tintShadowFloor: number
  swirliness: number
  dustCloudCoverage: number
  dustCloudStyle: DustCloudStyle
  dustCloudPalette: DustCloudPaletteName
  dustCloudOpacity: number
  dustCloudElevation: number
  dustCloudFrequency: number
  dustCloudSwirliness: number
  dustCloudCoriolis: number
  dustCloudNormalStrength: number
  atmospherePalette: AtmospherePaletteName
  atmosphereIntensity: number
  atmosphereThickness: number
  atmosphereDropoff: number
  atmosphereTerminatorWrap: number
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
  normalTextureSize: TextureSize
  colorTextureSize: TextureSize
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
  | 'dustCloudCoverage'
  | 'dustCloudOpacity'
  | 'dustCloudElevation'
  | 'dustCloudFrequency'
  | 'dustCloudSwirliness'
  | 'dustCloudCoriolis'
  | 'dustCloudNormalStrength'
  | 'atmosphereIntensity'
  | 'atmosphereThickness'
  | 'atmosphereDropoff'
  | 'atmosphereTerminatorWrap'
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
  enableAtmosphere: false,
  enableDustClouds: false,
  seed: 1,
  palette: 'rocky',
  surfaceTint: '#ffffff',
  colorScale: 1,
  tintShadowFloor: 0.18,
  swirliness: 1,
  dustCloudCoverage: 0.4,
  dustCloudStyle: 'mixed',
  dustCloudPalette: 'silicate',
  dustCloudOpacity: 0.68,
  dustCloudElevation: 0.15,
  dustCloudFrequency: 1,
  dustCloudSwirliness: 0.65,
  dustCloudCoriolis: 0.8,
  dustCloudNormalStrength: 1.2,
  atmospherePalette: 'terran',
  atmosphereIntensity: 1.2,
  atmosphereThickness: 0.12,
  atmosphereDropoff: 4,
  atmosphereTerminatorWrap: 0.3,
  craterCount: 20,
  craterScale: 1,
  craterStrength: 5,
  craterSharpness: 3.5,
  craterColorStrength: 0.45,
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
  seed: 1,
  colorScale: 0.0,
  tintShadowFloor: 0,
  swirliness: 0,
  dustCloudCoverage: 0,
  dustCloudOpacity: 0,
  dustCloudElevation: 0.01,
  dustCloudFrequency: 0.25,
  dustCloudSwirliness: 0,
  dustCloudCoriolis: 0,
  dustCloudNormalStrength: 0,
  atmosphereIntensity: 0,
  atmosphereThickness: 0.01,
  atmosphereDropoff: 0.25,
  atmosphereTerminatorWrap: 0,
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
  seed: 999999,
  colorScale: 2,
  tintShadowFloor: 0.8,
  swirliness: 2,
  dustCloudCoverage: 1,
  dustCloudOpacity: 1,
  dustCloudElevation: 1,
  dustCloudFrequency: 4,
  dustCloudSwirliness: 2,
  dustCloudCoriolis: 2,
  dustCloudNormalStrength: 3,
  atmosphereIntensity: 5,
  atmosphereThickness: 1,
  atmosphereDropoff: 16,
  atmosphereTerminatorWrap: 1,
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
  dustCloudCoverage: 0.05,
  dustCloudOpacity: 0.05,
  dustCloudElevation: 0.01,
  dustCloudFrequency: 0.05,
  dustCloudSwirliness: 0.05,
  dustCloudCoriolis: 0.05,
  dustCloudNormalStrength: 0.05,
  atmosphereIntensity: 0.05,
  atmosphereThickness: 0.01,
  atmosphereDropoff: 0.25,
  atmosphereTerminatorWrap: 0.05,
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
  dustCloudCoverage: {
    defaultValue: DefaultValues.dustCloudCoverage,
    min: MinValues.dustCloudCoverage,
    max: MaxValues.dustCloudCoverage,
  },
  dustCloudOpacity: {
    defaultValue: DefaultValues.dustCloudOpacity,
    min: MinValues.dustCloudOpacity,
    max: MaxValues.dustCloudOpacity,
  },
  dustCloudElevation: {
    defaultValue: DefaultValues.dustCloudElevation,
    min: MinValues.dustCloudElevation,
    max: MaxValues.dustCloudElevation,
  },
  dustCloudFrequency: {
    defaultValue: DefaultValues.dustCloudFrequency,
    min: MinValues.dustCloudFrequency,
    max: MaxValues.dustCloudFrequency,
  },
  dustCloudSwirliness: {
    defaultValue: DefaultValues.dustCloudSwirliness,
    min: MinValues.dustCloudSwirliness,
    max: MaxValues.dustCloudSwirliness,
  },
  dustCloudCoriolis: {
    defaultValue: DefaultValues.dustCloudCoriolis,
    min: MinValues.dustCloudCoriolis,
    max: MaxValues.dustCloudCoriolis,
  },
  dustCloudNormalStrength: {
    defaultValue: DefaultValues.dustCloudNormalStrength,
    min: MinValues.dustCloudNormalStrength,
    max: MaxValues.dustCloudNormalStrength,
  },
  atmosphereIntensity: {
    defaultValue: DefaultValues.atmosphereIntensity,
    min: MinValues.atmosphereIntensity,
    max: MaxValues.atmosphereIntensity,
  },
  atmosphereThickness: {
    defaultValue: DefaultValues.atmosphereThickness,
    min: MinValues.atmosphereThickness,
    max: MaxValues.atmosphereThickness,
  },
  atmosphereDropoff: {
    defaultValue: DefaultValues.atmosphereDropoff,
    min: MinValues.atmosphereDropoff,
    max: MaxValues.atmosphereDropoff,
  },
  atmosphereTerminatorWrap: {
    defaultValue: DefaultValues.atmosphereTerminatorWrap,
    min: MinValues.atmosphereTerminatorWrap,
    max: MaxValues.atmosphereTerminatorWrap,
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
  const enableDustClouds = sanitizeBoolean(raw, 'enableDustClouds', DefaultValues.enableDustClouds)
  const enableAtmosphere = sanitizeBoolean(raw, 'enableAtmosphere', DefaultValues.enableAtmosphere)

  const palette = sanitizeEnum(raw, 'palette', PlanetoidPaletteNames, DefaultValues.palette)
  const dustCloudPalette = sanitizeEnum(
    raw,
    'dustCloudPalette',
    DustCloudPaletteNames,
    DefaultValues.dustCloudPalette
  )
  const dustCloudStyle = sanitizeEnum(
    raw,
    'dustCloudStyle',
    DustCloudStyleNames,
    DefaultValues.dustCloudStyle
  )
  const atmospherePalette = sanitizeEnum(
    raw,
    'atmospherePalette',
    AtmospherePaletteNames,
    DefaultValues.atmospherePalette
  )
  const surfaceTint = sanitizeHexColor(raw, 'surfaceTint', DefaultValues.surfaceTint)
  return {
    palette,
    surfaceTint,
    colorScale: numeric.colorScale,
    tintShadowFloor: numeric.tintShadowFloor,
    swirliness: numeric.swirliness,
    dustCloudCoverage: numeric.dustCloudCoverage,
    dustCloudStyle,
    dustCloudPalette,
    dustCloudOpacity: numeric.dustCloudOpacity,
    dustCloudElevation: numeric.dustCloudElevation,
    dustCloudFrequency: numeric.dustCloudFrequency,
    dustCloudSwirliness: numeric.dustCloudSwirliness,
    dustCloudCoriolis: numeric.dustCloudCoriolis,
    dustCloudNormalStrength: numeric.dustCloudNormalStrength,
    atmospherePalette,
    atmosphereIntensity: numeric.atmosphereIntensity,
    atmosphereThickness: numeric.atmosphereThickness,
    atmosphereDropoff: numeric.atmosphereDropoff,
    atmosphereTerminatorWrap: numeric.atmosphereTerminatorWrap,
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
    enableDustClouds,
    enableAtmosphere,
    ridgeStrength: numeric.ridgeStrength,
    ridgeFrequency: numeric.ridgeFrequency,
    ridgeSharpness: numeric.ridgeSharpness,
    riftStrength: numeric.riftStrength,
    riftFrequency: numeric.riftFrequency,
    riftWidth: numeric.riftWidth,
    riftSharpness: numeric.riftSharpness,
    ridgesRiftsBlend: numeric.ridgesRiftsBlend,
    normalTextureSize: sanitizeTextureSize(raw.normalTextureSize, DefaultValues.normalTextureSize),
    colorTextureSize: sanitizeTextureSize(raw.colorTextureSize, DefaultValues.colorTextureSize),
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
  dustCloudCoverage: 'Dust-cloud coverage',
  dustCloudOpacity: 'Dust-cloud opacity',
  dustCloudElevation: 'Dust-cloud elevation',
  dustCloudFrequency: 'Dust-cloud frequency',
  dustCloudSwirliness: 'Dust-cloud swirliness',
  dustCloudCoriolis: 'Coriolis strength',
  dustCloudNormalStrength: 'Dust-cloud relief',
  atmosphereIntensity: 'Atmosphere intensity',
  atmosphereThickness: 'Atmosphere thickness',
  atmosphereDropoff: 'Atmosphere drop-off',
  atmosphereTerminatorWrap: 'Terminator wrap',
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
  dustClouds: 'Dust clouds',
  dustCloudStyle: 'Cloud formation',
  dustCloudPalette: 'Cloud palette',
  atmosphere: 'Atmosphere',
  atmospherePalette: 'Atmosphere palette',
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
  dustCloudCoverage: '--dust-cloud-coverage',
  dustCloudOpacity: '--dust-cloud-opacity',
  dustCloudElevation: '--dust-cloud-elevation',
  dustCloudFrequency: '--dust-cloud-frequency',
  dustCloudSwirliness: '--dust-cloud-swirliness',
  dustCloudCoriolis: '--dust-cloud-coriolis',
  dustCloudNormalStrength: '--dust-cloud-normal-strength',
  atmosphereIntensity: '--atmosphere-intensity',
  atmosphereThickness: '--atmosphere-thickness',
  atmosphereDropoff: '--atmosphere-dropoff',
  atmosphereTerminatorWrap: '--atmosphere-terminator-wrap',
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
  dustCloudsEnabled: '--dust-clouds-enabled',
  atmosphereEnabled: '--atmosphere-enabled',
} as const

export const PlanetoidCliFeatureFlags = {
  dustCloudStyle: '--dust-cloud-style',
  dustCloudPalette: '--dust-cloud-palette',
  atmospherePalette: '--atmosphere-palette',
} as const
