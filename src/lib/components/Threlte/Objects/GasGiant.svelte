<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core'
  import {
    Color,
    IcosahedronGeometry,
    Mesh,
    MeshStandardMaterial,
    WebGLRenderTarget,
    type Texture,
  } from 'three'
  import { onDestroy } from 'svelte'
  import { GasGiantPalettes } from './GasGiantPalettes'
  import { DefaultValues, type GasGiantSettings } from './GasGiantSettings'
  import {
    createGasGiantBumpTexture,
    createGasGiantColorTexture,
    disposeGeneratedTexture,
  } from './GasGiantGpuTextures'

  type Props = Partial<GasGiantSettings>

  let {
    palette = DefaultValues.palette,
    surfaceTint = DefaultValues.surfaceTint,
    colorScale = DefaultValues.colorScale,
    tintShadowFloor = DefaultValues.tintShadowFloor,
    seed = DefaultValues.seed,
    cloudBandCount = DefaultValues.cloudBandCount,
    cloudBandSharpness = DefaultValues.cloudBandSharpness,
    cloudChaos = DefaultValues.cloudChaos,
    enableStorms = DefaultValues.enableStorms,
    stormCount = DefaultValues.stormCount,
    stormScale = DefaultValues.stormScale,
    stormPower = DefaultValues.stormPower,
    stormStrength = DefaultValues.stormStrength,
    stormColorStrength = DefaultValues.stormColorStrength,
    bumpScale = DefaultValues.bumpScale,
    roughness = DefaultValues.roughness,
    metalness = DefaultValues.metalness,
    autoRotate = DefaultValues.autoRotate,
    bumpTextureSize = DefaultValues.bumpTextureSize,
    colorTextureSize = DefaultValues.colorTextureSize,
  }: Props = $props()

  let mesh = $state<Mesh | undefined>(undefined)
  let material = $state<MeshStandardMaterial | undefined>(undefined)
  let colorTexture = $state<ReturnType<typeof createGasGiantColorTexture> | undefined>(undefined)
  let bumpTexture = $state<ReturnType<typeof createGasGiantBumpTexture> | undefined>(undefined)
  let color = $derived(new Color('#ffffff'))

  const { renderer } = useThrelte()

  const geometry = new IcosahedronGeometry(2, 18)

  function flipRowsRgba(source: Uint8Array, width: number, height: number) {
    const rowSize = width * 4
    const flipped = new Uint8Array(source.length)

    for (let y = 0; y < height; y++) {
      const sourceStart = y * rowSize
      const targetStart = (height - 1 - y) * rowSize
      flipped.set(source.subarray(sourceStart, sourceStart + rowSize), targetStart)
    }

    return flipped
  }

  function triggerPngDownload(
    width: number,
    height: number,
    rgbaPixels: Uint8Array,
    fileName: string
  ) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) return false

    const imageData = new ImageData(new Uint8ClampedArray(rgbaPixels), width, height)
    context.putImageData(imageData, 0, 0)

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = fileName
    link.click()

    return true
  }

  function downloadRenderTexture(texture: Texture | null | undefined, fileName: string) {
    if (!renderer || !texture) return false

    const renderTarget = texture.userData.renderTarget as WebGLRenderTarget | undefined
    if (!renderTarget) return false

    const width = renderTarget.width
    const height = renderTarget.height
    const pixels = new Uint8Array(width * height * 4)
    const previousTarget = renderer.getRenderTarget()

    try {
      renderer.setRenderTarget(renderTarget)
      renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, pixels)
    } catch (error) {
      console.error('Failed to read render target pixels', error)
      return false
    } finally {
      renderer.setRenderTarget(previousTarget)
    }

    const flipped = flipRowsRgba(pixels, width, height)
    return triggerPngDownload(width, height, flipped, fileName)
  }

  export async function downloadTextureMapPng(fileName = 'gas-giant-texture-map.png') {
    const colorMap = (material?.map as Texture | null | undefined) ?? colorTexture
    return downloadRenderTexture(colorMap, fileName)
  }

  export async function downloadBumpMapPng(fileName = 'gas-giant-bump-map.png') {
    const bumpMap = (material?.bumpMap as Texture | null | undefined) ?? bumpTexture
    return downloadRenderTexture(bumpMap, fileName)
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

  const noiseOffset = $derived.by(() => {
    const random = createRandom(seed)
    return {
      x: random() * 1000,
      y: random() * 1000,
      z: random() * 1000,
    }
  })

  $effect(() => {
    if (!renderer || !material) return

    const paletteData = GasGiantPalettes[palette]
    const effectiveStormCount = enableStorms ? stormCount : 0
    const effectiveStormScale = enableStorms ? stormScale : 0
    const effectiveStormPower = enableStorms ? stormPower : 2.2
    const effectiveStormStrength = enableStorms ? stormStrength : 0
    const effectiveStormColorStrength = enableStorms ? stormColorStrength : 0

    const nextTexture = createGasGiantColorTexture(
      renderer,
      noiseOffset,
      paletteData,
      colorTextureSize,
      {
        surfaceTint,
        tintShadowFloor,
        textureScale: colorScale,
        cloudBandCount: cloudBandCount,
        cloudBandSharpness: cloudBandSharpness,
        cloudChaos,
        stormCount: effectiveStormCount,
        stormScale: effectiveStormScale,
        stormPower: effectiveStormPower,
        stormStrength: effectiveStormStrength,
        stormColorStrength: effectiveStormColorStrength,
      }
    )

    colorTexture = nextTexture
    material.map = nextTexture
    material.needsUpdate = true

    return () => {
      if (colorTexture === nextTexture) {
        colorTexture = undefined
      }
      disposeGeneratedTexture(nextTexture)
    }
  })

  $effect(() => {
    if (!renderer || !material) return

    const paletteData = GasGiantPalettes[palette]
    const effectiveStormCount = enableStorms ? stormCount : 0
    const effectiveStormScale = enableStorms ? stormScale : 0
    const effectiveStormPower = enableStorms ? stormPower : 2.2
    const effectiveStormStrength = enableStorms ? stormStrength : 0
    const effectiveStormColorStrength = enableStorms ? stormColorStrength : 0

    const nextBump = createGasGiantBumpTexture(
      renderer,
      noiseOffset,
      paletteData,
      bumpTextureSize,
      {
        surfaceTint,
        tintShadowFloor,
        textureScale: colorScale,
        cloudBandCount: cloudBandCount,
        cloudBandSharpness: cloudBandSharpness,
        cloudChaos,
        stormCount: effectiveStormCount,
        stormScale: effectiveStormScale,
        stormPower: effectiveStormPower,
        stormStrength: effectiveStormStrength,
        stormColorStrength: effectiveStormColorStrength,
      }
    )

    bumpTexture = nextBump
    material.bumpMap = nextBump
    material.bumpScale = bumpScale
    material.needsUpdate = true

    return () => {
      if (bumpTexture === nextBump) {
        bumpTexture = undefined
      }
      disposeGeneratedTexture(nextBump)
    }
  })

  useTask((delta) => {
    if (!autoRotate || !mesh) return
    mesh.rotation.y += delta * 0.18
  })

  onDestroy(() => {
    geometry.dispose()
  })
</script>

<T.Mesh bind:ref={mesh} {geometry} rotation={[0, 0, 0]}>
  <T.MeshStandardMaterial bind:ref={material} {color} {roughness} {metalness} />
</T.Mesh>
