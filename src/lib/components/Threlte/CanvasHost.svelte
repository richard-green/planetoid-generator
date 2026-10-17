<script module lang="ts">
  import type { Snippet } from 'svelte'

  export const canvasHostKey = Symbol('canvas-host')

  export type CanvasHostState = {
    target?: HTMLDivElement
    scene?: Snippet
  }

  if (import.meta.hot) {
    import.meta.hot.accept(() => window.location.reload())
  }
</script>

<script lang="ts">
  import { Canvas } from '@threlte/core'
  import { setContext } from 'svelte'
  import { WebGLRenderer } from 'three'
  import { retainShaderPrograms } from '../../utils/rendererProgramCache'
  import WebGLFailure from './WebGLFailure.svelte'

  let { children }: { children: Snippet } = $props()
  const host: CanvasHostState = $state({})
  setContext(canvasHostKey, host)
  let canvasRoot: HTMLDivElement | undefined = $state(undefined)
  let failedScene: Snippet | undefined = $state(undefined)
  let resetFailure: (() => void) | undefined = $state(undefined)

  $effect(() => {
    const target = host.target
    if (target && canvasRoot && canvasRoot.parentElement !== target) {
      target.appendChild(canvasRoot)
    }
  })

  $effect(() => {
    if (resetFailure && host.scene && host.scene !== failedScene) {
      const reset = resetFailure
      resetFailure = undefined
      reset()
    }
  })
</script>

{@render children()}

<div class="canvas-host" bind:this={canvasRoot} hidden={!host.target}>
  <svelte:boundary
    onerror={(_error, reset) => {
      failedScene = host.scene
      resetFailure = reset
    }}
  >
    <Canvas
      dpr={1}
      createRenderer={(canvas) => {
        const renderer = new WebGLRenderer({
          canvas,
          powerPreference: 'high-performance',
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        })
        return retainShaderPrograms(renderer)
      }}
    >
      {#if host.scene}
        {@render host.scene()}
      {/if}
    </Canvas>
    {#snippet failed(error)}
      <WebGLFailure {error} />
    {/snippet}
  </svelte:boundary>
</div>

<style>
  .canvas-host {
    position: absolute;
    inset: 0;
  }
</style>
