import type { Palette } from '../../../types/palette'

export const IceCapPaletteNames = ['glacial', 'snow', 'dusty'] as const
export type IceCapPaletteName = (typeof IceCapPaletteNames)[number]

export const IceCapPaletteLabels: Record<IceCapPaletteName, string> = {
  glacial: 'Glacial ice',
  snow: 'Fresh snow',
  dusty: 'Dusty ice',
}

export const IceCapPalettes: Record<IceCapPaletteName, Palette> = {
  glacial: [
    { r: 54, g: 107, b: 137, position: 0 },
    { r: 121, g: 183, b: 204, position: 0.3 },
    { r: 204, g: 232, b: 240, position: 0.6 },
    { r: 247, g: 252, b: 255, position: 1 },
  ],
  snow: [
    { r: 143, g: 165, b: 181, position: 0 },
    { r: 214, g: 226, b: 235, position: 0.3 },
    { r: 246, g: 249, b: 252, position: 0.65 },
    { r: 255, g: 255, b: 255, position: 1 },
  ],
  dusty: [
    { r: 102, g: 94, b: 88, position: 0 },
    { r: 166, g: 157, b: 144, position: 0.3 },
    { r: 223, g: 220, b: 208, position: 0.65 },
    { r: 250, g: 249, b: 242, position: 1 },
  ],
}