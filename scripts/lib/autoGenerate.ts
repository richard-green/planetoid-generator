/// <reference types="node" />

import { mkdir, open } from 'fs/promises'
import path from 'path'
import type { Locator } from 'playwright'
import { firefox } from 'playwright'
import {
  keysOfKind,
  settingControlId,
  type SettingsSchema,
} from '../../src/lib/types/settingsSchema'
import { DefaultTextureSize, TextureSizes, type TextureSize } from '../../src/lib/types/textureSize'
import { CameraViewLimits, type CameraView } from '../../src/lib/utils/cameraView'
import {
  applySettings,
  assertAllSettingControlsPresent,
  createSettingsCli,
  describeOverrides,
  parseTextureSizeArg,
  setCameraView,
  withSectionsEnabled,
} from './settingsCli'

export type GeneratorConfig<T, Section extends string> = {
  /** Used in log messages and output file names, e.g. `gas-giant`. */
  name: string
  npmScript: string
  schema: SettingsSchema<T, Section>
  /** App route, e.g. `/giants`; applied when --base-url has no hash. */
  routeHash: string
  defaultOutputDir: string
  /** Export-menu items saved per seed with --export-textures. */
  textureExports: { menuItem: string; fileSuffix: string }[]
  aliases?: Record<string, keyof T & string>
  /** Rewrites a raw CLI value before it is parsed (e.g. legacy spellings). */
  normalizeValue?: (flag: string, value: string) => string
}

type ScriptOptions<T> = {
  count: number
  startSeed: number
  step: number
  overrides: Partial<T>
  baseUrl: string
  outputDir: string
  frameSettleMs: number
  textureSize: TextureSize
  exportTextures: boolean
  camera: CameraView
  cameraAzimuthStep: number
}

function parseRange(value: string, name: string, min: number, max: number) {
  const parsed = parseNumber(value, name)
  if (parsed < min || parsed > max) {
    throw new Error(`${name} must be between ${min} and ${max}. Received: ${value}`)
  }
  return parsed
}

const DEFAULT_BASE_URL = 'http://127.0.0.1:5173/'

const SCRIPT_VALUE_FLAGS: Record<string, (options: ScriptOptions<unknown>, value: string) => void> =
  {
    '--count': (options, value) => (options.count = parseNumber(value, 'count')),
    '--seed': (options, value) => (options.startSeed = parseNumber(value, 'start-seed')),
    '--step': (options, value) => (options.step = parseNumber(value, 'step')),
    '--base-url': (options, value) => (options.baseUrl = value),
    '--output-dir': (options, value) => (options.outputDir = path.resolve(value)),
    '--frame-settle-ms': (options, value) =>
      (options.frameSettleMs = parseNumber(value, 'frame-settle-ms')),
    '--texture-size': (options, value) => (options.textureSize = parseTextureSizeArg(value)),
    '--camera-distance': (options, value) =>
      (options.camera.distance = parseRange(
        value,
        'camera-distance',
        CameraViewLimits.distance.min,
        CameraViewLimits.distance.max
      )),
    '--camera-elevation': (options, value) =>
      (options.camera.elevation = parseRange(
        value,
        'camera-elevation',
        CameraViewLimits.elevation.min,
        CameraViewLimits.elevation.max
      )),
    '--camera-azimuth': (options, value) =>
      (options.camera.azimuth = parseNumber(value, 'camera-azimuth')),
    '--camera-azimuth-step': (options, value) =>
      (options.cameraAzimuthStep = parseNumber(value, 'camera-azimuth-step')),
  }

function log(level: 'INFO' | 'ERROR', message: string) {
  const line = `[${new Date().toISOString()}] [${level}] ${message}`
  if (level === 'ERROR') console.error(line)
  else console.log(line)
}

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

    return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) }
  } finally {
    await file.close()
  }
}

function parseNumber(value: string, name: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${name}: ${value}`)
  return parsed
}

function getTimestamp() {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

function parseArgs<T, Section extends string>(
  config: GeneratorConfig<T, Section>,
  argv: string[]
): ScriptOptions<T> {
  const settingsCli = createSettingsCli(config.schema, {
    exclude: ['seed' as keyof T & string],
    aliases: config.aliases,
  })
  const options: ScriptOptions<T> = {
    count: 1,
    startSeed: 1,
    step: 1,
    overrides: {},
    baseUrl: DEFAULT_BASE_URL,
    outputDir: path.resolve(config.defaultOutputDir),
    frameSettleMs: 50,
    textureSize: DefaultTextureSize,
    exportTextures: false,
    camera: {},
    cameraAzimuthStep: 0,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    const raw = argv[i + 1]
    const next = raw !== undefined && config.normalizeValue ? config.normalizeValue(arg, raw) : raw

    if (settingsCli.tryParse(options.overrides, arg, next)) {
      i++
      continue
    }

    if (arg === '--export-textures') {
      options.exportTextures = true
      continue
    }

    if (arg === '--help') {
      console.log(
        [
          `Usage: npm run ${config.npmScript} -- [options]`,
          '',
          'Options:',
          '  --count <n>             Number of images to generate (default: 1)',
          '  --seed <n>              Starting seed value (default: 1)',
          '  --step <n>              Seed increment per image (default: 1)',
          '  Output: scene PNG by default; use --export-textures for texture maps only',
          '',
          'Settings (omitted settings keep their current UI value):',
          ...settingsCli.helpLines,
          '',
          `  --base-url <url>        App URL (default: ${DEFAULT_BASE_URL}#${config.routeHash})`,
          `  --output-dir <path>     Output directory (default: ${config.defaultOutputDir})`,
          '  --frame-settle-ms <n>   Delay after updates in ms (default: 50)',
          `  --texture-size <n>      Default for texture sizes when exporting (choices: ${TextureSizes.join(', ')}; default: ${DefaultTextureSize})`,
          `  --export-textures       Export ${config.textureExports.map((item) => item.menuItem.toLowerCase()).join(', ')} instead of a scene PNG`,
          '',
          'Camera (scene PNGs; omitted values keep the default view):',
          `  --camera-distance <n>   Zoom: distance from the body (${CameraViewLimits.distance.min} to ${CameraViewLimits.distance.max})`,
          `  --camera-elevation <n>  Degrees above (+) / below (-) the equator (${CameraViewLimits.elevation.min} to ${CameraViewLimits.elevation.max}; 90 = top-down)`,
          '  --camera-azimuth <n>    Degrees around the main axis (0 = front)',
          '  --camera-azimuth-step <n> Degrees added per image (e.g. --step 0 --count 36 --camera-azimuth-step 10 for a turntable)',
          '',
        ].join('\n')
      )
      process.exit(0)
    }

    const scriptFlag = SCRIPT_VALUE_FLAGS[arg]
    if (scriptFlag && next !== undefined) {
      scriptFlag(options, next)
      i++
      continue
    }

    if (arg.startsWith('--')) throw new Error(`Unknown option or missing value: ${arg}`)
  }

  if (!Number.isInteger(options.count) || options.count < 1) {
    throw new Error(`count must be a positive integer. Received: ${options.count}`)
  }

  return options
}

async function generate<T, Section extends string>(
  config: GeneratorConfig<T, Section>,
  options: ScriptOptions<T>
) {
  const runStartedAt = Date.now()
  const { schema } = config

  if (options.exportTextures) {
    for (const key of keysOfKind(schema, 'textureSize')) {
      options.overrides[key] ??= options.textureSize as T[typeof key]
    }
  }

  log('INFO', `${config.name} auto-generator starting`)
  log('INFO', `overrides={${describeOverrides(schema, options.overrides) || 'none'}}`)

  await mkdir(options.outputDir, { recursive: true })

  const browser = await firefox.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
  const page = await context.newPage()

  try {
    const pageUrl = new URL(options.baseUrl)
    if (!pageUrl.hash) pageUrl.hash = config.routeHash
    pageUrl.searchParams.set('automation', '1')
    log('INFO', `Opening ${pageUrl}`)
    await page.goto(pageUrl.toString(), { waitUntil: 'networkidle' })

    await page.locator('.controls').waitFor({ state: 'visible' })
    await page.locator(`#${settingControlId('seed')}`).waitFor({ state: 'visible' })
    await page.locator('.canvas-shell canvas').waitFor({ state: 'visible' })
    await assertAllSettingControlsPresent(page, schema)

    const exportMenu = page.locator('.export-split-menu')
    const exportMenuTrigger = page.locator('.export-split-trigger')
    const exportSceneButton = page.getByRole('button', { name: 'Export scene PNG', exact: true })

    // The app's export renders a fresh frame at a fixed size; raw canvas toDataURL can be empty.
    async function saveDownload(trigger: Locator, fileName: string) {
      const downloadPromise = page.waitForEvent('download')
      await trigger.click()
      const download = await downloadPromise
      const filePath = path.join(options.outputDir, fileName)
      await download.saveAs(filePath)
      const { width, height } = await readPngDimensions(filePath)
      log('INFO', `Wrote ${fileName} (${width}x${height})`)
    }

    async function saveTextureExport(menuItem: string, fileName: string) {
      const isMenuOpen = await exportMenu.evaluate((element) =>
        Boolean((element as { open?: unknown }).open)
      )
      if (!isMenuOpen) await exportMenuTrigger.click()
      const item = page.getByRole('menuitem', { name: menuItem, exact: true })
      await item.waitFor({ state: 'visible' })
      await saveDownload(item, fileName)
    }

    const overrides = withSectionsEnabled(schema, options.overrides) as Record<string, unknown>
    const runStamp = getTimestamp()
    const usesCamera = Object.keys(options.camera).length > 0 || options.cameraAzimuthStep !== 0

    for (let i = 0; i < options.count; i++) {
      const seed = options.startSeed + i * options.step
      log('INFO', `Preparing ${i + 1}/${options.count} with seed=${seed}`)
      await applySettings(page, i === 0 ? { ...overrides, seed } : { seed })

      let azimuthSuffix = ''
      if (usesCamera) {
        const azimuth =
          ((((options.camera.azimuth ?? 0) + i * options.cameraAzimuthStep) % 360) + 360) % 360
        await setCameraView(page, { ...options.camera, azimuth })
        azimuthSuffix = `-az${Math.round(azimuth).toString().padStart(3, '0')}`
      }
      await page.waitForTimeout(options.frameSettleMs)

      const baseName = `${config.name}-${runStamp}-seed-${seed.toString().padStart(6, '0')}${azimuthSuffix}`
      if (options.exportTextures) {
        for (const { menuItem, fileSuffix } of config.textureExports) {
          await saveTextureExport(menuItem, `${baseName}-${fileSuffix}.png`)
        }
      } else {
        await saveDownload(exportSceneButton, `${baseName}.png`)
      }
    }

    const outputKind = options.exportTextures ? 'texture set(s)' : 'scene image(s)'
    log('INFO', `Done. Generated ${options.count} ${outputKind} in ${options.outputDir}`)
    log('INFO', `Total elapsed time: ${((Date.now() - runStartedAt) / 1000).toFixed(2)}s`)
  } finally {
    await context.close()
    await browser.close()
  }
}

/** Parses `process.argv` and renders one image (or texture set) per seed through the app UI. */
export function runAutoGenerator<T, Section extends string>(config: GeneratorConfig<T, Section>) {
  Promise.resolve()
    .then(() => generate(config, parseArgs(config, process.argv.slice(2))))
    .catch((error) => {
      log('ERROR', error instanceof Error ? (error.stack ?? error.message) : String(error))
      process.exitCode = 1
    })
}
