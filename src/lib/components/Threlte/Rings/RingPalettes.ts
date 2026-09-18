import type { Palette } from '../../../types/palette'

export const RingPaletteNames = ['iceDust', 'amberBands', 'graphite'] as const

export type RingPaletteName = (typeof RingPaletteNames)[number]

export const RingPalettes: Record<RingPaletteName, Palette> = {
  iceDust: [
    { r: 27, g: 38, b: 58 },
    { r: 63, g: 91, b: 118 },
    { r: 125, g: 151, b: 160 },
    { r: 211, g: 217, b: 204 },
    { r: 240, g: 213, b: 159 },
    { r: 151, g: 180, b: 194 },
    { r: 224, g: 235, b: 231 },
    { r: 91, g: 112, b: 133 },
  ],
  amberBands: [
    { r: 43, g: 25, b: 30 },
    { r: 102, g: 52, b: 37 },
    { r: 178, g: 103, b: 53 },
    { r: 231, g: 177, b: 101 },
    { r: 117, g: 137, b: 130 },
    { r: 239, g: 218, b: 169 },
    { r: 157, g: 81, b: 54 },
    { r: 67, g: 49, b: 58 },
  ],
  graphite: [
    { r: 13, g: 18, b: 27 },
    { r: 39, g: 52, b: 65 },
    { r: 86, g: 91, b: 96 },
    { r: 168, g: 157, b: 139 },
    { r: 78, g: 106, b: 111 },
    { r: 205, g: 195, b: 169 },
    { r: 105, g: 82, b: 83 },
    { r: 31, g: 35, b: 43 },
  ],
}
