import { vertexShader, fragmentShader, normalFragmentShader } from './GasGiantShaders'
import {
  ClampToEdgeWrapping,
  HalfFloatType,
  LinearFilter,
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

import { sanitizeGasGiantNumber } from './GasGiantSettings'
import { getPalettePosition, type Palette } from '../../../types/palette'
import { traceSpan } from '../../../utils/perfTrace'

type NoiseOffset = { x: number; y: number; z: number }

export type GasGiantTextureOptions = {
  surfaceTint?: string
  tintShadowFloor?: number
  textureScale?: number
  cloudBandCount?: number
  cloudBandSharpness?: number
  cloudChaos?: number
  cloudTurbulence?: number
  stormCount?: number
  stormScale?: number
  stormPower?: number
  stormStrength?: number
  stormColorStrength?: number
}

const MAX_PALETTE = 16

const scene = new Scene()
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
const material = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uMode: new Uniform(0),
    uResolution: new Uniform(new Vector2(512, 256)),
    uSeed: new Uniform(new Vector3()),
    uTint: new Uniform(new Vector3(1, 1, 1)),
    uTintShadowFloor: new Uniform(0.22),
    uTextureScale: new Uniform(1),
    uBandCount: new Uniform(10),
    uBandSharpness: new Uniform(0.5),
    uCloudChaos: new Uniform(0.65),
    uCloudTurbulence: new Uniform(0),
    uStormCount: new Uniform(8),
    uStormScale: new Uniform(0.18),
    uStormPower: new Uniform(2.2),
    uStormStrength: new Uniform(0.45),
    uStormColorStrength: new Uniform(0.4),
    uPaletteSize: new Uniform(2),
    uPalette: new Uniform(Array.from({ length: MAX_PALETTE }, () => new Vector3())),
    uPalettePositions: new Uniform(Array.from({ length: MAX_PALETTE }, () => 1)),
  },
})
const quad = new Mesh(new PlaneGeometry(2, 2), material)
quad.frustumCulled = false
scene.add(quad)

const normalMaterial = new ShaderMaterial({
  vertexShader,
  fragmentShader: normalFragmentShader,
  uniforms: {
    uHeightMap: new Uniform(null),
    uResolution: new Uniform(new Vector2(1, 1)),
  },
})
const normalScene = new Scene()
const normalQuad = new Mesh(new PlaneGeometry(2, 2), normalMaterial)
normalQuad.frustumCulled = false
normalScene.add(normalQuad)

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

function setPaletteUniform(palette: Palette) {
  const paletteVectors = material.uniforms.uPalette.value as Vector3[]
  const palettePositions = material.uniforms.uPalettePositions.value as number[]

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

  material.uniforms.uPaletteSize.value = Math.max(2, Math.min(MAX_PALETTE, palette.length))
}

function renderTexture(
  renderer: WebGLRenderer,
  mode: 0 | 1 | 2,
  width: number,
  height: number,
  noiseOffset: NoiseOffset,
  palette: Palette,
  options: GasGiantTextureOptions = {}
) {
  material.uniforms.uMode.value = mode
  material.uniforms.uResolution.value.set(width, height)
  material.uniforms.uSeed.value.set(noiseOffset.x, noiseOffset.y, noiseOffset.z)
  material.uniforms.uTint.value.copy(parseHexTint(options.surfaceTint))
  material.uniforms.uTintShadowFloor.value = sanitizeGasGiantNumber(
    'tintShadowFloor',
    options.tintShadowFloor
  )
  material.uniforms.uTextureScale.value = sanitizeGasGiantNumber('colorScale', options.textureScale)
  material.uniforms.uBandCount.value = sanitizeGasGiantNumber(
    'cloudBandCount',
    options.cloudBandCount
  )
  material.uniforms.uBandSharpness.value = sanitizeGasGiantNumber(
    'cloudBandSharpness',
    options.cloudBandSharpness
  )
  material.uniforms.uCloudChaos.value = sanitizeGasGiantNumber('cloudChaos', options.cloudChaos)
  material.uniforms.uCloudTurbulence.value = sanitizeGasGiantNumber(
    'cloudTurbulence',
    options.cloudTurbulence
  )
  material.uniforms.uStormCount.value = sanitizeGasGiantNumber('stormCount', options.stormCount)
  material.uniforms.uStormScale.value = sanitizeGasGiantNumber('stormScale', options.stormScale)
  material.uniforms.uStormPower.value = sanitizeGasGiantNumber('stormPower', options.stormPower)
  material.uniforms.uStormStrength.value = sanitizeGasGiantNumber(
    'stormStrength',
    options.stormStrength
  )
  material.uniforms.uStormColorStrength.value = sanitizeGasGiantNumber(
    'stormColorStrength',
    options.stormColorStrength
  )
  setPaletteUniform(palette)

  const renderTarget = new WebGLRenderTarget(width, height, {
    depthBuffer: false,
    stencilBuffer: false,
    ...(mode === 2 ? { type: HalfFloatType } : {}),
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
  traceSpan('gpu:gasTexture', () => renderer.render(scene, camera), { mode, width, height })
  renderer.setRenderTarget(previousTarget)
  renderer.setViewport(previousViewport)
  renderer.setScissor(previousScissor)
  renderer.setScissorTest(previousScissorTest)

  const texture = renderTarget.texture
  texture.needsUpdate = true
  texture.userData.renderTarget = renderTarget

  return texture
}

function renderNormalFromHeight(
  renderer: WebGLRenderer,
  heightTexture: Texture,
  width: number,
  height: number
) {
  normalMaterial.uniforms.uHeightMap.value = heightTexture
  normalMaterial.uniforms.uResolution.value.set(width, height)

  const renderTarget = new WebGLRenderTarget(width, height, {
    depthBuffer: false,
    stencilBuffer: false,
  })
  renderTarget.texture.wrapS = RepeatWrapping
  renderTarget.texture.wrapT = ClampToEdgeWrapping
  renderTarget.texture.minFilter = LinearFilter
  renderTarget.texture.magFilter = LinearFilter
  renderTarget.texture.generateMipmaps = false
  renderTarget.texture.colorSpace = NoColorSpace

  const previousTarget = renderer.getRenderTarget()
  const previousViewport = renderer.getViewport(new Vector4())
  const previousScissor = renderer.getScissor(new Vector4())
  const previousScissorTest = renderer.getScissorTest()

  renderer.setRenderTarget(renderTarget)
  renderer.setViewport(0, 0, width, height)
  renderer.setScissor(0, 0, width, height)
  renderer.setScissorTest(false)
  renderer.clear()
  traceSpan('gpu:gasNormal', () => renderer.render(normalScene, camera), { width, height })
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

export function createGasGiantColorTexture(
  renderer: WebGLRenderer,
  noiseOffset: NoiseOffset,
  palette: Palette,
  textureHeight: number,
  options: GasGiantTextureOptions = {}
) {
  const height = Math.max(2, Math.floor(textureHeight))
  const width = height * 2

  const texture = renderTexture(renderer, 0, width, height, noiseOffset, palette, options)
  texture.anisotropy = 8
  texture.colorSpace = NoColorSpace

  return texture
}

export function createGasGiantNormalTexture(
  renderer: WebGLRenderer,
  noiseOffset: NoiseOffset,
  palette: Palette,
  textureHeight: number,
  options: GasGiantTextureOptions = {}
) {
  const height = Math.max(2, Math.floor(textureHeight))
  const width = height * 2

  const heightTexture = renderTexture(renderer, 2, width, height, noiseOffset, palette, options)
  const texture = renderNormalFromHeight(renderer, heightTexture, width, height)
  disposeGeneratedTexture(heightTexture)
  texture.anisotropy = 8

  return texture
}
