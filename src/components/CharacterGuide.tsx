import { useState, useRef, useEffect } from 'react'
import { Icon } from './Icon'

interface CharacterGuideProps {
  onExploreVidyu?: () => void
}

export function CharacterGuide({ onExploreVidyu }: CharacterGuideProps) {
  const [speaking, setSpeaking] = useState(false)
  const [entered, setEntered] = useState(false)
  const [hasCustomAudio, setHasCustomAudio] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const speechText =
    "Touchdown confirmed! Welcome to Vidyu World, Commander. I’m Ember, your cosmic guide. Ahead lies Raju’s flagship software universe—from production engineering to interactive systems. Let’s explore what he's built!"

  // Setup the ElevenLabs audio file
  useEffect(() => {
    const audio = new Audio('/audio/characters/ember-welcome.mp3')
    audio.preload = 'auto'
    audio.oncanplaythrough = () => setHasCustomAudio(true)
    audio.onerror = () => setHasCustomAudio(false)
    audioRef.current = audio

    // Trigger walk-in animation entrance
    const timer = setTimeout(() => {
      setEntered(true)
    }, 150)

    return () => {
      clearTimeout(timer)
      audio.pause()
      audio.currentTime = 0
    }
  }, [])

  const toggleSpeak = () => {
    if (speaking) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      setSpeaking(false)
      return
    }

    if (hasCustomAudio && audioRef.current) {
      setSpeaking(true)
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => setSpeaking(false))
      audioRef.current.onended = () => setSpeaking(false)
    } else if ('speechSynthesis' in window) {
      setSpeaking(true)
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(speechText)
      utterance.pitch = 1.2
      utterance.rate = 1.05
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="in-world-character-stage">
      {/* 1. Live On-Ground Actor: EMBER (No Box, Standing Directly on Pad) */}
      <div
        className={`live-character-actor ${speaking ? 'is-speaking' : ''} ${entered ? 'has-walked-in' : 'is-walking-in'}`}
      >
        {/* Real Dynamic Ground Contact Shadow on the Concrete Runway */}
        <div className="actor-ground-shadow" aria-hidden="true" />

        {/* Ambient Floor Heat Illumination */}
        <div className="actor-ground-glow" aria-hidden="true" />

        {/* Floating Magma Flame Sparks */}
        <div className="actor-flame-particles" aria-hidden="true">
          <span className="flame-mote m1" />
          <span className="flame-mote m2" />
          <span className="flame-mote m3" />
          <span className="flame-mote m4" />
        </div>

        {/* The Animated Body Rig */}
        <div
          className="actor-body-rig"
          onClick={toggleSpeak}
          role="button"
          tabIndex={0}
          aria-label="Ember the Solar Guardian. Click to listen to his voice."
          title="Click to hear Ember speak!"
        >
          <img
            src="/assets/character-ember-cutout.png"
            alt="Ember, Solar Vanguard"
            className="actor-body-img"
            draggable={false}
          />
          {/* Luminous Fire Aura */}
          <div className="actor-body-aura" aria-hidden="true" />
        </div>

        {/* Tactical In-World Nameplate */}
        <div className="actor-nameplate">
          <span className="nameplate-dot" />
          <span className="nameplate-title">EMBER · SOLAR VANGUARD</span>
          <button
            className={`nameplate-voice-pill ${speaking ? 'is-active' : ''}`}
            onClick={toggleSpeak}
            aria-label={speaking ? 'Stop Voice' : 'Play Voice'}
          >
            <span>{speaking ? '⏹' : '🔊'}</span>
            <span>{speaking ? 'Mute' : 'Play'}</span>
          </button>
        </div>
      </div>

      {/* 2. Floating Holographic Project Tour Deck (Summoned As He Explains) */}
      <div className="holographic-project-deck">
        <div className="holo-header">
          <span className="holo-status">
            <span className="holo-pulse-dot" />
            EXPEDITION BRIEFING · GUIDED BY EMBER
          </span>
          <span className="holo-freq">COMMS 142.80 MHz</span>
        </div>

        {/* Live Speech Dialogue Subtitle */}
        <div className="holo-speech-bubble">
          <p className="holo-speech-text">{speechText}</p>
        </div>

        {/* Interactive Holographic Feature Cards Explaining Vidyu */}
        <div className="holo-cards-grid">
          <div className="holo-card feature-1">
            <div className="holo-card-icon">📊</div>
            <div className="holo-card-content">
              <strong>Vidyu SaaS Ecosystem</strong>
              <p>Campus management system with multi-tenant architecture and granular student lifecycle analytics.</p>
            </div>
          </div>

          <div className="holo-card feature-2">
            <div className="holo-card-icon">⚡</div>
            <div className="holo-card-content">
              <strong>Real-Time Engineering</strong>
              <p>React 19 + TypeScript + Low-latency Cloud pipelines handling automated grading and live attendance.</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="holo-actions">
          <button
            className={`holo-listen-btn ${speaking ? 'is-active' : ''}`}
            onClick={toggleSpeak}
          >
            <span className="holo-icon">{speaking ? '⏹' : '🔊'}</span>
            <span>{speaking ? 'Speaking...' : 'Listen to Ember'}</span>
            {speaking && (
              <span className="voice-soundwave">
                <span className="bar b1" />
                <span className="bar b2" />
                <span className="bar b3" />
                <span className="bar b4" />
              </span>
            )}
          </button>

          {onExploreVidyu && (
            <button className="holo-explore-btn" onClick={onExploreVidyu}>
              <span>Explore Vidyu Project</span>
              <Icon name="arrow" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
