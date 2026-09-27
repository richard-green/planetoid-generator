<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
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
  const RAY_STEPS = 16

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

  const vertexShader = `
    varying vec3 vWorldPosition;
    varying vec3 vCentre;
    varying float vAtmosphereRadius;

    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vCentre = modelMatrix[3].xyz;
      vAtmosphereRadius = length(modelMatrix[0].xyz);
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `

  const fragmentShader = `
    precision highp float;

    varying vec3 vWorldPosition;
    varying vec3 vCentre;
    varying float vAtmosphereRadius;

    uniform vec3 uSunDirection;
    uniform float uRadiusRatio;
    uniform float uDropoff;
    uniform float uIntensity;
    uniform float uTerminatorWrap;
    uniform int uPaletteSize;
    uniform vec3 uPalette[${MAX_PALETTE_SIZE}];
    uniform float uPalettePositions[${MAX_PALETTE_SIZE}];

    vec3 paletteColor(float amount) {
      int size = max(2, min(uPaletteSize, ${MAX_PALETTE_SIZE}));
      float position = clamp(amount, 0.0, 1.0);
      int index = 0;
      for (int i = 0; i < ${MAX_PALETTE_SIZE} - 1; i++) {
        if (i < size - 1 && position >= uPalettePositions[i]) index = i;
      }
      index = min(index, size - 2);
      vec3 first = uPalette[0];
      vec3 second = uPalette[1];
      float startPosition = uPalettePositions[0];
      float endPosition = uPalettePositions[1];

      for (int i = 0; i < ${MAX_PALETTE_SIZE}; i++) {
        if (i == index) {
          first = uPalette[i];
          startPosition = uPalettePositions[i];
        }
        if (i == index + 1) {
          second = uPalette[i];
          endPosition = uPalettePositions[i];
        }
      }

      float localAmount = clamp((position - startPosition) / max(0.0001, endPosition - startPosition), 0.0, 1.0);
      return mix(first, second, localAmount);
    }

    vec2 raySphere(vec3 origin, vec3 direction, vec3 centre, float radius) {
      vec3 offset = origin - centre;
      float b = dot(offset, direction);
      float c = dot(offset, offset) - radius * radius;
      float h = b * b - c;
      if (h < 0.0) return vec2(-1.0);
      h = sqrt(h);
      return vec2(-b - h, -b + h);
    }

    void main() {
      vec3 rayOrigin = cameraPosition;
      vec3 rayDirection = normalize(vWorldPosition - rayOrigin);
      float outerRadius = vAtmosphereRadius;
      float innerRadius = vAtmosphereRadius * uRadiusRatio;
      vec3 toCentre = vCentre - rayOrigin;
      float tClosest = dot(toCentre, rayDirection);
      float closestDistance = length(toCentre - rayDirection * tClosest);
      float edgeWidth = max(fwidth(closestDistance), 0.0001);

      vec2 atmosphereHit = raySphere(rayOrigin, rayDirection, vCentre, outerRadius);
      if (atmosphereHit.y <= 0.0) discard;

      float tStart = max(atmosphereHit.x, 0.0);
      vec2 groundHit = raySphere(rayOrigin, rayDirection, vCentre, innerRadius);
      float tGround = groundHit.x > 0.0 ? groundHit.x : tClosest;
      // Blend the ground cut-off over ~1px so the limb doesn't step between half and full paths.
      float groundMiss = smoothstep(innerRadius - edgeWidth, innerRadius + edgeWidth, closestDistance);
      float tEnd = tClosest > 0.0 ? mix(min(tGround, atmosphereHit.y), atmosphereHit.y, groundMiss) : atmosphereHit.y;

      float segment = tEnd - tStart;
      if (segment <= 0.0) discard;

      float stepLength = segment / float(${RAY_STEPS});
      float dither = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
      float shellDepth = max(outerRadius - innerRadius, 0.0001);
      float wrap = mix(0.02, 0.9, clamp(uTerminatorWrap, 0.0, 1.0));
      vec3 sun = normalize(uSunDirection);
      vec3 scattered = vec3(0.0);

      for (int i = 0; i < ${RAY_STEPS}; i++) {
        vec3 samplePoint = rayOrigin + rayDirection * (tStart + (float(i) + dither) * stepLength) - vCentre;
        float sampleRadius = length(samplePoint);
        float altitude = clamp((sampleRadius - innerRadius) / shellDepth, 0.0, 1.0);
        float density = exp(-altitude * uDropoff) * (1.0 - altitude);
        float sunAngle = dot(samplePoint / sampleRadius, sun);
        float lit = smoothstep(-wrap, wrap, sunAngle);
        float hue = smoothstep(-wrap, 1.0, sunAngle);
        scattered += paletteColor(hue) * density * lit * stepLength;
      }

      scattered /= shellDepth;
      // Brighter halo when looking towards the sun through the limb (forward scattering).
      float phase = 1.0 + 1.5 * pow(max(dot(rayDirection, sun), 0.0), 8.0);
      vec3 color = 1.0 - exp(-scattered * uIntensity * phase * 0.22);
      float alpha = max(color.r, max(color.g, color.b));
      gl_FragColor = vec4(color / max(alpha, 0.0001), alpha);
    }
  `
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
