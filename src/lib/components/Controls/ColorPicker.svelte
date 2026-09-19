<script lang="ts">
  type Props = {
    id: string
    label: string
    value: string
  }

  let { id, label, value = $bindable() }: Props = $props()
</script>

<label class="color-picker" for={id}>
  <span>{label}</span>
  <span class="color-picker-swatch" style={`background-color: ${value}`}>
    <span class="color-picker-value">{value.toUpperCase()}</span>
    <input {id} type="color" bind:value />
  </span>
</label>

<style>
  .color-picker {
    display: grid;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
    font-size: 0.88rem;
  }

  .color-picker-swatch {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 2rem;
    border: 1px solid #8eb4dd;
    border-radius: 10px;
    cursor: pointer;
    overflow: hidden;
  }

  .color-picker-value {
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
    font-weight: 600;
    color: #f0f6ff;
    text-shadow:
      0 1px 2px rgba(0, 0, 0, 0.9),
      0 0 6px rgba(0, 0, 0, 0.7);
    pointer-events: none;
  }

  /* hide the native square swatch; the rounded box background shows the color instead */
  .color-picker-swatch input[type='color'] {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    border: none;
    padding: 0;
    cursor: pointer;
  }
</style>
