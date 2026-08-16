<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { OrbitControls, interactivity } from '@threlte/extras'
  import { MOUSE } from 'three'
  import type { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js'
  import { onDestroy } from 'svelte'
  import GasGiant from './Objects/GasGiant.svelte'
  import { DefaultGasGiantSettings, type GasGiantSettings } from './Objects/GasGiantSettings'

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

  let controlsRef: OrbitControlsImpl | undefined = $state(undefined)
  type GasGiantExports = {
    downloadTextureMapPng: (fileName?: string) => Promise<boolean>
    downloadBumpMapPng: (fileName?: string) => Promise<boolean>
  }
  let gasGiantRef: GasGiantExports | undefined = $state(undefined)
  const { camera, scene } = useThrelte()

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
    {camera}
    enableRotate={true}
    enableZoom={true}
    enablePan={false}
    zoomToCursor={false}
    minDistance={2}
    maxDistance={15}
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
