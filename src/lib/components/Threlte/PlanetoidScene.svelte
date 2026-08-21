<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { OrbitControls, interactivity } from '@threlte/extras'
  import { MOUSE } from 'three'
  import type { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js'
  import { onDestroy } from 'svelte'
  import Planetoid from './Objects/Planetoid.svelte'
  import type { AnyPaletteName } from './Objects/AllPalettes'

  export type PlanetoidViewMode = 'mesh' | 'bump' | 'texture' | 'ray'

  type Props = {
    palette?: AnyPaletteName
    surfaceTint?: string
    colorScale?: number
    tintShadowFloor?: number
    swirliness?: number
    seed?: number
    largeScale?: number
    mediumScale?: number
    smallScale?: number
    bumpScale?: number
    enableCraters?: boolean
    craterCount?: number
    craterStrength?: number
    craterColorStrength?: number
    enableVolcanoes?: boolean
    volcanoCount?: number
    volcanoScale?: number
    volcanoStrength?: number
    volcanoColorStrength?: number
    ridgeColorWeight?: number
    riftColorWeight?: number
    craterRayStrength?: number
    craterRayVisibility?: number
    craterRayDensity?: number
    craterRaySharpness?: number
    craterRayLengthPower?: number
    enableRidges?: boolean
    enableRifts?: boolean
    ridgeStrength?: number
    ridgeScale?: number
    ridgeSharpness?: number
    riftStrength?: number
    riftScale?: number
    riftWidth?: number
    riftSharpness?: number
    ridgesRiftsBlend?: number
    roughness?: number
    metalness?: number
    autoRotate?: boolean
    showDebugMeshes?: boolean
    enableLimbBumpFix?: boolean
    viewMode?: PlanetoidViewMode
    triangleDetail?: number
    bumpTextureSize?: number
    colorTextureSize?: number
  }

  let {
    palette = 'rocky',
    surfaceTint = '#05a0aa',
    colorScale = 1.75,
    tintShadowFloor = 0.18,
    swirliness = 1,
    seed = 12345,
    largeScale = 0.32,
    mediumScale = 0.1,
    smallScale = 0.15,
    bumpScale = 2,
    enableCraters = true,
    craterCount = 20,
    craterStrength = 5,
    craterColorStrength = 0.95,
    enableVolcanoes = false,
    volcanoCount = 10,
    volcanoScale = 1,
    volcanoStrength = 1,
    volcanoColorStrength = 0.75,
    ridgeColorWeight = 0.35,
    riftColorWeight = 0.35,
    craterRayStrength = 0.75,
    craterRayVisibility = 1,
    craterRayDensity = 1,
    craterRaySharpness = 1,
    craterRayLengthPower = 2.8,
    enableRidges = false,
    enableRifts = false,
    ridgeStrength = 0.5,
    ridgeScale = 2.2,
    ridgeSharpness = 1.6,
    riftStrength = 0.4,
    riftScale = 3.4,
    riftWidth = 0.09,
    riftSharpness = 2,
    ridgesRiftsBlend = 0.55,
    roughness = 0.92,
    metalness = 0.02,
    autoRotate = false,
    showDebugMeshes = true,
    enableLimbBumpFix = true,
    viewMode = 'mesh',
    triangleDetail = 5,
    bumpTextureSize = 800,
    colorTextureSize = 256,
  }: Props = $props()

  type PlanetoidExports = {
    downloadTextureMapPng: (fileName?: string) => Promise<boolean>
    downloadBumpMapPng: (fileName?: string) => Promise<boolean>
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
    controlsRef.mouseButtons.LEFT = isMeshMode ? MOUSE.ROTATE : MOUSE.PAN
    controlsRef.mouseButtons.RIGHT = isMeshMode ? MOUSE.ROTATE : MOUSE.PAN
    controlsRef.update()
  })

  export async function downloadTextureMapPng(fileName?: string) {
    return (await planetoidRef?.downloadTextureMapPng(fileName)) ?? false
  }

  export async function downloadBumpMapPng(fileName?: string) {
    return (await planetoidRef?.downloadBumpMapPng(fileName)) ?? false
  }
</script>

<T.PerspectiveCamera makeDefault position={[0, 0, 7]}>
  <OrbitControls
    bind:ref={controlsRef}
    enableRotate={viewMode === 'mesh'}
    enableZoom={true}
    enablePan={viewMode !== 'mesh'}
    zoomToCursor={false}
    minDistance={0.5}
    maxDistance={15}
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
  {bumpScale}
  {enableCraters}
  {craterCount}
  {craterStrength}
  {craterColorStrength}
  {enableVolcanoes}
  {volcanoCount}
  {volcanoScale}
  {volcanoStrength}
  {volcanoColorStrength}
  {ridgeColorWeight}
  {riftColorWeight}
  {craterRayStrength}
  {craterRayVisibility}
  {craterRayDensity}
  {craterRaySharpness}
  {craterRayLengthPower}
  {enableRidges}
  {enableRifts}
  {ridgeStrength}
  {ridgeScale}
  {ridgeSharpness}
  {riftStrength}
  {riftScale}
  {riftWidth}
  {riftSharpness}
  {ridgesRiftsBlend}
  {roughness}
  {metalness}
  {autoRotate}
  {showDebugMeshes}
  {enableLimbBumpFix}
  {viewMode}
  {triangleDetail}
  {bumpTextureSize}
  {colorTextureSize}
/>
