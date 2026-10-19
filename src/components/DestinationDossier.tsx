import { useEffect, useRef, useCallback, useState } from 'react'
import { Icon } from './Icon'
import { AstraSectionGuide3D } from './AstraSectionGuide3D'
import { CosmicFarewellModal } from './CosmicFarewellModal'

export type DestinationSection = 'education' | 'projects' | 'skills' | 'achievements' | 'vidyu'

interface DestinationDossierProps {
  activeSection: DestinationSection | null
  onClose: () => void
  onSelectSection: (section: DestinationSection) => void
  onFlyToPad: () => void
  onReturnHome?: () => void
}

export function DestinationDossier({
  activeSection,
  onClose,
  onSelectSection,
  onFlyToPad,
  onReturnHome,
}: DestinationDossierProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const tabsNavRef = useRef<HTMLElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const hasRenderedPillRef = useRef(false)
  const [showFarewellModal, setShowFarewellModal] = useState(false)
  const [vidyuContentPart, setVidyuContentPart] = useState<1 | 2>(1)
  const [spendlyContentPart, setSpendlyContentPart] = useState<1 | 2>(1)

  // Reset farewell modal when section changes or closes
  useEffect(() => {
    setShowFarewellModal(false)
  }, [activeSection])

  // transitions.dev Tabs Sliding: move pill to active tab's offsetLeft & offsetWidth
  const movePillTo = useCallback((tab: HTMLElement, animate: boolean) => {
    const pill = pillRef.current
    if (!pill) return
    const targetX = tab.offsetLeft
    const targetWidth = tab.offsetWidth

    if (!animate) {
      const prev = pill.style.transition
      pill.style.transition = 'none'
      pill.style.transform = `translateX(${targetX}px)`
      pill.style.width = `${targetWidth}px`
      void pill.offsetWidth // force reflow
      pill.style.transition = prev
    } else {
      pill.style.transform = `translateX(${targetX}px)`
      pill.style.width = `${targetWidth}px`
    }
  }, [])

  // Position pill when activeSection changes or modal opens
  useEffect(() => {
    if (!activeSection) {
      hasRenderedPillRef.current = false
      return
    }

    let cancel = false

    const measureAndMove = () => {
      if (cancel) return
      const nav = tabsNavRef.current
      if (!nav) return
      const activeTab = nav.querySelector<HTMLButtonElement>('.t-tab[aria-selected="true"]')
      if (activeTab && activeTab.offsetWidth > 0) {
        movePillTo(activeTab, hasRenderedPillRef.current)
        hasRenderedPillRef.current = true
        try {
          activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
        } catch {
          // ignore
        }
      } else {
        requestAnimationFrame(measureAndMove)
      }
    }

    requestAnimationFrame(measureAndMove)
    return () => {
      cancel = true
    }
  }, [activeSection, movePillTo])

  // Reposition without transition on window resize
  useEffect(() => {
    const handleResize = () => {
      const nav = tabsNavRef.current
      if (!nav) return
      const activeTab = nav.querySelector<HTMLButtonElement>('.t-tab[aria-selected="true"]')
      if (activeTab) movePillTo(activeTab, false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [movePillTo])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (activeSection && !dialog.open) {
      dialog.showModal()
    } else if (!activeSection && dialog.open) {
      dialog.close()
    }
  }, [activeSection])

  if (!activeSection) return null

  return (
    <dialog
      ref={dialogRef}
      className={`destination-dossier-modal section-${activeSection}`}
      aria-labelledby="dossier-heading"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* ── CINEMATIC EMBER CANYON UNIVERSE BACKDROP (STATIC & FIXED: NEVER SCROLLS) ── */}
      <div className="dossier-universe-fixed-backdrop" aria-hidden="true">
        <div className="dossier-canyon-matte" />
        <div className="canyon-ember-particles">
          <span className="ember-spark e1" />
          <span className="ember-spark e2" />
          <span className="ember-spark e3" />
          <span className="ember-spark e4" />
          <span className="ember-spark e5" />
          <span className="ember-spark e6" />
          <span className="ember-spark e7" />
          <span className="ember-spark e8" />
        </div>
      </div>

      {/* ── SCROLLABLE CARDS VIEWPORT: ONLY CARDS MOVE, NEVER THE IMAGE ── */}
      <div
        className="dossier-scroll-area"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div className="dossier-container">
        {/* Top Control Bar with Outpost Return & Sector Telemetry */}
        <div className="dossier-topbar">
          <button className="dossier-back-to-canyon-btn" onClick={onClose} aria-label="Return to Ember Canyon Outpost">
            <Icon name="back" />
            <span className="dossier-back-text-full">Return to Ember Canyon</span>
            <span className="dossier-back-text-short">Outpost</span>
          </button>

          <div className="dossier-center-cluster">
            <div className="canyon-telemetry-badge">
              <span className="telemetry-beacon active" />
              <span className="telemetry-code">
                {activeSection === 'projects' && '01 / PROJECTS UNIVERSE · CORE SYSTEMS'}
                {activeSection === 'skills' && '02 / TECHNICAL ARSENAL · ARCHITECTURE MATRIX'}
                {activeSection === 'education' && '03 / LEARNING WORLD · ACADEMIC ARCHIVE'}
                {activeSection === 'achievements' && '04 / ACHIEVEMENT VAULT · HALL OF HONORS'}
              </span>
            </div>

            {/* Quick Travel Nav Tabs with transitions.dev Tabs sliding */}
            <nav
              ref={tabsNavRef}
              className="dossier-nav-tabs t-tabs"
              role="tablist"
              aria-label="Cosmic destination tabs"
            >
              <span ref={pillRef} className="t-tabs-pill" aria-hidden="true" />
              <button
                className={`dossier-tab t-tab ${activeSection === 'projects' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeSection === 'projects'}
                onClick={() => onSelectSection('projects')}
              >
                <span>🚀</span>
                <span>Projects</span>
              </button>
              <button
                className={`dossier-tab t-tab ${activeSection === 'skills' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeSection === 'skills'}
                onClick={() => onSelectSection('skills')}
              >
                <span>⚡</span>
                <span className="tab-label-full">Skills & Stack</span>
                <span className="tab-label-short">Skills</span>
              </button>
              <button
                className={`dossier-tab t-tab ${activeSection === 'education' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeSection === 'education'}
                onClick={() => onSelectSection('education')}
              >
                <span>🎓</span>
                <span>Education</span>
              </button>
              <button
                className={`dossier-tab t-tab ${activeSection === 'achievements' ? 'active' : ''}`}
                role="tab"
                aria-selected={activeSection === 'achievements'}
                onClick={() => onSelectSection('achievements')}
              >
                <span>🏆</span>
                <span className="tab-label-full">Achievements</span>
                <span className="tab-label-short">Honors</span>
              </button>
            </nav>
          </div>

          {activeSection === 'achievements' ? (
            <button
              className="dossier-farewell-trigger-btn"
              onClick={() => setShowFarewellModal(true)}
              aria-label="Say goodbye and end tour"
              title="Both companions say thank you for visiting and say bye!"
            >
              <span className="farewell-btn-label">Say Bye</span>
              <span className="farewell-btn-arrow">→</span>
            </button>
          ) : (
            <button className="dossier-close-btn" onClick={onClose} aria-label="Close dossier">
              <Icon name="close" />
            </button>
          )}
        </div>

        {/* Main Content Area with Nova Section Guide on the Left */}
        <div className="dossier-layout-split">
          {/* ── LEFT SIDE: NOVA 3D SECTION GUIDE (Stands peacefully accompanying user) ── */}
          <aside className="dossier-guide-station" aria-label="Section Guide Companion Nova">
            <div className="dossier-guide-card">
              <div className="guide-status-bar">
                <span className="guide-status-beacon" />
                <span className="guide-status-title">SECTION COMPANION</span>
              </div>
              <div className="guide-3d-viewport">
                <AstraSectionGuide3D
                  activeSection={activeSection}
                  externalActivity={showFarewellModal ? 'hi' : null}
                  speechOverride={
                    showFarewellModal
                      ? { text: 'Thank you for visiting! Bye! 👋💖', icon: '💖' }
                      : null
                  }
                />
              </div>

              <div className="guide-identity-tag">
                <div className="guide-tag-top">
                  <strong>NOVA</strong>
                  <span className="guide-tag-badge">FEMME // ANDROID</span>
                </div>
                <span className="guide-tag-sub">
                  {activeSection === 'projects' && 'Systems Architecture Sentinel'}
                  {activeSection === 'skills' && 'Full-Stack Architecture & Concurrency Sentinel'}
                  {activeSection === 'education' && 'Scholar & Knowledge Custodian'}
                  {activeSection === 'achievements' && 'Verified Honors Sentinel'}
                </span>
              </div>
            </div>

            {/* ── COMMS & DIRECT CONTACT UPLINK: ROUND ICON BUTTONS UNDER THE BOT ── */}
            <div className="dossier-contact-card" aria-label="Direct Contact Links for Raju Unnamatla">
              <div className="contact-card-header">
                <div className="contact-header-left">
                  <span className="contact-beacon" />
                  <span className="contact-title">PILOT COMMS // DIRECT CONTACT</span>
                </div>
                <span className="contact-status-tag">AVAILABLE</span>
              </div>
              <div className="contact-card-sub">
                <span>Reach Raju Unnamatla</span>
                <span>Full-Stack Dev</span>
              </div>
              <div className="contact-round-buttons-row">
                {/* LinkedIn Round Icon Button */}
                <div className="contact-round-item">
                  <a
                    href="https://www.linkedin.com/in/raju-unnamatla"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-round-btn linkedin-round"
                    aria-label="LinkedIn Profile"
                    title="LinkedIn: https://www.linkedin.com/in/raju-unnamatla"
                  >
                    <Icon name="linkedin" />
                  </a>
                  <span className="contact-round-name">LinkedIn</span>
                </div>

                {/* GitHub Round Icon Button */}
                <div className="contact-round-item">
                  <a
                    href="https://github.com/unnamatlaraju"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-round-btn github-round"
                    aria-label="GitHub Profile"
                    title="GitHub: https://github.com/unnamatlaraju"
                  >
                    <Icon name="github" />
                  </a>
                  <span className="contact-round-name">GitHub</span>
                </div>

                {/* Direct Mail Round Icon Button */}
                <div className="contact-round-item">
                  <a
                    href="mailto:rajurockstar435@gmail.com"
                    className="contact-round-btn email-round"
                    aria-label="Email Raju Unnamatla"
                    title="Email: rajurockstar435@gmail.com"
                  >
                    <Icon name="mail" />
                  </a>
                  <span className="contact-round-name">Email</span>
                </div>
              </div>
            </div>
          </aside>

          {/* ── RIGHT SIDE: SECTION CARDS ── */}
          <div className="dossier-body">
          {/* ─────────────────────────────────────────────────────────────
              1. PROJECTS UNIVERSE
          ───────────────────────────────────────────────────────────── */}
          {activeSection === 'projects' && (
            <div className="dossier-section-view entrance">
              <div className="dossier-header-block">
                <div className="agent-badge">
                  <span className="agent-avatar">🚀</span>
                  <div className="agent-meta">
                    <strong>ORION // SYSTEMS ARCHITECT</strong>
                    <small>Engineering Vanguard & Interactive Worldbuilder</small>
                  </div>
                </div>
                <h2 id="dossier-heading" className="dossier-title">
                  Software Engineering & <br /><em>Projects Universe</em>
                </h2>
                <p className="dossier-lead">
                  Production-grade multi-tenant architectures, cryptographic security protocols, modern full-stack web applications,
                  and immersive 3D graphics engineered by Raju Unnamatla.
                </p>
              </div>

              {/* Restored Complete Projects Showcase Grid with In-Card Content Parts */}
              <div className="projects-showcase-grid">
                {/* ─────────────────────────────────────────────────────────────
                    Project 1: Vidyu — Multi-Portal School Management Platform (CROWN FLAGSHIP)
                ───────────────────────────────────────────────────────────── */}
                <div className="project-feature-card is-flagship is-crown-flagship">
                  <div className="proj-top">
                    <span className="proj-badge crown-flagship-badge">👑 PRIMARY FLAGSHIP SAAS · PRODUCTION DEPLOYED</span>
                    <span className="proj-status active">Mar 2026 — Present</span>
                  </div>
                  <h3 className="proj-title crown-title">Vidyu — Multi-Portal School Management Platform</h3>
                  <div className="proj-subtitle-crown">
                    👑 Founder & Full-Stack Architect · 155+ Dynamic Pages · 130 Database Models · 100% Solo Build
                  </div>

                  {/* In-Card Content Parts Switcher */}
                  <div className="card-parts-nav" role="tablist" aria-label="Vidyu content sections">
                    <button
                      className={`card-part-tab ${vidyuContentPart === 1 ? 'active' : ''}`}
                      onClick={() => setVidyuContentPart(1)}
                      type="button"
                      role="tab"
                      aria-selected={vidyuContentPart === 1}
                    >
                      <span className="card-part-tag">PART 1</span>
                      <span className="part-label-full">Overview & Scale Metrics</span>
                      <span className="part-label-short">Overview</span>
                    </button>
                    <button
                      className={`card-part-tab ${vidyuContentPart === 2 ? 'active' : ''}`}
                      onClick={() => setVidyuContentPart(2)}
                      type="button"
                      role="tab"
                      aria-selected={vidyuContentPart === 2}
                    >
                      <span className="card-part-tag">PART 2</span>
                      <span className="part-label-full">Architectural Pillars (6 Systems)</span>
                      <span className="part-label-short">Architecture</span>
                    </button>
                  </div>

                  {/* transitions.dev "Page side-by-side" Inside Vidyu Card */}
                  <div className="t-page-slide" data-page={String(vidyuContentPart)}>
                    {/* PART 1: Overview, Scale Metrics & Stack */}
                    <div className="t-page" data-page-id="1">
                      {/* Recruiter Architectural Scale Stat Badges — 9 Commanding Crown Pills */}
                      <div className="proj-metrics-grid crown-metrics-grid">
                        <span className="proj-metric-pill crown-pill">👑 Crown Flagship SaaS</span>
                        <span className="proj-metric-pill crown-pill">🏛️ 6 Dedicated Role Portals</span>
                        <span className="proj-metric-pill crown-pill">📄 155+ Dynamic Pages</span>
                        <span className="proj-metric-pill crown-pill">🗄️ 130 Normalized DB Models</span>
                        <span className="proj-metric-pill crown-pill">📍 Real-Time Bus GPS (Leaflet + FCM)</span>
                        <span className="proj-metric-pill crown-pill">🤖 Gemini Multimodal AI (OCR & Timetables)</span>
                        <span className="proj-metric-pill crown-pill">🔒 Strict Multi-Tenant Isolation & RBAC</span>
                        <span className="proj-metric-pill crown-pill">💳 Direct 0%-Commission UPI QR + UTR Engine</span>
                        <span className="proj-metric-pill crown-pill">⚡ 100% Solo Engineering End-to-End</span>
                      </div>

                      <p className="proj-desc">
                        Enterprise-scale multi-school institutional SaaS platform architected and engineered 100% solo from scratch. Orchestrates 6 dedicated, role-specific portals (Super Admin, Principal, Teacher, Parent, Staff, and Driver) across 155 dynamic pages and 130 relational database models. Powers mission-critical academic operations including multi-tenant data partitioning, live driver bus telemetry streaming via Leaflet GIS and Firebase Cloud Messaging (FCM), Google Gemini AI OCR for examination marksheets, algorithmic substitute teacher scheduling, and direct 0%-commission UPI QR fee collection with UTR reconciliation.
                      </p>

                      <div className="proj-tech-stack">
                        <span>Next.js 15</span>
                        <span>React 19</span>
                        <span>TypeScript</span>
                        <span>Prisma ORM</span>
                        <span>PostgreSQL (Supabase)</span>
                        <span>Firebase Cloud Messaging (FCM)</span>
                        <span>Leaflet GIS</span>
                        <span>Google Gemini AI</span>
                        <span>Tailwind CSS</span>
                        <span>GitHub Actions CI/CD</span>
                        <span>Vercel Edge</span>
                      </div>
                    </div>

                    {/* PART 2: 6 Architectural Pillars & Confidential IP Badge */}
                    <div className="t-page" data-page-id="2">
                      <div className="proj-highlights-box crown-highlights-box">
                        <div className="proj-highlights-title crown-highlights-title">
                          <span>⚡</span> ARCHITECTURAL PILLARS & INSTITUTIONAL SCALE (100% SOLO BUILD):
                        </div>
                        <ul className="proj-highlights-list">
                          <li>
                            <span className="proj-bullet-icon crown-bullet">✦</span>
                            <span><strong>Full-Stack Scale:</strong> Architected 155+ responsive pages and 130 normalized Prisma models solo with complete end-to-end type safety in TypeScript, orchestrating 6 tailored role workspaces.</span>
                          </li>
                          <li>
                            <span className="proj-bullet-icon crown-bullet">✦</span>
                            <span><strong>6-Portal Multi-Tenant Isolation:</strong> Enforced strict institutional schema isolation and multi-level RBAC ensuring zero cross-school or cross-role data leaks across Admin, Principal, Teacher, Parent, Staff, and Driver portals.</span>
                          </li>
                          <li>
                            <span className="proj-bullet-icon crown-bullet">✦</span>
                            <span><strong>Real-Device Live Bus GPS:</strong> Engineered sub-second telemetry tracking with Leaflet interactive GIS mapping and low-latency Firebase Cloud Messaging (FCM) automated push notifications for pickup and arrival events.</span>
                          </li>
                          <li>
                            <span className="proj-bullet-icon crown-bullet">✦</span>
                            <span><strong>Gemini Multimodal AI OCR:</strong> Built automated vision intelligence to parse handwritten examination marksheets, digitize physical report cards, and generate conflict-free academic timetables via Google Gemini AI.</span>
                          </li>
                          <li>
                            <span className="proj-bullet-icon crown-bullet">✦</span>
                            <span><strong>Direct 0%-Commission UPI QR Engine:</strong> Integrated dynamic NPCI-compliant UPI QR generation with merchant UTR verification, enabling direct institution bank deposits with zero third-party gateway transaction cuts.</span>
                          </li>
                          <li>
                            <span className="proj-bullet-icon crown-bullet">✦</span>
                            <span><strong>Automated Teacher Substitution Matrix:</strong> Developed an intelligent scheduling engine that detects faculty leave in real time and automatically reassigns free qualified teachers without schedule clashes.</span>
                          </li>
                        </ul>
                      </div>

                      {/* Confidential Business & IP Disclaimer */}
                      <div className="proj-ip-badge">
                        <span>🔒</span>
                        <span>Proprietary Commercial Product · Source Code & Architecture Confidential</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Vidyu Card */}
                  <div className="proj-actions">
                    <a
                      className="proj-action-btn primary"
                      href="https://vidyu.vercel.app"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                      <span>Launch Live Platform (vidyu.vercel.app)</span>
                      <Icon name="arrow" />
                    </a>
                    <button className="proj-action-btn secondary" onClick={onFlyToPad}>
                      <span>Travel to Vidyu Landing Pad</span>
                      <Icon name="ship" />
                    </button>
                    <button className="proj-action-btn secondary" onClick={() => onSelectSection('skills')}>
                      <span>Technical Stack & Architecture</span>
                      <Icon name="orbit" />
                    </button>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    Project 2: Spendly — Full-Stack Personal Finance & Idempotent Expense Tracker
                ───────────────────────────────────────────────────────────── */}
                <div className="project-feature-card spendly-card">
                  <div className="proj-top">
                    <span className="proj-badge spendly-badge">FULL-STACK WEB APP · PRODUCTION DEPLOYED</span>
                    <span className="proj-status active">Live in Production · Public Repo</span>
                  </div>
                  <h3 className="proj-title">Spendly — Full-Stack Personal Finance & Idempotent Expense Tracker</h3>
                  <div style={{ fontSize: '11px', color: '#34d399', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Creator & Full-Stack Architect · 78 Files · ~5,350 Lines TypeScript
                  </div>

                  {/* In-Card Content Parts Switcher */}
                  <div className="card-parts-nav spendly-parts-nav" role="tablist" aria-label="Spendly content sections">
                    <button
                      className={`card-part-tab ${spendlyContentPart === 1 ? 'active' : ''}`}
                      onClick={() => setSpendlyContentPart(1)}
                      type="button"
                      role="tab"
                      aria-selected={spendlyContentPart === 1}
                    >
                      <span className="card-part-tag">PART 1</span>
                      <span className="part-label-full">Overview & Tech Stack</span>
                      <span className="part-label-short">Overview</span>
                    </button>
                    <button
                      className={`card-part-tab ${spendlyContentPart === 2 ? 'active' : ''}`}
                      onClick={() => setSpendlyContentPart(2)}
                      type="button"
                      role="tab"
                      aria-selected={spendlyContentPart === 2}
                    >
                      <span className="card-part-tag">PART 2</span>
                      <span className="part-label-full">Engineering Highlights (4 Pillars)</span>
                      <span className="part-label-short">Architecture</span>
                    </button>
                  </div>

                  {/* transitions.dev "Page side-by-side" Inside Spendly Card */}
                  <div className="t-page-slide" data-page={String(spendlyContentPart)}>
                    {/* PART 1: Overview, Metrics & Stack */}
                    <div className="t-page" data-page-id="1">
                      {/* Recruiter Architectural Stat Badges — 5 Focused Pills */}
                      <div className="proj-metrics-grid">
                        <span className="proj-metric-pill spendly-pill">⚡ Next.js 15 App Router</span>
                        <span className="proj-metric-pill spendly-pill">🗄️ PostgreSQL + Prisma 6</span>
                        <span className="proj-metric-pill spendly-pill">🔄 Idempotent Recurring Engine</span>
                        <span className="proj-metric-pill spendly-pill">🎙️ Web Speech API Voice Logging</span>
                        <span className="proj-metric-pill spendly-pill">💯 100/100/100 Lighthouse</span>
                      </div>

                      <p className="proj-desc">
                        Spendly is a production-deployed full-stack personal finance tracker built with Next.js 15 App Router, PostgreSQL (Supabase), and Prisma 6. Alongside everyday spending and category budgets, it models recurring commitments—rent, EMIs, utilities, subscriptions—as first-class database records with their own schedules and statuses, advancing due dates idempotently when payments are recorded. Features natural-language browser voice logging (Web Speech API), dark 'Aurora Glass' UI design system, CSV/HTML report export, and a perfect 100/100/100 Lighthouse score.
                      </p>

                      <div className="proj-tech-stack">
                        <span>Next.js 15</span>
                        <span>React 19</span>
                        <span>TypeScript 5.9</span>
                        <span>PostgreSQL (Supabase)</span>
                        <span>Prisma 6</span>
                        <span>Tailwind CSS v4</span>
                        <span>Radix UI</span>
                        <span>Recharts</span>
                        <span>Zod 4</span>
                        <span>Vitest</span>
                        <span>Web Speech API</span>
                        <span>Vercel</span>
                      </div>
                    </div>

                    {/* PART 2: Key Architectural & Engineering Highlights */}
                    <div className="t-page" data-page-id="2">
                      <div className="proj-highlights-box spendly-highlights">
                        <div className="proj-highlights-title spendly-highlights-title">
                          <span>⚡</span> KEY ARCHITECTURAL & ENGINEERING HIGHLIGHTS:
                        </div>
                        <ul className="proj-highlights-list">
                          <li>
                            <span className="proj-bullet-icon spendly-bullet">✦</span>
                            <span><strong>Idempotent Recurring Engine:</strong> Database-enforced compound unique constraint on <code>(commitmentId, periodStart)</code>. Marking a commitment paid records the expense and advances <code>nextDue</code> in a single atomic transaction, preventing duplicate charges from double-clicks or retries at the database level.</span>
                          </li>
                          <li>
                            <span className="proj-bullet-icon spendly-bullet">✦</span>
                            <span><strong>Concurrency Bug Discovery & Fix:</strong> Identified and eliminated race conditions where rapid double-clicking advanced two different periods by implementing per-row in-flight UI state guards and disabling buttons during pending mutation requests.</span>
                          </li>
                          <li>
                            <span className="proj-bullet-icon spendly-bullet">✦</span>
                            <span><strong>Distributed PostgreSQL Rate Limiting:</strong> Built database-persisted token bucket rate limiting in a PostgreSQL table rather than process memory, ensuring per-IP and per-account auth throttling works across stateless serverless instances with 429 Retry-After.</span>
                          </li>
                          <li>
                            <span className="proj-bullet-icon spendly-bullet">✦</span>
                            <span><strong>Timezone-Correct Date Math:</strong> All recurring schedules calculate 'today' from stored user IANA timezones instead of server clocks, correctly clamping tricky month-end rollovers (Jan 31 + 1 mo = Feb 28/29, preventing JS <code>setMonth</code> Mar 3 bug) backed by 69 passing Vitest unit tests.</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Spendly Card */}
                  <div className="proj-actions">
                    <a
                      className="proj-action-btn primary spendly-btn-primary"
                      href="https://spendlydaily.vercel.app"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
                      <span>Launch Live Platform (spendlydaily.vercel.app)</span>
                      <Icon name="arrow" />
                    </a>
                    <a
                      className="proj-action-btn secondary"
                      href="https://github.com/unnamatlaraju/expense-tracker"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon name="github" />
                      <span>View Public GitHub Repository</span>
                      <Icon name="arrow" />
                    </a>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    Project 3: Hybrid Secure Data Concealment
                ───────────────────────────────────────────────────────────── */}
                <div className="project-feature-card">
                  <div className="proj-top">
                    <span className="proj-badge">FINAL-YEAR CAPSTONE · CYBERSECURITY & LEDGER</span>
                    <span className="proj-status active">Team of 4 · VVIT</span>
                  </div>
                  <h3 className="proj-title">Hybrid Secure Data Concealment with Blockchain-Based Integrity Verification</h3>
                  <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Co-Architect & Cryptographic Security Engineer
                  </div>
                  <p className="proj-desc">
                    High-assurance multi-layer data security system protecting confidential digital communications. Encrypts payload data with symmetric AES-256, secures the secret key with asymmetric RSA, and conceals the encrypted payload within carrier images via Least Significant Bit (LSB) steganography without perceptible image distortion. Implements an immutable blockchain-inspired SHA-256 ledger where receivers validate block hashes to confirm data integrity, immediately detecting and rejecting any intercepted or tampered transmissions.
                  </p>
                  <div className="proj-tech-stack">
                    <span>Python</span>
                    <span>AES-256</span>
                    <span>RSA Encryption</span>
                    <span>SHA-256</span>
                    <span>LSB Steganography</span>
                    <span>Blockchain Ledger</span>
                    <span>Cryptographic Protocols</span>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    Project 4: Study Resources Organizer
                ───────────────────────────────────────────────────────────── */}
                <div className="project-feature-card">
                  <div className="proj-top">
                    <span className="proj-badge">MERN FULL-STACK WEB SAAS</span>
                    <span className="proj-status active">Open Source</span>
                  </div>
                  <h3 className="proj-title">Study Resources Organizer — Academic Asset Hub</h3>
                  <div style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Full-Stack Developer · Academic Productivity Platform
                  </div>
                  <p className="proj-desc">
                    Student productivity application built to organize, categorize, edit, delete, and filter learning materials (PDFs, documentation, reference links, and lecture notes). Architected modular RESTful APIs using Node.js and Express, designed indexed MongoDB schemas with Mongoose, validated endpoints thoroughly via Postman, and crafted a clean, responsive UI with React.
                  </p>
                  <div className="proj-tech-stack">
                    <span>React</span>
                    <span>Node.js</span>
                    <span>Express</span>
                    <span>MongoDB</span>
                    <span>Mongoose</span>
                    <span>RESTful APIs</span>
                    <span>Postman</span>
                    <span>CSS3</span>
                  </div>
                  <div className="proj-actions">
                    <a
                      className="proj-action-btn secondary"
                      href="https://github.com/unnamatlaraju/study-resources-app"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>View GitHub Repository</span>
                      <Icon name="arrow" />
                    </a>
                  </div>
                </div>

                {/* ─────────────────────────────────────────────────────────────
                    Project 5: Cosmic Worlds 3D
                ───────────────────────────────────────────────────────────── */}
                <div className="project-feature-card">
                  <div className="proj-top">
                    <span className="proj-badge">3D GRAPHICS & SIMULATION</span>
                    <span className="proj-status active">Active Portfolio</span>
                  </div>
                  <h3 className="proj-title">Raju Cosmic Worlds — Three.js Spaceflight & Outpost Journey</h3>
                  <div style={{ fontSize: '11px', color: '#f43f5e', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Lead Graphics Engineer & Creative Technologist
                  </div>
                  <p className="proj-desc">
                    Interactive WebGL procedural space journey with volumetric GLSL raymarched nebulae, cinematic spacecraft flight dynamics, atmospheric surface parallax, dual-agent speech guidance (Ember & Nova), and an interactive 3D character guide.
                  </p>
                  <div className="proj-tech-stack">
                    <span>Three.js</span>
                    <span>GLSL Shaders</span>
                    <span>React 19</span>
                    <span>TypeScript</span>
                    <span>Web Audio API</span>
                    <span>Vite</span>
                  </div>
                  <div className="proj-actions">
                    <a
                      className="proj-action-btn secondary"
                      href="https://github.com/unnamatlaraju/raju-cosmic-worlds"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon name="github" />
                      <span>View GitHub Repository</span>
                      <Icon name="arrow" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              2. EDUCATION DETAILS & ACADEMIC ARCHIVE
          ───────────────────────────────────────────────────────────── */}
          {activeSection === 'education' && (
            <div className="dossier-section-view entrance education-view">
              {/* Header Block with Scholar Guide Badge */}
              <div className="dossier-header-block">
                <div className="agent-badge">
                  <span className="agent-avatar">🎓</span>
                  <div className="agent-meta">
                    <strong>NOVA // SCHOLAR GUIDE</strong>
                    <small>Knowledge Custodian & Academic Vector</small>
                  </div>
                </div>
                <h2 id="dossier-heading" className="dossier-title">
                  Academic Odyssey & <br /><em>Education Journey</em>
                </h2>
                <p className="dossier-lead">
                  Rooted in strong mathematical and scientific foundations, pursuing Information Technology at VVIT, 
                  driven by an authentic passion for coding, algorithmic problem solving, and building robust modern software.
                </p>
              </div>

              {/* Main Degree Highlight Card */}
              <div className="education-degree-card">
                <div className="degree-header">
                  <div className="degree-tag">
                    <span className="dot dot-theme-accent" />
                    <span>UNDERGRADUATE DEGREE · INFORMATION TECHNOLOGY</span>
                  </div>
                  <span className="degree-period">2022 — 2026</span>
                </div>
                <h3 className="degree-name">Bachelor of Technology (B.Tech) in Information Technology</h3>
                <p className="degree-institution">
                  Vasireddy Venkatadri Institute of Technology (VVIT) · Autonomous (Affiliated to JNTUK), Guntur
                </p>
                <p className="degree-desc">
                  Pursuing a comprehensive 4-year undergraduate curriculum specializing in Information Technology. 
                  Rigorous focus on core computer science foundations, algorithm design, distributed database architecture, 
                  and modern full-stack engineering principles.
                </p>
                <div className="degree-badges">
                  <span className="d-pill">Data Structures & Algorithms</span>
                  <span className="d-pill">Algorithmic Problem Solving</span>
                  <span className="d-pill">Full-Stack Web Engineering</span>
                  <span className="d-pill">Database Management Systems</span>
                  <span className="d-pill">Object-Oriented Programming (Java / C++)</span>
                  <span className="d-pill">Operating Systems</span>
                </div>
              </div>

              {/* Academic Milestones Grid (Intermediate & High School) */}
              <div className="dossier-grid-section">
                <h4 className="dossier-subheading">Foundational Academic Milestones</h4>
                <div className="education-milestones-grid">
                  {/* Intermediate 10+2 */}
                  <div className="milestone-card">
                    <div className="milestone-header">
                      <div className="milestone-tag">
                        <span className="dot dot-emerald" />
                        <span>INTERMEDIATE (10+2) · MPC STREAM</span>
                      </div>
                      <span className="milestone-period">2020 — 2022</span>
                    </div>
                    <h4 className="milestone-title">Mathematics, Physics & Chemistry (MPC)</h4>
                    <p className="milestone-institution">Sri Chaitanya Junior College · Bhimavaram (BVRM)</p>
                    <p className="milestone-desc">
                      Intensive 2-year analytical training across advanced higher mathematics (calculus, coordinate geometry, algebra) 
                      and physical sciences. Cultivated deep mathematical logic, deductive reasoning, and quantitative problem-solving 
                      intuition essential for computer science.
                    </p>
                    <div className="milestone-badges">
                      <span className="d-pill pill-sub">Higher Mathematics</span>
                      <span className="d-pill pill-sub">Calculus & Algebra</span>
                      <span className="d-pill pill-sub">Physics & Analytical Science</span>
                      <span className="d-pill pill-sub">Chemistry & Quantitative Logic</span>
                    </div>
                  </div>

                  {/* High School 10th */}
                  <div className="milestone-card">
                    <div className="milestone-header">
                      <div className="milestone-tag">
                        <span className="dot dot-emerald" />
                        <span>SECONDARY SCHOOL CERTIFICATE (SSC)</span>
                      </div>
                      <span className="milestone-period">Completed 2020</span>
                    </div>
                    <h4 className="milestone-title">High School Curriculum (10th Standard)</h4>
                    <p className="milestone-institution">Z.P.H.S School · Kalla (High School)</p>
                    <p className="milestone-desc">
                      Comprehensive secondary education with strong foundations in mathematics and science. 
                      Built early curiosity for technology, logical reasoning, and computational problem solving.
                    </p>
                    <div className="milestone-badges">
                      <span className="d-pill pill-sub">Mathematics & Science</span>
                      <span className="d-pill pill-sub">Logical Reasoning</span>
                      <span className="d-pill pill-sub">Secondary Curriculum</span>
                      <span className="d-pill pill-sub">Foundational Sciences</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Academic & Engineering Pillars */}
              <div className="dossier-grid-section">
                <h4 className="dossier-subheading">Core Passions & Engineering Pillars</h4>
                <div className="coursework-grid">
                  <div className="course-card">
                    <div className="course-icon">⚡</div>
                    <strong>Coding & Algorithmic Problem Solving</strong>
                    <p>Core passion for algorithmic reasoning, time/space complexity optimization, data structures (trees, graphs, DP), and writing clean, scalable logic.</p>
                  </div>
                  <div className="course-card">
                    <div className="course-icon">📐</div>
                    <strong>Mathematics & Science Foundations</strong>
                    <p>MPC-rooted analytical discipline: discrete math, calculus, linear algebra, and formal proofs applied to computational precision.</p>
                  </div>
                  <div className="course-card">
                    <div className="course-icon">🗄️</div>
                    <strong>Database Design & Systems Architecture</strong>
                    <p>Relational schema design, SQL querying, data normalization, transactional integrity (ACID), and robust backend data storage.</p>
                  </div>
                  <div className="course-card">
                    <div className="course-icon">🌐</div>
                    <strong>Full-Stack Software Development</strong>
                    <p>Translating theoretical knowledge into production code, modular component architecture, RESTful APIs, and responsive interactive web experiences.</p>
                  </div>
                </div>
              </div>

              {/* Technical Foundations Matrix */}
              <div className="dossier-grid-section">
                <h4 className="dossier-subheading">Technical Skill Matrix</h4>
                <div className="skill-matrix-grid">
                  <div className="skill-col">
                    <span className="skill-col-title">Languages & Core</span>
                    <div className="skill-tags">
                      <span>C++</span>
                      <span>Java</span>
                      <span>Python</span>
                      <span>JavaScript</span>
                      <span>TypeScript</span>
                      <span>SQL</span>
                    </div>
                  </div>
                  <div className="skill-col">
                    <span className="skill-col-title">Frontend & Web</span>
                    <div className="skill-tags">
                      <span>React 19</span>
                      <span>HTML5 / Modern CSS</span>
                      <span>Tailwind CSS</span>
                      <span>Next.js</span>
                      <span>Three.js / WebGL</span>
                    </div>
                  </div>
                  <div className="skill-col">
                    <span className="skill-col-title">Backend & Tools</span>
                    <div className="skill-tags">
                      <span>Node.js</span>
                      <span>Express</span>
                      <span>PostgreSQL</span>
                      <span>Git & GitHub</span>
                      <span>REST APIs</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              3. SKILLS & ARCHITECTURAL STACK
          ───────────────────────────────────────────────────────────── */}
          {(activeSection === 'skills' || activeSection === 'vidyu') && (
            <div className="dossier-section-view entrance skills-view">
              <div className="dossier-header-block">
                <div className="agent-badge">
                  <span className="agent-avatar">⚡</span>
                  <div className="agent-meta">
                    <strong>NOVA // TECHNICAL ARCHITECT</strong>
                    <small>Engineering Arsenal & Architecture Matrix</small>
                  </div>
                </div>
                <h2 id="dossier-heading" className="dossier-title">
                  Technical Arsenal & <br /><em>Engineering Capabilities</em>
                </h2>
                <p className="dossier-lead">
                  Comprehensive technology stack, system design patterns, concurrency controls, and high-assurance security protocols engineered by Raju Unnamatla across production web platforms.
                </p>
              </div>

              {/* Core Architectural Capabilities Grid */}
              <div className="dossier-grid-section">
                <h4 className="dossier-subheading">Core Architectural Capabilities</h4>
                <div className="skills-capabilities-grid">
                  <div className="capability-card">
                    <div className="cap-icon">🔄</div>
                    <strong>Idempotent Transaction Design</strong>
                    <p>Database-enforced atomic transitions using compound unique constraints on <code>(entityId, period)</code>, guaranteeing zero duplicate payments or side-effects during network retries or concurrent clicks.</p>
                    <div className="cap-meta">Deployed in Spendly & Vidyu Billing</div>
                  </div>

                  <div className="capability-card">
                    <div className="cap-icon">🛡️</div>
                    <strong>Serverless Distributed Rate Limiting</strong>
                    <p>Database-persisted token-bucket rate limiting in PostgreSQL instead of volatile memory, enforcing per-IP and per-account auth brute-force protection across stateless Vercel edge instances with <code>429 Retry-After</code>.</p>
                    <div className="cap-meta">Spendly Auth & Vidyu Portals</div>
                  </div>

                  <div className="capability-card">
                    <div className="cap-icon">🔐</div>
                    <strong>Cryptographic Security & Zero-Trust</strong>
                    <p>Multi-layered data security with AES-256 symmetric encryption, RSA key exchange, SHA-256 cryptographic ledgers for tamper detection, bcrypt password hashing, and httpOnly signed JWT cookies.</p>
                    <div className="cap-meta">Hybrid Data Concealment & Portals</div>
                  </div>

                  <div className="capability-card">
                    <div className="cap-icon">📍</div>
                    <strong>Real-Time Geospatial & Push Telemetry</strong>
                    <p>Sub-second GIS tracking using Leaflet and Firebase Cloud Messaging (FCM) background push notifications, delivering low-latency arrival telemetry to real-device mobile clients.</p>
                    <div className="cap-meta">Vidyu Driver Bus Tracker</div>
                  </div>

                  <div className="capability-card">
                    <div className="cap-icon">🤖</div>
                    <strong>AI Multimodal OCR & Heuristic Engines</strong>
                    <p>Automated marksheet parsing and document digitization via Google Gemini API, paired with custom algorithmic substitution engines to solve complex scheduling conflicts in real time.</p>
                    <div className="cap-meta">Vidyu Academic AI Engine</div>
                  </div>

                  <div className="capability-card">
                    <div className="cap-icon">🌐</div>
                    <strong>3D WebGL Shaders & Interactive Simulation</strong>
                    <p>Volumetric GLSL raymarching, procedural particle systems, realistic orbit physics, and high-performance WebGL rendering at 60 FPS using Three.js and custom GLSL fragment shaders.</p>
                    <div className="cap-meta">Raju Cosmic Worlds Portfolio</div>
                  </div>
                </div>
              </div>

              {/* Complete Technology Matrix */}
              <div className="dossier-grid-section">
                <h4 className="dossier-subheading">Full Technology Stack & Tooling</h4>
                <div className="tech-matrix-grid">
                  <div className="matrix-category-card">
                    <div className="matrix-cat-header">
                      <span className="matrix-icon">💻</span>
                      <span>Languages & Core</span>
                    </div>
                    <div className="matrix-pills">
                      <span className="m-pill">TypeScript 5.9</span>
                      <span className="m-pill">JavaScript (ESNext)</span>
                      <span className="m-pill">Python</span>
                      <span className="m-pill">C++</span>
                      <span className="m-pill">Java</span>
                      <span className="m-pill">SQL</span>
                      <span className="m-pill">GLSL</span>
                    </div>
                  </div>

                  <div className="matrix-category-card">
                    <div className="matrix-cat-header">
                      <span className="matrix-icon">⚛️</span>
                      <span>Frontend & UI</span>
                    </div>
                    <div className="matrix-pills">
                      <span className="m-pill">React 19</span>
                      <span className="m-pill">Next.js 15 (App Router)</span>
                      <span className="m-pill">Tailwind CSS v4</span>
                      <span className="m-pill">Radix UI</span>
                      <span className="m-pill">Recharts</span>
                      <span className="m-pill">Three.js / WebGL</span>
                      <span className="m-pill">Web Speech API</span>
                    </div>
                  </div>

                  <div className="matrix-category-card">
                    <div className="matrix-cat-header">
                      <span className="matrix-icon">🗄️</span>
                      <span>Backend & Databases</span>
                    </div>
                    <div className="matrix-pills">
                      <span className="m-pill">Node.js</span>
                      <span className="m-pill">Express</span>
                      <span className="m-pill">PostgreSQL</span>
                      <span className="m-pill">Supabase</span>
                      <span className="m-pill">Prisma 6 ORM</span>
                      <span className="m-pill">MongoDB Atlas</span>
                      <span className="m-pill">RESTful APIs</span>
                    </div>
                  </div>

                  <div className="matrix-category-card">
                    <div className="matrix-cat-header">
                      <span className="matrix-icon">☁️</span>
                      <span>Cloud & DevOps</span>
                    </div>
                    <div className="matrix-pills">
                      <span className="m-pill">Vercel (Serverless / Edge)</span>
                      <span className="m-pill">AWS (Glue, S3, Redshift)</span>
                      <span className="m-pill">Firebase (FCM, Auth)</span>
                      <span className="m-pill">Git & GitHub</span>
                      <span className="m-pill">CI/CD Pipelines</span>
                      <span className="m-pill">Vitest Testing</span>
                      <span className="m-pill">Postman</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              4. ACHIEVEMENTS & MILESTONES
          ───────────────────────────────────────────────────────────── */}
          {activeSection === 'achievements' && (
            <div className="dossier-section-view entrance">
              <div className="dossier-header-block">
                <div className="agent-badge">
                  <span className="agent-avatar">🏆</span>
                  <div className="agent-meta">
                    <strong>TITAN // HONOR SENTINEL</strong>
                    <small>Verified Records & Milestone Overseer</small>
                  </div>
                </div>
                <h2 id="dossier-heading" className="dossier-title">
                  Certifications & <br /><em>Verified Milestones</em>
                </h2>
                <p className="dossier-lead">
                  Verified industry credentials, competitive accomplishments, and specialized coursework completed by Raju Unnamatla.
                </p>
              </div>

              <div className="achievements-timeline">
                {/* 1. AWS Academy Graduate */}
                <div className="achieve-card">
                  <div className="achieve-medal">☁️</div>
                  <div className="achieve-content">
                    <div className="achieve-topline">
                      <span className="achieve-tag">AWS CERTIFICATION</span>
                      <span className="achieve-date">Nov 2024</span>
                    </div>
                    <h3>AWS Academy Graduate — Data Engineering</h3>
                    <p>Issued by AWS Training and Certification. Comprehensive training in distributed cloud data pipelines, Amazon S3, AWS Glue, Amazon Redshift, and big-data engineering architectures.</p>
                  </div>
                </div>

                {/* 2. AI-ML Virtual Internship */}
                <div className="achieve-card">
                  <div className="achieve-medal">🧠</div>
                  <div className="achieve-content">
                    <div className="achieve-topline">
                      <span className="achieve-tag">AICTE / GOOGLE FOR DEVELOPERS</span>
                      <span className="achieve-date">Oct — Dec 2024</span>
                    </div>
                    <h3>AI-ML Virtual Internship</h3>
                    <p>Awarded by EduSkills, AICTE, and Google for Developers. Intensive hands-on curriculum covering foundational machine learning algorithms, model training, computer vision, and neural network deployments.</p>
                  </div>
                </div>

                {/* 3. Cisco Cybersecurity */}
                <div className="achieve-card">
                  <div className="achieve-medal">🛡️</div>
                  <div className="achieve-content">
                    <div className="achieve-topline">
                      <span className="achieve-tag">CISCO NETWORKING ACADEMY</span>
                      <span className="achieve-date">Dec 2024</span>
                    </div>
                    <h3>Introduction to Cybersecurity</h3>
                    <p>Certified in core cyber defense principles, threat identification, network protection, cryptographic protocols, and organizational data privacy standards.</p>
                  </div>
                </div>

                {/* 4. MongoDB */}
                <div className="achieve-card">
                  <div className="achieve-medal">🍃</div>
                  <div className="achieve-content">
                    <div className="achieve-topline">
                      <span className="achieve-tag">MONGODB CREDENTIAL</span>
                      <span className="achieve-date">Dec 2024 & Feb 2025</span>
                    </div>
                    <h3>MongoDB Atlas & MongoDB for Students</h3>
                    <p>Certified in document database architecture, complex aggregation pipelines, performance indexing, and cloud-native deployment on MongoDB Atlas.</p>
                  </div>
                </div>

                {/* 5. Hashgraph */}
                <div className="achieve-card">
                  <div className="achieve-medal">⛓️</div>
                  <div className="achieve-content">
                    <div className="achieve-topline">
                      <span className="achieve-tag">THE HASHGRAPH ASSOCIATION</span>
                      <span className="achieve-date">Aug 2025</span>
                    </div>
                    <h3>The Hashgraph Developer Course</h3>
                    <p>Completed official developer coursework on asynchronous Byzantine Fault Tolerance (aBFT) consensus, distributed ledger technologies, and cryptographic ledger verification.</p>
                  </div>
                </div>

                {/* 6. Algorithmic Problem Solving */}
                <div className="achieve-card">
                  <div className="achieve-medal">⚡</div>
                  <div className="achieve-content">
                    <div className="achieve-topline">
                      <span className="achieve-tag">CORE PASSION</span>
                      <span className="achieve-date">Continuous</span>
                    </div>
                    <h3>Algorithmic Problem Solving & Coding Excellence</h3>
                    <p>Relentless focus on data structures, algorithmic complexity optimization, and mathematical problem solving across complex real-world engineering challenges.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

        {/* Footer Navigation Bar */}
        <div className="dossier-footer">
          <div className="dossier-footer-info">
            <span className="status-dot" />
            <span>Raju Cosmic Worlds · Interactive Expedition Vector</span>
          </div>
          <button className="dossier-return-btn" onClick={onClose}>
            <span>← Return to Canyon Outpost</span>
          </button>
        </div>
        </div>
      </div>

      {/* Cosmic Farewell Finale Modal: Both Bots Say Thank You and Bye in Real-Time 3D */}
      <CosmicFarewellModal
        isOpen={showFarewellModal}
        onBackToUniverse={() => {
          setShowFarewellModal(false)
          if (onReturnHome) {
            onReturnHome()
          } else {
            onClose()
          }
        }}
      />
    </dialog>
  )
}
