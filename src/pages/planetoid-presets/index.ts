import { iceworldPreset } from './iceworldPreset'
import { ioPreset } from './ioPreset'
import { marsPreset } from './marsPreset'
import { metallicCratersPreset } from './metallicCratersPreset'
import { potatoPreset } from './potatoPreset'
import { rockyClassicPreset } from './rockyClassicPreset'
import { volcanicRiftPreset } from './volcanicRiftPreset'

export type { PlanetoidPreset } from './types'

export const BUILTIN_PRESETS = [
  rockyClassicPreset,
  iceworldPreset,
  marsPreset,
  ioPreset,
  volcanicRiftPreset,
  metallicCratersPreset,
  potatoPreset,
]
