<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { WebGLRenderer } from 'three'
  import '../styles/common.css'
  import CollapsibleControl from '../lib/components/Controls/CollapsibleControl.svelte'
  import PaletteControl from '../lib/components/Controls/PaletteControl.svelte'
  import SeedControl from '../lib/components/Controls/SeedControl.svelte'
  import PageTitle from '../lib/components/Layout/PageTitle.svelte'
  import StarsScene from '../lib/components/Threlte/StarsScene.svelte'
  import { StarPalettes } from '../lib/components/Threlte/Star/StarPalettes'
  import {
    DefaultValues,
    MaxValues,
    MinValues,
    sanitizeStarSettings,
    StarPaletteNames,
    StepValues,
    type StarPaletteName,
    type StarSettings,
  } from '../lib/components/Threlte/Star/StarSettings'

  const { onOpenWelcome = () => {} }: { onOpenWelcome?: () => void } = $props()
  const STAR_SETTINGS_STORAGE_KEY = 'star-view-settings-v1'

  type StarsSceneExports = {
    downloadTextureMapPng: (fileName?: string) => boolean
  }

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
  let sunspotPower = $state(DefaultValues.sunspotPower)
  let sunspotJaggedness = $state(DefaultValues.sunspotJaggedness)
  let sunspotNeighbours = $state(DefaultValues.sunspotNeighbours)
  let penumbraScale = $state(DefaultValues.penumbraScale)
  let sunspotDarkness = $state(DefaultValues.sunspotDarkness)
  let brightness = $state(DefaultValues.brightness)
  let saturation = $state(DefaultValues.saturation)
  let contrast = $state(DefaultValues.contrast)
  let palette = $state<StarPaletteName>(DefaultValues.palette)
  let limbBrightness = $state(DefaultValues.limbBrightness)
  let haloIntensity = $state(DefaultValues.haloIntensity)
  let haloFalloff = $state(DefaultValues.haloFalloff)
  let haloSize = $state(DefaultValues.haloSize)
  let haloTurbulence = $state(DefaultValues.haloTurbulence)
  let plasmaIntensity = $state(DefaultValues.plasmaIntensity)
  let plasmaExtent = $state(DefaultValues.plasmaExtent)
  let plasmaTurbulence = $state(DefaultValues.plasmaTurbulence)
  let plasmaSharpness = $state(DefaultValues.plasmaSharpness)
  let plasmaTextureScale = $state(DefaultValues.plasmaTextureScale)
  let colorTextureSize = $state(DefaultValues.colorTextureSize)
  let autoRotate = $state(DefaultValues.autoRotate)
  let isSaving = $state(false)
  let settingsHydrated = $state(false)
  let stellarSurfaceSectionOpen = $state(true)
  let haloSectionOpen = $state(true)
  let plasmaSectionOpen = $state(true)
  let textureSectionOpen = $state(true)
  let textureResolutionSectionOpen = $state(false)
  let sunspotSectionOpen = $state(false)

  function applyStarSettings(settings: StarSettings): void {
    seed = settings.seed
    palette = settings.palette
    brightness = settings.brightness
    saturation = settings.saturation
    contrast = settings.contrast
    limbBrightness = settings.limbBrightness
    haloIntensity = settings.haloIntensity
    haloFalloff = settings.haloFalloff
    haloSize = settings.haloSize
    haloTurbulence = settings.haloTurbulence
    plasmaIntensity = settings.plasmaIntensity
    plasmaExtent = settings.plasmaExtent
    plasmaTurbulence = settings.plasmaTurbulence
    plasmaSharpness = settings.plasmaSharpness
    plasmaTextureScale = settings.plasmaTextureScale
    colorTextureSize = settings.colorTextureSize
    textureScale = settings.textureScale
    bandContrast = settings.bandContrast
    bandSwirl = settings.bandSwirl
    granularity = settings.granularity
    turbulence = settings.turbulence
    convection = settings.convection
    sunspotCount = settings.sunspotCount
    sunspotScale = settings.sunspotScale
    sunspotPower = settings.sunspotPower
    sunspotJaggedness = settings.sunspotJaggedness
    sunspotNeighbours = settings.sunspotNeighbours
    penumbraScale = settings.penumbraScale
    sunspotDarkness = settings.sunspotDarkness
    autoRotate = settings.autoRotate
  }

  function getStarSettings(): StarSettings {
    return {
      seed,
      palette,
      brightness,
      saturation,
      contrast,
      limbBrightness,
      haloIntensity,
      haloFalloff,
      haloSize,
      haloTurbulence,
      plasmaIntensity,
      plasmaExtent,
      plasmaTurbulence,
      plasmaSharpness,
      plasmaTextureScale,
      colorTextureSize,
      textureScale,
      bandContrast,
      bandSwirl,
      granularity,
      turbulence,
      convection,
      sunspotCount,
      sunspotScale,
      sunspotPower,
      sunspotJaggedness,
      sunspotNeighbours,
      penumbraScale,
      sunspotDarkness,
      autoRotate,
    }
  }

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

  function timestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
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
  <PageTitle title="Star Generator" activeHref="#/stars" {onOpenWelcome} />

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
          {sunspotPower}
          {sunspotJaggedness}
          {sunspotNeighbours}
          {penumbraScale}
          {sunspotDarkness}
          {brightness}
          {saturation}
          {contrast}
          {palette}
          {limbBrightness}
          {haloIntensity}
          {haloFalloff}
          {haloSize}
          {haloTurbulence}
          {plasmaIntensity}
          {plasmaExtent}
          {plasmaTurbulence}
          {plasmaSharpness}
          {plasmaTextureScale}
          {colorTextureSize}
          {autoRotate}
        />
      </Canvas>
    </div>

    <div class="controls">
      <fieldset>
        <legend>Scene</legend>
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
              onclick={downloadTexture}
              disabled={isSaving}
              aria-label="Download texture map"
            >
              TEX
            </button>
          </div>
        </div>
        <label class="toggle-row">
          <span>Auto-rotate</span>
          <input type="checkbox" bind:checked={autoRotate} />
        </label>
        <SeedControl
          id="star-seed"
          min={MinValues.seed}
          max={MaxValues.seed}
          step={StepValues.seed}
          bind:value={seed}
        />
      </fieldset>

      <fieldset>
        <legend>Texture</legend>
        <CollapsibleControl title="Color settings" bind:open={stellarSurfaceSectionOpen}>
          <div class="control-grid">
            <PaletteControl
              id="star-palette"
              title="Stellar class"
              options={StarPaletteNames}
              palettes={StarPalettes}
              bind:value={palette}
            />
            <label class="compact-number-row">
              <span>Brightness</span>
              <input
                type="number"
                min={MinValues.brightness}
                max={MaxValues.brightness}
                step={StepValues.brightness}
                bind:value={brightness}
              />
            </label>
            <label class="compact-number-row">
              <span>Saturation</span>
              <input
                type="number"
                min={MinValues.saturation}
                max={MaxValues.saturation}
                step={StepValues.saturation}
                bind:value={saturation}
              />
            </label>
            <label class="compact-number-row">
              <span>Contrast</span>
              <input
                type="number"
                min={MinValues.contrast}
                max={MaxValues.contrast}
                step={StepValues.contrast}
                bind:value={contrast}
              />
            </label>
            <label class="compact-number-row">
              <span>Limb brightness</span>
              <input
                type="number"
                min={MinValues.limbBrightness}
                max={MaxValues.limbBrightness}
                step={StepValues.limbBrightness}
                bind:value={limbBrightness}
              />
            </label>
          </div>
        </CollapsibleControl>
        <CollapsibleControl title="Surface pattern" bind:open={textureSectionOpen}>
          <div class="control-grid">
            <label class="compact-number-row">
              <span>Band scale</span>
              <input
                type="number"
                min={MinValues.textureScale}
                max={MaxValues.textureScale}
                step={StepValues.textureScale}
                bind:value={textureScale}
              />
            </label>
            <label class="compact-number-row">
              <span>Band contrast</span>
              <input
                type="number"
                min={MinValues.bandContrast}
                max={MaxValues.bandContrast}
                step={StepValues.bandContrast}
                bind:value={bandContrast}
              />
            </label>
            <label class="compact-number-row">
              <span>Band swirl</span>
              <input
                type="number"
                min={MinValues.bandSwirl}
                max={MaxValues.bandSwirl}
                step={StepValues.bandSwirl}
                bind:value={bandSwirl}
              />
            </label>
            <label class="compact-number-row">
              <span>Granularity</span>
              <input
                type="number"
                min={MinValues.granularity}
                max={MaxValues.granularity}
                step={StepValues.granularity}
                bind:value={granularity}
              />
            </label>
            <label class="compact-number-row">
              <span>Turbulence</span>
              <input
                type="number"
                min={MinValues.turbulence}
                max={MaxValues.turbulence}
                step={StepValues.turbulence}
                bind:value={turbulence}
              />
            </label>
            <label class="compact-number-row">
              <span>Convection</span>
              <input
                type="number"
                min={MinValues.convection}
                max={MaxValues.convection}
                step={StepValues.convection}
                bind:value={convection}
              />
            </label>
          </div>
        </CollapsibleControl>
        <CollapsibleControl title="Texture resolution" bind:open={textureResolutionSectionOpen}>
          <div class="control-grid">
            <label class="compact-number-row">
              <span>Color texture size</span>
              <input
                type="number"
                min={MinValues.colorTextureSize}
                max={MaxValues.colorTextureSize}
                step={StepValues.colorTextureSize}
                bind:value={colorTextureSize}
              />
            </label>
          </div>
        </CollapsibleControl>
      </fieldset>

      <fieldset>
        <legend>Features</legend>
        <CollapsibleControl title="Sunspots" bind:open={sunspotSectionOpen}>
          <div class="control-grid">
            <label class="compact-number-row">
              <span>Sunspot groups</span>
              <input
                type="number"
                min={MinValues.sunspotCount}
                max={MaxValues.sunspotCount}
                step={StepValues.sunspotCount}
                bind:value={sunspotCount}
              />
            </label>
            <label class="compact-number-row">
              <span>Sunspot scale</span>
              <input
                type="number"
                min={MinValues.sunspotScale}
                max={MaxValues.sunspotScale}
                step={StepValues.sunspotScale}
                bind:value={sunspotScale}
              />
            </label>
            <label class="compact-number-row">
              <span>Spot size power</span>
              <input
                type="number"
                min={MinValues.sunspotPower}
                max={MaxValues.sunspotPower}
                step={StepValues.sunspotPower}
                bind:value={sunspotPower}
              />
            </label>
            <label class="compact-number-row">
              <span>Sunspot jaggedness</span>
              <input
                type="number"
                min={MinValues.sunspotJaggedness}
                max={MaxValues.sunspotJaggedness}
                step={StepValues.sunspotJaggedness}
                bind:value={sunspotJaggedness}
              />
            </label>
            <label class="compact-number-row">
              <span>Max neighbours</span>
              <input
                type="number"
                min={MinValues.sunspotNeighbours}
                max={MaxValues.sunspotNeighbours}
                step={StepValues.sunspotNeighbours}
                bind:value={sunspotNeighbours}
              />
            </label>
            <label class="compact-number-row">
              <span>Penumbra scale</span>
              <input
                type="number"
                min={MinValues.penumbraScale}
                max={MaxValues.penumbraScale}
                step={StepValues.penumbraScale}
                bind:value={penumbraScale}
              />
            </label>
            <label class="compact-number-row">
              <span>Sunspot darkness</span>
              <input
                type="number"
                min={MinValues.sunspotDarkness}
                max={MaxValues.sunspotDarkness}
                step={StepValues.sunspotDarkness}
                bind:value={sunspotDarkness}
              />
            </label>
          </div>
        </CollapsibleControl>
      </fieldset>

      <fieldset>
        <legend>Atmosphere</legend>
        <CollapsibleControl title="Halo" bind:open={haloSectionOpen}>
          <div class="control-grid">
            <label class="compact-number-row">
              <span>Halo brightness</span>
              <input
                type="number"
                min={MinValues.haloIntensity}
                max={MaxValues.haloIntensity}
                step={StepValues.haloIntensity}
                bind:value={haloIntensity}
              />
            </label>
            <label class="compact-number-row">
              <span>Halo dropoff</span>
              <input
                type="number"
                min={MinValues.haloFalloff}
                max={MaxValues.haloFalloff}
                step={StepValues.haloFalloff}
                bind:value={haloFalloff}
              />
            </label>
            <label class="compact-number-row">
              <span>Halo size</span>
              <input
                type="number"
                min={MinValues.haloSize}
                max={MaxValues.haloSize}
                step={StepValues.haloSize}
                bind:value={haloSize}
              />
            </label>
            <label class="compact-number-row">
              <span>Halo turbulence</span>
              <input
                type="number"
                min={MinValues.haloTurbulence}
                max={MaxValues.haloTurbulence}
                step={StepValues.haloTurbulence}
                bind:value={haloTurbulence}
              />
            </label>
          </div>
        </CollapsibleControl>

        <CollapsibleControl title="Plasma" bind:open={plasmaSectionOpen}>
          <div class="control-grid">
            <label class="compact-number-row">
              <span>Plasma brightness</span>
              <input
                type="number"
                min={MinValues.plasmaIntensity}
                max={MaxValues.plasmaIntensity}
                step={StepValues.plasmaIntensity}
                bind:value={plasmaIntensity}
              />
            </label>
            <label class="compact-number-row">
              <span>Plasma extent</span>
              <input
                type="number"
                min={MinValues.plasmaExtent}
                max={MaxValues.plasmaExtent}
                step={StepValues.plasmaExtent}
                bind:value={plasmaExtent}
              />
            </label>
            <label class="compact-number-row">
              <span>Plasma turbulence</span>
              <input
                type="number"
                min={MinValues.plasmaTurbulence}
                max={MaxValues.plasmaTurbulence}
                step={StepValues.plasmaTurbulence}
                bind:value={plasmaTurbulence}
              />
            </label>
            <label class="compact-number-row">
              <span>Plasma sharpness</span>
              <input
                type="number"
                min={MinValues.plasmaSharpness}
                max={MaxValues.plasmaSharpness}
                step={StepValues.plasmaSharpness}
                bind:value={plasmaSharpness}
              />
            </label>
            <label class="compact-number-row">
              <span>Plasma texture scale</span>
              <input
                type="number"
                min={MinValues.plasmaTextureScale}
                max={MaxValues.plasmaTextureScale}
                step={StepValues.plasmaTextureScale}
                bind:value={plasmaTextureScale}
              />
            </label>
          </div>
        </CollapsibleControl>
      </fieldset>
    </div>
  </section>
</div>
