import {
  ClampToEdgeWrapping,
  LinearFilter,
  MathUtils,
  Mesh,
  NoColorSpace,
  OrthographicCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  Uniform,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  type Texture,
  type WebGLRenderer,
} from 'three'

import type { Palette } from './PlanetoidPalettes'

type NoiseOffset = { x: number; y: number; z: number }

export type GasGiantTextureOptions = {
  surfaceTint?: string
  tintShadowFloor?: number
  textureScale?: number
  bandCount?: number
  bandSharpness?: number
  cloudChaos?: number
  stormCount?: number
  stormScale?: number
  stormPower?: number
  stormStrength?: number
  stormColorStrength?: number
}

const MAX_PALETTE = 16

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragmentShader = `
  precision highp float;

  varying vec2 vUv;

  uniform int uMode;
  uniform vec2 uResolution;
  uniform vec3 uSeed;
  uniform vec3 uTint;
  uniform float uTintShadowFloor;
  uniform float uTextureScale;
  uniform float uBandCount;
  uniform float uBandSharpness;
  uniform float uCloudChaos;
  uniform float uStormCount;
  uniform float uStormScale;
  uniform float uStormPower;
  uniform float uStormStrength;
  uniform float uStormColorStrength;
  uniform int uPaletteSize;
  uniform vec3 uPalette[${MAX_PALETTE}];

  const float PI = 3.141592653589793;
  const float TAU = 6.283185307179586;

  float noise3(vec3 p) {
    return
      sin(p.x * 3.1 + sin(p.y * 4.7)) *
      sin(p.y * 2.7 + sin(p.z * 3.3)) *
      sin(p.z * 4.1 + sin(p.x * 2.9));
  }

  float fractalNoise(vec3 p) {
    float value = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float total = 0.0;

    for (int i = 0; i < 5; i++) {
      value += noise3(p * frequency) * amplitude;
      total += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return value / max(1e-6, total);
  }

  float hash11(float p) {
    return fract(sin(p * 127.1 + 311.7) * 43758.5453123);
  }

  vec3 variableBandGradientInfo(float lat01, vec3 seed) {
    int bandCountInt = int(floor(clamp(uBandCount, 2.0, 28.0) + 0.5));
    float safeLat = clamp(lat01, 0.0, 1.0);
    float widthSum = 0.0;

    for (int i = 0; i < 32; i++) {
      if (i >= bandCountInt) {
        break;
      }

      float widthNoise = hash11(float(i) * 17.0 + seed.x * 0.0011 + seed.y * 0.0017 + seed.z * 0.0009);
      float width = mix(0.35, 1.9, widthNoise);
      widthSum += width;
    }

    float running = 0.0;

    for (int i = 0; i < 32; i++) {
      if (i >= bandCountInt) {
        break;
      }

      float widthNoise = hash11(float(i) * 17.0 + seed.x * 0.0011 + seed.y * 0.0017 + seed.z * 0.0009);
      float width = mix(0.35, 1.9, widthNoise);
      float next = running + width / max(1e-6, widthSum);

      if (safeLat <= next || i == bandCountInt - 1) {
        float local = (safeLat - running) / max(1e-6, next - running);
        float clampedLocal = clamp(local, 0.0, 1.0);
        float gradientT = (float(i) + clampedLocal) / float(max(1, bandCountInt));
        return vec3(gradientT, clampedLocal, float(i));
      }

      running = next;
    }

    return vec3(safeLat, safeLat, float(max(0, bandCountInt - 1)));
  }

  vec4 stormField(vec2 uv, vec3 seed) {
    int stormCountInt = int(floor(clamp(uStormCount, 0.0, 32.0) + 0.5));
    float baseScale = clamp(uStormScale, 0.0, 0.45);
    float falloffPower = max(0.5, uStormPower);
    float strength = clamp(uStormStrength, 0.0, 1.5);

    float lonOffset = 0.0;
    float latOffset = 0.0;
    float activity = 0.0;
    float eyeActivity = 0.0;

    for (int i = 0; i < 32; i++) {
      if (i >= stormCountInt) {
        break;
      }

      float fi = float(i);
      float centerX = hash11(fi * 11.7 + seed.x * 0.0013 + 2.1);
      float centerY = 0.1 + hash11(fi * 19.9 + seed.y * 0.0011 + 5.3) * 0.8;
      float radius = max(0.002, baseScale * mix(0.45, 1.55, hash11(fi * 7.3 + seed.z * 0.0017 + 8.9)));
      float spin = hash11(fi * 23.1 + seed.x * 0.0009 + 3.7) < 0.5 ? -1.0 : 1.0;

      float dx = uv.x - centerX;
      if (dx > 0.5) dx -= 1.0;
      if (dx < -0.5) dx += 1.0;

      float dy = uv.y - centerY;
      vec2 delta = vec2(dx, dy);
      // Keep storm eyes mostly axis-aligned ovals stretched along longitude.
      float aspect = mix(1.35, 2.35, hash11(fi * 5.7 + seed.z * 0.0013 + 9.4));
      vec2 elliptical = vec2(delta.x / (radius * aspect), delta.y / radius);
      float dist = length(elliptical);

      float edgeAngle = atan(elliptical.y, elliptical.x);
      float edgeRipple = sin(edgeAngle * 2.0 + fi * 0.73 + seed.x * 0.0007) * 0.025;
      dist *= 1.0 + edgeRipple;

      if (dist < 1.0) {
        float profile = pow(1.0 - dist, falloffPower);
        float eyeRadius = mix(0.2, 0.34, clamp(baseScale / 0.45, 0.0, 1.0));
        eyeRadius *= mix(1.08, 0.72, clamp((falloffPower - 0.5) / 5.5, 0.0, 1.0));
        float eyeMask = 1.0 - smoothstep(eyeRadius, eyeRadius + 0.16, dist);
        float circulationProfile = profile * (1.0 - eyeMask * 0.85);
        vec2 dir = normalize(delta + vec2(1e-5, 0.0));
        vec2 tangent = vec2(-dir.y, dir.x);

        float swirl = spin * circulationProfile * strength;
        lonOffset += tangent.x * swirl * radius * 1.45;
        latOffset += tangent.y * swirl * radius * 1.1;

        float radial = (0.5 - dist) * circulationProfile * strength;
        lonOffset += dir.x * radial * spin * radius * 0.32;
        latOffset += dir.y * radial * spin * radius * 0.24;

        activity += profile;
        eyeActivity += eyeMask;
      }
    }

    return vec4(lonOffset, latOffset, min(1.5, activity), min(1.5, eyeActivity));
  }

  int safePaletteSize() {
    return max(2, min(uPaletteSize, ${MAX_PALETTE}));
  }

  vec3 paletteColorAt(int index) {
    int size = safePaletteSize();
    int clampedIndex = min(max(index, 0), size - 1);
    vec3 color = uPalette[0];

    for (int i = 0; i < ${MAX_PALETTE}; i++) {
      if (i == clampedIndex) {
        color = uPalette[i];
      }
    }

    return color;
  }

  vec2 cloudBandSignals(vec2 uv, vec3 remappedPos, vec3 seed) {
    float chaosControl = clamp(uCloudChaos, 0.0, 2.0);
    float chaosNorm = chaosControl * 0.5;
    float bandCount = clamp(uBandCount, 2.0, 28.0);
    float lowWarp = fractalNoise(remappedPos * 2.6 + seed * 0.19 + vec3(17.3, 9.7, 33.1));
    float midWarp = fractalNoise(remappedPos * 6.4 + seed * 0.43 + vec3(5.1, 29.3, 11.7));
    float shear = sin((uv.x * TAU * 2.0) + seed.y * 0.0023 + uv.y * PI * 1.7) * mix(0.02, 0.14, chaosNorm);

    float bandAxis = uv.y * bandCount + lowWarp * mix(0.08, 0.48, chaosNorm) + midWarp * mix(0.04, 0.28, chaosNorm) + shear;
    float bandWave = sin((bandAxis + seed.x * 0.00073) * TAU);

    float shapePower = mix(0.72, 3.0, clamp(uBandSharpness, 0.0, 1.0));
    float broadBands = sign(bandWave) * pow(abs(bandWave), shapePower);
    float seamBase = clamp(1.0 - abs(bandWave), 0.0, 1.0);
    float seamExponent = mix(8.5, 2.8, chaosNorm) * mix(0.9, 1.45, clamp(uBandSharpness, 0.0, 1.0));
    float seamMask = pow(seamBase, seamExponent);

    float streamAxis = uv.x * (30.0 + bandCount * 1.6) + lowWarp * 3.7 + midWarp * 2.3;
    float streamBend =
      sin(uv.y * bandCount * PI * 0.85 + seed.z * 0.0021) * mix(0.45, 3.9, chaosNorm);

    float filigreeA = fractalNoise(
      vec3(streamAxis + streamBend, uv.y * (42.0 + bandCount * 1.2), 0.0) +
      seed * 1.71 +
      vec3(31.2, 7.7, 19.8)
    );
    float filigreeB = fractalNoise(
      vec3(streamAxis * 1.74 - streamBend * 0.6, uv.y * (76.0 + bandCount * 2.0), 0.0) +
      seed * 2.09 +
      vec3(11.3, 47.5, 23.6)
    );

    float filigreeRaw = filigreeA * 0.68 + filigreeB * 0.32;
    float filigree = filigreeRaw * seamMask * mix(0.04, 0.95, chaosNorm);
    return vec2(broadBands, filigree);
  }

  vec3 mapToPalette(float t) {
    float safeT = clamp(t, 0.0, 1.0);
    int size = safePaletteSize();
    float position = safeT * float(size - 1);
    int index = int(floor(position));
    index = min(index, size - 2);
    float localT = fract(position);

    vec3 a = paletteColorAt(index);
    vec3 b = paletteColorAt(index + 1);

    return mix(a, b, localT);
  }

  void main() {
    vec2 uv = vUv;
    vec3 seed = uSeed;
    vec4 storm = stormField(uv, seed);
    float stormActivity = storm.z;
    float stormEyeActivity = storm.w;
    vec2 distortedUv = vec2(fract(uv.x + storm.x), clamp(uv.y + storm.y, 0.0, 1.0));

    float theta = distortedUv.x * TAU;
    float phi = distortedUv.y * PI;

    vec3 spherePos = vec3(
      sin(phi) * cos(theta),
      cos(phi),
      sin(phi) * sin(theta)
    );

    float warpX = fractalNoise(spherePos * 7.3 + seed * 0.43 + vec3(13.1, 37.2, 73.8));
    float warpY = fractalNoise(spherePos * 6.7 + seed * 0.57 + vec3(29.4, 11.8, 47.3));
    float warpZ = fractalNoise(spherePos * 8.1 + seed * 0.49 + vec3(41.7, 59.6, 19.5));
    vec3 warpedSpherePos = normalize(spherePos + vec3(warpX, warpY, warpZ) * 0.2);

    vec3 remappedPos = vec3(
      dot(warpedSpherePos, vec3(0.00, 0.83, 0.56)),
      dot(warpedSpherePos, vec3(0.56, 0.00, 0.83)),
      dot(warpedSpherePos, vec3(0.83, 0.56, 0.00))
    );

    vec2 cloudSignals = cloudBandSignals(distortedUv, remappedPos, seed);
    float broadBands = cloudSignals.x;
    float filigree = cloudSignals.y;
    float chaosControl = clamp(uCloudChaos, 0.0, 2.0);
    float chaosNorm = chaosControl * 0.5;

    float latWarpLow = fractalNoise(remappedPos * 2.7 + seed * 0.31 + vec3(7.4, 39.1, 13.7)) * mix(0.01, 0.08, chaosNorm);
    float latWarpHigh = fractalNoise(remappedPos * 9.6 + seed * 0.74 + vec3(29.3, 5.6, 41.2)) * mix(0.0, 0.05, chaosNorm);
    float latBandAxis = clamp(distortedUv.y + latWarpLow + latWarpHigh, 0.0, 1.0);
    vec3 bandInfo = variableBandGradientInfo(latBandAxis, seed);
    float baseBandT = bandInfo.x;
    float bandLocalT = bandInfo.y;
    float bandIndex = bandInfo.z;

    if (uMode == 1) {
      float cloudCell = fractalNoise(remappedPos * 12.0 + seed * 0.91 + vec3(9.3, 17.1, 41.7));
      float cloudPuffs = pow(clamp((cloudCell + 1.0) * 0.5, 0.0, 1.0), 2.2) - 0.35;
      float wispyRelief = filigree * mix(0.02, 0.62, chaosNorm);
      float cloudRelief = broadBands * 0.12 + cloudPuffs * 0.06 + wispyRelief + stormActivity * 0.06;

      float value = clamp(0.5 + cloudRelief, 0.0, 1.0);
      gl_FragColor = vec4(vec3(value), 1.0);
      return;
    }

    float cloudLarge = fractalNoise(remappedPos * 3.8 + seed * 0.51 + vec3(13.4, 7.2, 29.8));
    float cloudMedium = fractalNoise(remappedPos * 9.0 + seed * 0.88 + vec3(43.1, 19.4, 5.7));
    float cloudFine = fractalNoise(remappedPos * 18.0 + seed * 1.42 + vec3(27.7, 61.5, 11.9));

    float cloudValue =
      broadBands * 0.22 +
      cloudLarge * 0.18 +
      cloudMedium * 0.06 +
      cloudFine * 0.015 +
      filigree * mix(0.02, 0.42, chaosNorm);

    cloudValue += stormActivity * mix(0.02, 0.14, clamp(uStormStrength / 1.5, 0.0, 1.0));

    float edgeDistance = min(bandLocalT, 1.0 - bandLocalT);
    float seamRegion = 1.0 - smoothstep(0.06, 0.24, edgeDistance);
    float chaosGrain = fractalNoise(remappedPos * mix(5.5, 24.0, chaosNorm) + seed * 1.61 + vec3(8.7, 41.3, 27.4));
    cloudValue += chaosGrain * seamRegion * mix(0.0, 0.08, chaosNorm);

    float gradientDrift = cloudValue * mix(0.01, 0.08, chaosNorm);
    float paletteT = clamp(baseBandT + gradientDrift, 0.0, 1.0);

    int size = safePaletteSize();
    float stormColorAmount = clamp(uStormColorStrength / 1.5, 0.0, 1.0);
    float stormBandMask = smoothstep(0.02, 0.58, clamp(stormActivity, 0.0, 1.5));
    float stormEyeMask = smoothstep(0.06, 0.9, clamp(stormEyeActivity, 0.0, 1.5));

    float integratedStormMix = stormColorAmount * (stormBandMask * 0.45 + stormEyeMask * 0.7);

    float bandAnchor = clamp(baseBandT, 0.0, 1.0) * float(size - 1);
    int baseBandIndex = int(floor(bandAnchor));
    baseBandIndex = min(baseBandIndex, size - 1);

    int maxJump = max(1, min(4, size - 1));
    int jump = 1 + int(floor(hash11(bandIndex * 41.7 + seed.z * 0.0019 + 2.4) * float(maxJump)));
    int direction = hash11(bandIndex * 53.2 + seed.x * 0.0013 + 7.6) < 0.5 ? -1 : 1;
    int eyeBandIndex = (baseBandIndex + direction * jump + size * 3) % size;
    int eyeNeighborIndex = (eyeBandIndex + direction + size) % size;

    float eyeBandT = float(eyeBandIndex) / float(max(1, size - 1));
    float stormTurbulence = fractalNoise(remappedPos * 16.0 + seed * 1.33 + vec3(19.2, 4.8, 37.6)) * 0.03;
    float integratedPaletteT = clamp(mix(paletteT, eyeBandT + stormTurbulence, integratedStormMix), 0.0, 1.0);

    int idxA = int(floor(hash11(bandIndex * 13.1 + seed.x * 0.0013 + 1.7) * float(size)));
    int idxB = int(floor(hash11(bandIndex * 17.3 + seed.y * 0.0017 + 9.1) * float(size)));
    if (idxA == idxB) {
      idxB = (idxB + 1) % size;
    }

    vec3 baseGradientColor = mapToPalette(integratedPaletteT);
    vec3 bandA = paletteColorAt(idxA);
    vec3 bandB = paletteColorAt(idxB);

    float differentialNoise = hash11(bandIndex * 23.7 + seed.z * 0.0011 + 4.3);
    float differentialStrength = mix(0.07, 0.28, differentialNoise);
    float darkFactor = 1.0 - differentialStrength;
    float lightFactor = 1.0 + differentialStrength * 0.72;

    vec3 bandAExtended = clamp(bandA * darkFactor, 0.0, 1.0);
    vec3 bandBExtended = clamp(bandB * lightFactor, 0.0, 1.0);

    float bandMix = bandLocalT * bandLocalT * (3.0 - 2.0 * bandLocalT);
    vec3 pseudoRandomBandGradient = mix(bandAExtended, bandBExtended, bandMix);

    float edgeSoftness = mix(0.22, 0.08, clamp(uBandSharpness, 0.0, 1.0));
    float edgeFeather = smoothstep(0.0, edgeSoftness, edgeDistance);
    vec3 softenedBandGradient = mix(baseGradientColor, pseudoRandomBandGradient, edgeFeather);

    float bandInfluence = mix(0.52, 0.7, chaosNorm);
    vec3 paletteColor = mix(baseGradientColor, softenedBandGradient, bandInfluence);

    float seamLift = clamp(abs(filigree) * mix(0.05, 1.2, chaosNorm), 0.0, 0.75);
    float puffNoise = fractalNoise(remappedPos * 22.0 + seed * 1.07 + vec3(17.8, 53.4, 9.2));
    float puffMask = pow(clamp((puffNoise + 1.0) * 0.5, 0.0, 1.0), 2.6);
    float puffLift = puffMask * 0.1;

    paletteColor = mix(paletteColor, vec3(1.0), seamLift + puffLift);

    vec3 eyePrimary = paletteColorAt(eyeBandIndex);
    vec3 eyeSecondary = paletteColorAt(eyeNeighborIndex);
    vec3 stormEyeColor = mix(eyePrimary, eyeSecondary, clamp(bandLocalT + 0.18, 0.0, 1.0));

    float eyeColorMix = stormEyeMask * stormColorAmount * 0.52;
    float outerColorMix = max(0.0, stormBandMask - stormEyeMask * 0.62) * stormColorAmount * 0.28;

    vec3 eyeCarrier = mix(baseGradientColor, stormEyeColor, 0.55);
    paletteColor = mix(paletteColor, eyeCarrier, eyeColorMix);
    paletteColor = mix(paletteColor, mix(baseGradientColor, eyeCarrier, 0.35), outerColorMix);
    paletteColor = clamp(paletteColor, 0.0, 1.0);

    float normalizedValue = clamp(integratedPaletteT + cloudValue * 0.08, 0.0, 1.0);
    float textureDominance = clamp(uTextureScale, 0.0, 1.0);

    vec3 tintColor = clamp(uTint, 0.0, 1.0);
    vec3 darkTint = tintColor * clamp(uTintShadowFloor, 0.0, 1.0);
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

    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
  }
`

const scene = new Scene()
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
const material = new ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uMode: new Uniform(0),
    uResolution: new Uniform(new Vector2(512, 256)),
    uSeed: new Uniform(new Vector3()),
    uTint: new Uniform(new Vector3(1, 1, 1)),
    uTintShadowFloor: new Uniform(0.22),
    uTextureScale: new Uniform(1),
    uBandCount: new Uniform(10),
    uBandSharpness: new Uniform(0.5),
    uCloudChaos: new Uniform(0.65),
    uStormCount: new Uniform(8),
    uStormScale: new Uniform(0.18),
    uStormPower: new Uniform(2.2),
    uStormStrength: new Uniform(0.45),
    uStormColorStrength: new Uniform(0.4),
    uPaletteSize: new Uniform(2),
    uPalette: new Uniform(Array.from({ length: MAX_PALETTE }, () => new Vector3())),
  },
})
const quad = new Mesh(new PlaneGeometry(2, 2), material)
quad.frustumCulled = false
scene.add(quad)

function toFiniteNumber(value: number | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function toClampedNumber(value: number | undefined, fallback: number, min: number, max: number) {
  const finite = toFiniteNumber(value, fallback)
  return MathUtils.clamp(finite, min, max)
}

function srgbChannelToLinear(value: number) {
  if (value <= 0.04045) {
    return value / 12.92
  }

  return ((value + 0.055) / 1.055) ** 2.4
}

function srgbToLinearVector(r: number, g: number, b: number) {
  return new Vector3(srgbChannelToLinear(r), srgbChannelToLinear(g), srgbChannelToLinear(b))
}

function parseHexTint(value: string | undefined) {
  const fallback = new Vector3(1, 1, 1)
  if (!value) return fallback

  const normalized = value.trim().toLowerCase()
  const fullHex = /^#[0-9a-f]{6}$/.test(normalized)
    ? normalized
    : /^#[0-9a-f]{3}$/.test(normalized)
      ? `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`
      : ''

  if (!fullHex) return fallback

  const r = Number.parseInt(fullHex.slice(1, 3), 16) / 255
  const g = Number.parseInt(fullHex.slice(3, 5), 16) / 255
  const b = Number.parseInt(fullHex.slice(5, 7), 16) / 255

  return srgbToLinearVector(r, g, b)
}

function setPaletteUniform(palette: Palette) {
  const paletteVectors = material.uniforms.uPalette.value as Vector3[]

  for (let i = 0; i < MAX_PALETTE; i++) {
    const source = palette[Math.min(i, Math.max(0, palette.length - 1))] ?? {
      r: 255,
      g: 255,
      b: 255,
    }

    const linear = srgbToLinearVector(source.r / 255, source.g / 255, source.b / 255)
    paletteVectors[i].copy(linear)
  }

  material.uniforms.uPaletteSize.value = Math.max(2, Math.min(MAX_PALETTE, palette.length))
}

function renderTexture(
  renderer: WebGLRenderer,
  mode: 0 | 1,
  width: number,
  height: number,
  noiseOffset: NoiseOffset,
  palette: Palette,
  options: GasGiantTextureOptions = {}
) {
  material.uniforms.uMode.value = mode
  material.uniforms.uResolution.value.set(width, height)
  material.uniforms.uSeed.value.set(noiseOffset.x, noiseOffset.y, noiseOffset.z)
  material.uniforms.uTint.value.copy(parseHexTint(options.surfaceTint))
  material.uniforms.uTintShadowFloor.value = toClampedNumber(options.tintShadowFloor, 0.22, 0, 0.9)
  material.uniforms.uTextureScale.value = toFiniteNumber(options.textureScale, 1)
  material.uniforms.uBandCount.value = toClampedNumber(options.bandCount, 10, 2, 28)
  material.uniforms.uBandSharpness.value = toClampedNumber(options.bandSharpness, 0.5, 0, 1)
  material.uniforms.uCloudChaos.value = toClampedNumber(options.cloudChaos, 0.65, 0, 2)
  material.uniforms.uStormCount.value = toClampedNumber(options.stormCount, 8, 0, 32)
  material.uniforms.uStormScale.value = toClampedNumber(options.stormScale, 0.18, 0, 0.45)
  material.uniforms.uStormPower.value = toClampedNumber(options.stormPower, 2.2, 0.5, 6)
  material.uniforms.uStormStrength.value = toClampedNumber(options.stormStrength, 0.45, 0, 1.5)
  material.uniforms.uStormColorStrength.value = toClampedNumber(
    options.stormColorStrength,
    0.4,
    0,
    1.5
  )
  setPaletteUniform(palette)

  const renderTarget = new WebGLRenderTarget(width, height, {
    depthBuffer: false,
    stencilBuffer: false,
  })

  renderTarget.texture.wrapS = RepeatWrapping
  renderTarget.texture.wrapT = ClampToEdgeWrapping
  renderTarget.texture.minFilter = LinearFilter
  renderTarget.texture.magFilter = LinearFilter
  renderTarget.texture.generateMipmaps = false

  const previousTarget = renderer.getRenderTarget()
  const previousViewport = renderer.getViewport(new Vector4())
  const previousScissor = renderer.getScissor(new Vector4())
  const previousScissorTest = renderer.getScissorTest()

  renderer.setRenderTarget(renderTarget)
  renderer.setViewport(0, 0, width, height)
  renderer.setScissor(0, 0, width, height)
  renderer.setScissorTest(false)
  renderer.clear()
  renderer.render(scene, camera)
  renderer.setRenderTarget(previousTarget)
  renderer.setViewport(previousViewport)
  renderer.setScissor(previousScissor)
  renderer.setScissorTest(previousScissorTest)

  const texture = renderTarget.texture
  texture.needsUpdate = true
  texture.userData.renderTarget = renderTarget

  return texture
}

export function disposeGeneratedTexture(texture: Texture) {
  const renderTarget = texture.userData.renderTarget as WebGLRenderTarget | undefined
  if (renderTarget) {
    renderTarget.dispose()
    return
  }

  texture.dispose()
}

export function createGasGiantColourTexture(
  renderer: WebGLRenderer,
  noiseOffset: NoiseOffset,
  palette: Palette,
  textureHeight: number,
  options: GasGiantTextureOptions = {}
) {
  const height = Math.max(2, Math.floor(textureHeight))
  const width = height * 2

  const texture = renderTexture(renderer, 0, width, height, noiseOffset, palette, options)
  texture.anisotropy = 8
  texture.colorSpace = NoColorSpace

  return texture
}

export function createGasGiantBumpTexture(
  renderer: WebGLRenderer,
  noiseOffset: NoiseOffset,
  palette: Palette,
  textureHeight: number,
  options: GasGiantTextureOptions = {}
) {
  const height = Math.max(2, Math.floor(textureHeight))
  const width = height * 2

  const texture = renderTexture(renderer, 1, width, height, noiseOffset, palette, options)
  texture.anisotropy = 8

  return texture
}
