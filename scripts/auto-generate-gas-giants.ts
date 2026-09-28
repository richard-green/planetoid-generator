/// <reference types="node" />

import { mkdir, open, writeFile } from 'fs/promises'
import path from 'path'
import type { Locator, Page } from 'playwright'
import { firefox } from 'playwright'
import {
  GasGiantPaletteNames,
  type GasGiantPaletteName as PaletteName,
} from '../src/lib/components/Threlte/GasGiant/GasGiantPalettes'
import {
  GasGiantCliFlagByRangeKey,
  GasGiantCliFeatureFlags,
  GasGiantCliToggleFlags,
  GasGiantRangeLabels,
  GasGiantUiLabels,
  MaxValues,
  MinValues,
  type GasGiantRangeKey,
} from '../src/lib/components/Threlte/GasGiant/GasGiantSettings'
import {
  AtmospherePaletteNames,
  type AtmospherePaletteName,
} from '../src/lib/components/Threlte/Atmosphere/AtmospherePalettes'
import {
  RingPaletteNames,
  type RingPaletteName,
} from '../src/lib/components/Threlte/Rings/RingPalettes'
import {
  RingCliFlagByRangeKey,
  RingCliFlags,
  RingMaxValues,
  RingMinValues,
  RingRangeLabels,
  type RingRangeKey,
} from '../src/lib/components/Threlte/Rings/RingSettings'
import { DefaultTextureSize, TextureSizes, type TextureSize } from '../src/lib/types/textureSize'

const NUMERIC_RANGE_KEYS = (Object.keys(MinValues) as GasGiantRangeKey[]).filter(
  (key) => key !== 'seed'
)

const CLI_FLAG_TO_RANGE_KEY = new Map<string, GasGiantRangeKey>()
for (const key of NUMERIC_RANGE_KEYS) {
  CLI_FLAG_TO_RANGE_KEY.set(GasGiantCliFlagByRangeKey[key], key)
}
CLI_FLAG_TO_RANGE_KEY.set('--bump-scale', 'normalStrength')

const NUMERIC_HELP_LINES = NUMERIC_RANGE_KEYS.map((key) => {
  const flag = GasGiantCliFlagByRangeKey[key]
  const label = GasGiantRangeLabels[key]
  return `  ${flag} <n> ${label} (range: ${MinValues[key]} to ${MaxValues[key]})`
})
const RING_RANGE_KEYS = Object.keys(RingMinValues) as RingRangeKey[]
const CLI_FLAG_TO_RING_RANGE_KEY = new Map<string, RingRangeKey>()
for (const key of RING_RANGE_KEYS) {
  CLI_FLAG_TO_RING_RANGE_KEY.set(RingCliFlagByRangeKey[key], key)
}
const RING_HELP_LINES = RING_RANGE_KEYS.map(
  (key) =>
    `  ${RingCliFlagByRangeKey[key]} <n> ${RingRangeLabels[key]} (range: ${RingMinValues[key]} to ${RingMaxValues[key]})`
)

type ScriptOptions = {
  count: number
  startSeed: number
  step: number
  palette?: string
  surfaceTint?: string
  autoRotate?: boolean
  stormsEnabled?: boolean
  ringsEnabled?: boolean
  ringPalette?: string
  atmosphereEnabled?: boolean
  atmospherePalette?: string
  baseUrl: string
  outputDir: string
  frameSettleMs: number
  textureSize: TextureSize
  exportTextures: boolean
} & Partial<Record<GasGiantRangeKey | RingRangeKey, number>>

type Logger = {
  info: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
}

const DEFAULT_OPTIONS: ScriptOptions = {
  count: 1,
  startSeed: 1,
  step: 1,
  palette: undefined,
  surfaceTint: undefined,
  autoRotate: undefined,
  stormsEnabled: undefined,
  ringsEnabled: undefined,
  ringPalette: undefined,
  atmosphereEnabled: undefined,
  atmospherePalette: undefined,
  seed: undefined,
  colorScale: undefined,
  tintShadowFloor: undefined,
  cloudBandCount: undefined,
  cloudBandSharpness: undefined,
  cloudChaos: undefined,
  stormCount: undefined,
  stormScale: undefined,
  stormPower: undefined,
  stormStrength: undefined,
  stormColorStrength: undefined,
  normalStrength: undefined,
  roughness: undefined,
  metalness: undefined,
  baseUrl: 'http://127.0.0.1:5173/#/giants',
  outputDir: path.resolve('public/generated/giants'),
  frameSettleMs: 50,
  textureSize: DefaultTextureSize,
  exportTextures: false,
}

const LOCATOR_CONFIG = {
  roleTargets: {
    surfaceColorMapMenuItem: {
      role: 'menuitem' as const,
      name: 'Surface color map',
      exact: true,
    },
    surfaceNormalMapMenuItem: {
      role: 'menuitem' as const,
      name: 'Surface normal map',
      exact: true,
    },
  },
  selectors: {
    controlsPanel: '.controls',
    canvas: '.canvas-shell canvas',
    numberInputByLabel: (label: string) => `label:has-text("${label}") input[type="number"]`,
    selectByLabel: (label: string) => `label:has-text("${label}") select`,
    colorInputByLabel: (label: string) => `label:has-text("${label}") input[type="color"]`,
    checkboxByLabel: (label: string) => `label:has-text("${label}") input[type="checkbox"]`,
    sectionToggleBySummaryLabel: (label: string) =>
      `summary:has-text("${label}") input[type="checkbox"]`,
  },
}

type ScriptLocators = {
  controls: Locator
  seedInput: Locator
  paletteSelect: Locator
  surfaceTintInput: Locator
  autoRotateToggle: Locator
  stormsEnabledToggle: Locator
  ringsEnabledToggle: Locator
  ringPaletteSelect: Locator
  atmosphereEnabledToggle: Locator
  atmospherePaletteSelect: Locator
  colorTextureSizeSelect: Locator
  normalTextureSizeSelect: Locator
  exportMenu: Locator
  exportMenuTrigger: Locator
  surfaceColorMapMenuItem: Locator
  surfaceNormalMapMenuItem: Locator
  numericInputByKey: Record<GasGiantRangeKey, Locator>
  ringNumericInputByKey: Record<RingRangeKey, Locator>
  canvas: Locator
}

function buildLocators(page: Page): ScriptLocators {
  const { selectors } = LOCATOR_CONFIG

  return {
    controls: page.locator(selectors.controlsPanel),
    seedInput: page.getByLabel(GasGiantRangeLabels.seed, { exact: true }),
    paletteSelect: page.locator(selectors.selectByLabel(GasGiantUiLabels.palette)).first(),
    surfaceTintInput: page
      .locator(selectors.colorInputByLabel(GasGiantUiLabels.surfaceTint))
      .first(),
    autoRotateToggle: page.locator(selectors.checkboxByLabel(GasGiantUiLabels.autoRotate)).first(),
    stormsEnabledToggle: page
      .locator(selectors.sectionToggleBySummaryLabel(GasGiantUiLabels.stormSystems))
      .first(),
    ringsEnabledToggle: page.locator(selectors.sectionToggleBySummaryLabel('Rings')).first(),
    ringPaletteSelect: page.locator(selectors.selectByLabel('Ring palette')).first(),
    atmosphereEnabledToggle: page
      .locator(selectors.sectionToggleBySummaryLabel(GasGiantUiLabels.atmosphere))
      .first(),
    atmospherePaletteSelect: page
      .locator(selectors.selectByLabel(GasGiantUiLabels.atmospherePalette))
      .first(),
    colorTextureSizeSelect: page.locator(selectors.selectByLabel('Color texture size')).first(),
    normalTextureSizeSelect: page.locator(selectors.selectByLabel('Normal texture size')).first(),
    exportMenu: page.locator('.export-split-menu'),
    exportMenuTrigger: page.locator('.export-split-trigger'),
    surfaceColorMapMenuItem: page.getByRole(LOCATOR_CONFIG.roleTargets.surfaceColorMapMenuItem.role, {
      name: LOCATOR_CONFIG.roleTargets.surfaceColorMapMenuItem.name,
      exact: LOCATOR_CONFIG.roleTargets.surfaceColorMapMenuItem.exact,
    }),
    surfaceNormalMapMenuItem: page.getByRole(
      LOCATOR_CONFIG.roleTargets.surfaceNormalMapMenuItem.role,
      {
        name: LOCATOR_CONFIG.roleTargets.surfaceNormalMapMenuItem.name,
        exact: LOCATOR_CONFIG.roleTargets.surfaceNormalMapMenuItem.exact,
      }
    ),
    numericInputByKey: Object.fromEntries(
      (Object.keys(MinValues) as GasGiantRangeKey[]).map((key) => [
        key,
        page.locator(selectors.numberInputByLabel(GasGiantRangeLabels[key])).first(),
      ])
    ) as Record<GasGiantRangeKey, Locator>,
    ringNumericInputByKey: Object.fromEntries(
      RING_RANGE_KEYS.map((key) => [
        key,
        page.locator(selectors.numberInputByLabel(RingRangeLabels[key])).first(),
      ])
    ) as Record<RingRangeKey, Locator>,
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

async function readPngDimensions(filePath: string) {
  const file = await open(filePath, 'r')

  try {
    const header = Buffer.alloc(24)
    const { bytesRead } = await file.read(header, 0, header.length, 0)
    if (
      bytesRead < header.length ||
      !header.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
      !header.subarray(12, 16).equals(Buffer.from('IHDR'))
    ) {
      throw new Error(`Invalid PNG file: ${filePath}`)
    }

    return {
      width: header.readUInt32BE(16),
      height: header.readUInt32BE(20),
    }
  } finally {
    await file.close()
  }
}

async function logWrittenPng(filePath: string, fileName: string) {
  const { width, height } = await readPngDimensions(filePath)
  logger.info(`Wrote ${fileName} (${width}x${height})`)
}

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

function parseTextureSize(value: string): TextureSize {
  const parsed = parseNumber(value, 'texture-size')
  if (!(TextureSizes as readonly number[]).includes(parsed)) {
    throw new Error(`Invalid texture-size: ${value}. Expected one of: ${TextureSizes.join(', ')}`)
  }

  return parsed as TextureSize
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
      options[numericRangeKey] = parseNumber(next, arg.slice(2))
      i++
      continue
    }

    const ringRangeKey = CLI_FLAG_TO_RING_RANGE_KEY.get(arg)
    if (ringRangeKey && next) {
      options[ringRangeKey] = parseNumber(next, arg.slice(2))
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

    if (arg === '--surface-tint' && next) {
      options.surfaceTint = next
      i++
      continue
    }

    if (arg === RingCliFlags.palette && next) {
      options.ringPalette = next
      i++
      continue
    }

    if (arg === GasGiantCliFeatureFlags.atmospherePalette && next) {
      options.atmospherePalette = next
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

    if (arg === '--texture-size' && next) {
      options.textureSize = parseTextureSize(next)
      i++
      continue
    }

    if (arg === '--export-textures') {
      options.exportTextures = true
      continue
    }

    if (arg === GasGiantCliToggleFlags.autoRotate && next) {
      options.autoRotate = parseBoolean(next, 'auto-rotate')
      i++
      continue
    }

    if (arg === GasGiantCliToggleFlags.stormsEnabled && next) {
      options.stormsEnabled = parseBoolean(next, 'storms-enabled')
      i++
      continue
    }

    if (arg === RingCliFlags.enabled && next) {
      options.ringsEnabled = parseBoolean(next, 'rings-enabled')
      i++
      continue
    }

    if (arg === GasGiantCliToggleFlags.atmosphereEnabled && next) {
      options.atmosphereEnabled = parseBoolean(next, 'atmosphere-enabled')
      i++
      continue
    }

    if (arg === '--help') {
      console.log(
        [
          'Usage: npm run auto-generate-gas-giants -- [options]',
          '',
          'Options:',
          '  --count <n>             Number of images to generate (default: 1)',
          '  --seed <n>              Starting seed value (default: 1)',
          '  --step <n>              Seed increment per image (default: 1)',
          '  --palette <name>        Palette name',
          '  --surface-tint <hex>    Surface tint color (example: #88aacc)',
          '  Output: scene PNG by default; use --export-textures for texture maps only',
          ...NUMERIC_HELP_LINES,
          `  ${RingCliFlags.palette} <name> Ring palette name`,
          ...RING_HELP_LINES,
          `  ${GasGiantCliToggleFlags.autoRotate} <bool> Enable/disable auto-rotate`,
          `  ${GasGiantCliToggleFlags.stormsEnabled} <bool> Enable/disable storm systems`,
          `  ${RingCliFlags.enabled} <bool> Enable/disable rings`,
          `  ${GasGiantCliFeatureFlags.atmospherePalette} <name> Atmosphere palette name`,
          `  ${GasGiantCliToggleFlags.atmosphereEnabled} <bool> Enable/disable atmosphere`,
          '  --base-url <url>        Giant page URL (default: http://127.0.0.1:5173/#/giants)',
          '  --output-dir <path>     Output directory (default: public/generated/giants)',
          '  --frame-settle-ms <n>   Delay after updates in ms (default: 50)',
          `  --texture-size <n>      Texture map height (color and normal; choices: ${TextureSizes.join(', ')}; default: ${DefaultTextureSize})`,
          '  --export-textures       Export color and normal maps without a scene screenshot',
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

function normalizePalette(input: string | undefined): PaletteName | undefined {
  if (!input) return undefined

  const normalized = input.trim().toLowerCase()
  const matched = GasGiantPaletteNames.find((value) => value.toLowerCase() === normalized)
  return matched
}

function normalizeRingPalette(input: string | undefined): RingPaletteName | undefined {
  if (!input) return undefined
  const normalized = input.trim().toLowerCase()
  return RingPaletteNames.find((value) => value.toLowerCase() === normalized)
}

function normalizeAtmospherePalette(input: string | undefined): AtmospherePaletteName | undefined {
  if (!input) return undefined
  const normalized = input.trim().toLowerCase()
  return AtmospherePaletteNames.find((value) => value.toLowerCase() === normalized)
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

async function main() {
  const runStartedAt = Date.now()
  const options = parseArgs(process.argv.slice(2))

  logger.info('Gas giant auto-generator starting')

  if (!isFinitePositiveInt(options.count)) {
    throw new Error(`count must be a positive integer. Received: ${options.count}`)
  }

  if (!Number.isFinite(options.startSeed) || !Number.isFinite(options.step)) {
    throw new Error('start-seed and step must be finite numbers.')
  }

  for (const key of NUMERIC_RANGE_KEYS) {
    const value = options[key]
    assertRange(
      GasGiantCliFlagByRangeKey[key].slice(2),
      typeof value === 'number' ? value : undefined,
      MinValues[key],
      MaxValues[key]
    )
  }

  for (const key of RING_RANGE_KEYS) {
    const value = options[key]
    assertRange(
      RingCliFlagByRangeKey[key].slice(2),
      typeof value === 'number' ? value : undefined,
      RingMinValues[key],
      RingMaxValues[key]
    )
  }

  const normalizedSurfaceTint = normalizeHexColor(options.surfaceTint)

  const requestedPalette = normalizePalette(options.palette)
  if (options.palette && !requestedPalette) {
    throw new Error(
      `palette is invalid. Received: ${options.palette}. Valid values: ${GasGiantPaletteNames.join(', ')}`
    )
  }

  const requestedRingPalette = normalizeRingPalette(options.ringPalette)
  if (options.ringPalette && !requestedRingPalette) {
    throw new Error(
      `ring-palette is invalid. Received: ${options.ringPalette}. Valid values: ${RingPaletteNames.join(', ')}`
    )
  }

  const requestedAtmospherePalette = normalizeAtmospherePalette(options.atmospherePalette)
  if (options.atmospherePalette && !requestedAtmospherePalette) {
    throw new Error(
      `atmosphere-palette is invalid. Received: ${options.atmospherePalette}. Valid values: ${AtmospherePaletteNames.join(', ')}`
    )
  }

  await mkdir(options.outputDir, { recursive: true })

  const browser = await firefox.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page = await context.newPage()

  try {
    const pageUrl = new URL(options.baseUrl)
    if (!pageUrl.hash) pageUrl.hash = '/giants'
    pageUrl.searchParams.set('automation', '1')
    await page.goto(pageUrl.toString(), { waitUntil: 'networkidle' })

    const locators = buildLocators(page)
    const {
      controls,
      seedInput,
      paletteSelect,
      surfaceTintInput,
      autoRotateToggle,
      stormsEnabledToggle,
      ringsEnabledToggle,
      ringPaletteSelect,
      atmosphereEnabledToggle,
      atmospherePaletteSelect,
      colorTextureSizeSelect,
      normalTextureSizeSelect,
      exportMenu,
      exportMenuTrigger,
      surfaceColorMapMenuItem,
      surfaceNormalMapMenuItem,
      numericInputByKey,
      ringNumericInputByKey,
      canvas,
    } = locators

    await controls.waitFor({ state: 'visible' })
    await seedInput.waitFor({ state: 'visible' })
    await paletteSelect.waitFor({ state: 'visible' })
    await surfaceTintInput.waitFor({ state: 'visible' })
    await autoRotateToggle.waitFor({ state: 'visible' })
    await stormsEnabledToggle.waitFor({ state: 'visible' })
    await ringsEnabledToggle.waitFor({ state: 'visible' })
    await canvas.waitFor({ state: 'visible' })

    async function ensureLocatorVisible(locator: Locator) {
      if (await locator.isVisible().catch(() => false)) {
        return
      }

      const containingDetails = locator.locator('xpath=ancestor::details[1]').first()
      if (await containingDetails.count()) {
        const isOpen = await containingDetails
          .evaluate((el) => Boolean((el as { open?: unknown }).open))
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

    if (options.exportTextures) {
      await ensureLocatorVisible(colorTextureSizeSelect)
      await colorTextureSizeSelect.selectOption(String(options.textureSize))
      await ensureLocatorVisible(normalTextureSizeSelect)
      await normalTextureSizeSelect.selectOption(String(options.textureSize))
      await page.waitForTimeout(options.frameSettleMs)
    }

    async function saveTextureExport(locator: Locator, fileName: string) {
      const isMenuOpen = await exportMenu.evaluate((element) =>
        Boolean((element as { open?: unknown }).open)
      )
      if (!isMenuOpen) await exportMenuTrigger.click()
      await locator.waitFor({ state: 'visible' })

      const downloadPromise = page.waitForEvent('download')
      await locator.click()
      const download = await downloadPromise
      const filePath = path.join(options.outputDir, fileName)
      await download.saveAs(filePath)
      await logWrittenPng(filePath, fileName)
    }

    if (requestedPalette) {
      await paletteSelect.selectOption(requestedPalette)
      await page.waitForTimeout(options.frameSettleMs)
    }

    if (normalizedSurfaceTint) {
      await surfaceTintInput.fill(normalizedSurfaceTint)
    }

    async function applyNumericOverride(name: string, locator: Locator, value: number | undefined) {
      if (value === undefined) return

      logger.info(`Applying ${name}: ${value}`)
      await ensureLocatorVisible(locator)
      await locator.fill(String(value))
      await locator.press('Enter')
    }

    for (const key of NUMERIC_RANGE_KEYS) {
      await applyNumericOverride(GasGiantRangeLabels[key], numericInputByKey[key], options[key])
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
    await applyToggleOverride('storms enabled', stormsEnabledToggle, options.stormsEnabled)
    await applyToggleOverride('rings enabled', ringsEnabledToggle, options.ringsEnabled)
    await applyToggleOverride(
      'atmosphere enabled',
      atmosphereEnabledToggle,
      options.atmosphereEnabled
    )

    if (requestedRingPalette) {
      await ensureLocatorVisible(ringPaletteSelect)
      await ringPaletteSelect.selectOption(requestedRingPalette)
    }

    if (requestedAtmospherePalette) {
      await ensureLocatorVisible(atmospherePaletteSelect)
      await atmospherePaletteSelect.selectOption(requestedAtmospherePalette)
    }

    for (const key of RING_RANGE_KEYS) {
      await applyNumericOverride(RingRangeLabels[key], ringNumericInputByKey[key], options[key])
    }

    if (
      normalizedSurfaceTint ||
      NUMERIC_RANGE_KEYS.some((key) => typeof options[key] === 'number') ||
      options.autoRotate !== undefined ||
      options.stormsEnabled !== undefined ||
      options.ringsEnabled !== undefined ||
      options.atmosphereEnabled !== undefined ||
      requestedAtmospherePalette ||
      requestedRingPalette ||
      RING_RANGE_KEYS.some((key) => typeof options[key] === 'number')
    ) {
      await page.waitForTimeout(options.frameSettleMs)
    }

    const runStamp = getTimestamp()

    for (let i = 0; i < options.count; i++) {
      const seed = options.startSeed + i * options.step
      await seedInput.fill(String(seed))
      await seedInput.press('Enter')
      await page.waitForTimeout(options.frameSettleMs)

      if (options.exportTextures) {
        const textureName = `gas-giant-${runStamp}-seed-${seed.toString().padStart(6, '0')}`
        await saveTextureExport(surfaceColorMapMenuItem, `${textureName}-color.png`)
        await saveTextureExport(surfaceNormalMapMenuItem, `${textureName}-normal.png`)
      } else {
        const fileName = `gas-giant-${runStamp}-seed-${seed.toString().padStart(6, '0')}.png`
        const filePath = path.join(options.outputDir, fileName)

        const pngDataUrl = await canvas.evaluate((canvasElement) => {
          const maybeCanvas = canvasElement as { toDataURL?: (type?: string) => string }
          if (typeof maybeCanvas.toDataURL !== 'function') {
            throw new Error('Target element does not expose toDataURL().')
          }

          return maybeCanvas.toDataURL('image/png')
        })

        const base64Payload = pngDataUrl.replace(/^data:image\/png;base64,/, '')
        await writeFile(filePath, base64Payload, 'base64')
        const { width, height } = await readPngDimensions(filePath)
        logger.info(`[${i + 1}/${options.count}] wrote ${fileName} (${width}x${height})`)
      }
    }

    const elapsedMs = Date.now() - runStartedAt
    const outputKind = options.exportTextures ? 'texture set(s)' : 'scene image(s)'
    logger.info(`Done. Generated ${options.count} ${outputKind} in ${options.outputDir}`)
    logger.info(`Total elapsed time: ${(elapsedMs / 1000).toFixed(2)}s`)
  } finally {
    await context.close()
    await browser.close()
  }
}

main().catch((error) => {
  logger.error(error instanceof Error ? (error.stack ?? error.message) : String(error))
  process.exitCode = 1
})
