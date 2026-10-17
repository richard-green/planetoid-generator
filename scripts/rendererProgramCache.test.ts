import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
} from 'three'
import type { Material, WebGLRenderer } from 'three'
import { retainShaderPrograms } from '../src/lib/utils/rendererProgramCache'

function createHarness(limit = 2) {
  const programs: { cacheKey: string }[] = []
  const compiled: Material[] = []
  const disposed: Material[] = []
  let failCompile = false
  let rendererDisposed = false
  const renderer = retainShaderPrograms(
    {
      info: { programs },
      render(scene: Scene) {
        scene.traverse((object) => {
          if (!(object instanceof Mesh)) return
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          for (const material of materials) {
            if (!programs.some((program) => program.cacheKey === material.name)) {
              programs.push({ cacheKey: material.name })
            }
          }
        })
      },
      compile(scene: Scene) {
        scene.traverse((object) => {
          if (!(object instanceof Mesh)) return
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          for (const material of materials) {
            compiled.push(material)
            material.addEventListener('dispose', () => disposed.push(material))
          }
        })
        if (failCompile) throw new Error('compile failed')
      },
      dispose() {
        rendererDisposed = true
      },
    } as unknown as WebGLRenderer,
    limit
  )
  return {
    renderer,
    compiled,
    disposed,
    fail: () => {
      failCompile = true
    },
    wasDisposed: () => rendererDisposed,
  }
}

function createScene(name: string) {
  const scene = new Scene()
  const material = new MeshBasicMaterial()
  material.name = name
  const mesh = new Mesh(new BoxGeometry(), material)
  scene.add(mesh)
  return { scene, mesh, material }
}

test('program cache restores live materials, reuses programs and disposes bounded templates', () => {
  const harness = createHarness()
  const camera = new PerspectiveCamera()
  const first = createScene('first')
  harness.renderer.render(first.scene, camera)
  assert.equal(first.mesh.material, first.material)
  assert.notEqual(harness.compiled[0], first.material)
  assert.equal(harness.compiled[0].onBeforeCompile, first.material.onBeforeCompile)
  assert.equal(harness.compiled[0].customProgramCacheKey, first.material.customProgramCacheKey)
  harness.renderer.render(first.scene, camera)
  assert.equal(harness.compiled.length, 1)
  harness.renderer.render(createScene('second').scene, camera)
  harness.renderer.render(createScene('third').scene, camera)
  assert.deepEqual(harness.disposed, [harness.compiled[0]])
  harness.renderer.dispose()
  assert.equal(harness.disposed.length, 3)
  assert.ok(harness.wasDisposed())
})

test('program cache restores materials and disposes templates when compilation fails', () => {
  const harness = createHarness()
  const { scene, mesh, material } = createScene('failure')
  harness.fail()
  assert.throws(() => harness.renderer.render(scene, new PerspectiveCamera()), /compile failed/)
  assert.equal(mesh.material, material)
  assert.deepEqual(harness.disposed, harness.compiled)
  harness.renderer.dispose()
})

test('program cache bounds retention for a large multi-material scene', () => {
  const harness = createHarness(2)
  const scene = new Scene()
  const materials = ['first', 'second', 'third'].map((name) => {
    const material = new MeshBasicMaterial()
    material.name = name
    return material
  })
  const mesh = new Mesh(new BoxGeometry(), materials)
  scene.add(mesh)
  harness.renderer.render(scene, new PerspectiveCamera())
  assert.equal(mesh.material, materials)
  assert.equal(harness.compiled[2], materials[2])
  harness.renderer.dispose()
  assert.equal(harness.disposed.length, 2)
  assert.ok(
    harness.disposed.every((material) => !materials.includes(material as MeshBasicMaterial))
  )
})

test('shader templates share uniforms without cloning render-target textures', () => {
  const harness = createHarness()
  const target = new WebGLRenderTarget(2, 2)
  const material = new ShaderMaterial({ uniforms: { map: { value: target.texture } } })
  const scene = new Scene()
  const mesh = new Mesh(new BoxGeometry(), material)
  scene.add(mesh)
  harness.renderer.render(scene, new PerspectiveCamera())
  const template = harness.compiled[0]
  assert.ok(template instanceof ShaderMaterial)
  assert.equal(template.uniforms, material.uniforms)
  assert.equal(template.uniforms.map.value, target.texture)
  assert.equal(mesh.material, material)
  harness.renderer.dispose()
  target.dispose()
})
