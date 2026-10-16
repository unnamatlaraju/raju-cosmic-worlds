import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import type { JourneyFrame, JourneyPhase } from '../navigation/useJourney'
import type { UniverseRenderer } from './UniverseRenderer'
import type { SceneInteraction } from './UniverseRenderer'
import { frameClock } from '../animation/frameClock'

export type GraphicsStatus = 'preparing' | 'live' | 'lightweight'

interface Props {
  journey: RefObject<JourneyFrame>
  phase: JourneyPhase
  reducedMotion: boolean
  still: boolean
  onStatus: (status: GraphicsStatus) => void
  interaction: RefObject<SceneInteraction>
}

export function UniverseScene({ journey, phase, reducedMotion, still, onStatus, interaction }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const renderer = useRef<UniverseRenderer | null>(null)
  const reduced = useRef(reducedMotion)
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    // Re-enabling the live scene is also an explicit retry after a graphics failure.
    if (!still) setUnavailable(false)
  }, [still])

  useEffect(() => {
    reduced.current = reducedMotion
    renderer.current?.setReducedMotion(reducedMotion)
  }, [reducedMotion])

  useEffect(() => {
    if (still || unavailable) {
      onStatus('lightweight')
      return
    }
    let cancelled = false
    onStatus('preparing')
    setReady(false)
    // Keep the interface and illustrated fallback usable while the renderer loads.
    void import('./UniverseRenderer').then(({ UniverseRenderer: Renderer }) => {
      if (cancelled || !canvas.current) return
      try {
        renderer.current = new Renderer({
          canvas: canvas.current,
          readJourney: () => journey.current,
          readInteraction: () => interaction.current,
           getDestinationControl: () => null,
          reducedMotion: reduced.current,
          onReady: () => { if (!cancelled) { setReady(true); onStatus('live') } },
          onFallback: () => { if (!cancelled) setUnavailable(true) },
        })
      } catch {
        if (!cancelled) setUnavailable(true)
      }
    }).catch(() => { if (!cancelled) setUnavailable(true) })
    return () => {
      cancelled = true
      renderer.current?.dispose()
      renderer.current = null
    }
  }, [journey, still, unavailable, onStatus, interaction])

  useEffect(() => { frameClock.invalidate() }, [phase])

  const live = ready && !still && !unavailable
  return (
    <div className={`universe-scene ${live ? 'is-live' : 'is-illustrated'}`} data-arrival={phase === 'arrival'} aria-hidden="true">
      <div className="illustrated-universe">
        <div className="illustrated-stars" />
        <div className="illustrated-planet"><div className="illustrated-ring" /><div className="illustrated-sphere" /></div>
        <div className="illustrated-moon moon-cyan" />
        <div className="illustrated-moon moon-ochre" />
        <div className="illustrated-moon moon-slate" />
      </div>
      {!still && !unavailable && <canvas ref={canvas} className="universe-canvas" />}
      {/* Foreground life: drifting dust and the occasional meteor, layered above the
          star field so the Gateway reads as a place rather than a picture. */}
      <div className="gateway-ambience">
        <div className="gateway-dust dust-a" />
        <div className="gateway-dust dust-b" />
        <span className="shooting-star ss-1" />
        <span className="shooting-star ss-2" />
        <span className="shooting-star ss-3" />
      </div>
      <div className="scene-scrim" />
    </div>
  )
}
