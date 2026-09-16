import {
  BufferGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  MathUtils,
  Vector3,
} from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

function applySphericalUVs(geometry: BufferGeometry): void {
  const position = geometry.attributes.position
  const uv = new Float32Array(position.count * 2)
  const vertex = new Vector3()

  for (let index = 0; index < position.count; index += 3) {
    const coordinates = [0, 0, 0, 0, 0, 0]

    for (let vertexOffset = 0; vertexOffset < 3; vertexOffset += 1) {
      vertex.fromBufferAttribute(position, index + vertexOffset).normalize()
      coordinates[vertexOffset * 2] = 0.5 + Math.atan2(vertex.z, vertex.x) / (Math.PI * 2)
      coordinates[vertexOffset * 2 + 1] =
        0.5 - Math.asin(MathUtils.clamp(vertex.y, -1, 1)) / Math.PI
    }

    const maxU = Math.max(coordinates[0], coordinates[2], coordinates[4])
    const minU = Math.min(coordinates[0], coordinates[2], coordinates[4])

    if (maxU - minU > 0.5) {
      for (let vertexOffset = 0; vertexOffset < 3; vertexOffset += 1) {
        const uvIndex = vertexOffset * 2
        if (coordinates[uvIndex] < 0.5) coordinates[uvIndex] += 1
      }
    }

    for (let vertexOffset = 0; vertexOffset < 3; vertexOffset += 1) {
      const uvIndex = vertexOffset * 2
      const targetIndex = (index + vertexOffset) * 2
      uv[targetIndex] = coordinates[uvIndex]
      uv[targetIndex + 1] = coordinates[uvIndex + 1]
    }
  }

  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2))
}

export function createIcosphere(radius: number, detail: number): BufferGeometry {
  const indexedGeometry = new IcosahedronGeometry(radius, Math.max(0, Math.round(detail)))
  const rawGeometry = indexedGeometry.index ? indexedGeometry.toNonIndexed() : indexedGeometry

  if (indexedGeometry !== rawGeometry) indexedGeometry.dispose()

  applySphericalUVs(rawGeometry)
  const smoothGeometry = mergeVertices(rawGeometry)
  rawGeometry.dispose()

  return smoothGeometry
}
