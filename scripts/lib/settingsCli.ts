import type { Page } from 'playwright'
import {
  formatCliValue,
  schemaFields,
  settingControlId,
  type AnyFieldSpec,
  type SettingsSchema,
} from '../../src/lib/types/settingsSchema'
import { TextureSizes, type TextureSize } from '../../src/lib/types/textureSize'

/** Flags owned by the scripts themselves; settings schemas must not reuse them. */
export const SCRIPT_FLAGS = [
  '--count',
  '--seed',
  '--step',
  '--base-url',
  '--output-dir',
  '--frame-settle-ms',
  '--texture-size',
  '--export-textures',
  '--camera-distance',
  '--camera-elevation',
  '--camera-azimuth',
  '--camera-azimuth-step',
  '--help',
] as const

export function parseBooleanArg(value: string, name: string) {
  const normalized = value.trim().toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'off'].includes(normalized)) return false

  throw new Error(`Invalid ${name}: ${value}. Expected true or false.`)
}

export function parseTextureSizeArg(value: string, name = 'texture-size'): TextureSize {
  const parsed = Number(value)
  if (!(TextureSizes as readonly number[]).includes(parsed)) {
    throw new Error(`Invalid ${name}: ${value}. Expected one of: ${TextureSizes.join(', ')}`)
  }

  return parsed as TextureSize
}

function parseHexColorArg(value: string, name: string) {
  const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(value.trim())
  if (!match) {
    throw new Error(`${name} must be a hex color like #abc or #aabbcc. Received: ${value}`)
  }

  const hex = match[1].toLowerCase()
  return `#${hex.length === 3 ? [...hex].map((channel) => channel + channel).join('') : hex}`
}

function parseFieldValue(spec: AnyFieldSpec, text: string): unknown {
  const name = spec.cliFlag.slice(2)

  switch (spec.kind) {
    case 'number': {
      const value = Number(text)
      if (text.trim() === '' || !Number.isFinite(value)) throw new Error(`Invalid ${name}: ${text}`)
      if (value < spec.min || value > spec.max) {
        throw new Error(`${name} must be between ${spec.min} and ${spec.max}. Received: ${text}`)
      }
      return value
    }
    case 'boolean':
      return parseBooleanArg(text, name)
    case 'enum': {
      const match = spec.options.find(
        (option) => option.toLowerCase() === text.trim().toLowerCase()
      )
      if (!match) {
        throw new Error(
          `${name} is invalid. Received: ${text}. Valid values: ${spec.options.join(', ')}`
        )
      }
      return match
    }
    case 'color':
      return parseHexColorArg(text, name)
    case 'textureSize':
      return parseTextureSizeArg(text, name)
    case 'custom':
      return spec.parseCli(text)
  }
}

function describeValue(spec: AnyFieldSpec) {
  switch (spec.kind) {
    case 'number':
      return `<n> (${spec.min} to ${spec.max}${spec.integer ? ', integer' : ''})`
    case 'boolean':
      return '<bool>'
    case 'enum':
      return `<${spec.options.join(' | ')}>`
    case 'color':
      return '<hex>'
    case 'textureSize':
      return `<${TextureSizes.join(' | ')}>`
    case 'custom':
      return spec.cliHint
  }
}

/** Every schema field becomes a `--flag value` option, validated against its spec. */
export function createSettingsCli<T, Section extends string>(
  schema: SettingsSchema<T, Section>,
  options: {
    exclude?: readonly (keyof T & string)[]
    aliases?: Record<string, keyof T & string>
  } = {}
) {
  const excluded = new Set<string>(options.exclude ?? [])
  const fields = schemaFields(schema).filter(([key]) => !excluded.has(key))
  const fieldByFlag = new Map<string, [string, AnyFieldSpec]>()

  for (const field of fields) {
    const flag = field[1].cliFlag
    if ((SCRIPT_FLAGS as readonly string[]).includes(flag)) {
      throw new Error(`Setting "${field[0]}" uses reserved CLI flag ${flag}`)
    }
    fieldByFlag.set(flag, field)
  }

  for (const [alias, key] of Object.entries(options.aliases ?? {})) {
    const field = fields.find(([fieldKey]) => fieldKey === key)
    if (field) fieldByFlag.set(alias, field)
  }

  return {
    /** Returns false when `flag` is not a settings flag. */
    tryParse(overrides: Partial<T>, flag: string, value: string | undefined) {
      const field = fieldByFlag.get(flag)
      if (!field) return false
      if (value === undefined) throw new Error(`Missing value for ${flag}`)

      ;(overrides as Record<string, unknown>)[field[0]] = parseFieldValue(field[1], value)
      return true
    },
    helpLines: fields.map(([, spec]) => `  ${spec.cliFlag} ${describeValue(spec)}  ${spec.label}`),
  }
}

export function describeOverrides<T, Section extends string>(
  schema: SettingsSchema<T, Section>,
  overrides: Partial<T>
) {
  const values = overrides as Record<string, unknown>
  return schemaFields(schema)
    .filter(([key]) => values[key] !== undefined)
    .map(([key, spec]) => `${key}=${formatCliValue(spec, values[key])}`)
    .join(', ')
}

function settingLocator(page: Page, key: string) {
  return page.locator(`#${settingControlId(key)}`)
}

/** Fails if any schema field has no (or an ambiguous) control in the rendered page. */
export async function assertAllSettingControlsPresent<T, Section extends string>(
  page: Page,
  schema: SettingsSchema<T, Section>
) {
  const problems: string[] = []
  for (const key of Object.keys(schema)) {
    const count = await settingLocator(page, key).count()
    if (count !== 1) problems.push(`${key} (#${settingControlId(key)} matched ${count})`)
  }

  if (problems.length > 0) {
    throw new Error(`UI controls missing for settings: ${problems.join(', ')}`)
  }
}

/** Overriding any field in a toggleable section also enables that section unless set explicitly. */
export function withSectionsEnabled<T, Section extends string>(
  schema: SettingsSchema<T, Section>,
  overrides: Partial<T>
): Partial<T> {
  const values: Record<string, unknown> = { ...overrides }
  const fields = schemaFields(schema)
  const isSectionToggle = (spec: AnyFieldSpec) => spec.kind === 'boolean' && !!spec.togglesSection
  const sections = new Set(
    fields
      .filter(([key, spec]) => values[key] !== undefined && !isSectionToggle(spec))
      .map(([, spec]) => spec.section)
  )

  for (const [key, spec] of fields) {
    if (isSectionToggle(spec) && sections.has(spec.section) && values[key] === undefined) {
      values[key] = true
    }
  }

  return values as Partial<T>
}

type AutomationWindow = {
  __applySettings?: (overrides: unknown) => Promise<void>
  __setCameraView?: (view: unknown) => Promise<void>
}

/** Applies all overrides in one state update via the page's `window.__applySettings` hook. */
export async function applySettings(page: Page, overrides: Record<string, unknown>) {
  await page.waitForFunction(
    () => typeof (globalThis as AutomationWindow).__applySettings === 'function'
  )
  await page.evaluate(
    (values) => (globalThis as AutomationWindow).__applySettings?.(values),
    overrides
  )
}

/** Positions the scene camera via the page's `window.__setCameraView` hook. */
export async function setCameraView(page: Page, view: Record<string, number | undefined>) {
  await page.waitForFunction(
    () => typeof (globalThis as AutomationWindow).__setCameraView === 'function'
  )
  await page.evaluate((value) => (globalThis as AutomationWindow).__setCameraView?.(value), view)
}
