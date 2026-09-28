<script lang="ts">
  let { error }: { error: unknown } = $props()

  const title = $derived(error instanceof Error ? error.name : 'Error')
  const description = $derived(error instanceof Error ? error.message : String(error))
</script>

<div class="webgl-failure" role="alert">
  <span class="webgl-failure-cross" aria-hidden="true"></span>
  <div class="webgl-failure-details">
    <p class="webgl-failure-title">WebGL viewport failed: {title}</p>
    <p class="webgl-failure-message">{description}</p>
  </div>
</div>

<style>
  .webgl-failure {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    padding: 1.5rem;
    background: #01040b;
    pointer-events: none;
  }

  .webgl-failure-details {
    max-width: min(90%, 36rem);
    max-height: 40%;
    overflow: auto;
    text-align: center;
    color: #dbe9f7;
    pointer-events: auto;
    user-select: text;
  }

  .webgl-failure-title {
    margin: 0 0 0.4rem;
    font-weight: 600;
    color: #ff8a93;
  }

  .webgl-failure-message {
    margin: 0;
    font-family: ui-monospace, Consolas, monospace;
    font-size: 0.85rem;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
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
