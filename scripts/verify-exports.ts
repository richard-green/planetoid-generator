import assert from 'node:assert/strict'
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { firefox, type Locator } from 'playwright'
import { DefaultValues as planetoidDefaults } from '../src/lib/components/Threlte/Planetoid/PlanetoidSettings'
import { DefaultValues as giantDefaults } from '../src/lib/components/Threlte/GasGiant/GasGiantSettings'
import { DefaultValues as starDefaults } from '../src/lib/components/Threlte/Star/StarSettings'
import { readPngDimensions } from './lib/autoGenerate'
import { applySettings } from './lib/settingsCli'

type TextureExport = {
  name: string
  menuItem: string
  width: number
  height: number
}

type VerificationItem = {
  name: string
  route: string
  defaults?: Record<string, unknown>
  textures: TextureExport[]
}

function texture(name: string, menuItem: string, size: number): TextureExport {
  return { name, menuItem, width: size * 2, height: size }
}

const items: VerificationItem[] = [
  {
    name: 'planetoid',
    route: '/planetoids',
    defaults: planetoidDefaults,
    textures: [
      texture('color', 'Surface color map', planetoidDefaults.colorTextureSize),
      texture('normal', 'Surface normal map', planetoidDefaults.normalTextureSize),
      texture('dust-cloud', 'Dust-cloud color map', planetoidDefaults.colorTextureSize),
      texture('dust-cloud-normal', 'Dust-cloud normal map', planetoidDefaults.normalTextureSize),
    ],
  },
  {
    name: 'gas-giant',
    route: '/giants',
    defaults: giantDefaults,
    textures: [
      texture('color', 'Surface color map', giantDefaults.colorTextureSize),
      texture('normal', 'Surface normal map', giantDefaults.normalTextureSize),
    ],
  },
  {
    name: 'star',
    route: '/stars',
    defaults: starDefaults,
    textures: [texture('color', 'Surface color map', starDefaults.colorTextureSize)],
  },
  { name: 'solar-system', route: '/system', textures: [] },
]

async function main() {
  const { values } = parseArgs({
    options: {
      'base-url': { type: 'string', default: 'http://127.0.0.1:5173/' },
      help: { type: 'boolean', default: false },
    },
  })
  if (values.help) {
    console.log('Usage: npm run verify:exports -- [--base-url http://127.0.0.1:5173/]')
    console.log('Requires the app to be running. Clears verify/ except .gitkeep before exporting.')
    return
  }

  const baseUrl = new URL(values['base-url'])
  const outputDir = fileURLToPath(new URL('../verify/', import.meta.url))
  await mkdir(outputDir, { recursive: true })
  for (const entry of await readdir(outputDir)) {
    if (entry !== '.gitkeep')
      await rm(path.join(outputDir, entry), { recursive: true, force: true })
  }
  await writeFile(path.join(outputDir, '.gitkeep'), '', { flag: 'a' })

  const browser = await firefox.launch({ headless: true })
  let verifiedCount = 0
  try {
    for (const item of items) {
      const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } })
      try {
        const page = await context.newPage()
        page.setDefaultTimeout(60_000)
        const errors: string[] = []
        page.on('pageerror', (error) => errors.push(error.message))
        const url = new URL(baseUrl)
        url.searchParams.set('automation', '1')
        url.hash = item.route
        console.log(`Verifying ${item.name} with default settings...`)
        await page.goto(url.toString(), { waitUntil: 'networkidle', timeout: 120_000 })
        await page.locator('.controls').waitFor({ state: 'visible' })
        await page.locator('.canvas-shell canvas').waitFor({ state: 'visible' })
        if (item.defaults) await applySettings(page, item.defaults)

        async function saveAndVerify(
          trigger: Locator,
          suffix: string,
          width: number,
          height: number
        ) {
          const fileName = `${item.name}-${suffix}.png`
          const [download] = await Promise.all([page.waitForEvent('download'), trigger.click()])
          const filePath = path.join(outputDir, fileName)
          await download.saveAs(filePath)
          assert.deepEqual(await readPngDimensions(filePath), { width, height }, fileName)
          assert.deepEqual(errors, [], `${item.name} browser errors`)
          verifiedCount++
          console.log(`  PASS ${fileName}: ${width}x${height}`)
        }

        await saveAndVerify(
          page.getByRole('button', { name: 'Export scene PNG', exact: true }),
          'scene',
          1200,
          1200
        )
        for (const map of item.textures) {
          const menu = page.locator('.export-split-menu')
          const isOpen = await menu.evaluate((element) =>
            Boolean((element as { open?: unknown }).open)
          )
          if (!isOpen) {
            await page.locator('.export-split-trigger').click()
          }
          await saveAndVerify(
            page.getByRole('menuitem', { name: map.menuItem, exact: true }),
            map.name,
            map.width,
            map.height
          )
        }
      } finally {
        await context.close()
      }
    }
    const expectedCount = items.reduce((count, item) => count + 1 + item.textures.length, 0)
    assert.equal(verifiedCount, expectedCount)
    assert.equal(
      (await readdir(outputDir)).filter((name) => name !== '.gitkeep').length,
      expectedCount
    )
    console.log(`Verified ${verifiedCount} PNGs across ${items.length} generators in ${outputDir}`)
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error)
  process.exitCode = 1
})
