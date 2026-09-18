<script lang="ts">
  import { T } from '@threlte/core'
  import { IcosahedronGeometry, Uniform, Vector3 } from 'three'
  import { onDestroy } from 'svelte'
  import type { RingSettings } from './RingSettings'

  type Props = {
    settings: RingSettings
    seed: number
    planetRadius?: number
    lightPosition?: [number, number, number]
  }

  let { settings, seed, planetRadius = 1, lightPosition = [-5, 1, 2] }: Props = $props()

  const geometry = new IcosahedronGeometry(1, 8)
  const uniforms = {
    uInnerRadius: new Uniform(0),
    uOuterRadius: new Uniform(0),
    uLightDirection: new Uniform(new Vector3()),
    uRingNormal: new Uniform(new Vector3()),
    uSeed: new Uniform(0),
    uBandCount: new Uniform(0),
    uBandSharpness: new Uniform(0),
    uDensity: new Uniform(0),
    uOpacity: new Uniform(0),
  }

  $effect(() => {
    const tilt = (settings.ringTilt * Math.PI) / 180
    uniforms.uInnerRadius.value = settings.ringInnerRadius * planetRadius
    uniforms.uOuterRadius.value = settings.ringOuterRadius * planetRadius
    uniforms.uLightDirection.value = new Vector3(...lightPosition).normalize()
    uniforms.uRingNormal.value = new Vector3(Math.sin(tilt), -Math.cos(tilt), 0).normalize()
    uniforms.uSeed.value = seed
    uniforms.uBandCount.value = settings.ringBandCount
    uniforms.uBandSharpness.value = settings.ringBandSharpness
    uniforms.uDensity.value = settings.ringDensity
    uniforms.uOpacity.value = settings.ringOpacity
  })

  onDestroy(() => {
    geometry.dispose()
  })

  const vertexShader = `
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;

    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `

  const fragmentShader = `
    precision highp float;

    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;

    uniform float uInnerRadius;
    uniform float uOuterRadius;
    uniform vec3 uLightDirection;
    uniform vec3 uRingNormal;
    uniform float uSeed;
    uniform float uBandCount;
    uniform float uBandSharpness;
    uniform float uDensity;
    uniform float uOpacity;

    vec2 hash22(vec2 point) {
      vec3 point3 = fract(vec3(point.xyx) * vec3(0.1031, 0.1030, 0.0973));
      point3 += dot(point3, point3.yzx + 33.33);
      return fract((point3.xx + point3.yz) * point3.zy);
    }

    float hash11(float value) {
      return hash22(vec2(value, uSeed * 0.0137 + value * 0.071)).x;
    }

    vec3 variableBandInfo(float radial) {
      int count = int(floor(clamp(uBandCount, 2.0, 64.0) + 0.5));
      float totalWidth = 0.0;

      for (int index = 0; index < 64; index++) {
        if (index >= count) break;
        totalWidth += mix(0.35, 2.15, hash11(float(index) * 7.31 + 1.7));
      }

      float start = 0.0;
      for (int index = 0; index < 64; index++) {
        if (index >= count) break;
        float randomWidth = mix(0.35, 2.15, hash11(float(index) * 7.31 + 1.7));
        float width = randomWidth / max(totalWidth, 0.0001);
        float end = start + width;
        if (radial <= end || index == count - 1) {
          float local = clamp((radial - start) / max(width, 0.0001), 0.0, 1.0);
          float fillVariation = hash11(float(index) * 13.17 + 4.3);
          return vec3(local, width, fillVariation);
        }
        start = end;
      }

      return vec3(radial, 1.0, 0.5);
    }

    void main() {
      vec3 lightDirection = normalize(uLightDirection);
      float lightFacing = smoothstep(0.0, 0.08, dot(normalize(vWorldNormal), lightDirection));
      if (lightFacing <= 0.0) discard;

      float denominator = dot(lightDirection, uRingNormal);
      if (abs(denominator) < 0.0001) discard;

      float distanceToPlane = -dot(vWorldPosition, uRingNormal) / denominator;
      if (distanceToPlane <= 0.0) discard;

      vec3 ringPoint = vWorldPosition + lightDirection * distanceToPlane;
      float ringRadius = length(ringPoint);
      if (ringRadius <= uInnerRadius || ringRadius >= uOuterRadius) discard;

      float radial = (ringRadius - uInnerRadius) / max(0.0001, uOuterRadius - uInnerRadius);
      vec3 band = variableBandInfo(radial);
      float fillRatio = clamp(
        mix(0.15, 0.96, uDensity) * mix(0.58, 1.0, band.z),
        0.08,
        0.98
      );
      float halfWidth = fillRatio * 0.5;
      float distanceFromCenter = abs(band.x - 0.5);
      float localDerivative = max(fwidth(radial) / max(band.y, 0.0001), 0.0015);
      float antialiasWidth = localDerivative * 1.5;
      float softEdgeWidth = min(0.16, halfWidth * 0.85) * (1.0 - uBandSharpness);
      float coverage = 1.0 - smoothstep(
        halfWidth - antialiasWidth - softEdgeWidth,
        halfWidth + antialiasWidth + softEdgeWidth,
        distanceFromCenter
      );
      float shadowAlpha = coverage * uOpacity * 0.58 * lightFacing;

      if (shadowAlpha < 0.005) discard;
      gl_FragColor = vec4(vec3(0.0), shadowAlpha);
    }
  `
</script>

{#if settings.enableRings}
  <T.Mesh {geometry} scale={planetRadius * 1.001} renderOrder={0}>
    <T.ShaderMaterial
      {vertexShader}
      {fragmentShader}
      {uniforms}
      transparent={true}
      depthTest={false}
      depthWrite={false}
      toneMapped={false}
    />
  </T.Mesh>
{/if}
