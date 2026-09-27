<script lang="ts">
  let { error }: { error: unknown } = $props()

  const description = $derived(error instanceof Error ? error.message : String(error))
</script>

<div class="webgl-failure" role="img" aria-label={`WebGL viewport failed: ${description}`}>
  <span class="webgl-failure-cross" aria-hidden="true"></span>
</div>

<style>
  .webgl-failure {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: #01040b;
    pointer-events: none;
  }

  .webgl-failure-cross {
    position: relative;
    width: min(58%, 20rem);
    aspect-ratio: 1;
  }

  .webgl-failure-cross::before,
  .webgl-failure-cross::after {
    content: '';
    position: absolute;
    top: 47%;
    left: 0;
    width: 100%;
    height: 6%;
    border-radius: 999px;
    background: #ff3947;
    box-shadow: 0 0 24px rgba(255, 57, 71, 0.55);
  }

  .webgl-failure-cross::before {
    transform: rotate(45deg);
  }

  .webgl-failure-cross::after {
    transform: rotate(-45deg);
  }
</style>
