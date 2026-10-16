import * as THREE from 'three'
import { starFragment, starVertex } from './shaders'

function seededRandom(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}

/** Three populations, three depth ranges, three draw calls. All buffers are immutable. */
export function createStars(pixelRatio: number) {
  const group = new THREE.Group()
  const random = seededRandom(1729)
  const counts = [2500, 520, 88]
  const layers = counts.map((count, layer) => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    const brightness = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      let x = (random() - 0.5) * 2.3
      let y = (random() - 0.5) * 2.3
      // Small asymmetrical associations, not a regularly spaced background pattern.
      if (layer === 0 && i % 7 === 0) {
        const angle = random() * Math.PI * 2
        const radius = Math.pow(random(), 1.8) * 0.21
        x = 0.68 + Math.cos(angle) * radius
        y = 0.66 + Math.sin(angle) * radius * 0.5
      }
      // Even the nearest stellar plane stays behind Vidyu's silhouette.
      const z = layer === 0 ? -60 - random() * 65 : layer === 1 ? -27 - random() * 30 : -13 - random() * 10
      positions.set([x, y, z], i * 3)
       const tint = random()
       const luminance = layer === 0
         ? 0.22 + Math.pow(random(), 2.3) * 0.98
         : layer === 1
           ? 0.32 + Math.pow(random(), 1.8) * 0.92
           : 0.52 + Math.pow(random(), 1.4) * 0.76
       colors.set(tint > 0.90 ? [0.54, 0.78, 1] : tint > 0.76 ? [1, 0.75, 0.54] : tint > 0.60 ? [0.80, 0.88, 1] : [0.95, 0.94, 0.90], i * 3)
       brightness[i] = luminance
       sizes[i] = layer === 0 ? 0.72 + luminance * 1.35 : layer === 1 ? 1.7 + luminance * 2.3 : 3.2 + luminance * 4.5
      phases[i] = random() * 60
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    geometry.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1))
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uPixelRatio: { value: pixelRatio }, uAspect: { value: 1 },
        uLayer: { value: layer }, uSpeed: { value: 0 }, uPointer: { value: new THREE.Vector2() },
      },
      vertexShader: starVertex, fragmentShader: starFragment,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    })
    const points = new THREE.Points(geometry, material)
    // Positions are expanded into their depth planes by the vertex shader.
    points.frustumCulled = false
    group.add(points)
    return points
  })
  return { group, layers, counts }
}
