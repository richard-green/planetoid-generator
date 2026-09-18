<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core'
  import {
    BufferGeometry,
    Color,
    MathUtils,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    PerspectiveCamera,
    Vector2,
    Vector3,
    WebGLRenderTarget,
    type Texture,
  } from 'three'
  import { onDestroy } from 'svelte'
  import { createIcosphere } from '../../../utils/geometry'
  import {
    MaxValues,
    MinValues,
    type PlanetoidSettings,
    type PlanetoidViewMode,
  } from './PlanetoidSettings'
  import {
    createPlanetoidColorTexture,
    createPlanetoidNormalTexture,
    createPlanetoidPaletteGradientTexture,
    disposeGeneratedTexture,
  } from './PlanetoidGpuTextures'
  import { SvelteMap } from 'svelte/reactivity'
  import { PlanetoidPalettes } from './PlanetoidPalettes'

  type Props = {
    settings: PlanetoidSettings & { viewMode: PlanetoidViewMode }
  }

  let { settings }: Props = $props()

  let {
    viewMode,
    palette,
    surfaceTint,
    colorScale,
    tintShadowFloor,
    swirliness,
    seed,
    largeScale,
    mediumScale,
    smallScale,
    mediumFrequency,
    smallFrequency,
    normalStrength,
    enableCraters,
    craterCount,
    craterScale,
    craterStrength,
    craterSharpness,
    craterColorStrength,
    enableVolcanoes,
    volcanoCount,
    volcanoScale,
    volcanoStrength,
    volcanoColorStrength,
    ridgeColorWeight,
    riftColorWeight,
    enableRidges,
    enableRifts,
    ridgeStrength,
    ridgeFrequency,
    ridgeSharpness,
    riftStrength,
    riftFrequency,
    riftWidth,
    riftSharpness,
    ridgesRiftsBlend,
    roughness,
    metalness,
    autoRotate,
    showDebugMeshes,
    triangleDetail,
    normalTextureSize,
    colorTextureSize,
  } = $derived(settings)

  let mesh = $state<Mesh | undefined>(undefined)
  let mapPreviewMesh = $state<Mesh | undefined>(undefined)
  let material = $state<MeshStandardMaterial | undefined>(undefined)
  let mapPreviewMaterial = $state<MeshBasicMaterial | undefined>(undefined)
  let normalDebugMesh = $state<Mesh | undefined>(undefined)
  let colorDebugMesh = $state<Mesh | undefined>(undefined)
  let paletteDebugMesh = $state<Mesh | undefined>(undefined)
  let normalDebugMaterial = $state<MeshBasicMaterial | undefined>(undefined)
  let colorDebugMaterial = $state<MeshBasicMaterial | undefined>(undefined)
  let paletteDebugMaterial = $state<MeshBasicMaterial | undefined>(undefined)
  let normalDebugTexture = $state<ReturnType<typeof createPlanetoidNormalTexture> | undefined>(
    undefined
  )
  let colorDebugTexture = $state<ReturnType<typeof createPlanetoidColorTexture> | undefined>(
    undefined
  )
  let paletteDebugTexture = $state<
    ReturnType<typeof createPlanetoidPaletteGradientTexture> | undefined
  >(undefined)
  let color = $derived(new Color('#ffffff'))
  const initialGeometry = createIcosphere(2, 5)
  let geometry = $state<BufferGeometry>(initialGeometry)
  let basePositions = $state<Float32Array>(copyPositionArray(initialGeometry))
  let normalWeldGroups = $state<number[][]>(
    buildNormalWeldGroups(copyPositionArray(initialGeometry))
  )
  let disposableGeometry: BufferGeometry = initialGeometry
  let massCentre = $state(new Vector3())

  const { camera, size, renderer } = useThrelte()

  function linearToSrgbChannel(channel: number) {
    const x = MathUtils.clamp(channel / 255, 0, 1)
    const srgb = x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055
    return Math.round(MathUtils.clamp(srgb, 0, 1) * 255)
  }

  function convertPixelsLinearToSrgb(pixels: Uint8Array) {
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = linearToSrgbChannel(pixels[i])
      pixels[i + 1] = linearToSrgbChannel(pixels[i + 1])
      pixels[i + 2] = linearToSrgbChannel(pixels[i + 2])
    }

    return pixels
  }

  function flipRowsRgba(source: Uint8Array, width: number, height: number) {
    const rowSize = width * 4
    const flipped = new Uint8Array(source.length)

    for (let y = 0; y < height; y++) {
      const sourceStart = y * rowSize
      const targetStart = (height - 1 - y) * rowSize
      flipped.set(source.subarray(sourceStart, sourceStart + rowSize), targetStart)
    }

    return flipped
  }

  function triggerPngDownload(
    width: number,
    height: number,
    rgbaPixels: Uint8Array,
    fileName: string
  ) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) return false

    const imageData = new ImageData(new Uint8ClampedArray(rgbaPixels), width, height)
    context.putImageData(imageData, 0, 0)

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = fileName
    link.click()

    return true
  }

  function downloadRenderTexture(
    texture: Texture | null | undefined,
    fileName: string,
    options: { convertLinearToSrgb?: boolean } = {}
  ) {
    if (!renderer || !texture) return false

    const renderTarget = texture.userData.renderTarget as WebGLRenderTarget | undefined
    if (!renderTarget) return false

    const width = renderTarget.width
    const height = renderTarget.height
    const pixels = new Uint8Array(width * height * 4)
    const previousTarget = renderer.getRenderTarget()

    try {
      renderer.setRenderTarget(renderTarget)
      renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, pixels)
    } catch (error) {
      console.error('Failed to read render target pixels', error)
      return false
    } finally {
      renderer.setRenderTarget(previousTarget)
    }

    const flipped = flipRowsRgba(pixels, width, height)
    const converted = options.convertLinearToSrgb ? convertPixelsLinearToSrgb(flipped) : flipped
    return triggerPngDownload(width, height, converted, fileName)
  }

  export async function downloadTextureMapPng(fileName = 'planetoid-texture-map.png') {
    const colorMap = (material?.map as Texture | null | undefined) ?? colorDebugTexture
    return downloadRenderTexture(colorMap, fileName, { convertLinearToSrgb: true })
  }

  export async function downloadNormalMapPng(fileName = 'planetoid-normal-map.png') {
    const normalMap = (material?.normalMap as Texture | null | undefined) ?? normalDebugTexture
    return downloadRenderTexture(normalMap, fileName, { convertLinearToSrgb: true })
  }

  function clampTriangleDetail(detail: number) {
    const clampedDetail = Math.max(
      MinValues.triangleDetail,
      Math.min(MaxValues.triangleDetail, Math.round(detail))
    )
    return clampedDetail
  }

  function copyPositionArray(source: BufferGeometry) {
    return Float32Array.from(source.attributes.position.array as ArrayLike<number>)
  }

  function buildNormalWeldGroups(sourcePositions: Float32Array) {
    const groups = new SvelteMap<string, number[]>()

    for (let i = 0; i < sourcePositions.length; i += 3) {
      const vertexIndex = i / 3
      const x = sourcePositions[i]
      const y = sourcePositions[i + 1]
      const z = sourcePositions[i + 2]

      // Stable key to group vertices that share the same position but differ in UV.
      const key = `${x.toFixed(6)}|${y.toFixed(6)}|${z.toFixed(6)}`
      const existing = groups.get(key)

      if (existing) {
        existing.push(vertexIndex)
      } else {
        groups.set(key, [vertexIndex])
      }
    }

    return Array.from(groups.values()).filter((group) => group.length > 1)
  }

  $effect(() => {
    const detail = clampTriangleDetail(triangleDetail)
    const nextGeometry = createIcosphere(2, detail)
    const nextBasePositions = copyPositionArray(nextGeometry)
    const previousGeometry = disposableGeometry

    disposableGeometry = nextGeometry
    geometry = nextGeometry
    basePositions = nextBasePositions
    normalWeldGroups = buildNormalWeldGroups(nextBasePositions)
    previousGeometry.dispose()
  })

  function createRandom(initialSeed: number) {
    let state = initialSeed | 0

    return () => {
      state = (state + 0x6d2b79f5) | 0

      let t = Math.imul(state ^ (state >>> 15), 1 | state)

      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)

      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  function randomUnitVector(random: () => number) {
    const z = random() * 2 - 1
    const theta = random() * Math.PI * 2
    const r = Math.sqrt(Math.max(0, 1 - z * z))

    return new Vector3(r * Math.cos(theta), z, r * Math.sin(theta))
  }

  const shapeParameters = $derived.by(() => {
    const random = createRandom(seed)

    return {
      noiseOffset: {
        x: random() * 1000,
        y: random() * 1000,
        z: random() * 1000,
      },
      lobes: [
        {
          direction: randomUnitVector(random),
          frequency: 1.2 + random() * 1.8,
          phase: random() * Math.PI * 2,
          weight: 0.55,
        },
        {
          direction: randomUnitVector(random),
          frequency: 1.8 + random() * 1.6,
          phase: random() * Math.PI * 2,
          weight: 0.3,
        },
        {
          direction: randomUnitVector(random),
          frequency: 2.0 + random() * 1.4,
          phase: random() * Math.PI * 2,
          weight: 0.15,
        },
      ],
    }
  })

  // Simple multi-frequency noise.
  // This isn't intended to be a physically accurate noise implementation;
  // it is sufficient for generating planetoid-like variation.
  function noise3(x: number, y: number, z: number) {
    const n =
      Math.sin(x * 3.1 + Math.sin(y * 4.7)) *
      Math.sin(y * 2.7 + Math.sin(z * 3.3)) *
      Math.sin(z * 4.1 + Math.sin(x * 2.9))

    return n
  }

  function fractalNoise(x: number, y: number, z: number) {
    let value = 0
    let amplitude = 1
    let frequency = 1
    let total = 0

    for (let i = 0; i < 5; i++) {
      value += noise3(x * frequency, y * frequency, z * frequency) * amplitude

      total += amplitude
      amplitude *= 0.5
      frequency *= 2.0
    }

    return value / total
  }

  function centreOfMass(targetGeometry: BufferGeometry): Vector3 {
    const position = targetGeometry.attributes.position
    const vertex = new Vector3()
    let minX: number = 0
    let minY: number = 0
    let minZ: number = 0
    let maxX: number = 0
    let maxY: number = 0
    let maxZ: number = 0

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i)
      minX = Math.min(vertex.x, minX)
      minY = Math.min(vertex.y, minY)
      minZ = Math.min(vertex.z, minZ)
      maxX = Math.max(vertex.x, maxX)
      maxY = Math.max(vertex.y, maxY)
      maxZ = Math.max(vertex.z, maxZ)
    }

    return new Vector3((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2)
  }

  function deformGeometry(
    targetGeometry: BufferGeometry,
    sourcePositions: Float32Array,
    weldGroups: number[][],
    shape: {
      noiseOffset: { x: number; y: number; z: number }
      lobes: Array<{ direction: Vector3; frequency: number; phase: number; weight: number }>
    },
    largeScale: number,
    mediumScale: number,
    smallScale: number,
    mediumFrequency: number,
    smallFrequency: number
  ) {
    const position = targetGeometry.attributes.position
    const vertex = new Vector3()

    position.array.set(sourcePositions)

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i)

      const direction = vertex.clone().normalize()

      // Broad surface breakup.
      const medium = fractalNoise(
        direction.x * mediumFrequency + shape.noiseOffset.x,
        direction.y * mediumFrequency + shape.noiseOffset.y,
        direction.z * mediumFrequency + shape.noiseOffset.z
      )

      // Finer surface breakup.
      const small = fractalNoise(
        direction.x * smallFrequency + shape.noiseOffset.x,
        direction.y * smallFrequency + shape.noiseOffset.y,
        direction.z * smallFrequency + shape.noiseOffset.z
      )

      let large = 0
      for (const lobe of shape.lobes) {
        const projection = direction.dot(lobe.direction)
        large += Math.sin(projection * lobe.frequency + lobe.phase) * lobe.weight
      }

      // Scale mapping:
      // largeScale -> lobes
      // mediumScale -> broad breakup
      // smallScale -> fine breakup
      const displacement = large * largeScale + medium * mediumScale + small * smallScale

      vertex.copy(direction).multiplyScalar(2 + displacement)

      position.setXYZ(i, vertex.x, vertex.y, vertex.z)
    }

    position.needsUpdate = true
    targetGeometry.computeVertexNormals()

    const normal = targetGeometry.attributes.normal

    for (const group of weldGroups) {
      let nx = 0
      let ny = 0
      let nz = 0

      for (const index of group) {
        const offset = index * 3
        nx += normal.array[offset]
        ny += normal.array[offset + 1]
        nz += normal.array[offset + 2]
      }

      const length = Math.hypot(nx, ny, nz)
      if (length === 0) continue

      nx /= length
      ny /= length
      nz /= length

      for (const index of group) {
        const offset = index * 3
        normal.array[offset] = nx
        normal.array[offset + 1] = ny
        normal.array[offset + 2] = nz
      }
    }

    normal.needsUpdate = true
  }

  $effect(() => {
    const targetGeometry = geometry
    const sourcePositions = basePositions
    const weldGroups = normalWeldGroups
    const shape = shapeParameters

    deformGeometry(
      targetGeometry,
      sourcePositions,
      weldGroups,
      shape,
      largeScale,
      mediumScale,
      smallScale,
      mediumFrequency,
      smallFrequency
    )

    massCentre = centreOfMass(geometry)
  })

  $effect(() => {
    if (!renderer) return

    const shape = shapeParameters
    const planetoidPalette = PlanetoidPalettes[palette]
    const textureScale = colorScale
    const currentCraterCount = craterCount
    const currentCraterScale = craterScale
    const currentCraterColorStrength = craterColorStrength
    const currentCraterSharpness = craterSharpness
    const currentEnableCraters = enableCraters
    const volcanoesEnabled = enableVolcanoes
    const currentVolcanoCount = volcanoCount
    const currentVolcanoScale = volcanoScale
    const currentVolcanoStrength = volcanoStrength
    const currentVolcanoColorStrength = volcanoColorStrength
    const currentRidgeColorWeight = ridgeColorWeight
    const currentRiftColorWeight = riftColorWeight
    const ridgesEnabled = enableRidges
    const riftsEnabled = enableRifts
    const currentRidgeStrength = ridgeStrength
    const currentRidgeFrequency = ridgeFrequency
    const currentRidgeSharpness = ridgeSharpness
    const currentRiftStrength = riftStrength
    const currentRiftFrequency = riftFrequency
    const currentRiftWidth = riftWidth
    const currentRiftSharpness = riftSharpness
    const currentRidgesRiftsBlend = ridgesRiftsBlend
    const currentTintShadowFloor = tintShadowFloor
    const currentSwirliness = swirliness

    const colorTexture = createPlanetoidColorTexture(
      renderer,
      shape.noiseOffset,
      planetoidPalette,
      textureScale,
      colorTextureSize,
      {
        surfaceTint,
        tintShadowFloor: currentTintShadowFloor,
        swirliness: currentSwirliness,
        craterCount: currentCraterCount,
        craterScale: currentCraterScale,
        craterColorStrength: currentCraterColorStrength,
        craterSharpness: currentCraterSharpness,
        enableCraters: currentEnableCraters,
        enableVolcanoes: volcanoesEnabled,
        volcanoCount: currentVolcanoCount,
        volcanoScale: currentVolcanoScale,
        volcanoStrength: currentVolcanoStrength,
        volcanoColorStrength: currentVolcanoColorStrength,
        ridgeColorWeight: currentRidgeColorWeight,
        riftColorWeight: currentRiftColorWeight,
        enableRidges: ridgesEnabled,
        enableRifts: riftsEnabled,
        ridgeStrength: currentRidgeStrength,
        ridgeFrequency: currentRidgeFrequency,
        ridgeSharpness: currentRidgeSharpness,
        riftStrength: currentRiftStrength,
        riftFrequency: currentRiftFrequency,
        riftWidth: currentRiftWidth,
        riftSharpness: currentRiftSharpness,
        ridgesRiftsBlend: currentRidgesRiftsBlend,
      }
    )

    colorDebugTexture = colorTexture
    if (material) {
      material.map = colorTexture
      material.needsUpdate = true
    }
    if (colorDebugMaterial) {
      colorDebugMaterial.map = colorTexture
      colorDebugMaterial.needsUpdate = true
    }

    return () => {
      if (colorDebugTexture === colorTexture) {
        colorDebugTexture = undefined
      }
      disposeGeneratedTexture(colorTexture)
    }
  })

  $effect(() => {
    if (!renderer) return

    if (!showDebugMeshes) {
      if (paletteDebugMaterial) {
        paletteDebugMaterial.map = null
        paletteDebugMaterial.needsUpdate = true
      }
      return
    }

    const planetoidPalette = PlanetoidPalettes[palette]
    const gradientWidth = Math.max(64, colorTextureSize * 2)
    const gradientHeight = Math.max(8, Math.floor(colorTextureSize * 0.2))

    const paletteTexture = createPlanetoidPaletteGradientTexture(
      renderer,
      planetoidPalette,
      gradientWidth,
      gradientHeight
    )

    paletteDebugTexture = paletteTexture
    if (paletteDebugMaterial) {
      paletteDebugMaterial.map = paletteTexture
      paletteDebugMaterial.needsUpdate = true
    }

    return () => {
      if (paletteDebugTexture === paletteTexture) {
        paletteDebugTexture = undefined
      }
      disposeGeneratedTexture(paletteTexture)
    }
  })

  $effect(() => {
    if (!mapPreviewMaterial) return

    if (viewMode === 'normal') {
      mapPreviewMaterial.map =
        normalDebugTexture ?? (material?.normalMap as Texture | null | undefined) ?? null
    } else if (viewMode === 'texture') {
      mapPreviewMaterial.map =
        colorDebugTexture ?? (material?.map as Texture | null | undefined) ?? null
    } else {
      mapPreviewMaterial.map = null
    }

    mapPreviewMaterial.needsUpdate = true
  })

  $effect(() => {
    if (!renderer) return

    const shape = shapeParameters
    const textureSize = normalTextureSize
    const currentNormalStrength = normalStrength
    const currentEnableCraters = enableCraters
    const currentCraterCount = craterCount
    const currentCraterScale = craterScale
    const currentCraterStrength = craterStrength
    const currentCraterSharpness = craterSharpness
    const volcanoesEnabled = enableVolcanoes
    const currentVolcanoCount = volcanoCount
    const currentVolcanoScale = volcanoScale
    const currentVolcanoStrength = volcanoStrength
    const ridgesEnabled = enableRidges
    const riftsEnabled = enableRifts
    const currentRidgeStrength = ridgeStrength
    const currentRidgeFrequency = ridgeFrequency
    const currentRidgeSharpness = ridgeSharpness
    const currentRiftStrength = riftStrength
    const currentRiftFrequency = riftFrequency
    const currentRiftWidth = riftWidth
    const currentRiftSharpness = riftSharpness
    const currentRidgesRiftsBlend = ridgesRiftsBlend
    const currentSwirliness = swirliness

    const detailOptions = {
      craterCount: currentCraterCount,
      craterScale: currentCraterScale,
      craterStrength: currentCraterStrength,
      craterSharpness: currentCraterSharpness,
      enableCraters: currentEnableCraters,
      enableVolcanoes: volcanoesEnabled,
      volcanoCount: currentVolcanoCount,
      volcanoScale: currentVolcanoScale,
      volcanoStrength: currentVolcanoStrength,
      enableRidges: ridgesEnabled,
      enableRifts: riftsEnabled,
      ridgeStrength: currentRidgeStrength,
      ridgeFrequency: currentRidgeFrequency,
      ridgeSharpness: currentRidgeSharpness,
      riftStrength: currentRiftStrength,
      riftFrequency: currentRiftFrequency,
      riftWidth: currentRiftWidth,
      riftSharpness: currentRiftSharpness,
      ridgesRiftsBlend: currentRidgesRiftsBlend,
      swirliness: currentSwirliness,
    }

    const normalTexture = createPlanetoidNormalTexture(
      renderer,
      shape.noiseOffset,
      textureSize,
      detailOptions
    )
    normalDebugTexture = normalTexture

    if (material) {
      material.bumpMap = null
      material.normalMap = normalTexture
      material.bumpScale = 0
      material.normalScale = new Vector2(currentNormalStrength, currentNormalStrength)
      material.needsUpdate = true
    }
    if (normalDebugMaterial) {
      normalDebugMaterial.map = normalTexture
      normalDebugMaterial.needsUpdate = true
    }

    return () => {
      if (normalDebugTexture === normalTexture) {
        normalDebugTexture = undefined
      }
      disposeGeneratedTexture(normalTexture)
    }
  })

  useTask(() => {
    if (!showDebugMeshes || !normalDebugMesh || !colorDebugMesh || !paletteDebugMesh) return

    const perspectiveCamera = $camera as PerspectiveCamera
    const distance = 2.2
    const quadSize = 0.55
    const margin = quadSize * 0.55

    const fovRadians = MathUtils.degToRad(perspectiveCamera.fov)
    const halfHeight = Math.tan(fovRadians / 2) * distance
    const halfWidth = (halfHeight * size.current.width) / size.current.height

    const forward = new Vector3(0, 0, -1).applyQuaternion(perspectiveCamera.quaternion)
    const right = new Vector3(1, 0, 0).applyQuaternion(perspectiveCamera.quaternion)
    const up = new Vector3(0, 1, 0).applyQuaternion(perspectiveCamera.quaternion)
    const center = perspectiveCamera.position.clone().add(forward.multiplyScalar(distance))

    const topY = halfHeight - margin
    const bottomY = -halfHeight + margin
    const leftX = -halfWidth + margin
    const rightX = halfWidth - margin

    normalDebugMesh.position
      .copy(center)
      .add(right.clone().multiplyScalar(leftX))
      .add(up.clone().multiplyScalar(topY))

    colorDebugMesh.position
      .copy(center)
      .add(right.clone().multiplyScalar(rightX))
      .add(up.clone().multiplyScalar(topY))

    paletteDebugMesh.position
      .copy(center)
      .add(right.clone().multiplyScalar(leftX))
      .add(up.clone().multiplyScalar(bottomY))

    normalDebugMesh.quaternion.copy(perspectiveCamera.quaternion)
    colorDebugMesh.quaternion.copy(perspectiveCamera.quaternion)
    paletteDebugMesh.quaternion.copy(perspectiveCamera.quaternion)
  })

  onDestroy(() => {
    geometry.dispose()
  })

  useTask((delta) => {
    if (mesh) {
      mesh.position.x = -massCentre.x
      mesh.position.y = -massCentre.y
      mesh.position.z = -massCentre.z

      if (autoRotate) {
        mesh.rotation.y += delta * 0.18
      }
    }
  })

  const debugScale = 0.5
</script>

{#if viewMode === 'mesh'}
  <T.Mesh bind:ref={mesh} {geometry} rotation={[0, 0, 0]}>
    <T.MeshStandardMaterial bind:ref={material} {color} {roughness} {metalness} />
  </T.Mesh>

  {#if showDebugMeshes}
    <T.Mesh bind:ref={normalDebugMesh} scale={[debugScale, debugScale, 1]} renderOrder={999}>
      <T.PlaneGeometry args={[1, 1]} />
      <T.MeshBasicMaterial
        bind:ref={normalDebugMaterial}
        map={normalDebugTexture}
        toneMapped={false}
        depthTest={false}
        depthWrite={false}
      />
    </T.Mesh>

    <T.Mesh bind:ref={colorDebugMesh} scale={[debugScale, debugScale, 1]} renderOrder={999}>
      <T.PlaneGeometry args={[1, 1]} />
      <T.MeshBasicMaterial
        bind:ref={colorDebugMaterial}
        map={colorDebugTexture}
        toneMapped={false}
        depthTest={false}
        depthWrite={false}
      />
    </T.Mesh>

    <T.Mesh bind:ref={paletteDebugMesh} scale={[debugScale, debugScale, 1]} renderOrder={999}>
      <T.PlaneGeometry args={[1, 1]} />
      <T.MeshBasicMaterial
        bind:ref={paletteDebugMaterial}
        map={paletteDebugTexture}
        toneMapped={false}
        depthTest={false}
        depthWrite={false}
      />
    </T.Mesh>
  {/if}
{:else}
  <T.Mesh bind:ref={mapPreviewMesh} scale={[3.8, 3.8, 1]} renderOrder={10}>
    <T.PlaneGeometry args={[1.8, 0.9]} />
    <T.MeshBasicMaterial bind:ref={mapPreviewMaterial} toneMapped={false} />
  </T.Mesh>
{/if}
