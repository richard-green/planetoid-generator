<script lang="ts">
  import { T, useThrelte } from '@threlte/core'
  import { OrbitControls } from '@threlte/extras'
  import { onDestroy } from 'svelte'
  import {
    AdditiveBlending,
    BufferAttribute,
    BufferGeometry,
    Color,
    ShaderMaterial,
    Vector4,
  } from 'three'

  const STAR_COUNT = 90000
  const ARM_COUNT = 4
  const GALAXY_RADIUS = 18
  const DUST_CLOUD_COUNT = 600
  const DUST_PARTICLES_PER_CLOUD = 27
  const DUST_PARTICLE_COUNT = DUST_CLOUD_COUNT * DUST_PARTICLES_PER_CLOUD
  const DUST_REGION_COUNT = 24

  type Props = {
    haloStrength?: number
    armCount?: number
    armRotation?: number
    armSpread?: number
    armThickness?: number
    armDepth?: number
    coreDensity?: number
    coreRadius?: number
    coreDepth?: number
    diskFalloff?: number
  }

  let {
    haloStrength = 0.32,
    armCount = 4,
    armRotation = 0.62,
    armSpread = 0.28,
    armThickness = 1,
    armDepth = 0.12,
    coreDensity = 0.7,
    coreRadius = 4.7,
    coreDepth = 1.75,
    diskFalloff = 3.5,
  }: Props = $props()

  const { scene } = useThrelte()
  const geometry = new BufferGeometry()
  const dustGeometry = new BufferGeometry()
  const dustRegions = Array.from({ length: DUST_REGION_COUNT }, () => {
    const radius = Math.pow(Math.random(), 0.72) * GALAXY_RADIUS * 0.82
    const arm = Math.floor(Math.random() * ARM_COUNT) * ((Math.PI * 2) / ARM_COUNT)
    const angle = arm + radius * 0.62 + (Math.random() - 0.5) * 0.7

    return new Vector4(
      Math.cos(angle) * radius,
      Math.sin(angle) * radius,
      0.35 + Math.random() * 0.85,
      0.12 + Math.random() * 0.22
    )
  })
  const starMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      haloStrength: { value: 0.32 },
      dustRegions: { value: dustRegions },
    },
    vertexShader: `
      attribute vec3 color;
      varying vec3 vColor;
      varying float vDustAttenuation;
      uniform float haloStrength;
      uniform vec4 dustRegions[${DUST_REGION_COUNT}];

      void main() {
        vColor = color;
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
        vec4 galaxyCenterPosition = modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0);
        float behindGalaxyCenter = step(-galaxyCenterPosition.z, -modelViewPosition.z);
        vDustAttenuation = 1.0;

        for (int index = 0; index < ${DUST_REGION_COUNT}; index++) {
          vec4 region = dustRegions[index];
          vec2 delta = position.xz - region.xy;
          float influence = exp(-dot(delta, delta) / (2.0 * region.z * region.z));
          vDustAttenuation *= 1.0 - behindGalaxyCenter * region.w * influence;
        }

        gl_PointSize = 0.16 * (220.0 / -modelViewPosition.z) * (1.0 + haloStrength * 2.5);
        gl_Position = projectionMatrix * modelViewPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vDustAttenuation;
      uniform float haloStrength;

      void main() {
        float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
        if (distanceFromCenter > 0.5) discard;
        float radialFalloff = 1.0 - smoothstep(0.0, 0.5, distanceFromCenter);
        float core = pow(radialFalloff, 4.5);
        float halo = pow(radialFalloff, 0.7) * haloStrength * 0.42;
        float alpha = min(1.0, core + halo);
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(vColor, alpha * vDustAttenuation);
      }
    `,
  })

  $effect(() => {
    starMaterial.uniforms.haloStrength.value = haloStrength
  })
  const dustMaterial = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;

      void main() {
        vColor = color;
        vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (220.0 / -modelViewPosition.z);
        gl_Position = projectionMatrix * modelViewPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;

      void main() {
        float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
        float alpha = 1.0 - smoothstep(0.0, 0.5, distanceFromCenter);
        gl_FragColor = vec4(vColor, alpha * alpha * 0.12);
      }
    `,
  })
  const positions = new Float32Array(STAR_COUNT * 3)
  const colors = new Float32Array(STAR_COUNT * 3)
  const coreColor = new Color('#fff1ca')
  const outerColor = new Color('#79adff')
  const dustCoreColor = new Color('#b56b4b')
  const dustOuterColor = new Color('#537f94')
  const color = new Color()
  const positionAttribute = new BufferAttribute(positions, 3)
  const colorAttribute = new BufferAttribute(colors, 3)

  function populateStars() {
    for (let index = 0; index < STAR_COUNT; index += 1) {
      const offset = index * 3
      let radius = 0
      let angle = 0
      let density = 0

      do {
        radius = Math.sqrt(Math.random()) * GALAXY_RADIUS
        angle = Math.random() * Math.PI * 2
        const spiralWave = Math.sin(armCount * (angle - radius * armRotation)) * 0.5 + 0.5
        const armDensity = Math.pow(spiralWave, 1 / armThickness)
        const radialFalloff = 0.06 + 0.94 * Math.pow(1 - radius / GALAXY_RADIUS, diskFalloff)
        const diskDensity = (armSpread + armDensity * (1 - armSpread)) * radialFalloff
        const coreDensityContribution = coreDensity * Math.exp(-Math.pow(radius / coreRadius, 2))
        density = Math.min(1, diskDensity + coreDensityContribution)
      } while (Math.random() > density)

      const spread = (1 - radius / GALAXY_RADIUS) * 0.5
      const bulgeThickness = armDepth + coreDepth * Math.exp(-Math.pow(radius / coreRadius, 2))
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

    positionAttribute.needsUpdate = true
    colorAttribute.needsUpdate = true
  }

  geometry.setAttribute('position', positionAttribute)
  geometry.setAttribute('color', colorAttribute)
  geometry.computeBoundingSphere()

  $effect(() => {
    armCount
    armRotation
    armSpread
    armThickness
    armDepth
    coreDensity
    coreRadius
    coreDepth
    diskFalloff
    populateStars()
  })

  const dustPositions = new Float32Array(DUST_PARTICLE_COUNT * 3)
  const dustColors = new Float32Array(DUST_PARTICLE_COUNT * 3)
  const dustSizes = new Float32Array(DUST_PARTICLE_COUNT)

  for (let cloudIndex = 0; cloudIndex < DUST_CLOUD_COUNT; cloudIndex += 1) {
    const cloudRadius = Math.pow(Math.random(), 0.65) * GALAXY_RADIUS * 0.92
    const cloudArm = Math.floor(Math.random() * ARM_COUNT) * ((Math.PI * 2) / ARM_COUNT)
    const cloudAngle = cloudArm + cloudRadius * 0.62 + (Math.random() - 0.5) * 0.65
    const cloudSpread = 0.14 + Math.random() * 0.38
    const cloudX = Math.cos(cloudAngle) * cloudRadius
    const cloudZ = Math.sin(cloudAngle) * cloudRadius
    const cloudThickness = 0.16 + (1 - cloudRadius / GALAXY_RADIUS) * 0.48

    for (let particleIndex = 0; particleIndex < DUST_PARTICLES_PER_CLOUD; particleIndex += 1) {
      const index = cloudIndex * DUST_PARTICLES_PER_CLOUD + particleIndex
      const offset = index * 3
      const particleAngle = Math.random() * Math.PI * 2
      const particleRadius = Math.sqrt(Math.random()) * cloudSpread
      const verticalOffset =
        (Math.random() + Math.random() + Math.random() + Math.random() - 2) * cloudThickness

      dustPositions[offset] = cloudX + Math.cos(particleAngle) * particleRadius
      dustPositions[offset + 1] = verticalOffset
      dustPositions[offset + 2] = cloudZ + Math.sin(particleAngle) * particleRadius

      color.copy(dustCoreColor).lerp(dustOuterColor, cloudRadius / GALAXY_RADIUS)
      color.multiplyScalar(0.65 + Math.random() * 0.45)
      dustColors[offset] = color.r
      dustColors[offset + 1] = color.g
      dustColors[offset + 2] = color.b
      dustSizes[index] = 0.7 + Math.random() * 1.35
    }
  }

  dustGeometry.setAttribute('position', new BufferAttribute(dustPositions, 3))
  dustGeometry.setAttribute('color', new BufferAttribute(dustColors, 3))
  dustGeometry.setAttribute('size', new BufferAttribute(dustSizes, 1))
  dustGeometry.computeBoundingSphere()

  scene.background = new Color('#01030a')

  onDestroy(() => {
    geometry.dispose()
    starMaterial.dispose()
    dustGeometry.dispose()
    dustMaterial.dispose()
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

<T.Group rotation={[-0.36, 0.16, 0]}>
  <T.Points geometry={dustGeometry} material={dustMaterial} renderOrder={0} />
  <T.Points {geometry} material={starMaterial} renderOrder={1} />
</T.Group>
