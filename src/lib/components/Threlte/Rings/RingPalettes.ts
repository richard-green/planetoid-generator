import type { Palette } from '../../../types/palette'

export const RingPaletteNames = ['iceDust', 'amberBands', 'graphite'] as const

export type RingPaletteName = (typeof RingPaletteNames)[number]

export const RingPalettes: Record<RingPaletteName, Palette> = {
  iceDust: [
    { r: 57, g: 67, b: 78 },
    { r: 126, g: 139, b: 148 },
    { r: 210, g: 218, b: 218 },
    { r: 238, g: 232, b: 211 },
  ],
  amberBands: [
    { r: 52, g: 38, b: 29 },
    { r: 116, g: 78, b: 46 },
    { r: 190, g: 143, b: 82 },
    { r: 229, g: 205, b: 158 },
  ],
  graphite: [
    { r: 20, g: 23, b: 28 },
    { r: 54, g: 60, b: 68 },
    { r: 112, g: 118, b: 123 },
    { r: 181, g: 179, b: 168 },
  ],
}
