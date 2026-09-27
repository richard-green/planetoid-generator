import type { Palette } from '../../../types/palette'

export const AtmospherePaletteNames = [
  'terran',
  'martian',
  'venusian',
  'titan',
  'glacial',
  'toxic',
] as const

export type AtmospherePaletteName = (typeof AtmospherePaletteNames)[number]

export const AtmospherePaletteLabels: Record<AtmospherePaletteName, string> = {
  terran: 'Terran sky',
  martian: 'Martian dusk',
  venusian: 'Venusian haze',
  titan: 'Titan smog',
  glacial: 'Glacial aurora',
  toxic: 'Toxic bloom',
}

// Stops run from the terminator (0) to the fully sunlit limb (1).
export const AtmospherePalettes: Record<AtmospherePaletteName, Palette> = {
  terran: [
    { r: 255, g: 96, b: 40 },
    { r: 255, g: 176, b: 120, position: 0.18 },
    { r: 120, g: 176, b: 255, position: 0.45 },
    { r: 70, g: 130, b: 255 },
  ],
  martian: [
    { r: 80, g: 130, b: 230 },
    { r: 196, g: 170, b: 150, position: 0.3 },
    { r: 226, g: 150, b: 100, position: 0.65 },
    { r: 240, g: 176, b: 120 },
  ],
  venusian: [
    { r: 196, g: 100, b: 36 },
    { r: 240, g: 186, b: 90, position: 0.4 },
    { r: 255, g: 236, b: 170 },
  ],
  titan: [
    { r: 120, g: 60, b: 20 },
    { r: 206, g: 126, b: 48, position: 0.45 },
    { r: 240, g: 184, b: 96 },
  ],
  glacial: [
    { r: 136, g: 90, b: 230 },
    { r: 110, g: 200, b: 255, position: 0.4 },
    { r: 206, g: 246, b: 255 },
  ],
  toxic: [
    { r: 210, g: 160, b: 40 },
    { r: 140, g: 220, b: 80, position: 0.4 },
    { r: 90, g: 255, b: 170 },
  ],
}
