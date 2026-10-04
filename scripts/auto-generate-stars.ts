import { StarSchema } from '../src/lib/components/Threlte/Star/StarSettings'
import { runAutoGenerator } from './lib/autoGenerate'

runAutoGenerator({
  name: 'star',
  npmScript: 'auto-generate-stars',
  schema: StarSchema,
  routeHash: '/stars',
  defaultOutputDir: 'public/generated/stars',
  textureExports: [{ menuItem: 'Surface color map', fileSuffix: 'color' }],
})
