<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core'
  import { AdditiveBlending, BackSide, Color, Mesh, ShaderMaterial, WebGLRenderTarget, type Texture } from 'three'
  import { onDestroy } from 'svelte'
  import { createIcosphere } from '../../../utils/geometry'
  import { createStarColorTexture, disposeStarTexture } from './StarGpuTextures'
  import { StarPalettes } from './StarPalettes'
  import { MaxValues, MinValues, type StarRangeKey, type StarSettings } from './StarSettings'

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
      float structure = mix(1.0, 0.6 + wisps * 0.4, uHaloTurbulence * 0.5);
      float opacity = coronaBand * structure * uHaloIntensity * 0.24;
      float colorize = mix(0.72, 1.0, smoothstep(0.0, 0.25, haloDistance));
      vec3 haloColor = mix(vec3(1.0), uHaloColor, colorize);
      gl_FragColor = vec4(haloColor, opacity);
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

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 objectNormal = normalize(vObjectNormal);
      vec3 viewDirection = normalize(vViewPosition);
      float edge = 1.0 - abs(dot(normal, viewDirection));
      float starEdge = 1.0 - sqrt(max(0.0, 1.0 - pow(2.0 / (2.05 * uHaloSize), 2.0)));
      float haloDistance = clamp((edge - starEdge) / (1.0 - starEdge), 0.0, 1.0);
      float broadStorm = fbm(objectNormal * 3.2 * uPlasmaTextureScale + uSeed);
      float fineStorm = fbm(objectNormal * 12.0 * uPlasmaTextureScale + uSeed.zxy * 2.7);
      float storm = broadStorm * 0.7 + fineStorm * 0.3;
      float turbulenceAmount = uPlasmaTurbulence * 0.5;
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

  type Props = {
    settings: StarSettings
  }

  let { settings }: Props = $props()

  const geometry = createIcosphere(2, 20)
  const haloGeometry = createIcosphere(2.05, 5)
  let mesh = $state<Mesh | undefined>(undefined)
  let plasmaMesh = $state<Mesh | undefined>(undefined)
  let material = $state<ShaderMaterial | undefined>(undefined)
  let haloMaterial = $state<ShaderMaterial | undefined>(undefined)
  let colorTexture = $state<Texture | undefined>(undefined)
  const { renderer } = useThrelte()
  const activePalette = $derived(StarPalettes[settings.palette] ?? StarPalettes.Orange)
  const limbColor = $derived(new Color(...activePalette[2]))
  const haloColor = $derived(new Color(...activePalette[1]))
  const haloSize = $derived(settings.haloSize)
  const plasmaShellScale = $derived(1 + settings.plasmaExtent)
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
  const plasmaUniforms = {
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
      clampSetting('seed', settings.seed),
      Math.floor(clampSetting('colorTextureSize', settings.colorTextureSize)),
      clampSetting('textureScale', settings.textureScale),
      clampSetting('bandContrast', settings.bandContrast),
      clampSetting('bandSwirl', settings.bandSwirl),
      clampSetting('granularity', settings.granularity),
      clampSetting('turbulence', settings.turbulence),
      clampSetting('convection', settings.convection),
      Math.floor(clampSetting('sunspotCount', settings.sunspotCount)),
      clampSetting('sunspotScale', settings.sunspotScale),
      clampSetting('sunspotPower', settings.sunspotPower),
      clampSetting('sunspotJaggedness', settings.sunspotJaggedness),
      Math.floor(clampSetting('sunspotNeighbours', settings.sunspotNeighbours)),
      clampSetting('penumbraScale', settings.penumbraScale),
      clampSetting('sunspotDarkness', settings.sunspotDarkness),
      clampSetting('brightness', settings.brightness),
      clampSetting('saturation', settings.saturation),
      clampSetting('contrast', settings.contrast),
      activePalette
    )
    colorTexture = nextTexture
    material.uniforms.uMap.value = nextTexture
    material.uniforms.uLimbColor.value = limbColor
    material.uniforms.uLimbIntensity.value = settings.limbBrightness

    return () => {
      if (colorTexture === nextTexture) colorTexture = undefined
      disposeStarTexture(nextTexture)
    }
  })

  $effect(() => {
    if (!haloMaterial) return
    haloMaterial.uniforms.uHaloColor.value = haloColor
    haloMaterial.uniforms.uSeed.value.set(
      settings.seed * 0.0013,
      settings.seed * 0.0021,
      settings.seed * 0.0007
    )
    haloMaterial.uniforms.uHaloIntensity.value = settings.haloIntensity
    haloMaterial.uniforms.uHaloFalloff.value = settings.haloFalloff
    haloMaterial.uniforms.uHaloSize.value = settings.haloSize
    haloMaterial.uniforms.uHaloTurbulence.value = settings.haloTurbulence
    haloMaterial.uniforms.uPlasmaIntensity.value = settings.plasmaIntensity
    haloMaterial.uniforms.uPlasmaExtent.value = settings.plasmaExtent
    haloMaterial.uniforms.uPlasmaTurbulence.value = settings.plasmaTurbulence
    haloMaterial.uniforms.uPlasmaSharpness.value = settings.plasmaSharpness
    haloMaterial.uniforms.uPlasmaTextureScale.value = settings.plasmaTextureScale

    plasmaUniforms.uHaloColor.value = haloColor
    plasmaUniforms.uSeed.value.set(
      settings.seed * 0.0013,
      settings.seed * 0.0021,
      settings.seed * 0.0007
    )
    plasmaUniforms.uHaloIntensity.value = settings.haloIntensity
    plasmaUniforms.uHaloFalloff.value = settings.haloFalloff
    plasmaUniforms.uHaloSize.value = plasmaShellScale
    plasmaUniforms.uHaloTurbulence.value = settings.haloTurbulence
    plasmaUniforms.uPlasmaIntensity.value = settings.plasmaIntensity
    plasmaUniforms.uPlasmaExtent.value = settings.plasmaExtent
    plasmaUniforms.uPlasmaTurbulence.value = settings.plasmaTurbulence
    plasmaUniforms.uPlasmaSharpness.value = settings.plasmaSharpness
    plasmaUniforms.uPlasmaTextureScale.value = settings.plasmaTextureScale
  })

  useTask((delta) => {
    if (!settings.autoRotate) return
    const rotation = delta * 0.07
    if (mesh) mesh.rotation.y += rotation
    if (plasmaMesh) plasmaMesh.rotation.y += rotation
  })

  onDestroy(() => {
    geometry.dispose()
    haloGeometry.dispose()
  })
</script>

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

<T.Mesh bind:ref={plasmaMesh} geometry={haloGeometry} scale={[plasmaShellScale, plasmaShellScale, plasmaShellScale]}>
  <T.ShaderMaterial
    vertexShader={haloVertexShader}
    fragmentShader={haloDetailFragmentShader}
    uniforms={plasmaUniforms}
    side={BackSide}
    transparent={true}
    depthWrite={false}
    blending={AdditiveBlending}
    toneMapped={false}
  />
</T.Mesh>
