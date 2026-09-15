export type StarPaletteName = 'White' | 'Blue' | 'Yellow' | 'Orange' | 'Red'

export type StarSettings = {
  seed: number
  palette: StarPaletteName
  brightness: number
  limbBrightness: number
  textureScale: number
  bandContrast: number
  bandSwirl: number
  granularity: number
  turbulence: number
  convection: number
  sunspotCount: number
  sunspotScale: number
  sunspotJaggedness: number
  sunspotNeighbours: number
  autoRotate: boolean
}

export type StarRangeValues = Pick<
  StarSettings,
  | 'seed'
  | 'brightness'
  | 'limbBrightness'
  | 'textureScale'
  | 'bandContrast'
  | 'bandSwirl'
  | 'granularity'
  | 'turbulence'
  | 'convection'
  | 'sunspotCount'
  | 'sunspotScale'
  | 'sunspotJaggedness'
  | 'sunspotNeighbours'
>

export type StarRangeKey = keyof StarRangeValues

export const CurrentStarSettingsBackup: Readonly<StarSettings> = {
  seed: 1842,
  palette: 'Blue',
  brightness: 1.7,
  limbBrightness: 0.8,
  textureScale: 4,
  bandContrast: 0.35,
  bandSwirl: 1,
  granularity: 4,
  turbulence: 1.7,
  convection: 0.6,
  sunspotCount: 12,
  sunspotScale: 0.5,
  sunspotJaggedness: 0.3,
  sunspotNeighbours: 5,
  autoRotate: true,
}

export const DefaultValues: StarSettings = { ...CurrentStarSettingsBackup }

export const MinValues: StarRangeValues = {
  seed: 0,
  brightness: 0.1,
  limbBrightness: 0,
  textureScale: 0.2,
  bandContrast: 0,
  bandSwirl: 0,
  granularity: 0.2,
  turbulence: 0,
  convection: 0,
  sunspotCount: 0,
  sunspotScale: 0.25,
  sunspotJaggedness: 0,
  sunspotNeighbours: 0,
}

export const MaxValues: StarRangeValues = {
  seed: 100000,
  brightness: 3,
  limbBrightness: 3,
  textureScale: 4,
  bandContrast: 1,
  bandSwirl: 1,
  granularity: 4,
  turbulence: 2,
  convection: 1,
  sunspotCount: 12,
  sunspotScale: 3,
  sunspotJaggedness: 2,
  sunspotNeighbours: 7,
}

export const StepValues: StarRangeValues = {
  seed: 1,
  brightness: 0.1,
  limbBrightness: 0.1,
  textureScale: 0.1,
  bandContrast: 0.05,
  bandSwirl: 0.05,
  granularity: 0.1,
  turbulence: 0.1,
  convection: 0.1,
  sunspotCount: 1,
  sunspotScale: 0.1,
  sunspotJaggedness: 0.1,
  sunspotNeighbours: 1,
}

export const DefaultStarSettings = DefaultValues