import { iceworldPreset } from './iceworldPreset'
import { ioPreset } from './ioPreset'
import { marsPreset } from './marsPreset'
import { marsWinterPreset } from './marsWinterPreset'
import { metallicCratersPreset } from './metallicCratersPreset'
import { mineralAsteroidPreset } from './mineralAsteroid'
import { noxiousPreset } from './noxiousPreset'
import { potatoPreset } from './potatoPreset'
import { rockyClassicPreset } from './rockyClassicPreset'
import { volcanicRiftPreset } from './volcanicRiftPreset'

export type { PlanetoidPreset } from './types'

export const BUILTIN_PRESETS = [
  rockyClassicPreset,
  iceworldPreset,
  marsPreset,
  marsWinterPreset,
  ioPreset,
  noxiousPreset,
  volcanicRiftPreset,
  metallicCratersPreset,
  mineralAsteroidPreset,
  potatoPreset,
]
