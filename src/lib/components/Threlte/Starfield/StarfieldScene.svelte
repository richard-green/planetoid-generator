<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { OrbitControls } from '@threlte/extras'
  import { AdditiveBlending, PerspectiveCamera, type BufferGeometry } from 'three'
  import { downloadScenePng as downloadScenePngFile } from '../../../utils/downloadScenePng'
  import { createStarfieldGeometry } from './starfieldGeometry'
  import { vertexShader, fragmentShader } from './StarfieldShaders'

  type Props = {
    seed: number
    count: number
    zoom: number
    colorLuminance?: number
    starSizeScale?: number
    dustCloudDensity?: number
    dustCloudOpacity?: number
    dustCloudScale?: number
    dustCloudSwirl?: number
    dustCloudClumping?: number
  }

  let {
    seed,
    count,
    zoom,
    colorLuminance = 1.35,
    starSizeScale = 1,
    dustCloudDensity = 0.8,
    dustCloudOpacity = 0.65,
    dustCloudScale = 1,
    dustCloudSwirl = 0.6,
    dustCloudClumping = 0.45,
  }: Props = $props()
  const geometry: BufferGeometry = $derived(createStarfieldGeometry({ seed, count }))
  const { camera, renderer, scene, invalidate } = useThrelte()
  scene.background = null
  const uniforms = {
    uColorLuminance: { value: 1.35 },
    uStarSizeScale: { value: 1 },
    uDustCloudDensity: { value: 0.8 },
    uDustCloudOpacity: { value: 0.65 },
    uDustCloudScale: { value: 1 },
    uDustCloudSwirl: { value: 0.6 },
    uDustCloudClumping: { value: 0.45 },
  }

  $effect(() => {
    uniforms.uColorLuminance.value = colorLuminance
    uniforms.uStarSizeScale.value = starSizeScale
    uniforms.uDustCloudDensity.value = dustCloudDensity
    uniforms.uDustCloudOpacity.value = dustCloudOpacity
    uniforms.uDustCloudScale.value = dustCloudScale
    uniforms.uDustCloudSwirl.value = dustCloudSwirl
    uniforms.uDustCloudClumping.value = dustCloudClumping
    invalidate()
  })

  $effect(() => {
    const activeCamera = $camera
    if (!(activeCamera instanceof PerspectiveCamera)) return

    activeCamera.zoom = zoom
    activeCamera.updateProjectionMatrix()
    invalidate()
  })

  $effect(() => {
    const currentGeometry = geometry
    return () => currentGeometry.dispose()
  })

  export function downloadScenePng(fileName = 'starfield.png') {
    return downloadScenePngFile(renderer, scene, $camera, fileName)
  }
</script>

<T.PerspectiveCamera makeDefault position={[0, 0, 0]} fov={70} near={0.1} far={1000}>
  <OrbitControls
    target={[0, 0, -1]}
    enableRotate={true}
    enableZoom={false}
    enablePan={false}
    rotateSpeed={-1}
    minDistance={1}
    maxDistance={1}
    enableDamping={true}
    dampingFactor={0.12}
  />
</T.PerspectiveCamera>

<T.Points {geometry} frustumCulled={false}>
  <T.ShaderMaterial
    vertexShader={vertexShader}
    fragmentShader={fragmentShader}
    {uniforms}
    transparent={true}
    depthWrite={false}
    blending={AdditiveBlending}
    vertexColors={true}
    toneMapped={false}
  />
</T.Points>