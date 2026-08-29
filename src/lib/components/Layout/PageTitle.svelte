<script lang="ts">
  export type PageTitleLink = {
    href: string
    label: string
    target?: '_self' | '_blank' | '_parent' | '_top'
    rel?: string
    ariaLabel?: string
    title?: string
    className?: string
  }

  type Props = {
    title: string
    links?: PageTitleLink[]
    onOpenWelcome?: () => void
  }

  let { title, links = [], onOpenWelcome = () => {} }: Props = $props()

  const getLinkRel = (link: PageTitleLink): string | undefined => {
    if (link.rel) {
      return link.rel
    }

    return link.target === '_blank' ? 'noopener noreferrer' : undefined
  }
</script>

<h1 class="page-title">
  <span>{title}</span>
  <div class="page-title-actions">
    {#each links as link (link.href + link.label)}
      <a
        class={link.className ?? 'page-title-link'}
        href={link.href}
        target={link.target}
        rel={getLinkRel(link)}
        aria-label={link.ariaLabel}
        title={link.title}
      >
        {link.label}
      </a>
    {/each}
    <button
      type="button"
      class="page-title-help-button"
      onclick={onOpenWelcome}
      aria-label="Open welcome message"
      title="Open welcome message"
    >
      ?
    </button>
    <a
      class="page-title-github-link"
      href="https://github.com/richard-green/planetoid-generator"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open GitHub repository"
      title="View source on GitHub"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M12 0.5c-6.35 0-11.5 5.15-11.5 11.5 0 5.08 3.29 9.39 7.86 10.91 0.58 0.11 0.79-0.25 0.79-0.56 0-0.28-0.01-1.02-0.02-2-3.2 0.7-3.88-1.54-3.88-1.54-0.52-1.33-1.28-1.68-1.28-1.68-1.04-0.71 0.08-0.7 0.08-0.7 1.15 0.08 1.76 1.18 1.76 1.18 1.02 1.76 2.68 1.25 3.33 0.96 0.1-0.74 0.4-1.25 0.73-1.54-2.55-0.29-5.24-1.27-5.24-5.65 0-1.25 0.45-2.28 1.18-3.08-0.12-0.29-0.51-1.46 0.11-3.05 0 0 0.97-0.31 3.17 1.18 0.92-0.26 1.9-0.38 2.88-0.38 0.98 0 1.96 0.13 2.88 0.38 2.2-1.49 3.17-1.18 3.17-1.18 0.63 1.59 0.23 2.76 0.11 3.05 0.73 0.8 1.18 1.83 1.18 3.08 0 4.39-2.69 5.36-5.25 5.64 0.41 0.35 0.77 1.04 0.77 2.1 0 1.52-0.01 2.74-0.01 3.11 0 0.31 0.21 0.68 0.8 0.56 4.56-1.53 7.85-5.84 7.85-10.91 0-6.35-5.15-11.5-11.5-11.5z"
        ></path>
      </svg>
    </a>
  </div>
</h1>

<style>
  .page-title {
    margin: 0;
    padding: 1.1rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.8rem;
    color: #f2f8ff;
    font-size: clamp(1.2rem, 2vw, 1.9rem);
    font-weight: 760;
    letter-spacing: 0.03em;
    line-height: 1.1;
    text-transform: uppercase;
    border-top: 1px solid rgba(176, 208, 239, 0.35);
    border-bottom: 1px solid rgba(176, 208, 239, 0.26);
    background:
      radial-gradient(circle at 0% 20%, rgba(42, 104, 166, 0.35), transparent 55%),
      linear-gradient(120deg, #1b325d, #122443), rgba(6, 13, 28, 0.72);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.06),
      0 8px 26px rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(4px);
  }

  .page-title-actions {
    display: flex;
    align-items: center;
    gap: 0.55rem;
  }

  .page-title-link {
    border: 1px solid rgba(176, 208, 239, 0.45);
    border-radius: 999px;
    color: #eaf3ff;
    background: rgba(5, 14, 30, 0.55);
    padding: 0.4rem 0.8rem;
    text-decoration: none;
    font-size: 0.72rem;
    letter-spacing: 0.07em;
    transition:
      transform 120ms ease,
      border-color 120ms ease,
      background-color 120ms ease;
  }

  .page-title-link:hover {
    border-color: rgba(222, 238, 255, 0.85);
    background: rgba(10, 24, 49, 0.82);
  }

  .page-title-link:focus-visible {
    outline: 2px solid #6cb3ff;
    outline-offset: 2px;
  }

  .page-title-github-link {
    width: 2rem;
    height: 2rem;
    min-width: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(176, 208, 239, 0.45);
    border-radius: 999px;
    color: #eaf3ff;
    background: rgba(5, 14, 30, 0.55);
    transition:
      transform 120ms ease,
      border-color 120ms ease,
      background-color 120ms ease;
  }

  .page-title-github-link:hover {
    border-color: rgba(222, 238, 255, 0.85);
    background: rgba(10, 24, 49, 0.82);
  }

  .page-title-github-link:focus-visible {
    outline: 2px solid #6cb3ff;
    outline-offset: 2px;
  }

  .page-title-help-button {
    width: 2rem;
    height: 2rem;
    min-width: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(176, 208, 239, 0.45);
    border-radius: 999px;
    color: #eaf3ff;
    background: rgba(5, 14, 30, 0.55);
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    transition:
      transform 120ms ease,
      border-color 120ms ease,
      background-color 120ms ease;
  }

  .page-title-help-button:hover {
    border-color: rgba(222, 238, 255, 0.85);
    background: rgba(10, 24, 49, 0.82);
  }

  .page-title-help-button:focus-visible {
    outline: 2px solid #6cb3ff;
    outline-offset: 2px;
  }

  @media (max-width: 900px) {
    .page-title {
      flex-wrap: wrap;
      gap: 0.6rem;
      padding: 0.95rem 1rem;
    }

    .page-title-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
</style>
