<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { tick } from 'svelte'
  import { WebGLRenderer } from 'three'
  import PlanetoidScene from '../lib/components/Threlte/PlanetoidScene.svelte'
  import type { PlanetoidViewMode } from '../lib/components/Threlte/PlanetoidScene.svelte'
  import {
    PlanetoidPalettes,
    PlanetoidPaletteNames,
    type PlanetoidPaletteName,
  } from '../lib/components/Threlte/Objects/PlanetoidPalettes'
  import {
    DefaultPlanetoidSettings,
    MaxValues,
    MinValues,
    PlanetoidCliFlagByRangeKey,
    PlanetoidCliToggleFlags,
    PlanetoidUiLabels,
    type PlanetoidSettings,
  } from '../lib/components/Threlte/Objects/PlanetoidSettings'
  import { BUILTIN_PRESETS, type PlanetoidPreset } from './planetoid-presets'

  type NumericControlKey = Exclude<
    keyof PlanetoidSettings,
    | 'palette'
    | 'surfaceTint'
    | 'autoRotate'
    | 'showDebugMeshes'
    | 'enableLimbBumpFix'
    | 'enableCraters'
    | 'enableRidges'
    | 'enableRifts'
    | 'enableVolcanoes'
  >

  const PLANETOID_SETTINGS_STORAGE_KEY = 'planetoid-view-settings-v1'
  const PLANETOID_UI_STORAGE_KEY = 'planetoid-view-ui-v1'
  const PLANETOID_PRESETS_STORAGE_KEY = 'planetoid-view-presets-v1'

  type PlanetoidUiState = {
    viewMode: PlanetoidViewMode
    viewModeSectionOpen: boolean
    cratersEnabled: boolean
    volcanoesEnabled: boolean
    ridgesEnabled: boolean
    riftsEnabled: boolean
    colorSettingsSectionOpen: boolean
    textureResolutionSectionOpen: boolean
    materialPropertiesSectionOpen: boolean
    geometryPropertiesSectionOpen: boolean
    craterSectionOpen: boolean
    volcanoSectionOpen: boolean
    ridgeSectionOpen: boolean
    riftSectionOpen: boolean
  }

  const DEFAULT_PLANETOID_SETTINGS: PlanetoidSettings = { ...DefaultPlanetoidSettings }

  const textureControls: Array<{
    label: string
    key: NumericControlKey
    min?: number
    max?: number
    step: string
  }> = [
    {
      label: 'Color scale',
      key: 'colorScale',
      min: MinValues.colorScale,
      max: MaxValues.colorScale,
      step: '0.1',
    },
    {
      label: 'Tint shadow floor',
      key: 'tintShadowFloor',
      min: MinValues.tintShadowFloor,
      max: MaxValues.tintShadowFloor,
      step: '0.01',
    },
    {
      label: 'Swirliness',
      key: 'swirliness',
      min: MinValues.swirliness,
      max: MaxValues.swirliness,
      step: '0.05',
    },
    {
      label: 'Bump scale',
      key: 'bumpScale',
      min: MinValues.bumpScale,
      max: MaxValues.bumpScale,
      step: '0.1',
    },
    {
      label: 'Crater count',
      key: 'craterCount',
      min: MinValues.craterCount,
      max: MaxValues.craterCount,
      step: '1',
    },
    {
      label: 'Crater strength',
      key: 'craterStrength',
      min: MinValues.craterStrength,
      max: MaxValues.craterStrength,
      step: '0.1',
    },
    {
      label: 'Crater color',
      key: 'craterColorStrength',
      min: MinValues.craterColorStrength,
      max: MaxValues.craterColorStrength,
      step: '0.05',
    },
    {
      label: 'Volcano count',
      key: 'volcanoCount',
      min: MinValues.volcanoCount,
      max: MaxValues.volcanoCount,
      step: '1',
    },
    {
      label: 'Volcano scale',
      key: 'volcanoScale',
      min: MinValues.volcanoScale,
      max: MaxValues.volcanoScale,
      step: '0.05',
    },
    {
      label: 'Volcano strength',
      key: 'volcanoStrength',
      min: MinValues.volcanoStrength,
      max: MaxValues.volcanoStrength,
      step: '0.05',
    },
    {
      label: 'Volcano color',
      key: 'volcanoColorStrength',
      min: MinValues.volcanoColorStrength,
      max: MaxValues.volcanoColorStrength,
      step: '0.05',
    },
    {
      label: 'Crater rays',
      key: 'craterRayStrength',
      min: MinValues.craterRayStrength,
      max: MaxValues.craterRayStrength,
      step: '0.05',
    },
    {
      label: 'Ray visibility',
      key: 'craterRayVisibility',
      min: MinValues.craterRayVisibility,
      max: MaxValues.craterRayVisibility,
      step: '0.05',
    },
    {
      label: 'Ray density',
      key: 'craterRayDensity',
      min: MinValues.craterRayDensity,
      max: MaxValues.craterRayDensity,
      step: '0.05',
    },
    {
      label: 'Ray sharpness',
      key: 'craterRaySharpness',
      min: MinValues.craterRaySharpness,
      max: MaxValues.craterRaySharpness,
      step: '0.05',
    },
    {
      label: 'Ray length power',
      key: 'craterRayLengthPower',
      min: MinValues.craterRayLengthPower,
      max: MaxValues.craterRayLengthPower,
      step: '0.1',
    },
    {
      label: 'Ridge strength',
      key: 'ridgeStrength',
      min: MinValues.ridgeStrength,
      max: MaxValues.ridgeStrength,
      step: '0.05',
    },
    {
      label: 'Ridge scale',
      key: 'ridgeScale',
      min: MinValues.ridgeScale,
      max: MaxValues.ridgeScale,
      step: '0.1',
    },
    {
      label: 'Ridge sharpness',
      key: 'ridgeSharpness',
      min: MinValues.ridgeSharpness,
      max: MaxValues.ridgeSharpness,
      step: '0.05',
    },
    {
      label: 'Ridge color weight',
      key: 'ridgeColorWeight',
      min: MinValues.ridgeColorWeight,
      max: MaxValues.ridgeColorWeight,
      step: '0.05',
    },
    {
      label: 'Rift strength',
      key: 'riftStrength',
      min: MinValues.riftStrength,
      max: MaxValues.riftStrength,
      step: '0.05',
    },
    {
      label: 'Rift scale',
      key: 'riftScale',
      min: MinValues.riftScale,
      max: MaxValues.riftScale,
      step: '0.1',
    },
    {
      label: 'Rift width',
      key: 'riftWidth',
      min: MinValues.riftWidth,
      max: MaxValues.riftWidth,
      step: '0.01',
    },
    {
      label: 'Rift sharpness',
      key: 'riftSharpness',
      min: MinValues.riftSharpness,
      max: MaxValues.riftSharpness,
      step: '0.05',
    },
    {
      label: 'Rift color weight',
      key: 'riftColorWeight',
      min: MinValues.riftColorWeight,
      max: MaxValues.riftColorWeight,
      step: '0.05',
    },
    {
      label: 'Ridges/rifts blend',
      key: 'ridgesRiftsBlend',
      min: MinValues.ridgesRiftsBlend,
      max: MaxValues.ridgesRiftsBlend,
      step: '0.05',
    },
    {
      label: 'Bump tex height',
      key: 'bumpTextureSize',
      min: MinValues.bumpTextureSize,
      max: MaxValues.bumpTextureSize,
      step: '1',
    },
    {
      label: 'Color tex height',
      key: 'colorTextureSize',
      min: MinValues.colorTextureSize,
      max: MaxValues.colorTextureSize,
      step: '1',
    },
    {
      label: 'Roughness',
      key: 'roughness',
      min: MinValues.roughness,
      max: MaxValues.roughness,
      step: '0.1',
    },
    {
      label: 'Metalness',
      key: 'metalness',
      min: MinValues.metalness,
      max: MaxValues.metalness,
      step: '0.1',
    },
  ]

  const geometryControls: Array<{
    label: string
    key: NumericControlKey
    min?: number
    max?: number
    step: string
  }> = [
    {
      label: 'Large-scale deformation',
      key: 'largeScale',
      min: MinValues.largeScale,
      max: MaxValues.largeScale,
      step: '0.1',
    },
    {
      label: 'Medium-scale deformation',
      key: 'mediumScale',
      min: MinValues.mediumScale,
      max: MaxValues.mediumScale,
      step: '0.1',
    },
    {
      label: 'Small-scale deformation',
      key: 'smallScale',
      min: MinValues.smallScale,
      max: MaxValues.smallScale,
      step: '0.1',
    },
    {
      label: 'Triangle detail',
      key: 'triangleDetail',
      min: MinValues.triangleDetail,
      max: MaxValues.triangleDetail,
      step: '1',
    },
  ]

  let planetoid = $state<PlanetoidSettings>({ ...DEFAULT_PLANETOID_SETTINGS })
  let settingsHydrated = $state(false)

  type PlanetoidSceneExports = {
    downloadTextureMapPng: (fileName?: string) => Promise<boolean>
    downloadBumpMapPng: (fileName?: string) => Promise<boolean>
  }

  let canvasShell: HTMLDivElement | undefined = $state(undefined)
  let planetoidScene: PlanetoidSceneExports | undefined = $state(undefined)
  let isSaving = $state(false)
  let sceneViewMode = $state<PlanetoidViewMode>('mesh')
  let viewModeSectionOpen = $state(true)
  let cratersEnabled = $state(true)
  let volcanoesEnabled = $state(false)
  let ridgesEnabled = $state(true)
  let riftsEnabled = $state(true)
  let colorSettingsSectionOpen = $state(true)
  let craterSectionOpen = $state(true)
  let volcanoSectionOpen = $state(false)
  let ridgeSectionOpen = $state(true)
  let riftSectionOpen = $state(true)
  let textureResolutionSectionOpen = $state(false)
  let materialPropertiesSectionOpen = $state(true)
  let geometryPropertiesSectionOpen = $state(true)
  let sectionTogglesHydrated = $state(false)
  let presetsHydrated = $state(false)
  let wasCratersEnabled = $state(true)
  let wasVolcanoesEnabled = $state(false)
  let wasRidgesEnabled = $state(true)
  let wasRiftsEnabled = $state(true)
  let presetsMenuOpen = $state(false)
  let presetsMenuElement: HTMLDetailsElement | undefined = $state(undefined)
  let presetsManagerOpen = $state(false)
  let userPresets = $state<PlanetoidPreset[]>([])

  const colorControlKeys: NumericControlKey[] = ['colorScale', 'tintShadowFloor', 'swirliness']
  const textureResolutionControlKeys: NumericControlKey[] = ['bumpTextureSize', 'colorTextureSize']
  const materialControlKeys: NumericControlKey[] = ['bumpScale', 'roughness', 'metalness']
  const craterControlKeys: NumericControlKey[] = [
    'craterCount',
    'craterStrength',
    'craterColorStrength',
    'craterRayStrength',
    'craterRayVisibility',
    'craterRayDensity',
    'craterRaySharpness',
    'craterRayLengthPower',
  ]
  const volcanoControlKeys: NumericControlKey[] = [
    'volcanoCount',
    'volcanoScale',
    'volcanoStrength',
    'volcanoColorStrength',
  ]
  const ridgeControlKeys: NumericControlKey[] = [
    'ridgeStrength',
    'ridgeScale',
    'ridgeSharpness',
    'ridgeColorWeight',
    'ridgesRiftsBlend',
  ]
  const riftControlKeys: NumericControlKey[] = [
    'riftStrength',
    'riftScale',
    'riftWidth',
    'riftSharpness',
    'riftColorWeight',
  ]

  const colorControls = textureControls.filter((control) => colorControlKeys.includes(control.key))
  const textureResolutionControls = textureControls.filter((control) =>
    textureResolutionControlKeys.includes(control.key)
  )
  const materialControls = textureControls.filter((control) =>
    materialControlKeys.includes(control.key)
  )
  const craterControls = textureControls.filter((control) =>
    craterControlKeys.includes(control.key)
  )
  const volcanoControls = textureControls.filter((control) =>
    volcanoControlKeys.includes(control.key)
  )
  const ridgeControls = textureControls.filter((control) => ridgeControlKeys.includes(control.key))
  const riftControls = textureControls.filter((control) => riftControlKeys.includes(control.key))

  const effectiveCratersEnabled = $derived(cratersEnabled)
  const volcanoSectionEnabled = $derived(volcanoesEnabled)
  const effectiveVolcanoesEnabled = $derived(volcanoSectionEnabled)
  const ridgeSectionEnabled = $derived(ridgesEnabled)
  const riftSectionEnabled = $derived(riftsEnabled)
  const effectiveRidgesEnabled = $derived(ridgeSectionEnabled)
  const effectiveRiftsEnabled = $derived(riftSectionEnabled)

  function toHex(value: number) {
    return Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, '0')
  }

  const selectedPaletteStops = $derived(PlanetoidPalettes[planetoid.palette])

  const selectedPaletteGradient = $derived.by(() => {
    const stops = selectedPaletteStops
    const lastIndex = Math.max(1, stops.length - 1)
    const parts = stops.map((color, index) => {
      const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`
      const position = (index / lastIndex) * 100
      return `${hex} ${position.toFixed(2)}%`
    })

    return `linear-gradient(90deg, ${parts.join(', ')})`
  })

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
  }

  function sanitizePlanetoidSettings(input: unknown): PlanetoidSettings {
    const raw =
      typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}

    const autoRotate =
      typeof raw.autoRotate === 'boolean' ? raw.autoRotate : DEFAULT_PLANETOID_SETTINGS.autoRotate

    const showDebugMeshes =
      typeof raw.showDebugMeshes === 'boolean'
        ? raw.showDebugMeshes
        : DEFAULT_PLANETOID_SETTINGS.showDebugMeshes

    const enableLimbBumpFix =
      typeof raw.enableLimbBumpFix === 'boolean'
        ? raw.enableLimbBumpFix
        : DEFAULT_PLANETOID_SETTINGS.enableLimbBumpFix

    const legacyEnableRidgesRifts =
      typeof raw.enableRidgesRifts === 'boolean'
        ? raw.enableRidgesRifts
        : DEFAULT_PLANETOID_SETTINGS.enableRidges || DEFAULT_PLANETOID_SETTINGS.enableRifts

    const enableRidges =
      typeof raw.enableRidges === 'boolean' ? raw.enableRidges : legacyEnableRidgesRifts

    const enableRifts =
      typeof raw.enableRifts === 'boolean' ? raw.enableRifts : legacyEnableRidgesRifts

    const enableVolcanoes =
      typeof raw.enableVolcanoes === 'boolean'
        ? raw.enableVolcanoes
        : DEFAULT_PLANETOID_SETTINGS.enableVolcanoes

    const palette = PlanetoidPaletteNames.includes(raw.palette as PlanetoidPaletteName)
      ? (raw.palette as PlanetoidPaletteName)
      : DEFAULT_PLANETOID_SETTINGS.palette

    const surfaceTint =
      typeof raw.surfaceTint === 'string' &&
      /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(raw.surfaceTint)
        ? raw.surfaceTint
        : DEFAULT_PLANETOID_SETTINGS.surfaceTint

    const seed =
      typeof raw.seed === 'number'
        ? Math.round(clamp(raw.seed, 0, 999999))
        : DEFAULT_PLANETOID_SETTINGS.seed

    const colorScale =
      typeof raw.colorScale === 'number'
        ? clamp(raw.colorScale, MinValues.colorScale, MaxValues.colorScale)
        : DEFAULT_PLANETOID_SETTINGS.colorScale

    const tintShadowFloor =
      typeof raw.tintShadowFloor === 'number'
        ? clamp(raw.tintShadowFloor, MinValues.tintShadowFloor, MaxValues.tintShadowFloor)
        : DEFAULT_PLANETOID_SETTINGS.tintShadowFloor

    const swirliness =
      typeof raw.swirliness === 'number'
        ? clamp(raw.swirliness, MinValues.swirliness, MaxValues.swirliness)
        : DEFAULT_PLANETOID_SETTINGS.swirliness

    const craterCount =
      typeof raw.craterCount === 'number'
        ? Math.round(clamp(raw.craterCount, MinValues.craterCount, MaxValues.craterCount))
        : DEFAULT_PLANETOID_SETTINGS.craterCount

    const craterStrength =
      typeof raw.craterStrength === 'number'
        ? clamp(raw.craterStrength, MinValues.craterStrength, MaxValues.craterStrength)
        : DEFAULT_PLANETOID_SETTINGS.craterStrength

    const craterColorStrength =
      typeof raw.craterColorStrength === 'number'
        ? clamp(
            raw.craterColorStrength,
            MinValues.craterColorStrength,
            MaxValues.craterColorStrength
          )
        : DEFAULT_PLANETOID_SETTINGS.craterColorStrength

    const volcanoCount =
      typeof raw.volcanoCount === 'number'
        ? Math.round(clamp(raw.volcanoCount, MinValues.volcanoCount, MaxValues.volcanoCount))
        : DEFAULT_PLANETOID_SETTINGS.volcanoCount

    const volcanoScale =
      typeof raw.volcanoScale === 'number'
        ? clamp(raw.volcanoScale, MinValues.volcanoScale, MaxValues.volcanoScale)
        : DEFAULT_PLANETOID_SETTINGS.volcanoScale

    const volcanoStrength =
      typeof raw.volcanoStrength === 'number'
        ? clamp(raw.volcanoStrength, MinValues.volcanoStrength, MaxValues.volcanoStrength)
        : DEFAULT_PLANETOID_SETTINGS.volcanoStrength

    const volcanoColorStrength =
      typeof raw.volcanoColorStrength === 'number'
        ? clamp(
            raw.volcanoColorStrength,
            MinValues.volcanoColorStrength,
            MaxValues.volcanoColorStrength
          )
        : DEFAULT_PLANETOID_SETTINGS.volcanoColorStrength

    const ridgeRiftColorWeightLegacy =
      typeof raw.ridgeRiftColorWeight === 'number' ? raw.ridgeRiftColorWeight : undefined

    const ridgeColorWeight =
      typeof raw.ridgeColorWeight === 'number'
        ? clamp(raw.ridgeColorWeight, MinValues.ridgeColorWeight, MaxValues.ridgeColorWeight)
        : typeof ridgeRiftColorWeightLegacy === 'number'
          ? clamp(
              ridgeRiftColorWeightLegacy,
              MinValues.ridgeColorWeight,
              MaxValues.ridgeColorWeight
            )
          : DEFAULT_PLANETOID_SETTINGS.ridgeColorWeight

    const riftColorWeight =
      typeof raw.riftColorWeight === 'number'
        ? clamp(raw.riftColorWeight, MinValues.riftColorWeight, MaxValues.riftColorWeight)
        : typeof ridgeRiftColorWeightLegacy === 'number'
          ? clamp(ridgeRiftColorWeightLegacy, MinValues.riftColorWeight, MaxValues.riftColorWeight)
          : DEFAULT_PLANETOID_SETTINGS.riftColorWeight

    const craterRayStrength =
      typeof raw.craterRayStrength === 'number'
        ? clamp(raw.craterRayStrength, MinValues.craterRayStrength, MaxValues.craterRayStrength)
        : DEFAULT_PLANETOID_SETTINGS.craterRayStrength

    const craterRayVisibility =
      typeof raw.craterRayVisibility === 'number'
        ? clamp(
            raw.craterRayVisibility,
            MinValues.craterRayVisibility,
            MaxValues.craterRayVisibility
          )
        : DEFAULT_PLANETOID_SETTINGS.craterRayVisibility

    const craterRayDensity =
      typeof raw.craterRayDensity === 'number'
        ? clamp(raw.craterRayDensity, MinValues.craterRayDensity, MaxValues.craterRayDensity)
        : DEFAULT_PLANETOID_SETTINGS.craterRayDensity

    const craterRaySharpness =
      typeof raw.craterRaySharpness === 'number'
        ? clamp(raw.craterRaySharpness, MinValues.craterRaySharpness, MaxValues.craterRaySharpness)
        : DEFAULT_PLANETOID_SETTINGS.craterRaySharpness

    const craterRayLengthPower =
      typeof raw.craterRayLengthPower === 'number'
        ? clamp(
            raw.craterRayLengthPower,
            MinValues.craterRayLengthPower,
            MaxValues.craterRayLengthPower
          )
        : DEFAULT_PLANETOID_SETTINGS.craterRayLengthPower

    const enableCraters =
      typeof raw.enableCraters === 'boolean'
        ? raw.enableCraters
        : craterCount > 0 || craterStrength > 0 || craterColorStrength > 0 || craterRayStrength > 0

    const ridgeStrength =
      typeof raw.ridgeStrength === 'number'
        ? clamp(raw.ridgeStrength, MinValues.ridgeStrength, MaxValues.ridgeStrength)
        : DEFAULT_PLANETOID_SETTINGS.ridgeStrength

    const ridgeScale =
      typeof raw.ridgeScale === 'number'
        ? clamp(raw.ridgeScale, MinValues.ridgeScale, MaxValues.ridgeScale)
        : DEFAULT_PLANETOID_SETTINGS.ridgeScale

    const ridgeSharpness =
      typeof raw.ridgeSharpness === 'number'
        ? clamp(raw.ridgeSharpness, MinValues.ridgeSharpness, MaxValues.ridgeSharpness)
        : DEFAULT_PLANETOID_SETTINGS.ridgeSharpness

    const riftStrength =
      typeof raw.riftStrength === 'number'
        ? clamp(raw.riftStrength, MinValues.riftStrength, MaxValues.riftStrength)
        : DEFAULT_PLANETOID_SETTINGS.riftStrength

    const riftScale =
      typeof raw.riftScale === 'number'
        ? clamp(raw.riftScale, MinValues.riftScale, MaxValues.riftScale)
        : DEFAULT_PLANETOID_SETTINGS.riftScale

    const riftWidth =
      typeof raw.riftWidth === 'number'
        ? clamp(raw.riftWidth, MinValues.riftWidth, MaxValues.riftWidth)
        : DEFAULT_PLANETOID_SETTINGS.riftWidth

    const riftSharpness =
      typeof raw.riftSharpness === 'number'
        ? clamp(raw.riftSharpness, MinValues.riftSharpness, MaxValues.riftSharpness)
        : DEFAULT_PLANETOID_SETTINGS.riftSharpness

    const ridgesRiftsBlend =
      typeof raw.ridgesRiftsBlend === 'number'
        ? clamp(raw.ridgesRiftsBlend, MinValues.ridgesRiftsBlend, MaxValues.ridgesRiftsBlend)
        : DEFAULT_PLANETOID_SETTINGS.ridgesRiftsBlend

    const bumpTextureSize =
      typeof raw.bumpTextureSize === 'number'
        ? Math.round(
            clamp(raw.bumpTextureSize, MinValues.bumpTextureSize, MaxValues.bumpTextureSize)
          )
        : DEFAULT_PLANETOID_SETTINGS.bumpTextureSize

    const colorTextureSize =
      typeof raw.colorTextureSize === 'number'
        ? Math.round(
            clamp(raw.colorTextureSize, MinValues.colorTextureSize, MaxValues.colorTextureSize)
          )
        : DEFAULT_PLANETOID_SETTINGS.colorTextureSize

    const largeScale =
      typeof raw.largeScale === 'number'
        ? clamp(raw.largeScale, MinValues.largeScale, MaxValues.largeScale)
        : DEFAULT_PLANETOID_SETTINGS.largeScale

    const mediumScale =
      typeof raw.mediumScale === 'number'
        ? clamp(raw.mediumScale, MinValues.mediumScale, MaxValues.mediumScale)
        : DEFAULT_PLANETOID_SETTINGS.mediumScale

    const smallScale =
      typeof raw.smallScale === 'number'
        ? clamp(raw.smallScale, MinValues.smallScale, MaxValues.smallScale)
        : DEFAULT_PLANETOID_SETTINGS.smallScale

    const bumpScale =
      typeof raw.bumpScale === 'number'
        ? clamp(raw.bumpScale, MinValues.bumpScale, MaxValues.bumpScale)
        : DEFAULT_PLANETOID_SETTINGS.bumpScale

    const roughness =
      typeof raw.roughness === 'number'
        ? clamp(raw.roughness, MinValues.roughness, MaxValues.roughness)
        : DEFAULT_PLANETOID_SETTINGS.roughness

    const metalness =
      typeof raw.metalness === 'number'
        ? clamp(raw.metalness, MinValues.metalness, MaxValues.metalness)
        : DEFAULT_PLANETOID_SETTINGS.metalness

    const triangleDetail =
      typeof raw.triangleDetail === 'number'
        ? Math.round(clamp(raw.triangleDetail, MinValues.triangleDetail, MaxValues.triangleDetail))
        : DEFAULT_PLANETOID_SETTINGS.triangleDetail

    return {
      palette,
      surfaceTint,
      colorScale,
      tintShadowFloor,
      swirliness,
      craterCount,
      craterStrength,
      craterColorStrength,
      volcanoCount,
      volcanoScale,
      volcanoStrength,
      volcanoColorStrength,
      ridgeColorWeight,
      riftColorWeight,
      craterRayStrength,
      craterRayVisibility,
      craterRayDensity,
      craterRaySharpness,
      craterRayLengthPower,
      enableLimbBumpFix,
      enableCraters,
      enableRidges,
      enableRifts,
      enableVolcanoes,
      ridgeStrength,
      ridgeScale,
      ridgeSharpness,
      riftStrength,
      riftScale,
      riftWidth,
      riftSharpness,
      ridgesRiftsBlend,
      bumpTextureSize,
      colorTextureSize,
      seed,
      largeScale,
      mediumScale,
      smallScale,
      triangleDetail,
      bumpScale,
      roughness,
      metalness,
      autoRotate,
      showDebugMeshes,
    }
  }

  function sanitizePresetName(input: unknown) {
    if (typeof input !== 'string') return ''

    return input.trim().replace(/\s+/g, ' ').slice(0, 48)
  }

  function createPresetId() {
    const random = Math.random().toString(36).slice(2, 8)
    return `preset-${Date.now()}-${random}`
  }

  function sanitizePreset(input: unknown): PlanetoidPreset | null {
    if (typeof input !== 'object' || input === null) return null

    const raw = input as Record<string, unknown>
    const name = sanitizePresetName(raw.name)
    if (!name) return null

    const id =
      typeof raw.id === 'string' && raw.id.trim().length > 0 ? raw.id.trim() : createPresetId()

    return {
      id,
      name,
      settings: sanitizePlanetoidSettings(raw.settings),
    }
  }

  function applyPlanetoidSettings(settings: PlanetoidSettings) {
    planetoid = sanitizePlanetoidSettings(settings)
    cratersEnabled = planetoid.enableCraters
    volcanoesEnabled = planetoid.enableVolcanoes && planetoid.volcanoCount > 0
    ridgesEnabled = planetoid.ridgeStrength > 0
    riftsEnabled = planetoid.riftStrength > 0
  }

  function resetSceneToDefaults() {
    applyPlanetoidSettings(DEFAULT_PLANETOID_SETTINGS)
    sceneViewMode = 'mesh'
  }

  function closePresetsMenu() {
    presetsMenuOpen = false
  }

  function onResetSceneFromMenu() {
    closePresetsMenu()
    resetSceneToDefaults()
  }

  function saveCurrentPreset() {
    const enteredName = window.prompt('Name this preset:', 'My preset')
    const name = sanitizePresetName(enteredName)

    if (!name) return

    const nextPreset: PlanetoidPreset = {
      id: createPresetId(),
      name,
      settings: sanitizePlanetoidSettings({
        ...planetoid,
        enableCraters: effectiveCratersEnabled,
      }),
    }

    userPresets = [nextPreset, ...userPresets]
  }

  function onSavePresetFromMenu() {
    closePresetsMenu()
    saveCurrentPreset()
  }

  function onManagePresetsFromMenu() {
    closePresetsMenu()
    presetsManagerOpen = true
  }

  function quoteCliValue(value: string) {
    return JSON.stringify(value)
  }

  function toBooleanCliValue(value: boolean) {
    return value ? 'true' : 'false'
  }

  function buildCliCommandFromPreset(
    settings: PlanetoidSettings,
    mode: PlanetoidViewMode,
    toggles: {
      cratersEnabled: boolean
      ridgesEnabled: boolean
      riftsEnabled: boolean
      volcanoesEnabled: boolean
    }
  ) {
    const args: string[] = [
      '--palette',
      quoteCliValue(settings.palette),
      '--surface-tint',
      quoteCliValue(settings.surfaceTint),
      '--view-mode',
      mode,
    ]

    var firstKeys = (Object.keys(PlanetoidCliFlagByRangeKey) as NumericControlKey[]).filter(
      (k) => !(k in ['seed'])
    )

    for (const key of firstKeys) {
      const flag = PlanetoidCliFlagByRangeKey[key]
      const value = settings[key]
      args.push(flag, String(value))
    }

    args.push(PlanetoidCliToggleFlags.autoRotate, toBooleanCliValue(settings.autoRotate))
    args.push(PlanetoidCliToggleFlags.showDebugMeshes, toBooleanCliValue(settings.showDebugMeshes))
    args.push(PlanetoidCliToggleFlags.cratersEnabled, toBooleanCliValue(toggles.cratersEnabled))
    args.push(PlanetoidCliToggleFlags.ridgesEnabled, toBooleanCliValue(toggles.ridgesEnabled))
    args.push(PlanetoidCliToggleFlags.riftsEnabled, toBooleanCliValue(toggles.riftsEnabled))
    args.push(PlanetoidCliToggleFlags.volcanoesEnabled, toBooleanCliValue(toggles.volcanoesEnabled))

    args.push(PlanetoidCliFlagByRangeKey.seed, '1')
    args.push('--step', '1')
    args.push('--count', '1')

    return `npm run auto-generate-planetoids -- ${args.join(' ')}`
  }

  async function copyTextToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }

  async function exportCurrentPresetToCli() {
    closePresetsMenu()
    const command = buildCliCommandFromPreset(planetoid, sceneViewMode, {
      cratersEnabled: effectiveCratersEnabled,
      ridgesEnabled: effectiveRidgesEnabled,
      riftsEnabled: effectiveRiftsEnabled,
      volcanoesEnabled: effectiveVolcanoesEnabled,
    })

    const copied = await copyTextToClipboard(command)
    if (copied) {
      window.alert('CLI command copied to clipboard.')
    } else {
      window.prompt('Copy this CLI command:', command)
    }
  }

  async function exportPresetToCli(preset: PlanetoidPreset) {
    const command = buildCliCommandFromPreset(preset.settings, sceneViewMode, {
      cratersEnabled:
        preset.settings.enableCraters ||
        preset.settings.craterCount > 0 ||
        preset.settings.craterStrength > 0,
      ridgesEnabled: preset.settings.enableRidges || preset.settings.ridgeStrength > 0,
      riftsEnabled: preset.settings.enableRifts || preset.settings.riftStrength > 0,
      volcanoesEnabled: preset.settings.enableVolcanoes || preset.settings.volcanoCount > 0,
    })

    const copied = await copyTextToClipboard(command)
    if (copied) {
      window.alert(`CLI command copied for preset: ${preset.name}`)
    } else {
      window.prompt(`Copy CLI command for ${preset.name}:`, command)
    }
  }

  function onWindowPointerDown(event: PointerEvent) {
    if (!presetsMenuOpen || !presetsMenuElement) return

    const target = event.target
    if (!(target instanceof Node)) return
    if (presetsMenuElement.contains(target)) return

    closePresetsMenu()
  }

  function applyPreset(preset: PlanetoidPreset) {
    applyPlanetoidSettings(preset.settings)
  }

  function applyPresetAndCloseManager(preset: PlanetoidPreset) {
    applyPreset(preset)
    presetsManagerOpen = false
  }

  function deleteUserPreset(presetId: string) {
    userPresets = userPresets.filter((entry) => entry.id !== presetId)
  }

  function closePresetManager() {
    presetsManagerOpen = false
  }

  function sanitizePlanetoidUiState(input: unknown): PlanetoidUiState | null {
    if (typeof input !== 'object' || input === null) return null

    const raw = input as Record<string, unknown>
    const hasAllKeys =
      typeof raw.viewMode === 'string' &&
      typeof raw.viewModeSectionOpen === 'boolean' &&
      typeof raw.cratersEnabled === 'boolean' &&
      typeof raw.volcanoesEnabled === 'boolean' &&
      typeof raw.ridgesEnabled === 'boolean' &&
      typeof raw.riftsEnabled === 'boolean' &&
      typeof raw.colorSettingsSectionOpen === 'boolean' &&
      typeof raw.textureResolutionSectionOpen === 'boolean' &&
      typeof raw.materialPropertiesSectionOpen === 'boolean' &&
      typeof raw.geometryPropertiesSectionOpen === 'boolean' &&
      typeof raw.craterSectionOpen === 'boolean' &&
      typeof raw.volcanoSectionOpen === 'boolean' &&
      typeof raw.ridgeSectionOpen === 'boolean' &&
      typeof raw.riftSectionOpen === 'boolean'

    if (!hasAllKeys) return null

    const isValidViewMode =
      raw.viewMode === 'mesh' ||
      raw.viewMode === 'bump' ||
      raw.viewMode === 'texture' ||
      raw.viewMode === 'ray'

    if (!isValidViewMode) return null

    return {
      viewMode: raw.viewMode as PlanetoidViewMode,
      viewModeSectionOpen: raw.viewModeSectionOpen as boolean,
      cratersEnabled: raw.cratersEnabled as boolean,
      volcanoesEnabled: raw.volcanoesEnabled as boolean,
      ridgesEnabled: raw.ridgesEnabled as boolean,
      riftsEnabled: raw.riftsEnabled as boolean,
      colorSettingsSectionOpen: raw.colorSettingsSectionOpen as boolean,
      textureResolutionSectionOpen: raw.textureResolutionSectionOpen as boolean,
      materialPropertiesSectionOpen: raw.materialPropertiesSectionOpen as boolean,
      geometryPropertiesSectionOpen: raw.geometryPropertiesSectionOpen as boolean,
      craterSectionOpen: raw.craterSectionOpen as boolean,
      volcanoSectionOpen: raw.volcanoSectionOpen as boolean,
      ridgeSectionOpen: raw.ridgeSectionOpen as boolean,
      riftSectionOpen: raw.riftSectionOpen as boolean,
    }
  }

  $effect(() => {
    if (settingsHydrated) return

    try {
      const raw = localStorage.getItem(PLANETOID_SETTINGS_STORAGE_KEY)

      if (raw) {
        planetoid = sanitizePlanetoidSettings(JSON.parse(raw))
      }
    } catch (error) {
      console.warn('Failed to restore planetoid settings from localStorage', error)
    } finally {
      settingsHydrated = true
    }
  })

  $effect(() => {
    if (!settingsHydrated) return

    try {
      localStorage.setItem(PLANETOID_SETTINGS_STORAGE_KEY, JSON.stringify(planetoid))
    } catch (error) {
      console.warn('Failed to persist planetoid settings to localStorage', error)
    }
  })

  $effect(() => {
    if (!settingsHydrated || sectionTogglesHydrated) return

    let restoredUiState: PlanetoidUiState | null = null
    try {
      const rawUi = localStorage.getItem(PLANETOID_UI_STORAGE_KEY)
      if (rawUi) {
        restoredUiState = sanitizePlanetoidUiState(JSON.parse(rawUi))
      }
    } catch (error) {
      console.warn('Failed to restore planetoid UI state from localStorage', error)
    }

    if (restoredUiState) {
      sceneViewMode = restoredUiState.viewMode
      viewModeSectionOpen = restoredUiState.viewModeSectionOpen
      cratersEnabled = restoredUiState.cratersEnabled
      volcanoesEnabled = restoredUiState.volcanoesEnabled
      ridgesEnabled = restoredUiState.ridgesEnabled
      riftsEnabled = restoredUiState.riftsEnabled
      colorSettingsSectionOpen = restoredUiState.colorSettingsSectionOpen
      textureResolutionSectionOpen = restoredUiState.textureResolutionSectionOpen
      materialPropertiesSectionOpen = restoredUiState.materialPropertiesSectionOpen
      geometryPropertiesSectionOpen = restoredUiState.geometryPropertiesSectionOpen
      craterSectionOpen = restoredUiState.craterSectionOpen
      volcanoSectionOpen = restoredUiState.volcanoSectionOpen
      ridgeSectionOpen = restoredUiState.ridgeSectionOpen
      riftSectionOpen = restoredUiState.riftSectionOpen
    } else {
      cratersEnabled = planetoid.enableCraters
      volcanoesEnabled =
        planetoid.enableVolcanoes ||
        planetoid.volcanoCount > 0 ||
        planetoid.volcanoStrength > 0 ||
        planetoid.volcanoColorStrength > 0
      ridgesEnabled = planetoid.ridgeStrength > 0
      riftsEnabled = planetoid.riftStrength > 0
    }

    wasCratersEnabled = cratersEnabled
    wasVolcanoesEnabled = volcanoSectionEnabled
    wasRidgesEnabled = ridgeSectionEnabled
    wasRiftsEnabled = riftSectionEnabled
    sectionTogglesHydrated = true
  })

  $effect(() => {
    if (!settingsHydrated || !sectionTogglesHydrated) return

    try {
      const uiState: PlanetoidUiState = {
        viewMode: sceneViewMode,
        viewModeSectionOpen,
        cratersEnabled,
        volcanoesEnabled,
        ridgesEnabled,
        riftsEnabled,
        colorSettingsSectionOpen,
        textureResolutionSectionOpen,
        materialPropertiesSectionOpen,
        geometryPropertiesSectionOpen,
        craterSectionOpen,
        volcanoSectionOpen,
        ridgeSectionOpen,
        riftSectionOpen,
      }

      localStorage.setItem(PLANETOID_UI_STORAGE_KEY, JSON.stringify(uiState))
    } catch (error) {
      console.warn('Failed to persist planetoid UI state to localStorage', error)
    }
  })

  $effect(() => {
    if (presetsHydrated) return

    try {
      const raw = localStorage.getItem(PLANETOID_PRESETS_STORAGE_KEY)

      if (raw) {
        const parsed = JSON.parse(raw)
        const list = Array.isArray(parsed) ? parsed : []
        const sanitized: PlanetoidPreset[] = []

        for (const entry of list) {
          const preset = sanitizePreset(entry)
          if (preset) sanitized.push(preset)
        }

        userPresets = sanitized
      }
    } catch (error) {
      console.warn('Failed to restore planetoid presets from localStorage', error)
    } finally {
      presetsHydrated = true
    }
  })

  $effect(() => {
    if (!presetsHydrated) return

    try {
      localStorage.setItem(PLANETOID_PRESETS_STORAGE_KEY, JSON.stringify(userPresets))
    } catch (error) {
      console.warn('Failed to persist planetoid presets to localStorage', error)
    }
  })

  $effect(() => {
    if (!sectionTogglesHydrated) return

    if (effectiveCratersEnabled !== wasCratersEnabled) {
      craterSectionOpen = effectiveCratersEnabled
      wasCratersEnabled = effectiveCratersEnabled
    }

    if (volcanoSectionEnabled !== wasVolcanoesEnabled) {
      volcanoSectionOpen = volcanoSectionEnabled
      wasVolcanoesEnabled = volcanoSectionEnabled
    }

    if (ridgeSectionEnabled !== wasRidgesEnabled) {
      ridgeSectionOpen = ridgeSectionEnabled
      wasRidgesEnabled = ridgeSectionEnabled
    }

    if (riftSectionEnabled !== wasRiftsEnabled) {
      riftSectionOpen = riftSectionEnabled
      wasRiftsEnabled = riftSectionEnabled
    }
  })

  function getTimestamp() {
    const now = new Date()
    const yyyy = String(now.getFullYear())
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const hh = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')
    const ss = String(now.getSeconds()).padStart(2, '0')

    return `${yyyy}${mm}${dd}-${hh}${min}${ss}`
  }

  function nextAnimationFrame() {
    return new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve())
    })
  }

  const ACTION_POPOVER_ID = 'scene-action-popover'
  let activePopoverText = $state('')

  function showActionPopover(event: MouseEvent | FocusEvent, text: string) {
    const target = event.currentTarget
    if (!(target instanceof HTMLElement) || !text) return

    const popover = document.getElementById(ACTION_POPOVER_ID)
    if (!(popover instanceof HTMLElement)) return

    activePopoverText = text
    popover.showPopover()

    requestAnimationFrame(() => {
      const targetRect = target.getBoundingClientRect()
      const popRect = popover.getBoundingClientRect()
      const margin = 12
      const preferredLeft = targetRect.left
      const maxLeft = Math.max(margin, window.innerWidth - popRect.width - margin)
      const left = Math.max(margin, Math.min(preferredLeft, maxLeft))
      const top = Math.min(window.innerHeight - popRect.height - margin, targetRect.bottom + 8)

      popover.style.left = `${left}px`
      popover.style.top = `${Math.max(margin, top)}px`
    })
  }

  function hideActionPopover() {
    const popover = document.getElementById(ACTION_POPOVER_ID)
    if (!(popover instanceof HTMLElement)) return
    if (!popover.matches(':popover-open')) return

    popover.hidePopover()
  }

  async function saveScenePng() {
    if (!canvasShell || isSaving) return

    const canvas = canvasShell.querySelector('canvas')

    if (!(canvas instanceof HTMLCanvasElement)) {
      return
    }

    isSaving = true
    const wasShowingDebugMeshes = planetoid.showDebugMeshes

    try {
      if (wasShowingDebugMeshes) {
        planetoid.showDebugMeshes = false
        await tick()
        await nextAnimationFrame()
      }

      const fileName = `generated-planetoid-${getTimestamp()}.png`
      const dataUrl = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')

      downloadLink.href = dataUrl
      downloadLink.download = fileName
      downloadLink.click()
    } catch (error) {
      console.error(error)
    } finally {
      if (wasShowingDebugMeshes) {
        planetoid.showDebugMeshes = true
      }
      isSaving = false
    }
  }

  async function downloadTextureMapPng() {
    if (!planetoidScene || isSaving) return

    isSaving = true
    try {
      const fileName = `generated-planetoid-texture-${getTimestamp()}.png`
      await planetoidScene.downloadTextureMapPng(fileName)
    } catch (error) {
      console.error(error)
    } finally {
      isSaving = false
    }
  }

  async function downloadBumpMapPng() {
    if (!planetoidScene || isSaving) return

    isSaving = true
    try {
      const fileName = `generated-planetoid-bump-${getTimestamp()}.png`
      await planetoidScene.downloadBumpMapPng(fileName)
    } catch (error) {
      console.error(error)
    } finally {
      isSaving = false
    }
  }
</script>

<svelte:window onpointerdown={onWindowPointerDown} />

<div class="page">
  <h1 class="page-title">
    <span>Planetoid Generator</span>
    <div class="page-title-actions">
      <a class="page-title-link" href="/giants">Gas and Ice Giants</a>
      <a
        class="page-title-github-link"
        href="https://github.com/richard-green/planetoid-generator"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open GitHub repository"
        title="View source on GitHub"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M12 0.5c-6.35 0-11.5 5.15-11.5 11.5 0 5.08 3.29 9.39 7.86 10.91 0.58 0.11 0.79-0.25 0.79-0.56 0-0.28-0.01-1.02-0.02-2-3.2 0.7-3.88-1.54-3.88-1.54-0.52-1.33-1.28-1.68-1.28-1.68-1.04-0.71 0.08-0.7 0.08-0.7 1.15 0.08 1.76 1.18 1.76 1.18 1.02 1.76 2.68 1.25 3.33 0.96 0.1-0.74 0.4-1.25 0.73-1.54-2.55-0.29-5.24-1.27-5.24-5.65 0-1.25 0.45-2.28 1.18-3.08-0.12-0.29-0.51-1.46 0.11-3.05 0 0 0.97-0.31 3.17 1.18 0.92-0.26 1.9-0.38 2.88-0.38 0.98 0 1.96 0.13 2.88 0.38 2.2-1.49 3.17-1.18 3.17-1.18 0.63 1.59 0.23 2.76 0.11 3.05 0.73 0.8 1.18 1.83 1.18 3.08 0 4.39-2.69 5.36-5.25 5.64 0.41 0.35 0.77 1.04 0.77 2.1 0 1.52-0.01 2.74-0.01 3.11 0 0.31 0.21 0.68 0.8 0.56 4.56-1.53 7.85-5.84 7.85-10.91 0-6.35-5.15-11.5-11.5-11.5z"
          ></path>
        </svg>
        <span class="sr-only">GitHub repository</span>
      </a>
    </div>
  </h1>

  <section class="threlte-view">
    <div class="canvas-shell" bind:this={canvasShell}>
      <Canvas
        createRenderer={(canvas) =>
          new WebGLRenderer({
            canvas,
            powerPreference: 'high-performance',
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
          })}
      >
        <PlanetoidScene
          bind:this={planetoidScene}
          palette={planetoid.palette}
          surfaceTint={planetoid.surfaceTint}
          colorScale={planetoid.colorScale}
          tintShadowFloor={planetoid.tintShadowFloor}
          swirliness={planetoid.swirliness}
          seed={planetoid.seed}
          largeScale={planetoid.largeScale}
          mediumScale={planetoid.mediumScale}
          smallScale={planetoid.smallScale}
          triangleDetail={planetoid.triangleDetail}
          bumpScale={planetoid.bumpScale}
          craterCount={planetoid.craterCount}
          craterStrength={planetoid.craterStrength}
          craterColorStrength={planetoid.craterColorStrength}
          enableCraters={effectiveCratersEnabled}
          enableVolcanoes={effectiveVolcanoesEnabled}
          volcanoCount={effectiveVolcanoesEnabled ? planetoid.volcanoCount : 0}
          volcanoScale={planetoid.volcanoScale}
          volcanoStrength={effectiveVolcanoesEnabled ? planetoid.volcanoStrength : 0}
          volcanoColorStrength={effectiveVolcanoesEnabled ? planetoid.volcanoColorStrength : 0}
          ridgeColorWeight={planetoid.ridgeColorWeight}
          riftColorWeight={planetoid.riftColorWeight}
          craterRayStrength={planetoid.craterRayStrength}
          craterRayVisibility={planetoid.craterRayVisibility}
          craterRayDensity={planetoid.craterRayDensity}
          craterRaySharpness={planetoid.craterRaySharpness}
          craterRayLengthPower={planetoid.craterRayLengthPower}
          enableRidges={effectiveRidgesEnabled}
          enableRifts={effectiveRiftsEnabled}
          ridgeStrength={effectiveRidgesEnabled ? planetoid.ridgeStrength : 0}
          ridgeScale={planetoid.ridgeScale}
          ridgeSharpness={planetoid.ridgeSharpness}
          riftStrength={effectiveRiftsEnabled ? planetoid.riftStrength : 0}
          riftScale={planetoid.riftScale}
          riftWidth={planetoid.riftWidth}
          riftSharpness={planetoid.riftSharpness}
          ridgesRiftsBlend={planetoid.ridgesRiftsBlend}
          bumpTextureSize={planetoid.bumpTextureSize}
          colorTextureSize={planetoid.colorTextureSize}
          roughness={planetoid.roughness}
          metalness={planetoid.metalness}
          autoRotate={planetoid.autoRotate}
          showDebugMeshes={sceneViewMode === 'mesh' ? planetoid.showDebugMeshes : false}
          enableLimbBumpFix={planetoid.enableLimbBumpFix}
          viewMode={sceneViewMode}
        />
      </Canvas>
    </div>

    <div class="controls">
      <fieldset>
        <legend>Scene</legend>
        <div class="save-actions" aria-label="Save and export actions">
          <div class="export-actions">
            <button
              type="button"
              class="action"
              onmouseenter={(event) => showActionPopover(event, 'Download the render as PNG.')}
              onmouseleave={hideActionPopover}
              onfocus={(event) => showActionPopover(event, 'Download the render as PNG.')}
              onblur={hideActionPopover}
              onclick={saveScenePng}
              disabled={isSaving}
              aria-label="Save scene PNG without debug meshes"
            >
              PNG
            </button>
            <button
              type="button"
              class="action"
              onmouseenter={(event) =>
                showActionPopover(event, 'Download the generated texture color map.')}
              onmouseleave={hideActionPopover}
              onfocus={(event) =>
                showActionPopover(event, 'Download the generated texture color map.')}
              onblur={hideActionPopover}
              onclick={downloadTextureMapPng}
              disabled={isSaving}
              aria-label="Download texture map"
            >
              TEX
            </button>
            <button
              type="button"
              class="action"
              onmouseenter={(event) => showActionPopover(event, 'Download the generated bump map.')}
              onmouseleave={hideActionPopover}
              onfocus={(event) => showActionPopover(event, 'Download the generated bump map.')}
              onblur={hideActionPopover}
              onclick={downloadBumpMapPng}
              disabled={isSaving}
              aria-label="Download bump map"
            >
              BMP
            </button>
          </div>
          <details class="preset-menu" bind:this={presetsMenuElement} bind:open={presetsMenuOpen}>
            <summary class="action preset-menu-trigger" aria-label="Preset actions">
              PRESETS
            </summary>
            <div class="preset-menu-dropdown" role="menu" aria-label="Preset actions menu">
              <button
                type="button"
                class="preset-menu-item"
                role="menuitem"
                onclick={onResetSceneFromMenu}
              >
                Reset scene to defaults
              </button>
              <button
                type="button"
                class="preset-menu-item"
                role="menuitem"
                onclick={onSavePresetFromMenu}
              >
                Save a preset
              </button>
              <button
                type="button"
                class="preset-menu-item"
                role="menuitem"
                onclick={onManagePresetsFromMenu}
              >
                Manage presets
              </button>
              <button
                type="button"
                class="preset-menu-item"
                role="menuitem"
                onclick={exportCurrentPresetToCli}
              >
                Copy current as CLI command
              </button>
            </div>
          </details>
        </div>
        <div id={ACTION_POPOVER_ID} class="scene-action-popover" popover="manual" role="tooltip">
          {activePopoverText}
        </div>
        <details class="control-section" bind:open={viewModeSectionOpen}>
          <summary>
            <span class="summary-chevron" aria-hidden="true"></span>
            <span>View mode</span>
          </summary>
          <div class="view-mode-group" role="radiogroup" aria-label="Scene view mode">
            <label class="radio-row">
              <input type="radio" name="scene-view-mode" value="mesh" bind:group={sceneViewMode} />
              <span>Mesh</span>
            </label>
            <label class="radio-row">
              <input type="radio" name="scene-view-mode" value="bump" bind:group={sceneViewMode} />
              <span>Bump map</span>
            </label>
            <label class="radio-row">
              <input
                type="radio"
                name="scene-view-mode"
                value="texture"
                bind:group={sceneViewMode}
              />
              <span>Texture map</span>
            </label>
            <label class="radio-row">
              <input type="radio" name="scene-view-mode" value="ray" bind:group={sceneViewMode} />
              <span>Ray map</span>
            </label>
          </div>
        </details>
        <label class="toggle-row">
          <span>Auto-rotate planetoid</span>
          <input type="checkbox" bind:checked={planetoid.autoRotate} />
        </label>
        <label class="toggle-row">
          <span>Show debug meshes</span>
          <input
            type="checkbox"
            bind:checked={planetoid.showDebugMeshes}
            disabled={sceneViewMode !== 'mesh'}
          />
        </label>
        <label class="toggle-row">
          <span>{PlanetoidUiLabels.enableLimbBumpFix}</span>
          <input type="checkbox" bind:checked={planetoid.enableLimbBumpFix} />
        </label>
        <label class="compact-number-row">
          <span>Seed</span>
          <input type="number" min={0} max={999999} step="1" bind:value={planetoid.seed} />
        </label>
      </fieldset>

      <fieldset>
        <legend>Texture</legend>
        <details class="control-section" bind:open={colorSettingsSectionOpen}>
          <summary>
            <span class="summary-chevron" aria-hidden="true"></span>
            <span>Color settings</span>
          </summary>
          <label>
            Palette
            <select bind:value={planetoid.palette}>
              {#each PlanetoidPaletteNames as option (option)}
                <option value={option}>{option}</option>
              {/each}
            </select>
          </label>
          <div
            class="palette-preview"
            style:background={selectedPaletteGradient}
            aria-label="Selected palette gradient"
          ></div>
          <label class="extra-pad">
            <span class="label-row">
              <span>Surface tint</span>
              <span class="label-value">{planetoid.surfaceTint.toUpperCase()}</span>
            </span>
            <input type="color" bind:value={planetoid.surfaceTint} />
          </label>
          <div class="control-grid">
            {#each colorControls as control (control.key)}
              <label class="compact-number-row">
                <span>{control.label}</span>
                <input
                  type="number"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  bind:value={planetoid[control.key]}
                />
              </label>
            {/each}
          </div>
        </details>
        <details class="control-section" bind:open={textureResolutionSectionOpen}>
          <summary>
            <span class="summary-chevron" aria-hidden="true"></span>
            <span>Texture resolution</span>
          </summary>
          <div class="control-grid">
            {#each textureResolutionControls as control (control.key)}
              <label class="compact-number-row">
                <span>{control.label}</span>
                <input
                  type="number"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  bind:value={planetoid[control.key]}
                />
              </label>
            {/each}
          </div>
        </details>
      </fieldset>

      <fieldset>
        <legend>Material</legend>
        <details class="control-section" bind:open={materialPropertiesSectionOpen}>
          <summary>
            <span class="summary-chevron" aria-hidden="true"></span>
            <span>Properties</span>
          </summary>
          <div class="control-grid">
            {#each materialControls as control (control.key)}
              <label class="compact-number-row">
                <span>{control.label}</span>
                <input
                  type="number"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  bind:value={planetoid[control.key]}
                />
              </label>
            {/each}
          </div>
        </details>
      </fieldset>

      <fieldset>
        <legend>Features</legend>
        <details class="control-section" bind:open={craterSectionOpen}>
          <summary
            class="summary-with-toggle"
            onclick={(event) => !effectiveCratersEnabled && event.preventDefault()}
          >
            <span class="summary-main">
              <span class="summary-chevron" aria-hidden="true"></span>
              <span>{PlanetoidUiLabels.sections.craters}</span>
            </span>
            <label class="summary-toggle">
              <input
                type="checkbox"
                bind:checked={cratersEnabled}
                onclick={(event) => event.stopPropagation()}
              />
            </label>
          </summary>
          <div class="control-grid">
            {#each craterControls as control (control.key)}
              <label class="compact-number-row">
                <span>{control.label}</span>
                <input
                  type="number"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  bind:value={planetoid[control.key]}
                  disabled={!effectiveCratersEnabled}
                />
              </label>
            {/each}
          </div>
        </details>

        <details class="control-section" bind:open={volcanoSectionOpen}>
          <summary
            class="summary-with-toggle"
            onclick={(event) => !volcanoSectionEnabled && event.preventDefault()}
          >
            <span class="summary-main">
              <span class="summary-chevron" aria-hidden="true"></span>
              <span>{PlanetoidUiLabels.sections.volcanoes}</span>
            </span>
            <label class="summary-toggle">
              <input
                type="checkbox"
                bind:checked={volcanoesEnabled}
                onclick={(event) => event.stopPropagation()}
              />
            </label>
          </summary>
          <div class="control-grid">
            {#each volcanoControls as control (control.key)}
              <label class="compact-number-row">
                <span>{control.label}</span>
                <input
                  type="number"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  bind:value={planetoid[control.key]}
                  disabled={!volcanoSectionEnabled}
                />
              </label>
            {/each}
          </div>
        </details>

        <details class="control-section" bind:open={ridgeSectionOpen}>
          <summary
            class="summary-with-toggle"
            onclick={(event) => !ridgeSectionEnabled && event.preventDefault()}
          >
            <span class="summary-main">
              <span class="summary-chevron" aria-hidden="true"></span>
              <span>{PlanetoidUiLabels.sections.ridges}</span>
            </span>
            <label class="summary-toggle">
              <input
                type="checkbox"
                bind:checked={ridgesEnabled}
                onclick={(event) => event.stopPropagation()}
              />
            </label>
          </summary>
          <div class="control-grid">
            {#each ridgeControls as control (control.key)}
              <label class="compact-number-row">
                <span>{control.label}</span>
                <input
                  type="number"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  bind:value={planetoid[control.key]}
                  disabled={!ridgeSectionEnabled}
                />
              </label>
            {/each}
          </div>
        </details>

        <details class="control-section" bind:open={riftSectionOpen}>
          <summary
            class="summary-with-toggle"
            onclick={(event) => !riftSectionEnabled && event.preventDefault()}
          >
            <span class="summary-main">
              <span class="summary-chevron" aria-hidden="true"></span>
              <span>{PlanetoidUiLabels.sections.rifts}</span>
            </span>
            <label class="summary-toggle">
              <input
                type="checkbox"
                bind:checked={riftsEnabled}
                onclick={(event) => event.stopPropagation()}
              />
            </label>
          </summary>
          <div class="control-grid">
            {#each riftControls as control (control.key)}
              <label class="compact-number-row">
                <span>{control.label}</span>
                <input
                  type="number"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  bind:value={planetoid[control.key]}
                  disabled={!riftSectionEnabled}
                />
              </label>
            {/each}
          </div>
        </details>
      </fieldset>

      <fieldset>
        <legend>Geometry</legend>
        <details class="control-section" bind:open={geometryPropertiesSectionOpen}>
          <summary>
            <span class="summary-chevron" aria-hidden="true"></span>
            <span>Properties</span>
          </summary>
          <div class="control-grid">
            {#each geometryControls as control (control.key)}
              <label class="compact-number-row">
                <span>{control.label}</span>
                <input
                  type="number"
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  bind:value={planetoid[control.key]}
                />
              </label>
            {/each}
          </div>
        </details>
      </fieldset>
    </div>
  </section>
</div>

{#if presetsManagerOpen}
  <div class="preset-manager-backdrop" role="dialog" aria-modal="true" aria-label="Preset manager">
    <section class="preset-manager-panel">
      <header class="preset-manager-header">
        <h2>Manage Presets</h2>
        <button type="button" class="close-manager-button" onclick={closePresetManager}
          >Close</button
        >
      </header>

      <div class="preset-group">
        <h3>Preconfigured</h3>
        <ul class="preset-list">
          {#each BUILTIN_PRESETS as preset (preset.id)}
            <li class="preset-row">
              <span>{preset.name}</span>
              <div class="preset-row-actions">
                <button
                  type="button"
                  class="preset-row-button"
                  onclick={() => applyPresetAndCloseManager(preset)}
                >
                  Apply
                </button>
                <button
                  type="button"
                  class="preset-row-button"
                  onclick={() => exportPresetToCli(preset)}
                >
                  CLI
                </button>
              </div>
            </li>
          {/each}
        </ul>
      </div>

      <div class="preset-group">
        <h3>Saved</h3>
        {#if userPresets.length === 0}
          <p class="preset-empty">No saved presets yet.</p>
        {:else}
          <ul class="preset-list">
            {#each userPresets as preset (preset.id)}
              <li class="preset-row">
                <span>{preset.name}</span>
                <div class="preset-row-actions">
                  <button
                    type="button"
                    class="preset-row-button"
                    onclick={() => applyPresetAndCloseManager(preset)}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    class="preset-row-button"
                    onclick={() => exportPresetToCli(preset)}
                  >
                    CLI
                  </button>
                  <button
                    type="button"
                    class="preset-row-button delete"
                    onclick={() => deleteUserPreset(preset.id)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </section>
  </div>
{/if}

<style>
  .page {
    min-height: 100%;
    display: grid;
    grid-template-rows: auto 1fr;
  }

  .page-title {
    margin: 0;
    padding: 1.1rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    color: #f2f8ff;
    font-size: clamp(1.35rem, 2.1vw, 2rem);
    font-weight: 760;
    letter-spacing: 0.03em;
    line-height: 1.1;
    text-transform: uppercase;
    border-top: 1px solid rgba(176, 208, 239, 0.35);
    border-bottom: 1px solid rgba(176, 208, 239, 0.26);
    background: linear-gradient(120deg, #174477, #102143), rgba(6, 13, 28, 0.72);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 8px 26px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(4px);
  }

  .page-title-actions {
    display: flex;
    align-items: center;
    gap: 0.55rem;
  }

  .page-title-link {
    border: 1px solid rgba(176, 208, 239, 0.45);
    border-radius: 999px;
    color: #eaf3ff;
    background: rgba(5, 14, 30, 0.55);
    padding: 0.4rem 0.8rem;
    text-decoration: none;
    font-size: 0.72rem;
    letter-spacing: 0.07em;
    transition:
      transform 120ms ease,
      border-color 120ms ease,
      background-color 120ms ease;
  }

  .page-title-link:hover {
    transform: translateY(-1px);
    border-color: rgba(222, 238, 255, 0.85);
    background: rgba(10, 24, 49, 0.82);
  }

  .page-title-link:focus-visible {
    outline: 2px solid #6cb3ff;
    outline-offset: 2px;
  }

  .page-title-github-link {
    width: 2rem;
    height: 2rem;
    min-width: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(176, 208, 239, 0.45);
    border-radius: 999px;
    color: #eaf3ff;
    background: rgba(5, 14, 30, 0.55);
    transition:
      transform 120ms ease,
      border-color 120ms ease,
      background-color 120ms ease;
  }

  .page-title-github-link:hover {
    transform: translateY(-1px);
    border-color: rgba(222, 238, 255, 0.85);
    background: rgba(10, 24, 49, 0.82);
  }

  .page-title-github-link:focus-visible {
    outline: 2px solid #6cb3ff;
    outline-offset: 2px;
  }

  .page-title-github-link svg {
    width: 1.2rem;
    height: 1.2rem;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .threlte-view {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 1rem;
    min-height: 0;
    padding: 1rem;
    background:
      radial-gradient(circle at top, rgba(18, 58, 103, 0.718), transparent 80%),
      linear-gradient(180deg, #020712 0%, #050b18 100%);
  }

  .canvas-shell {
    width: min(100%, calc(90vh - 1rem));
    aspect-ratio: 1 / 1;
    max-height: calc(90vh - 4rem);
    justify-self: start;
    border: 1px solid #8eb4dd;
    border-radius: 18px;
    overflow: hidden;
    background: #01040b;
  }

  .canvas-shell :global(canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }

  .controls {
    display: grid;
    gap: 1rem;
    align-content: start;
  }

  fieldset {
    margin: 0;
    border: 1px solid #8eb4dd;
    border-radius: 14px;
    padding: 1rem;
    display: grid;
    gap: 0.85rem;
    background: rgba(5, 12, 25, 0.88);
    color: #d7e4f4;
  }

  legend {
    padding: 0 0.35rem;
    color: #f0f6ff;
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  label {
    display: grid;
    gap: 0.35rem;
    font-size: 0.88rem;
  }

  .label-row {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    column-gap: 0.75rem;
  }

  .label-value {
    text-align: right;
    opacity: 0.7;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
    padding-right: 0.2rem;
  }

  select,
  input,
  button {
    border: 1px solid #8eb4dd;
    border-radius: 10px;
    padding: 0.55rem 0.7rem;
    background: rgba(10, 18, 34, 0.95);
    color: #f0f6ff;
  }

  .save-actions {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.8rem;
  }

  .export-actions {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: max-content;
    gap: 0.55rem;
  }

  .action {
    padding: 0.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-weight: 700;
    letter-spacing: 0.04em;
    border-radius: 10px;
    background-color: rgb(63, 235, 109);
    color: black;
  }

  .preset-menu {
    position: relative;
    margin-left: auto;
  }

  .preset-menu summary {
    list-style: none;
  }

  .preset-menu summary::-webkit-details-marker {
    display: none;
  }

  .preset-menu-trigger {
    background: rgb(80, 130, 230);
    color: #eef4ff;
  }

  .preset-menu-dropdown {
    position: absolute;
    right: 0;
    top: calc(100% + 0.35rem);
    width: 13.5rem;
    display: grid;
    gap: 0.25rem;
    padding: 0.35rem;
    border: 1px solid rgba(142, 180, 221, 0.45);
    border-radius: 10px;
    background: rgba(7, 14, 28, 0.97);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    z-index: 20;
  }

  .preset-menu-item {
    width: 100%;
    text-align: left;
    padding: 0.5rem 0.6rem;
    border-radius: 8px;
    font-size: 0.82rem;
    cursor: pointer;
  }

  .preset-menu-item:hover {
    background: rgba(70, 126, 236, 0.24);
  }

  .preset-menu-item:focus-visible {
    outline: 2px solid #6cb3ff;
    outline-offset: 1px;
  }

  .preset-manager-backdrop {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: rgba(2, 8, 20, 0.7);
    z-index: 200;
  }

  .preset-manager-panel {
    width: min(520px, 100%);
    max-height: min(85vh, 700px);
    overflow: auto;
    border: 1px solid rgba(142, 180, 221, 0.45);
    border-radius: 14px;
    background: rgba(7, 14, 28, 0.98);
    padding: 1rem;
    color: #dbe9f7;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
  }

  .preset-manager-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.9rem;
  }

  .preset-manager-header h2 {
    margin: 0;
    font-size: 1rem;
  }

  .close-manager-button {
    width: auto;
    font-size: 0.82rem;
    padding: 0.45rem 0.65rem;
  }

  .preset-group {
    display: grid;
    gap: 0.45rem;
    margin-bottom: 1rem;
  }

  .preset-group h3 {
    margin: 0;
    font-size: 0.86rem;
    opacity: 0.92;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .preset-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.45rem;
  }

  .preset-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    padding: 0.5rem 0.55rem;
    border-radius: 8px;
    background: rgba(16, 28, 54, 0.65);
  }

  .preset-row-actions {
    display: flex;
    gap: 0.35rem;
  }

  .preset-row-button {
    width: auto;
    padding: 0.35rem 0.5rem;
    font-size: 0.76rem;
    border-radius: 7px;
  }

  .preset-row-button.delete {
    border-color: rgba(218, 98, 120, 0.8);
    color: #ffd4db;
  }

  .preset-empty {
    margin: 0;
    font-size: 0.82rem;
    opacity: 0.75;
  }

  .scene-action-popover {
    position: fixed;
    inset: auto auto auto auto;
    margin: 0;
    min-width: 13rem;
    max-width: 15rem;
    padding: 0.45rem 0.55rem;
    border-radius: 8px;
    border: 1px solid rgba(142, 180, 221, 0.45);
    background: rgba(7, 14, 28, 0.96);
    color: #dbe9f7;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0;
    line-height: 1.35;
    z-index: 1000;
  }

  .scene-action-popover::backdrop {
    background: transparent;
  }

  input[type='color'] {
    width: 100%;
    min-height: 2.75rem;
    padding: 0.2rem;
  }

  .toggle-row {
    grid-template-columns: 1fr auto;
    align-items: center;
  }

  .compact-number-row {
    grid-template-columns: 1fr auto;
    align-items: center;
    column-gap: 0.75rem;
  }

  .compact-number-row input[type='number'] {
    width: 6.5rem;
    min-width: 6.5rem;
    text-align: left;
    font-variant-numeric: tabular-nums;
    padding-right: 0.25rem;
  }

  .toggle-row input[type='checkbox'] {
    width: 1rem;
    height: 1rem;
    padding: 0;
  }

  .view-mode-group {
    display: grid;
    gap: 0.3rem;
    padding: 0.55rem 0.6rem;
    border: 1px solid rgba(142, 180, 221, 0.25);
    border-radius: 10px;
    background: rgba(7, 14, 28, 0.55);
  }

  .radio-row {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    column-gap: 0.45rem;
    font-size: 0.85rem;
  }

  .radio-row input[type='radio'] {
    width: 1rem;
    height: 1rem;
    margin: 0;
    padding: 0;
  }

  .palette-preview {
    width: 100%;
    height: 2rem;
    margin: 0.7rem 0;
    border-radius: 10px;
    border: 1px solid #8eb4dd;
    box-shadow:
      inset 0 0 0 1px rgba(4, 10, 20, 0.25),
      0 4px 14px rgba(0, 0, 0, 0.2);
  }

  .control-grid {
    display: grid;
    gap: 0.75rem;
  }

  .control-section {
    border: 1px solid rgba(142, 180, 221, 0.18);
    border-radius: 10px;
    padding: 0.5rem 0.75rem 0.75rem;
    background: rgba(7, 14, 28, 0.55);
  }

  .control-section:not([open]) {
    padding: 0.35rem 0.75rem;
  }

  .control-section summary {
    cursor: pointer;
    list-style: none;
    display: inline-flex;
    width: 100%;
    box-sizing: border-box;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: #f0f6ff;
    margin: 0;
  }

  .control-section[open] summary {
    margin: 0.1rem 0 0.6rem;
  }

  .control-section summary::-webkit-details-marker {
    display: none;
  }

  .summary-with-toggle {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 0.5rem;
  }

  .summary-main {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex: 1 1 auto;
    min-width: 0;
  }

  .summary-chevron {
    width: 0;
    height: 0;
    border-top: 0.34rem solid transparent;
    border-bottom: 0.34rem solid transparent;
    border-left: 0.48rem solid #f0f6ff;
    opacity: 0.82;
    transform: rotate(0deg);
    transition: transform 140ms ease;
    transform-origin: 30% 50%;
    flex: 0 0 auto;
  }

  .control-section[open] .summary-chevron {
    transform: rotate(90deg);
  }

  .summary-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
  }

  .summary-toggle input[type='checkbox'] {
    width: 1rem;
    height: 1rem;
    padding: 0;
  }

  .extra-pad {
    padding-bottom: 0.75rem;
  }

  @media (max-width: 900px) {
    .threlte-view {
      grid-template-columns: 1fr;
    }

    .canvas-shell {
      width: min(100%, calc(100vh - 2rem));
      justify-self: center;
    }

    .page-title {
      flex-wrap: wrap;
      gap: 0.6rem;
      padding: 0.95rem 1rem;
    }

    .page-title-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
