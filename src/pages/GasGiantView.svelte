<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { tick } from 'svelte'
  import { WebGLRenderer } from 'three'
  import GasGiantScene from '../lib/components/Threlte/GasGiantScene.svelte'
  import {
    GasGiantPaletteNames,
    GasGiantPalettes,
    type GasGiantPaletteName,
  } from '../lib/components/Threlte/Objects/GasGiantPalettes'
  import {
    DefaultGasGiantSettings,
    GasGiantCliFlagByRangeKey,
    GasGiantCliToggleFlags,
    GasGiantUiLabels,
    MaxValues,
    MinValues,
    type GasGiantRangeKey,
    type GasGiantSettings,
  } from '../lib/components/Threlte/Objects/GasGiantSettings'
  import { BUILTIN_GAS_GIANT_PRESETS, type GasGiantPreset } from './gas-giant-presets'

  const { onOpenWelcome = () => {} }: { onOpenWelcome?: () => void } = $props()

  type GasGiantViewSettings = GasGiantSettings
  type GasGiantUiState = {
    sceneSectionOpen: boolean
    colorSettingsSectionOpen: boolean
    cloudSettingsSectionOpen: boolean
    stormSectionOpen: boolean
    materialPropertiesSectionOpen: boolean
    textureResolutionSectionOpen: boolean
    stormsEnabled: boolean
  }

  type GasGiantSceneExports = {
    downloadTextureMapPng: (fileName?: string) => Promise<boolean>
    downloadBumpMapPng: (fileName?: string) => Promise<boolean>
  }

  const GAS_GIANT_SETTINGS_STORAGE_KEY = 'gas-giant-view-settings-v1'
  const GAS_GIANT_UI_STORAGE_KEY = 'gas-giant-view-ui-v1'
  const GAS_GIANT_PRESETS_STORAGE_KEY = 'gas-giant-view-presets-v1'

  const DEFAULT_GAS_GIANT_SETTINGS: GasGiantViewSettings = { ...DefaultGasGiantSettings }
  const NUMERIC_RANGE_KEYS = (Object.keys(MinValues) as GasGiantRangeKey[]).filter(
    (key) => key !== 'seed'
  )

  let canvasShell: HTMLDivElement | undefined = $state(undefined)
  let gasGiantScene: GasGiantSceneExports | undefined = $state(undefined)
  let isSaving = $state(false)

  let seed = $state(DEFAULT_GAS_GIANT_SETTINGS.seed)
  let autoRotate = $state(DEFAULT_GAS_GIANT_SETTINGS.autoRotate)
  let palette = $state<GasGiantPaletteName>(DEFAULT_GAS_GIANT_SETTINGS.palette)
  let surfaceTint = $state(DEFAULT_GAS_GIANT_SETTINGS.surfaceTint)
  let colorScale = $state(DEFAULT_GAS_GIANT_SETTINGS.colorScale)
  let tintShadowFloor = $state(DEFAULT_GAS_GIANT_SETTINGS.tintShadowFloor)
  let cloudBandCount = $state(DEFAULT_GAS_GIANT_SETTINGS.cloudBandCount)
  let cloudBandSharpness = $state(DEFAULT_GAS_GIANT_SETTINGS.cloudBandSharpness)
  let cloudChaos = $state(DEFAULT_GAS_GIANT_SETTINGS.cloudChaos)
  let enableStorms = $state(DEFAULT_GAS_GIANT_SETTINGS.enableStorms)
  let stormCount = $state(DEFAULT_GAS_GIANT_SETTINGS.stormCount)
  let stormScale = $state(DEFAULT_GAS_GIANT_SETTINGS.stormScale)
  let stormPower = $state(DEFAULT_GAS_GIANT_SETTINGS.stormPower)
  let stormStrength = $state(DEFAULT_GAS_GIANT_SETTINGS.stormStrength)
  let stormColorStrength = $state(DEFAULT_GAS_GIANT_SETTINGS.stormColorStrength)
  let bumpScale = $state(DEFAULT_GAS_GIANT_SETTINGS.bumpScale)
  let roughness = $state(DEFAULT_GAS_GIANT_SETTINGS.roughness)
  let metalness = $state(DEFAULT_GAS_GIANT_SETTINGS.metalness)
  let bumpTextureSize = $state(DEFAULT_GAS_GIANT_SETTINGS.bumpTextureSize)
  let colorTextureSize = $state(DEFAULT_GAS_GIANT_SETTINGS.colorTextureSize)

  let settingsHydrated = $state(false)
  let sectionTogglesHydrated = $state(false)
  let presetsHydrated = $state(false)

  let sceneSectionOpen = $state(true)
  let colorSettingsSectionOpen = $state(true)
  let cloudSettingsSectionOpen = $state(true)
  let stormSectionOpen = $state(true)
  let materialPropertiesSectionOpen = $state(true)
  let textureResolutionSectionOpen = $state(false)
  let stormsEnabled = $state(DEFAULT_GAS_GIANT_SETTINGS.enableStorms)
  let wasStormsEnabled = $state(DEFAULT_GAS_GIANT_SETTINGS.enableStorms)

  let presetsMenuOpen = $state(false)
  let presetsMenuElement: HTMLDetailsElement | undefined = $state(undefined)
  let presetsManagerOpen = $state(false)
  let userPresets = $state<GasGiantPreset[]>([])

  const effectiveStormsEnabled = $derived(stormsEnabled)

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
  }

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

  function sanitizeGasGiantSettings(input: unknown): GasGiantViewSettings {
    const raw =
      typeof input === 'object' && input !== null ? (input as Record<string, unknown>) : {}

    const sanitizedPalette = GasGiantPaletteNames.includes(raw.palette as GasGiantPaletteName)
      ? (raw.palette as GasGiantPaletteName)
      : DEFAULT_GAS_GIANT_SETTINGS.palette

    const sanitizedSurfaceTint =
      typeof raw.surfaceTint === 'string' &&
      /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(raw.surfaceTint)
        ? raw.surfaceTint
        : DEFAULT_GAS_GIANT_SETTINGS.surfaceTint

    const legacyCloudFiligreeStrength =
      typeof raw.cloudFiligreeStrength === 'number' ? raw.cloudFiligreeStrength : undefined

    const legacyStormsEnabled =
      typeof raw.enableStorms === 'boolean'
        ? raw.enableStorms
        : typeof raw.stormCount === 'number'
          ? raw.stormCount > 0
          : DEFAULT_GAS_GIANT_SETTINGS.enableStorms

    return {
      seed:
        typeof raw.seed === 'number'
          ? Math.round(clamp(raw.seed, MinValues.seed, MaxValues.seed))
          : DEFAULT_GAS_GIANT_SETTINGS.seed,
      autoRotate:
        typeof raw.autoRotate === 'boolean'
          ? raw.autoRotate
          : DEFAULT_GAS_GIANT_SETTINGS.autoRotate,
      palette: sanitizedPalette,
      surfaceTint: sanitizedSurfaceTint,
      colorScale:
        typeof raw.colorScale === 'number'
          ? clamp(raw.colorScale, MinValues.colorScale, MaxValues.colorScale)
          : DEFAULT_GAS_GIANT_SETTINGS.colorScale,
      tintShadowFloor:
        typeof raw.tintShadowFloor === 'number'
          ? clamp(raw.tintShadowFloor, MinValues.tintShadowFloor, MaxValues.tintShadowFloor)
          : DEFAULT_GAS_GIANT_SETTINGS.tintShadowFloor,
      cloudBandCount:
        typeof raw.cloudBandCount === 'number'
          ? Math.round(
              clamp(raw.cloudBandCount, MinValues.cloudBandCount, MaxValues.cloudBandCount)
            )
          : DEFAULT_GAS_GIANT_SETTINGS.cloudBandCount,
      cloudBandSharpness:
        typeof raw.cloudBandSharpness === 'number'
          ? clamp(
              raw.cloudBandSharpness,
              MinValues.cloudBandSharpness,
              MaxValues.cloudBandSharpness
            )
          : DEFAULT_GAS_GIANT_SETTINGS.cloudBandSharpness,
      cloudChaos:
        typeof raw.cloudChaos === 'number'
          ? clamp(raw.cloudChaos, MinValues.cloudChaos, MaxValues.cloudChaos)
          : typeof legacyCloudFiligreeStrength === 'number'
            ? clamp(legacyCloudFiligreeStrength, MinValues.cloudChaos, MaxValues.cloudChaos)
            : DEFAULT_GAS_GIANT_SETTINGS.cloudChaos,
      enableStorms: legacyStormsEnabled,
      stormCount:
        typeof raw.stormCount === 'number'
          ? Math.round(clamp(raw.stormCount, MinValues.stormCount, MaxValues.stormCount))
          : DEFAULT_GAS_GIANT_SETTINGS.stormCount,
      stormScale:
        typeof raw.stormScale === 'number'
          ? clamp(raw.stormScale, MinValues.stormScale, MaxValues.stormScale)
          : DEFAULT_GAS_GIANT_SETTINGS.stormScale,
      stormPower:
        typeof raw.stormPower === 'number'
          ? clamp(raw.stormPower, MinValues.stormPower, MaxValues.stormPower)
          : DEFAULT_GAS_GIANT_SETTINGS.stormPower,
      stormStrength:
        typeof raw.stormStrength === 'number'
          ? clamp(raw.stormStrength, MinValues.stormStrength, MaxValues.stormStrength)
          : DEFAULT_GAS_GIANT_SETTINGS.stormStrength,
      stormColorStrength:
        typeof raw.stormColorStrength === 'number'
          ? clamp(
              raw.stormColorStrength,
              MinValues.stormColorStrength,
              MaxValues.stormColorStrength
            )
          : DEFAULT_GAS_GIANT_SETTINGS.stormColorStrength,
      bumpScale:
        typeof raw.bumpScale === 'number'
          ? clamp(raw.bumpScale, MinValues.bumpScale, MaxValues.bumpScale)
          : DEFAULT_GAS_GIANT_SETTINGS.bumpScale,
      roughness:
        typeof raw.roughness === 'number'
          ? clamp(raw.roughness, MinValues.roughness, MaxValues.roughness)
          : DEFAULT_GAS_GIANT_SETTINGS.roughness,
      metalness:
        typeof raw.metalness === 'number'
          ? clamp(raw.metalness, MinValues.metalness, MaxValues.metalness)
          : DEFAULT_GAS_GIANT_SETTINGS.metalness,
      bumpTextureSize:
        typeof raw.bumpTextureSize === 'number'
          ? Math.round(
              clamp(raw.bumpTextureSize, MinValues.bumpTextureSize, MaxValues.bumpTextureSize)
            )
          : DEFAULT_GAS_GIANT_SETTINGS.bumpTextureSize,
      colorTextureSize:
        typeof raw.colorTextureSize === 'number'
          ? Math.round(
              clamp(raw.colorTextureSize, MinValues.colorTextureSize, MaxValues.colorTextureSize)
            )
          : DEFAULT_GAS_GIANT_SETTINGS.colorTextureSize,
    }
  }

  function sanitizePresetName(input: unknown) {
    if (typeof input !== 'string') return ''
    return input.trim().replace(/\s+/g, ' ').slice(0, 48)
  }

  function createPresetId() {
    const random = Math.random().toString(36).slice(2, 8)
    return `giant-preset-${Date.now()}-${random}`
  }

  function sanitizePreset(input: unknown): GasGiantPreset | null {
    if (typeof input !== 'object' || input === null) return null

    const raw = input as Record<string, unknown>
    const name = sanitizePresetName(raw.name)
    if (!name) return null

    const id =
      typeof raw.id === 'string' && raw.id.trim().length > 0 ? raw.id.trim() : createPresetId()

    return {
      id,
      name,
      settings: sanitizeGasGiantSettings(raw.settings),
    }
  }

  function applyGasGiantSettings(settings: GasGiantViewSettings) {
    seed = settings.seed
    autoRotate = settings.autoRotate
    palette = settings.palette
    surfaceTint = settings.surfaceTint
    colorScale = settings.colorScale
    tintShadowFloor = settings.tintShadowFloor
    cloudBandCount = settings.cloudBandCount
    cloudBandSharpness = settings.cloudBandSharpness
    cloudChaos = settings.cloudChaos
    enableStorms = settings.enableStorms
    stormsEnabled = settings.enableStorms
    stormCount = settings.stormCount
    stormScale = settings.stormScale
    stormPower = settings.stormPower
    stormStrength = settings.stormStrength
    stormColorStrength = settings.stormColorStrength
    bumpScale = settings.bumpScale
    roughness = settings.roughness
    metalness = settings.metalness
    bumpTextureSize = settings.bumpTextureSize
    colorTextureSize = settings.colorTextureSize
  }

  function resetSceneToDefaults() {
    applyGasGiantSettings(DEFAULT_GAS_GIANT_SETTINGS)
  }

  function closePresetsMenu() {
    presetsMenuOpen = false
  }

  function onResetSceneFromMenu() {
    closePresetsMenu()
    resetSceneToDefaults()
  }

  function saveCurrentPreset() {
    const enteredName = window.prompt('Name this preset:', 'My giant preset')
    const name = sanitizePresetName(enteredName)
    if (!name) return

    const nextPreset: GasGiantPreset = {
      id: createPresetId(),
      name,
      settings: sanitizeGasGiantSettings({
        seed,
        autoRotate,
        palette,
        surfaceTint,
        colorScale,
        tintShadowFloor,
        cloudBandCount,
        cloudBandSharpness,
        cloudChaos,
        enableStorms: effectiveStormsEnabled,
        stormCount,
        stormScale,
        stormPower,
        stormStrength,
        stormColorStrength,
        bumpScale,
        roughness,
        metalness,
        bumpTextureSize,
        colorTextureSize,
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
    settings: GasGiantSettings,
    toggles: { stormsEnabled: boolean }
  ) {
    const args: string[] = [
      '--palette',
      quoteCliValue(settings.palette),
      '--surface-tint',
      quoteCliValue(settings.surfaceTint),
    ]

    for (const key of NUMERIC_RANGE_KEYS) {
      const flag = GasGiantCliFlagByRangeKey[key]
      const value = settings[key]
      args.push(flag, String(value))
    }

    args.push(GasGiantCliToggleFlags.autoRotate, toBooleanCliValue(settings.autoRotate))
    args.push(GasGiantCliToggleFlags.stormsEnabled, toBooleanCliValue(toggles.stormsEnabled))

    args.push(GasGiantCliFlagByRangeKey.seed, '1')
    args.push('--step', '1')
    args.push('--count', '1')

    return `npm run auto-generate-gas-giants -- ${args.join(' ')}`
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
    const command = buildCliCommandFromPreset(
      {
        seed,
        autoRotate,
        palette,
        surfaceTint,
        colorScale,
        tintShadowFloor,
        cloudBandCount,
        cloudBandSharpness,
        cloudChaos,
        enableStorms: effectiveStormsEnabled,
        stormCount,
        stormScale,
        stormPower,
        stormStrength,
        stormColorStrength,
        bumpScale,
        roughness,
        metalness,
        bumpTextureSize,
        colorTextureSize,
      },
      { stormsEnabled: effectiveStormsEnabled }
    )

    const copied = await copyTextToClipboard(command)
    if (copied) {
      window.alert('CLI command copied to clipboard.')
    } else {
      window.prompt('Copy this CLI command:', command)
    }
  }

  async function exportPresetToCli(preset: GasGiantPreset) {
    const stormsEnabledFromPreset =
      preset.settings.enableStorms ||
      preset.settings.stormCount > 0 ||
      preset.settings.stormStrength > 0

    const command = buildCliCommandFromPreset(preset.settings, {
      stormsEnabled: stormsEnabledFromPreset,
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

  function applyPreset(preset: GasGiantPreset) {
    applyGasGiantSettings(preset.settings)
  }

  function applyPresetAndCloseManager(preset: GasGiantPreset) {
    applyPreset(preset)
    presetsManagerOpen = false
  }

  function deleteUserPreset(presetId: string) {
    userPresets = userPresets.filter((entry) => entry.id !== presetId)
  }

  function closePresetManager() {
    presetsManagerOpen = false
  }

  $effect(() => {
    if (settingsHydrated) return

    try {
      const raw = localStorage.getItem(GAS_GIANT_SETTINGS_STORAGE_KEY)
      if (raw) {
        applyGasGiantSettings(sanitizeGasGiantSettings(JSON.parse(raw)))
      }
    } catch (error) {
      console.warn('Failed to restore gas giant settings from localStorage', error)
    } finally {
      settingsHydrated = true
    }
  })

  $effect(() => {
    if (!settingsHydrated) return

    try {
      const settings: GasGiantViewSettings = {
        seed,
        autoRotate,
        palette,
        surfaceTint,
        colorScale,
        tintShadowFloor,
        cloudBandCount,
        cloudBandSharpness,
        cloudChaos,
        enableStorms: effectiveStormsEnabled,
        stormCount,
        stormScale,
        stormPower,
        stormStrength,
        stormColorStrength,
        bumpScale,
        roughness,
        metalness,
        bumpTextureSize,
        colorTextureSize,
      }

      localStorage.setItem(GAS_GIANT_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
    } catch (error) {
      console.warn('Failed to persist gas giant settings to localStorage', error)
    }
  })

  function sanitizeGasGiantUiState(input: unknown): GasGiantUiState | null {
    if (typeof input !== 'object' || input === null) return null

    const raw = input as Record<string, unknown>
    const hasAllKeys =
      typeof raw.sceneSectionOpen === 'boolean' &&
      typeof raw.colorSettingsSectionOpen === 'boolean' &&
      typeof raw.cloudSettingsSectionOpen === 'boolean' &&
      typeof raw.stormSectionOpen === 'boolean' &&
      typeof raw.materialPropertiesSectionOpen === 'boolean' &&
      typeof raw.textureResolutionSectionOpen === 'boolean' &&
      typeof raw.stormsEnabled === 'boolean'

    if (!hasAllKeys) return null

    return {
      sceneSectionOpen: raw.sceneSectionOpen as boolean,
      colorSettingsSectionOpen: raw.colorSettingsSectionOpen as boolean,
      cloudSettingsSectionOpen: raw.cloudSettingsSectionOpen as boolean,
      stormSectionOpen: raw.stormSectionOpen as boolean,
      materialPropertiesSectionOpen: raw.materialPropertiesSectionOpen as boolean,
      textureResolutionSectionOpen: raw.textureResolutionSectionOpen as boolean,
      stormsEnabled: raw.stormsEnabled as boolean,
    }
  }

  $effect(() => {
    if (!settingsHydrated || sectionTogglesHydrated) return

    let restoredUiState: GasGiantUiState | null = null
    try {
      const rawUi = localStorage.getItem(GAS_GIANT_UI_STORAGE_KEY)
      if (rawUi) {
        restoredUiState = sanitizeGasGiantUiState(JSON.parse(rawUi))
      }
    } catch (error) {
      console.warn('Failed to restore gas giant UI state from localStorage', error)
    }

    if (restoredUiState) {
      sceneSectionOpen = restoredUiState.sceneSectionOpen
      colorSettingsSectionOpen = restoredUiState.colorSettingsSectionOpen
      cloudSettingsSectionOpen = restoredUiState.cloudSettingsSectionOpen
      stormSectionOpen = restoredUiState.stormSectionOpen
      materialPropertiesSectionOpen = restoredUiState.materialPropertiesSectionOpen
      textureResolutionSectionOpen = restoredUiState.textureResolutionSectionOpen
      stormsEnabled = restoredUiState.stormsEnabled
    } else {
      stormsEnabled = enableStorms
    }

    wasStormsEnabled = stormsEnabled
    sectionTogglesHydrated = true
  })

  $effect(() => {
    if (!settingsHydrated || !sectionTogglesHydrated) return

    try {
      const uiState: GasGiantUiState = {
        sceneSectionOpen,
        colorSettingsSectionOpen,
        cloudSettingsSectionOpen,
        stormSectionOpen,
        materialPropertiesSectionOpen,
        textureResolutionSectionOpen,
        stormsEnabled,
      }

      localStorage.setItem(GAS_GIANT_UI_STORAGE_KEY, JSON.stringify(uiState))
    } catch (error) {
      console.warn('Failed to persist gas giant UI state to localStorage', error)
    }
  })

  $effect(() => {
    if (presetsHydrated) return

    try {
      const raw = localStorage.getItem(GAS_GIANT_PRESETS_STORAGE_KEY)

      if (raw) {
        const parsed = JSON.parse(raw)
        const list = Array.isArray(parsed) ? parsed : []
        const sanitized: GasGiantPreset[] = []

        for (const entry of list) {
          const preset = sanitizePreset(entry)
          if (preset) sanitized.push(preset)
        }

        userPresets = sanitized
      }
    } catch (error) {
      console.warn('Failed to restore gas giant presets from localStorage', error)
    } finally {
      presetsHydrated = true
    }
  })

  $effect(() => {
    if (!presetsHydrated) return

    try {
      localStorage.setItem(GAS_GIANT_PRESETS_STORAGE_KEY, JSON.stringify(userPresets))
    } catch (error) {
      console.warn('Failed to persist gas giant presets to localStorage', error)
    }
  })

  $effect(() => {
    if (!sectionTogglesHydrated) return

    if (effectiveStormsEnabled !== wasStormsEnabled) {
      stormSectionOpen = effectiveStormsEnabled
      wasStormsEnabled = effectiveStormsEnabled
    }
  })

  async function saveScenePng() {
    if (!canvasShell || isSaving) return

    const canvas = canvasShell.querySelector('canvas')
    if (!(canvas instanceof HTMLCanvasElement)) {
      return
    }

    isSaving = true
    try {
      await tick()
      await nextAnimationFrame()

      const fileName = `generated-gas-giant-${getTimestamp()}.png`
      const dataUrl = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')

      downloadLink.href = dataUrl
      downloadLink.download = fileName
      downloadLink.click()
    } catch (error) {
      console.error(error)
    } finally {
      isSaving = false
    }
  }

  async function downloadTextureMapPng() {
    if (!gasGiantScene || isSaving) return

    isSaving = true
    try {
      const fileName = `generated-gas-giant-texture-${getTimestamp()}.png`
      await gasGiantScene.downloadTextureMapPng(fileName)
    } catch (error) {
      console.error(error)
    } finally {
      isSaving = false
    }
  }

  async function downloadBumpMapPng() {
    if (!gasGiantScene || isSaving) return

    isSaving = true
    try {
      const fileName = `generated-gas-giant-bump-${getTimestamp()}.png`
      await gasGiantScene.downloadBumpMapPng(fileName)
    } catch (error) {
      console.error(error)
    } finally {
      isSaving = false
    }
  }

  const selectedPaletteGradient = $derived(
    `linear-gradient(90deg, ${GasGiantPalettes[palette]
      .map((entry) => `rgb(${entry.r}, ${entry.g}, ${entry.b})`)
      .join(', ')})`
  )
</script>

<svelte:window onpointerdown={onWindowPointerDown} />

<div class="page">
  <h1 class="page-title">
    <span>Gas and Ice Giant Generator</span>
    <div class="page-title-actions">
      <a class="page-title-link" href="#/planetoids">Planetoid Generator</a>
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
      </a>
      <button
        type="button"
        class="page-title-help-button"
        onclick={onOpenWelcome}
        aria-label="Open welcome message"
        title="Open welcome message"
      >
        ?
      </button>
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
        <GasGiantScene
          bind:this={gasGiantScene}
          {seed}
          {autoRotate}
          {palette}
          {surfaceTint}
          {colorScale}
          {tintShadowFloor}
          {cloudBandCount}
          {cloudBandSharpness}
          {cloudChaos}
          enableStorms={effectiveStormsEnabled}
          {stormCount}
          {stormScale}
          {stormPower}
          {stormStrength}
          {stormColorStrength}
          {bumpScale}
          {roughness}
          {metalness}
          {bumpTextureSize}
          {colorTextureSize}
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
              onclick={saveScenePng}
              disabled={isSaving}
              aria-label="Save scene PNG"
            >
              PNG
            </button>
            <button
              type="button"
              class="action"
              onclick={downloadTextureMapPng}
              disabled={isSaving}
              aria-label="Download texture map"
            >
              TEX
            </button>
            <button
              type="button"
              class="action"
              onclick={downloadBumpMapPng}
              disabled={isSaving}
              aria-label="Download bump map"
            >
              BMP
            </button>
          </div>
          <details class="preset-menu" bind:this={presetsMenuElement} bind:open={presetsMenuOpen}>
            <summary class="action preset-menu-trigger" aria-label="Preset actions">PRESETS</summary
            >
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
        <details class="control-section" bind:open={sceneSectionOpen}>
          <summary>
            <span class="summary-chevron" aria-hidden="true"></span>
            <span>View</span>
          </summary>
          <label class="toggle-row">
            <span>{GasGiantUiLabels.autoRotate}</span>
            <input type="checkbox" bind:checked={autoRotate} />
          </label>
          <label class="compact-number-row">
            <span>{GasGiantUiLabels.seed}</span>
            <input type="number" min={0} max={999999} step="1" bind:value={seed} />
          </label>
        </details>
      </fieldset>

      <fieldset>
        <legend>Texture</legend>
        <details class="control-section" bind:open={colorSettingsSectionOpen}>
          <summary>
            <span class="summary-chevron" aria-hidden="true"></span>
            <span>Color settings</span>
          </summary>
          <label>
            {GasGiantUiLabels.palette}
            <select bind:value={palette}>
              {#each GasGiantPaletteNames as option (option)}
                <option value={option}>{option}</option>
              {/each}
            </select>
          </label>
          <div
            class="palette-preview"
            style:background={selectedPaletteGradient}
            aria-label="Selected giant palette gradient"
          ></div>
          <label class="extra-pad">
            <span class="label-row">
              <span>{GasGiantUiLabels.surfaceTint}</span>
              <span class="label-value">{surfaceTint.toUpperCase()}</span>
            </span>
            <input type="color" bind:value={surfaceTint} />
          </label>
          <div class="control-grid">
            <label class="compact-number-row">
              <span>Palette influence</span>
              <input type="number" min={0} max={2} step="0.05" bind:value={colorScale} />
            </label>
            <label class="compact-number-row">
              <span>Tint shadow floor</span>
              <input type="number" min={0} max={0.9} step="0.01" bind:value={tintShadowFloor} />
            </label>
          </div>
        </details>

        <details class="control-section" bind:open={cloudSettingsSectionOpen}>
          <summary>
            <span class="summary-chevron" aria-hidden="true"></span>
            <span>Cloud bands</span>
          </summary>
          <div class="control-grid">
            <label class="compact-number-row">
              <span>Cloud band count</span>
              <input type="number" min={2} max={28} step="1" bind:value={cloudBandCount} />
            </label>
            <label class="compact-number-row">
              <span>Band sharpness</span>
              <input type="number" min={0} max={1} step="0.01" bind:value={cloudBandSharpness} />
            </label>
            <label class="compact-number-row">
              <span>Cloud chaos</span>
              <input type="number" min={0} max={2} step="0.01" bind:value={cloudChaos} />
            </label>
          </div>
        </details>

        <details class="control-section" bind:open={textureResolutionSectionOpen}>
          <summary>
            <span class="summary-chevron" aria-hidden="true"></span>
            <span>Texture resolution</span>
          </summary>
          <div class="control-grid">
            <label class="compact-number-row">
              <span>Bump texture height</span>
              <input type="number" min={128} max={2048} step="1" bind:value={bumpTextureSize} />
            </label>
            <label class="compact-number-row">
              <span>Color texture height</span>
              <input type="number" min={64} max={2048} step="1" bind:value={colorTextureSize} />
            </label>
          </div>
        </details>
      </fieldset>

      <fieldset>
        <legend>Features</legend>
        <details class="control-section" bind:open={stormSectionOpen}>
          <summary
            class="summary-with-toggle"
            onclick={(event) => !effectiveStormsEnabled && event.preventDefault()}
          >
            <span class="summary-main">
              <span class="summary-chevron" aria-hidden="true"></span>
              <span>Storm systems</span>
            </span>
            <label class="summary-toggle">
              <input
                type="checkbox"
                bind:checked={stormsEnabled}
                onclick={(event) => event.stopPropagation()}
              />
            </label>
          </summary>
          <div class="control-grid">
            <label class="compact-number-row">
              <span>Storm count</span>
              <input
                type="number"
                min={0}
                max={32}
                step="1"
                bind:value={stormCount}
                disabled={!effectiveStormsEnabled}
              />
            </label>
            <label class="compact-number-row">
              <span>Storm scale</span>
              <input
                type="number"
                min={0}
                max={0.45}
                step="0.01"
                bind:value={stormScale}
                disabled={!effectiveStormsEnabled}
              />
            </label>
            <label class="compact-number-row">
              <span>Storm falloff power</span>
              <input
                type="number"
                min={0.5}
                max={6}
                step="0.1"
                bind:value={stormPower}
                disabled={!effectiveStormsEnabled}
              />
            </label>
            <label class="compact-number-row">
              <span>Storm strength</span>
              <input
                type="number"
                min={0}
                max={1.5}
                step="0.01"
                bind:value={stormStrength}
                disabled={!effectiveStormsEnabled}
              />
            </label>
            <label class="compact-number-row">
              <span>Storm color strength</span>
              <input
                type="number"
                min={0}
                max={1.5}
                step="0.01"
                bind:value={stormColorStrength}
                disabled={!effectiveStormsEnabled}
              />
            </label>
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
            <label class="compact-number-row">
              <span>Bump scale</span>
              <input type="number" min={0} max={10} step="0.05" bind:value={bumpScale} />
            </label>
            <label class="compact-number-row">
              <span>Roughness</span>
              <input type="number" min={0} max={1} step="0.01" bind:value={roughness} />
            </label>
            <label class="compact-number-row">
              <span>Metalness</span>
              <input type="number" min={0} max={1} step="0.01" bind:value={metalness} />
            </label>
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
          {#each BUILTIN_GAS_GIANT_PRESETS as preset (preset.id)}
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
  @import './generator-view-common.css';
</style>
