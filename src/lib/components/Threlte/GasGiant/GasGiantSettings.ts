import { GasGiantPaletteNames, type GasGiantPaletteName } from './GasGiantPalettes'
import {
  AtmospherePaletteNames,
  type AtmospherePaletteName,
} from '../Atmosphere/AtmospherePalettes'
import { type TextureSize } from '../../../types/textureSize'
import {
  constrainRingRadii,
  DefaultRingValues,
  RingSchema,
  type RingSettings,
} from '../Rings/RingSettings'
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
import { toRecord } from '../../../utils/sanitize'
import { cameraViewCliArgs, type CameraView } from '../../../utils/cameraView'

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
  cloudTurbulence: number
  enableStorms: boolean
  stormCount: number
  stormScale: number
  stormPower: number
  stormStrength: number
  stormColorStrength: number
  normalStrength: number
  roughness: number
  metalness: number
  enableAtmosphere: boolean
  atmospherePalette: AtmospherePaletteName
  atmosphereIntensity: number
  atmosphereThickness: number
  atmosphereDropoff: number
  atmosphereTerminatorWrap: number
  normalTextureSize: TextureSize
  colorTextureSize: TextureSize
}

export const GasGiantSections = [
  'scene',
  'color',
  'textureResolution',
  'material',
  'cloudBands',
  'storms',
  'rings',
  'atmosphere',
] as const
export type GasGiantSection = (typeof GasGiantSections)[number]

export type GasGiantRangeKey = NumericKeys<GasGiantSettings>
export type GasGiantRangeValues = Pick<GasGiantSettings, GasGiantRangeKey>

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
  cloudTurbulence: 0,
  enableStorms: true,
  stormCount: 2,
  stormScale: 0.1,
  stormPower: 2.2,
  stormStrength: 0.45,
  stormColorStrength: 0.4,
  normalStrength: 0.5,
  roughness: 0.82,
  metalness: 0.05,
  enableAtmosphere: true,
  atmospherePalette: 'glacial',
  atmosphereIntensity: 1.2,
  atmosphereThickness: 0.06,
  atmosphereDropoff: 4,
  atmosphereTerminatorWrap: 0.3,
  normalTextureSize: 1024,
  colorTextureSize: 1024,
}

export const GasGiantSchema: SettingsSchema<GasGiantSettings, GasGiantSection> = {
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
  palette: {
    kind: 'enum',
    label: 'Palette',
    cliFlag: '--palette',
    section: 'color',
    options: GasGiantPaletteNames,
  },
  surfaceTint: {
    kind: 'color',
    label: 'Surface tint',
    cliFlag: '--surface-tint',
    section: 'color',
  },
  colorScale: {
    kind: 'number',
    label: 'Palette influence',
    cliFlag: '--color-scale',
    section: 'color',
    min: 0,
    max: 2,
    step: 0.05,
  },
  tintShadowFloor: {
    kind: 'number',
    label: 'Tint shadow floor',
    cliFlag: '--tint-shadow-floor',
    section: 'color',
    min: 0,
    max: 0.9,
    step: 0.01,
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
    max: 1,
    step: 0.05,
  },
  roughness: {
    kind: 'number',
    label: 'Roughness',
    cliFlag: '--roughness',
    section: 'material',
    min: 0,
    max: 1,
    step: 0.01,
  },
  metalness: {
    kind: 'number',
    label: 'Metalness',
    cliFlag: '--metalness',
    section: 'material',
    min: 0,
    max: 1,
    step: 0.01,
  },
  cloudBandCount: {
    kind: 'number',
    label: 'Cloud band count',
    cliFlag: '--cloud-band-count',
    section: 'cloudBands',
    min: 1,
    max: 28,
    step: 1,
    integer: true,
  },
  cloudBandSharpness: {
    kind: 'number',
    label: 'Band sharpness',
    cliFlag: '--cloud-band-sharpness',
    section: 'cloudBands',
    min: 0,
    max: 1,
    step: 0.01,
  },
  cloudChaos: {
    kind: 'number',
    label: 'Cloud chaos',
    cliFlag: '--cloud-chaos',
    section: 'cloudBands',
    min: 0,
    max: 2,
    step: 0.01,
  },
  cloudTurbulence: {
    kind: 'number',
    label: 'Cloud turbulence',
    cliFlag: '--cloud-turbulence',
    section: 'cloudBands',
    min: 0,
    max: 1,
    step: 0.01,
  },
  enableStorms: {
    kind: 'boolean',
    label: 'Storm systems',
    cliFlag: '--storms-enabled',
    section: 'storms',
    togglesSection: true,
  },
  stormCount: {
    kind: 'number',
    label: 'Storm count',
    cliFlag: '--storm-count',
    section: 'storms',
    min: 0,
    max: 32,
    step: 1,
    integer: true,
  },
  stormScale: {
    kind: 'number',
    label: 'Storm scale',
    cliFlag: '--storm-scale',
    section: 'storms',
    min: 0,
    max: 0.45,
    step: 0.01,
  },
  stormPower: {
    kind: 'number',
    label: 'Storm falloff power',
    cliFlag: '--storm-power',
    section: 'storms',
    min: 0.5,
    max: 6,
    step: 0.1,
  },
  stormStrength: {
    kind: 'number',
    label: 'Storm strength',
    cliFlag: '--storm-strength',
    section: 'storms',
    min: 0,
    max: 1.5,
    step: 0.01,
  },
  stormColorStrength: {
    kind: 'number',
    label: 'Storm color strength',
    cliFlag: '--storm-color-strength',
    section: 'storms',
    min: 0,
    max: 1.5,
    step: 0.01,
  },
  ...RingSchema,
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
    max: 0.5,
    step: 0.01,
  },
  atmosphereDropoff: {
    kind: 'number',
    label: 'Atmosphere dropoff',
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
}

assertValidSchema(GasGiantSchema, DefaultValues, 'Gas giant')

export const MinValues = numericTable(GasGiantSchema, 'min')
export const MaxValues = numericTable(GasGiantSchema, 'max')
export const StepValues = numericTable(GasGiantSchema, 'step')
export const GasGiantRangeLabels = numericLabels(GasGiantSchema)
export const GasGiantNumericControls = numericKeysBySection(GasGiantSchema, GasGiantSections)

export function sanitizeGasGiantSettings(input: unknown): GasGiantSettings {
  const raw = toRecord(input)
  const migratedRaw = {
    ...raw,
    normalStrength: raw.normalStrength ?? raw.bumpScale,
    normalTextureSize: raw.normalTextureSize ?? raw.bumpTextureSize,
  }

  return constrainRingRadii(sanitizeWithSchema(GasGiantSchema, DefaultValues, migratedRaw))
}

export function buildGasGiantCliCommand(
  settings: GasGiantSettings,
  exportTextures: boolean,
  camera?: CameraView
) {
  const args = toCliArgs(GasGiantSchema, sanitizeGasGiantSettings(settings), ['seed'])
  if (exportTextures) args.push('--export-textures')
  else if (camera) args.push(...cameraViewCliArgs(camera))
  args.push(GasGiantSchema.seed.cliFlag, '1', '--step', '1', '--count', '1')

  return `npm run auto-generate-gas-giants -- ${args.join(' ')}`
}

export const GasGiantUiLabels = {
  scene: 'Scene',
  viewMode: 'View mode',
  texture: 'Texture',
  features: 'Features',
  material: 'Material',
  colorSettings: 'Color settings',
  textureResolution: 'Texture resolution',
  cloudBands: 'Cloud bands',
  properties: 'Properties',
} as const
