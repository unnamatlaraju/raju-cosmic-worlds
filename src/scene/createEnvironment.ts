import * as THREE from 'three'
import { createSurface, keyLight } from './createPlanet'
import {
  galaxyPlaneFragment,
  galaxyPlaneVertex,
  galaxyPointFragment,
  galaxyPointVertex,
  sunFragment,
  sunVertex,
} from './shaders'

function seededRandom(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}

export interface SpaceEnvironment {
  group: THREE.Group
  sun: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  sunOrigin: THREE.Vector3
  galaxy: THREE.Group
  galaxyPlane: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  galaxyPoints: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>
  asteroids: THREE.Mesh<THREE.IcosahedronGeometry, THREE.ShaderMaterial>[]
  asteroidOrigins: THREE.Vector3[]
}

export function createEnvironment(mobile: boolean): SpaceEnvironment {
  const group = new THREE.Group()

  const sunGeometry = new THREE.BufferGeometry()
  sunGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3))
  sunGeometry.setAttribute('aSize', new THREE.Float32BufferAttribute([11.5], 1))
  const sunMaterial = new THREE.ShaderMaterial({
    vertexShader: sunVertex,
    fragmentShader: sunFragment,
    uniforms: { uPixelRatio: { value: 1 }, uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const sun = new THREE.Points(sunGeometry, sunMaterial)
  sun.frustumCulled = false
  group.add(sun)

  const galaxy = new THREE.Group()
  galaxy.rotation.z = -0.34
  const galaxyPlane = new THREE.Mesh(new THREE.PlaneGeometry(22, 15), new THREE.ShaderMaterial({
    vertexShader: galaxyPlaneVertex,
    fragmentShader: galaxyPlaneFragment,
    uniforms: { uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  }))
  galaxyPlane.renderOrder = -10
  galaxy.add(galaxyPlane)

  const random = seededRandom(918273)
  const count = mobile ? 560 : 1180
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const sizes = new Float32Array(count)
  const alphas = new Float32Array(count)
  const phases = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    const arm = i % 2
    const radius = Math.pow(random(), 0.58) * 9.2
    const angle = radius * 0.92 + arm * Math.PI + (random() - 0.5) * (0.17 + radius * 0.035)
    const scatter = (random() - 0.5) * (0.18 + radius * 0.075)
    positions[i * 3] = Math.cos(angle) * radius + Math.cos(angle + Math.PI * 0.5) * scatter
    positions[i * 3 + 1] = (Math.sin(angle) * radius + Math.sin(angle + Math.PI * 0.5) * scatter) * 0.56
    positions[i * 3 + 2] = (random() - 0.5) * (0.3 + radius * 0.09)
    const tint = random()
    colors.set(tint > 0.82 ? [0.48, 0.70, 1] : tint > 0.45 ? [0.68, 0.45, 0.95] : [1, 0.72, 0.82], i * 3)
    sizes[i] = 0.52 + random() * (radius < 2.4 ? 1.7 : 1.10)
    alphas[i] = 0.14 + random() * 0.52
    phases[i] = random() * 900.0
  }
  const galaxyGeometry = new THREE.BufferGeometry()
  galaxyGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  galaxyGeometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
  galaxyGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  galaxyGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))
  galaxyGeometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
  const galaxyMaterial = new THREE.ShaderMaterial({
    vertexShader: galaxyPointVertex,
    fragmentShader: galaxyPointFragment,
    uniforms: { uPixelRatio: { value: 1 }, uTime: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const galaxyPoints = new THREE.Points(galaxyGeometry, galaxyMaterial)
  galaxyPoints.frustumCulled = false
  galaxy.add(galaxyPoints)
  group.add(galaxy)

  const asteroidGeometry = new THREE.IcosahedronGeometry(1, 1)
  const asteroids: THREE.Mesh<THREE.IcosahedronGeometry, THREE.ShaderMaterial>[] = []
  const asteroidOrigins: THREE.Vector3[] = []
  const asteroidData = mobile
    ? [[0.05, 0.42, -23, 0.025], [0.92, 0.51, -30, 0.019], [0.78, 0.83, -18, 0.014]]
    : [[0.045, 0.39, -19, 0.047], [0.14, 0.33, -22, 0.029], [0.87, 0.53, -26, 0.037], [0.93, 0.68, -31, 0.026], [0.69, 0.82, -16, 0.022], [0.26, 0.76, -24, 0.018]]
  asteroidData.forEach(([x, y, z, radius], index) => {
    const material = createSurface(index % 2 ? '#211c2b' : '#35232c', index % 2 ? '#9e6c5d' : '#7d554b', 1, keyLight)
    const asteroid = new THREE.Mesh(asteroidGeometry, material)
    asteroid.scale.setScalar(radius)
    asteroid.rotation.set(index * 0.7, index * 1.1, index * 0.43)
    asteroids.push(asteroid)
    asteroidOrigins.push(new THREE.Vector3(x, y, z))
    group.add(asteroid)
  })

  return {
    group,
    sun,
    sunOrigin: new THREE.Vector3(),
    galaxy,
    galaxyPlane,
    galaxyPoints,
    asteroids,
    asteroidOrigins,
  }
}
