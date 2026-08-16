<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { WebGLRenderer } from 'three'
  import GasGiantScene from '../lib/components/Threlte/GasGiantScene.svelte'
  import {
    GasGiantPaletteNames,
    GasGiantPalettes,
    type GasGiantPaletteName,
  } from '../lib/components/Threlte/Objects/GasGiantPalettes'
  import {
    DefaultGasGiantSettings,
    MaxValues,
    MinValues,
    type GasGiantSettings,
  } from '../lib/components/Threlte/Objects/GasGiantSettings'

  type GasGiantViewSettings = GasGiantSettings

  const GAS_GIANT_SETTINGS_STORAGE_KEY = 'gas-giant-view-settings-v1'

  const DEFAULT_GAS_GIANT_SETTINGS: GasGiantViewSettings = { ...DefaultGasGiantSettings }

  let seed = $state(DEFAULT_GAS_GIANT_SETTINGS.seed)
  let autoRotate = $state(DEFAULT_GAS_GIANT_SETTINGS.autoRotate)
  let palette = $state<GasGiantPaletteName>(DEFAULT_GAS_GIANT_SETTINGS.palette)
  let surfaceTint = $state(DEFAULT_GAS_GIANT_SETTINGS.surfaceTint)
  let colorScale = $state(DEFAULT_GAS_GIANT_SETTINGS.colorScale)
  let tintShadowFloor = $state(DEFAULT_GAS_GIANT_SETTINGS.tintShadowFloor)
  let cloudBandCount = $state(DEFAULT_GAS_GIANT_SETTINGS.cloudBandCount)
  let cloudBandSharpness = $state(DEFAULT_GAS_GIANT_SETTINGS.cloudBandSharpness)
  let cloudChaos = $state(DEFAULT_GAS_GIANT_SETTINGS.cloudChaos)
  let bumpScale = $state(DEFAULT_GAS_GIANT_SETTINGS.bumpScale)
  let roughness = $state(DEFAULT_GAS_GIANT_SETTINGS.roughness)
  let metalness = $state(DEFAULT_GAS_GIANT_SETTINGS.metalness)
  let bumpTextureSize = $state(DEFAULT_GAS_GIANT_SETTINGS.bumpTextureSize)
  let colorTextureSize = $state(DEFAULT_GAS_GIANT_SETTINGS.colorTextureSize)

  let settingsHydrated = $state(false)

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
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
    bumpScale = settings.bumpScale
    roughness = settings.roughness
    metalness = settings.metalness
    bumpTextureSize = settings.bumpTextureSize
    colorTextureSize = settings.colorTextureSize
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

  const selectedPaletteGradient = $derived(
    `linear-gradient(90deg, ${GasGiantPalettes[palette]
      .map((entry) => `rgb(${entry.r}, ${entry.g}, ${entry.b})`)
      .join(', ')})`
  )
</script>

<div class="page">
  <h1 class="page-title">
    <span>Gas and Ice Giant Generator</span>
    <div class="page-title-actions">
      <a class="page-title-link" href="/planetoids">Planetoid Generator</a>
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
    </div>
  </h1>

  <section class="threlte-view">
    <div class="canvas-shell">
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
          {seed}
          {autoRotate}
          {palette}
          {surfaceTint}
          {colorScale}
          {tintShadowFloor}
          {cloudBandCount}
          {cloudBandSharpness}
          {cloudChaos}
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
        <legend>Giant Setup</legend>
        <label>
          Palette
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
        <label>
          <span class="label-row">
            <span>Surface tint</span>
            <span class="label-value">{surfaceTint.toUpperCase()}</span>
          </span>
          <input type="color" bind:value={surfaceTint} />
        </label>
        <label class="toggle-row">
          <span>Auto-rotate giant</span>
          <input type="checkbox" bind:checked={autoRotate} />
        </label>
        <label class="compact-number-row">
          <span>Seed</span>
          <input type="number" min={0} max={999999} step="1" bind:value={seed} />
        </label>
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
        <label class="compact-number-row">
          <span>Palette influence</span>
          <input type="number" min={0} max={2} step="0.05" bind:value={colorScale} />
        </label>
        <label class="compact-number-row">
          <span>Tint shadow floor</span>
          <input type="number" min={0} max={0.9} step="0.01" bind:value={tintShadowFloor} />
        </label>
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
        <label class="compact-number-row">
          <span>Bump texture height</span>
          <input type="number" min={128} max={2048} step="1" bind:value={bumpTextureSize} />
        </label>
        <label class="compact-number-row">
          <span>Color texture height</span>
          <input type="number" min={64} max={2048} step="1" bind:value={colorTextureSize} />
        </label>
      </fieldset>
    </div>
  </section>
</div>

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
    font-size: clamp(1.2rem, 2vw, 1.9rem);
    font-weight: 760;
    letter-spacing: 0.03em;
    line-height: 1.1;
    text-transform: uppercase;
    border-top: 1px solid rgba(176, 208, 239, 0.35);
    border-bottom: 1px solid rgba(176, 208, 239, 0.26);
    background:
      radial-gradient(circle at 0% 20%, rgba(42, 104, 166, 0.35), transparent 55%),
      linear-gradient(120deg, #1b325d, #122443), rgba(6, 13, 28, 0.72);
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

  .threlte-view {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 1rem;
    min-height: 0;
    padding: 1rem;
    background:
      radial-gradient(circle at top, rgba(38, 80, 128, 0.58), transparent 75%),
      linear-gradient(180deg, #030b19 0%, #081329 100%);
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

  select,
  input {
    border: 1px solid #8eb4dd;
    border-radius: 10px;
    padding: 0.55rem 0.7rem;
    background: rgba(10, 18, 34, 0.95);
    color: #f0f6ff;
  }

  .toggle-row {
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 0.75rem;
  }

  .compact-number-row {
    grid-template-columns: 1fr minmax(7ch, 9ch);
    align-items: center;
    gap: 0.75rem;
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

  .palette-preview {
    width: 100%;
    height: 2rem;
    border-radius: 999px;
    border: 1px solid rgba(173, 209, 241, 0.62);
    box-shadow: inset 0 0 0 1px rgba(3, 8, 16, 0.55);
  }

  @media (max-width: 1080px) {
    .threlte-view {
      grid-template-columns: 1fr;
    }

    .canvas-shell {
      width: min(100%, 540px);
      max-height: min(70vh, 540px);
      justify-self: center;
    }

    .controls {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
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

