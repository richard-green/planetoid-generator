<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core'
  import {
    AdditiveBlending,
    BackSide,
    Color,
    Mesh,
    ShaderMaterial,
    Vector3,
    WebGLRenderTarget,
    type Texture,
  } from 'three'
  import { onDestroy } from 'svelte'
  import { createIcosphere } from '../../../utils/geometry'
  import { createStarColorTexture, disposeStarTexture, starSeedOffset } from './StarGpuTextures'
  import {
    surfaceVertexShader,
    surfaceFragmentShader,
    haloVertexShader,
    haloFragmentShader,
    haloDetailFragmentShader,
  } from './StarShaders'
  import { StarPalettes } from './StarPalettes'
  import { MaxValues, MinValues, type StarRangeKey, type StarSettings } from './StarSettings'
  import { sanitizeTextureSize } from '../../../types/textureSize'
  import { getPalettePosition, type Palette } from '../../../types/palette'
  import { trackPalette } from '../../../types/paletteState.svelte'

  type Props = {
    settings: StarSettings
    autoRotate?: boolean
    showStarSurface?: boolean
  }

  let { settings, autoRotate = false, showStarSurface = true }: Props = $props()

  const geometry = createIcosphere(2, 20)
  const haloGeometry = createIcosphere(2.05, 5)
  let mesh = $state<Mesh | undefined>(undefined)
  let plasmaMesh = $state<Mesh | undefined>(undefined)
  let material = $state<ShaderMaterial | undefined>(undefined)
  let haloMaterial = $state<ShaderMaterial | undefined>(undefined)
  let colorTexture = $state<Texture | undefined>(undefined)
  const { renderer } = useThrelte()
  const activePalette = $derived([
    ...trackPalette(StarPalettes[settings.palette] ?? StarPalettes.Orange),
  ])
  const limbColor = $derived(toColor(samplePalette(activePalette, 1)))
  const haloColor = $derived(toColor(samplePalette(activePalette, 0.5)))
  const haloSize = $derived(settings.haloSize)
  const plasmaShellScale = $derived(1 + settings.plasmaExtent)
  const surfaceUniforms = {
    uMap: { value: null },
    uLimbColor: { value: new Color('#ffffff') },
    uLimbIntensity: { value: 0 },
    uSeed: { value: new Vector3() },
    uPlasmaSurfaceIntensity: { value: 0 },
    uPlasmaTurbulence: { value: 0 },
    uPlasmaSharpness: { value: 1 },
    uPlasmaTextureScale: { value: 1 },
  }
  const haloUniforms = {
    uHaloColor: { value: new Color('#ffffff') },
    uSeed: { value: new Vector3() },
    uHaloIntensity: { value: 0 },
    uHaloFalloff: { value: 1 },
    uHaloSize: { value: 1 },
    uHaloTurbulence: { value: 0 },
    uPlasmaIntensity: { value: 0 },
    uPlasmaExtent: { value: 1 },
    uPlasmaTurbulence: { value: 0 },
    uPlasmaSharpness: { value: 1 },
    uPlasmaTextureScale: { value: 1 },
  }
  const plasmaUniforms = {
    uHaloColor: { value: new Color('#ffffff') },
    uSeed: { value: new Vector3() },
    uHaloIntensity: { value: 0 },
    uHaloFalloff: { value: 1 },
    uHaloSize: { value: 1 },
    uHaloTurbulence: { value: 0 },
    uPlasmaIntensity: { value: 0 },
    uPlasmaExtent: { value: 1 },
    uPlasmaTurbulence: { value: 0 },
    uPlasmaSharpness: { value: 1 },
    uPlasmaTextureScale: { value: 1 },
  }

  function samplePalette(palette: Palette, position: number) {
    const upperIndex = palette.findIndex(
      (_, index) => getPalettePosition(palette, index) >= position
    )
    const endIndex = upperIndex < 0 ? palette.length - 1 : upperIndex
    const startIndex = Math.max(0, endIndex - 1)
    const start = palette[startIndex] ?? { r: 255, g: 255, b: 255 }
    const end = palette[endIndex] ?? start
    const startPosition = getPalettePosition(palette, startIndex)
    const endPosition = getPalettePosition(palette, endIndex)
    const amount = Math.min(
      1,
      Math.max(0, (position - startPosition) / Math.max(0.0001, endPosition - startPosition))
    )
    return {
      r: start.r + (end.r - start.r) * amount,
      g: start.g + (end.g - start.g) * amount,
      b: start.b + (end.b - start.b) * amount,
    }
  }

  function toColor(color: { r: number; g: number; b: number }) {
    return new Color(color.r / 255, color.g / 255, color.b / 255)
  }

  function clampSetting(key: StarRangeKey, value: number): number {
    return Math.min(MaxValues[key], Math.max(MinValues[key], value))
  }

  function flipRows(source: Uint8Array, width: number, height: number): Uint8Array {
    const output = new Uint8Array(source.length)
    const rowSize = width * 4
    for (let row = 0; row < height; row += 1) {
      output.set(source.subarray(row * rowSize, (row + 1) * rowSize), (height - row - 1) * rowSize)
    }
    return output
  }

  export function downloadTextureMapPng(fileName = 'generated-star-texture.png'): boolean {
    if (!renderer || !colorTexture) return false
    const target = colorTexture.userData.renderTarget as WebGLRenderTarget | undefined
    if (!target) return false

    const pixels = new Uint8Array(target.width * target.height * 4)
    const previousTarget = renderer.getRenderTarget()
    try {
      renderer.setRenderTarget(target)
      renderer.readRenderTargetPixels(target, 0, 0, target.width, target.height, pixels)
    } finally {
      renderer.setRenderTarget(previousTarget)
    }

    const canvas = document.createElement('canvas')
    canvas.width = target.width
    canvas.height = target.height
    const context = canvas.getContext('2d')
    if (!context) return false
    context.putImageData(
      new ImageData(
        new Uint8ClampedArray(flipRows(pixels, target.width, target.height)),
        target.width,
        target.height
      ),
      0,
      0
    )
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = fileName
    link.click()
    return true
  }

  $effect(() => {
    if (!renderer || !material) return
    const nextTexture = createStarColorTexture(
      renderer,
      clampSetting('seed', settings.seed),
      sanitizeTextureSize(settings.colorTextureSize),
      clampSetting('textureScale', settings.textureScale),
      clampSetting('bandContrast', settings.bandContrast),
      clampSetting('bandSwirl', settings.bandSwirl),
      clampSetting('granularity', settings.granularity),
      clampSetting('turbulence', settings.turbulence),
      clampSetting('convection', settings.convection),
      Math.floor(clampSetting('sunspotCount', settings.sunspotCount)),
      clampSetting('sunspotScale', settings.sunspotScale),
      clampSetting('sunspotPower', settings.sunspotPower),
      clampSetting('sunspotJaggedness', settings.sunspotJaggedness),
      Math.floor(clampSetting('sunspotNeighbours', settings.sunspotNeighbours)),
      clampSetting('penumbraScale', settings.penumbraScale),
      clampSetting('sunspotDarkness', settings.sunspotDarkness),
      clampSetting('brightness', settings.brightness),
      clampSetting('saturation', settings.saturation),
      clampSetting('contrast', settings.contrast),
      activePalette
    )
    colorTexture = nextTexture
    material.uniforms.uMap.value = nextTexture
    material.uniforms.uLimbColor.value = limbColor
    material.uniforms.uLimbIntensity.value = settings.limbBrightness

    return () => {
      if (colorTexture === nextTexture) colorTexture = undefined
      disposeStarTexture(nextTexture)
    }
  })

  $effect(() => {
    const seedOffset = starSeedOffset(settings.seed)
    surfaceUniforms.uSeed.value.copy(seedOffset)
    surfaceUniforms.uPlasmaSurfaceIntensity.value = settings.plasmaSurfaceIntensity
    surfaceUniforms.uPlasmaTurbulence.value = settings.plasmaTurbulence
    surfaceUniforms.uPlasmaSharpness.value = settings.plasmaSharpness
    surfaceUniforms.uPlasmaTextureScale.value = settings.plasmaTextureScale

    if (!haloMaterial) return
    haloMaterial.uniforms.uHaloColor.value = haloColor
    haloMaterial.uniforms.uSeed.value.copy(seedOffset)
    haloMaterial.uniforms.uHaloIntensity.value = settings.haloIntensity
    haloMaterial.uniforms.uHaloFalloff.value = settings.haloFalloff
    haloMaterial.uniforms.uHaloSize.value = settings.haloSize
    haloMaterial.uniforms.uHaloTurbulence.value = settings.haloTurbulence
    haloMaterial.uniforms.uPlasmaIntensity.value = settings.plasmaIntensity
    haloMaterial.uniforms.uPlasmaExtent.value = settings.plasmaExtent
    haloMaterial.uniforms.uPlasmaTurbulence.value = settings.plasmaTurbulence
    haloMaterial.uniforms.uPlasmaSharpness.value = settings.plasmaSharpness
    haloMaterial.uniforms.uPlasmaTextureScale.value = settings.plasmaTextureScale

    plasmaUniforms.uHaloColor.value = haloColor
    plasmaUniforms.uSeed.value.copy(seedOffset)
    plasmaUniforms.uHaloIntensity.value = settings.haloIntensity
    plasmaUniforms.uHaloFalloff.value = settings.haloFalloff
    plasmaUniforms.uHaloSize.value = plasmaShellScale
    plasmaUniforms.uHaloTurbulence.value = settings.haloTurbulence
    plasmaUniforms.uPlasmaIntensity.value = settings.plasmaIntensity
    plasmaUniforms.uPlasmaExtent.value = settings.plasmaExtent
    plasmaUniforms.uPlasmaTurbulence.value = settings.plasmaTurbulence
    plasmaUniforms.uPlasmaSharpness.value = settings.plasmaSharpness
    plasmaUniforms.uPlasmaTextureScale.value = settings.plasmaTextureScale
  })

  useTask((delta) => {
    if (!autoRotate) return
    const rotation = delta * 0.07
    if (mesh) mesh.rotation.y += rotation
    if (plasmaMesh) plasmaMesh.rotation.y += rotation
  })

  onDestroy(() => {
    geometry.dispose()
    haloGeometry.dispose()
  })
</script>

<T.Mesh bind:ref={mesh} {geometry} visible={showStarSurface}>
  <T.ShaderMaterial
    bind:ref={material}
    vertexShader={surfaceVertexShader}
    fragmentShader={surfaceFragmentShader}
    uniforms={surfaceUniforms}
    toneMapped={false}
  />
</T.Mesh>

<T.Mesh geometry={haloGeometry} scale={[haloSize, haloSize, haloSize]}>
  <T.ShaderMaterial
    bind:ref={haloMaterial}
    vertexShader={haloVertexShader}
    fragmentShader={haloFragmentShader}
    uniforms={haloUniforms}
    side={BackSide}
    transparent={true}
    depthWrite={false}
    blending={AdditiveBlending}
    toneMapped={false}
  />
</T.Mesh>

<T.Mesh
  bind:ref={plasmaMesh}
  geometry={haloGeometry}
  scale={[plasmaShellScale, plasmaShellScale, plasmaShellScale]}
>
  <T.ShaderMaterial
    vertexShader={haloVertexShader}
    fragmentShader={haloDetailFragmentShader}
    uniforms={plasmaUniforms}
    side={BackSide}
    transparent={true}
    depthWrite={false}
    blending={AdditiveBlending}
    toneMapped={false}
  />
</T.Mesh>
