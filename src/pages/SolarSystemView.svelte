<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { WebGLRenderer } from 'three'
  import '../styles/common.css'
  import PageTitle from '../lib/components/Layout/PageTitle.svelte'
  import TextureSizeControl from '../lib/components/Controls/TextureSizeControl.svelte'
  import { DefaultTextureSize, type TextureSize } from '../lib/types/textureSize'
  import SolarSystemScene from '../lib/components/Threlte/SolarSystemScene.svelte'
  import {
    createSystemBody,
    defaultPresetId,
    defaultScaleForKind,
    DefaultSystemBodies,
    presetOptionsForKind,
    SystemBodyKindLabels,
    SystemBodyKinds,
    type SystemBody,
    type SystemBodyKind,
  } from '../lib/components/Threlte/SolarSystem/SolarSystemBodies'
  import {
    DefaultValues as StarDefaults,
    type StarSettings,
  } from '../lib/components/Threlte/Star/StarSettings'
  import { BUILTIN_PRESETS, type PlanetoidPreset } from '../presets/Planetoids'
  import { BUILTIN_GAS_GIANT_PRESETS, type GasGiantPreset } from '../presets/GasGiants'
  import { BUILTIN_STAR_PRESETS, type StarPreset } from '../presets/Stars'
  import {
    loadUserGasGiantPresets,
    loadUserPlanetoidPresets,
    loadUserStarPresets,
  } from '../presets/userPresets'

  const { onOpenWelcome = () => {} }: { onOpenWelcome?: () => void } = $props()

  type SolarSystemSceneExports = {
    downloadScenePng: (fileName?: string) => boolean
  }

  let solarSystemScene = $state<SolarSystemSceneExports | undefined>(undefined)
  let canvasShell = $state<HTMLDivElement | undefined>(undefined)
  let isFullscreen = $state(false)
  let autoRotate = $state(true)
  let showOrbits = $state(true)
  let starPresetId = $state(BUILTIN_STAR_PRESETS[0]?.id ?? '')
  let userRockyPresets = $state<PlanetoidPreset[]>([])
  let userGiantPresets = $state<GasGiantPreset[]>([])
  let userStarPresets = $state<StarPreset[]>([])
  let bodies = $state<SystemBody[]>(DefaultSystemBodies.map((body) => ({ ...body })))
  let textureSize = $state<TextureSize>(DefaultTextureSize)
  let isSaving = $state(false)

  const rockyPresets = $derived([...BUILTIN_PRESETS, ...userRockyPresets])
  const giantPresets = $derived([...BUILTIN_GAS_GIANT_PRESETS, ...userGiantPresets])
  const starPresets = $derived([...BUILTIN_STAR_PRESETS, ...userStarPresets])
  const starSettings: StarSettings = $derived(
    starPresets.find((preset) => preset.id === starPresetId)?.settings ??
      BUILTIN_STAR_PRESETS[0]?.settings ??
      StarDefaults
  )

  // Presets saved in the other generators live in localStorage, so pick them up on mount.
  $effect(() => {
    userRockyPresets = loadUserPlanetoidPresets()
    userGiantPresets = loadUserGasGiantPresets()
    userStarPresets = loadUserStarPresets()
  })

  function userPresetOptions(kind: SystemBodyKind) {
    const presets = kind === 'rocky' ? userRockyPresets : userGiantPresets
    return presets.map((preset) => ({ id: preset.id, name: preset.name }))
  }

  function changeBodyKind(index: number, kind: SystemBodyKind): void {
    const body = bodies[index]
    if (!body) return

    bodies[index] = {
      ...body,
      kind,
      presetId: defaultPresetId(kind),
      scale: defaultScaleForKind(kind),
    }
  }

  function addBody(): void {
    bodies = [...bodies, createSystemBody(bodies)]
  }

  function removeBody(id: string): void {
    bodies = bodies.filter((body) => body.id !== id)
  }

  $effect(() => {
    function syncFullscreenState(): void {
      isFullscreen = document.fullscreenElement === canvasShell
    }

    document.addEventListener('fullscreenchange', syncFullscreenState)
    syncFullscreenState()

    return () => document.removeEventListener('fullscreenchange', syncFullscreenState)
  })

  async function toggleFullscreen(): Promise<void> {
    if (!canvasShell) return

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        return
      }

      await canvasShell.requestFullscreen()
    } catch (error) {
      console.warn('Fullscreen request failed', error)
    }
  }

  function timestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-')
  }

  function downloadRender(): void {
    if (!solarSystemScene) return

    isSaving = true
    try {
      solarSystemScene.downloadScenePng(`solar-system-${timestamp()}.png`)
    } finally {
      isSaving = false
    }
  }
</script>

<div class="page">
  <PageTitle title="Solar System" activeHref="#/system" {onOpenWelcome} />

  <section class="threlte-view">
    <div class="canvas-shell" class:fullscreen={isFullscreen} bind:this={canvasShell}>
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
        <SolarSystemScene
          bind:this={solarSystemScene}
          {bodies}
          {rockyPresets}
          {giantPresets}
          {starSettings}
          {autoRotate}
          {showOrbits}
          {textureSize}
        />
      </Canvas>
      <button
        class="fullscreen-toggle"
        type="button"
        onclick={toggleFullscreen}
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Expand scene to fullscreen'}
        title={isFullscreen ? 'Exit fullscreen' : 'Expand scene to fullscreen'}
      >
        {isFullscreen ? '✕' : '⛶'}
      </button>
    </div>

    <div class="controls">
      <fieldset>
        <legend>Scene</legend>
        <p class="hint">Drag to orbit, right-drag to pan, scroll to fly forwards.</p>
        <div class="save-actions" aria-label="Save and export actions">
          <div class="export-actions">
            <button
              class="action"
              type="button"
              onclick={downloadRender}
              disabled={isSaving}
              aria-label="Save scene PNG"
            >
              PNG
            </button>
            <button
              class="action"
              type="button"
              onclick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Expand scene to fullscreen'}
            >
              {isFullscreen ? 'EXIT' : 'FULL'}
            </button>
          </div>
        </div>
        <label class="toggle-row">
          <span>Auto-rotate bodies</span>
          <input type="checkbox" bind:checked={autoRotate} />
        </label>
        <label class="toggle-row">
          <span>Show orbit lines</span>
          <input type="checkbox" bind:checked={showOrbits} />
        </label>
        <TextureSizeControl
          id="solar-system-texture-size"
          label="Texture size"
          bind:value={textureSize}
        />
      </fieldset>

      <fieldset>
        <legend>Star</legend>
        <label class="compact-number-row">
          <span>Preset</span>
          <select bind:value={starPresetId}>
            <optgroup label="Preconfigured">
              {#each BUILTIN_STAR_PRESETS as preset (preset.id)}
                <option value={preset.id}>{preset.name}</option>
              {/each}
            </optgroup>
            {#if userStarPresets.length > 0}
              <optgroup label="Saved">
                {#each userStarPresets as preset (preset.id)}
                  <option value={preset.id}>{preset.name}</option>
                {/each}
              </optgroup>
            {/if}
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>Bodies</legend>
        <ul class="body-list">
          {#each bodies as body, index (body.id)}
            <li class="body-row">
              <select
                aria-label="Body type"
                value={body.kind}
                onchange={(event) =>
                  changeBodyKind(index, event.currentTarget.value as SystemBodyKind)}
              >
                {#each SystemBodyKinds as kind (kind)}
                  <option value={kind}>{SystemBodyKindLabels[kind]}</option>
                {/each}
              </select>
              <select aria-label="Preset" bind:value={bodies[index].presetId}>
                <optgroup label="Preconfigured">
                  {#each presetOptionsForKind(body.kind) as option (option.id)}
                    <option value={option.id}>{option.name}</option>
                  {/each}
                </optgroup>
                {#if userPresetOptions(body.kind).length > 0}
                  <optgroup label="Saved">
                    {#each userPresetOptions(body.kind) as option (option.id)}
                      <option value={option.id}>{option.name}</option>
                    {/each}
                  </optgroup>
                {/if}
              </select>
              <button
                class="remove"
                type="button"
                onclick={() => removeBody(body.id)}
                aria-label="Remove body"
                title="Remove body"
              >
                ✕
              </button>
            </li>
          {/each}
        </ul>
        <button class="action" type="button" onclick={addBody} aria-label="Add a body">
          ADD BODY
        </button>
      </fieldset>
    </div>
  </section>
</div>

<style>
  .canvas-shell {
    position: relative;
  }

  .canvas-shell.fullscreen {
    width: 100%;
    height: 100%;
    max-height: none;
    aspect-ratio: auto;
    border: none;
    border-radius: 0;
  }

  .fullscreen-toggle {
    position: absolute;
    top: 0.6rem;
    right: 0.6rem;
    width: 2rem;
    height: 2rem;
    display: grid;
    place-items: center;
    font-size: 1rem;
    line-height: 1;
    color: #d7e4f4;
    background: transparent;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }

  .fullscreen-toggle:hover {
    color: #ffffff;
    background: rgba(18, 40, 70, 0.6);
  }

  .hint {
    margin: 0;
    font-size: 0.85rem;
    line-height: 1.4;
    color: #a9c0da;
  }

  .body-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.5rem;
  }

  .body-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.4rem;
  }

  .body-row select {
    min-width: 0;
    padding: 0.35rem 0.4rem;
    font-size: 0.8rem;
  }

  .remove {
    padding: 0.35rem 0.5rem;
    font-size: 0.8rem;
    line-height: 1;
    cursor: pointer;
  }
</style>
