/// <reference types="node" />

import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import type { Locator, Page } from 'playwright'
import { firefox } from 'playwright'
import {
  PlanetoidPaletteNames as VALID_PALETTES,
  type PlanetoidPaletteName as PaletteName,
} from '../src/lib/components/Threlte/Objects/PlanetoidPalettes'
import {
  MaxValues,
  MinValues,
  PlanetoidCliFlagByRangeKey,
  PlanetoidCliToggleFlags,
  PlanetoidRangeLabels,
  PlanetoidUiLabels,
  type PlanetoidRangeKey,
} from '../src/lib/components/Threlte/Objects/PlanetoidSettings'

const NUMERIC_RANGE_KEYS = (Object.keys(MinValues) as PlanetoidRangeKey[]).filter(
  (key) => key !== 'seed'
)

const CLI_FLAG_TO_RANGE_KEY = new Map<string, PlanetoidRangeKey>()
for (const key of NUMERIC_RANGE_KEYS) {
  CLI_FLAG_TO_RANGE_KEY.set(PlanetoidCliFlagByRangeKey[key], key)
}

const NUMERIC_HELP_LINES = NUMERIC_RANGE_KEYS.map((key) => {
  const flag = PlanetoidCliFlagByRangeKey[key]
  const label = PlanetoidRangeLabels[key]
  return `  ${flag} <n> ${label} (range: ${MinValues[key]} to ${MaxValues[key]})`
})

type ScriptOptions = {
  count: number
  startSeed: number
  step: number
  viewMode?: 'mesh' | 'bump' | 'texture' | 'ray'
  palette?: string
  surfaceTint?: string
  colorScale?: number
  tintShadowFloor?: number
  swirliness?: number
  craterCount?: number
  craterStrength?: number
  craterColorStrength?: number
  craterRayStrength?: number
  craterRayVisibility?: number
  craterRayDensity?: number
  craterRaySharpness?: number
  craterRayLengthPower?: number
  ridgeStrength?: number
  ridgeScale?: number
  ridgeSharpness?: number
  ridgeColorWeight?: number
  riftStrength?: number
  riftScale?: number
  riftWidth?: number
  riftSharpness?: number
  riftColorWeight?: number
  ridgesRiftsBlend?: number
  volcanoCount?: number
  volcanoScale?: number
  volcanoStrength?: number
  volcanoColorStrength?: number
  bumpTextureSize?: number
  colorTextureSize?: number
  largeScale?: number
  mediumScale?: number
  smallScale?: number
  bumpScale?: number
  roughness?: number
  metalness?: number
  triangleDetail?: number
  autoRotate?: boolean
  showDebugMeshes?: boolean
  cratersEnabled?: boolean
  ridgesEnabled?: boolean
  riftsEnabled?: boolean
  volcanoesEnabled?: boolean
  baseUrl: string
  outputDir: string
  frameSettleMs: number
}

type Logger = {
  info: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
}

const DEFAULT_OPTIONS: ScriptOptions = {
  count: 1,
  startSeed: 1,
  step: 1,
  viewMode: undefined,
  palette: undefined,
  surfaceTint: undefined,
  colorScale: undefined,
  tintShadowFloor: undefined,
  swirliness: undefined,
  craterCount: undefined,
  craterStrength: undefined,
  craterColorStrength: undefined,
  craterRayStrength: undefined,
  craterRayVisibility: undefined,
  craterRayDensity: undefined,
  craterRaySharpness: undefined,
  craterRayLengthPower: undefined,
  ridgeStrength: undefined,
  ridgeScale: undefined,
  ridgeSharpness: undefined,
  ridgeColorWeight: undefined,
  riftStrength: undefined,
  riftScale: undefined,
  riftWidth: undefined,
  riftSharpness: undefined,
  riftColorWeight: undefined,
  ridgesRiftsBlend: undefined,
  volcanoCount: undefined,
  volcanoScale: undefined,
  volcanoStrength: undefined,
  volcanoColorStrength: undefined,
  bumpTextureSize: undefined,
  colorTextureSize: undefined,
  largeScale: undefined,
  mediumScale: undefined,
  smallScale: undefined,
  bumpScale: undefined,
  roughness: undefined,
  metalness: undefined,
  triangleDetail: undefined,
  autoRotate: undefined,
  showDebugMeshes: undefined,
  cratersEnabled: undefined,
  ridgesEnabled: undefined,
  riftsEnabled: undefined,
  volcanoesEnabled: undefined,
  baseUrl: 'http://127.0.0.1:5173/planetoids',
  outputDir: path.resolve('public/generated/planetoid'),
  frameSettleMs: 50,
}

const LOCATOR_CONFIG = {
  roleTargets: {
    planetoidNavLink: {
      role: 'link' as const,
      name: 'Planetoids',
      exact: true,
    },
  },
  selectors: {
    controlsPanel: '.controls',
    canvas: '.canvas-shell canvas',
    sceneViewModeRadio: (mode: NonNullable<ScriptOptions['viewMode']>) =>
      `input[name="scene-view-mode"][value="${mode}"]`,
    numberInputByLabel: (label: string) => `label:has-text("${label}") input[type="number"]`,
    selectByLabel: (label: string) => `label:has-text("${label}") select`,
    colorInputByLabel: (label: string) => `label:has-text("${label}") input[type="color"]`,
    checkboxByLabel: (label: string) => `label:has-text("${label}") input`,
    sectionToggleBySummaryLabel: (label: string) =>
      `summary:has-text("${label}") input[type="checkbox"]`,
    sectionSummaryByLabel: (label: string) => `summary:has-text("${label}")`,
  },
}

type ScriptLocators = {
  controls: Locator
  planetoidNavLink: Locator
  seedInput: Locator
  paletteSelect: Locator
  viewModeRadios: Record<NonNullable<ScriptOptions['viewMode']>, Locator>
  surfaceTintInput: Locator
  autoRotateToggle: Locator
  debugMeshesToggle: Locator
  numericInputByKey: Record<PlanetoidRangeKey, Locator>
  sectionToggles: {
    cratersEnabled: Locator
    ridgesEnabled: Locator
    riftsEnabled: Locator
    volcanoesEnabled: Locator
  }
  sectionSummaries: {
    craters: Locator
    ridges: Locator
    rifts: Locator
    volcanoes: Locator
  }
  canvas: Locator
}

function buildLocators(page: Page): ScriptLocators {
  const { selectors, roleTargets } = LOCATOR_CONFIG

  return {
    controls: page.locator(selectors.controlsPanel),
    planetoidNavLink: page.getByRole(roleTargets.planetoidNavLink.role, {
      name: roleTargets.planetoidNavLink.name,
      exact: roleTargets.planetoidNavLink.exact,
    }),
    seedInput: page.locator(selectors.numberInputByLabel(PlanetoidUiLabels.seed)).first(),
    paletteSelect: page.locator(selectors.selectByLabel(PlanetoidUiLabels.palette)).first(),
    viewModeRadios: {
      mesh: page.locator(selectors.sceneViewModeRadio('mesh')).first(),
      bump: page.locator(selectors.sceneViewModeRadio('bump')).first(),
      texture: page.locator(selectors.sceneViewModeRadio('texture')).first(),
      ray: page.locator(selectors.sceneViewModeRadio('ray')).first(),
    },
    surfaceTintInput: page
      .locator(selectors.colorInputByLabel(PlanetoidUiLabels.surfaceTint))
      .first(),
    autoRotateToggle: page.locator(selectors.checkboxByLabel(PlanetoidUiLabels.autoRotate)).first(),
    debugMeshesToggle: page
      .locator(selectors.checkboxByLabel(PlanetoidUiLabels.showDebugMeshes))
      .first(),
    numericInputByKey: Object.fromEntries(
      NUMERIC_RANGE_KEYS.map((key) => [
        key,
        page.locator(selectors.numberInputByLabel(PlanetoidRangeLabels[key])).first(),
      ])
    ) as Record<PlanetoidRangeKey, Locator>,
    sectionToggles: {
      cratersEnabled: page
        .locator(selectors.sectionToggleBySummaryLabel(PlanetoidUiLabels.sections.craters))
        .first(),
      ridgesEnabled: page
        .locator(selectors.sectionToggleBySummaryLabel(PlanetoidUiLabels.sections.ridges))
        .first(),
      riftsEnabled: page
        .locator(selectors.sectionToggleBySummaryLabel(PlanetoidUiLabels.sections.rifts))
        .first(),
      volcanoesEnabled: page
        .locator(selectors.sectionToggleBySummaryLabel(PlanetoidUiLabels.sections.volcanoes))
        .first(),
    },
    sectionSummaries: {
      craters: page
        .locator(selectors.sectionSummaryByLabel(PlanetoidUiLabels.sections.craters))
        .first(),
      ridges: page
        .locator(selectors.sectionSummaryByLabel(PlanetoidUiLabels.sections.ridges))
        .first(),
      rifts: page
        .locator(selectors.sectionSummaryByLabel(PlanetoidUiLabels.sections.rifts))
        .first(),
      volcanoes: page
        .locator(selectors.sectionSummaryByLabel(PlanetoidUiLabels.sections.volcanoes))
        .first(),
    },
    canvas: page.locator(selectors.canvas),
  }
}

function createLogger(): Logger {
  function stamp() {
    return new Date().toISOString()
  }

  return {
    info(message: string) {
      console.log(`[${stamp()}] [INFO] ${message}`)
    },
    warn(message: string) {
      console.warn(`[${stamp()}] [WARN] ${message}`)
    },
    error(message: string) {
      console.error(`[${stamp()}] [ERROR] ${message}`)
    },
  }
}

const logger = createLogger()

function isFinitePositiveInt(value: number) {
  return Number.isFinite(value) && Number.isInteger(value) && value > 0
}

function parseNumber(value: string, name: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid ${name}: ${value}`)
  }

  return parsed
}

function parseBoolean(value: string, name: string) {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
    return true
  }

  if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
    return false
  }

  throw new Error(`Invalid ${name}: ${value}. Expected true or false.`)
}

function parseArgs(argv: string[]): ScriptOptions {
  const options: ScriptOptions = { ...DEFAULT_OPTIONS }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const next = argv[i + 1]

    const numericRangeKey = CLI_FLAG_TO_RANGE_KEY.get(arg)
    if (numericRangeKey && next) {
      ;(options as Record<string, unknown>)[numericRangeKey] = parseNumber(next, arg.slice(2))
      i++
      continue
    }

    if (arg === '--count' && next) {
      options.count = parseNumber(next, 'count')
      i++
      continue
    }

    if (arg === '--seed' && next) {
      options.startSeed = parseNumber(next, 'start-seed')
      i++
      continue
    }

    if (arg === '--step' && next) {
      options.step = parseNumber(next, 'step')
      i++
      continue
    }

    if (arg === '--palette' && next) {
      options.palette = next
      i++
      continue
    }

    if (arg === '--view-mode' && next) {
      if (next !== 'mesh' && next !== 'bump' && next !== 'texture' && next !== 'ray') {
        throw new Error(`Invalid view-mode: ${next}. Expected one of: mesh, bump, texture, ray`)
      }
      options.viewMode = next
      i++
      continue
    }

    if (arg === '--surface-tint' && next) {
      options.surfaceTint = next
      i++
      continue
    }

    if (arg === '--base-url' && next) {
      options.baseUrl = next
      i++
      continue
    }

    if (arg === '--output-dir' && next) {
      options.outputDir = path.resolve(next)
      i++
      continue
    }

    if (arg === '--frame-settle-ms' && next) {
      options.frameSettleMs = parseNumber(next, 'frame-settle-ms')
      i++
      continue
    }

    if (arg === PlanetoidCliToggleFlags.autoRotate && next) {
      options.autoRotate = parseBoolean(next, 'auto-rotate')
      i++
      continue
    }

    if (arg === PlanetoidCliToggleFlags.showDebugMeshes && next) {
      options.showDebugMeshes = parseBoolean(next, 'show-debug-meshes')
      i++
      continue
    }

    if (arg === PlanetoidCliToggleFlags.cratersEnabled && next) {
      options.cratersEnabled = parseBoolean(next, 'craters-enabled')
      i++
      continue
    }

    if (arg === PlanetoidCliToggleFlags.ridgesEnabled && next) {
      options.ridgesEnabled = parseBoolean(next, 'ridges-enabled')
      i++
      continue
    }

    if (arg === PlanetoidCliToggleFlags.riftsEnabled && next) {
      options.riftsEnabled = parseBoolean(next, 'rifts-enabled')
      i++
      continue
    }

    if (arg === PlanetoidCliToggleFlags.volcanoesEnabled && next) {
      options.volcanoesEnabled = parseBoolean(next, 'volcanoes-enabled')
      i++
      continue
    }

    if (arg === '--help') {
      console.log(
        [
          'Usage: npm run auto-generate-planetoids -- [options]',
          '',
          'Options:',
          '  --count <n>             Number of images to generate (default: 1)',
          '  --seed <n>              Starting seed value (default: 1)',
          '  --step <n>              Seed increment per image (default: 1)',
          '  --view-mode <name>      mesh | bump | texture | ray',
          '  --palette <name>        Palette name (example: oxidizedBasalt)',
          '  --surface-tint <hex>    Surface tint color (example: #88aacc)',
          ...NUMERIC_HELP_LINES,
          `  ${PlanetoidCliToggleFlags.autoRotate} <bool>    Enable/disable auto-rotate`,
          `  ${PlanetoidCliToggleFlags.showDebugMeshes} <bool> Enable/disable debug meshes (mesh mode only)`,
          `  ${PlanetoidCliToggleFlags.cratersEnabled} <bool> Enable/disable crater section`,
          `  ${PlanetoidCliToggleFlags.ridgesEnabled} <bool> Enable/disable ridges section`,
          `  ${PlanetoidCliToggleFlags.riftsEnabled} <bool>  Enable/disable rifts section`,
          `  ${PlanetoidCliToggleFlags.volcanoesEnabled} <bool> Enable/disable volcanoes section`,
          '  --base-url <url>        Planetoid page URL (default: http://127.0.0.1:5173/planetoids)',
          '  --output-dir <path>     Output directory (default: public/generated/planetoid)',
          '  --frame-settle-ms <n>   Delay after updates in ms (default: 50)',
          '',
        ].join('\n')
      )
      process.exit(0)
    }

    if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`)
    }
  }

  return options
}

function getTimestamp() {
  const now = new Date()
  const yyyy = String(now.getFullYear())
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')

  return `${yyyy}${mm}${dd}-${hh}${min}${ss}`
}

function normalizePalette(input: string | undefined): PaletteName | undefined {
  if (!input) return undefined

  const normalized = input.trim().toLowerCase()
  if (normalized === 'oxidisedbasalt') {
    return 'oxidizedBasalt'
  }

  const matched = VALID_PALETTES.find((value) => value.toLowerCase() === normalized)
  return matched
}

function assertRange(name: string, value: number | undefined, min: number, max: number) {
  if (value === undefined) return

  if (value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}. Received: ${value}`)
  }
}

function normalizeHexColor(input: string | undefined): string | undefined {
  if (!input) return undefined

  const trimmed = input.trim()
  const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(trimmed)
  if (!match) {
    throw new Error(`surface-tint must be a hex color like #abc or #aabbcc. Received: ${input}`)
  }

  const hex = match[1]
  if (hex.length === 3) {
    return `#${hex
      .split('')
      .map((ch) => ch + ch)
      .join('')
      .toLowerCase()}`
  }

  return `#${hex.toLowerCase()}`
}

async function main() {
  const runStartedAt = Date.now()
  const options = parseArgs(process.argv.slice(2))

  logger.info('Planetoid auto-generator starting')
  logger.info(
    `Options: count=${options.count}, startSeed=${options.startSeed}, step=${options.step}, viewMode=${options.viewMode ?? 'unchanged'}, palette=${options.palette ?? 'unchanged'}, surfaceTint=${options.surfaceTint ?? 'unchanged'}, colorScale=${options.colorScale ?? 'unchanged'}, tintShadowFloor=${options.tintShadowFloor ?? 'unchanged'}, swirliness=${options.swirliness ?? 'unchanged'}, craterCount=${options.craterCount ?? 'unchanged'}, craterStrength=${options.craterStrength ?? 'unchanged'}, craterColorStrength=${options.craterColorStrength ?? 'unchanged'}, craterRayStrength=${options.craterRayStrength ?? 'unchanged'}, craterRayVisibility=${options.craterRayVisibility ?? 'unchanged'}, craterRayDensity=${options.craterRayDensity ?? 'unchanged'}, craterRaySharpness=${options.craterRaySharpness ?? 'unchanged'}, craterRayLengthPower=${options.craterRayLengthPower ?? 'unchanged'}, ridgeStrength=${options.ridgeStrength ?? 'unchanged'}, ridgeScale=${options.ridgeScale ?? 'unchanged'}, ridgeSharpness=${options.ridgeSharpness ?? 'unchanged'}, ridgeColorWeight=${options.ridgeColorWeight ?? 'unchanged'}, riftStrength=${options.riftStrength ?? 'unchanged'}, riftScale=${options.riftScale ?? 'unchanged'}, riftWidth=${options.riftWidth ?? 'unchanged'}, riftSharpness=${options.riftSharpness ?? 'unchanged'}, riftColorWeight=${options.riftColorWeight ?? 'unchanged'}, ridgesRiftsBlend=${options.ridgesRiftsBlend ?? 'unchanged'}, volcanoCount=${options.volcanoCount ?? 'unchanged'}, volcanoScale=${options.volcanoScale ?? 'unchanged'}, volcanoStrength=${options.volcanoStrength ?? 'unchanged'}, volcanoColorStrength=${options.volcanoColorStrength ?? 'unchanged'}, bumpTextureSize=${options.bumpTextureSize ?? 'unchanged'}, colorTextureSize=${options.colorTextureSize ?? 'unchanged'}, largeScale=${options.largeScale ?? 'unchanged'}, mediumScale=${options.mediumScale ?? 'unchanged'}, smallScale=${options.smallScale ?? 'unchanged'}, bumpScale=${options.bumpScale ?? 'unchanged'}, roughness=${options.roughness ?? 'unchanged'}, metalness=${options.metalness ?? 'unchanged'}, triangleDetail=${options.triangleDetail ?? 'unchanged'}, autoRotate=${options.autoRotate ?? 'unchanged'}, showDebugMeshes=${options.showDebugMeshes ?? 'unchanged'}, cratersEnabled=${options.cratersEnabled ?? 'unchanged'}, ridgesEnabled=${options.ridgesEnabled ?? 'unchanged'}, riftsEnabled=${options.riftsEnabled ?? 'unchanged'}, volcanoesEnabled=${options.volcanoesEnabled ?? 'unchanged'}, baseUrl=${options.baseUrl}, outputDir=${options.outputDir}, frameSettleMs=${options.frameSettleMs}`
  )

  if (!isFinitePositiveInt(options.count)) {
    throw new Error(`count must be a positive integer. Received: ${options.count}`)
  }

  if (!Number.isFinite(options.startSeed) || !Number.isFinite(options.step)) {
    throw new Error('start-seed and step must be finite numbers.')
  }

  for (const key of NUMERIC_RANGE_KEYS) {
    const value = (options as Record<string, unknown>)[key]
    assertRange(
      PlanetoidCliFlagByRangeKey[key].slice(2),
      typeof value === 'number' ? value : undefined,
      MinValues[key],
      MaxValues[key]
    )
  }

  const normalizedSurfaceTint = normalizeHexColor(options.surfaceTint)

  const requestedPalette = normalizePalette(options.palette)
  if (options.palette && !requestedPalette) {
    throw new Error(
      `palette is invalid. Received: ${options.palette}. Valid values: ${VALID_PALETTES.join(', ')}`
    )
  }

  logger.info(
    `Palette resolution: ${requestedPalette ? `${options.palette} -> ${requestedPalette}` : 'using current UI palette'}`
  )

  await mkdir(options.outputDir, { recursive: true })
  logger.info(`Ensured output directory exists: ${options.outputDir}`)

  logger.info('Launching Firefox via Playwright')
  const browser = await firefox.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page = await context.newPage()

  try {
    logger.info(`Opening ${options.baseUrl}`)
    await page.goto(options.baseUrl, { waitUntil: 'networkidle' })
    logger.info('Initial navigation complete')

    const locators = buildLocators(page)
    const {
      controls,
      planetoidNavLink,
      seedInput,
      paletteSelect,
      viewModeRadios,
      surfaceTintInput,
      autoRotateToggle,
      debugMeshesToggle,
      numericInputByKey,
      sectionToggles,
      sectionSummaries,
      canvas,
    } = locators

    if (!(await controls.isVisible({ timeout: 2000 }).catch(() => false))) {
      logger.warn('Controls panel not visible after initial load; attempting nav click')
      if (await planetoidNavLink.isVisible().catch(() => false)) {
        await planetoidNavLink.click()
        logger.info('Clicked Planetoids nav link')
      } else {
        logger.warn('Planetoids nav link was not visible')
      }
    }

    async function ensureSectionOpen(summary: Locator) {
      if (!(await summary.isVisible().catch(() => false))) {
        return
      }

      const details = summary.locator('xpath=ancestor::details[1]').first()
      const isOpen = await details.evaluate((el) => (el as HTMLDetailsElement).open)
      if (!isOpen) {
        await summary.click()
      }
    }

    logger.info('Waiting for required UI controls and canvas')
    await controls.waitFor({ state: 'visible' })
    await seedInput.waitFor({ state: 'visible' })
    await paletteSelect.waitFor({ state: 'visible' })
    await surfaceTintInput.waitFor({ state: 'visible' })
    await autoRotateToggle.waitFor({ state: 'visible' })
    await debugMeshesToggle.waitFor({ state: 'visible' })
    await sectionToggles.cratersEnabled.waitFor({ state: 'visible' })
    await sectionToggles.ridgesEnabled.waitFor({ state: 'visible' })
    await sectionToggles.riftsEnabled.waitFor({ state: 'visible' })
    await sectionToggles.volcanoesEnabled.waitFor({ state: 'visible' })
    await canvas.waitFor({ state: 'visible' })
    logger.info('All required UI elements are visible')

    await ensureSectionOpen(sectionSummaries.craters)
    await ensureSectionOpen(sectionSummaries.ridges)
    await ensureSectionOpen(sectionSummaries.rifts)
    await ensureSectionOpen(sectionSummaries.volcanoes)

    async function ensureLocatorVisible(locator: Locator) {
      if (await locator.isVisible().catch(() => false)) {
        return
      }

      const containingDetails = locator.locator('xpath=ancestor::details[1]').first()
      if (await containingDetails.count()) {
        const isOpen = await containingDetails
          .evaluate((el) => (el as HTMLDetailsElement).open)
          .catch(() => true)

        if (!isOpen) {
          const summary = containingDetails.locator('summary').first()
          if (await summary.isVisible().catch(() => false)) {
            await summary.click()
          }
        }
      }

      await locator.waitFor({ state: 'visible' })
    }

    if (requestedPalette) {
      logger.info(`Applying palette: ${requestedPalette}`)
      await paletteSelect.selectOption(requestedPalette)
      await page.waitForTimeout(options.frameSettleMs)
      logger.info('Palette applied and settle delay complete')
    }

    if (options.viewMode) {
      logger.info(`Applying view mode: ${options.viewMode}`)
      await viewModeRadios[options.viewMode].check()
      await page.waitForTimeout(options.frameSettleMs)
    }

    async function applyNumericOverride(name: string, locator: Locator, value: number | undefined) {
      if (value === undefined) return

      logger.info(`Applying ${name}: ${value}`)
      await ensureLocatorVisible(locator)
      await locator.fill(String(value))
      await locator.press('Enter')
    }

    if (normalizedSurfaceTint) {
      logger.info(`Applying surface tint: ${normalizedSurfaceTint}`)
      await surfaceTintInput.fill(normalizedSurfaceTint)
    }

    for (const key of NUMERIC_RANGE_KEYS) {
      const value = (options as Record<string, unknown>)[key]
      await applyNumericOverride(
        PlanetoidRangeLabels[key],
        numericInputByKey[key],
        typeof value === 'number' ? value : undefined
      )
    }

    async function applyToggleOverride(
      name: string,
      locator: Locator,
      enabled: boolean | undefined
    ) {
      if (enabled === undefined) return

      logger.info(`Applying ${name}: ${enabled}`)
      if (enabled) {
        await locator.check()
      } else {
        await locator.uncheck()
      }
    }

    await applyToggleOverride('auto rotate', autoRotateToggle, options.autoRotate)
    await applyToggleOverride('show debug meshes', debugMeshesToggle, options.showDebugMeshes)
    await applyToggleOverride(
      'craters enabled',
      sectionToggles.cratersEnabled,
      options.cratersEnabled
    )
    await applyToggleOverride('ridges enabled', sectionToggles.ridgesEnabled, options.ridgesEnabled)
    await applyToggleOverride('rifts enabled', sectionToggles.riftsEnabled, options.riftsEnabled)
    await applyToggleOverride(
      'volcanoes enabled',
      sectionToggles.volcanoesEnabled,
      options.volcanoesEnabled
    )

    if (
      normalizedSurfaceTint ||
      options.viewMode !== undefined ||
      NUMERIC_RANGE_KEYS.some(
        (key) => typeof (options as Record<string, unknown>)[key] === 'number'
      ) ||
      options.autoRotate !== undefined ||
      options.showDebugMeshes !== undefined ||
      options.cratersEnabled !== undefined ||
      options.ridgesEnabled !== undefined ||
      options.riftsEnabled !== undefined ||
      options.volcanoesEnabled !== undefined
    ) {
      await page.waitForTimeout(options.frameSettleMs)
      logger.info('Material/surface overrides applied and settle delay complete')
    }

    const runStamp = getTimestamp()
    logger.info(`Capture run stamp: ${runStamp}`)

    for (let i = 0; i < options.count; i++) {
      const seed = options.startSeed + i * options.step
      logger.info(`Preparing frame ${i + 1}/${options.count} with seed=${seed}`)
      await seedInput.fill(String(seed))
      await seedInput.press('Enter')
      await page.waitForTimeout(options.frameSettleMs)

      const fileName = `planetoid-${runStamp}-seed-${seed.toString().padStart(6, '0')}.png`
      const filePath = path.join(options.outputDir, fileName)

      const pngDataUrl = await canvas.evaluate((canvasElement) => {
        if (!(canvasElement instanceof HTMLCanvasElement)) {
          throw new Error('Target element is not an HTMLCanvasElement.')
        }

        return canvasElement.toDataURL('image/png')
      })

      const base64Payload = pngDataUrl.replace(/^data:image\/png;base64,/, '')
      await writeFile(filePath, base64Payload, 'base64')
      logger.info(`[${i + 1}/${options.count}] wrote ${fileName}`)
    }

    const elapsedMs = Date.now() - runStartedAt
    logger.info(`Done. Generated ${options.count} image(s) in ${options.outputDir}`)
    logger.info(`Total elapsed time: ${(elapsedMs / 1000).toFixed(2)}s`)
  } finally {
    logger.info('Closing browser context')
    await context.close()
    await browser.close()
    logger.info('Browser closed')
  }
}

main().catch((error) => {
  logger.error(error instanceof Error ? (error.stack ?? error.message) : String(error))
  process.exitCode = 1
})
