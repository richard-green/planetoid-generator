import type { PlanetoidPaletteName } from './PlanetoidPalettes'

export type PlanetoidSettings = {
  autoRotate: boolean
  showDebugMeshes: boolean
  enableRidgesRifts: boolean
  enableVolcanoes: boolean
  seed: number
  palette: PlanetoidPaletteName
  surfaceTint: string
  colorScale: number
  tintShadowFloor: number
  swirliness: number
  craterCount: number
  craterStrength: number
  craterColorStrength: number
  volcanoCount: number
  volcanoScale: number
  volcanoStrength: number
  volcanoColorStrength: number
  ridgeColorWeight: number
  riftColorWeight: number
  craterRayStrength: number
  craterRayVisibility: number
  craterRayDensity: number
  craterRaySharpness: number
  craterRayLengthPower: number
  ridgeStrength: number
  ridgeScale: number
  ridgeSharpness: number
  riftStrength: number
  riftScale: number
  riftWidth: number
  riftSharpness: number
  ridgesRiftsBlend: number
  bumpTextureSize: number
  colorTextureSize: number
  bumpScale: number
  roughness: number
  metalness: number
  largeScale: number
  mediumScale: number
  smallScale: number
  triangleDetail: number
}

export type PlanetoidRangeValues = Pick<
  PlanetoidSettings,
  | 'seed'
  | 'colorScale'
  | 'tintShadowFloor'
  | 'swirliness'
  | 'craterCount'
  | 'craterStrength'
  | 'craterColorStrength'
  | 'volcanoCount'
  | 'volcanoScale'
  | 'volcanoStrength'
  | 'volcanoColorStrength'
  | 'ridgeColorWeight'
  | 'riftColorWeight'
  | 'craterRayStrength'
  | 'craterRayVisibility'
  | 'craterRayDensity'
  | 'craterRaySharpness'
  | 'craterRayLengthPower'
  | 'ridgeStrength'
  | 'ridgeScale'
  | 'ridgeSharpness'
  | 'riftStrength'
  | 'riftScale'
  | 'riftWidth'
  | 'riftSharpness'
  | 'ridgesRiftsBlend'
  | 'bumpTextureSize'
  | 'colorTextureSize'
  | 'bumpScale'
  | 'roughness'
  | 'metalness'
  | 'largeScale'
  | 'mediumScale'
  | 'smallScale'
  | 'triangleDetail'
>

export type PlanetoidRangeKey = keyof PlanetoidRangeValues

export const DefaultPlanetoidSettings: PlanetoidSettings = {
  autoRotate: false,
  showDebugMeshes: false,
  enableRidgesRifts: false,
  enableVolcanoes: false,
  seed: 1,
  palette: 'rocky',
  surfaceTint: '#fff',
  colorScale: 1,
  tintShadowFloor: 0.18,
  swirliness: 1,
  craterCount: 20,
  craterStrength: 5,
  craterColorStrength: 0.95,
  volcanoCount: 12,
  volcanoScale: 2,
  volcanoStrength: 2,
  volcanoColorStrength: 1.2,
  craterRayStrength: 2,
  craterRayVisibility: 1,
  craterRayDensity: 1,
  craterRaySharpness: 1,
  craterRayLengthPower: 2.8,
  ridgeStrength: 2,
  ridgeScale: 2.5,
  ridgeSharpness: 2.5,
  ridgeColorWeight: 0.1,
  ridgesRiftsBlend: 0.5,
  riftStrength: 0.75,
  riftScale: 1.5,
  riftWidth: 0.05,
  riftSharpness: 2,
  riftColorWeight: 0.25,
  bumpTextureSize: 1024,
  colorTextureSize: 1024,
  bumpScale: 2,
  roughness: 0.75,
  metalness: 0.4,
  largeScale: 0.4,
  mediumScale: 0.2,
  smallScale: 0.1,
  triangleDetail: 15,
}

export const PlanetoidRangeLabels: Record<PlanetoidRangeKey, string> = {
  seed: 'Seed',
  colorScale: 'Color scale',
  tintShadowFloor: 'Tint shadow floor',
  swirliness: 'Swirliness',
  craterCount: 'Crater count',
  craterStrength: 'Crater strength',
  craterColorStrength: 'Crater color',
  volcanoCount: 'Volcano count',
  volcanoScale: 'Volcano scale',
  volcanoStrength: 'Volcano strength',
  volcanoColorStrength: 'Volcano color',
  ridgeColorWeight: 'Ridge color weight',
  riftColorWeight: 'Rift color weight',
  craterRayStrength: 'Crater rays',
  craterRayVisibility: 'Ray visibility',
  craterRayDensity: 'Ray density',
  craterRaySharpness: 'Ray sharpness',
  craterRayLengthPower: 'Ray length power',
  ridgeStrength: 'Ridge strength',
  ridgeScale: 'Ridge scale',
  ridgeSharpness: 'Ridge sharpness',
  riftStrength: 'Rift strength',
  riftScale: 'Rift scale',
  riftWidth: 'Rift width',
  riftSharpness: 'Rift sharpness',
  ridgesRiftsBlend: 'Ridges/rifts blend',
  bumpTextureSize: 'Bump tex height',
  colorTextureSize: 'Color tex height',
  bumpScale: 'Bump scale',
  roughness: 'Roughness',
  metalness: 'Metalness',
  largeScale: 'Large-scale',
  mediumScale: 'Medium-scale',
  smallScale: 'Small-scale',
  triangleDetail: 'Triangle detail',
}

export const PlanetoidUiLabels = {
  seed: 'Seed',
  palette: 'Palette',
  surfaceTint: 'Surface tint',
  autoRotate: 'Auto-rotate planetoid',
  showDebugMeshes: 'Show debug meshes',
  sections: {
    craters: 'Craters',
    ridges: 'Ridges',
    rifts: 'Rifts',
    volcanoes: 'Volcanoes',
  },
} as const

export const MinValues: PlanetoidRangeValues = {
  seed: 0,
  colorScale: 0.0,
  tintShadowFloor: 0,
  swirliness: 0,
  craterCount: 0,
  craterStrength: 0,
  craterColorStrength: 0,
  volcanoCount: 0,
  volcanoScale: 0.35,
  volcanoStrength: 0,
  volcanoColorStrength: 0,
  ridgeColorWeight: 0,
  riftColorWeight: 0,
  craterRayStrength: 0,
  craterRayVisibility: 0,
  craterRayDensity: 0.3,
  craterRaySharpness: 0.5,
  craterRayLengthPower: 1,
  ridgeStrength: 0,
  ridgeScale: 0.5,
  ridgeSharpness: 0.5,
  riftStrength: 0,
  riftScale: 0.5,
  riftWidth: 0.01,
  riftSharpness: 0.5,
  ridgesRiftsBlend: 0,
  bumpTextureSize: 128,
  colorTextureSize: 64,
  bumpScale: 0,
  roughness: 0,
  metalness: 0,
  largeScale: 0,
  mediumScale: 0,
  smallScale: 0,
  triangleDetail: 1,
}

export const MaxValues: PlanetoidRangeValues = {
  seed: 999999,
  colorScale: 1,
  tintShadowFloor: 0.8,
  swirliness: 2,
  craterCount: 120,
  craterStrength: 10,
  craterColorStrength: 3,
  volcanoCount: 96,
  volcanoScale: 2.5,
  volcanoStrength: 3,
  volcanoColorStrength: 2.5,
  ridgeColorWeight: 4,
  riftColorWeight: 4,
  craterRayStrength: 6,
  craterRayVisibility: 4,
  craterRayDensity: 3,
  craterRaySharpness: 4,
  craterRayLengthPower: 5,
  ridgeStrength: 2,
  ridgeScale: 8,
  ridgeSharpness: 4,
  riftStrength: 2,
  riftScale: 12,
  riftWidth: 0.25,
  riftSharpness: 6,
  ridgesRiftsBlend: 1,
  bumpTextureSize: 2048,
  colorTextureSize: 1024,
  bumpScale: 10,
  roughness: 1,
  metalness: 1,
  largeScale: 2,
  mediumScale: 2,
  smallScale: 2,
  triangleDetail: 20,
}





