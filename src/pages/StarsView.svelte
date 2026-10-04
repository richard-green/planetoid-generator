<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { WebGLRenderer } from 'three'
  import '../styles/common.css'
  import CollapsibleControl from '../lib/components/Controls/CollapsibleControl.svelte'
  import ExportSplitButton from '../lib/components/Controls/ExportSplitButton.svelte'
  import FullscreenControl from '../lib/components/Controls/FullscreenControl.svelte'
  import WebGLFailure from '../lib/components/Threlte/WebGLFailure.svelte'
  import PalettePicker from '../lib/components/Controls/PalettePicker.svelte'
  import PresetManager, {
    type PresetListItem,
  } from '../lib/components/Controls/PresetManager.svelte'
  import { registerSettingsAutomation } from '../lib/automation'
  import type { CameraView } from '../lib/utils/cameraView'
  import { downloadPresetJson } from '../lib/utils/downloadJson'
  import { fileTimestamp } from '../lib/utils/fileTimestamp'
  import SeedControl from '../lib/components/Controls/SeedControl.svelte'
  import TextureSizeControl from '../lib/components/Controls/TextureSizeControl.svelte'
  import PageTitle from '../lib/components/Layout/PageTitle.svelte'
  import StarsScene from '../lib/components/Threlte/StarsScene.svelte'
  import { StarPalettes } from '../lib/components/Threlte/Star/StarPalettes'
  import {
    buildStarCliCommand,
    DefaultValues,
    MaxValues,
    MinValues,
    sanitizeStarSettings,
    StarNumericControls as controls,
    StarPaletteNames,
    StarRangeLabels,
    StarSchema as schema,
    StepValues,
    type StarRangeKey,
    type StarSettings,
  } from '../lib/components/Threlte/Star/StarSettings'
  import {
    reportMissingSettingControls,
    settingControlId as controlId,
  } from '../lib/types/settingsSchema'
  import { BUILTIN_STAR_PRESETS, type StarPreset } from '../presets/Stars'
  import { STAR_PRESETS_STORAGE_KEY } from '../presets/userPresets'

  const { onOpenWelcome = () => {} }: { onOpenWelcome?: () => void } = $props()
  const STAR_SETTINGS_STORAGE_KEY = 'star-view-settings-v1'

  type StarsSceneExports = {
    setCameraView: (view: CameraView) => void
    getCameraView: () => CameraView | undefined
    downloadScenePng: (fileName?: string) => boolean
    downloadTextureMapPng: (fileName?: string) => boolean
  }

  let canvasShell = $state<HTMLDivElement | undefined>(undefined)
  let starScene = $state<StarsSceneExports | undefined>(undefined)
  let star = $state<StarSettings>({ ...DefaultValues })
  let starSurfaceVisible = $state(true)
  let isSaving = $state(false)
  let settingsHydrated = $state(false)
  let presetsHydrated = $state(false)
  let presetsMenuOpen = $state(false)
  let presetsMenuElement: HTMLDetailsElement | undefined = $state(undefined)
  let presetsManagerOpen = $state(false)
  let userPresets = $state<StarPreset[]>([])
  let stellarSurfaceSectionOpen = $state(true)
  let haloSectionOpen = $state(true)
  let plasmaSectionOpen = $state(true)
  let textureSectionOpen = $state(true)
  let textureResolutionSectionOpen = $state(false)
  let sunspotSectionOpen = $state(false)

  function applyStarSettings(settings: StarSettings): void {
    star = { ...settings }
  }

  function getStarSettings(): StarSettings {
    return $state.snapshot(star)
  }

  $effect(() => {
    if (import.meta.env.DEV) reportMissingSettingControls(schema, 'Star', document)
  })

  $effect(() =>
    registerSettingsAutomation(
      (overrides) => {
        star = sanitizeStarSettings({ ...$state.snapshot(star), ...overrides })
      },
      (view) => starScene?.setCameraView(view)
    )
  )

  $effect(() => {
    if (settingsHydrated) return

    try {
      const raw = localStorage.getItem(STAR_SETTINGS_STORAGE_KEY)
      if (raw) applyStarSettings(sanitizeStarSettings(JSON.parse(raw)))
    } catch (error) {
      console.warn('Failed to restore star settings from localStorage', error)
    } finally {
      settingsHydrated = true
    }
  })

  $effect(() => {
    if (!settingsHydrated) return

    try {
      localStorage.setItem(STAR_SETTINGS_STORAGE_KEY, JSON.stringify(getStarSettings()))
    } catch (error) {
      console.warn('Failed to persist star settings to localStorage', error)
    }
  })

  function sanitizePresetName(input: unknown): string {
    if (typeof input !== 'string') return ''
    return input.trim().replace(/\s+/g, ' ').slice(0, 48)
  }

  function createPresetId(): string {
    const random = Math.random().toString(36).slice(2, 8)
    return `star-preset-${Date.now()}-${random}`
  }

  function sanitizePreset(input: unknown): StarPreset | null {
    if (typeof input !== 'object' || input === null) return null

    const raw = input as Record<string, unknown>
    const name = sanitizePresetName(raw.name)
    if (!name) return null

    const id =
      typeof raw.id === 'string' && raw.id.trim().length > 0 ? raw.id.trim() : createPresetId()

    return { id, name, settings: sanitizeStarSettings(raw.settings) }
  }

  function closePresetsMenu(): void {
    presetsMenuOpen = false
  }

  function onResetSceneFromMenu(): void {
    closePresetsMenu()
    applyStarSettings(DefaultValues)
  }

  function onSavePresetFromMenu(): void {
    closePresetsMenu()

    const name = sanitizePresetName(window.prompt('Name this preset:', 'My star preset'))
    if (!name) return

    userPresets = [
      { id: createPresetId(), name, settings: sanitizeStarSettings(getStarSettings()) },
      ...userPresets,
    ]
  }

  function onManagePresetsFromMenu(): void {
    closePresetsMenu()
    presetsManagerOpen = true
  }

  function findPresetById(presetId: string): StarPreset | undefined {
    return (
      BUILTIN_STAR_PRESETS.find((preset) => preset.id === presetId) ??
      userPresets.find((preset) => preset.id === presetId)
    )
  }

  async function copyCliCommand(settings: StarSettings, label: string): Promise<void> {
    const command = buildStarCliCommand(settings, starScene?.getCameraView())

    try {
      await navigator.clipboard.writeText(command)
      window.alert(`CLI command copied${label}.`)
    } catch {
      window.prompt(`Copy this CLI command${label}:`, command)
    }
  }

  function onCopyCliFromMenu(): void {
    closePresetsMenu()
    void copyCliCommand(getStarSettings(), '')
  }

  function onWindowPointerDown(event: PointerEvent): void {
    if (!presetsMenuOpen || !presetsMenuElement) return

    const target = event.target
    if (!(target instanceof Node)) return
    if (presetsMenuElement.contains(target)) return

    closePresetsMenu()
  }

  $effect(() => {
    if (presetsHydrated) return

    try {
      const raw = localStorage.getItem(STAR_PRESETS_STORAGE_KEY)

      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        const list = Array.isArray(parsed) ? parsed : []
        const sanitized: StarPreset[] = []

        for (const entry of list) {
          const preset = sanitizePreset(entry)
          if (preset) sanitized.push(preset)
        }

        userPresets = sanitized
      }
    } catch (error) {
      console.warn('Failed to restore star presets from localStorage', error)
    } finally {
      presetsHydrated = true
    }
  })

  $effect(() => {
    if (!presetsHydrated) return

    try {
      localStorage.setItem(STAR_PRESETS_STORAGE_KEY, JSON.stringify(userPresets))
    } catch (error) {
      console.warn('Failed to persist star presets to localStorage', error)
    }
  })

  function downloadRender(): void {
    if (!starScene || isSaving) return

    isSaving = true
    try {
      starScene.downloadScenePng(`generated-star-${fileTimestamp()}.png`)
    } finally {
      isSaving = false
    }
  }

  async function downloadTexture(): Promise<void> {
    if (!starScene || isSaving) return

    isSaving = true
    try {
      await starScene.downloadTextureMapPng(`generated-star-texture-${fileTimestamp()}.png`)
    } finally {
      isSaving = false
    }
  }
</script>

<div class="page">
  <PageTitle title="Star Generator" activeHref="#/stars" {onOpenWelcome} />

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
          <StarsScene bind:this={starScene} {...star} showStarSurface={starSurfaceVisible} />
        </Canvas>
        {#snippet failed(error)}
          <WebGLFailure {error} />
        {/snippet}
      </svelte:boundary>
      <FullscreenControl target={canvasShell} />
    </div>

    <div class="controls">
      <fieldset>
        <legend>Scene</legend>
        <div class="save-actions" aria-label="Save and export actions">
          <ExportSplitButton
            primaryAction={downloadRender}
            primaryAriaLabel="Export scene PNG"
            disabled={isSaving}
            menuItems={[{ label: 'Surface color map', onSelect: downloadTexture }]}
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
                onclick={onCopyCliFromMenu}
              >
                Copy current as CLI command
              </button>
            </div>
          </details>
        </div>
        <label class="toggle-row">
          <span>{schema.autoRotate.label}</span>
          <input id={controlId('autoRotate')} type="checkbox" bind:checked={star.autoRotate} />
        </label>
        <SeedControl
          id={controlId('seed')}
          label={schema.seed.label}
          min={MinValues.seed}
          max={MaxValues.seed}
          step={StepValues.seed}
          bind:value={star.seed}
        />
      </fieldset>

      <fieldset>
        <legend>Texture</legend>
        <CollapsibleControl title="Color settings" bind:open={stellarSurfaceSectionOpen}>
          <div class="control-grid">
            <PalettePicker
              id={controlId('palette')}
              title={schema.palette.label}
              options={StarPaletteNames}
              palettes={StarPalettes}
              bind:value={star.palette}
            />
            {#each controls.color as control (control)}
              {@render numberInput(control)}
            {/each}
          </div>
        </CollapsibleControl>
        <CollapsibleControl title="Surface pattern" bind:open={textureSectionOpen}>
          <div class="control-grid">
            {#each controls.surface as control (control)}
              {@render numberInput(control)}
            {/each}
          </div>
        </CollapsibleControl>
        <CollapsibleControl title="Texture resolution" bind:open={textureResolutionSectionOpen}>
          <div class="control-grid">
            <TextureSizeControl
              id={controlId('colorTextureSize')}
              label={schema.colorTextureSize.label}
              bind:value={star.colorTextureSize}
            />
          </div>
        </CollapsibleControl>
      </fieldset>

      <fieldset>
        <legend>Features</legend>
        <CollapsibleControl title="Sunspots" bind:open={sunspotSectionOpen}>
          <div class="control-grid">
            {#each controls.sunspots as control (control)}
              {@render numberInput(control)}
            {/each}
          </div>
        </CollapsibleControl>
      </fieldset>

      <fieldset>
        <legend>Atmosphere</legend>
        <CollapsibleControl title="Halo" bind:open={haloSectionOpen}>
          <div class="control-grid">
            {#each controls.halo as control (control)}
              {@render numberInput(control)}
            {/each}
          </div>
        </CollapsibleControl>

        <CollapsibleControl title="Plasma" bind:open={plasmaSectionOpen}>
          <div class="control-grid">
            <button
              type="button"
              aria-pressed={!starSurfaceVisible}
              onclick={() => (starSurfaceVisible = !starSurfaceVisible)}
            >
              {starSurfaceVisible ? 'Hide star' : 'Show star'}
            </button>
            {#each controls.plasma as control (control)}
              {@render numberInput(control)}
            {/each}
          </div>
        </CollapsibleControl>
      </fieldset>
    </div>
  </section>
</div>

{#snippet numberInput(control: StarRangeKey)}
  <label class="compact-number-row">
    <span>{StarRangeLabels[control]}</span>
    <input
      id={controlId(control)}
      type="number"
      min={MinValues[control]}
      max={MaxValues[control]}
      step={StepValues[control]}
      bind:value={star[control]}
    />
  </label>
{/snippet}

<svelte:window onpointerdown={onWindowPointerDown} />

{#if presetsManagerOpen}
  <PresetManager
    title="Manage Star Presets"
    builtInPresets={BUILTIN_STAR_PRESETS}
    {userPresets}
    onClose={() => (presetsManagerOpen = false)}
    onApplyPreset={(entry: PresetListItem) => {
      const preset = findPresetById(entry.id)
      if (!preset) return

      applyStarSettings(preset.settings)
      presetsManagerOpen = false
    }}
    onExportPreset={(entry: PresetListItem) => {
      const preset = findPresetById(entry.id)
      if (preset) void copyCliCommand(preset.settings, ` for preset: ${preset.name}`)
    }}
    onExportUserPresetJson={(entry: PresetListItem) => {
      const preset = userPresets.find((candidate) => candidate.id === entry.id)
      if (preset) {
        downloadPresetJson('star', { ...preset, settings: sanitizeStarSettings(preset.settings) })
      }
    }}
    onDeleteUserPreset={(entry: PresetListItem) => {
      userPresets = userPresets.filter((preset) => preset.id !== entry.id)
    }}
  />
{/if}
