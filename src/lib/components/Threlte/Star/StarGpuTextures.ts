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
  uniform float uSunspotJaggedness;
  uniform int uSunspotNeighbours;
  uniform float uBrightness;
  uniform float uSaturation;
  uniform float uContrast;
  uniform vec3 uPaletteDeep;
  uniform vec3 uPaletteMid;
  uniform vec3 uPaletteHot;

  float noise(vec3 p) {
    return
      sin(p.x * 2.3 + sin(p.y * 3.7)) *
      sin(p.y * 2.1 + sin(p.z * 2.9)) *
      sin(p.z * 2.7 + sin(p.x * 3.1));
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

  vec3 splatterProfile(vec3 position, vec3 center, float radius, float seedOffset) {
    vec3 tangentX = tangentAxis(center);
    vec3 tangentY = cross(center, tangentX);
    vec2 local = vec2(dot(position, tangentX), dot(position, tangentY));
    float angle = atan(local.y, local.x);
    float lobeA = sin(angle * (3.0 + hash(seedOffset) * 3.0) + seedOffset);
    float lobeB = sin(angle * (7.0 + hash(seedOffset + 4.0) * 4.0) - seedOffset * 1.7);
    float irregularRadius = radius * (1.0 + (lobeA * 0.24 + lobeB * 0.12) * uSunspotJaggedness);
    float closeness = dot(position, center);
    float outer = smoothstep(cos(irregularRadius), cos(irregularRadius * 0.32), closeness);
    float core = smoothstep(cos(irregularRadius * 0.44), cos(irregularRadius * 0.14), closeness);
    float ridges = 0.5 + 0.5 * sin(
      length(local) / max(irregularRadius, 0.001) * 19.0 + angle * 3.0 + seedOffset
    );
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
    float convection = smoothstep(0.1, 0.65, fbm(spherePosition * (2.2 + uGranularity * 1.8) + uSeed.zxy * 2.1) + 0.5);
    float sunspotOuter = 0.0;
    float sunspotCore = 0.0;
    float sunspotRidges = 0.0;
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
        float lobeRadius = radius * mix(0.38, 0.82, hash(spotIndex * 53.7 + lobeIndex + uSeed.x));
        vec3 profile = splatterProfile(spherePosition, lobeCenter, lobeRadius, spotIndex * 23.9 + lobeIndex);
        sunspotOuter += profile.x;
        sunspotCore += profile.y;
        sunspotRidges += (profile.x - profile.y) * profile.z;
      }
    }
    float penumbra = clamp(sunspotOuter - sunspotCore, 0.0, 1.0);
    float penumbraRidges = clamp(sunspotRidges, 0.0, 1.0);
    float heat = clamp(0.54 + flow * 0.19 + bands * 0.12 * uBandContrast + detail * 0.15 + convection * uConvection * 0.2 - sunspotOuter * 0.2 - sunspotCore * 0.76, 0.0, 1.0);
    vec3 color = mix(uPaletteDeep, uPaletteMid, smoothstep(0.2, 0.72, heat));
    color = mix(color, uPaletteHot, smoothstep(0.66, 1.0, heat));
    color *= min(uBrightness, 1.0);
    float whiteHotness = clamp((uBrightness - 1.0) * 0.5, 0.0, 1.0);
    color = mix(color, vec3(1.0), whiteHotness);
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    color = mix(vec3(luminance), color, uSaturation);
    color = mix(vec3(0.5), color, uContrast);
    float penumbraShade = penumbra * (0.38 + penumbraRidges * 0.3);
    color = mix(color, color * vec3(0.42, 0.14, 0.04), penumbraShade);
    color = mix(color, vec3(0.008), clamp(sunspotCore, 0.0, 1.0));
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
  sunspotJaggedness: number,
  sunspotNeighbours: number,
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
      uSunspotJaggedness: { value: sunspotJaggedness },
      uSunspotNeighbours: { value: sunspotNeighbours },
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
