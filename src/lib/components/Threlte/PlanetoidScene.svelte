<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { OrbitControls, interactivity } from '@threlte/extras'
  import { MOUSE } from 'three'
  import type { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js'
  import { onDestroy } from 'svelte'
  import Planetoid from './Objects/Planetoid.svelte'
  import type { AnyPaletteName } from './Objects/AllPalettes'
  import { DefaultValues, type PlanetoidViewMode } from './Objects/PlanetoidSettings'

  type Props = {
    viewMode?: PlanetoidViewMode
    palette?: AnyPaletteName
    surfaceTint?: string
    colorScale?: number
    tintShadowFloor?: number
    swirliness?: number
    seed?: number
    largeScale?: number
    mediumScale?: number
    smallScale?: number
    mediumFrequency?: number
    smallFrequency?: number
    normalStrength?: number
    enableCraters?: boolean
    craterCount?: number
    craterScale?: number
    craterStrength?: number
    craterSharpness?: number
    craterColorStrength?: number
    enableVolcanoes?: boolean
    volcanoCount?: number
    volcanoScale?: number
    volcanoStrength?: number
    volcanoColorStrength?: number
    ridgeColorWeight?: number
    riftColorWeight?: number
    enableRidges?: boolean
    enableRifts?: boolean
    ridgeStrength?: number
    ridgeFrequency?: number
    ridgeSharpness?: number
    riftStrength?: number
    riftFrequency?: number
    riftWidth?: number
    riftSharpness?: number
    ridgesRiftsBlend?: number
    roughness?: number
    metalness?: number
    autoRotate?: boolean
    showDebugMeshes?: boolean
    triangleDetail?: number
    normalTextureSize?: number
    colorTextureSize?: number
  }

  let {
    viewMode = 'mesh',
    palette = DefaultValues.palette,
    surfaceTint = DefaultValues.surfaceTint,
    colorScale = DefaultValues.colorScale,
    tintShadowFloor = DefaultValues.tintShadowFloor,
    swirliness = DefaultValues.swirliness,
    seed = DefaultValues.seed,
    largeScale = DefaultValues.largeScale,
    mediumScale = DefaultValues.mediumScale,
    smallScale = DefaultValues.smallScale,
    mediumFrequency = DefaultValues.mediumFrequency,
    smallFrequency = DefaultValues.smallFrequency,
    normalStrength = DefaultValues.normalStrength,
    enableCraters = DefaultValues.enableCraters,
    craterCount = DefaultValues.craterCount,
    craterScale = DefaultValues.craterScale,
    craterStrength = DefaultValues.craterStrength,
    craterSharpness = DefaultValues.craterSharpness,
    craterColorStrength = DefaultValues.craterColorStrength,
    enableVolcanoes = DefaultValues.enableVolcanoes,
    volcanoCount = DefaultValues.volcanoCount,
    volcanoScale = DefaultValues.volcanoScale,
    volcanoStrength = DefaultValues.volcanoStrength,
    volcanoColorStrength = DefaultValues.volcanoColorStrength,
    ridgeColorWeight = DefaultValues.ridgeColorWeight,
    riftColorWeight = DefaultValues.riftColorWeight,
    enableRidges = DefaultValues.enableRidges,
    enableRifts = DefaultValues.enableRifts,
    ridgeStrength = DefaultValues.ridgeStrength,
    ridgeFrequency = DefaultValues.ridgeFrequency,
    ridgeSharpness = DefaultValues.ridgeSharpness,
    riftStrength = DefaultValues.riftStrength,
    riftFrequency = DefaultValues.riftFrequency,
    riftWidth = DefaultValues.riftWidth,
    riftSharpness = DefaultValues.riftSharpness,
    ridgesRiftsBlend = DefaultValues.ridgesRiftsBlend,
    roughness = DefaultValues.roughness,
    metalness = DefaultValues.metalness,
    autoRotate = DefaultValues.autoRotate,
    showDebugMeshes = DefaultValues.showDebugMeshes,
    triangleDetail = DefaultValues.triangleDetail,
    normalTextureSize = DefaultValues.normalTextureSize,
    colorTextureSize = DefaultValues.colorTextureSize,
  }: Props = $props()

  type PlanetoidExports = {
    downloadTextureMapPng: (fileName?: string) => Promise<boolean>
    downloadNormalMapPng: (fileName?: string) => Promise<boolean>
  }

  type ViewCameraState = {
    position: [number, number, number]
    target: [number, number, number]
  }

  type ViewCameraStateKey = 'mesh' | 'map'

  let planetoidRef: PlanetoidExports | undefined = $state(undefined)
  let controlsRef: OrbitControlsImpl | undefined = $state(undefined)
  let previousViewMode: PlanetoidViewMode = 'mesh'
  const viewCameraStateByKey: Record<ViewCameraStateKey, ViewCameraState> = {
    mesh: {
      position: [0, 0, 7],
      target: [0, 0, 0],
    },
    map: {
      position: [0, 0, 7],
      target: [0, 0, 0],
    },
  }

  const { camera, scene } = useThrelte()

  interactivity()

  scene.background = null

  onDestroy(() => {
    scene.background = null
  })

  function viewCameraStateKey(mode: PlanetoidViewMode): ViewCameraStateKey {
    return mode === 'mesh' ? 'mesh' : 'map'
  }

  function saveCurrentViewCameraState(mode: PlanetoidViewMode) {
    if (!controlsRef) return

    const stateKey = viewCameraStateKey(mode)

    const position = $camera.position
    const target = controlsRef.target

    viewCameraStateByKey[stateKey] = {
      position: [position.x, position.y, position.z],
      target: [target.x, target.y, target.z],
    }
  }

  function restoreViewCameraState(mode: PlanetoidViewMode) {
    if (!controlsRef) return

    const stateKey = viewCameraStateKey(mode)

    const state = viewCameraStateByKey[stateKey]
    $camera.position.set(state.position[0], state.position[1], state.position[2])
    controlsRef.target.set(state.target[0], state.target[1], state.target[2])
    controlsRef.update()
  }

  $effect(() => {
    if (!controlsRef) return

    const currentViewMode = viewMode
    const previousStateKey = viewCameraStateKey(previousViewMode)
    const currentStateKey = viewCameraStateKey(currentViewMode)

    if (previousViewMode !== currentViewMode) {
      saveCurrentViewCameraState(previousViewMode)
      if (previousStateKey !== currentStateKey) {
        restoreViewCameraState(currentViewMode)
      }
    }

    previousViewMode = currentViewMode
  })

  $effect(() => {
    if (!controlsRef) return

    const isMeshMode = viewMode === 'mesh'

    controlsRef.enableRotate = isMeshMode
    controlsRef.enablePan = !isMeshMode
    controlsRef.screenSpacePanning = true
    controlsRef.minDistance = isMeshMode ? 4 : 0.5
    controlsRef.maxDistance = isMeshMode ? 10 : 8
    controlsRef.zoomToCursor = !isMeshMode
    controlsRef.mouseButtons.LEFT = isMeshMode ? MOUSE.ROTATE : MOUSE.PAN
    controlsRef.mouseButtons.RIGHT = isMeshMode ? MOUSE.ROTATE : MOUSE.PAN
    controlsRef.update()
  })

  export async function downloadTextureMapPng(fileName?: string) {
    return (await planetoidRef?.downloadTextureMapPng(fileName)) ?? false
  }

  export async function downloadNormalMapPng(fileName?: string) {
    return (await planetoidRef?.downloadNormalMapPng(fileName)) ?? false
  }
</script>

<T.PerspectiveCamera makeDefault position={[0, 0, 7]}>
  <OrbitControls
    bind:ref={controlsRef}
    enableRotate={viewMode === 'mesh'}
    enableZoom={true}
    enablePan={viewMode !== 'mesh'}
    zoomToCursor={false}
    minDistance={4}
    maxDistance={20}
    zoomSpeed={1.2}
    enableDamping={true}
    dampingFactor={0.2}
  />
</T.PerspectiveCamera>
<T.AmbientLight intensity={0.05} />
<T.DirectionalLight position={[-5, 1, 2]} intensity={6} />

<Planetoid
  bind:this={planetoidRef}
  {palette}
  {surfaceTint}
  {colorScale}
  {tintShadowFloor}
  {swirliness}
  {seed}
  {largeScale}
  {mediumScale}
  {smallScale}
  {mediumFrequency}
  {smallFrequency}
  {normalStrength}
  {enableCraters}
  {craterCount}
  {craterScale}
  {craterStrength}
  {craterSharpness}
  {craterColorStrength}
  {enableVolcanoes}
  {volcanoCount}
  {volcanoScale}
  {volcanoStrength}
  {volcanoColorStrength}
  {ridgeColorWeight}
  {riftColorWeight}
  {enableRidges}
  {enableRifts}
  {ridgeStrength}
  {ridgeFrequency}
  {ridgeSharpness}
  {riftStrength}
  {riftFrequency}
  {riftWidth}
  {riftSharpness}
  {ridgesRiftsBlend}
  {roughness}
  {metalness}
  {autoRotate}
  {showDebugMeshes}
  {viewMode}
  {triangleDetail}
  {normalTextureSize}
  {colorTextureSize}
/>
