export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

// Seeded PRNG (mulberry32) returning values in [0, 1).
export function createRandom(initialSeed: number) {
  let state = initialSeed | 0

  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
