<script lang="ts">
  type ExportMenuItem = {
    label: string
    onSelect: () => void | Promise<void>
  }

  type Props = {
    primaryAction: () => void | Promise<void>
    primaryAriaLabel: string
    disabled?: boolean
    menuItems?: readonly ExportMenuItem[]
  }

  let { primaryAction, primaryAriaLabel, disabled = false, menuItems = [] }: Props = $props()

  let menuOpen = $state(false)
  let menuElement: HTMLDetailsElement | undefined = $state(undefined)

  function closeMenuOnOutsidePointer(event: PointerEvent) {
    const target = event.target
    if (!menuOpen || !menuElement || !(target instanceof Node)) return
    if (!menuElement.contains(target)) menuOpen = false
  }

  async function selectMenuItem(item: ExportMenuItem) {
    menuOpen = false
    await item.onSelect()
  }
</script>

<svelte:window onpointerdown={closeMenuOnOutsidePointer} />

{#if menuItems.length > 0}
  <div class="export-split">
    <button
      type="button"
      class="action export-split-main"
      onclick={primaryAction}
      {disabled}
      aria-label={primaryAriaLabel}
      title={primaryAriaLabel}
    >
      Export
    </button>
    <details class="preset-menu export-split-menu" bind:this={menuElement} bind:open={menuOpen}>
      <summary
        class="action export-split-trigger"
        aria-label="More export options"
        title="More export options"
        aria-expanded={menuOpen}
      >
        <span class="export-split-chevron" aria-hidden="true"></span>
      </summary>
      <div
        class="preset-menu-dropdown export-menu-dropdown"
        role="menu"
        aria-label="Export options"
      >
        {#each menuItems as item (item.label)}
          <button
            type="button"
            class="preset-menu-item"
            role="menuitem"
            onclick={() => selectMenuItem(item)}
            {disabled}
          >
            {item.label}
          </button>
        {/each}
      </div>
    </details>
  </div>
{:else}
  <button
    type="button"
    class="action export-single-main"
    onclick={primaryAction}
    {disabled}
    aria-label={primaryAriaLabel}
    title={primaryAriaLabel}
  >
    Export
  </button>
{/if}

<style>
  .export-split {
    position: relative;
    display: inline-flex;
    align-items: stretch;
    height: 2.1rem;
    border-radius: 9px;
    box-shadow: 0 6px 14px rgba(2, 8, 16, 0.45);
  }

  .export-split-main,
  .export-single-main {
    box-sizing: border-box;
    min-width: 5rem;
    height: 2.1rem;
    border-color: rgba(112, 214, 255, 0.55);
    background:
      linear-gradient(180deg, rgba(37, 124, 156, 0.92) 0%, rgba(22, 70, 96, 0.96) 100%),
      radial-gradient(circle at 30% 20%, rgba(176, 239, 255, 0.22), transparent 58%);
  }

  .export-split-main {
    border-radius: 9px 0 0 9px;
  }

  .export-single-main {
    border-radius: 9px;
  }

  .export-split-menu {
    margin-left: 0;
  }

  .export-split-trigger {
    box-sizing: border-box;
    width: 2rem;
    min-width: 2rem;
    height: 2.1rem;
    padding: 0;
    border-radius: 0 9px 9px 0;
    border-left-color: rgba(15, 49, 65, 0.85);
    background:
      linear-gradient(180deg, rgba(37, 124, 156, 0.92) 0%, rgba(22, 70, 96, 0.96) 100%),
      radial-gradient(circle at 30% 20%, rgba(176, 239, 255, 0.22), transparent 58%);
  }

  .export-split-chevron {
    width: 0.42rem;
    height: 0.42rem;
    margin-top: -0.2rem;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: rotate(45deg);
  }

  .export-split-menu[open] .export-split-chevron {
    margin-top: 0.2rem;
    transform: rotate(225deg);
  }

  .export-menu-dropdown {
    width: 14.5rem;
  }
</style>
