import { PerspectiveCamera, Vector2, type Camera, type Scene, type WebGLRenderer } from 'three'

export function downloadScenePng(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: Camera,
  fileName: string,
  size = 1200
) {
  const previousSize = renderer.getSize(new Vector2())
  const previousPixelRatio = renderer.getPixelRatio()
  const previousAspect = camera instanceof PerspectiveCamera ? camera.aspect : undefined

  try {
    renderer.setPixelRatio(1)
    renderer.setSize(size, size, false)

    if (camera instanceof PerspectiveCamera) {
      camera.aspect = 1
      camera.updateProjectionMatrix()
    }

    renderer.render(scene, camera)

    const link = document.createElement('a')
    link.href = renderer.domElement.toDataURL('image/png')
    link.download = fileName
    link.click()
    return true
  } finally {
    renderer.setPixelRatio(previousPixelRatio)
    renderer.setSize(previousSize.x, previousSize.y, false)

    if (camera instanceof PerspectiveCamera && previousAspect !== undefined) {
      camera.aspect = previousAspect
      camera.updateProjectionMatrix()
    }

    renderer.render(scene, camera)
  }
}
