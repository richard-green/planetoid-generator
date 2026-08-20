<script lang="ts">
  import { marked } from 'marked'
  import GasGiantView from './pages/GasGiantView.svelte'
  import PlanetoidView from './pages/PlanetoidView.svelte'
  import welcomeMarkdown from './welcome.md?raw'
  import type { Component } from 'svelte'

  type Route = {
    name: string
    path: string
    component: Component
  }

  const routes: Route[] = [
    { name: 'Planetoids', path: '/planetoids', component: PlanetoidView },
    { name: 'Gas And Ice Giants', path: '/giants', component: GasGiantView },
  ]

  const fallbackPath = routes[0]?.path ?? '/'
  const WELCOME_SEEN_STORAGE_KEY = 'planetoid-generator-welcome-seen-v1'

  const welcomeHtml = marked.parse(welcomeMarkdown)
  let showWelcomeDialog = $state(false)
  let welcomeStateInitialized = $state(false)
  let currentPath = $state<string>(normalizePath(getHashPath(window.location.hash)))

  let activeRoute = $derived(
    routes.find((route) => route.path === currentPath) ??
      routes.find((route) => route.path === fallbackPath)
  )

  function normalizePath(pathname: string): string {
    if (!pathname || pathname === '/' || pathname === '#/') {
      return fallbackPath
    }

    return pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname
  }

  function getHashPath(hashValue: string): string {
    if (!hashValue || hashValue === '#') {
      return fallbackPath
    }

    const trimmed = hashValue.startsWith('#') ? hashValue.slice(1) : hashValue
    if (!trimmed) {
      return fallbackPath
    }

    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    return normalizePath(path)
  }

  function setHashPath(path: string, replace = false): void {
    const normalized = normalizePath(path)
    const targetHash = `#${normalized}`

    if (window.location.hash === targetHash) {
      return
    }

    if (replace) {
      const base = `${window.location.pathname}${window.location.search}`
      window.history.replaceState({}, '', `${base}${targetHash}`)
      return
    }

    window.location.hash = normalized
  }

  function isRoutePath(path: string): boolean {
    return routes.some((route) => route.path === path)
  }

  function handleHashChange(): void {
    const normalized = getHashPath(window.location.hash)

    if (isRoutePath(normalized)) {
      currentPath = normalized
      return
    }

    setHashPath(fallbackPath, true)
    currentPath = fallbackPath
  }

  function migrateLegacyPathRoute(): void {
    const normalizedPathname = normalizePath(window.location.pathname)

    if (window.location.hash || !isRoutePath(normalizedPathname)) {
      return
    }

    setHashPath(normalizedPathname, true)
  }

  function openWelcomeDialog(): void {
    showWelcomeDialog = true
  }

  function closeWelcomeDialog(markSeen = true): void {
    showWelcomeDialog = false

    if (!markSeen) {
      return
    }

    try {
      localStorage.setItem(WELCOME_SEEN_STORAGE_KEY, 'true')
    } catch (error) {
      console.warn('Failed to persist welcome dialog state', error)
    }
  }

  function onWelcomeDialogBackdropClick(event: MouseEvent): void {
    if (event.currentTarget !== event.target) {
      return
    }

    closeWelcomeDialog()
  }

  function onWelcomeDialogBackdropKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      closeWelcomeDialog()
      return
    }

    if (event.key === 'Enter' || event.key === ' ') {
      if (event.currentTarget === event.target) {
        event.preventDefault()
        closeWelcomeDialog()
      }
    }
  }

  $effect(() => {
    if (welcomeStateInitialized) {
      return
    }

    welcomeStateInitialized = true

    try {
      const seen = localStorage.getItem(WELCOME_SEEN_STORAGE_KEY) === 'true'
      showWelcomeDialog = !seen
    } catch (error) {
      console.warn('Failed to restore welcome dialog state', error)
      showWelcomeDialog = true
    }
  })

  migrateLegacyPathRoute()
  handleHashChange()
</script>

<svelte:window onhashchange={handleHashChange} />

<div class="app-shell">
  <main>
    {#if activeRoute}
      <activeRoute.component onOpenWelcome={openWelcomeDialog} />
    {/if}
  </main>
</div>

{#if showWelcomeDialog}
  <div
    class="welcome-dialog-backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="welcome-dialog-title"
    tabindex="-1"
    onclick={onWelcomeDialogBackdropClick}
    onkeydown={onWelcomeDialogBackdropKeydown}
  >
    <section class="welcome-dialog-panel">
      <header class="welcome-dialog-header">
        <h2 id="welcome-dialog-title">Welcome</h2>
        <button
          type="button"
          class="welcome-dialog-close"
          onclick={() => closeWelcomeDialog()}
          aria-label="Close welcome message"
        >
          Close
        </button>
      </header>
      <div class="welcome-dialog-content">{@html welcomeHtml}</div>
    </section>
  </div>
{/if}

<style>
  :global(body, html, #app) {
    margin: 0;
    padding: 0;
  }

  :global(body) {
    background: #f3f7fb;
    color: #0f172a;
    font-family:
      Segoe UI,
      Inter,
      system-ui,
      -apple-system,
      Roboto,
      Helvetica,
      Arial,
      sans-serif;
  }

  .app-shell {
    height: 100dvh;
    display: grid;
    grid-template-rows: 1fr;
  }

  main {
    min-height: 0;
    overflow-x: hidden;
    overflow-y: scroll;
    scrollbar-color: #174477 #020712;
    scrollbar-width: thin;
    scrollbar-gutter: stable;
  }

  .welcome-dialog-backdrop {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: rgba(2, 8, 20, 0.72);
    z-index: 1100;
  }

  .welcome-dialog-panel {
    width: min(680px, 100%);
    max-height: min(86vh, 760px);
    overflow: auto;
    border: 1px solid rgba(142, 180, 221, 0.5);
    border-radius: 14px;
    background: rgba(7, 14, 28, 0.98);
    color: #dbe9f7;
    box-shadow: 0 24px 50px rgba(0, 0, 0, 0.45);
  }

  .welcome-dialog-header {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin: 0;
    padding: 0.9rem 1rem;
    border-bottom: 1px solid rgba(142, 180, 221, 0.28);
    background: rgba(7, 14, 28, 0.96);
  }

  .welcome-dialog-header h2 {
    margin: 0;
    font-size: 1rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
  }

  .welcome-dialog-close {
    border: 1px solid rgba(176, 208, 239, 0.45);
    border-radius: 10px;
    padding: 0.45rem 0.68rem;
    background: rgba(10, 18, 34, 0.95);
    color: #f0f6ff;
    cursor: pointer;
  }

  .welcome-dialog-close:focus-visible {
    outline: 2px solid #6cb3ff;
    outline-offset: 2px;
  }

  .welcome-dialog-content {
    padding: 1rem;
    line-height: 1.5;
    font-size: 0.95rem;
  }

  .welcome-dialog-content :global(h1) {
    margin: 0 0 0.8rem;
    font-size: 1.4rem;
    line-height: 1.2;
    color: #f0f6ff;
  }

  .welcome-dialog-content :global(h2) {
    margin: 1.15rem 0 0.45rem;
    font-size: 1.05rem;
    color: #e8f2ff;
  }

  .welcome-dialog-content :global(p) {
    margin: 0.45rem 0;
  }

  .welcome-dialog-content :global(ul),
  .welcome-dialog-content :global(ol) {
    margin: 0.45rem 0;
    padding-left: 1.35rem;
  }

  .welcome-dialog-content :global(li) {
    margin: 0.2rem 0;
  }

  .welcome-dialog-content :global(code) {
    padding: 0.08rem 0.34rem;
    border-radius: 6px;
    background: rgba(28, 53, 95, 0.58);
    color: #f4f9ff;
  }
</style>
