import {
  sanitizeBoolean,
  sanitizeEnum,
  sanitizeNumericMap,
  toRecord,
  type NumericSanitizeSpec,
} from '../../../utils/sanitize'
import { RingPaletteNames, type RingPaletteName } from './RingPalettes'

export type RingSettings = {
  enableRings: boolean
  ringPalette: RingPaletteName
  ringInnerRadius: number
  ringOuterRadius: number
  ringTilt: number
  ringBandCount: number
  ringBandSharpness: number
  ringDensity: number
  ringTextureScale: number
  ringGranularity: number
  ringOpacity: number
}

export type RingRangeValues = Pick<
  RingSettings,
  | 'ringInnerRadius'
  | 'ringOuterRadius'
  | 'ringTilt'
  | 'ringBandCount'
  | 'ringBandSharpness'
  | 'ringDensity'
  | 'ringTextureScale'
  | 'ringGranularity'
  | 'ringOpacity'
>

export type RingRangeKey = keyof RingRangeValues

export const DefaultRingValues: RingSettings = {
  enableRings: false,
  ringPalette: 'iceDust',
  ringInnerRadius: 1.2,
  ringOuterRadius: 1.7,
  ringTilt: 8,
  ringBandCount: 18,
  ringBandSharpness: 0.65,
  ringDensity: 0.72,
  ringTextureScale: 7,
  ringGranularity: 0.35,
  ringOpacity: 0.82,
}

export const RingMinValues: RingRangeValues = {
  ringInnerRadius: 1.05,
  ringOuterRadius: 1.15,
  ringTilt: -45,
  ringBandCount: 2,
  ringBandSharpness: 0,
  ringDensity: 0.05,
  ringTextureScale: 0,
  ringGranularity: 0,
  ringOpacity: 0.05,
}

export const RingMaxValues: RingRangeValues = {
  ringInnerRadius: 2.5,
  ringOuterRadius: 3.5,
  ringTilt: 45,
  ringBandCount: 64,
  ringBandSharpness: 1,
  ringDensity: 1,
  ringTextureScale: 24,
  ringGranularity: 1,
  ringOpacity: 1,
}

export const RingStepValues: RingRangeValues = {
  ringInnerRadius: 0.05,
  ringOuterRadius: 0.05,
  ringTilt: 1,
  ringBandCount: 1,
  ringBandSharpness: 0.05,
  ringDensity: 0.05,
  ringTextureScale: 0.5,
  ringGranularity: 0.05,
  ringOpacity: 0.05,
}

export const RingRangeLabels: Record<RingRangeKey, string> = {
  ringInnerRadius: 'Inner radius',
  ringOuterRadius: 'Outer radius',
  ringTilt: 'Tilt',
  ringBandCount: 'Band count',
  ringBandSharpness: 'Band sharpness',
  ringDensity: 'Density',
  ringTextureScale: 'Texture scale',
  ringGranularity: 'Granularity',
  ringOpacity: 'Opacity',
}

export const RingCliFlagByRangeKey: Record<RingRangeKey, string> = {
  ringInnerRadius: '--ring-inner-radius',
  ringOuterRadius: '--ring-outer-radius',
  ringTilt: '--ring-tilt',
  ringBandCount: '--ring-band-count',
  ringBandSharpness: '--ring-band-sharpness',
  ringDensity: '--ring-density',
  ringTextureScale: '--ring-texture-scale',
  ringGranularity: '--ring-granularity',
  ringOpacity: '--ring-opacity',
}

export const RingCliFlags = {
  enabled: '--rings-enabled',
  palette: '--ring-palette',
} as const

const RING_NUMERIC_SPECS: Record<RingRangeKey, NumericSanitizeSpec> = {
  ringInnerRadius: {
    defaultValue: DefaultRingValues.ringInnerRadius,
    min: RingMinValues.ringInnerRadius,
    max: RingMaxValues.ringInnerRadius,
  },
  ringOuterRadius: {
    defaultValue: DefaultRingValues.ringOuterRadius,
    min: RingMinValues.ringOuterRadius,
    max: RingMaxValues.ringOuterRadius,
  },
  ringTilt: {
    defaultValue: DefaultRingValues.ringTilt,
    min: RingMinValues.ringTilt,
    max: RingMaxValues.ringTilt,
  },
  ringBandCount: {
    defaultValue: DefaultRingValues.ringBandCount,
    min: RingMinValues.ringBandCount,
    max: RingMaxValues.ringBandCount,
    round: true,
  },
  ringBandSharpness: {
    defaultValue: DefaultRingValues.ringBandSharpness,
    min: RingMinValues.ringBandSharpness,
    max: RingMaxValues.ringBandSharpness,
  },
  ringDensity: {
    defaultValue: DefaultRingValues.ringDensity,
    min: RingMinValues.ringDensity,
    max: RingMaxValues.ringDensity,
  },
  ringTextureScale: {
    defaultValue: DefaultRingValues.ringTextureScale,
    min: RingMinValues.ringTextureScale,
    max: RingMaxValues.ringTextureScale,
  },
  ringGranularity: {
    defaultValue: DefaultRingValues.ringGranularity,
    min: RingMinValues.ringGranularity,
    max: RingMaxValues.ringGranularity,
  },
  ringOpacity: {
    defaultValue: DefaultRingValues.ringOpacity,
    min: RingMinValues.ringOpacity,
    max: RingMaxValues.ringOpacity,
  },
}

export function sanitizeRingSettings(input: unknown): RingSettings {
  const raw = toRecord(input)
  const numeric = sanitizeNumericMap(raw, RING_NUMERIC_SPECS)
  const innerRadius = numeric.ringInnerRadius
  const outerRadius = Math.max(innerRadius + 0.05, numeric.ringOuterRadius)

  return {
    ...numeric,
    ringInnerRadius: innerRadius,
    ringOuterRadius: Math.min(RingMaxValues.ringOuterRadius, outerRadius),
    enableRings: sanitizeBoolean(raw, 'enableRings', DefaultRingValues.enableRings),
    ringPalette: sanitizeEnum(raw, 'ringPalette', RingPaletteNames, DefaultRingValues.ringPalette),
  }
}
