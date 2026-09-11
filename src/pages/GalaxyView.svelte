<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { WebGLRenderer } from 'three'
  import '../styles/common.css'
  import PageTitle from '../lib/components/Layout/PageTitle.svelte'
  import GalaxyScene from '../lib/components/Threlte/GalaxyScene.svelte'

  const { onOpenWelcome = () => {} }: { onOpenWelcome?: () => void } = $props()

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
        <GalaxyScene />
      </Canvas>
    </div>
  </section>
</div>

<style>
  .galaxy-view {
    display: grid;
    place-items: center;
    min-height: calc(100dvh - 5rem);
  }

  .galaxy-canvas {
    width: min(100%, 1100px);
    max-height: calc(100dvh - 7rem);
    justify-self: center;
    border-radius: 10px;
  }
</style>
