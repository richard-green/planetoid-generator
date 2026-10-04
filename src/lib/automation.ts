import { tick } from 'svelte'
import type { CameraView } from './utils/cameraView'

export type SettingsAutomationHook = (overrides: Record<string, unknown>) => Promise<void>
export type CameraAutomationHook = (view: CameraView) => Promise<void>

declare global {
  interface Window {
    /** Set only when the page is loaded with `?automation=1` (used by the CLI scripts). */
    __applySettings?: SettingsAutomationHook
    __setCameraView?: CameraAutomationHook
  }
}

/**
 * Exposes `window.__applySettings` / `window.__setCameraView` so scripts can apply every
 * override in one state update. Call from an `$effect`; returns the cleanup.
 */
export function registerSettingsAutomation(
  apply: (overrides: Record<string, unknown>) => void,
  setCameraView: (view: CameraView) => void
) {
  if (new URLSearchParams(window.location.search).get('automation') !== '1') return

  const settingsHook: SettingsAutomationHook = async (overrides) => {
    apply(overrides)
    await tick()
  }
  const cameraHook: CameraAutomationHook = async (view) => {
    await tick()
    setCameraView(view)
  }
  window.__applySettings = settingsHook
  window.__setCameraView = cameraHook

  return () => {
    if (window.__applySettings === settingsHook) delete window.__applySettings
    if (window.__setCameraView === cameraHook) delete window.__setCameraView
  }
}
