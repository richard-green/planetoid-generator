export type PaletteColor = {
  r: number
  g: number
  b: number
  position?: number
}

export type Palette = PaletteColor[]

export function getPalettePosition(palette: readonly PaletteColor[], index: number) {
  const fallback = palette.length > 1 ? index / (palette.length - 1) : 0
  const position = palette[index]?.position
  return Math.min(1, Math.max(0, position ?? fallback))
}
