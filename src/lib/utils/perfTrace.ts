// Enable with `?trace` in the URL (before the #) or localStorage 'perf-trace' = '1'.
export const tracingEnabled = (() => {
  try {
    return (
      new URLSearchParams(window.location.search).has('trace') ||
      localStorage.getItem('perf-trace') === '1'
    )
  } catch {
    return false
  }
})()

const runCounts = new Map<string, number>()

export function traceSpan<T>(name: string, fn: () => T, detail?: Record<string, unknown>): T {
  if (!tracingEnabled) return fn()

  const run = (runCounts.get(name) ?? 0) + 1
  runCounts.set(name, run)
  const start = performance.now()

  try {
    return fn()
  } finally {
    const duration = performance.now() - start
    performance.measure(`trace:${name}`, { start, duration, detail })
    console.debug(`[trace] ${name} #${run}: ${duration.toFixed(1)} ms`, detail ?? '')
  }
}

export function createFrameMonitor(label: string, intervalMs = 2000) {
  let frames = 0
  let total = 0
  let worst = 0
  let windowStart = performance.now()

  return (deltaSeconds: number, extra?: () => Record<string, unknown>) => {
    if (!tracingEnabled) return

    const ms = deltaSeconds * 1000
    frames++
    total += ms
    worst = Math.max(worst, ms)

    const now = performance.now()
    if (now - windowStart < intervalMs) return

    const avg = total / frames
    console.debug(
      `[trace] ${label} frames: ${frames} | avg ${avg.toFixed(1)} ms (${(1000 / avg).toFixed(0)} fps) | worst ${worst.toFixed(1)} ms`,
      extra?.() ?? ''
    )

    frames = 0
    total = 0
    worst = 0
    windowStart = now
  }
}
