<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core'
  import { OrbitControls, interactivity } from '@threlte/extras'
  import { Group, MOUSE, Vector3 } from 'three'
  import type { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js'
  import { onDestroy } from 'svelte'
  import { downloadScenePng as downloadScenePngFile } from '../../utils/downloadScenePng'
  import GasGiant from './GasGiant/GasGiant.svelte'
  import { DefaultValues, type GasGiantSettings } from './GasGiant/GasGiantSettings'
  import PlanetaryRingShadow from './Rings/PlanetaryRingShadow.svelte'
  import PlanetaryRings from './Rings/PlanetaryRings.svelte'
  import type { RingSettings } from './Rings/RingSettings'

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
    enableRings = DefaultValues.enableRings,
    ringPalette = DefaultValues.ringPalette,
    ringInnerRadius = DefaultValues.ringInnerRadius,
    ringOuterRadius = DefaultValues.ringOuterRadius,
    ringTilt = DefaultValues.ringTilt,
    ringBandCount = DefaultValues.ringBandCount,
    ringBandSharpness = DefaultValues.ringBandSharpness,
    ringDensity = DefaultValues.ringDensity,
    ringTextureScale = DefaultValues.ringTextureScale,
    ringGranularity = DefaultValues.ringGranularity,
    ringSolarization = DefaultValues.ringSolarization,
    ringOpacity = DefaultValues.ringOpacity,
  }: Props = $props()

  let controlsRef: OrbitControlsImpl | undefined = $state(undefined)
  let planetarySystem: Group | undefined = $state(undefined)
  type GasGiantExports = {
    downloadTextureMapPng: (fileName?: string) => Promise<boolean>
    downloadBumpMapPng: (fileName?: string) => Promise<boolean>
  }
  let gasGiantRef: GasGiantExports | undefined = $state(undefined)
  const { camera, renderer, scene } = useThrelte()

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

  export function downloadScenePng(fileName = 'gas-giant-render.png') {
    return downloadScenePngFile(renderer, scene, $camera, fileName)
  }

  const settings: GasGiantSettings = $derived({
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
    bumpScale,
    roughness,
    metalness,
    autoRotate,
    bumpTextureSize,
    colorTextureSize,
    enableRings,
    ringPalette,
    ringInnerRadius,
    ringOuterRadius,
    ringTilt,
    ringBandCount,
    ringBandSharpness,
    ringDensity,
    ringTextureScale,
    ringGranularity,
    ringSolarization,
    ringOpacity,
  })

  const ringSettings: RingSettings = $derived({
    enableRings,
    ringPalette,
    ringInnerRadius,
    ringOuterRadius,
    ringTilt,
    ringBandCount,
    ringBandSharpness,
    ringDensity,
    ringTextureScale,
    ringGranularity,
    ringSolarization,
    ringOpacity,
  })

  const planetSettings: GasGiantSettings = $derived({ ...settings, autoRotate: false })
  const rotationAxis = $derived.by(() => {
    const tilt = (ringTilt * Math.PI) / 180
    return new Vector3(-Math.sin(tilt), Math.cos(tilt), 0).normalize()
  })

  useTask((delta) => {
    if (!autoRotate || !planetarySystem) return
    planetarySystem.rotateOnAxis(rotationAxis, delta * 0.18)
  })
</script>

<T.PerspectiveCamera makeDefault position={[0, 2, 7]}>
  <OrbitControls
    bind:ref={controlsRef}
    enableRotate={true}
    enableZoom={true}
    enablePan={false}
    zoomToCursor={false}
    minDistance={4}
    maxDistance={14}
    zoomSpeed={1.2}
    enableDamping={true}
    dampingFactor={0.2}
  />
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.08} />
<T.DirectionalLight position={[-5, 1, 2]} intensity={6} />

<T.Group bind:ref={planetarySystem}>
  <GasGiant bind:this={gasGiantRef} settings={planetSettings} />
  <PlanetaryRingShadow settings={ringSettings} {seed} planetRadius={2} lightPosition={[-5, 1, 2]} />
  <PlanetaryRings settings={ringSettings} {seed} planetRadius={2} lightPosition={[-5, 1, 2]} />
</T.Group>
