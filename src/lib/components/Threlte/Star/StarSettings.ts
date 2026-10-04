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
import { type TextureSize } from '../../../types/textureSize'
import { cameraViewCliArgs, type CameraView } from '../../../utils/cameraView'

export type StarPaletteName = 'White' | 'Blue' | 'Yellow' | 'Orange' | 'Red'

export const StarPaletteNames: readonly StarPaletteName[] = [
  'White',
  'Blue',
  'Yellow',
  'Orange',
  'Red',
]

export type StarSettings = {
  seed: number
  palette: StarPaletteName
  brightness: number
  saturation: number
  contrast: number
  limbBrightness: number
  haloIntensity: number
  haloFalloff: number
  haloSize: number
  haloTurbulence: number
  plasmaIntensity: number
  plasmaSurfaceIntensity: number
  plasmaExtent: number
  plasmaTurbulence: number
  plasmaSharpness: number
  plasmaTextureScale: number
  colorTextureSize: TextureSize
  textureScale: number
  bandContrast: number
  bandSwirl: number
  granularity: number
  turbulence: number
  convection: number
  sunspotCount: number
  sunspotScale: number
  sunspotPower: number
  sunspotJaggedness: number
  sunspotNeighbours: number
  penumbraScale: number
  sunspotDarkness: number
  autoRotate: boolean
}

export const StarSections = [
  'scene',
  'color',
  'surface',
  'textureResolution',
  'sunspots',
  'halo',
  'plasma',
] as const
export type StarSection = (typeof StarSections)[number]

export type StarRangeKey = NumericKeys<StarSettings>
export type StarRangeValues = Pick<StarSettings, StarRangeKey>

export const DefaultValues: StarSettings = {
  seed: 1,
  palette: 'Yellow',
  brightness: 1.5,
  saturation: 1.3,
  contrast: 1.4,
  limbBrightness: 0.7,
  haloIntensity: 2.8,
  haloFalloff: 7,
  haloSize: 1.27,
  haloTurbulence: 2,
  plasmaIntensity: 10,
  plasmaSurfaceIntensity: 1,
  plasmaExtent: 0.04,
  plasmaTurbulence: 2,
  plasmaSharpness: 3,
  plasmaTextureScale: 2.3,
  colorTextureSize: 1024,
  textureScale: 4,
  bandContrast: 1,
  bandSwirl: 1,
  granularity: 6,
  turbulence: 8,
  convection: 0.3,
  sunspotCount: 12,
  sunspotScale: 0.5,
  sunspotPower: 2.2,
  sunspotJaggedness: 0.3,
  sunspotNeighbours: 5,
  penumbraScale: 1,
  sunspotDarkness: 1,
  autoRotate: false,
}

type NumberSpecArgs = [
  label: string,
  cliFlag: `--${string}`,
  min: number,
  max: number,
  step: number,
]

function num(section: StarSection, ...[label, cliFlag, min, max, step]: NumberSpecArgs) {
  return { kind: 'number', section, label, cliFlag, min, max, step } as const
}

export const StarSchema: SettingsSchema<StarSettings, StarSection> = {
  seed: { ...num('scene', 'Seed', '--seed', 1, 999999, 1), integer: true },
  autoRotate: { kind: 'boolean', label: 'Auto-rotate', cliFlag: '--auto-rotate', section: 'scene' },
  palette: {
    kind: 'enum',
    label: 'Stellar class',
    cliFlag: '--palette',
    section: 'color',
    options: StarPaletteNames,
  },
  brightness: num('color', 'Brightness', '--brightness', 0.1, 3, 0.1),
  saturation: num('color', 'Saturation', '--saturation', 0, 2, 0.1),
  contrast: num('color', 'Contrast', '--contrast', 0, 2, 0.1),
  limbBrightness: num('color', 'Limb brightness', '--limb-brightness', 0, 3, 0.1),
  textureScale: num('surface', 'Band scale', '--texture-scale', 0.2, 4, 0.1),
  bandContrast: num('surface', 'Band contrast', '--band-contrast', 0, 5, 0.05),
  bandSwirl: num('surface', 'Band swirl', '--band-swirl', 0, 5, 0.05),
  granularity: num('surface', 'Granularity', '--granularity', 0.2, 8, 0.1),
  turbulence: num('surface', 'Turbulence', '--turbulence', 0, 8, 0.1),
  convection: num('surface', 'Convection', '--convection', 0, 8, 0.1),
  colorTextureSize: {
    kind: 'textureSize',
    label: 'Color texture size',
    cliFlag: '--color-texture-size',
    section: 'textureResolution',
  },
  sunspotCount: {
    ...num('sunspots', 'Sunspot groups', '--sunspot-count', 0, 12, 1),
    integer: true,
  },
  sunspotScale: num('sunspots', 'Sunspot scale', '--sunspot-scale', 0.25, 3, 0.1),
  sunspotPower: num('sunspots', 'Spot size power', '--sunspot-power', 0.25, 4, 0.1),
  sunspotJaggedness: num('sunspots', 'Sunspot jaggedness', '--sunspot-jaggedness', 0, 2, 0.1),
  sunspotNeighbours: {
    ...num('sunspots', 'Max neighbours', '--sunspot-neighbours', 0, 7, 1),
    integer: true,
  },
  penumbraScale: num('sunspots', 'Penumbra scale', '--penumbra-scale', 0.25, 3, 0.1),
  sunspotDarkness: num('sunspots', 'Sunspot darkness', '--sunspot-darkness', 0, 1, 0.05),
  haloIntensity: num('halo', 'Halo brightness', '--halo-intensity', 0, 3, 0.1),
  haloFalloff: num('halo', 'Halo dropoff', '--halo-falloff', 0.5, 10, 0.25),
  haloSize: num('halo', 'Halo size', '--halo-size', 1, 1.4, 0.01),
  haloTurbulence: num('halo', 'Halo turbulence', '--halo-turbulence', 0, 2, 0.1),
  plasmaIntensity: num('plasma', 'Plasma brightness', '--plasma-intensity', 1, 20, 0.1),
  plasmaSurfaceIntensity: num(
    'plasma',
    'Surface plasma intensity',
    '--plasma-surface-intensity',
    0,
    8,
    0.05
  ),
  plasmaExtent: num('plasma', 'Plasma extent', '--plasma-extent', 0.02, 1, 0.01),
  plasmaTurbulence: num('plasma', 'Plasma turbulence', '--plasma-turbulence', 0, 8, 0.1),
  plasmaSharpness: num('plasma', 'Plasma sharpness', '--plasma-sharpness', 1, 12, 0.25),
  plasmaTextureScale: num('plasma', 'Plasma texture scale', '--plasma-texture-scale', 0.2, 8, 0.1),
}

assertValidSchema(StarSchema, DefaultValues, 'Star')

export const MinValues = numericTable(StarSchema, 'min')
export const MaxValues = numericTable(StarSchema, 'max')
export const StepValues = numericTable(StarSchema, 'step')
export const StarRangeLabels = numericLabels(StarSchema)
export const StarNumericControls = numericKeysBySection(StarSchema, StarSections)

export function sanitizeStarSettings(input: unknown): StarSettings {
  return sanitizeWithSchema(StarSchema, DefaultValues, input)
}

export function buildStarCliCommand(settings: StarSettings, camera?: CameraView) {
  const args = toCliArgs(StarSchema, sanitizeStarSettings(settings), ['seed'])
  if (camera) args.push(...cameraViewCliArgs(camera))
  args.push(StarSchema.seed.cliFlag, '1', '--step', '1', '--count', '1')

  return `npm run auto-generate-stars -- ${args.join(' ')}`
}

export const DefaultStarSettings = DefaultValues
