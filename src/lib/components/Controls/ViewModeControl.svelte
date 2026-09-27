<script lang="ts" generics="TViewMode extends string">
  import CollapsibleControl from './CollapsibleControl.svelte'

  type Props = {
    title: string
    open: boolean
    name: string
    value: TViewMode
    options: { value: TViewMode; label: string }[]
  }

  let { title, open = $bindable(), name, value = $bindable(), options }: Props = $props()
</script>

<CollapsibleControl {title} bind:open>
  <div class="view-mode-group" role="radiogroup" aria-label="Scene view mode">
    {#each options as option (option.value)}
      <label class="radio-row">
        <input type="radio" {name} value={option.value} bind:group={value} />
        <span>{option.label}</span>
      </label>
    {/each}
  </div>
</CollapsibleControl>

<style>
  .view-mode-group {
    display: grid;
    gap: 0.3rem;
  }

  .radio-row {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    justify-items: start;
    column-gap: 0.45rem;
    font-size: 0.85rem;
  }

  .radio-row input[type='radio'] {
    width: 1rem;
    height: 1rem;
    margin: 0;
    padding: 0;
    flex: 0 0 auto;
  }
</style>
