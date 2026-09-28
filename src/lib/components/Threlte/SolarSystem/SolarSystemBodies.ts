import { BUILTIN_GAS_GIANT_PRESETS } from '../../../../presets/GasGiants'
import { BUILTIN_PRESETS } from '../../../../presets/Planetoids'
import { createRandom } from '../../../utils/math'

export type SystemBodyKind = 'rocky' | 'giant'

export type SystemBody = {
  id: string
  kind: SystemBodyKind
  presetId: string
  orbitRadius: number
  orbitAngle: number
  orbitInclination: number
  orbitNode: number
  scale: number
  seed: number
}

export type PresetOption = {
  id: string
  name: string
}

export const SystemBodyKinds: readonly SystemBodyKind[] = ['rocky', 'giant']

export const SystemBodyKindLabels: Record<SystemBodyKind, string> = {
  rocky: 'Rocky planet',
  giant: 'Gas / ice giant',
}

export function presetOptionsForKind(kind: SystemBodyKind): PresetOption[] {
  const presets = kind === 'rocky' ? BUILTIN_PRESETS : BUILTIN_GAS_GIANT_PRESETS
  return presets.map((preset) => ({ id: preset.id, name: preset.name }))
}

export function defaultPresetId(kind: SystemBodyKind): string {
  return presetOptionsForKind(kind)[0]?.id ?? ''
}

export function defaultScaleForKind(kind: SystemBodyKind): number {
  return kind === 'rocky' ? 0.32 : 0.8
}

export const DefaultSystemBodies: SystemBody[] = [
  {
    id: 'body-mars',
    kind: 'rocky',
    presetId: 'builtin-mars',
    orbitRadius: 9,
    orbitAngle: 25,
    orbitInclination: 1.8,
    orbitNode: 40,
    scale: 0.32,
    seed: 8123,
  },
  {
    id: 'body-io',
    kind: 'rocky',
    presetId: 'builtin-io',
    orbitRadius: 14,
    orbitAngle: 145,
    orbitInclination: -2.4,
    orbitNode: 130,
    scale: 0.26,
    seed: 51887,
  },
  {
    id: 'body-iceworld',
    kind: 'rocky',
    presetId: 'builtin-iceworld',
    orbitRadius: 20,
    orbitAngle: 265,
    orbitInclination: 2.9,
    orbitNode: 230,
    scale: 0.38,
    seed: 22047,
  },
  {
    id: 'body-jovian',
    kind: 'giant',
    presetId: 'builtin-jovian-classic',
    orbitRadius: 28,
    orbitAngle: 195,
    orbitInclination: -1.2,
    orbitNode: 310,
    scale: 0.85,
    seed: 3391,
  },
  {
    id: 'body-ice-giant',
    kind: 'giant',
    presetId: 'builtin-ice-calm',
    orbitRadius: 37,
    orbitAngle: 55,
    orbitInclination: 2.2,
    orbitNode: 85,
    scale: 0.7,
    seed: 7748,
  },
]

let nextBodyCounter = 0

// Re-rolls orbit placement and size from the system seed. Orbits are rebuilt from scaled
// gaps between neighbours so the bodies keep their order and never cross.
export function applySeededOrbits(bodies: SystemBody[], systemSeed: number): SystemBody[] {
  if (systemSeed === 1) return bodies

  const seeded = new Map<string, SystemBody>()
  let previousBaseRadius = 0
  let previousRadius = 0

  for (const body of [...bodies].sort((a, b) => a.orbitRadius - b.orbitRadius)) {
    const random = createRandom(Math.imul(systemSeed, 7919) ^ body.seed)
    const gap = body.orbitRadius - previousBaseRadius
    const orbitRadius = previousRadius + gap * (0.7 + random() * 0.6)

    previousBaseRadius = body.orbitRadius
    previousRadius = orbitRadius

    seeded.set(body.id, {
      ...body,
      orbitRadius,
      orbitAngle: random() * 360,
      orbitInclination: (random() * 2 - 1) * 3,
      orbitNode: random() * 360,
    })
  }

  return bodies.map((body) => seeded.get(body.id) ?? body)
}

export function createSystemBody(
  existing: SystemBody[],
  kind: SystemBodyKind = 'rocky'
): SystemBody {
  nextBodyCounter += 1

  const outermost = existing.reduce((max, body) => Math.max(max, body.orbitRadius), 6)
  const index = existing.length + nextBodyCounter

  return {
    id: `body-${Date.now()}-${nextBodyCounter}`,
    kind,
    presetId: defaultPresetId(kind),
    orbitRadius: outermost + 8,
    orbitAngle: (index * 73) % 360,
    orbitInclination: ((index % 5) - 2) * 1.1,
    orbitNode: (index * 47) % 360,
    scale: defaultScaleForKind(kind),
    seed: 1000 + index * 1777,
  }
}
