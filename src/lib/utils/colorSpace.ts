export function convertLinearRgbaToSrgb(pixels: Uint8Array): Uint8Array {
  for (let index = 0; index < pixels.length; index += 4) {
    for (let channel = 0; channel < 3; channel++) {
      const linear = Math.max(0, Math.min(1, pixels[index + channel] / 255))
      const srgb =
        linear <= 0.0031308 ? linear * 12.92 : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055
      pixels[index + channel] = Math.round(Math.max(0, Math.min(1, srgb)) * 255)
    }
  }

  return pixels
}