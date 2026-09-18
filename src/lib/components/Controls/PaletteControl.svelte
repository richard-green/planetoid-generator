<script lang="ts" generics="T extends string">
  type ByteColor = { r: number; g: number; b: number }
  type UnitColor = readonly [number, number, number]
  type PaletteColor = ByteColor | UnitColor

  type Props = {
    id: string
    title?: string
    value: T
    options: readonly T[]
    palettes: Record<T, readonly PaletteColor[]>
  }

  let { id, title = 'Palette', value = $bindable(), options, palettes }: Props = $props()

  function toRgb(color: PaletteColor) {
    if ('r' in color) {
      return `rgb(${color.r}, ${color.g}, ${color.b})`
    }

    const [red, green, blue] = color.map((channel) => Math.round(channel * 255))
    return `rgb(${red}, ${green}, ${blue})`
  }

  const gradient = $derived.by(() => {
    const stops = palettes[value]
    const lastIndex = Math.max(1, stops.length - 1)
    const colors = stops.map(
      (color, index) => `${toRgb(color)} ${((index / lastIndex) * 100).toFixed(2)}%`
    )

    return `linear-gradient(90deg, ${colors.join(', ')})`
  })
</script>

<div class="palette-control">
  <label for={id}>
    <span>{title}</span>
    <select {id} bind:value>
      {#each options as option (option)}
        <option value={option}>{option}</option>
      {/each}
    </select>
  </label>
  <div
    class="palette-preview"
    style:background={gradient}
    role="img"
    aria-label={`${title} gradient preview`}
  ></div>
</div>

<style>
  .palette-control,
  label {
    display: grid;
    gap: 0.35rem;
  }

  label {
    font-size: 0.88rem;
  }

  .palette-preview {
    width: 100%;
    height: 2rem;
    margin: 0.35rem 0;
    border-radius: 10px;
    border: 1px solid #8eb4dd;
    box-shadow:
      inset 0 0 0 1px rgba(4, 10, 20, 0.25),
      0 4px 14px rgba(0, 0, 0, 0.2);
  }
</style>
