import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DefaultValues } from '../src/lib/components/Threlte/Star/StarSettings'
import { yellowDwarfPreset } from '../src/presets/Stars/yellowDwarfPreset'

test('default star settings match the yellow dwarf preset', () => {
  assert.deepEqual(DefaultValues, yellowDwarfPreset.settings)
  assert.equal(DefaultValues.palette, 'Yellow')
  assert.equal(DefaultValues.saturation, 1)
  assert.equal(DefaultValues.colorTextureSize, 2048)
})
