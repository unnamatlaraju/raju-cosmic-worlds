import { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface EmberFarewell3DProps {
  reactionKey?: number
}

/**
 * EmberFarewell3D: Real-time 3D Three.js view of Ember,
 * the Cosmic Expedition Guide, waving goodbye with glowing visor eyes,
 * levitation ring, and cheerful animations.
 */
export function EmberFarewell3D({ reactionKey = 0 }: EmberFarewell3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const isExcitedRef = useRef(false)
  const excitedTimeRef = useRef(0)

  useEffect(() => {
    if (reactionKey > 0) {
      isExcitedRef.current = true
      excitedTimeRef.current = 0
    }
  }, [reactionKey])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const width = container.clientWidth || 240
    const height = container.clientHeight || 280

    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 50)
    camera.position.set(0, 0.865, 3.10)
    camera.lookAt(0, 0.865, 0)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.35
    container.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xfff7fb, 2.2)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffecd2, 2.6)
    dirLight.position.set(1.5, 3.0, 2.5)
    scene.add(dirLight)

    const cyanRim = new THREE.DirectionalLight(0x38bdf8, 3.5)
    cyanRim.position.set(-2.5, 1.8, -1.8)
    scene.add(cyanRim)

    const groundBounce = new THREE.DirectionalLight(0xf59e0b, 1.2)
    groundBounce.position.set(0, -2.0, 1.0)
    scene.add(groundBounce)

    // Materials
    const matGlossyWhite = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.12,
      metalness: 0.05,
    })
    const matCadetNavy = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.35,
    })
    const matCosmicOrange = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.2,
      metalness: 0.25,
      emissive: 0xc2410c,
      emissiveIntensity: 0.15,
    })
    const matSolarGold = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.18,
      metalness: 0.75,
    })
    const matSlateJoint = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.45,
      metalness: 0.2,
    })
    const matGlossyVisor = new THREE.MeshStandardMaterial({
      color: 0x020617,
      roughness: 0.04,
      metalness: 0.95,
    })
    const matEyeCyan = new THREE.MeshBasicMaterial({ color: 0x00f5ff })
    const matEyeGlow = new THREE.MeshBasicMaterial({
      color: 0x00d2ff,
      transparent: true,
      opacity: 0.35,
    })
    const matEyeSparkle = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const matSmileGlow = new THREE.MeshBasicMaterial({ color: 0x00f5ff })
    const matCoreCyan = new THREE.MeshBasicMaterial({ color: 0x22d3ee })

    // Character Root
    const characterRoot = new THREE.Group()
    characterRoot.position.set(0, 0, 0)
    scene.add(characterRoot)

    // Antigravity Ion Field Disk
    const fieldGeo = new THREE.RingGeometry(0.01, 0.45, 36)
    const fieldMat = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime;
        void main() {
          float dist = distance(vUv, vec2(0.5));
          float pulse = 0.85 + 0.15 * sin(uTime * 3.2);
          float alpha = smoothstep(0.48, 0.04, dist) * 0.42 * pulse;
          vec3 col = mix(vec3(0.98, 0.64, 0.18), vec3(0.22, 0.85, 0.95), smoothstep(0.42, 0.05, dist));
          gl_FragColor = vec4(col, alpha);
        }
      `,
      uniforms: { uTime: { value: 0 } },
    })
    const levitationField = new THREE.Mesh(fieldGeo, fieldMat)
    levitationField.rotation.x = -Math.PI / 2
    levitationField.position.y = 0.17
    characterRoot.add(levitationField)

    // Outer luminous levitation ring matching Astra's gravity pedestal
    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.38, 0.012, 12, 48),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.9,
        roughness: 0.2,
      })
    )
    outerRing.rotation.x = Math.PI / 2
    outerRing.position.y = 0.17
    characterRoot.add(outerRing)

    const innerDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.012, 32),
      matCadetNavy
    )
    innerDisc.position.y = 0.165
    characterRoot.add(innerDisc)

    // Waist / Hips
    const hips = new THREE.Group()
    hips.position.y = 0.58
    characterRoot.add(hips)

    const pelvisMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 20), matGlossyWhite)
    pelvisMesh.scale.set(1.05, 0.75, 0.95)
    hips.add(pelvisMesh)

    const flightBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.186, 0.186, 0.046, 24), matCadetNavy)
    hips.add(flightBelt)

    const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.048, 0.02), matSolarGold)
    beltBuckle.position.set(0, 0, 0.186)
    hips.add(beltBuckle)

    // Tailored Trousers & Cadet Boots
    const createLeg = (isRight: boolean) => {
      const leg = new THREE.Group()
      leg.position.set(isRight ? 0.10 : -0.10, -0.06, 0.02)
      hips.add(leg)

      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.038, 0.14, 12), matGlossyWhite)
      thigh.position.y = -0.07
      leg.add(thigh)

      const kneePad = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 12), matCadetNavy)
      kneePad.position.y = -0.14
      leg.add(kneePad)

      const calf = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.042, 0.14, 12), matGlossyWhite)
      calf.position.y = -0.21
      leg.add(calf)

      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.12), matCosmicOrange)
      boot.position.set(0, -0.28, 0.02)
      leg.add(boot)

      const bootSole = new THREE.Mesh(new THREE.BoxGeometry(0.074, 0.018, 0.124), matSolarGold)
      bootSole.position.set(0, -0.31, 0.02)
      leg.add(bootSole)

      return leg
    }
    const leftLeg = createLeg(false)
    const rightLeg = createLeg(true)
    leftLeg.rotation.x = 0.12
    rightLeg.rotation.x = -0.06

    // Torso & Vest
    const torso = new THREE.Group()
    torso.position.y = 0.12
    hips.add(torso)

    const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), matGlossyWhite)
    bodyMesh.scale.set(1.0, 1.18, 0.96)
    bodyMesh.position.y = 0.14
    torso.add(bodyMesh)

    const vestChest = new THREE.Mesh(
      new THREE.CylinderGeometry(0.21, 0.20, 0.24, 24, 1, false, -Math.PI * 0.44, Math.PI * 0.88),
      matCadetNavy
    )
    vestChest.position.set(0, 0.15, 0.02)
    torso.add(vestChest)

    const missionBadge = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.015), matSolarGold)
    missionBadge.rotation.z = Math.PI / 4
    missionBadge.position.set(0, 0.18, 0.205)
    torso.add(missionBadge)

    const heartCore = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 16), matCoreCyan)
    heartCore.position.set(0, 0.18, 0.215)
    torso.add(heartCore)

    // Neck & Head
    const neck = new THREE.Group()
    neck.position.y = 0.36
    torso.add(neck)

    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.06, 16), matSlateJoint)
    neckMesh.position.y = 0.03
    neck.add(neckMesh)

    const headGroup = new THREE.Group()
    headGroup.position.y = 0.14
    neck.add(headGroup)

    const headSkull = new THREE.Mesh(new THREE.SphereGeometry(0.33, 32, 32), matGlossyWhite)
    headGroup.add(headSkull)

    const crestStripe = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.015, 0.42), matSolarGold)
    crestStripe.position.set(0, 0.325, -0.05)
    crestStripe.rotation.x = -0.2
    headGroup.add(crestStripe)

    // Visor
    const visorGeo = new THREE.SphereGeometry(
      0.334,
      32,
      32,
      0.18 * Math.PI,
      0.64 * Math.PI,
      0.18 * Math.PI,
      0.58 * Math.PI
    )
    const visorScreen = new THREE.Mesh(visorGeo, matGlossyVisor)
    headGroup.add(visorScreen)

    const visorRim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.010, 16, 48), matSolarGold)
    visorRim.scale.set(1.08, 0.88, 1.0)
    visorRim.position.set(0, 0.03, 0.22)
    visorRim.rotation.x = 0.15
    headGroup.add(visorRim)

    // Cute Highlight Eyes
    const createEye = (isRight: boolean) => {
      const eyeRig = new THREE.Group()
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.14), matEyeGlow)
      halo.position.z = 0.001
      eyeRig.add(halo)

      const capsule = new THREE.Mesh(new THREE.CapsuleGeometry(0.044, 0.056, 16, 16), matEyeCyan)
      capsule.rotation.z = isRight ? -0.05 : 0.05
      capsule.position.z = 0.004
      eyeRig.add(capsule)

      const sparkle = new THREE.Mesh(new THREE.CircleGeometry(0.016, 16), matEyeSparkle)
      sparkle.position.set(0.015, 0.024, 0.008)
      eyeRig.add(sparkle)

      const brow = new THREE.Mesh(
        new THREE.RingGeometry(0.042, 0.050, 16, 1, 0, Math.PI * 0.55),
        matEyeCyan
      )
      brow.rotation.z = isRight ? Math.PI * 0.15 : Math.PI * 0.3
      brow.position.set(0, 0.068, 0.006)
      eyeRig.add(brow)

      return eyeRig
    }

    const leftEye = createEye(false)
    leftEye.position.set(-0.095, 0.045, 0.328)
    leftEye.rotation.y = -0.20
    headGroup.add(leftEye)

    const rightEye = createEye(true)
    rightEye.position.set(0.095, 0.045, 0.328)
    rightEye.rotation.y = 0.20
    headGroup.add(rightEye)

    // Smile on Visor
    const smileArc = new THREE.Mesh(
      new THREE.RingGeometry(0.035, 0.044, 16, 1, Math.PI * 0.15, Math.PI * 0.7),
      matSmileGlow
    )
    smileArc.rotation.z = Math.PI
    smileArc.position.set(0, -0.082, 0.325)
    headGroup.add(smileArc)

    // Antennae
    const createAntenna = (isRight: boolean) => {
      const cup = new THREE.Group()
      cup.position.set(isRight ? 0.34 : -0.34, 0.02, 0)
      const puck = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.035, 20), matCosmicOrange)
      puck.rotation.z = Math.PI / 2
      cup.add(puck)
      const ant = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.16, 0.04), matGlossyWhite)
      ant.position.set(isRight ? 0.02 : -0.02, 0.10, -0.02)
      ant.rotation.z = isRight ? -0.25 : 0.25
      cup.add(ant)
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 16), matEyeCyan)
      tip.position.set(isRight ? 0.04 : -0.04, 0.18, -0.02)
      cup.add(tip)
      return cup
    }
    headGroup.add(createAntenna(false))
    headGroup.add(createAntenna(true))

    // ── LEFT ARM (Complete anatomy: shoulder, bicep, elbow, forearm, cuff & hand) ──
    const leftArm = new THREE.Group()
    leftArm.position.set(-0.27, 0.22, 0.02)
    torso.add(leftArm)

    const leftShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), matCosmicOrange)
    leftArm.add(leftShoulder)

    const leftBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.036, 0.13, 16), matGlossyWhite)
    leftBicep.position.y = -0.075
    leftArm.add(leftBicep)

    const leftElbow = new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 16), matCadetNavy)
    leftElbow.position.y = -0.15
    leftArm.add(leftElbow)

    const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.040, 0.12, 16), matGlossyWhite)
    leftForearm.position.y = -0.22
    leftArm.add(leftForearm)

    const leftWristRing = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.018, 16), matSolarGold)
    leftWristRing.position.y = -0.28
    leftArm.add(leftWristRing)

    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.065, 0.026), matGlossyWhite)
    leftHand.position.y = -0.32
    leftArm.add(leftHand)

    leftArm.rotation.z = 0.12
    leftArm.rotation.x = -0.04

    // ── RIGHT ARM (WARMLY WAVING: Upper arm + Forearm + Astronaut Mitten Glove) ──
    const rightArmPivot = new THREE.Group()
    rightArmPivot.position.set(0.27, 0.22, 0.02)
    torso.add(rightArmPivot)

    const rightShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), matCosmicOrange)
    rightArmPivot.add(rightShoulder)

    const rightUpperArm = new THREE.Group()
    rightArmPivot.add(rightUpperArm)

    const rightBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.040, 0.036, 0.13, 16), matGlossyWhite)
    rightBicep.position.y = -0.075
    rightUpperArm.add(rightBicep)

    // Elbow joint
    const rightElbow = new THREE.Group()
    rightElbow.position.y = -0.15
    rightUpperArm.add(rightElbow)

    const rightElbowPad = new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 16), matCadetNavy)
    rightElbow.add(rightElbowPad)

    // Forearm angled upward beside cheek
    const rightForearm = new THREE.Group()
    rightElbow.add(rightForearm)

    const rightForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.040, 0.13, 16), matGlossyWhite)
    rightForearmMesh.position.y = -0.075
    rightForearm.add(rightForearmMesh)

    const rightWristRing = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.018, 16), matSolarGold)
    rightWristRing.position.y = -0.14
    rightForearm.add(rightWristRing)

    // Astronaut glove / mitten hand
    const rightHandGroup = new THREE.Group()
    rightHandGroup.position.y = -0.18
    rightForearm.add(rightHandGroup)

    const rightHandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.068, 0.026), matGlossyWhite)
    rightHandGroup.add(rightHandMesh)

    // Cute astronaut thumb
    const thumbMesh = new THREE.Mesh(new THREE.BoxGeometry(0.020, 0.032, 0.020), matGlossyWhite)
    thumbMesh.position.set(-0.034, 0.015, 0)
    thumbMesh.rotation.z = 0.35
    rightHandGroup.add(thumbMesh)

    // Glowing cyan palm communicator beacon
    const palmGlow = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.032, 16), matEyeCyan)
    palmGlow.rotation.x = Math.PI / 2
    palmGlow.position.set(0, 0, 0.005)
    rightHandGroup.add(palmGlow)

    // Pose: Upper arm reaches up & out, elbow brings forearm upright beside visor cheek
    rightArmPivot.rotation.z = 1.85
    rightArmPivot.rotation.x = 0.16
    rightElbow.rotation.z = 1.35
    rightElbow.rotation.x = 0.18

    // Ambient Cosmic Floating Sparkles (matching Astra's stardust)
    const sparkleCount = 28
    const sparkleGeo = new THREE.BufferGeometry()
    const sparklePositions = new Float32Array(sparkleCount * 3)
    const sparkleVelocities: { x: number; y: number; z: number; phase: number }[] = []

    for (let i = 0; i < sparkleCount; i++) {
      const i3 = i * 3
      sparklePositions[i3] = (Math.random() - 0.5) * 1.3
      sparklePositions[i3 + 1] = 0.18 + Math.random() * 1.4
      sparklePositions[i3 + 2] = (Math.random() - 0.5) * 0.9
      sparkleVelocities.push({
        x: (Math.random() - 0.5) * 0.03,
        y: 0.08 + Math.random() * 0.12,
        z: (Math.random() - 0.5) * 0.03,
        phase: Math.random() * Math.PI * 2,
      })
    }
    sparkleGeo.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3))

    const sparkleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.032,
      transparent: true,
      opacity: 0.70,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const sparkles = new THREE.Points(sparkleGeo, sparkleMat)
    scene.add(sparkles)

    // Animation Loop
    let animId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      const t = clock.getElapsedTime()

      // Handle excitation boost
      if (isExcitedRef.current) {
        excitedTimeRef.current += delta
        if (excitedTimeRef.current > 2.5) {
          isExcitedRef.current = false
        }
      }

      const waveSpeed = isExcitedRef.current ? 12 : 8.0
      const floatAmp = 0.035

      // Gentle floating levitation
      characterRoot.position.y = Math.sin(t * 2.8) * floatAmp
      fieldMat.uniforms.uTime.value = t

      // Playful head tilt & nod
      headGroup.rotation.z = Math.sin(t * 2.2) * 0.05
      headGroup.rotation.y = Math.sin(t * 1.8) * 0.06
      headGroup.rotation.x = -0.02 + Math.sin(t * 3.0) * 0.02

      // Energetic wave animation of the right forearm & hand
      const wave = Math.sin(t * waveSpeed) * 0.35
      rightForearm.rotation.z = wave
      rightHandGroup.rotation.z = wave * 0.4
      rightArmPivot.rotation.z = 1.85 + Math.sin(t * 2.0) * 0.04

      // Left arm slight gentle sway
      leftArm.rotation.z = 0.12 + Math.sin(t * 2.0) * 0.04
      leftArm.rotation.x = -0.04 + Math.cos(t * 2.0) * 0.03

      // Heart reactor pulse
      heartCore.scale.setScalar(1.0 + Math.sin(t * 4.0) * 0.18)

      // Sparkles upward drift
      const posArr = sparkleGeo.attributes.position.array as Float32Array
      for (let i = 0; i < sparkleCount; i++) {
        const i3 = i * 3
        posArr[i3 + 1] += sparkleVelocities[i].y * delta
        if (posArr[i3 + 1] > 1.65) {
          posArr[i3 + 1] = 0.18
        }
        posArr[i3] += Math.sin(t * 2.0 + sparkleVelocities[i].phase) * 0.001
      }
      sparkleGeo.attributes.position.needsUpdate = true

      renderer.render(scene, camera)
    }

    animate()

    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth || 240
      const h = container.clientHeight || 280
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      sparkleGeo.dispose()
      sparkleMat.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      className="ember-farewell-viewport"
      aria-label="3D Ember Companion waving goodbye"
      style={{ width: '100%', height: '100%' }}
    />
  )
}
