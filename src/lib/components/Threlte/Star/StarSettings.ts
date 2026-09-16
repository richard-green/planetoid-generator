import {
  sanitizeBoolean,
  sanitizeEnum,
  sanitizeNumber,
  toRecord,
  type NumericSanitizeSpec,
} from '../../../utils/sanitize'

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
  plasmaExtent: number
  plasmaTurbulence: number
  plasmaSharpness: number
  plasmaTextureScale: number
  colorTextureSize: number
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

export type StarRangeValues = Pick<
  StarSettings,
  | 'seed'
  | 'brightness'
  | 'saturation'
  | 'contrast'
  | 'limbBrightness'
  | 'haloIntensity'
  | 'haloFalloff'
  | 'haloSize'
  | 'haloTurbulence'
  | 'plasmaIntensity'
  | 'plasmaExtent'
  | 'plasmaTurbulence'
  | 'plasmaSharpness'
  | 'plasmaTextureScale'
  | 'colorTextureSize'
  | 'textureScale'
  | 'bandContrast'
  | 'bandSwirl'
  | 'granularity'
  | 'turbulence'
  | 'convection'
  | 'sunspotCount'
  | 'sunspotScale'
  | 'sunspotPower'
  | 'sunspotJaggedness'
  | 'sunspotNeighbours'
  | 'penumbraScale'
  | 'sunspotDarkness'
>

export type StarRangeKey = keyof StarRangeValues

export const DefaultValues: StarSettings = {
  seed: 20069,
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
  plasmaExtent: 0.04,
  plasmaTurbulence: 2,
  plasmaSharpness: 3,
  plasmaTextureScale: 2.3,
  colorTextureSize: 2048,
  textureScale: 2,
  bandContrast: 5,
  bandSwirl: 5,
  granularity: 8,
  turbulence: 8,
  convection: 0.3,
  sunspotCount: 12,
  sunspotScale: 0.5,
  sunspotPower: 2.2,
  sunspotJaggedness: 0.3,
  sunspotNeighbours: 5,
  penumbraScale: 1,
  sunspotDarkness: 1,
  autoRotate: true,
}

export const MinValues: StarRangeValues = {
  seed: 0,
  brightness: 0.1,
  saturation: 0,
  contrast: 0,
  limbBrightness: 0,
  haloIntensity: 0,
  haloFalloff: 0.5,
  haloSize: 1,
  haloTurbulence: 0,
  plasmaIntensity: 1,
  plasmaExtent: 0.02,
  plasmaTurbulence: 0,
  plasmaSharpness: 1,
  plasmaTextureScale: 0.2,
  colorTextureSize: 64,
  textureScale: 0.2,
  bandContrast: 0,
  bandSwirl: 0,
  granularity: 0.2,
  turbulence: 0,
  convection: 0,
  sunspotCount: 0,
  sunspotScale: 0.25,
  sunspotPower: 0.25,
  sunspotJaggedness: 0,
  sunspotNeighbours: 0,
  penumbraScale: 0.25,
  sunspotDarkness: 0,
}

export const MaxValues: StarRangeValues = {
  seed: 100000,
  brightness: 3,
  saturation: 2,
  contrast: 2,
  limbBrightness: 3,
  haloIntensity: 3,
  haloFalloff: 10,
  haloSize: 1.4,
  haloTurbulence: 2,
  plasmaIntensity: 10,
  plasmaExtent: 0.6,
  plasmaTurbulence: 2,
  plasmaSharpness: 12,
  plasmaTextureScale: 4,
  colorTextureSize: 4096,
  textureScale: 4,
  bandContrast: 5,
  bandSwirl: 5,
  granularity: 8,
  turbulence: 8,
  convection: 8,
  sunspotCount: 12,
  sunspotScale: 3,
  sunspotPower: 4,
  sunspotJaggedness: 2,
  sunspotNeighbours: 7,
  penumbraScale: 3,
  sunspotDarkness: 1,
}

export const StepValues: StarRangeValues = {
  seed: 1,
  brightness: 0.1,
  saturation: 0.1,
  contrast: 0.1,
  limbBrightness: 0.1,
  haloIntensity: 0.1,
  haloFalloff: 0.25,
  haloSize: 0.01,
  haloTurbulence: 0.1,
  plasmaIntensity: 0.1,
  plasmaExtent: 0.01,
  plasmaTurbulence: 0.1,
  plasmaSharpness: 0.25,
  plasmaTextureScale: 0.1,
  colorTextureSize: 1,
  textureScale: 0.1,
  bandContrast: 0.05,
  bandSwirl: 0.05,
  granularity: 0.1,
  turbulence: 0.1,
  convection: 0.1,
  sunspotCount: 1,
  sunspotScale: 0.1,
  sunspotPower: 0.1,
  sunspotJaggedness: 0.1,
  sunspotNeighbours: 1,
  penumbraScale: 0.1,
  sunspotDarkness: 0.05,
}

const INTEGER_RANGE_KEYS: readonly StarRangeKey[] = [
  'seed',
  'colorTextureSize',
  'sunspotCount',
  'sunspotNeighbours',
]

export function sanitizeStarSettings(input: unknown): StarSettings {
  const raw = toRecord(input)
  const numeric = {} as StarRangeValues

  for (const key of Object.keys(MinValues) as StarRangeKey[]) {
    const spec: NumericSanitizeSpec = {
      defaultValue: DefaultValues[key],
      min: MinValues[key],
      max: MaxValues[key],
      round: INTEGER_RANGE_KEYS.includes(key),
    }
    numeric[key] = sanitizeNumber(raw, key, spec)
  }

  return {
    ...numeric,
    palette: sanitizeEnum(raw, 'palette', StarPaletteNames, DefaultValues.palette),
    autoRotate: sanitizeBoolean(raw, 'autoRotate', DefaultValues.autoRotate),
  }
}

export const DefaultStarSettings = DefaultValues
