import {
  ClampToEdgeWrapping,
  LinearFilter,
  Mesh,
  NoColorSpace,
  OrthographicCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  type Texture,
  type WebGLRenderer,
} from 'three'

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
  uniform vec3 uPaletteDeep;
  uniform vec3 uPaletteMid;
  uniform vec3 uPaletteHot;

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
    float z = hash(index * 17.3 + uSeed.x) * 2.0 - 1.0;
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
    float heat = clamp(0.54 + flow * 0.11 + bands * 0.015 * uBandContrast + detail * 0.1 + (granulation - 0.32) * uConvection * 0.27 - sunspotOuter * 0.2 * uSunspotDarkness - sunspotCore * 0.76 * uSunspotDarkness, 0.0, 1.0);
    vec3 color = mix(uPaletteDeep, uPaletteMid, smoothstep(0.2, 0.72, heat));
    color = mix(color, uPaletteHot, smoothstep(0.66, 1.0, heat));
    color *= min(uBrightness, 1.0);
    float whiteHotness = clamp((uBrightness - 1.0) * 0.5, 0.0, 1.0);
    color = mix(color, vec3(1.0), whiteHotness);
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(luminance), color, uSaturation);
    color = mix(vec3(0.5), color, uContrast);
    float penumbraShade = penumbra * (0.42 + penumbraRidges * 0.08) * uSunspotDarkness;
    color = mix(color, color * 0.22, penumbraShade);
    color = mix(color, vec3(0.008), clamp(sunspotCore * uSunspotDarkness, 0.0, 1.0));
    gl_FragColor = vec4(color, 1.0);
  }
`

export function createStarColorTexture(
  renderer: WebGLRenderer,
  seed: number,
  textureHeight: number,
  scale: number,
  bandContrast: number,
  bandSwirl: number,
  granularity: number,
  turbulence: number,
  convection: number,
  sunspotCount: number,
  sunspotScale: number,
  sunspotPower: number,
  sunspotJaggedness: number,
  sunspotNeighbours: number,
  penumbraScale: number,
  sunspotDarkness: number,
  brightness: number,
  saturation: number,
  contrast: number,
  palette: readonly [number, number, number][]
): Texture {
  const height = Math.max(2, Math.floor(textureHeight))
  const width = height * 2
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uSeed: { value: new Vector3(seed * 0.0013, seed * 0.0021, seed * 0.0007) },
      uScale: { value: scale },
      uBandContrast: { value: bandContrast },
      uBandSwirl: { value: bandSwirl },
      uGranularity: { value: granularity },
      uTurbulence: { value: turbulence },
      uConvection: { value: convection },
      uSunspotCount: { value: sunspotCount },
      uSunspotScale: { value: sunspotScale },
      uSunspotPower: { value: sunspotPower },
      uSunspotJaggedness: { value: sunspotJaggedness },
      uSunspotNeighbours: { value: sunspotNeighbours },
      uPenumbraScale: { value: penumbraScale },
      uSunspotDarkness: { value: sunspotDarkness },
      uBrightness: { value: brightness },
      uSaturation: { value: saturation },
      uContrast: { value: contrast },
      uPaletteDeep: { value: new Vector3(...palette[0]) },
      uPaletteMid: { value: new Vector3(...palette[1]) },
      uPaletteHot: { value: new Vector3(...palette[2]) },
    },
  })
  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const mesh = new Mesh(new PlaneGeometry(2, 2), material)
  scene.add(mesh)
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
  renderer.setRenderTarget(renderTarget)
  renderer.setViewport(0, 0, width, height)
  renderer.clear()
  renderer.render(scene, camera)
  renderer.setRenderTarget(previousTarget)
  renderer.setViewport(previousViewport)
  mesh.geometry.dispose()
  material.dispose()

  const texture = renderTarget.texture
  texture.colorSpace = NoColorSpace
  texture.userData.renderTarget = renderTarget
  return texture
}

export function disposeStarTexture(texture: Texture): void {
  const renderTarget = texture.userData.renderTarget as WebGLRenderTarget | undefined
  renderTarget?.dispose()
}
