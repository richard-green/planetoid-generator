import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  MathUtils,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three'

type NoiseOffset = { x: number; y: number; z: number }
type PaletteColor = { r: number; g: number; b: number }
type Crater = { u: number; v: number; radius: number }

type BumpTextureOptions = {
  craterCount?: number
  craterStrength?: number
  debugMidline?: boolean
}

type ColourTextureOptions = {
  debugMidline?: boolean
  craterCount?: number
  craterColorStrength?: number
  craterRayStrength?: number
  craterRayDensity?: number
  craterRaySharpness?: number
  craterRayLengthPower?: number
}

type RayTuning = {
  density: number
  sharpness: number
  lengthPower: number
}

function toFiniteNumber(value: number | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function toClampedNumber(value: number | undefined, fallback: number, min: number, max: number) {
  const finite = toFiniteNumber(value, fallback)
  return MathUtils.clamp(finite, min, max)
}

function toNonNegativeInt(value: number | undefined, fallback: number) {
  const finite = toFiniteNumber(value, fallback)
  return Math.max(0, Math.floor(finite))
}

function createRandom(initialSeed: number) {
  let state = initialSeed | 0

  return () => {
    state = (state + 0x6d2b79f5) | 0

    let t = Math.imul(state ^ (state >>> 15), 1 | state)

    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function craterShape(normalizedDistance: number) {
  const t = normalizedDistance
  if (t >= 1.25) return 0

  // Crater profile: depressed bowl, steeper inset wall, subtle raised rim.
  // Positive rim is intentionally weaker than negative cavity so craters still read as impacts.
  const bowl = -Math.pow(MathUtils.clamp(1 - t / 0.82, 0, 1), 1.35)
  const wall = -Math.exp(-Math.pow((t - 0.78) / 0.14, 2)) * 0.22
  const rim = Math.exp(-Math.pow((t - 1.02) / 0.08, 2)) * 0.2

  return bowl + wall + rim
}

function buildCraters(noiseOffset: NoiseOffset, count: number): Crater[] {
  const seed =
    ((noiseOffset.x * 73856093) ^ (noiseOffset.y * 19349663) ^ (noiseOffset.z * 83492791)) | 0
  const random = createRandom(seed)
  const craters: Crater[] = []
  const minRadius = 0.018
  const maxRadius = 0.078
  const radiusRange = maxRadius - minRadius

  // Power-biased size distribution:
  // - Most craters use u^p (p>1), heavily favoring smaller radii.
  // - A guaranteed minority use 1-u^p, favoring larger radii.
  const smallBiasPower = 3.2
  const largeBiasPower = 2.4
  const largeCraterCount = Math.max(1, Math.round(count * 0.15))

  for (let i = 0; i < count; i++) {
    const u = random()
    const v = 0.2 + random() * 0.6
    const radiusSample = random()
    const normalizedRadius =
      i < largeCraterCount
        ? 1 - Math.pow(radiusSample, largeBiasPower)
        : Math.pow(radiusSample, smallBiasPower)
    const radius = minRadius + normalizedRadius * radiusRange

    craters.push({
      u,
      // Keep crater centers in the middle 80% of V to reduce pole distortion.
      v,
      radius,
    })
  }

  return craters
}

function craterNormalizedDistance(u: number, v: number, crater: Crater) {
  const duRaw = Math.abs(u - crater.u)
  const du = Math.min(duRaw, 1 - duRaw)
  const dv = Math.abs(v - crater.v)

  // Enforce a projected UV oval ratio of 1:2 (width:height).
  const rx = Math.max(1e-5, crater.radius * 0.5)
  const ry = Math.max(1e-5, crater.radius)

  return Math.hypot(du / rx, dv / ry)
}

function wrappedDeltaU(u: number, centerU: number) {
  let delta = u - centerU
  if (delta > 0.5) delta -= 1
  if (delta < -0.5) delta += 1
  return delta
}

function hash01(a: number, b: number) {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123
  return n - Math.floor(n)
}

function accumulateCraterHeight(u: number, v: number, craters: Crater[]) {
  let craterHeight = 0

  for (const crater of craters) {
    const normalizedDistance = craterNormalizedDistance(u, v, crater)
    craterHeight += craterShape(normalizedDistance)
  }

  return MathUtils.clamp(craterHeight, -1.25, 0.35)
}

function accumulateCraterColorWarp(u: number, v: number, craters: Crater[]) {
  let craterWarp = 0

  for (const crater of craters) {
    const t = craterNormalizedDistance(u, v, crater)

    if (t >= 1.35) continue

    // Color profile around craters: darker bowl with slightly lighter rim/ejecta.
    const bowlDarken = -Math.pow(MathUtils.clamp(1 - t / 0.82, 0, 1), 1.15) * 0.42
    const rimLighten = Math.exp(-Math.pow((t - 1.02) / 0.1, 2)) * 0.2
    const ejectaLighten = Math.exp(-Math.pow((t - 1.2) / 0.16, 2)) * 0.1

    craterWarp += bowlDarken + rimLighten + ejectaLighten
  }

  return MathUtils.clamp(craterWarp, -1.0, 0.8)
}

function accumulateCraterRayMask(u: number, v: number, craters: Crater[], tuning: RayTuning) {
  let rayMask = 0
  const tau = Math.PI * 2

  for (const crater of craters) {
    const du = wrappedDeltaU(u, crater.u)
    const dv = v - crater.v
    const rx = Math.max(1e-5, crater.radius * 0.5)
    const ry = Math.max(1e-5, crater.radius)
    const localX = du / rx
    const localY = dv / ry
    const t = Math.hypot(localX, localY)

    // Rays start near the rim and extend outward.
    const inner = 0.94
    const outer = 3.45
    if (t < inner || t > outer) continue

    const angle = Math.atan2(localY, localX)

    const size01 = MathUtils.clamp((crater.radius - 0.018) / 0.06, 0, 1)
    // Large craters throw many more rays than small impacts.
    const sizeForCount = Math.pow(size01, 1.15)
    const baseRayCount = MathUtils.lerp(1, 30, sizeForCount)
    const rayCount = Math.round(MathUtils.clamp(baseRayCount * tuning.density, 1, 60))
    const rayPhase = hash01(crater.u * 3.17, crater.v * 5.71) * tau

    let craterContribution = 0

    for (let i = 0; i < rayCount; i++) {
      const jitter = hash01(crater.u * 13.7 + i * 0.37, crater.v * 11.3 - i * 0.29)
      const widthNoise = hash01(crater.u * 7.9 - i * 0.53, crater.v * 17.2 + i * 0.41)
      const lengthNoise = hash01(crater.u * 19.1 + i * 0.83, crater.v * 23.4 - i * 0.27)
      const impactNoise = hash01(crater.u * 29.3 - i * 0.61, crater.v * 31.8 + i * 0.19)

      // Not evenly distributed: each sector gets deterministic angular jitter.
      const rayAngle = rayPhase + ((i + (jitter - 0.5) * 0.8) / rayCount) * tau
      const angularDelta = Math.atan2(Math.sin(angle - rayAngle), Math.cos(angle - rayAngle))
      const widthScale = 1 / Math.sqrt(Math.max(0.2, tuning.sharpness))
      const angularWidth =
        MathUtils.lerp(0.2, 0.08, size01) * MathUtils.lerp(0.7, 1.4, widthNoise) * widthScale
      const angularMask = Math.pow(
        Math.max(0, 1 - Math.abs(angularDelta) / Math.max(1e-4, angularWidth)),
        1.2 + tuning.sharpness * 0.9
      )

      // Per-ray length and impact variation.
      // Power-biased length distribution: lots of short rays, very few long rays.
      const lengthScale = MathUtils.lerp(1.2, 0.72, size01)
      const normalizedLength = Math.pow(lengthNoise, tuning.lengthPower)
      const rayLength = MathUtils.lerp(0.75, 2.45, normalizedLength) * lengthScale
      const rayStart = 0.98
      const rayEnd = rayStart + rayLength

      const entry = MathUtils.smoothstep(t, rayStart, rayStart + 0.14)
      const exit = 1 - MathUtils.smoothstep(t, rayEnd, rayEnd + 0.28)
      const taper = MathUtils.clamp(1 - (t - rayStart) / Math.max(1e-4, rayEnd - rayStart), 0, 1)
      const radialMask = entry * exit * Math.pow(taper, 0.65)

      const rayImpact = MathUtils.lerp(0.4, 1.0, impactNoise)
      const spokeContribution = angularMask * radialMask * rayImpact

      // Use max so overlaps do not create blown-out starbursts.
      if (spokeContribution > craterContribution) craterContribution = spokeContribution
    }

    const haze = MathUtils.clamp(1 - (t - 1.0) / 2.2, 0, 1) * 0.018
    // Tiny craters contribute very little; big craters dominate ray visibility.
    const craterRayBase = MathUtils.lerp(0.04, 0.82, Math.pow(size01, 1.35))
    const contribution = (craterContribution + haze) * craterRayBase

    if (Number.isFinite(contribution) && contribution > 0) rayMask += contribution
  }

  if (!Number.isFinite(rayMask) || rayMask <= 0) return 0
  return MathUtils.clamp(rayMask, 0, 1)
}

// Simple multi-frequency noise suitable for procedural planetoid texturing.
function noise3(x: number, y: number, z: number) {
  return (
    Math.sin(x * 3.1 + Math.sin(y * 4.7)) *
    Math.sin(y * 2.7 + Math.sin(z * 3.3)) *
    Math.sin(z * 4.1 + Math.sin(x * 2.9))
  )
}

function fractalNoise(x: number, y: number, z: number) {
  let value = 0
  let amplitude = 1
  let frequency = 1
  let total = 0

  for (let i = 0; i < 5; i++) {
    value += noise3(x * frequency, y * frequency, z * frequency) * amplitude

    total += amplitude
    amplitude *= 0.5
    frequency *= 2.0
  }

  return value / total
}

function isDebugEquatorPixel(y: number, height: number) {
  const equatorY = Math.round((height - 1) * 0.5)
  return y === equatorY
}

function isDebugMeridianPixel(x: number, width: number, meridianU: number) {
  const meridianX = Math.round((width - 1) * meridianU)
  return x === meridianX
}

function copyFirstColumnToLast(image: ImageData, width: number, height: number) {
  for (let y = 0; y < height; y++) {
    const first = (y * width + 0) * 4
    const last = (y * width + (width - 1)) * 4

    image.data[last] = image.data[first]
    image.data[last + 1] = image.data[first + 1]
    image.data[last + 2] = image.data[first + 2]
    image.data[last + 3] = image.data[first + 3]
  }
}

function softenPolarRows(
  image: ImageData,
  width: number,
  height: number,
  poleRows: number,
  maxBlend: number
) {
  const applyBlendForRow = (y: number, strength: number) => {
    if (strength <= 0) return

    let sumR = 0
    let sumG = 0
    let sumB = 0

    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4
      sumR += image.data[index]
      sumG += image.data[index + 1]
      sumB += image.data[index + 2]
    }

    const invCount = 1 / width
    const avgR = sumR * invCount
    const avgG = sumG * invCount
    const avgB = sumB * invCount

    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4

      image.data[index] = Math.round(MathUtils.lerp(image.data[index], avgR, strength))
      image.data[index + 1] = Math.round(MathUtils.lerp(image.data[index + 1], avgG, strength))
      image.data[index + 2] = Math.round(MathUtils.lerp(image.data[index + 2], avgB, strength))
    }
  }

  const rows = Math.min(Math.max(1, poleRows), Math.floor(height / 2))

  for (let i = 0; i < rows; i++) {
    const t = rows <= 1 ? 1 : 1 - i / (rows - 1)
    const strength = t * t * maxBlend

    applyBlendForRow(i, strength)
    applyBlendForRow(height - 1 - i, strength)
  }
}

function mapToPalette(value: number, planetoidPalette: PaletteColor[]) {
  // Convert noise from [-1, 1] to [0, 1]
  const t = MathUtils.clamp((value + 1) / 2, 0, 1)

  // Map the value onto the palette
  const position = t * (planetoidPalette.length - 1)
  const index = Math.min(Math.floor(position), planetoidPalette.length - 2)
  const localT = position - index

  const a = planetoidPalette[index]
  const b = planetoidPalette[index + 1]

  return {
    r: Math.round(MathUtils.lerp(a.r, b.r, localT)),
    g: Math.round(MathUtils.lerp(a.g, b.g, localT)),
    b: Math.round(MathUtils.lerp(a.b, b.b, localT)),
  }
}

export function createPlanetoidBumpTexture(
  noiseOffset: NoiseOffset,
  textureHeight: number,
  options: BumpTextureOptions = {}
) {
  const height = Math.max(2, Math.floor(textureHeight))
  const width = height * 2
  const craterCount = toNonNegativeInt(options.craterCount, 22)
  const craterStrength = toClampedNumber(options.craterStrength, 0.32, 0, 1.5)
  const debugMidline = options.debugMidline ?? false
  const craters = craterCount > 0 ? buildCraters(noiseOffset, craterCount) : []

  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')!
  const image = context.createImageData(width, height)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1)
      const v = y / (height - 1)

      // Convert UV to approximately spherical coordinates.
      const theta = u * Math.PI * 2
      const phi = v * Math.PI
      const equatorFactor = Math.pow(Math.sin(phi), 0.8)

      const sx = Math.sin(phi) * Math.cos(theta)
      const sy = Math.cos(phi)
      const sz = Math.sin(phi) * Math.sin(theta)

      const base = fractalNoise(
        sx * 8 + noiseOffset.x,
        sy * 8 + noiseOffset.y,
        sz * 8 + noiseOffset.z
      )

      const dust = fractalNoise(
        sx * 90 + noiseOffset.x * 1.7,
        sy * 90 + noiseOffset.y * 1.7,
        sz * 90 + noiseOffset.z * 1.7
      )

      const grain = fractalNoise(
        sx * 180 + noiseOffset.x * 2.3,
        sy * 180 + noiseOffset.y * 2.3,
        sz * 180 + noiseOffset.z * 2.3
      )

      const polarHighFrequencyScale = MathUtils.lerp(0.15, 1, equatorFactor)
      const craterHeight = accumulateCraterHeight(u, v, craters)

      const debugEquator = debugMidline && isDebugEquatorPixel(y, height)
      const debugMeridian0 = debugMidline && (x === 0 || x === width - 1)
      const debugMeridian90 = debugMidline && isDebugMeridianPixel(x, width, 0.25)
      const debugMeridian180 = debugMidline && isDebugMeridianPixel(x, width, 0.5)
      const debugMeridian270 = debugMidline && isDebugMeridianPixel(x, width, 0.75)
      const debugGuideRaise =
        debugEquator || debugMeridian0 || debugMeridian90 || debugMeridian180 || debugMeridian270
          ? 0.65
          : 0

      // Create sparse bright/dark speckles that read as dust on the bump map.
      const brightSpeckles = Math.pow(MathUtils.clamp((dust + 1) * 0.5, 0, 1), 9)
      const darkSpeckles = Math.pow(MathUtils.clamp((-dust + 1) * 0.5, 0, 1), 10)

      const combined =
        base * 0.55 +
        dust * 0.2 * polarHighFrequencyScale +
        grain * 0.1 * polarHighFrequencyScale +
        craterHeight * craterStrength +
        debugGuideRaise +
        brightSpeckles * 0.75 * polarHighFrequencyScale -
        darkSpeckles * 0.55 * polarHighFrequencyScale

      // Convert to [0,255] with extra contrast to emphasize micro-detail.
      const value = MathUtils.clamp(128 + combined * 128, 0, 255)
      const index = (y * width + x) * 4

      image.data[index] = value
      image.data[index + 1] = value
      image.data[index + 2] = value
      image.data[index + 3] = 255
    }
  }

  softenPolarRows(image, width, height, Math.floor(height * 0.06), 0.75)
  copyFirstColumnToLast(image, width, height)

  context.putImageData(image, 0, 0)

  const texture = new CanvasTexture(canvas)
  texture.anisotropy = 8
  texture.wrapS = RepeatWrapping
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = true

  return texture
}

export function createPlanetoidColourTexture(
  noiseOffset: NoiseOffset,
  planetoidPalette: PaletteColor[],
  textureScale: number,
  textureHeight: number,
  options: ColourTextureOptions = {}
) {
  const height = Math.max(2, Math.floor(textureHeight))
  const width = height * 2
  const debugMidline = options.debugMidline ?? false
  const craterCount = toNonNegativeInt(options.craterCount, 22)
  const craterColorStrength = toClampedNumber(options.craterColorStrength, 0.3, 0, 1.25)
  const craterRayStrength = toClampedNumber(options.craterRayStrength, 2.0, 0, 6.0)
  const craterRayDensity = toClampedNumber(options.craterRayDensity, 1.0, 0.3, 3.0)
  const craterRaySharpness = toClampedNumber(options.craterRaySharpness, 1.0, 0.5, 4.0)
  const craterRayLengthPower = toClampedNumber(options.craterRayLengthPower, 2.8, 1.0, 5.0)
  const craters = craterCount > 0 ? buildCraters(noiseOffset, craterCount) : []
  const rayTuning: RayTuning = {
    density: craterRayDensity,
    sharpness: craterRaySharpness,
    lengthPower: craterRayLengthPower,
  }
  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')!
  const image = context.createImageData(width, height)
  const textureDominance = MathUtils.clamp(textureScale, 0, 1)
  const textureContrast = textureScale > 1 ? 1 + (textureScale - 1) * 0.8 : 1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1)
      const v = y / (height - 1)

      const theta = u * Math.PI * 2
      const phi = v * Math.PI
      const equatorFactor = Math.pow(Math.sin(phi), 0.8)

      const sx = Math.sin(phi) * Math.cos(theta)
      const sy = Math.cos(phi)
      const sz = Math.sin(phi) * Math.sin(theta)

      const large = fractalNoise(
        sx * 2 + noiseOffset.x,
        sy * 2 + noiseOffset.y,
        sz * 2 + noiseOffset.z
      )

      const medium = fractalNoise(
        sx * 6 + noiseOffset.x,
        sy * 6 + noiseOffset.y,
        sz * 6 + noiseOffset.z
      )

      const fine = fractalNoise(
        sx * 40 + noiseOffset.x,
        sy * 40 + noiseOffset.y,
        sz * 40 + noiseOffset.z
      )

      const polarHighFrequencyScale = MathUtils.lerp(0.18, 1, equatorFactor)
      const craterColorWarp = accumulateCraterColorWarp(u, v, craters)
      const craterRayMask = accumulateCraterRayMask(u, v, craters, rayTuning)

      const value =
        large * 0.55 +
        medium * 0.3 * polarHighFrequencyScale +
        fine * 0.15 * polarHighFrequencyScale +
        craterColorWarp * craterColorStrength

      const colour = mapToPalette(value, planetoidPalette)

      const accentR = MathUtils.clamp(127.5 + (colour.r - 127.5) * textureContrast, 0, 255)
      const accentG = MathUtils.clamp(127.5 + (colour.g - 127.5) * textureContrast, 0, 255)
      const accentB = MathUtils.clamp(127.5 + (colour.b - 127.5) * textureContrast, 0, 255)

      // White map pixels preserve the base surface tint; texture dominance
      // controls how much of the procedural palette is layered on top.
      let finalR = Math.round(MathUtils.lerp(255, accentR, textureDominance))
      let finalG = Math.round(MathUtils.lerp(255, accentG, textureDominance))
      let finalB = Math.round(MathUtils.lerp(255, accentB, textureDominance))

      // Keep 0 truly off; map strength to subtle, bright ejecta streaks.
      const rayBlend = MathUtils.clamp(craterRayMask * (craterRayStrength / 4.5), 0, 1)
      if (rayBlend > 0) {
        // Lighten rays toward a neutral dust tone with a tiny warm push.
        const lift = MathUtils.clamp(rayBlend * 0.34, 0, 0.34)
        const warm = MathUtils.clamp(rayBlend * 0.08, 0, 0.08)

        finalR = Math.round(
          MathUtils.clamp(MathUtils.lerp(finalR, 236, lift + warm * 0.45), 0, 255)
        )
        finalG = Math.round(MathUtils.clamp(MathUtils.lerp(finalG, 232, lift), 0, 255))
        finalB = Math.round(MathUtils.clamp(MathUtils.lerp(finalB, 224, lift - warm * 0.3), 0, 255))
      }

      if (debugMidline) {
        const debugEquator = isDebugEquatorPixel(y, height)
        const debugMeridian0 = x === 0 || x === width - 1
        const debugMeridian90 = isDebugMeridianPixel(x, width, 0.25)
        const debugMeridian180 = isDebugMeridianPixel(x, width, 0.5)
        const debugMeridian270 = isDebugMeridianPixel(x, width, 0.75)

        if (debugEquator) {
          finalR = 255
          finalG = 0
          finalB = 0
        }

        if (debugMeridian0 || debugMeridian180) {
          finalR = 0
          finalG = 255
          finalB = 0
        }

        if (debugMeridian90 || debugMeridian270) {
          finalR = 0
          finalG = 0
          finalB = 255
        }
      }

      const index = (y * width + x) * 4

      image.data[index] = finalR
      image.data[index + 1] = finalG
      image.data[index + 2] = finalB
      image.data[index + 3] = 255
    }
  }

  softenPolarRows(image, width, height, Math.floor(height * 0.06), 0.45)
  copyFirstColumnToLast(image, width, height)

  context.putImageData(image, 0, 0)

  const texture = new CanvasTexture(canvas)
  texture.anisotropy = 8
  texture.wrapS = RepeatWrapping
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = true
  texture.colorSpace = SRGBColorSpace

  return texture
}

export function createPlanetoidRayMaskTexture(
  noiseOffset: NoiseOffset,
  textureHeight: number,
  craterCount = 22,
  options: Pick<
    ColourTextureOptions,
    'craterRayDensity' | 'craterRaySharpness' | 'craterRayLengthPower'
  > = {}
) {
  const height = Math.max(2, Math.floor(textureHeight))
  const width = height * 2
  const safeCraterCount = toNonNegativeInt(craterCount, 22)
  const craterRayDensity = toClampedNumber(options.craterRayDensity, 1.0, 0.3, 3.0)
  const craterRaySharpness = toClampedNumber(options.craterRaySharpness, 1.0, 0.5, 4.0)
  const craterRayLengthPower = toClampedNumber(options.craterRayLengthPower, 2.8, 1.0, 5.0)
  const craters = safeCraterCount > 0 ? buildCraters(noiseOffset, safeCraterCount) : []
  const rayTuning: RayTuning = {
    density: craterRayDensity,
    sharpness: craterRaySharpness,
    lengthPower: craterRayLengthPower,
  }

  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')!
  const image = context.createImageData(width, height)
  const rayValues = new Float32Array(width * height)
  let maxMask = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1)
      const v = y / (height - 1)
      const craterRayMask = accumulateCraterRayMask(u, v, craters, rayTuning)
      const maskIndex = y * width + x

      rayValues[maskIndex] = craterRayMask
      if (craterRayMask > maxMask) maxMask = craterRayMask
    }
  }

  const hasSignal = maxMask > 1e-6
  const invMax = hasSignal ? 1 / maxMask : 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const maskIndex = y * width + x
      const raw = rayValues[maskIndex]
      const normalized = invMax > 0 ? MathUtils.clamp(raw * invMax, 0, 1) : 0
      let debugStrength = 0

      if (hasSignal) {
        const boosted = Math.pow(normalized, 0.55)
        debugStrength = raw > 0 ? MathUtils.clamp(0.06 + boosted * 0.94, 0, 1) : 0
      } else {
        // Explicit fallback pattern means "no ray signal generated".
        const tx = x / Math.max(1, width - 1)
        const ty = y / Math.max(1, height - 1)
        const grid = (Math.floor(tx * 16) + Math.floor(ty * 16)) % 2
        const diagonal = Math.abs(tx - ty) < 0.01 || Math.abs(tx - (1 - ty)) < 0.01
        debugStrength = diagonal ? 1 : grid === 0 ? 0.22 : 0.08
      }

      const level = Math.round(debugStrength * 255)
      const index = (y * width + x) * 4

      image.data[index] = level
      image.data[index + 1] = level
      image.data[index + 2] = level
      image.data[index + 3] = 255
    }
  }

  softenPolarRows(image, width, height, Math.floor(height * 0.06), 0.35)
  copyFirstColumnToLast(image, width, height)

  context.putImageData(image, 0, 0)

  const texture = new CanvasTexture(canvas)
  texture.anisotropy = 8
  texture.wrapS = RepeatWrapping
  texture.minFilter = LinearMipmapLinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = true
  texture.colorSpace = SRGBColorSpace

  return texture
}
