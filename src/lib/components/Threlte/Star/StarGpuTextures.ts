import { vertexShader, fragmentShader } from './StarShaders'
import {
  ClampToEdgeWrapping,
  LinearFilter,
  Mesh,
  NoColorSpace,
  OrthographicCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  type Texture,
  type WebGLRenderer,
} from 'three'
import { getPalettePosition, type Palette } from '../../../types/palette'

const MAX_PALETTE = 16

/** Maps a seed to a distant, well-mixed noise-space offset so each seed yields a distinct star. */
export function starSeedOffset(seed: number): Vector3 {
  const component = (salt: number) => {
    let hash = Math.imul((Math.floor(seed) ^ salt) >>> 0, 0x9e3779b1)
    hash ^= hash >>> 15
    hash = Math.imul(hash, 0x85ebca6b)
    hash ^= hash >>> 13
    // Kept under ~100 so the sin-based shader hashes stay precise.
    return ((hash >>> 0) / 4294967296) * 100
  }
  return new Vector3(component(0x68e31da4), component(0xb5297a4d), component(0x1b56c4e9))
}





export function createStarColorTexture(
  renderer: WebGLRenderer,
  seed: number,
  textureHeight: number,
  scale: number,
  bandContrast: number,
  bandSwirl: number,
  granularity: number,
  turbulence: number,
  convection: number,
  sunspotCount: number,
  sunspotScale: number,
  sunspotPower: number,
  sunspotJaggedness: number,
  sunspotNeighbours: number,
  penumbraScale: number,
  sunspotDarkness: number,
  brightness: number,
  saturation: number,
  contrast: number,
  palette: Palette
): Texture {
  const height = Math.max(2, Math.floor(textureHeight))
  const width = height * 2
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uSeed: { value: starSeedOffset(seed) },
      uScale: { value: scale },
      uBandContrast: { value: bandContrast },
      uBandSwirl: { value: bandSwirl },
      uGranularity: { value: granularity },
      uTurbulence: { value: turbulence },
      uConvection: { value: convection },
      uSunspotCount: { value: sunspotCount },
      uSunspotScale: { value: sunspotScale },
      uSunspotPower: { value: sunspotPower },
      uSunspotJaggedness: { value: sunspotJaggedness },
      uSunspotNeighbours: { value: sunspotNeighbours },
      uPenumbraScale: { value: penumbraScale },
      uSunspotDarkness: { value: sunspotDarkness },
      uBrightness: { value: brightness },
      uSaturation: { value: saturation },
      uContrast: { value: contrast },
      uPaletteSize: { value: Math.max(2, Math.min(MAX_PALETTE, palette.length)) },
      uPalette: {
        value: Array.from({ length: MAX_PALETTE }, (_, index) => {
          const color = palette[Math.min(index, Math.max(0, palette.length - 1))] ?? {
            r: 255,
            g: 255,
            b: 255,
          }
          return new Vector3(color.r / 255, color.g / 255, color.b / 255)
        }),
      },
      uPalettePositions: {
        value: Array.from({ length: MAX_PALETTE }, (_, index) =>
          getPalettePosition(palette, Math.min(index, Math.max(0, palette.length - 1)))
        ),
      },
    },
  })
  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const mesh = new Mesh(new PlaneGeometry(2, 2), material)
  scene.add(mesh)
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
  renderer.setRenderTarget(renderTarget)
  renderer.setViewport(0, 0, width, height)
  renderer.clear()
  renderer.render(scene, camera)
  renderer.setRenderTarget(previousTarget)
  renderer.setViewport(previousViewport)
  mesh.geometry.dispose()
  material.dispose()

  const texture = renderTarget.texture
  texture.colorSpace = NoColorSpace
  texture.userData.renderTarget = renderTarget
  return texture
}

export function disposeStarTexture(texture: Texture): void {
  const renderTarget = texture.userData.renderTarget as WebGLRenderTarget | undefined
  renderTarget?.dispose()
}
