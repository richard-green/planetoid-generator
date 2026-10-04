<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { WebGLRenderer } from 'three'
  import '../styles/common.css'
  import CollapsibleControl from '../lib/components/Controls/CollapsibleControl.svelte'
  import ExportSplitButton from '../lib/components/Controls/ExportSplitButton.svelte'
  import FullscreenControl from '../lib/components/Controls/FullscreenControl.svelte'
  import WebGLFailure from '../lib/components/Threlte/WebGLFailure.svelte'
  import PresetManager, {
    type PresetListItem,
  } from '../lib/components/Controls/PresetManager.svelte'
  import { registerSettingsAutomation } from '../lib/automation'
  import type { CameraView } from '../lib/utils/cameraView'
  import { downloadPresetJson } from '../lib/utils/downloadJson'
  import { fileTimestamp as getTimestamp } from '../lib/utils/fileTimestamp'
  import PalettePicker from '../lib/components/Controls/PalettePicker.svelte'
  import SeedControl from '../lib/components/Controls/SeedControl.svelte'
  import ColorPicker from '../lib/components/Controls/ColorPicker.svelte'
  import TextureSizeControl from '../lib/components/Controls/TextureSizeControl.svelte'
  import ViewModeControl from '../lib/components/Controls/ViewModeControl.svelte'
  import PageTitle from '../lib/components/Layout/PageTitle.svelte'
  import GasGiantScene from '../lib/components/Threlte/GasGiantScene.svelte'
  import {
    GasGiantPaletteNames,
    GasGiantPalettes,
  } from '../lib/components/Threlte/GasGiant/GasGiantPalettes'
  import { RingPaletteNames, RingPalettes } from '../lib/components/Threlte/Rings/RingPalettes'
  import {
    AtmospherePaletteLabels,
    AtmospherePaletteNames,
    AtmospherePalettes,
  } from '../lib/components/Threlte/Atmosphere/AtmospherePalettes'
  import { RingMaxValues, RingMinValues } from '../lib/components/Threlte/Rings/RingSettings'
  import {
    buildGasGiantCliCommand,
    DefaultValues,
    GasGiantNumericControls as controls,
    GasGiantRangeLabels,
    GasGiantSchema as schema,
    GasGiantUiLabels,
    MaxValues,
    MinValues,
    StepValues,
    sanitizeGasGiantSettings,
    type GasGiantRangeKey,
    type GasGiantSettings,
    type GasGiantViewMode,
  } from '../lib/components/Threlte/GasGiant/GasGiantSettings'
  import {
    reportMissingSettingControls,
    settingControlId as controlId,
  } from '../lib/types/settingsSchema'
  import { BUILTIN_GAS_GIANT_PRESETS, type GasGiantPreset } from '../presets/GasGiants'

  const { onOpenWelcome = () => {} }: { onOpenWelcome?: () => void } = $props()

  type GasGiantUiState = {
    viewMode: GasGiantViewMode
    viewModeSectionOpen: boolean
    colorSettingsSectionOpen: boolean
    cloudSettingsSectionOpen: boolean
    stormSectionOpen: boolean
    ringSectionOpen: boolean
    atmosphereSectionOpen: boolean
    materialPropertiesSectionOpen: boolean
    textureResolutionSectionOpen: boolean
    stormsEnabled: boolean
    ringsEnabled: boolean
  }

  type GasGiantSceneExports = {
    setCameraView: (view: CameraView) => void
    getCameraView: () => CameraView | undefined
    downloadScenePng: (fileName?: string) => boolean
    downloadTextureMapPng: (fileName?: string) => Promise<boolean>
    downloadNormalMapPng: (fileName?: string) => Promise<boolean>
  }

  const GAS_GIANT_SETTINGS_STORAGE_KEY = 'gas-giant-view-settings-v1'
  const GAS_GIANT_UI_STORAGE_KEY = 'gas-giant-view-ui-v1'
  const GAS_GIANT_PRESETS_STORAGE_KEY = 'gas-giant-view-presets-v1'

  const DEFAULT_GAS_GIANT_SETTINGS: GasGiantSettings = { ...DefaultValues }

  let canvasShell: HTMLDivElement | undefined = $state(undefined)
  let gasGiantScene: GasGiantSceneExports | undefined = $state(undefined)
  let isSaving = $state(false)

  let gasGiant = $state<GasGiantSettings>({ ...DEFAULT_GAS_GIANT_SETTINGS })

  let settingsHydrated = $state(false)
  let sectionTogglesHydrated = $state(false)
  let presetsHydrated = $state(false)

  let sceneViewMode = $state<GasGiantViewMode>('mesh')
  let viewModeSectionOpen = $state(true)
  let colorSettingsSectionOpen = $state(true)
  let cloudSettingsSectionOpen = $state(true)
  let stormSectionOpen = $state(true)
  let ringSectionOpen = $state(DEFAULT_GAS_GIANT_SETTINGS.enableRings)
  let atmosphereSectionOpen = $state(DEFAULT_GAS_GIANT_SETTINGS.enableAtmosphere)
  let materialPropertiesSectionOpen = $state(true)
  let textureResolutionSectionOpen = $state(false)
  let stormsEnabled = $state(DEFAULT_GAS_GIANT_SETTINGS.enableStorms)
  let ringsEnabled = $state(DEFAULT_GAS_GIANT_SETTINGS.enableRings)

  let presetsMenuOpen = $state(false)
  let presetsMenuElement: HTMLDetailsElement | undefined = $state(undefined)
  let presetsManagerOpen = $state(false)
  let userPresets = $state<GasGiantPreset[]>([])

  const effectiveStormsEnabled = $derived(stormsEnabled)
  const effectiveRingsEnabled = $derived(ringsEnabled)

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

  function applyGasGiantSettings(settings: unknown) {
    gasGiant = sanitizeGasGiantSettings(settings)
    stormsEnabled = gasGiant.enableStorms
    ringsEnabled = gasGiant.enableRings
  }

  function clampRingRadii() {
    // round to 2dp to avoid floating point drift (e.g. 1.7000000000000002)
    const round = (value: number) => Math.round(value * 100) / 100

    gasGiant.ringInnerRadius = round(
      Math.min(
        Math.max(gasGiant.ringInnerRadius, RingMinValues.ringInnerRadius),
        RingMaxValues.ringInnerRadius
      )
    )
    gasGiant.ringOuterRadius = round(
      Math.min(
        Math.max(gasGiant.ringInnerRadius + 0.1, gasGiant.ringOuterRadius),
        RingMaxValues.ringOuterRadius
      )
    )
  }

  function resetSceneToDefaults() {
    applyGasGiantSettings(DEFAULT_GAS_GIANT_SETTINGS)
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

  function buildCliCommandFromPreset(
    settings: GasGiantSettings,
    exportTextures: boolean,
    toggles: { stormsEnabled: boolean; ringsEnabled: boolean }
  ) {
    return buildGasGiantCliCommand(
      { ...settings, enableStorms: toggles.stormsEnabled, enableRings: toggles.ringsEnabled },
      exportTextures,
      gasGiantScene?.getCameraView()
    )
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
      sceneViewMode !== 'mesh',
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

    const command = buildCliCommandFromPreset(preset.settings, sceneViewMode !== 'mesh', {
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
    if (import.meta.env.DEV) reportMissingSettingControls(schema, 'Gas giant', document)
  })

  $effect(() =>
    registerSettingsAutomation(
      (overrides) =>
        applyGasGiantSettings({
          ...$state.snapshot(gasGiant),
          enableStorms: stormsEnabled,
          enableRings: ringsEnabled,
          ...overrides,
        }),
      (view) => gasGiantScene?.setCameraView(view)
    )
  )

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
      typeof (raw.viewModeSectionOpen ?? raw.sceneSectionOpen) === 'boolean' &&
      typeof raw.colorSettingsSectionOpen === 'boolean' &&
      typeof raw.cloudSettingsSectionOpen === 'boolean' &&
      typeof raw.stormSectionOpen === 'boolean' &&
      typeof raw.materialPropertiesSectionOpen === 'boolean' &&
      typeof raw.textureResolutionSectionOpen === 'boolean' &&
      typeof raw.stormsEnabled === 'boolean'

    if (!hasAllKeys) return null

    return {
      viewMode: raw.viewMode === 'normal' || raw.viewMode === 'texture' ? raw.viewMode : 'mesh',
      viewModeSectionOpen: (raw.viewModeSectionOpen ?? raw.sceneSectionOpen) as boolean,
      colorSettingsSectionOpen: raw.colorSettingsSectionOpen as boolean,
      cloudSettingsSectionOpen: raw.cloudSettingsSectionOpen as boolean,
      stormSectionOpen: raw.stormSectionOpen as boolean,
      ringSectionOpen:
        typeof raw.ringSectionOpen === 'boolean'
          ? raw.ringSectionOpen
          : DEFAULT_GAS_GIANT_SETTINGS.enableRings,
      atmosphereSectionOpen:
        typeof raw.atmosphereSectionOpen === 'boolean'
          ? raw.atmosphereSectionOpen
          : DEFAULT_GAS_GIANT_SETTINGS.enableAtmosphere,
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
      sceneViewMode = restoredUiState.viewMode
      viewModeSectionOpen = restoredUiState.viewModeSectionOpen
      colorSettingsSectionOpen = restoredUiState.colorSettingsSectionOpen
      cloudSettingsSectionOpen = restoredUiState.cloudSettingsSectionOpen
      stormSectionOpen = restoredUiState.stormSectionOpen
      ringSectionOpen = restoredUiState.ringSectionOpen
      atmosphereSectionOpen = restoredUiState.atmosphereSectionOpen
      materialPropertiesSectionOpen = restoredUiState.materialPropertiesSectionOpen
      textureResolutionSectionOpen = restoredUiState.textureResolutionSectionOpen
      stormsEnabled = restoredUiState.stormsEnabled
      ringsEnabled = restoredUiState.ringsEnabled
    } else {
      stormsEnabled = gasGiant.enableStorms
      ringsEnabled = gasGiant.enableRings
    }

    sectionTogglesHydrated = true
  })

  $effect(() => {
    if (!settingsHydrated || !sectionTogglesHydrated) return

    try {
      const uiState: GasGiantUiState = {
        viewMode: sceneViewMode,
        viewModeSectionOpen,
        colorSettingsSectionOpen,
        cloudSettingsSectionOpen,
        stormSectionOpen,
        ringSectionOpen,
        atmosphereSectionOpen,
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

  async function saveScenePng() {
    if (!gasGiantScene || isSaving) return

    isSaving = true
    try {
      const fileName = `generated-gas-giant-${getTimestamp()}.png`
      gasGiantScene.downloadScenePng(fileName)
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

  async function downloadNormalMapPng() {
    if (!gasGiantScene || isSaving) return

    isSaving = true
    try {
      const fileName = `generated-gas-giant-normal-${getTimestamp()}.png`
      await gasGiantScene.downloadNormalMapPng(fileName)
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
      <svelte:boundary>
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
            viewMode={sceneViewMode}
            seed={gasGiant.seed}
            autoRotate={gasGiant.autoRotate}
            palette={gasGiant.palette}
            surfaceTint={gasGiant.surfaceTint}
            colorScale={gasGiant.colorScale}
            tintShadowFloor={gasGiant.tintShadowFloor}
            cloudBandCount={gasGiant.cloudBandCount}
            cloudBandSharpness={gasGiant.cloudBandSharpness}
            cloudChaos={gasGiant.cloudChaos}
            cloudTurbulence={gasGiant.cloudTurbulence}
            enableStorms={effectiveStormsEnabled}
            stormCount={gasGiant.stormCount}
            stormScale={gasGiant.stormScale}
            stormPower={gasGiant.stormPower}
            stormStrength={gasGiant.stormStrength}
            stormColorStrength={gasGiant.stormColorStrength}
            normalStrength={gasGiant.normalStrength}
            roughness={gasGiant.roughness}
            metalness={gasGiant.metalness}
            enableAtmosphere={gasGiant.enableAtmosphere}
            atmospherePalette={gasGiant.atmospherePalette}
            atmosphereIntensity={gasGiant.atmosphereIntensity}
            atmosphereThickness={gasGiant.atmosphereThickness}
            atmosphereDropoff={gasGiant.atmosphereDropoff}
            atmosphereTerminatorWrap={gasGiant.atmosphereTerminatorWrap}
            normalTextureSize={gasGiant.normalTextureSize}
            colorTextureSize={gasGiant.colorTextureSize}
            enableRings={effectiveRingsEnabled}
            ringPalette={gasGiant.ringPalette}
            ringInnerRadius={gasGiant.ringInnerRadius}
            ringOuterRadius={gasGiant.ringOuterRadius}
            ringTilt={gasGiant.ringTilt}
            ringBandCount={gasGiant.ringBandCount}
            ringBandSharpness={gasGiant.ringBandSharpness}
            ringBandRegularity={gasGiant.ringBandRegularity}
            ringDensity={gasGiant.ringDensity}
            ringTextureScale={gasGiant.ringTextureScale}
            ringGranularity={gasGiant.ringGranularity}
            ringPaletteInfluence={gasGiant.ringPaletteInfluence}
            ringSolarization={gasGiant.ringSolarization}
            ringOpacity={gasGiant.ringOpacity}
            ringNoise={gasGiant.ringNoise}
            ringGlitter={gasGiant.ringGlitter}
          />
        </Canvas>
        {#snippet failed(error)}
          <WebGLFailure {error} />
        {/snippet}
      </svelte:boundary>
      <FullscreenControl target={canvasShell} />
    </div>

    <div class="controls">
      <fieldset>
        <legend>{GasGiantUiLabels.scene}</legend>
        <div class="save-actions" aria-label="Save and export actions">
          <ExportSplitButton
            primaryAction={saveScenePng}
            primaryAriaLabel="Export scene PNG"
            disabled={isSaving}
            menuItems={[
              { label: 'Surface color map', onSelect: downloadTextureMapPng },
              { label: 'Surface normal map', onSelect: downloadNormalMapPng },
            ]}
          />
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
        <ViewModeControl
          title={GasGiantUiLabels.viewMode}
          bind:open={viewModeSectionOpen}
          name="giant-view-mode"
          bind:value={sceneViewMode}
          options={[
            { value: 'mesh', label: '3D' },
            { value: 'normal', label: 'Normal map' },
            { value: 'texture', label: 'Texture map' },
          ]}
        />
        <label class="toggle-row">
          <span>{schema.autoRotate.label}</span>
          <input id={controlId('autoRotate')} type="checkbox" bind:checked={gasGiant.autoRotate} />
        </label>
        <SeedControl
          id={controlId('seed')}
          label={schema.seed.label}
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
          <PalettePicker
            id={controlId('palette')}
            title={schema.palette.label}
            options={GasGiantPaletteNames}
            palettes={GasGiantPalettes}
            bind:value={gasGiant.palette}
          />
          <ColorPicker
            id={controlId('surfaceTint')}
            label={schema.surfaceTint.label}
            bind:value={gasGiant.surfaceTint}
          />
          <div class="control-grid">
            {#each controls.color as control (control)}
              {@render numberInput(control)}
            {/each}
          </div>
        </CollapsibleControl>

        <CollapsibleControl
          title={GasGiantUiLabels.textureResolution}
          bind:open={textureResolutionSectionOpen}
        >
          <div class="control-grid">
            <TextureSizeControl
              id={controlId('normalTextureSize')}
              label={schema.normalTextureSize.label}
              bind:value={gasGiant.normalTextureSize}
            />
            <TextureSizeControl
              id={controlId('colorTextureSize')}
              label={schema.colorTextureSize.label}
              bind:value={gasGiant.colorTextureSize}
            />
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
            {#each controls.material as control (control)}
              {@render numberInput(control)}
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
            {#each controls.cloudBands as control (control)}
              {@render numberInput(control)}
            {/each}
          </div>
        </CollapsibleControl>

        <CollapsibleControl
          title={schema.enableStorms.label}
          bind:open={stormSectionOpen}
          bind:enabled={stormsEnabled}
          toggleId={controlId('enableStorms')}
        >
          <div class="control-grid">
            {#each controls.storms as control (control)}
              {@render numberInput(control, !effectiveStormsEnabled)}
            {/each}
          </div>
        </CollapsibleControl>

        <CollapsibleControl
          title={schema.enableRings.label}
          bind:open={ringSectionOpen}
          bind:enabled={ringsEnabled}
          toggleId={controlId('enableRings')}
        >
          <PalettePicker
            id={controlId('ringPalette')}
            title={schema.ringPalette.label}
            options={RingPaletteNames}
            palettes={RingPalettes}
            bind:value={gasGiant.ringPalette}
          />
          <div class="control-grid">
            {#each controls.rings as control (control)}
              {@render numberInput(
                control,
                !effectiveRingsEnabled,
                control === 'ringInnerRadius' || control === 'ringOuterRadius'
                  ? clampRingRadii
                  : undefined
              )}
            {/each}
          </div>
        </CollapsibleControl>

        <CollapsibleControl
          title={schema.enableAtmosphere.label}
          bind:open={atmosphereSectionOpen}
          bind:enabled={gasGiant.enableAtmosphere}
          toggleId={controlId('enableAtmosphere')}
        >
          <PalettePicker
            id={controlId('atmospherePalette')}
            title={schema.atmospherePalette.label}
            options={AtmospherePaletteNames}
            palettes={AtmospherePalettes}
            labels={AtmospherePaletteLabels}
            bind:value={gasGiant.atmospherePalette}
          />
          <div class="control-grid">
            {#each controls.atmosphere as control (control)}
              {@render numberInput(control, !gasGiant.enableAtmosphere)}
            {/each}
          </div>
        </CollapsibleControl>
      </fieldset>
    </div>
  </section>
</div>

{#snippet numberInput(control: GasGiantRangeKey, disabled = false, oninput?: () => void)}
  <label class="compact-number-row">
    <span>{GasGiantRangeLabels[control]}</span>
    <input
      id={controlId(control)}
      type="number"
      min={MinValues[control]}
      max={MaxValues[control]}
      step={StepValues[control]}
      bind:value={gasGiant[control]}
      {oninput}
      {disabled}
    />
  </label>
{/snippet}

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
    onExportUserPresetJson={(entry: PresetListItem) => {
      const preset = userPresets.find((candidate) => candidate.id === entry.id)
      if (preset) {
        downloadPresetJson('gas-giant', {
          ...preset,
          settings: sanitizeGasGiantSettings(preset.settings),
        })
      }
    }}
    onDeleteUserPreset={(entry: PresetListItem) => deleteUserPreset(entry.id)}
  />
{/if}
