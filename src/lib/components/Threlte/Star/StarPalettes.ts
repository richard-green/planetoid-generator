import type { StarPaletteName } from './StarSettings'

// Every palette follows the Yellow value/saturation profile (dark base, full-value mid,
// desaturated highlight) so stellar classes only differ by hue.
export const StarPalettes: Record<StarPaletteName, readonly [number, number, number][]> = {
  White: [
    [0.176, 0.248, 0.32],
    [0.65, 0.8, 1],
    [0.88, 0.92, 1],
  ],
  Blue: [
    [0.035, 0.106, 0.32],
    [0.12, 0.531, 1],
    [0.45, 0.798, 1],
  ],
  Yellow: [
    [0.32, 0.13, 0.002],
    [1, 0.52, 0.015],
    [1, 0.94, 0.38],
  ],
  Orange: [
    [0.32, 0.082, 0.003],
    [1, 0.44, 0.015],
    [1, 0.86, 0.38],
  ],
  Red: [
    [0.22, 0.002, 0.004],
    [0.75, 0.03, 0.02],
    [1, 0.26, 0.18],
  ],
}
