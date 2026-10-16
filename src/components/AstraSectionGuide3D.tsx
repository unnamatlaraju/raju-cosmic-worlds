import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { DestinationSection } from './DestinationDossier'

export type AstraActivity =
  | 'idle'
  | 'hi'
  | 'spin'
  | 'heart'
  | 'curtsy'
  | 'inspect'
  | 'coding_rage'
  | 'reading_book'
  | 'eureka'
  | 'holding_awards'

interface AstraSectionGuide3DProps {
  activeSection?: DestinationSection | null
  externalActivity?: AstraActivity | null
  triggerKey?: number
  speechOverride?: { text: string; icon: string } | null
  farewellMode?: boolean
}

// Smooth cubic easing helper
function smoothBlend(t: number, edge0: number, edge1: number): number {
  const x = Math.max(0, Math.min(1, (t - edge0) / (edge1 - edge0)))
  return x * x * (3 - 2 * x)
}

export function AstraSectionGuide3D({
  activeSection = 'projects',
  externalActivity = null,
  triggerKey = 0,
  speechOverride = null,
  farewellMode = false,
}: AstraSectionGuide3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })

  // Autonomous state & floating speech
  const [, setCurrentActivity] = useState<AstraActivity>('idle')
  const [speech, setSpeech] = useState<{ text: string; icon: string; visible: boolean }>({
    text: 'Hi Explorer! ✨',
    icon: '✦',
    visible: false,
  })

  // Ref to trigger activities imperatively inside render loop
  const triggerActivityRef = useRef<((act: AstraActivity) => void) | null>(null)

  // React to active section changes with contextual greeting & autonomous gesture
  useEffect(() => {
    if (!activeSection) return
    const sectionGreetings: Record<DestinationSection, { text: string; icon: string; act: AstraActivity }> = {
      education: { text: 'Academic Archive loaded! Opening Codex... 📖', icon: '📖', act: 'reading_book' },
      projects: { text: 'Hi Explorer! 👋 Welcome!', icon: '👋', act: 'hi' },
      skills: { text: 'Technical Arsenal & Architecture Matrix! ⚡', icon: '⚡', act: 'inspect' },
      vidyu: { text: 'Technical Arsenal & Architecture Matrix! ⚡', icon: '⚡', act: 'inspect' },
      achievements: { text: 'Viewing Verified Honors & Credentials! 🏆', icon: '🏆', act: 'holding_awards' },
    }
    const info = sectionGreetings[activeSection] || { text: 'Sector synchronized! ✨', icon: '✦', act: 'hi' }
    setSpeech({ text: info.text, icon: info.icon, visible: true })
    triggerActivityRef.current?.(info.act)

    const timer = setTimeout(() => {
      setSpeech((prev) => ({ ...prev, visible: false }))
    }, 3800)
    return () => clearTimeout(timer)
  }, [activeSection])

  // React to explicit external triggers from UI buttons or actions
  useEffect(() => {
    if (externalActivity) {
      triggerActivityRef.current?.(externalActivity)
    }
  }, [externalActivity, triggerKey])

  // React to speechOverride
  useEffect(() => {
    if (speechOverride) {
      setSpeech({ text: speechOverride.text, icon: speechOverride.icon, visible: true })
    }
  }, [speechOverride, triggerKey])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // 1. Scene, Camera & WebGL Renderer
    const scene = new THREE.Scene()
    const width = container.clientWidth || 260
    const height = container.clientHeight || 340

    // Tuned camera: perfectly frames Astra's full body from cat-ears to levitation pedestal
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 50)
    if (farewellMode) {
      camera.position.set(0, 0.08, 2.85)
      camera.lookAt(0, 0.06, 0)
    } else {
      camera.position.set(0, 0.16, 3.20)
      camera.lookAt(0, 0.12, 0)
    }

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.35
    container.appendChild(renderer.domElement)

    // 2. High-Tech Studio Lighting Scheme
    const ambientLight = new THREE.AmbientLight(0xfff7fb, 2.6)
    scene.add(ambientLight)

    // Warm Sun Key Light matching the canyon horizon
    const sunLight = new THREE.DirectionalLight(0xf59e0b, 3.8)
    sunLight.position.set(3.0, 2.2, -1.0)
    scene.add(sunLight)

    // Cyber Neon Cyan Rim Light (Left)
    const cyanRim = new THREE.DirectionalLight(0x00f5ff, 4.2)
    cyanRim.position.set(-3.0, 1.8, -1.4)
    scene.add(cyanRim)

    // Soft Studio Key Light (Front Center)
    const frontFill = new THREE.DirectionalLight(0xffffff, 2.4)
    frontFill.position.set(0.4, 1.8, 3.2)
    scene.add(frontFill)

    // Rose-Gold Warm Ground Bounce Light
    const bounceLight = new THREE.PointLight(0xffb5a0, 2.4, 6.0)
    bounceLight.position.set(0, -0.6, 1.0)
    scene.add(bounceLight)

    // 3. Materials
    const matSilkChassis = new THREE.MeshStandardMaterial({
      color: 0xf4f6fa,
      roughness: 0.18,
      metalness: 0.12,
    })

    const matObsidianArmor = new THREE.MeshStandardMaterial({
      color: 0x080c14,
      roughness: 0.22,
      metalness: 0.85,
    })

    const matRoseGold = new THREE.MeshStandardMaterial({
      color: 0xe2a87a,
      roughness: 0.22,
      metalness: 0.92,
    })

    const matSlateJoint = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.45,
      metalness: 0.60,
    })

    const matNeonCyan = new THREE.MeshStandardMaterial({
      color: 0x00f5ff,
      emissive: 0x00f5ff,
      emissiveIntensity: 0.95,
      roughness: 0.15,
    })


    const matVisorFaceplate = new THREE.MeshPhysicalMaterial({
      color: 0x030508,
      roughness: 0.05,
      metalness: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
    })

    const matWingHolo = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.65,
      roughness: 0.10,
      transmission: 0.65,
      thickness: 0.02,
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
    })

    const matEyeBase = new THREE.MeshBasicMaterial({ color: 0x00f5ff })
    const matEyeIris = new THREE.MeshBasicMaterial({ color: 0xa5f3fc })
    const matEyeHighlight = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const matBlushHolo = new THREE.MeshBasicMaterial({ color: 0xff6b9d, transparent: true, opacity: 0.78 })

    // 4. Character Hierarchical Rig
    // Scaled to 0.90 in farewellMode for balanced twin framing with head clearance, 0.76 in companion sidebar
    const characterRoot = new THREE.Group()
    characterRoot.scale.setScalar(farewellMode ? 0.90 : 0.76)
    scene.add(characterRoot)

    // ── A. FLOATING GRAVITY PEDESTAL ──
    const platform = new THREE.Group()
    platform.position.y = -0.58
    characterRoot.add(platform)

    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.012, 12, 48), matNeonCyan)
    outerRing.rotation.x = Math.PI / 2
    platform.add(outerRing)

    const midRing = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.009, 10, 36), matRoseGold)
    midRing.rotation.x = Math.PI / 2
    platform.add(midRing)

    const innerDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.015, 32), matObsidianArmor)
    platform.add(innerDisc)

    // ── B. HIPS, PELVIS & CYBER BELT ──
    const hips = new THREE.Group()
    hips.position.y = 0.02
    characterRoot.add(hips)

    const pelvicCore = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.095, 0.08, 24), matSilkChassis)
    pelvicCore.position.y = 0.01
    hips.add(pelvicCore)

    const cyberBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.035, 24), matObsidianArmor)
    cyberBelt.position.y = 0.05
    hips.add(cyberBelt)

    const beltBuckle = new THREE.Mesh(new THREE.OctahedronGeometry(0.018, 0), matRoseGold)
    beltBuckle.position.set(0, 0.05, 0.13)
    beltBuckle.rotation.y = Math.PI / 4
    hips.add(beltBuckle)

    const buckleGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.010, 0), matNeonCyan)
    buckleGem.position.set(0, 0.05, 0.138)
    hips.add(buckleGem)

    // ── C. FLARED 6-PANEL PEPLUM DRESS SKIRT ARMOR ──
    const skirtGroup = new THREE.Group()
    skirtGroup.position.set(0, 0.03, 0)
    hips.add(skirtGroup)

    const createSkirtPanel = (
      topW: number,
      botW: number,
      len: number,
      rotX: number,
      rotY: number,
      rotZ: number,
      posX: number,
      posZ: number,
      flairAngle: number = 0
    ) => {
      const panelGroup = new THREE.Group()
      panelGroup.position.set(posX, 0, posZ)
      panelGroup.rotation.set(rotX, rotY, rotZ + flairAngle)

      const shape = new THREE.Shape()
      shape.moveTo(-topW * 0.5, 0)
      shape.lineTo(topW * 0.5, 0)
      shape.lineTo(botW * 0.5, -len)
      shape.lineTo(-botW * 0.5, -len)
      shape.closePath()

      const panelMesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), matSilkChassis)
      panelMesh.castShadow = true
      panelGroup.add(panelMesh)

      const trimGeom = new THREE.BoxGeometry(botW * 0.98, 0.007, 0.005)
      const trimMesh = new THREE.Mesh(trimGeom, matRoseGold)
      trimMesh.position.set(0, -len + 0.004, 0.003)
      panelGroup.add(trimMesh)

      const neonPip = new THREE.Mesh(new THREE.CircleGeometry(0.0045, 12), matNeonCyan)
      neonPip.position.set(0, -len + 0.018, 0.004)
      panelGroup.add(neonPip)

      return panelGroup
    }

    const frontPanel = createSkirtPanel(0.09, 0.12, 0.11, 0.28, 0, 0, -0.04, 0.11)
    skirtGroup.add(frontPanel)

    const frontLeftFlap = createSkirtPanel(0.07, 0.10, 0.12, 0.24, -0.26, -0.08, -0.04, 0.08, 0.35)
    skirtGroup.add(frontLeftFlap)

    const frontRightFlap = createSkirtPanel(0.07, 0.10, 0.12, 0.24, 0.26, 0.08, -0.04, 0.08, -0.35)
    skirtGroup.add(frontRightFlap)

    const leftHipWing = createSkirtPanel(0.08, 0.12, 0.13, 0, -0.36, -0.12, -0.04, 0)
    skirtGroup.add(leftHipWing)

    const rightHipWing = createSkirtPanel(0.08, 0.12, 0.13, 0, 0.36, 0.12, -0.04, 0)
    skirtGroup.add(rightHipWing)

    const backPanel = createSkirtPanel(0.10, 0.14, 0.13, -0.32, 0, 0, -0.04, -0.11)
    skirtGroup.add(backPanel)

    // ── D. HOURGLASS CORSET & SCULPTED FEMININE TORSO ──
    const torso = new THREE.Group()
    torso.position.y = 0.08
    hips.add(torso)

    // Slender Articulated Mechanical Waist / Spine Joint
    const waistCore = new THREE.Mesh(new THREE.CylinderGeometry(0.078, 0.095, 0.09, 20), matSlateJoint)
    waistCore.position.y = 0.04
    torso.add(waistCore)

    // Spinal cyber rings
    for (let r = 0; r < 2; r++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.085 + r * 0.005, 0.006, 8, 20), matRoseGold)
      ring.rotation.x = Math.PI / 2
      ring.position.y = 0.025 + r * 0.035
      torso.add(ring)
    }

    // Sculpted Feminine Chest Shell
    const chestGroup = new THREE.Group()
    chestGroup.position.set(0, 0.16, 0)
    torso.add(chestGroup)

    // Contoured Bustier / Breastplate Pods
    const leftBustPod = new THREE.Mesh(new THREE.SphereGeometry(0.068, 20, 18), matSilkChassis)
    leftBustPod.scale.set(0.92, 0.95, 1.1)
    leftBustPod.position.set(-0.052, 0.015, 0.055)
    chestGroup.add(leftBustPod)

    const rightBustPod = new THREE.Mesh(new THREE.SphereGeometry(0.068, 20, 18), matSilkChassis)
    rightBustPod.scale.set(0.92, 0.95, 1.1)
    rightBustPod.position.set(0.052, 0.015, 0.055)
    chestGroup.add(rightBustPod)

    // Upper Rib Armor & Back Plate
    const ribArmor = new THREE.Mesh(new THREE.SphereGeometry(0.142, 24, 20), matSilkChassis)
    ribArmor.scale.set(0.92, 1.05, 0.82)
    ribArmor.position.set(0, 0.02, -0.01)
    chestGroup.add(ribArmor)

    // Symmetrical Sculpted Corset Underbust Band
    const corsetBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.126, 0.102, 0.065, 24, 1, false, -Math.PI * 0.5, Math.PI),
      matObsidianArmor
    )
    corsetBand.position.set(0, -0.035, 0.02)
    chestGroup.add(corsetBand)

    // Rose-Gold Underbust Piping Trim
    const underbustTrim = new THREE.Mesh(
      new THREE.TorusGeometry(0.110, 0.005, 8, 24, Math.PI * 0.9),
      matRoseGold
    )
    underbustTrim.rotation.x = Math.PI / 2
    underbustTrim.rotation.z = -Math.PI * 0.45
    underbustTrim.position.set(0, -0.005, 0.035)
    chestGroup.add(underbustTrim)

    // Sternum Cyber Heart / Diamond Reactor Core
    const heartCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.028, 0), matNeonCyan)
    heartCore.position.set(0, 0.022, 0.125)
    heartCore.rotation.y = Math.PI / 4
    chestGroup.add(heartCore)

    // Rose-Gold Faceted Core Frame
    const coreFrame = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.007, 10, 20), matRoseGold)
    coreFrame.position.set(0, 0.022, 0.12)
    chestGroup.add(coreFrame)

    // ── E. FLOATING ANGELIC / FAIRY STABILIZER WINGS (BACK) ──
    const wingsGroup = new THREE.Group()
    wingsGroup.position.set(0, 0.19, -0.11)
    torso.add(wingsGroup)

    const createFairyWing = (isRight: boolean) => {
      const side = isRight ? 1 : -1
      const wingArm = new THREE.Group()
      wingArm.position.set(side * 0.05, 0.02, 0)

      const pivot = new THREE.Mesh(new THREE.SphereGeometry(0.020, 12, 12), matRoseGold)
      wingArm.add(pivot)

      const shape = new THREE.Shape()
      shape.moveTo(0, 0)
      shape.quadraticCurveTo(side * 0.16, 0.22, side * 0.28, 0.19)
      shape.quadraticCurveTo(side * 0.24, 0.06, side * 0.13, -0.05)
      shape.quadraticCurveTo(side * 0.04, -0.04, 0, 0)

      const wingGeom = new THREE.ShapeGeometry(shape)
      const wingMesh = new THREE.Mesh(wingGeom, matWingHolo)
      wingMesh.rotation.y = -side * 0.22
      wingArm.add(wingMesh)

      const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.003, 0.30, 8), matNeonCyan)
      spine.position.set(side * 0.13, 0.10, 0)
      spine.rotation.z = -side * 0.95
      wingArm.add(spine)

      return wingArm
    }

    const leftWing = createFairyWing(false)
    const rightWing = createFairyWing(true)
    wingsGroup.add(leftWing)
    wingsGroup.add(rightWing)

    // ── F. SLENDER ANDROID NECK & CHOKER ──
    const headGroup = new THREE.Group()
    headGroup.scale.setScalar(0.86)
    headGroup.position.y = 0.33
    torso.add(headGroup)

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.056, 0.08, 18), matSilkChassis)
    neck.position.y = -0.03
    headGroup.add(neck)

    const choker = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.009, 10, 24), matRoseGold)
    choker.rotation.x = Math.PI / 2
    choker.position.y = -0.022
    headGroup.add(choker)

    const chokerPendant = new THREE.Mesh(new THREE.OctahedronGeometry(0.012, 0), matNeonCyan)
    chokerPendant.position.set(0, -0.022, 0.066)
    headGroup.add(chokerPendant)

    // ── G. SCULPTED CUTE ANIME ANDROID HEAD & VISOR SCREEN ──
    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.23, 32, 28), matSilkChassis)
    cranium.scale.set(0.98, 1.04, 0.94)
    cranium.position.set(0, 0.15, -0.02)
    headGroup.add(cranium)

    const faceplate = new THREE.Mesh(new THREE.SphereGeometry(0.215, 32, 24), matVisorFaceplate)
    faceplate.scale.set(0.95, 0.98, 0.65)
    faceplate.position.set(0, 0.145, 0.10)
    headGroup.add(faceplate)

    // Symmetrical Forehead Tiara Diadem
    const tiaraCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.16, 0.215, 0.145),
      new THREE.Vector3(-0.08, 0.235, 0.198),
      new THREE.Vector3(0, 0.245, 0.222),
      new THREE.Vector3(0.08, 0.235, 0.198)
    )
    const tiaraRightCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0.245, 0.222),
      new THREE.Vector3(0.08, 0.235, 0.198),
      new THREE.Vector3(0.12, 0.225, 0.175),
      new THREE.Vector3(0.16, 0.215, 0.145)
    )
    const tiaraTubeLeft = new THREE.Mesh(new THREE.TubeGeometry(tiaraCurve, 16, 0.007, 8, false), matRoseGold)
    const tiaraTubeRight = new THREE.Mesh(new THREE.TubeGeometry(tiaraRightCurve, 16, 0.007, 8, false), matRoseGold)
    headGroup.add(tiaraTubeLeft)
    headGroup.add(tiaraTubeRight)

    const foreheadGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.018, 0), matNeonCyan)
    foreheadGem.position.set(0, 0.245, 0.226)
    headGroup.add(foreheadGem)

    const gemBezel = new THREE.Mesh(new THREE.TorusGeometry(0.020, 0.004, 8, 16), matRoseGold)
    gemBezel.position.set(0, 0.245, 0.224)
    headGroup.add(gemBezel)

    // ── H. CUTE ANIME FACIAL FEATURES: BIG SOULFUL GLOWING EYES, BLUSH & SMILE ──
    const faceFeatures = new THREE.Group()
    faceFeatures.position.set(0, 0.142, 0.248)
    headGroup.add(faceFeatures)

    const createCuteAnimeEye = (isRight: boolean) => {
      const eyeGroup = new THREE.Group()
      const side = isRight ? 1 : -1
      eyeGroup.position.set(side * 0.076, 0.012, 0)

      // Cat-eye upper eyelash
      const lashCurve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(-side * 0.040, 0.048, 0.006),
        new THREE.Vector3(-side * 0.010, 0.064, 0.008),
        new THREE.Vector3(side * 0.036, 0.066, 0.010),
        new THREE.Vector3(side * 0.054, 0.074, 0.008)
      )
      const lashTube = new THREE.Mesh(new THREE.TubeGeometry(lashCurve, 14, 0.0065, 6, false), matObsidianArmor)
      eyeGroup.add(lashTube)

      const lashGold = new THREE.Mesh(new THREE.TubeGeometry(lashCurve, 14, 0.0022, 4, false), matRoseGold)
      lashGold.position.set(0, 0.003, 0.002)
      eyeGroup.add(lashGold)

      // Iris gradient
      const irisBase = new THREE.Mesh(new THREE.CircleGeometry(0.046, 28), matEyeBase)
      irisBase.scale.set(0.85, 1.25, 1.0)
      irisBase.rotation.z = -side * 0.06
      eyeGroup.add(irisBase)

      const irisCore = new THREE.Mesh(new THREE.CircleGeometry(0.036, 24), matEyeIris)
      irisCore.scale.set(0.82, 1.22, 1.0)
      irisCore.position.set(0, -0.003, 0.003)
      irisCore.rotation.z = -side * 0.06
      eyeGroup.add(irisCore)

      // Double sparkle catchlights (Star twinkling highlights)
      const starCatch = new THREE.Mesh(new THREE.CircleGeometry(0.013, 16), matEyeHighlight)
      starCatch.position.set(-side * 0.012, 0.020, 0.005)
      eyeGroup.add(starCatch)

      const subCatch = new THREE.Mesh(new THREE.CircleGeometry(0.006, 12), matEyeHighlight)
      subCatch.position.set(side * 0.012, -0.016, 0.005)
      eyeGroup.add(subCatch)

      return eyeGroup
    }

    const eyeLeft = createCuteAnimeEye(false)
    const eyeRight = createCuteAnimeEye(true)
    faceFeatures.add(eyeLeft)
    faceFeatures.add(eyeRight)

    // Glowing Pink Cheek Blushes with cyber hash marks
    const createCheekBlush = (isRight: boolean) => {
      const blushGroup = new THREE.Group()
      const side = isRight ? 1 : -1
      blushGroup.position.set(side * 0.098, -0.036, 0)

      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.026, 20), matBlushHolo)
      disc.scale.set(1.2, 0.65, 1.0)
      blushGroup.add(disc)

      // Cute cyber diagonal hatch stripes (///)
      for (let s = -1; s <= 1; s++) {
        const line = new THREE.Mesh(new THREE.PlaneGeometry(0.0035, 0.018), matEyeHighlight)
        line.position.set(s * 0.009, 0, 0.002)
        line.rotation.z = side * 0.35
        blushGroup.add(line)
      }
      return blushGroup
    }

    const blushLeft = createCheekBlush(false)
    const blushRight = createCheekBlush(true)
    faceFeatures.add(blushLeft)
    faceFeatures.add(blushRight)

    // Sweet Glowing Smile Curve
    const mouthCurve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.034, -0.052, 0),
      new THREE.Vector3(-0.014, -0.076, 0),
      new THREE.Vector3(0.014, -0.076, 0),
      new THREE.Vector3(0.034, -0.052, 0)
    )
    const mouthMesh = new THREE.Mesh(new THREE.TubeGeometry(mouthCurve, 16, 0.0038, 6, false), matNeonCyan)
    faceFeatures.add(mouthMesh)

    // ── I. PERKY MECHA CAT-EAR ANTENNAS ──
    const createCyberEar = (isRight: boolean) => {
      const earGroup = new THREE.Group()
      const side = isRight ? 1 : -1
      earGroup.position.set(side * 0.155, 0.32, 0.03)

      const earShell = new THREE.Mesh(new THREE.ConeGeometry(0.056, 0.16, 16), matSilkChassis)
      earShell.position.set(0, 0, 0)
      earShell.rotation.z = -side * 0.38
      earShell.rotation.x = 0.14
      earGroup.add(earShell)

      const earInner = new THREE.Mesh(new THREE.ConeGeometry(0.038, 0.13, 14), matNeonCyan)
      earInner.position.set(-side * 0.006, 0, 0.014)
      earInner.rotation.z = -side * 0.38
      earInner.rotation.x = 0.14
      earGroup.add(earInner)

      const baseRing = new THREE.Mesh(new THREE.TorusGeometry(0.040, 0.008, 10, 20), matRoseGold)
      baseRing.rotation.z = Math.PI / 2
      earGroup.add(baseRing)

      return earGroup
    }

    const earLeft = createCyberEar(false)
    const earRight = createCyberEar(true)
    headGroup.add(earLeft)
    headGroup.add(earRight)

    // ── J. STREAMLINED CYBER TWIN-TAILS (HAIR STABILIZERS) ──
    const createTwinTail = (isRight: boolean) => {
      const tailGroup = new THREE.Group()
      const side = isRight ? 1 : -1
      tailGroup.position.set(side * 0.20, 0.18, -0.07)

      const socket = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 14), matRoseGold)
      tailGroup.add(socket)

      const tailCurve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(side * 0.06, -0.14, -0.03),
        new THREE.Vector3(side * 0.08, -0.30, -0.01),
        new THREE.Vector3(side * 0.04, -0.42, 0.02)
      )
      const tailMesh = new THREE.Mesh(
        new THREE.TubeGeometry(tailCurve, 20, 0.020, 10, false),
        matSilkChassis
      )
      tailGroup.add(tailMesh)

      const tailNeon = new THREE.Mesh(
        new THREE.TubeGeometry(tailCurve, 20, 0.007, 8, false),
        matNeonCyan
      )
      tailNeon.position.set(side * 0.004, 0, 0.010)
      tailGroup.add(tailNeon)

      return tailGroup
    }

    const tailLeft = createTwinTail(false)
    const tailRight = createTwinTail(true)
    headGroup.add(tailLeft)
    headGroup.add(tailRight)

    // ── K. SLENDER ARTICULATED ARMS & EXPRESSIVE CYBERNETIC HANDS ──
    const createSlenderArm = (isRight: boolean) => {
      const side = isRight ? 1 : -1
      const armGroup = new THREE.Group()
      armGroup.position.set(side * 0.175, 0.20, 0)

      // Shoulder Cap & Gold Ring
      const shoulderCap = new THREE.Mesh(new THREE.SphereGeometry(0.046, 16, 16), matSilkChassis)
      shoulderCap.scale.set(0.95, 1.1, 0.95)
      armGroup.add(shoulderCap)

      const shoulderRing = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.007, 10, 20), matRoseGold)
      shoulderRing.rotation.y = Math.PI / 2
      armGroup.add(shoulderRing)

      // Upper arm / bicep
      const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.024, 0.12, 16), matSilkChassis)
      bicep.position.y = -0.075
      armGroup.add(bicep)

      // Articulated elbow joint
      const elbow = new THREE.Group()
      elbow.position.y = -0.14
      armGroup.add(elbow)

      const elbowJoint = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), matSlateJoint)
      elbow.add(elbowJoint)

      const elbowRing = new THREE.Mesh(new THREE.TorusGeometry(0.023, 0.005, 8, 16), matRoseGold)
      elbowRing.rotation.x = Math.PI / 2
      elbow.add(elbowRing)

      // Forearm & sleeve
      const forearm = new THREE.Group()
      forearm.position.y = -0.025
      elbow.add(forearm)

      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.12, 16), matSilkChassis)
      sleeve.position.y = -0.06
      forearm.add(sleeve)

      const wristBand = new THREE.Mesh(new THREE.TorusGeometry(0.027, 0.006, 10, 18), matNeonCyan)
      wristBand.rotation.x = Math.PI / 2
      wristBand.position.y = -0.115
      forearm.add(wristBand)

      // Expressive Cute Robotic Hand with open palm and glowing cyber fingertips!
      const handGroup = new THREE.Group()
      handGroup.position.y = -0.13
      forearm.add(handGroup)

      // Dainty porcelain palm
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.046, 0.016), matSilkChassis)
      palm.position.set(0, -0.014, 0)
      handGroup.add(palm)

      // Rose-gold palm backplate
      const palmBack = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.038, 0.005), matRoseGold)
      palmBack.position.set(0, -0.014, -0.009)
      handGroup.add(palmBack)

      // Glowing Cyan Palm Sensor (facing forward toward user +Z)
      const palmSensor = new THREE.Mesh(new THREE.CircleGeometry(0.011, 16), matNeonCyan)
      palmSensor.position.set(0, -0.014, 0.009)
      handGroup.add(palmSensor)

      // 4 Slender Cyber Fingers with glowing cyan fingertips
      const fingerData = [
        { x: -side * 0.014, len: 0.034 },
        { x: -side * 0.004, len: 0.040 },
        { x: side * 0.005, len: 0.036 },
        { x: side * 0.014, len: 0.030 },
      ]

      fingerData.forEach((f) => {
        const fingerMesh = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.0046, f.len - 0.008, 6, 8),
          matSilkChassis
        )
        fingerMesh.position.set(f.x, -0.034 - (f.len - 0.028) * 0.5, 0.001)
        handGroup.add(fingerMesh)

        // Glowing cyan fingertip
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.0048, 8, 8), matNeonCyan)
        tip.position.set(f.x, -0.034 - f.len + 0.005, 0.001)
        handGroup.add(tip)
      })

      // Articulated Thumb
      const thumbGroup = new THREE.Group()
      thumbGroup.position.set(side * 0.022, -0.010, 0.003)
      thumbGroup.rotation.z = side * 0.55
      thumbGroup.rotation.y = side * 0.25

      const thumbMesh = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.0048, 0.022, 6, 8),
        matSilkChassis
      )
      thumbMesh.position.set(0, -0.011, 0)
      thumbGroup.add(thumbMesh)

      const thumbTip = new THREE.Mesh(new THREE.SphereGeometry(0.0050, 8, 8), matNeonCyan)
      thumbTip.position.set(0, -0.023, 0)
      thumbGroup.add(thumbTip)

      handGroup.add(thumbGroup)

      return { armGroup, elbow, forearm, handGroup }
    }

    const leftArmRig = createSlenderArm(false)
    const rightArmRig = createSlenderArm(true)
    torso.add(leftArmRig.armGroup)
    torso.add(rightArmRig.armGroup)

    // Graceful initial resting posture
    leftArmRig.armGroup.rotation.z = 0.16
    leftArmRig.armGroup.rotation.x = 0.04
    leftArmRig.elbow.rotation.x = -0.18
    leftArmRig.elbow.rotation.z = -0.10

    rightArmRig.armGroup.rotation.z = -0.22
    rightArmRig.armGroup.rotation.x = -0.12
    rightArmRig.elbow.rotation.x = -0.60
    rightArmRig.elbow.rotation.z = 0.38
    rightArmRig.handGroup.rotation.z = -0.15

    // ── L. TAPERED SCULPTED LEGS & STYLISH HOVER BOOTS ──
    const createSlenderLeg = (isRight: boolean) => {
      const side = isRight ? 1 : -1
      const legGroup = new THREE.Group()
      legGroup.position.set(side * 0.065, -0.04, 0)

      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.030, 0.18, 18), matSilkChassis)
      thigh.position.y = -0.09
      legGroup.add(thigh)

      const thighSeam = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.17, 8), matRoseGold)
      thighSeam.position.set(side * 0.034, -0.09, 0)
      legGroup.add(thighSeam)

      const knee = new THREE.Group()
      knee.position.y = -0.18
      legGroup.add(knee)

      const kneeJoint = new THREE.Mesh(new THREE.SphereGeometry(0.026, 14, 14), matSlateJoint)
      knee.add(kneeJoint)

      const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 14), matObsidianArmor)
      kneeCap.position.set(0, 0, 0.016)
      knee.add(kneeCap)

      const kneeGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.012, 0), matNeonCyan)
      kneeGem.position.set(0, 0, 0.038)
      knee.add(kneeGem)

      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.18, 18), matSilkChassis)
      shin.position.y = -0.09
      knee.add(shin)

      const calfFin = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.12, 0.022), matObsidianArmor)
      calfFin.position.set(side * 0.030, -0.09, -0.014)
      knee.add(calfFin)

      const bootGroup = new THREE.Group()
      bootGroup.position.y = -0.185
      knee.add(bootGroup)

      const bootCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.034, 0.030, 18), matObsidianArmor)
      bootGroup.add(bootCuff)

      const bootCuffRing = new THREE.Mesh(new THREE.TorusGeometry(0.037, 0.005, 8, 18), matRoseGold)
      bootCuffRing.rotation.x = Math.PI / 2
      bootGroup.add(bootCuffRing)

      const bootFoot = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.065, 0.11), matSilkChassis)
      bootFoot.position.set(0, -0.034, 0.018)
      bootGroup.add(bootFoot)

      const solePad = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.012, 0.114), matNeonCyan)
      solePad.position.set(0, -0.068, 0.018)
      bootGroup.add(solePad)

      return { legGroup, knee }
    }

    const leftLegRig = createSlenderLeg(false)
    const rightLegRig = createSlenderLeg(true)
    hips.add(leftLegRig.legGroup)
    hips.add(rightLegRig.legGroup)

    leftLegRig.knee.rotation.x = 0.08
    rightLegRig.knee.rotation.x = 0.04

    // ── M. STARDUST SPARKLES & COSMIC AMBIENCE ──
    const particleCount = 42
    const partGeom = new THREE.BufferGeometry()
    const partPos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      partPos[i * 3 + 0] = (Math.random() - 0.5) * 1.5
      partPos[i * 3 + 1] = (Math.random() - 0.3) * 1.8
      partPos[i * 3 + 2] = (Math.random() - 0.5) * 1.2
    }
    partGeom.setAttribute('position', new THREE.BufferAttribute(partPos, 3))
    const partMat = new THREE.PointsMaterial({
      color: 0x00f5ff,
      size: 0.026,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    })
    const particles = new THREE.Points(partGeom, partMat)
    characterRoot.add(particles)

    // ── N. CYBERNETIC LAPTOP & MECHA HOLOGRAPHIC ACCESSORIES ──
    // 1. Procedural High-Tech Backlit Keyboard Canvas
    const kbCanvas = document.createElement('canvas')
    kbCanvas.width = 256
    kbCanvas.height = 128
    const kbCtx = kbCanvas.getContext('2d')
    if (kbCtx) {
      kbCtx.fillStyle = '#060a14'
      kbCtx.fillRect(0, 0, 256, 128)
      kbCtx.strokeStyle = 'rgba(0, 245, 255, 0.55)'
      kbCtx.fillStyle = 'rgba(0, 245, 255, 0.16)'
      kbCtx.lineWidth = 1.5
      for (let r = 0; r < 4; r++) {
        const y = 10 + r * 22
        const cols = r === 3 ? 7 : 10
        for (let c = 0; c < cols; c++) {
          const isSpace = r === 3 && c === 2
          const w = isSpace ? 82 : 18
          const x = 12 + c * (r === 3 && c > 2 ? 30 : 22) + (r === 3 && c > 2 ? 44 : 0)
          kbCtx.strokeRect(x, y, w, 15)
          kbCtx.fillRect(x, y, w, 15)
        }
      }
      kbCtx.strokeStyle = 'rgba(226, 168, 122, 0.8)'
      kbCtx.fillStyle = 'rgba(226, 168, 122, 0.2)'
      kbCtx.strokeRect(98, 100, 60, 22)
      kbCtx.fillRect(98, 100, 60, 22)
    }
    const kbTexture = new THREE.CanvasTexture(kbCanvas)
    kbTexture.needsUpdate = true

    // 2. Dynamic Cyber Matrix Terminal Screen Canvas
    const screenCanvas = document.createElement('canvas')
    screenCanvas.width = 512
    screenCanvas.height = 320
    const screenCtx = screenCanvas.getContext('2d')
    const screenTexture = new THREE.CanvasTexture(screenCanvas)

    const drawScreen = (mode: 'code' | 'error' | 'success', timerVal: number = 0) => {
      if (!screenCtx) return
      const w = 512
      const h = 320
      screenCtx.clearRect(0, 0, w, h)

      if (mode === 'code') {
        screenCtx.fillStyle = '#040814'
        screenCtx.fillRect(0, 0, w, h)
        // Top window bar
        screenCtx.fillStyle = '#0f172a'
        screenCtx.fillRect(0, 0, w, 28)
        // Window dots
        screenCtx.fillStyle = '#ef4444'
        screenCtx.beginPath()
        screenCtx.arc(16, 14, 5, 0, Math.PI * 2)
        screenCtx.fill()
        screenCtx.fillStyle = '#f59e0b'
        screenCtx.beginPath()
        screenCtx.arc(32, 14, 5, 0, Math.PI * 2)
        screenCtx.fill()
        screenCtx.fillStyle = '#10b981'
        screenCtx.beginPath()
        screenCtx.arc(48, 14, 5, 0, Math.PI * 2)
        screenCtx.fill()
        screenCtx.fillStyle = '#94a3b8'
        screenCtx.font = 'bold 12px "Courier New", monospace'
        screenCtx.fillText('astra@cosmic-core: ~/projects/vidyu-saas', 66, 18)

        // Code syntax lines
        const codeLines = [
          { text: '// Astra Neural Systems Architecture v3.8', col: '#64748b' },
          { text: 'import { Universe, Portal } from "@astra/core";', col: '#38bdf8' },
          { text: 'const vidyu = new Platform({ models: 130, pages: 155 });', col: '#a78bfa' },
          { text: 'await vidyu.deployMicroservices({ auth: "strict" });', col: '#34d399' },
          { text: 'const busGPS = new DriverTracker({ fcm: true });', col: '#fbbf24' },
          { text: 'status: 200 OK · Systems Architecture online 🚀', col: '#00f5ff' },
          { text: 'class QuantumCompiler extends AstraEngine {', col: '#38bdf8' },
          { text: '  compile() { return "Zero Bugs Verified! ✨"; }', col: '#34d399' },
          { text: '}', col: '#a78bfa' },
        ]

        screenCtx.font = '13px "Courier New", monospace'
        codeLines.forEach((l, idx) => {
          screenCtx.fillStyle = l.col
          screenCtx.fillText(l.text, 16, 52 + idx * 24)
        })

        // Blinking cursor
        if (Math.floor(timerVal * 4) % 2 === 0) {
          screenCtx.fillStyle = '#00f5ff'
          screenCtx.fillRect(16 + 28, 52 + 8 * 24 - 13, 8, 15)
        }
      } else if (mode === 'error') {
        screenCtx.fillStyle = '#3f0612'
        screenCtx.fillRect(0, 0, w, h)
        screenCtx.fillStyle = '#881337'
        screenCtx.fillRect(0, 0, w, 28)
        screenCtx.fillStyle = '#fecdd3'
        screenCtx.font = 'bold 13px "Courier New", monospace'
        screenCtx.fillText('⚠️ CRITICAL COMPILATION FAILURE — 100 ERRORS', 16, 18)

        screenCtx.strokeStyle = '#ff1744'
        screenCtx.lineWidth = 3
        screenCtx.strokeRect(12, 38, w - 24, h - 50)

        screenCtx.fillStyle = '#ff1744'
        screenCtx.font = 'bold 22px "Courier New", monospace'
        screenCtx.fillText('💥 FATAL: UNEXPECTED TOKEN', 24, 80)

        screenCtx.fillStyle = '#ffe4e6'
        screenCtx.font = '14px "Courier New", monospace'
        screenCtx.fillText('> [Line 404:12] Infinite recursion in build step', 24, 115)
        screenCtx.fillText('> Memory leak detected in Brain.tsx', 24, 142)
        screenCtx.fillText('> Expected ";" but found "😱"', 24, 169)
        screenCtx.fillText('> Panic: developer needs immediate boba / coffee 🧋', 24, 202)

        screenCtx.fillStyle = '#ff4d6d'
        screenCtx.font = 'bold 18px "Courier New", monospace'
        screenCtx.fillText('PROJECT CRASHED (╯°□°)╯︵ 💻', 24, 248)
      } else if (mode === 'success') {
        screenCtx.fillStyle = '#022c22'
        screenCtx.fillRect(0, 0, w, h)
        screenCtx.fillStyle = '#065f46'
        screenCtx.fillRect(0, 0, w, 28)
        screenCtx.fillStyle = '#6ee7b7'
        screenCtx.font = 'bold 13px "Courier New", monospace'
        screenCtx.fillText('✔ GIT RESTORE --STAGED . [SUCCESS]', 16, 18)

        screenCtx.fillStyle = '#10b981'
        screenCtx.font = 'bold 24px "Courier New", monospace'
        screenCtx.fillText('✨ PROJECT RESCUED! ✨', 24, 90)

        screenCtx.fillStyle = '#a7f3d0'
        screenCtx.font = '15px "Courier New", monospace'
        screenCtx.fillText('Clean working tree. 0 errors remaining.', 24, 138)
        screenCtx.fillText('Vidyu & Systems online and stable. 🚀', 24, 168)
        screenCtx.fillText('Astra happiness restored to 100% 💖', 24, 198)
      }
      screenTexture.needsUpdate = true
    }
    drawScreen('code', 0)

    // 3. Cybernetic Miniature Mecha Laptop Rig
    const laptopGroup = new THREE.Group()
    laptopGroup.visible = false
    characterRoot.add(laptopGroup)

    // Laptop Base Deck (Local Z: near edge closer to Astra is -0.075, far hinge edge is +0.075)
    const laptopBase = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.008, 0.15), matObsidianArmor)
    laptopGroup.add(laptopBase)

    const laptopBaseTrim = new THREE.Mesh(new THREE.BoxGeometry(0.224, 0.003, 0.154), matRoseGold)
    laptopBaseTrim.position.y = 0.002
    laptopGroup.add(laptopBaseTrim)

    const kbMat = new THREE.MeshBasicMaterial({ map: kbTexture })
    const kbMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.20, 0.13), kbMat)
    kbMesh.rotation.x = -Math.PI / 2
    kbMesh.position.set(0, 0.0055, -0.005)
    laptopGroup.add(kbMesh)

    // Screen Hinge Group at FAR edge of base deck (z = +0.075, further from Astra)
    const hingeGroup = new THREE.Group()
    hingeGroup.position.set(0, 0.004, 0.075)
    laptopGroup.add(hingeGroup)

    // Screen Lid outer shell (backplate)
    const lidOuter = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.006), matSilkChassis)
    lidOuter.position.set(0, 0.07, 0)
    hingeGroup.add(lidOuter)

    const lidTrim = new THREE.Mesh(new THREE.BoxGeometry(0.224, 0.144, 0.002), matRoseGold)
    lidTrim.position.set(0, 0.07, 0.003)
    hingeGroup.add(lidTrim)

    const lidEmblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.016, 0), matNeonCyan)
    lidEmblem.position.set(0, 0.07, 0.006)
    hingeGroup.add(lidEmblem)

    // Screen display surface on inside face (facing toward Astra when open: z = -0.004)
    const screenMat = new THREE.MeshBasicMaterial({
      map: screenTexture,
      side: THREE.DoubleSide,
      transparent: true,
    })
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.202, 0.124), screenMat)
    screenMesh.position.set(0, 0.07, -0.004)
    screenMesh.rotation.y = Math.PI
    hingeGroup.add(screenMesh)

    // Floating Holographic Code Beam Projector
    const holoProjMat = new THREE.MeshBasicMaterial({
      color: 0x00f5ff,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    })
    const holoMesh = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.16, 16, 1, true), holoProjMat)
    holoMesh.position.set(0, 0.08, 0)
    holoMesh.rotation.x = Math.PI
    laptopGroup.add(holoMesh)

    // Anti-Gravity Tractor Ring under laptop
    const tractorRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.006, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x00f5ff, transparent: true, opacity: 0 })
    )
    tractorRing.rotation.x = Math.PI / 2
    tractorRing.position.y = -0.03
    laptopGroup.add(tractorRing)

    // 4. Cute Anime Expressions: Anger Vein Mark (💢) & Sweat Drop (💧)
    const angerGroup = new THREE.Group()
    angerGroup.position.set(0.17, 0.29, 0.16)
    angerGroup.scale.set(0, 0, 0)
    headGroup.add(angerGroup)

    const matAnger = new THREE.MeshBasicMaterial({ color: 0xff1744 })
    for (let i = 0; i < 4; i++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.024, 0.002), matAnger)
      const ang = (i * Math.PI) / 2 + Math.PI / 4
      bar.position.set(Math.cos(ang) * 0.016, Math.sin(ang) * 0.016, 0)
      bar.rotation.z = ang
      angerGroup.add(bar)
    }

    const sweatGroup = new THREE.Group()
    sweatGroup.position.set(-0.16, 0.24, 0.16)
    sweatGroup.scale.set(0, 0, 0)
    headGroup.add(sweatGroup)

    const sweatMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 })
    const dropCone = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.030, 12), sweatMat)
    dropCone.rotation.x = Math.PI
    sweatGroup.add(dropCone)
    const dropCap = new THREE.Mesh(new THREE.SphereGeometry(0.014, 12, 12), sweatMat)
    dropCap.position.y = -0.012
    sweatGroup.add(dropCap)

    // ── O. ACADEMIC CODEX (CYBER-GRIMOIRE), TURNING PAGES & EUREKA LIGHTBULB ──
    // 1. Dynamic Academic Codex Pages Canvas Textures
    const leftBookCanvas = document.createElement('canvas')
    leftBookCanvas.width = 256
    leftBookCanvas.height = 340
    const leftBookCtx = leftBookCanvas.getContext('2d')
    if (leftBookCtx) {
      // Dark emerald parchment background
      leftBookCtx.fillStyle = '#041c14'
      leftBookCtx.fillRect(0, 0, 256, 340)
      // Subtle gold filigree border
      leftBookCtx.strokeStyle = 'rgba(245, 158, 11, 0.65)'
      leftBookCtx.lineWidth = 2
      leftBookCtx.strokeRect(8, 8, 240, 324)
      leftBookCtx.strokeStyle = 'rgba(52, 211, 153, 0.45)'
      leftBookCtx.lineWidth = 1
      leftBookCtx.strokeRect(12, 12, 232, 316)

      // Chapter header
      leftBookCtx.fillStyle = '#34d399'
      leftBookCtx.font = 'bold 10px monospace'
      leftBookCtx.fillText('// CH. 04 · ALGORITHMIC ARCHIVE', 18, 28)

      // Binary Search Tree Graph
      leftBookCtx.strokeStyle = '#34d399'
      leftBookCtx.lineWidth = 1.5
      const drawBranch = (x1: number, y1: number, x2: number, y2: number) => {
        leftBookCtx.beginPath()
        leftBookCtx.moveTo(x1, y1)
        leftBookCtx.lineTo(x2, y2)
        leftBookCtx.stroke()
      }
      drawBranch(128, 54, 84, 94)
      drawBranch(128, 54, 172, 94)
      drawBranch(84, 94, 60, 134)
      drawBranch(84, 94, 108, 134)
      drawBranch(172, 94, 148, 134)
      drawBranch(172, 94, 196, 134)

      // Draw Tree Nodes
      const drawNode = (x: number, y: number, label: string) => {
        leftBookCtx.fillStyle = '#064e3b'
        leftBookCtx.beginPath()
        leftBookCtx.arc(x, y, 9, 0, Math.PI * 2)
        leftBookCtx.fill()
        leftBookCtx.strokeStyle = '#34d399'
        leftBookCtx.stroke()
        leftBookCtx.fillStyle = '#fef08a'
        leftBookCtx.font = 'bold 8px monospace'
        leftBookCtx.textAlign = 'center'
        leftBookCtx.textBaseline = 'middle'
        leftBookCtx.fillText(label, x, y)
      }
      drawNode(128, 54, '50')
      drawNode(84, 94, '25')
      drawNode(172, 94, '75')
      drawNode(60, 134, '12')
      drawNode(108, 134, '37')
      drawNode(148, 134, '62')
      drawNode(196, 134, '88')

      // Reset text alignment
      leftBookCtx.textAlign = 'left'
      leftBookCtx.textBaseline = 'alphabetic'

      // Equations & Asymptotics
      leftBookCtx.fillStyle = '#fbbf24'
      leftBookCtx.font = 'bold 11px monospace'
      leftBookCtx.fillText('T(n) = 2T(n/2) + O(n)', 20, 178)

      leftBookCtx.fillStyle = '#7dd3fc'
      leftBookCtx.font = '10px monospace'
      leftBookCtx.fillText('O(V log V + E) // Dijkstra', 20, 204)

      leftBookCtx.fillStyle = '#a7f3d0'
      leftBookCtx.font = '10.5px serif'
      leftBookCtx.fillText('∫ ∇f(θ) dθ = Loss(W)', 20, 234)

      // Matrix block
      leftBookCtx.fillStyle = '#fde68a'
      leftBookCtx.font = '9.5px monospace'
      leftBookCtx.fillText('⎡ cos θ  -sin θ ⎤', 50, 268)
      leftBookCtx.fillText('⎣ sin θ   cos θ ⎦', 50, 286)

      leftBookCtx.fillStyle = 'rgba(52, 211, 153, 0.7)'
      leftBookCtx.font = '8px monospace'
      leftBookCtx.fillText('✦ MASTERED DATA STRUCTURES ✦', 28, 318)
    }
    const leftBookTexture = new THREE.CanvasTexture(leftBookCanvas)

    const rightBookCanvas = document.createElement('canvas')
    rightBookCanvas.width = 256
    rightBookCanvas.height = 340
    const rightBookCtx = rightBookCanvas.getContext('2d')
    if (rightBookCtx) {
      rightBookCtx.fillStyle = '#041c14'
      rightBookCtx.fillRect(0, 0, 256, 340)
      rightBookCtx.strokeStyle = 'rgba(245, 158, 11, 0.65)'
      rightBookCtx.lineWidth = 2
      rightBookCtx.strokeRect(8, 8, 240, 324)
      rightBookCtx.strokeStyle = 'rgba(52, 211, 153, 0.45)'
      rightBookCtx.lineWidth = 1
      rightBookCtx.strokeRect(12, 12, 232, 316)

      rightBookCtx.fillStyle = '#34d399'
      rightBookCtx.font = 'bold 10px monospace'
      rightBookCtx.fillText('// CH. 05 · MPC & HIGHER LOGIC', 18, 28)

      // Graph Diagram with cycle
      rightBookCtx.strokeStyle = '#38bdf8'
      rightBookCtx.lineWidth = 1.5
      const drawGraphNode = (x: number, y: number, name: string) => {
        rightBookCtx.fillStyle = '#0f293d'
        rightBookCtx.beginPath()
        rightBookCtx.arc(x, y, 10, 0, Math.PI * 2)
        rightBookCtx.fill()
        rightBookCtx.strokeStyle = '#38bdf8'
        rightBookCtx.stroke()
        rightBookCtx.fillStyle = '#bae6fd'
        rightBookCtx.font = 'bold 9px monospace'
        rightBookCtx.textAlign = 'center'
        rightBookCtx.textBaseline = 'middle'
        rightBookCtx.fillText(name, x, y)
      }
      rightBookCtx.beginPath()
      rightBookCtx.moveTo(70, 70); rightBookCtx.lineTo(186, 70)
      rightBookCtx.moveTo(186, 70); rightBookCtx.lineTo(186, 130)
      rightBookCtx.moveTo(186, 130); rightBookCtx.lineTo(70, 130)
      rightBookCtx.moveTo(70, 130); rightBookCtx.lineTo(70, 70)
      rightBookCtx.stroke()

      drawGraphNode(70, 70, 'u')
      drawGraphNode(186, 70, 'v')
      drawGraphNode(186, 130, 'w')
      drawGraphNode(70, 130, 'z')

      rightBookCtx.textAlign = 'left'
      rightBookCtx.textBaseline = 'alphabetic'

      // Calculus & Science formulas
      rightBookCtx.fillStyle = '#fbbf24'
      rightBookCtx.font = 'bold 11px monospace'
      rightBookCtx.fillText('∑ 1/k² = π² / 6', 36, 178)

      rightBookCtx.fillStyle = '#f43f5e'
      rightBookCtx.font = '10px monospace'
      rightBookCtx.fillText('∀x: P(x) ⟹ Q(x)', 36, 204)

      rightBookCtx.fillStyle = '#7dd3fc'
      rightBookCtx.font = '10px monospace'
      rightBookCtx.fillText('det(A - λI) = 0', 36, 234)

      rightBookCtx.fillStyle = '#a7f3d0'
      rightBookCtx.font = '10.5px serif'
      rightBookCtx.fillText('e^(iπ) + 1 = 0', 36, 268)

      rightBookCtx.fillStyle = '#fde68a'
      rightBookCtx.font = '8px monospace'
      rightBookCtx.fillText('✦ ACADEMIC ODYSSEY ARCHIVE ✦', 24, 318)
    }
    const rightBookTexture = new THREE.CanvasTexture(rightBookCanvas)

    // Turning Page Canvas Texture
    const turnPageCanvas = document.createElement('canvas')
    turnPageCanvas.width = 256
    turnPageCanvas.height = 340
    const turnPageCtx = turnPageCanvas.getContext('2d')
    if (turnPageCtx) {
      turnPageCtx.fillStyle = '#06291e'
      turnPageCtx.fillRect(0, 0, 256, 340)
      turnPageCtx.strokeStyle = 'rgba(52, 211, 153, 0.65)'
      turnPageCtx.lineWidth = 2
      turnPageCtx.strokeRect(6, 6, 244, 328)

      turnPageCtx.fillStyle = '#fbbf24'
      turnPageCtx.font = 'bold 11px monospace'
      turnPageCtx.fillText('// DYNAMIC PROGRAMMING', 18, 36)

      turnPageCtx.fillStyle = '#a7f3d0'
      turnPageCtx.font = '10px monospace'
      turnPageCtx.fillText('memo[i][w] = max(', 24, 80)
      turnPageCtx.fillText('  val + memo[i-1][w-wt],', 24, 105)
      turnPageCtx.fillText('  memo[i-1][w]', 24, 130)
      turnPageCtx.fillText(')', 24, 155)

      turnPageCtx.fillStyle = '#38bdf8'
      turnPageCtx.font = '10px monospace'
      turnPageCtx.fillText('ACID: Atomicity, Consistency,', 20, 210)
      turnPageCtx.fillText('Isolation, Durability', 20, 235)

      turnPageCtx.fillStyle = '#fde68a'
      turnPageCtx.font = '9px monospace'
      turnPageCtx.fillText('✦ PROVEN COMPLEXITY BOUNDS ✦', 18, 305)
    }
    const turnPageTexture = new THREE.CanvasTexture(turnPageCanvas)

    // Materials
    const matCoverEmerald = new THREE.MeshPhysicalMaterial({
      color: 0x064e3b,
      roughness: 0.32,
      metalness: 0.20,
      clearcoat: 0.75,
      clearcoatRoughness: 0.15,
    })
    const matParchmentBlock = new THREE.MeshStandardMaterial({
      color: 0x041812,
      roughness: 0.65,
      metalness: 0.1,
    })
    const leftPageMat = new THREE.MeshBasicMaterial({ map: leftBookTexture })
    const rightPageMat = new THREE.MeshBasicMaterial({ map: rightBookTexture })
    const turnPageMat = new THREE.MeshBasicMaterial({
      map: turnPageTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    })

    // 2. 3D Book Assembly
    const bookGroup = new THREE.Group()
    bookGroup.visible = false
    characterRoot.add(bookGroup)

    // Central spine
    const spineMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.185, 16), matRoseGold)
    bookGroup.add(spineMesh)

    // Left Cover & Page Assembly
    const leftCoverGroup = new THREE.Group()
    bookGroup.add(leftCoverGroup)

    const leftCoverMesh = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.185, 0.005), matCoverEmerald)
    leftCoverMesh.position.set(-0.0625, 0, -0.0025)
    leftCoverGroup.add(leftCoverMesh)

    const leftCoverTrim = new THREE.Mesh(new THREE.BoxGeometry(0.128, 0.188, 0.002), matRoseGold)
    leftCoverTrim.position.set(-0.0625, 0, -0.004)
    leftCoverGroup.add(leftCoverTrim)

    const leftCrest = new THREE.Mesh(new THREE.OctahedronGeometry(0.016, 0), matRoseGold)
    leftCrest.position.set(-0.0625, 0, -0.006)
    leftCoverGroup.add(leftCrest)

    const leftPageBlock = new THREE.Mesh(new THREE.BoxGeometry(0.118, 0.175, 0.006), matParchmentBlock)
    leftPageBlock.position.set(-0.06, 0, 0.0035)
    leftCoverGroup.add(leftPageBlock)

    const leftPagePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.116, 0.172), leftPageMat)
    leftPagePlane.position.set(-0.06, 0, 0.007)
    leftCoverGroup.add(leftPagePlane)

    // Right Cover & Page Assembly
    const rightCoverGroup = new THREE.Group()
    bookGroup.add(rightCoverGroup)

    const rightCoverMesh = new THREE.Mesh(new THREE.BoxGeometry(0.125, 0.185, 0.005), matCoverEmerald)
    rightCoverMesh.position.set(0.0625, 0, -0.0025)
    rightCoverGroup.add(rightCoverMesh)

    const rightCoverTrim = new THREE.Mesh(new THREE.BoxGeometry(0.128, 0.188, 0.002), matRoseGold)
    rightCoverTrim.position.set(0.0625, 0, -0.004)
    rightCoverGroup.add(rightCoverTrim)

    const rightPageBlock = new THREE.Mesh(new THREE.BoxGeometry(0.118, 0.175, 0.006), matParchmentBlock)
    rightPageBlock.position.set(0.06, 0, 0.0035)
    rightCoverGroup.add(rightPageBlock)

    const rightPagePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.116, 0.172), rightPageMat)
    rightPagePlane.position.set(0.06, 0, 0.007)
    rightCoverGroup.add(rightPagePlane)

    // Flipping Page Group
    const turningPageGroup = new THREE.Group()
    turningPageGroup.position.set(0, 0, 0.0075)
    bookGroup.add(turningPageGroup)

    const turningPageMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.116, 0.170), turnPageMat)
    turningPageMesh.position.set(0.058, 0, 0)
    turningPageGroup.add(turningPageMesh)

    // 3. Floating Holographic Knowledge Runes
    const runeGroup = new THREE.Group()
    runeGroup.visible = false
    bookGroup.add(runeGroup)

    const runeSymbols = ['∫', '∑', 'λ', 'π', '∞', '⚡', '💡', '🎓']
    const runeMeshes: THREE.Mesh[] = []

    runeSymbols.forEach((sym, idx) => {
      const runeCanvas = document.createElement('canvas')
      runeCanvas.width = 64
      runeCanvas.height = 64
      const rCtx = runeCanvas.getContext('2d')
      if (rCtx) {
        rCtx.fillStyle = 'rgba(0,0,0,0)'
        rCtx.fillRect(0, 0, 64, 64)
        rCtx.fillStyle = idx % 2 === 0 ? '#34d399' : '#fbbf24'
        rCtx.font = 'bold 36px monospace'
        rCtx.textAlign = 'center'
        rCtx.textBaseline = 'middle'
        rCtx.fillText(sym, 32, 32)
      }
      const rTex = new THREE.CanvasTexture(runeCanvas)
      const rMat = new THREE.MeshBasicMaterial({
        map: rTex,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
      const rMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.045, 0.045), rMat)
      rMesh.position.set((Math.random() - 0.5) * 0.16, 0.05 + Math.random() * 0.10, (Math.random() - 0.5) * 0.06)
      runeGroup.add(rMesh)
      runeMeshes.push(rMesh)
    })

    // 4. Eureka Epiphany Lightbulb Halo above head
    const eurekaGroup = new THREE.Group()
    eurekaGroup.position.set(0, 0.44, 0.04)
    eurekaGroup.scale.set(0, 0, 0)
    headGroup.add(eurekaGroup)

    const bulbMat = new THREE.MeshStandardMaterial({
      color: 0xfff066,
      emissive: 0xffb700,
      emissiveIntensity: 1.8,
      roughness: 0.15,
      metalness: 0.1,
    })
    const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.034, 16, 16), bulbMat)
    eurekaGroup.add(bulbMesh)

    const bulbBase = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.016, 12), matRoseGold)
    bulbBase.position.y = -0.036
    eurekaGroup.add(bulbBase)

    // Starburst rays around lightbulb
    const rayMat = new THREE.MeshBasicMaterial({ color: 0xffe066 })
    for (let r = 0; r < 5; r++) {
      const ray = new THREE.Mesh(new THREE.OctahedronGeometry(0.012, 0), rayMat)
      const ang = (r / 5) * Math.PI * 2
      ray.position.set(Math.cos(ang) * 0.068, Math.sin(ang) * 0.068 + 0.01, 0)
      eurekaGroup.add(ray)
    }

    // ── P. VERIFIED HONORS, CHAMPIONSHIP TROPHY CUP, MEDALS & DIPLOMA CERTIFICATES ──
    const matTrophyGold = new THREE.MeshPhysicalMaterial({
      color: 0xffd700,
      emissive: 0xb45309,
      emissiveIntensity: 0.25,
      roughness: 0.16,
      metalness: 0.95,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    })

    const matMedalSilver = new THREE.MeshPhysicalMaterial({
      color: 0xe2e8f0,
      emissive: 0x94a3b8,
      emissiveIntensity: 0.2,
      roughness: 0.2,
      metalness: 0.9,
      clearcoat: 0.8,
    })

    const matRibbonRed = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.45,
      metalness: 0.1,
    })

    const matRibbonNavy = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      roughness: 0.45,
      metalness: 0.1,
    })

    const matParchment = new THREE.MeshStandardMaterial({
      color: 0xfffaed,
      roughness: 0.5,
      metalness: 0.05,
    })

    const matWaxSeal = new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      roughness: 0.3,
      metalness: 0.2,
    })

    const awardsGroup = new THREE.Group()
    awardsGroup.visible = false
    characterRoot.add(awardsGroup)

    // 1. Grand Golden Championship Trophy Cup (held gracefully by Nova)
    const trophyCupGroup = new THREE.Group()
    trophyCupGroup.position.set(0.12, 0.04, 0.22)
    awardsGroup.add(trophyCupGroup)

    // Trophy Base (Polished Obsidian plinth)
    const trophyBase = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.052, 0.035, 16), matObsidianArmor)
    trophyBase.position.y = -0.06
    trophyCupGroup.add(trophyBase)

    // Gold plaque on base
    const trophyPlaque = new THREE.Mesh(new THREE.PlaneGeometry(0.040, 0.016), matTrophyGold)
    trophyPlaque.position.set(0, -0.06, 0.053)
    trophyCupGroup.add(trophyPlaque)

    // Trophy Stem & decorative ring
    const trophyStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.055, 16), matTrophyGold)
    trophyStem.position.y = -0.02
    trophyCupGroup.add(trophyStem)

    const stemRing = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.005, 10, 20), matRoseGold)
    stemRing.rotation.x = Math.PI / 2
    stemRing.position.y = -0.015
    trophyCupGroup.add(stemRing)

    // Trophy Main Chalice Bowl
    const trophyBowl = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.022, 0.080, 24), matTrophyGold)
    trophyBowl.position.y = 0.045
    trophyCupGroup.add(trophyBowl)

    const trophyRim = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.006, 10, 28), matTrophyGold)
    trophyRim.rotation.x = Math.PI / 2
    trophyRim.position.y = 0.085
    trophyCupGroup.add(trophyRim)

    // Trophy Side Handles (Left and Right Arches)
    const handleGeom = new THREE.TorusGeometry(0.035, 0.006, 8, 20, Math.PI)
    const leftHandle = new THREE.Mesh(handleGeom, matTrophyGold)
    leftHandle.rotation.z = Math.PI / 2
    leftHandle.position.set(-0.068, 0.045, 0)
    trophyCupGroup.add(leftHandle)

    const rightHandle = new THREE.Mesh(handleGeom, matTrophyGold)
    rightHandle.rotation.z = -Math.PI / 2
    rightHandle.position.set(0.068, 0.045, 0)
    trophyCupGroup.add(rightHandle)

    // Glowing Victory Crystal / Star inside Trophy
    const victoryStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.022, 0), matNeonCyan)
    victoryStar.position.y = 0.065
    trophyCupGroup.add(victoryStar)

    // Golden Halo / Sparkles around Trophy
    const trophySparkles = new THREE.Group()
    trophyCupGroup.add(trophySparkles)
    for (let s = 0; s < 6; s++) {
      const sparkle = new THREE.Mesh(new THREE.OctahedronGeometry(0.007, 0), matTrophyGold)
      const ang = (s / 6) * Math.PI * 2
      sparkle.position.set(Math.cos(ang) * 0.085, 0.05 + Math.sin(ang * 2) * 0.03, Math.sin(ang) * 0.085)
      trophySparkles.add(sparkle)
    }

    // 2. Certified Diploma Scroll & Honor Medals (held in Nova's left hand)
    const certScrollGroup = new THREE.Group()
    certScrollGroup.position.set(-0.13, 0.02, 0.20)
    certScrollGroup.rotation.set(0.25, 0.20, -0.35)
    awardsGroup.add(certScrollGroup)

    // Rolled Parchment Scroll Body
    const scrollCylinder = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.16, 20), matParchment)
    certScrollGroup.add(scrollCylinder)

    // Gold ribbon ties on the scroll
    const scrollRibbon1 = new THREE.Mesh(new THREE.TorusGeometry(0.017, 0.003, 8, 18), matTrophyGold)
    scrollRibbon1.rotation.x = Math.PI / 2
    scrollRibbon1.position.y = 0.045
    certScrollGroup.add(scrollRibbon1)

    const scrollRibbon2 = new THREE.Mesh(new THREE.TorusGeometry(0.017, 0.003, 8, 18), matTrophyGold)
    scrollRibbon2.rotation.x = Math.PI / 2
    scrollRibbon2.position.y = -0.045
    certScrollGroup.add(scrollRibbon2)

    // Imperial Red Wax Seal at Center
    const waxSeal = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.006, 16), matWaxSeal)
    waxSeal.position.set(0, 0, 0.016)
    waxSeal.rotation.x = Math.PI / 2
    certScrollGroup.add(waxSeal)

    const sealEmblem = new THREE.Mesh(new THREE.OctahedronGeometry(0.006, 0), matTrophyGold)
    sealEmblem.position.set(0, 0, 0.020)
    certScrollGroup.add(sealEmblem)

    // Trailing Red Ribbon Ends from Seal
    const ribbonTail1 = new THREE.Mesh(new THREE.PlaneGeometry(0.008, 0.055), matRibbonRed)
    ribbonTail1.position.set(-0.006, -0.028, 0.017)
    ribbonTail1.rotation.z = 0.25
    certScrollGroup.add(ribbonTail1)

    const ribbonTail2 = new THREE.Mesh(new THREE.PlaneGeometry(0.008, 0.050), matRibbonRed)
    ribbonTail2.position.set(0.006, -0.026, 0.017)
    ribbonTail2.rotation.z = -0.22
    certScrollGroup.add(ribbonTail2)

    // 3. Honor Medals (Draped gracefully with V-ribbon)
    const medalRigGroup = new THREE.Group()
    medalRigGroup.position.set(-0.04, 0.08, 0.18)
    awardsGroup.add(medalRigGroup)

    // Navy Ribbon Lanyards
    const ribbonL = new THREE.Mesh(new THREE.PlaneGeometry(0.014, 0.09), matRibbonNavy)
    ribbonL.position.set(-0.018, 0, 0)
    ribbonL.rotation.z = -0.35
    medalRigGroup.add(ribbonL)

    const ribbonR = new THREE.Mesh(new THREE.PlaneGeometry(0.014, 0.09), matRibbonNavy)
    ribbonR.position.set(0.018, 0, 0)
    ribbonR.rotation.z = 0.35
    medalRigGroup.add(ribbonR)

    // Primary Gold Medal (AWS Academy & Google for Developers Honor)
    const goldMedal = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.004, 20), matTrophyGold)
    goldMedal.position.set(-0.008, -0.048, 0.004)
    goldMedal.rotation.x = Math.PI / 2
    medalRigGroup.add(goldMedal)

    const medalStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.009, 0), matRoseGold)
    medalStar.position.set(-0.008, -0.048, 0.008)
    medalRigGroup.add(medalStar)

    // Secondary Emerald Medal (AI-ML / Cisco Cybersecurity Honor)
    const emeraldMedal = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.004, 20), matMedalSilver)
    emeraldMedal.position.set(0.014, -0.056, 0.002)
    emeraldMedal.rotation.x = Math.PI / 2
    medalRigGroup.add(emeraldMedal)

    const medalGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.007, 0), matNeonCyan)
    medalGem.position.set(0.014, -0.056, 0.006)
    medalRigGroup.add(medalGem)

    // 5. Autonomous Activity State & Scheduler
    const activityRef = {
      current: 'idle' as AstraActivity,
      timer: 0,
      duration: 3.6,
      spinStartAngle: 0,
      autoCountdown: 3.5, // starts first autonomous gesture after 3.5s
      codingPhase: -1,
      readingPhase: -1,
    }

    const blinkState = { nextBlink: 3.5, isBlinking: false, blinkProgress: 0 }

    // Activity repertoire for completely autonomous section behavior (no user clicks required)
    const activityCycle: AstraActivity[] =
      activeSection === 'projects'
        ? ['coding_rage', 'inspect', 'coding_rage', 'hi', 'heart']
        : activeSection === 'education'
        ? ['reading_book', 'eureka', 'reading_book', 'inspect', 'curtsy']
        : activeSection === 'achievements'
        ? ['holding_awards', 'curtsy', 'holding_awards', 'heart', 'hi']
        : ['inspect', 'hi', 'heart', 'spin', 'curtsy']
    let cycleIdx = 0

    const triggerActivity = (act: AstraActivity) => {
      activityRef.current = act
      activityRef.timer = 0
      activityRef.spinStartAngle = characterRoot.rotation.y
      activityRef.codingPhase = -1
      activityRef.readingPhase = -1

      let dur = 3.6
      let text = 'Hi Explorer! 👋 Welcome!'
      let icon = '👋'

      if (act === 'hi') {
        dur = 3.6
        text = 'Hi Explorer! 👋 Welcome!'
        icon = '👋'
      } else if (act === 'heart') {
        dur = 3.5
        text = 'Sending cosmic inspiration! 💖'
        icon = '💖'
      } else if (act === 'spin') {
        dur = 4.0
        text = '360° Scan! 💫 Wheee~!'
        icon = '🔄'
      } else if (act === 'curtsy') {
        dur = 3.8
        text = 'At your service, Commander! 🎀'
        icon = '🎀'
      } else if (act === 'inspect') {
        dur = 3.4
        text = 'Scanning sector data... 🔍'
        icon = '🔍'
      } else if (act === 'coding_rage') {
        dur = 6.4
        text = 'Compiling project... 💻✨'
        icon = '💻'
      } else if (act === 'reading_book') {
        dur = 7.2
        text = 'Opening Academic Codex... 📖✨'
        icon = '📖'
      } else if (act === 'eureka') {
        dur = 3.8
        text = 'Eureka! Concept fully unlocked! 💡✨'
        icon = '💡'
      } else if (act === 'holding_awards') {
        dur = 4.2
        text = 'Viewing Verified Honors & Credentials! 🏆✨'
        icon = '🏆'
      }

      activityRef.duration = dur
      setCurrentActivity(act)
      setSpeech({ text, icon, visible: true })

      setTimeout(() => {
        setSpeech((prev) => ({ ...prev, visible: false }))
      }, dur * 1000)
    }

    triggerActivityRef.current = triggerActivity

    // Mouse pointer tracking: ONLY active when hovering over Nova's companion card
    // When the cursor is over the content area on the right, or while scrolling, head rotation is off
    const handlePointerMove = (e: PointerEvent) => {
      if (!container) return
      const rect = container.getBoundingClientRect()
      const isOverCompanion =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom

      if (!isOverCompanion) {
        // Cursor is over content: Nova looks calmly forward
        pointerRef.current.targetX = 0
        pointerRef.current.targetY = 0
        return
      }

      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1
      pointerRef.current.targetX = THREE.MathUtils.clamp(nx, -0.45, 0.45)
      pointerRef.current.targetY = THREE.MathUtils.clamp(ny, -0.35, 0.35)
    }

    const handlePointerLeave = () => {
      pointerRef.current.targetX = 0
      pointerRef.current.targetY = 0
    }

    const handleScroll = () => {
      pointerRef.current.targetX = 0
      pointerRef.current.targetY = 0
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    container.addEventListener('pointerleave', handlePointerLeave, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })

    // Clicking anywhere on Nova's 3D canvas triggers an immediate cute gesture
    const handlePointerDown = () => {
      if (activeSection === 'education') {
        if (activityRef.current !== 'reading_book' && activityRef.current !== 'eureka') {
          triggerActivity('reading_book')
        } else {
          triggerActivity(activityRef.current === 'reading_book' ? 'eureka' : 'reading_book')
        }
      } else if (activeSection === 'projects' && activityRef.current !== 'coding_rage') {
        triggerActivity('coding_rage')
      } else if (activeSection === 'achievements') {
        triggerActivity('holding_awards')
      } else {
        const nextAct = activityCycle[cycleIdx % activityCycle.length]
        cycleIdx++
        triggerActivity(nextAct)
      }
    }
    renderer.domElement.addEventListener('pointerdown', handlePointerDown)

    // Initial autonomous activation: smoothly starts the section-specific thematic action!
    const initialAct: AstraActivity =
      activeSection === 'education'
        ? 'reading_book'
        : activeSection === 'projects'
        ? 'coding_rage'
        : activeSection === 'achievements'
        ? 'holding_awards'
        : 'hi'

    const welcomeTimeout = setTimeout(() => {
      triggerActivity(initialAct)
    }, 450)

    // ── 6. 60 FPS RENDER LOOP WITH REALISTIC, FLUID ANIMATIONS ──
    let animationFrameId: number
    const startTime = performance.now()
    let lastTime = performance.now()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const now = performance.now()
      const delta = Math.min(Math.max((now - lastTime) / 1000, 0.001), 0.1)
      lastTime = now
      const elapsed = (now - startTime) / 1000

      // A. Smooth Cursor Follow
      const p = pointerRef.current
      p.x += (p.targetX - p.x) * (delta * 4.5)
      p.y += (p.targetY - p.y) * (delta * 4.5)

      // Base Levitation Float
      const hoverFloat = Math.sin(elapsed * 2.2) * 0.026
      characterRoot.position.y = 0.02 + hoverFloat

      // Platform pulse & counter rotation
      outerRing.rotation.z = elapsed * 0.35
      midRing.rotation.z = -elapsed * 0.55
      outerRing.scale.setScalar(1.0 + Math.sin(elapsed * 3.5) * 0.04)

      // Delicate Torso Breathing
      const breath = Math.sin(elapsed * 2.4) * 0.014
      torso.scale.set(1.0 + breath * 0.5, 1.0 + breath, 1.0 + breath * 0.5)
      heartCore.rotation.y += delta * 1.5

      // Wing Flutter
      let wingFlutterSpeed = 3.8
      let wingFlutterAmp = 0.12
      if (activityRef.current === 'spin') {
        wingFlutterSpeed = 9.0
        wingFlutterAmp = 0.24
      }
      const wingFlutter = Math.sin(elapsed * wingFlutterSpeed) * wingFlutterAmp
      leftWing.rotation.y = -0.22 - wingFlutter
      rightWing.rotation.y = 0.22 + wingFlutter
      leftWing.rotation.z = 0.08 + Math.cos(elapsed * 2.0) * 0.05
      rightWing.rotation.z = -0.08 - Math.cos(elapsed * 2.0) * 0.05

      // Natural eye blinking
      if (!blinkState.isBlinking && elapsed > blinkState.nextBlink) {
        blinkState.isBlinking = true
        blinkState.blinkProgress = 0
        blinkState.nextBlink = elapsed + 3.0 + Math.random() * 3.0
      }

      if (blinkState.isBlinking) {
        blinkState.blinkProgress += delta * 9.5
        if (blinkState.blinkProgress >= Math.PI) {
          blinkState.isBlinking = false
          eyeLeft.scale.y = 1
          eyeRight.scale.y = 1
        } else {
          const eyeClose = Math.cos(blinkState.blinkProgress) * 0.5 + 0.5
          eyeLeft.scale.y = Math.max(0.06, eyeClose)
          eyeRight.scale.y = Math.max(0.06, eyeClose)
        }
      }

      // ── B. AUTONOMOUS SCHEDULING (NO BUTTONS REQUIRED) ──
      if (activityRef.current === 'idle') {
        activityRef.autoCountdown -= delta
        if (activityRef.autoCountdown <= 0) {
          const autoAct = activityCycle[cycleIdx % activityCycle.length]
          cycleIdx++
          triggerActivity(autoAct)
        }
      }

      // ── C. REALISTIC MULTI-PHASE ACTIVITY EXECUTION ──
      const act = activityRef.current

      if (act !== 'idle') {
        activityRef.timer += delta
        const tSec = activityRef.timer
        const totalDur = activityRef.duration

        // 1. "SAY HI" WAVE ACTIVITY (Clear raised hand, expressive wave & warm head tilt)
        if (act === 'hi') {
          // Raise arm smoothly (0 to 0.65s) -> Wave (0.65 to 2.9s) -> Lower smoothly (2.9 to 3.6s)
          const raiseBlend = smoothBlend(tSec, 0, 0.65)
          const lowerBlend = smoothBlend(tSec, 2.9, 3.6)
          const actWeight = raiseBlend * (1 - lowerBlend)

          // Waving oscillation
          const wavePhase = Math.sin((tSec - 0.65) * 9.5)
          const waveAngle = wavePhase * 0.32 * actWeight

          // Right Arm Rig kinematics:
          // Lifts UP and OUTWARD into clear space beside her cheek/ear (x ≈ 0.30, y ≈ 0.34, z ≈ 0.05)
          rightArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(-0.22, 1.25, actWeight) + waveAngle * 0.08
          rightArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.12, 0.18, actWeight)
          rightArmRig.elbow.rotation.z = THREE.MathUtils.lerp(0.38, 1.95, actWeight)
          rightArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.60, 0.28, actWeight)

          // Expressive wrist & hand waving
          rightArmRig.handGroup.rotation.z = THREE.MathUtils.lerp(-0.15, waveAngle, actWeight)
          rightArmRig.forearm.rotation.z = waveAngle * 0.30

          // Sweet cheerful head tilt with happy smiling crescent eyes ( ^ ‿ ^ )
          headGroup.rotation.z = THREE.MathUtils.lerp(0, -0.16, actWeight)
          headGroup.rotation.y = THREE.MathUtils.lerp(0.15, 0.12, actWeight)

          const smileCurve = 1.0 - 0.72 * actWeight
          eyeLeft.scale.y = smileCurve
          eyeRight.scale.y = smileCurve
          blushLeft.scale.setScalar(1.0 + 0.32 * actWeight)
          blushRight.scale.setScalar(1.0 + 0.32 * actWeight)

          // Left hand politely resting by side
          leftArmRig.armGroup.rotation.z = 0.18

          if (tSec >= totalDur) {
            eyeLeft.scale.set(1, 1, 1)
            eyeRight.scale.set(1, 1, 1)
            blushLeft.scale.set(1, 1, 1)
            blushRight.scale.set(1, 1, 1)
            activityRef.current = 'idle'
            activityRef.autoCountdown = 3.5 + Math.random() * 2.0
            setCurrentActivity('idle')
          }
        }

        // 2. "360° PIROUETTE / ROTATING" ACTIVITY (Ballet spin with centrifugal skirt & wings)
        else if (act === 'spin') {
          const spinProgress = smoothBlend(tSec, 0.15, 3.8)
          characterRoot.rotation.y = activityRef.spinStartAngle + spinProgress * Math.PI * 2

          // Smooth elevation lift during pirouette
          const liftProgress = Math.sin((tSec / totalDur) * Math.PI)
          characterRoot.position.y = 0.02 + hoverFloat + liftProgress * 0.12

          // Centrifugal flair: skirt flaps & twin tails flare outward with rotation
          const centrifugal = Math.sin(spinProgress * Math.PI)
          tailLeft.rotation.z = -0.42 * centrifugal
          tailRight.rotation.z = 0.42 * centrifugal
          leftHipWing.rotation.z = -0.36 - 0.30 * centrifugal
          rightHipWing.rotation.z = 0.36 + 0.30 * centrifugal
          frontLeftFlap.rotation.z = 0.35 + 0.22 * centrifugal
          frontRightFlap.rotation.z = -0.35 - 0.22 * centrifugal

          // Graceful ballerina arms during spin
          rightArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(-0.22, 1.45, centrifugal)
          rightArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.60, 0.35, centrifugal)
          leftArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(0.16, 0.95, centrifugal)
          leftArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.18, -0.50, centrifugal)

          // Happy crescent eyes
          eyeLeft.scale.y = 1.0 - 0.65 * centrifugal
          eyeRight.scale.y = 1.0 - 0.65 * centrifugal

          // Accelerate particle cyclone
          particles.rotation.y += delta * 3.0
          outerRing.rotation.z += delta * 4.5

          if (tSec >= totalDur) {
            activityRef.current = 'idle'
            activityRef.autoCountdown = 6.5 + Math.random() * 2.5
            setCurrentActivity('idle')
            tailLeft.rotation.z = 0
            tailRight.rotation.z = 0
            leftHipWing.rotation.z = -0.36
            rightHipWing.rotation.z = 0.36
            frontLeftFlap.rotation.z = 0.35
            frontRightFlap.rotation.z = -0.35
            eyeLeft.scale.set(1, 1, 1)
            eyeRight.scale.set(1, 1, 1)
          }
        }

        // 3. "COSMIC HEART SPARKLE" (Both hands cup glowing heart reactor with pulsing bloom)
        else if (act === 'heart') {
          const raiseBlend = smoothBlend(tSec, 0, 0.70)
          const lowerBlend = smoothBlend(tSec, 2.8, 3.5)
          const actWeight = raiseBlend * (1 - lowerBlend)

          // Arms come together over sternum core
          rightArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(-0.22, -0.46, actWeight)
          rightArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.12, 0.58, actWeight)
          rightArmRig.elbow.rotation.z = THREE.MathUtils.lerp(0.38, 0.85, actWeight)
          rightArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.60, 0.68, actWeight)

          leftArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(0.16, 0.46, actWeight)
          leftArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(0.04, 0.58, actWeight)
          leftArmRig.elbow.rotation.z = THREE.MathUtils.lerp(-0.10, -0.85, actWeight)
          leftArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.18, 0.68, actWeight)

          // Realistic double-thump cardiac heartbeat pulse (ba-bump... ba-bump!)
          const hbPhase = ((tSec - 0.70) * 3.4) % 1.0
          const hbBump =
            (Math.exp(-Math.pow((hbPhase - 0.18) * 14, 2)) * 0.42 +
              Math.exp(-Math.pow((hbPhase - 0.42) * 16, 2)) * 0.28) *
            actWeight

          heartCore.scale.setScalar(1.0 + hbBump)
          matNeonCyan.emissiveIntensity = 0.85 + hbBump * 1.8

          headGroup.rotation.x = THREE.MathUtils.lerp(0, 0.12, actWeight)
          headGroup.rotation.z = THREE.MathUtils.lerp(0, 0.06, actWeight)
          eyeLeft.scale.y = 1.0 - 0.70 * actWeight
          eyeRight.scale.y = 1.0 - 0.70 * actWeight
          blushLeft.scale.setScalar(1.0 + 0.45 * actWeight)
          blushRight.scale.setScalar(1.0 + 0.45 * actWeight)

          if (tSec >= totalDur) {
            activityRef.current = 'idle'
            activityRef.autoCountdown = 6.0 + Math.random() * 2.5
            setCurrentActivity('idle')
            heartCore.scale.setScalar(1.0)
            matNeonCyan.emissiveIntensity = 0.85
            eyeLeft.scale.set(1, 1, 1)
            eyeRight.scale.set(1, 1, 1)
            blushLeft.scale.set(1, 1, 1)
            blushRight.scale.set(1, 1, 1)
          }
        }

        // 4. "ROYAL MAIDEN CURTSY" (Graceful knee dip, bowed head & spread fairy wings)
        else if (act === 'curtsy') {
          const dipBlend = smoothBlend(tSec, 0, 1.1)
          const riseBlend = smoothBlend(tSec, 2.6, 3.8)
          const holdWeight = dipBlend * (1 - riseBlend)

          characterRoot.position.y = 0.02 + hoverFloat - 0.07 * holdWeight
          torso.rotation.x = 0.18 * holdWeight
          leftLegRig.knee.rotation.x = 0.08 + 0.32 * holdWeight
          rightLegRig.knee.rotation.x = 0.04 + 0.32 * holdWeight

          // Arms sweep out to pinch and hold skirt hem
          rightArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(-0.22, 0.55, holdWeight)
          rightArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.12, -0.28, holdWeight)
          rightArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.60, -0.35, holdWeight)

          leftArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(0.16, -0.55, holdWeight)
          leftArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(0.04, -0.28, holdWeight)
          leftArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.18, -0.35, holdWeight)

          // Skirt flaps spread
          leftHipWing.rotation.z = -0.36 - 0.22 * holdWeight
          rightHipWing.rotation.z = 0.36 + 0.22 * holdWeight

          // Wings fan out wide
          leftWing.rotation.y = -0.22 - 0.28 * holdWeight
          rightWing.rotation.y = 0.22 + 0.28 * holdWeight

          // Head bows respectfully
          headGroup.rotation.x = 0.22 * holdWeight
          eyeLeft.scale.y = 1.0 - 0.90 * holdWeight
          eyeRight.scale.y = 1.0 - 0.90 * holdWeight

          if (tSec >= totalDur) {
            activityRef.current = 'idle'
            activityRef.autoCountdown = 6.0 + Math.random() * 2.5
            setCurrentActivity('idle')
            torso.rotation.x = 0
            leftLegRig.knee.rotation.x = 0.08
            rightLegRig.knee.rotation.x = 0.04
            leftHipWing.rotation.z = -0.36
            rightHipWing.rotation.z = 0.36
            eyeLeft.scale.set(1, 1, 1)
            eyeRight.scale.set(1, 1, 1)
          }
        }

        // 5. "CURIOUS SECTOR INSPECTION" (Thoughtful chin touch & inquisitive head tilt)
        else if (act === 'inspect') {
          const inBlend = smoothBlend(tSec, 0, 0.70)
          const outBlend = smoothBlend(tSec, 2.7, 3.4)
          const actWeight = inBlend * (1 - outBlend)

          // Lean slightly toward section card
          characterRoot.rotation.y = THREE.MathUtils.lerp(0.18, 0.36, actWeight)
          torso.rotation.z = -0.06 * actWeight

          // Right hand touches chin thoughtfully
          rightArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(-0.22, 0.55, actWeight)
          rightArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.12, 0.30, actWeight)
          rightArmRig.elbow.rotation.z = THREE.MathUtils.lerp(0.38, 1.70, actWeight)
          rightArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.60, 0.35, actWeight)

          // Inquisitive head tilt
          headGroup.rotation.z = 0.16 * actWeight
          headGroup.rotation.y = 0.20 * actWeight
          headGroup.rotation.x = -0.06 * actWeight

          if (tSec >= totalDur) {
            activityRef.current = 'idle'
            activityRef.autoCountdown = 6.0 + Math.random() * 2.5
            setCurrentActivity('idle')
            torso.rotation.z = 0
            headGroup.rotation.z = 0
            headGroup.rotation.y = 0.15
            headGroup.rotation.x = 0
          }
        }
        // 6. "PROJECT CODING & COMEDIC FRUSTRATION DROP" (Realistic mecha laptop typing -> compilation glitch -> rage drop -> anti-grav catch!)
        else if (act === 'coding_rage') {
          laptopGroup.visible = true

          if (tSec < 2.2) {
            // Phase 1: Rapid enthusiastic typing on glowing cyber laptop held naturally in front
            if (activityRef.codingPhase !== 0) {
              activityRef.codingPhase = 0
              drawScreen('code', tSec)
              holoProjMat.color.setHex(0x00f5ff)
              holoProjMat.opacity = 0.25
              tractorRing.material.opacity = 0
              angerGroup.scale.set(0, 0, 0)
              sweatGroup.scale.set(0, 0, 0)
              setSpeech({ text: 'Compiling project... 💻✨', icon: '💻', visible: true })
            }

            const deployBlend = smoothBlend(tSec, 0, 0.45)
            // Laptop floats into natural typing position right at waist/rib level
            laptopGroup.position.set(
              THREE.MathUtils.lerp(0, 0.01, deployBlend),
              THREE.MathUtils.lerp(-0.06, 0.08, deployBlend),
              THREE.MathUtils.lerp(0.12, 0.19, deployBlend)
            )
            // Sweet 3/4 perspective so user and Astra both see screen & keyboard clearly
            laptopGroup.rotation.set(0.16, 0.44, -0.05)
            laptopGroup.scale.setScalar(1)
            // Unfolds open smoothly: from flat-closed (-1.57) to nicely propped open (+0.24) facing Astra
            hingeGroup.rotation.x = THREE.MathUtils.lerp(-1.57, 0.24, deployBlend)

            // Astra leans forward enthusiastically into the code
            characterRoot.rotation.y = THREE.MathUtils.lerp(0.18, 0.28, deployBlend)
            torso.rotation.x = 0.08 * deployBlend
            torso.rotation.z = 0
            // Head tilts down directly gazing into the screen
            headGroup.rotation.x = THREE.MathUtils.lerp(0, 0.32, deployBlend)
            headGroup.rotation.y = THREE.MathUtils.lerp(0.15, -0.06, deployBlend) + Math.sin(tSec * 6.0) * 0.04
            headGroup.rotation.z = 0

            // Happy focused eyes
            eyeLeft.scale.set(1.05, 1.05, 1.0)
            eyeRight.scale.set(1.05, 1.05, 1.0)
            eyeLeft.rotation.z = 0
            eyeRight.rotation.z = 0

            // Natural arm posture: elbows tucked comfortably by ribs, forearms reaching forward onto keys
            const armIn = deployBlend
            rightArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(-0.22, -0.06, armIn)
            rightArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.12, -0.26, armIn)
            rightArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.60, -0.85, armIn)
            rightArmRig.elbow.rotation.z = THREE.MathUtils.lerp(0.38, 0.36, armIn)

            leftArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(0.16, 0.06, armIn)
            leftArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(0.04, -0.26, armIn)
            leftArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.18, -0.85, armIn)
            leftArmRig.elbow.rotation.z = THREE.MathUtils.lerp(-0.10, -0.36, armIn)

            // Rapid rhythmic cute typing micro-movements on keyboard keys
            const typePhaseL = Math.sin(tSec * 28.0)
            const typePhaseR = Math.cos(tSec * 28.0 + 0.8)
            leftArmRig.handGroup.rotation.x = 0.20 + typePhaseL * 0.12
            rightArmRig.handGroup.rotation.x = 0.20 + typePhaseR * 0.12
            leftArmRig.handGroup.rotation.z = -0.12
            rightArmRig.handGroup.rotation.z = 0.12
            leftArmRig.elbow.rotation.x = -0.85 + Math.max(0, typePhaseL) * 0.04
            rightArmRig.elbow.rotation.x = -0.85 + Math.max(0, typePhaseR) * 0.04

            // Holo code beam pulses
            holoProjMat.opacity = 0.18 + Math.sin(tSec * 16.0) * 0.08
          } else if (tSec >= 2.2 && tSec < 3.3) {
            // Phase 2: Compilation Glitch, Horror & Frustrated disbelief!
            if (activityRef.codingPhase !== 1) {
              activityRef.codingPhase = 1
              drawScreen('error', tSec)
              holoProjMat.color.setHex(0xff1744)
              holoProjMat.opacity = 0.45
              setSpeech({ text: 'WAIT... 100 ERRORS?! 😱💢', icon: '💢', visible: true })
            }

            laptopGroup.position.set(0.01, 0.08, 0.19)
            laptopGroup.rotation.set(0.16, 0.44, -0.05)
            laptopGroup.scale.setScalar(1)
            hingeGroup.rotation.x = 0.24

            // Screen flashing error
            holoProjMat.opacity = 0.25 + Math.sin(tSec * 25.0) * 0.20

            // Typing stops abruptly! Hands pull back and tremble in shock
            const shockBlend = smoothBlend(tSec, 2.2, 2.45)
            rightArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(-0.06, -0.22, shockBlend)
            rightArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.26, -0.15, shockBlend)
            rightArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.85, -0.55, shockBlend)
            rightArmRig.elbow.rotation.z = THREE.MathUtils.lerp(0.36, 0.45, shockBlend)

            leftArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(0.06, 0.22, shockBlend)
            leftArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.26, -0.15, shockBlend)
            leftArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.85, -0.55, shockBlend)
            leftArmRig.elbow.rotation.z = THREE.MathUtils.lerp(-0.36, -0.45, shockBlend)

            // Hands trembling in disbelief
            const tremble = Math.sin(tSec * 36.0) * 0.08
            rightArmRig.handGroup.rotation.z = 0.08 + tremble
            leftArmRig.handGroup.rotation.z = -0.08 - tremble

            // Astra's head rapidly shakes in comedic disbelief!
            const panicShake = Math.sin((tSec - 2.2) * 26.0) * 0.14
            headGroup.rotation.y = -0.08 + panicShake
            headGroup.rotation.z = panicShake * 0.35
            headGroup.rotation.x = 0.24

            // Cute angry anime squint / furrowed brows (>_<)
            eyeLeft.scale.y = 0.15
            eyeRight.scale.y = 0.15
            eyeLeft.rotation.z = 0.30
            eyeRight.rotation.z = -0.30

            // Blushes flare hot pink!
            blushLeft.scale.setScalar(1.4)
            blushRight.scale.setScalar(1.4)

            // Cute anime anger pop (💢) and sweat drop (💧)
            const angerJitter = 1.0 + Math.sin(tSec * 22.0) * 0.22
            angerGroup.scale.setScalar(angerJitter)
            sweatGroup.scale.setScalar(1.0)
            sweatGroup.position.y = 0.24 - (tSec - 2.2) * 0.04
          } else if (tSec >= 3.3 && tSec < 4.4) {
            // Phase 3: THE FRUSTRATED LAPTOP DROP / PUSH & POUT!
            if (activityRef.codingPhase !== 2) {
              activityRef.codingPhase = 2
              holoProjMat.opacity = 0
              setSpeech({ text: 'Dropping this project!! 😤💥', icon: '💥', visible: true })
            }

            const dropElapsed = tSec - 3.3

            // Hands shove forward then cross into cute haughty pout
            const poutBlend = smoothBlend(tSec, 3.55, 3.9)
            if (dropElapsed < 0.25) {
              // Initial shove motion
              rightArmRig.armGroup.rotation.x = -0.45
              rightArmRig.armGroup.rotation.z = -0.15
              rightArmRig.elbow.rotation.x = -0.35
              leftArmRig.armGroup.rotation.x = -0.45
              leftArmRig.armGroup.rotation.z = 0.15
              leftArmRig.elbow.rotation.x = -0.35
            } else {
              // Crossed arms stubborn pout
              rightArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(-0.15, -0.55, poutBlend)
              rightArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.45, -0.35, poutBlend)
              rightArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.35, -1.35, poutBlend)
              rightArmRig.elbow.rotation.z = THREE.MathUtils.lerp(0.36, -0.32, poutBlend)

              leftArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(0.15, 0.55, poutBlend)
              leftArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.45, -0.35, poutBlend)
              leftArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.35, -1.35, poutBlend)
              leftArmRig.elbow.rotation.z = THREE.MathUtils.lerp(-0.36, 0.32, poutBlend)
            }

            // Head turns sharply away in haughty grumpy pout ( > ︿ < )
            headGroup.rotation.y = THREE.MathUtils.lerp(0, -0.38, poutBlend)
            headGroup.rotation.z = THREE.MathUtils.lerp(0, -0.12, poutBlend)
            headGroup.rotation.x = THREE.MathUtils.lerp(0.24, -0.06, poutBlend)
            torso.rotation.x = -0.06 * poutBlend

            // Closed grumpy pout eyes
            eyeLeft.scale.y = 0.05
            eyeRight.scale.y = 0.05
            eyeLeft.rotation.z = 0
            eyeRight.rotation.z = 0

            // Little mecha foot tap / stomp in frustration
            if (dropElapsed > 0.2 && dropElapsed < 0.6) {
              const stomp = Math.sin((dropElapsed - 0.2) * 18.0)
              rightLegRig.knee.rotation.x = 0.04 + Math.max(0, stomp) * 0.16
            }

            // LAPTOP TUMBLE / FALLING PHYSICS
            const fallDist = Math.min(0.56, 0.5 * 9.8 * 0.085 * dropElapsed * dropElapsed)
            laptopGroup.position.x = 0.01 + Math.sin(dropElapsed * 4.0) * 0.02
            laptopGroup.position.y = 0.12 - fallDist
            laptopGroup.position.z = 0.19 + dropElapsed * 0.05
            laptopGroup.rotation.x = 0.14 - dropElapsed * 4.8
            laptopGroup.rotation.y = -0.28 + dropElapsed * 2.5
            laptopGroup.rotation.z = Math.sin(dropElapsed * 7.0) * 0.40
            // Lid flaps during tumble
            hingeGroup.rotation.x = Math.max(-1.57, 0.28 - dropElapsed * 2.2)

            angerGroup.scale.setScalar(Math.max(0, 1.0 - dropElapsed * 0.8))
            sweatGroup.scale.setScalar(0)
          } else if (tSec >= 4.4 && tSec < 5.8) {
            // Phase 4: REALIZATION, ANTI-GRAV TRACTOR CATCH & SWEET HUG
            if (activityRef.codingPhase !== 3) {
              activityRef.codingPhase = 3
              drawScreen('success', tSec)
              angerGroup.scale.set(0, 0, 0)
              sweatGroup.scale.set(0, 0, 0)
              setSpeech({ text: 'Phew! Git reset saved it! 🥰🚀', icon: '🚀', visible: true })
            }

            const catchElapsed = tSec - 4.4
            const panicBlend = smoothBlend(tSec, 4.4, 4.65)
            const hugBlend = smoothBlend(tSec, 5.1, 5.6)

            // Eyes snap wide in initial shock, then relax into happy smiling crescents
            if (tSec < 5.0) {
              eyeLeft.scale.set(1.3, 1.35, 1.0)
              eyeRight.scale.set(1.3, 1.35, 1.0)
              headGroup.rotation.x = 0.32 * panicBlend
              headGroup.rotation.y = 0
              headGroup.rotation.z = 0
            } else {
              // Smiling happy crescent eyes
              eyeLeft.scale.set(1.0, 0.35, 1.0)
              eyeRight.scale.set(1.0, 0.35, 1.0)
              headGroup.rotation.x = THREE.MathUtils.lerp(0.32, 0.06, hugBlend)
              headGroup.rotation.z = THREE.MathUtils.lerp(0, 0.12, hugBlend)
              headGroup.rotation.y = THREE.MathUtils.lerp(0, 0.08, hugBlend)
            }

            // Both glowing hands reach down, then hug laptop
            if (tSec < 5.1) {
              // Reaching down to catch
              rightArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(-0.55, -0.15, panicBlend)
              rightArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.35, -0.45, panicBlend)
              rightArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-1.35, -0.40, panicBlend)
              rightArmRig.elbow.rotation.z = THREE.MathUtils.lerp(-0.32, 0.18, panicBlend)

              leftArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(0.55, 0.15, panicBlend)
              leftArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.35, -0.45, panicBlend)
              leftArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-1.35, -0.40, panicBlend)
              leftArmRig.elbow.rotation.z = THREE.MathUtils.lerp(0.32, -0.18, panicBlend)
            } else {
              // Loving hug over chest
              rightArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(-0.15, -0.38, hugBlend)
              rightArmRig.elbow.rotation.z = THREE.MathUtils.lerp(0.18, 0.85, hugBlend)
              rightArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.40, -0.75, hugBlend)

              leftArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(0.15, 0.38, hugBlend)
              leftArmRig.elbow.rotation.z = THREE.MathUtils.lerp(-0.18, -0.85, hugBlend)
              leftArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.40, -0.75, hugBlend)
            }

            // Glowing anti-gravity tractor beam catches laptop
            const tractorPulse = Math.sin(catchElapsed * 10.0) * 0.4 + 0.5
            tractorRing.material.opacity = tSec < 5.1 ? tractorPulse : Math.max(0, 1.0 - (tSec - 5.1) * 2.0)

            // Laptop smoothly decelerates and floats back up into Astra's arms
            const riseProgress = smoothBlend(tSec, 4.5, 5.1)
            laptopGroup.position.x = THREE.MathUtils.lerp(0.01, 0.01, riseProgress)
            laptopGroup.position.y = THREE.MathUtils.lerp(-0.42, 0.15, riseProgress)
            laptopGroup.position.z = THREE.MathUtils.lerp(0.24, 0.16, riseProgress)
            laptopGroup.rotation.x = THREE.MathUtils.lerp(-2.4, 0.15, riseProgress)
            laptopGroup.rotation.y = THREE.MathUtils.lerp(1.5, 0.10, riseProgress)
            laptopGroup.rotation.z = THREE.MathUtils.lerp(0.32, 0, riseProgress)
            hingeGroup.rotation.x = THREE.MathUtils.lerp(0, -1.57, riseProgress) // folds flat closed nicely
          } else {
            // Phase 5: Smooth stow away & back to idle
            const stowProgress = smoothBlend(tSec, 5.8, 6.3)
            laptopGroup.scale.setScalar(Math.max(0.001, 1.0 - stowProgress))
            laptopGroup.position.y = THREE.MathUtils.lerp(0.15, 0.02, stowProgress)
            tractorRing.material.opacity = 0

            // Arms relax back to rest
            rightArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(-0.38, -0.22, stowProgress)
            rightArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.45, -0.12, stowProgress)
            rightArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.75, -0.60, stowProgress)
            rightArmRig.elbow.rotation.z = THREE.MathUtils.lerp(0.85, 0.38, stowProgress)

            leftArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(0.38, 0.16, stowProgress)
            leftArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.45, 0.04, stowProgress)
            leftArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.75, -0.18, stowProgress)
            leftArmRig.elbow.rotation.z = THREE.MathUtils.lerp(-0.85, -0.10, stowProgress)

            eyeLeft.scale.setScalar(THREE.MathUtils.lerp(0.35, 1.0, stowProgress))
            eyeRight.scale.setScalar(THREE.MathUtils.lerp(0.35, 1.0, stowProgress))
            blushLeft.scale.setScalar(THREE.MathUtils.lerp(1.4, 1.0, stowProgress))
            blushRight.scale.setScalar(THREE.MathUtils.lerp(1.4, 1.0, stowProgress))

            torso.rotation.x = THREE.MathUtils.lerp(-0.06, 0, stowProgress)
            headGroup.rotation.x = THREE.MathUtils.lerp(0.06, 0, stowProgress)
            headGroup.rotation.y = THREE.MathUtils.lerp(0.08, 0.15, stowProgress)
            headGroup.rotation.z = THREE.MathUtils.lerp(0.12, 0, stowProgress)

            if (tSec >= totalDur) {
              activityRef.current = 'idle'
              activityRef.autoCountdown = 5.5 + Math.random() * 2.5
              activityRef.codingPhase = -1
              setCurrentActivity('idle')
              laptopGroup.visible = false
              laptopGroup.scale.setScalar(1)
              angerGroup.scale.set(0, 0, 0)
              sweatGroup.scale.set(0, 0, 0)
              eyeLeft.scale.set(1, 1, 1)
              eyeRight.scale.set(1, 1, 1)
              eyeLeft.rotation.z = 0
              eyeRight.rotation.z = 0
              blushLeft.scale.set(1, 1, 1)
              blushRight.scale.set(1, 1, 1)
              torso.rotation.set(0, 0, 0)
              headGroup.rotation.set(0, 0.15, 0)
            }
          }
        }
        // 7. "ACADEMIC CODEX READING & EUREKA EPIPHANY"
        else if (act === 'reading_book') {
          bookGroup.visible = true

          if (tSec < 1.3) {
            // Phase 1: Deploy & Unfold Academic Codex
            if (activityRef.readingPhase !== 0) {
              activityRef.readingPhase = 0
              turningPageGroup.rotation.y = 0
              eurekaGroup.scale.set(0, 0, 0)
              runeGroup.visible = false
              setSpeech({ text: 'Opening Academic Codex... 📖✨', icon: '📖', visible: true })
            }

            const deploy = smoothBlend(tSec, 0, 0.9)
            // Book lifts up into natural reading position in front of chest
            bookGroup.position.set(0, THREE.MathUtils.lerp(-0.06, 0.07, deploy), THREE.MathUtils.lerp(0.10, 0.19, deploy))
            // Tilted ~25 degrees up towards Astra's face
            bookGroup.rotation.set(0.42, 0, 0)
            bookGroup.scale.setScalar(deploy)

            // Covers unfold open like a real book
            leftCoverGroup.rotation.y = THREE.MathUtils.lerp(0, -0.32, deploy)
            rightCoverGroup.rotation.y = THREE.MathUtils.lerp(0, 0.32, deploy)

            // Astra leans forward attentively into the book
            characterRoot.rotation.y = THREE.MathUtils.lerp(0.18, 0.22, deploy)
            torso.rotation.x = 0.06 * deploy
            headGroup.rotation.x = THREE.MathUtils.lerp(0, 0.32, deploy)
            headGroup.rotation.y = THREE.MathUtils.lerp(0.15, 0.02, deploy)

            // Arms move up to gently cradle and support the book
            rightArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(-0.22, -0.10, deploy)
            rightArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.12, -0.32, deploy)
            rightArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.60, -0.92, deploy)
            rightArmRig.elbow.rotation.z = THREE.MathUtils.lerp(0.38, 0.34, deploy)
            rightArmRig.handGroup.rotation.x = THREE.MathUtils.lerp(-0.15, 0.24, deploy)
            rightArmRig.handGroup.rotation.z = 0.12

            leftArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(0.16, 0.10, deploy)
            leftArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(0.04, -0.32, deploy)
            leftArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.18, -0.92, deploy)
            leftArmRig.elbow.rotation.z = THREE.MathUtils.lerp(-0.10, -0.34, deploy)
            leftArmRig.handGroup.rotation.x = THREE.MathUtils.lerp(-0.10, 0.24, deploy)
            leftArmRig.handGroup.rotation.z = -0.12
          } else if (tSec >= 1.3 && tSec < 3.3) {
            // Phase 2: Deep Scholarly Absorption & Floating Knowledge Runes
            if (activityRef.readingPhase !== 1) {
              activityRef.readingPhase = 1
              runeGroup.visible = true
              setSpeech({ text: 'Absorbing Algorithms & MPC Foundations... 📜🔍', icon: '🔍', visible: true })
            }

            bookGroup.position.set(0, 0.07, 0.19)
            bookGroup.rotation.set(0.42, 0, 0)
            bookGroup.scale.setScalar(1)
            leftCoverGroup.rotation.y = -0.32
            rightCoverGroup.rotation.y = 0.32
            turningPageGroup.rotation.y = 0

            // Astra scans lines left to right with subtle head tracking
            const scan = Math.sin((tSec - 1.3) * 3.4) * 0.08
            headGroup.rotation.y = 0.02 + scan
            headGroup.rotation.x = 0.32 + Math.sin(tSec * 1.8) * 0.02

            // Hands support book steadily with subtle breathing pulse
            const breathe = Math.sin(tSec * 2.5) * 0.015
            rightArmRig.elbow.rotation.x = -0.92 + breathe
            leftArmRig.elbow.rotation.x = -0.92 + breathe

            // Holographic Knowledge Runes float upwards from the open tome
            runeMeshes.forEach((mesh, idx) => {
              const runeOffset = ((tSec * 0.12 + idx * 0.14) % 1.0)
              mesh.position.y = 0.04 + runeOffset * 0.18
              mesh.position.x = Math.sin(tSec * 2.0 + idx) * 0.08
              mesh.rotation.z = (tSec + idx) * 0.5
              if (mesh.material instanceof THREE.Material) {
                const alpha = Math.sin(runeOffset * Math.PI) * 0.9
                ;(mesh.material as THREE.MeshBasicMaterial).opacity = alpha
              }
            })
          } else if (tSec >= 3.3 && tSec < 4.7) {
            // Phase 3: Elegant Page Flip Action
            if (activityRef.readingPhase !== 2) {
              activityRef.readingPhase = 2
              setSpeech({ text: 'Flipping to Advanced Algorithmic Proofs... ⚡📚', icon: '⚡', visible: true })
            }

            bookGroup.position.set(0, 0.07, 0.19)
            bookGroup.rotation.set(0.42, 0, 0)
            leftCoverGroup.rotation.y = -0.32
            rightCoverGroup.rotation.y = 0.32

            // Page flips over smoothly from right (0) to left (-Math.PI)
            const flip = smoothBlend(tSec, 3.3, 4.4)
            turningPageGroup.rotation.y = -Math.PI * flip

            // Right hand gracefully lifts, touches page edge, and guides it across
            const flipHand = Math.sin(flip * Math.PI)
            rightArmRig.armGroup.rotation.x = -0.32 - flipHand * 0.18
            rightArmRig.armGroup.rotation.z = -0.10 - flipHand * 0.12
            rightArmRig.elbow.rotation.x = -0.92 - flipHand * 0.22
            rightArmRig.handGroup.rotation.x = 0.24 + flipHand * 0.25

            // Head tracks page movement as it turns
            headGroup.rotation.y = THREE.MathUtils.lerp(0.08, -0.06, flip)
            headGroup.rotation.x = 0.30

            // Floating runes continue to drift
            runeMeshes.forEach((mesh, idx) => {
              const runeOffset = ((tSec * 0.12 + idx * 0.14) % 1.0)
              mesh.position.y = 0.04 + runeOffset * 0.18
              mesh.position.x = Math.sin(tSec * 2.0 + idx) * 0.08
            })
          } else if (tSec >= 4.7 && tSec < 6.1) {
            // Phase 4: EUREKA! Epiphany Spark & Idea Lightbulb Halo!
            if (activityRef.readingPhase !== 3) {
              activityRef.readingPhase = 3
              runeGroup.visible = false
              turningPageGroup.rotation.y = -Math.PI
              setSpeech({ text: 'Eureka! Concept fully unlocked! 💡✨', icon: '💡', visible: true })
            }

            // Lightbulb pops above head with spring bounce
            const popT = smoothBlend(tSec, 4.7, 4.95)
            const popScale = popT < 1.0
              ? Math.sin(popT * Math.PI) * 0.35 + popT
              : 1.0 + Math.sin(tSec * 14.0) * 0.06
            eurekaGroup.scale.setScalar(popScale)
            eurekaGroup.rotation.z = (tSec - 4.7) * 1.5

            // Left arm secures book affectionately against rib
            leftArmRig.armGroup.rotation.x = -0.26
            leftArmRig.armGroup.rotation.z = 0.12
            leftArmRig.elbow.rotation.x = -0.85
            leftArmRig.handGroup.rotation.x = 0.15

            // Right arm raises triumphantly, pointing index finger upward into the air!
            const raiseT = smoothBlend(tSec, 4.7, 5.0)
            rightArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(-0.10, -0.28, raiseT)
            rightArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.32, -1.25, raiseT)
            rightArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.92, -0.22, raiseT)
            rightArmRig.elbow.rotation.z = THREE.MathUtils.lerp(0.34, 0.15, raiseT)
            rightArmRig.handGroup.rotation.x = THREE.MathUtils.lerp(0.24, 0.05, raiseT)
            rightArmRig.handGroup.rotation.z = 0.10

            // Astra tilts head up proudly with bright happy expression!
            headGroup.rotation.x = THREE.MathUtils.lerp(0.30, -0.12, raiseT)
            headGroup.rotation.y = THREE.MathUtils.lerp(-0.06, 0.14, raiseT)
            headGroup.rotation.z = THREE.MathUtils.lerp(0, 0.04, raiseT)

            // Joyful smiling eyes & blushing cheeks
            eyeLeft.scale.set(1.15, 1.15, 1)
            eyeRight.scale.set(1.15, 1.15, 1)
            blushLeft.scale.setScalar(1.35)
            blushRight.scale.setScalar(1.35)
          } else if (tSec >= 6.1 && tSec <= 7.2) {
            // Phase 5: Warm Book Hug & Knowledge Synchronized
            if (activityRef.readingPhase !== 4) {
              activityRef.readingPhase = 4
              setSpeech({ text: 'Knowledge synchronized into memory! 🎓🌟', icon: '🎓', visible: true })
            }

            const stowT = smoothBlend(tSec, 6.1, 7.2)

            // Lightbulb shrinks away
            eurekaGroup.scale.setScalar(Math.max(0, 1.0 - stowT * 2.5))

            // Book folds closed and stows away
            leftCoverGroup.rotation.y = THREE.MathUtils.lerp(-0.32, 0, stowT)
            rightCoverGroup.rotation.y = THREE.MathUtils.lerp(0.32, 0, stowT)
            turningPageGroup.rotation.y = THREE.MathUtils.lerp(-Math.PI, 0, stowT)
            bookGroup.scale.setScalar(Math.max(0.001, 1.0 - stowT))
            bookGroup.position.y = THREE.MathUtils.lerp(0.07, -0.02, stowT)

            // Arms relax back to rest
            rightArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(-0.28, -0.22, stowT)
            rightArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-1.25, -0.12, stowT)
            rightArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.22, -0.60, stowT)
            rightArmRig.elbow.rotation.z = THREE.MathUtils.lerp(0.15, 0.38, stowT)

            leftArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(0.12, 0.16, stowT)
            leftArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.26, 0.04, stowT)
            leftArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.85, -0.18, stowT)
            leftArmRig.elbow.rotation.z = THREE.MathUtils.lerp(-0.34, -0.10, stowT)

            headGroup.rotation.x = THREE.MathUtils.lerp(-0.12, 0, stowT)
            headGroup.rotation.y = THREE.MathUtils.lerp(0.14, 0.15, stowT)
            headGroup.rotation.z = THREE.MathUtils.lerp(0.04, 0, stowT)

            eyeLeft.scale.setScalar(THREE.MathUtils.lerp(1.15, 1.0, stowT))
            eyeRight.scale.setScalar(THREE.MathUtils.lerp(1.15, 1.0, stowT))
            blushLeft.scale.setScalar(THREE.MathUtils.lerp(1.35, 1.0, stowT))
            blushRight.scale.setScalar(THREE.MathUtils.lerp(1.35, 1.0, stowT))

            if (tSec >= 7.2) {
              activityRef.current = 'idle'
              activityRef.autoCountdown = 5.0 + Math.random() * 2.5
              activityRef.readingPhase = -1
              setCurrentActivity('idle')
              bookGroup.visible = false
              bookGroup.scale.setScalar(1)
              eurekaGroup.scale.set(0, 0, 0)
              runeGroup.visible = false
              turningPageGroup.rotation.y = 0
              eyeLeft.scale.set(1, 1, 1)
              eyeRight.scale.set(1, 1, 1)
              blushLeft.scale.set(1, 1, 1)
              blushRight.scale.set(1, 1, 1)
              torso.rotation.set(0, 0, 0)
              headGroup.rotation.set(0, 0.15, 0)
            }
          }
        }
        // 8. "STANDALONE EUREKA MOMENT" (Direct trigger from UI)
        else if (act === 'eureka') {
          const eurekaDur = 3.8
          const progress = tSec / eurekaDur

          if (tSec < 0.25) {
            setSpeech({ text: 'Eureka! Concept fully unlocked! 💡✨', icon: '💡', visible: true })
          }

          if (progress < 0.75) {
            const popT = smoothBlend(tSec, 0, 0.35)
            const popScale = popT < 1.0
              ? Math.sin(popT * Math.PI) * 0.35 + popT
              : 1.0 + Math.sin(tSec * 14.0) * 0.06
            eurekaGroup.scale.setScalar(popScale)
            eurekaGroup.rotation.z = tSec * 1.8

            rightArmRig.armGroup.rotation.z = -0.28
            rightArmRig.armGroup.rotation.x = -1.25
            rightArmRig.elbow.rotation.x = -0.22
            rightArmRig.elbow.rotation.z = 0.15

            leftArmRig.armGroup.rotation.z = 0.22
            leftArmRig.armGroup.rotation.x = -0.15
            leftArmRig.elbow.rotation.x = -0.45

            headGroup.rotation.x = -0.12
            headGroup.rotation.y = 0.14

            eyeLeft.scale.set(1.15, 1.15, 1)
            eyeRight.scale.set(1.15, 1.15, 1)
            blushLeft.scale.setScalar(1.35)
            blushRight.scale.setScalar(1.35)
          } else {
            const easeOut = smoothBlend(progress, 0.75, 1.0)
            eurekaGroup.scale.setScalar(Math.max(0, 1.0 - easeOut))

            rightArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-1.25, -0.12, easeOut)
            rightArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.22, -0.60, easeOut)
            rightArmRig.elbow.rotation.z = THREE.MathUtils.lerp(0.15, 0.38, easeOut)

            leftArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.15, 0.04, easeOut)
            leftArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.45, -0.18, easeOut)

            headGroup.rotation.x = THREE.MathUtils.lerp(-0.12, 0, easeOut)
            headGroup.rotation.y = THREE.MathUtils.lerp(0.14, 0.15, easeOut)

            eyeLeft.scale.setScalar(THREE.MathUtils.lerp(1.15, 1.0, easeOut))
            eyeRight.scale.setScalar(THREE.MathUtils.lerp(1.15, 1.0, easeOut))
            blushLeft.scale.setScalar(THREE.MathUtils.lerp(1.35, 1.0, easeOut))
            blushRight.scale.setScalar(THREE.MathUtils.lerp(1.35, 1.0, easeOut))

            if (tSec >= eurekaDur) {
              activityRef.current = 'idle'
              activityRef.autoCountdown = 5.0 + Math.random() * 2.5
              setCurrentActivity('idle')
              eurekaGroup.scale.set(0, 0, 0)
              eyeLeft.scale.set(1, 1, 1)
              eyeRight.scale.set(1, 1, 1)
              blushLeft.scale.set(1, 1, 1)
              blushRight.scale.set(1, 1, 1)
              headGroup.rotation.set(0, 0.15, 0)
            }
          }
        }
        // 9. "HOLDING AWARDS & CREDENTIALS PRESENTATION"
        else if (act === 'holding_awards') {
          const awardsDur = 4.2
          awardsGroup.visible = true
          laptopGroup.visible = false
          bookGroup.visible = false

          // Trophy & Star celebratory rotations
          victoryStar.rotation.y = elapsed * 2.8
          victoryStar.rotation.x = elapsed * 1.8
          trophySparkles.rotation.y = elapsed * 1.2
          trophySparkles.children.forEach((sp, i) => {
            sp.position.y = 0.05 + Math.sin(elapsed * 3.5 + i) * 0.02
          })

          // Nova proudly raises the trophy cup slightly higher and smiles brightly
          const liftPhase = Math.sin(Math.min(1, tSec / 0.8) * Math.PI * 0.5)
          const trophyLiftY = THREE.MathUtils.lerp(0.04, 0.09, liftPhase) + Math.sin(elapsed * 2.5) * 0.008
          trophyCupGroup.position.y = trophyLiftY
          certScrollGroup.position.y = 0.02 + Math.sin(elapsed * 2.5) * 0.008
          medalRigGroup.position.y = 0.08 + Math.sin(elapsed * 2.5) * 0.005

          // Right arm holding trophy cup proudly
          rightArmRig.armGroup.rotation.z = THREE.MathUtils.lerp(-0.16, -0.26, liftPhase)
          rightArmRig.armGroup.rotation.x = THREE.MathUtils.lerp(-0.42, -0.68, liftPhase)
          rightArmRig.elbow.rotation.x = THREE.MathUtils.lerp(-0.72, -0.58, liftPhase)
          rightArmRig.elbow.rotation.z = 0.28
          rightArmRig.handGroup.rotation.x = 0.24
          rightArmRig.handGroup.rotation.z = 0.08

          // Left arm presenting certificate scroll & medals
          leftArmRig.armGroup.rotation.z = 0.16
          leftArmRig.armGroup.rotation.x = -0.38
          leftArmRig.elbow.rotation.x = -0.72
          leftArmRig.elbow.rotation.z = -0.26
          leftArmRig.handGroup.rotation.x = 0.20
          leftArmRig.handGroup.rotation.z = -0.10

          // Head looks proudly and joyfully at viewer
          headGroup.rotation.x = -0.05 + Math.sin(elapsed * 2.0) * 0.02
          headGroup.rotation.y = 0.06
          headGroup.rotation.z = 0.02

          // Joyful beaming eyes & blush
          eyeLeft.scale.set(1.15, 1.15, 1)
          eyeRight.scale.set(1.15, 1.15, 1)
          blushLeft.scale.setScalar(1.35)
          blushRight.scale.setScalar(1.35)

          if (tSec >= awardsDur) {
            activityRef.current = 'idle'
            activityRef.autoCountdown = 5.0 + Math.random() * 2.0
            setCurrentActivity('idle')
          }
        }
      } else {
        // IDLE STATE: Attentive gaze tracking user cursor & gentle natural breathing
        laptopGroup.visible = false
        bookGroup.visible = false
        eurekaGroup.scale.set(0, 0, 0)
        runeGroup.visible = false
        angerGroup.scale.set(0, 0, 0)
        sweatGroup.scale.set(0, 0, 0)
        tractorRing.material.opacity = 0
        eyeLeft.rotation.z = 0
        eyeRight.rotation.z = 0
        torso.rotation.x = THREE.MathUtils.damp(torso.rotation.x, 0, 8, delta)
        rightLegRig.knee.rotation.x = THREE.MathUtils.damp(rightLegRig.knee.rotation.x, 0.04, 8, delta)

        if (activeSection === 'achievements' && !farewellMode) {
          awardsGroup.visible = true
          // Nova naturally holds the Golden Trophy Cup, Certificate Scroll and Medals
          const awardsBreath = Math.sin(elapsed * 2.2) * 0.008
          trophyCupGroup.position.y = 0.04 + awardsBreath
          certScrollGroup.position.y = 0.02 + awardsBreath
          medalRigGroup.position.y = 0.08 + awardsBreath * 0.5

          victoryStar.rotation.y = elapsed * 2.2
          victoryStar.rotation.x = elapsed * 1.5
          trophySparkles.rotation.y = elapsed * 0.8
          trophySparkles.children.forEach((sp, i) => {
            sp.position.y = 0.05 + Math.sin(elapsed * 3.0 + i) * 0.015
          })

          rightArmRig.armGroup.rotation.z = THREE.MathUtils.damp(rightArmRig.armGroup.rotation.z, -0.16, 8, delta)
          rightArmRig.armGroup.rotation.x = THREE.MathUtils.damp(rightArmRig.armGroup.rotation.x, -0.42, 8, delta)
          rightArmRig.elbow.rotation.x = THREE.MathUtils.damp(rightArmRig.elbow.rotation.x, -0.72, 8, delta)
          rightArmRig.elbow.rotation.z = THREE.MathUtils.damp(rightArmRig.elbow.rotation.z, 0.26, 8, delta)
          rightArmRig.handGroup.rotation.x = THREE.MathUtils.damp(rightArmRig.handGroup.rotation.x, 0.22, 8, delta)
          rightArmRig.handGroup.rotation.z = THREE.MathUtils.damp(rightArmRig.handGroup.rotation.z, 0.10, 8, delta)

          leftArmRig.armGroup.rotation.z = THREE.MathUtils.damp(leftArmRig.armGroup.rotation.z, 0.16, 8, delta)
          leftArmRig.armGroup.rotation.x = THREE.MathUtils.damp(leftArmRig.armGroup.rotation.x, -0.38, 8, delta)
          leftArmRig.elbow.rotation.x = THREE.MathUtils.damp(leftArmRig.elbow.rotation.x, -0.72, 8, delta)
          leftArmRig.elbow.rotation.z = THREE.MathUtils.damp(leftArmRig.elbow.rotation.z, -0.26, 8, delta)
          leftArmRig.handGroup.rotation.x = THREE.MathUtils.damp(leftArmRig.handGroup.rotation.x, 0.20, 8, delta)
          leftArmRig.handGroup.rotation.z = THREE.MathUtils.damp(leftArmRig.handGroup.rotation.z, -0.10, 8, delta)

          headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, -0.04, 6, delta)
          headGroup.rotation.y = THREE.MathUtils.damp(headGroup.rotation.y, 0.08 + p.x * 0.15, 6, delta)
          headGroup.rotation.z = THREE.MathUtils.damp(headGroup.rotation.z, 0.02, 6, delta)

          eyeLeft.scale.set(1.1, 1.1, 1)
          eyeRight.scale.set(1.1, 1.1, 1)
          blushLeft.scale.setScalar(1.25)
          blushRight.scale.setScalar(1.25)

          const hairBob = Math.sin(elapsed * 2.2 - 0.5) * 0.05
          tailLeft.rotation.z = hairBob
          tailRight.rotation.z = -hairBob
        } else if (farewellMode) {
          awardsGroup.visible = false
          // Continuous cheerful waving farewell gesture
          const wavePhase = Math.sin(elapsed * 8.0)
          const waveAngle = wavePhase * 0.32

          characterRoot.rotation.y = THREE.MathUtils.damp(characterRoot.rotation.y, 0.08, 6, delta)

          // Right arm raised high with cheerful hand waving
          rightArmRig.armGroup.rotation.z = THREE.MathUtils.damp(rightArmRig.armGroup.rotation.z, 1.25 + waveAngle * 0.10, 8, delta)
          rightArmRig.armGroup.rotation.x = THREE.MathUtils.damp(rightArmRig.armGroup.rotation.x, 0.18, 8, delta)
          rightArmRig.elbow.rotation.z = THREE.MathUtils.damp(rightArmRig.elbow.rotation.z, 1.95, 8, delta)
          rightArmRig.elbow.rotation.x = THREE.MathUtils.damp(rightArmRig.elbow.rotation.x, 0.28, 8, delta)
          rightArmRig.handGroup.rotation.z = waveAngle
          rightArmRig.forearm.rotation.z = waveAngle * 0.35

          // Left arm resting gracefully by skirt
          leftArmRig.armGroup.rotation.z = THREE.MathUtils.damp(leftArmRig.armGroup.rotation.z, 0.18, 6, delta)
          leftArmRig.armGroup.rotation.x = THREE.MathUtils.damp(leftArmRig.armGroup.rotation.x, -0.05, 6, delta)

          // Sweet head tilt & nod
          headGroup.rotation.z = THREE.MathUtils.damp(headGroup.rotation.z, -0.14 + Math.sin(elapsed * 2.2) * 0.04, 6, delta)
          headGroup.rotation.y = THREE.MathUtils.damp(headGroup.rotation.y, 0.10 + Math.cos(elapsed * 1.8) * 0.04, 6, delta)
          headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, -0.04 + Math.sin(elapsed * 3.0) * 0.02, 6, delta)

          // Smiling crescent eyes & cute blushing cheeks
          eyeLeft.scale.y = THREE.MathUtils.damp(eyeLeft.scale.y, 0.40, 6, delta)
          eyeRight.scale.y = THREE.MathUtils.damp(eyeRight.scale.y, 0.40, 6, delta)
          blushLeft.scale.setScalar(1.30)
          blushRight.scale.setScalar(1.30)

          // Twin-tails bob gently in cosmic gravity
          const hairBob = Math.sin(elapsed * 2.4) * 0.06
          tailLeft.rotation.z = hairBob
          tailRight.rotation.z = -hairBob
        } else {
          awardsGroup.visible = false
          characterRoot.rotation.y = THREE.MathUtils.damp(characterRoot.rotation.y, 0.18 + p.x * 0.20, 6, delta)

          // Head glances attentively at reading position
          headGroup.rotation.y = THREE.MathUtils.damp(headGroup.rotation.y, 0.15 + p.x * 0.25, 6, delta)
          headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, -p.y * 0.15 - 0.02, 6, delta)
          headGroup.rotation.z = THREE.MathUtils.damp(headGroup.rotation.z, -p.x * 0.07 + Math.sin(elapsed * 1.5) * 0.02, 6, delta)

          // Twin-tails bob gently in cosmic gravity
          const hairBob = Math.sin(elapsed * 2.2 - 0.5) * 0.05
          tailLeft.rotation.z = hairBob
          tailRight.rotation.z = -hairBob

          // Serene standing posture with gentle natural sway
          const armSway = Math.sin(elapsed * 2.2) * 0.018
          rightArmRig.armGroup.rotation.z = THREE.MathUtils.damp(rightArmRig.armGroup.rotation.z, -0.22 + armSway * 0.4, 8, delta)
          rightArmRig.armGroup.rotation.x = THREE.MathUtils.damp(rightArmRig.armGroup.rotation.x, -0.12 + armSway * 0.3, 8, delta)
          rightArmRig.elbow.rotation.x = THREE.MathUtils.damp(rightArmRig.elbow.rotation.x, -0.60, 8, delta)
          rightArmRig.elbow.rotation.z = THREE.MathUtils.damp(rightArmRig.elbow.rotation.z, 0.38, 8, delta)
          rightArmRig.handGroup.rotation.z = THREE.MathUtils.damp(rightArmRig.handGroup.rotation.z, -0.15, 8, delta)
          rightArmRig.forearm.rotation.z = THREE.MathUtils.damp(rightArmRig.forearm.rotation.z, 0, 8, delta)

          leftArmRig.armGroup.rotation.z = THREE.MathUtils.damp(leftArmRig.armGroup.rotation.z, 0.16 - armSway * 0.5, 8, delta)
          leftArmRig.armGroup.rotation.x = THREE.MathUtils.damp(leftArmRig.armGroup.rotation.x, 0.04, 8, delta)
          leftArmRig.elbow.rotation.x = THREE.MathUtils.damp(leftArmRig.elbow.rotation.x, -0.18, 8, delta)
          leftArmRig.elbow.rotation.z = THREE.MathUtils.damp(leftArmRig.elbow.rotation.z, -0.10, 8, delta)
        }
      }

      // Stardust drift
      particles.rotation.y = elapsed * 0.035

      renderer.render(scene, camera)
    }

    animate()

    // 7. Responsive Resize Observer
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth || 260
      const h = container.clientHeight || 340
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    return () => {
      clearTimeout(welcomeTimeout)
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerleave', handlePointerLeave)
      window.removeEventListener('scroll', handleScroll, { capture: true })
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
      resizeObserver.disconnect()

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry?.dispose()
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
          mats.forEach((m: THREE.Material) => m?.dispose())
        }
      })
      kbTexture.dispose()
      screenTexture.dispose()
      leftBookTexture.dispose()
      rightBookTexture.dispose()
      turnPageTexture.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div className="astra-section-guide-stage" role="img" aria-label="Nova Cybernetic Female Scholar Guide">
      {/* 3D WebGL Canvas Mount (Autonomous, live anime mecha character) */}
      <div
        ref={mountRef}
        className="astra-guide-canvas-mount"
        title="Nova Section Companion — Autonomous Guide"
      />

      {/* Floating Holographic Speech Bubble (hidden in farewellMode since farewell modal has dedicated speech bubble) */}
      {!farewellMode && (
        <div className={`astra-speech-bubble ${speech.visible ? 'is-visible' : ''}`} aria-live="polite">
          <span className="speech-icon">{speech.icon}</span>
          <span className="speech-text">{speech.text}</span>
        </div>
      )}
    </div>
  )
}
