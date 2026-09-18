<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { tick } from 'svelte'
  import { WebGLRenderer } from 'three'
  import '../styles/common.css'
  import PresetManager, {
    type PresetListItem,
  } from '../lib/components/Controls/PresetManager.svelte'
  import SeedControl from '../lib/components/Controls/SeedControl.svelte'
  import PageTitle from '../lib/components/Layout/PageTitle.svelte'
  import PlanetoidScene from '../lib/components/Threlte/PlanetoidScene.svelte'
  import {
    PlanetoidPalettes,
    PlanetoidPaletteNames,
  } from '../lib/components/Threlte/Planetoid/PlanetoidPalettes'
  import {
    DefaultValues,
    MaxValues,
    MinValues,
    mergePlanetoidPresetSettings,
    PlanetoidCliFlagByRangeKey,
    PlanetoidCliToggleFlags,
    PlanetoidRangeLabels,
    sanitizePlanetoidPresetSettings,
    StepValues,
    PlanetoidUiLabels,
    sanitizePlanetoidSettings,
    type PlanetoidSettings,
    toPlanetoidPresetSettings,
    type PlanetoidViewMode,
  } from '../lib/components/Threlte/Planetoid/PlanetoidSettings'
  import { BUILTIN_PRESETS, type PlanetoidPreset } from '../presets/Planetoids'

  const { onOpenWelcome = () => {} }: { onOpenWelcome?: () => void } = $props()

  type NumericControlKey = Exclude<
    keyof PlanetoidSettings,
    | 'palette'
    | 'surfaceTint'
    | 'autoRotate'
    | 'showDebugMeshes'
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

  const DEFAULT_VALUES: PlanetoidSettings = { ...DefaultValues }

  const textureControls: NumericControlKey[] = [
    'colorScale',
    'tintShadowFloor',
    'swirliness',
    'normalStrength',
    'craterCount',
    'craterScale',
    'craterStrength',
    'craterSharpness',
    'craterColorStrength',
    'volcanoCount',
    'volcanoScale',
    'volcanoStrength',
    'volcanoColorStrength',
    'ridgeStrength',
    'ridgeFrequency',
    'ridgeSharpness',
    'ridgeColorWeight',
    'riftStrength',
    'riftFrequency',
    'riftWidth',
    'riftSharpness',
    'riftColorWeight',
    'ridgesRiftsBlend',
    'normalTextureSize',
    'colorTextureSize',
    'roughness',
    'metalness',
  ]

  const geometryControls: NumericControlKey[] = [
    'largeScale',
    'mediumScale',
    'smallScale',
    'mediumFrequency',
    'smallFrequency',
    'triangleDetail',
  ]

  let planetoid = $state<PlanetoidSettings>({ ...DEFAULT_VALUES })
  let settingsHydrated = $state(false)

  type PlanetoidSceneExports = {
    downloadTextureMapPng: (fileName?: string) => Promise<boolean>
    downloadNormalMapPng: (fileName?: string) => Promise<boolean>
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
  const textureResolutionControlKeys: NumericControlKey[] = [
    'normalTextureSize',
    'colorTextureSize',
  ]
  const materialControlKeys: NumericControlKey[] = ['normalStrength', 'roughness', 'metalness']
  const craterControlKeys: NumericControlKey[] = [
    'craterCount',
    'craterScale',
    'craterStrength',
    'craterSharpness',
    'craterColorStrength',
  ]
  const volcanoControlKeys: NumericControlKey[] = [
    'volcanoCount',
    'volcanoScale',
    'volcanoStrength',
    'volcanoColorStrength',
  ]
  const ridgeControlKeys: NumericControlKey[] = [
    'ridgeStrength',
    'ridgeFrequency',
    'ridgeSharpness',
    'ridgeColorWeight',
    'ridgesRiftsBlend',
  ]
  const riftControlKeys: NumericControlKey[] = [
    'riftStrength',
    'riftFrequency',
    'riftWidth',
    'riftSharpness',
    'riftColorWeight',
  ]

  const colorControls = textureControls.filter((control) => colorControlKeys.includes(control))
  const textureResolutionControls = textureControls.filter((control) =>
    textureResolutionControlKeys.includes(control)
  )
  const materialControls = textureControls.filter((control) =>
    materialControlKeys.includes(control)
  )
  const craterControls = textureControls.filter((control) => craterControlKeys.includes(control))
  const volcanoControls = textureControls.filter((control) => volcanoControlKeys.includes(control))
  const ridgeControls = textureControls.filter((control) => ridgeControlKeys.includes(control))
  const riftControls = textureControls.filter((control) => riftControlKeys.includes(control))

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
      settings: sanitizePlanetoidPresetSettings(raw.settings),
    }
  }

  function applyPlanetoidSettings(settings: PlanetoidSettings) {
    planetoid = sanitizePlanetoidSettings(settings)
    cratersEnabled = planetoid.enableCraters
    volcanoesEnabled = planetoid.enableVolcanoes
    ridgesEnabled = planetoid.enableRidges
    riftsEnabled = planetoid.enableRifts
  }

  function resetSceneToDefaults() {
    applyPlanetoidSettings(DEFAULT_VALUES)
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
      settings: toPlanetoidPresetSettings(
        sanitizePlanetoidSettings({
          ...planetoid,
          enableCraters: effectiveCratersEnabled,
          enableRidges: effectiveRidgesEnabled,
          enableRifts: effectiveRiftsEnabled,
          enableVolcanoes: effectiveVolcanoesEnabled,
        })
      ),
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
    const mergedPresetSettings = mergePlanetoidPresetSettings(planetoid, preset.settings)

    const command = buildCliCommandFromPreset(mergedPresetSettings, sceneViewMode, {
      cratersEnabled:
        mergedPresetSettings.enableCraters ||
        mergedPresetSettings.craterCount > 0 ||
        mergedPresetSettings.craterStrength > 0,
      ridgesEnabled: mergedPresetSettings.enableRidges || mergedPresetSettings.ridgeStrength > 0,
      riftsEnabled: mergedPresetSettings.enableRifts || mergedPresetSettings.riftStrength > 0,
      volcanoesEnabled:
        mergedPresetSettings.enableVolcanoes || mergedPresetSettings.volcanoCount > 0,
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
    applyPlanetoidSettings(mergePlanetoidPresetSettings(planetoid, preset.settings))
  }

  function applyPresetAndCloseManager(preset: PlanetoidPreset) {
    applyPreset(preset)
    presetsManagerOpen = false
  }

  function findPresetById(presetId: string) {
    return (
      BUILTIN_PRESETS.find((preset) => preset.id === presetId) ??
      userPresets.find((preset) => preset.id === presetId)
    )
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
      raw.viewMode === 'mesh' || raw.viewMode === 'normal' || raw.viewMode === 'texture'

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
      volcanoesEnabled = planetoid.enableVolcanoes
      ridgesEnabled = planetoid.enableRidges
      riftsEnabled = planetoid.enableRifts
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

  async function downloadNormalMapPng() {
    if (!planetoidScene || isSaving) return

    isSaving = true
    try {
      const fileName = `generated-planetoid-normal-${getTimestamp()}.png`
      await planetoidScene.downloadNormalMapPng(fileName)
    } catch (error) {
      console.error(error)
    } finally {
      isSaving = false
    }
  }
</script>

<svelte:window onpointerdown={onWindowPointerDown} />

<div class="page">
  <PageTitle title="Planetoid Generator" activeHref="#/planetoids" {onOpenWelcome} />

  <section class="threlte-view">
    <div class="canvas-shell" bind:this={canvasShell}>
      <Canvas
        dpr={1}
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
          mediumFrequency={planetoid.mediumFrequency}
          smallFrequency={planetoid.smallFrequency}
          triangleDetail={planetoid.triangleDetail}
          normalStrength={planetoid.normalStrength}
          craterCount={planetoid.craterCount}
          craterScale={planetoid.craterScale}
          craterStrength={planetoid.craterStrength}
          craterSharpness={planetoid.craterSharpness}
          craterColorStrength={planetoid.craterColorStrength}
          enableCraters={effectiveCratersEnabled}
          enableVolcanoes={effectiveVolcanoesEnabled}
          volcanoCount={effectiveVolcanoesEnabled ? planetoid.volcanoCount : 0}
          volcanoScale={planetoid.volcanoScale}
          volcanoStrength={effectiveVolcanoesEnabled ? planetoid.volcanoStrength : 0}
          volcanoColorStrength={effectiveVolcanoesEnabled ? planetoid.volcanoColorStrength : 0}
          ridgeColorWeight={planetoid.ridgeColorWeight}
          riftColorWeight={planetoid.riftColorWeight}
          enableRidges={effectiveRidgesEnabled}
          enableRifts={effectiveRiftsEnabled}
          ridgeStrength={effectiveRidgesEnabled ? planetoid.ridgeStrength : 0}
          ridgeFrequency={planetoid.ridgeFrequency}
          ridgeSharpness={planetoid.ridgeSharpness}
          riftStrength={effectiveRiftsEnabled ? planetoid.riftStrength : 0}
          riftFrequency={planetoid.riftFrequency}
          riftWidth={planetoid.riftWidth}
          riftSharpness={planetoid.riftSharpness}
          ridgesRiftsBlend={planetoid.ridgesRiftsBlend}
          normalTextureSize={planetoid.normalTextureSize}
          colorTextureSize={planetoid.colorTextureSize}
          roughness={planetoid.roughness}
          metalness={planetoid.metalness}
          autoRotate={planetoid.autoRotate}
          showDebugMeshes={sceneViewMode === 'mesh' ? planetoid.showDebugMeshes : false}
          viewMode={sceneViewMode}
        />
      </Canvas>
    </div>

    <div class="controls">
      <fieldset>
        <legend>{PlanetoidUiLabels.scene}</legend>
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
              onmouseenter={(event) =>
                showActionPopover(event, 'Download the generated normal map.')}
              onmouseleave={hideActionPopover}
              onfocus={(event) => showActionPopover(event, 'Download the generated normal map.')}
              onblur={hideActionPopover}
              onclick={downloadNormalMapPng}
              disabled={isSaving}
              aria-label="Download normal map"
            >
              NRM
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
            <span>{PlanetoidUiLabels.viewMode}</span>
          </summary>
          <div class="view-mode-group" role="radiogroup" aria-label="Scene view mode">
            <label class="radio-row">
              <input type="radio" name="scene-view-mode" value="mesh" bind:group={sceneViewMode} />
              <span>3D</span>
            </label>
            <label class="radio-row">
              <input
                type="radio"
                name="scene-view-mode"
                value="normal"
                bind:group={sceneViewMode}
              />
              <span>Normal map</span>
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
          </div>
        </details>
        <label class="toggle-row">
          <span>{PlanetoidUiLabels.autoRotate}</span>
          <input type="checkbox" bind:checked={planetoid.autoRotate} />
        </label>
        <label class="toggle-row">
          <span>{PlanetoidUiLabels.showDebugMeshes}</span>
          <input
            type="checkbox"
            bind:checked={planetoid.showDebugMeshes}
            disabled={sceneViewMode !== 'mesh'}
          />
        </label>
        <SeedControl
          id="planetoid-seed"
          label={PlanetoidRangeLabels.seed}
          min={MinValues.seed}
          max={MaxValues.seed}
          step={StepValues.seed}
          bind:value={planetoid.seed}
        />
      </fieldset>

      <fieldset>
        <legend>{PlanetoidUiLabels.texture}</legend>
        <details class="control-section" bind:open={colorSettingsSectionOpen}>
          <summary>
            <span class="summary-chevron" aria-hidden="true"></span>
            <span>{PlanetoidUiLabels.colorSettings}</span>
          </summary>
          <label>
            {PlanetoidUiLabels.palette}
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
              <span>{PlanetoidUiLabels.surfaceTint}</span>
              <span class="label-value">{planetoid.surfaceTint.toUpperCase()}</span>
            </span>
            <input type="color" bind:value={planetoid.surfaceTint} />
          </label>
          <div class="control-grid">
            {#each colorControls as control (control)}
              <label class="compact-number-row">
                <span>{PlanetoidRangeLabels[control]}</span>
                <input
                  type="number"
                  min={MinValues[control]}
                  max={MaxValues[control]}
                  step={StepValues[control]}
                  bind:value={planetoid[control]}
                />
              </label>
            {/each}
          </div>
        </details>
        <details class="control-section" bind:open={textureResolutionSectionOpen}>
          <summary>
            <span class="summary-chevron" aria-hidden="true"></span>
            <span>{PlanetoidUiLabels.textureResolution}</span>
          </summary>
          <div class="control-grid">
            {#each textureResolutionControls as control (control)}
              <label class="compact-number-row">
                <span>{PlanetoidRangeLabels[control]}</span>
                <input
                  type="number"
                  min={MinValues[control]}
                  max={MaxValues[control]}
                  step={StepValues[control]}
                  bind:value={planetoid[control]}
                />
              </label>
            {/each}
          </div>
        </details>
      </fieldset>

      <fieldset>
        <legend>{PlanetoidUiLabels.material}</legend>
        <details class="control-section" bind:open={materialPropertiesSectionOpen}>
          <summary>
            <span class="summary-chevron" aria-hidden="true"></span>
            <span>{PlanetoidUiLabels.properties}</span>
          </summary>
          <div class="control-grid">
            {#each materialControls as control (control)}
              <label class="compact-number-row">
                <span>{PlanetoidRangeLabels[control]}</span>
                <input
                  type="number"
                  min={MinValues[control]}
                  max={MaxValues[control]}
                  step={StepValues[control]}
                  bind:value={planetoid[control]}
                />
              </label>
            {/each}
          </div>
        </details>
      </fieldset>

      <fieldset>
        <legend>{PlanetoidUiLabels.features}</legend>
        <details class="control-section" bind:open={craterSectionOpen}>
          <summary
            class="summary-with-toggle"
            onclick={(event) => !effectiveCratersEnabled && event.preventDefault()}
          >
            <span class="summary-main">
              <span class="summary-chevron" aria-hidden="true"></span>
              <span>{PlanetoidUiLabels.craters}</span>
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
            {#each craterControls as control (control)}
              <label class="compact-number-row">
                <span>{PlanetoidRangeLabels[control]}</span>
                <input
                  type="number"
                  min={MinValues[control]}
                  max={MaxValues[control]}
                  step={StepValues[control]}
                  bind:value={planetoid[control]}
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
              <span>{PlanetoidUiLabels.volcanoes}</span>
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
            {#each volcanoControls as control (control)}
              <label class="compact-number-row">
                <span>{PlanetoidRangeLabels[control]}</span>
                <input
                  type="number"
                  min={MinValues[control]}
                  max={MaxValues[control]}
                  step={StepValues[control]}
                  bind:value={planetoid[control]}
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
              <span>{PlanetoidUiLabels.ridges}</span>
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
            {#each ridgeControls as control (control)}
              <label class="compact-number-row">
                <span>{PlanetoidRangeLabels[control]}</span>
                <input
                  type="number"
                  min={MinValues[control]}
                  max={MaxValues[control]}
                  step={StepValues[control]}
                  bind:value={planetoid[control]}
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
              <span>{PlanetoidUiLabels.rifts}</span>
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
            {#each riftControls as control (control)}
              <label class="compact-number-row">
                <span>{PlanetoidRangeLabels[control]}</span>
                <input
                  type="number"
                  min={MinValues[control]}
                  max={MaxValues[control]}
                  step={StepValues[control]}
                  bind:value={planetoid[control]}
                  disabled={!riftSectionEnabled}
                />
              </label>
            {/each}
          </div>
        </details>
      </fieldset>

      <fieldset>
        <legend>{PlanetoidUiLabels.geometry}</legend>
        <details class="control-section" bind:open={geometryPropertiesSectionOpen}>
          <summary>
            <span class="summary-chevron" aria-hidden="true"></span>
            <span>{PlanetoidUiLabels.deformation}</span>
          </summary>
          <div class="control-grid">
            {#each geometryControls as control (control)}
              <label class="compact-number-row">
                <span>{PlanetoidRangeLabels[control]}</span>
                <input
                  type="number"
                  min={MinValues[control]}
                  max={MaxValues[control]}
                  step={StepValues[control]}
                  bind:value={planetoid[control]}
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
  <PresetManager
    builtInPresets={BUILTIN_PRESETS}
    {userPresets}
    onClose={closePresetManager}
    onApplyPreset={(entry: PresetListItem) => {
      const preset = findPresetById(entry.id)
      if (preset) applyPresetAndCloseManager(preset)
    }}
    onExportPreset={(entry: PresetListItem) => {
      const preset = findPresetById(entry.id)
      if (preset) exportPresetToCli(preset)
    }}
    onDeleteUserPreset={(entry: PresetListItem) => deleteUserPreset(entry.id)}
  />
{/if}

<style>
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
</style>
