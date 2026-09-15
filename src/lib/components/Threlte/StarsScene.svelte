<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core'
  import { OrbitControls } from '@threlte/extras'
  import {
    Color,
    Mesh,
    ShaderMaterial,
    SphereGeometry,
    WebGLRenderTarget,
    type Texture,
  } from 'three'
  import { onDestroy } from 'svelte'
  import { createStarColorTexture, disposeStarTexture } from './Star/StarGpuTextures'
  import { DefaultValues, type StarPaletteName } from './Star/StarSettings'

  export type { StarPaletteName } from './Star/StarSettings'

  const starPalettes: Record<StarPaletteName, readonly [number, number, number][]> = {
    White: [[0.38, 0.42, 0.5], [0.84, 0.9, 1], [1, 0.98, 0.83]],
    Blue: [[0.03, 0.1, 0.38], [0.12, 0.45, 1], [0.78, 0.92, 1]],
    Yellow: [[0.32, 0.13, 0.002], [1, 0.52, 0.015], [1, 0.94, 0.38]],
    Orange: [[0.42, 0.012, 0.001], [1, 0.12, 0.004], [1, 0.7, 0.08]],
    Red: [[0.28, 0.002, 0.001], [0.8, 0.025, 0.008], [1, 0.25, 0.04]],
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
    palette?: StarPaletteName
    limbBrightness?: number
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
    palette = DefaultValues.palette,
    limbBrightness = DefaultValues.limbBrightness,
    autoRotate = DefaultValues.autoRotate,
  }: Props = $props()

  const geometry = new SphereGeometry(2, 128, 64)
  let mesh = $state<Mesh | undefined>(undefined)
  let material = $state<ShaderMaterial | undefined>(undefined)
  let colorTexture = $state<Texture | undefined>(undefined)
  const { renderer, scene } = useThrelte()
  scene.background = new Color('#030005')
  const limbColor = $derived(new Color(...(starPalettes[palette] ?? starPalettes.Orange)[2]))
  const surfaceUniforms = {
    uMap: { value: null },
    uLimbColor: { value: new Color('#ffffff') },
    uLimbIntensity: { value: 0 },
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
    context.putImageData(new ImageData(new Uint8ClampedArray(flipRows(pixels, target.width, target.height)), target.width, target.height), 0, 0)
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
      seed,
      1024,
      textureScale,
      bandContrast,
      bandSwirl,
      granularity,
      turbulence,
      convection,
      sunspotCount,
      sunspotScale,
      sunspotJaggedness,
      sunspotNeighbours,
      brightness,
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

  useTask((delta) => {
    if (mesh && autoRotate) mesh.rotation.y += delta * 0.07
  })

  onDestroy(() => geometry.dispose())
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