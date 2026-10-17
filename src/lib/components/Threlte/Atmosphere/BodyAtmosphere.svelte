<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { vertexShader, fragmentShader } from './BodyAtmosphereShaders'
  import {
    DirectionalLight,
    FrontSide,
    Light,
    Mesh,
    PointLight,
    SphereGeometry,
    Uniform,
    Vector3,
    type Object3D,
  } from 'three'
  import { onDestroy } from 'svelte'
  import { getPalettePosition, type Palette } from '../../../types/palette'
  import { trackPalette } from '../../../types/paletteState.svelte'

  type Props = {
    planetRadius: number
    thickness: number
    dropoff: number
    intensity: number
    terminatorWrap: number
    palette: Palette
  }

  let { planetRadius, thickness, dropoff, intensity, terminatorWrap, palette }: Props = $props()

  const MAX_PALETTE_SIZE = 8
  const RAY_STEPS = 8

  const { invalidate } = useThrelte()
  const geometry = new SphereGeometry(1, 128, 96)

  const uniforms = {
    uSunDirection: new Uniform(new Vector3(-5, 1, 2).normalize()),
    uRadiusRatio: new Uniform(0.9),
    uDropoff: new Uniform(4),
    uIntensity: new Uniform(1),
    uTerminatorWrap: new Uniform(0.3),
    uPaletteSize: new Uniform(0),
    uPalette: new Uniform(Array.from({ length: MAX_PALETTE_SIZE }, () => new Vector3())),
    uPalettePositions: new Uniform(Array.from({ length: MAX_PALETTE_SIZE }, () => 1)),
  }

  // Thickness is expressed as a fraction of the base body radius (2).
  const atmosphereRadius = $derived(planetRadius + thickness * 2)

  $effect(() => {
    const colors = trackPalette(palette)
    const fallback = colors.at(-1) ?? { r: 255, g: 255, b: 255 }
    uniforms.uPalette.value = Array.from({ length: MAX_PALETTE_SIZE }, (_, index) => {
      const color = colors[index] ?? fallback
      return new Vector3(color.r / 255, color.g / 255, color.b / 255)
    })
    uniforms.uPalettePositions.value = Array.from({ length: MAX_PALETTE_SIZE }, (_, index) =>
      getPalettePosition(colors, Math.min(index, colors.length - 1))
    )
    uniforms.uPaletteSize.value = Math.min(colors.length, MAX_PALETTE_SIZE)
    uniforms.uRadiusRatio.value = planetRadius / atmosphereRadius
    uniforms.uDropoff.value = dropoff
    uniforms.uIntensity.value = intensity
    uniforms.uTerminatorWrap.value = terminatorWrap
    invalidate()
  })

  let cachedLight: Light | undefined
  const lightWorld = new Vector3()
  const targetWorld = new Vector3()
  const centreWorld = new Vector3()

  function findSceneLight(root: Object3D) {
    if (cachedLight?.parent) return cachedLight

    cachedLight = undefined
    root.traverse((object) => {
      if (cachedLight) return
      if (object instanceof DirectionalLight || object instanceof PointLight) {
        cachedLight = object
      }
    })
    return cachedLight
  }

  function updateSunDirection(mesh: Mesh, scene: Object3D) {
    const light = findSceneLight(scene)
    if (!light) return

    light.getWorldPosition(lightWorld)
    if (light instanceof DirectionalLight) {
      light.target.getWorldPosition(targetWorld)
    } else {
      mesh.getWorldPosition(targetWorld)
    }
    centreWorld.subVectors(lightWorld, targetWorld)
    if (centreWorld.lengthSq() > 0) {
      uniforms.uSunDirection.value.copy(centreWorld.normalize())
    }
  }

  let mesh = $state<Mesh | undefined>(undefined)

  $effect(() => {
    const target = mesh
    if (!target) return
    target.onBeforeRender = (_renderer, scene) => updateSunDirection(target, scene)
  })

  onDestroy(() => {
    geometry.dispose()
  })




</script>

<T.Mesh
  {geometry}
  scale={[atmosphereRadius, atmosphereRadius, atmosphereRadius]}
  renderOrder={2}
  bind:ref={mesh}
>
  <T.ShaderMaterial
    {uniforms}
    {vertexShader}
    {fragmentShader}
    side={FrontSide}
    transparent
    depthWrite={false}
  />
</T.Mesh>
