import { useCallback, useEffect, useRef, useState } from 'react'
import { frameClock } from '../animation/frameClock'
import type { FrameSubscription } from '../animation/frameClock'

export type JourneyPhase = 'gateway' | 'departing' | 'arrival' | 'returning'
export interface JourneyFrame { progress: number; raw: number; phase: JourneyPhase; speed: number }

const smootherStep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

/** React receives only phase changes. The renderer reads a mutable frame, without rerenders. */
export function useJourney(reducedMotion: boolean) {
  const [phase, setPhase] = useState<JourneyPhase>('gateway')
  const frame = useRef<JourneyFrame>({ progress: 0, raw: 0, phase: 'gateway', speed: 0 })
  const animation = useRef<FrameSubscription | null>(null)
  const reduced = useRef(reducedMotion)
  useEffect(() => { reduced.current = reducedMotion }, [reducedMotion])

  const travel = useCallback((destination: 'gateway' | 'arrival', force?: boolean) => {
    const current = frame.current
    if (destination === 'arrival' && current.phase !== 'gateway') return
    if (destination === 'gateway') {
      if (current.phase === 'returning') return
      if (current.phase === 'gateway') {
        if (!force) return
        current.progress = 1
        current.phase = 'arrival'
      }
    }
    animation.current?.dispose()
    const start = current.progress
    const end = destination === 'arrival' ? 1 : 0
    const nextPhase = destination === 'arrival' ? 'departing' : 'returning'
    current.phase = nextPhase
    current.raw = 0
    setPhase(nextPhase)
    const started = performance.now()
    const duration = reduced.current ? 360 : destination === 'arrival' ? 6800 : 4200
    const tick = (now: number) => {
      // Wall-clock timing also resolves a journey after a hidden tab resumes.
      const t = Math.min((now - started) / (reduced.current ? Math.min(duration, 360) : duration), 1)
      current.raw = t
      // On departure, hold camera gently during the initial 10% engine ignition spool-up,
      // then glide smoothly through deep space (Cockpit POV) and decelerate into planetary orbit.
      const cameraT = destination === 'arrival' && !reduced.current
        ? Math.max(0, (t - 0.10) / 0.90)
        : t
      current.progress = start + (end - start) * smootherStep(cameraT)
      // Realistic thrust envelope: spool up after ignition, steady deep-space cruise, retro-burn approach.
      const launch = Math.sin(Math.PI * cameraT)
      current.speed = reduced.current ? 0 : launch * (0.64 + 0.36 * launch)
      if (t >= 1) {
        current.progress = end
        current.raw = 1
        current.speed = 0
        current.phase = destination
        animation.current?.dispose()
        animation.current = null
        setPhase(destination)
      }
    }
    animation.current = frameClock.subscribe(tick, true, 0)
  }, [])

  const skip = useCallback(() => {
    const current = frame.current
    if (current.phase !== 'departing' && current.phase !== 'returning') return
    const destination = current.phase === 'departing' ? 'arrival' : 'gateway'
    animation.current?.dispose()
    animation.current = null
    current.progress = destination === 'arrival' ? 1 : 0
    current.raw = 1
    current.speed = 0
    current.phase = destination
    setPhase(destination)
    frameClock.invalidate()
  }, [])

  useEffect(() => () => animation.current?.dispose(), [])

  return {
    phase,
    frame,
    explore: useCallback(() => travel('arrival'), [travel]),
    home: useCallback((force?: boolean) => travel('gateway', force), [travel]),
    skip,
  }
}
