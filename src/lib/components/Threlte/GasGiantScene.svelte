<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core'
  import { OrbitControls, interactivity } from '@threlte/extras'
  import { Group, MOUSE } from 'three'
  import type { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js'
  import { onDestroy } from 'svelte'
  import { downloadScenePng as downloadScenePngFile } from '../../utils/downloadScenePng'
  import { applyCameraView, readCameraView, type CameraView } from '../../utils/cameraView'
  import GasGiant from './GasGiant/GasGiant.svelte'
  import {
    DefaultValues,
    type GasGiantSettings,
    type GasGiantViewMode,
  } from './GasGiant/GasGiantSettings'
  import PlanetaryRingShadow from './Rings/PlanetaryRingShadow.svelte'
  import PlanetaryRings from './Rings/PlanetaryRings.svelte'
  import type { RingSettings } from './Rings/RingSettings'

  type Props = Partial<GasGiantSettings> & { viewMode?: GasGiantViewMode }

  let {
    viewMode = 'mesh',
    palette = DefaultValues.palette,
    surfaceTint = DefaultValues.surfaceTint,
    colorScale = DefaultValues.colorScale,
    tintShadowFloor = DefaultValues.tintShadowFloor,
    seed = DefaultValues.seed,
    cloudBandCount = DefaultValues.cloudBandCount,
    cloudBandSharpness = DefaultValues.cloudBandSharpness,
    cloudChaos = DefaultValues.cloudChaos,
    cloudTurbulence = DefaultValues.cloudTurbulence,
    enableStorms = DefaultValues.enableStorms,
    stormCount = DefaultValues.stormCount,
    stormScale = DefaultValues.stormScale,
    stormPower = DefaultValues.stormPower,
    stormStrength = DefaultValues.stormStrength,
    stormColorStrength = DefaultValues.stormColorStrength,
    normalStrength = DefaultValues.normalStrength,
    roughness = DefaultValues.roughness,
    metalness = DefaultValues.metalness,
    enableAtmosphere = DefaultValues.enableAtmosphere,
    atmospherePalette = DefaultValues.atmospherePalette,
    atmosphereIntensity = DefaultValues.atmosphereIntensity,
    atmosphereThickness = DefaultValues.atmosphereThickness,
    atmosphereDropoff = DefaultValues.atmosphereDropoff,
    atmosphereTerminatorWrap = DefaultValues.atmosphereTerminatorWrap,
    autoRotate = DefaultValues.autoRotate,
    normalTextureSize = DefaultValues.normalTextureSize,
    colorTextureSize = DefaultValues.colorTextureSize,
    enableRings = DefaultValues.enableRings,
    ringPalette = DefaultValues.ringPalette,
    ringInnerRadius = DefaultValues.ringInnerRadius,
    ringOuterRadius = DefaultValues.ringOuterRadius,
    ringTilt = DefaultValues.ringTilt,
    ringBandCount = DefaultValues.ringBandCount,
    ringBandSharpness = DefaultValues.ringBandSharpness,
    ringBandRegularity = DefaultValues.ringBandRegularity,
    ringDensity = DefaultValues.ringDensity,
    ringTextureScale = DefaultValues.ringTextureScale,
    ringGranularity = DefaultValues.ringGranularity,
    ringPaletteInfluence = DefaultValues.ringPaletteInfluence,
    ringSolarization = DefaultValues.ringSolarization,
    ringOpacity = DefaultValues.ringOpacity,
    ringNoise = DefaultValues.ringNoise,
    ringGlitter = DefaultValues.ringGlitter,
  }: Props = $props()

  let controlsRef: OrbitControlsImpl | undefined = $state(undefined)
  let planetarySystem: Group | undefined = $state(undefined)
  let previousViewMode: GasGiantViewMode = 'mesh'
  const viewCameraState = {
    mesh: { position: [0, 2, 7] as const, target: [0, 0, 0] as const },
    map: { position: [0, 0, 7] as const, target: [0, 0, 0] as const },
  }
  type GasGiantExports = {
    downloadTextureMapPng: (fileName?: string) => Promise<boolean>
    downloadNormalMapPng: (fileName?: string) => Promise<boolean>
  }
  let gasGiantRef: GasGiantExports | undefined = $state(undefined)
  const { camera, renderer, scene, invalidate } = useThrelte()

  interactivity()

  scene.background = null

  onDestroy(() => {
    scene.background = null
  })

  $effect(() => {
    if (!controlsRef) return

    const isMeshMode = viewMode === 'mesh'
    const previousKey = previousViewMode === 'mesh' ? 'mesh' : 'map'
    const currentKey = isMeshMode ? 'mesh' : 'map'

    if (previousViewMode !== viewMode) {
      const position = $camera.position
      const target = controlsRef.target
      viewCameraState[previousKey] = {
        position: [position.x, position.y, position.z],
        target: [target.x, target.y, target.z],
      }

      if (previousKey !== currentKey) {
        const state = viewCameraState[currentKey]
        $camera.position.set(...state.position)
        controlsRef.target.set(...state.target)
      }
      planetarySystem?.rotation.set(0, 0, 0)
      ringSpin = 0
    }

    previousViewMode = viewMode
    controlsRef.enableRotate = isMeshMode
    controlsRef.enablePan = !isMeshMode
    controlsRef.screenSpacePanning = true
    controlsRef.minDistance = isMeshMode ? 4 : 0.5
    controlsRef.maxDistance = isMeshMode ? 14 : 8
    controlsRef.zoomToCursor = !isMeshMode
    controlsRef.mouseButtons.LEFT = isMeshMode ? MOUSE.ROTATE : MOUSE.PAN
    controlsRef.mouseButtons.RIGHT = isMeshMode ? MOUSE.ROTATE : MOUSE.PAN
    controlsRef.update()
  })

  export async function downloadTextureMapPng(fileName?: string) {
    return (await gasGiantRef?.downloadTextureMapPng(fileName)) ?? false
  }

  export async function downloadNormalMapPng(fileName?: string) {
    return (await gasGiantRef?.downloadNormalMapPng(fileName)) ?? false
  }

  export function downloadScenePng(fileName = 'gas-giant-render.png') {
    return downloadScenePngFile(renderer, scene, $camera, fileName)
  }

  export function setCameraView(view: CameraView) {
    if (!controlsRef) return
    applyCameraView($camera, controlsRef, view)
    invalidate()
  }

  export function getCameraView(): CameraView | undefined {
    return controlsRef ? readCameraView($camera, controlsRef) : undefined
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
    cloudTurbulence,
    enableStorms,
    stormCount,
    stormScale,
    stormPower,
    stormStrength,
    stormColorStrength,
    normalStrength,
    roughness,
    metalness,
    enableAtmosphere,
    atmospherePalette,
    atmosphereIntensity,
    atmosphereThickness,
    atmosphereDropoff,
    atmosphereTerminatorWrap,
    autoRotate,
    normalTextureSize,
    colorTextureSize,
    enableRings,
    ringPalette,
    ringInnerRadius,
    ringOuterRadius,
    ringTilt,
    ringBandCount,
    ringBandSharpness,
    ringBandRegularity,
    ringDensity,
    ringTextureScale,
    ringGranularity,
    ringPaletteInfluence,
    ringSolarization,
    ringOpacity,
    ringNoise,
    ringGlitter,
  })

  const ringSettings: RingSettings = $derived({
    enableRings,
    ringPalette,
    ringInnerRadius,
    ringOuterRadius,
    ringTilt,
    ringBandCount,
    ringBandSharpness,
    ringBandRegularity,
    ringDensity,
    ringTextureScale,
    ringGranularity,
    ringPaletteInfluence,
    ringSolarization,
    ringOpacity,
    ringNoise,
    ringGlitter,
  })

  const planetSettings: GasGiantSettings = $derived({ ...settings, autoRotate: false })

  let ringSpin = $state(0)

  useTask((delta) => {
    if (viewMode !== 'mesh' || !autoRotate) return
    if (planetarySystem) planetarySystem.rotation.y += delta * 0.18
    ringSpin += delta * 0.06
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

<T.Group>
  <T.Group bind:ref={planetarySystem}>
    <GasGiant bind:this={gasGiantRef} settings={planetSettings} {viewMode} />
  </T.Group>
  {#if viewMode === 'mesh'}
    <PlanetaryRingShadow
      settings={ringSettings}
      {seed}
      planetRadius={2}
      lightPosition={[-5, 1, 2]}
    />
    <PlanetaryRings
      settings={ringSettings}
      {seed}
      planetRadius={2}
      lightPosition={[-5, 1, 2]}
      spin={ringSpin}
    />
  {/if}
</T.Group>
