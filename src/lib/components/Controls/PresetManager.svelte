<script lang="ts">
  export type PresetListItem = {
    id: string
    name: string
  }

  type Props = {
    title?: string
    builtInPresets: PresetListItem[]
    userPresets: PresetListItem[]
    emptyText?: string
    onClose: () => void
    onApplyPreset: (preset: PresetListItem) => void
    onExportPreset: (preset: PresetListItem) => void
    onDeleteUserPreset: (preset: PresetListItem) => void
  }

  let {
    title = 'Manage Presets',
    builtInPresets,
    userPresets,
    emptyText = 'No saved presets yet.',
    onClose,
    onApplyPreset,
    onExportPreset,
    onDeleteUserPreset,
  }: Props = $props()
</script>

<div class="preset-manager-backdrop" role="dialog" aria-modal="true" aria-label="Preset manager">
  <section class="preset-manager-panel">
    <header class="preset-manager-header">
      <h2>{title}</h2>
      <button type="button" class="close-manager-button" onclick={onClose}>Close</button>
    </header>

    <div class="preset-group">
      <h3>Preconfigured</h3>
      <ul class="preset-list">
        {#each builtInPresets as preset (preset.id)}
          <li class="preset-row">
            <span>{preset.name}</span>
            <div class="preset-row-actions">
              <button type="button" class="preset-row-button" onclick={() => onApplyPreset(preset)}>
                Apply
              </button>
              <button
                type="button"
                class="preset-row-button"
                onclick={() => onExportPreset(preset)}
              >
                CLI
              </button>
            </div>
          </li>
        {/each}
      </ul>
    </div>

    <div class="preset-group">
      <h3>Saved</h3>
      {#if userPresets.length === 0}
        <p class="preset-empty">{emptyText}</p>
      {:else}
        <ul class="preset-list">
          {#each userPresets as preset (preset.id)}
            <li class="preset-row">
              <span>{preset.name}</span>
              <div class="preset-row-actions">
                <button
                  type="button"
                  class="preset-row-button"
                  onclick={() => onApplyPreset(preset)}
                >
                  Apply
                </button>
                <button
                  type="button"
                  class="preset-row-button"
                  onclick={() => onExportPreset(preset)}
                >
                  CLI
                </button>
                <button
                  type="button"
                  class="preset-row-button delete"
                  onclick={() => onDeleteUserPreset(preset)}
                >
                  Delete
                </button>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </section>
</div>
