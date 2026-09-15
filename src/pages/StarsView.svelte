<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { WebGLRenderer } from 'three'
  import '../styles/common.css'
  import PageTitle from '../lib/components/Layout/PageTitle.svelte'
  import StarsScene from '../lib/components/Threlte/StarsScene.svelte'
  import {
    DefaultValues,
    MaxValues,
    MinValues,
    StepValues,
    type StarPaletteName,
  } from '../lib/components/Threlte/Star/StarSettings'

  const { onOpenWelcome = () => {} }: { onOpenWelcome?: () => void } = $props()

  type StarsSceneExports = {
    downloadTextureMapPng: (fileName?: string) => Promise<boolean>
  }

  const pageTitleLinks = [
    { href: '#/planetoids', label: 'Planetoids' },
    { href: '#/giants', label: 'Gas and Ice Giants' },
  ]

  let canvasShell = $state<HTMLDivElement | undefined>(undefined)
  let starScene = $state<StarsSceneExports | undefined>(undefined)
  let seed = $state(DefaultValues.seed)
  let textureScale = $state(DefaultValues.textureScale)
  let bandContrast = $state(DefaultValues.bandContrast)
  let bandSwirl = $state(DefaultValues.bandSwirl)
  let granularity = $state(DefaultValues.granularity)
  let turbulence = $state(DefaultValues.turbulence)
  let convection = $state(DefaultValues.convection)
  let sunspotCount = $state(DefaultValues.sunspotCount)
  let sunspotScale = $state(DefaultValues.sunspotScale)
  let sunspotJaggedness = $state(DefaultValues.sunspotJaggedness)
  let sunspotNeighbours = $state(DefaultValues.sunspotNeighbours)
  let brightness = $state(DefaultValues.brightness)
  let palette = $state<StarPaletteName>(DefaultValues.palette)
  let limbBrightness = $state(DefaultValues.limbBrightness)
  let autoRotate = $state(DefaultValues.autoRotate)
  let isSaving = $state(false)

  function timestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  }

  function randomizeSeed(): void {
    seed = Math.floor(Math.random() * 100_000)
  }

  function downloadRender(): void {
    const canvas = canvasShell?.querySelector('canvas')
    if (!(canvas instanceof HTMLCanvasElement) || isSaving) return

    isSaving = true
    try {
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `generated-star-render-${timestamp()}.png`
      link.click()
    } finally {
      isSaving = false
    }
  }

  async function downloadTexture(): Promise<void> {
    if (!starScene || isSaving) return

    isSaving = true
    try {
      await starScene.downloadTextureMapPng(`generated-star-texture-${timestamp()}.png`)
    } finally {
      isSaving = false
    }
  }
</script>

<div class="page">
  <PageTitle title="Star Generator" links={pageTitleLinks} {onOpenWelcome} />

  <section class="threlte-view">
    <div class="canvas-shell" bind:this={canvasShell}>
      <Canvas
        dpr={1}
        createRenderer={(canvas) =>
          new WebGLRenderer({
            canvas,
            powerPreference: 'high-performance',
            antialias: true,
            alpha: false,
            preserveDrawingBuffer: true,
          })}
      >
        <StarsScene
          bind:this={starScene}
          {seed}
          {textureScale}
          {bandContrast}
          {bandSwirl}
          {granularity}
          {turbulence}
          {convection}
          {sunspotCount}
          {sunspotScale}
          {sunspotJaggedness}
          {sunspotNeighbours}
          {brightness}
          {palette}
          {limbBrightness}
          {autoRotate}
        />
      </Canvas>
    </div>

    <div class="controls">
      <fieldset>
        <legend>Export</legend>
        <div class="export-actions">
          <button class="action" type="button" onclick={downloadRender} disabled={isSaving}>PNG</button>
          <button class="action" type="button" onclick={downloadTexture} disabled={isSaving}>TEX</button>
        </div>
      </fieldset>

      <fieldset>
        <legend>Stellar Surface</legend>
        <label class="compact-number-row">
          <span>Seed</span>
          <input type="number" min={MinValues.seed} max={MaxValues.seed} step={StepValues.seed} bind:value={seed} />
        </label>
        <button class="action" type="button" onclick={randomizeSeed}>New Seed</button>
        <label>
          <span>Stellar class</span>
          <select bind:value={palette}>
            <option value="White">White</option>
            <option value="Blue">Blue</option>
            <option value="Yellow">Yellow</option>
            <option value="Orange">Orange</option>
            <option value="Red">Red</option>
          </select>
        </label>
        <label class="compact-number-row">
          <span>Brightness</span>
          <input type="number" min={MinValues.brightness} max={MaxValues.brightness} step={StepValues.brightness} bind:value={brightness} />
        </label>
        <label class="compact-number-row">
          <span>Limb brightness</span>
          <input type="number" min={MinValues.limbBrightness} max={MaxValues.limbBrightness} step={StepValues.limbBrightness} bind:value={limbBrightness} />
        </label>
        <label class="compact-number-row">
          <span>Band scale</span>
          <input type="number" min={MinValues.textureScale} max={MaxValues.textureScale} step={StepValues.textureScale} bind:value={textureScale} />
        </label>
        <label class="compact-number-row">
          <span>Band contrast</span>
          <input type="number" min={MinValues.bandContrast} max={MaxValues.bandContrast} step={StepValues.bandContrast} bind:value={bandContrast} />
        </label>
        <label class="compact-number-row">
          <span>Band swirl</span>
          <input type="number" min={MinValues.bandSwirl} max={MaxValues.bandSwirl} step={StepValues.bandSwirl} bind:value={bandSwirl} />
        </label>
        <label class="compact-number-row">
          <span>Granularity</span>
          <input type="number" min={MinValues.granularity} max={MaxValues.granularity} step={StepValues.granularity} bind:value={granularity} />
        </label>
        <label class="compact-number-row">
          <span>Turbulence</span>
          <input type="number" min={MinValues.turbulence} max={MaxValues.turbulence} step={StepValues.turbulence} bind:value={turbulence} />
        </label>
        <label class="compact-number-row">
          <span>Convection</span>
          <input type="number" min={MinValues.convection} max={MaxValues.convection} step={StepValues.convection} bind:value={convection} />
        </label>
        <label class="compact-number-row">
          <span>Sunspot groups</span>
          <input type="number" min={MinValues.sunspotCount} max={MaxValues.sunspotCount} step={StepValues.sunspotCount} bind:value={sunspotCount} />
        </label>
        <label class="compact-number-row">
          <span>Sunspot scale</span>
          <input type="number" min={MinValues.sunspotScale} max={MaxValues.sunspotScale} step={StepValues.sunspotScale} bind:value={sunspotScale} />
        </label>
        <label class="compact-number-row">
          <span>Sunspot jaggedness</span>
          <input type="number" min={MinValues.sunspotJaggedness} max={MaxValues.sunspotJaggedness} step={StepValues.sunspotJaggedness} bind:value={sunspotJaggedness} />
        </label>
        <label class="compact-number-row">
          <span>Max neighbours</span>
          <input type="number" min={MinValues.sunspotNeighbours} max={MaxValues.sunspotNeighbours} step={StepValues.sunspotNeighbours} bind:value={sunspotNeighbours} />
        </label>
        <label class="toggle-row">
          <span>Auto-rotate</span>
          <input type="checkbox" bind:checked={autoRotate} />
        </label>
      </fieldset>
    </div>
  </section>
</div>