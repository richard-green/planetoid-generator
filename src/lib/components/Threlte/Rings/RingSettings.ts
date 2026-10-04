import {
  assertValidSchema,
  numericLabels,
  numericTable,
  sanitizeWithSchema,
  type NumericKeys,
  type SettingsSchema,
} from '../../../types/settingsSchema'
import { RingPaletteNames, type RingPaletteName } from './RingPalettes'

export type RingSettings = {
  enableRings: boolean
  ringPalette: RingPaletteName
  ringInnerRadius: number
  ringOuterRadius: number
  ringTilt: number
  ringBandCount: number
  ringBandSharpness: number
  ringBandRegularity: number
  ringDensity: number
  ringTextureScale: number
  ringGranularity: number
  ringPaletteInfluence: number
  ringSolarization: number
  ringOpacity: number
  ringNoise: number
  ringGlitter: number
}

export type RingRangeKey = NumericKeys<RingSettings>
export type RingRangeValues = Pick<RingSettings, RingRangeKey>

export const DefaultRingValues: RingSettings = {
  enableRings: true,
  ringPalette: 'graphite',
  ringInnerRadius: 1.6,
  ringOuterRadius: 1.95,
  ringTilt: -37,
  ringBandCount: 6,
  ringBandSharpness: 0,
  ringBandRegularity: 0,
  ringDensity: 0.65,
  ringTextureScale: 7,
  ringGranularity: 0.35,
  ringPaletteInfluence: 1,
  ringSolarization: 1,
  ringOpacity: 0.7,
  ringNoise: 0.35,
  ringGlitter: 0,
}

export const RingSchema: SettingsSchema<RingSettings, 'rings'> = {
  enableRings: {
    kind: 'boolean',
    label: 'Rings',
    cliFlag: '--rings-enabled',
    section: 'rings',
    togglesSection: true,
  },
  ringPalette: {
    kind: 'enum',
    label: 'Ring palette',
    cliFlag: '--ring-palette',
    section: 'rings',
    options: RingPaletteNames,
  },
  ringInnerRadius: {
    kind: 'number',
    label: 'Inner radius',
    cliFlag: '--ring-inner-radius',
    section: 'rings',
    min: 1.05,
    max: 2.5,
    step: 0.05,
  },
  ringOuterRadius: {
    kind: 'number',
    label: 'Outer radius',
    cliFlag: '--ring-outer-radius',
    section: 'rings',
    min: 1.15,
    max: 3.5,
    step: 0.05,
  },
  ringTilt: {
    kind: 'number',
    label: 'Tilt',
    cliFlag: '--ring-tilt',
    section: 'rings',
    min: -45,
    max: 45,
    step: 1,
  },
  ringBandCount: {
    kind: 'number',
    label: 'Band count',
    cliFlag: '--ring-band-count',
    section: 'rings',
    min: 1,
    max: 64,
    step: 1,
    integer: true,
  },
  ringBandSharpness: {
    kind: 'number',
    label: 'Band sharpness',
    cliFlag: '--ring-band-sharpness',
    section: 'rings',
    min: 0,
    max: 1,
    step: 0.05,
  },
  ringBandRegularity: {
    kind: 'number',
    label: 'Band regularity',
    cliFlag: '--ring-band-regularity',
    section: 'rings',
    min: 0,
    max: 1,
    step: 0.05,
  },
  ringDensity: {
    kind: 'number',
    label: 'Density',
    cliFlag: '--ring-density',
    section: 'rings',
    min: 0.05,
    max: 1,
    step: 0.05,
  },
  ringTextureScale: {
    kind: 'number',
    label: 'Texture scale',
    cliFlag: '--ring-texture-scale',
    section: 'rings',
    min: 0,
    max: 24,
    step: 0.5,
  },
  ringGranularity: {
    kind: 'number',
    label: 'Granularity',
    cliFlag: '--ring-granularity',
    section: 'rings',
    min: 0,
    max: 1,
    step: 0.05,
  },
  ringPaletteInfluence: {
    kind: 'number',
    label: 'Palette influence',
    cliFlag: '--ring-palette-influence',
    section: 'rings',
    min: 0,
    max: 1,
    step: 0.05,
  },
  ringSolarization: {
    kind: 'number',
    label: 'Solarization',
    cliFlag: '--ring-solarization',
    section: 'rings',
    min: 0,
    max: 1,
    step: 0.05,
  },
  ringOpacity: {
    kind: 'number',
    label: 'Opacity',
    cliFlag: '--ring-opacity',
    section: 'rings',
    min: 0.05,
    max: 1,
    step: 0.05,
  },
  ringNoise: {
    kind: 'number',
    label: 'Noise',
    cliFlag: '--ring-noise',
    section: 'rings',
    min: 0,
    max: 1,
    step: 0.05,
  },
  ringGlitter: {
    kind: 'number',
    label: 'Glitter',
    cliFlag: '--ring-glitter',
    section: 'rings',
    min: 0,
    max: 1,
    step: 0.05,
  },
}

assertValidSchema(RingSchema, DefaultRingValues, 'Ring')

export const RingMinValues = numericTable(RingSchema, 'min')
export const RingMaxValues = numericTable(RingSchema, 'max')
export const RingStepValues = numericTable(RingSchema, 'step')
export const RingRangeLabels = numericLabels(RingSchema)

/** Keeps the outer radius at least slightly beyond the inner radius. */
export function constrainRingRadii<T extends RingSettings>(settings: T): T {
  const outerRadius = Math.max(settings.ringInnerRadius + 0.05, settings.ringOuterRadius)
  return {
    ...settings,
    ringOuterRadius: Math.min(RingMaxValues.ringOuterRadius, outerRadius),
  }
}

export function sanitizeRingSettings(input: unknown): RingSettings {
  return constrainRingRadii(sanitizeWithSchema(RingSchema, DefaultRingValues, input))
}
