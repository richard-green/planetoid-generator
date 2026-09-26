import type { Palette } from '../../../types/palette'
import type { StarPaletteName } from './StarSettings'

// Palettes can use tightly grouped stops to create distinct bands and highlights.
export const StarPalettes: Record<StarPaletteName, Palette> = {
  White: [
    {
      r: 224,
      g: 235,
      b: 255,
      position: 0.38,
    },
    {
      r: 147,
      g: 217,
      b: 255,
      position: 0.42,
    },
    {
      r: 241,
      g: 249,
      b: 254,
      position: 0.47,
    },
    {
      r: 196,
      g: 232,
      b: 255,
      position: 0.77,
    },
    {
      r: 151,
      g: 214,
      b: 255,
      position: 0.81,
    },
    {
      r: 255,
      g: 255,
      b: 255,
      position: 0.84,
    },
  ],
  Blue: [
    {
      r: 147,
      g: 204,
      b: 255,
      position: 0.15,
    },
    {
      r: 0,
      g: 53,
      b: 193,
      position: 0.34,
    },
    {
      r: 190,
      g: 226,
      b: 255,
      position: 0.48,
    },
    {
      r: 38,
      g: 126,
      b: 255,
      position: 0.57,
    },
    {
      r: 221,
      g: 238,
      b: 255,
      position: 0.6,
    },
    {
      r: 26,
      g: 157,
      b: 255,
      position: 1,
    },
  ],
  Yellow: [
    { r: 112, g: 42, b: 1, position: 0.26 },
    { r: 238, g: 105, b: 3, position: 0.37 },
    { r: 255, g: 196, b: 24, position: 0.45 },
    { r: 255, g: 238, b: 112, position: 0.66 },
    { r: 255, g: 178, b: 12, position: 0.76 },
    { r: 255, g: 252, b: 218, position: 0.89 },
  ],
  Orange: [
    {
      r: 68,
      g: 4,
      b: 1,
      position: 0.15,
    },
    {
      r: 186,
      g: 20,
      b: 3,
      position: 0.29,
    },
    {
      r: 255,
      g: 78,
      b: 2,
      position: 0.44,
    },
    {
      r: 250,
      g: 163,
      b: 33,
      position: 0.55,
    },
    {
      r: 254,
      g: 100,
      b: 7,
      position: 0.77,
    },
    {
      r: 255,
      g: 255,
      b: 255,
      position: 0.91,
    },
  ],
  Red: [
    {
      r: 31,
      g: 1,
      b: 1,
      position: 0.18,
    },
    {
      r: 104,
      g: 2,
      b: 7,
      position: 0.39,
    },
    {
      r: 166,
      g: 8,
      b: 5,
      position: 0.52,
    },
    {
      r: 230,
      g: 41,
      b: 46,
      position: 0.61,
    },
    {
      r: 119,
      g: 0,
      b: 0,
      position: 0.74,
    },
    {
      r: 140,
      g: 0,
      b: 0,
      position: 0.9,
    },
  ],
}
