export const vertexShader = `
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

export const fragmentShader = `
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
    uniform vec3 uPalette[8];
    uniform float uPalettePositions[8];

    vec3 paletteColor(float amount) {
      int size = max(2, min(uPaletteSize, 8));
      float position = clamp(amount, 0.0, 1.0);
      vec3 first = uPalette[0];
      vec3 second = uPalette[1];
      float startPosition = uPalettePositions[0];
      float endPosition = uPalettePositions[1];

      for (int i = 0; i < 7; i++) {
        if (i >= size - 1) break;
        float nextPosition = uPalettePositions[i + 1];
        if (position < nextPosition) break;
        first = uPalette[i + 1];
        startPosition = nextPosition;
        int nextIndex = min(i + 2, size - 1);
        second = uPalette[nextIndex];
        endPosition = uPalettePositions[nextIndex];
        if (i == size - 2) {
          second = first;
          endPosition = startPosition;
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

      float stepLength = segment / float(8);
      float dither = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
      float shellDepth = max(outerRadius - innerRadius, 0.0001);
      float wrap = mix(0.02, 0.9, uTerminatorWrap);
      vec3 sun = normalize(uSunDirection);
      vec3 scattered = vec3(0.0);

      for (int i = 0; i < 8; i++) {
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
