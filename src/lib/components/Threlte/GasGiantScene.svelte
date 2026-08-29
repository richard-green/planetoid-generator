<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { OrbitControls, interactivity } from '@threlte/extras'
  import { MOUSE } from 'three'
  import type { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js'
  import { onDestroy } from 'svelte'
  import GasGiant from './Objects/GasGiant.svelte'
  import { DefaultValues, type GasGiantSettings } from './Objects/GasGiantSettings'

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

  let controlsRef: OrbitControlsImpl | undefined = $state(undefined)
  type GasGiantExports = {
    downloadTextureMapPng: (fileName?: string) => Promise<boolean>
    downloadBumpMapPng: (fileName?: string) => Promise<boolean>
  }
  let gasGiantRef: GasGiantExports | undefined = $state(undefined)
  const { scene } = useThrelte()

  interactivity()

  scene.background = null

  onDestroy(() => {
    scene.background = null
  })

  $effect(() => {
    if (!controlsRef) return
    controlsRef.enableRotate = true
    controlsRef.enablePan = false
    controlsRef.screenSpacePanning = true
    controlsRef.mouseButtons.LEFT = MOUSE.ROTATE
    controlsRef.mouseButtons.RIGHT = MOUSE.ROTATE
    controlsRef.update()
  })

  export async function downloadTextureMapPng(fileName?: string) {
    return (await gasGiantRef?.downloadTextureMapPng(fileName)) ?? false
  }

  export async function downloadBumpMapPng(fileName?: string) {
    return (await gasGiantRef?.downloadBumpMapPng(fileName)) ?? false
  }
</script>

<T.PerspectiveCamera makeDefault position={[0, 2, 7]}>
  <OrbitControls
    bind:ref={controlsRef}
    enableRotate={true}
    enableZoom={true}
    enablePan={false}
    zoomToCursor={false}
    minDistance={4}
    maxDistance={10}
    zoomSpeed={1.2}
    enableDamping={true}
    dampingFactor={0.2}
  />
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.08} />
<T.DirectionalLight position={[-5, 1, 2]} intensity={6} />

<GasGiant
  bind:this={gasGiantRef}
  {palette}
  {surfaceTint}
  {colorScale}
  {tintShadowFloor}
  {seed}
  {cloudBandCount}
  {cloudBandSharpness}
  {cloudChaos}
  {enableStorms}
  {stormCount}
  {stormScale}
  {stormPower}
  {stormStrength}
  {stormColorStrength}
  {bumpScale}
  {roughness}
  {metalness}
  {autoRotate}
  {bumpTextureSize}
  {colorTextureSize}
/>
