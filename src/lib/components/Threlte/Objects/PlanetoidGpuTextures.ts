import {
  ClampToEdgeWrapping,
  LinearFilter,
  LinearMipmapLinearFilter,
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
  WebGLRenderTarget,
  type Texture,
  type WebGLRenderer,
} from 'three'

type NoiseOffset = { x: number; y: number; z: number }
type PaletteColor = { r: number; g: number; b: number }

type BumpTextureOptions = {
  enableCraters?: boolean
  craterCount?: number
  craterStrength?: number
  enableVolcanoes?: boolean
  volcanoCount?: number
  volcanoScale?: number
  volcanoStrength?: number
  swirliness?: number
  enableRidges?: boolean
  enableRifts?: boolean
  ridgeStrength?: number
  ridgeScale?: number
  ridgeSharpness?: number
  riftStrength?: number
  riftScale?: number
  riftWidth?: number
  riftSharpness?: number
  ridgesRiftsBlend?: number
  debugMidline?: boolean
}

type ColourTextureOptions = {
  surfaceTint?: string
  tintShadowFloor?: number
  swirliness?: number
  ridgeColorWeight?: number
  riftColorWeight?: number
  enableRidges?: boolean
  enableRifts?: boolean
  ridgeStrength?: number
  ridgeScale?: number
  ridgeSharpness?: number
  riftStrength?: number
  riftScale?: number
  riftWidth?: number
  riftSharpness?: number
  ridgesRiftsBlend?: number
  debugMidline?: boolean
  enableCraters?: boolean
  craterCount?: number
  craterColorStrength?: number
  enableVolcanoes?: boolean
  volcanoCount?: number
  volcanoScale?: number
  volcanoStrength?: number
  volcanoColorStrength?: number
  craterRayStrength?: number
  craterRayVisibility?: number
  craterRayDensity?: number
  craterRaySharpness?: number
  craterRayLengthPower?: number
}

type RayDebugOptions = Pick<
  ColourTextureOptions,
  'craterRayDensity' | 'craterRaySharpness' | 'craterRayLengthPower'
>

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
  uniform float uSwirliness;
  uniform float uTextureScale;
  uniform int uEnableCraters;
  uniform int uCraterCount;
  uniform float uCraterStrength;
  uniform float uCraterColorStrength;
  uniform int uEnableVolcanoes;
  uniform int uVolcanoCount;
  uniform float uVolcanoScale;
  uniform float uVolcanoStrength;
  uniform float uVolcanoColorStrength;
  uniform float uRidgeColorWeight;
  uniform float uRiftColorWeight;
  uniform float uCraterRayStrength;
  uniform float uCraterRayVisibility;
  uniform float uCraterRayDensity;
  uniform float uCraterRaySharpness;
  uniform float uCraterRayLengthPower;
  uniform int uEnableRidges;
  uniform int uEnableRifts;
  uniform float uRidgeStrength;
  uniform float uRidgeScale;
  uniform float uRidgeSharpness;
  uniform float uRiftStrength;
  uniform float uRiftScale;
  uniform float uRiftWidth;
  uniform float uRiftSharpness;
  uniform float uRidgesRiftsBlend;
  uniform int uDebugMidline;
  uniform int uPaletteSize;
  uniform vec3 uPalette[${MAX_PALETTE}];

  const int MAX_CRATERS = 96;
  const int MAX_VOLCANOES = 80;
  const float PI = 3.141592653589793;
  const float TAU = 6.283185307179586;

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

  vec2 ridgeRiftSignals(vec3 p, vec3 seed) {
    float ridgeScale = max(0.1, uRidgeScale);
    float riftScale = max(0.1, uRiftScale);

    float ridgeNoise = fractalNoise(p * ridgeScale + seed * 0.91 + vec3(17.7, 53.2, 91.4));
    float ridgeRaw = 1.0 - abs(ridgeNoise);
    // Higher ridge sharpness should produce narrower, crisper ridge crests.
    float ridgeSharp = pow(
      clamp(ridgeRaw, 0.0, 1.0),
      mix(0.6, 4.2, clamp((uRidgeSharpness - 0.5) / 3.5, 0.0, 1.0))
    );
    float ridgeHeight = ridgeSharp * uRidgeStrength;

    float riftNoise = fractalNoise(p * riftScale + seed * 1.17 + vec3(61.3, 13.9, 37.5));
    float riftCrossing = abs(riftNoise);
    float riftWidth = max(0.003, uRiftWidth * 0.6);
    float riftCore = 1.0 - smoothstep(0.0, riftWidth, riftCrossing);
    float riftSecondary = fractalNoise(p * (riftScale * 2.35) + seed * 1.41 + vec3(23.1, 79.7, 45.2));
    float riftIrregularity = mix(0.75, 1.25, clamp((riftSecondary + 1.0) * 0.5, 0.0, 1.0));
    float riftSharp = pow(clamp(riftCore * riftIrregularity, 0.0, 1.0), uRiftSharpness * 1.2);
    float riftDepth = riftSharp * uRiftStrength;

    return vec2(ridgeHeight, riftDepth);
  }

  float ridgeRiftHeight(vec3 p, vec3 seed) {
    vec2 signals = ridgeRiftSignals(p, seed);
    float ridgeHeight = signals.x;
    float riftDepth = signals.y;

    float blend = clamp(uRidgesRiftsBlend, 0.0, 1.0);
    float ridgeTerm = ridgeHeight * (1.0 - blend);
    float riftTerm = -riftDepth * blend;

    return ridgeTerm + riftTerm;
  }

  vec3 mapToPalette(float value) {
    float t = clamp((value + 1.0) * 0.5, 0.0, 1.0);
    int safePaletteSize = max(2, min(uPaletteSize, ${MAX_PALETTE}));
    float position = t * float(safePaletteSize - 1);
    int index = int(floor(position));
    index = min(index, safePaletteSize - 2);
    float localT = fract(position);

    vec3 a = uPalette[0];
    vec3 b = uPalette[1];

    for (int i = 0; i < ${MAX_PALETTE} - 1; i++) {
      if (i == index) {
        a = uPalette[i];
        b = uPalette[i + 1];
      }
    }

    return mix(a, b, localT);
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

  void buildCrater(int i, out vec2 centerUv, out float radius) {
    float fi = float(i);

    float u = hash12(vec2(fi * 1.17, uSeed.x * 0.001 + 11.0));
    float v = 0.2 + hash12(vec2(fi * 2.31, uSeed.y * 0.001 + 23.0)) * 0.6;
    float radiusSample = hash12(vec2(fi * 3.57, uSeed.z * 0.001 + 37.0));

    float minRadius = 0.018;
    float maxRadius = 0.078;
    float largeCount = max(1.0, floor(float(uCraterCount) * 0.15 + 0.5));

    float normalizedRadius;
    if (fi < largeCount) {
      normalizedRadius = 1.0 - pow(radiusSample, 2.4);
    } else {
      normalizedRadius = pow(radiusSample, 3.2);
    }

    centerUv = vec2(u, v);
    radius = mix(minRadius, maxRadius, normalizedRadius);
  }

  float craterNormalizedDistance(vec2 uv, vec2 craterUv, float craterRadius) {
    float duRaw = abs(uv.x - craterUv.x);
    float du = min(duRaw, 1.0 - duRaw);
    float dv = abs(uv.y - craterUv.y);

    float rx = max(1e-5, craterRadius * 0.5);
    float ry = max(1e-5, craterRadius);

    return length(vec2(du / rx, dv / ry));
  }

  float craterShape(float t) {
    if (t >= 1.25) return 0.0;

    float bowl = -pow(clamp(1.0 - t / 0.82, 0.0, 1.0), 1.35);
    float wall = -exp(-pow((t - 0.78) / 0.14, 2.0)) * 0.22;
    float rim = exp(-pow((t - 1.02) / 0.08, 2.0)) * 0.2;

    return bowl + wall + rim;
  }

  float accumulateCraterHeight(vec2 uv) {
    float craterHeight = 0.0;

    for (int i = 0; i < MAX_CRATERS; i++) {
      if (i >= uCraterCount) break;

      vec2 craterUv;
      float craterRadius;
      buildCrater(i, craterUv, craterRadius);

      float t = craterNormalizedDistance(uv, craterUv, craterRadius);
      craterHeight += craterShape(t);
    }

    return clamp(craterHeight, -1.25, 0.35);
  }

  float accumulateCraterColorWarp(vec2 uv) {
    float craterWarp = 0.0;

    for (int i = 0; i < MAX_CRATERS; i++) {
      if (i >= uCraterCount) break;

      vec2 craterUv;
      float craterRadius;
      buildCrater(i, craterUv, craterRadius);

      float t = craterNormalizedDistance(uv, craterUv, craterRadius);
      if (t >= 1.35) continue;

      float bowlDarken = -pow(clamp(1.0 - t / 0.82, 0.0, 1.0), 1.15) * 0.42;
      float rimLighten = exp(-pow((t - 1.02) / 0.1, 2.0)) * 0.2;
      float ejectaLighten = exp(-pow((t - 1.2) / 0.16, 2.0)) * 0.1;

      craterWarp += bowlDarken + rimLighten + ejectaLighten;
    }

    return clamp(craterWarp, -1.0, 0.8);
  }

  void buildVolcano(int i, out vec2 centerUv, out float radius) {
    float fi = float(i);

    float u = hash12(vec2(fi * 4.17, uSeed.x * 0.001 + 51.0));
    float v = 0.16 + hash12(vec2(fi * 5.31, uSeed.y * 0.001 + 63.0)) * 0.68;
    float radiusSample = hash12(vec2(fi * 6.57, uSeed.z * 0.001 + 77.0));

    float minRadius = 0.012;
    float maxRadius = 0.048;
    float scale = clamp(uVolcanoScale, 0.35, 2.5);
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

  float accumulateVolcanoHeight(vec2 uv) {
    float height = 0.0;

    for (int i = 0; i < MAX_VOLCANOES; i++) {
      if (i >= uVolcanoCount) break;

      vec2 volcanoUv;
      float volcanoRadius;
      buildVolcano(i, volcanoUv, volcanoRadius);

      float t = volcanoNormalizedDistance(uv, volcanoUv, volcanoRadius);
      if (t > 1.45) continue;

      float cone = exp(-pow(t / 0.7, 2.1)) * 0.95;
      float shoulder = exp(-pow((t - 0.95) / 0.28, 2.0)) * 0.18;
      float caldera = exp(-pow(t / 0.22, 2.0)) * 0.88;

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
      float spokeCount = mix(9.0, 20.0, size01);
      float warpA = (hash12(vec2(volcanoUv.x * 33.7, volcanoUv.y * 29.1)) - 0.5) * 0.8;
      float warpB = (hash12(vec2(volcanoUv.x * 47.2, volcanoUv.y * 41.5)) - 0.5) * 0.45;
      float angleWarp =
        angle +
        sin(angle * 2.0 + phase * 1.4) * warpA * 0.28 +
        sin(angle * 5.0 + phase * 0.6) * warpB * 0.2;
      float rayAxis = ((angleWarp + PI) / TAU) * spokeCount + phase / TAU;
      float raySlot = floor(rayAxis + 0.5);
      float slotJitter =
        (hash12(vec2(volcanoUv.x * 71.9 + raySlot * 0.19, volcanoUv.y * 67.3 - raySlot * 0.23)) - 0.5)
        * 0.8;
      float nearest = abs(fract(rayAxis - slotJitter) - 0.5);
      nearest = 0.5 - nearest;
      float widthNoise = hash12(vec2(volcanoUv.x * 17.1 - raySlot * 0.31, volcanoUv.y * 21.7 + raySlot * 0.27));
      float angularWidth = mix(0.08, 0.14, widthNoise);
      float angularMask = pow(max(0.0, 1.0 - nearest / max(1e-4, angularWidth)), 2.1);
      float radialBand = smoothstep(0.3, 0.46, t) * (1.0 - smoothstep(0.78, 0.95, t));
      float radialDecay = pow(clamp(1.0 - t / 0.95, 0.0, 1.0), 1.15);
      float radialCrackDepth = angularMask * radialBand * radialDecay * 0.11;
      float radialCrackRelief = angularMask * radialBand * radialDecay * 0.045;

      float crackField = fractalNoise(
        vec3(uv * 96.0, 0.0) + uSeed * 1.37 + vec3(19.7, 71.3, 43.1)
      );
      float crackMask = pow(clamp(1.0 - abs(crackField), 0.0, 1.0), 8.0);
      float crackDepth = crackMask * exp(-pow(t / 0.95, 2.0)) * 0.34;

      float microReliefField = fractalNoise(
        vec3(uv * 168.0, 0.0) + uSeed * 1.93 + vec3(7.1, 83.6, 59.4)
      );
      float microRelief = microReliefField * exp(-pow(t / 1.1, 2.0)) * 0.2;

      float rimBand = exp(-pow((t - 0.78) / 0.12, 2.0));
      float rimFractureField = fractalNoise(
        vec3(uv * 212.0, 0.0) + uSeed * 2.11 + vec3(97.2, 11.5, 31.8)
      );
      float rimFracture = (abs(rimFractureField) * 2.0 - 1.0) * rimBand * 0.18;

      height +=
        (
          cone +
          shoulder -
          caldera -
          crackDepth -
          radialCrackDepth +
          radialCrackRelief +
          microRelief +
          rimFracture
        )
        * uVolcanoStrength;
    }

    return clamp(height, -1.0, 1.8);
  }

  vec2 accumulateVolcanoColorSignals(vec2 uv) {
    float lift = 0.0;
    float darken = 0.0;

    for (int i = 0; i < MAX_VOLCANOES; i++) {
      if (i >= uVolcanoCount) break;

      vec2 volcanoUv;
      float volcanoRadius;
      buildVolcano(i, volcanoUv, volcanoRadius);

      float t = volcanoNormalizedDistance(uv, volcanoUv, volcanoRadius);
      if (t > 1.5) continue;

      float coneLighten = exp(-pow(t / 0.72, 2.0)) * 0.32;
      float craterDarken = exp(-pow(t / 0.24, 2.0)) * 0.5;
      float ringLighten = exp(-pow((t - 0.9) / 0.2, 2.0)) * 0.18;

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
      float spokeCount = mix(9.0, 20.0, size01);
      float warpA = (hash12(vec2(volcanoUv.x * 33.7, volcanoUv.y * 29.1)) - 0.5) * 0.8;
      float warpB = (hash12(vec2(volcanoUv.x * 47.2, volcanoUv.y * 41.5)) - 0.5) * 0.45;
      float angleWarp =
        angle +
        sin(angle * 2.0 + phase * 1.4) * warpA * 0.28 +
        sin(angle * 5.0 + phase * 0.6) * warpB * 0.2;
      float rayAxis = ((angleWarp + PI) / TAU) * spokeCount + phase / TAU;
      float raySlot = floor(rayAxis + 0.5);
      float slotJitter =
        (hash12(vec2(volcanoUv.x * 71.9 + raySlot * 0.19, volcanoUv.y * 67.3 - raySlot * 0.23)) - 0.5)
        * 0.8;
      float nearest = abs(fract(rayAxis - slotJitter) - 0.5);
      nearest = 0.5 - nearest;
      float widthNoise = hash12(vec2(volcanoUv.x * 17.1 - raySlot * 0.31, volcanoUv.y * 21.7 + raySlot * 0.27));
      float angularWidth = mix(0.08, 0.14, widthNoise);
      float angularMask = pow(max(0.0, 1.0 - nearest / max(1e-4, angularWidth)), 2.0);
      float radialBand = smoothstep(0.32, 0.48, t) * (1.0 - smoothstep(0.78, 0.94, t));
      float radialCrackDarken = angularMask * radialBand * 0.08;

      float detailField = fractalNoise(
        vec3(uv * 110.0, 0.0) + uSeed * 1.61 + vec3(41.9, 23.7, 67.4)
      );
      float detailMask = clamp(0.72 + detailField * 0.35, 0.35, 1.1);

      // Use strongest local volcano influence instead of additive stacking
      // so overlapping volcanoes do not over-saturate color.
      lift = max(lift, clamp((coneLighten + ringLighten) * detailMask, 0.0, 1.0));
      darken = max(darken, clamp((craterDarken + radialCrackDarken) * detailMask, 0.0, 1.0));
    }

    return vec2(lift, darken) * uVolcanoColorStrength;
  }

  float accumulateCraterRayMask(vec2 uv) {
    float rayMask = 0.0;

    for (int i = 0; i < MAX_CRATERS; i++) {
      if (i >= uCraterCount) break;

      vec2 craterUv;
      float craterRadius;
      buildCrater(i, craterUv, craterRadius);

      float du = uv.x - craterUv.x;
      if (du > 0.5) du -= 1.0;
      if (du < -0.5) du += 1.0;

      float dv = uv.y - craterUv.y;
      float rx = max(1e-5, craterRadius * 0.5);
      float ry = max(1e-5, craterRadius);

      vec2 local = vec2(du / rx, dv / ry);
      float t = length(local);

      float inner = 0.94;
      float outer = 3.45;
      if (t < inner || t > outer) continue;

      float angle = atan(local.y, local.x);
      float size01 = clamp((craterRadius - 0.018) / 0.06, 0.0, 1.0);

      float sizeForCount = pow(size01, 1.15);
      float baseRayCount = mix(1.0, 30.0, sizeForCount);
      float rayCount = clamp(baseRayCount * uCraterRayDensity, 1.0, 60.0);

      float phase = hash12(vec2(craterUv.x * 3.17, craterUv.y * 5.71)) * TAU;

      // Break regular spoke spacing with deterministic angular warping per crater.
      float warpA = (hash12(vec2(craterUv.x * 41.3, craterUv.y * 47.9)) - 0.5) * 0.9;
      float warpB = (hash12(vec2(craterUv.x * 53.7, craterUv.y * 59.1)) - 0.5) * 0.5;
      float angleWarp = angle
        + sin(angle * 3.0 + phase * 1.7) * warpA * 0.35
        + sin(angle * 7.0 + phase * 0.9) * warpB * 0.2;

      float rayAxis = ((angleWarp + PI) / TAU) * rayCount + phase / TAU;
      float raySlot = floor(rayAxis + 0.5);

      // Jitter each ray center independently so spacing is irregular.
      float slotJitter =
        (hash12(vec2(craterUv.x * 71.1 + raySlot * 0.13, craterUv.y * 67.7 - raySlot * 0.17)) - 0.5)
        * 0.7;
      float nearest = abs(fract(rayAxis - slotJitter) - 0.5);
      nearest = 0.5 - nearest;

      float widthNoise = hash12(vec2(craterUv.x * 7.9 - raySlot * 0.53, craterUv.y * 17.2 + raySlot * 0.41));
      float widthScale = 1.0 / sqrt(max(0.2, uCraterRaySharpness));
      float angularWidth = mix(0.2, 0.08, size01) * mix(0.7, 1.4, widthNoise) * widthScale;
      float angularMask = pow(
        max(0.0, 1.0 - nearest / max(1e-4, angularWidth)),
        1.2 + uCraterRaySharpness * 0.9
      );

      float lengthNoise = hash12(vec2(craterUv.x * 19.1 + raySlot * 0.83, craterUv.y * 23.4 - raySlot * 0.27));
      float impactNoise = hash12(vec2(craterUv.x * 29.3 - raySlot * 0.61, craterUv.y * 31.8 + raySlot * 0.19));

      float lengthScale = mix(1.2, 0.72, size01);
      float normalizedLength = pow(lengthNoise, uCraterRayLengthPower);
      float rayLength = mix(0.75, 2.45, normalizedLength) * lengthScale;

      float rayStart = 0.98;
      float rayEnd = rayStart + rayLength;

      float entry = smoothstep(rayStart, rayStart + 0.14, t);
      float exitMask = 1.0 - smoothstep(rayEnd, rayEnd + 0.28, t);
      float taper = clamp(1.0 - (t - rayStart) / max(1e-4, rayEnd - rayStart), 0.0, 1.0);
      float radialMask = entry * exitMask * pow(taper, 0.65);

      float rayImpact = mix(0.4, 1.0, impactNoise);
      float spokeContribution = angularMask * radialMask * rayImpact;

      float haze = clamp(1.0 - (t - 1.0) / 2.2, 0.0, 1.0) * 0.018;
      float craterRayBase = mix(0.04, 0.82, pow(size01, 1.35));
      float contribution = (spokeContribution + haze) * craterRayBase;

      // Later craters obscure rays from earlier ones.
      float occlusion = 1.0;
      for (int j = 0; j < MAX_CRATERS; j++) {
        if (j <= i || j >= uCraterCount) continue;

        vec2 laterUv;
        float laterRadius;
        buildCrater(j, laterUv, laterRadius);

        float tLater = craterNormalizedDistance(uv, laterUv, laterRadius);

        // Strong suppression in crater bowl and rim regions.
        float bowl = 1.0 - smoothstep(0.0, 0.95, tLater);
        float rim = exp(-pow((tLater - 1.02) / 0.12, 2.0));
        float cover = clamp(bowl * 0.95 + rim * 0.7, 0.0, 1.0);

        occlusion *= (1.0 - cover);
        if (occlusion <= 0.01) {
          occlusion = 0.0;
          break;
        }
      }

      contribution *= occlusion;

      if (isnan(contribution) || contribution <= 0.0) {
        contribution = 0.0;
      }

      rayMask += contribution;
    }

    if (isnan(rayMask) || rayMask <= 0.0) return 0.0;
    return clamp(rayMask, 0.0, 1.0);
  }

  vec2 wrapRayUv(vec2 uv) {
    return vec2(fract(uv.x), clamp(uv.y, 0.0, 1.0));
  }

  float accumulateCraterRayMaskAA(vec2 uv) {
    vec2 texel = 1.0 / max(uResolution, vec2(1.0));
    vec2 offset = texel * 0.4;

    float s0 = accumulateCraterRayMask(wrapRayUv(uv + vec2(-offset.x, -offset.y)));
    float s1 = accumulateCraterRayMask(wrapRayUv(uv + vec2(offset.x, -offset.y)));
    float s2 = accumulateCraterRayMask(wrapRayUv(uv + vec2(-offset.x, offset.y)));
    float s3 = accumulateCraterRayMask(wrapRayUv(uv + vec2(offset.x, offset.y)));

    return 0.25 * (s0 + s1 + s2 + s3);
  }

  bool isDebugEquatorPixel(float y) {
    float equatorY = round((uResolution.y - 1.0) * 0.5);
    return abs(y - equatorY) < 0.5;
  }

  bool isDebugMeridianPixel(float x, float meridianU) {
    float meridianX = round((uResolution.x - 1.0) * meridianU);
    return abs(x - meridianX) < 0.5;
  }

  void main() {
    vec2 uv = vUv;
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

    // Shared warped domain keeps micro-structure consistent between bump and color paths.
    float warpX = fractalNoise(spherePos * 7.3 + seed * 0.43 + vec3(13.1, 37.2, 73.8));
    float warpY = fractalNoise(spherePos * 6.7 + seed * 0.57 + vec3(29.4, 11.8, 47.3));
    float warpZ = fractalNoise(spherePos * 8.1 + seed * 0.49 + vec3(41.7, 59.6, 19.5));
    float swirlStrength = 0.22 * clamp(uSwirliness, 0.0, 2.0);
    vec3 warpedSpherePos = normalize(spherePos + vec3(warpX, warpY, warpZ) * swirlStrength);

    vec3 remappedPos = vec3(
      dot(warpedSpherePos, vec3(0.00, 0.83, 0.56)),
      dot(warpedSpherePos, vec3(0.56, 0.00, 0.83)),
      dot(warpedSpherePos, vec3(0.83, 0.56, 0.00))
    );

    float craterHeight = (uEnableCraters == 1) ? accumulateCraterHeight(uv) : 0.0;
    float craterColorWarp = (uEnableCraters == 1) ? accumulateCraterColorWarp(uv) : 0.0;
    float volcanoHeight = (uEnableVolcanoes == 1) ? accumulateVolcanoHeight(uv) : 0.0;
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
    float craterRayMask = (uEnableCraters == 1) ? accumulateCraterRayMaskAA(uv) : 0.0;

    bool debugEquator = (uDebugMidline == 1) && isDebugEquatorPixel(y);
    bool debugMeridian0 = (uDebugMidline == 1) && (x < 0.5 || x > (uResolution.x - 1.5));
    bool debugMeridian90 = (uDebugMidline == 1) && isDebugMeridianPixel(x, 0.25);
    bool debugMeridian180 = (uDebugMidline == 1) && isDebugMeridianPixel(x, 0.5);
    bool debugMeridian270 = (uDebugMidline == 1) && isDebugMeridianPixel(x, 0.75);

    if (uMode == 1) {
      float bumpBase = fractalNoise(remappedPos * 8.7 + seed * 1.03 + vec3(1.1, 2.3, 3.7));
      float bumpDust = fractalNoise(remappedPos * 93.0 + seed * 1.79 + vec3(11.3, 17.9, 23.1));
      float bumpGrain = fractalNoise(remappedPos * 187.0 + seed * 2.41 + vec3(29.3, 31.7, 37.1));
      float ridgeRift = 0.0;
      if (uEnableRidges == 1 || uEnableRifts == 1) {
        vec2 ridgeRiftSignalsLocal = ridgeRiftSignals(remappedPos, seed);
        float blend = clamp(uRidgesRiftsBlend, 0.0, 1.0);
        float ridgeTerm = (uEnableRidges == 1) ? ridgeRiftSignalsLocal.x * (1.0 - blend) : 0.0;
        float riftTerm = (uEnableRifts == 1) ? -ridgeRiftSignalsLocal.y * blend : 0.0;
        ridgeRift = ridgeTerm + riftTerm;
      }

      float polarHighFrequencyScale = mix(0.15, 1.0, equatorFactor);

      float brightSpeckles = pow(clamp((bumpDust + 1.0) * 0.5, 0.0, 1.0), 9.0);
      float darkSpeckles = pow(clamp((-bumpDust + 1.0) * 0.5, 0.0, 1.0), 10.0);

      float debugGuideRaise = (debugEquator || debugMeridian0 || debugMeridian90 || debugMeridian180 || debugMeridian270)
        ? 0.65
        : 0.0;

      float combined =
        bumpBase * 0.55 +
        bumpDust * 0.2 * polarHighFrequencyScale +
        bumpGrain * 0.1 * polarHighFrequencyScale +
        craterHeight * uCraterStrength +
        volcanoHeight +
        ridgeRift +
        debugGuideRaise +
        brightSpeckles * 0.75 * polarHighFrequencyScale -
        darkSpeckles * 0.55 * polarHighFrequencyScale;

      float value = clamp(0.5 + combined * 0.5, 0.0, 1.0);
      gl_FragColor = vec4(vec3(value), 1.0);
      return;
    }

    if (uMode == 2) {
      float debugStrength = clamp(pow(craterRayMask, 0.55), 0.0, 1.0);
      gl_FragColor = vec4(vec3(debugStrength), 1.0);
      return;
    }

    if (uMode == 3) {
      vec3 gradientColor = mapToPalette(uv.x * 2.0 - 1.0);
      gl_FragColor = vec4(clamp(gradientColor, 0.0, 1.0), 1.0);
      return;
    }

    float colourLarge = fractalNoise(remappedPos * 2.0 + seed);
    float colourMedium = fractalNoise(remappedPos * 6.0 + seed);
    float colourFine = fractalNoise(remappedPos * 40.0 + seed);

    float polarHighFrequencyScale = mix(0.18, 1.0, equatorFactor);
    float value =
      colourLarge * 0.55 +
      colourMedium * 0.3 * polarHighFrequencyScale +
      colourFine * 0.15 * polarHighFrequencyScale +
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
    float textureDominance = clamp(uTextureScale, 0.0, 1.0);

    // Tint leg: grayscale-driven ramp from darker tint to full tint.
    vec3 tintColor = clamp(uTint, 0.0, 1.0);
    vec3 darkTint = tintColor * clamp(uTintShadowFloor, 0.0, 1.0);
    vec3 tintMapped = mix(darkTint, tintColor, normalizedValue);

    vec3 finalColor = mix(tintMapped, paletteColor, textureDominance);

    float rayBlend = clamp(craterRayMask * (uCraterRayStrength / 4.5) * uCraterRayVisibility, 0.0, 1.0);
    if (rayBlend > 0.0) {
      // Shift along the same palette curve instead of overlaying a fixed warm tone.
      float shiftedValue = clamp(value + rayBlend * 0.42, -1.0, 1.0);
      vec3 shiftedPaletteColor = mapToPalette(shiftedValue);
      float shiftedNormalizedValue = clamp((shiftedValue + 1.0) * 0.5, 0.0, 1.0);
      vec3 shiftedTintMapped = mix(darkTint, tintColor, shiftedNormalizedValue);
      vec3 shiftedColor = mix(shiftedTintMapped, shiftedPaletteColor, textureDominance);

      finalColor = mix(finalColor, shiftedColor, rayBlend);
    }

    float extraTextureScale = max(0.0, uTextureScale - 1.0);
    if (extraTextureScale > 0.0) {
      float luma = dot(finalColor, vec3(0.2126, 0.7152, 0.0722));
      float saturationBoost = 1.0 + extraTextureScale * 0.8;
      float contrastBoost = 1.0 + extraTextureScale * 0.7;

      finalColor = mix(vec3(luma), finalColor, saturationBoost);
      finalColor = (finalColor - 0.5) * contrastBoost + 0.5;
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
    uTintShadowFloor: new Uniform(0.18),
    uSwirliness: new Uniform(1),
    uTextureScale: new Uniform(1),
    uEnableCraters: new Uniform(1),
    uCraterCount: new Uniform(22),
    uCraterStrength: new Uniform(0.32),
    uCraterColorStrength: new Uniform(0.3),
    uEnableVolcanoes: new Uniform(0),
    uVolcanoCount: new Uniform(10),
    uVolcanoScale: new Uniform(1.0),
    uVolcanoStrength: new Uniform(1.0),
    uVolcanoColorStrength: new Uniform(0.75),
    uRidgeColorWeight: new Uniform(0.35),
    uRiftColorWeight: new Uniform(0.35),
    uCraterRayStrength: new Uniform(2),
    uCraterRayVisibility: new Uniform(1),
    uCraterRayDensity: new Uniform(1),
    uCraterRaySharpness: new Uniform(1),
    uCraterRayLengthPower: new Uniform(2.8),
    uEnableRidges: new Uniform(0),
    uEnableRifts: new Uniform(0),
    uRidgeStrength: new Uniform(0.5),
    uRidgeScale: new Uniform(2.2),
    uRidgeSharpness: new Uniform(1.6),
    uRiftStrength: new Uniform(0.4),
    uRiftScale: new Uniform(3.4),
    uRiftWidth: new Uniform(0.09),
    uRiftSharpness: new Uniform(2.0),
    uRidgesRiftsBlend: new Uniform(0.55),
    uDebugMidline: new Uniform(0),
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

function toNonNegativeInt(value: number | undefined, fallback: number) {
  const finite = toFiniteNumber(value, fallback)
  return Math.max(0, Math.floor(finite))
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

function setPaletteUniform(palette: PaletteColor[]) {
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
  mode: 0 | 1 | 2 | 3,
  width: number,
  height: number,
  noiseOffset: NoiseOffset,
  options: {
    surfaceTint?: string
    tintShadowFloor?: number
    swirliness?: number
    textureScale?: number
    enableCraters?: boolean
    craterCount?: number
    craterStrength?: number
    craterColorStrength?: number
    enableVolcanoes?: boolean
    volcanoCount?: number
    volcanoScale?: number
    volcanoStrength?: number
    volcanoColorStrength?: number
    ridgeColorWeight?: number
    riftColorWeight?: number
    craterRayStrength?: number
    craterRayVisibility?: number
    craterRayDensity?: number
    craterRaySharpness?: number
    craterRayLengthPower?: number
    enableRidges?: boolean
    enableRifts?: boolean
    ridgeStrength?: number
    ridgeScale?: number
    ridgeSharpness?: number
    riftStrength?: number
    riftScale?: number
    riftWidth?: number
    riftSharpness?: number
    ridgesRiftsBlend?: number
    debugMidline?: boolean
    palette?: PaletteColor[]
  }
) {
  material.uniforms.uMode.value = mode
  material.uniforms.uResolution.value.set(width, height)
  material.uniforms.uSeed.value.set(noiseOffset.x, noiseOffset.y, noiseOffset.z)
  const tint = parseHexTint(options.surfaceTint)
  material.uniforms.uTint.value.copy(tint)
  material.uniforms.uTintShadowFloor.value = toClampedNumber(options.tintShadowFloor, 0.18, 0, 0.8)
  material.uniforms.uSwirliness.value = toClampedNumber(options.swirliness, 1, 0, 2)
  material.uniforms.uTextureScale.value = toFiniteNumber(options.textureScale, 1)
  material.uniforms.uEnableCraters.value = (options.enableCraters ?? true) ? 1 : 0
  material.uniforms.uCraterCount.value = Math.min(96, toNonNegativeInt(options.craterCount, 22))
  material.uniforms.uCraterStrength.value = toClampedNumber(options.craterStrength, 0.32, 0, 1.5)
  material.uniforms.uCraterColorStrength.value = toClampedNumber(
    options.craterColorStrength,
    0.3,
    0,
    1.25
  )
  material.uniforms.uEnableVolcanoes.value = options.enableVolcanoes ? 1 : 0
  material.uniforms.uVolcanoCount.value = Math.min(80, toNonNegativeInt(options.volcanoCount, 10))
  material.uniforms.uVolcanoScale.value = toClampedNumber(options.volcanoScale, 1, 0.35, 2.5)
  material.uniforms.uVolcanoStrength.value = toClampedNumber(options.volcanoStrength, 1, 0, 3)
  material.uniforms.uVolcanoColorStrength.value = toClampedNumber(
    options.volcanoColorStrength,
    0.75,
    0,
    2.5
  )
  material.uniforms.uRidgeColorWeight.value = toClampedNumber(options.ridgeColorWeight, 0.35, 0, 4)
  material.uniforms.uRiftColorWeight.value = toClampedNumber(options.riftColorWeight, 0.35, 0, 4)
  material.uniforms.uCraterRayStrength.value = toClampedNumber(
    options.craterRayStrength,
    2.0,
    0,
    6.0
  )
  material.uniforms.uCraterRayVisibility.value = toClampedNumber(
    options.craterRayVisibility,
    1.0,
    0.0,
    4.0
  )
  material.uniforms.uCraterRayDensity.value = toClampedNumber(
    options.craterRayDensity,
    1.0,
    0.3,
    3.0
  )
  material.uniforms.uCraterRaySharpness.value = toClampedNumber(
    options.craterRaySharpness,
    1.0,
    0.5,
    4.0
  )
  material.uniforms.uCraterRayLengthPower.value = toClampedNumber(
    options.craterRayLengthPower,
    2.8,
    1.0,
    5.0
  )
  material.uniforms.uEnableRidges.value = options.enableRidges ? 1 : 0
  material.uniforms.uEnableRifts.value = options.enableRifts ? 1 : 0
  material.uniforms.uRidgeStrength.value = toClampedNumber(options.ridgeStrength, 0.5, 0.0, 2.0)
  material.uniforms.uRidgeScale.value = toClampedNumber(options.ridgeScale, 2.2, 0.5, 8.0)
  material.uniforms.uRidgeSharpness.value = toClampedNumber(options.ridgeSharpness, 1.6, 0.5, 4.0)
  material.uniforms.uRiftStrength.value = toClampedNumber(options.riftStrength, 0.4, 0.0, 2.0)
  material.uniforms.uRiftScale.value = toClampedNumber(options.riftScale, 3.4, 0.5, 12.0)
  material.uniforms.uRiftWidth.value = toClampedNumber(options.riftWidth, 0.09, 0.01, 0.25)
  material.uniforms.uRiftSharpness.value = toClampedNumber(options.riftSharpness, 2.0, 0.5, 6.0)
  material.uniforms.uRidgesRiftsBlend.value = toClampedNumber(
    options.ridgesRiftsBlend,
    0.55,
    0.0,
    1.0
  )
  material.uniforms.uDebugMidline.value = options.debugMidline ? 1 : 0

  if (options.palette) {
    setPaletteUniform(options.palette)
  }

  const renderTarget = new WebGLRenderTarget(width, height, {
    depthBuffer: false,
    stencilBuffer: false,
  })

  renderTarget.texture.wrapS = RepeatWrapping
  renderTarget.texture.wrapT = ClampToEdgeWrapping
  renderTarget.texture.minFilter = LinearMipmapLinearFilter
  renderTarget.texture.magFilter = LinearFilter
  renderTarget.texture.generateMipmaps = true

  const previousTarget = renderer.getRenderTarget()
  renderer.setRenderTarget(renderTarget)
  renderer.render(scene, camera)
  renderer.setRenderTarget(previousTarget)

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

export function createPlanetoidColourTexture(
  renderer: WebGLRenderer,
  noiseOffset: NoiseOffset,
  planetoidPalette: PaletteColor[],
  textureScale: number,
  textureHeight: number,
  options: ColourTextureOptions = {}
) {
  const height = Math.max(2, Math.floor(textureHeight))
  const width = height * 2

  const texture = renderTexture(renderer, 0, width, height, noiseOffset, {
    surfaceTint: options.surfaceTint,
    tintShadowFloor: options.tintShadowFloor,
    swirliness: options.swirliness,
    textureScale,
    enableCraters: options.enableCraters,
    craterCount: options.craterCount,
    craterColorStrength: options.craterColorStrength,
    enableVolcanoes: options.enableVolcanoes,
    volcanoCount: options.volcanoCount,
    volcanoScale: options.volcanoScale,
    volcanoStrength: options.volcanoStrength,
    volcanoColorStrength: options.volcanoColorStrength,
    ridgeColorWeight: options.ridgeColorWeight,
    riftColorWeight: options.riftColorWeight,
    enableRidges: options.enableRidges,
    enableRifts: options.enableRifts,
    ridgeStrength: options.ridgeStrength,
    ridgeScale: options.ridgeScale,
    ridgeSharpness: options.ridgeSharpness,
    riftStrength: options.riftStrength,
    riftScale: options.riftScale,
    riftWidth: options.riftWidth,
    riftSharpness: options.riftSharpness,
    ridgesRiftsBlend: options.ridgesRiftsBlend,
    craterRayStrength: options.craterRayStrength,
    craterRayVisibility: options.craterRayVisibility,
    craterRayDensity: options.craterRayDensity,
    craterRaySharpness: options.craterRaySharpness,
    craterRayLengthPower: options.craterRayLengthPower,
    debugMidline: options.debugMidline,
    palette: planetoidPalette,
  })

  texture.anisotropy = 8
  texture.colorSpace = NoColorSpace

  return texture
}

export function createPlanetoidBumpTexture(
  renderer: WebGLRenderer,
  noiseOffset: NoiseOffset,
  textureHeight: number,
  options: BumpTextureOptions = {}
) {
  const height = Math.max(2, Math.floor(textureHeight))
  const width = height * 2

  const texture = renderTexture(renderer, 1, width, height, noiseOffset, {
    enableCraters: options.enableCraters,
    craterCount: options.craterCount,
    craterStrength: options.craterStrength,
    enableVolcanoes: options.enableVolcanoes,
    volcanoCount: options.volcanoCount,
    volcanoScale: options.volcanoScale,
    volcanoStrength: options.volcanoStrength,
    swirliness: options.swirliness,
    enableRidges: options.enableRidges,
    enableRifts: options.enableRifts,
    ridgeStrength: options.ridgeStrength,
    ridgeScale: options.ridgeScale,
    ridgeSharpness: options.ridgeSharpness,
    riftStrength: options.riftStrength,
    riftScale: options.riftScale,
    riftWidth: options.riftWidth,
    riftSharpness: options.riftSharpness,
    ridgesRiftsBlend: options.ridgesRiftsBlend,
    debugMidline: options.debugMidline,
  })

  texture.anisotropy = 8

  return texture
}

export function createPlanetoidRayMaskTexture(
  renderer: WebGLRenderer,
  noiseOffset: NoiseOffset,
  textureHeight: number,
  craterCount = 22,
  options: RayDebugOptions = {}
) {
  const height = Math.max(2, Math.floor(textureHeight))
  const width = height * 2

  const texture = renderTexture(renderer, 2, width, height, noiseOffset, {
    craterCount,
    craterRayDensity: options.craterRayDensity,
    craterRaySharpness: options.craterRaySharpness,
    craterRayLengthPower: options.craterRayLengthPower,
  })

  texture.anisotropy = 8
  texture.colorSpace = NoColorSpace

  return texture
}

export function createPlanetoidPaletteGradientTexture(
  renderer: WebGLRenderer,
  planetoidPalette: PaletteColor[],
  textureWidth = 512,
  textureHeight = 48
) {
  const width = Math.max(2, Math.floor(textureWidth))
  const height = Math.max(2, Math.floor(textureHeight))

  const texture = renderTexture(
    renderer,
    3,
    width,
    height,
    { x: 0, y: 0, z: 0 },
    { palette: planetoidPalette }
  )

  texture.anisotropy = 8
  texture.colorSpace = NoColorSpace
  texture.wrapS = ClampToEdgeWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.minFilter = LinearFilter
  texture.magFilter = LinearFilter
  texture.generateMipmaps = false

  return texture
}
