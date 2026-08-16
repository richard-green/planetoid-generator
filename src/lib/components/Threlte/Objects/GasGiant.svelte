<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core'
  import { Color, IcosahedronGeometry, Mesh, MeshStandardMaterial } from 'three'
  import { onDestroy } from 'svelte'
  import { GasGiantPalettes, type GasGiantPaletteName } from './GasGiantPalettes'
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

