<script lang="ts">
  import { getContext, type Snippet } from 'svelte'
  import { canvasHostKey, type CanvasHostState } from './CanvasHost.svelte'

  let { children }: { children: Snippet } = $props()
  const host = getContext<CanvasHostState>(canvasHostKey)
  let target: HTMLDivElement | undefined = $state(undefined)

  $effect(() => {
    const currentTarget = target
    if (!currentTarget) return
    host.target = currentTarget
    host.scene = children
    return () => {
      if (host.target === currentTarget) {
        host.target = undefined
        host.scene = undefined
      }
    }
  })
</script>

<div class="scene-canvas" bind:this={target}></div>

<style>
  .scene-canvas {
    position: absolute;
    inset: 0;
  }
</style>
