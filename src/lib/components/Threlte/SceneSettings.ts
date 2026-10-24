import type { SettingsSchema } from '../../types/settingsSchema'
import { sanitizeWithSchema } from '../../types/settingsSchema'

export type SceneSettings = {
  axialTilt: number
  sunElevation: number
  sunAscension: number
}

export const DefaultSceneValues: SceneSettings = {
  axialTilt: 0,
  sunElevation: 10,
  sunAscension: -70,
}

export const SceneSchema: SettingsSchema<SceneSettings, 'scene'> = {
  axialTilt: {
    kind: 'number',
    label: 'Axial tilt (degrees)',
    cliFlag: '--axial-tilt',
    section: 'scene',
    min: -180,
    max: 180,
    step: 1,
  },
  sunElevation: {
    kind: 'number',
    label: 'Sun elevation (degrees)',
    cliFlag: '--sun-elevation',
    section: 'scene',
    min: -90,
    max: 90,
    step: 1,
  },
  sunAscension: {
    kind: 'number',
    label: 'Sun ascension (degrees)',
    cliFlag: '--sun-ascension',
    section: 'scene',
    min: -180,
    max: 180,
    step: 1,
  },
}

export function sanitizeSceneSettings(input: unknown): SceneSettings {
  return sanitizeWithSchema(SceneSchema, DefaultSceneValues, input)
}

export function sunPosition(elevation: number, ascension: number): [number, number, number] {
  const elevationRadians = (elevation * Math.PI) / 180
  const ascensionRadians = (ascension * Math.PI) / 180
  const distance = Math.sqrt(30)
  const horizontal = distance * Math.cos(elevationRadians)
  return [
    horizontal * Math.sin(ascensionRadians),
    distance * Math.sin(elevationRadians),
    horizontal * Math.cos(ascensionRadians),
  ]
}
