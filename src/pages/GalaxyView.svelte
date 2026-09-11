<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { WebGLRenderer } from 'three'
  import '../styles/common.css'
  import PageTitle from '../lib/components/Layout/PageTitle.svelte'
  import GalaxyScene from '../lib/components/Threlte/GalaxyScene.svelte'

  const { onOpenWelcome = () => {} }: { onOpenWelcome?: () => void } = $props()
  let haloStrength = $state(0.32)
  let nebulaAmount = $state(1)
  let nebulaSize = $state(1)
  let nebulaDepth = $state(1)
  let nebulaBrightness = $state(1)
  let armCount = $state(4)
  let armRotation = $state(0.62)
  let armSpread = $state(0.28)
  let armThickness = $state(1)
  let armDepth = $state(0.12)
  let coreDensity = $state(0.7)
  let coreRadius = $state(4.7)
  let coreDepth = $state(1.75)
  let diskFalloff = $state(3.5)

  const pageTitleLinks = [
    { href: '#/planetoids', label: 'Planetoids' },
    { href: '#/giants', label: 'Gas and Ice Giants' },
  ]
</script>

<div class="page">
  <PageTitle title="Galaxy Generator" links={pageTitleLinks} {onOpenWelcome} />

  <section class="threlte-view galaxy-view">
    <div class="canvas-shell galaxy-canvas">
      <Canvas
        dpr={1}
        createRenderer={(canvas) =>
          new WebGLRenderer({
            canvas,
            powerPreference: 'high-performance',
            antialias: true,
            alpha: false,
          })}
      >
        <GalaxyScene
          {haloStrength}
          {nebulaAmount}
          {nebulaSize}
          {nebulaDepth}
          {nebulaBrightness}
          {armCount}
          {armRotation}
          {armSpread}
          {armThickness}
          {armDepth}
          {coreDensity}
          {coreRadius}
          {coreDepth}
          {diskFalloff}
        />
      </Canvas>
    </div>

    <aside class="galaxy-controls">
      <fieldset>
        <legend>Stars</legend>
        <label for="halo-strength">
          <span>Halo <output>{haloStrength.toFixed(2)}</output></span>
          <input
            id="halo-strength"
            type="range"
            min="0"
            max="0.8"
            step="0.01"
            bind:value={haloStrength}
          />
        </label>
      </fieldset>
      <fieldset>
        <legend>Nebulae</legend>
        <label for="nebula-amount">
          <span>Amount <output>{nebulaAmount.toFixed(2)}</output></span>
          <input id="nebula-amount" type="range" min="0" max="1" step="0.01" bind:value={nebulaAmount} />
        </label>
        <label for="nebula-size">
          <span>Size <output>{nebulaSize.toFixed(2)}</output></span>
          <input id="nebula-size" type="range" min="0.3" max="3" step="0.01" bind:value={nebulaSize} />
        </label>
        <label for="nebula-depth">
          <span>Depth <output>{nebulaDepth.toFixed(2)}</output></span>
          <input id="nebula-depth" type="range" min="0.1" max="3" step="0.01" bind:value={nebulaDepth} />
        </label>
        <label for="nebula-brightness">
          <span>Brightness <output>{nebulaBrightness.toFixed(2)}</output></span>
          <input
            id="nebula-brightness"
            type="range"
            min="0"
            max="3"
            step="0.01"
            bind:value={nebulaBrightness}
          />
        </label>
      </fieldset>
      <fieldset>
        <legend>Geometry</legend>
        <label for="arm-count">
          <span>Arms <output>{armCount}</output></span>
          <input id="arm-count" type="range" min="2" max="8" step="1" bind:value={armCount} />
        </label>
        <label for="arm-rotation">
          <span>Rotation <output>{armRotation.toFixed(2)}</output></span>
          <input
            id="arm-rotation"
            type="range"
            min="0.2"
            max="1.1"
            step="0.01"
            bind:value={armRotation}
          />
        </label>
        <label for="arm-spread">
          <span>Spread <output>{armSpread.toFixed(2)}</output></span>
          <input
            id="arm-spread"
            type="range"
            min="0.08"
            max="0.75"
            step="0.01"
            bind:value={armSpread}
          />
        </label>
        <label for="arm-thickness">
          <span>Arm Thickness <output>{armThickness.toFixed(2)}</output></span>
          <input
            id="arm-thickness"
            type="range"
            min="0.3"
            max="2.5"
            step="0.01"
            bind:value={armThickness}
          />
        </label>
        <label for="arm-depth">
          <span>Arm Depth <output>{armDepth.toFixed(2)}</output></span>
          <input
            id="arm-depth"
            type="range"
            min="0.02"
            max="0.8"
            step="0.01"
            bind:value={armDepth}
          />
        </label>
      </fieldset>
      <fieldset>
        <legend>Core</legend>
        <label for="core-density">
          <span>Density <output>{coreDensity.toFixed(2)}</output></span>
          <input
            id="core-density"
            type="range"
            min="0"
            max="1.5"
            step="0.01"
            bind:value={coreDensity}
          />
        </label>
        <label for="core-radius">
          <span>Radius <output>{coreRadius.toFixed(1)}</output></span>
          <input
            id="core-radius"
            type="range"
            min="1.5"
            max="8"
            step="0.1"
            bind:value={coreRadius}
          />
        </label>
        <label for="core-depth">
          <span>Depth <output>{coreDepth.toFixed(2)}</output></span>
          <input
            id="core-depth"
            type="range"
            min="0"
            max="4"
            step="0.05"
            bind:value={coreDepth}
          />
        </label>
        <label for="disk-falloff">
          <span>Disk Falloff <output>{diskFalloff.toFixed(1)}</output></span>
          <input
            id="disk-falloff"
            type="range"
            min="0.5"
            max="6"
            step="0.1"
            bind:value={diskFalloff}
          />
        </label>
      </fieldset>
    </aside>
  </section>
</div>

<style>
  .galaxy-view {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 240px;
    align-items: center;
    min-height: calc(100dvh - 5rem);
  }

  .galaxy-canvas {
    width: min(100%, 960px);
    max-height: calc(100dvh - 7rem);
    justify-self: end;
    border-radius: 10px;
  }

  .galaxy-controls {
    width: 100%;
    align-self: start;
  }

  .galaxy-controls label > span {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
  }

  .galaxy-controls output {
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 760px) {
    .galaxy-view {
      grid-template-columns: 1fr;
    }

    .galaxy-canvas {
      justify-self: center;
    }

    .galaxy-controls {
      width: min(100%, 500px);
    }
  }
</style>
