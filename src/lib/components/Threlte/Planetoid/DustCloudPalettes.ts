import type { Palette } from '../../../types/palette'

export const DustCloudPaletteNames = [
  'silicate',
  'ferric',
  'sulfur',
  'carbon',
  'verdigris',
] as const

export type DustCloudPaletteName = (typeof DustCloudPaletteNames)[number]

export const DustCloudPaletteLabels: Record<DustCloudPaletteName, string> = {
  silicate: 'Silicate haze',
  ferric: 'Ferric dust',
  sulfur: 'Sulfur veil',
  carbon: 'Carbon ash',
  verdigris: 'Verdigris mist',
}

export const DustCloudPalettes: Record<DustCloudPaletteName, Palette> = {
  silicate: [
    { r: 104, g: 101, b: 91 },
    { r: 170, g: 165, b: 151 },
    { r: 222, g: 216, b: 199 },
    { r: 250, g: 242, b: 220 },
  ],
  ferric: [
    { r: 79, g: 35, b: 25 },
    { r: 152, g: 64, b: 37 },
    { r: 211, g: 112, b: 61 },
    { r: 247, g: 181, b: 112 },
  ],
  sulfur: [
    { r: 82, g: 70, b: 31 },
    { r: 156, g: 135, b: 47 },
    { r: 218, g: 194, b: 85 },
    { r: 252, g: 237, b: 160 },
  ],
  carbon: [
    { r: 43, g: 48, b: 49 },
    { r: 82, g: 91, b: 91 },
    { r: 137, g: 143, b: 137 },
    { r: 201, g: 198, b: 181 },
  ],
  verdigris: [
    { r: 35, g: 70, b: 66 },
    { r: 63, g: 123, b: 111 },
    { r: 113, g: 177, b: 152 },
    { r: 198, g: 222, b: 184 },
  ],
}
