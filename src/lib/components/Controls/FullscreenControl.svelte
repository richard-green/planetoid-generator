<script lang="ts">
  type Props = {
    target?: HTMLElement
  }

  let { target }: Props = $props()
  let isFullscreen = $state(false)

  $effect(() => {
    function syncFullscreenState() {
      isFullscreen = document.fullscreenElement === target
    }

    document.addEventListener('fullscreenchange', syncFullscreenState)
    syncFullscreenState()

    return () => document.removeEventListener('fullscreenchange', syncFullscreenState)
  })

  async function toggleFullscreen() {
    if (!target) return

    try {
      if (document.fullscreenElement === target) {
        await document.exitFullscreen()
      } else {
        await target.requestFullscreen()
      }
    } catch (error) {
      console.warn('Fullscreen request failed', error)
    }
  }
</script>

<button
  class="fullscreen-toggle"
  type="button"
  onclick={toggleFullscreen}
  aria-label={isFullscreen ? 'Exit fullscreen' : 'Expand scene to fullscreen'}
  title={isFullscreen ? 'Exit fullscreen' : 'Expand scene to fullscreen'}
>
  {isFullscreen ? '×' : '⛶'}
</button>

<style>
  .fullscreen-toggle {
    position: absolute;
    top: 0.6rem;
    right: 0.6rem;
    z-index: 2;
    width: 2rem;
    height: 2rem;
    display: grid;
    place-items: center;
    padding: 0;
    font-size: 1rem;
    line-height: 1;
    color: #d7e4f4;
    background: rgba(5, 12, 25, 0.45);
    border: 1px solid transparent;
    border-radius: 8px;
    cursor: pointer;
  }

  .fullscreen-toggle:hover {
    color: #ffffff;
    background: rgba(18, 40, 70, 0.8);
    border-color: rgba(142, 180, 221, 0.45);
  }

  .fullscreen-toggle:focus-visible {
    outline: 2px solid #6cb3ff;
    outline-offset: 2px;
  }
</style>
