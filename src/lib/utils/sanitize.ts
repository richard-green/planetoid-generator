export type UnknownRecord = Record<string, unknown>

export function toRecord(input: unknown): UnknownRecord {
  return typeof input === 'object' && input !== null ? (input as UnknownRecord) : {}
}

export function sanitizeBoolean(raw: UnknownRecord, key: string, fallback: boolean) {
  return typeof raw[key] === 'boolean' ? (raw[key] as boolean) : fallback
}

export function sanitizeEnum<T extends string>(
  raw: UnknownRecord,
  key: string,
  allowed: readonly T[],
  fallback: T
): T {
  const value = raw[key]
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback
}

export function sanitizeHexColor(raw: UnknownRecord, key: string, fallback: string) {
  const value = raw[key]
  if (typeof value !== 'string') return fallback
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value
  if (!/^#[0-9a-fA-F]{3}$/.test(value)) return fallback

  return `#${value
    .slice(1)
    .split('')
    .map((channel) => `${channel}${channel}`)
    .join('')}`
}
