import type { StarPaletteName } from './StarSettings'

// Every palette follows the Yellow value/saturation profile (dark base, full-value mid,
// desaturated highlight) so stellar classes only differ by hue.
export const StarPalettes: Record<StarPaletteName, readonly [number, number, number][]> = {
  White: [
    [0.2, 0.4, 0.5],
    [0.88, 0.92, 1],
    [0.88, 0.92, 1],
    [0.88, 0.92, 1],
    [0.88, 0.92, 1],
    [0.88, 0.92, 1],
    [0.45, 0.798, 1],
  ],
  Blue: [
    [0.035, 0.106, 0.32],
    [0.12, 0.531, 1],
    [0.88, 0.92, 1],
    [0.45, 0.798, 1],
  ],
  Yellow: [
    [0.32, 0.13, 0.002],
    [1, 0.52, 0.015],
    [1, 0.94, 0.38],
  ],
  Orange: [
    [0.32, 0.082, 0.003],
    [1, 0.34, 0.015],
    [1, 0.76, 0.58],
  ],
  Red: [
    [0.12, 0.002, 0.004],
    [0.65, 0.03, 0.02],
    [0.9, 0.16, 0.18],
    [1, 0.42, 0.015],
  ],
}
