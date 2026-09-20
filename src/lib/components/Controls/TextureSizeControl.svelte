<script lang="ts">
  import { TextureSizes, type TextureSize } from '../../types/textureSize'

  type Props = {
    id: string
    label: string
    value: TextureSize
  }

  let { id, label, value = $bindable() }: Props = $props()
</script>

<label class="compact-number-row" for={id}>
  <span>{label}</span>
  <select {id} bind:value>
    {#each TextureSizes as size (size)}
      <option value={size}>{size}</option>
    {/each}
  </select>
</label>
