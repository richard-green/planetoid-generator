export const vertexShader = `
    uniform vec3 uRingNormal;
    uniform vec3 uLightPosition;
    uniform float uMeshScale;

    varying vec3 vPlanetPosition;
    varying vec3 vWorldNormal;
    varying vec3 vRingNormalWorld;
    varying vec3 vLightDirection;
    varying float vWorldScale;

    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vec3 planetCenter = modelMatrix[3].xyz;

      vPlanetPosition = worldPosition.xyz - planetCenter;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vRingNormalWorld = normalize(mat3(modelMatrix) * uRingNormal);
      vLightDirection = normalize(uLightPosition - planetCenter);
      // World units per settings unit, so ring radii stay comparable under any parent scale.
      vWorldScale = length(modelMatrix[0].xyz) / max(uMeshScale, 0.0001);

      gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
  `

export const fragmentShader = `
    precision highp float;

    varying vec3 vPlanetPosition;
    varying vec3 vWorldNormal;
    varying vec3 vRingNormalWorld;
    varying vec3 vLightDirection;
    varying float vWorldScale;

    uniform float uInnerRadius;
    uniform float uOuterRadius;
    uniform float uSeed;
    uniform float uBandCount;
    uniform float uBandSharpness;
    uniform float uBandRegularity;
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
      int count = int(floor(uBandCount + 0.5));
      float variance = 1.0 - uBandRegularity;
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
          return vec3(local, width, fillVariation);
        }
        start = end;
      }

      return vec3(radial, 1.0, 0.5);
    }

    void main() {
      vec3 lightDirection = normalize(vLightDirection);
      // Keep the shadow alive right up to the terminator so it meets the night side cleanly.
      float lightFacing = smoothstep(-0.06, 0.01, dot(normalize(vWorldNormal), lightDirection));
      if (lightFacing <= 0.0) discard;

      vec3 ringNormal = normalize(vRingNormalWorld);
      float denominator = dot(lightDirection, ringNormal);
      if (abs(denominator) < 0.0001) discard;

      float distanceToPlane = -dot(vPlanetPosition, ringNormal) / denominator;
      if (distanceToPlane <= 0.0) discard;

      vec3 ringPoint = vPlanetPosition + lightDirection * distanceToPlane;
      float ringRadius = length(ringPoint) / max(vWorldScale, 0.0001);
      if (ringRadius <= uInnerRadius || ringRadius >= uOuterRadius) discard;

      float radial = (ringRadius - uInnerRadius) / max(0.0001, uOuterRadius - uInnerRadius);
      vec3 band = variableBandInfo(radial);
      float variance = 1.0 - uBandRegularity;
      float fillMultiplier = mix(1.0, band.z, variance);
      float fillRatio = clamp(
        mix(0.15, 0.96, uDensity) * fillMultiplier,
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
