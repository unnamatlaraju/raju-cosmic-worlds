import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Icon } from './Icon'

export type DestinationType = 'education' | 'projects' | 'skills' | 'achievements' | 'vidyu'

interface CosmicCompanion3DProps {
  autoStart?: boolean
  autoStartDelay?: number
  onExploreProject?: () => void
  onTravel?: (destination: DestinationType) => void
  isMuted?: boolean
  onToggleMute?: (muted: boolean) => void
  activeDossier?: DestinationType | null
}

interface TimedWord {
  word: string
  t: number // timestamp in seconds from audio waveform analysis
}

// Internal speech words list for streaming subtitle synchronization
const TIMED_SPEECH_WORDS: TimedWord[] = [
  { word: 'Touchdown', t: 0.38 },
  { word: 'confirmed!', t: 0.88 },
  { word: 'Welcome', t: 1.80 },
  { word: 'to', t: 2.30 },
  { word: 'Vidyu', t: 2.45 },
  { word: 'World,', t: 2.80 },
  { word: 'Commander.', t: 3.25 },
  { word: 'I’m', t: 4.20 },
  { word: 'Ember,', t: 4.58 },
  { word: 'your', t: 5.35 },
  { word: 'cosmic', t: 5.70 },
  { word: 'guide.', t: 6.30 },
  { word: 'Ahead', t: 7.60 },
  { word: 'lies', t: 8.00 },
  { word: 'Raju’s', t: 8.28 },
  { word: 'flagship', t: 8.65 },
  { word: 'software', t: 9.00 },
  { word: 'universe—from', t: 9.45 },
  { word: 'production', t: 10.10 },
  { word: 'engineering', t: 10.45 },
  { word: 'to', t: 11.40 },
  { word: 'interactive', t: 11.65 },
  { word: 'systems.', t: 12.75 },
  { word: 'Let’s', t: 14.60 },
  { word: 'explore', t: 15.00 },
  { word: 'what', t: 15.40 },
  { word: 'he’s', t: 15.58 },
  { word: 'built!', t: 15.75 },
]

interface StreamingTextProps {
  words: TimedWord[]
  active: boolean
  audioRef: React.RefObject<HTMLAudioElement | null> | React.MutableRefObject<HTMLAudioElement | null>
  speechStartTimeRef: React.MutableRefObject<number> | React.RefObject<number> | { current: number }
  speaking: boolean
  streamTrigger: number
}

/**
 * Transitions.dev — Streaming Text (P30) Synchronized 1:1 with Voice Audio
 * Words materialise exactly as spoken by the 3D companion using the
 * signature transitions.dev optical cross-blur and opacity resolve.
 */
function StreamingText({
  words,
  active,
  audioRef,
  speechStartTimeRef,
  speaking: _speaking,
  streamTrigger,
}: StreamingTextProps) {
  const [revealedCount, setRevealedCount] = useState(0)

  useEffect(() => {
    if (!active) {
      setRevealedCount(0)
      return
    }

    // Reset word count immediately upon new trigger (start / replay)
    setRevealedCount(0)

    let animId: number
    const audio = audioRef.current

    const tick = () => {
      let time = 0
      if (audio && !audio.paused && audio.currentTime > 0) {
        time = audio.currentTime
      } else if (speechStartTimeRef.current > 0) {
        time = performance.now() / 1000 - speechStartTimeRef.current
      }

      if (time > 0) {
        let count = 0
        while (count < words.length && time >= words[count].t) {
          count++
        }
        setRevealedCount(count)
      }
      animId = requestAnimationFrame(tick)
    }

    animId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(animId)
  }, [active, audioRef, speechStartTimeRef, streamTrigger, words])

  // Static display mode fallback when active without a trigger
  useEffect(() => {
    if (active && streamTrigger === 0) {
      setRevealedCount(words.length)
    }
  }, [active, streamTrigger, words.length])

  return (
    <p className="deck-speech-text t-stream">
      {words.map((item, i) => (
        <span key={i}>
          <span className={`t-stream-w ${i < revealedCount ? 'is-in' : ''}`}>
            {item.word}
          </span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </p>
  )
}

export function CosmicCompanion3D({
  autoStart = true,
  autoStartDelay = 750,
  onExploreProject: _onExploreProject,
  onTravel,
  isMuted: isMutedProp,
  onToggleMute,
  activeDossier,
}: CosmicCompanion3DProps = {}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [speaking, setSpeaking] = useState(false)
  const [showText, setShowText] = useState(false)
  const [streamTrigger, setStreamTrigger] = useState(0)
  const [introCompleted, setIntroCompleted] = useState(false)

  // Mute voice state with localStorage persistence
  const [internalMuted, setInternalMuted] = useState(() => {
    try {
      return localStorage.getItem('ember_voice_muted') === 'true'
    } catch {
      return false
    }
  })
  const isMuted = isMutedProp !== undefined ? isMutedProp : internalMuted
  const isMutedRef = useRef(isMuted)

  // Audio & speech references
  const speakingRef = useRef(false)
  const introCompletedRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const speechVolumeRef = useRef<number>(0)
  const speechStartTimeRef = useRef<number>(0)

  // Synchronize isMuted with audio elements and Web Audio gain
  useEffect(() => {
    isMutedRef.current = isMuted
    if (audioElementRef.current) {
      audioElementRef.current.muted = isMuted
    }
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(isMuted ? 0 : 1, audioContextRef.current.currentTime)
    }
    if (isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
  }, [isMuted])

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const next = !isMuted
    setInternalMuted(next)
    try {
      localStorage.setItem('ember_voice_muted', String(next))
    } catch {
      // ignore
    }
    onToggleMute?.(next)
  }

  // Keep speakingRef and introCompletedRef in sync with state for Three.js render loop
  useEffect(() => {
    speakingRef.current = speaking
  }, [speaking])

  useEffect(() => {
    introCompletedRef.current = introCompleted
  }, [introCompleted])

  // Stop & completely silence Ember voice whenever user navigates or interrupts
  const stopSpeech = () => {
    const audio = audioElementRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    if ('speechSynthesis' in window) {
      queueMicrotask(() => {
        try { window.speechSynthesis.cancel() } catch { /* ignore */ }
      })
    }
    if (gainNodeRef.current && audioContextRef.current) {
      try {
        gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current.currentTime)
      } catch {
        // ignore
      }
    }
    setSpeaking(false)
    speakingRef.current = false
    setShowText(false)
    speechVolumeRef.current = 0
    speechStartTimeRef.current = 0
    introCompletedRef.current = true
    setIntroCompleted(true)
  }

  const activeDossierRef = useRef(activeDossier)
  useEffect(() => {
    activeDossierRef.current = activeDossier
    if (activeDossier) {
      stopSpeech()
    }
  }, [activeDossier])

  // Mark completion of introduction: unlocks full canyon locomotion and interaction
  const markIntroCompleted = () => {
    setSpeaking(false)
    speakingRef.current = false
    speechVolumeRef.current = 0
    speechStartTimeRef.current = 0
    introCompletedRef.current = true
    setIntroCompleted(true)
  }

  // Animation & behavior references
  const pointerRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, isVeryTop: false })
  const blinkStateRef = useRef({ nextBlink: 2.5, isBlinking: false, blinkProgress: 0 })
  const walkStateRef = useRef({
    charX: -1.2,
    targetCharX: -1.2,
    walkCycle: 0,
    walkSpeed: 0,
    isWalking: false,
    isJumping: false,
    jumpProgress: 0,
    jumpApexY: 1.30,
    jumpStartX: -1.2,
    jumpTargetX: -1.2,
    jumpCooldown: 0,
    jumpType: 'reach' as 'reach' | 'leap' | 'hop',
    catchTimer: 0,
    catchAction: 0,
    hopTimer: 0,
    topJumpTimer: 0,
  })

  const speechText =
    "Touchdown confirmed! Welcome to Vidyu World, Commander. I’m Ember, your cosmic guide. Ahead lies Raju’s flagship software universe—from production engineering to interactive systems. Let’s explore what he's built!"

  useEffect(() => {
    // 1. Setup Audio Element
    const audio = new Audio('/audio/characters/ember-welcome.mp3')
    audio.preload = 'auto'
    audio.muted = isMutedRef.current
    audioElementRef.current = audio

    audio.onended = () => {
      markIntroCompleted()
    }
    audio.onpause = () => {
      if (audio.currentTime > 0 && audio.currentTime >= (audio.duration || 16) - 0.25) {
        markIntroCompleted()
      } else {
        setSpeaking(false)
        speakingRef.current = false
        speechVolumeRef.current = 0
        speechStartTimeRef.current = 0
      }
    }

    return () => {
      audio.pause()
      audio.currentTime = 0
    }
  }, [])

  const startAudioContext = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8

      if (audioElementRef.current && !audioSourceRef.current) {
        try {
          const source = ctx.createMediaElementSource(audioElementRef.current)
          const gainNode = ctx.createGain()
          gainNode.gain.setValueAtTime(isMutedRef.current ? 0 : 1, ctx.currentTime)
          source.connect(analyser)
          analyser.connect(gainNode)
          gainNode.connect(ctx.destination)
          audioSourceRef.current = source
          gainNodeRef.current = gainNode
        } catch {
          // If already bound to another context, safely route analyser
        }
      }

      audioContextRef.current = ctx
      analyserRef.current = analyser
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }
  }

  const startSpeech = () => {
    setShowText(true)
    startAudioContext()
    const audio = audioElementRef.current
    if (!audio) return

    setStreamTrigger((t) => t + 1)
    audio.currentTime = 0
    audio.muted = isMutedRef.current
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(isMutedRef.current ? 0 : 1, audioContextRef.current.currentTime)
    }
    audio.play().then(() => {
      setSpeaking(true)
      speakingRef.current = true
      speechStartTimeRef.current = performance.now() / 1000
    }).catch((err) => {
      console.warn('Audio play prevented or needs gesture:', err)
      // Fallback: If browser requires gesture, text still streams in sync with time
      setSpeaking(true)
      speakingRef.current = true
      speechStartTimeRef.current = performance.now() / 1000
      if ('speechSynthesis' in window && !isMutedRef.current) {
        window.speechSynthesis.cancel()
        const utt = new SpeechSynthesisUtterance(speechText)
        utt.pitch = 1.15
        utt.rate = 1.05
        utt.onstart = () => {
          setSpeaking(true)
          speakingRef.current = true
          speechStartTimeRef.current = performance.now() / 1000
        }
        utt.onend = () => {
          markIntroCompleted()
        }
        window.speechSynthesis.speak(utt)
      }
    })
  }


  const triggerJump = (targetX?: number) => {
    const ws = walkStateRef.current
    // Only strictly after completion of introduction can Ember jump
    if (!introCompletedRef.current || ws.isJumping || ws.jumpCooldown > 0 || speakingRef.current) return
    ws.isJumping = true
    ws.jumpProgress = 0
    ws.jumpStartX = ws.charX
    ws.jumpTargetX = typeof targetX === 'number' ? THREE.MathUtils.clamp(targetX, -2.3, 0.4) : ws.targetCharX
    ws.jumpApexY = 1.30 // High, dramatic sky leap toward cursor
    ws.jumpType = 'reach'
    ws.jumpCooldown = 0.95
    ws.topJumpTimer = 0
  }

  const handleStageClick = () => {
    // Before completion of introduction, clicking starts speech if blocked by browser policy
    if (!introCompletedRef.current && !speakingRef.current) {
      startSpeech()
    }
    // No jumping on stage click!
  }

  // Automatic introduction start after transit settling (zero user interface required)
  useEffect(() => {
    if (!autoStart) return
    const timer = setTimeout(() => {
      startSpeech()
    }, autoStartDelay)

    return () => clearTimeout(timer)
  }, [autoStart, autoStartDelay])

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    // 2. Setup Three.js Scene, Camera & Transparent Renderer
    const scene = new THREE.Scene()

    const width = container.clientWidth || 340
    const height = container.clientHeight || 460
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50)
    camera.position.set(0, 1.25, 4.2)
    camera.lookAt(0, 1.15, 0)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    renderer.shadowMap.enabled = false
    container.appendChild(renderer.domElement)

    // 3. Cinematic Planetary Sunset Lighting Scheme (Grounds character in Vidyu World's atmosphere!)
    const ambientLight = new THREE.AmbientLight(0xfff7ed, 2.4)
    scene.add(ambientLight)

    // Warm Sun Key Light from horizon right (matches Vidyu World's blazing setting sun)
    const sunsetKeyLight = new THREE.DirectionalLight(0xf59e0b, 5.0)
    sunsetKeyLight.position.set(4.2, 1.4, -2.2)
    scene.add(sunsetKeyLight)

    // Vibrant Electric Cyan Rim Backlight from deep space left
    const cyanRimLight = new THREE.DirectionalLight(0x38bdf8, 3.8)
    cyanRimLight.position.set(-3.5, 2.2, -2.0)
    scene.add(cyanRimLight)

    // Soft Studio Front Key Light (keeps front crest, visor, and uniform crisp)
    const frontKeyLight = new THREE.DirectionalLight(0xffedd5, 2.8)
    frontKeyLight.position.set(1.0, 2.5, 3.2)
    scene.add(frontKeyLight)

    // Planetary Surface Ambient Bounce Light from below
    const groundBounce = new THREE.DirectionalLight(0xd97706, 1.4)
    groundBounce.position.set(0, -2.0, 1.2)
    scene.add(groundBounce)

    // Dynamic Speech Mouth & Face Light
    const mouthSpeechLight = new THREE.PointLight(0x00f5ff, 0.4, 3.0)
    mouthSpeechLight.position.set(0, 1.35, 0.6)
    scene.add(mouthSpeechLight)

    // 4. Unique Cosmic Explorer Uniform Materials Palette
    // A. Pristine Glossy Pearl White (Base Helmet, Sleeves, Trousers)
    const matGlossyWhite = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.12,
      metalness: 0.05,
    })

    // B. Midnight Space Cadet Navy (Tailored Flight Uniform Vest, Belt, Knee Guards, Boot Accents)
    const matCadetNavy = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.35,
    })

    // C. Cosmic Tangerine / Solar Coral (Uniform Piping, Racing Stripes, Shoulder Epaulettes, Boot Bodies)
    const matCosmicOrange = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      roughness: 0.2,
      metalness: 0.25,
      emissive: 0xc2410c,
      emissiveIntensity: 0.25,
    })

    // D. Solar Gold (Mission Crest, Epaulette Trim, Buckle, Knuckles, Sole Treads)
    const matSolarGold = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.16,
      metalness: 0.9,
      emissive: 0xb45309,
      emissiveIntensity: 0.25,
    })

    // E. High-Tech Slate (Mechanical Joints)
    const matSlateJoint = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.45,
      metalness: 0.4,
    })

    // F. Jet-Black Ultra-Glossy Obsidian Face Visor Screen (Zero bleed, 100% contrast)
    const matGlossyVisor = new THREE.MeshStandardMaterial({
      color: 0x04060c,
      roughness: 0.05,
      metalness: 0.1,
    })

    // G. ULTRA-BRIGHT NEON CYAN (THE HIGHLIGHT EYES - 100% MAXIMUM VISIBILITY)
    const matEyeCyan = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
    })

    const matEyeGlow = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
    })

    const matEyeSparkle = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    })

    const matSmileGlow = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
    })

    const matCoreCyan = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
    })

    // 5. Hierarchical Cute Robot Assembly
    const characterRoot = new THREE.Group()
    characterRoot.position.set(0, 0, 0)
    scene.add(characterRoot)

    // A. Soft Antigravity Ion Field Disk under the floating companion
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
      uniforms: {
        uTime: { value: 0 },
      },
    })
    const levitationField = new THREE.Mesh(fieldGeo, fieldMat)
    levitationField.rotation.x = -Math.PI / 2
    levitationField.position.y = -0.06
    characterRoot.add(levitationField)

    // B. Tailored Flight Uniform Belt & Waist
    const hips = new THREE.Group()
    hips.name = 'hips'
    hips.position.y = 0.58
    characterRoot.add(hips)

    // White Tailored Trousers Upper Basin
    const pelvisMesh = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 20), matGlossyWhite)
    pelvisMesh.scale.set(1.05, 0.75, 0.95)
    hips.add(pelvisMesh)

    // Tailored Cadet Flight Belt in Midnight Navy
    const flightBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.186, 0.186, 0.046, 24), matCadetNavy)
    hips.add(flightBelt)

    // Center Gold Belt Buckle
    const beltBuckle = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.048, 0.02), matSolarGold)
    beltBuckle.position.set(0, 0, 0.186)
    hips.add(beltBuckle)

    // Symmetrical Left & Right Utility Canisters on the hips
    const leftCanister = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.065, 12), matCosmicOrange)
    leftCanister.position.set(-0.19, 0, 0)
    hips.add(leftCanister)

    const rightCanister = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.065, 12), matCosmicOrange)
    rightCanister.position.set(0.19, 0, 0)
    hips.add(rightCanister)

    // C. Torso with Tailored Midnight Navy Cadet Vest & Insignia
    const torso = new THREE.Group()
    torso.name = 'torso'
    torso.position.y = 0.12
    hips.add(torso)

    // Pearl White Inner Shirt Body
    const bodyMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), matGlossyWhite)
    bodyMesh.scale.set(1.0, 1.18, 0.96)
    bodyMesh.position.y = 0.14
    torso.add(bodyMesh)

    // TAILORED MIDNIGHT NAVY CADET FLIGHT VEST (Symmetrical, Clean, Bespoke!)
    const vestChest = new THREE.Mesh(
      new THREE.CylinderGeometry(0.21, 0.20, 0.24, 24, 1, false, -Math.PI * 0.44, Math.PI * 0.88),
      matCadetNavy
    )
    vestChest.position.set(0, 0.15, 0.02)
    torso.add(vestChest)

    // Symmetrical Solar Tangerine Racing Epaulettes (Left & Right chest stripes)
    const leftStripe = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.22, 0.015), matCosmicOrange)
    leftStripe.position.set(-0.095, 0.15, 0.20)
    leftStripe.rotation.z = -0.08
    torso.add(leftStripe)

    const rightStripe = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.22, 0.015), matCosmicOrange)
    rightStripe.position.set(0.095, 0.15, 0.20)
    rightStripe.rotation.z = 0.08
    torso.add(rightStripe)

    // Center Gold Mission Badge (Diamond Insignia)
    const missionBadge = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.015), matSolarGold)
    missionBadge.rotation.z = Math.PI / 4
    missionBadge.position.set(0, 0.18, 0.205)
    torso.add(missionBadge)

    // Center Telemetry Reactor Core in the Badge
    const heartCore = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 16), matCoreCyan)
    heartCore.position.set(0, 0.18, 0.215)
    torso.add(heartCore)

    // D. Neck
    const neck = new THREE.Group()
    neck.position.y = 0.36
    torso.add(neck)

    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.06, 16), matSlateJoint)
    neckMesh.position.y = 0.03
    neck.add(neckMesh)

    const neckCollar = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 12, 24), matSolarGold)
    neckCollar.rotation.x = Math.PI / 2
    neckCollar.position.y = 0.04
    neck.add(neckCollar)

    // E. Symmetrical Helmet, Symmetrical Obsidian Visor & Crystal Clear Highlight Eyes
    const headGroup = new THREE.Group()
    headGroup.name = 'headGroup'
    headGroup.position.y = 0.14
    neck.add(headGroup)

    // Pearl White Astronaut Helmet Base
    const headSkull = new THREE.Mesh(new THREE.SphereGeometry(0.33, 32, 32), matGlossyWhite)
    headGroup.add(headSkull)

    // Gold Helmet Racing Stripe running symmetrically over top
    const crestStripe = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.015, 0.42), matSolarGold)
    crestStripe.position.set(0, 0.325, -0.05)
    crestStripe.rotation.x = -0.2
    headGroup.add(crestStripe)

    // 100% Symmetrical Front Visor Screen (Covers the entire front symmetrically from ear to ear)
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

    // Visor Gold Framing Bezel (Neatly encasing the visor screen)
    const visorRim = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.010, 16, 48), matSolarGold)
    visorRim.scale.set(1.08, 0.88, 1.0)
    visorRim.position.set(0, 0.03, 0.22)
    visorRim.rotation.x = 0.15
    headGroup.add(visorRim)

    // ─────────────────────────────────────────────────────────────
    // THE HIGHLIGHT EYES (100% Bold, Crystal Clear, Glowing, Beautiful!)
    // ─────────────────────────────────────────────────────────────
    const createCuteHighlightEye = (isRight: boolean) => {
      const eyeRig = new THREE.Group()

      // 1. Soft glowing cyan halo backing
      const halo = new THREE.Mesh(
        new THREE.PlaneGeometry(0.12, 0.14),
        matEyeGlow
      )
      halo.position.z = 0.001
      eyeRig.add(halo)

      // 2. Bold, bright, glowing Neon Cyan Eye Face
      const eyeCapsule = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.044, 0.056, 16, 16),
        matEyeCyan
      )
      eyeCapsule.rotation.z = isRight ? -0.05 : 0.05
      eyeCapsule.position.z = 0.004
      eyeRig.add(eyeCapsule)

      // 3. Shiny Pure-White Star Glint Highlight (Top-Right)
      const sparkle1 = new THREE.Mesh(
        new THREE.CircleGeometry(0.016, 16),
        matEyeSparkle
      )
      sparkle1.position.set(0.015, 0.024, 0.008)
      eyeRig.add(sparkle1)

      // 4. Secondary Twinkle Glint (Lower-Left)
      const sparkle2 = new THREE.Mesh(
        new THREE.CircleGeometry(0.008, 12),
        matEyeSparkle
      )
      sparkle2.position.set(-0.015, -0.018, 0.008)
      eyeRig.add(sparkle2)

      // 5. Expressive Digital Brow Arc (Floating above eye)
      const browArc = new THREE.Mesh(
        new THREE.RingGeometry(0.042, 0.050, 16, 1, 0, Math.PI * 0.55),
        matEyeCyan
      )
      browArc.rotation.z = isRight ? Math.PI * 0.15 : Math.PI * 0.3
      browArc.position.set(0, 0.068, 0.006)
      eyeRig.add(browArc)

      return { eyeRig, eyeCapsule, browArc, sparkle1, sparkle2 }
    }

    // Mounted cleanly on top of the front visor surface (z = 0.328)
    const leftEye = createCuteHighlightEye(false)
    leftEye.eyeRig.position.set(-0.095, 0.045, 0.328)
    leftEye.eyeRig.rotation.y = -0.20
    leftEye.eyeRig.rotation.x = -0.05
    headGroup.add(leftEye.eyeRig)

    const rightEye = createCuteHighlightEye(true)
    rightEye.eyeRig.position.set(0.095, 0.045, 0.328)
    rightEye.eyeRig.rotation.y = 0.20
    rightEye.eyeRig.rotation.x = -0.05
    headGroup.add(rightEye.eyeRig)

    // Digital Glowing Smile & Dynamic Speech Mouth on Visor
    const mouthGroup = new THREE.Group()
    mouthGroup.position.set(0, -0.082, 0.325)
    headGroup.add(mouthGroup)

    // Rest smile arc (shown when idle)
    const smileArc = new THREE.Mesh(
      new THREE.RingGeometry(0.035, 0.044, 16, 1, Math.PI * 0.15, Math.PI * 0.7),
      matSmileGlow
    )
    smileArc.rotation.z = Math.PI
    mouthGroup.add(smileArc)

    // Outer speech lips (capsule glowing neon cyan)
    const speechMouthMesh = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.018, 0.038, 12, 12),
      matSmileGlow
    )
    speechMouthMesh.rotation.z = Math.PI / 2
    speechMouthMesh.scale.set(0.01, 0.01, 0.01)
    speechMouthMesh.visible = false
    mouthGroup.add(speechMouthMesh)

    // Inner dark aperture (gives depth to the open mouth when talking)
    const matMouthInner = new THREE.MeshBasicMaterial({ color: 0x021d28 })
    const speechMouthInner = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.012, 0.028, 12, 12),
      matMouthInner
    )
    speechMouthInner.position.z = 0.002
    speechMouthInner.rotation.z = Math.PI / 2
    speechMouthInner.scale.set(0.01, 0.01, 0.01)
    speechMouthInner.visible = false
    mouthGroup.add(speechMouthInner)

    // Cheerful smiling dimple corners (subtle cyan crescents flanking mouth)
    const smileDimpleLeft = new THREE.Mesh(
      new THREE.RingGeometry(0.006, 0.012, 12, 1, 0, Math.PI * 0.6),
      matSmileGlow
    )
    smileDimpleLeft.position.set(-0.042, 0.006, 0.001)
    smileDimpleLeft.visible = false
    mouthGroup.add(smileDimpleLeft)

    const smileDimpleRight = new THREE.Mesh(
      new THREE.RingGeometry(0.006, 0.012, 12, 1, Math.PI * 0.4, Math.PI * 0.6),
      matSmileGlow
    )
    smileDimpleRight.position.set(0.042, 0.006, 0.001)
    smileDimpleRight.visible = false
    mouthGroup.add(smileDimpleRight)

    // Symmetrical Communication Fin Antennae (Ears)
    const leftEarCup = new THREE.Group()
    leftEarCup.position.set(-0.34, 0.02, 0)
    headGroup.add(leftEarCup)

    const leftPuck = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.035, 20), matCosmicOrange)
    leftPuck.rotation.z = Math.PI / 2
    leftEarCup.add(leftPuck)

    const leftRing = new THREE.Mesh(new THREE.TorusGeometry(0.070, 0.008, 12, 24), matSolarGold)
    leftRing.rotation.y = Math.PI / 2
    leftEarCup.add(leftRing)

    const leftAntenna = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.16, 0.04), matGlossyWhite)
    leftAntenna.position.set(-0.02, 0.10, -0.02)
    leftAntenna.rotation.z = 0.25
    leftEarCup.add(leftAntenna)

    const leftAntennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 16), matEyeCyan)
    leftAntennaTip.position.set(-0.04, 0.18, -0.02)
    leftEarCup.add(leftAntennaTip)

    const rightEarCup = new THREE.Group()
    rightEarCup.position.set(0.34, 0.02, 0)
    headGroup.add(rightEarCup)

    const rightPuck = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.035, 20), matCosmicOrange)
    rightPuck.rotation.z = Math.PI / 2
    rightEarCup.add(rightPuck)

    const rightRing = new THREE.Mesh(new THREE.TorusGeometry(0.070, 0.008, 12, 24), matSolarGold)
    rightRing.rotation.y = Math.PI / 2
    rightEarCup.add(rightRing)

    const rightAntenna = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.16, 0.04), matGlossyWhite)
    rightAntenna.position.set(0.02, 0.10, -0.02)
    rightAntenna.rotation.z = -0.25
    rightEarCup.add(rightAntenna)

    const rightAntennaTip = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 16), matEyeCyan)
    rightAntennaTip.position.set(0.04, 0.18, -0.02)
    rightEarCup.add(rightAntennaTip)

    // F. Symmetrical Tailored Arms with Epaulettes & Cuffs
    const createCuteArm = (isRight: boolean) => {
      const armGroup = new THREE.Group()
      armGroup.name = isRight ? 'rightArm' : 'leftArm'
      armGroup.position.set(isRight ? 0.27 : -0.27, 0.22, 0.02)
      torso.add(armGroup)

      // Shoulder ball with Solar Gold cap
      const shoulderBall = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), matCosmicOrange)
      armGroup.add(shoulderBall)

      const epauletteCap = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.008, 12, 24), matSolarGold)
      epauletteCap.rotation.x = Math.PI / 2
      armGroup.add(epauletteCap)

      // White sleeve
      const bicep = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.036, 0.16, 12), matGlossyWhite)
      bicep.position.y = -0.09
      armGroup.add(bicep)

      // Symmetrical Midnight Navy elbow pad
      const elbow = new THREE.Group()
      elbow.name = isRight ? 'rightElbow' : 'leftElbow'
      elbow.position.y = -0.17
      armGroup.add(elbow)

      const elbowPad = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 12), matCadetNavy)
      elbow.add(elbowPad)

      // Forearm sleeve with Tangerine & Gold double cuff ring
      const forearm = new THREE.Group()
      forearm.name = isRight ? 'rightForearm' : 'leftForearm'
      forearm.position.y = -0.02
      elbow.add(forearm)

      const forearmSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.036, 0.14, 12), matGlossyWhite)
      forearmSleeve.position.y = -0.07
      forearm.add(forearmSleeve)

      const cuffRingOrange = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.006, 8, 20), matCosmicOrange)
      cuffRingOrange.rotation.x = Math.PI / 2
      cuffRingOrange.position.y = -0.12
      forearm.add(cuffRingOrange)

      const cuffRingGold = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.005, 8, 20), matSolarGold)
      cuffRingGold.rotation.x = Math.PI / 2
      cuffRingGold.position.y = -0.135
      forearm.add(cuffRingGold)

      // Tailored white cyber-mitten hand with gold sensor fingertips
      const handGroup = new THREE.Group()
      handGroup.name = isRight ? 'rightHand' : 'leftHand'
      handGroup.position.y = -0.155
      forearm.add(handGroup)

      const palmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.06, 0.024), matGlossyWhite)
      palmMesh.position.y = -0.028
      handGroup.add(palmMesh)

      const palmPad = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.026, 12), matEyeCyan)
      palmPad.rotation.x = Math.PI / 2
      palmPad.position.set(0, -0.028, 0)
      handGroup.add(palmPad)

      // Articulated thumb pivot for natural human orator gestures
      const thumbPivot = new THREE.Group()
      thumbPivot.position.set(isRight ? -0.026 : 0.026, -0.022, 0.008)
      handGroup.add(thumbPivot)

      const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.024, 8, 8), matSolarGold)
      thumb.position.set(isRight ? -0.006 : 0.006, -0.006, 0)
      thumb.rotation.z = isRight ? 0.6 : -0.6
      thumbPivot.add(thumb)

      const fingerList: THREE.Group[] = []
      const fingerXs = isRight ? [-0.018, 0.0, 0.018] : [0.018, 0.0, -0.018]
      fingerXs.forEach((fx, i) => {
        const fingerPivot = new THREE.Group()
        fingerPivot.position.set(fx, -0.058, 0)
        fingerPivot.rotation.x = 0.28
        handGroup.add(fingerPivot)

        const fMesh = new THREE.Mesh(
          new THREE.CapsuleGeometry(0.0085, 0.024 + (i === 1 ? 0.006 : 0), 8, 8),
          matSolarGold
        )
        fMesh.position.y = -0.016
        fingerPivot.add(fMesh)

        fingerList.push(fingerPivot)
      })

      return { armGroup, elbow, forearm, handGroup, palmPad, thumbPivot, fingerList }
    }

    const leftArmRig = createCuteArm(false)
    const rightArmRig = createCuteArm(true)

    // G. Tailored White Trousers with Lateral Racing Stripes & Magnetic Cadet Boots
    const createCuteLeg = (isRight: boolean) => {
      const legGroup = new THREE.Group()
      legGroup.name = isRight ? 'rightLeg' : 'leftLeg'
      legGroup.position.set(isRight ? 0.12 : -0.12, -0.08, 0.02)
      hips.add(legGroup)

      // White thigh
      const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.054, 0.045, 0.18, 12), matGlossyWhite)
      thigh.position.y = -0.09
      legGroup.add(thigh)

      // Lateral racing stripe on outside seam of trouser
      const legStripe = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.18, 0.012), matCosmicOrange)
      legStripe.position.set(isRight ? 0.052 : -0.052, -0.09, 0)
      legGroup.add(legStripe)

      // Midnight Navy knee guard with gold rim
      const knee = new THREE.Group()
      knee.name = isRight ? 'rightKnee' : 'leftKnee'
      knee.position.y = -0.18
      legGroup.add(knee)

      const kneePad = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.065, 0.035), matCadetNavy)
      kneePad.position.set(0, 0, 0.035)
      knee.add(kneePad)

      const kneeTrim = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.014, 0.036), matSolarGold)
      kneeTrim.position.set(0, 0.028, 0.036)
      knee.add(kneeTrim)

      // Lower shin
      const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.040, 0.16, 12), matGlossyWhite)
      shin.position.y = -0.08
      knee.add(shin)

      // High-Tech Cadet Magnetic Explorer Boot
      const bootGroup = new THREE.Group()
      bootGroup.name = isRight ? 'rightBoot' : 'leftBoot'
      bootGroup.position.y = -0.17
      knee.add(bootGroup)

      // Ankle cuff in Midnight Navy
      const ankleCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.035, 16), matCadetNavy)
      ankleCuff.position.y = 0.01
      bootGroup.add(ankleCuff)

      // Cosmic Tangerine boot body
      const bootBody = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.045, 0.14), matCosmicOrange)
      bootBody.position.set(0, -0.018, 0.02)
      bootGroup.add(bootBody)

      // White toe cap
      const bootToeCap = new THREE.Mesh(new THREE.BoxGeometry(0.082, 0.035, 0.06), matGlossyWhite)
      bootToeCap.position.set(0, 0.012, 0.065)
      bootGroup.add(bootToeCap)

      // Solar Gold magnetic tread sole
      const bootSole = new THREE.Mesh(new THREE.BoxGeometry(0.088, 0.014, 0.148), matSolarGold)
      bootSole.position.set(0, -0.042, 0.02)
      bootGroup.add(bootSole)

      // Antigravity Ion Repulsor Core beneath magnetic tread
      const repulsorRing = new THREE.Mesh(
        new THREE.RingGeometry(0.012, 0.038, 16),
        matCoreCyan
      )
      repulsorRing.rotation.x = Math.PI / 2
      repulsorRing.position.set(0, -0.050, 0.02)
      bootGroup.add(repulsorRing)

      const repulsorHalo = new THREE.Mesh(
        new THREE.RingGeometry(0.036, 0.058, 16),
        matEyeGlow
      )
      repulsorHalo.rotation.x = Math.PI / 2
      repulsorHalo.position.set(0, -0.052, 0.02)
      bootGroup.add(repulsorHalo)

      return { legGroup, knee, bootGroup, repulsorRing, repulsorHalo }
    }

    const leftLegRig = createCuteLeg(false)
    const rightLegRig = createCuteLeg(true)

    // H. Gentle Ambient Stardust Particles
    const particleCount = 40
    const particleGeo = new THREE.BufferGeometry()
    const particlePos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 1.6
      particlePos[i + 1] = Math.random() * 1.6 + 0.2
      particlePos[i + 2] = (Math.random() - 0.5) * 1.6
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3))
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.025,
      transparent: true,
      opacity: 0.7,
    })
    const particles = new THREE.Points(particleGeo, particleMat)
    scene.add(particles)

    // 6. Mouse Tracking for Curious Look-At & Locomotion Guidance
    const handlePointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = -(e.clientY / window.innerHeight) * 2 + 1
      pointerRef.current.targetX = THREE.MathUtils.clamp(nx, -1.0, 1.0)
      pointerRef.current.targetY = THREE.MathUtils.clamp(ny, -1.0, 1.0)
      // Cursor is at the very top when in upper ~22% of window
      const topRatio = e.clientY / window.innerHeight
      pointerRef.current.isVeryTop = topRatio <= 0.22
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    // 7. Live 60 FPS Render & Animation Loop
    let animationFrameId: number
    const startTime = performance.now()
    let lastTime = performance.now()
    const freqData = new Uint8Array(128)

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      // When destination dossier modal is active, pause Ember rendering to free 100% GPU for the dossier
      if (activeDossierRef.current) return

      const now = performance.now()
      const delta = Math.min(Math.max((now - lastTime) / 1000, 0.001), 0.1)
      lastTime = now
      const elapsed = (now - startTime) / 1000
      const isCurrentlySpeaking = speakingRef.current

      // A. Audio Frequency Analysis for Speech
      let currentVolume = 0
      if (analyserRef.current && isCurrentlySpeaking) {
        analyserRef.current.getByteFrequencyData(freqData)
        let sum = 0
        const speechBins = Math.min(32, freqData.length)
        for (let i = 2; i < speechBins; i++) {
          sum += freqData[i]
        }
        currentVolume = sum / (speechBins * 255)
      } else if (isCurrentlySpeaking) {
        currentVolume = 0.35 + Math.sin(elapsed * 14) * 0.25 + Math.sin(elapsed * 22) * 0.15
      }
      speechVolumeRef.current += (currentVolume - speechVolumeRef.current) * 0.35
      const speechVal = speechVolumeRef.current

      // B. Speech Timeline Tracking
      let speechTime = 0
      if (audioElementRef.current && !audioElementRef.current.paused) {
        speechTime = audioElementRef.current.currentTime
        if (audioElementRef.current.duration > 0 && speechTime >= audioElementRef.current.duration - 0.08) {
          markIntroCompleted()
        }
      } else if (isCurrentlySpeaking) {
        const elapsedFromStart = speechStartTimeRef.current > 0 ? (performance.now() / 1000 - speechStartTimeRef.current) : 0
        speechTime = Math.max(0, elapsedFromStart)
        if (speechStartTimeRef.current > 0 && elapsedFromStart >= 16.5) {
          markIntroCompleted()
        }
      }

      // C. Smooth Cursor Tracking, Wide Canyon Locomotion & Athletic Rocket Jump Physics
      const p = pointerRef.current
      const ws = walkStateRef.current

      // Jump cooldown decay
      if (ws.jumpCooldown > 0) {
        ws.jumpCooldown = Math.max(0, ws.jumpCooldown - delta)
      }

      let jumpY = 0
      let jumpCrouch = 0
      let jumpFlight = 0
      let jumpLand = 0

      const hasCompletedIntro = introCompletedRef.current

      if (!hasCompletedIntro || isCurrentlySpeaking) {
        // ── BEFORE & DURING INTRODUCTION: STAND FIRMLY AT OUTPOST ROCK (-1.2), GIVE INTRODUCTION ──
        // Ember stands perfectly still on his rocky vantage point. No walking, no drifting, no jumping.
        ws.targetCharX = -1.2
        ws.charX = -1.2
        ws.isWalking = false
        ws.walkSpeed = 0
        ws.walkCycle = 0
        ws.catchAction = 0
        ws.catchTimer = 0
        ws.hopTimer = 0
        ws.topJumpTimer = 0
        ws.isJumping = false
      } else if (ws.isJumping) {
        // ── ACTIVE JUMP TRAJECTORY PHYSICS ──
        ws.jumpProgress += delta / 1.15
        const jp = ws.jumpProgress

        if (jp < 0.16) {
          // Phase 1: Pre-jump Crouch Anticipation
          jumpCrouch = Math.sin((jp / 0.16) * Math.PI)
          jumpY = -jumpCrouch * 0.08
          ws.walkSpeed = 0
          ws.isWalking = false
        } else if (jp < 0.82) {
          // Phase 2: Rocket Thruster Ascent, Mid-Air Float & Descent
          jumpFlight = (jp - 0.16) / 0.66
          jumpY = ws.jumpApexY * Math.sin(jumpFlight * Math.PI)
          // Smoothly glide horizontally to target destination with aerodynamic smoothstep
          const flightEase = jumpFlight * jumpFlight * (3 - 2 * jumpFlight)
          ws.charX = THREE.MathUtils.lerp(ws.jumpStartX, ws.jumpTargetX, flightEase)
          ws.walkSpeed = 1.0
        } else if (jp < 1.0) {
          // Phase 3: Touchdown Impact Cushioning
          jumpLand = Math.sin(((jp - 0.82) / 0.18) * Math.PI)
          jumpY = -jumpLand * 0.06
          ws.charX = ws.jumpTargetX
          ws.walkSpeed = 0
        } else {
          // Jump finished
          ws.isJumping = false
          ws.charX = ws.jumpTargetX
          ws.jumpProgress = 0
          ws.jumpCooldown = 0.95
        }
      } else {
        // ── POST-INTRODUCTION: EXPLORATION, CANYON WALKING ──
        // Direct, responsive cursor tracking across open canyon area [-2.3, 0.4] (clear of right travel deck)
        ws.targetCharX = THREE.MathUtils.clamp(p.targetX * 2.0 - 0.2, -2.3, 0.4)
        const diffX = ws.targetCharX - ws.charX
        const absDiffX = Math.abs(diffX)

        // Hysteresis walking detection: 0.14 threshold to start, 0.035 to settle without chattering
        const walkThreshold = ws.isWalking ? 0.035 : 0.14
        const walkDir = Math.sign(diffX)

        if (absDiffX > walkThreshold) {
          ws.isWalking = true
          // Smooth deceleration as Ember approaches target to avoid abrupt stops
          const targetSpeed = Math.min(2.0, Math.max(0.4, absDiffX * 1.4))
          const accelDamp = 1 - Math.exp(-8.0 * delta)
          ws.walkSpeed += (targetSpeed - ws.walkSpeed) * accelDamp
          ws.charX += walkDir * delta * 2.0 * ws.walkSpeed
          ws.walkCycle += delta * 10.5 * ws.walkSpeed
        } else {
          ws.isWalking = false
          const decelDamp = 1 - Math.exp(-9.0 * delta)
          ws.walkSpeed += (0 - ws.walkSpeed) * decelDamp
          if (Math.abs(ws.walkSpeed) > 0.01) {
            ws.charX += walkDir * delta * 2.0 * ws.walkSpeed
            ws.walkCycle += delta * 10.5 * ws.walkSpeed
          }
        }

        // Distance from Ember's position to cursor in stage space
        const cursorWorldX = THREE.MathUtils.clamp(p.targetX * 2.0 - 0.2, -2.3, 0.4)
        const cursorDist = Math.hypot(cursorWorldX - ws.charX, p.y * 1.5)

        // Playful catch action: ONLY when standing stationary and mouse is right at hand level
        if (!ws.isWalking && cursorDist < 0.38) {
          ws.catchTimer += delta
          if (ws.catchTimer > 1.4) {
            ws.catchAction = 1.0
            ws.catchTimer = 0
          }
        } else {
          ws.catchTimer = 0
        }

        // ── ONLY JUMP WHEN USER CURSOR MOVES AT VERY TOP ──
        // Ember looks up at the sky and launches into a high rocket jump to reach the top cursor
        const isCursorAtVeryTop = pointerRef.current.isVeryTop || p.targetY > 0.55
        if (isCursorAtVeryTop && ws.jumpCooldown <= 0) {
          ws.topJumpTimer += delta
          if (ws.topJumpTimer > 0.12) {
            triggerJump(cursorWorldX)
            ws.topJumpTimer = 0
          }
        } else {
          ws.topJumpTimer = 0
        }
      }

      // Framerate-independent exponential smoothing for mouse coordinates
      const ptrDamp = 1 - Math.exp(-14.0 * delta)
      p.x += (p.targetX - p.x) * ptrDamp
      p.y += (p.targetY - p.y) * ptrDamp

      // D. Kinematics Poses for Realistic Human Orator Gestures
      const breath = Math.sin(elapsed * 2.0) * 0.02
      let rArmX = 0.10 + breath * 0.15
      let rArmY = -0.06
      let rArmZ = 0.14
      let rElbowX = -0.22
      let rElbowY = 0.08
      let rForearmX = -0.10
      let rWristX = 0.08
      let rWristY = 0.12
      let rWristZ = -0.06
      let rFingerCurl = 0.30
      let rFingerSpread = 0.0
      let rThumbCurl = 0.5

      let lArmX = 0.10 + breath * 0.15
      let lArmY = 0.06
      let lArmZ = -0.14
      let lElbowX = -0.22
      let lElbowY = -0.08
      let lForearmX = -0.10
      let lWristX = 0.08
      let lWristY = -0.12
      let lWristZ = 0.06
      let lFingerCurl = 0.30
      let lFingerSpread = 0.0
      let lThumbCurl = -0.5

      // Facial & Head Expression Variables
      let headNodX = 0
      let headGlanceY = 0
      let headTiltZ = 0
      let happySquint = 0
      let browLift = 0
      let browTilt = 0

      if (isCurrentlySpeaking) {
        if (speechTime < 3.0) {
          // ── PHASE 1: [0.0s – 3.0s] Welcoming Orator Greeting ──
          // "Touchdown confirmed! Welcome to Vidyu World, Commander."
          // Right arm raises into open-palm orator greeting, left arm supports warmly
          const p1Beat = Math.sin(speechTime * 4.4) * 0.08 * (0.6 + speechVal)

          rArmX = -0.66 - p1Beat
          rArmY = 0.20
          rArmZ = 0.48 + p1Beat * 0.4
          rElbowX = -0.72 - p1Beat * 0.5
          rElbowY = 0.28
          rForearmX = -0.20
          rWristX = -0.20 + p1Beat
          rWristY = -0.52 // Palm rotated outward/upward to greet
          rWristZ = 0.18
          rFingerCurl = 0.06 // Fingers extended open
          rFingerSpread = 0.12
          rThumbCurl = 0.2

          lArmX = -0.48 - p1Beat * 0.7
          lArmY = -0.16
          lArmZ = -0.42 - p1Beat * 0.4
          lElbowX = -0.60 - p1Beat * 0.3
          lElbowY = -0.22
          lForearmX = -0.16
          lWristX = -0.16
          lWristY = 0.46 // Palm turned upward in receptive cradle
          lWristZ = -0.14
          lFingerCurl = 0.08
          lFingerSpread = 0.10
          lThumbCurl = -0.2

          headNodX = Math.sin(speechTime * 5.2) * 0.06 * (0.7 + speechVal)
          headTiltZ = 0.04
          happySquint = 0.52 + Math.sin(speechTime * 4.0) * 0.16 // Happy smiling eyes (^_^)
          browLift = 0.018
        } else if (speechTime < 6.4) {
          // ── PHASE 2: [3.0s – 6.4s] Self-Introduction & Deictic Sweep ──
          if (speechTime < 4.2) {
            // "I'm your cosmic guide" -> Courteous self-referential gesture towards chest badge
            rArmX = -0.76
            rArmY = -0.26
            rArmZ = 0.26
            rElbowX = -1.24 // Deep bend bringing hand near solar crest
            rElbowY = 0.50
            rForearmX = -0.16
            rWristX = 0.24
            rWristY = 0.56 // Palm facing chest
            rWristZ = 0.10
            rFingerCurl = 0.26
            rFingerSpread = 0.04
            rThumbCurl = 0.4

            lArmX = -0.18
            lArmY = -0.08
            lArmZ = -0.24
            lElbowX = -0.36
            lElbowY = -0.12
            lForearmX = -0.10
            lWristX = 0.04
            lWristY = 0.20
            lWristZ = -0.05
            lFingerCurl = 0.22
            lFingerSpread = 0.02
            lThumbCurl = -0.3

            headNodX = 0.02
            headTiltZ = 0.09 // Companion head tilt
            happySquint = 0.36
            browLift = 0.012
          } else {
            // "Ahead lies Raju’s flagship software universe..."
            // Sweeping presentation gesture directing user to the portfolio deck!
            rArmX = -0.56
            rArmY = 0.62 // Shoulder rotated outward to the right
            rArmZ = 0.76 // Arm opened wide to present
            rElbowX = -0.40
            rElbowY = 0.16
            rForearmX = -0.10
            rWristX = -0.18
            rWristY = -0.76 // Palm facing up towards the cards
            rWristZ = 0.32
            rFingerCurl = 0.05 // Graceful presentation hand with index leading
            rFingerSpread = 0.14
            rThumbCurl = 0.15

            lArmX = 0.04
            lArmY = 0.06
            lArmZ = -0.20
            lElbowX = -0.26
            lElbowY = -0.10
            lForearmX = -0.08
            lWristX = 0.06
            lWristY = 0.14
            lWristZ = -0.04
            lFingerCurl = 0.24
            lFingerSpread = 0.02
            lThumbCurl = -0.4

            // Head glances towards the cards then returns warmly to user
            const glanceProgress = Math.sin(((speechTime - 4.2) / 2.2) * Math.PI)
            headGlanceY = glanceProgress * 0.32
            headNodX = Math.sin(speechTime * 4.0) * 0.035 * (0.5 + speechVal)
            headTiltZ = -0.05
            happySquint = 0.26
            browLift = 0.010
          }
        } else if (speechTime < 9.4) {
          // ── PHASE 3: [6.4s – 9.4s] Explanatory Conversational Baton Beats ──
          // "from production engineering to interactive systems..."
          // Coordinated two-handed speech cadence with active wrist & finger articulation
          const cadence = Math.sin((speechTime - 6.4) * 6.2)
          const beatAmp = 0.14 * (0.6 + speechVal * 0.8)

          rArmX = -0.60 + cadence * beatAmp
          rArmY = 0.10 - cadence * 0.08
          rArmZ = 0.38 + cadence * 0.06
          rElbowX = -0.86 + cadence * 0.18
          rElbowY = 0.26
          rForearmX = -0.15
          rWristX = -0.22 + cadence * 0.28 // Expressive wrist flexion on stressed beats
          rWristY = -0.32 + cadence * 0.22
          rWristZ = 0.10
          rFingerCurl = 0.14 + (cadence > 0 ? 0.22 : -0.06)
          rFingerSpread = 0.08
          rThumbCurl = 0.25

          lArmX = -0.54 - cadence * beatAmp
          lArmY = -0.10 + cadence * 0.08
          lArmZ = -0.38 - cadence * 0.06
          lElbowX = -0.80 - cadence * 0.16
          lElbowY = -0.24
          lForearmX = -0.15
          lWristX = -0.18 - cadence * 0.24
          lWristY = 0.32 - cadence * 0.20
          lWristZ = -0.10
          lFingerCurl = 0.14 + (cadence < 0 ? 0.22 : -0.06)
          lFingerSpread = 0.08
          lThumbCurl = -0.25

          headNodX = Math.abs(cadence) * 0.07 * (0.6 + speechVal) // Syllable head nods
          headTiltZ = cadence * 0.03
          happySquint = 0.30 + speechVal * 0.32
          browLift = 0.014 + (cadence > 0 ? 0.008 : 0)
          browTilt = 0.006
        } else if (speechTime < 12.0) {
          // ── PHASE 4: [9.4s – 12.0s] Enthusiastic Double-Handed Invitation ──
          // "Let’s explore what he's built!"
          // Both arms open forward with receptive palms inviting user to explore
          const finaleBeat = Math.sin(speechTime * 4.5) * 0.05

          rArmX = -0.78 + finaleBeat
          rArmY = 0.14
          rArmZ = 0.44
          rElbowX = -0.68
          rElbowY = 0.22
          rForearmX = -0.20
          rWristX = -0.28
          rWristY = -0.42 // Palms open upward and forward
          rWristZ = 0.15
          rFingerCurl = 0.04 // Wide open hands
          rFingerSpread = 0.16
          rThumbCurl = 0.15

          lArmX = -0.78 + finaleBeat
          lArmY = -0.14
          lArmZ = -0.44
          lElbowX = -0.68
          lElbowY = -0.22
          lForearmX = -0.20
          lWristX = -0.28
          lWristY = 0.42 // Palms open upward and forward
          lWristZ = -0.15
          lFingerCurl = 0.04
          lFingerSpread = 0.16
          lThumbCurl = -0.15

          headNodX = 0.08 + Math.sin(speechTime * 5.4) * 0.05
          headTiltZ = 0.05
          happySquint = 0.65 // Maximum joyful smiling eyes (^_^)
          browLift = 0.022
        } else {
          // Beyond 12.0s / Looping conversational cadence fallback
          const loopBeat = Math.sin(speechTime * 4.5) * 0.10 * (0.5 + speechVal)
          rArmX = -0.60 + loopBeat
          rArmY = 0.15
          rArmZ = 0.40
          rElbowX = -0.75 + loopBeat * 0.15
          rElbowY = 0.24
          rForearmX = -0.16
          rWristX = -0.20 + loopBeat * 0.2
          rWristY = -0.38
          rWristZ = 0.12
          rFingerCurl = 0.10
          rFingerSpread = 0.10
          rThumbCurl = 0.2

          lArmX = -0.45 - loopBeat * 0.8
          lArmY = -0.12
          lArmZ = -0.35
          lElbowX = -0.60
          lElbowY = -0.20
          lForearmX = -0.14
          lWristX = -0.15
          lWristY = 0.35
          lWristZ = -0.10
          lFingerCurl = 0.12
          lFingerSpread = 0.08
          lThumbCurl = -0.2

          headNodX = Math.abs(loopBeat) * 0.06
          headTiltZ = loopBeat * 0.03
          happySquint = 0.35 + speechVal * 0.3
          browLift = 0.015
        }
      } else if (ws.isJumping) {
        // ── JUMPING KINEMATICS FOR ARMS & HEAD ──
        if (jumpCrouch > 0) {
          // Phase 1: Crouch anticipation - arms swing back
          rArmX = 0.55 * jumpCrouch
          lArmX = 0.55 * jumpCrouch
          rArmZ = 0.35
          lArmZ = -0.35
          rElbowX = -0.45
          lElbowX = -0.45
          rFingerCurl = 0.40
          lFingerCurl = 0.40
          headNodX = 0.18 * jumpCrouch
        } else if (jumpFlight > 0) {
          // Phase 2: Rocket thrust & aerial ascent / apex catch
          rArmX = -1.45
          lArmX = -1.45
          rArmY = 0.18
          lArmY = -0.18
          rArmZ = 0.28
          lArmZ = -0.28
          rElbowX = -0.25
          lElbowX = -0.25

          if (jumpFlight >= 0.45 && jumpFlight <= 0.70) {
            // Apex mid-air clasp! Snatching cursor!
            rFingerCurl = 0.90
            lFingerCurl = 0.90
            rWristX = 0.35
            lWristX = 0.35
            happySquint = 0.85 // ( ^ _ ^ )
          } else {
            // Open hands reaching for sky
            rFingerCurl = 0.08
            lFingerCurl = 0.08
            rFingerSpread = 0.25
            lFingerSpread = 0.25
            happySquint = 0.45
          }
          headNodX = -0.28 // Looking up high
          browLift = 0.03
        } else if (jumpLand > 0) {
          // Phase 3: Touchdown impact compression
          rArmX = -0.25
          lArmX = -0.25
          rArmZ = 0.55 * jumpLand
          lArmZ = -0.55 * jumpLand
          rElbowX = -0.65
          lElbowX = -0.65
          rFingerCurl = 0.30
          lFingerCurl = 0.30
          headNodX = 0.15 * jumpLand
        }
      } else if (hasCompletedIntro && ws.isWalking && ws.catchAction <= 0) {
        // ── ENERGETIC BIOMECHANICAL WALK: NATURAL COUNTER-OSCILLATING ARM SWING ──
        const cycle = ws.walkCycle
        const lSwing = -Math.sin(cycle) // > 0 when left leg swinging forward, < 0 when right leg swinging forward
        const walkBlend = Math.min(1.0, Math.max(0.0, ws.walkSpeed * 0.9))

        // Right arm counter-oscillates (swings forward when left leg swings forward)
        rArmX = -lSwing * 0.38 * walkBlend
        rArmY = 0.04
        rArmZ = 0.16 + Math.abs(lSwing) * 0.03 * walkBlend
        rElbowX = -0.48 - Math.max(0, lSwing) * 0.36 * walkBlend
        rElbowY = 0.08
        rForearmX = -0.10
        rWristX = -0.12
        rWristY = -0.10
        rWristZ = 0.05
        rFingerCurl = 0.52
        rFingerSpread = 0.04
        rThumbCurl = 0.35

        // Left arm counter-oscillates (swings forward when right leg swings forward)
        lArmX = lSwing * 0.38 * walkBlend
        lArmY = -0.04
        lArmZ = -0.16 - Math.abs(lSwing) * 0.03 * walkBlend
        lElbowX = -0.48 - Math.max(0, -lSwing) * 0.36 * walkBlend
        lElbowY = -0.08
        lForearmX = -0.10
        lWristX = -0.12
        lWristY = 0.10
        lWristZ = -0.05
        lFingerCurl = 0.52
        lFingerSpread = 0.04
        lThumbCurl = -0.35

        const diffX = ws.targetCharX - ws.charX
        const walkDir = Math.sign(diffX)
        headGlanceY = (-walkDir * 0.22 + Math.sin(cycle * 0.5) * 0.05) * walkBlend
        headNodX = Math.abs(Math.sin(cycle)) * 0.05 * walkBlend
        headTiltZ = walkDir * 0.08 * walkBlend
        browLift = 0.015
        happySquint = 0.28
      } else if (hasCompletedIntro) {
        // ── POST-INTRODUCTION: PLAYFUL CURSOR CHASE & CATCHING GESTURES ──
        const diffX = ws.targetCharX - ws.charX
        const isReachingRight = diffX >= -0.04

        if (ws.hopTimer > 0.1) {
          // ── Two-Handed Joyful Catch Hop (cursor directly hovering over Ember) ──
          rArmX = -1.15
          rArmY = 0.22
          rArmZ = 0.42
          rElbowX = -0.45
          rForearmX = -0.15
          rFingerCurl = 0.06
          rFingerSpread = 0.22
          rThumbCurl = 0.15

          lArmX = -1.15
          lArmY = -0.22
          lArmZ = -0.42
          lElbowX = -0.45
          lForearmX = -0.15
          lFingerCurl = 0.06
          lFingerSpread = 0.22
          lThumbCurl = -0.15

          headNodX = -0.12 // Looking up at cursor
          headTiltZ = 0
          happySquint = 0.75 // ( ^ _ ^ )
          browLift = 0.03
        } else if (isReachingRight) {
          // ── Right Arm Reaches & Tries to Catch Cursor ──
          const reachHeight = THREE.MathUtils.clamp(-p.y * 0.40, -0.35, 0.35)
          const reachOut = THREE.MathUtils.clamp(p.x * 0.35, 0.05, 0.45)

          rArmX = -0.72 + reachHeight
          rArmY = 0.24 + reachOut
          rArmZ = 0.36 + reachOut * 0.5
          rElbowX = -0.32
          rForearmX = -0.12
          rWristX = -0.12 - reachHeight * 0.4
          rWristY = -0.25
          rWristZ = 0.15

          // Active swipe grab vs curious open reach
          if (ws.catchAction > 0) {
            // Snatch clasp!
            rArmX -= 0.18 * ws.catchAction
            rWristX += 0.25 * ws.catchAction
            rFingerCurl = 0.75 * ws.catchAction
            rFingerSpread = 0.0
            ws.catchAction = Math.max(0, ws.catchAction - delta * 2.4)
          } else {
            // Open hand reaching out to catch
            rFingerCurl = 0.06
            rFingerSpread = 0.18
            rThumbCurl = 0.15
          }

          // Left arm counter-balances (pumps with walk cycle when walking, or natural balance)
          if (ws.isWalking) {
            lArmX = 0.12 - Math.sin(ws.walkCycle) * 0.45
            lArmZ = -0.22
            lElbowX = -0.38
            lFingerCurl = 0.25
          } else {
            lArmX = 0.12 + breath * 0.15
            lArmZ = -0.18
            lElbowX = -0.25
            lFingerCurl = 0.22
          }

          headGlanceY = Math.min(0.25, Math.max(-0.25, diffX * 0.6))
          headTiltZ = -diffX * 0.15 + (ws.isWalking ? Math.sin(ws.walkCycle * 0.5) * 0.08 : 0.06)
          browLift = 0.02
          happySquint = ws.catchAction > 0 ? 0.55 : 0.2
        } else {
          // ── Left Arm Reaches & Tries to Catch Cursor ──
          const reachHeight = THREE.MathUtils.clamp(-p.y * 0.40, -0.35, 0.35)
          const reachOut = THREE.MathUtils.clamp(-p.x * 0.35, 0.05, 0.45)

          lArmX = -0.72 + reachHeight
          lArmY = -0.24 - reachOut
          lArmZ = -0.36 - reachOut * 0.5
          lElbowX = -0.32
          lForearmX = -0.12
          lWristX = -0.12 - reachHeight * 0.4
          lWristY = 0.25
          lWristZ = -0.15

          if (ws.catchAction > 0) {
            lArmX -= 0.18 * ws.catchAction
            lWristX += 0.25 * ws.catchAction
            lFingerCurl = 0.75 * ws.catchAction
            lFingerSpread = 0.0
            ws.catchAction = Math.max(0, ws.catchAction - delta * 2.4)
          } else {
            lFingerCurl = 0.06
            lFingerSpread = 0.18
            lThumbCurl = -0.15
          }

          // Right arm counter-balances
          if (ws.isWalking) {
            rArmX = 0.12 + Math.sin(ws.walkCycle) * 0.45
            rArmZ = 0.22
            rElbowX = -0.38
            rFingerCurl = 0.25
          } else {
            rArmX = 0.12 + breath * 0.15
            rArmZ = 0.18
            rElbowX = -0.25
            rFingerCurl = 0.22
          }

          headGlanceY = Math.min(0.25, Math.max(-0.25, diffX * 0.6))
          headTiltZ = -diffX * 0.15 - (ws.isWalking ? Math.sin(ws.walkCycle * 0.5) * 0.08 : 0.06)
          browLift = 0.02
          happySquint = ws.catchAction > 0 ? 0.55 : 0.2
        }
      } else {
        // ── BEFORE INTRODUCTION COMPLETION: POISED STANDBY POSE ──
        // Ember stands steadily facing forward. Arms rest calmly at sides with gentle breathing.
        headGlanceY = 0
        headNodX = 0
        headTiltZ = 0
        happySquint = 0.25
        browLift = 0.01
      }

      // E. Realistic Head Look-At: Strictly faces audience during standby and speech;
      // Tracks cursor ONLY after full introduction completion
      const trackingWeight = (hasCompletedIntro && !isCurrentlySpeaking) ? 1 : 0
      const cursorTargetYaw = (p.x * 2.4 - ws.charX) * 0.35
      const headWalkDir = Math.sign(ws.targetCharX - ws.charX)
      const lookYaw = trackingWeight === 0
        ? 0
        : (ws.isWalking
            ? -headWalkDir * 0.28 + Math.sin(ws.walkCycle * 0.5) * 0.05
            : cursorTargetYaw * trackingWeight)
      const lookPitch = -p.y * 0.32 * trackingWeight
      const cuteHeadTilt = trackingWeight === 0 ? 0 : (ws.isWalking ? headWalkDir * 0.06 : -lookYaw * 0.22)

      const targetHeadRotY = lookYaw + headGlanceY
      const targetHeadRotX = lookPitch + headNodX
      const targetHeadRotZ = cuteHeadTilt + headTiltZ

      headGroup.rotation.y = THREE.MathUtils.damp(headGroup.rotation.y, targetHeadRotY, 12, delta)
      headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, targetHeadRotX, 12, delta)
      headGroup.rotation.z = THREE.MathUtils.damp(headGroup.rotation.z, targetHeadRotZ, 12, delta)
      neck.rotation.y = THREE.MathUtils.damp(neck.rotation.y, targetHeadRotY * 0.35, 12, delta)

      // F. Ear Fin Antenna Wobble
      const earWobble = Math.sin(elapsed * 4.5) * 0.06
      leftEarCup.rotation.z = earWobble
      rightEarCup.rotation.z = -earWobble

      // G. Expressive Highlight Eye Blinking & Joyful Smiling Eye Squint (^_^)
      const blink = blinkStateRef.current
      blink.nextBlink -= delta
      if (blink.nextBlink <= 0) {
        blink.isBlinking = true
        blink.blinkProgress += 0.20
        if (blink.blinkProgress >= 1) {
          blink.isBlinking = false
          blink.blinkProgress = 0
          blink.nextBlink = 2.8 + Math.random() * 2.5
        }
      }
      const targetEyeScaleY = blink.isBlinking
        ? Math.max(0.08, 1.0 - Math.sin(blink.blinkProgress * Math.PI) * 0.92)
        : (1.0 - happySquint * 0.50)
      const targetEyeScaleX = blink.isBlinking
        ? 1.0 + Math.sin(blink.blinkProgress * Math.PI) * 0.2
        : (1.0 + happySquint * 0.22)

      leftEye.eyeCapsule.scale.set(targetEyeScaleX, targetEyeScaleY, 1)
      rightEye.eyeCapsule.scale.set(targetEyeScaleX, targetEyeScaleY, 1)

      // Smiling eye tilt (inverting slightly into joyful cute crescents)
      const targetTiltLeft = 0.05 + happySquint * 0.22
      const targetTiltRight = -0.05 - happySquint * 0.22
      leftEye.eyeCapsule.rotation.z = THREE.MathUtils.damp(leftEye.eyeCapsule.rotation.z, targetTiltLeft, 12, delta)
      rightEye.eyeCapsule.rotation.z = THREE.MathUtils.damp(rightEye.eyeCapsule.rotation.z, targetTiltRight, 12, delta)

      // Eyebrow dynamics (conversational bounce + emotional lifts)
      const browBounce = (isCurrentlySpeaking ? Math.sin(elapsed * 7.5) * 0.006 : 0) + (!isCurrentlySpeaking && p.y > 0.2 ? 0.008 : 0)
      leftEye.browArc.position.y = 0.068 + browLift + browBounce + browTilt
      rightEye.browArc.position.y = 0.068 + browLift + browBounce

      // Twinkling Star Glints pulsing with speech energy
      const sparkleScale = 1.0 + speechVal * 0.6
      leftEye.sparkle1.scale.setScalar(sparkleScale)
      rightEye.sparkle1.scale.setScalar(sparkleScale)

      // H. Dynamic Speech Mouth Visemes & Smiling Dimples
      if (isCurrentlySpeaking) {
        smileArc.visible = false
        speechMouthMesh.visible = true
        speechMouthInner.visible = true
        smileDimpleLeft.visible = true
        smileDimpleRight.visible = true

        // Conversational syllable cadence (approx 4.5 syllables/sec)
        const syllableAngle = elapsed * 9.5
        const vowelCycle = Math.sin(syllableAngle) // Oscillates between wide vowels (A, E) and tall vowels (O, U)
        const consonantDip = Math.pow(Math.max(0, Math.sin(elapsed * 4.8)), 6) * 0.45

        const targetScaleX = Math.max(0.4, (1.2 + vowelCycle * 0.5) * (0.6 + speechVal * 2.2))
        const targetScaleY = Math.max(0.2, (1.0 - vowelCycle * 0.4 - consonantDip) * (0.7 + speechVal * 3.6))

        speechMouthMesh.scale.x = THREE.MathUtils.damp(speechMouthMesh.scale.x, targetScaleX, 18, delta)
        speechMouthMesh.scale.y = THREE.MathUtils.damp(speechMouthMesh.scale.y, targetScaleY, 18, delta)

        speechMouthInner.scale.x = THREE.MathUtils.damp(speechMouthInner.scale.x, targetScaleX * 0.85, 18, delta)
        speechMouthInner.scale.y = THREE.MathUtils.damp(speechMouthInner.scale.y, targetScaleY * 0.85, 18, delta)

        // Smiling dimples lift dynamically with happiness
        smileDimpleLeft.position.y = -0.076 + happySquint * 0.008
        smileDimpleRight.position.y = -0.076 + happySquint * 0.008

        mouthSpeechLight.intensity = speechVal * 4.8 + 0.4
      } else {
        smileArc.visible = true
        speechMouthMesh.visible = false
        speechMouthInner.visible = false
        smileDimpleLeft.visible = false
        smileDimpleRight.visible = false

        smileArc.scale.setScalar(1.0 + Math.sin(elapsed * 1.8) * 0.05)
        mouthSpeechLight.intensity = 0.25
      }

      // I. Spine & Torso Biomechanical Sway & Pelvis Dynamics
      const walkWeight = Math.min(1.0, Math.max(0.0, ws.walkSpeed * 0.9))
      const targetTorsoRotX = isCurrentlySpeaking
        ? (-0.03 * speechVal - (speechTime >= 9.4 ? 0.04 : 0))
        : (ws.isJumping
            ? (jumpCrouch > 0 ? 0.28 * jumpCrouch : (jumpFlight > 0 ? -0.14 : 0.22 * jumpLand))
            : (ws.isWalking ? -0.10 * walkWeight : -0.03))
      const targetTorsoRotY = isCurrentlySpeaking
        ? THREE.MathUtils.clamp(-rArmY * 0.08, -0.08, 0.08)
        : (ws.isJumping ? 0 : (ws.isWalking ? Math.sin(ws.walkCycle) * 0.08 * walkWeight : p.x * 0.12))
      const targetTorsoRotZ = isCurrentlySpeaking
        ? THREE.MathUtils.clamp(-rArmZ * 0.06, -0.06, 0.06)
        : (ws.isWalking ? Math.sin(ws.walkCycle) * 0.045 * walkWeight : 0)

      torso.position.y = 0.12 + breath * 0.3
      torso.rotation.x = THREE.MathUtils.damp(torso.rotation.x, targetTorsoRotX, 10, delta)
      torso.rotation.y = THREE.MathUtils.damp(torso.rotation.y, targetTorsoRotY, 10, delta)
      torso.rotation.z = THREE.MathUtils.damp(torso.rotation.z, targetTorsoRotZ, 10, delta)

      // Pelvic roll & yaw into the stride
      const targetHipsRotZ = ws.isWalking ? Math.sin(ws.walkCycle) * 0.05 * walkWeight : 0
      const targetHipsRotY = ws.isWalking ? -Math.sin(ws.walkCycle) * 0.08 * walkWeight : 0
      hips.rotation.z = THREE.MathUtils.damp(hips.rotation.z, targetHipsRotZ, 10, delta)
      hips.rotation.y = THREE.MathUtils.damp(hips.rotation.y, targetHipsRotY, 10, delta)

      heartCore.scale.setScalar(1.0 + Math.sin(elapsed * 3.2) * 0.15 + speechVal * 0.4)

      // J. Levitation Field Glow Pulse
      fieldMat.uniforms.uTime.value = elapsed
      levitationField.scale.setScalar(1.0 + Math.sin(elapsed * 2.4) * 0.08)

      // K. Fluid Arm, Elbow, Wrist & Finger Articulation
      // Right Arm Rig
      rightArmRig.armGroup.rotation.x = THREE.MathUtils.damp(rightArmRig.armGroup.rotation.x, rArmX, 14, delta)
      rightArmRig.armGroup.rotation.y = THREE.MathUtils.damp(rightArmRig.armGroup.rotation.y, rArmY, 14, delta)
      rightArmRig.armGroup.rotation.z = THREE.MathUtils.damp(rightArmRig.armGroup.rotation.z, rArmZ, 14, delta)

      rightArmRig.elbow.rotation.x = THREE.MathUtils.damp(rightArmRig.elbow.rotation.x, rElbowX, 14, delta)
      rightArmRig.elbow.rotation.y = THREE.MathUtils.damp(rightArmRig.elbow.rotation.y, rElbowY, 14, delta)
      rightArmRig.forearm.rotation.x = THREE.MathUtils.damp(rightArmRig.forearm.rotation.x, rForearmX, 14, delta)

      rightArmRig.handGroup.rotation.x = THREE.MathUtils.damp(rightArmRig.handGroup.rotation.x, rWristX, 14, delta)
      rightArmRig.handGroup.rotation.y = THREE.MathUtils.damp(rightArmRig.handGroup.rotation.y, rWristY, 14, delta)
      rightArmRig.handGroup.rotation.z = THREE.MathUtils.damp(rightArmRig.handGroup.rotation.z, rWristZ, 14, delta)

      rightArmRig.palmPad.scale.setScalar(1.0 + speechVal * 1.5)
      rightArmRig.thumbPivot.rotation.z = THREE.MathUtils.damp(rightArmRig.thumbPivot.rotation.z, rThumbCurl, 14, delta)
      rightArmRig.thumbPivot.rotation.x = THREE.MathUtils.damp(rightArmRig.thumbPivot.rotation.x, rFingerCurl * 0.8, 14, delta)

      rightArmRig.fingerList.forEach((f, idx) => {
        f.rotation.x = THREE.MathUtils.damp(f.rotation.x, rFingerCurl + idx * 0.02, 14, delta)
        f.rotation.z = THREE.MathUtils.damp(f.rotation.z, (idx - 1) * rFingerSpread, 14, delta)
      })

      // Left Arm Rig
      leftArmRig.armGroup.rotation.x = THREE.MathUtils.damp(leftArmRig.armGroup.rotation.x, lArmX, 14, delta)
      leftArmRig.armGroup.rotation.y = THREE.MathUtils.damp(leftArmRig.armGroup.rotation.y, lArmY, 14, delta)
      leftArmRig.armGroup.rotation.z = THREE.MathUtils.damp(leftArmRig.armGroup.rotation.z, lArmZ, 14, delta)

      leftArmRig.elbow.rotation.x = THREE.MathUtils.damp(leftArmRig.elbow.rotation.x, lElbowX, 14, delta)
      leftArmRig.elbow.rotation.y = THREE.MathUtils.damp(leftArmRig.elbow.rotation.y, lElbowY, 14, delta)
      leftArmRig.forearm.rotation.x = THREE.MathUtils.damp(leftArmRig.forearm.rotation.x, lForearmX, 14, delta)

      leftArmRig.handGroup.rotation.x = THREE.MathUtils.damp(leftArmRig.handGroup.rotation.x, lWristX, 14, delta)
      leftArmRig.handGroup.rotation.y = THREE.MathUtils.damp(leftArmRig.handGroup.rotation.y, lWristY, 14, delta)
      leftArmRig.handGroup.rotation.z = THREE.MathUtils.damp(leftArmRig.handGroup.rotation.z, lWristZ, 14, delta)

      leftArmRig.palmPad.scale.setScalar(1.0 + speechVal * 1.5)
      leftArmRig.thumbPivot.rotation.z = THREE.MathUtils.damp(leftArmRig.thumbPivot.rotation.z, lThumbCurl, 14, delta)
      leftArmRig.thumbPivot.rotation.x = THREE.MathUtils.damp(leftArmRig.thumbPivot.rotation.x, lFingerCurl * 0.8, 14, delta)

      leftArmRig.fingerList.forEach((f, idx) => {
        f.rotation.x = THREE.MathUtils.damp(f.rotation.x, lFingerCurl + idx * 0.02, 14, delta)
        f.rotation.z = THREE.MathUtils.damp(f.rotation.z, -(idx - 1) * lFingerSpread, 14, delta)
      })

      // L. Articulate Left & Right Leg Rigs (Full Walk Cycle, Athletic Jumping & Idle Stance)
      let lLegRotX = 0
      let lLegRotZ = 0
      let lKneeRotX = 0
      let lBootRotX = 0
      let rLegRotX = 0
      let rLegRotZ = 0
      let rKneeRotX = 0
      let rBootRotX = 0
      let stepBounce = 0

      if (ws.isJumping) {
        if (jumpCrouch > 0) {
          // Pre-jump deep crouch spring
          lLegRotX = -0.38 * jumpCrouch
          rLegRotX = -0.38 * jumpCrouch
          lKneeRotX = 0.78 * jumpCrouch
          rKneeRotX = 0.78 * jumpCrouch
          lBootRotX = -0.30 * jumpCrouch
          rBootRotX = -0.30 * jumpCrouch
          leftLegRig.repulsorRing.scale.setScalar(1.0 + jumpCrouch * 0.7)
          rightLegRig.repulsorRing.scale.setScalar(1.0 + jumpCrouch * 0.7)
        } else if (jumpFlight > 0) {
          // Mid-air rocket flight: aerodynamic leg tuck + firing repulsor jets
          lLegRotX = 0.22
          rLegRotX = 0.18
          lKneeRotX = 0.58
          rKneeRotX = 0.52
          lBootRotX = 0.30
          rBootRotX = 0.28
          const rocketFlare = 2.2 + Math.sin(elapsed * 26) * 0.45
          leftLegRig.repulsorRing.scale.setScalar(rocketFlare)
          rightLegRig.repulsorRing.scale.setScalar(rocketFlare)
        } else if (jumpLand > 0) {
          // Touchdown shock absorption
          lLegRotX = -0.28 * jumpLand
          rLegRotX = -0.28 * jumpLand
          lKneeRotX = 0.65 * jumpLand
          rKneeRotX = 0.65 * jumpLand
          leftLegRig.repulsorRing.scale.setScalar(1.4)
          rightLegRig.repulsorRing.scale.setScalar(1.4)
        }
      } else if (!isCurrentlySpeaking && ws.isWalking) {
        const cycle = ws.walkCycle
        const walkBlend = Math.min(1.0, Math.max(0.0, ws.walkSpeed * 0.9))
        stepBounce = Math.sin(cycle * 2) * 0.035 * walkBlend

        // Stance and swing kinematics for Left Leg
        const lSwing = -Math.sin(cycle) // > 0 when left leg swinging forward
        if (lSwing > 0) {
          // Left Swing Phase: Knee bends dynamically to lift foot off terrain
          lLegRotX = -lSwing * 0.58 * walkBlend
          lKneeRotX = Math.sin(lSwing * Math.PI * 0.5) * 0.88 * walkBlend
          lBootRotX = -lSwing * 0.24 * walkBlend // Toe lifts up to clear ground
        } else {
          // Left Stance / Push-off Phase: Leg trails back, pushes off toe
          lLegRotX = -lSwing * 0.44 * walkBlend
          lKneeRotX = (0.06 + Math.max(0, Math.sin(-lSwing * Math.PI)) * 0.12) * walkBlend
          lBootRotX = -lSwing * 0.42 * walkBlend // Ankle extends pushing off the ground
        }
        lLegRotZ = -Math.sin(cycle) * 0.04 * walkBlend

        // Stance and swing kinematics for Right Leg (opposite phase)
        const rSwing = Math.sin(cycle) // > 0 when right leg swinging forward
        if (rSwing > 0) {
          // Right Swing Phase: Knee bends dynamically
          rLegRotX = -rSwing * 0.58 * walkBlend
          rKneeRotX = Math.sin(rSwing * Math.PI * 0.5) * 0.88 * walkBlend
          rBootRotX = -rSwing * 0.24 * walkBlend
        } else {
          // Right Stance / Push-off Phase
          rLegRotX = -rSwing * 0.44 * walkBlend
          rKneeRotX = (0.06 + Math.max(0, Math.sin(-rSwing * Math.PI)) * 0.12) * walkBlend
          rBootRotX = -rSwing * 0.42 * walkBlend
        }
        rLegRotZ = Math.sin(cycle) * 0.04 * walkBlend

        // Ion Repulsor Soles flare with thrust on ground push-off
        leftLegRig.repulsorRing.scale.setScalar(1.0 + Math.max(0, -lSwing) * 0.7 * walkBlend)
        rightLegRig.repulsorRing.scale.setScalar(1.0 + Math.max(0, -rSwing) * 0.7 * walkBlend)
      } else {
        // Idle standing breath
        const idleBreath = Math.sin(elapsed * 2.2) * 0.02
        lLegRotX = idleBreath
        rLegRotX = -idleBreath
        lKneeRotX = 0.04
        rKneeRotX = 0.04
        lBootRotX = 0
        rBootRotX = 0
        leftLegRig.repulsorRing.scale.setScalar(1.0 + Math.sin(elapsed * 3.0) * 0.15)
        rightLegRig.repulsorRing.scale.setScalar(1.0 + Math.sin(elapsed * 3.0) * 0.15)
      }

      leftLegRig.legGroup.rotation.x = THREE.MathUtils.damp(leftLegRig.legGroup.rotation.x, lLegRotX, 16, delta)
      leftLegRig.legGroup.rotation.z = THREE.MathUtils.damp(leftLegRig.legGroup.rotation.z, lLegRotZ, 16, delta)
      leftLegRig.knee.rotation.x = THREE.MathUtils.damp(leftLegRig.knee.rotation.x, lKneeRotX, 16, delta)
      leftLegRig.bootGroup.rotation.x = THREE.MathUtils.damp(leftLegRig.bootGroup.rotation.x, lBootRotX, 16, delta)

      rightLegRig.legGroup.rotation.x = THREE.MathUtils.damp(rightLegRig.legGroup.rotation.x, rLegRotX, 16, delta)
      rightLegRig.legGroup.rotation.z = THREE.MathUtils.damp(rightLegRig.legGroup.rotation.z, rLegRotZ, 16, delta)
      rightLegRig.knee.rotation.x = THREE.MathUtils.damp(rightLegRig.knee.rotation.x, rKneeRotX, 16, delta)
      rightLegRig.bootGroup.rotation.x = THREE.MathUtils.damp(rightLegRig.bootGroup.rotation.x, rBootRotX, 16, delta)

      // M. Floating Ambient Stardust Particles
      particles.rotation.y = elapsed * 0.03

      // N. Buoyant Antigravity Levitation Hover, Wide Stage Locomotion & Leaping
      const hoverFloat = Math.sin(elapsed * 2.2) * 0.035
      const diffX = ws.targetCharX - ws.charX
      const bodyWalkDir = Math.sign(diffX)
      const targetBodyRotY = (!hasCompletedIntro || isCurrentlySpeaking)
        ? 0
        : (ws.isJumping
            ? Math.sign(ws.jumpTargetX - ws.jumpStartX) * 0.45
            : (ws.isWalking ? bodyWalkDir * 1.15 : p.x * 0.20))

      characterRoot.visible = true
      characterRoot.position.x = THREE.MathUtils.damp(characterRoot.position.x, ws.charX, 18, delta)
      characterRoot.position.y = hoverFloat + (ws.isJumping ? jumpY : (stepBounce + ws.hopTimer * 0.06))
      characterRoot.rotation.y = THREE.MathUtils.damp(characterRoot.rotation.y, targetBodyRotY, 9, delta)

      renderer.render(scene, camera)
    }

    animate()

    // 8. Interactive Click Trigger (Ember Wave Emote; No Unwanted Jumps)
    const raycaster = new THREE.Raycaster()
    const clickCoords = new THREE.Vector2()

    const handlePointerDown = (e: PointerEvent) => {
      if (!introCompletedRef.current) {
        if (!speakingRef.current) {
          startSpeech()
        }
        return
      }

      if (speakingRef.current) return

      const rect = renderer.domElement.getBoundingClientRect()
      clickCoords.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      clickCoords.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

      raycaster.setFromCamera(clickCoords, camera)
      const hit = raycaster.intersectObjects(characterRoot.children, true)

      if (hit.length > 0) {
        // Direct click on companion: Playful wave emote
        walkStateRef.current.catchAction = 1.0
        walkStateRef.current.catchTimer = 0
      }
    }
    renderer.domElement.addEventListener('pointerdown', handlePointerDown)

    // 9. Responsive Resize Observer
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth || 340
      const h = container.clientHeight || 460
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('pointermove', handlePointerMove)
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown)
      resizeObserver.disconnect()

      // Traverse scene and dispose geometries, materials, and textures
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry?.dispose()
          const mats = Array.isArray(object.material) ? object.material : [object.material]
          mats.forEach((m: THREE.Material) => m?.dispose())
        }
      })

      renderer.dispose()
      renderer.forceContextLoss()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }

      // Safely close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
      analyserRef.current = null

      // Safely cancel speech synthesis fallback
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  return (
    <div className="cosmic-companion-3d-stage">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={mountRef}
        className="companion-canvas-mount"
        onClick={handleStageClick}
        role="button"
        tabIndex={0}
        aria-label="Interactive 3D Cosmic Companion Ember"
      />

      {/* Dialogue Deck & Right-Side Travel Vectors for Other Agents & Worlds */}
      <div className={`companion-hologram-deck ${speaking ? 'is-speaking' : 'is-idle'}`}>
        {/* Live Speech Subtitle Bubble - Streams text using transitions.dev */}
        {showText && speaking && (
          <div className="deck-speech-bubble entrance" role="region" aria-live="polite">
            <div className="deck-header">
              <span className="deck-channel">TRANSMISSION // EMBER GUIDE</span>
              <div className="deck-header-right">
                <button
                  type="button"
                  className={`deck-mute-toggle ${isMuted ? 'is-muted' : ''}`}
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute Ember voice" : "Mute Ember voice"}
                  title={isMuted ? "Unmute Ember voice" : "Mute Ember voice"}
                >
                  <span className="mute-icon-glyph">{isMuted ? '🔇' : '🔊'}</span>
                  <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                </button>
                {speaking && !isMuted && (
                  <span className="voice-soundwave inline-waves" aria-hidden="true">
                    <span className="bar b1" />
                    <span className="bar b2" />
                    <span className="bar b3" />
                    <span className="bar b4" />
                  </span>
                )}
              </div>
            </div>
            <StreamingText
              words={TIMED_SPEECH_WORDS}
              active={showText}
              audioRef={audioElementRef}
              speechStartTimeRef={speechStartTimeRef}
              speaking={speaking}
              streamTrigger={streamTrigger}
            />
          </div>
        )}

        {/* ── EXPEDITION DESTINATIONS: TRAVEL BUTTONS FOR OTHER AGENTS & WORLDS ── */}
        <div className="travel-destinations-deck">
          <div className="travel-deck-header">
            <div className="travel-deck-tag">
              <span className="deck-beacon active" />
              <span className="deck-channel">DESTINATION VECTORS // OTHER AGENTS & DOMAINS</span>
            </div>
            <span className="travel-status-dot active">READY TO TRAVEL</span>
          </div>

          <div className="travel-buttons-grid">
            {/* 1. Projects Universe */}
            <button
              className="travel-vector-card card-projects"
              onClick={(e) => {
                e.stopPropagation()
                stopSpeech()
                onTravel?.('projects')
              }}
              aria-label="Travel to Projects Universe"
            >
              <div className="t-card-glow" />
              <div className="t-card-icon">🚀</div>
              <div className="t-card-content">
                <div className="t-card-topline">
                  <span className="t-agent-tag">ORION // SYSTEMS ARCHITECT</span>
                  <span className="t-sector">01</span>
                </div>
                <strong>Projects Universe</strong>
                <p>Vidyu SaaS, Cybersecurity Ledger & Full-Stack Web Apps</p>
              </div>
              <span className="t-travel-pill">
                <span>Travel</span>
                <Icon name="arrow" />
              </span>
            </button>

            {/* 2. Education Details */}
            <button
              className="travel-vector-card card-education"
              onClick={(e) => {
                e.stopPropagation()
                stopSpeech()
                onTravel?.('education')
              }}
              aria-label="Travel to Education Details"
            >
              <div className="t-card-glow" />
              <div className="t-card-icon">🎓</div>
              <div className="t-card-content">
                <div className="t-card-topline">
                  <span className="t-agent-tag">NOVA // SCHOLAR GUIDE</span>
                  <span className="t-sector">02</span>
                </div>
                <strong>Education Details</strong>
                <p>B.Tech IT, VVIT · Coding, Problem Solving & Systems</p>
              </div>
              <span className="t-travel-pill">
                <span>Travel</span>
                <Icon name="arrow" />
              </span>
            </button>

            {/* 3. Skills & Tech Stack */}
            <button
              className="travel-vector-card card-vidyu"
              onClick={(e) => {
                e.stopPropagation()
                stopSpeech()
                onTravel?.('skills')
              }}
              aria-label="Travel to Skills & Stack"
            >
              <div className="t-card-glow" />
              <div className="t-card-icon">⚡</div>
              <div className="t-card-content">
                <div className="t-card-topline">
                  <span className="t-agent-tag">NOVA // TECHNICAL ARCHITECT</span>
                  <span className="t-sector">03</span>
                </div>
                <strong>Skills & Stack</strong>
                <p>Full-Stack Arsenal, Concurrency & Security Architecture</p>
              </div>
              <span className="t-travel-pill">
                <span>Travel</span>
                <Icon name="arrow" />
              </span>
            </button>

            {/* 4. Achievements */}
            <button
              className="travel-vector-card card-achievements"
              onClick={(e) => {
                e.stopPropagation()
                stopSpeech()
                onTravel?.('achievements')
              }}
              aria-label="Travel to Achievements"
            >
              <div className="t-card-glow" />
              <div className="t-card-icon">🏆</div>
              <div className="t-card-content">
                <div className="t-card-topline">
                  <span className="t-agent-tag">TITAN // HONOR SENTINEL</span>
                  <span className="t-sector">04</span>
                </div>
                <strong>Achievements</strong>
                <p>AWS, Google AI-ML, Cisco Security & MongoDB Credentials</p>
              </div>
              <span className="t-travel-pill">
                <span>Travel</span>
                <Icon name="arrow" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
