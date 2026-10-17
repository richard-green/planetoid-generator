import { BufferGeometry, Color, Float32BufferAttribute, SRGBColorSpace } from 'three'
import { getPalettePosition, type Palette } from '../../../types/palette'
import { clamp, createRandom } from '../../../utils/math'
import { StarPalettes } from '../Star/StarPalettes'
import type { StarPaletteName } from '../Star/StarSettings'

type StarfieldOptions = {
  seed: number
  count: number
}

type GalacticPosition = {
  position: [number, number, number]
  longitude: number
  latitude: number
}

type DustCloud = {
  longitude: number
  latitude: number
  longitudeSpread: number
  latitudeSpread: number
  opacity: number
}

const SPECTRAL_CLASSES = [
  { palette: 'Red', colorRange: [0.56, 0.65], weight: 0.74 },
  { palette: 'Orange', colorRange: [0.42, 0.59], weight: 0.16 },
  { palette: 'Yellow', colorRange: [0.43, 0.72], weight: 0.075 },
  { palette: 'White', colorRange: [0.4, 0.84], weight: 0.022 },
  { palette: 'Blue', colorRange: [0.52, 0.88], weight: 0.003 },
] as const

function normalSample(random: () => number): number {
  return Math.sqrt(-2 * Math.log(Math.max(random(), 1e-8))) * Math.cos(2 * Math.PI * random())
}

function samplePaletteColor(palette: Palette, position: number) {
  const upperIndex = palette.findIndex((_, index) => getPalettePosition(palette, index) >= position)
  const endIndex = upperIndex < 0 ? palette.length - 1 : upperIndex
  const startIndex = Math.max(0, endIndex - 1)
  const start = palette[startIndex] ?? { r: 255, g: 255, b: 255 }
  const end = palette[endIndex] ?? start
  const startPosition = getPalettePosition(palette, startIndex)
  const endPosition = getPalettePosition(palette, endIndex)
  const amount = clamp((position - startPosition) / Math.max(0.0001, endPosition - startPosition), 0, 1)

  return {
    r: start.r + (end.r - start.r) * amount,
    g: start.g + (end.g - start.g) * amount,
    b: start.b + (end.b - start.b) * amount,
  }
}

function sampleSkyPosition(random: () => number): GalacticPosition {
  const inMilkyWayBand = random() < 0.72
  const longitude =
    inMilkyWayBand && random() < 0.12
      ? normalSample(random) * 0.34
      : random() * Math.PI * 2
  const longitudeFromCenter = Math.atan2(Math.sin(longitude), Math.cos(longitude))
  const bulge = Math.exp(-0.5 * (longitudeFromCenter / 0.55) ** 2)
  const latitudeSpread = 0.13 + bulge * 0.055
  const latitude = inMilkyWayBand
    ? normalSample(random) * latitudeSpread
    : Math.asin(random() * 2 - 1)
  const planar = Math.cos(latitude)
  const x = planar * Math.cos(longitude)
  const y = Math.sin(latitude)
  const z = planar * Math.sin(longitude)

  const tilt = 0.1
  const roll = -0.32
  const tiltedY = y * Math.cos(tilt) - z * Math.sin(tilt)
  const tiltedZ = y * Math.sin(tilt) + z * Math.cos(tilt)

  return {
    position: [
      (x * Math.cos(roll) - tiltedY * Math.sin(roll)) * 300,
      (x * Math.sin(roll) + tiltedY * Math.cos(roll)) * 300,
      tiltedZ * 300,
    ],
    longitude,
    latitude,
  }
}

function createDustClouds(seed: number): DustCloud[] {
  const random = createRandom(seed ^ 0x51ed270b)

  return Array.from({ length: 9 }, () => ({
    longitude: random() * Math.PI * 2,
    latitude: normalSample(random) * 0.045,
    longitudeSpread: 0.12 + random() * 0.3,
    latitudeSpread: 0.018 + random() * 0.035,
    opacity: 0.55 + random() * 0.35,
  }))
}

function dustCoverage(position: GalacticPosition, clouds: DustCloud[]) {
  let coverage = 0

  for (const cloud of clouds) {
    const longitudeDelta = Math.atan2(
      Math.sin(position.longitude - cloud.longitude),
      Math.cos(position.longitude - cloud.longitude)
    )
    const longitudeDistance = longitudeDelta / cloud.longitudeSpread
    const latitudeDistance = (position.latitude - cloud.latitude) / cloud.latitudeSpread
    const distanceSquared = longitudeDistance ** 2 + latitudeDistance ** 2
    coverage = Math.max(coverage, cloud.opacity * Math.exp(-0.5 * distanceSquared))
  }

  return coverage
}

export function createStarfieldGeometry({ seed, count }: StarfieldOptions) {
  const random = createRandom(seed)
  const positions = new Float32Array(count * 3)
  const galacticCoords = new Float32Array(count * 2)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const intensities = new Float32Array(count)
  const dust = new Float32Array(count)
  const color = new Color()
  const dustClouds = createDustClouds(seed)

  for (let index = 0; index < count; index += 1) {
    const skyPosition = sampleSkyPosition(random)
    const spectralRoll = random()
    const spectralClass = SPECTRAL_CLASSES.find(
      (entry, classIndex) =>
        spectralRoll < SPECTRAL_CLASSES.slice(0, classIndex + 1).reduce((sum, item) => sum + item.weight, 0)
    ) ?? SPECTRAL_CLASSES[0]
    const giant = random() < 0.009
    const apparentBrightness = random() ** 2.4 * (giant ? 3.8 : 1.3)
    const magnitude = clamp(apparentBrightness, 0, 3.8)
    const offset = index * 3
    const [colorStart, colorEnd] = spectralClass.colorRange
    const paletteColor = samplePaletteColor(
      StarPalettes[spectralClass.palette as StarPaletteName],
      colorStart + random() * (colorEnd - colorStart)
    )

    positions[offset] = skyPosition.position[0]
    positions[offset + 1] = skyPosition.position[1]
    positions[offset + 2] = skyPosition.position[2]
    galacticCoords[index * 2] = skyPosition.longitude
    galacticCoords[index * 2 + 1] = skyPosition.latitude

    color.setRGB(paletteColor.r / 255, paletteColor.g / 255, paletteColor.b / 255, SRGBColorSpace)
    colors[offset] = color.r
    colors[offset + 1] = color.g
    colors[offset + 2] = color.b
    sizes[index] = 0.72 + magnitude * 0.8 + (giant ? 0.9 : 0)
    intensities[index] = 0.38 + magnitude * 0.75 + (giant ? 0.5 : 0)
    dust[index] = dustCoverage(skyPosition, dustClouds)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('aGalacticCoord', new Float32BufferAttribute(galacticCoords, 2))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new Float32BufferAttribute(sizes, 1))
  geometry.setAttribute('aIntensity', new Float32BufferAttribute(intensities, 1))
  geometry.setAttribute('aDust', new Float32BufferAttribute(dust, 1))
  geometry.computeBoundingSphere()
  return geometry
}