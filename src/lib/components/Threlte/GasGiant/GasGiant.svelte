<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core'
  import {
    Color,
    IcosahedronGeometry,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    WebGLRenderTarget,
    type Texture,
  } from 'three'
  import { onDestroy } from 'svelte'
  import { trackPalette } from '../../../types/paletteState.svelte'
  import { GasGiantPalettes } from '../GasGiant/GasGiantPalettes'
  import type { GasGiantSettings, GasGiantViewMode } from '../GasGiant/GasGiantSettings'
  import {
    createGasGiantNormalTexture,
    createGasGiantColorTexture,
    disposeGeneratedTexture,
  } from '../GasGiant/GasGiantGpuTextures'

  type Props = {
    settings: GasGiantSettings
    viewMode?: GasGiantViewMode
  }

  let { settings, viewMode = 'mesh' }: Props = $props()
  let {
    palette,
    surfaceTint,
    colorScale,
    tintShadowFloor,
    seed,
    cloudBandCount,
    cloudBandSharpness,
    cloudChaos,
    enableStorms,
    stormCount,
    stormScale,
    stormPower,
    stormStrength,
    stormColorStrength,
    normalStrength,
    roughness,
    metalness,
    autoRotate,
    normalTextureSize,
    colorTextureSize,
  } = $derived(settings)

  let mesh = $state<Mesh | undefined>(undefined)
  let material = $state<MeshStandardMaterial | undefined>(undefined)
  let mapPreviewMaterial = $state<MeshBasicMaterial | undefined>(undefined)
  let colorTexture = $state<ReturnType<typeof createGasGiantColorTexture> | undefined>(undefined)
  let normalTexture = $state<ReturnType<typeof createGasGiantNormalTexture> | undefined>(undefined)
  let color = $derived(new Color('#ffffff'))

  const { renderer } = useThrelte()

  const geometry = new IcosahedronGeometry(2, 18)

  $effect(() => {
    if (!mapPreviewMaterial) return

    mapPreviewMaterial.map =
      viewMode === 'normal' ? (normalTexture ?? null) : (colorTexture ?? null)
    mapPreviewMaterial.needsUpdate = true
  })

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

  export async function downloadNormalMapPng(fileName = 'gas-giant-normal-map.png') {
    const normalMap = (material?.normalMap as Texture | null | undefined) ?? normalTexture
    return downloadRenderTexture(normalMap, fileName)
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
    if (!renderer) return

    const paletteData = trackPalette(GasGiantPalettes[palette])
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
    if (material) {
      material.map = nextTexture
      material.needsUpdate = true
    }
    if (mapPreviewMaterial && viewMode === 'texture') {
      mapPreviewMaterial.map = nextTexture
      mapPreviewMaterial.needsUpdate = true
    }

    return () => {
      if (colorTexture === nextTexture) {
        colorTexture = undefined
      }
      disposeGeneratedTexture(nextTexture)
    }
  })

  $effect(() => {
    if (!renderer) return

    const paletteData = GasGiantPalettes[palette]
    const effectiveStormCount = enableStorms ? stormCount : 0
    const effectiveStormScale = enableStorms ? stormScale : 0
    const effectiveStormPower = enableStorms ? stormPower : 2.2
    const effectiveStormStrength = enableStorms ? stormStrength : 0
    const effectiveStormColorStrength = enableStorms ? stormColorStrength : 0

    const nextNormal = createGasGiantNormalTexture(
      renderer,
      noiseOffset,
      paletteData,
      normalTextureSize,
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

    normalTexture = nextNormal
    if (material) {
      material.bumpMap = null
      material.normalMap = nextNormal
      material.bumpScale = 0
      material.normalScale.set(normalStrength, normalStrength)
      material.needsUpdate = true
    }
    if (mapPreviewMaterial && viewMode === 'normal') {
      mapPreviewMaterial.map = nextNormal
      mapPreviewMaterial.needsUpdate = true
    }

    return () => {
      if (normalTexture === nextNormal) {
        normalTexture = undefined
      }
      disposeGeneratedTexture(nextNormal)
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

{#if viewMode === 'mesh'}
  <T.Mesh bind:ref={mesh} {geometry} rotation={[0, 0, 0]}>
    <T.MeshStandardMaterial bind:ref={material} {color} {roughness} {metalness} />
  </T.Mesh>
{:else}
  <T.Mesh scale={[3.8, 3.8, 1]} renderOrder={10}>
    <T.PlaneGeometry args={[1.8, 0.9]} />
    <T.MeshBasicMaterial bind:ref={mapPreviewMaterial} toneMapped={false} />
  </T.Mesh>
{/if}
