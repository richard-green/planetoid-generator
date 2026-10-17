import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  DefaultValues as planetoidDefaults,
  PlanetoidSchema,
  sanitizePlanetoidNumber,
} from '../src/lib/components/Threlte/Planetoid/PlanetoidSettings'
import {
  constrainRingRadii,
  DefaultRingValues,
  RingSchema,
  sanitizeRingNumber,
} from '../src/lib/components/Threlte/Rings/RingSettings'
import {
  createNumericSanitizer,
  sanitizeWithSchema,
  type SettingsSchema,
} from '../src/lib/types/settingsSchema'

type Settings = { strength: number; count: number }

const defaults: Settings = { strength: 0.4, count: 2 }
const schema: SettingsSchema<Settings, 'surface'> = {
  strength: {
    kind: 'number',
    label: 'Strength',
    cliFlag: '--strength',
    section: 'surface',
    min: 0,
    max: 1,
    step: 0.1,
  },
  count: {
    kind: 'number',
    label: 'Count',
    cliFlag: '--count',
    section: 'surface',
    min: 0,
    max: 10,
    step: 1,
    integer: true,
  },
}
const sanitizeNumber = createNumericSanitizer(schema, defaults)

test('numeric sanitization uses schema bounds and defaults without snapping to steps', () => {
  for (const value of [undefined, null, NaN, Infinity, -Infinity, '0.7']) {
    assert.equal(sanitizeNumber('strength', value), defaults.strength)
  }
  assert.equal(sanitizeNumber('strength', -1), 0)
  assert.equal(sanitizeNumber('strength', 2), 1)
  assert.equal(sanitizeNumber('strength', 0.37), 0.37)
})

test('integer rounding and full-settings sanitization use the same rules', () => {
  for (const value of [undefined, NaN, -1, 2.6, 20]) {
    const result = sanitizeNumber('count', value)
    assert.equal(result, sanitizeWithSchema(schema, defaults, { count: value }).count)
  }
  assert.equal(sanitizeNumber('count', 2.6), 3)
  assert.equal(sanitizeNumber('count', 20), 10)
})

test('planetoid detail uses schema bounds, integer rounding and defaults', () => {
  const spec = PlanetoidSchema.triangleDetail
  assert.equal(sanitizePlanetoidNumber('triangleDetail', -100), spec.min)
  assert.equal(sanitizePlanetoidNumber('triangleDetail', 100), spec.max)
  assert.equal(sanitizePlanetoidNumber('triangleDetail', spec.min + 0.6), spec.min + 1)
  assert.equal(sanitizePlanetoidNumber('triangleDetail', NaN), planetoidDefaults.triangleDetail)
})

test('ring radii use schema bounds while preserving the minimum gap', () => {
  assert.equal(sanitizeRingNumber('ringInnerRadius', 0), RingSchema.ringInnerRadius.min)
  assert.equal(sanitizeRingNumber('ringInnerRadius', undefined), DefaultRingValues.ringInnerRadius)
  const constrained = constrainRingRadii({
    ...DefaultRingValues,
    ringInnerRadius: 2,
    ringOuterRadius: 1.5,
  })
  assert.equal(constrained.ringOuterRadius, 2.05)
  assert.equal(
    constrainRingRadii({ ...DefaultRingValues, ringOuterRadius: 100 }).ringOuterRadius,
    RingSchema.ringOuterRadius.max
  )
})
