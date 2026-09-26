<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { WebGLRenderer } from 'three'
  import '../styles/common.css'
  import PageTitle from '../lib/components/Layout/PageTitle.svelte'
  import FullscreenControl from '../lib/components/Controls/FullscreenControl.svelte'
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
      <FullscreenControl target={canvasShell} />
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
