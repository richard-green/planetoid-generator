<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { WebGLRenderer } from 'three'
  import '../styles/common.css'
  import ExportSplitButton from '../lib/components/Controls/ExportSplitButton.svelte'
  import FullscreenControl from '../lib/components/Controls/FullscreenControl.svelte'
  import SeedControl from '../lib/components/Controls/SeedControl.svelte'
  import PageTitle from '../lib/components/Layout/PageTitle.svelte'
  import WebGLFailure from '../lib/components/Threlte/WebGLFailure.svelte'
  import RenderViewport from '../lib/components/Threlte/RenderViewport.svelte'
  import StarfieldScene from '../lib/components/Threlte/Starfield/StarfieldScene.svelte'
  import { fileTimestamp } from '../lib/utils/fileTimestamp'

  const { onOpenWelcome = () => {} }: { onOpenWelcome?: () => void } = $props()

  type StarfieldSceneExports = {
    downloadScenePng: (fileName?: string) => boolean
  }

  let canvasShell = $state<HTMLDivElement | undefined>(undefined)
  let starfieldScene = $state<StarfieldSceneExports | undefined>(undefined)
  let seed = $state(47291)
  let count = $state(6000)
  let zoom = $state(1)
  let colorLuminance = $state(1.35)
  let starSizeScale = $state(1)
  let dustCloudDensity = $state(0.8)
  let dustCloudOpacity = $state(0.65)
  let dustCloudScale = $state(1)
  let dustCloudSwirl = $state(0.6)
  let dustCloudClumping = $state(0.45)
  let isSaving = $state(false)

  function downloadRender(): void {
    if (!starfieldScene || isSaving) return

    isSaving = true
    try {
      starfieldScene.downloadScenePng(`generated-starfield-${fileTimestamp()}.png`)
    } finally {
      isSaving = false
    }
  }
</script>

<div class="page">
  <PageTitle title="Starfield Generator" activeHref="#/starfield" {onOpenWelcome} />

  <section class="threlte-view">
    <div class="canvas-shell starfield-canvas" bind:this={canvasShell}>
      <RenderViewport title="starfield">
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
            <StarfieldScene
              bind:this={starfieldScene}
              {seed}
              {count}
              {zoom}
              {colorLuminance}
              {starSizeScale}
              {dustCloudDensity}
              {dustCloudOpacity}
              {dustCloudScale}
              {dustCloudSwirl}
              {dustCloudClumping}
            />
          </Canvas>
          {#snippet failed(error)}
            <WebGLFailure {error} />
          {/snippet}
        </svelte:boundary>
      </RenderViewport>
      <FullscreenControl target={canvasShell} />
      <div class="field-caption" aria-live="polite">
        <span>{count.toLocaleString()} stars</span>
        <span>SEED {seed}</span>
      </div>
    </div>

    <div class="controls">
      <fieldset>
        <legend>Starfield</legend>
        <p class="hint">Drag to look around from Earth.</p>
        <div class="save-actions">
          <ExportSplitButton
            primaryAction={downloadRender}
            primaryAriaLabel="Export starfield PNG"
            disabled={isSaving}
          />
        </div>
        <label class="range-control" for="starfield-count">
          <span>Visible stars</span>
          <output>{count.toLocaleString()}</output>
          <input id="starfield-count" type="range" min="1000" max="12000" step="500" bind:value={count} />
        </label>
        <label class="range-control" for="starfield-zoom">
          <span>Sky zoom</span>
          <output>{zoom.toFixed(2)}×</output>
          <input id="starfield-zoom" type="range" min="0.8" max="1.2" step="0.05" bind:value={zoom} />
        </label>
        <label class="range-control" for="starfield-color-luminance">
          <span>Color luminance</span>
          <output>{colorLuminance.toFixed(2)}×</output>
          <input
            id="starfield-color-luminance"
            type="range"
            min="0.25"
            max="2"
            step="0.05"
            bind:value={colorLuminance}
          />
        </label>
        <label class="range-control" for="starfield-size-scale">
          <span>Star size scale</span>
          <output>{starSizeScale.toFixed(2)}×</output>
          <input
            id="starfield-size-scale"
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            bind:value={starSizeScale}
          />
        </label>
        <label class="range-control" for="starfield-dust-density">
          <span>Dust cloud density</span>
          <output>{Math.round(dustCloudDensity * 100)}%</output>
          <input
            id="starfield-dust-density"
            type="range"
            min="0"
            max="1"
            step="0.05"
            bind:value={dustCloudDensity}
          />
        </label>
        <label class="range-control" for="starfield-dust-opacity">
          <span>Dust cloud opacity</span>
          <output>{Math.round(dustCloudOpacity * 100)}%</output>
          <input
            id="starfield-dust-opacity"
            type="range"
            min="0"
            max="1"
            step="0.05"
            bind:value={dustCloudOpacity}
          />
        </label>
        <label class="range-control" for="starfield-dust-scale">
          <span>Dust cloud scale</span>
          <output>{dustCloudScale.toFixed(2)}×</output>
          <input
            id="starfield-dust-scale"
            type="range"
            min="0.5"
            max="2.5"
            step="0.05"
            bind:value={dustCloudScale}
          />
        </label>
        <label class="range-control" for="starfield-dust-swirl">
          <span>Dust cloud swirl</span>
          <output>{Math.round(dustCloudSwirl * 100)}%</output>
          <input
            id="starfield-dust-swirl"
            type="range"
            min="0"
            max="1"
            step="0.05"
            bind:value={dustCloudSwirl}
          />
        </label>
        <label class="range-control" for="starfield-dust-clumping">
          <span>Dust cloud clumping</span>
          <output>{Math.round(dustCloudClumping * 100)}%</output>
          <input
            id="starfield-dust-clumping"
            type="range"
            min="0"
            max="1"
            step="0.05"
            bind:value={dustCloudClumping}
          />
        </label>
        <SeedControl id="starfield-seed" min={1} max={999999} bind:value={seed} />
      </fieldset>

      <fieldset class="legend-fieldset">
        <legend>Spectral classes</legend>
        <div class="spectral-legend">
          <span><i class="red-dwarf"></i>Red</span>
          <span><i class="orange-dwarf"></i>Orange</span>
          <span><i class="yellow-dwarf"></i>Yellow</span>
          <span><i class="white-dwarf"></i>White</span>
          <span><i class="blue-dwarf"></i>Blue</span>
        </div>
        <p class="hint">Most stars are faint red dwarfs. Rare luminous giants and hot stars stand out at greater distances.</p>
      </fieldset>
    </div>
  </section>
</div>

<style>
  .starfield-canvas {
    background: radial-gradient(ellipse at 50% 100%, #07101a 0%, #02050b 54%, #010207 100%);
  }

  .save-actions {
    align-items: center;
    justify-content: flex-start;
  }

  .range-control {
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 0.35rem 0.6rem;
  }

  .range-control output {
    color: #f1d8ad;
    font-variant-numeric: tabular-nums;
  }

  .range-control input {
    grid-column: 1 / -1;
    width: 100%;
    min-width: 0;
    padding: 0;
    accent-color: #e8bb78;
  }

  .legend-fieldset {
    gap: 0.65rem;
  }

  .spectral-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.65rem 0.9rem;
  }

  .spectral-legend span {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
  }

  .spectral-legend i {
    width: 0.62rem;
    height: 0.62rem;
    border-radius: 50%;
    box-shadow: 0 0 9px currentColor;
  }

  .red-dwarf { color: #ffad7a; background: currentColor; }
  .orange-dwarf { color: #ffd0a1; background: currentColor; }
  .yellow-dwarf { color: #fff1cf; background: currentColor; }
  .white-dwarf { color: #dce8ff; background: currentColor; }
  .blue-dwarf { color: #9bbcff; background: currentColor; }

  .field-caption {
    position: absolute;
    left: 1rem;
    bottom: 0.85rem;
    display: flex;
    gap: 0.9rem;
    color: rgba(229, 237, 250, 0.76);
    font-size: 0.68rem;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.08em;
    pointer-events: none;
    text-shadow: 0 1px 8px #000;
    text-transform: uppercase;
  }

  @media (max-width: 900px) {
    .starfield-canvas {
      width: min(100%, calc(100vw - 2rem));
      position: relative;
    }
  }
</style>