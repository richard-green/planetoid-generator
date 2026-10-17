<script lang="ts">
  import { onMount, type Snippet } from 'svelte'

  type Props = {
    title: string
    children: Snippet
  }

  let { title, children }: Props = $props()
  let sceneMounted = $state(false)
  let isRendering = $state(true)

  onMount(() => {
    let firstFrame = 0
    let mountFrame = 0
    let readyFrameOne = 0
    let readyFrameTwo = 0
    let started = false

    const readyTimeout = window.setTimeout(() => {
      isRendering = false
    }, 1000)

    const mountScene = () => {
      if (started) return
      started = true
      sceneMounted = true
      readyFrameOne = requestAnimationFrame(() => {
        readyFrameTwo = requestAnimationFrame(() => {
          isRendering = false
          window.clearTimeout(readyTimeout)
        })
      })
    }

    const mountTimeout = window.setTimeout(mountScene, 100)
    firstFrame = requestAnimationFrame(() => {
      mountFrame = requestAnimationFrame(mountScene)
    })

    return () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(mountFrame)
      cancelAnimationFrame(readyFrameOne)
      cancelAnimationFrame(readyFrameTwo)
      window.clearTimeout(mountTimeout)
      window.clearTimeout(readyTimeout)
    }
  })
</script>

<div class="render-viewport">
  {#if sceneMounted}
    {@render children()}
  {/if}
  {#if isRendering}
    <div class="rendering-overlay" role="status" aria-live="polite">
      <span class="rendering-spinner" aria-hidden="true"></span>
      <p>Rendering {title}...</p>
    </div>
  {/if}
</div>

<style>
  .render-viewport {
    position: absolute;
    inset: 0;
  }

  .rendering-overlay {
    position: absolute;
    z-index: 2;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.9rem;
    background: #01040b;
    color: #dbe9f7;
    pointer-events: none;
  }

  .rendering-overlay p {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 600;
  }

  .rendering-spinner {
    width: 1.5rem;
    aspect-ratio: 1;
    border: 2px solid rgba(142, 180, 221, 0.35);
    border-top-color: #8eb4dd;
    border-radius: 50%;
    animation: rendering-spin 800ms linear infinite;
  }

  @keyframes rendering-spin {
    to {
      transform: rotate(1turn);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .rendering-spinner {
      animation-duration: 2.4s;
    }
  }
</style>