export const TextureSizes = [256, 512, 1024, 2048, 4096] as const

export type TextureSize = (typeof TextureSizes)[number]

export const DefaultTextureSize: TextureSize = 1024

export function isTextureSize(value: unknown): value is TextureSize {
  return typeof value === 'number' && (TextureSizes as readonly number[]).includes(value)
}

export function sanitizeTextureSize(
  value: unknown,
  fallback: TextureSize = DefaultTextureSize
): TextureSize {
  if (isTextureSize(value)) return value

  const numeric = typeof value === 'string' ? Number(value) : value
  if (typeof numeric !== 'number' || !Number.isFinite(numeric)) return fallback

  // Legacy settings stored arbitrary sizes, so snap them to the nearest supported step.
  return TextureSizes.reduce((closest, size) =>
    Math.abs(size - numeric) < Math.abs(closest - numeric) ? size : closest
  )
}
