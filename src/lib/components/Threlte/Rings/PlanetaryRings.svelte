<script lang="ts">
  import { T } from '@threlte/core'
  import { DoubleSide, Uniform, Vector3 } from 'three'
  import type { RingSettings } from './RingSettings'
  import { RingPalettes } from './RingPalettes'

  type Props = {
    settings: RingSettings
    seed: number
    planetRadius?: number
    lightPosition?: [number, number, number]
  }

  let { settings, seed, planetRadius = 1, lightPosition = [-5, 1, 2] }: Props = $props()

  const MAX_PALETTE_SIZE = 8
  const uniforms = {
    uInnerRadius: new Uniform(0),
    uOuterRadius: new Uniform(0),
    uPlanetRadius: new Uniform(0),
    uLightDirection: new Uniform(new Vector3()),
    uSeed: new Uniform(0),
    uBandCount: new Uniform(0),
    uBandSharpness: new Uniform(0),
    uDensity: new Uniform(0),
    uTextureScale: new Uniform(0),
    uGranularity: new Uniform(0),
    uOpacity: new Uniform(0),
    uPaletteSize: new Uniform(0),
    uPalette: new Uniform(Array.from({ length: MAX_PALETTE_SIZE }, () => new Vector3())),
  }

  const innerRadius = $derived(settings.ringInnerRadius * planetRadius)
  const outerRadius = $derived(
    Math.max(settings.ringOuterRadius, settings.ringInnerRadius + 0.05) * planetRadius
  )
  const tiltRadians = $derived((settings.ringTilt * Math.PI) / 180)

  $effect(() => {
    const colors = RingPalettes[settings.ringPalette]
    const fallback = colors.at(-1) ?? { r: 255, g: 255, b: 255 }
    uniforms.uPalette.value = Array.from({ length: MAX_PALETTE_SIZE }, (_, index) => {
      const color = colors[index] ?? fallback
      return new Vector3(color.r / 255, color.g / 255, color.b / 255)
    })

    uniforms.uInnerRadius.value = innerRadius
    uniforms.uOuterRadius.value = outerRadius
    uniforms.uPlanetRadius.value = planetRadius
    uniforms.uLightDirection.value = new Vector3(...lightPosition).normalize()
    uniforms.uSeed.value = seed
    uniforms.uBandCount.value = settings.ringBandCount
    uniforms.uBandSharpness.value = settings.ringBandSharpness
    uniforms.uDensity.value = settings.ringDensity
    uniforms.uTextureScale.value = settings.ringTextureScale
    uniforms.uGranularity.value = settings.ringGranularity
    uniforms.uOpacity.value = settings.ringOpacity
    uniforms.uPaletteSize.value = colors.length
  })

  const vertexShader = `
    varying float vRadius;
    varying vec2 vPosition;
    varying vec3 vWorldPosition;

    void main() {
      vRadius = length(position.xy);
      vPosition = position.xy;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `

  const fragmentShader = `
    precision highp float;

    varying float vRadius;
    varying vec2 vPosition;
    varying vec3 vWorldPosition;

    uniform float uInnerRadius;
    uniform float uOuterRadius;
    uniform float uPlanetRadius;
    uniform vec3 uLightDirection;
    uniform float uSeed;
    uniform float uBandCount;
    uniform float uBandSharpness;
    uniform float uDensity;
    uniform float uTextureScale;
    uniform float uGranularity;
    uniform float uOpacity;
    uniform int uPaletteSize;
    uniform vec3 uPalette[${MAX_PALETTE_SIZE}];

    const float TAU = 6.283185307179586;

    float hash21(vec2 point) {
      point = fract(point * vec2(123.34, 456.21));
      point += dot(point, point + 45.32);
      return fract(point.x * point.y);
    }

    float hash11(float value) {
      return fract(sin(value * 127.1 + uSeed * 0.017) * 43758.5453123);
    }

    float valueNoise(vec2 point) {
      vec2 cell = floor(point);
      vec2 local = fract(point);
      local = local * local * (3.0 - 2.0 * local);
      float a = hash21(cell + uSeed * 0.013);
      float b = hash21(cell + vec2(1.0, 0.0) + uSeed * 0.013);
      float c = hash21(cell + vec2(0.0, 1.0) + uSeed * 0.013);
      float d = hash21(cell + vec2(1.0, 1.0) + uSeed * 0.013);
      return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
    }

    float fractalNoise(vec2 point) {
      float value = 0.0;
      float amplitude = 0.57;
      for (int octave = 0; octave < 4; octave++) {
        value += valueNoise(point) * amplitude;
        point = point * 2.03 + vec2(17.1, 9.2);
        amplitude *= 0.48;
      }
      return value;
    }

    vec4 variableBandInfo(float radial) {
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
          return vec4(local, width, fillVariation, float(index) / float(max(1, count - 1)));
        }
        start = end;
      }

      return vec4(radial, 1.0, 0.5, radial);
    }

    vec3 paletteColor(float amount) {
      int size = max(2, min(uPaletteSize, ${MAX_PALETTE_SIZE}));
      float position = clamp(amount, 0.0, 1.0) * float(size - 1);
      int index = min(int(floor(position)), size - 2);
      float localAmount = fract(position);
      vec3 first = uPalette[0];
      vec3 second = uPalette[1];

      for (int i = 0; i < ${MAX_PALETTE_SIZE}; i++) {
        if (i == index) first = uPalette[i];
        if (i == index + 1) second = uPalette[i];
      }

      return mix(first, second, localAmount);
    }

    float planetShadow() {
      vec3 directionToLight = normalize(uLightDirection);
      float distanceAlongRay = -dot(vWorldPosition, directionToLight);
      if (distanceAlongRay <= 0.0) return 1.0;

      vec3 closestPoint = vWorldPosition + directionToLight * distanceAlongRay;
      float distanceFromAxis = length(closestPoint);
      float softness = max(0.03, uPlanetRadius * 0.045);
      return smoothstep(uPlanetRadius - softness, uPlanetRadius + softness, distanceFromAxis);
    }

    void main() {
      float radial = clamp(
        (vRadius - uInnerRadius) / max(0.0001, uOuterRadius - uInnerRadius),
        0.0,
        1.0
      );
      vec4 band = variableBandInfo(radial);
      float distanceFromCenter = abs(band.x - 0.5);
      float fillRatio = clamp(
        mix(0.15, 0.96, uDensity) * mix(0.58, 1.0, band.z),
        0.08,
        0.98
      );
      float halfWidth = fillRatio * 0.5;
      float localDerivative = max(fwidth(radial) / max(band.y, 0.0001), 0.0015);
      float antialiasWidth = localDerivative * 1.25;
      float softEdgeWidth = min(0.16, halfWidth * 0.85) * (1.0 - uBandSharpness);
      float edgeWidth = antialiasWidth + softEdgeWidth;
      float coverage = 1.0 - smoothstep(
        halfWidth - edgeWidth,
        halfWidth + edgeWidth,
        distanceFromCenter
      );
      vec2 grainPosition = vPosition * (4.0 + uTextureScale * 3.0);
      float coarseGrain = fractalNoise(grainPosition);
      float fineGrain = valueNoise(grainPosition * 4.7 + vec2(31.2, 7.8));
      float grain = clamp(coarseGrain * 0.72 + fineGrain * 0.28, 0.0, 1.0);
      float edgeFade = smoothstep(0.0, 0.025, radial) * smoothstep(0.0, 0.035, 1.0 - radial);
      float colorPosition = clamp(band.w + (grain - 0.5) * 0.16, 0.0, 1.0);
      float granularVariation = mix(1.0, mix(0.68, 1.22, grain), uGranularity);
      float illumination = mix(0.2, 1.0, planetShadow());
      vec3 color = paletteColor(colorPosition) * granularVariation * illumination;
      float alphaGrain = mix(1.0, mix(0.72, 1.0, grain), uGranularity);
      float alpha = coverage * edgeFade * uOpacity * alphaGrain;

      if (alpha < 0.01) discard;
      gl_FragColor = vec4(color, alpha);
    }
  `
</script>

{#if settings.enableRings}
  <T.Group rotation={[0, 0, tiltRadians]}>
    <T.Mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={1}>
      <T.RingGeometry args={[innerRadius, outerRadius, 256, 1]} />
      <T.ShaderMaterial
        {vertexShader}
        {fragmentShader}
        {uniforms}
        side={DoubleSide}
        transparent={true}
        depthWrite={false}
        toneMapped={false}
      />
    </T.Mesh>
  </T.Group>
{/if}
