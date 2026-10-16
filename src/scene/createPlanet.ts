import * as THREE from 'three'
import { atmosphereFragment, gasGiantFragment, planetFragment, planetVertex, ringFragment, rockyBodyFragment } from './shaders'

export const keyLight = new THREE.Vector3(-0.78, 0.50, 0.33).normalize()

export function createSurface(base: string, high: string, rock = 0, light = keyLight, fragmentShader = planetFragment, seed = 0) {
  return new THREE.ShaderMaterial({
    vertexShader: planetVertex,
    fragmentShader,
    uniforms: {
      uLight: { value: light }, uBase: { value: new THREE.Color(base) },
      uHigh: { value: new THREE.Color(high) }, uRock: { value: rock }, uFocus: { value: 0 }, uTime: { value: 0 },
      uPlanetCenter: { value: new THREE.Vector3() }, uRingNormal: { value: new THREE.Vector3(0, 0, 1) },
      uPlanetRadius: { value: 1 },
      uSeed: { value: seed },
    },
  })
}

/** A dimensional destination marker; full environments remain a future-stage concern. */
export function createPlanet(mobile: boolean) {
  const group = new THREE.Group()
  // The shader owns the terminator, fill and rim; no post-processing is needed.
  const material = createSurface('#6c3540', '#f4d29e', 0, keyLight, gasGiantFragment)
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, mobile ? 56 : 96, mobile ? 40 : 64), material)
  body.rotation.z = -0.16
  group.add(body)

  const ringSystem = new THREE.Group()
  ringSystem.rotation.set(-1.19, 0.05, -0.38, 'ZXY')
  const ringSpin = new THREE.Group()
  const ringNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(ringSystem.quaternion).normalize()
  const rings = new THREE.Mesh(new THREE.RingGeometry(1.12, 2.38, mobile ? 160 : 256, mobile ? 18 : 28), new THREE.ShaderMaterial({
    vertexShader: planetVertex, fragmentShader: ringFragment,
    uniforms: {
      uPlanetCenter: { value: group.position }, uPlanetRadius: { value: 1 }, uLight: { value: keyLight },
      uRingNormal: { value: ringNormal }, uTime: { value: 0 },
    },
    transparent: true, side: THREE.DoubleSide, depthWrite: false,
  }))
  rings.renderOrder = 1
  ringSpin.add(rings)

  // A handful of broad, translucent lanes give the procedural disk enough optical
  // mass to read as Saturn's rings at a distance. The shader above supplies the
  // fine divisions and dust between these larger structures.
  const ringBands: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>[] = []
  const bandData: Array<[number, number, string, number]> = [
    [1.14, 1.175, '#f0bc72', 0.42], [1.205, 1.23, '#7e4a3f', 0.28],
    [1.27, 1.315, '#d68d4b', 0.37], [1.365, 1.395, '#f6d397', 0.45],
    [1.43, 1.455, '#69404a', 0.24], [1.50, 1.545, '#d9a86a', 0.36],
    [1.60, 1.64, '#f1c886', 0.46], [1.69, 1.735, '#75505f', 0.29],
    [1.79, 1.835, '#c17d4f', 0.34], [1.885, 1.91, '#f3c477', 0.49],
    [1.96, 2.025, '#866074', 0.27], [2.08, 2.14, '#d29a61', 0.35],
    [2.20, 2.24, '#f3cc8e', 0.44], [2.28, 2.35, '#684959', 0.25],
  ]
  bandData.forEach(([inner, outer, color, opacity]) => {
    const band = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, mobile ? 128 : 192),
      new THREE.MeshBasicMaterial({ color, opacity, transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }),
    )
    band.renderOrder = 2
    ringBands.push(band)
    ringSpin.add(band)
  })
  const dustRandom = (seed: number) => {
    const value = Math.sin(seed * 91.73) * 43758.5453
    return value - Math.floor(value)
  }
  const dustCount = mobile ? 180 : 360
  const dustPositions = new Float32Array(dustCount * 3)
  for (let i = 0; i < dustCount; i++) {
    const radius = 1.16 + dustRandom(i + 4.2) * 1.18
    const angle = i * 2.399963 + dustRandom(i + 11.8) * 0.42
    const clump = Math.sin(angle * 2.0) > 0.18 || i % 11 === 0
    const jitter = clump ? (dustRandom(i + 28.4) - 0.5) * 0.035 : (dustRandom(i + 31.2) - 0.5) * 0.008
    dustPositions[i * 3] = Math.cos(angle) * (radius + jitter)
    dustPositions[i * 3 + 1] = Math.sin(angle) * (radius + jitter)
    dustPositions[i * 3 + 2] = (dustRandom(i + 41.9) - 0.5) * 0.012
  }
  const ringDust = new THREE.Points(
    new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(dustPositions, 3)),
    new THREE.PointsMaterial({ color: '#f3c47f', size: mobile ? 0.028 : 0.034, sizeAttenuation: true, transparent: true, opacity: 0.68, depthWrite: false, blending: THREE.AdditiveBlending }),
  )
  ringDust.renderOrder = 3
  ringDust.frustumCulled = false
  ringSpin.add(ringDust)
  ringSystem.add(ringSpin)
  group.add(ringSystem)

  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.032, mobile ? 48 : 72, mobile ? 32 : 48), new THREE.ShaderMaterial({
    vertexShader: planetVertex, fragmentShader: atmosphereFragment,
    uniforms: { uLight: { value: keyLight }, uFocus: { value: 0 } },
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide,
  }))
  group.add(atmosphere)
  return { group, body, material, rings, ringBands, ringDust, ringSystem, ringSpin, ringNormal, atmosphere }
}

export function createMoons(mobile = false) {
  const geometry = new THREE.SphereGeometry(1, mobile ? 24 : 40, mobile ? 16 : 28)
  return [
    new THREE.Mesh(geometry, createSurface('#244d58', '#9bc9c3', 1, new THREE.Vector3(-0.9, 0.3, 0.28).normalize(), rockyBodyFragment, 0.73)),
    new THREE.Mesh(geometry, createSurface('#6b4632', '#d5a66d', 1, new THREE.Vector3(-0.72, 0.48, 0.34).normalize(), rockyBodyFragment, 1.91)),
    new THREE.Mesh(geometry, createSurface('#3f4b63', '#a1b2c9', 1, new THREE.Vector3(-0.8, 0.6, 0.09).normalize(), rockyBodyFragment, 3.17)),
  ]
}
