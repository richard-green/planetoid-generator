import { MathUtils, Spherical, Vector3, type Camera } from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/** Camera placement around the orbit target; omitted fields keep their current value. */
export type CameraView = {
  /** Distance from the target (zoom); clamped to the controls' min/max distance. */
  distance?: number
  /** Degrees above (+) or below (-) the equator; ±90 looks straight down/up the main axis. */
  elevation?: number
  /** Degrees around the main (Y) axis; 0 looks from the front (+Z). */
  azimuth?: number
}

export const CameraViewLimits = {
  distance: { min: 4, max: 14 },
  elevation: { min: -90, max: 90 },
} as const

export function applyCameraView(camera: Camera, controls: OrbitControls, view: CameraView) {
  const spherical = new Spherical().setFromVector3(camera.position.clone().sub(controls.target))

  if (view.distance !== undefined) {
    spherical.radius = MathUtils.clamp(view.distance, controls.minDistance, controls.maxDistance)
  }
  if (view.elevation !== undefined) spherical.phi = MathUtils.degToRad(90 - view.elevation)
  if (view.azimuth !== undefined) spherical.theta = MathUtils.degToRad(view.azimuth)
  spherical.makeSafe()

  camera.position.copy(controls.target).add(new Vector3().setFromSpherical(spherical))
  camera.lookAt(controls.target)
  controls.update()
}

export function readCameraView(camera: Camera, controls: OrbitControls): Required<CameraView> {
  const spherical = new Spherical().setFromVector3(camera.position.clone().sub(controls.target))
  return {
    distance: spherical.radius,
    elevation: 90 - MathUtils.radToDeg(spherical.phi),
    azimuth: (MathUtils.radToDeg(spherical.theta) + 360) % 360,
  }
}

/** `--camera-*` CLI flags for a view, rounded and clamped so the scripts accept them. */
export function cameraViewCliArgs(view: CameraView): string[] {
  const format = (value: number, digits: number) => String(Number(value.toFixed(digits)))
  const { distance: distanceLimits, elevation: elevationLimits } = CameraViewLimits
  const args: string[] = []

  if (view.distance !== undefined) {
    const distance = MathUtils.clamp(view.distance, distanceLimits.min, distanceLimits.max)
    args.push('--camera-distance', format(distance, 2))
  }
  if (view.elevation !== undefined) {
    const elevation = MathUtils.clamp(view.elevation, elevationLimits.min, elevationLimits.max)
    args.push('--camera-elevation', format(elevation, 1))
  }
  if (view.azimuth !== undefined) {
    args.push('--camera-azimuth', format(((view.azimuth % 360) + 360) % 360, 1))
  }

  return args
}
