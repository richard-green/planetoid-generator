<script lang="ts">
  import { T, useTask, useThrelte } from '@threlte/core'
  import {
    BufferGeometry,
    Color,
    Float32BufferAttribute,
    IcosahedronGeometry,
    MathUtils,
    Mesh,
    MeshBasicMaterial,
    MeshStandardMaterial,
    PerspectiveCamera,
    Vector3,
    WebGLRenderTarget,
    type Texture,
  } from 'three'
  import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
  import { onDestroy } from 'svelte'
  import { AllPalettes, type AnyPaletteName } from './AllPalettes'
  import { MaxValues, MinValues } from './PlanetoidSettings'
  import {
    createPlanetoidBumpTexture,
    createPlanetoidColourTexture,
    createPlanetoidPaletteGradientTexture,
    createPlanetoidRayMaskTexture,
    disposeGeneratedTexture,
  } from './PlanetoidGpuTextures'
  import { SvelteMap } from 'svelte/reactivity'

  type Props = {
    viewMode?: 'mesh' | 'bump' | 'texture' | 'ray'
    palette?: AnyPaletteName
    surfaceTint?: string
    colorScale?: number
    tintShadowFloor?: number
    swirliness?: number
    seed?: number
    largeScale?: number
    mediumScale?: number
    smallScale?: number
    bumpScale?: number
    enableCraters?: boolean
    craterCount?: number
    craterStrength?: number
    craterColorStrength?: number
    enableVolcanoes?: boolean
    volcanoCount?: number
    volcanoScale?: number
    volcanoStrength?: number
    volcanoColorStrength?: number
    ridgeColorWeight?: number
    riftColorWeight?: number
    craterRayStrength?: number
    craterRayVisibility?: number
    craterRayDensity?: number
    craterRaySharpness?: number
    craterRayLengthPower?: number
    enableRidges?: boolean
    enableRifts?: boolean
    ridgeStrength?: number
    ridgeScale?: number
    ridgeSharpness?: number
    riftStrength?: number
    riftScale?: number
    riftWidth?: number
    riftSharpness?: number
    ridgesRiftsBlend?: number
    roughness?: number
    metalness?: number
    autoRotate?: boolean
    showDebugMeshes?: boolean
    enableLimbBumpFix?: boolean
    triangleDetail?: number
    bumpTextureSize?: number
    colorTextureSize?: number
  }

  let {
    viewMode = 'mesh',
    palette = 'rocky',
    surfaceTint = '#05a0aa',
    colorScale = 1.75,
    tintShadowFloor = 0.18,
    swirliness = 1,
    seed = 12345,
    largeScale = 0.32,
    mediumScale = 0.1,
    smallScale = 0.15,
    bumpScale = 0.82,
    enableCraters = true,
    craterCount = 50,
    craterStrength = 5,
    craterColorStrength = 1.25,
    enableVolcanoes = false,
    volcanoCount = 10,
    volcanoScale = 1,
    volcanoStrength = 1,
    volcanoColorStrength = 0.75,
    ridgeColorWeight = 0.35,
    riftColorWeight = 0.35,
    craterRayStrength = 2,
    craterRayVisibility = 1,
    craterRayDensity = 1,
    craterRaySharpness = 1,
    craterRayLengthPower = 2.8,
    enableRidges = false,
    enableRifts = false,
    ridgeStrength = 0.5,
    ridgeScale = 2.2,
    ridgeSharpness = 1.6,
    riftStrength = 0.4,
    riftScale = 3.4,
    riftWidth = 0.09,
    riftSharpness = 2,
    ridgesRiftsBlend = 0.55,
    roughness = 0.92,
    metalness = 0.02,
    autoRotate = false,
    showDebugMeshes = true,
    enableLimbBumpFix = true,
    triangleDetail = 20,
    bumpTextureSize = 800,
    colorTextureSize = 256,
  }: Props = $props()

  let mesh = $state<Mesh | undefined>(undefined)
  let mapPreviewMesh = $state<Mesh | undefined>(undefined)
  let material = $state<MeshStandardMaterial | undefined>(undefined)
  let mapPreviewMaterial = $state<MeshBasicMaterial | undefined>(undefined)
  let bumpDebugMesh = $state<Mesh | undefined>(undefined)
  let colourDebugMesh = $state<Mesh | undefined>(undefined)
  let paletteDebugMesh = $state<Mesh | undefined>(undefined)
  let rayDebugMesh = $state<Mesh | undefined>(undefined)
  let bumpDebugMaterial = $state<MeshBasicMaterial | undefined>(undefined)
  let colourDebugMaterial = $state<MeshBasicMaterial | undefined>(undefined)
  let paletteDebugMaterial = $state<MeshBasicMaterial | undefined>(undefined)
  let rayDebugMaterial = $state<MeshBasicMaterial | undefined>(undefined)
  let bumpDebugTexture = $state<ReturnType<typeof createPlanetoidBumpTexture> | undefined>(
    undefined
  )
  let colourDebugTexture = $state<ReturnType<typeof createPlanetoidColourTexture> | undefined>(
    undefined
  )
  let paletteDebugTexture = $state<
    ReturnType<typeof createPlanetoidPaletteGradientTexture> | undefined
  >(undefined)
  let rayDebugTexture = $state<ReturnType<typeof createPlanetoidRayMaskTexture> | undefined>(
    undefined
  )
  let color = $derived(new Color('#ffffff'))

  const { camera, size, renderer } = useThrelte()

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

  function downloadRenderTexture(texture: Texture | null | undefined, fileName: string) {
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
    return triggerPngDownload(width, height, flipped, fileName)
  }

  export async function downloadTextureMapPng(fileName = 'planetoid-texture-map.png') {
    const colorMap = (material?.map as Texture | null | undefined) ?? colourDebugTexture
    return downloadRenderTexture(colorMap, fileName)
  }

  export async function downloadBumpMapPng(fileName = 'planetoid-bump-map.png') {
    const bumpMap = (material?.bumpMap as Texture | null | undefined) ?? bumpDebugTexture
    return downloadRenderTexture(bumpMap, fileName)
  }

  function applySphericalUVs(geometry: BufferGeometry) {
    const position = geometry.attributes.position
    const uv = new Float32Array(position.count * 2)
    const vertex = new Vector3()

    for (let i = 0; i < position.count; i += 3) {
      let u0 = 0
      let u1 = 0
      let u2 = 0
      let v0 = 0
      let v1 = 0
      let v2 = 0

      vertex.fromBufferAttribute(position, i).normalize()
      u0 = 0.5 + Math.atan2(vertex.z, vertex.x) / (Math.PI * 2)
      v0 = 0.5 - Math.asin(MathUtils.clamp(vertex.y, -1, 1)) / Math.PI

      vertex.fromBufferAttribute(position, i + 1).normalize()
      u1 = 0.5 + Math.atan2(vertex.z, vertex.x) / (Math.PI * 2)
      v1 = 0.5 - Math.asin(MathUtils.clamp(vertex.y, -1, 1)) / Math.PI

      vertex.fromBufferAttribute(position, i + 2).normalize()
      u2 = 0.5 + Math.atan2(vertex.z, vertex.x) / (Math.PI * 2)
      v2 = 0.5 - Math.asin(MathUtils.clamp(vertex.y, -1, 1)) / Math.PI

      const maxU = Math.max(u0, u1, u2)
      const minU = Math.min(u0, u1, u2)

      // If a triangle crosses the seam, push low-U vertices into the next repeat
      // so interpolation stays local instead of stretching across the texture.
      if (maxU - minU > 0.5) {
        if (u0 < 0.5) u0 += 1
        if (u1 < 0.5) u1 += 1
        if (u2 < 0.5) u2 += 1
      }

      const uvIndex0 = i * 2
      const uvIndex1 = (i + 1) * 2
      const uvIndex2 = (i + 2) * 2

      uv[uvIndex0] = u0
      uv[uvIndex0 + 1] = v0
      uv[uvIndex1] = u1
      uv[uvIndex1 + 1] = v1
      uv[uvIndex2] = u2
      uv[uvIndex2 + 1] = v2
    }

    geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
  }

  function createIcosphere(detail: number) {
    const clampedDetail = Math.max(
      MinValues.triangleDetail,
      Math.min(MaxValues.triangleDetail, Math.round(detail))
    )
    const indexedGeometry = new IcosahedronGeometry(2, clampedDetail)
    const rawGeometry = indexedGeometry.index ? indexedGeometry.toNonIndexed() : indexedGeometry

    if (indexedGeometry !== rawGeometry) {
      indexedGeometry.dispose()
    }

    applySphericalUVs(rawGeometry)

    // Merge duplicate vertices so normals can be smooth between faces.
    const smoothGeometry = mergeVertices(rawGeometry)
    rawGeometry.dispose()

    return smoothGeometry
  }

  function copyPositionArray(source: BufferGeometry) {
    return Float32Array.from(source.attributes.position.array as ArrayLike<number>)
  }

  const initialGeometry = createIcosphere(5)
  let geometry = $state<BufferGeometry>(initialGeometry)
  let basePositions = $state<Float32Array>(copyPositionArray(initialGeometry))
  let normalWeldGroups = $state<number[][]>(
    buildNormalWeldGroups(copyPositionArray(initialGeometry))
  )
  let disposableGeometry: BufferGeometry = initialGeometry

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
    const detail = triangleDetail
    const nextGeometry = createIcosphere(detail)
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
      potatoLobes: [
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

  function deformGeometry(
    targetGeometry: BufferGeometry,
    sourcePositions: Float32Array,
    weldGroups: number[][],
    shape: {
      noiseOffset: { x: number; y: number; z: number }
      potatoLobes: Array<{ direction: Vector3; frequency: number; phase: number; weight: number }>
    },
    potatoScale: number,
    broadScale: number,
    fineScale: number
  ) {
    const position = targetGeometry.attributes.position
    const vertex = new Vector3()

    position.array.set(sourcePositions)

    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i)

      const direction = vertex.clone().normalize()

      // Broad surface breakup.
      const broad = fractalNoise(
        direction.x * 1.4 + shape.noiseOffset.x,
        direction.y * 1.4 + shape.noiseOffset.y,
        direction.z * 1.4 + shape.noiseOffset.z
      )

      // Finer surface breakup.
      const fine = fractalNoise(
        direction.x * 3.0 + shape.noiseOffset.x,
        direction.y * 3.0 + shape.noiseOffset.y,
        direction.z * 3.0 + shape.noiseOffset.z
      )

      let potato = 0
      for (const lobe of shape.potatoLobes) {
        const projection = direction.dot(lobe.direction)
        potato += Math.sin(projection * lobe.frequency + lobe.phase) * lobe.weight
      }

      // Scale mapping:
      // largeScale -> global silhouette (potato)
      // mediumScale -> broad breakup
      // smallScale -> fine breakup
      const displacement = potato * potatoScale + broad * broadScale + fine * fineScale

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
    const potatoScale = largeScale
    const broadScale = mediumScale
    const fineScale = smallScale

    deformGeometry(
      targetGeometry,
      sourcePositions,
      weldGroups,
      shape,
      potatoScale,
      broadScale,
      fineScale
    )
  })

  $effect(() => {
    if (!renderer) return

    const shape = shapeParameters
    const planetoidPalette = AllPalettes[palette]
    const textureScale = colorScale
    const currentCraterCount = craterCount
    const currentCraterColorStrength = craterColorStrength
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
    const currentRidgeScale = ridgeScale
    const currentRidgeSharpness = ridgeSharpness
    const currentRiftStrength = riftStrength
    const currentRiftScale = riftScale
    const currentRiftWidth = riftWidth
    const currentRiftSharpness = riftSharpness
    const currentRidgesRiftsBlend = ridgesRiftsBlend
    const currentCraterRayStrength = craterRayStrength
    const currentCraterRayVisibility = craterRayVisibility
    const currentCraterRayDensity = craterRayDensity
    const currentCraterRaySharpness = craterRaySharpness
    const currentCraterRayLengthPower = craterRayLengthPower
    const currentTintShadowFloor = tintShadowFloor
    const currentSwirliness = swirliness

    const colourTexture = createPlanetoidColourTexture(
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
        craterColorStrength: currentCraterColorStrength,
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
        ridgeScale: currentRidgeScale,
        ridgeSharpness: currentRidgeSharpness,
        riftStrength: currentRiftStrength,
        riftScale: currentRiftScale,
        riftWidth: currentRiftWidth,
        riftSharpness: currentRiftSharpness,
        ridgesRiftsBlend: currentRidgesRiftsBlend,
        craterRayStrength: currentCraterRayStrength,
        craterRayVisibility: currentCraterRayVisibility,
        craterRayDensity: currentCraterRayDensity,
        craterRaySharpness: currentCraterRaySharpness,
        craterRayLengthPower: currentCraterRayLengthPower,
      }
    )

    colourDebugTexture = colourTexture
    if (material) {
      material.map = colourTexture
      material.needsUpdate = true
    }
    if (colourDebugMaterial) {
      colourDebugMaterial.map = colourTexture
      colourDebugMaterial.needsUpdate = true
    }

    return () => {
      if (colourDebugTexture === colourTexture) {
        colourDebugTexture = undefined
      }
      disposeGeneratedTexture(colourTexture)
    }
  })

  $effect(() => {
    if (!renderer) return

    const needsRayTexture = showDebugMeshes || viewMode === 'ray'

    if (!needsRayTexture) {
      if (paletteDebugMaterial) {
        paletteDebugMaterial.map = null
        paletteDebugMaterial.needsUpdate = true
      }
      if (rayDebugMaterial) {
        rayDebugMaterial.map = null
        rayDebugMaterial.needsUpdate = true
      }
      return
    }

    const shape = shapeParameters
    const textureSize = colorTextureSize
    const currentCraterCount = craterCount
    const currentCraterRayDensity = craterRayDensity
    const currentCraterRaySharpness = craterRaySharpness
    const currentCraterRayLengthPower = craterRayLengthPower

    const rayTexture = createPlanetoidRayMaskTexture(
      renderer,
      shape.noiseOffset,
      textureSize,
      currentCraterCount,
      {
        craterRayDensity: currentCraterRayDensity,
        craterRaySharpness: currentCraterRaySharpness,
        craterRayLengthPower: currentCraterRayLengthPower,
      }
    )

    rayDebugTexture = rayTexture
    if (rayDebugMaterial) {
      rayDebugMaterial.map = rayTexture
      rayDebugMaterial.needsUpdate = true
    }

    return () => {
      if (rayDebugTexture === rayTexture) {
        rayDebugTexture = undefined
      }
      disposeGeneratedTexture(rayTexture)
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

    const planetoidPalette = AllPalettes[palette]
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

    if (viewMode === 'bump') {
      mapPreviewMaterial.map =
        bumpDebugTexture ?? (material?.bumpMap as Texture | null | undefined) ?? null
    } else if (viewMode === 'texture') {
      mapPreviewMaterial.map =
        colourDebugTexture ?? (material?.map as Texture | null | undefined) ?? null
    } else if (viewMode === 'ray') {
      mapPreviewMaterial.map = rayDebugTexture ?? null
    } else {
      mapPreviewMaterial.map = null
    }

    mapPreviewMaterial.needsUpdate = true
  })

  $effect(() => {
    if (!renderer) return

    const shape = shapeParameters
    const textureSize = bumpTextureSize
    const currentBumpScale = bumpScale
    const currentEnableCraters = enableCraters
    const currentCraterCount = craterCount
    const currentCraterStrength = craterStrength
    const volcanoesEnabled = enableVolcanoes
    const currentVolcanoCount = volcanoCount
    const currentVolcanoScale = volcanoScale
    const currentVolcanoStrength = volcanoStrength
    const ridgesEnabled = enableRidges
    const riftsEnabled = enableRifts
    const currentRidgeStrength = ridgeStrength
    const currentRidgeScale = ridgeScale
    const currentRidgeSharpness = ridgeSharpness
    const currentRiftStrength = riftStrength
    const currentRiftScale = riftScale
    const currentRiftWidth = riftWidth
    const currentRiftSharpness = riftSharpness
    const currentRidgesRiftsBlend = ridgesRiftsBlend
    const currentSwirliness = swirliness

    const bumpTexture = createPlanetoidBumpTexture(renderer, shape.noiseOffset, textureSize, {
      craterCount: currentCraterCount,
      craterStrength: currentCraterStrength,
      enableCraters: currentEnableCraters,
      enableVolcanoes: volcanoesEnabled,
      volcanoCount: currentVolcanoCount,
      volcanoScale: currentVolcanoScale,
      volcanoStrength: currentVolcanoStrength,
      enableRidges: ridgesEnabled,
      enableRifts: riftsEnabled,
      ridgeStrength: currentRidgeStrength,
      ridgeScale: currentRidgeScale,
      ridgeSharpness: currentRidgeSharpness,
      riftStrength: currentRiftStrength,
      riftScale: currentRiftScale,
      riftWidth: currentRiftWidth,
      riftSharpness: currentRiftSharpness,
      ridgesRiftsBlend: currentRidgesRiftsBlend,
      swirliness: currentSwirliness,
    })

    bumpDebugTexture = bumpTexture
    if (material) {
      material.bumpMap = bumpTexture
      // Safer artifact reduction: lower bump influence to reduce grazing-angle sparkle.
      material.bumpScale = enableLimbBumpFix ? currentBumpScale * 0.55 : currentBumpScale
      material.needsUpdate = true
    }
    if (bumpDebugMaterial) {
      bumpDebugMaterial.map = bumpTexture
      bumpDebugMaterial.needsUpdate = true
    }

    return () => {
      if (bumpDebugTexture === bumpTexture) {
        bumpDebugTexture = undefined
      }
      disposeGeneratedTexture(bumpTexture)
    }
  })

  useTask(() => {
    if (
      !showDebugMeshes ||
      !bumpDebugMesh ||
      !colourDebugMesh ||
      !paletteDebugMesh ||
      !rayDebugMesh
    )
      return

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

    bumpDebugMesh.position
      .copy(center)
      .add(right.clone().multiplyScalar(leftX))
      .add(up.clone().multiplyScalar(topY))

    colourDebugMesh.position
      .copy(center)
      .add(right.clone().multiplyScalar(rightX))
      .add(up.clone().multiplyScalar(topY))

    rayDebugMesh.position
      .copy(center)
      .add(right.clone().multiplyScalar(rightX))
      .add(up.clone().multiplyScalar(bottomY))

    paletteDebugMesh.position
      .copy(center)
      .add(right.clone().multiplyScalar(leftX))
      .add(up.clone().multiplyScalar(bottomY))

    bumpDebugMesh.quaternion.copy(perspectiveCamera.quaternion)
    colourDebugMesh.quaternion.copy(perspectiveCamera.quaternion)
    paletteDebugMesh.quaternion.copy(perspectiveCamera.quaternion)
    rayDebugMesh.quaternion.copy(perspectiveCamera.quaternion)
  })

  onDestroy(() => {
    geometry.dispose()
  })

  useTask((delta) => {
    if (!autoRotate || !mesh) return

    mesh.rotation.y += delta * 0.2
    mesh.rotation.x += delta * 0.12
  })

  const debugScale = 0.5
</script>

{#if viewMode === 'mesh'}
  <T.Mesh bind:ref={mesh} {geometry} rotation={[0, 0, 0]}>
    <T.MeshStandardMaterial bind:ref={material} {color} {roughness} {metalness} />
  </T.Mesh>
{:else}
  <T.Mesh bind:ref={mapPreviewMesh} scale={[3.8, 3.8, 1]} renderOrder={10}>
    <T.PlaneGeometry args={[1.8, 0.9]} />
    <T.MeshBasicMaterial bind:ref={mapPreviewMaterial} toneMapped={false} />
  </T.Mesh>
{/if}

{#if viewMode === 'mesh' && showDebugMeshes}
  <T.Mesh bind:ref={bumpDebugMesh} scale={[debugScale, debugScale, 1]} renderOrder={999}>
    <T.PlaneGeometry args={[1, 1]} />
    <T.MeshBasicMaterial
      bind:ref={bumpDebugMaterial}
      map={bumpDebugTexture}
      toneMapped={false}
      depthTest={false}
      depthWrite={false}
    />
  </T.Mesh>

  <T.Mesh bind:ref={colourDebugMesh} scale={[debugScale, debugScale, 1]} renderOrder={999}>
    <T.PlaneGeometry args={[1, 1]} />
    <T.MeshBasicMaterial
      bind:ref={colourDebugMaterial}
      map={colourDebugTexture}
      toneMapped={false}
      depthTest={false}
      depthWrite={false}
    />
  </T.Mesh>

  <T.Mesh bind:ref={rayDebugMesh} scale={[debugScale, debugScale, 1]} renderOrder={999}>
    <T.PlaneGeometry args={[1, 1]} />
    <T.MeshBasicMaterial
      bind:ref={rayDebugMaterial}
      map={rayDebugTexture}
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
