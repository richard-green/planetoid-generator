export const vertexShader = `
      attribute float aSize;
      attribute float aIntensity;
      attribute float aDust;
      attribute vec2 aGalacticCoord;
      uniform float uStarSizeScale;
      varying vec3 vColor;
      varying float vIntensity;
      varying float vDust;
      varying float vPointSize;
      varying vec2 vGalacticCoord;
      void main() {
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = clamp(aSize * pow(uStarSizeScale, 2.0) * (300.0 / length(viewPosition.xyz)), 1.0, 20.0);
        vColor = color;
        vIntensity = aIntensity;
        vDust = aDust;
        vPointSize = gl_PointSize;
        vGalacticCoord = aGalacticCoord;
      }
    `

export const fragmentShader = `
      varying vec3 vColor;
      varying float vIntensity;
      varying float vDust;
      varying float vPointSize;
      varying vec2 vGalacticCoord;
      uniform float uColorLuminance;
      uniform float uDustCloudDensity;
      uniform float uDustCloudOpacity;
      uniform float uDustCloudScale;
      uniform float uDustCloudSwirl;
      uniform float uDustCloudClumping;

      float hash21(vec2 point) {
        vec3 point3 = fract(vec3(point.xyx) * vec3(0.1031, 0.1030, 0.0973));
        point3 += dot(point3, point3.yzx + 33.33);
        return fract((point3.x + point3.y) * point3.z);
      }

      float valueNoise(vec2 point) {
        vec2 cell = floor(point);
        vec2 local = fract(point);
        vec2 blend = local * local * (3.0 - 2.0 * local);
        float lower = mix(hash21(cell), hash21(cell + vec2(1.0, 0.0)), blend.x);
        float upper = mix(hash21(cell + vec2(0.0, 1.0)), hash21(cell + vec2(1.0, 1.0)), blend.x);
        return mix(lower, upper, blend.y);
      }

      float fractalNoise(vec2 point) {
        float value = 0.0;
        float amplitude = 0.55;
        float amplitudeSum = 0.0;
        for (int octave = 0; octave < 4; octave++) {
          value += valueNoise(point) * amplitude;
          amplitudeSum += amplitude;
          point = point * 2.03 + vec2(17.1, 9.2);
          amplitude *= 0.48;
        }
        return value / amplitudeSum;
      }

      void main() {
        float radius = length(gl_PointCoord - vec2(0.5));
        float halo = exp(-radius * radius * 7.0);
        float core = exp(-radius * radius * 36.0);
        float alpha = 1.0 - smoothstep(0.28, 0.5, radius);
        vec3 vibrantColor = pow(max(vColor, vec3(0.0)), vec3(0.75));
        vec3 coronaColor = vibrantColor * (0.45 + halo * 0.75) * uColorLuminance;
        float whiteCoreStrength = mix(0.12, 0.92, smoothstep(1.5, 4.0, vPointSize));
        vec3 starColor = mix(coronaColor, vec3(1.0), core * whiteCoreStrength);
        vec2 dustPosition = vGalacticCoord * vec2(uDustCloudScale * 2.4, uDustCloudScale * 14.0);
        float warpX = fractalNoise(dustPosition * 0.72 + vec2(21.4, 7.3));
        float warpY = fractalNoise(dustPosition * 0.72 + vec2(-8.1, 33.2));
        vec2 swirledPosition = dustPosition + (vec2(warpX, warpY) - 0.5) * vec2(3.0, 1.4) * uDustCloudSwirl;
        float broadNoise = fractalNoise(swirledPosition);
        float clumpNoise = fractalNoise(swirledPosition * 2.7 + vec2(11.7, 5.4));
        float clumpStart = mix(0.3, 0.58, uDustCloudClumping);
        float clumpEnd = mix(0.7, 0.82, uDustCloudClumping);
        float clumpMask = smoothstep(clumpStart, clumpEnd, clumpNoise);
        float cloudStructure = mix(0.4 + broadNoise * 0.6, clumpMask, uDustCloudClumping);
        float densityThreshold = mix(0.82, 0.28, uDustCloudDensity);
        float densityMask = smoothstep(densityThreshold, densityThreshold + 0.18, cloudStructure);
        float scaledEnvelope = pow(clamp(vDust, 0.0, 1.0), 1.0 / max(uDustCloudScale, 0.05));
        float dustCoverage = scaledEnvelope * densityMask;
        float transmission = 1.0 - clamp(dustCoverage * uDustCloudOpacity, 0.0, 0.95);
        gl_FragColor = vec4(starColor * vIntensity * transmission, alpha * transmission);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
