import { GasGiantPalettes, type GasGiantPaletteName } from './GasGiantPalettes'
import { PlanetoidPalettes, type Palette, type PlanetoidPaletteName } from './PlanetoidPalettes'

export type AnyPaletteName = PlanetoidPaletteName | GasGiantPaletteName

export const AllPalettes: Record<AnyPaletteName, Palette> = {
  ...PlanetoidPalettes,
  ...GasGiantPalettes,
}

