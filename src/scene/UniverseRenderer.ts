import * as THREE from 'three'
import { frameClock } from '../animation/frameClock'
import type { FrameSubscription } from '../animation/frameClock'
import type { JourneyFrame } from '../navigation/useJourney'
import { getComposition } from './composition'
import { createMoons, createPlanet, keyLight } from './createPlanet'
import { createEnvironment } from './createEnvironment'
import { createStars } from './createStars'
import { nebulaFragment, screenVertex } from './shaders'

export interface SceneInteraction { highlighted: boolean; blocked: boolean }
interface RendererOptions {
  canvas: HTMLCanvasElement
  readJourney: () => JourneyFrame
  readInteraction: () => SceneInteraction
  getDestinationControl: () => HTMLButtonElement | null
  reducedMotion: boolean
  onFallback: () => void
  onReady: () => void
}

/** GPU ownership boundary. Continuous values stay out of React; one shared frame clock. */
export class UniverseRenderer {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private nebulaScene = new THREE.Scene()
  private nebulaTarget = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false, stencilBuffer: false })
  private camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200)
  private nebula: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private stars: ReturnType<typeof createStars>
  private planet: ReturnType<typeof createPlanet>
  private environment!: ReturnType<typeof createEnvironment>
  private moons!: ReturnType<typeof createMoons>
  private moonOrigins!: THREE.Vector3[]
  private moonOrbitA!: THREE.Vector3[]
  private moonOrbitB!: THREE.Vector3[]
  private moonOrbitAmplitude!: number[]
  private moonOrbitSpeed = [0.086, -0.058, 0.118]
  private moonSpinSpeed = [0.16, -0.105, 0.22]
  private moonOrbitPhase = [0.35, 2.2, 4.1]
  private resizeObserver: ResizeObserver
  private subscription: FrameSubscription
  private pointer = new THREE.Vector2()
  private smoothPointer = new THREE.Vector2()
  private arrivalCamera = new THREE.Vector3()
  private projectedPlanet = new THREE.Vector3()
  private galaxyOrigin = new THREE.Vector3()
  private asteroidWorldOrigins: THREE.Vector3[] = []
  private bounds = { left: 0, top: 0, width: 1, height: 1 }
  private controlPosition = new THREE.Vector2(-10000, -10000)
  private previousControl: HTMLButtonElement | null = null
  private controlSize = 0
  private time = 0
  private previous = 0
  private disposed = false
  private ready = false
  private portrait = false
  private mobile = false
  private pixelRatio = 1
  private sampleTime = 0
  private sampleFrames = 0
  private quality = 0
  private elapsed = 0
  private lastProgress = -1
  private lastNebulaTime = -1
  private focus = 0
  private lastFocus = -1
  private isContinuous = true

  constructor(private options: RendererOptions) {
    this.mobile = options.canvas.clientWidth < 760
    this.moons = createMoons(this.mobile)
    this.moonOrigins = this.moons.map(() => new THREE.Vector3())
    this.moonOrbitA = [
      new THREE.Vector3(0.92, 0.16, 0.30).normalize(),
      new THREE.Vector3(-0.54, 0.74, 0.40).normalize(),
      new THREE.Vector3(0.34, -0.42, 0.84).normalize(),
    ]
    this.moonOrbitB = [
      new THREE.Vector3(-0.24, 0.92, 0.18).normalize(),
      new THREE.Vector3(0.76, 0.28, -0.58).normalize(),
      new THREE.Vector3(-0.82, 0.31, 0.42).normalize(),
    ]
    this.moonOrbitAmplitude = [0.12, 0.16, 0.095]
    this.renderer = new THREE.WebGLRenderer({ canvas: options.canvas, antialias: false, powerPreference: 'default' })
    this.renderer.setClearColor('#05060b')
    this.nebula = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      vertexShader: screenVertex, fragmentShader: nebulaFragment,
      uniforms: {
        uTime: { value: 0 }, uAspect: { value: 1 }, uTravel: { value: 0 }, uFlightSpeed: { value: 0 },
        uPortrait: { value: 0 }, uPointer: { value: this.smoothPointer },
      },
      depthWrite: false, depthTest: false,
    }))
    this.nebula.frustumCulled = false
    this.nebulaScene.add(this.nebula)
    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      vertexShader: screenVertex,
      fragmentShader: 'uniform sampler2D uNebula; varying vec2 vUv; void main() { gl_FragColor = texture2D(uNebula, vUv); }',
      uniforms: { uNebula: { value: this.nebulaTarget.texture } },
      depthWrite: false, depthTest: false,
    }))
    backdrop.frustumCulled = false
    backdrop.renderOrder = -100
    this.scene.add(backdrop)
    this.environment = createEnvironment(this.mobile)
    this.stars = createStars(this.pixelRatio)
    this.scene.add(this.environment.group, this.stars.group)
    this.planet = createPlanet(this.mobile)
    this.scene.add(this.planet.group, ...this.moons)
    this.resizeObserver = new ResizeObserver(this.resize)
    this.resizeObserver.observe(options.canvas)
    window.addEventListener('pointermove', this.onPointerMove, { passive: true })
    window.addEventListener('pointerup', this.resetPointer, { passive: true })
    window.addEventListener('pointercancel', this.resetPointer, { passive: true })
    document.documentElement.addEventListener('pointerleave', this.resetPointer)
    window.addEventListener('blur', this.resetPointer)
    window.addEventListener('scroll', this.updateBounds, { passive: true })
    options.canvas.addEventListener('webglcontextlost', this.onContextLost)
    this.resize()
    this.subscription = frameClock.subscribe(this.animate, !options.reducedMotion)
  }

  setReducedMotion(reducedMotion: boolean) {
    this.options.reducedMotion = reducedMotion
    if (reducedMotion) { this.pointer.set(0, 0); this.smoothPointer.set(0, 0) }
    this.lastProgress = -1
    this.lastNebulaTime = -1
    this.isContinuous = !reducedMotion
    this.subscription.setContinuous(!reducedMotion)
  }

  private updateBounds = () => {
    const rect = this.options.canvas.getBoundingClientRect()
    this.bounds.left = rect.left
    this.bounds.top = rect.top
  }

  private resize = () => {
    const { clientWidth: width, clientHeight: height } = this.options.canvas
    if (!width || !height || this.disposed) return
    this.bounds.width = width
    this.bounds.height = height
    this.updateBounds()
    this.mobile = width < 760
    const composition = getComposition(width, height)
    this.portrait = composition.portrait
    this.pixelRatio = this.quality > 0 ? 1 : Math.min(window.devicePixelRatio, this.mobile ? 1.35 : 1.6)
    this.renderer.setPixelRatio(this.pixelRatio)
    this.renderer.setSize(width, height, false)
    const scale = Math.min(this.quality > 0 ? 0.28 : 0.42, (this.mobile ? 340 : 480) / width)
    this.nebulaTarget.setSize(Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)))
    this.lastNebulaTime = -1
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.nebula.material.uniforms.uAspect.value = width / height
    this.nebula.material.uniforms.uPortrait.value = Number(this.portrait)
    this.environment.sun.material.uniforms.uPixelRatio.value = this.pixelRatio
    this.environment.galaxyPoints.material.uniforms.uPixelRatio.value = this.pixelRatio
    this.stars.layers.forEach((layer, index) => {
      layer.material.uniforms.uPixelRatio.value = this.pixelRatio
      layer.material.uniforms.uAspect.value = width / height
      const factor = (this.mobile ? 0.65 : 1) * (this.quality > 0 ? 0.65 : 1)
      layer.geometry.setDrawRange(0, Math.round(this.stars.counts[index] * factor))
    })
    const spanY = Math.tan(THREE.MathUtils.degToRad(21)) * 30 * 2
    const spanX = spanY * this.camera.aspect
    this.planet.group.position.set(spanX * (composition.x - 0.5), spanY * (0.5 - composition.y), -8)
    this.planet.group.scale.setScalar(spanY * composition.radius)
    this.planet.rings.material.uniforms.uPlanetRadius.value = this.planet.group.scale.x
      this.planet.material.uniforms.uPlanetCenter.value.copy(this.planet.group.position)
      this.planet.material.uniforms.uPlanetRadius.value = this.planet.group.scale.x
      this.planet.material.uniforms.uRingNormal.value.copy(this.planet.ringNormal)

    // The warm source is a real scene object and its direction also drives the planet/rings.
    this.environment.sunOrigin.set(-spanX * 0.18, spanY * 0.29, 8)
    this.environment.sun.position.copy(this.environment.sunOrigin)
    keyLight.copy(this.environment.sunOrigin).sub(this.planet.group.position).normalize()

    const galaxyDistance = 92
    const galaxySpanY = Math.tan(THREE.MathUtils.degToRad(21)) * galaxyDistance * 2
    const galaxySpanX = galaxySpanY * this.camera.aspect
    this.galaxyOrigin.set(galaxySpanX * 0.34, galaxySpanY * 0.19, -70)
    this.environment.galaxy.position.copy(this.galaxyOrigin)
    this.environment.asteroidOrigins.forEach((origin, index) => {
      const depth = 22 - origin.z
      const span = Math.tan(THREE.MathUtils.degToRad(21)) * depth * 2
      const worldOrigin = this.asteroidWorldOrigins[index] ?? new THREE.Vector3()
      worldOrigin.set(
        (origin.x - 0.5) * span * this.camera.aspect,
        (0.5 - origin.y) * span,
        origin.z,
      )
      this.asteroidWorldOrigins[index] = worldOrigin
      this.environment.asteroids[index].position.copy(worldOrigin)
    })
    const planetRadius = this.planet.group.scale.x
    this.arrivalCamera.set(
      this.planet.group.position.x - planetRadius * 0.08,
      this.planet.group.position.y + planetRadius * 0.06,
      -8 + planetRadius * 1.15,
    )
    const bodies = this.portrait
      ? [[0.16, composition.y + 0.04, -18, 0.022], [0.87, composition.y + 0.10, -1, 0.013], [0.82, 0.13, -35, 0.011]]
      : [[0.89, 0.21, -25, 0.026], [0.59, 0.67, -1, 0.029], [0.91, 0.73, -38, 0.017]]
    bodies.forEach(([x, y, z, radius], index) => {
      const span = Math.tan(THREE.MathUtils.degToRad(21)) * (22 - z) * 2
      this.moonOrigins[index].set((x - 0.5) * span * this.camera.aspect, (0.5 - y) * span, z)
      this.moons[index].position.copy(this.moonOrigins[index])
      this.moons[index].scale.setScalar(radius * span)
      this.moonOrbitAmplitude[index] = Math.min(0.22, Math.max(0.075, this.moons[index].scale.x * (index === 1 ? 0.19 : 0.15)))
      this.moons[index].visible = !(this.quality > 0 && this.mobile && index === 2)
    })
    this.controlSize = composition.radius * height * 2.12
    this.previousControl = null
    this.lastProgress = -1
    frameClock.invalidate()
  }

  private onPointerMove = (event: PointerEvent) => {
    if (this.options.reducedMotion || this.options.readInteraction().blocked || (event.pointerType !== 'mouse' && event.pointerType !== 'touch')) return
    const { left, top, width, height } = this.bounds
    this.pointer.set(
      THREE.MathUtils.clamp((event.clientX - left) / width * 2 - 1, -1, 1),
      THREE.MathUtils.clamp(1 - (event.clientY - top) / height * 2, -1, 1),
    )
  }

  private resetPointer = () => { this.pointer.set(0, 0) }

  private onContextLost = (event: Event) => {
    event.preventDefault()
    this.subscription.setContinuous(false)
    this.options.onFallback()
  }

  private animate = (now: number) => {
    if (this.disposed) return
    const rawDelta = this.previous ? (now - this.previous) / 1000 : 1 / 60
    const delta = Math.min(rawDelta, 0.1)
    const dampingDelta = Math.min(rawDelta, 0.25)
    this.previous = now
    // Long gaps are tab sleep, not evidence of a slow GPU.
    if (rawDelta < 1) this.elapsed += rawDelta
    const { progress, speed, phase } = this.options.readJourney()
    const interaction = this.options.readInteraction()
    if (interaction.blocked) this.pointer.set(0, 0)
    const reduced = this.options.reducedMotion
    const cameraProgress = reduced ? (progress > 0.5 ? 1 : 0) : progress

    if (phase === 'arrival' && cameraProgress >= 0.99) {
      // Planetary surface expedition is active; the universe canvas is 100% obscured.
      // Pause redundant 60 FPS multi-target WebGL rendering to eliminate GPU frame drops!
      if (this.isContinuous) {
        this.subscription.setContinuous(false)
        this.isContinuous = false
      }
      return
    }

    if (!reduced && !this.isContinuous) {
      this.subscription.setContinuous(true)
      this.isContinuous = true
    }

    const focusTarget = phase === 'gateway' && interaction.highlighted ? 1 : 0
    const changed = this.lastProgress !== cameraProgress || this.lastFocus !== focusTarget
    if (!reduced) this.time += delta

    if (!reduced || changed) {
      this.lastProgress = cameraProgress
      this.lastFocus = focusTarget
      this.smoothPointer.lerp(this.pointer, 1 - Math.exp(-dampingDelta * 3.7))
      this.focus = reduced ? focusTarget : THREE.MathUtils.damp(this.focus, focusTarget, 5, dampingDelta)
      const parallax = reduced ? 0 : (1 - speed * 0.8) * (1 - cameraProgress * 0.75)
      const px = this.smoothPointer.x * parallax
      const py = this.smoothPointer.y * parallax
      // Smoothly align with the planet and decelerate gently into orbit above its cloud deck
      const diveT = Math.min(1, cameraProgress / 0.94)
      // Gentle orbital deceleration curve: cameraProgress already starts smoothly from liftoff;
      // we use a gentle sinusoidal curve that glides gracefully into Vidyu World orbit without a sudden plunge.
      const diveEase = Math.sin(diveT * (Math.PI * 0.5))
      const alignT = Math.min(1, cameraProgress / 0.78)
      const alignEase = alignT * alignT * (3 - 2 * alignT)
      const orbitalArc = reduced ? 0 : Math.sin(diveT * Math.PI)
      const orbitalBank = reduced ? 0 : Math.sin(diveT * Math.PI) * 0.22
      this.camera.position.set(
        this.arrivalCamera.x * alignEase + px * 0.28,
        this.arrivalCamera.y * alignEase + py * 0.20 + orbitalArc * 0.12,
        22 + (this.arrivalCamera.z - 22) * diveEase,
      )
      this.camera.rotation.set(
        py * 0.006 - orbitalArc * 0.007,
        -px * 0.009,
        -orbitalBank * 0.012,
        'YXZ',
      )
      const fov = 42 + (reduced ? 0 : speed * 7.5)
      if (Math.abs(this.camera.fov - fov) > 0.005) { this.camera.fov = fov; this.camera.updateProjectionMatrix() }
      this.camera.updateMatrixWorld()
       this.nebula.material.uniforms.uTime.value = this.time
       this.nebula.material.uniforms.uTravel.value = cameraProgress
       this.nebula.material.uniforms.uFlightSpeed.value = reduced ? 0 : speed
      this.environment.sun.position.set(this.environment.sunOrigin.x + this.smoothPointer.x * 0.06, this.environment.sunOrigin.y + this.smoothPointer.y * 0.04, this.environment.sunOrigin.z)
      this.environment.galaxy.position.set(this.galaxyOrigin.x + this.smoothPointer.x * 0.018, this.galaxyOrigin.y + this.smoothPointer.y * 0.012, this.galaxyOrigin.z)
      this.environment.sun.material.uniforms.uTime.value = this.time
      this.environment.galaxyPlane.material.uniforms.uTime.value = this.time
      this.environment.galaxyPoints.material.uniforms.uTime.value = this.time
      this.environment.asteroids.forEach((asteroid, index) => {
        asteroid.position.copy(this.asteroidWorldOrigins[index])
        asteroid.position.x += this.smoothPointer.x * (0.11 + index * 0.014)
        asteroid.position.y += this.smoothPointer.y * (0.07 + index * 0.009)
        asteroid.rotation.y = this.time * (0.012 + index * 0.002) + index * 1.1
        asteroid.material.uniforms.uTime.value = this.time
      })
      this.stars.layers.forEach((layer) => {
        layer.material.uniforms.uTime.value = this.time
        layer.material.uniforms.uSpeed.value = reduced ? 0 : speed
        layer.material.uniforms.uPointer.value.copy(this.smoothPointer)
      })
      this.planet.material.uniforms.uFocus.value = this.focus
      this.planet.material.uniforms.uTime.value = this.time
      this.planet.atmosphere.material.uniforms.uFocus.value = this.focus
      this.planet.rings.material.uniforms.uTime.value = this.time
      // The atmosphere turns slowly on its own axis; the ring disk spins around
      // its fixed normal so its inclination never wobbles as it rotates.
      this.planet.body.rotation.y = this.time * 0.034
      this.planet.ringSpin.rotation.z = this.time * 0.018
      this.moons.forEach((moon, index) => {
        const orbitalTime = this.time * this.moonOrbitSpeed[index] + this.moonOrbitPhase[index]
        const orbitalWave = Math.sin(orbitalTime)
        const secondaryWave = Math.cos(orbitalTime * 0.71 + this.moonOrbitPhase[index])
        const amplitude = reduced ? 0 : this.moonOrbitAmplitude[index]
        moon.position.copy(this.moonOrigins[index])
        moon.position.addScaledVector(this.moonOrbitA[index], orbitalWave * amplitude)
        moon.position.addScaledVector(this.moonOrbitB[index], secondaryWave * amplitude * 0.56)
        moon.position.x += this.smoothPointer.x * (0.045 + index * 0.022)
        moon.position.y += this.smoothPointer.y * (0.032 + index * 0.016)
        moon.rotation.y = this.time * this.moonSpinSpeed[index]
        moon.rotation.x = Math.sin(this.time * 0.025 + this.moonOrbitPhase[index]) * 0.035
        moon.material.uniforms.uTime.value = this.time
      })

      const nebulaInterval = this.quality > 0 ? 1 / 15 : (cameraProgress > 0.3 ? 1 / 15 : 1 / 20)
      if (this.lastNebulaTime < 0 || this.time - this.lastNebulaTime >= nebulaInterval || (reduced && changed)) {
        this.renderer.setRenderTarget(this.nebulaTarget)
        this.renderer.render(this.nebulaScene, this.camera)
        this.renderer.setRenderTarget(null)
        this.lastNebulaTime = this.time
      }
      this.renderer.render(this.scene, this.camera)

      if (!this.ready) { this.ready = true; this.options.onReady() }
    }
    this.positionDestinationControl()

    if (!reduced && this.elapsed > 3 && rawDelta < 1) {
      this.sampleTime += rawDelta
      this.sampleFrames++
      if (this.sampleTime >= 5) {
        const fps = this.sampleFrames / this.sampleTime
        this.sampleFrames = 0
        this.sampleTime = 0
        if (fps < 27 && this.quality === 0) { this.quality = 1; this.resize() }
        else if (fps < 16 && this.quality > 0) {
          this.subscription.setContinuous(false)
          this.options.onFallback()
        }
      }
    }
  }

  private positionDestinationControl() {
    const control = this.options.getDestinationControl()
    if (!control) { this.previousControl = null; return }
    const fresh = control !== this.previousControl
    if (fresh) {
      control.style.left = '0'
      control.style.top = '0'
      control.style.width = `${this.controlSize}px`
      control.style.height = `${this.controlSize}px`
      this.previousControl = control
    }
    this.projectedPlanet.copy(this.planet.group.position).project(this.camera)
    const x = (this.projectedPlanet.x * 0.5 + 0.5) * this.bounds.width
    const y = (-this.projectedPlanet.y * 0.5 + 0.5) * this.bounds.height
    // One composited transform, only when the projection actually moves. No layout reads.
    if (fresh || Math.abs(x - this.controlPosition.x) + Math.abs(y - this.controlPosition.y) > 0.15) {
      this.controlPosition.set(x, y)
      control.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`
    }
  }

  dispose() {
    this.disposed = true
    this.options.getDestinationControl()?.removeAttribute('style')
    this.subscription.dispose()
    this.resizeObserver.disconnect()
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.resetPointer)
    window.removeEventListener('pointercancel', this.resetPointer)
    document.documentElement.removeEventListener('pointerleave', this.resetPointer)
    window.removeEventListener('blur', this.resetPointer)
    window.removeEventListener('scroll', this.updateBounds)
    this.options.canvas.removeEventListener('webglcontextlost', this.onContextLost)
    // Moons share geometry. Dispose each unique GPU resource exactly once.
    const geometries = new Set<THREE.BufferGeometry>()
    const materials = new Set<THREE.Material>()
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
        geometries.add(object.geometry)
        const list = Array.isArray(object.material) ? object.material : [object.material]
        list.forEach((material: THREE.Material) => materials.add(material))
      }
    })
    geometries.forEach((geometry) => geometry.dispose())
    materials.forEach((material) => material.dispose())
    this.nebula.geometry.dispose()
    this.nebula.material.dispose()
    this.nebulaTarget.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }
}
