<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { tick } from 'svelte'
  import { WebGLRenderer } from 'three'
  import '../styles/common.css'
  import CollapsibleControl from '../lib/components/Controls/CollapsibleControl.svelte'
  import PresetManager, {
    type PresetListItem,
  } from '../lib/components/Controls/PresetManager.svelte'
  import PaletteControl from '../lib/components/Controls/PaletteControl.svelte'
  import SeedControl from '../lib/components/Controls/SeedControl.svelte'
  import PageTitle from '../lib/components/Layout/PageTitle.svelte'
  import GasGiantScene from '../lib/components/Threlte/GasGiantScene.svelte'
  import {
    GasGiantPaletteNames,
    GasGiantPalettes,
  } from '../lib/components/Threlte/GasGiant/GasGiantPalettes'
  import { RingPaletteNames, RingPalettes } from '../lib/components/Threlte/Rings/RingPalettes'
  import {
    RingCliFlagByRangeKey,
    RingCliFlags,
    RingMaxValues,
    RingMinValues,
    RingRangeLabels,
    RingStepValues,
    type RingRangeKey,
  } from '../lib/components/Threlte/Rings/RingSettings'
  import {
    DefaultValues,
    GasGiantCliFlagByRangeKey,
    GasGiantCliToggleFlags,
    GasGiantRangeLabels,
    GasGiantUiLabels,
    MaxValues,
    MinValues,
    StepValues,
    sanitizeGasGiantSettings,
    type GasGiantRangeKey,
    type GasGiantSettings,
  } from '../lib/components/Threlte/GasGiant/GasGiantSettings'
  import { BUILTIN_GAS_GIANT_PRESETS, type GasGiantPreset } from '../presets/GasGiants'

  const { onOpenWelcome = () => {} }: { onOpenWelcome?: () => void } = $props()

  type RangeControlKey = Exclude<GasGiantRangeKey, 'seed'>

  type GasGiantUiState = {
    sceneSectionOpen: boolean
    colorSettingsSectionOpen: boolean
    cloudSettingsSectionOpen: boolean
    stormSectionOpen: boolean
    ringSectionOpen: boolean
    materialPropertiesSectionOpen: boolean
    textureResolutionSectionOpen: boolean
    stormsEnabled: boolean
    ringsEnabled: boolean
  }

  type GasGiantSceneExports = {
    downloadTextureMapPng: (fileName?: string) => Promise<boolean>
    downloadBumpMapPng: (fileName?: string) => Promise<boolean>
  }

  const GAS_GIANT_SETTINGS_STORAGE_KEY = 'gas-giant-view-settings-v1'
  const GAS_GIANT_UI_STORAGE_KEY = 'gas-giant-view-ui-v1'
  const GAS_GIANT_PRESETS_STORAGE_KEY = 'gas-giant-view-presets-v1'

  const DEFAULT_GAS_GIANT_SETTINGS: GasGiantSettings = { ...DefaultValues }
  const NUMERIC_RANGE_KEYS = (Object.keys(MinValues) as GasGiantRangeKey[]).filter(
    (key) => key !== 'seed'
  )

  const numericControls: RangeControlKey[] = [
    'colorScale',
    'tintShadowFloor',
    'cloudBandCount',
    'cloudBandSharpness',
    'cloudChaos',
    'stormCount',
    'stormScale',
    'stormPower',
    'stormStrength',
    'stormColorStrength',
    'bumpTextureSize',
    'colorTextureSize',
    'bumpScale',
    'roughness',
    'metalness',
  ]

  const colorControlKeys: RangeControlKey[] = ['colorScale', 'tintShadowFloor']
  const textureResolutionControlKeys: RangeControlKey[] = ['bumpTextureSize', 'colorTextureSize']
  const cloudControlKeys: RangeControlKey[] = ['cloudBandCount', 'cloudBandSharpness', 'cloudChaos']
  const stormControlKeys: RangeControlKey[] = [
    'stormCount',
    'stormScale',
    'stormPower',
    'stormStrength',
    'stormColorStrength',
  ]
  const materialControlKeys: RangeControlKey[] = ['bumpScale', 'roughness', 'metalness']
  const ringControls: RingRangeKey[] = [
    'ringInnerRadius',
    'ringOuterRadius',
    'ringTilt',
    'ringBandCount',
    'ringBandSharpness',
    'ringDensity',
    'ringTextureScale',
    'ringGranularity',
    'ringOpacity',
  ]

  const colorControls = numericControls.filter((control) => colorControlKeys.includes(control))
  const textureResolutionControls = numericControls.filter((control) =>
    textureResolutionControlKeys.includes(control)
  )
  const cloudControls = numericControls.filter((control) => cloudControlKeys.includes(control))
  const stormControls = numericControls.filter((control) => stormControlKeys.includes(control))
  const materialControls = numericControls.filter((control) =>
    materialControlKeys.includes(control)
  )

  let canvasShell: HTMLDivElement | undefined = $state(undefined)
  let gasGiantScene: GasGiantSceneExports | undefined = $state(undefined)
  let isSaving = $state(false)

  let gasGiant = $state<GasGiantSettings>({ ...DEFAULT_GAS_GIANT_SETTINGS })

  let settingsHydrated = $state(false)
  let sectionTogglesHydrated = $state(false)
  let presetsHydrated = $state(false)

  let sceneSectionOpen = $state(true)
  let colorSettingsSectionOpen = $state(true)
  let cloudSettingsSectionOpen = $state(true)
  let stormSectionOpen = $state(true)
  let ringSectionOpen = $state(DEFAULT_GAS_GIANT_SETTINGS.enableRings)
  let materialPropertiesSectionOpen = $state(true)
  let textureResolutionSectionOpen = $state(false)
  let stormsEnabled = $state(DEFAULT_GAS_GIANT_SETTINGS.enableStorms)
  let ringsEnabled = $state(DEFAULT_GAS_GIANT_SETTINGS.enableRings)
  let wasStormsEnabled = $state(DEFAULT_GAS_GIANT_SETTINGS.enableStorms)
  let wasRingsEnabled = $state(DEFAULT_GAS_GIANT_SETTINGS.enableRings)

  let presetsMenuOpen = $state(false)
  let presetsMenuElement: HTMLDetailsElement | undefined = $state(undefined)
  let presetsManagerOpen = $state(false)
  let userPresets = $state<GasGiantPreset[]>([])

  const effectiveStormsEnabled = $derived(stormsEnabled)
  const effectiveRingsEnabled = $derived(ringsEnabled)

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

  function applyGasGiantSettings(settings: GasGiantSettings) {
    gasGiant = sanitizeGasGiantSettings(settings)
    stormsEnabled = gasGiant.enableStorms
    ringsEnabled = gasGiant.enableRings
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
        ...gasGiant,
        enableStorms: effectiveStormsEnabled,
        enableRings: effectiveRingsEnabled,
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
    toggles: { stormsEnabled: boolean; ringsEnabled: boolean }
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

    args.push(RingCliFlags.palette, quoteCliValue(settings.ringPalette))
    for (const key of ringControls) {
      args.push(RingCliFlagByRangeKey[key], String(settings[key]))
    }

    args.push(GasGiantCliToggleFlags.autoRotate, toBooleanCliValue(settings.autoRotate))
    args.push(GasGiantCliToggleFlags.stormsEnabled, toBooleanCliValue(toggles.stormsEnabled))
    args.push(RingCliFlags.enabled, toBooleanCliValue(toggles.ringsEnabled))

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
        ...gasGiant,
        enableStorms: effectiveStormsEnabled,
        enableRings: effectiveRingsEnabled,
      },
      { stormsEnabled: effectiveStormsEnabled, ringsEnabled: effectiveRingsEnabled }
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
      ringsEnabled: preset.settings.enableRings,
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

  function findPresetById(presetId: string) {
    return (
      BUILTIN_GAS_GIANT_PRESETS.find((preset) => preset.id === presetId) ??
      userPresets.find((preset) => preset.id === presetId)
    )
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
      const settings: GasGiantSettings = {
        ...gasGiant,
        enableStorms: effectiveStormsEnabled,
        enableRings: effectiveRingsEnabled,
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
      ringSectionOpen:
        typeof raw.ringSectionOpen === 'boolean'
          ? raw.ringSectionOpen
          : DEFAULT_GAS_GIANT_SETTINGS.enableRings,
      materialPropertiesSectionOpen: raw.materialPropertiesSectionOpen as boolean,
      textureResolutionSectionOpen: raw.textureResolutionSectionOpen as boolean,
      stormsEnabled: raw.stormsEnabled as boolean,
      ringsEnabled:
        typeof raw.ringsEnabled === 'boolean'
          ? raw.ringsEnabled
          : DEFAULT_GAS_GIANT_SETTINGS.enableRings,
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
      ringSectionOpen = restoredUiState.ringSectionOpen
      materialPropertiesSectionOpen = restoredUiState.materialPropertiesSectionOpen
      textureResolutionSectionOpen = restoredUiState.textureResolutionSectionOpen
      stormsEnabled = restoredUiState.stormsEnabled
      ringsEnabled = restoredUiState.ringsEnabled
    } else {
      stormsEnabled = gasGiant.enableStorms
      ringsEnabled = gasGiant.enableRings
    }

    wasStormsEnabled = stormsEnabled
    wasRingsEnabled = ringsEnabled
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
        ringSectionOpen,
        materialPropertiesSectionOpen,
        textureResolutionSectionOpen,
        stormsEnabled,
        ringsEnabled,
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

    if (effectiveRingsEnabled !== wasRingsEnabled) {
      ringSectionOpen = effectiveRingsEnabled
      wasRingsEnabled = effectiveRingsEnabled
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
</script>

<svelte:window onpointerdown={onWindowPointerDown} />

<div class="page">
  <PageTitle title="Gas and Ice Giant Generator" activeHref="#/giants" {onOpenWelcome} />

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
        <GasGiantScene
          bind:this={gasGiantScene}
          seed={gasGiant.seed}
          autoRotate={gasGiant.autoRotate}
          palette={gasGiant.palette}
          surfaceTint={gasGiant.surfaceTint}
          colorScale={gasGiant.colorScale}
          tintShadowFloor={gasGiant.tintShadowFloor}
          cloudBandCount={gasGiant.cloudBandCount}
          cloudBandSharpness={gasGiant.cloudBandSharpness}
          cloudChaos={gasGiant.cloudChaos}
          enableStorms={effectiveStormsEnabled}
          stormCount={gasGiant.stormCount}
          stormScale={gasGiant.stormScale}
          stormPower={gasGiant.stormPower}
          stormStrength={gasGiant.stormStrength}
          stormColorStrength={gasGiant.stormColorStrength}
          bumpScale={gasGiant.bumpScale}
          roughness={gasGiant.roughness}
          metalness={gasGiant.metalness}
          bumpTextureSize={gasGiant.bumpTextureSize}
          colorTextureSize={gasGiant.colorTextureSize}
          enableRings={effectiveRingsEnabled}
          ringPalette={gasGiant.ringPalette}
          ringInnerRadius={gasGiant.ringInnerRadius}
          ringOuterRadius={gasGiant.ringOuterRadius}
          ringTilt={gasGiant.ringTilt}
          ringBandCount={gasGiant.ringBandCount}
          ringBandSharpness={gasGiant.ringBandSharpness}
          ringDensity={gasGiant.ringDensity}
          ringTextureScale={gasGiant.ringTextureScale}
          ringGranularity={gasGiant.ringGranularity}
          ringOpacity={gasGiant.ringOpacity}
        />
      </Canvas>
    </div>

    <div class="controls">
      <fieldset>
        <legend>{GasGiantUiLabels.scene}</legend>
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
        <label class="toggle-row">
          <span>{GasGiantUiLabels.autoRotate}</span>
          <input type="checkbox" bind:checked={gasGiant.autoRotate} />
        </label>
        <SeedControl
          id="gas-giant-seed"
          label={GasGiantUiLabels.seed}
          min={MinValues.seed}
          max={MaxValues.seed}
          step={StepValues.seed}
          bind:value={gasGiant.seed}
        />
      </fieldset>

      <fieldset>
        <legend>{GasGiantUiLabels.texture}</legend>
        <CollapsibleControl
          title={GasGiantUiLabels.colorSettings}
          bind:open={colorSettingsSectionOpen}
        >
          <PaletteControl
            id="gas-giant-palette"
            title={GasGiantUiLabels.palette}
            options={GasGiantPaletteNames}
            palettes={GasGiantPalettes}
            bind:value={gasGiant.palette}
          />
          <label class="extra-pad">
            <span class="label-row">
              <span>{GasGiantUiLabels.surfaceTint}</span>
              <span class="label-value">{gasGiant.surfaceTint.toUpperCase()}</span>
            </span>
            <input type="color" bind:value={gasGiant.surfaceTint} />
          </label>
          <div class="control-grid">
            {#each colorControls as control (control)}
              <label class="compact-number-row">
                <span>{GasGiantRangeLabels[control]}</span>
                <input
                  type="number"
                  min={MinValues[control]}
                  max={MaxValues[control]}
                  step={StepValues[control]}
                  bind:value={gasGiant[control]}
                />
              </label>
            {/each}
          </div>
        </CollapsibleControl>

        <CollapsibleControl
          title={GasGiantUiLabels.textureResolution}
          bind:open={textureResolutionSectionOpen}
        >
          <div class="control-grid">
            {#each textureResolutionControls as control (control)}
              <label class="compact-number-row">
                <span>{GasGiantRangeLabels[control]}</span>
                <input
                  type="number"
                  min={MinValues[control]}
                  max={MaxValues[control]}
                  step={StepValues[control]}
                  bind:value={gasGiant[control]}
                />
              </label>
            {/each}
          </div>
        </CollapsibleControl>
      </fieldset>

      <fieldset>
        <legend>{GasGiantUiLabels.material}</legend>
        <CollapsibleControl
          title={GasGiantUiLabels.properties}
          bind:open={materialPropertiesSectionOpen}
        >
          <div class="control-grid">
            {#each materialControls as control (control)}
              <label class="compact-number-row">
                <span>{GasGiantRangeLabels[control]}</span>
                <input
                  type="number"
                  min={MinValues[control]}
                  max={MaxValues[control]}
                  step={StepValues[control]}
                  bind:value={gasGiant[control]}
                />
              </label>
            {/each}
          </div>
        </CollapsibleControl>
      </fieldset>

      <fieldset>
        <legend>{GasGiantUiLabels.features}</legend>

        <CollapsibleControl
          title={GasGiantUiLabels.cloudBands}
          bind:open={cloudSettingsSectionOpen}
        >
          <div class="control-grid">
            {#each cloudControls as control (control)}
              <label class="compact-number-row">
                <span>{GasGiantRangeLabels[control]}</span>
                <input
                  type="number"
                  min={MinValues[control]}
                  max={MaxValues[control]}
                  step={StepValues[control]}
                  bind:value={gasGiant[control]}
                />
              </label>
            {/each}
          </div>
        </CollapsibleControl>

        <CollapsibleControl
          title={GasGiantUiLabels.stormSystems}
          bind:open={stormSectionOpen}
          bind:enabled={stormsEnabled}
        >
          <div class="control-grid">
            {#each stormControls as control (control)}
              <label class="compact-number-row">
                <span>{GasGiantRangeLabels[control]}</span>
                <input
                  type="number"
                  min={MinValues[control]}
                  max={MaxValues[control]}
                  step={StepValues[control]}
                  bind:value={gasGiant[control]}
                  disabled={!effectiveStormsEnabled}
                />
              </label>
            {/each}
          </div>
        </CollapsibleControl>

        <CollapsibleControl title="Rings" bind:open={ringSectionOpen} bind:enabled={ringsEnabled}>
          <PaletteControl
            id="ring-palette"
            title="Ring palette"
            options={RingPaletteNames}
            palettes={RingPalettes}
            bind:value={gasGiant.ringPalette}
          />
          <div class="control-grid">
            {#each ringControls as control (control)}
              <label class="compact-number-row">
                <span>{RingRangeLabels[control]}</span>
                <input
                  type="number"
                  min={control === 'ringOuterRadius'
                    ? Math.max(RingMinValues[control], gasGiant.ringInnerRadius + 0.05)
                    : RingMinValues[control]}
                  max={control === 'ringInnerRadius'
                    ? Math.min(RingMaxValues[control], gasGiant.ringOuterRadius - 0.05)
                    : RingMaxValues[control]}
                  step={RingStepValues[control]}
                  bind:value={gasGiant[control]}
                  disabled={!effectiveRingsEnabled}
                />
              </label>
            {/each}
          </div>
        </CollapsibleControl>
      </fieldset>
    </div>
  </section>
</div>

{#if presetsManagerOpen}
  <PresetManager
    builtInPresets={BUILTIN_GAS_GIANT_PRESETS}
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
