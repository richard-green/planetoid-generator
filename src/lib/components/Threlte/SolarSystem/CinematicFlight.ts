import { Vector3 } from 'three'

export type FlightBody = {
  id: string
  center: Vector3
  radius: number
}

export type FlightSample = {
  position: Vector3
  target: Vector3
}

export type CinematicFlightOptions = {
  startPosition: Vector3
  startTarget: Vector3
  bodies: FlightBody[]
  sun: FlightBody
}

export type CinematicFlight = {
  totalDuration: number
  sample: (time: number, out: FlightSample) => void
}

const WORLD_UP = new Vector3(0, 1, 0)
const WORLD_RIGHT = new Vector3(1, 0, 0)

// Camera distance from a body centre, as a multiple of its framing radius.
const PLANET_ORBIT_ALTITUDE = 2.4
const SUN_ORBIT_ALTITUDE = 4.2

const PLANET_ORBIT_DURATION = 6
const SUN_APPROACH_DURATION = 7
const SUN_ORBIT_PERIOD = 48
// Seconds spent easing the final orbit up to its cruising angular rate.
const SUN_ORBIT_SPIN_UP = 6

const MIN_TRANSIT_DURATION = 2.5
const MAX_TRANSIT_DURATION = 7
const TRANSIT_UNITS_PER_SECOND = 9

type Segment = {
  duration: number
  sample: (t: number, out: FlightSample) => void
}

export function smootherstep(t: number): number {
  const x = Math.min(1, Math.max(0, t))
  return x * x * x * (x * (x * 6 - 15) + 10)
}

function cubicBezier(
  p0: Vector3,
  p1: Vector3,
  p2: Vector3,
  p3: Vector3,
  s: number,
  out: Vector3
): void {
  const inv = 1 - s
  const a = inv * inv * inv
  const b = 3 * inv * inv * s
  const c = 3 * inv * s * s
  const d = s * s * s

  out.set(
    a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    a * p0.y + b * p1.y + c * p2.y + d * p3.y,
    a * p0.z + b * p1.z + c * p2.z + d * p3.z
  )
}

function safeDirection(from: Vector3, to: Vector3, fallback: Vector3): Vector3 {
  const direction = new Vector3().subVectors(to, from)
  if (direction.lengthSq() < 1e-8) return fallback.clone()
  return direction.normalize()
}

/**
 * Builds the plane for a fly-around: `u` points back the way we arrived, and `v` is the
 * in-plane direction that leans towards the next destination, so leaving the orbit
 * tangentially at `v` already aims the camera at the next target.
 */
function orbitBasis(
  center: Vector3,
  arrivingFrom: Vector3,
  headingTowards: Vector3
): { u: Vector3; v: Vector3 } {
  const u = safeDirection(center, arrivingFrom, WORLD_UP)
  const onwards = safeDirection(center, headingTowards, WORLD_RIGHT)

  let normal = new Vector3().crossVectors(u, onwards)
  if (normal.lengthSq() < 1e-6) {
    normal = new Vector3().crossVectors(u, WORLD_UP)
  }
  if (normal.lengthSq() < 1e-6) {
    normal = new Vector3().crossVectors(u, WORLD_RIGHT)
  }
  normal.normalize()

  const v = new Vector3().crossVectors(normal, u).normalize()

  return { u, v }
}

function transitDuration(from: Vector3, to: Vector3): number {
  const seconds = from.distanceTo(to) / TRANSIT_UNITS_PER_SECOND
  return Math.min(MAX_TRANSIT_DURATION, Math.max(MIN_TRANSIT_DURATION, seconds))
}

function createTransit(
  from: Vector3,
  departTangent: Vector3,
  to: Vector3,
  arriveTangent: Vector3,
  lookFrom: Vector3,
  lookTo: Vector3,
  duration: number
): Segment {
  const handle = Math.max(from.distanceTo(to) * 0.35, 0.5)
  const control1 = from.clone().addScaledVector(departTangent, handle)
  const control2 = to.clone().addScaledVector(arriveTangent, -handle)
  const start = from.clone()
  const end = to.clone()
  const lookStart = lookFrom.clone()
  const lookEnd = lookTo.clone()

  return {
    duration,
    sample: (t, out) => {
      const s = smootherstep(t)
      cubicBezier(start, control1, control2, end, s, out.position)
      out.target.lerpVectors(lookStart, lookEnd, s)
    },
  }
}

function createOrbit(
  center: Vector3,
  u: Vector3,
  v: Vector3,
  altitude: number,
  duration: number
): Segment {
  const pivot = center.clone()
  const axisU = u.clone()
  const axisV = v.clone()

  return {
    duration,
    sample: (t, out) => {
      const angle = smootherstep(t) * Math.PI * 2
      out.position
        .copy(pivot)
        .addScaledVector(axisU, Math.cos(angle) * altitude)
        .addScaledVector(axisV, Math.sin(angle) * altitude)
      out.target.copy(pivot)
    },
  }
}

/**
 * Angle of a constant-rate orbit that eases up to speed over `rampSeconds`, so it picks up
 * from the stationary end of the approach without a visible jolt.
 * Uses the closed-form integral of smootherstep.
 */
function easedOrbitAngle(elapsed: number, rate: number, rampSeconds: number): number {
  if (elapsed >= rampSeconds) {
    return rate * (elapsed - rampSeconds * 0.5)
  }

  const x = Math.max(0, elapsed) / rampSeconds
  const integral = x ** 6 - 3 * x ** 5 + 2.5 * x ** 4
  return rate * rampSeconds * integral
}

export function createCinematicFlight(options: CinematicFlightOptions): CinematicFlight {
  const { startPosition, startTarget, bodies, sun } = options

  // Start at the outermost body and work inwards, so the sun is the finale.
  const itinerary = [...bodies].sort((a, b) => b.center.lengthSq() - a.center.lengthSq())

  const segments: Segment[] = []

  let cursor = startPosition.clone()
  let cursorTangent: Vector3 | undefined
  let lookCursor = startTarget.clone()

  for (let i = 0; i < itinerary.length; i++) {
    const body = itinerary[i]
    const onwards = itinerary[i + 1]?.center ?? sun.center
    const { u, v } = orbitBasis(body.center, cursor, onwards)
    const altitude = Math.max(body.radius * PLANET_ORBIT_ALTITUDE, 0.6)
    const entry = body.center.clone().addScaledVector(u, altitude)

    segments.push(
      createTransit(
        cursor,
        cursorTangent ?? safeDirection(cursor, entry, WORLD_RIGHT),
        entry,
        v,
        lookCursor,
        body.center,
        transitDuration(cursor, entry)
      )
    )

    segments.push(createOrbit(body.center, u, v, altitude, PLANET_ORBIT_DURATION))

    // A full revolution returns to the entry point, moving along the tangent that
    // already leans towards the next destination.
    cursor = entry
    cursorTangent = v
    lookCursor = body.center.clone()
  }

  // Final approach: settle into the ecliptic so the closing orbit sits level.
  const sunAltitude = Math.max(sun.radius * SUN_ORBIT_ALTITUDE, 1)
  const sunU = cursor.clone().sub(sun.center).setY(0)
  if (sunU.lengthSq() < 1e-6) sunU.copy(WORLD_RIGHT)
  sunU.normalize()
  const sunV = new Vector3().crossVectors(WORLD_UP, sunU).normalize()
  const sunEntry = sun.center.clone().addScaledVector(sunU, sunAltitude)

  segments.push(
    createTransit(
      cursor,
      cursorTangent ?? safeDirection(cursor, sunEntry, WORLD_RIGHT),
      sunEntry,
      sunV,
      lookCursor,
      sun.center,
      SUN_APPROACH_DURATION
    )
  )

  const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0)
  const sunCenter = sun.center.clone()
  const sunRate = (Math.PI * 2) / SUN_ORBIT_PERIOD

  return {
    totalDuration,
    sample: (time, out) => {
      if (time >= totalDuration) {
        const angle = easedOrbitAngle(time - totalDuration, sunRate, SUN_ORBIT_SPIN_UP)
        out.position
          .copy(sunCenter)
          .addScaledVector(sunU, Math.cos(angle) * sunAltitude)
          .addScaledVector(sunV, Math.sin(angle) * sunAltitude)
        out.target.copy(sunCenter)
        return
      }

      let remaining = Math.max(0, time)
      for (const segment of segments) {
        if (remaining < segment.duration) {
          segment.sample(remaining / segment.duration, out)
          return
        }
        remaining -= segment.duration
      }

      segments[segments.length - 1].sample(1, out)
    },
  }
}
