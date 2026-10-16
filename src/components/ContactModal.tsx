import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Icon } from './Icon'

interface ContactModalProps {
  open: boolean
  onClose: () => void
}

export function ContactModal({ open, onClose }: ContactModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) {
      el.showModal()
      document.body.style.overflow = 'hidden'
    } else if (!open && el.open) {
      el.close()
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const handleKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('rajurockstar435@gmail.com').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2400)
    })
  }

  return (
    <dialog
      ref={dialogRef}
      className="contact-modal"
      aria-labelledby="contact-modal-title"
      onClose={onClose}
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="contact-modal-inner">
        {/* Top Header with Proper Back Button at Top */}
        <div className="contact-modal-header">
          <div className="contact-modal-top-bar">
            <button
              type="button"
              className="contact-modal-back-btn"
              onClick={onClose}
              aria-label="Back to Universe"
              title="Return to Universe"
            >
              <Icon name="back" />
              <span>Back</span>
            </button>
          </div>

          <div className="contact-title-group">
            <div className="contact-modal-eyebrow">
              <span className="contact-beacon-dot" />
              <span>PILOT COMMS // DIRECT CONTACT UPLINK</span>
            </div>
            <h2 id="contact-modal-title" className="contact-modal-heading">
              Connect with Raju Unnamatla
            </h2>
            <p className="contact-modal-subtitle">
              Have an exciting opportunity, engineering challenge, or project in mind? Reach out directly through any channel below.
            </p>
          </div>
        </div>

        {/* Availability Banner */}
        <div className="contact-status-banner">
          <span className="status-indicator-live" />
          <div className="status-banner-text">
            <strong>Active & Available for Engineering Roles</strong>
            <span>Full-Stack Development · Next.js / React / Node.js / PostgreSQL · Remote & Hybrid</span>
          </div>
        </div>

        {/* Direct Channels Grid */}
        <div className="contact-channels-grid">
          {/* Email Channel */}
          <div className="contact-channel-card email-card">
            <div className="channel-icon-wrap">
              <Icon name="mail" />
            </div>
            <div className="channel-details">
              <span className="channel-lbl">Direct Email</span>
              <strong className="channel-val">rajurockstar435@gmail.com</strong>
            </div>
            <div className="channel-actions">
              <button
                type="button"
                className="channel-action-btn copy-btn"
                onClick={handleCopyEmail}
                title="Copy email address"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
              <a
                href="mailto:rajurockstar435@gmail.com"
                className="channel-action-btn primary-action-btn"
              >
                Send Email
                <Icon name="arrow" />
              </a>
            </div>
          </div>

          {/* LinkedIn Channel */}
          <div className="contact-channel-card linkedin-card">
            <div className="channel-icon-wrap">
              <Icon name="linkedin" />
            </div>
            <div className="channel-details">
              <span className="channel-lbl">LinkedIn Network</span>
              <strong className="channel-val">linkedin.com/in/raju-unnamatla</strong>
            </div>
            <div className="channel-actions">
              <a
                href="https://www.linkedin.com/in/raju-unnamatla"
                target="_blank"
                rel="noopener noreferrer"
                className="channel-action-btn primary-action-btn"
              >
                Open Profile
                <Icon name="arrow" />
              </a>
            </div>
          </div>

          {/* GitHub Channel */}
          <div className="contact-channel-card github-card">
            <div className="channel-icon-wrap">
              <Icon name="github" />
            </div>
            <div className="channel-details">
              <span className="channel-lbl">GitHub Repositories</span>
              <strong className="channel-val">github.com/unnamatlaraju</strong>
            </div>
            <div className="channel-actions">
              <a
                href="https://github.com/unnamatlaraju"
                target="_blank"
                rel="noopener noreferrer"
                className="channel-action-btn primary-action-btn"
              >
                View GitHub
                <Icon name="arrow" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}
