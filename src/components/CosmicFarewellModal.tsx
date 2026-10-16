import { useEffect, useRef } from 'react'
import { AstraSectionGuide3D } from './AstraSectionGuide3D'
import { EmberFarewell3D } from './EmberFarewell3D'

interface CosmicFarewellModalProps {
  isOpen: boolean
  onBackToUniverse: () => void
}

export function CosmicFarewellModal({
  isOpen,
  onBackToUniverse,
}: CosmicFarewellModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Ensure any ongoing speech from elsewhere is silenced when modal is active
  useEffect(() => {
    if (isOpen) {
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel()
        }
      } catch {
        // ignore
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="farewell-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="farewell-title"
      ref={modalRef}
      onClick={(e) => {
        if (e.target === e.currentTarget) onBackToUniverse()
      }}
    >
      <div className="farewell-deck-container farewell-minimal">
        {/* Title */}
        <div className="farewell-header">
          <h2 id="farewell-title" className="farewell-heading">
            Thank You for Visiting!
          </h2>
        </div>

        {/* Dual Bots Side-by-Side: Saying Bye and Thank You */}
        <div className="farewell-twins-grid">
          {/* NOVA */}
          <div className="farewell-bot-card astra-card nova-card">
            <div className="bot-card-topbar">
              <div className="bot-id">
                <span className="bot-status-dot astra" />
                <strong>NOVA</strong>
              </div>
            </div>

            <div className="bot-3d-frame">
              <AstraSectionGuide3D
                activeSection="achievements"
                externalActivity="hi"
                triggerKey={1}
                farewellMode={true}
              />
            </div>

            <div className="bot-speech-bubble astra-bubble nova-bubble">
              <p className="bubble-text-short">
                “Thank you for visiting! Bye! 👋”
              </p>
            </div>
          </div>

          {/* EMBER */}
          <div className="farewell-bot-card ember-card">
            <div className="bot-card-topbar">
              <div className="bot-id">
                <span className="bot-status-dot ember" />
                <strong>EMBER</strong>
              </div>
            </div>

            <div className="bot-3d-frame">
              <EmberFarewell3D reactionKey={1} />
            </div>

            <div className="bot-speech-bubble ember-bubble">
              <p className="bubble-text-short">
                “Thank you for visiting! Bye! 🚀”
              </p>
            </div>
          </div>
        </div>

        {/* The Single Action Button: Back to Universe */}
        <div className="farewell-single-action-bar">
          <button
            type="button"
            className="farewell-back-universe-btn"
            onClick={onBackToUniverse}
            aria-label="Back to Universe"
          >
            <span>Back to Universe</span>
            <span className="farewell-btn-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  )
}
