import { PlanetoidPaletteNames, type PlanetoidPaletteName } from './PlanetoidPalettes'
import { DustCloudPaletteNames, type DustCloudPaletteName } from './DustCloudPalettes'
import { IceCapPaletteNames, type IceCapPaletteName } from './IceCapPalettes'
import {
  AtmospherePaletteNames,
  type AtmospherePaletteName,
} from '../Atmosphere/AtmospherePalettes'
import { type TextureSize } from '../../../types/textureSize'
import {
  assertValidSchema,
  numericKeysBySection,
  numericLabels,
  numericTable,
  sanitizeWithSchema,
  toCliArgs,
  type NumericKeys,
  type SettingsSchema,
} from '../../../types/settingsSchema'
import { clamp } from '../../../utils/math'
import { cameraViewCliArgs, type CameraView } from '../../../utils/cameraView'
import { toRecord } from '../../../utils/sanitize'

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

export const DustCloudStyleNames = [
  'wisps',
  'worley',
  'cumulonimbus',
  'storm',
  'stormWorley',
] as const
export type DustCloudStyle = (typeof DustCloudStyleNames)[number]
export type DustCloudWeights = Record<DustCloudStyle, number>
export const DustCloudStyleLabels: Record<DustCloudStyle, string> = {
  wisps: 'Wisps',
  worley: 'Worley cells',
  cumulonimbus: 'Cumulonimbus',
  storm: 'Storm system',
  stormWorley: 'Storm + Worley',
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
  enableIceCaps: boolean
  iceCapCoverage: number
  iceCapEdgeNoise: number
  snowExtent: number
  snowCoverage: number
  iceCapColor: string
  iceCapPalette: IceCapPaletteName
  seed: number
  palette: PlanetoidPaletteName
  surfaceTint: string
  colorScale: number
  tintShadowFloor: number
  swirliness: number
  dustCloudCoverage: number
  dustCloudWeights: DustCloudWeights
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

export const PlanetoidSections = [
  'scene',
  'color',
  'textureResolution',
  'material',
  'iceCaps',
  'dustClouds',
  'atmosphere',
  'craters',
  'volcanoes',
  'ridges',
  'rifts',
  'geometry',
] as const
export type PlanetoidSection = (typeof PlanetoidSections)[number]

export type PlanetoidRangeKey = NumericKeys<PlanetoidSettings>
export type PlanetoidRangeValues = Pick<PlanetoidSettings, PlanetoidRangeKey>

export const DefaultValues: PlanetoidSettings = {
  autoRotate: false,
  showDebugMeshes: false,
  enableCraters: true,
  enableRidges: false,
  enableRifts: false,
  enableVolcanoes: false,
  enableAtmosphere: false,
  enableDustClouds: false,
  enableIceCaps: false,
  iceCapCoverage: 0.18,
  iceCapEdgeNoise: 0.5,
  snowExtent: 0,
  snowCoverage: 0.55,
  iceCapColor: '#ffffff',
  iceCapPalette: 'glacial',
  seed: 1,
  palette: 'rocky',
  surfaceTint: '#ffffff',
  colorScale: 1,
  tintShadowFloor: 0.18,
  swirliness: 1,
  dustCloudCoverage: 0.4,
  dustCloudWeights: {
    wisps: 1,
    worley: 0,
    cumulonimbus: 0,
    storm: 0,
    stormWorley: 0,
  },
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

function sanitizeDustCloudWeights(value: unknown, fallback: DustCloudWeights): DustCloudWeights {
  const raw = toRecord(value)
  if (!DustCloudStyleNames.some((style) => style in raw)) return { ...fallback }

  return Object.fromEntries(
    DustCloudStyleNames.map((style) => {
      const weight = raw[style]
      return [
        style,
        typeof weight === 'number' && Number.isFinite(weight) ? clamp(weight, 0, 1) : 0,
      ]
    })
  ) as DustCloudWeights
}

/** Accepts `wisps=1,worley=0.5` (unlisted styles are 0) or a bare style name meaning weight 1. */
function parseDustCloudWeights(text: string): DustCloudWeights {
  const weights = Object.fromEntries(
    DustCloudStyleNames.map((style) => [style, 0])
  ) as DustCloudWeights

  // Windows npm/npx shims turn commas into spaces, so accept either as a separator.
  for (const part of text.split(/[\s,]+/).filter(Boolean)) {
    const [name, rawWeight = '1'] = part.split('=').map((token) => token.trim())
    if (!DustCloudStyleNames.includes(name as DustCloudStyle)) {
      throw new Error(
        `Unknown dust-cloud style "${name}". Expected: ${DustCloudStyleNames.join(', ')}`
      )
    }
    const weight = Number(rawWeight)
    if (!Number.isFinite(weight) || weight < 0 || weight > 1) {
      throw new Error(
        `Dust-cloud weight for ${name} must be between 0 and 1. Received: ${rawWeight}`
      )
    }
    weights[name as DustCloudStyle] = weight
  }

  return weights
}

export const PlanetoidSchema: SettingsSchema<PlanetoidSettings, PlanetoidSection> = {
  seed: {
    kind: 'number',
    label: 'Seed',
    cliFlag: '--seed',
    section: 'scene',
    min: 1,
    max: 999999,
    step: 1,
    integer: true,
  },
  autoRotate: { kind: 'boolean', label: 'Auto-rotate', cliFlag: '--auto-rotate', section: 'scene' },
  showDebugMeshes: {
    kind: 'boolean',
    label: 'Show debug meshes',
    cliFlag: '--show-debug-meshes',
    section: 'scene',
  },
  palette: {
    kind: 'enum',
    label: 'Palette',
    cliFlag: '--palette',
    section: 'color',
    options: PlanetoidPaletteNames,
  },
  surfaceTint: {
    kind: 'color',
    label: 'Surface tint',
    cliFlag: '--surface-tint',
    section: 'color',
  },
  colorScale: {
    kind: 'number',
    label: 'Color scale',
    cliFlag: '--color-scale',
    section: 'color',
    min: 0,
    max: 2,
    step: 0.1,
  },
  tintShadowFloor: {
    kind: 'number',
    label: 'Tint shadow floor',
    cliFlag: '--tint-shadow-floor',
    section: 'color',
    min: 0,
    max: 0.8,
    step: 0.01,
  },
  swirliness: {
    kind: 'number',
    label: 'Swirliness',
    cliFlag: '--swirliness',
    section: 'color',
    min: 0,
    max: 2,
    step: 0.05,
  },
  normalTextureSize: {
    kind: 'textureSize',
    label: 'Normal texture size',
    cliFlag: '--normal-texture-size',
    section: 'textureResolution',
  },
  colorTextureSize: {
    kind: 'textureSize',
    label: 'Color texture size',
    cliFlag: '--color-texture-size',
    section: 'textureResolution',
  },
  normalStrength: {
    kind: 'number',
    label: 'Normal strength',
    cliFlag: '--normal-strength',
    section: 'material',
    min: 0,
    max: 10,
    step: 0.1,
  },
  roughness: {
    kind: 'number',
    label: 'Roughness',
    cliFlag: '--roughness',
    section: 'material',
    min: 0,
    max: 1,
    step: 0.1,
  },
  metalness: {
    kind: 'number',
    label: 'Metalness',
    cliFlag: '--metalness',
    section: 'material',
    min: 0,
    max: 1,
    step: 0.1,
  },
  enableIceCaps: {
    kind: 'boolean',
    label: 'Ice caps',
    cliFlag: '--ice-caps-enabled',
    section: 'iceCaps',
    togglesSection: true,
  },
  iceCapPalette: {
    kind: 'enum',
    label: 'Ice palette',
    cliFlag: '--ice-cap-palette',
    section: 'iceCaps',
    options: IceCapPaletteNames,
  },
  iceCapColor: { kind: 'color', label: 'Ice tint', cliFlag: '--ice-cap-color', section: 'iceCaps' },
  iceCapCoverage: {
    kind: 'number',
    label: 'Ice-cap coverage',
    cliFlag: '--ice-cap-coverage',
    section: 'iceCaps',
    min: 0,
    max: 1,
    step: 0.01,
  },
  iceCapEdgeNoise: {
    kind: 'number',
    label: 'Ice-cap edge breakup',
    cliFlag: '--ice-cap-edge-noise',
    section: 'iceCaps',
    min: 0,
    max: 1,
    step: 0.05,
  },
  snowExtent: {
    kind: 'number',
    label: 'Snow extent',
    cliFlag: '--snow-extent',
    section: 'iceCaps',
    min: 0,
    max: 0.5,
    step: 0.01,
  },
  snowCoverage: {
    kind: 'number',
    label: 'Snow coverage',
    cliFlag: '--snow-coverage',
    section: 'iceCaps',
    min: 0,
    max: 1,
    step: 0.05,
  },
  enableDustClouds: {
    kind: 'boolean',
    label: 'Dust clouds',
    cliFlag: '--dust-clouds-enabled',
    section: 'dustClouds',
    togglesSection: true,
  },
  dustCloudPalette: {
    kind: 'enum',
    label: 'Cloud palette',
    cliFlag: '--dust-cloud-palette',
    section: 'dustClouds',
    options: DustCloudPaletteNames,
  },
  dustCloudWeights: {
    kind: 'custom',
    label: 'Cloud formation',
    cliFlag: '--dust-cloud-weights',
    cliHint: '<style=weight,...>',
    section: 'dustClouds',
    sanitize: sanitizeDustCloudWeights,
    formatCli: (weights) =>
      DustCloudStyleNames.map((style) => `${style}=${weights[style]}`).join(','),
    parseCli: parseDustCloudWeights,
  },
  dustCloudCoverage: {
    kind: 'number',
    label: 'Dust-cloud coverage',
    cliFlag: '--dust-cloud-coverage',
    section: 'dustClouds',
    min: 0,
    max: 1,
    step: 0.05,
  },
  dustCloudOpacity: {
    kind: 'number',
    label: 'Dust-cloud opacity',
    cliFlag: '--dust-cloud-opacity',
    section: 'dustClouds',
    min: 0,
    max: 1,
    step: 0.05,
  },
  dustCloudElevation: {
    kind: 'number',
    label: 'Dust-cloud elevation',
    cliFlag: '--dust-cloud-elevation',
    section: 'dustClouds',
    min: 0.01,
    max: 1,
    step: 0.01,
  },
  dustCloudFrequency: {
    kind: 'number',
    label: 'Dust-cloud frequency',
    cliFlag: '--dust-cloud-frequency',
    section: 'dustClouds',
    min: 0.25,
    max: 4,
    step: 0.05,
  },
  dustCloudSwirliness: {
    kind: 'number',
    label: 'Dust-cloud swirliness',
    cliFlag: '--dust-cloud-swirliness',
    section: 'dustClouds',
    min: 0,
    max: 2,
    step: 0.05,
  },
  dustCloudCoriolis: {
    kind: 'number',
    label: 'Coriolis strength',
    cliFlag: '--dust-cloud-coriolis',
    section: 'dustClouds',
    min: 0,
    max: 2,
    step: 0.05,
  },
  dustCloudNormalStrength: {
    kind: 'number',
    label: 'Dust-cloud relief',
    cliFlag: '--dust-cloud-normal-strength',
    section: 'dustClouds',
    min: 0,
    max: 3,
    step: 0.05,
  },
  enableAtmosphere: {
    kind: 'boolean',
    label: 'Atmosphere',
    cliFlag: '--atmosphere-enabled',
    section: 'atmosphere',
    togglesSection: true,
  },
  atmospherePalette: {
    kind: 'enum',
    label: 'Atmosphere palette',
    cliFlag: '--atmosphere-palette',
    section: 'atmosphere',
    options: AtmospherePaletteNames,
  },
  atmosphereIntensity: {
    kind: 'number',
    label: 'Atmosphere intensity',
    cliFlag: '--atmosphere-intensity',
    section: 'atmosphere',
    min: 0,
    max: 5,
    step: 0.05,
  },
  atmosphereThickness: {
    kind: 'number',
    label: 'Atmosphere thickness',
    cliFlag: '--atmosphere-thickness',
    section: 'atmosphere',
    min: 0.01,
    max: 1,
    step: 0.01,
  },
  atmosphereDropoff: {
    kind: 'number',
    label: 'Atmosphere drop-off',
    cliFlag: '--atmosphere-dropoff',
    section: 'atmosphere',
    min: 0.25,
    max: 16,
    step: 0.25,
  },
  atmosphereTerminatorWrap: {
    kind: 'number',
    label: 'Terminator wrap',
    cliFlag: '--atmosphere-terminator-wrap',
    section: 'atmosphere',
    min: 0,
    max: 1,
    step: 0.05,
  },
  enableCraters: {
    kind: 'boolean',
    label: 'Craters',
    cliFlag: '--craters-enabled',
    section: 'craters',
    togglesSection: true,
  },
  craterCount: {
    kind: 'number',
    label: 'Crater count',
    cliFlag: '--crater-count',
    section: 'craters',
    min: 0,
    max: 120,
    step: 1,
    integer: true,
  },
  craterScale: {
    kind: 'number',
    label: 'Crater scale',
    cliFlag: '--crater-scale',
    section: 'craters',
    min: 0.25,
    max: 3,
    step: 0.05,
  },
  craterStrength: {
    kind: 'number',
    label: 'Crater strength',
    cliFlag: '--crater-strength',
    section: 'craters',
    min: 0,
    max: 10,
    step: 0.1,
  },
  craterSharpness: {
    kind: 'number',
    label: 'Crater sharpness',
    cliFlag: '--crater-sharpness',
    section: 'craters',
    min: 0.5,
    max: 8,
    step: 0.1,
  },
  craterColorStrength: {
    kind: 'number',
    label: 'Crater color',
    cliFlag: '--crater-color',
    section: 'craters',
    min: 0,
    max: 3,
    step: 0.05,
  },
  enableVolcanoes: {
    kind: 'boolean',
    label: 'Volcanoes',
    cliFlag: '--volcanoes-enabled',
    section: 'volcanoes',
    togglesSection: true,
  },
  volcanoCount: {
    kind: 'number',
    label: 'Volcano count',
    cliFlag: '--volcano-count',
    section: 'volcanoes',
    min: 0,
    max: 96,
    step: 1,
    integer: true,
  },
  volcanoScale: {
    kind: 'number',
    label: 'Volcano scale',
    cliFlag: '--volcano-scale',
    section: 'volcanoes',
    min: 0.35,
    max: 2.5,
    step: 0.05,
  },
  volcanoStrength: {
    kind: 'number',
    label: 'Volcano strength',
    cliFlag: '--volcano-strength',
    section: 'volcanoes',
    min: 0,
    max: 3,
    step: 0.05,
  },
  volcanoColorStrength: {
    kind: 'number',
    label: 'Volcano color',
    cliFlag: '--volcano-color',
    section: 'volcanoes',
    min: 0,
    max: 2.5,
    step: 0.05,
  },
  enableRidges: {
    kind: 'boolean',
    label: 'Ridges',
    cliFlag: '--ridges-enabled',
    section: 'ridges',
    togglesSection: true,
  },
  ridgeStrength: {
    kind: 'number',
    label: 'Ridge strength',
    cliFlag: '--ridge-strength',
    section: 'ridges',
    min: 0,
    max: 2,
    step: 0.05,
  },
  ridgeFrequency: {
    kind: 'number',
    label: 'Ridge frequency',
    cliFlag: '--ridge-frequency',
    section: 'ridges',
    min: 0.5,
    max: 8,
    step: 0.1,
  },
  ridgeSharpness: {
    kind: 'number',
    label: 'Ridge sharpness',
    cliFlag: '--ridge-sharpness',
    section: 'ridges',
    min: 0.5,
    max: 4,
    step: 0.05,
  },
  ridgeColorWeight: {
    kind: 'number',
    label: 'Ridge color weight',
    cliFlag: '--ridge-color-weight',
    section: 'ridges',
    min: 0,
    max: 4,
    step: 0.05,
  },
  ridgesRiftsBlend: {
    kind: 'number',
    label: 'Ridges/rifts blend',
    cliFlag: '--ridges-rifts-blend',
    section: 'ridges',
    min: 0,
    max: 1,
    step: 0.05,
  },
  enableRifts: {
    kind: 'boolean',
    label: 'Rifts',
    cliFlag: '--rifts-enabled',
    section: 'rifts',
    togglesSection: true,
  },
  riftStrength: {
    kind: 'number',
    label: 'Rift strength',
    cliFlag: '--rift-strength',
    section: 'rifts',
    min: 0,
    max: 2,
    step: 0.05,
  },
  riftFrequency: {
    kind: 'number',
    label: 'Rift frequency',
    cliFlag: '--rift-frequency',
    section: 'rifts',
    min: 0.5,
    max: 12,
    step: 0.1,
  },
  riftWidth: {
    kind: 'number',
    label: 'Rift width',
    cliFlag: '--rift-width',
    section: 'rifts',
    min: 0.01,
    max: 0.25,
    step: 0.01,
  },
  riftSharpness: {
    kind: 'number',
    label: 'Rift sharpness',
    cliFlag: '--rift-sharpness',
    section: 'rifts',
    min: 0.5,
    max: 6,
    step: 0.05,
  },
  riftColorWeight: {
    kind: 'number',
    label: 'Rift color weight',
    cliFlag: '--rift-color-weight',
    section: 'rifts',
    min: 0,
    max: 4,
    step: 0.05,
  },
  largeScale: {
    kind: 'number',
    label: 'Large-scale',
    cliFlag: '--large-scale',
    section: 'geometry',
    min: 0,
    max: 2,
    step: 0.1,
  },
  mediumScale: {
    kind: 'number',
    label: 'Medium-scale',
    cliFlag: '--medium-scale',
    section: 'geometry',
    min: 0,
    max: 2,
    step: 0.1,
  },
  smallScale: {
    kind: 'number',
    label: 'Small-scale',
    cliFlag: '--small-scale',
    section: 'geometry',
    min: 0,
    max: 2,
    step: 0.1,
  },
  mediumFrequency: {
    kind: 'number',
    label: 'Medium frequency',
    cliFlag: '--medium-frequency',
    section: 'geometry',
    min: 0.5,
    max: 5,
    step: 0.1,
  },
  smallFrequency: {
    kind: 'number',
    label: 'Small frequency',
    cliFlag: '--small-frequency',
    section: 'geometry',
    min: 1,
    max: 20,
    step: 0.1,
  },
  triangleDetail: {
    kind: 'number',
    label: 'Triangle detail',
    cliFlag: '--triangle-detail',
    section: 'geometry',
    min: 1,
    max: 40,
    step: 1,
    integer: true,
  },
}

assertValidSchema(PlanetoidSchema, DefaultValues, 'Planetoid')

export const MinValues = numericTable(PlanetoidSchema, 'min')
export const MaxValues = numericTable(PlanetoidSchema, 'max')
export const StepValues = numericTable(PlanetoidSchema, 'step')
export const PlanetoidRangeLabels = numericLabels(PlanetoidSchema)
export const PlanetoidNumericControls = numericKeysBySection(PlanetoidSchema, PlanetoidSections)

export function sanitizePlanetoidSettings(input: unknown): PlanetoidSettings {
  const raw = toRecord(input)
  const legacyStyle = raw.dustCloudStyle
  const migratedRaw =
    raw.dustCloudWeights === undefined &&
    typeof legacyStyle === 'string' &&
    DustCloudStyleNames.includes(legacyStyle as DustCloudStyle)
      ? { ...raw, dustCloudWeights: { [legacyStyle]: 1 } }
      : raw

  return sanitizeWithSchema(PlanetoidSchema, DefaultValues, migratedRaw)
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

export function buildPlanetoidCliCommand(
  settings: PlanetoidSettings,
  exportTextures: boolean,
  camera?: CameraView
) {
  const args = toCliArgs(PlanetoidSchema, sanitizePlanetoidSettings(settings), ['seed'])
  if (exportTextures) args.push('--export-textures')
  else if (camera) args.push(...cameraViewCliArgs(camera))
  args.push(PlanetoidSchema.seed.cliFlag, '1', '--step', '1', '--count', '1')

  return `npm run auto-generate-planetoids -- ${args.join(' ')}`
}

export const PlanetoidUiLabels = {
  scene: 'Scene',
  viewMode: 'View mode',
  texture: 'Texture',
  colorSettings: 'Color settings',
  textureResolution: 'Texture resolution',
  material: 'Material',
  properties: 'Properties',
  features: 'Features',
  geometry: 'Geometry',
  deformation: 'Deformation',
} as const
