<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { OrbitControls } from '@threlte/extras'
  import { DoubleSide, Euler, MathUtils, Raycaster, Sphere, Vector2, Vector3 } from 'three'
  import type { OrbitControls as OrbitControlsImpl } from 'three/examples/jsm/controls/OrbitControls.js'
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
  import {
    createCinematicFlight,
    smootherstep,
    type CinematicFlight,
    type FlightBody,
    type FlightSample,
  } from './SolarSystem/CinematicFlight'
  import { BUILTIN_PRESETS } from '../../../presets/Planetoids'
  import { BUILTIN_GAS_GIANT_PRESETS } from '../../../presets/GasGiants'
  import type { PlanetoidPreset } from '../../../presets/Planetoids/types'
  import type { GasGiantPreset } from '../../../presets/GasGiants/types'
  import {
    DefaultTextureSize,
    sanitizeTextureSize,
    type TextureSize,
  } from '../../types/textureSize'

  type Props = {
    bodies?: SystemBody[]
    rockyPresets?: PlanetoidPreset[]
    giantPresets?: GasGiantPreset[]
    starSettings?: StarSettings
    starScale?: number
    autoRotate?: boolean
    showOrbits?: boolean
    cinematic?: boolean
    textureSize?: TextureSize
  }

  let {
    bodies = DefaultSystemBodies,
    rockyPresets = BUILTIN_PRESETS,
    giantPresets = BUILTIN_GAS_GIANT_PRESETS,
    starSettings = StarDefaults,
    starScale = 1.4,
    autoRotate = true,
    showOrbits = true,
    cinematic = false,
    textureSize = DefaultTextureSize,
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
    settings: GasGiantSettings
    ringSettings: RingSettings
  }

  const rockyPresetsById = $derived(new Map(rockyPresets.map((preset) => [preset.id, preset])))
  const giantPresetsById = $derived(new Map(giantPresets.map((preset) => [preset.id, preset])))

  const { camera, invalidate, renderer, scene } = useThrelte()

  const MIN_PIVOT_DISTANCE = 2.5
  const MAX_PIVOT_DISTANCE = 80

  let controlsRef: OrbitControlsImpl | undefined = $state(undefined)
  const flyDirection = new Vector3()

  // Set while a body is focused so zooming dollies towards it instead of dragging the
  // pivot along the view direction.
  let focusedBody: FlightBody | undefined
  let pivotMinDistance = $state(MIN_PIVOT_DISTANCE)
  let pivotMaxDistance = $state(MAX_PIVOT_DISTANCE)

  function clearFocus(): void {
    focusedBody = undefined
    pivotMinDistance = MIN_PIVOT_DISTANCE
  }

  // Rotation leaves the pivot alone, so a moved target means the user panned away.
  function focusPivotMoved(): boolean {
    if (!focusedBody || !controlsRef || focusTween) return false
    return controlsRef.target.distanceToSquared(focusedBody.center) > 1e-4
  }

  // Wheel flies along the view direction and drags the orbit pivot with it, so you can
  // stop next to a body and rotate around it instead of zooming towards a fixed point.
  function flyForward(event: WheelEvent): void {
    if (!controlsRef || flightPlan) return

    event.preventDefault()

    if (focusPivotMoved()) clearFocus()

    if (focusedBody) {
      dollyToFocus(event.deltaY, focusedBody)
      return
    }

    const target = controlsRef.target
    flyDirection.subVectors(target, $camera.position)
    const distance = flyDirection.length()
    if (distance < 0.0001) return

    flyDirection.divideScalar(distance)

    const step = -event.deltaY * 0.0012 * Math.max(distance, 1.5)
    $camera.position.addScaledVector(flyDirection, step)

    const pivotDistance = distance - step
    const clamped = Math.min(Math.max(pivotDistance, MIN_PIVOT_DISTANCE), MAX_PIVOT_DISTANCE)
    target.addScaledVector(flyDirection, clamped - pivotDistance)

    controlsRef.update()
  }

  // Changes only the orbit radius, so the pivot stays exactly on the focused body.
  function dollyToFocus(deltaY: number, body: FlightBody): void {
    const controls = controlsRef
    if (!controls) return

    flyDirection.subVectors($camera.position, body.center)
    const distance = flyDirection.length()
    if (distance < 0.0001) return

    flyDirection.divideScalar(distance)

    const step = -deltaY * 0.0012 * Math.max(distance, 1.5)
    const next = MathUtils.clamp(distance - step, pivotMinDistance, pivotMaxDistance)

    $camera.position.copy(body.center).addScaledVector(flyDirection, next)
    controls.target.copy(body.center)
    controls.update()
  }

  $effect(() => {
    const canvas = renderer.domElement
    canvas.addEventListener('wheel', flyForward, { passive: false })
    canvas.addEventListener('pointerdown', handlePointerDown, { capture: true })
    canvas.addEventListener('dblclick', handleDoubleClick)

    return () => {
      canvas.removeEventListener('wheel', flyForward)
      canvas.removeEventListener('pointerdown', handlePointerDown, { capture: true })
      canvas.removeEventListener('dblclick', handleDoubleClick)
    }
  })

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

  // Giants and the sun fill more of the frame, so they get the next size up.
  const detailTextureSize = $derived(sanitizeTextureSize(Math.min(textureSize * 2, 4096)))

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
      normalTextureSize: detailTextureSize,
      colorTextureSize: detailTextureSize,
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
      ringPaletteInfluence: settings.ringPaletteInfluence,
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
      settings,
      ringSettings: toRingSettings(settings),
    }
  }

  const sunSettings: StarSettings = $derived({
    ...starSettings,
    autoRotate,
    colorTextureSize: detailTextureSize,
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

  let flightPlan: CinematicFlight | undefined
  let flightTime = 0
  let restoreControls: (() => void) | undefined
  const flightSample: FlightSample = { position: new Vector3(), target: new Vector3() }

  function worldPosition(position: Vec3, planeRotation: Vec3): Vector3 {
    return new Vector3(...position).applyEuler(new Euler(...planeRotation))
  }

  function flightBodies(): FlightBody[] {
    const rocky = rockyBodies.map((body) => ({
      id: body.id,
      center: worldPosition(body.position, body.planeRotation),
      radius: 2 * body.scale,
    }))

    const giants = giantBodies.map((giant) => ({
      id: giant.id,
      center: worldPosition(giant.position, giant.planeRotation),
      // Rings reach ringOuterRadius x the planet radius, so frame past them.
      radius: 2 * giant.scale * Math.max(1, giant.ringSettings.ringOuterRadius),
    }))

    return [...rocky, ...giants]
  }

  function sunFlightBody(): FlightBody {
    return { id: 'sun', center: new Vector3(), radius: 2 * starScale }
  }

  function startCinematic(): void {
    const controls = controlsRef
    if (!controls) return

    flightPlan = createCinematicFlight({
      startPosition: $camera.position.clone(),
      startTarget: controls.target.clone(),
      bodies: flightBodies(),
      sun: sunFlightBody(),
    })
    flightTime = 0

    // Low passes go inside the usual pivot limits, and user input must not fight the path.
    const previousEnabled = controls.enabled
    pivotMinDistance = 0.01
    pivotMaxDistance = 10000
    controls.enabled = false

    restoreControls = () => {
      pivotMinDistance = MIN_PIVOT_DISTANCE
      pivotMaxDistance = MAX_PIVOT_DISTANCE
      controls.enabled = previousEnabled
    }
  }

  function stopCinematic(): void {
    flightPlan = undefined
    restoreControls?.()
    restoreControls = undefined
  }

  $effect(() => {
    if (!cinematic || !controlsRef) return

    focusTween = undefined
    clearFocus()
    startCinematic()
    startPump()

    return () => {
      stopCinematic()
    }
  })

  function advanceFlight(delta: number): void {
    if (!flightPlan || !controlsRef) return

    flightTime += delta
    flightPlan.sample(flightTime, flightSample)
    $camera.position.copy(flightSample.position)
    controlsRef.target.copy(flightSample.target)
    $camera.lookAt(flightSample.target)
    invalidate()
  }

  type FocusTween = {
    elapsed: number
    duration: number
    fromPosition: Vector3
    toPosition: Vector3
    fromTarget: Vector3
    toTarget: Vector3
  }

  let focusTween: FocusTween | undefined
  const focusRaycaster = new Raycaster()
  const focusSphere = new Sphere()
  const focusPointer = new Vector2()
  const focusHit = new Vector3()

  // Bodies are drawn as spheres, so an analytic ray/sphere test picks them out without
  // needing refs to the meshes (and it ignores ring geometry the same way).
  function pickBody(clientX: number, clientY: number): FlightBody | undefined {
    const rect = renderer.domElement.getBoundingClientRect()
    if (!rect.width || !rect.height) return undefined

    focusPointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    )
    focusRaycaster.setFromCamera(focusPointer, $camera)

    const candidates = [...flightBodies(), sunFlightBody()]
    let picked: FlightBody | undefined
    let pickedDistance = Infinity

    for (const body of candidates) {
      focusSphere.set(body.center, body.radius)
      if (!focusRaycaster.ray.intersectSphere(focusSphere, focusHit)) continue

      const distance = $camera.position.distanceTo(focusHit)
      if (distance < pickedDistance) {
        picked = body
        pickedDistance = distance
      }
    }

    return picked
  }

  function focusOnBody(body: FlightBody): void {
    const controls = controlsRef
    if (!controls) return

    // Let the user zoom right up to small bodies once they are the pivot.
    focusedBody = body
    pivotMinDistance = Math.max(0.05, body.radius * 1.15)

    const framing = MathUtils.clamp(body.radius * 2.6, pivotMinDistance, MAX_PIVOT_DISTANCE)
    const direction = new Vector3().subVectors($camera.position, body.center)
    if (direction.lengthSq() < 1e-6) direction.set(0, 0.35, 1)
    direction.normalize()

    focusTween = {
      elapsed: 0,
      duration: 1.1,
      fromPosition: $camera.position.clone(),
      toPosition: body.center.clone().addScaledVector(direction, framing),
      fromTarget: controls.target.clone(),
      toTarget: body.center.clone(),
    }

    startPump()
  }

  function advanceFocus(delta: number): void {
    const tween = focusTween
    if (!tween || !controlsRef) return

    tween.elapsed += delta
    const progress = Math.min(1, tween.elapsed / tween.duration)
    const eased = smootherstep(progress)

    $camera.position.lerpVectors(tween.fromPosition, tween.toPosition, eased)
    controlsRef.target.lerpVectors(tween.fromTarget, tween.toTarget, eased)
    $camera.lookAt(controlsRef.target)
    invalidate()

    if (progress >= 1) {
      focusTween = undefined
      // Leave the controls' internal spherical state matching where we put the camera.
      controlsRef.update()
    }
  }

  const DOUBLE_CLICK_MS = 400
  const DOUBLE_CLICK_SLOP_PX = 8

  let lastTapTime = 0
  let lastTapX = 0
  let lastTapY = 0
  let lastFocusTime = 0

  function focusAt(clientX: number, clientY: number): boolean {
    if (cinematic || !controlsRef) return false

    const now = performance.now()
    if (now - lastFocusTime < DOUBLE_CLICK_MS) return false

    const body = pickBody(clientX, clientY)
    if (!body) return false

    lastFocusTime = now
    focusOnBody(body)
    return true
  }

  // OrbitControls takes pointer capture on pointerdown, which makes the browser's own
  // dblclick unreliable here, so the double tap is measured from pointerdown directly.
  // Capture phase means no other handler can swallow it first.
  function handlePointerDown(event: PointerEvent): void {
    if (event.button !== 0) return

    const now = event.timeStamp || performance.now()
    const isDoubleTap =
      now - lastTapTime < DOUBLE_CLICK_MS &&
      Math.hypot(event.clientX - lastTapX, event.clientY - lastTapY) < DOUBLE_CLICK_SLOP_PX

    lastTapX = event.clientX
    lastTapY = event.clientY
    lastTapTime = isDoubleTap ? 0 : now

    if (isDoubleTap) focusAt(event.clientX, event.clientY)
  }

  function handleDoubleClick(event: MouseEvent): void {
    if (focusAt(event.clientX, event.clientY)) event.preventDefault()
  }

  // Threlte's task scheduler is driven by its own render loop, so camera animations run
  // their own frame loop and ask Threlte to render each step.
  let pumpHandle = 0
  let pumpPrevious = 0

  function pumpFrame(now: number): void {
    const delta = pumpPrevious ? Math.min((now - pumpPrevious) / 1000, 0.1) : 0
    pumpPrevious = now

    if (flightPlan) advanceFlight(delta)
    else if (focusTween) advanceFocus(delta)

    if (flightPlan || focusTween) {
      pumpHandle = requestAnimationFrame(pumpFrame)
    } else {
      pumpHandle = 0
      pumpPrevious = 0
    }
  }

  function startPump(): void {
    if (pumpHandle) return
    pumpPrevious = 0
    pumpHandle = requestAnimationFrame(pumpFrame)
  }

  onDestroy(() => {
    if (pumpHandle) cancelAnimationFrame(pumpHandle)
  })

  export function downloadScenePng(fileName = 'solar-system-render.png') {
    return downloadScenePngFile(renderer, scene, $camera, fileName)
  }
</script>

<T.PerspectiveCamera makeDefault position={[0, 22, 70]} fov={55} near={0.1} far={2000}>
  <OrbitControls
    bind:ref={controlsRef}
    enableRotate={true}
    enableZoom={false}
    enablePan={true}
    screenSpacePanning={true}
    minDistance={pivotMinDistance}
    maxDistance={pivotMaxDistance}
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
        lightPosition={[0, 0, 0]}
      />
      <PlanetaryRings
        settings={giant.ringSettings}
        seed={giant.seed}
        planetRadius={2}
        lightPosition={[0, 0, 0]}
      />
    </T.Group>
  </T.Group>
{/each}
