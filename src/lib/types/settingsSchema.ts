import { clamp } from '../utils/math'
import { sanitizeBoolean, sanitizeEnum, sanitizeHexColor, toRecord } from '../utils/sanitize'
import { sanitizeTextureSize, type TextureSize } from './textureSize'

/**
 * Single source of truth for a settings type. `SettingsSchema<T, Section>` requires exactly one
 * spec per key of `T`, and the spec shape is chosen from the value type, so adding a property to a
 * settings type fails to compile until its UI section, label, CLI flag and (for numbers) min/max/step
 * are declared. Persistence, CLI parsing/export and UI control lists are all derived from it.
 */

export type CliFlag = `--${string}`

type FieldBase<Section extends string> = {
  label: string
  cliFlag: CliFlag
  section: Section
}

export type NumberFieldSpec<Section extends string = string> = FieldBase<Section> & {
  kind: 'number'
  min: number
  max: number
  step: number
  integer?: boolean
}

export type BooleanFieldSpec<Section extends string = string> = FieldBase<Section> & {
  kind: 'boolean'
  /** The checkbox in the section header that enables/disables this field's whole section. */
  togglesSection?: boolean
}

export type EnumFieldSpec<
  V extends string = string,
  Section extends string = string,
> = FieldBase<Section> & {
  kind: 'enum'
  options: readonly V[]
}

export type ColorFieldSpec<Section extends string = string> = FieldBase<Section> & {
  kind: 'color'
}

export type TextureSizeFieldSpec<Section extends string = string> = FieldBase<Section> & {
  kind: 'textureSize'
}

export type CustomFieldSpec<V = unknown, Section extends string = string> = FieldBase<Section> & {
  kind: 'custom'
  /** Value placeholder shown in CLI help, e.g. `<style=weight,...>`. */
  cliHint: string
  // Method syntax keeps these bivariant so specific specs widen to CustomFieldSpec<unknown>.
  sanitize(value: unknown, fallback: V): V
  formatCli(value: V): string
  parseCli(text: string): V
}

type FieldKindOf<V> = [V] extends [boolean]
  ? 'boolean'
  : [V] extends [TextureSize]
    ? 'textureSize'
    : [V] extends [number]
      ? number extends V
        ? 'number'
        : never
      : [V] extends [string]
        ? string extends V
          ? 'color'
          : 'enum'
        : 'custom'

type SpecByKind<V, Section extends string> = {
  boolean: BooleanFieldSpec<Section>
  textureSize: TextureSizeFieldSpec<Section>
  number: NumberFieldSpec<Section>
  color: ColorFieldSpec<Section>
  enum: EnumFieldSpec<V & string, Section>
  custom: CustomFieldSpec<V, Section>
}

export type FieldKind = keyof SpecByKind<unknown, string>

export type FieldSpecFor<V, Section extends string> = SpecByKind<V, Section>[FieldKindOf<V>]

export type SettingsSchema<T, Section extends string> = {
  [K in keyof T]-?: FieldSpecFor<T[K], Section>
}

export type KeysOfKind<T, Kind extends FieldKind> = {
  [K in keyof T]-?: FieldKindOf<T[K]> extends Kind ? K : never
}[keyof T] &
  string

export type NumericKeys<T> = KeysOfKind<T, 'number'>

export type AnyFieldSpec =
  | NumberFieldSpec
  | BooleanFieldSpec
  | EnumFieldSpec
  | ColorFieldSpec
  | TextureSizeFieldSpec
  | CustomFieldSpec

/** Untyped view of a schema's fields for generic runtime iteration (declaration order). */
export function schemaFields(schema: object) {
  return Object.entries(schema) as [string, AnyFieldSpec][]
}

export function keysOfKind<T, Section extends string, Kind extends FieldKind>(
  schema: SettingsSchema<T, Section>,
  kind: Kind
): KeysOfKind<T, Kind>[] {
  return schemaFields(schema)
    .filter(([, spec]) => spec.kind === kind)
    .map(([key]) => key as KeysOfKind<T, Kind>)
}

export function numericTable<T, Section extends string>(
  schema: SettingsSchema<T, Section>,
  property: 'min' | 'max' | 'step'
): Record<NumericKeys<T>, number> {
  return Object.fromEntries(
    schemaFields(schema).flatMap(([key, spec]) =>
      spec.kind === 'number' ? [[key, spec[property]]] : []
    )
  ) as Record<NumericKeys<T>, number>
}

export function numericLabels<T, Section extends string>(
  schema: SettingsSchema<T, Section>
): Record<NumericKeys<T>, string> {
  return Object.fromEntries(
    schemaFields(schema).flatMap(([key, spec]) =>
      spec.kind === 'number' ? [[key, spec.label]] : []
    )
  ) as Record<NumericKeys<T>, string>
}

/** Numeric keys grouped by UI section, in schema declaration order. */
export function numericKeysBySection<T, Section extends string>(
  schema: SettingsSchema<T, Section>,
  sections: readonly Section[]
): Record<Section, NumericKeys<T>[]> {
  const result = Object.fromEntries(sections.map((section) => [section, []])) as unknown as Record<
    Section,
    NumericKeys<T>[]
  >

  for (const [key, spec] of schemaFields(schema)) {
    if (spec.kind !== 'number') continue
    const bucket = result[spec.section as Section]
    if (!bucket) throw new Error(`Setting "${key}" uses unknown section "${spec.section}"`)
    bucket.push(key as NumericKeys<T>)
  }

  return result
}

export function sanitizeWithSchema<T, Section extends string>(
  schema: SettingsSchema<T, Section>,
  defaults: T,
  input: unknown
): T {
  const raw = toRecord(input)
  const fallbacks = defaults as Record<string, unknown>
  const result: Record<string, unknown> = {}

  for (const [key, spec] of schemaFields(schema)) {
    const fallback = fallbacks[key]
    const value = raw[key]

    switch (spec.kind) {
      case 'number': {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          result[key] = fallback
          break
        }
        const clamped = clamp(value, spec.min, spec.max)
        result[key] = spec.integer ? Math.round(clamped) : clamped
        break
      }
      case 'boolean':
        result[key] = sanitizeBoolean(raw, key, fallback as boolean)
        break
      case 'enum':
        result[key] = sanitizeEnum(raw, key, spec.options, fallback as string)
        break
      case 'color':
        result[key] = sanitizeHexColor(raw, key, fallback as string)
        break
      case 'textureSize':
        result[key] = sanitizeTextureSize(value, fallback as TextureSize)
        break
      case 'custom':
        result[key] = spec.sanitize(value, fallback)
        break
    }
  }

  return result as T
}

export function formatCliValue(spec: AnyFieldSpec, value: unknown): string {
  switch (spec.kind) {
    case 'number':
    case 'textureSize':
      return String(value)
    case 'boolean':
      return value ? 'true' : 'false'
    case 'enum':
      return String(value)
    case 'color':
      return JSON.stringify(value)
    case 'custom':
      return JSON.stringify(spec.formatCli(value))
  }
}

/** `--flag value` pairs for every setting, so a CLI export can never silently omit a field. */
export function toCliArgs<T, Section extends string>(
  schema: SettingsSchema<T, Section>,
  settings: T,
  exclude: readonly (keyof T)[] = []
): string[] {
  const values = settings as Record<string, unknown>
  return schemaFields(schema)
    .filter(([key]) => !exclude.includes(key as keyof T))
    .flatMap(([key, spec]) => [spec.cliFlag, formatCliValue(spec, values[key])])
}

/** DOM id of the input bound to a setting; the CLI scripts locate controls by this id. */
export function settingControlId(key: string) {
  return `setting-${key}`
}

type ElementLookup = { getElementById(id: string): unknown }

export function findMissingSettingControls<T, Section extends string>(
  schema: SettingsSchema<T, Section>,
  root: ElementLookup
): string[] {
  return Object.keys(schema).filter((key) => !root.getElementById(settingControlId(key)))
}

/** Dev-only check that every schema field has a rendered control. */
export function reportMissingSettingControls<T, Section extends string>(
  schema: SettingsSchema<T, Section>,
  name: string,
  root: ElementLookup
) {
  const missing = findMissingSettingControls(schema, root)
  if (missing.length > 0) {
    console.error(
      `${name} settings have no UI control (expected element ids ${missing.map(settingControlId).join(', ')})`
    )
  }
}

/** Fails fast on spec values the type system cannot check (ranges, defaults, duplicate flags). */
export function assertValidSchema<T, Section extends string>(
  schema: SettingsSchema<T, Section>,
  defaults: T,
  name: string
) {
  const errors: string[] = []
  const values = defaults as Record<string, unknown>
  const flags = new Map<string, string>()

  for (const [key, spec] of schemaFields(schema)) {
    const existing = flags.get(spec.cliFlag)
    if (existing) errors.push(`${key}: CLI flag ${spec.cliFlag} already used by ${existing}`)
    flags.set(spec.cliFlag, key)

    const value = values[key]
    if (spec.kind === 'number') {
      if (!(spec.min < spec.max))
        errors.push(`${key}: min (${spec.min}) must be < max (${spec.max})`)
      if (!(spec.step > 0)) errors.push(`${key}: step must be > 0`)
      if (typeof value !== 'number' || value < spec.min || value > spec.max) {
        errors.push(`${key}: default ${String(value)} is outside [${spec.min}, ${spec.max}]`)
      }
      if (spec.integer && !Number.isInteger(value)) {
        errors.push(`${key}: default ${String(value)} must be an integer`)
      }
    }
    if (spec.kind === 'enum' && !spec.options.includes(value as string)) {
      errors.push(`${key}: default ${String(value)} is not one of its options`)
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid ${name} settings schema:\n  ${errors.join('\n  ')}`)
  }
}
