import { ShaderMaterial, type Material, type Object3D, type WebGLRenderer } from 'three'

type MaterialHolder = Object3D & { material: Material | Material[] }

function cloneProgramMaterial(material: Material) {
  if (!(material instanceof ShaderMaterial)) return material.clone()
  const source = Object.create(material) as ShaderMaterial
  source.uniforms = {}
  const clone = source.clone()
  clone.uniforms = material.uniforms
  return clone
}

export function retainShaderPrograms(renderer: WebGLRenderer, limit = 64) {
  const render = renderer.render.bind(renderer)
  const dispose = renderer.dispose.bind(renderer)
  const knownPrograms = new Set<string>()
  const entries: { materials: Material[]; keys: string[] }[] = []
  let materialCount = 0

  renderer.render = (scene, camera) => {
    render(scene, camera)
    const keys = (renderer.info.programs ?? [])
      .map((program) => program.cacheKey)
      .filter((key) => !knownPrograms.has(key))
    if (keys.length === 0) return

    const templates = new Map<Material, Material>()
    const holders: { object: MaterialHolder; material: Material | Material[] }[] = []
    function template(material: Material) {
      let clone = templates.get(material)
      if (!clone) {
        if (templates.size >= limit) return material
        clone = cloneProgramMaterial(material)
        clone.onBeforeCompile = material.onBeforeCompile
        clone.customProgramCacheKey = material.customProgramCacheKey
        templates.set(material, clone)
      }
      return clone
    }

    scene.traverse((object) => {
      const holder = object as MaterialHolder
      if (!holder.material) return
      holders.push({ object: holder, material: holder.material })
      holder.material = Array.isArray(holder.material)
        ? holder.material.map(template)
        : template(holder.material)
    })
    try {
      renderer.compile(scene, camera)
    } catch (error) {
      for (const material of templates.values()) material.dispose()
      throw error
    } finally {
      for (const { object, material } of holders) object.material = material
    }

    const materials = [...templates.values()]
    entries.push({ materials, keys })
    materialCount += materials.length
    for (const key of keys) knownPrograms.add(key)
    while (materialCount > limit && entries.length > 1) {
      const oldest = entries.shift()!
      for (const material of oldest.materials) material.dispose()
      for (const key of oldest.keys) knownPrograms.delete(key)
      materialCount -= oldest.materials.length
    }
  }

  renderer.dispose = () => {
    for (const entry of entries) {
      for (const material of entry.materials) material.dispose()
    }
    entries.length = 0
    knownPrograms.clear()
    materialCount = 0
    renderer.render = render
    dispose()
  }
  return renderer
}
