import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { JourneyFrame, JourneyPhase } from '../navigation/useJourney'
import { frameClock } from '../animation/frameClock'

export function FlightOverlay({
  phase,
  frame,
  reducedMotion,
  active,
  pinned = false,
  onExitCockpit,
  onReturnToCanyon,
  currentLocation = 'pad',
  onSkip,
}: {
  phase: JourneyPhase
  frame: RefObject<JourneyFrame>
  reducedMotion: boolean
  active: boolean
  pinned?: boolean
  onExitCockpit?: () => void
  onReturnToCanyon?: () => void
  currentLocation?: 'pad' | 'canyon'
  onSkip?: () => void
}) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const rigRef = useRef<HTMLDivElement>(null)
  const headingTextRef = useRef<HTMLParagraphElement>(null)
  const compassTicksRef = useRef<SVGGElement>(null)
  const headingDegRef = useRef<HTMLSpanElement>(null)
  const distanceRef = useRef<HTMLSpanElement>(null)
  const etaRef = useRef<HTMLSpanElement>(null)
  const speedRef = useRef<HTMLSpanElement>(null)
  const machRef = useRef<HTMLSpanElement>(null)
  const gravityRef = useRef<HTMLSpanElement>(null)
  const hullTempRef = useRef<HTMLSpanElement>(null)
  const metRef = useRef<HTMLSpanElement>(null)
  const attitudeRef = useRef<HTMLSpanElement>(null)
  const engValueRef = useRef<HTMLSpanElement>(null)
  const engBarRef = useRef<HTMLSpanElement>(null)
  const shipBlipRef = useRef<SVGGElement>(null)
  const pitchLadderRef = useRef<SVGGElement>(null)
  const plasmaRef = useRef<SVGGElement>(null)
  const slipstreamRef = useRef<SVGGElement>(null)
  const cloudRushRef = useRef<SVGGElement>(null)

  const [selectedDest, setSelectedDest] = useState<number>(0)
  const [apActive, setApActive] = useState(true)
  const [radarGrid, setRadarGrid] = useState(true)
  const [retroArmed, setRetroArmed] = useState(true)

  useEffect(() => {
    const el = overlayRef.current
    const rig = rigRef.current
    if (!el || !rig) return

    if (!active) {
      el.style.opacity = '0'
      el.style.visibility = 'hidden'
      return
    }

    if (pinned || reducedMotion) {
      el.style.visibility = 'visible'
      el.style.opacity = '1'
      rig.style.transform = 'translate3d(0px, 0px, 0) rotate(0deg) scale(1)'
      if (plasmaRef.current) plasmaRef.current.style.opacity = '0'
      if (slipstreamRef.current) slipstreamRef.current.style.opacity = '0'
      if (cloudRushRef.current) cloudRushRef.current.style.opacity = '0'
      if (pinned && reducedMotion) return
    }

    let lastTelemetryTime = -1000
    let wasVisible = false

    const subscription = frameClock.subscribe((now) => {
      const raw = pinned ? 1.0 : frame.current.raw
      const t = phase === 'returning' ? 1 - raw : raw

      // Smoothly enter Cockpit POV after exterior rocket liftoff (t = 0.14..0.24)
      // and smoothly exit after breaking through the planetary cloud deck (t = 0.78..0.88)
      let cockpitAlpha = 1
      let cockpitScale = 1
      if (!pinned) {
        if (phase === 'returning') {
          const retIn = Math.max(0, Math.min(1, (raw - 0.12) / 0.18))
          const retOut = Math.max(0, Math.min(1, (0.86 - raw) / 0.18))
          cockpitAlpha = Math.min(retIn, retOut)
          cockpitScale = 1 + (1 - cockpitAlpha) * 0.08
        } else {
          const enterT = Math.max(0, Math.min(1, (t - 0.12) / 0.14))
          const enterEase = enterT * enterT * (3 - 2 * enterT)
          const exitT = Math.max(0, Math.min(1, (t - 0.72) / 0.16))
          const exitEase = exitT * exitT * (3 - 2 * exitT)
          cockpitAlpha = enterEase * (1 - exitEase)
          cockpitScale = 1.08 - 0.08 * enterEase + 0.06 * exitEase
        }
      }

      if (cockpitAlpha <= 0.002) {
        if (wasVisible) {
          el.style.opacity = '0'
          el.style.visibility = 'hidden'
          wasVisible = false
        }
        return
      }

      if (!wasVisible) {
        el.style.visibility = 'visible'
        wasVisible = true
      }

      // Atmospheric entry turbulence envelope (t = 0.44..0.76) as spacecraft hits dense planetary air
      const entryTurbulence = (!pinned && !reducedMotion && t > 0.44 && t < 0.76)
        ? Math.sin(((t - 0.44) / 0.32) * Math.PI)
        : 0
      const turbX = Math.sin(now * 0.055) * entryTurbulence * 3.2
      const turbY = Math.cos(now * 0.072) * entryTurbulence * 2.8

      // Gentle, physical cockpit structure sway (stable structural mass with low-frequency inertia)
      const swayX = reducedMotion ? 0 : Math.sin(now * 0.0014) * (pinned ? 0.8 : 1.4)
      const swayY = reducedMotion ? 0 : Math.cos(now * 0.0018) * (pinned ? 0.6 : 1.1)
      const roll = reducedMotion ? 0 : Math.sin(now * 0.0011) * (pinned ? 0.08 : 0.20)

      el.style.opacity = `${cockpitAlpha.toFixed(3)}`
      rig.style.transform = `translate3d(${swayX.toFixed(2)}px, ${swayY.toFixed(2)}px, 0) rotate(${roll.toFixed(3)}deg) scale(${cockpitScale.toFixed(4)})`

      // Windshield Atmospheric Entry Plasma Sheath (t = 0.42..0.72)
      if (plasmaRef.current) {
        const plasmaEnv = (!pinned && t > 0.42 && t < 0.72)
          ? Math.sin(((t - 0.42) / 0.30) * Math.PI) * (0.85 + 0.15 * Math.sin(now * 0.04))
          : 0
        plasmaRef.current.style.opacity = `${plasmaEnv.toFixed(3)}`
      }

      // Windshield Supersonic Air Slipstream & Vapor Streaks (t = 0.44..0.82)
      if (slipstreamRef.current) {
        const airEnv = (!pinned && t > 0.44 && t < 0.82)
          ? Math.sin(((t - 0.44) / 0.38) * Math.PI)
          : 0
        slipstreamRef.current.style.opacity = `${airEnv.toFixed(3)}`
        if (airEnv > 0.01 && !reducedMotion) {
          const pulseScale = 1 + ((now * 0.0032) % 0.28)
          slipstreamRef.current.style.transform = `scale3d(${pulseScale.toFixed(3)}, ${pulseScale.toFixed(3)}, 1)`
        }
      }

      // Windshield Stratospheric Cloud-Break Rush (t = 0.54..0.82)
      if (cloudRushRef.current) {
        const cloudEnv = (!pinned && t > 0.54 && t < 0.82)
          ? Math.sin(((t - 0.54) / 0.28) * Math.PI)
          : 0
        cloudRushRef.current.style.opacity = `${cloudEnv.toFixed(3)}`
        if (cloudEnv > 0.01 && !reducedMotion) {
          const cloudScale = 0.88 + ((t - 0.54) / 0.28) * 0.55
          const cloudLift = -((t - 0.54) / 0.28) * 90
          cloudRushRef.current.style.transform = `translate3d(0, ${cloudLift.toFixed(1)}px, 0) scale3d(${cloudScale.toFixed(3)}, ${cloudScale.toFixed(3)}, 1)`
        }
      }

      // Composited SVG transform updates
      const headingOffset = Math.sin(now * 0.0011) * 18 + (t - 0.5) * 28
      if (compassTicksRef.current && !reducedMotion) {
        compassTicksRef.current.style.transform = `translate3d(${headingOffset.toFixed(1)}px, 0, 0)`
      }
      if (pitchLadderRef.current && !reducedMotion) {
        const pitchY = Math.sin(now * 0.0019) * 4 - (1 - t) * 3 + turbY * 1.5
        const pitchRoll = Math.sin(now * 0.0014) * 1.5 + turbX * 0.3
        pitchLadderRef.current.style.transform = `translate3d(${turbX.toFixed(1)}px, ${pitchY.toFixed(1)}px, 0) rotate(${pitchRoll.toFixed(2)}deg)`
      }

      const flightProgress = pinned ? 1.0 : Math.max(0, Math.min(1, (t - 0.14) / 0.68))
      if (shipBlipRef.current) {
        const bx = 42 + flightProgress * 102
        const by = 132 - Math.sin(flightProgress * Math.PI * 0.65) * 44
        shipBlipRef.current.style.transform = `translate3d(${bx.toFixed(1)}px, ${by.toFixed(1)}px, 0)`
      }

      // Throttle text node updates to ~11 Hz (every 90ms) to avoid 60fps font shaping & layout
      if (now - lastTelemetryTime < 90) return
      lastTelemetryTime = now

      if (headingDegRef.current) {
        const deg = Math.round(274 - headingOffset * 0.25)
        headingDegRef.current.textContent = `${deg}° MAG`
      }

      if (distanceRef.current) {
        if (pinned) {
          distanceRef.current.textContent = '0.00 KM (PAD 01)'
        } else if (t > 0.56) {
          const altKm = Math.max(1.2, (1 - (t - 0.56) / 0.28) * 68)
          distanceRef.current.textContent = `ALT ${altKm.toFixed(1)} KM`
        } else {
          const distKm = Math.max(0.01, (1 - t / 0.56) * 1.24)
          distanceRef.current.textContent = `${distKm.toFixed(2)} M KM`
        }
      }
      if (etaRef.current) {
        if (pinned) {
          etaRef.current.textContent = '00:00:00.00'
        } else {
          const totalSec = Math.max(2, Math.round((1 - flightProgress) * 185))
          const mins = String(Math.floor(totalSec / 60)).padStart(2, '0')
          const secs = String(totalSec % 60).padStart(2, '0')
          const cs = String(Math.floor((now % 1000) / 10)).padStart(2, '0')
          etaRef.current.textContent = `00:${mins}:${secs}.${cs}`
        }
      }
      if (speedRef.current) {
        const spd = pinned
          ? 0
          : t > 0.52
            ? Math.max(420, Math.round((1 - (t - 0.52) / 0.34) * 24800))
            : Math.round(27600 + Math.sin(flightProgress * Math.PI) * 1450 + Math.sin(now * 0.009) * 95)
        speedRef.current.textContent = `${spd.toLocaleString('en-US')} KM/H`
        if (machRef.current) {
          if (pinned) {
            machRef.current.textContent = '0.00 KM/S · DOCKED'
          } else {
            const kms = (spd / 3600).toFixed(2)
            const mach = (spd / 1225).toFixed(1)
            machRef.current.textContent = `${kms} KM/S · M${mach}`
          }
        }
      }
      if (gravityRef.current) {
        const grav = pinned
          ? 0.92
          : t > 0.46 && t < 0.74
            ? 1.45 + Math.sin(((t - 0.46) / 0.28) * Math.PI) * 0.85
            : 0.48 + flightProgress * 0.44
        gravityRef.current.textContent = `${grav.toFixed(2)} G`
      }
      if (hullTempRef.current) {
        if (pinned) {
          hullTempRef.current.textContent = '312 K // COOLING'
        } else if (t > 0.44 && t < 0.72) {
          const entryHeat = Math.round(340 + Math.sin(((t - 0.44) / 0.28) * Math.PI) * 1520)
          hullTempRef.current.textContent = `${entryHeat} K // PLASMA`
        } else {
          const temp = Math.round(298 + flightProgress * 95 + Math.sin(now * 0.007) * 3)
          hullTempRef.current.textContent = `${temp} K // NOM`
        }
      }
      if (metRef.current) {
        const metSec = Math.floor(now / 1000) % 3600
        const mm = String(Math.floor(metSec / 60)).padStart(2, '0')
        const ss = String(metSec % 60).padStart(2, '0')
        const ms = String(Math.floor((now % 1000) / 10)).padStart(2, '0')
        metRef.current.textContent = `MET 04:${mm}:${ss}.${ms}`
      }
      if (attitudeRef.current) {
        const pDeg = pinned ? '0.0' : (-1.4 + Math.sin(now * 0.0016) * 0.8 - entryTurbulence * 3.2).toFixed(1)
        const rDeg = pinned ? '0.0' : (Math.cos(now * 0.0013) * 0.9).toFixed(1)
        attitudeRef.current.textContent = `P ${pDeg}° · R ${rDeg}° · Y +0.0°`
      }

      const engPct = pinned ? 8 : Math.round(64 + Math.sin(flightProgress * Math.PI) * 24)
      if (engValueRef.current) {
        engValueRef.current.textContent = `${engPct}%`
      }
      if (engBarRef.current) {
        engBarRef.current.style.width = `${engPct}%`
      }
      if (headingTextRef.current) {
        const label = phase === 'returning'
          ? 'RETURNING TO NEBULA GATEWAY'
          : pinned
            ? (currentLocation === 'canyon'
                ? 'STATIONED AT EMBER CANYON BASIN · OUTPOST'
                : 'DOCKED AT PAD 01 · VIDYU SURFACE')
            : t > 0.64
              ? 'CLOUD DECK DESCENT · PAD 01 VISUAL'
              : t > 0.44
                ? 'ATMOSPHERIC ENTRY · PLASMA SHEATH'
                : 'APPROACHING VIDYU PRIME'
        if (headingTextRef.current.textContent !== label) {
          headingTextRef.current.textContent = label
        }
      }
    }, false, 2)

    return subscription.dispose
  }, [active, frame, phase, pinned, reducedMotion])

  const destinations = [
    { name: 'VIDYU PRIME', tag: 'LOCKED' },
    { name: 'RINGS', tag: '4-BAND' },
    { name: 'MOONS', tag: '146 TRK' },
    { name: 'SURFACE SCAN', tag: 'PAD 01' },
  ]

  return (
    <div
      ref={overlayRef}
      className={`cockpit-pov-overlay ${reducedMotion ? 'gentle-transition' : ''} ${pinned ? 'is-pinned' : ''}`}
      style={{ opacity: 0, visibility: 'hidden' }}
      aria-hidden={pinned ? undefined : 'true'}
    >
      <div ref={rigRef} className="cockpit-rig">
        {/* Canopy Glass Optical Glare, Sun Flare & Vignette Layer */}
        <div className="cockpit-glass-optics" />

        {/* Windshield Atmospheric Re-Entry Plasma, Supersonic Air Slipstream & Cloud-Break Effects */}
        <svg className="cockpit-entry-fx-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <radialGradient id="windshield-plasma-glow" cx="50%" cy="38%" r="58%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
              <stop offset="56%" stopColor="#f59e0b" stopOpacity="0.12" />
              <stop offset="78%" stopColor="#f97316" stopOpacity="0.48" />
              <stop offset="92%" stopColor="#ec4899" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.82" />
            </radialGradient>
            <linearGradient id="slipstream-streak" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="45%" stopColor="#bae6fd" stopOpacity="0.78" />
              <stop offset="85%" stopColor="#fde68a" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="cloud-rush-puff" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fde68a" stopOpacity="0.65" />
              <stop offset="42%" stopColor="#c084fc" stopOpacity="0.42" />
              <stop offset="75%" stopColor="#4c1d95" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#090d1a" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Thermal Plasma Re-Entry Corona along Canopy Perimeter */}
          <g ref={plasmaRef} style={{ opacity: 0 }}>
            <rect x="40" y="45" width="1520" height="620" fill="url(#windshield-plasma-glow)" />
            <path
              d="M132 92 L436 56 L1164 56 L1468 92 L1534 196 L1544 530 L1456 650 M132 92 L66 196 L56 530 L144 650"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="8"
              strokeOpacity="0.65"
            />
          </g>

          {/* Radial Supersonic Air Slipstream & Mach Vapor Condensation Streaks */}
          <g ref={slipstreamRef} className="windshield-slipstream-group" style={{ opacity: 0 }}>
            {[
              [800, 340, 120, 80], [800, 340, 290, 55], [800, 340, 520, 48], [800, 340, 1080, 48],
              [800, 340, 1310, 55], [800, 340, 1480, 80], [800, 340, 75, 220], [800, 340, 1525, 220],
              [800, 340, 62, 380], [800, 340, 1538, 380], [800, 340, 95, 540], [800, 340, 1505, 540],
              [800, 340, 260, 625], [800, 340, 1340, 625], [800, 340, 460, 610], [800, 340, 1140, 610],
            ].map(([x1, y1, x2, y2], idx) => {
              const mx = x1 + (x2 - x1) * 0.36
              const my = y1 + (y2 - y1) * 0.36
              return (
                <g key={idx}>
                  <line
                    x1={mx}
                    y1={my}
                    x2={x2}
                    y2={y2}
                    stroke={idx % 2 === 0 ? '#bae6fd' : '#fde68a'}
                    strokeWidth={idx % 3 === 0 ? '2.4' : '1.4'}
                    strokeOpacity="0.78"
                    strokeDasharray="90 50"
                    strokeLinecap="round"
                  />
                </g>
              )
            })}
            {/* Supersonic Mach Vapor Shock Ring */}
            <ellipse cx="800" cy="340" rx="460" ry="230" fill="none" stroke="#bae6fd" strokeWidth="1.8" strokeOpacity="0.38" strokeDasharray="24 18" />
            <ellipse cx="800" cy="340" rx="620" ry="300" fill="none" stroke="#fde68a" strokeWidth="1.4" strokeOpacity="0.32" strokeDasharray="40 28" />
          </g>

          {/* Stratospheric Cloud-Break Banks Rushing Past Windshield */}
          <g ref={cloudRushRef} className="windshield-cloud-group" style={{ opacity: 0 }}>
            <ellipse cx="340" cy="240" rx="420" ry="150" fill="url(#cloud-rush-puff)" />
            <ellipse cx="1260" cy="230" rx="440" ry="160" fill="url(#cloud-rush-puff)" />
            <ellipse cx="800" cy="160" rx="560" ry="140" fill="url(#cloud-rush-puff)" />
            <ellipse cx="480" cy="490" rx="480" ry="145" fill="url(#cloud-rush-puff)" />
            <ellipse cx="1140" cy="480" rx="490" ry="150" fill="url(#cloud-rush-puff)" />
          </g>
        </svg>

        {/* 3D Machined Aerospace Spacecraft Canopy, Struts, Hydraulic Ribs & Glare-Shield */}
        <svg className="cockpit-frame-svg" viewBox="0 0 1600 900" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="hull-armor-outer" x1="800" y1="0" x2="800" y2="900" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#04050a" />
              <stop offset="12%" stopColor="#0d101c" />
              <stop offset="50%" stopColor="#090b14" />
              <stop offset="82%" stopColor="#0e1220" />
              <stop offset="100%" stopColor="#040509" />
            </linearGradient>
            <linearGradient id="pillar-bevel-left" x1="0" y1="360" x2="175" y2="360" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#04050a" />
              <stop offset="48%" stopColor="#101320" />
              <stop offset="76%" stopColor="#1d2236" />
              <stop offset="91%" stopColor="#3a2e3b" />
              <stop offset="97%" stopColor="#d99b52" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#171929" />
            </linearGradient>
            <linearGradient id="pillar-bevel-right" x1="1600" y1="360" x2="1425" y2="360" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#04050a" />
              <stop offset="48%" stopColor="#101320" />
              <stop offset="76%" stopColor="#22253a" />
              <stop offset="90%" stopColor="#4a383d" />
              <stop offset="97%" stopColor="#f5c986" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#171929" />
            </linearGradient>
            <linearGradient id="coaming-glare-shield" x1="800" y1="565" x2="800" y2="675" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2a3048" />
              <stop offset="18%" stopColor="#181c2e" />
              <stop offset="65%" stopColor="#0c0e18" />
              <stop offset="100%" stopColor="#060810" />
            </linearGradient>
            <linearGradient id="console-deck-metal" x1="800" y1="645" x2="800" y2="900" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1c2033" />
              <stop offset="10%" stopColor="#101320" />
              <stop offset="55%" stopColor="#080a12" />
              <stop offset="100%" stopColor="#030408" />
            </linearGradient>
            <radialGradient id="cockpit-amber-lamp" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="28%" stopColor="#fbbf24" stopOpacity="0.95" />
              <stop offset="62%" stopColor="#d97706" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="sun-window-bloom" cx="98%" cy="46%" r="34%">
              <stop offset="0%" stopColor="#fff7ed" stopOpacity="0.65" />
              <stop offset="18%" stopColor="#fbbf24" stopOpacity="0.28" />
              <stop offset="52%" stopColor="#d97706" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Warm sunlit bloom on the right edge of the windshield */}
          <rect x="960" y="60" width="640" height="600" fill="url(#sun-window-bloom)" />

          {/* Primary Armored Canopy Cutout Mask */}
          <path
            d="M0 0 H1600 V900 H0 Z M132 92 L66 196 L56 530 L144 650 L506 644 L598 592 L1002 592 L1094 644 L1456 650 L1544 530 L1534 196 L1468 92 L1164 56 L436 56 Z"
            fill="url(#hull-armor-outer)"
            fillRule="evenodd"
          />

          {/* 3D Left & Right Structural Canopy Pillars with Mechanical Channels & Bolts */}
          <path d="M0 0 L178 0 L132 92 L66 196 L56 530 L144 650 L0 695 Z" fill="url(#pillar-bevel-left)" />
          <path d="M1600 0 L1422 0 L1468 92 L1534 196 L1544 530 L1456 650 L1600 695 Z" fill="url(#pillar-bevel-right)" />

          {/* Recessed structural pockets & hydraulic conduits on Left & Right Pillars */}
          <path d="M18 115 L104 115 L52 204 L44 516 L112 618 L18 640 Z" fill="#090b13" stroke="#262c44" strokeWidth="1.2" />
          <path d="M1582 115 L1496 115 L1548 204 L1556 516 L1488 618 L1582 640 Z" fill="#090b13" stroke="#2c3048" strokeWidth="1.2" />
          {/* Pillar hydraulic pistons & rivets */}
          <line x1="34" y1="215" x2="26" y2="508" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
          <line x1="34" y1="215" x2="26" y2="508" stroke="#64748b" strokeWidth="1.5" strokeDasharray="10 14" />
          <line x1="1566" y1="215" x2="1574" y2="508" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
          <line x1="1566" y1="215" x2="1574" y2="508" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="10 14" />
          {[140, 175, 240, 310, 380, 450, 515, 575].map((y, idx) => (
            <g key={idx} fill="#475569">
              <circle cx={idx < 2 ? 96 - idx * 18 : 50} cy={y} r="2.3" />
              <circle cx={idx < 2 ? 1504 + idx * 18 : 1550} cy={y} r="2.3" />
            </g>
          ))}

          {/* Sunlit Inner Window Bevel Rim */}
          <path d="M132 92 L66 196 L56 530 L144 650" stroke="#e2a65f" strokeWidth="2.5" strokeOpacity="0.7" fill="none" />
          <path d="M1468 92 L1534 196 L1544 530 L1456 650" stroke="#fde68a" strokeWidth="2.8" strokeOpacity="0.82" fill="none" />
          <path d="M132 92 L436 56 L1164 56 L1468 92" stroke="#64748b" strokeWidth="2" strokeOpacity="0.6" fill="none" />

          {/* Upper Canopy Structural Housings & Dual Warm Amber Cockpit Dome Lights */}
          <path d="M440 0 L476 58 L572 58 L552 0 Z" fill="#151929" stroke="#3b4262" strokeWidth="1.4" />
          <path d="M1160 0 L1124 58 L1028 58 L1048 0 Z" fill="#151929" stroke="#3b4262" strokeWidth="1.4" />
          <ellipse cx="520" cy="29" rx="44" ry="22" fill="url(#cockpit-amber-lamp)" />
          <rect x="502" y="16" width="36" height="14" rx="3" fill="#1e1b18" stroke="#78716c" strokeWidth="1.2" />
          <rect x="506" y="19" width="28" height="8" rx="2" fill="#fef3c7" />
          <ellipse cx="1080" cy="29" rx="44" ry="22" fill="url(#cockpit-amber-lamp)" />
          <rect x="1062" y="16" width="36" height="14" rx="3" fill="#1e1b18" stroke="#78716c" strokeWidth="1.2" />
          <rect x="1066" y="19" width="28" height="8" rx="2" fill="#fef3c7" />

          {/* Overhead Center Breaker & Switch Housing between Dome Lights */}
          <path d="M578 0 L592 48 L1008 48 L1022 0 Z" fill="#0d101d" stroke="#2e3652" strokeWidth="1.2" />

          {/* Lower Armored Dashboard Coaming, Glare-Shield & MFD Console Deck */}
          <path
            d="M0 648 L144 648 L506 642 L598 590 L1002 590 L1094 642 L1456 648 L1600 648 L1600 900 L0 900 Z"
            fill="url(#console-deck-metal)"
            stroke="#333c59"
            strokeWidth="1.5"
          />
          <path
            d="M506 642 L598 590 L1002 590 L1094 642 L1040 660 L560 660 Z"
            fill="url(#coaming-glare-shield)"
            stroke="#475569"
            strokeWidth="1.3"
          />
          <path d="M624 590 L652 572 L948 572 L976 590 Z" fill="#151928" stroke="#475569" strokeWidth="1.2" />
          {/* Center Coaming Master Caution Amber Lamp */}
          <ellipse cx="800" cy="624" rx="58" ry="22" fill="url(#cockpit-amber-lamp)" opacity="0.9" />
          <rect x="768" y="613" width="64" height="20" rx="3" fill="#1c1917" stroke="#f59e0b" strokeWidth="1.2" />
          <rect x="773" y="616" width="54" height="5.5" rx="1.5" fill="#fef3c7" />
          <rect x="773" y="624.5" width="54" height="5.5" rx="1.5" fill="#fbbf24" />

          {/* Recessed MFD Bay Dividers & Lower Amber Console Illumination Lamps */}
          <path d="M510 662 L494 892 M1036 662 L1052 892 M1324 662 L1342 892" stroke="#222940" strokeWidth="4" />
          <ellipse cx="520" cy="880" rx="36" ry="16" fill="url(#cockpit-amber-lamp)" />
          <rect x="506" y="872" width="28" height="10" rx="2" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
          <ellipse cx="638" cy="880" rx="34" ry="15" fill="url(#cockpit-amber-lamp)" />
          <rect x="625" y="872" width="26" height="10" rx="2" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
          <ellipse cx="1028" cy="880" rx="36" ry="16" fill="url(#cockpit-amber-lamp)" />
          <rect x="1014" y="872" width="28" height="10" rx="2" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
        </svg>

        {/* Overhead Cockpit Breaker & Switch Panel (Interstellar Ranger Style) */}
        <div className="cockpit-overhead-panel">
          <div className="overhead-switch-bank">
            <span className="bank-label">PWR BUS</span>
            <span className="toggle-switch is-on"><i></i>BUS A</span>
            <span className="toggle-switch is-on"><i></i>BUS B</span>
            <span className="toggle-switch is-on"><i></i>REACTOR</span>
            <span className="toggle-switch is-amber"><i></i>AUX</span>
          </div>
          <div className="overhead-digital-strip">
            <span>CABIN <strong>101.3 kPa</strong></span>
            <span className="sep">|</span>
            <span>O2 <strong>21.0%</strong></span>
            <span className="sep">|</span>
            <span>RCS <strong>2,840 PSI</strong></span>
          </div>
          <div className="overhead-switch-bank">
            <span className="bank-label">AVIONICS</span>
            <span className="toggle-switch is-on"><i></i>INS/GPS</span>
            <span className="toggle-switch is-on"><i></i>LIDAR</span>
            <span className="toggle-switch is-amber"><i></i>SHIELD</span>
            <span className="toggle-switch is-on"><i></i>COMMS</span>
          </div>
        </div>

        {/* Center Windshield Pitch Ladder & Flight Path Vector Reticle */}
        <div className="cockpit-center-reticle" aria-hidden="true">
          <svg viewBox="0 0 420 260" className="reticle-svg" fill="none">
            <g ref={pitchLadderRef} className="reticle-pitch-group" opacity="0.46">
              <path d="M135 75 H175 V83 M285 75 H245 V83" stroke="#7dd3fc" strokeWidth="1.2" />
              <text x="115" y="79" fill="#7dd3fc" fontSize="8" fontFamily="monospace">+05</text>
              <text x="292" y="79" fill="#7dd3fc" fontSize="8" fontFamily="monospace">+05</text>
              <path d="M105 130 H168 M252 130 H315" stroke="#bae6fd" strokeWidth="1.4" />
              <path d="M135 185 H175 V177 M285 185 H245 V177" stroke="#7dd3fc" strokeWidth="1.2" strokeDasharray="5 3" />
              <text x="115" y="189" fill="#7dd3fc" fontSize="8" fontFamily="monospace">-05</text>
              <text x="292" y="189" fill="#7dd3fc" fontSize="8" fontFamily="monospace">-05</text>
            </g>
            <circle cx="210" cy="130" r="6" stroke="#fef08a" strokeWidth="1.3" strokeOpacity="0.75" />
            <path d="M196 130 H204 M216 130 H224 M210 118 V124" stroke="#fef08a" strokeWidth="1.3" strokeOpacity="0.75" />
            <path d="M68 38 H52 V56 M352 38 H368 V56 M68 222 H52 V204 M352 222 H368 V204" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.38" />
          </svg>
        </div>

        {/* Windshield Holographic Heads-Up Display (Top Left, Center Compass, Top Right) */}
        <div className="cockpit-windshield-hud">
          {/* Top-Left Destination Selector & Nav Computer HUD */}
          <div className="hud-left-panel">
            <div className="hud-brand-row">
              <svg className="hud-planet-icon" viewBox="0 0 28 20" fill="none">
                <circle cx="14" cy="10" r="5.2" fill="#cbd5e1" />
                <ellipse cx="14" cy="10" rx="12" ry="3.8" transform="rotate(-18 14 10)" stroke="#e2e8f0" strokeWidth="1.5" />
              </svg>
              <span>RAJU COSMIC WORLDS</span>
            </div>
            <div className="hud-destination-box">
              <div className="hud-destination-header">
                <span>DESTINATION // NAV-01</span>
                <i className="hud-caret" />
              </div>
              <ul className="hud-destination-list">
                {destinations.map((item, idx) => (
                  <li
                    key={item.name}
                    className={selectedDest === idx ? 'is-active' : ''}
                    onClick={() => setSelectedDest(idx)}
                  >
                    <span className={`hud-dot ${selectedDest === idx ? 'active' : ''}`} />
                    <span className="dest-name">{item.name}</span>
                    <small className="dest-tag">{item.tag}</small>
                  </li>
                ))}
              </ul>
              <div className="hud-nav-coords">
                <span>RA 14h 29m 42s</span>
                <span>DEC -62° 40&apos;</span>
              </div>
            </div>
          </div>

          {/* Top-Center Compass Tape & Approaching Banner */}
          <div className="hud-center-compass">
            <div className="compass-deg-pill">
              <span ref={headingDegRef}>274° MAG</span>
            </div>
            <div className="compass-tape-window">
              <svg className="compass-svg" viewBox="0 0 460 32" fill="none">
                <polygon points="230,2 225,11 235,11" fill="#f8fafc" />
                <line x1="20" y1="24" x2="440" y2="24" stroke="#94a3b8" strokeOpacity="0.45" strokeWidth="1" />
                <g ref={compassTicksRef} className="compass-ticks-group">
                  {Array.from({ length: 41 }, (_, i) => {
                    const x = 30 + i * 10
                    const major = i % 5 === 0
                    return (
                      <line
                        key={i}
                        x1={x}
                        y1={major ? 12 : 17}
                        x2={x}
                        y2={24}
                        stroke={major ? '#e2e8f0' : '#94a3b8'}
                        strokeOpacity={major ? 0.88 : 0.45}
                        strokeWidth={major ? 1.5 : 1}
                      />
                    )
                  })}
                </g>
              </svg>
            </div>
            <p ref={headingTextRef} className="compass-heading-title">APPROACHING VIDYU PRIME</p>
          </div>

          {/* Top-Right High-Density Flight Telemetry Readout Box */}
          <div className="hud-right-telemetry">
            <div className="telemetry-box-header">
              <span>FLIGHT COMPUTER // TELEMETRY</span>
              <i className="telemetry-live-dot" />
            </div>
            <div className="telemetry-row">
              <span>DISTANCE</span>
              <strong ref={distanceRef}>1.20 M KM</strong>
            </div>
            <div className="telemetry-row">
              <span>ETA</span>
              <strong ref={etaRef}>00:12:36.00</strong>
            </div>
            <div className="telemetry-row">
              <span>SPEED</span>
              <strong ref={speedRef}>28,400 KM/H</strong>
            </div>
            <div className="telemetry-subrow">
              <span>VEL VECTOR</span>
              <em ref={machRef}>7.89 KM/S · M23.1</em>
            </div>
            <div className="telemetry-row">
              <span>GRAVITY</span>
              <strong ref={gravityRef}>0.92 G</strong>
            </div>
            <div className="telemetry-row">
              <span>HULL TEMP</span>
              <strong ref={hullTempRef} className="text-amber">314 K // NOM</strong>
            </div>
          </div>
        </div>

        {/* Center Glare-Shield Master Mode Control Panel (MCP) & Annunciator Pushbutton Matrix */}
        <div className="cockpit-glare-mcp">
          <div className="mcp-annunciator-bank">
            <button
              type="button"
              className={`mcp-btn ${apActive ? 'is-cyan' : ''}`}
              onClick={() => setApActive((v) => !v)}
            >
              <span>AP LOCK</span>
              <small>{apActive ? 'ENGAGED' : 'MANUAL'}</small>
            </button>
            <button
              type="button"
              className={`mcp-btn ${radarGrid ? 'is-green' : ''}`}
              onClick={() => setRadarGrid((v) => !v)}
            >
              <span>ORB RADAR</span>
              <small>{radarGrid ? 'ACTIVE' : 'STBY'}</small>
            </button>
            <button
              type="button"
              className={`mcp-btn ${retroArmed ? 'is-amber' : ''}`}
              onClick={() => setRetroArmed((v) => !v)}
            >
              <span>RETRO THR</span>
              <small>{retroArmed ? 'ARMED' : 'SAFE'}</small>
            </button>
            <div className="mcp-btn is-green">
              <span>ATMOS SHLD</span>
              <small>100% NOM</small>
            </div>
          </div>

          <div className="mcp-center-readout">
            <span ref={metRef} className="mcp-met">MET 04:12:38.40</span>
            <span ref={attitudeRef} className="mcp-attitude">P -1.2° · R +0.4° · Y +0.0°</span>
          </div>

          <div className="mcp-annunciator-bank">
            <div className="mcp-btn is-cyan">
              <span>LNAV / VNAV</span>
              <small>COUPLED</small>
            </div>
            <div className="mcp-btn is-green">
              <span>PAD 01 ILS</span>
              <small>CAPTURED</small>
            </div>
            <div className="mcp-btn is-amber">
              <span>MSTR CAUT</span>
              <small>CLEAR</small>
            </div>
            <div className="mcp-rotary-group">
              <span className="rotary-knob" title="Heading Select"><i></i>HDG</span>
              <span className="rotary-knob" title="Altitude Select"><i></i>ALT</span>
            </div>
          </div>
        </div>

        {/* Bottom 3D Armored Instrument Console with 4 Bezel-Mounted Multi-Function Displays */}
        <div className="cockpit-dashboard">
          {/* MFD 1 (Left): VIDYU PRIME Planetary Spec & Spectroscopy Screen */}
          <div className="mfd-unit mfd-unit-left">
            <div className="mfd-bezel-top">
              <span className="osb-btn active">SCAN</span>
              <span className="osb-btn">ATMOS</span>
              <span className="osb-btn">GEO</span>
              <span className="osb-btn">BIO</span>
            </div>
            <div className="mfd-screen mfd-planet-card">
              <div className="mfd-planet-visual">
                <svg viewBox="0 0 120 120" className="mfd-planet-svg">
                  <defs>
                    <radialGradient id="mfd-gas-giant" cx="32%" cy="28%" r="68%">
                      <stop offset="0%" stopColor="#fde68a" />
                      <stop offset="26%" stopColor="#d99b66" />
                      <stop offset="52%" stopColor="#8c583a" />
                      <stop offset="78%" stopColor="#3b2318" />
                      <stop offset="100%" stopColor="#09070e" />
                    </radialGradient>
                    <clipPath id="mfd-sphere-clip">
                      <circle cx="60" cy="60" r="44" />
                    </clipPath>
                  </defs>
                  <circle cx="60" cy="60" r="44" fill="url(#mfd-gas-giant)" />
                  <g clipPath="url(#mfd-sphere-clip)" opacity="0.58">
                    <ellipse cx="56" cy="36" rx="52" ry="8" transform="rotate(-14 60 60)" fill="#f5c986" opacity="0.45" />
                    <ellipse cx="58" cy="50" rx="54" ry="6" transform="rotate(-14 60 60)" fill="#5c3422" opacity="0.65" />
                    <ellipse cx="60" cy="64" rx="54" ry="9" transform="rotate(-14 60 60)" fill="#e2a86f" opacity="0.4" />
                    <ellipse cx="62" cy="79" rx="52" ry="7" transform="rotate(-14 60 60)" fill="#2d1810" opacity="0.7" />
                    <ellipse cx="60" cy="60" rx="22" ry="44" stroke="#38bdf8" strokeOpacity="0.35" strokeWidth="0.9" strokeDasharray="3 3" fill="none" />
                    <line x1="16" y1="60" x2="104" y2="60" stroke="#38bdf8" strokeOpacity="0.35" strokeWidth="0.9" strokeDasharray="3 3" />
                  </g>
                  <circle cx="60" cy="60" r="44.5" fill="none" stroke="#7dd3fc" strokeOpacity="0.5" strokeWidth="1.2" />
                  <path d="M12 24 V12 H24 M96 12 H108 V24 M12 96 V108 H24 M96 108 H108 V96" stroke="#38bdf8" strokeOpacity="0.6" strokeWidth="1.2" fill="none" />
                </svg>
              </div>
              <div className="mfd-planet-specs">
                <div className="mfd-title-row">
                  <span className="mfd-title">VIDYU PRIME</span>
                  <small className="mfd-code">SYS-01</small>
                </div>
                <div className="mfd-divider" />
                <dl className="mfd-spec-list">
                  <div><dt>CLASS</dt><dd>GAS GIANT</dd></div>
                  <div><dt>RADIUS</dt><dd>58,232 KM</dd></div>
                  <div><dt>MOONS</dt><dd>146</dd></div>
                  <div><dt>RING SYSTEM</dt><dd>YES // 4-BAND</dd></div>
                  <div><dt>ATMOS COMP</dt><dd>H2 84% · HE 14%</dd></div>
                </dl>
              </div>
            </div>
            <div className="mfd-bezel-bottom">
              <span className="osb-btn">F1</span>
              <span className="osb-btn">F2</span>
              <span className="osb-btn">LOCK</span>
              <span className="osb-btn">DATA</span>
            </div>
          </div>

          {/* MFD 2 (Center): 3D Orbital Radar, Trajectory Vector & LiDAR Hologram */}
          <div className="mfd-unit mfd-unit-center">
            <div className="mfd-bezel-top">
              <span className="osb-btn active">ORBIT</span>
              <span className="osb-btn">TRAJ</span>
              <span className="osb-btn">RINGS</span>
              <span className="osb-btn">APPROACH</span>
              <span className="osb-btn">PAD-01</span>
            </div>
            <div className="mfd-screen mfd-orbital-radar">
              <div className="mfd-corner-meta top-left">RADAR // 3D-LIDAR</div>
              <div className="mfd-corner-meta top-right">RNG 250,000 KM</div>
              <div className="mfd-corner-meta bottom-left">INC 22.48° · ECC 0.014</div>
              <div className="mfd-corner-meta bottom-right">VECTOR LOCKED</div>
              <svg viewBox="0 0 380 170" className="mfd-radar-svg">
                <defs>
                  <radialGradient id="radar-planet-core" cx="35%" cy="30%" r="65%">
                    <stop offset="0%" stopColor="#fde68a" />
                    <stop offset="40%" stopColor="#9a7b6e" />
                    <stop offset="78%" stopColor="#262038" />
                    <stop offset="100%" stopColor="#080710" />
                  </radialGradient>
                </defs>
                {radarGrid && (
                  <g>
                    <line x1="12" y1="85" x2="368" y2="85" stroke="#38bdf8" strokeOpacity="0.26" strokeWidth="1" />
                    <line x1="190" y1="8" x2="190" y2="162" stroke="#38bdf8" strokeOpacity="0.26" strokeWidth="1" />
                    <line x1="65" y1="22" x2="315" y2="148" stroke="#38bdf8" strokeOpacity="0.14" strokeWidth="0.8" />
                    <line x1="65" y1="148" x2="315" y2="22" stroke="#38bdf8" strokeOpacity="0.14" strokeWidth="0.8" />
                  </g>
                )}
                <ellipse cx="190" cy="85" rx="156" ry="68" stroke="#38bdf8" strokeOpacity="0.52" strokeWidth="1.2" fill="none" />
                <ellipse cx="190" cy="85" rx="122" ry="53" stroke="#38bdf8" strokeOpacity="0.36" strokeWidth="1" strokeDasharray="5 4" fill="none" />
                <ellipse cx="190" cy="85" rx="88" ry="38" stroke="#38bdf8" strokeOpacity="0.26" strokeWidth="0.9" fill="none" />
                <circle cx="190" cy="85" r="66" stroke="#7dd3fc" strokeOpacity="0.3" strokeWidth="1" fill="none" />
                <circle cx="190" cy="85" r="46" stroke="#7dd3fc" strokeOpacity="0.22" strokeWidth="0.9" strokeDasharray="3 3" fill="none" />

                <path
                  d="M36 134 Q 96 72, 166 82"
                  stroke="#fbbf24"
                  strokeWidth="1.6"
                  strokeDasharray="4 3"
                  fill="none"
                />
                <g ref={shipBlipRef} className="radar-ship-blip">
                  <circle r="4.5" fill="#fbbf24" fillOpacity="0.28" />
                  <circle r="2.2" fill="#fef08a" />
                </g>

                <circle cx="68" cy="85" r="2.8" fill="#bae6fd" />
                <text x="74" y="82" fill="#7dd3fc" fontSize="6.5" fontFamily="monospace">M-01</text>
                <circle cx="312" cy="85" r="2.8" fill="#bae6fd" />
                <text x="288" y="82" fill="#7dd3fc" fontSize="6.5" fontFamily="monospace">M-02</text>
                <circle cx="122" cy="46" r="2.2" fill="#7dd3fc" />
                <circle cx="268" cy="120" r="2.2" fill="#7dd3fc" />

                <ellipse cx="190" cy="85" rx="70" ry="18.5" transform="rotate(-18 190 85)" stroke="#cbd5e1" strokeOpacity="0.7" strokeWidth="3.6" fill="none" />
                <ellipse cx="190" cy="85" rx="54" ry="14" transform="rotate(-18 190 85)" stroke="#7dd3fc" strokeOpacity="0.55" strokeWidth="1.5" fill="none" />
                <circle cx="190" cy="85" r="24" fill="url(#radar-planet-core)" stroke="#7dd3fc" strokeOpacity="0.6" strokeWidth="1.1" />
              </svg>
            </div>
            <div className="mfd-bezel-bottom">
              <span className="osb-btn">RNG+</span>
              <span className="osb-btn">RNG-</span>
              <span className="osb-btn active">3D MAP</span>
              <span className="osb-btn">VECT</span>
              <span className="osb-btn">SYNC</span>
            </div>
          </div>

          {/* MFD 3 (Right-Center): ORBITAL VIEW Optical & IR Sensor Feed */}
          <div className="mfd-unit mfd-unit-right-center">
            <div className="mfd-bezel-top">
              <span className="osb-btn active">CAM-02</span>
              <span className="osb-btn">IR/OPT</span>
              <span className="osb-btn">TRK</span>
              <span className="osb-btn">ZOOM</span>
            </div>
            <div className="mfd-screen mfd-orbital-view">
              <div className="mfd-orbital-header">
                <span>OPT // 420MM · F/2.8</span>
                <strong>ORBITAL VIEW</strong>
              </div>
              <svg viewBox="0 0 280 140" className="mfd-orbital-svg" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <linearGradient id="orbital-ring-band" x1="0" y1="0" x2="280" y2="140" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.18" />
                    <stop offset="45%" stopColor="#f1f5f9" stopOpacity="0.78" />
                    <stop offset="78%" stopColor="#eab368" stopOpacity="0.62" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.25" />
                  </linearGradient>
                  <radialGradient id="orbital-limb-grad" cx="35%" cy="40%" r="70%">
                    <stop offset="0%" stopColor="#d99b66" />
                    <stop offset="55%" stopColor="#5c3a28" />
                    <stop offset="100%" stopColor="#120d18" />
                  </radialGradient>
                </defs>
                <circle cx="255" cy="48" r="58" fill="url(#orbital-limb-grad)" stroke="#f5c986" strokeOpacity="0.6" strokeWidth="1.2" />
                <ellipse cx="260" cy="48" rx="220" ry="78" transform="rotate(14 260 48)" stroke="url(#orbital-ring-band)" strokeWidth="15" fill="none" />
                <ellipse cx="260" cy="48" rx="196" ry="68" transform="rotate(14 260 48)" stroke="#0f172a" strokeWidth="3.5" fill="none" />
                <ellipse cx="260" cy="48" rx="184" ry="63" transform="rotate(14 260 48)" stroke="#7dd3fc" strokeOpacity="0.48" strokeWidth="4" fill="none" />
                <ellipse cx="260" cy="48" rx="154" ry="52" transform="rotate(14 260 48)" stroke="#cbd5e1" strokeOpacity="0.4" strokeWidth="7" fill="none" />
                <circle cx="42" cy="108" r="7.5" fill="#64748b" />
                <rect x="31" y="97" width="22" height="22" stroke="#38bdf8" strokeOpacity="0.65" strokeWidth="0.9" fill="none" />
                <text x="31" y="94" fill="#7dd3fc" fontSize="6" fontFamily="monospace">AST-14</text>
                <circle cx="68" cy="118" r="5.5" fill="#94a3b8" />
                <circle cx="24" cy="90" r="4.5" fill="#475569" />
                <circle cx="92" cy="124" r="4.2" fill="#64748b" />
                <circle cx="54" cy="94" r="3.4" fill="#cbd5e1" />
                <path d="M132 70 H148 M140 62 V78" stroke="#38bdf8" strokeOpacity="0.45" strokeWidth="0.9" />
              </svg>
              <div className="mfd-orbital-footer">
                <span>GAIN +4.2dB</span>
                <span>RING DENSITY: HIGH</span>
              </div>
            </div>
            <div className="mfd-bezel-bottom">
              <span className="osb-btn">WIDE</span>
              <span className="osb-btn active">TELE</span>
              <span className="osb-btn">IR</span>
              <span className="osb-btn">REC</span>
            </div>
          </div>

          {/* MFD 4 (Far Right): Propulsion, Shield, Engine & Reactor Diagnostics */}
          <div className="mfd-unit mfd-unit-right">
            <div className="mfd-bezel-top">
              <span className="osb-btn active">SYS</span>
              <span className="osb-btn">PROP</span>
              <span className="osb-btn">PWR</span>
            </div>
            <div className="mfd-screen mfd-systems-panel">
              <div className="sys-gauge">
                <div className="sys-gauge-labels">
                  <span>FUEL // LH2</span>
                  <strong>78%</strong>
                </div>
                <div className="sys-gauge-track">
                  <span className="sys-gauge-fill" style={{ width: '78%' }} />
                </div>
              </div>
              <div className="sys-gauge">
                <div className="sys-gauge-labels">
                  <span>SHIELD // MAG</span>
                  <strong>100%</strong>
                </div>
                <div className="sys-gauge-track">
                  <span className="sys-gauge-fill" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="sys-gauge">
                <div className="sys-gauge-labels">
                  <span>ENG // THRUST</span>
                  <strong ref={engValueRef}>65%</strong>
                </div>
                <div className="sys-gauge-track">
                  <span ref={engBarRef} className="sys-gauge-fill is-thrust" style={{ width: '65%' }} />
                </div>
              </div>
              <div className="sys-micro-grid">
                <div><span>CORE</span><strong>98.4%</strong></div>
                <div><span>HYDR</span><strong>3,000 PSI</strong></div>
              </div>
            </div>
            <div className="mfd-bezel-bottom">
              <span className="osb-btn">DIAG</span>
              <span className="osb-btn">PURGE</span>
              <span className="osb-btn active">AUTO</span>
            </div>
          </div>
        </div>

        {pinned && (
          <div className="cockpit-exit-actions">
            <button
              type="button"
              className="cockpit-exit-button return-canyon-action"
              onClick={onReturnToCanyon || onExitCockpit}
              title="Return to Ember Canyon Outpost"
            >
              ← Return to Ember Canyon
            </button>
            <button
              type="button"
              className="cockpit-exit-button return-pad-action"
              onClick={onExitCockpit}
              title="Return to Surface Pad 01 Runway"
            >
              Exit Cockpit · Surface Pad 01
            </button>
          </div>
        )}
      </div>

      {!pinned && onSkip && (phase === 'departing' || phase === 'returning') && (
        <button
          type="button"
          className="flight-skip-button"
          onClick={onSkip}
          aria-label="Skip flight to arrive immediately"
        >
          <span>Skip flight</span>
          <span className="skip-arrow">⏭</span>
        </button>
      )}
    </div>
  )
}
