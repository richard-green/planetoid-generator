<script lang="ts">
  import type { Snippet } from 'svelte'

  type Props = {
    title: string
    open: boolean
    enabled?: boolean
    children: Snippet
  }

  let { title, open = $bindable(), enabled = $bindable(), children }: Props = $props()

  const hasToggle = $derived(enabled !== undefined)

  function onSummaryClick(event: MouseEvent) {
    if (hasToggle && !enabled) event.preventDefault()
  }
</script>

<details class="control-section" bind:open>
  <summary class:summary-with-toggle={hasToggle} onclick={onSummaryClick}>
    <span class="summary-main">
      <span class="summary-chevron" aria-hidden="true"></span>
      <span class="summary-title">{title}</span>
    </span>
    {#if hasToggle}
      <label class="summary-toggle">
        <input
          type="checkbox"
          bind:checked={enabled}
          aria-label={`Enable ${title}`}
          onclick={(event) => event.stopPropagation()}
        />
      </label>
    {/if}
  </summary>
  <div class="control-content">
    {@render children()}
  </div>
</details>

<style>
  .control-section {
    border: 1px solid rgba(142, 180, 221, 0.18);
    border-radius: 10px;
    padding: 0.35rem 0.75rem;
    background: rgba(7, 14, 28, 0.55);
  }

  summary {
    cursor: pointer;
    list-style: none;
    display: inline-flex;
    width: 100%;
    box-sizing: border-box;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: #f0f6ff;
    margin: 0;
  }

  .control-content {
    margin-top: 0.6rem;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  .summary-with-toggle {
    display: flex;
    gap: 0.5rem;
  }

  .summary-main {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    flex: 1 1 auto;
    min-width: 0;
  }

  .summary-chevron {
    width: 1rem;
    height: 1rem;
    display: inline-grid;
    place-items: center;
    opacity: 0.82;
    transform: rotate(0deg);
    transition: transform 140ms ease;
    transform-origin: 50% 50%;
    flex: 0 0 auto;
  }

  .summary-chevron::before {
    content: '';
    width: 0.45rem;
    height: 0.6rem;
    background: #f0f6ff;
    clip-path: polygon(0 0, 100% 50%, 0 100%);
  }

  .summary-title {
    transform: translateY(-1px);
  }

  .control-section[open] .summary-chevron {
    transform: rotate(90deg);
  }

  .summary-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
  }

  .summary-toggle input {
    width: 1rem;
    height: 1rem;
    padding: 0;
  }
</style>
