<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { OrbitControls } from '@threlte/extras'
  import { MOUSE } from 'three'
  import type { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js'
  import { downloadScenePng as downloadScenePngFile } from '../../utils/downloadScenePng'
  import { applyCameraView, readCameraView, type CameraView } from '../../utils/cameraView'
  import Star from './Star/Star.svelte'
  import { DefaultValues, type StarPaletteName, type StarSettings } from './Star/StarSettings'
  import type { TextureSize } from '../../types/textureSize'

  export type { StarPaletteName } from './Star/StarSettings'

  type Props = {
    seed?: number
    textureScale?: number
    bandContrast?: number
    bandSwirl?: number
    granularity?: number
    turbulence?: number
    convection?: number
    sunspotCount?: number
    sunspotScale?: number
    sunspotPower?: number
    sunspotJaggedness?: number
    sunspotNeighbours?: number
    penumbraScale?: number
    sunspotDarkness?: number
    brightness?: number
    saturation?: number
    contrast?: number
    palette?: StarPaletteName
    limbBrightness?: number
    haloIntensity?: number
    haloFalloff?: number
    haloSize?: number
    haloTurbulence?: number
    plasmaIntensity?: number
    plasmaSurfaceIntensity?: number
    plasmaExtent?: number
    plasmaTurbulence?: number
    plasmaSharpness?: number
    plasmaTextureScale?: number
    colorTextureSize?: TextureSize
    autoRotate?: boolean
    showStarSurface?: boolean
  }

  let {
    seed = DefaultValues.seed,
    textureScale = DefaultValues.textureScale,
    bandContrast = DefaultValues.bandContrast,
    bandSwirl = DefaultValues.bandSwirl,
    granularity = DefaultValues.granularity,
    turbulence = DefaultValues.turbulence,
    convection = DefaultValues.convection,
    sunspotCount = DefaultValues.sunspotCount,
    sunspotScale = DefaultValues.sunspotScale,
    sunspotPower = DefaultValues.sunspotPower,
    sunspotJaggedness = DefaultValues.sunspotJaggedness,
    sunspotNeighbours = DefaultValues.sunspotNeighbours,
    penumbraScale = DefaultValues.penumbraScale,
    sunspotDarkness = DefaultValues.sunspotDarkness,
    brightness = DefaultValues.brightness,
    saturation = DefaultValues.saturation,
    contrast = DefaultValues.contrast,
    palette = DefaultValues.palette,
    limbBrightness = DefaultValues.limbBrightness,
    haloIntensity = DefaultValues.haloIntensity,
    haloFalloff = DefaultValues.haloFalloff,
    haloSize = DefaultValues.haloSize,
    haloTurbulence = DefaultValues.haloTurbulence,
    plasmaIntensity = DefaultValues.plasmaIntensity,
    plasmaSurfaceIntensity = DefaultValues.plasmaSurfaceIntensity,
    plasmaExtent = DefaultValues.plasmaExtent,
    plasmaTurbulence = DefaultValues.plasmaTurbulence,
    plasmaSharpness = DefaultValues.plasmaSharpness,
    plasmaTextureScale = DefaultValues.plasmaTextureScale,
    colorTextureSize = DefaultValues.colorTextureSize,
    autoRotate = DefaultValues.autoRotate,
    showStarSurface = true,
  }: Props = $props()

  const settings: StarSettings = $derived({
    seed,
    textureScale,
    bandContrast,
    bandSwirl,
    granularity,
    turbulence,
    convection,
    sunspotCount,
    sunspotScale,
    sunspotPower,
    sunspotJaggedness,
    sunspotNeighbours,
    penumbraScale,
    sunspotDarkness,
    brightness,
    saturation,
    contrast,
    palette,
    limbBrightness,
    haloIntensity,
    haloFalloff,
    haloSize,
    haloTurbulence,
    plasmaIntensity,
    plasmaSurfaceIntensity,
    plasmaExtent,
    plasmaTurbulence,
    plasmaSharpness,
    plasmaTextureScale,
    colorTextureSize,
    autoRotate,
  })

  type StarExports = {
    downloadTextureMapPng: (fileName?: string) => boolean
  }

  let starRef: StarExports | undefined = $state(undefined)
  let controlsRef: OrbitControlsImpl | undefined = $state(undefined)
  const { camera, renderer, scene, invalidate } = useThrelte()
  scene.background = null

  $effect(() => {
    if (!controlsRef) return

    controlsRef.enablePan = false
    controlsRef.mouseButtons.LEFT = MOUSE.ROTATE
    controlsRef.mouseButtons.RIGHT = MOUSE.ROTATE
    controlsRef.update()
  })

  export function downloadTextureMapPng(fileName?: string) {
    return starRef?.downloadTextureMapPng(fileName) ?? false
  }

  export function downloadScenePng(fileName = 'star-render.png') {
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
</script>

<T.PerspectiveCamera makeDefault position={[0, 0, 6.5]}>
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

<Star bind:this={starRef} {settings} {showStarSurface} />
