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
    uBandRegularity: new Uniform(0),
    uDensity: new Uniform(0),
    uTextureScale: new Uniform(0),
    uGranularity: new Uniform(0),
    uSolarization: new Uniform(0),
    uOpacity: new Uniform(0),
    uNoise: new Uniform(0),
    uGlitter: new Uniform(0),
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
    uniforms.uBandRegularity.value = settings.ringBandRegularity
    uniforms.uDensity.value = settings.ringDensity
    uniforms.uTextureScale.value = settings.ringTextureScale
    uniforms.uGranularity.value = settings.ringGranularity
    uniforms.uSolarization.value = settings.ringSolarization
    uniforms.uOpacity.value = settings.ringOpacity
    uniforms.uNoise.value = settings.ringNoise
    uniforms.uGlitter.value = settings.ringGlitter
    uniforms.uPaletteSize.value = colors.length
  })

  const vertexShader = `
    varying float vRadius;
    varying vec2 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;

    void main() {
      vRadius = length(position.xy);
      vPosition = position.xy;
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `

  const fragmentShader = `
    precision highp float;

    varying float vRadius;
    varying vec2 vPosition;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;

    uniform float uInnerRadius;
    uniform float uOuterRadius;
    uniform float uPlanetRadius;
    uniform vec3 uLightDirection;
    uniform float uSeed;
    uniform float uBandCount;
    uniform float uBandSharpness;
    uniform float uBandRegularity;
    uniform float uDensity;
    uniform float uTextureScale;
    uniform float uGranularity;
    uniform float uSolarization;
    uniform float uOpacity;
    uniform float uNoise;
    uniform float uGlitter;
    uniform int uPaletteSize;
    uniform vec3 uPalette[${MAX_PALETTE_SIZE}];

    const float TAU = 6.283185307179586;

    vec2 hash22(vec2 point) {
      vec3 point3 = fract(vec3(point.xyx) * vec3(0.1031, 0.1030, 0.0973));
      point3 += dot(point3, point3.yzx + 33.33);
      return fract((point3.xx + point3.yz) * point3.zy);
    }

    float hash11(float value) {
      return hash22(vec2(value, uSeed * 0.0137 + value * 0.071)).x;
    }

    float gradientNoise(vec2 point) {
      vec2 cell = floor(point);
      vec2 local = fract(point);
      vec2 seedOffset = vec2(uSeed * 0.0137, uSeed * 0.0219);
      vec2 gradient00 = hash22(cell + seedOffset) * 2.0 - 1.0;
      vec2 gradient10 = hash22(cell + vec2(1.0, 0.0) + seedOffset) * 2.0 - 1.0;
      vec2 gradient01 = hash22(cell + vec2(0.0, 1.0) + seedOffset) * 2.0 - 1.0;
      vec2 gradient11 = hash22(cell + vec2(1.0, 1.0) + seedOffset) * 2.0 - 1.0;
      float value00 = dot(normalize(gradient00 + 0.0001), local);
      float value10 = dot(normalize(gradient10 + 0.0001), local - vec2(1.0, 0.0));
      float value01 = dot(normalize(gradient01 + 0.0001), local - vec2(0.0, 1.0));
      float value11 = dot(normalize(gradient11 + 0.0001), local - vec2(1.0, 1.0));
      vec2 blend = local * local * local * (local * (local * 6.0 - 15.0) + 10.0);
      float value = mix(
        mix(value00, value10, blend.x),
        mix(value01, value11, blend.x),
        blend.y
      );
      return value * 0.5 + 0.5;
    }

    float fractalNoise(vec2 point) {
      float value = 0.0;
      float amplitude = 0.52;
      float amplitudeSum = 0.0;
      mat2 rotation = mat2(0.8, -0.6, 0.6, 0.8);
      for (int octave = 0; octave < 5; octave++) {
        value += gradientNoise(point) * amplitude;
        amplitudeSum += amplitude;
        point = rotation * point * 2.071 + vec2(17.13, 9.71);
        amplitude *= 0.49;
      }
      return value / amplitudeSum;
    }

    vec4 variableBandInfo(float radial) {
      int count = int(floor(clamp(uBandCount, 2.0, 64.0) + 0.5));
      float variance = 1.0 - clamp(uBandRegularity, 0.0, 1.0);
      float widthLow = mix(1.0, 0.02, variance);
      float widthHigh = mix(1.0, 8.0, variance);
      float totalWidth = 0.0;

      for (int index = 0; index < 64; index++) {
        if (index >= count) break;
        totalWidth += mix(widthLow, widthHigh, hash11(float(index) * 7.31 + 1.7));
      }

      float start = 0.0;
      for (int index = 0; index < 64; index++) {
        if (index >= count) break;
        float randomWidth = mix(widthLow, widthHigh, hash11(float(index) * 7.31 + 1.7));
        float width = randomWidth / max(totalWidth, 0.0001);
        float end = start + width;
        if (radial <= end || index == count - 1) {
          float local = clamp((radial - start) / max(width, 0.0001), 0.0, 1.0);
          float fillVariation = hash11(float(index) * 13.17 + 4.3);
          float colorPosition = hash11(float(index) * 19.73 + 8.1);
          return vec4(local, width, fillVariation, colorPosition);
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
      float variance = 1.0 - clamp(uBandRegularity, 0.0, 1.0);
      float fillMultiplier = mix(1.0, band.z, variance);
      float fillRatio = clamp(
        mix(0.15, 0.96, uDensity) * fillMultiplier,
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
      vec2 domainWarp = vec2(
        fractalNoise(grainPosition * 0.43 + vec2(19.7, 3.1)),
        fractalNoise(grainPosition * 0.43 + vec2(-7.4, 27.6))
      ) - 0.5;
      float coarseGrain = fractalNoise(grainPosition + domainWarp * 2.4);
      float fineGrain = gradientNoise(
        grainPosition * 4.731 + domainWarp * 5.2 + vec2(31.2, 7.8)
      );
      float grain = clamp(coarseGrain * 0.7 + fineGrain * 0.3, 0.0, 1.0);
      float edgeFade = smoothstep(0.0, 0.025, radial) * smoothstep(0.0, 0.035, 1.0 - radial);
      float colorPosition = clamp(band.w + (grain - 0.5) * 0.16, 0.0, 1.0);
      float granularVariation = mix(1.0, mix(0.68, 1.22, grain), uGranularity);
      float illumination = mix(0.2, 1.0, planetShadow());
      vec3 baseColor = paletteColor(colorPosition);
      float solarCurve = 1.0 - abs(grain * 2.0 - 1.0);
      float solarMask = smoothstep(0.38, 0.88, solarCurve) * uSolarization;
      float solarPosition = fract(1.0 - colorPosition + band.z * 0.37);
      vec3 solarColor = paletteColor(solarPosition);
      vec3 color = mix(baseColor, solarColor, solarMask * 0.72);
      color *= mix(granularVariation, 2.0 - granularVariation, solarMask * 0.55);
      color *= illumination;
      float alphaGrain = mix(1.0, mix(0.72, 1.0, grain), uGranularity);
      vec2 sparkleBase = vPosition * (420.0 + uSeed * 2.7);
      vec2 sparkleSalt = hash22(floor(sparkleBase * 0.11) + vec2(19.7, 41.3)) * 57.0;
      float sparkleNoise = hash22(sparkleBase + sparkleSalt).x;
      float alphaNoise = mix(1.0, sparkleNoise, uNoise);

      vec3 glitterNormal = normalize(vWorldNormal);
      vec3 glitterAxis = abs(glitterNormal.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
      vec3 glitterTangent = normalize(cross(glitterAxis, glitterNormal));
      vec3 glitterBitangent = cross(glitterNormal, glitterTangent);
      vec2 glitterCell = floor(vPosition * (260.0 + uSeed * 1.3));
      vec2 glitterJitter = hash22(glitterCell + vec2(61.7, 12.4)) * 2.0 - 1.0;
      float glitterGate = step(0.992, hash22(glitterCell + vec2(5.5, 88.2)).x);
      vec3 perturbedNormal = normalize(
        glitterNormal + (glitterTangent * glitterJitter.x + glitterBitangent * glitterJitter.y) * 0.9
      );
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      vec3 halfVector = normalize(viewDirection + normalize(uLightDirection));
      float specular = pow(max(dot(perturbedNormal, halfVector), 0.0), 60.0);
      float glitter = specular * glitterGate * illumination * uGlitter;

      color += glitter * vec3(1.3, 1.25, 1.1);
      float alpha = clamp(
        coverage * edgeFade * uOpacity * alphaGrain * alphaNoise + glitter,
        0.0,
        1.0
      );

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
