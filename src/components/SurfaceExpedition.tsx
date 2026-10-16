import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { JourneyFrame, JourneyPhase } from '../navigation/useJourney'
import { frameClock } from '../animation/frameClock'

export type SurfaceLocation = 'pad' | 'canyon'
export type SurfaceTransit = 'idle' | 'flying-to-canyon' | 'flying-to-pad'

interface Props {
  journey: RefObject<JourneyFrame>
  phase: JourneyPhase
  arrived: boolean
  reducedMotion: boolean
  location?: SurfaceLocation
  transit?: SurfaceTransit
}

/**
 * Photorealistic Cinematic Planetary Surface Expedition Environment
 * Supports dual surface locations on Vidyu World:
 * 1. Pad 01: Landing runway with docked exploration spacecraft & runway telemetry lights
 * 2. Ember Canyon Basin: Rugged mountain spires, canyon chasms with volumetric rising smoke,
 *    cascading waterfalls, and radiant horizon sunset
 * Includes cinematic low-altitude surface impulse flight transition between regions.
 */
export function SurfaceExpedition({
  journey,
  phase,
  arrived,
  reducedMotion,
  location = 'pad',
  transit = 'idle',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const padBackdropRef = useRef<HTMLDivElement>(null)
  const canyonBackdropRef = useRef<HTMLDivElement>(null)
  const thrusterRef = useRef<HTMLDivElement>(null)
  const padLightsRef = useRef<HTMLDivElement>(null)
  const mistRef = useRef<HTMLDivElement>(null)
  const dustRef = useRef<HTMLDivElement>(null)
  const canyonSmokeRef = useRef<HTMLDivElement>(null)
  const canyonDustRef = useRef<HTMLDivElement>(null)

  const pointer = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
  const locationRef = useRef(location)

  useEffect(() => {
    locationRef.current = location
  }, [location])

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (reducedMotion) return
      const nx = (e.clientX / window.innerWidth) * 2 - 1
      const ny = (e.clientY / window.innerHeight) * 2 - 1
      pointer.current.targetX = Math.max(-1, Math.min(1, nx))
      pointer.current.targetY = Math.max(-1, Math.min(1, ny))
    }

    const resetPointer = () => {
      pointer.current.targetX = 0
      pointer.current.targetY = 0
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('blur', resetPointer)
    document.documentElement.addEventListener('pointerleave', resetPointer)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('blur', resetPointer)
      document.documentElement.removeEventListener('pointerleave', resetPointer)
    }
  }, [reducedMotion])

  useEffect(() => {
    const container = containerRef.current
    const padBackdrop = padBackdropRef.current
    const canyonBackdrop = canyonBackdropRef.current
    const thruster = thrusterRef.current
    const padLights = padLightsRef.current
    const mist = mistRef.current
    const dust = dustRef.current
    const canyonSmoke = canyonSmokeRef.current
    const canyonDust = canyonDustRef.current
    if (!container) return

    let wasVisible = false
    let isContinuous = false

    const subscription = frameClock.subscribe((now) => {
      const raw = journey.current.raw
      const t = phase === 'returning' ? 1 - raw : raw

      // Reveal envelope: begins as spacecraft plunges below clouds (t = 0.68..0.96)
      let alpha = 0
      if (arrived) {
        alpha = 1
      } else if (phase === 'departing' || phase === 'returning') {
        const blend = Math.max(0, Math.min(1, (t - 0.68) / 0.28))
        alpha = blend * blend * (3 - 2 * blend)
      }

      if (alpha <= 0.002) {
        if (wasVisible) {
          container.style.opacity = '0'
          container.style.visibility = 'hidden'
          wasVisible = false
        }
        if (isContinuous) {
          subscription.setContinuous(false)
          isContinuous = false
        }
        return
      }

      if (!wasVisible) {
        container.style.visibility = 'visible'
        wasVisible = true
      }

      if (!reducedMotion && !isContinuous) {
        subscription.setContinuous(true)
        isContinuous = true
      }

      container.style.opacity = `${alpha.toFixed(3)}`

      // Smooth pointer lerp for realistic camera parallax
      const p = pointer.current
      p.x += (p.targetX - p.x) * 0.06
      p.y += (p.targetY - p.y) * 0.06

      const px = reducedMotion ? 0 : p.x
      const py = reducedMotion ? 0 : p.y

      const currentLoc = locationRef.current

      // Multi-plane parallax for Landing Pad (only when active)
      if (currentLoc === 'pad') {
        if (padBackdrop) {
          padBackdrop.style.transform = `scale(1.055) translate3d(${(px * -10).toFixed(1)}px, ${(py * -7).toFixed(1)}px, 0)`
        }
        if (thruster) {
          const pulse = 0.88 + Math.sin(now * 0.004) * 0.12 + Math.sin(now * 0.009) * 0.06
          thruster.style.opacity = `${(alpha * pulse).toFixed(3)}`
          thruster.style.transform = `translate3d(${(px * -12).toFixed(1)}px, ${(py * -8).toFixed(1)}px, 0)`
        }
        if (padLights) {
          const padPulse = 0.85 + Math.sin(now * 0.003 + 1.2) * 0.15
          padLights.style.opacity = `${(alpha * padPulse).toFixed(3)}`
          padLights.style.transform = `translate3d(${(px * -12).toFixed(1)}px, ${(py * -8).toFixed(1)}px, 0)`
        }
        if (mist) {
          const drift = (now * 0.006) % 120
          mist.style.transform = `translate3d(${(drift - 60 + px * -18).toFixed(1)}px, ${(py * -11).toFixed(1)}px, 0)`
          mist.style.opacity = `${(alpha * 0.72).toFixed(3)}`
        }
        if (dust) {
          const dustDrift = (now * 0.012) % 180
          dust.style.transform = `translate3d(${(dustDrift - 90 + px * -24).toFixed(1)}px, ${(py * -16).toFixed(1)}px, 0)`
          dust.style.opacity = `${(alpha * 0.65).toFixed(3)}`
        }
      } else if (currentLoc === 'canyon') {
        // Multi-plane parallax for Canyon Basin
        if (canyonBackdrop) {
          canyonBackdrop.style.transform = `scale(1.06) translate3d(${(px * -12).toFixed(1)}px, ${(py * -8).toFixed(1)}px, 0)`
        }
        if (canyonSmoke) {
          const smokePulse = 0.82 + Math.sin(now * 0.0018) * 0.18
          canyonSmoke.style.transform = `translate3d(${(px * -16).toFixed(1)}px, ${(py * -12).toFixed(1)}px, 0)`
          canyonSmoke.style.opacity = `${(alpha * smokePulse).toFixed(3)}`
        }
        if (canyonDust) {
          const emberDrift = (now * 0.015) % 200
          canyonDust.style.transform = `translate3d(${(emberDrift - 100 + px * -26).toFixed(1)}px, ${(py * -18).toFixed(1)}px, 0)`
          canyonDust.style.opacity = `${(alpha * 0.85).toFixed(3)}`
        }
      }
    })

    return () => subscription.dispose()
  }, [journey, phase, arrived, reducedMotion])

  const isCanyon = location === 'canyon'
  const isTransiting = transit !== 'idle'

  return (
    <div
      ref={containerRef}
      className={`surface-expedition location-${location} ${isTransiting ? 'is-transiting' : ''} transit-${transit}`}
      aria-hidden="true"
    >
      {/* ─────────────────────────────────────────────────────────────
          LOCATION 1: LANDING PAD 01 (Docked Spacecraft & Runway)
      ───────────────────────────────────────────────────────────── */}
      <div className={`surface-location-layer pad-layer ${!isCanyon ? 'is-active' : 'is-inactive'}`}>
        <div
          ref={padBackdropRef}
          className="surface-backdrop-image pad-bg"
          style={{ backgroundImage: `url('/assets/vidyu-surface-backdrop.jpg')` }}
        />

        {/* Horizon Sun Bloom */}
        <div className="surface-sun-bloom" />

        {/* Low-Altitude Drifting Valley Mist */}
        <div ref={mistRef} className="surface-valley-mist" />

        {/* Concentric Amber Landing Pad Track Lights */}
        <div ref={padLightsRef} className="surface-pad-lights">
          <span className="pad-light pl-center" />
          <span className="pad-light pl-inner-l" />
          <span className="pad-light pl-inner-r" />
          <span className="pad-light pl-outer-l" />
          <span className="pad-light pl-outer-r" />
          <span className="pad-light pl-perimeter-1" />
          <span className="pad-light pl-perimeter-2" />
          <span className="pad-light pl-perimeter-3" />
          <span className="pad-crate-light crate-1" />
          <span className="pad-crate-light crate-2" />
          <span className="pad-crate-light crate-3" />
        </div>

        {/* Docked Spacecraft Twin Thruster Exhaust Heat Shimmer */}
        <div ref={thrusterRef} className="surface-thruster-exhaust">
          <div className="nozzle-glow nozzle-left" />
          <div className="nozzle-glow nozzle-right" />
          <div className="thruster-core core-left" />
          <div className="thruster-core core-right" />
        </div>

        {/* Sunlit Regolith Dust Motes */}
        <div ref={dustRef} className="surface-dust-motes">
          <span className="mote m1" />
          <span className="mote m2" />
          <span className="mote m3" />
          <span className="mote m4" />
          <span className="mote m5" />
          <span className="mote m6" />
          <span className="mote m7" />
          <span className="mote m8" />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LOCATION 2: EMBER CANYON BASIN (Spired Chasms & Smoke Ravines)
      ───────────────────────────────────────────────────────────── */}
      <div className={`surface-location-layer canyon-layer ${isCanyon ? 'is-active' : 'is-inactive'}`}>
        <div
          ref={canyonBackdropRef}
          className="surface-backdrop-image canyon-bg"
          style={{ backgroundImage: `url('/assets/ember-background.png')` }}
        />

        {/* Horizon Sun Spires Bloom (Radiant Sunset between mountain peaks) */}
        <div className="canyon-sun-bloom" />

        {/* Volumetric Smoke & Steam Billowing from Canyon Ravines & Waterfalls */}
        <div ref={canyonSmokeRef} className="canyon-smoke-system">
          <div className="canyon-smoke smoke-chasm-center" />
          <div className="canyon-smoke smoke-chasm-left" />
          <div className="canyon-smoke smoke-chasm-right" />
          <div className="canyon-smoke smoke-waterfall-spray" />
          <div className="canyon-smoke smoke-valley-drift" />
        </div>

        {/* Floating Volcanic Ember Sparks & Golden Dust Motes */}
        <div ref={canyonDustRef} className="canyon-ember-particles">
          <span className="ember-spark e1" />
          <span className="ember-spark e2" />
          <span className="ember-spark e3" />
          <span className="ember-spark e4" />
          <span className="ember-spark e5" />
          <span className="ember-spark e6" />
          <span className="ember-spark e7" />
          <span className="ember-spark e8" />
          <span className="ember-spark e9" />
          <span className="ember-spark e10" />
        </div>

        {/* Atmospheric Heat Shimmer Layer */}
        <div className="canyon-heat-shimmer" />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SURFACE IMPULSE FLIGHT / TRANSIT OVERLAY
      ───────────────────────────────────────────────────────────── */}
      {isTransiting && (
        <div className="surface-flight-transit">
          <div className="flight-speed-lines">
            <span className="speed-streak s1" />
            <span className="speed-streak s2" />
            <span className="speed-streak s3" />
            <span className="speed-streak s4" />
            <span className="speed-streak s5" />
            <span className="speed-streak s6" />
          </div>

          <div className="surface-flight-hud">
            <div className="flight-hud-pill">
              <span className="flight-thruster-dot" />
              <div className="flight-hud-info">
                <strong>
                  {transit === 'flying-to-canyon'
                    ? 'TRANSITING TO EMBER CANYON BASIN'
                    : 'RETURNING TO LANDING PAD 01'}
                </strong>
                <small>
                  {transit === 'flying-to-canyon'
                    ? 'SURFACE IMPULSE ACTIVE · ALT: 380m · SPEED: 850 km/h · OUTPOST 02'
                    : 'APPROACHING DOCKED SPACECRAFT · RETRO-THRUSTERS ACTIVE · BASE 01'}
                </small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Vignette & Cinema Grading Layer */}
      <div className="surface-cinematic-grade" />
    </div>
  )
}
