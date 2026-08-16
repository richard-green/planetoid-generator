<script lang="ts">
  import GasGiantView from './pages/GasGiantView.svelte'
  import PlanetoidView from './pages/PlanetoidView.svelte'
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

  migrateLegacyPathRoute()
  handleHashChange()
</script>

<svelte:window onhashchange={handleHashChange} />

<div class="app-shell">
  <main>
    {#if activeRoute}
      <activeRoute.component />
    {/if}
  </main>
</div>

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
</style>
