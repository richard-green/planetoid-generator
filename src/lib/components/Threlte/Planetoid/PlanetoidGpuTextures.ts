import { vertexShader, fragmentShader } from './PlanetoidShaders'
import {
  ClampToEdgeWrapping,
  LinearFilter,
  MathUtils,
  Mesh,
  NoColorSpace,
  OrthographicCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  Uniform,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  type Texture,
  type WebGLRenderer,
} from 'three'
import { getPalettePosition, type PaletteColor } from '../../../types/palette'
import { traceSpan, tracingEnabled } from '../../../utils/perfTrace'
import {
  DefaultValues,
  DustCloudStyleNames,
  sanitizePlanetoidNumber,
  type DustCloudWeights,
} from './PlanetoidSettings'

type NoiseOffset = { x: number; y: number; z: number }

type SurfaceDetailTextureOptions = {
  enableIceCaps?: boolean
  iceCapCoverage?: number
  iceCapEdgeNoise?: number
  snowExtent?: number
  snowCoverage?: number
  enableCraters?: boolean
  craterCount?: number
  craterScale?: number
  craterStrength?: number
  craterSharpness?: number
  enableVolcanoes?: boolean
  volcanoCount?: number
  volcanoScale?: number
  volcanoStrength?: number
  swirliness?: number
  enableRidges?: boolean
  enableRifts?: boolean
  ridgeStrength?: number
  ridgeElevation?: number
  ridgeFrequency?: number
  ridgeSharpness?: number
  riftStrength?: number
  riftFrequency?: number
  riftWidth?: number
  riftSharpness?: number
  ridgesRiftsBlend?: number
  debugMidline?: boolean
}

type ColorTextureOptions = {
  iceCapPalette?: PaletteColor[]
  enableIceCaps?: boolean
  iceCapCoverage?: number
  iceCapEdgeNoise?: number
  snowExtent?: number
  snowCoverage?: number
  iceCapColor?: string
  surfaceTint?: string
  tintShadowFloor?: number
  swirliness?: number
  ridgeColorWeight?: number
  riftColorWeight?: number
  enableRidges?: boolean
  enableRifts?: boolean
  ridgeStrength?: number
  ridgeElevation?: number
  ridgeFrequency?: number
  ridgeSharpness?: number
  riftStrength?: number
  riftFrequency?: number
  riftWidth?: number
  riftSharpness?: number
  ridgesRiftsBlend?: number
  debugMidline?: boolean
  enableCraters?: boolean
  craterCount?: number
  craterScale?: number
  craterColorStrength?: number
  craterSharpness?: number
  enableVolcanoes?: boolean
  volcanoCount?: number
  volcanoScale?: number
  volcanoStrength?: number
  volcanoColorStrength?: number
}

type DustCloudTextureOptions = {
  dustCloudCoverage: number
  dustCloudWeights: DustCloudWeights
  dustCloudOpacity: number
  dustCloudFrequency: number
  dustCloudSwirliness: number
  dustCloudCoriolis: number
  dustCloudRelief: number
  swirliness?: number
  palette: PaletteColor[]
}

type DustCloudNormalTextureOptions = Omit<DustCloudTextureOptions, 'palette' | 'dustCloudRelief'>

const MAX_PALETTE = 16

// Higher values make crater rims narrower and crisper.
export const CRATER_RIM_SHARPNESS = 3.5

const scene = new Scene()
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
const material = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  defines: { MODE: 0 },
  uniforms: {
    uOne: new Uniform(1),
    uResolution: new Uniform(new Vector2(512, 256)),
    uSeed: new Uniform(new Vector3()),
    uTint: new Uniform(new Vector3(1, 1, 1)),
    uEnableIceCaps: new Uniform(0),
    uIceCapCoverage: new Uniform(DefaultValues.iceCapCoverage),
    uIceCapEdgeNoise: new Uniform(DefaultValues.iceCapEdgeNoise),
    uSnowExtent: new Uniform(DefaultValues.snowExtent),
    uSnowCoverage: new Uniform(DefaultValues.snowCoverage),
    uIceCapColor: new Uniform(new Vector3(1, 1, 1)),
    uIcePaletteSize: new Uniform(2),
    uIcePalette: new Uniform(Array.from({ length: MAX_PALETTE }, () => new Vector3(1, 1, 1))),
    uIcePalettePositions: new Uniform(Array.from({ length: MAX_PALETTE }, () => 1)),
    uTintShadowFloor: new Uniform(0.18),
    uSwirliness: new Uniform(1),
    uDustCloudCoverage: new Uniform(DefaultValues.dustCloudCoverage),
    uDustCloudWeights: new Uniform(
      DustCloudStyleNames.map((style) => DefaultValues.dustCloudWeights[style])
    ),
    uDustCloudOpacity: new Uniform(DefaultValues.dustCloudOpacity),
    uDustCloudFrequency: new Uniform(DefaultValues.dustCloudFrequency),
    uDustCloudSwirliness: new Uniform(DefaultValues.dustCloudSwirliness),
    uDustCloudCoriolis: new Uniform(DefaultValues.dustCloudCoriolis),
    uDustCloudRelief: new Uniform(DefaultValues.dustCloudNormalStrength),
    uTextureScale: new Uniform(1),
    uEnableCraters: new Uniform(1),
    uCraterCount: new Uniform(22),
    uCraterScale: new Uniform(1),
    uCraterStrength: new Uniform(0.32),
    uCraterColorStrength: new Uniform(0.3),
    uCraterSharpness: new Uniform(CRATER_RIM_SHARPNESS),
    uEnableVolcanoes: new Uniform(0),
    uVolcanoCount: new Uniform(10),
    uVolcanoScale: new Uniform(1.0),
    uVolcanoStrength: new Uniform(1.0),
    uVolcanoColorStrength: new Uniform(0.75),
    uRidgeColorWeight: new Uniform(0.35),
    uRiftColorWeight: new Uniform(0.35),
    uEnableRidges: new Uniform(0),
    uEnableRifts: new Uniform(0),
    uRidgeStrength: new Uniform(0.5),
    uRidgeElevation: new Uniform(DefaultValues.ridgeElevation),
    uRidgeFrequency: new Uniform(2.2),
    uRidgeSharpness: new Uniform(1.6),
    uRiftStrength: new Uniform(0.4),
    uRiftFrequency: new Uniform(3.4),
    uRiftWidth: new Uniform(0.09),
    uRiftSharpness: new Uniform(2.0),
    uRidgesRiftsBlend: new Uniform(0.55),
    uDebugMidline: new Uniform(0),
    uPaletteSize: new Uniform(2),
    uPalette: new Uniform(Array.from({ length: MAX_PALETTE }, () => new Vector3())),
    uPalettePositions: new Uniform(Array.from({ length: MAX_PALETTE }, () => 1)),
  },
})
const quad = new Mesh(new PlaneGeometry(2, 2), material)
quad.frustumCulled = false
scene.add(quad)

type TextureMode = 0 | 4 | 5 | 6
const materialsByMode = new Map<TextureMode, ShaderMaterial>([[0, material]])

// Programs are compiled lazily, so unused modes (e.g. dust clouds) cost nothing.
function materialForMode(mode: TextureMode) {
  let modeMaterial = materialsByMode.get(mode)
  if (!modeMaterial) {
    modeMaterial = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      defines: { MODE: mode },
      uniforms: material.uniforms,
    })
    materialsByMode.set(mode, modeMaterial)
  }
  return modeMaterial
}

function toFiniteNumber(value: number | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function toClampedNumber(value: number | undefined, fallback: number, min: number, max: number) {
  const finite = toFiniteNumber(value, fallback)
  return MathUtils.clamp(finite, min, max)
}

function srgbChannelToLinear(value: number) {
  if (value <= 0.04045) {
    return value / 12.92
  }

  return ((value + 0.055) / 1.055) ** 2.4
}

function srgbToLinearVector(r: number, g: number, b: number) {
  return new Vector3(srgbChannelToLinear(r), srgbChannelToLinear(g), srgbChannelToLinear(b))
}

function parseHexTint(value: string | undefined) {
  const fallback = new Vector3(1, 1, 1)
  if (!value) return fallback

  const normalized = value.trim().toLowerCase()
  const fullHex = /^#[0-9a-f]{6}$/.test(normalized)
    ? normalized
    : /^#[0-9a-f]{3}$/.test(normalized)
      ? `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`
      : ''

  if (!fullHex) return fallback

  const r = Number.parseInt(fullHex.slice(1, 3), 16) / 255
  const g = Number.parseInt(fullHex.slice(3, 5), 16) / 255
  const b = Number.parseInt(fullHex.slice(5, 7), 16) / 255

  return srgbToLinearVector(r, g, b)
}

function setPaletteUniform(
  palette: PaletteColor[],
  uniformName: 'uPalette' | 'uIcePalette' = 'uPalette'
) {
  const paletteVectors = material.uniforms[uniformName].value as Vector3[]
  const palettePositions = material.uniforms[`${uniformName}Positions`].value as number[]

  for (let i = 0; i < MAX_PALETTE; i++) {
    const sourceIndex = Math.min(i, Math.max(0, palette.length - 1))
    const source = palette[sourceIndex] ?? {
      r: 255,
      g: 255,
      b: 255,
    }

    const linear = srgbToLinearVector(source.r / 255, source.g / 255, source.b / 255)
    paletteVectors[i].copy(linear)
    palettePositions[i] = getPalettePosition(palette, sourceIndex)
  }

  material.uniforms[`${uniformName}Size`].value = Math.max(2, Math.min(MAX_PALETTE, palette.length))
}

const TEXTURE_MODE_NAMES = {
  0: 'color',
  4: 'normal',
  5: 'dustCloud',
  6: 'dustCloudNormal',
} as const
const traceSyncPixel = new Uint8Array(4)

function renderTexture(
  renderer: WebGLRenderer,
  mode: TextureMode,
  width: number,
  height: number,
  noiseOffset: NoiseOffset,
  options: {
    iceCapPalette?: PaletteColor[]
    enableIceCaps?: boolean
    iceCapCoverage?: number
    iceCapEdgeNoise?: number
    snowExtent?: number
    snowCoverage?: number
    iceCapColor?: string
    surfaceTint?: string
    tintShadowFloor?: number
    swirliness?: number
    dustCloudCoverage?: number
    dustCloudWeights?: DustCloudWeights
    dustCloudOpacity?: number
    dustCloudFrequency?: number
    dustCloudSwirliness?: number
    dustCloudCoriolis?: number
    dustCloudRelief?: number
    textureScale?: number
    enableCraters?: boolean
    craterCount?: number
    craterScale?: number
    craterStrength?: number
    craterColorStrength?: number
    craterSharpness?: number
    enableVolcanoes?: boolean
    volcanoCount?: number
    volcanoScale?: number
    volcanoStrength?: number
    volcanoColorStrength?: number
    ridgeColorWeight?: number
    riftColorWeight?: number
    enableRidges?: boolean
    enableRifts?: boolean
    ridgeStrength?: number
    ridgeElevation?: number
    ridgeFrequency?: number
    ridgeSharpness?: number
    riftStrength?: number
    riftFrequency?: number
    riftWidth?: number
    riftSharpness?: number
    ridgesRiftsBlend?: number
    debugMidline?: boolean
    palette?: PaletteColor[]
  }
) {
  quad.material = materialForMode(mode)
  material.uniforms.uResolution.value.set(width, height)
  material.uniforms.uSeed.value.set(noiseOffset.x, noiseOffset.y, noiseOffset.z)
  const tint = parseHexTint(options.surfaceTint)
  material.uniforms.uTint.value.copy(tint)
  material.uniforms.uEnableIceCaps.value = options.enableIceCaps ? 1 : 0
  material.uniforms.uIceCapCoverage.value = sanitizePlanetoidNumber(
    'iceCapCoverage',
    options.iceCapCoverage
  )
  material.uniforms.uIceCapEdgeNoise.value = sanitizePlanetoidNumber(
    'iceCapEdgeNoise',
    options.iceCapEdgeNoise
  )
  material.uniforms.uIceCapColor.value.copy(
    parseHexTint(options.iceCapColor ?? DefaultValues.iceCapColor)
  )
  material.uniforms.uSnowExtent.value = sanitizePlanetoidNumber('snowExtent', options.snowExtent)
  material.uniforms.uSnowCoverage.value = sanitizePlanetoidNumber(
    'snowCoverage',
    options.snowCoverage
  )
  setPaletteUniform(options.iceCapPalette ?? [{ r: 255, g: 255, b: 255 }], 'uIcePalette')
  material.uniforms.uTintShadowFloor.value = sanitizePlanetoidNumber(
    'tintShadowFloor',
    options.tintShadowFloor
  )
  material.uniforms.uSwirliness.value = sanitizePlanetoidNumber('swirliness', options.swirliness)
  material.uniforms.uDustCloudCoverage.value = sanitizePlanetoidNumber(
    'dustCloudCoverage',
    options.dustCloudCoverage
  )
  material.uniforms.uDustCloudWeights.value = DustCloudStyleNames.map((style) =>
    toClampedNumber(options.dustCloudWeights?.[style], DefaultValues.dustCloudWeights[style], 0, 1)
  )
  material.uniforms.uDustCloudOpacity.value = sanitizePlanetoidNumber(
    'dustCloudOpacity',
    options.dustCloudOpacity
  )
  material.uniforms.uDustCloudFrequency.value = sanitizePlanetoidNumber(
    'dustCloudFrequency',
    options.dustCloudFrequency
  )
  material.uniforms.uDustCloudSwirliness.value = sanitizePlanetoidNumber(
    'dustCloudSwirliness',
    options.dustCloudSwirliness
  )
  material.uniforms.uDustCloudCoriolis.value = sanitizePlanetoidNumber(
    'dustCloudCoriolis',
    options.dustCloudCoriolis
  )
  material.uniforms.uDustCloudRelief.value = sanitizePlanetoidNumber(
    'dustCloudNormalStrength',
    options.dustCloudRelief
  )
  material.uniforms.uTextureScale.value = sanitizePlanetoidNumber(
    'colorScale',
    options.textureScale
  )
  material.uniforms.uEnableCraters.value = (options.enableCraters ?? true) ? 1 : 0
  material.uniforms.uCraterCount.value = sanitizePlanetoidNumber('craterCount', options.craterCount)
  material.uniforms.uCraterScale.value = sanitizePlanetoidNumber('craterScale', options.craterScale)
  material.uniforms.uCraterStrength.value = sanitizePlanetoidNumber(
    'craterStrength',
    options.craterStrength
  )
  material.uniforms.uCraterColorStrength.value = sanitizePlanetoidNumber(
    'craterColorStrength',
    options.craterColorStrength
  )
  material.uniforms.uCraterSharpness.value = sanitizePlanetoidNumber(
    'craterSharpness',
    options.craterSharpness
  )
  material.uniforms.uEnableVolcanoes.value = options.enableVolcanoes ? 1 : 0
  material.uniforms.uVolcanoCount.value = sanitizePlanetoidNumber(
    'volcanoCount',
    options.volcanoCount
  )
  material.uniforms.uVolcanoScale.value = sanitizePlanetoidNumber(
    'volcanoScale',
    options.volcanoScale
  )
  material.uniforms.uVolcanoStrength.value = sanitizePlanetoidNumber(
    'volcanoStrength',
    options.volcanoStrength
  )
  material.uniforms.uVolcanoColorStrength.value = sanitizePlanetoidNumber(
    'volcanoColorStrength',
    options.volcanoColorStrength
  )
  material.uniforms.uRidgeColorWeight.value = sanitizePlanetoidNumber(
    'ridgeColorWeight',
    options.ridgeColorWeight
  )
  material.uniforms.uRiftColorWeight.value = sanitizePlanetoidNumber(
    'riftColorWeight',
    options.riftColorWeight
  )
  material.uniforms.uEnableRidges.value = options.enableRidges ? 1 : 0
  material.uniforms.uEnableRifts.value = options.enableRifts ? 1 : 0
  material.uniforms.uRidgeStrength.value = sanitizePlanetoidNumber(
    'ridgeStrength',
    options.ridgeStrength
  )
  material.uniforms.uRidgeElevation.value = sanitizePlanetoidNumber(
    'ridgeElevation',
    options.ridgeElevation
  )
  material.uniforms.uRidgeFrequency.value = sanitizePlanetoidNumber(
    'ridgeFrequency',
    options.ridgeFrequency
  )
  material.uniforms.uRidgeSharpness.value = sanitizePlanetoidNumber(
    'ridgeSharpness',
    options.ridgeSharpness
  )
  material.uniforms.uRiftStrength.value = sanitizePlanetoidNumber(
    'riftStrength',
    options.riftStrength
  )
  material.uniforms.uRiftFrequency.value = sanitizePlanetoidNumber(
    'riftFrequency',
    options.riftFrequency
  )
  material.uniforms.uRiftWidth.value = sanitizePlanetoidNumber('riftWidth', options.riftWidth)
  material.uniforms.uRiftSharpness.value = sanitizePlanetoidNumber(
    'riftSharpness',
    options.riftSharpness
  )
  material.uniforms.uRidgesRiftsBlend.value = sanitizePlanetoidNumber(
    'ridgesRiftsBlend',
    options.ridgesRiftsBlend
  )
  material.uniforms.uDebugMidline.value = options.debugMidline ? 1 : 0

  if (options.palette) {
    setPaletteUniform(options.palette)
  }

  const renderTarget = new WebGLRenderTarget(width, height, {
    depthBuffer: false,
    stencilBuffer: false,
  })

  renderTarget.texture.wrapS = RepeatWrapping
  renderTarget.texture.wrapT = ClampToEdgeWrapping
  renderTarget.texture.minFilter = LinearFilter
  renderTarget.texture.magFilter = LinearFilter
  renderTarget.texture.generateMipmaps = false

  const previousTarget = renderer.getRenderTarget()
  const previousViewport = renderer.getViewport(new Vector4())
  const previousScissor = renderer.getScissor(new Vector4())
  const previousScissorTest = renderer.getScissorTest()

  renderer.setRenderTarget(renderTarget)
  renderer.setViewport(0, 0, width, height)
  renderer.setScissor(0, 0, width, height)
  renderer.setScissorTest(false)
  renderer.clear()
  // Separates one-off shader compilation from the per-pass render cost.
  if (tracingEnabled) traceSpan('gpu:compile', () => renderer.compile(scene, camera))
  traceSpan(
    `gpu:${TEXTURE_MODE_NAMES[mode]}`,
    () => {
      renderer.render(scene, camera)
      // Reading a pixel blocks until the GPU finishes, so the span includes shader time.
      if (tracingEnabled) renderer.readRenderTargetPixels(renderTarget, 0, 0, 1, 1, traceSyncPixel)
    },
    { width, height }
  )
  renderer.setRenderTarget(previousTarget)
  renderer.setViewport(previousViewport)
  renderer.setScissor(previousScissor)
  renderer.setScissorTest(previousScissorTest)

  const texture = renderTarget.texture
  texture.needsUpdate = true
  texture.userData.renderTarget = renderTarget

  return texture
}

export function disposeGeneratedTexture(texture: Texture) {
  const renderTarget = texture.userData.renderTarget as WebGLRenderTarget | undefined
  if (renderTarget) {
    renderTarget.dispose()
    return
  }

  texture.dispose()
}

export function createPlanetoidColorTexture(
  renderer: WebGLRenderer,
  noiseOffset: NoiseOffset,
  planetoidPalette: PaletteColor[],
  textureScale: number,
  textureHeight: number,
  options: ColorTextureOptions = {}
) {
  const height = Math.max(2, Math.floor(textureHeight))
  const width = height * 2

  const texture = renderTexture(renderer, 0, width, height, noiseOffset, {
    iceCapPalette: options.iceCapPalette,
    enableIceCaps: options.enableIceCaps,
    iceCapCoverage: options.iceCapCoverage,
    iceCapEdgeNoise: options.iceCapEdgeNoise,
    snowExtent: options.snowExtent,
    snowCoverage: options.snowCoverage,
    iceCapColor: options.iceCapColor,
    surfaceTint: options.surfaceTint,
    tintShadowFloor: options.tintShadowFloor,
    swirliness: options.swirliness,
    textureScale,
    enableCraters: options.enableCraters,
    craterCount: options.craterCount,
    craterScale: options.craterScale,
    craterColorStrength: options.craterColorStrength,
    craterSharpness: options.craterSharpness,
    enableVolcanoes: options.enableVolcanoes,
    volcanoCount: options.volcanoCount,
    volcanoScale: options.volcanoScale,
    volcanoStrength: options.volcanoStrength,
    volcanoColorStrength: options.volcanoColorStrength,
    ridgeColorWeight: options.ridgeColorWeight,
    riftColorWeight: options.riftColorWeight,
    enableRidges: options.enableRidges,
    enableRifts: options.enableRifts,
    ridgeStrength: options.ridgeStrength,
    ridgeElevation: options.ridgeElevation,
    ridgeFrequency: options.ridgeFrequency,
    ridgeSharpness: options.ridgeSharpness,
    riftStrength: options.riftStrength,
    riftFrequency: options.riftFrequency,
    riftWidth: options.riftWidth,
    riftSharpness: options.riftSharpness,
    ridgesRiftsBlend: options.ridgesRiftsBlend,
    debugMidline: options.debugMidline,
    palette: planetoidPalette,
  })

  texture.anisotropy = 8
  texture.colorSpace = NoColorSpace

  return texture
}

export function createPlanetoidDustCloudTexture(
  renderer: WebGLRenderer,
  noiseOffset: NoiseOffset,
  textureHeight: number,
  options: DustCloudTextureOptions
) {
  const height = Math.max(2, Math.floor(textureHeight))
  const width = height * 2
  const texture = renderTexture(renderer, 5, width, height, noiseOffset, {
    dustCloudCoverage: options.dustCloudCoverage,
    dustCloudWeights: options.dustCloudWeights,
    dustCloudOpacity: options.dustCloudOpacity,
    dustCloudFrequency: options.dustCloudFrequency,
    dustCloudSwirliness: options.dustCloudSwirliness,
    dustCloudCoriolis: options.dustCloudCoriolis,
    dustCloudRelief: options.dustCloudRelief,
    swirliness: options.swirliness,
    palette: options.palette,
  })

  texture.anisotropy = 8
  texture.colorSpace = NoColorSpace

  return texture
}

export function createPlanetoidDustCloudNormalTexture(
  renderer: WebGLRenderer,
  noiseOffset: NoiseOffset,
  textureHeight: number,
  options: DustCloudNormalTextureOptions
) {
  const height = Math.max(2, Math.floor(textureHeight))
  const width = height * 2
  const texture = renderTexture(renderer, 6, width, height, noiseOffset, {
    dustCloudCoverage: options.dustCloudCoverage,
    dustCloudWeights: options.dustCloudWeights,
    dustCloudOpacity: options.dustCloudOpacity,
    dustCloudFrequency: options.dustCloudFrequency,
    dustCloudSwirliness: options.dustCloudSwirliness,
    dustCloudCoriolis: options.dustCloudCoriolis,
    swirliness: options.swirliness,
  })

  texture.anisotropy = 8
  texture.colorSpace = NoColorSpace

  return texture
}

export function createPlanetoidNormalTexture(
  renderer: WebGLRenderer,
  noiseOffset: NoiseOffset,
  textureHeight: number,
  options: SurfaceDetailTextureOptions = {}
) {
  const height = Math.max(2, Math.floor(textureHeight))
  const width = height * 2

  const texture = renderTexture(renderer, 4, width, height, noiseOffset, {
    enableIceCaps: options.enableIceCaps,
    iceCapCoverage: options.iceCapCoverage,
    iceCapEdgeNoise: options.iceCapEdgeNoise,
    snowExtent: options.snowExtent,
    snowCoverage: options.snowCoverage,
    enableCraters: options.enableCraters,
    craterCount: options.craterCount,
    craterScale: options.craterScale,
    craterStrength: options.craterStrength,
    craterSharpness: options.craterSharpness,
    enableVolcanoes: options.enableVolcanoes,
    volcanoCount: options.volcanoCount,
    volcanoScale: options.volcanoScale,
    volcanoStrength: options.volcanoStrength,
    swirliness: options.swirliness,
    enableRidges: options.enableRidges,
    enableRifts: options.enableRifts,
    ridgeStrength: options.ridgeStrength,
    ridgeElevation: options.ridgeElevation,
    ridgeFrequency: options.ridgeFrequency,
    ridgeSharpness: options.ridgeSharpness,
    riftStrength: options.riftStrength,
    riftFrequency: options.riftFrequency,
    riftWidth: options.riftWidth,
    riftSharpness: options.riftSharpness,
    ridgesRiftsBlend: options.ridgesRiftsBlend,
    debugMidline: options.debugMidline,
  })

  texture.anisotropy = 8
  texture.colorSpace = NoColorSpace

  return texture
}
