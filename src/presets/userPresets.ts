import { sanitizeGasGiantSettings } from '../lib/components/Threlte/GasGiant/GasGiantSettings'
import { sanitizePlanetoidPresetSettings } from '../lib/components/Threlte/Planetoid/PlanetoidSettings'
import { sanitizeStarSettings } from '../lib/components/Threlte/Star/StarSettings'
import type { GasGiantPreset } from './GasGiants'
import type { PlanetoidPreset } from './Planetoids'
import type { StarPreset } from './Stars'

export const PLANETOID_PRESETS_STORAGE_KEY = 'planetoid-view-presets-v1'
export const GAS_GIANT_PRESETS_STORAGE_KEY = 'gas-giant-view-presets-v1'
export const STAR_PRESETS_STORAGE_KEY = 'star-view-presets-v1'

type RawPreset = {
  id: string
  name: string
  settings: unknown
}

function readPresetEntries(storageKey: string): RawPreset[] {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.flatMap((entry) => {
      if (typeof entry !== 'object' || entry === null) return []

      const record = entry as Record<string, unknown>
      const id = typeof record.id === 'string' ? record.id.trim() : ''
      const name = typeof record.name === 'string' ? record.name.trim() : ''
      if (!id || !name) return []

      return [{ id, name, settings: record.settings }]
    })
  } catch (error) {
    console.warn(`Failed to read presets from localStorage key ${storageKey}`, error)
    return []
  }
}

export function loadUserPlanetoidPresets(): PlanetoidPreset[] {
  return readPresetEntries(PLANETOID_PRESETS_STORAGE_KEY).map((entry) => ({
    id: entry.id,
    name: entry.name,
    settings: sanitizePlanetoidPresetSettings(entry.settings),
  }))
}

export function loadUserGasGiantPresets(): GasGiantPreset[] {
  return readPresetEntries(GAS_GIANT_PRESETS_STORAGE_KEY).map((entry) => ({
    id: entry.id,
    name: entry.name,
    settings: sanitizeGasGiantSettings(entry.settings),
  }))
}

export function loadUserStarPresets(): StarPreset[] {
  return readPresetEntries(STAR_PRESETS_STORAGE_KEY).map((entry) => ({
    id: entry.id,
    name: entry.name,
    settings: sanitizeStarSettings(entry.settings),
  }))
}
