<script lang="ts" generics="T extends string">
  import { getPalettePosition, type Palette, type PaletteColor } from '../../types/palette'
  import { replacePalette } from '../../types/paletteState.svelte'

  type UnitColor = readonly [number, number, number]
  type DisplayColor = PaletteColor | UnitColor
  type EditableStop = PaletteColor & { editorId: number }

  type Props = {
    id: string
    title?: string
    value: T
    options: readonly T[]
    palettes: Record<T, readonly DisplayColor[]>
  }

  let { id, title = 'Palette', value = $bindable(), options, palettes }: Props = $props()
  let dialog: HTMLDialogElement | undefined = $state(undefined)
  let draft = $state<EditableStop[]>([])
  let originalPalette: Palette = []
  let paletteRevision = $state(0)
  let nextEditorId = 0
  let copyStatus = $state('')

  function toRgb(color: DisplayColor) {
    if (!Array.isArray(color)) {
      return `rgb(${color.r}, ${color.g}, ${color.b})`
    }

    const [red, green, blue] = color.map((channel) => Math.round(channel * 255))
    return `rgb(${red}, ${green}, ${blue})`
  }

  const gradient = $derived.by(() => {
    paletteRevision
    const stops = palettes[value]
    const colors = stops.map(
      (color, index) => `${toRgb(color)} ${(getDisplayPosition(stops, index) * 100).toFixed(2)}%`
    )

    return `linear-gradient(90deg, ${colors.join(', ')})`
  })

  const editable = $derived(palettes[value].every((color) => !Array.isArray(color)))
  const sortedDraft = $derived(
    [...draft].sort((left, right) => (left.position ?? 0) - (right.position ?? 0))
  )
  const draftGradient = $derived(
    `linear-gradient(90deg, ${sortedDraft
      .map(
        (color, index) =>
          `${toRgb(color)} ${(getPalettePosition(sortedDraft, index) * 100).toFixed(2)}%`
      )
      .join(', ')})`
  )

  function getDisplayPosition(colors: readonly DisplayColor[], index: number) {
    const color = colors[index]
    if (color && !Array.isArray(color)) {
      return getPalettePosition(colors as readonly PaletteColor[], index)
    }
    return colors.length > 1 ? index / (colors.length - 1) : 0
  }

  function toHex(color: PaletteColor) {
    return `#${[color.r, color.g, color.b]
      .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
      .join('')}`
  }

  function fromHex(value: string) {
    return {
      r: Number.parseInt(value.slice(1, 3), 16),
      g: Number.parseInt(value.slice(3, 5), 16),
      b: Number.parseInt(value.slice(5, 7), 16),
    }
  }

  function openEditor() {
    const palette = palettes[value] as readonly PaletteColor[]
    copyStatus = ''
    originalPalette = palette.map((color) => ({ ...color }))
    draft = palette.map((color, index) => ({
      r: color.r,
      g: color.g,
      b: color.b,
      position: getPalettePosition(palette, index),
      editorId: nextEditorId++,
    }))
    dialog?.showModal()
  }

  function updateColor(index: number, value: string) {
    copyStatus = ''
    draft[index] = { ...draft[index], ...fromHex(value) }
  }

  function updatePosition(index: number, value: number) {
    copyStatus = ''
    draft[index] = { ...draft[index], position: Math.min(1, Math.max(0, value / 100)) }
  }

  function addStop() {
    if (draft.length >= 16) return
    copyStatus = ''
    const previous = draft.at(-2) ?? draft[0] ?? { r: 255, g: 255, b: 255, position: 0 }
    const last = draft.at(-1) ?? previous
    draft = [
      ...draft,
      {
        r: Math.round((previous.r + last.r) / 2),
        g: Math.round((previous.g + last.g) / 2),
        b: Math.round((previous.b + last.b) / 2),
        position: ((previous.position ?? 0) + (last.position ?? 1)) / 2,
        editorId: nextEditorId++,
      },
    ]
    applyDraft()
  }

  function removeStop(index: number) {
    if (draft.length <= 2) return
    copyStatus = ''
    draft = draft.filter((_, stopIndex) => stopIndex !== index)
    applyDraft()
  }

  function getDraftPalette(): Palette {
    return [...draft]
      .sort((left, right) => (left.position ?? 0) - (right.position ?? 0))
      .map(({ r, g, b, position }) => ({ r, g, b, position }))
  }

  function applyDraft() {
    replacePalette(palettes[value] as Palette, getDraftPalette())
    paletteRevision += 1
  }

  async function copyPaletteJson() {
    const json = JSON.stringify(getDraftPalette(), null, 2)

    try {
      await navigator.clipboard.writeText(json)
      copyStatus = 'Copied JSON'
    } catch {
      window.prompt('Copy palette JSON:', json)
      copyStatus = ''
    }
  }

  function finishEditing() {
    applyDraft()
    originalPalette = []
    dialog?.close()
  }

  function cancelEditing() {
    replacePalette(
      palettes[value] as Palette,
      originalPalette.map((color) => ({ ...color }))
    )
    paletteRevision += 1
    originalPalette = []
    dialog?.close()
  }
</script>

<div class="palette-picker">
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
  {#if editable}
    <button class="edit-button" type="button" onclick={openEditor}>Edit palette</button>
  {/if}
</div>

<dialog
  bind:this={dialog}
  aria-labelledby={`${id}-editor-title`}
  oncancel={(event) => {
    event.preventDefault()
    cancelEditing()
  }}
>
  <form method="dialog" onsubmit={(event) => event.preventDefault()}>
    <header>
      <h2 id={`${id}-editor-title`}>Edit {title.toLowerCase()}</h2>
      <button class="icon-button" type="button" aria-label="Close" onclick={cancelEditing}>
        &times;
      </button>
    </header>

    <div class="editor-preview" style:background={draftGradient}></div>

    <div class="stop-list">
      {#each draft as stop, index (stop.editorId)}
        <div class="stop-row">
          <input
            class="stop-color"
            type="color"
            value={toHex(stop)}
            aria-label={`Stop ${index + 1} color`}
            oninput={(event) => updateColor(index, event.currentTarget.value)}
            onchange={applyDraft}
          />
          <input
            class="stop-position"
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round((stop.position ?? 0) * 100)}
            aria-label={`Stop ${index + 1} position`}
            oninput={(event) => updatePosition(index, event.currentTarget.valueAsNumber)}
            onchange={applyDraft}
          />
          <output>{Math.round((stop.position ?? 0) * 100)}%</output>
          <button
            class="icon-button"
            type="button"
            aria-label={`Remove stop ${index + 1}`}
            disabled={draft.length <= 2}
            onclick={() => removeStop(index)}>&times;</button
          >
        </div>
      {/each}
    </div>

    <footer>
      <button type="button" disabled={draft.length >= 16} onclick={addStop}>Add stop</button>
      <button type="button" onclick={copyPaletteJson}>Copy JSON</button>
      <span class="copy-status" role="status">{copyStatus}</span>
      <span class="footer-spacer"></span>
      <button type="button" onclick={cancelEditing}>Cancel</button>
      <button class="primary-button" type="button" onclick={finishEditing}>Done</button>
    </footer>
  </form>
</dialog>

<style>
  .palette-picker,
  label {
    display: grid;
    gap: 0.35rem;
  }

  .palette-picker {
    margin-bottom: 0.75rem;
  }

  label {
    font-size: 0.88rem;
  }

  .palette-preview {
    width: 100%;
    height: 2rem;
    border-radius: 10px;
    border: 1px solid #8eb4dd;
    box-shadow:
      inset 0 0 0 1px rgba(4, 10, 20, 0.25),
      0 4px 14px rgba(0, 0, 0, 0.2);
    margin-top: 0.5rem;
  }

  .edit-button {
    justify-self: end;
  }

  dialog {
    width: min(36rem, calc(100vw - 2rem));
    max-height: calc(100vh - 2rem);
    padding: 0;
    color: #e8f2ff;
    background: #101a29;
    border: 1px solid #8eb4dd;
    border-radius: 8px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
  }

  dialog::backdrop {
    background: rgba(2, 6, 12, 0.72);
  }

  form {
    display: grid;
    gap: 1rem;
    padding: 1rem;
  }

  header,
  footer,
  .stop-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  footer {
    flex-wrap: wrap;
  }

  h2 {
    flex: 1;
    margin: 0;
    font-size: 1.1rem;
  }

  .editor-preview {
    height: 3rem;
    border: 1px solid #8eb4dd;
    border-radius: 6px;
  }

  .stop-list {
    display: grid;
    gap: 0.55rem;
    overflow-y: auto;
  }

  .stop-color {
    width: 2.5rem;
    height: 2rem;
    padding: 0;
    border: 0;
    background: transparent;
  }

  .stop-position {
    flex: 1;
    min-width: 6rem;
  }

  output {
    width: 3rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  button {
    min-height: 2rem;
  }

  .icon-button {
    width: 2rem;
    padding: 0;
    font-size: 1.25rem;
    line-height: 1;
  }

  .footer-spacer {
    flex: 1;
  }

  .copy-status {
    color: #a9d4ff;
    font-size: 0.8rem;
  }

  .primary-button {
    font-weight: 700;
  }
</style>
