import { ShaderChunk, type MeshStandardMaterial } from 'three'

const MAX_PALETTE = 16

export function configureSphericalSurfaceSampling(
  shader: Parameters<MeshStandardMaterial['onBeforeCompile']>[0]
) {
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vSurfacePosition;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSurfacePosition = position;')
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vSurfacePosition;')
    .replace(
      '#include <map_fragment>',
      `
        vec3 surfaceDirection = normalize(vSurfacePosition);
        vec2 surfaceUv = vec2(
          0.5 + atan(surfaceDirection.z, surfaceDirection.x) / 6.283185307179586,
          0.5 - asin(clamp(surfaceDirection.y, -1.0, 1.0)) / 3.141592653589793
        );
        ${ShaderChunk.map_fragment.replaceAll('vMapUv', 'surfaceUv')}
      `
    )
    .replace(
      '#include <normal_fragment_maps>',
      ShaderChunk.normal_fragment_maps.replaceAll('vNormalMapUv', 'surfaceUv')
    )
}

export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export const fragmentShader = `
  precision highp float;

  varying vec2 vUv;

  // Always 1. Loop bounds multiplied by it are opaque to ANGLE's D3D compiler, which
  // otherwise fully unrolls and inlines every noise loop (tens of seconds to compile).
  uniform int uOne;
  uniform vec2 uResolution;
  uniform vec3 uSeed;
  uniform vec3 uTint;
  uniform int uEnableIceCaps;
  uniform float uIceCapCoverage;
  uniform float uIceCapEdgeNoise;
  uniform float uSnowExtent;
  uniform float uSnowCoverage;
  uniform vec3 uIceCapColor;
  uniform int uIcePaletteSize;
  uniform vec3 uIcePalette[${MAX_PALETTE}];
  uniform float uIcePalettePositions[${MAX_PALETTE}];
  uniform float uTintShadowFloor;
  uniform float uSwirliness;
  uniform float uColorNoiseFrequency;
  uniform int uColorNoiseOctaves;
  uniform float uColorNoisePersistence;
  uniform float uColorNoiseLacunarity;
  uniform float uColorSwirlFrequency;
  uniform int uColorSwirlOctaves;
  uniform float uColorSwirlPersistence;
  uniform float uColorSwirlLacunarity;
  uniform float uDustCloudCoverage;
  uniform float uDustCloudWeights[5];
  uniform float uDustCloudOpacity;
  uniform float uDustCloudFrequency;
  uniform float uDustCloudSwirliness;
  uniform float uDustCloudCoriolis;
  uniform float uDustCloudRelief;
  uniform float uTextureScale;
  uniform int uEnableCraters;
  uniform int uCraterCount;
  uniform float uCraterScale;
  uniform float uCraterStrength;
  uniform float uCraterColorStrength;
  uniform float uCraterSharpness;
  uniform int uEnableVolcanoes;
  uniform int uVolcanoCount;
  uniform float uVolcanoScale;
  uniform float uVolcanoStrength;
  uniform float uVolcanoColorStrength;
  uniform float uRidgeColorWeight;
  uniform float uRiftColorWeight;
  uniform int uEnableRidges;
  uniform int uEnableRifts;
  uniform float uRidgeStrength;
  uniform float uRidgeElevation;
  uniform float uRidgeFrequency;
  uniform float uRidgeSharpness;
  uniform float uRiftStrength;
  uniform float uRiftFrequency;
  uniform float uRiftWidth;
  uniform float uRiftSharpness;
  uniform float uRidgesRiftsBlend;
  uniform int uDebugMidline;
  uniform int uPaletteSize;
  uniform vec3 uPalette[${MAX_PALETTE}];
  uniform float uPalettePositions[${MAX_PALETTE}];

  const int MAX_CRATERS = 96;
  const int MAX_VOLCANOES = 80;
  const float PI = 3.141592653589793;
  const float TAU = 6.283185307179586;
  // Blend factor for layering each new crater over existing crater height.
  // 0.75 means intersections keep 75% of the new crater and 25% of prior terrain.
  const float CRATER_NEW_HEIGHT_WEIGHT = 0.75;

  float hash11(float p) {
    return fract(sin(p * 127.1) * 43758.5453123);
  }

  float hash12(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  vec3 hash31(float p) {
    return vec3(hash11(p + 1.3), hash11(p + 7.1), hash11(p + 19.7));
  }

  float noise3(vec3 p) {
    return
      sin(p.x * 3.1 + sin(p.y * 4.7)) *
      sin(p.y * 2.7 + sin(p.z * 3.3)) *
      sin(p.z * 4.1 + sin(p.x * 2.9));
  }

  float layeredNoise(vec3 p, int octaves, float persistence, float lacunarity) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float total = 0.0;

    for (int i = 0; i < octaves * uOne; i++) {
      value += noise3(p * frequency) * amplitude;
      total += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / max(1e-6, total);
  }

  float fractalNoise(vec3 p) {
    return layeredNoise(p, 5, 0.5, 2.0);
  }

  float colorNoise(vec3 p) {
    return layeredNoise(p, uColorNoiseOctaves, uColorNoisePersistence, uColorNoiseLacunarity);
  }

  float colorSwirlNoise(vec3 p) {
    return layeredNoise(p, uColorSwirlOctaves, uColorSwirlPersistence, uColorSwirlLacunarity);
  }

  vec3 hash33(vec3 p) {
    vec3 q = vec3(
      dot(p, vec3(127.1, 311.7, 74.7)),
      dot(p, vec3(269.5, 183.3, 246.1)),
      dot(p, vec3(113.5, 271.9, 124.6))
    );

    return fract(sin(q) * 43758.5453123);
  }

  // Distance to the nearest jittered feature point in a 3D grid (Worley/cellular noise).
  float worley3(vec3 p) {
    vec3 cell = floor(p);
    vec3 local = fract(p);
    float nearest = 1.5;

    for (int x = -uOne; x <= uOne; x++) {
      for (int y = -uOne; y <= uOne; y++) {
        for (int z = -uOne; z <= uOne; z++) {
          vec3 offset = vec3(float(x), float(y), float(z));
          vec3 featurePoint = offset + hash33(cell + offset);
          nearest = min(nearest, length(featurePoint - local));
        }
      }
    }

    return clamp(nearest, 0.0, 1.0);
  }

  // Inverted (billowy) Worley octaves: 1.0 at cell centres, 0.0 at cell boundaries.
  float worleyFbm(vec3 p, float lacunarity, float gain) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float total = 0.0;

    for (int i = 0; i < 4 * uOne; i++) {
      value += (1.0 - worley3(p * frequency)) * amplitude;
      total += amplitude;
      frequency *= lacunarity;
      amplitude *= gain;
    }

    return value / max(1e-6, total);
  }

  vec3 applySeededVortex(vec3 position, vec3 seed, float salt, float strength) {
    vec3 center = normalize(vec3(
      hash11(seed.x + salt * 13.1),
      hash11(seed.y + salt * 29.7),
      hash11(seed.z + salt * 47.3)
    ) * 2.0 - 1.0);
    float radius = acos(clamp(dot(position, center), -1.0, 1.0));
    vec3 tangent = cross(center, position);
    float tangentLength = length(tangent);

    if (tangentLength > 1e-4) {
      float direction = (hash11(seed.y + salt * 61.1) < 0.5) ? -1.0 : 1.0;
      float width = mix(4.0, 12.0, hash11(seed.z + salt * 83.9));
      float variation = mix(0.6, 1.35, hash11(seed.x + salt * 97.3));
      float offset = direction * strength * variation * exp(-radius * radius * width);
      position = normalize(position + tangent / tangentLength * offset);
    }

    return position;
  }

  // Sine-free hash (Dave Hoskins) so large seed offsets keep full precision.
  vec3 gradientHash3(vec3 p) {
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return normalize(fract((p.xxy + p.yxx) * p.zyx) * 2.0 - 1.0 + 1e-4);
  }

  // Classic 3D Perlin gradient noise, roughly in [-0.9, 0.9].
  float perlin3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    float n000 = dot(gradientHash3(i), f);
    float n100 = dot(gradientHash3(i + vec3(1.0, 0.0, 0.0)), f - vec3(1.0, 0.0, 0.0));
    float n010 = dot(gradientHash3(i + vec3(0.0, 1.0, 0.0)), f - vec3(0.0, 1.0, 0.0));
    float n110 = dot(gradientHash3(i + vec3(1.0, 1.0, 0.0)), f - vec3(1.0, 1.0, 0.0));
    float n001 = dot(gradientHash3(i + vec3(0.0, 0.0, 1.0)), f - vec3(0.0, 0.0, 1.0));
    float n101 = dot(gradientHash3(i + vec3(1.0, 0.0, 1.0)), f - vec3(1.0, 0.0, 1.0));
    float n011 = dot(gradientHash3(i + vec3(0.0, 1.0, 1.0)), f - vec3(0.0, 1.0, 1.0));
    float n111 = dot(gradientHash3(i + vec3(1.0, 1.0, 1.0)), f - vec3(1.0, 1.0, 1.0));

    return mix(
      mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
      mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
      u.z
    );
  }

  // Musgrave-style ridged multifractal: each octave is weighted by the previous
  // one, so fine detail clusters on crests and valleys stay smooth. Returns [0, 1].
  float ridgedMultiPerlin(vec3 p, float exponent) {
    float sum = 0.0;
    float amplitude = 1.0;
    float norm = 0.0;
    float weight = 1.0;

    for (int i = 0; i < 6 * uOne; i++) {
      float n = 1.0 - abs(perlin3(p) * 1.4);
      n = pow(clamp(n, 0.0, 1.0), exponent) * weight;
      weight = clamp(n * 2.0, 0.0, 1.0);
      sum += n * amplitude;
      norm += amplitude;
      amplitude *= 0.5;
      p = p * 2.03 + vec3(1.7, 9.2, 4.3);
    }

    return sum / max(1e-6, norm);
  }

  float cellularEdgeDistance(vec3 p) {
    vec3 cell = floor(p);
    vec3 local = fract(p);
    float nearest = 2.0;
    float secondNearest = 2.0;

    for (int x = -uOne; x <= uOne; x++) {
      for (int y = -uOne; y <= uOne; y++) {
        for (int z = -uOne; z <= uOne; z++) {
          vec3 offset = vec3(float(x), float(y), float(z));
          vec3 featurePoint = offset + hash33(cell + offset);
          float distanceToFeature = length(featurePoint - local);
          if (distanceToFeature < nearest) {
            secondNearest = nearest;
            nearest = distanceToFeature;
          } else if (distanceToFeature < secondNearest) {
            secondNearest = distanceToFeature;
          }
        }
      }
    }

    return secondNearest - nearest;
  }

  vec2 ridgeRiftSignals(vec3 p, vec3 seed) {
    float ridgeFrequency = max(0.1, uRidgeFrequency);
    float riftFrequency = max(0.1, uRiftFrequency);

    vec3 ridgePos = p * (ridgeFrequency * 1.2) + seed * 0.91 + vec3(17.7, 53.2, 91.4);
    // Higher ridge sharpness should produce narrower, crisper ridge crests.
    float ridgeExponent = mix(1.5, 6.0, (uRidgeSharpness - 0.5) / 3.5);
    float ridgeField = ridgedMultiPerlin(ridgePos, ridgeExponent);
    vec3 rangeWarp = vec3(
      perlin3(p * (ridgeFrequency * 0.42) + seed * 0.53 + vec3(11.7, 63.2, 29.4)),
      perlin3(p * (ridgeFrequency * 0.42) + seed * 0.71 + vec3(47.3, 5.9, 81.6)),
      perlin3(p * (ridgeFrequency * 0.42) + seed * 0.89 + vec3(73.1, 37.7, 13.8))
    );
    vec3 rangeDomain = p * (ridgeFrequency * 1.25) + rangeWarp * 0.34
      + seed * 0.91 + vec3(17.7, 53.2, 91.4);
    float rangeEdgeDistance = cellularEdgeDistance(rangeDomain);
    float sharpness01 = clamp((uRidgeSharpness - 0.5) / 3.5, 0.0, 1.0);
    float rangeWidth = mix(0.14, 0.055, sharpness01);
    float rangeNetwork = 1.0 - smoothstep(rangeWidth, rangeWidth * 2.2, rangeEdgeDistance);
    float rangeNoise = perlin3(
      p * (ridgeFrequency * 0.32) + seed * 0.73 + vec3(83.1, 7.9, 29.4)
    ) * 1.4;
    float rangeMask = rangeNetwork * smoothstep(-0.12, 0.4, rangeNoise);
    float ridgeHeight = ridgeField * rangeMask * uRidgeStrength;

    vec3 riftDomain = p * riftFrequency + seed * 1.17 + vec3(61.3, 13.9, 37.5);
    float edgeDistance = cellularEdgeDistance(riftDomain);
    float riftVariation = perlin3(
      p * (riftFrequency * 0.55) + seed * 1.41 + vec3(23.1, 79.7, 45.2)
    );
    float widthDepthVariation = clamp(0.5 + riftVariation * 0.85, 0.0, 1.0);
    float widthFactor = mix(0.45, 1.9, widthDepthVariation);
    float riftWidth = max(0.003, uRiftWidth * 0.6 * widthFactor);
    float riftCore = 1.0 - smoothstep(riftWidth * 0.3, riftWidth * 1.4, edgeDistance);
    float endpointNoise = perlin3(
      p * (riftFrequency * 0.32) + seed * 0.83 + vec3(47.1, 5.7, 89.3)
    );
    float endpointFade = smoothstep(-0.22, 0.24, endpointNoise);
    float riftSharp = pow(clamp(riftCore * endpointFade, 0.0, 1.0), uRiftSharpness * 1.2);
    float depthFactor = mix(0.3, 1.8, widthDepthVariation);
    float riftDepth = riftSharp * depthFactor * uRiftStrength;

    return vec2(ridgeHeight, riftDepth);
  }

  float ridgeRiftHeight(vec3 p, vec3 seed) {
    vec2 signals = ridgeRiftSignals(p, seed);
    float ridgeHeight = signals.x;
    float riftDepth = signals.y;

    float blend = uRidgesRiftsBlend;
    float ridgeTerm = ridgeHeight * (1.0 - blend) * uRidgeElevation;
    float riftTerm = -riftDepth * blend;

    return ridgeTerm + riftTerm;
  }

  vec3 samplePalette(float value, int paletteSize, vec3 palette[${MAX_PALETTE}], float positions[${MAX_PALETTE}]) {
    float t = clamp((value + 1.0) * 0.5, 0.0, 1.0);
    int safePaletteSize = max(2, min(paletteSize, ${MAX_PALETTE}));
    int index = 0;

    for (int i = 0; i < (${MAX_PALETTE} - 1) * uOne; i++) {
      if (i < safePaletteSize - 1 && t >= positions[i]) index = i;
    }
    index = min(index, safePaletteSize - 2);

    vec3 a = palette[0];
    vec3 b = palette[1];
    float startPosition = positions[0];
    float endPosition = positions[1];

    for (int i = 0; i < (${MAX_PALETTE} - 1) * uOne; i++) {
      if (i == index) {
        a = palette[i];
        b = palette[i + 1];
        startPosition = positions[i];
        endPosition = positions[i + 1];
      }
    }

    float localT = clamp((t - startPosition) / max(0.0001, endPosition - startPosition), 0.0, 1.0);
    return mix(a, b, localT);
  }

  vec3 mapToPalette(float value) {
    return samplePalette(value, uPaletteSize, uPalette, uPalettePositions);
  }

  vec3 rgbToHsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;

    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }

  vec3 hsvToRgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + vec3(0.0, 1.0 / 3.0, 2.0 / 3.0)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
  }

  float linearToSrgbChannel(float v) {
    v = clamp(v, 0.0, 1.0);
    if (v <= 0.0031308) return v * 12.92;
    return 1.055 * pow(v, 1.0 / 2.4) - 0.055;
  }

  float srgbToLinearChannel(float v) {
    v = clamp(v, 0.0, 1.0);
    if (v <= 0.04045) return v / 12.92;
    return pow((v + 0.055) / 1.055, 2.4);
  }

  vec3 linearToSrgb(vec3 c) {
    return vec3(
      linearToSrgbChannel(c.r),
      linearToSrgbChannel(c.g),
      linearToSrgbChannel(c.b)
    );
  }

  vec3 srgbToLinear(vec3 c) {
    return vec3(
      srgbToLinearChannel(c.r),
      srgbToLinearChannel(c.g),
      srgbToLinearChannel(c.b)
    );
  }

  void buildCrater(int i, out vec2 centerUv, out float radius, out float age) {
    float fi = float(i);

    float u = hash12(vec2(fi * 1.17, uSeed.x * 0.001 + 11.0));
    float v = 0.2 + hash12(vec2(fi * 2.31, uSeed.y * 0.001 + 23.0)) * 0.6;
    float radiusSample = hash12(vec2(fi * 3.57, uSeed.z * 0.001 + 37.0));

    float minRadius = 0.018;
    float maxRadius = 0.078;

    float countMinusOne = max(1.0, float(uCraterCount - 1));
    float chronology = fi / countMinusOne;
    float ageJitter = (hash12(vec2(fi * 8.93, uSeed.z * 0.001 + 97.0)) - 0.5) * 0.16;

    // Older craters are laid first in index order and are generally more eroded.
    age = clamp(1.0 - chronology + ageJitter, 0.0, 1.0);

    // Older craters trend larger, but with pseudo-random local variance so the
    // age-size relationship is not perfectly linear.
    float sizeNoiseA = hash12(vec2(fi * 4.11, uSeed.x * 0.001 + 131.0));
    float sizeNoiseB = hash12(vec2(fi * 6.73, uSeed.y * 0.001 + 173.0));
    float ageBias = pow(age, 1.35);
    float variance = (sizeNoiseA - 0.5) * 0.55 + (sizeNoiseB - 0.5) * 0.25;
    float effectiveAge = clamp(ageBias + variance, 0.0, 1.0);

    float localExponent = mix(3.2, 1.15, effectiveAge);
    float normalizedRadius = pow(radiusSample, localExponent);

    // Occasionally produce very large old impact basins without making all old
    // craters giant.
    float basinChance = smoothstep(0.72, 1.0, effectiveAge);
    float basinNoise = hash12(vec2(fi * 9.47, uSeed.z * 0.001 + 211.0));
    float basinBoost = basinChance * pow(basinNoise, 3.0) * 0.35;
    normalizedRadius = clamp(normalizedRadius + basinBoost, 0.0, 1.0);

    centerUv = vec2(u, v);
    float baseRadius = mix(minRadius, maxRadius, normalizedRadius);
    float scale = uCraterScale;
    radius = baseRadius * scale;
  }

  float craterNormalizedDistance(vec2 uv, vec2 craterUv, float craterRadius, float craterAge) {
    float du = uv.x - craterUv.x;
    if (du > 0.5) du -= 1.0;
    if (du < -0.5) du += 1.0;
    float dv = uv.y - craterUv.y;

    float rx = max(1e-5, craterRadius * 0.5);
    float ry = max(1e-5, craterRadius);

    vec2 local = vec2(du / rx, dv / ry);
    float baseDistance = length(local);
    if (baseDistance <= 0.45 || baseDistance >= 1.55) return baseDistance;

    // Per-crater age softens local rim sharpness and increases rim corrosion.
    float localRimSharpness = mix(uCraterSharpness * 1.2, uCraterSharpness * 0.45, craterAge);
    float sharpness01 = clamp((localRimSharpness - 0.5) / 7.5, 0.0, 1.0);
    float corrosionAmount = (1.0 - sharpness01) * mix(0.08, 0.26, craterAge);

    float rimMask = smoothstep(0.45, 0.95, baseDistance) * (1.0 - smoothstep(1.2, 1.55, baseDistance));

    // Spatial erosion avoids repeating angular lobes and radial segment seams.
    vec3 erosionSeed = hash33(vec3(craterUv * 137.3, 17.1)) * 31.7;
    float erosionScale = mix(1.8, 3.2, hash12(craterUv * 79.3));
    vec3 erosionDomain = vec3(local * erosionScale, 0.0) + erosionSeed;
    float erosion =
      perlin3(erosionDomain) * 0.7 +
      perlin3(erosionDomain * 2.7 + vec3(19.1, 7.3, 43.7)) * 0.3;
    float rimCorrosion = erosion * corrosionAmount * rimMask;

    return max(0.0, baseDistance + rimCorrosion);
  }

  float craterShape(float t, float craterAge) {
    float localRimSharpness = mix(uCraterSharpness * 1.2, uCraterSharpness * 0.45, craterAge);
    float sharpness01 = clamp((localRimSharpness - 0.5) / 7.5, 0.0, 1.0);

    float rimPeak = mix(0.2, 0.1, craterAge);

    // Outward flank from the rim: drops quickly, then eases into terrain with zero slope.
    float exteriorWidth = mix(0.32, 0.22, sharpness01);
    float exteriorProgress = clamp((t - 1.0) / max(1e-4, exteriorWidth), 0.0, 1.0);
    float exteriorExponent = mix(2.2, 1.45, sharpness01);
    float exteriorFalloff = pow(1.0 - exteriorProgress, exteriorExponent);

    float bowlDepth = mix(0.6, 0.42, craterAge);
    float floorRadius = mix(0.62, 0.7, craterAge);
    float floorBlend = 0.06;
    float floorMask = 1.0 - smoothstep(floorRadius - floorBlend, floorRadius, t);

    // Inward flank from the rim: same fast drop then easing, but reaches plateau sooner.
    float inwardProgress = clamp((t - floorRadius) / max(1e-4, 1.0 - floorRadius), 0.0, 1.0);
    float inwardExponent = mix(2.9, 1.95, sharpness01);
    float inwardFalloff = pow(inwardProgress, inwardExponent);

    float isExterior = step(1.0, t);
    float rimFlank = mix(rimPeak * inwardFalloff, rimPeak * exteriorFalloff, isExterior);
    float interiorProfile = -bowlDepth * (1.0 - inwardFalloff);

    float floorMicro =
      fractalNoise(vec3(t * 13.0 + craterAge * 4.0, t * 9.0 + craterAge * 2.0, craterAge * 11.0))
      * 0.015
      * floorMask;

    return rimFlank + interiorProfile + floorMicro;
  }

  float craterCompositeMask(float t) {
    // Full influence in bowl/rim, easing off across the outer flank.
    return 1.0 - smoothstep(1.12, 1.38, t);
  }

  float accumulateCraterComposite(vec2 uv, out float coverage) {
    float composedHeight = 0.0;
    coverage = 0.0;

    // Uniform loop bounds stop ANGLE's D3D compiler unrolling these loops (~40 s compile).
    int craterCount = min(uCraterCount, MAX_CRATERS);
    for (int i = 0; i < craterCount; i++) {
      vec2 craterUv;
      float craterRadius;
      float craterAge;
      buildCrater(i, craterUv, craterRadius, craterAge);

      float t = craterNormalizedDistance(uv, craterUv, craterRadius, craterAge);
      if (t >= 1.38) continue;

      float profile = craterShape(t, craterAge);
      float applyMask = craterCompositeMask(t);
      float localBlend = applyMask * CRATER_NEW_HEIGHT_WEIGHT;
      coverage = max(coverage, applyMask);

      composedHeight = mix(composedHeight, profile, localBlend);
    }

    return composedHeight;
  }

  float accumulateCraterHeight(vec2 uv, out float coverage) {
    float craterHeight = accumulateCraterComposite(uv, coverage);
    return clamp(craterHeight, -1.25, 0.35);
  }

  float accumulateCraterColorWarp(vec2 uv) {
    float coverage;
    float composedProfile = accumulateCraterComposite(uv, coverage);
    float signedGain = composedProfile < 0.0 ? 1.15 : 0.84;
    float craterWarp = composedProfile * signedGain;

    return clamp(craterWarp, -1.0, 0.8);
  }

  void buildVolcano(int i, out vec2 centerUv, out float radius) {
    float fi = float(i);

    float u = hash12(vec2(fi * 4.17, uSeed.x * 0.001 + 51.0));
    float v = 0.16 + hash12(vec2(fi * 5.31, uSeed.y * 0.001 + 63.0)) * 0.68;
    float radiusSample = hash12(vec2(fi * 6.57, uSeed.z * 0.001 + 77.0));

    float minRadius = 0.012;
    float maxRadius = 0.048;
    float scale = uVolcanoScale;
    float scaleNorm = (scale - 0.35) / 2.15;
    float adjusted = mix(pow(radiusSample, 2.2), pow(radiusSample, 0.75), scaleNorm);

    centerUv = vec2(u, v);
    radius = mix(minRadius, maxRadius, adjusted);
  }

  float volcanoNormalizedDistance(vec2 uv, vec2 volcanoUv, float volcanoRadius) {
    float duRaw = abs(uv.x - volcanoUv.x);
    float du = min(duRaw, 1.0 - duRaw);
    float dv = abs(uv.y - volcanoUv.y);

    float rx = max(1e-5, volcanoRadius * 0.62);
    float ry = max(1e-5, volcanoRadius);

    return length(vec2(du / rx, dv / ry));
  }

  vec3 volcanoSpherePosition(vec2 uv) {
    float theta = uv.x * TAU;
    float phi = uv.y * PI;
    return vec3(sin(phi) * cos(theta), cos(phi), sin(phi) * sin(theta));
  }

  float accumulateVolcanoHeight(vec2 uv, out float coverage) {
    float height = 0.0;
    coverage = 0.0;
    vec3 spherePos = volcanoSpherePosition(uv);

    int volcanoCount = min(uVolcanoCount, MAX_VOLCANOES);
    for (int i = 0; i < volcanoCount; i++) {
      vec2 volcanoUv;
      float volcanoRadius;
      buildVolcano(i, volcanoUv, volcanoRadius);

      float shapeNoise = perlin3(
        spherePos * 38.0 + uSeed * 0.47 + vec3(31.7, 9.3, 57.1)
      );
      float t = max(0.0, volcanoNormalizedDistance(uv, volcanoUv, volcanoRadius) + shapeNoise * 0.07);
      coverage = max(coverage, 1.0 - smoothstep(1.05, 1.45, t));
      if (t > 1.45) continue;

      float caldera = exp(-pow(t / 0.18, 4.0)) * 0.9;
      float calderaRim = exp(-pow((t - 0.22) / 0.05, 2.0)) * 0.16;

      float du = uv.x - volcanoUv.x;
      if (du > 0.5) du -= 1.0;
      if (du < -0.5) du += 1.0;
      float dv = uv.y - volcanoUv.y;
      float rx = max(1e-5, volcanoRadius * 0.62);
      float ry = max(1e-5, volcanoRadius);
      vec2 local = vec2(du / rx, dv / ry);
      float angle = atan(local.y, local.x);
      float phase = hash12(vec2(volcanoUv.x * 9.1, volcanoUv.y * 13.7)) * TAU;
      float size01 = clamp((volcanoRadius - 0.012) / 0.036, 0.0, 1.0);
      float facetCount = floor(mix(6.0, 10.0, size01) + 0.5);
      float facetPosition = fract(((angle + PI) / TAU) * facetCount + phase / TAU);
      float facet = 1.0 - abs(facetPosition * 2.0 - 1.0);
      float facetedT = t * mix(1.04, 0.96, facet);
      float cone = exp(-pow(facetedT / 0.82, 2.0)) * 0.72;
      float buttressRelief = exp(-pow((t - 0.82) / 0.32, 2.0)) * 0.05;

      height +=
        (
          cone +
          calderaRim -
          caldera +
          buttressRelief
        )
        * uVolcanoStrength;
    }

    return clamp(height, -1.0, 1.8);
  }

  vec2 accumulateVolcanoColorSignals(vec2 uv) {
    float lift = 0.0;
    float darken = 0.0;
    vec3 spherePos = volcanoSpherePosition(uv);

    int volcanoCount = min(uVolcanoCount, MAX_VOLCANOES);
    for (int i = 0; i < volcanoCount; i++) {
      vec2 volcanoUv;
      float volcanoRadius;
      buildVolcano(i, volcanoUv, volcanoRadius);

      float shapeNoise = perlin3(
        spherePos * 38.0 + uSeed * 0.47 + vec3(31.7, 9.3, 57.1)
      );
      float t = max(0.0, volcanoNormalizedDistance(uv, volcanoUv, volcanoRadius) + shapeNoise * 0.07);
      if (t > 1.5) continue;

      float craterDarken = exp(-pow(t / 0.18, 4.0)) * 0.65;
      float ringLighten = exp(-pow((t - 0.22) / 0.07, 2.0)) * 0.2;

      float du = uv.x - volcanoUv.x;
      if (du > 0.5) du -= 1.0;
      if (du < -0.5) du += 1.0;
      float dv = uv.y - volcanoUv.y;
      float rx = max(1e-5, volcanoRadius * 0.62);
      float ry = max(1e-5, volcanoRadius);
      vec2 local = vec2(du / rx, dv / ry);
      float angle = atan(local.y, local.x);
      float phase = hash12(vec2(volcanoUv.x * 9.1, volcanoUv.y * 13.7)) * TAU;
      float size01 = clamp((volcanoRadius - 0.012) / 0.036, 0.0, 1.0);
      float facetCount = floor(mix(6.0, 10.0, size01) + 0.5);
      float facetPosition = fract(((angle + PI) / TAU) * facetCount + phase / TAU);
      float facet = 1.0 - abs(facetPosition * 2.0 - 1.0);
      float facetedT = t * mix(1.04, 0.96, facet);
      float coneLighten = exp(-pow(facetedT / 0.82, 2.0)) * 0.32;
      float buttressHighlight = exp(-pow((t - 0.82) / 0.32, 2.0)) * 0.06;

      float detailField = perlin3(
        spherePos * 56.0 + uSeed * 1.61 + vec3(41.9, 23.7, 67.4)
      );
      float detailMask = clamp(0.72 + detailField * 0.35, 0.35, 1.1);

      // Use strongest local volcano influence instead of additive stacking
      // so overlapping volcanoes do not over-saturate color.
      lift = max(lift, clamp((coneLighten + ringLighten + buttressHighlight) * detailMask, 0.0, 1.0));
      darken = max(darken, clamp(craterDarken * detailMask, 0.0, 1.0));
    }

    return vec2(lift, darken) * uVolcanoColorStrength;
  }

  bool isDebugEquatorPixel(float y) {
    float equatorY = round((uResolution.y - 1.0) * 0.5);
    return abs(y - equatorY) < 0.5;
  }

  bool isDebugMeridianPixel(float x, float meridianU) {
    float meridianX = round((uResolution.x - 1.0) * meridianU);
    return abs(x - meridianX) < 0.5;
  }

  vec2 wrapSurfaceUv(vec2 uv) {
    return vec2(fract(uv.x), clamp(uv.y, 0.0, 1.0));
  }

  // Central-difference tap order: left, right, down, up. Summing dir * h gives (hR - hL, hU - hD).
  vec2 gradientTapDirection(int i) {
    if (i == 0) return vec2(-1.0, 0.0);
    if (i == 1) return vec2(1.0, 0.0);
    if (i == 2) return vec2(0.0, -1.0);
    return vec2(0.0, 1.0);
  }

  vec4 sampleIceCover(vec3 spherePos, vec3 seed, out float iceFractures, out vec2 iceMargin) {
    iceFractures = 0.0;
    iceMargin = vec2(0.0);
    if (uEnableIceCaps != 1 || uIceCapCoverage <= 0.0) return vec4(0.0);

    float latitude = abs(spherePos.y);
    vec3 capWarp = vec3(
      perlin3(spherePos * 3.0 + seed * 0.31),
      perlin3(spherePos * 3.0 + seed * 0.53 + vec3(17.3, 5.1, 29.7)),
      perlin3(spherePos * 3.0 + seed * 0.71 + vec3(7.9, 31.5, 11.3))
    );
    vec3 capDomain = spherePos * 5.0 + capWarp * 2.5 + seed * 0.43;
    float broadNoise = perlin3(capDomain) * 0.5
      + perlin3(capDomain * 2.3 + vec3(19.1, 7.3, 41.7)) * 0.32
      + perlin3(capDomain * 4.7 + vec3(3.7, 23.9, 13.1)) * 0.18;
    broadNoise = clamp(broadNoise * 3.0, -1.0, 1.0);
    float gapRidges = pow(clamp(1.0 - abs(perlin3(capDomain * 1.7)) * 3.0, 0.0, 1.0), 4.0);
    float gapRegions = smoothstep(-0.15, 0.2, perlin3(capDomain * 0.8 + seed * 0.59));
    float broadExtent = min(0.6, uIceCapCoverage * 2.4) * uIceCapEdgeNoise;
    float poleTaper = clamp((1.0 - latitude) / (uIceCapCoverage * 0.35), 0.0, 1.0);
    float capShapeOffset = (broadNoise - gapRidges * gapRegions * 0.8) * broadExtent * poleTaper;
    float coastNoise = perlin3(spherePos * 9.0 + seed);
    float fineNoise = perlin3(spherePos * 35.0 + seed * 1.37);
    float microNoise = perlin3(spherePos * 80.0 + seed * 2.19);
    vec3 flowDomain = spherePos * vec3(24.0, 4.0, 24.0) + seed;
    flowDomain += vec3(coastNoise, fineNoise, coastNoise) * 1.5;
    float flowRidges = pow(clamp(1.0 - abs(perlin3(flowDomain)) * 3.0, 0.0, 1.0), 6.0);
    float flowRegions = smoothstep(-0.15, 0.25, perlin3(spherePos * 6.0 + seed * 0.71));
    float edgeNoise = coastNoise * 0.7 + fineNoise * 0.2 + microNoise * 0.1;
    float glacierFlows = flowRidges * flowRegions;
    iceFractures = max(gapRidges * gapRegions, glacierFlows * 0.65) * 0.24;
    float edgeExtent = min(0.18, uIceCapCoverage * 0.8) * uIceCapEdgeNoise;
    float iceLatitude = latitude + capShapeOffset
      + (edgeNoise + glacierFlows) * edgeExtent * (1.0 - latitude * latitude);
    float boundary = 1.0 - uIceCapCoverage;
    float iceMask = uIceCapCoverage >= 1.0 ? 1.0 : step(boundary, iceLatitude);
    float marginHeightNoise = clamp(0.5 + perlin3(capDomain * 0.65 + vec3(43.7, 11.9, 67.3)) * 1.6, 0.0, 1.0);
    float marginSlopeNoise = clamp(0.5 + perlin3(capDomain * 1.1 + vec3(7.1, 53.9, 23.3)) * 1.6, 0.0, 1.0);
    float marginWidth = max(0.0005, min(0.035, uIceCapCoverage * 0.25) * mix(0.12, 1.0, marginSlopeNoise));
    float marginDistance = max(0.0, iceLatitude - boundary);
    float marginRise = smoothstep(0.0, marginWidth, marginDistance);
    float marginFalloff = 1.0 - smoothstep(marginWidth * 2.0, marginWidth * 5.0, marginDistance);
    float marginHeight = mix(0.035, 0.6, marginHeightNoise * marginHeightNoise);
    iceMargin = uIceCapCoverage >= 1.0
      ? vec2(1.0, 0.0)
      : vec2(marginRise, marginRise * marginFalloff * marginHeight);
    float iceValue = clamp(broadNoise * 0.55 + coastNoise * 0.6 + fineNoise * 0.3
      + microNoise * 0.15 + glacierFlows * 0.25, -1.0, 1.0);
    float snowMask = 0.0;
    float snowValue = 0.0;
    if (uSnowExtent > 0.0 && uSnowCoverage > 0.0 && iceMask < 1.0) {
      float snowDistance = max(0.0, boundary - iceLatitude);
      float snowFalloff = 1.0 - smoothstep(0.0, uSnowExtent, snowDistance);
      vec3 snowDomain = spherePos * 18.0 + capWarp * 3.0 + seed * 1.91;
      float snowNoise = perlin3(snowDomain) * 0.65
        + perlin3(snowDomain * 3.1 + vec3(31.7, 9.3, 47.1)) * 0.35;
      float snowField = clamp(0.5 + snowNoise * 1.8, 0.0, 1.0);
      float snowThreshold = mix(1.15, -0.15, uSnowCoverage);
      float snowPatches = smoothstep(snowThreshold - 0.15, snowThreshold + 0.15, snowField);
      snowMask = snowPatches * snowFalloff * 0.9;
      snowValue = clamp(0.45 + snowNoise * 0.7, -1.0, 1.0);
    }
    return vec4(iceMask, snowMask, iceValue, snowValue);
  }

  float exposedRidgeMask(float ridgeHeight) {
    return smoothstep(0.18, 0.4, ridgeHeight);
  }

  float sampleSurfaceDisplacement(vec2 uv, bool includeDebugGuides) {
    uv = wrapSurfaceUv(uv);

    float x = uv.x * (uResolution.x - 1.0);
    float y = uv.y * (uResolution.y - 1.0);

    float theta = uv.x * TAU;
    float phi = uv.y * PI;
    float equatorFactor = pow(sin(phi), 0.8);

    vec3 spherePos = vec3(
      sin(phi) * cos(theta),
      cos(phi),
      sin(phi) * sin(theta)
    );

    vec3 seed = uSeed;

    float warpX = fractalNoise(spherePos * 7.3 + seed * 0.43 + vec3(13.1, 37.2, 73.8));
    float warpY = fractalNoise(spherePos * 6.7 + seed * 0.57 + vec3(29.4, 11.8, 47.3));
    float warpZ = fractalNoise(spherePos * 8.1 + seed * 0.49 + vec3(41.7, 59.6, 19.5));
    float swirlStrength = 0.22 * uSwirliness;
    vec3 warpedSpherePos = normalize(spherePos + vec3(warpX, warpY, warpZ) * swirlStrength);

    vec3 remappedPos = vec3(
      dot(warpedSpherePos, vec3(0.00, 0.83, 0.56)),
      dot(warpedSpherePos, vec3(0.56, 0.00, 0.83)),
      dot(warpedSpherePos, vec3(0.83, 0.56, 0.00))
    );

    float craterCoverage = 0.0;
    float volcanoCoverage = 0.0;
    float craterHeight = (uEnableCraters == 1) ? accumulateCraterHeight(uv, craterCoverage) : 0.0;
    float volcanoHeight = (uEnableVolcanoes == 1) ? accumulateVolcanoHeight(uv, volcanoCoverage) : 0.0;
    float ridgeRift = 0.0;
    float ridgeHeight = 0.0;
    if (uEnableRidges == 1 || uEnableRifts == 1) {
      vec2 ridgeRiftSignalsLocal = ridgeRiftSignals(remappedPos, seed);
      float blend = uRidgesRiftsBlend;
      float ridgeTerm = (uEnableRidges == 1)
        ? ridgeRiftSignalsLocal.x * (1.0 - blend) * uRidgeElevation
        : 0.0;
      float riftTerm = (uEnableRifts == 1) ? -ridgeRiftSignalsLocal.y * blend : 0.0;
      ridgeHeight = ridgeTerm;
      ridgeRift = ridgeTerm + riftTerm;
    }
    float featureCoverage = max(craterCoverage, volcanoCoverage);
    ridgeHeight *= 1.0 - featureCoverage;
    ridgeRift *= 1.0 - featureCoverage;

    float bumpBase = fractalNoise(remappedPos * 8.7 + seed * 1.03 + vec3(1.1, 2.3, 3.7));
    float bumpDust = fractalNoise(remappedPos * 93.0 + seed * 1.79 + vec3(11.3, 17.9, 23.1));
    float bumpGrain = fractalNoise(remappedPos * 187.0 + seed * 2.41 + vec3(29.3, 31.7, 37.1));

    float polarHighFrequencyScale = mix(0.15, 1.0, equatorFactor);
    float brightSpeckles = pow(clamp((bumpDust + 1.0) * 0.5, 0.0, 1.0), 9.0);
    float darkSpeckles = pow(clamp((-bumpDust + 1.0) * 0.5, 0.0, 1.0), 10.0);

    float debugGuideRaise = 0.0;
    if (includeDebugGuides) {
      bool debugEquator = (uDebugMidline == 1) && isDebugEquatorPixel(y);
      bool debugMeridian0 = (uDebugMidline == 1) && (x < 0.5 || x > (uResolution.x - 1.5));
      bool debugMeridian90 = (uDebugMidline == 1) && isDebugMeridianPixel(x, 0.25);
      bool debugMeridian180 = (uDebugMidline == 1) && isDebugMeridianPixel(x, 0.5);
      bool debugMeridian270 = (uDebugMidline == 1) && isDebugMeridianPixel(x, 0.75);
      debugGuideRaise = (debugEquator || debugMeridian0 || debugMeridian90 || debugMeridian180 || debugMeridian270)
        ? 0.65
        : 0.0;
    }

    float terrainHeight =
      bumpBase * 0.55 +
      bumpDust * 0.2 * polarHighFrequencyScale +
      bumpGrain * 0.1 * polarHighFrequencyScale +
      ridgeRift +
      brightSpeckles * 0.75 * polarHighFrequencyScale -
      darkSpeckles * 0.55 * polarHighFrequencyScale;
    terrainHeight += craterHeight * uCraterStrength;
    terrainHeight += volcanoHeight;
    float iceFractures;
    vec2 iceMargin;
    vec4 iceCover = sampleIceCover(spherePos, seed, iceFractures, iceMargin);
    float ridgeExposure = exposedRidgeMask(ridgeHeight);
    float snowSmoothing = iceCover.y * (1.0 - ridgeExposure) * 0.85;
    terrainHeight *= 1.0 - snowSmoothing;
    float iceRelief = (iceCover.z * 0.35 - iceFractures) * (1.0 - ridgeExposure);
    float iceHeight = iceRelief + max(0.0, ridgeHeight - 0.18) * ridgeExposure;
    float marginRelief = iceMargin.y * (1.0 - ridgeExposure);
    return mix(terrainHeight, iceHeight, iceMargin.x) + marginRelief + debugGuideRaise;
  }

  // Returns x = signed cloud field, y = fine detail, z = final alpha, w = coverage mask.
  // lumps is a mid-frequency field kept decorrelated from the palette input so it can
  // add albedo variation without cancelling the palette's own density ramp.
  vec4 dustCloudSample(vec2 uv, out float lumps) {
    uv = wrapSurfaceUv(uv);

    float weightWisps = max(0.0, uDustCloudWeights[0]);
    float weightWorley = max(0.0, uDustCloudWeights[1]);
    float weightCumulonimbus = max(0.0, uDustCloudWeights[2]);
    float weightStorm = max(0.0, uDustCloudWeights[3]);
    float weightStormWorley = max(0.0, uDustCloudWeights[4]);
    float totalWeight = weightWisps + weightWorley + weightCumulonimbus + weightStorm + weightStormWorley;
    if (totalWeight < 0.0001) {
      weightWisps = 1.0;
      totalWeight = 1.0;
    }

    float theta = uv.x * TAU;
    float phi = uv.y * PI;

    vec3 spherePos = vec3(
      sin(phi) * cos(theta),
      cos(phi),
      sin(phi) * sin(theta)
    );

    vec3 seed = uSeed;

    float warpX = fractalNoise(spherePos * 7.3 + seed * 0.43 + vec3(13.1, 37.2, 73.8));
    float warpY = fractalNoise(spherePos * 6.7 + seed * 0.57 + vec3(29.4, 11.8, 47.3));
    float warpZ = fractalNoise(spherePos * 8.1 + seed * 0.49 + vec3(41.7, 59.6, 19.5));
    float swirlStrength = 0.22 * uSwirliness;
    vec3 warpedSpherePos = normalize(spherePos + vec3(warpX, warpY, warpZ) * swirlStrength);

    vec3 remappedPos = vec3(
      dot(warpedSpherePos, vec3(0.00, 0.83, 0.56)),
      dot(warpedSpherePos, vec3(0.56, 0.00, 0.83)),
      dot(warpedSpherePos, vec3(0.83, 0.56, 0.00))
    );

    float coverage = uDustCloudCoverage;
    float frequency = max(0.05, uDustCloudFrequency);
    float cloudSwirliness = uDustCloudSwirliness;
    float coriolis = spherePos.y * uDustCloudCoriolis;
    vec3 cloudWarp = vec3(
      fractalNoise(remappedPos * (frequency * 2.4) + seed * 0.91 + vec3(13.1, 37.2, 73.8)),
      fractalNoise(remappedPos * (frequency * 2.1) + seed * 1.17 + vec3(29.4, 11.8, 47.3)),
      fractalNoise(remappedPos * (frequency * 2.7) + seed * 1.03 + vec3(41.7, 59.6, 19.5))
    );
    vec3 eastward = vec3(-spherePos.z, 0.0, spherePos.x);
    vec3 cloudPosition = normalize(
      spherePos + cloudWarp * (0.16 * cloudSwirliness) + eastward * (0.12 * coriolis * cloudSwirliness)
    );
    if (weightStorm + weightStormWorley > 0.0) {
      float vortexStrength = 0.26 * cloudSwirliness;
      cloudPosition = applySeededVortex(cloudPosition, seed, 1.0, vortexStrength);
      cloudPosition = applySeededVortex(cloudPosition, seed, 2.0, vortexStrength);
      cloudPosition = applySeededVortex(cloudPosition, seed, 3.0, vortexStrength);
    }
    float cloudMacro = fractalNoise(cloudPosition * (1.5 * frequency) + seed * 1.23 + vec3(31.7, 19.3, 47.1));
    float cloudShape = fractalNoise(cloudPosition * (5.2 * frequency) + seed * 1.37 + vec3(37.1, 11.9, 53.7));
    float cloudDetail = fractalNoise(cloudPosition * (19.0 * frequency) + seed * 1.91 + vec3(7.3, 61.1, 29.5));
    float cloudWisps = fractalNoise(cloudPosition * (43.0 * frequency) + seed * 2.13 + vec3(23.7, 41.3, 5.9));
    float cloudMass = cloudMacro * 0.58 + cloudShape * 0.42;
    float cloudDetailGate = smoothstep(-0.36, 0.32, cloudMass);
    float cloudFine = cloudDetail * 0.72 + cloudWisps * 0.28;
    float wispField = cloudMass + cloudFine * mix(0.06, 0.24, cloudDetailGate);

    float worleyField = 0.0;
    float worleyErosion = 0.0;
    float worleyBillow = 0.481;
    if (weightWorley + weightCumulonimbus + weightStorm + weightStormWorley > 0.0) {
      float worleyBase = worleyFbm(
        cloudPosition * (2.6 * frequency) + seed * 1.53 + vec3(51.3, 9.7, 77.1),
        2.15,
        0.52
      );
      float worleyFine = worleyFbm(
        cloudPosition * (7.4 * frequency) + seed * 1.87 + vec3(5.9, 63.7, 21.3),
        2.3,
        0.5
      );
      worleyBillow = clamp(worleyBase * 0.76 + worleyFine * 0.24, 0.0, 1.0);
      worleyField = (worleyBillow - 0.481) * 2.65;
      worleyErosion = (worleyFine - 0.481) * 2.0;
    }

    float stormField = 0.0;
    if (weightStorm + weightStormWorley > 0.0) {
      float stormCoverage = clamp(0.36 + cloudMass * 0.16 + cloudFine * 0.04, 0.0, 0.48);
      for (int stormIndex = 0; stormIndex < 6 * uOne; stormIndex++) {
        float stormId = float(stormIndex);
        vec3 stormCenter = normalize(vec3(
          hash11(seed.x + 19.1 + stormId * 17.1),
          hash11(seed.y + 43.7 + stormId * 29.7),
          hash11(seed.z + 71.3 + stormId * 41.3)
        ) * 2.0 - 1.0);
        vec3 stormReference = (abs(stormCenter.y) < 0.95) ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
        vec3 stormEast = normalize(cross(stormReference, stormCenter));
        vec3 stormNorth = cross(stormCenter, stormEast);
        float angularDistance = acos(clamp(dot(cloudPosition, stormCenter), -1.0, 1.0));
        float stormAngle = atan(dot(cloudPosition, stormNorth), dot(cloudPosition, stormEast));
        float largeStormRadius = mix(0.22, 0.36, hash11(seed.x + stormId * 47.9));
        float smallStormRadius = mix(0.07, 0.18, hash11(seed.y + stormId * 53.1));
        float stormRadius = (stormIndex < 2) ? largeStormRadius : smallStormRadius;
        float boundaryNoise = cloudMacro * 0.24 + cloudShape * 0.24 + cloudFine * 0.12 + worleyField * 0.18;
        float warpedDistance = angularDistance + boundaryNoise * stormRadius;
        float stormEnvelope = 1.0 - smoothstep(stormRadius * 0.3, stormRadius, warpedDistance);
        float swirlChance = step(0.58, hash11(seed.z + stormId * 61.7));
        float swirlBand = 0.5 + 0.5 * sin(
          stormAngle * mix(2.0, 5.0, hash11(seed.x + stormId * 67.3)) +
          angularDistance * mix(14.0, 38.0, hash11(seed.y + stormId * 73.9)) +
          cloudDetail * 2.2
        );
        float billowShape = clamp(0.53 + cloudMass * 0.22 + cloudFine * 0.16 + worleyField * 0.14, 0.0, 1.0);
        float stormShape = mix(billowShape, swirlBand, swirlChance);
        float stormStrength = mix(0.82, 1.0, hash11(seed.x + stormId * 79.1));
        stormCoverage = max(stormCoverage, stormEnvelope * stormShape * stormStrength);
      }
      float stormInterior = smoothstep(0.4, 0.66, stormCoverage);
      float stormMidDetail = cloudShape * 0.24 + worleyField * 0.24;
      float stormFineDetail = cloudFine * 0.2 + worleyErosion * 0.12;
      float stormDetail = stormInterior * (stormMidDetail + stormFineDetail);
      stormField = stormCoverage * 2.2 - 0.82 + stormDetail;
    }

    float worleyCloudField = mix(worleyField, wispField, 0.18);
    float cumulonimbusField = wispField * 0.18 + worleyField * 0.62 + cloudMacro * 0.2 - abs(worleyErosion) * 0.12;
    float stormCloudField = stormField - abs(worleyErosion) * 0.08;
    float stormCellMask = smoothstep(-0.35, 0.35, worleyField);
    float stormWorleyField = stormField * mix(0.2, 1.8, stormCellMask);
    float cloudField = (
      weightWisps * wispField +
      weightWorley * worleyCloudField +
      weightCumulonimbus * cumulonimbusField +
      weightStorm * stormCloudField +
      weightStormWorley * stormWorleyField
    ) / totalWeight;

    float threshold = mix(0.76, -0.3, coverage);
    threshold -= 0.06 * (weightStorm + weightStormWorley) / totalWeight;
    float coverageMask = smoothstep(threshold, threshold + 0.2, cloudField);
    float stormWorleyShare = weightStormWorley / totalWeight;
    float cellThreshold = mix(0.2, -0.45, coverage);
    float cellEdge = mix(0.55, -0.15, coverage);
    coverageMask *= mix(1.0, smoothstep(cellThreshold, cellEdge, worleyField), stormWorleyShare);
    float cloudAlpha = coverageMask * uDustCloudOpacity;

    lumps = fractalNoise(cloudPosition * (13.0 * frequency) + seed * 2.71 + vec3(67.3, 5.1, 89.7));

    return vec4(cloudField, cloudDetail, cloudAlpha, coverageMask);
  }

  // Pseudo-height of the dust layer, used to derive the cloud normal map. The hard
  // coverage edge is deliberately excluded: its one-texel cliff would swamp the
  // gradient and shade the whole layer black.
  float dustCloudHeight(vec2 uv) {
    float lumps;
    vec4 cloud = dustCloudSample(uv, lumps);
    float body = clamp(cloud.x * 0.5 + 0.5, 0.0, 1.0);
    return body * 0.85 + cloud.y * 0.08;
  }

  void main() {
    vec2 uv = vUv;

    // Each MODE is compiled as its own program so it only contains the code it needs.
#if MODE == 0
    float x = uv.x * (uResolution.x - 1.0);
    float y = uv.y * (uResolution.y - 1.0);

    float theta = uv.x * TAU;
    float phi = uv.y * PI;
    float equatorFactor = pow(sin(phi), 0.8);

    vec3 spherePos = vec3(
      sin(phi) * cos(theta),
      cos(phi),
      sin(phi) * sin(theta)
    );

    vec3 seed = uSeed;

    // Shared warped domain keeps micro-structure consistent between surface detail and color paths.
    float warpX = fractalNoise(spherePos * 7.3 + seed * 0.43 + vec3(13.1, 37.2, 73.8));
    float warpY = fractalNoise(spherePos * 6.7 + seed * 0.57 + vec3(29.4, 11.8, 47.3));
    float warpZ = fractalNoise(spherePos * 8.1 + seed * 0.49 + vec3(41.7, 59.6, 19.5));
    float swirlStrength = 0.22 * uSwirliness;
    vec3 warpedSpherePos = normalize(spherePos + vec3(warpX, warpY, warpZ) * swirlStrength);

    vec3 remappedPos = vec3(
      dot(warpedSpherePos, vec3(0.00, 0.83, 0.56)),
      dot(warpedSpherePos, vec3(0.56, 0.00, 0.83)),
      dot(warpedSpherePos, vec3(0.83, 0.56, 0.00))
    );

    float craterCoverage = 0.0;
    float volcanoCoverage = 0.0;
    float craterHeight = (uEnableCraters == 1) ? accumulateCraterHeight(uv, craterCoverage) : 0.0;
    float craterColorWarp = (uEnableCraters == 1) ? accumulateCraterColorWarp(uv) : 0.0;
    float volcanoHeight = (uEnableVolcanoes == 1) ? accumulateVolcanoHeight(uv, volcanoCoverage) : 0.0;
    vec2 volcanoColorSignals = (uEnableVolcanoes == 1)
      ? accumulateVolcanoColorSignals(uv)
      : vec2(0.0);
    float volcanoColorWarp = volcanoColorSignals.x * 0.9 - volcanoColorSignals.y * 1.05;
    vec2 ridgeRiftColorSignals = vec2(0.0);
    if (uEnableRidges == 1 || uEnableRifts == 1) {
      vec2 baseRidgeRiftSignals = ridgeRiftSignals(remappedPos, seed);
      ridgeRiftColorSignals = vec2(
        (uEnableRidges == 1) ? baseRidgeRiftSignals.x : 0.0,
        (uEnableRifts == 1) ? baseRidgeRiftSignals.y : 0.0
      );
    }
    ridgeRiftColorSignals *= 1.0 - max(craterCoverage, volcanoCoverage);
    bool debugEquator = (uDebugMidline == 1) && isDebugEquatorPixel(y);
    bool debugMeridian0 = (uDebugMidline == 1) && (x < 0.5 || x > (uResolution.x - 1.5));
    bool debugMeridian90 = (uDebugMidline == 1) && isDebugMeridianPixel(x, 0.25);
    bool debugMeridian180 = (uDebugMidline == 1) && isDebugMeridianPixel(x, 0.5);
    bool debugMeridian270 = (uDebugMidline == 1) && isDebugMeridianPixel(x, 0.75);
#endif

#if MODE == 4
    {
      vec2 texel = 1.0 / max(uResolution, vec2(1.0));

      // Looping the taps keeps a single copy of the (very large) height function in the program.
      vec2 gradient = vec2(0.0);
      for (int i = 0; i < 4 * uOne; i++) {
        vec2 dir = gradientTapDirection(i);
        gradient += dir * sampleSurfaceDisplacement(uv + dir * texel, false);
      }

      float dX = gradient.x;
      float dY = gradient.y;
      vec3 normal = normalize(vec3(-dX * 0.85, -dY * 0.85, 1.0));
      vec3 encodedNormal = normal * 0.5 + 0.5;

      gl_FragColor = vec4(clamp(encodedNormal, 0.0, 1.0), 1.0);
      return;
    }
#endif

#if MODE == 5
    {
      float lumps;
      vec4 cloud = dustCloudSample(uv, lumps);
      vec3 cloudColor = mapToPalette(clamp(cloud.x * 0.72 + cloud.y * 0.35, -1.0, 1.0));

      // Light-independent self-shading. Lambert's cosine is flat at its maximum, so
      // normal-map relief only reads near the terminator; baking shading into the
      // albedo keeps cloud structure visible in full daylight too.
      float lumpShade = mix(0.42, 1.2, clamp(lumps * 0.5 + 0.5, 0.0, 1.0));
      float shadeStrength = uDustCloudRelief * 0.65;
      cloudColor *= mix(1.0, lumpShade, shadeStrength);

      gl_FragColor = vec4(clamp(cloudColor, 0.0, 1.0), cloud.z);
      return;
    }
#endif

#if MODE == 6
    {
      vec2 texel = 1.0 / max(uResolution, vec2(1.0));
      // Two-texel taps low-pass the field; the cloud noise runs close to Nyquist
      // and single-texel differences alias into speckle.
      vec2 tap = texel * 2.0;

      vec2 heightDelta = vec2(0.0);
      for (int i = 0; i < 4 * uOne; i++) {
        vec2 dir = gradientTapDirection(i);
        heightDelta += dir * dustCloudHeight(uv + dir * tap);
      }

      // Scale slopes by resolution so the relief looks the same at any texture size.
      float slopeScale = uResolution.y * 0.008;
      vec2 slope = heightDelta * slopeScale;
      // Cap the tilt at 45 degrees so steep noise never shades the dust to black.
      slope = clamp(slope, -1.0, 1.0);

      vec3 normal = normalize(vec3(-slope.x, -slope.y, 1.0));
      gl_FragColor = vec4(clamp(normal * 0.5 + 0.5, 0.0, 1.0), 1.0);
      return;
    }
#endif

#if MODE == 0
    // Colour-only warping leaves terrain features and their normal maps aligned.
    vec3 colorWarp = vec3(
      colorSwirlNoise(spherePos * (7.3 * uColorSwirlFrequency) + seed * 0.43 + vec3(13.1, 37.2, 73.8)),
      colorSwirlNoise(spherePos * (6.7 * uColorSwirlFrequency) + seed * 0.57 + vec3(29.4, 11.8, 47.3)),
      colorSwirlNoise(spherePos * (8.1 * uColorSwirlFrequency) + seed * 0.49 + vec3(41.7, 59.6, 19.5))
    );
    vec3 colorSpherePos = normalize(spherePos + colorWarp * swirlStrength);
    vec3 colorPos = vec3(
      dot(colorSpherePos, vec3(0.00, 0.83, 0.56)),
      dot(colorSpherePos, vec3(0.56, 0.00, 0.83)),
      dot(colorSpherePos, vec3(0.83, 0.56, 0.00))
    ) * uColorNoiseFrequency;
    float colorLarge = colorNoise(colorPos * 2.0 + seed);
    float colorMedium = colorNoise(colorPos * 6.0 + seed);
    float colorFine = colorNoise(colorPos * 40.0 + seed);

    float polarHighFrequencyScale = mix(0.18, 1.0, equatorFactor);
    float value =
      colorLarge * 0.55 +
      colorMedium * 0.3 * polarHighFrequencyScale +
      colorFine * 0.15 * polarHighFrequencyScale +
      craterColorWarp * uCraterColorStrength +
      volcanoColorWarp * 0.7 +
      ridgeRiftColorSignals.x * (uRidgeColorWeight * 0.85) -
      ridgeRiftColorSignals.y * (uRiftColorWeight * 1.05);

    vec3 paletteColor = mapToPalette(value);

    // Apply an explicit post-palette deformation so ridge/rift color weights
    // remain visually obvious even when base palette noise is strong.
    float ridgeColorLift = clamp(ridgeRiftColorSignals.x * uRidgeColorWeight * 0.22, 0.0, 0.45);
    float riftColorDarken = clamp(ridgeRiftColorSignals.y * uRiftColorWeight * 0.28, 0.0, 0.6);
    float volcanoPeakLift = clamp(volcanoColorSignals.x * 0.14, 0.0, 0.35);
    float volcanoCalderaDarken = clamp(volcanoColorSignals.y * 0.2, 0.0, 0.35);

    paletteColor = mix(paletteColor, vec3(1.0), ridgeColorLift);
    paletteColor *= (1.0 - riftColorDarken);
    paletteColor = mix(paletteColor, vec3(0.98, 0.78, 0.62), volcanoPeakLift);
    paletteColor *= (1.0 - volcanoCalderaDarken);
    paletteColor = clamp(paletteColor, 0.0, 1.0);

    float normalizedValue = clamp((value + 1.0) * 0.5, 0.0, 1.0);
    float textureDominance = uTextureScale;

    // Tint leg: grayscale-driven ramp from darker tint to full tint.
    vec3 tintColor = uTint;
    vec3 darkTint = tintColor * uTintShadowFloor;
    vec3 tintMapped = mix(darkTint, tintColor, normalizedValue);

    vec3 finalColor = mix(tintMapped, paletteColor, textureDominance);

    float extraTextureScale = max(0.0, uTextureScale - 1.0);
    if (extraTextureScale > 0.0) {
      float luma = dot(finalColor, vec3(0.2126, 0.7152, 0.0722));
      float saturationBoost = 1.0 + extraTextureScale * 0.8;
      float contrastBoost = 1.0 + extraTextureScale * 0.7;

      finalColor = mix(vec3(luma), finalColor, saturationBoost);
      finalColor = (finalColor - 0.5) * contrastBoost + 0.5;
    }

    if (uEnableIceCaps == 1 && uIceCapCoverage > 0.0) {
      float iceFractures;
      vec2 iceMargin;
      vec4 iceCover = sampleIceCover(spherePos, seed, iceFractures, iceMargin);
      float ridgeHeight = ridgeRiftColorSignals.x * (1.0 - uRidgesRiftsBlend) * uRidgeElevation;
      float coverRetention = 1.0 - exposedRidgeMask(ridgeHeight);
      vec3 iceColor = samplePalette(iceCover.z, uIcePaletteSize, uIcePalette, uIcePalettePositions);
      vec3 snowColor = samplePalette(iceCover.w, uIcePaletteSize, uIcePalette, uIcePalettePositions);
      finalColor = mix(finalColor, snowColor * uIceCapColor, iceCover.y * coverRetention);
      finalColor = mix(finalColor, iceColor * uIceCapColor, iceCover.x * coverRetention);
    }

    if (uDebugMidline == 1) {
      if (debugEquator) {
        finalColor = vec3(1.0, 0.0, 0.0);
      }

      if (debugMeridian0 || debugMeridian180) {
        finalColor = vec3(0.0, 1.0, 0.0);
      }

      if (debugMeridian90 || debugMeridian270) {
        finalColor = vec3(0.0, 0.0, 1.0);
      }
    }

    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
#endif
  }
`
