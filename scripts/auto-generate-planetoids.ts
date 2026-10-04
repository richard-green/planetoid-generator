import { PlanetoidSchema } from '../src/lib/components/Threlte/Planetoid/PlanetoidSettings'
import { runAutoGenerator } from './lib/autoGenerate'

runAutoGenerator({
  name: 'planetoid',
  npmScript: 'auto-generate-planetoids',
  schema: PlanetoidSchema,
  routeHash: '/planetoids',
  defaultOutputDir: 'public/generated/planetoid',
  textureExports: [
    { menuItem: 'Surface color map', fileSuffix: 'color' },
    { menuItem: 'Surface normal map', fileSuffix: 'normal' },
    { menuItem: 'Dust-cloud color map', fileSuffix: 'dust-cloud' },
    { menuItem: 'Dust-cloud normal map', fileSuffix: 'dust-cloud-normal' },
  ],
  aliases: { '--dust-cloud-style': 'dustCloudWeights' },
  // Accept the British spelling used by older commands.
  normalizeValue: (flag, value) =>
    flag === PlanetoidSchema.palette.cliFlag && value.toLowerCase() === 'oxidisedbasalt'
      ? 'oxidizedBasalt'
      : value,
})
