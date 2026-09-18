<script lang="ts">
  type Props = {
    id: string
    value: number
    min: number
    max: number
    step?: number
    label?: string
  }

  let { id, value = $bindable(), min, max, step = 1, label = 'Seed' }: Props = $props()

  function randomizeSeed() {
    value = Math.floor(Math.random() * (max - min + 1)) + min
  }
</script>

<div class="seed-control">
  <label for={id}>{label}</label>
  <div class="seed-input-group">
    <input {id} type="number" {min} {max} {step} bind:value />
    <button
      type="button"
      onclick={randomizeSeed}
      aria-label="Pick a random seed"
      title="Random seed"
    >
      🎲
    </button>
  </div>
</div>

<style>
  .seed-control {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    column-gap: 0.75rem;
    font-size: 0.88rem;
  }

  .seed-input-group {
    display: flex;
    gap: 0.35rem;
  }

  input {
    width: 6.5rem;
    min-width: 0;
    text-align: left;
    font-variant-numeric: tabular-nums;
    padding-right: 0.25rem;
  }

  button {
    width: 2.1rem;
    height: 2.1rem;
    padding: 0;
    display: inline-grid;
    place-items: center;
    cursor: pointer;
    line-height: 1;
  }

  button:focus-visible {
    outline: 2px solid rgba(127, 203, 255, 0.95);
    outline-offset: 1px;
  }
</style>
