<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core'
  import { OrbitControls } from '@threlte/extras'
  import {
    AdditiveBlending,
    BackSide,
    Color,
    Mesh,
    ShaderMaterial,
    SphereGeometry,
    WebGLRenderTarget,
    type Texture,
  } from 'three'
  import { onDestroy } from 'svelte'
  import { createStarColorTexture, disposeStarTexture } from './Star/StarGpuTextures'
  import {
    DefaultValues,
    MaxValues,
    MinValues,
    type StarPaletteName,
    type StarRangeKey,
  } from './Star/StarSettings'

  export type { StarPaletteName } from './Star/StarSettings'

  const starPalettes: Record<StarPaletteName, readonly [number, number, number][]> = {
    White: [
      [0.38, 0.42, 0.5],
      [0.84, 0.9, 1],
      [1, 0.98, 0.83],
    ],
    Blue: [
      [0.03, 0.1, 0.38],
      [0.12, 0.45, 1],
      [0.78, 0.92, 1],
    ],
    Yellow: [
      [0.32, 0.13, 0.002],
      [1, 0.52, 0.015],
      [1, 0.94, 0.38],
    ],
    Orange: [
      [0.4, 0.055, 0.001],
      [1, 0.28, 0.006],
      [1, 0.78, 0.12],
    ],
    Red: [
      [0.28, 0.002, 0.001],
      [0.8, 0.025, 0.008],
      [1, 0.25, 0.04],
    ],
  }

  const surfaceVertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -modelViewPosition.xyz;
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `

  const surfaceFragmentShader = `
    uniform sampler2D uMap;
    uniform vec3 uLimbColor;
    uniform float uLimbIntensity;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vec3 color = texture2D(uMap, vUv).rgb;
      float edge = 1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition)));
      float limb = pow(clamp(edge, 0.0, 1.0), 2.4) * uLimbIntensity;
      gl_FragColor = vec4(color + uLimbColor * limb, 1.0);
    }
  `

  const haloVertexShader = `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -modelViewPosition.xyz;
      gl_Position = projectionMatrix * modelViewPosition;
    }
  `

  const haloFragmentShader = `
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
      float structure = mix(1.0, 0.6 + wisps * 0.4, min(uHaloTurbulence * 0.5, 1.0));
      float opacity = coronaBand * structure * uHaloIntensity * 0.24;
      gl_FragColor = vec4(uHaloColor, opacity);
    }
  `

  const haloDetailFragmentShader = `
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
      float broadStorm = fbm(normal * 3.2 * uPlasmaTextureScale + uSeed);
      float fineStorm = fbm(normal * 12.0 * uPlasmaTextureScale + uSeed.zxy * 2.7);
      float storm = broadStorm * 0.7 + fineStorm * 0.3;
      float turbulenceAmount = min(uPlasmaTurbulence * 0.5, 1.0);
      float distanceWarp = storm * turbulenceAmount * uPlasmaExtent * 0.45 * smoothstep(0.03, 0.25, haloDistance);
      float plasmaDistance = clamp((haloDistance - distanceWarp) / uPlasmaExtent, 0.0, 1.0);
      float outerFade = 1.0 - smoothstep(0.72, 1.0, plasmaDistance);
      float plasmaBand = exp(-3.5 * plasmaDistance) * outerFade;
      float filaments = pow(max(storm, 0.0), uPlasmaSharpness);
      float opacity = plasmaBand * filaments * turbulenceAmount * uPlasmaIntensity * 0.2;
      gl_FragColor = vec4(uHaloColor, opacity);
    }
  `

  type Props = {
    seed?: number
    textureScale?: number
    bandContrast?: number
    bandSwirl?: number
    granularity?: number
    turbulence?: number
    convection?: number
    sunspotCount?: number
    sunspotScale?: number
    sunspotJaggedness?: number
    sunspotNeighbours?: number
    brightness?: number
    saturation?: number
    contrast?: number
    palette?: StarPaletteName
    limbBrightness?: number
    haloIntensity?: number
    haloFalloff?: number
    haloSize?: number
    haloTurbulence?: number
    plasmaIntensity?: number
    plasmaExtent?: number
    plasmaTurbulence?: number
    plasmaSharpness?: number
    plasmaTextureScale?: number
    colorTextureSize?: number
    autoRotate?: boolean
  }

  let {
    seed = DefaultValues.seed,
    textureScale = DefaultValues.textureScale,
    bandContrast = DefaultValues.bandContrast,
    bandSwirl = DefaultValues.bandSwirl,
    granularity = DefaultValues.granularity,
    turbulence = DefaultValues.turbulence,
    convection = DefaultValues.convection,
    sunspotCount = DefaultValues.sunspotCount,
    sunspotScale = DefaultValues.sunspotScale,
    sunspotJaggedness = DefaultValues.sunspotJaggedness,
    sunspotNeighbours = DefaultValues.sunspotNeighbours,
    brightness = DefaultValues.brightness,
    saturation = DefaultValues.saturation,
    contrast = DefaultValues.contrast,
    palette = DefaultValues.palette,
    limbBrightness = DefaultValues.limbBrightness,
    haloIntensity = DefaultValues.haloIntensity,
    haloFalloff = DefaultValues.haloFalloff,
    haloSize = DefaultValues.haloSize,
    haloTurbulence = DefaultValues.haloTurbulence,
    plasmaIntensity = DefaultValues.plasmaIntensity,
    plasmaExtent = DefaultValues.plasmaExtent,
    plasmaTurbulence = DefaultValues.plasmaTurbulence,
    plasmaSharpness = DefaultValues.plasmaSharpness,
    plasmaTextureScale = DefaultValues.plasmaTextureScale,
    colorTextureSize = DefaultValues.colorTextureSize,
    autoRotate = DefaultValues.autoRotate,
  }: Props = $props()

  const geometry = new SphereGeometry(2, 128, 64)
  const haloGeometry = new SphereGeometry(2.05, 128, 64)
  let mesh = $state<Mesh | undefined>(undefined)
  let material = $state<ShaderMaterial | undefined>(undefined)
  let haloMaterial = $state<ShaderMaterial | undefined>(undefined)
  let colorTexture = $state<Texture | undefined>(undefined)
  const { renderer, scene } = useThrelte()
  scene.background = new Color('#030005')
  const limbColor = $derived(new Color(...(starPalettes[palette] ?? starPalettes.Orange)[2]))
  const surfaceUniforms = {
    uMap: { value: null },
    uLimbColor: { value: new Color('#ffffff') },
    uLimbIntensity: { value: 0 },
  }
  const haloUniforms = {
    uHaloColor: { value: new Color('#ffffff') },
    uSeed: { value: new Color() },
    uHaloIntensity: { value: 0 },
    uHaloFalloff: { value: 1 },
    uHaloSize: { value: 1 },
    uHaloTurbulence: { value: 0 },
    uPlasmaIntensity: { value: 0 },
    uPlasmaExtent: { value: 1 },
    uPlasmaTurbulence: { value: 0 },
    uPlasmaSharpness: { value: 1 },
    uPlasmaTextureScale: { value: 1 },
  }

  function clampSetting(key: StarRangeKey, value: number): number {
    return Math.min(MaxValues[key], Math.max(MinValues[key], value))
  }

  function flipRows(source: Uint8Array, width: number, height: number): Uint8Array {
    const output = new Uint8Array(source.length)
    const rowSize = width * 4
    for (let row = 0; row < height; row += 1) {
      output.set(source.subarray(row * rowSize, (row + 1) * rowSize), (height - row - 1) * rowSize)
    }
    return output
  }

  export function downloadTextureMapPng(fileName = 'generated-star-texture.png'): boolean {
    if (!renderer || !colorTexture) return false
    const target = colorTexture.userData.renderTarget as WebGLRenderTarget | undefined
    if (!target) return false

    const pixels = new Uint8Array(target.width * target.height * 4)
    const previousTarget = renderer.getRenderTarget()
    try {
      renderer.setRenderTarget(target)
      renderer.readRenderTargetPixels(target, 0, 0, target.width, target.height, pixels)
    } finally {
      renderer.setRenderTarget(previousTarget)
    }

    const canvas = document.createElement('canvas')
    canvas.width = target.width
    canvas.height = target.height
    const context = canvas.getContext('2d')
    if (!context) return false
    context.putImageData(
      new ImageData(
        new Uint8ClampedArray(flipRows(pixels, target.width, target.height)),
        target.width,
        target.height
      ),
      0,
      0
    )
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = fileName
    link.click()
    return true
  }

  $effect(() => {
    if (!renderer || !material) return
    const nextTexture = createStarColorTexture(
      renderer,
      clampSetting('seed', seed),
      Math.floor(clampSetting('colorTextureSize', colorTextureSize)),
      clampSetting('textureScale', textureScale),
      clampSetting('bandContrast', bandContrast),
      clampSetting('bandSwirl', bandSwirl),
      clampSetting('granularity', granularity),
      clampSetting('turbulence', turbulence),
      clampSetting('convection', convection),
      Math.floor(clampSetting('sunspotCount', sunspotCount)),
      clampSetting('sunspotScale', sunspotScale),
      clampSetting('sunspotJaggedness', sunspotJaggedness),
      Math.floor(clampSetting('sunspotNeighbours', sunspotNeighbours)),
      clampSetting('brightness', brightness),
      clampSetting('saturation', saturation),
      clampSetting('contrast', contrast),
      starPalettes[palette] ?? starPalettes.Orange
    )
    colorTexture = nextTexture
    material.uniforms.uMap.value = nextTexture
    material.uniforms.uLimbColor.value = limbColor
    material.uniforms.uLimbIntensity.value = limbBrightness

    return () => {
      if (colorTexture === nextTexture) colorTexture = undefined
      disposeStarTexture(nextTexture)
    }
  })

  $effect(() => {
    if (!haloMaterial) return
    haloMaterial.uniforms.uHaloColor.value = limbColor
    haloMaterial.uniforms.uSeed.value.set(seed * 0.0013, seed * 0.0021, seed * 0.0007)
    haloMaterial.uniforms.uHaloIntensity.value = haloIntensity
    haloMaterial.uniforms.uHaloFalloff.value = haloFalloff
    haloMaterial.uniforms.uHaloSize.value = haloSize
    haloMaterial.uniforms.uHaloTurbulence.value = haloTurbulence
    haloMaterial.uniforms.uPlasmaIntensity.value = plasmaIntensity
    haloMaterial.uniforms.uPlasmaExtent.value = plasmaExtent
    haloMaterial.uniforms.uPlasmaTurbulence.value = plasmaTurbulence
    haloMaterial.uniforms.uPlasmaSharpness.value = plasmaSharpness
    haloMaterial.uniforms.uPlasmaTextureScale.value = plasmaTextureScale
  })

  useTask((delta) => {
    if (mesh && autoRotate) mesh.rotation.y += delta * 0.07
  })

  onDestroy(() => {
    geometry.dispose()
    haloGeometry.dispose()
  })
</script>

<T.PerspectiveCamera makeDefault position={[0, 0, 6.5]}>
  <OrbitControls enableDamping={true} dampingFactor={0.08} minDistance={3.5} maxDistance={12} />
</T.PerspectiveCamera>

<T.Mesh bind:ref={mesh} {geometry}>
  <T.ShaderMaterial
    bind:ref={material}
    vertexShader={surfaceVertexShader}
    fragmentShader={surfaceFragmentShader}
    uniforms={surfaceUniforms}
    toneMapped={false}
  />
</T.Mesh>

<T.Mesh geometry={haloGeometry} scale={[haloSize, haloSize, haloSize]}>
  <T.ShaderMaterial
    bind:ref={haloMaterial}
    vertexShader={haloVertexShader}
    fragmentShader={haloFragmentShader}
    uniforms={haloUniforms}
    side={BackSide}
    transparent={true}
    depthWrite={false}
    blending={AdditiveBlending}
    toneMapped={false}
  />
</T.Mesh>

<T.Mesh geometry={haloGeometry} scale={[haloSize, haloSize, haloSize]}>
  <T.ShaderMaterial
    vertexShader={haloVertexShader}
    fragmentShader={haloDetailFragmentShader}
    uniforms={haloUniforms}
    side={BackSide}
    transparent={true}
    depthWrite={false}
    blending={AdditiveBlending}
    toneMapped={false}
  />
</T.Mesh>
