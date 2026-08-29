import { bandedNoStormsPreset } from './bandedNoStormsPreset'
import { iceCalmPreset } from './iceCalmPreset'
import { jovianClassicPreset } from './jovianClassicPreset'
import { tempestBeltsPreset } from './tempestBeltsPreset'

export type { GasGiantPreset } from './types'

export const BUILTIN_GAS_GIANT_PRESETS = [
  jovianClassicPreset,
  iceCalmPreset,
  tempestBeltsPreset,
  bandedNoStormsPreset,
]
