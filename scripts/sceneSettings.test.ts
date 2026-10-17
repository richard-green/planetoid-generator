import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DefaultSceneValues, sunPosition } from '../src/lib/components/Threlte/SceneSettings'
import {
  DefaultValues as gasDefaults,
  GasGiantSchema,
} from '../src/lib/components/Threlte/GasGiant/GasGiantSettings'
import {
  DefaultValues as planetoidDefaults,
  PlanetoidSchema,
} from '../src/lib/components/Threlte/Planetoid/PlanetoidSettings'
import { sanitizeWithSchema, toCliArgs } from '../src/lib/types/settingsSchema'

test('scene sun defaults preserve the original light position', () => {
  const position = sunPosition(DefaultSceneValues.sunElevation, DefaultSceneValues.sunAscension)
  for (const [index, expected] of [-5, 1, 2].entries()) {
    assert.ok(Math.abs(position[index] - expected) < 1e-12)
  }
})

test('scene sun angles cover the horizon and both poles at a constant distance', () => {
  const distance = Math.sqrt(30)
  for (const [elevation, ascension, expected] of [
    [0, 0, [0, 0, distance]],
    [0, 90, [distance, 0, 0]],
    [0, -90, [-distance, 0, 0]],
    [90, 45, [0, distance, 0]],
    [-90, -45, [0, -distance, 0]],
  ] as const) {
    const position = sunPosition(elevation, ascension)
    for (const [index, value] of expected.entries()) {
      assert.ok(Math.abs(position[index] - value) < 1e-12)
    }
    assert.ok(Math.abs(Math.hypot(...position) - distance) < 1e-12)
  }
})

test('scene controls sanitize and export consistently for both body types', () => {
  for (const [schema, defaults] of [
    [GasGiantSchema, gasDefaults],
    [PlanetoidSchema, planetoidDefaults],
  ] as const) {
    for (const key of ['axialTilt', 'sunElevation', 'sunAscension'] as const) {
      const spec = schema[key]
      assert.equal(spec.section, 'scene')
      assert.equal(sanitizeWithSchema(schema, defaults, {})[key], DefaultSceneValues[key])
      assert.equal(sanitizeWithSchema(schema, defaults, { [key]: Infinity })[key], defaults[key])
      assert.equal(sanitizeWithSchema(schema, defaults, { [key]: -999 })[key], spec.min)
      assert.equal(sanitizeWithSchema(schema, defaults, { [key]: 999 })[key], spec.max)
      const args = toCliArgs(schema, defaults)
      assert.equal(Number(args[args.indexOf(spec.cliFlag) + 1]), defaults[key])
    }
  }
  assert.equal(gasDefaults.ringTilt, 0)
})
