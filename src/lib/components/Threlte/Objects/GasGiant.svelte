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
  import { DefaultGasGiantSettings, type GasGiantSettings } from './GasGiantSettings'
  import {
    createGasGiantBumpTexture,
    createGasGiantColourTexture,
    disposeGeneratedTexture,
  } from './GasGiantGpuTextures'

  type Props = Partial<GasGiantSettings>

  let {
    palette = DefaultGasGiantSettings.palette,
    surfaceTint = DefaultGasGiantSettings.surfaceTint,
    colorScale = DefaultGasGiantSettings.colorScale,
    tintShadowFloor = DefaultGasGiantSettings.tintShadowFloor,
    seed = DefaultGasGiantSettings.seed,
    cloudBandCount = DefaultGasGiantSettings.cloudBandCount,
    cloudBandSharpness = DefaultGasGiantSettings.cloudBandSharpness,
    cloudChaos = DefaultGasGiantSettings.cloudChaos,
    enableStorms = DefaultGasGiantSettings.enableStorms,
    stormCount = DefaultGasGiantSettings.stormCount,
    stormScale = DefaultGasGiantSettings.stormScale,
    stormPower = DefaultGasGiantSettings.stormPower,
    stormStrength = DefaultGasGiantSettings.stormStrength,
    stormColorStrength = DefaultGasGiantSettings.stormColorStrength,
    bumpScale = DefaultGasGiantSettings.bumpScale,
    roughness = DefaultGasGiantSettings.roughness,
    metalness = DefaultGasGiantSettings.metalness,
    autoRotate = DefaultGasGiantSettings.autoRotate,
    bumpTextureSize = DefaultGasGiantSettings.bumpTextureSize,
    colorTextureSize = DefaultGasGiantSettings.colorTextureSize,
  }: Props = $props()

  let mesh = $state<Mesh | undefined>(undefined)
  let material = $state<MeshStandardMaterial | undefined>(undefined)
  let colourTexture = $state<ReturnType<typeof createGasGiantColourTexture> | undefined>(undefined)
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
    const colorMap = (material?.map as Texture | null | undefined) ?? colourTexture
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

    const nextTexture = createGasGiantColourTexture(
      renderer,
      noiseOffset,
      paletteData,
      colorTextureSize,
      {
        surfaceTint,
        tintShadowFloor,
        textureScale: colorScale,
        bandCount: cloudBandCount,
        bandSharpness: cloudBandSharpness,
        cloudChaos,
        stormCount: effectiveStormCount,
        stormScale: effectiveStormScale,
        stormPower: effectiveStormPower,
        stormStrength: effectiveStormStrength,
        stormColorStrength: effectiveStormColorStrength,
      }
    )

    colourTexture = nextTexture
    material.map = nextTexture
    material.needsUpdate = true

    return () => {
      if (colourTexture === nextTexture) {
        colourTexture = undefined
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
        bandCount: cloudBandCount,
        bandSharpness: cloudBandSharpness,
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
    // mesh.rotation.x += delta * 0.06
  })

  onDestroy(() => {
    geometry.dispose()
  })
</script>

<T.Mesh bind:ref={mesh} {geometry} rotation={[0, 0, 0]}>
  <T.MeshStandardMaterial bind:ref={material} {color} {roughness} {metalness} />
</T.Mesh>
