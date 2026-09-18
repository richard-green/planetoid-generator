import type { StarPaletteName } from './StarSettings'

export const StarPalettes: Record<StarPaletteName, readonly [number, number, number][]> = {
  White: [
    [0.15, 0.17, 0.2],
    [0.55, 0.6, 0.67],
    [1, 0.91, 0.65],
  ],
  Blue: [
    [0.05, 0.15, 0.58],
    [0.15, 0.68, 1],
    [0.78, 0.93, 1],
  ],
  Yellow: [
    [0.32, 0.13, 0.002],
    [1, 0.52, 0.015],
    [1, 0.94, 0.38],
  ],
  Orange: [
    [0.52, 0.071, 0.001],
    [1, 0.5, 0.22],
    [1, 0.9, 0.71],
  ],
  Red: [
    [0.74, 0.005, 0.003],
    [1, 0.47, 0.44],
    [1, 0.88, 0.86],
  ],
}
