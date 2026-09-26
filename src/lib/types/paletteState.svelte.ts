import type { Palette } from './palette'

let revision = $state(0)

export function trackPalette<T extends readonly unknown[]>(palette: T): T {
  revision
  return palette
}

export function replacePalette(palette: Palette, replacement: Palette) {
  palette.splice(0, palette.length, ...replacement)
  revision += 1
}
