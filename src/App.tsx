import { useEffect, useRef, useState } from 'react'
import { Icon } from './components/Icon'
import { ResumeCVModal } from './components/ResumeCVModal'
import { ContactModal } from './components/ContactModal'
import { FlightOverlay } from './components/FlightOverlay'
import { useMotionPreference } from './hooks/useMotionPreference'
import { useJourney } from './navigation/useJourney'
import { UniverseScene } from './scene/UniverseScene'
import type { GraphicsStatus } from './scene/UniverseScene'
import { SurfaceExpedition } from './components/SurfaceExpedition'
import { frameClock } from './animation/frameClock'
import type { SceneInteraction } from './scene/UniverseRenderer'
import { getComposition } from './scene/composition'
import { CosmicCompanion3D } from './components/CosmicCompanion3D'
import { DestinationDossier, type DestinationSection } from './components/DestinationDossier'

export function App() {
  const reducedMotion = useMotionPreference()
  const { phase, frame, explore, home, skip } = useJourney(reducedMotion)
  const [resumeCVOpen, setResumeCVOpen] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [activeDossier, setActiveDossier] = useState<DestinationSection | null>(null)
  const [still, setStill] = useState(false)
  const [cockpitView, setCockpitView] = useState(false)
  const [surfaceLocation, setSurfaceLocation] = useState<'pad' | 'canyon'>('pad')
  const [transitState, setTransitState] = useState<'idle' | 'flying-to-canyon' | 'flying-to-pad'>('idle')
  const [graphics, setGraphics] = useState<GraphicsStatus>('preparing')
  const [emberVoiceMuted, setEmberVoiceMuted] = useState(() => {
    try {
      return localStorage.getItem('ember_voice_muted') === 'true'
    } catch {
      return false
    }
  })

  const toggleEmberVoiceMute = () => {
    setEmberVoiceMuted((prev) => {
      const next = !prev
      try {
        localStorage.setItem('ember_voice_muted', String(next))
      } catch {
        // ignore
      }
      return next
    })
  }
  const arrivalHeading = useRef<HTMLHeadingElement>(null)
  const exploreButton = useRef<HTMLButtonElement>(null)
  const plumeRef = useRef<SVGSVGElement>(null)
  const gearRef = useRef<SVGSVGElement>(null)
  const retroRef = useRef<SVGSVGElement>(null)
  const entryVeilRef = useRef<HTMLDivElement>(null)
  const shockwaveRef = useRef<HTMLDivElement>(null)
  const slipstreamRef = useRef<HTMLDivElement>(null)
  const endpointsRef = useRef({
    p1x: 240,
    p1y: -220,
    p2x: 420,
    p2y: 120,
    r0x: 780,
    r0y: 220,
    r1x: 560,
    r1y: -260,
    r2x: 220,
    r2y: -280,
  })
  const interaction = useRef<SceneInteraction>({ highlighted: false, blocked: false })
  const previousPhase = useRef(phase)
  const travelling = phase === 'departing' || phase === 'returning'
  const arrived = phase === 'arrival'

  const flyToCanyon = () => {
    if (transitState !== 'idle') return

    setTransitState('flying-to-canyon')
    setSurfaceLocation('canyon')
    setTimeout(() => {
      setTransitState('idle')
    }, 400)
  }

  const flyToPad = () => {
    if ('speechSynthesis' in window) {
      queueMicrotask(() => {
        try { window.speechSynthesis.cancel() } catch { /* ignore */ }
      })
    }
    if (transitState !== 'idle') return
    setTransitState('flying-to-pad')
    setSurfaceLocation('pad')
    setTimeout(() => {
      setTransitState('idle')
    }, 400)
  }

  const handleTravelDestination = (destination: DestinationSection) => {
    if ('speechSynthesis' in window) {
      queueMicrotask(() => {
        try { window.speechSynthesis.cancel() } catch { /* ignore */ }
      })
    }
    if (destination === 'vidyu') {
      flyToPad()
      return
    }

    // Open destination dossier immediately for instant, silky-smooth switching
    setActiveDossier(destination)
  }

  useEffect(() => {
    if (phase !== 'arrival') {
      setCockpitView(false)
      setSurfaceLocation('pad')
      setTransitState('idle')
    }
  }, [phase])

  // Support direct deep link via URL hash (e.g. #projects)
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase()
      if (['projects', 'education', 'vidyu', 'achievements'].includes(hash)) {
        setActiveDossier(hash as DestinationSection)
      }
    }
    checkHash()
    window.addEventListener('hashchange', checkHash)
    return () => window.removeEventListener('hashchange', checkHash)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeDossier) {
          setActiveDossier(null)
          return
        }
        if (surfaceLocation === 'canyon' && transitState === 'idle') {
          flyToPad()
          return
        }
        if (cockpitView) {
          setCockpitView(false)
          return
        }
        if (travelling) {
          skip()
          return
        }
      }
      if (travelling && (e.code === 'Space' || e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        skip()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeDossier, surfaceLocation, transitState, cockpitView, travelling, skip])

  useEffect(() => {
    interaction.current.blocked = resumeCVOpen || contactOpen || !!activeDossier || travelling
    interaction.current.highlighted = false
    frameClock.invalidate()
  }, [resumeCVOpen, contactOpen, activeDossier, travelling])

  useEffect(() => {
    if (phase === 'arrival') arrivalHeading.current?.focus({ preventScroll: true })
    else if (phase === 'gateway' && previousPhase.current !== 'gateway') exploreButton.current?.focus({ preventScroll: true })
    previousPhase.current = phase
    document.title = phase === 'arrival' ? 'Vidyu World — Raju’s Cosmic Worlds' : 'Raju’s Cosmic Worlds — The Nebula Gateway'
  }, [phase])

  // Pre-compute and cache launchpad endpoints while idle and on resize (zero layout reads on click)
  useEffect(() => {
    const measureEndpoints = () => {
      const button = exploreButton.current
      if (!button) return
      const savedTransform = button.style.transform
      button.style.transform = 'none'
      const rect = button.getBoundingClientRect()
      button.style.transform = savedTransform
      const startX = rect.left + rect.width * 0.54
      const startY = rect.top + rect.height * 0.5
      const width = window.innerWidth
      const height = window.innerHeight
      const composition = getComposition(width, height)
      const padX = width * (composition.portrait ? 0.72 : 0.77)
      const padY = height * (composition.portrait ? 0.78 : 0.68)
      const apexX = startX + (padX - startX) * 0.54
      const apexY = height * (composition.portrait ? 0.16 : 0.18)
      // On Vidyu World, Pad 01 is located on the lower-right planetary limb:
      const returnLaunchX = width * (composition.portrait ? 0.72 : 0.76)
      const returnLaunchY = height * (composition.portrait ? 0.74 : 0.74)
      const r0x = returnLaunchX - startX
      const r0y = returnLaunchY - startY

      // Control Point 1: Steep Atmospheric Ascent Vector (punches upward and outward toward space)
      const r1x = r0x - 220
      const r1y = r0y - 480

      // Control Point 2: Deep-space Trans-orbital Cruise Apex in the high starry cosmos
      const r2x = r0x * 0.28
      const r2y = -startY * 0.52 - 60

      endpointsRef.current = {
        p1x: apexX - startX,
        p1y: apexY - startY,
        p2x: padX - startX,
        p2y: padY - startY,
        r0x,
        r0y,
        r1x,
        r1y,
        r2x,
        r2y,
      }
    }
    measureEndpoints()
    window.addEventListener('resize', measureEndpoints, { passive: true })
    return () => window.removeEventListener('resize', measureEndpoints)
  }, [])

  useEffect(() => {
    const button = exploreButton.current
    if (!button) return
    const plume = plumeRef.current
    const gear = gearRef.current
    const retro = retroRef.current
    const entryVeil = entryVeilRef.current

    if (phase === 'gateway') {
      button.style.transform = ''
      button.style.opacity = '1'
      button.style.visibility = 'visible'
      if (plume) { plume.style.opacity = '0'; plume.style.transform = 'scale3d(0, 0.35, 1)' }
      if (retro) { retro.style.opacity = '0'; retro.style.transform = 'scale3d(1, 0, 1)' }
      if (gear) { gear.style.opacity = '0'; gear.style.transform = 'translate3d(0, -12px, 0) scale3d(1, 0.2, 1)' }
      if (entryVeil) entryVeil.style.opacity = '0'
      return
    }

    if (reducedMotion) {
      const { p2x, p2y } = endpointsRef.current
      if (phase === 'arrival' || phase === 'departing') {
        button.style.transform = `translate3d(${p2x}px, ${p2y}px, 0) scale(0.62)`
        button.style.opacity = '0'
        button.style.visibility = 'hidden'
        if (gear) { gear.style.opacity = '1'; gear.style.transform = 'translate3d(0, 0, 0) scale3d(1, 1, 1)' }
      } else {
        button.style.transform = ''
        button.style.opacity = '1'
        button.style.visibility = 'visible'
      }
      return
    }

    if (phase === 'arrival') {
      const { p2x, p2y } = endpointsRef.current
      button.style.transform = `perspective(900px) translate3d(${p2x}px, ${p2y}px, 0) rotate(0deg) rotateY(0deg) rotateX(0deg) scale(0.62)`
      button.style.opacity = '0'
      button.style.visibility = 'hidden'
      if (plume) { plume.style.opacity = '0'; plume.style.transform = 'scale3d(0, 0.35, 1)' }
      if (retro) { retro.style.opacity = '0'; retro.style.transform = 'scale3d(1, 0, 1)' }
      if (gear) { gear.style.opacity = '1'; gear.style.transform = 'translate3d(0, 0, 0) scale3d(1, 1, 1)' }
      if (entryVeil) entryVeil.style.opacity = '0'
      return
    }

    const bezier = (u: number) => {
      const inv = 1 - u
      const { p1x, p1y, p2x, p2y } = endpointsRef.current
      return {
        x: 2 * inv * u * p1x + u * u * p2x,
        y: 2 * inv * u * p1y + u * u * p2y,
      }
    }

    let exteriorHidden = false
    let veilHidden = true

    const subscription = frameClock.subscribe((now) => {
      const raw = frame.current.raw

      // ─────────────────────────────────────────────────────────────
      // CINEMATIC LEVEL RETURN FLIGHT: Planetary Liftoff to Gateway Dock
      // ─────────────────────────────────────────────────────────────
      if (phase === 'returning') {
        if (exteriorHidden || button.style.visibility === 'hidden') {
          button.style.visibility = 'visible'
          button.style.opacity = '1'
          exteriorHidden = false
        }

        const shockwave = shockwaveRef.current
        const slipstream = slipstreamRef.current
        const { r0x, r0y, r1x, r1y, r2x, r2y } = endpointsRef.current

        // Hollywood cinematic trajectory curve parameter u:
        // Slow powerful liftoff acceleration out of gravity, steady hypersonic deep-space glide, soft docking deceleration
        const u = raw * raw * (3 - 2 * raw)
        const inv = 1 - u
        const inv2 = inv * inv
        const inv3 = inv2 * inv
        const u2 = u * u

        // Exact Cubic Bezier trajectory from surface Pad 01 to Gateway dock (0, 0)
        const curX = inv3 * r0x + 3 * inv2 * u * r1x + 3 * inv * u2 * r2x
        const curY = inv3 * r0y + 3 * inv2 * u * r1y + 3 * inv * u2 * r2y

        // Exact analytic derivative B'(u) along flight vector
        const term1 = 3 * inv2
        const term2 = 6 * inv * u
        const term3 = 3 * u2
        const dx = term1 * (r1x - r0x) + term2 * (r2x - r1x) + term3 * (-r2x)
        const dy = term1 * (r1y - r0y) + term2 * (r2y - r1y) + term3 * (-r2y)

        // Physical flight pitch: pointing along the flight vector toward the left
        const rawPitch = Math.atan2(dy, Math.max(1, -dx)) * (180 / Math.PI)

        // Dynamic scale in true perspective: emerges nestled on distant planetary surface (0.15) and expands to full dock (1.0)
        const scale = 0.15 + 0.85 * Math.pow(u, 0.76)

        // Docking alignment turn (raw = 0.72 .. 0.94):
        // Turns from deep-space flight facing left (rotateY: 180deg) to dock-facing orientation (rotateY: 0deg)
        const dockPhase = Math.max(0, Math.min(1, (raw - 0.72) / 0.22))
        const dockEase = dockPhase * dockPhase * (3 - 2 * dockPhase)

        const yaw = 180 * (1 - dockEase)
        const bankRoll = Math.sin(u * Math.PI) * (1 - dockEase) * 18
        const dockBank = Math.sin(dockEase * Math.PI) * 14
        const pitch = rawPitch * (1 - dockEase)

        // Landing gear deployment (raw = 0.76 .. 0.90)
        const gearDeploy = Math.max(0, Math.min(1, (raw - 0.76) / 0.14))
        const gearEase = gearDeploy * gearDeploy * (3 - 2 * gearDeploy)

        // Hydraulic suspension touchdown compression & rebound on dock contact (raw = 0.91 .. 1.0)
        const touchdownT = Math.max(0, Math.min(1, (raw - 0.91) / 0.09))
        const settleY = Math.sin(touchdownT * Math.PI * 1.35) * Math.exp(-touchdownT * 2.8) * 5.2

        // Deep-space cosmic rumble vibration
        const rumbleAmp = Math.sin(raw * Math.PI) * (1 - dockEase) * 0.75
        const rumbleX = Math.cos(now * 0.18) * rumbleAmp * 0.6
        const rumbleY = Math.sin(now * 0.22) * rumbleAmp

        button.style.transform = `perspective(1000px) translate3d(${(curX + rumbleX).toFixed(1)}px, ${(curY + rumbleY + settleY).toFixed(1)}px, 0) rotate(${pitch.toFixed(2)}deg) rotateY(${yaw.toFixed(2)}deg) rotateX(${(bankRoll + dockBank).toFixed(2)}deg) scale(${scale.toFixed(3)})`
        button.style.opacity = '1'

        // 1. Supersonic Plume: High-energy afterburner burn during liftoff and deep-space transit
        if (plume) {
          if (raw < 0.70) {
            const mainThrust = raw < 0.22
              ? 0.7 + 0.75 * Math.sin((raw / 0.22) * (Math.PI * 0.5))
              : raw < 0.52
                ? 1.3 + Math.sin(now * 0.12) * 0.15
                : Math.max(0, (1 - (raw - 0.52) / 0.18) * 1.3)
            const pulse = 0.94 + Math.sin(now * 0.14) * 0.06
            const ep = mainThrust * pulse
            plume.style.opacity = ep > 0.02 ? '1' : '0'
            plume.style.transform = `scale3d(${ep.toFixed(3)}, ${(0.75 + ep * 0.25).toFixed(3)}, 1)`
          } else {
            plume.style.opacity = '0'
          }
        }

        // 2. Forward Retro-Thruster Jets: Counter-thrust braking burn during docking approach (raw = 0.70 .. 0.93)
        if (retro) {
          if (raw >= 0.70 && raw <= 0.93) {
            const retroPhase = Math.sin(((raw - 0.70) / 0.23) * Math.PI)
            const retroJitter = 0.92 + Math.sin(now * 0.2) * 0.08
            const epRetro = retroPhase * retroJitter
            retro.style.opacity = `${(epRetro * 0.95).toFixed(3)}`
            retro.style.transform = `scale3d(${epRetro.toFixed(3)}, ${(0.8 + epRetro * 0.2).toFixed(3)}, 1)`
          } else {
            retro.style.opacity = '0'
          }
        }

        // 3. Heavy-Duty Landing Gear: Extends from undercarriage and absorbs touchdown
        if (gear) {
          gear.style.opacity = `${gearEase.toFixed(3)}`
          gear.style.transform = `translate3d(0, ${((1 - gearEase) * -18 - settleY * 0.5).toFixed(1)}px, 0) scale3d(1, ${(0.15 + gearEase * 0.85 - settleY * 0.03).toFixed(3)}, 1)`
        }

        // 4. Supersonic Atmospheric Breakout Shockwave Ring (raw = 0.04 .. 0.24)
        if (shockwave) {
          if (raw >= 0.04 && raw <= 0.24) {
            const t_sw = (raw - 0.04) / 0.20
            const swScale = 0.3 + 2.6 * t_sw
            const swAlpha = Math.sin(t_sw * Math.PI) * 0.92
            shockwave.style.opacity = `${swAlpha.toFixed(3)}`
            shockwave.style.transform = `translate(-50%, -50%) scale(${swScale.toFixed(3)})`
          } else {
            shockwave.style.opacity = '0'
          }
        }

        // 5. Cosmic Hypersonic Slipstream Warp Streaks (raw = 0.22 .. 0.70)
        if (slipstream) {
          if (raw >= 0.22 && raw <= 0.70) {
            const t_ss = Math.sin(((raw - 0.22) / 0.48) * Math.PI)
            slipstream.style.opacity = `${(t_ss * 0.85).toFixed(3)}`
          } else {
            slipstream.style.opacity = '0'
          }
        }

        // 6. Atmospheric cloud-break entry veil: flashes as ship leaves Vidyu atmosphere (raw = 0.02 .. 0.20)
        const breakoutGlow = raw > 0.02 && raw < 0.20 ? Math.sin(((raw - 0.02) / 0.18) * Math.PI) : 0
        if (entryVeil) {
          if (breakoutGlow <= 0.002) {
            if (!veilHidden) {
              entryVeil.style.opacity = '0'
              veilHidden = true
            }
          } else {
            veilHidden = false
            entryVeil.style.opacity = `${(breakoutGlow * 0.8).toFixed(3)}`
          }
        }
        return
      }

      // ─────────────────────────────────────────────────────────────
      // DEPARTING FLIGHT: Launch from Gateway to Vidyu World
      // ─────────────────────────────────────────────────────────────
      const t = raw

      // The 2D hero button launches from the Gateway and smoothly transitions into Cockpit POV (t = 0.12..0.26).
      // Throughout the planetary atmosphere and on Pad 01, our 3D spacecraft is rendered in Three.js WebGL!
      const rawFade = Math.max(0, Math.min(1, (t - 0.12) / 0.14))
      const launchFade = rawFade * rawFade * (3 - 2 * rawFade)
      const exteriorOpacity = 1 - launchFade

      if (exteriorOpacity <= 0.002) {
        if (!exteriorHidden) {
          button.style.opacity = '0'
          button.style.visibility = 'hidden'
          if (plume) plume.style.opacity = '0'
          if (retro) retro.style.opacity = '0'
          exteriorHidden = true
        }
      } else {
        if (exteriorHidden) {
          button.style.visibility = 'visible'
          exteriorHidden = false
        }
        const ignition = Math.min(1, t / 0.14)
        const ignitionEase = ignition * ignition * (3 - 2 * ignition)
        const flightT = Math.max(0, Math.min(1, (t - 0.08) / 0.92))
        const u = ignitionEase * 0.02 + 0.98 * (0.5 - 0.5 * Math.cos(Math.PI * Math.pow(flightT, 0.94)))

        const current = bezier(u)
        const next = bezier(Math.min(1, u + 0.02))
        const tangentAngle = Math.atan2(next.y - current.y, Math.max(4, next.x - current.x)) * (180 / Math.PI)

        const flareBlend = Math.max(0, Math.min(1, (t - 0.72) / 0.22))
        const flareEase = flareBlend * flareBlend * (3 - 2 * flareBlend)
        const climbPitch = tangentAngle * Math.min(1, t * 4.2) * (1 - flareEase)
        const flareNoseUp = Math.sin(flareBlend * Math.PI) * -8.5
        const pitch = climbPitch + flareNoseUp

        const cruiseEnvelope = Math.sin(flightT * Math.PI) * (1 - flareEase * 0.85)
        const bankRoll = cruiseEnvelope * 12
        const bankYaw = cruiseEnvelope * -10

        const touchdownT = Math.max(0, Math.min(1, (t - 0.88) / 0.12))
        // Damped hydraulic landing-gear compression & rebound on Pad 01 contact
        const settleY = Math.sin(touchdownT * Math.PI * 1.35) * Math.exp(-touchdownT * 2.8) * 5.2

        const vibEnvelope = t < 0.20
          ? Math.sin((t / 0.20) * Math.PI) * 1.0
          : t > 0.72 && t < 0.92
            ? Math.sin(((t - 0.72) / 0.20) * Math.PI) * 0.75
            : 0
        const rumbleX = Math.cos(now * 0.14) * vibEnvelope * 0.5
        const rumbleY = Math.sin(now * 0.18) * vibEnvelope

        const scale = 1 - 0.38 * flightT - 0.31 * Math.sin(flightT * Math.PI)

        button.style.transform = `perspective(900px) translate3d(${(current.x + rumbleX).toFixed(1)}px, ${(current.y + rumbleY + settleY).toFixed(1)}px, 0) rotate(${pitch.toFixed(2)}deg) rotateY(${bankYaw.toFixed(2)}deg) rotateX(${bankRoll.toFixed(2)}deg) scale(${scale.toFixed(3)})`
        button.style.opacity = `${exteriorOpacity.toFixed(3)}`

        const pulse = 1 + Math.sin(now * 0.09) * 0.08
        const mainThrust = t < 0.12
          ? 0.2 + 0.95 * (ignition * ignition)
          : t < 0.78
            ? 1.22 + Math.sin(flightT * Math.PI) * 0.28
            : Math.max(0, (1 - (t - 0.78) / 0.18) * 1.15)
        const ep = mainThrust * pulse
        if (plume) {
          plume.style.opacity = ep > 0.02 ? '1' : '0'
          plume.style.transform = `scale3d(${ep.toFixed(3)}, ${(0.78 + ep * 0.22).toFixed(3)}, 1)`
        }

        const retroThrust = t > 0.78 && t < 0.98
          ? Math.sin(((t - 0.78) / 0.20) * Math.PI) * (0.98 + Math.sin(now * 0.12) * 0.12)
          : 0
        if (retro) {
          retro.style.opacity = `${retroThrust.toFixed(3)}`
          retro.style.transform = `scale3d(1, ${retroThrust.toFixed(3)}, 1)`
        }

        const gearDeploy = Math.max(0, Math.min(1, (t - 0.76) / 0.13))
        if (gear) {
          gear.style.opacity = `${gearDeploy.toFixed(3)}`
          gear.style.transform = `translate3d(0, ${((1 - gearDeploy) * -12 - settleY * 0.45).toFixed(1)}px, 0) scale3d(1, ${(0.2 + gearDeploy * 0.8 - settleY * 0.025).toFixed(3)}, 1)`
        }
      }

      // Atmospheric cloud-break / plasma entry flash (t = 0.58..0.86)
      const entryGlow = t > 0.58 && t < 0.86 ? Math.sin(((t - 0.58) / 0.28) * Math.PI) : 0
      if (entryGlow <= 0.002) {
        if (!veilHidden && entryVeil) {
          entryVeil.style.opacity = '0'
          veilHidden = true
        }
      } else if (entryVeil) {
        veilHidden = false
        entryVeil.style.opacity = `${(entryGlow * 0.85).toFixed(3)}`
      }
    }, false, 2)

    return () => {
      subscription.dispose()
    }
  }, [phase, reducedMotion, frame, cockpitView])

  const goHome = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    try {
      if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search)
      }
    } catch {
      // ignore
    }
    setActiveDossier(null)
    setResumeCVOpen(false)
    setContactOpen(false)
    setCockpitView(false)
    setSurfaceLocation('pad')
    setTransitState('idle')
    home(true)
  }
  const location = arrived
    ? (cockpitView
        ? 'Vidyu Prime · Spacecraft Cockpit POV'
        : surfaceLocation === 'canyon'
          ? 'Vidyu World · Ember Canyon Outpost'
          : 'Vidyu World · Landing Pad 01')
    : phase === 'departing'
      ? 'Entering Vidyu Prime Atmosphere'
      : phase === 'returning'
        ? 'Ascending to Orbital Gateway'
        : 'The Nebula Gateway'

  return (
    <div className={`cosmic-app phase-${phase} ${cockpitView ? 'is-cockpit-pinned' : ''}`} data-phase={phase} data-graphics={graphics} data-reduced-motion={reducedMotion}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <UniverseScene journey={frame} phase={phase} reducedMotion={reducedMotion} still={still} onStatus={setGraphics} interaction={interaction} />
      <SurfaceExpedition
        journey={frame}
        phase={phase}
        arrived={arrived}
        reducedMotion={reducedMotion}
        location={surfaceLocation}
        transit={transitState}
      />

      {/* Atmospheric Cloud-Break Entry Plasma Flash Veil */}
      <div ref={entryVeilRef} className="atmospheric-entry-veil" aria-hidden="true" />


      <header className="site-header">
        <div className="site-header-left">
          {arrived && (
            <button
              className="round-glass-back-btn"
              onClick={goHome}
              disabled={transitState !== 'idle'}
              aria-label="Return to Gateway"
              title="Return to Gateway"
            >
              <Icon name="back" />
            </button>
          )}
          <button className="wordmark" onClick={goHome} aria-label="Raju Cosmic Worlds — return to gateway"><span className="brand-symbol"><Icon name="orbit" /></span><span><strong>RAJU</strong><span>COSMIC WORLDS</span></span></button>
        </div>
        <nav aria-label="Main navigation">
          <button
            className="glass-nav-btn resume-cv-nav-btn"
            onClick={() => setResumeCVOpen(true)}
            aria-haspopup="dialog"
            aria-label="Resume & CV"
          >
            <Icon name="file" />
            <span>Resume & CV</span>
          </button>
          <button
            className="glass-nav-btn contact-nav-btn"
            onClick={() => setContactOpen(true)}
            aria-haspopup="dialog"
            aria-label="Contact Raju"
          >
            <span className="contact-status-dot" />
            <span>Contact</span>
          </button>
        </nav>
      </header>

      <main id="main-content" className="main-content" tabIndex={-1}>
        <section
          className={`hero-content entrance ${phase !== 'gateway' ? 'is-departing' : ''} ${arrived ? 'is-arrived' : ''}`}
          aria-labelledby={phase === 'gateway' ? 'gateway-title' : undefined}
          aria-hidden={phase !== 'gateway' ? 'true' : undefined}
        >
          <div className="eyebrow hero-eyebrow"><span className="status-dot" />YOUR JOURNEY BEGINS HERE</div>
          <h1 id="gateway-title"><span className="welcome-line">Welcome to <span>Raju's </span></span><em>Universe.</em></h1>
          <p className="hero-description">Every world has a story. Every idea has a destination. Are you ready to explore mine?</p>
          <div className="hero-actions">
            <button
              ref={exploreButton}
              className={`ship-button ${travelling ? 'is-launching' : ''} ${arrived ? 'is-landed' : ''}`}
              onClick={explore}
              disabled={phase !== 'gateway'}
              tabIndex={phase === 'gateway' ? 0 : -1}
              aria-label="Enter the spacecraft — Travel to Vidyu World"
            >
              {/* Hollywood-Grade Supersonic Rocket Plume (320px) with 4 Mach Shock Diamonds */}
              <svg ref={plumeRef} className="ship-hero-plume" viewBox="0 0 320 120" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="hero-plume-glow-320" x1="320" y1="60" x2="0" y2="60" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
                    <stop offset="25%" stopColor="#818cf8" stopOpacity="0.8" />
                    <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.6" />
                    <stop offset="85%" stopColor="#ef4444" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="hero-plume-core-320" x1="320" y1="60" x2="30" y2="60" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="18%" stopColor="#67e8f9" />
                    <stop offset="45%" stopColor="#38bdf8" />
                    <stop offset="75%" stopColor="#fbbf24" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="hero-plume-center-320" x1="320" y1="60" x2="80" y2="60" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="30%" stopColor="#e0f2fe" stopOpacity="0.95" />
                    <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                  </linearGradient>
                  <radialGradient id="hero-nozzle-glint-320" cx="316" cy="60" r="26" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="35%" stopColor="#67e8f9" stopOpacity="0.95" />
                    <stop offset="70%" stopColor="#0284c7" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                  </radialGradient>
                  <filter id="plume-blur-320" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4.5" />
                  </filter>
                </defs>
                {/* Volumetric outer blooming plasma */}
                <ellipse cx="160" cy="60" rx="160" ry="42" fill="url(#hero-plume-glow-320)" filter="url(#plume-blur-320)" />
                {/* Supersonic shock expansion cone */}
                <path d="M320 38 C220 22 100 28 0 60 C100 92 220 98 320 82 Z" fill="url(#hero-plume-glow-320)" />
                {/* Incandescent inner thrust column */}
                <path d="M320 46 C230 40 130 46 25 60 C130 74 230 80 320 74 Z" fill="url(#hero-plume-core-320)" />
                {/* Hyper-dense core stream */}
                <path d="M320 52 C250 49 170 52 70 60 C170 68 250 71 320 68 Z" fill="url(#hero-plume-center-320)" />
                {/* 4 Mach Shock Diamonds */}
                <polygon points="262,60 274,53 286,60 274,67" fill="#ffffff" opacity="0.98" />
                <polygon points="204,60 218,51 232,60 218,69" fill="#e0f2fe" opacity="0.92" />
                <polygon points="146,60 162,50 178,60 162,70" fill="#bae6fd" opacity="0.85" />
                <polygon points="86,60 104,49 122,60 104,71" fill="#7dd3fc" opacity="0.75" />
                {/* Hot engine throat nozzle discharge */}
                <ellipse cx="317" cy="60" rx="5" ry="18" fill="#ffffff" />
                <ellipse cx="317" cy="60" rx="10" ry="24" fill="url(#hero-nozzle-glint-320)" />
              </svg>

              {/* Forward Retro-Braking Thruster Jets (Counter-thrust braking array) */}
              <svg ref={retroRef} className="ship-hero-retro" viewBox="0 0 130 70" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="retro-core-grad" x1="0" y1="35" x2="130" y2="35" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="25%" stopColor="#67e8f9" />
                    <stop offset="65%" stopColor="#38bdf8" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="retro-glow-grad" x1="0" y1="35" x2="130" y2="35" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.9" />
                    <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
                  </linearGradient>
                  <filter id="retro-blur" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" />
                  </filter>
                </defs>
                {/* Upper angled RCS retro jet */}
                <path d="M0 24 C35 18 80 8 125 0 C75 18 35 27 0 28 Z" fill="url(#retro-glow-grad)" filter="url(#retro-blur)" />
                <path d="M0 25 C30 20 70 12 110 5 C65 19 30 26 0 27 Z" fill="url(#retro-core-grad)" />
                {/* Lower angled RCS retro jet */}
                <path d="M0 42 C35 43 75 52 125 70 C80 52 35 48 0 46 Z" fill="url(#retro-glow-grad)" filter="url(#retro-blur)" />
                <path d="M0 43 C30 44 65 51 110 65 C70 51 30 47 0 45 Z" fill="url(#retro-core-grad)" />
                {/* Center axial counter-thrust plume */}
                <ellipse cx="45" cy="35" rx="45" ry="14" fill="url(#retro-glow-grad)" filter="url(#retro-blur)" />
                <path d="M0 31 C40 28 80 32 120 35 C80 38 40 42 0 39 Z" fill="url(#retro-core-grad)" />
                <ellipse cx="2" cy="35" rx="3" ry="8" fill="#ffffff" />
              </svg>

              {/* Atmospheric Supersonic Breakout Mach Shockwave Ring */}
              <div ref={shockwaveRef} className="ship-hero-shockwave" aria-hidden="true" />

              {/* Cosmic Hypersonic Slipstream Warp Streaks */}
              <div ref={slipstreamRef} className="ship-hero-slipstream" aria-hidden="true">
                <div className="slip-line s1" />
                <div className="slip-line s2" />
                <div className="slip-line s3" />
                <div className="slip-line s4" />
                <div className="slip-line s5" />
                <div className="slip-line s6" />
              </div>

              {/* Heavy-Duty Aerospace Tricycle Hydraulic Landing Gear */}
              <svg ref={gearRef} className="ship-hero-gear" viewBox="0 0 450 60" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="gear-strut-grad" x1="0" y1="0" x2="0" y2="60" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#94a3b8" />
                    <stop offset="40%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>
                  <linearGradient id="gear-tire-grad" x1="0" y1="36" x2="0" y2="58" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#334155" />
                    <stop offset="50%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#020617" />
                  </linearGradient>
                </defs>
                {/* Nose Landing Gear (Forward / Left) */}
                <g className="gear-assembly nose-gear">
                  <rect x="138" y="2" width="6" height="34" rx="2" fill="url(#gear-strut-grad)" stroke="#64748b" strokeWidth="1" />
                  <rect x="139.5" y="16" width="3" height="18" fill="#e2e8f0" />
                  <polyline points="138,12 133,19 138,26" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
                  <rect x="127" y="36" width="10" height="20" rx="4" fill="url(#gear-tire-grad)" stroke="#475569" strokeWidth="1" />
                  <rect x="145" y="36" width="10" height="20" rx="4" fill="url(#gear-tire-grad)" stroke="#475569" strokeWidth="1" />
                  <circle cx="132" cy="46" r="3" fill="#94a3b8" />
                  <circle cx="150" cy="46" r="3" fill="#94a3b8" />
                  <circle cx="141" cy="34" r="1.5" fill="#38bdf8" />
                </g>
                {/* Main Port Gear (Aft / Center-Right) */}
                <g className="gear-assembly main-port-gear">
                  <rect x="308" y="0" width="8" height="36" rx="2" fill="url(#gear-strut-grad)" stroke="#64748b" strokeWidth="1" />
                  <rect x="310" y="14" width="4" height="20" fill="#e2e8f0" />
                  <polyline points="308,10 302,18 308,26" stroke="#94a3b8" strokeWidth="1.8" fill="none" />
                  <rect x="296" y="36" width="12" height="22" rx="4.5" fill="url(#gear-tire-grad)" stroke="#475569" strokeWidth="1" />
                  <rect x="316" y="36" width="12" height="22" rx="4.5" fill="url(#gear-tire-grad)" stroke="#475569" strokeWidth="1" />
                  <circle cx="302" cy="47" r="3.5" fill="#94a3b8" />
                  <circle cx="322" cy="47" r="3.5" fill="#94a3b8" />
                  <circle cx="312" cy="34" r="1.5" fill="#38bdf8" />
                </g>
                {/* Main Starboard Gear (Aft / Far-Right) */}
                <g className="gear-assembly main-starboard-gear">
                  <rect x="348" y="0" width="8" height="36" rx="2" fill="url(#gear-strut-grad)" stroke="#64748b" strokeWidth="1" />
                  <rect x="350" y="14" width="4" height="20" fill="#e2e8f0" />
                  <polyline points="356,10 362,18 356,26" stroke="#94a3b8" strokeWidth="1.8" fill="none" />
                  <rect x="336" y="36" width="12" height="22" rx="4.5" fill="url(#gear-tire-grad)" stroke="#475569" strokeWidth="1" />
                  <rect x="356" y="36" width="12" height="22" rx="4.5" fill="url(#gear-tire-grad)" stroke="#475569" strokeWidth="1" />
                  <circle cx="342" cy="47" r="3.5" fill="#94a3b8" />
                  <circle cx="362" cy="47" r="3.5" fill="#94a3b8" />
                  <circle cx="352" cy="34" r="1.5" fill="#38bdf8" />
                </g>
              </svg>

              {/* Photorealistic Spacecraft Vessel from reference media */}
              <div className="ship-hero-frame">
                <img
                  src="/spacecraft-hero.png"
                  alt="Orbital Exploration Spacecraft"
                  className="ship-hero-img"
                  draggable={false}
                />
                <span className="ship-hero-nozzle-idle" aria-hidden="true" />
              </div>

              {/* Sleek Command Telemetry HUD Badge — Made directly clickable */}
              <div className="ship-hero-telemetry">
                <div
                  className="ship-telemetry-pill"
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (phase === 'gateway' && !travelling) {
                      explore()
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      e.stopPropagation()
                      if (phase === 'gateway' && !travelling) {
                        explore()
                      }
                    }
                  }}
                  aria-label="Enter the spacecraft — Travel to Vidyu World"
                >
                  <div className="ship-telemetry-status">
                    <span className="telemetry-radar-dot" />
                    <span className="telemetry-lbl">MISSION READY</span>
                  </div>
                  <div className="ship-telemetry-text">
                    <strong>Enter the spacecraft</strong>
                    <small>Travel to Vidyu World</small>
                  </div>
                  <div className="ship-telemetry-action">
                    <Icon name="arrow" />
                  </div>
                </div>
              </div>
            </button>
          </div>
          <p className="hero-note">A universe of projects, learning, and discoveries awaits.</p>
        </section>

        {arrived && !cockpitView && surfaceLocation === 'pad' && (
          <section className="arrival-content entrance" aria-labelledby="arrival-title">
            <div className="arrival-left-column">
              <div className="eyebrow arrival-eyebrow">
                <span className="purple-dot" />
                <span>01 / VIDYU WORLD · LANDING PAD 01</span>
              </div>
              <h1 id="arrival-title" className="arrival-heading" ref={arrivalHeading} tabIndex={-1}>
                <span className="world-line">A World</span>
                <em className="ideas-serif">of Ideas</em>
              </h1>
              <p className="arrival-description">Discover the story behind Vidyu, my school-management SaaS project.</p>
              <div className="arrival-actions">
                <button
                  className="glass-btn glass-btn-primary explore-surface-btn"
                  onClick={flyToCanyon}
                  disabled={transitState !== 'idle'}
                  aria-label="Introduction to Vidyu World"
                >
                  <span className="explore-compass-icon">✦</span>
                  <span>Introduction</span>
                  <Icon name="arrow" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Location 2: Ember Canyon Basin Outpost with 3D Companion Guide */}
        {arrived && !cockpitView && surfaceLocation === 'canyon' && (
          <section className="canyon-outpost-content entrance" aria-labelledby="canyon-title">
            <div className="canyon-outpost-topbar">
              <button className="return-pad-btn" onClick={flyToPad} disabled={transitState !== 'idle'}>
                <Icon name="back" />
                <span>Return to Landing Pad 01</span>
              </button>
              <div className="canyon-telemetry-badge">
                <span className="radar-beacon active" />
                <span id="canyon-title">02 / EMBER CANYON BASIN · EXPEDITION OUTPOST</span>
              </div>
              <div className="canyon-topbar-actions">
                <button
                  type="button"
                  className={`canyon-mute-pill ${emberVoiceMuted ? 'is-muted' : ''}`}
                  onClick={toggleEmberVoiceMute}
                  aria-label={emberVoiceMuted ? "Unmute Ember voice" : "Mute Ember voice"}
                  title={emberVoiceMuted ? "Unmute Ember voice" : "Mute Ember voice"}
                >
                  <span className="mute-beacon" />
                  <span className="mute-pill-icon">{emberVoiceMuted ? '🔇' : '🔊'}</span>
                  <span>{emberVoiceMuted ? 'Voice Muted' : 'Mute Voice'}</span>
                </button>
                <button className="cockpit-toggle-pill" onClick={() => setCockpitView(true)} disabled={transitState !== 'idle'}>
                  <Icon name="ship" />
                  <span>Cockpit View</span>
                </button>
              </div>
            </div>

            <div className="canyon-outpost-stage">
              <CosmicCompanion3D
                autoStart={true}
                autoStartDelay={160}
                onExploreProject={() => handleTravelDestination('projects')}
                onTravel={handleTravelDestination}
                isMuted={emberVoiceMuted}
                onToggleMute={setEmberVoiceMuted}
                activeDossier={activeDossier}
              />
            </div>
          </section>
        )}
        <FlightOverlay
          active={travelling || cockpitView}
          phase={phase}
          frame={frame}
          reducedMotion={reducedMotion}
          pinned={cockpitView}
          currentLocation={surfaceLocation}
          onExitCockpit={() => {
            setCockpitView(false)
            setSurfaceLocation('pad')
          }}
          onReturnToCanyon={() => {
            setCockpitView(false)
            setSurfaceLocation('canyon')
          }}
          onSkip={skip}
        />
      </main>

      <footer className="site-footer">
        <div className="location-indicator"><span className="status-dot" /><span>{location}</span></div>
        <span className="interaction-hint">
          {travelling
            ? 'A new perspective is just ahead.'
            : arrived
              ? (surfaceLocation === 'canyon' ? 'Ember Canyon Basin · Expedition Guide stationed.' : 'Spacecraft landed · Pad 01 runway.')
              : 'Move your cursor. Find your world.'}
        </span>
        <button className="scene-toggle" onClick={() => setStill((value) => !value)} aria-pressed={still} aria-label={still ? 'Enable live 3D scene' : 'Use lightweight still scene'}><Icon name="motion" /><span>{still ? 'Still scene' : graphics === 'lightweight' ? 'Lightweight scene' : reducedMotion ? 'Reduced motion' : 'Live universe'}</span><span className="scene-status-dot" /></button>
      </footer>

      <ResumeCVModal open={resumeCVOpen} onClose={() => setResumeCVOpen(false)} />
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      
      {/* Expedition Destination Dossier for Education, Projects, Vidyu & Achievements */}
      <DestinationDossier
        activeSection={activeDossier}
        onClose={() => setActiveDossier(null)}
        onSelectSection={(sec) => setActiveDossier(sec)}
        onFlyToPad={() => {
          setActiveDossier(null)
          flyToPad()
        }}
        onReturnHome={goHome}
      />
    </div>
  )
}
