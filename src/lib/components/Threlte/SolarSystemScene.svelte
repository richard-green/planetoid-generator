<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { OrbitControls } from '@threlte/extras'
  import { DoubleSide, Vector3 } from 'three'
  import { onDestroy } from 'svelte'
  import { downloadScenePng as downloadScenePngFile } from '../../utils/downloadScenePng'
  import GasGiant from './GasGiant/GasGiant.svelte'
  import Planetoid from './Planetoid/Planetoid.svelte'
  import PlanetaryRings from './Rings/PlanetaryRings.svelte'
  import PlanetaryRingShadow from './Rings/PlanetaryRingShadow.svelte'
  import Star from './Star/Star.svelte'
  import {
    DefaultValues as GasGiantDefaults,
    type GasGiantSettings,
  } from './GasGiant/GasGiantSettings'
  import {
    DefaultValues as PlanetoidDefaults,
    type PlanetoidSettings,
    type PlanetoidViewMode,
  } from './Planetoid/PlanetoidSettings'
  import { DefaultValues as StarDefaults, type StarSettings } from './Star/StarSettings'
  import type { RingSettings } from './Rings/RingSettings'
  import { DefaultSystemBodies, type SystemBody } from './SolarSystem/SolarSystemBodies'
  import { BUILTIN_PRESETS } from '../../../presets/Planetoids'
  import { BUILTIN_GAS_GIANT_PRESETS } from '../../../presets/GasGiants'
  import type { PlanetoidPreset } from '../../../presets/Planetoids/types'
  import type { GasGiantPreset } from '../../../presets/GasGiants/types'

  type Props = {
    bodies?: SystemBody[]
    rockyPresets?: PlanetoidPreset[]
    giantPresets?: GasGiantPreset[]
    starSettings?: StarSettings
    starScale?: number
    autoRotate?: boolean
    showOrbits?: boolean
    textureSize?: number
  }

  let {
    bodies = DefaultSystemBodies,
    rockyPresets = BUILTIN_PRESETS,
    giantPresets = BUILTIN_GAS_GIANT_PRESETS,
    starSettings = StarDefaults,
    starScale = 1.4,
    autoRotate = true,
    showOrbits = true,
    textureSize = 1024,
  }: Props = $props()

  type Vec3 = [number, number, number]

  type RockyBody = {
    id: string
    position: Vec3
    planeRotation: Vec3
    scale: number
    tilt: number
    settings: PlanetoidSettings & { viewMode: PlanetoidViewMode }
  }

  type GiantBody = {
    id: string
    position: Vec3
    planeRotation: Vec3
    scale: number
    seed: number
    lightPosition: Vec3
    settings: GasGiantSettings
    ringSettings: RingSettings
  }

  const rockyPresetsById = $derived(new Map(rockyPresets.map((preset) => [preset.id, preset])))
  const giantPresetsById = $derived(new Map(giantPresets.map((preset) => [preset.id, preset])))

  const { camera, renderer, scene } = useThrelte()

  scene.background = null

  onDestroy(() => {
    scene.background = null
  })

  function orbitPosition(body: SystemBody): Vec3 {
    const angle = (body.orbitAngle * Math.PI) / 180

    return [Math.cos(angle) * body.orbitRadius, 0, Math.sin(angle) * body.orbitRadius]
  }

  // Orbits stay on the ecliptic; a small tilt about the ascending node keeps them from looking flat.
  function orbitPlaneRotation(body: SystemBody): Vec3 {
    const inclination = (body.orbitInclination * Math.PI) / 180
    const node = (body.orbitNode * Math.PI) / 180

    return [inclination * Math.cos(node), 0, inclination * Math.sin(node)]
  }

  // The sun lights every body, so each ring shader needs a direction pointing back at the origin.
  function directionToSun(position: Vec3): Vec3 {
    const direction = new Vector3(...position).negate().normalize()
    return [direction.x, direction.y, direction.z]
  }

  function rockySettings(
    preset: PlanetoidPreset,
    seed: number
  ): PlanetoidSettings & { viewMode: PlanetoidViewMode } {
    return {
      ...PlanetoidDefaults,
      ...preset.settings,
      seed,
      autoRotate,
      showDebugMeshes: false,
      normalTextureSize: textureSize,
      colorTextureSize: textureSize,
      viewMode: 'mesh',
    }
  }

  function giantSettings(preset: GasGiantPreset, seed: number): GasGiantSettings {
    return {
      ...GasGiantDefaults,
      ...preset.settings,
      enableRings: true,
      ringTilt: ((seed % 100) - 50) * 0.8,
      seed,
      autoRotate,
      normalTextureSize: textureSize * 2,
      colorTextureSize: textureSize * 2,
    }
  }

  function toRingSettings(settings: GasGiantSettings): RingSettings {
    return {
      enableRings: settings.enableRings,
      ringPalette: settings.ringPalette,
      ringInnerRadius: settings.ringInnerRadius,
      ringOuterRadius: settings.ringOuterRadius,
      ringTilt: settings.ringTilt,
      ringBandCount: settings.ringBandCount,
      ringBandSharpness: settings.ringBandSharpness,
      ringBandRegularity: settings.ringBandRegularity,
      ringDensity: settings.ringDensity,
      ringTextureScale: settings.ringTextureScale,
      ringGranularity: settings.ringGranularity,
      ringSolarization: settings.ringSolarization,
      ringOpacity: settings.ringOpacity,
      ringNoise: settings.ringNoise,
      ringGlitter: settings.ringGlitter,
    }
  }

  function createGiant(body: SystemBody, preset: GasGiantPreset): GiantBody {
    const position = orbitPosition(body)
    const settings = giantSettings(preset, body.seed)

    return {
      id: body.id,
      position,
      planeRotation: orbitPlaneRotation(body),
      scale: body.scale,
      seed: body.seed,
      lightPosition: directionToSun(position),
      settings,
      ringSettings: toRingSettings(settings),
    }
  }

  const sunSettings: StarSettings = $derived({
    ...starSettings,
    autoRotate,
    colorTextureSize: textureSize * 2,
  })

  const rockyBodies: RockyBody[] = $derived(
    bodies
      .filter((body) => body.kind === 'rocky')
      .flatMap((body) => {
        const preset = rockyPresetsById.get(body.presetId) ?? rockyPresets[0]
        if (!preset) return []

        return [
          {
            id: body.id,
            position: orbitPosition(body),
            planeRotation: orbitPlaneRotation(body),
            scale: body.scale,
            tilt: ((body.seed % 40) - 20) / 60,
            settings: rockySettings(preset, body.seed),
          },
        ]
      })
  )

  const giantBodies: GiantBody[] = $derived(
    bodies
      .filter((body) => body.kind === 'giant')
      .flatMap((body) => {
        const preset = giantPresetsById.get(body.presetId) ?? giantPresets[0]
        return preset ? [createGiant(body, preset)] : []
      })
  )

  const orbits = $derived(
    bodies.map((body) => ({
      id: body.id,
      radius: body.orbitRadius,
      planeRotation: orbitPlaneRotation(body),
    }))
  )

  export function downloadScenePng(fileName = 'solar-system-render.png') {
    return downloadScenePngFile(renderer, scene, $camera, fileName)
  }
</script>

<T.PerspectiveCamera makeDefault position={[0, 22, 70]} fov={55} near={0.1} far={2000}>
  <OrbitControls
    enableRotate={true}
    enableZoom={true}
    enablePan={true}
    screenSpacePanning={true}
    zoomToCursor={true}
    minDistance={4}
    maxDistance={300}
    zoomSpeed={1.2}
    panSpeed={1.2}
    enableDamping={true}
    dampingFactor={0.1}
  />
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.04} />
<!-- decay 0 keeps distant bodies lit consistently while the sun remains the only light source -->
<T.PointLight position={[0, 0, 0]} intensity={6} decay={0} color="#fff4d6" />

{#if showOrbits}
  {#each orbits as orbit (orbit.id)}
    <T.Group rotation={orbit.planeRotation}>
      <T.Mesh rotation={[-Math.PI / 2, 0, 0]}>
        <T.RingGeometry args={[orbit.radius - 0.05, orbit.radius + 0.05, 256]} />
        <T.MeshBasicMaterial
          color="#7aa7d8"
          transparent={true}
          opacity={0.4}
          side={DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </T.Mesh>
    </T.Group>
  {/each}
{/if}

<T.Group scale={starScale}>
  <Star settings={sunSettings} />
</T.Group>

{#each rockyBodies as body (body.id)}
  <T.Group rotation={body.planeRotation}>
    <T.Group position={body.position} scale={body.scale} rotation={[0, 0, body.tilt]}>
      <Planetoid settings={body.settings} />
    </T.Group>
  </T.Group>
{/each}

{#each giantBodies as giant (giant.id)}
  <T.Group rotation={giant.planeRotation}>
    <T.Group position={giant.position} scale={giant.scale}>
      <GasGiant settings={giant.settings} viewMode="mesh" />
      <PlanetaryRingShadow
        settings={giant.ringSettings}
        seed={giant.seed}
        planetRadius={2}
        lightPosition={giant.lightPosition}
      />
      <PlanetaryRings
        settings={giant.ringSettings}
        seed={giant.seed}
        planetRadius={2}
        lightPosition={giant.lightPosition}
      />
    </T.Group>
  </T.Group>
{/each}
