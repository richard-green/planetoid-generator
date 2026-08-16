import type { Palette } from './PlanetoidPalettes'

export const GasGiantPaletteNames = [
  'jovianBands',
  'stormAzure',
  'ammoniaClouds',
  'iceGiantTeal',
] as const

export type GasGiantPaletteName = (typeof GasGiantPaletteNames)[number]

export const GasGiantPalettes: Record<GasGiantPaletteName, Palette> = {
  jovianBands: [
    { r: 50, g: 34, b: 24 },
    { r: 98, g: 70, b: 48 },
    { r: 146, g: 108, b: 72 },
    { r: 194, g: 154, b: 110 },
    { r: 218, g: 188, b: 142 },
    { r: 171, g: 118, b: 84 },
    { r: 126, g: 88, b: 66 },
    { r: 86, g: 58, b: 44 },
    { r: 232, g: 210, b: 178 },
  ],
  stormAzure: [
    { r: 16, g: 29, b: 48 },
    { r: 31, g: 54, b: 87 },
    { r: 48, g: 82, b: 124 },
    { r: 74, g: 114, b: 160 },
    { r: 106, g: 150, b: 194 },
    { r: 82, g: 126, b: 172 },
    { r: 58, g: 95, b: 140 },
    { r: 40, g: 71, b: 109 },
    { r: 140, g: 181, b: 218 },
  ],
  ammoniaClouds: [
    { r: 38, g: 36, b: 44 },
    { r: 78, g: 74, b: 88 },
    { r: 124, g: 116, b: 132 },
    { r: 171, g: 162, b: 178 },
    { r: 214, g: 208, b: 220 },
    { r: 239, g: 234, b: 242 },
    { r: 198, g: 190, b: 208 },
    { r: 154, g: 146, b: 166 },
    { r: 98, g: 94, b: 112 },
  ],
  iceGiantTeal: [
    { r: 12, g: 32, b: 46 },
    { r: 18, g: 58, b: 74 },
    { r: 26, g: 89, b: 108 },
    { r: 40, g: 124, b: 144 },
    { r: 68, g: 164, b: 182 },
    { r: 110, g: 201, b: 210 },
    { r: 142, g: 220, b: 224 },
    { r: 88, g: 184, b: 194 },
    { r: 50, g: 142, b: 160 },
  ],
}

