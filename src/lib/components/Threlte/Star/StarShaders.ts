const MAX_PALETTE = 16

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
  uniform vec3 uSeed;
  uniform float uScale;
  uniform float uBandContrast;
  uniform float uBandSwirl;
  uniform float uGranularity;
  uniform float uTurbulence;
  uniform float uConvection;
  uniform int uSunspotCount;
  uniform float uSunspotScale;
  uniform float uSunspotPower;
  uniform float uSunspotJaggedness;
  uniform int uSunspotNeighbours;
  uniform float uPenumbraScale;
  uniform float uSunspotDarkness;
  uniform float uBrightness;
  uniform float uSaturation;
  uniform float uContrast;
  uniform int uPaletteSize;
  uniform vec3 uPalette[${MAX_PALETTE}];
  uniform float uPalettePositions[${MAX_PALETTE}];

  vec3 mapToPalette(float amount) {
    float position = clamp(amount, 0.0, 1.0);
    int size = max(2, min(uPaletteSize, ${MAX_PALETTE}));
    int index = 0;
    for (int i = 0; i < ${MAX_PALETTE} - 1; i++) {
      if (i < size - 1 && position >= uPalettePositions[i]) index = i;
    }
    index = min(index, size - 2);
    vec3 first = uPalette[0];
    vec3 second = uPalette[1];
    float startPosition = uPalettePositions[0];
    float endPosition = uPalettePositions[1];
    for (int i = 0; i < ${MAX_PALETTE} - 1; i++) {
      if (i == index) {
        first = uPalette[i];
        second = uPalette[i + 1];
        startPosition = uPalettePositions[i];
        endPosition = uPalettePositions[i + 1];
      }
    }
    float localAmount = clamp((position - startPosition) / max(0.0001, endPosition - startPosition), 0.0, 1.0);
    return mix(first, second, localAmount);
  }

  vec3 darkestPaletteColor() {
    int size = max(2, min(uPaletteSize, ${MAX_PALETTE}));
    vec3 darkest = uPalette[0];
    float darkestLuminance = dot(darkest, vec3(0.2126, 0.7152, 0.0722));

    for (int i = 1; i < ${MAX_PALETTE}; i++) {
      if (i < size) {
        vec3 candidate = uPalette[i];
        float candidateLuminance = dot(candidate, vec3(0.2126, 0.7152, 0.0722));
        if (candidateLuminance < darkestLuminance) {
          darkest = candidate;
          darkestLuminance = candidateLuminance;
        }
      }
    }

    return darkest;
  }

  float noise(vec3 p) {
    vec3 cell = floor(p);
    vec3 local = fract(p);
    vec3 blend = local * local * (3.0 - 2.0 * local);
    float corner000 = fract(sin(dot(cell, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
    float corner100 = fract(sin(dot(cell + vec3(1.0, 0.0, 0.0), vec3(127.1, 311.7, 74.7))) * 43758.5453123);
    float corner010 = fract(sin(dot(cell + vec3(0.0, 1.0, 0.0), vec3(127.1, 311.7, 74.7))) * 43758.5453123);
    float corner110 = fract(sin(dot(cell + vec3(1.0, 1.0, 0.0), vec3(127.1, 311.7, 74.7))) * 43758.5453123);
    float corner001 = fract(sin(dot(cell + vec3(0.0, 0.0, 1.0), vec3(127.1, 311.7, 74.7))) * 43758.5453123);
    float corner101 = fract(sin(dot(cell + vec3(1.0, 0.0, 1.0), vec3(127.1, 311.7, 74.7))) * 43758.5453123);
    float corner011 = fract(sin(dot(cell + vec3(0.0, 1.0, 1.0), vec3(127.1, 311.7, 74.7))) * 43758.5453123);
    float corner111 = fract(sin(dot(cell + vec3(1.0, 1.0, 1.0), vec3(127.1, 311.7, 74.7))) * 43758.5453123);
    float lower = mix(mix(corner000, corner100, blend.x), mix(corner010, corner110, blend.x), blend.y);
    float upper = mix(mix(corner001, corner101, blend.x), mix(corner011, corner111, blend.x), blend.y);
    return mix(lower, upper, blend.z) * 2.0 - 1.0;
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += noise(p) * amplitude;
      p = p * 2.03 + vec3(7.1, 13.7, 5.3);
      amplitude *= 0.5;
    }
    return value;
  }

  vec3 hash33(vec3 p) {
    p = vec3(
      dot(p, vec3(127.1, 311.7, 74.7)),
      dot(p, vec3(269.5, 183.3, 246.1)),
      dot(p, vec3(113.5, 271.9, 124.6))
    );
    return fract(sin(p) * 43758.5453123);
  }

  vec2 cellular(vec3 p) {
    vec3 cell = floor(p);
    vec3 local = fract(p);
    float nearest = 10.0;
    float nextNearest = 10.0;
    for (int z = -1; z <= 1; z++) {
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec3 offset = vec3(float(x), float(y), float(z));
          vec3 feature = offset + hash33(cell + offset);
          float distanceToFeature = length(local - feature);
          if (distanceToFeature < nearest) {
            nextNearest = nearest;
            nearest = distanceToFeature;
          } else if (distanceToFeature < nextNearest) {
            nextNearest = distanceToFeature;
          }
        }
      }
    }
    return vec2(nearest, nextNearest);
  }

  float hash(float value) {
    return fract(sin(value) * 43758.5453123);
  }

  vec3 sunspotDirection(float index) {
    const float MAX_SUNSPOT_Z = 0.93969262;
    float z = (hash(index * 17.3 + uSeed.x) * 2.0 - 1.0) * MAX_SUNSPOT_Z;
    float angle = hash(index * 31.7 + uSeed.y) * 6.2831853;
    float radius = sqrt(max(0.0, 1.0 - z * z));
    return vec3(radius * cos(angle), z, radius * sin(angle));
  }

  vec3 tangentAxis(vec3 direction) {
    vec3 reference = abs(direction.y) > 0.9 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
    return normalize(cross(reference, direction));
  }

  float irregularSpotRadius(vec3 center, float radius, float seedOffset, vec3 position) {
    vec3 tangentX = tangentAxis(center);
    vec3 tangentY = cross(center, tangentX);
    vec2 local = vec2(dot(position, tangentX), dot(position, tangentY));
    float angle = atan(local.y, local.x);
    float lobeA = sin(angle * (3.0 + hash(seedOffset) * 3.0) + seedOffset);
    float lobeB = sin(angle * (7.0 + hash(seedOffset + 4.0) * 4.0) - seedOffset * 1.7);
    return radius * (1.0 + (lobeA * 0.24 + lobeB * 0.12) * uSunspotJaggedness);
  }

  float smoothUnion(float firstDistance, float secondDistance, float blendRadius) {
    float blend = clamp(0.5 + 0.5 * (secondDistance - firstDistance) / blendRadius, 0.0, 1.0);
    return mix(secondDistance, firstDistance, blend) - blendRadius * blend * (1.0 - blend);
  }

  vec3 splatterProfile(vec3 position, vec3 center, float radius, float seedOffset) {
    vec3 tangentX = tangentAxis(center);
    vec3 tangentY = cross(center, tangentX);
    vec2 local = vec2(dot(position, tangentX), dot(position, tangentY));
    float angle = atan(local.y, local.x);
    float irregularRadius = irregularSpotRadius(center, radius, seedOffset, position);
    float distanceToCenter = acos(clamp(dot(position, center), -1.0, 1.0));
    float edgeFeather = 0.0025;
    float outer = 1.0 - smoothstep(irregularRadius - edgeFeather, irregularRadius + edgeFeather, distanceToCenter);
    float coreRadius = irregularRadius * 0.29;
    float core = 1.0 - smoothstep(coreRadius - edgeFeather, coreRadius + edgeFeather, distanceToCenter);
    float ridgePhase = length(local) / max(irregularRadius, 0.001) * 14.0 + seedOffset;
    float ridges = 0.5 + 0.5 * sin(ridgePhase);
    return vec3(outer, core, ridges);
  }

  void main() {
    float longitude = vUv.x * 6.2831853;
    float latitude = (vUv.y - 0.5) * 3.14159265;
    vec3 spherePosition = vec3(
      cos(latitude) * cos(longitude),
      sin(latitude),
      cos(latitude) * sin(longitude)
    );
    float turbulence = fbm(spherePosition * uGranularity * 3.5 + uSeed * 1.9);
    vec3 warpedPosition = spherePosition + vec3(turbulence, turbulence * 0.6, -turbulence * 0.4) * uTurbulence * 0.3;
    float flow = fbm(warpedPosition * uGranularity * 2.0 + uSeed);
    float largeScaleFlow = fbm(spherePosition * 1.25 + uSeed * 0.41);
    float longitudeFlow = sin(longitude * 2.0 + latitude * 2.7 + uSeed.x) * 0.35;
    float swirledLatitude = latitude + (largeScaleFlow + longitudeFlow) * uBandSwirl * 0.42;
    float bands = sin(swirledLatitude * (5.0 + uScale * 2.0) + flow * 2.8 + uSeed.z);
    float detail = fbm(warpedPosition * uGranularity * 5.0 + uSeed.yzx * 1.7);
    vec3 granuleWarp = vec3(
      fbm(spherePosition * 2.7 + uSeed),
      fbm(spherePosition * 3.1 + uSeed.yzx),
      fbm(spherePosition * 2.3 + uSeed.zxy)
    ) * uTurbulence * 0.035;
    vec2 granuleCell = cellular((spherePosition + granuleWarp) * (16.0 + uGranularity * 7.0) + uSeed * 2.3);
    float cellCore = 1.0 - smoothstep(0.14, 0.5, granuleCell.x);
    float cellLane = smoothstep(0.035, 0.1, granuleCell.y - granuleCell.x);
    float granulation = cellCore * cellLane;
    float sunspotOuter = 0.0;
    float sunspotCore = 0.0;
    float sunspotRidges = 0.0;
    float penumbraDistance = 10.0;
    float coreDistance = 10.0;
    for (int index = 0; index < 12; index++) {
      if (index >= uSunspotCount) break;
      float spotIndex = float(index);
      float radius = mix(0.045, 0.14, hash(spotIndex * 11.1 + uSeed.z)) * uSunspotScale;
      vec3 center = sunspotDirection(spotIndex);
      vec3 tangentX = tangentAxis(center);
      vec3 tangentY = cross(center, tangentX);
      int neighbourCount = int(floor(hash(spotIndex * 67.9 + uSeed.z) * float(uSunspotNeighbours + 1)));

      for (int lobe = 0; lobe < 8; lobe++) {
        if (lobe > neighbourCount) break;
        float lobeIndex = float(lobe);
        float angle = hash(spotIndex * 41.3 + lobeIndex * 7.1 + uSeed.y) * 6.2831853;
        float distance = lobe == 0 ? 0.0 : radius * mix(0.12, 0.78, hash(spotIndex * 29.1 + lobeIndex + uSeed.z));
        vec3 lobeCenter = normalize(center + (tangentX * cos(angle) + tangentY * sin(angle)) * distance);
        float lobeSize = pow(hash(spotIndex * 53.7 + lobeIndex + uSeed.x), uSunspotPower);
        float lobeRadius = radius * mix(0.18, 0.82, lobeSize);
        vec3 penumbraProfile = splatterProfile(spherePosition, lobeCenter, lobeRadius * uPenumbraScale, spotIndex * 23.9 + lobeIndex);
        float distanceToLobe = acos(clamp(dot(spherePosition, lobeCenter), -1.0, 1.0));
        float coreRadius = irregularSpotRadius(lobeCenter, lobeRadius, spotIndex * 23.9 + lobeIndex, spherePosition) * 0.29;
        float lobeCoreDistance = distanceToLobe - coreRadius;
        coreDistance = smoothUnion(coreDistance, lobeCoreDistance, coreRadius * 0.5);
        float penumbraRadius = irregularSpotRadius(lobeCenter, lobeRadius * uPenumbraScale * 0.55, spotIndex * 23.9 + lobeIndex, spherePosition);
        float lobePenumbraDistance = distanceToLobe - penumbraRadius;
        penumbraDistance = smoothUnion(penumbraDistance, lobePenumbraDistance, penumbraRadius * 0.5);
        sunspotRidges = max(sunspotRidges, penumbraProfile.x * penumbraProfile.z);
      }
    }
    sunspotOuter = 1.0 - smoothstep(-0.002, 0.004, penumbraDistance);
    sunspotCore = 1.0 - smoothstep(-0.0025, 0.0025, coreDistance);
    float penumbra = clamp(sunspotOuter - sunspotCore, 0.0, 1.0);
    float penumbraRidges = clamp(sunspotRidges, 0.0, 1.0);
    float heat = clamp(0.54 + flow * 0.11 + bands * 0.015 * uBandContrast + detail * 0.1 + (granulation - 0.32) * uConvection * 0.27, 0.0, 1.0);
    vec3 color = mapToPalette(heat);
    color *= min(uBrightness, 1.0);
    float whiteHotness = clamp((uBrightness - 1.0) * 0.5, 0.0, 1.0);
    color = mix(color, vec3(1.0), whiteHotness);
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(luminance), color, uSaturation);
    color = mix(vec3(0.5), color, uContrast);
    float darkness = uSunspotDarkness;
    vec3 spotColor = darkestPaletteColor();
    float spotLuminance = dot(spotColor, vec3(0.2126, 0.7152, 0.0722));
    spotColor = mix(vec3(spotLuminance), spotColor, max(1.0, uSaturation));
    float surfaceLuminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float penumbraBrightness = surfaceLuminance * (1.0 - darkness * (0.42 + penumbraRidges * 0.08));
    vec3 penumbraColor = spotColor * penumbraBrightness / max(spotLuminance, 0.001);
    float penumbraTint = penumbra * smoothstep(0.0, 0.6, darkness);
    color = mix(color, penumbraColor, penumbraTint);
    float coreBrightness = surfaceLuminance * mix(1.0, 0.035, darkness);
    vec3 coreColor = spotColor * coreBrightness / max(spotLuminance, 0.001);
    float coreTint = sunspotCore * smoothstep(0.0, 0.35, darkness);
    color = mix(color, coreColor, coreTint);
    gl_FragColor = vec4(color, 1.0);
  }
`

export const surfaceVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vObjectNormal;
    varying vec3 vViewPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vObjectNormal = normalize(normal);
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -modelViewPosition.xyz;
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `

export const surfaceFragmentShader = `
    uniform sampler2D uMap;
    uniform vec3 uLimbColor;
    uniform float uLimbIntensity;
    uniform vec3 uSeed;
    uniform float uPlasmaSurfaceIntensity;
    uniform float uPlasmaTurbulence;
    uniform float uPlasmaSharpness;
    uniform float uPlasmaTextureScale;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vObjectNormal;
    varying vec3 vViewPosition;

    float noise(vec3 p) {
      return sin(p.x * 2.1 + sin(p.y * 3.4)) * sin(p.y * 2.7 + sin(p.z * 2.3)) * sin(p.z * 3.1);
    }

    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int index = 0; index < 4; index++) {
        value += noise(p) * amplitude;
        p = p * 2.07 + vec3(4.2, 8.7, 2.6);
        amplitude *= 0.5;
      }
      return value;
    }

    vec3 swirlDomain(vec3 point, float strength) {
      float latitude = asin(clamp(point.y, -1.0, 1.0));
      float localWarp = fbm(point * 1.65 + uSeed.yzx * 0.61);
      float angle = (latitude * 1.8 + localWarp * 1.1) * strength;
      float cosine = cos(angle);
      float sine = sin(angle);
      return vec3(
        cosine * point.x - sine * point.z,
        point.y,
        sine * point.x + cosine * point.z
      );
    }

    void main() {
      vec3 color = texture2D(uMap, vUv).rgb;
      vec3 objectNormal = normalize(vObjectNormal);
      float turbulenceAmount = uPlasmaTurbulence * 0.5;
      vec3 broadDomain = swirlDomain(objectNormal, turbulenceAmount * 0.85);
      float broadStorm = fbm(broadDomain * 3.2 * uPlasmaTextureScale + uSeed);
      vec3 fineDomain = swirlDomain(objectNormal, turbulenceAmount * 1.35 + broadStorm * 0.45);
      float fineStorm = fbm(fineDomain * 12.0 * uPlasmaTextureScale + uSeed.zxy * 2.7);
      float storm = broadStorm * 0.68 + fineStorm * 0.32;
      float sharpness = (uPlasmaSharpness - 1.0) / 11.0;
      float filamentField = clamp(storm * 0.75 + 0.25, 0.0, 1.0);
      float filamentThreshold = mix(0.22, 0.62, sharpness);
      float filaments = smoothstep(filamentThreshold, 0.9, filamentField);
      float overlayStrength =
        uPlasmaSurfaceIntensity *
        clamp(turbulenceAmount, 0.0, 1.0);
      color *= 1.0 + filaments * overlayStrength * 0.4;
      float edge = 1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition)));
      float limb = pow(clamp(edge, 0.0, 1.0), 2.4) * uLimbIntensity;
      gl_FragColor = vec4(color + uLimbColor * limb, 1.0);
    }
  `

export const haloVertexShader = `
    varying vec3 vNormal;
    varying vec3 vObjectNormal;
    varying vec3 vViewPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vObjectNormal = normalize(normal);
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -modelViewPosition.xyz;
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `

export const haloFragmentShader = `
    uniform vec3 uHaloColor;
    uniform vec3 uSeed;
    uniform float uHaloIntensity;
    uniform float uHaloFalloff;
    uniform float uHaloSize;
    uniform float uHaloTurbulence;
    varying vec3 vNormal;
    varying vec3 vViewPosition;

    float noise(vec3 p) {
      return sin(p.x * 2.1 + sin(p.y * 3.4)) * sin(p.y * 2.7 + sin(p.z * 2.3)) * sin(p.z * 3.1);
    }

    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int index = 0; index < 4; index++) {
        value += noise(p) * amplitude;
        p = p * 2.07 + vec3(4.2, 8.7, 2.6);
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDirection = normalize(vViewPosition);
      float edge = 1.0 - abs(dot(normal, viewDirection));
      float starEdge = 1.0 - sqrt(max(0.0, 1.0 - pow(2.0 / (2.05 * uHaloSize), 2.0)));
      float haloDistance = clamp((edge - starEdge) / (1.0 - starEdge), 0.0, 1.0);
      float outerFade = 1.0 - smoothstep(0.88, 1.0, haloDistance);
      float coronaBand = exp(-uHaloFalloff * haloDistance) * outerFade;
      float wisps = 0.5 + 0.5 * fbm(normal * 5.0 + uSeed);
      float structure = mix(1.0, 0.6 + wisps * 0.4, uHaloTurbulence * 0.5);
      float opacity = coronaBand * structure * uHaloIntensity * 0.24;
      float colorize = mix(0.72, 1.0, smoothstep(0.0, 0.25, haloDistance));
      vec3 haloColor = mix(vec3(1.0), uHaloColor, colorize);
      gl_FragColor = vec4(haloColor, opacity);
    }
  `

export const haloDetailFragmentShader = `
    uniform vec3 uHaloColor;
    uniform vec3 uSeed;
    uniform float uHaloIntensity;
    uniform float uHaloFalloff;
    uniform float uHaloSize;
    uniform float uHaloTurbulence;
    uniform float uPlasmaIntensity;
    uniform float uPlasmaExtent;
    uniform float uPlasmaTurbulence;
    uniform float uPlasmaSharpness;
    uniform float uPlasmaTextureScale;
    varying vec3 vNormal;
    varying vec3 vObjectNormal;
    varying vec3 vViewPosition;

    float noise(vec3 p) {
      return sin(p.x * 2.1 + sin(p.y * 3.4)) * sin(p.y * 2.7 + sin(p.z * 2.3)) * sin(p.z * 3.1);
    }

    float fbm(vec3 p) {
      float value = 0.0;
      float amplitude = 0.5;
      for (int index = 0; index < 4; index++) {
        value += noise(p) * amplitude;
        p = p * 2.07 + vec3(4.2, 8.7, 2.6);
        amplitude *= 0.5;
      }
      return value;
    }

    vec3 swirlDomain(vec3 point, float strength) {
      float latitude = asin(clamp(point.y, -1.0, 1.0));
      float localWarp = fbm(point * 1.65 + uSeed.yzx * 0.61);
      float angle = (latitude * 1.8 + localWarp * 1.1) * strength;
      float cosine = cos(angle);
      float sine = sin(angle);
      return vec3(
        cosine * point.x - sine * point.z,
        point.y,
        sine * point.x + cosine * point.z
      );
    }

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 objectNormal = normalize(vObjectNormal);
      vec3 viewDirection = normalize(vViewPosition);
      float edge = 1.0 - abs(dot(normal, viewDirection));
      float starEdge = 1.0 - sqrt(max(0.0, 1.0 - pow(2.0 / (2.05 * uHaloSize), 2.0)));
      float haloDistance = clamp((edge - starEdge) / (1.0 - starEdge), 0.0, 1.0);
      float turbulenceAmount = uPlasmaTurbulence * 0.5;
      vec3 broadDomain = swirlDomain(objectNormal, turbulenceAmount * 0.85);
      float broadStorm = fbm(broadDomain * 3.2 * uPlasmaTextureScale + uSeed);
      vec3 fineDomain = swirlDomain(objectNormal, turbulenceAmount * 1.35 + broadStorm * 0.45);
      float fineStorm = fbm(fineDomain * 12.0 * uPlasmaTextureScale + uSeed.zxy * 2.7);
      float storm = broadStorm * 0.68 + fineStorm * 0.32;
      float distanceWarp = storm * turbulenceAmount * 0.018 * smoothstep(0.03, 0.25, haloDistance);
      float plasmaDistance = clamp((haloDistance - distanceWarp) / 0.04, 0.0, 1.0);
      float outerFade = 1.0 - smoothstep(0.72, 1.0, plasmaDistance);
      float plasmaBand = exp(-8.0 * plasmaDistance) * outerFade;
      float sharpness = (uPlasmaSharpness - 1.0) / 11.0;
      float filamentField = clamp(storm * 0.75 + 0.25, 0.0, 1.0);
      float filamentThreshold = mix(0.22, 0.62, sharpness);
      float filaments = smoothstep(filamentThreshold, 0.9, filamentField);
      float filamentBrightness = mix(1.0, 3.0, sharpness);
      float opacity = plasmaBand * filaments * filamentBrightness * turbulenceAmount * uPlasmaIntensity * 0.2;
      float colorize = mix(0.82, 1.0, smoothstep(0.0, 0.35, plasmaDistance));
      vec3 haloColor = mix(vec3(1.0), uHaloColor, colorize);
      gl_FragColor = vec4(haloColor, opacity);
    }
  `
