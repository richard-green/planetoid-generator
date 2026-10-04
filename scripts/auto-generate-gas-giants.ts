import { GasGiantSchema } from '../src/lib/components/Threlte/GasGiant/GasGiantSettings'
import { runAutoGenerator } from './lib/autoGenerate'

runAutoGenerator({
  name: 'gas-giant',
  npmScript: 'auto-generate-gas-giants',
  schema: GasGiantSchema,
  routeHash: '/giants',
  defaultOutputDir: 'public/generated/giants',
  textureExports: [
    { menuItem: 'Surface color map', fileSuffix: 'color' },
    { menuItem: 'Surface normal map', fileSuffix: 'normal' },
  ],
  aliases: { '--bump-scale': 'normalStrength' },
})
