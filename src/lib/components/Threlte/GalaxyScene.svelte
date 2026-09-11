<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { OrbitControls } from '@threlte/extras'
  import { onDestroy } from 'svelte'
  import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, PointsMaterial } from 'three'

  const STAR_COUNT = 90000
  const ARM_COUNT = 4
  const GALAXY_RADIUS = 18

  const { scene } = useThrelte()
  const geometry = new BufferGeometry()
  const material = new PointsMaterial({
    size: 0.08,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    blending: AdditiveBlending,
  })

  const positions = new Float32Array(STAR_COUNT * 3)
  const colors = new Float32Array(STAR_COUNT * 3)
  const coreColor = new Color('#fff1ca')
  const outerColor = new Color('#79adff')
  const color = new Color()

  for (let index = 0; index < STAR_COUNT; index += 1) {
    const offset = index * 3
    let radius = 0
    let angle = 0
    let density = 0

    do {
      radius = Math.sqrt(Math.random()) * GALAXY_RADIUS
      angle = Math.random() * Math.PI * 2
      const spiralWave = Math.sin(ARM_COUNT * (angle - radius * 0.62)) * 0.5 + 0.5
      const radialFalloff = 0.06 + 0.94 * Math.pow(1 - radius / GALAXY_RADIUS, 3.5)
      density = (0.28 + spiralWave * 0.72) * radialFalloff
    } while (Math.random() > density)

    const spread = (1 - radius / GALAXY_RADIUS) * 0.5
    const bulgeThickness = 0.12 + 1.75 * Math.exp(-Math.pow(radius / 4.7, 2))
    const verticalVariation = 0.8 + Math.random() * 0.4
    const verticalDistribution = Math.min(
      2.5,
      Math.sqrt(-2 * Math.log(Math.max(Math.random(), Number.EPSILON))) *
        Math.cos(Math.PI * 2 * Math.random())
    )

    positions[offset] = Math.cos(angle) * radius + (Math.random() - 0.5) * spread
    positions[offset + 1] = (verticalDistribution / 2.5) * bulgeThickness * verticalVariation
    positions[offset + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * spread

    color.copy(coreColor).lerp(outerColor, Math.min(1, radius / GALAXY_RADIUS))
    color.multiplyScalar(0.55 + Math.random() * 0.75)
    colors[offset] = color.r
    colors[offset + 1] = color.g
    colors[offset + 2] = color.b
  }

  geometry.setAttribute('position', new BufferAttribute(positions, 3))
  geometry.setAttribute('color', new BufferAttribute(colors, 3))
  geometry.computeBoundingSphere()
  scene.background = new Color('#01030a')

  onDestroy(() => {
    geometry.dispose()
    material.dispose()
    scene.background = null
  })
</script>

<T.PerspectiveCamera makeDefault position={[0, 14, 21]} fov={42}>
  <OrbitControls
    target={[0, 0, 0]}
    enableDamping={true}
    dampingFactor={0.12}
    minDistance={8}
    maxDistance={35}
    maxPolarAngle={Math.PI * 0.49}
  />
</T.PerspectiveCamera>

<T.Points {geometry} {material} rotation={[-0.36, 0.16, 0]} />
