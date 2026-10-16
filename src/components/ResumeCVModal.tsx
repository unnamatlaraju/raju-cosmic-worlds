import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Icon } from './Icon'

interface ResumeCVModalProps {
  open: boolean
  onClose: () => void
}

export function ResumeCVModal({ open, onClose }: ResumeCVModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [activeTab, setActiveTab] = useState<'resume' | 'cv'>('resume')

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

  return (
    <dialog
      ref={dialogRef}
      className="resumecv-modal"
      aria-labelledby="resumecv-title"
      onClose={onClose}
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="resumecv-inner">
        {/* Top Header Toolbar with Proper Back Button at Top */}
        <div className="resumecv-header">
          {/* Top Bar: Back Button, Tab Switcher, Download Actions */}
          <div className="resumecv-top-bar">
            {/* Proper Back Button */}
            <button
              type="button"
              className="resumecv-back-btn"
              onClick={onClose}
              aria-label="Back to Universe"
              title="Return to Universe"
            >
              <Icon name="back" />
              <span>Back</span>
            </button>

            {/* Tab Switcher */}
            <div className="resumecv-tabs-pill">
              <button
                type="button"
                className={`resumecv-tab ${activeTab === 'resume' ? 'active' : ''}`}
                onClick={() => setActiveTab('resume')}
                aria-selected={activeTab === 'resume'}
              >
                <Icon name="file" />
                <span>Resume</span>
              </button>
              <button
                type="button"
                className={`resumecv-tab ${activeTab === 'cv' ? 'active' : ''}`}
                onClick={() => setActiveTab('cv')}
                aria-selected={activeTab === 'cv'}
              >
                <Icon name="spark" />
                <span>Curriculum Vitae</span>
              </button>
            </div>

            {/* Download Actions (Clean glass pills, no X button) */}
            <div className="resumecv-actions">
              <a
                href="/raju-resume.pdf"
                download="Raju_Unnamatla_Resume.pdf"
                className="glass-dl-btn"
                title="Download official Resume PDF"
              >
                <Icon name="download" />
                <span>Download Resume</span>
              </a>
              <a
                href="/raju-cv.pdf"
                download="Raju_Unnamatla_CV.pdf"
                className="glass-dl-btn"
                title="Download official CV PDF"
              >
                <Icon name="download" />
                <span>Download CV</span>
              </a>
            </div>
          </div>

          {/* Sub Row: Pilot Credentials Title Group */}
          <div className="resumecv-title-row">
            <div className="resumecv-title-group">
              <div className="resumecv-eyebrow">
                <span className="resumecv-dot" />
                <span>PILOT CREDENTIALS // VERIFIED DOSSIER</span>
              </div>
              <h2 id="resumecv-title" className="resumecv-heading">
                Raju Unnamatla <span className="resumecv-role">· Software Engineer</span>
              </h2>
            </div>
          </div>
        </div>

        {/* Document Content Viewport */}
        <div className="resumecv-body">
          {activeTab === 'resume' ? (
            <article className="document-sheet">
              <header className="sheet-header">
                <div className="sheet-headline">
                  <h1>RAJU UNNAMATLA</h1>
                  <p className="sheet-subtitle">Full-Stack Software Engineer & Distributed Systems Developer</p>
                </div>
                <div className="sheet-meta-grid">
                  <span><strong>Email:</strong> rajurockstar435@gmail.com</span>
                  <span><strong>LinkedIn:</strong> linkedin.com/in/raju-unnamatla</span>
                  <span><strong>GitHub:</strong> github.com/unnamatlaraju</span>
                  <span><strong>Location:</strong> India · Open to Remote / Relocation</span>
                </div>
              </header>

              <hr className="sheet-divider" />

              <section className="sheet-section">
                <h2>PROFESSIONAL SUMMARY</h2>
                <p>
                  High-performing Full-Stack Engineer with specialized expertise architecting production web applications,
                  idempotent transactional workflows, relational data models, and immersive responsive frontends.
                  Proven capability shipping complete products from zero to production with Next.js 15, React 19, TypeScript,
                  PostgreSQL, Prisma ORM, and high-security REST APIs.
                </p>
              </section>

              <section className="sheet-section">
                <h2>CORE TECHNICAL SKILLS</h2>
                <div className="skills-grid">
                  <div className="skill-item">
                    <strong>Languages:</strong> TypeScript, JavaScript (ESNext), Python, SQL, C++, HTML5/CSS3
                  </div>
                  <div className="skill-item">
                    <strong>Frontend:</strong> React 19, Next.js 15 (App Router), Tailwind CSS v4, Radix UI, Three.js, Canvas API
                  </div>
                  <div className="skill-item">
                    <strong>Backend:</strong> Node.js, Express, REST APIs, PostgreSQL, Prisma ORM, Supabase, Serverless
                  </div>
                  <div className="skill-item">
                    <strong>Architecture & Security:</strong> Idempotent payment processing, Postgres rate limiting, JWT (jose), bcrypt, Zod schema validation
                  </div>
                  <div className="skill-item">
                    <strong>Testing & DevOps:</strong> Vitest, Vercel, Git, GitHub Actions, Linux, Lighthouse Optimization
                  </div>
                </div>
              </section>

              <section className="sheet-section">
                <h2>FEATURED PRODUCTION PROJECTS</h2>

                <div className="project-entry">
                  <div className="entry-header">
                    <h3>Spendly — Full-Stack Personal Finance & Commitment Engine</h3>
                    <span className="entry-tag">Live Production · Next.js 15, PostgreSQL, Prisma, Vitest</span>
                  </div>
                  <ul className="entry-bullets">
                    <li>Designed and shipped a production expense and recurring commitment tracker live on Vercel with Supabase PostgreSQL (ap-south-1).</li>
                    <li>Engineered an idempotent recurring payment engine with database compound unique constraints on <code>(commitmentId, periodStart)</code>, guaranteeing no duplicate period billing during retries or races.</li>
                    <li>Implemented a serverless-safe PostgreSQL-backed rate limiter across distributed stateless instances with per-IP and per-account thresholds.</li>
                    <li>Constructed timezone-correct recurring schedule advancement with month-end clamping logic backed by 69 passing Vitest unit tests.</li>
                    <li>Achieved a flawless 100/100/100 Lighthouse audit score across Accessibility, Best Practices, and SEO.</li>
                  </ul>
                </div>

                <div className="project-entry">
                  <div className="entry-header">
                    <h3>Vidyu — Multi-Tenant School Management & EdTech SaaS</h3>
                    <span className="entry-tag">Full-Stack SaaS Platform · React, Node.js, Cloud DB</span>
                  </div>
                  <ul className="entry-bullets">
                    <li>Architected an enterprise-ready school management system coordinating multi-role access (Admin, Teachers, Students, Parents).</li>
                    <li>Built dynamic fee ledger reconciliation, student attendance analytics, and automated progress report generation.</li>
                    <li>Engineered responsive dashboards with granular authorization controls and zero data leakage across organizational boundaries.</li>
                  </ul>
                </div>

                <div className="project-entry">
                  <div className="entry-header">
                    <h3>BTech CSE Resource Hub</h3>
                    <span className="entry-tag">Academic Resource Ecosystem · Full-Stack Web</span>
                  </div>
                  <ul className="entry-bullets">
                    <li>Built a structured digital repository organizing computer science curricula, lecture notes, lab manuals, and previous examination blueprints.</li>
                    <li>Integrated real-time search, categorization by semester and branch, and fast document preview infrastructure.</li>
                  </ul>
                </div>
              </section>

              <section className="sheet-section">
                <h2>EDUCATION</h2>
                <div className="education-entry">
                  <div className="entry-header">
                    <h3>Bachelor of Technology (B.Tech) in Computer Science & Engineering</h3>
                  </div>
                  <p className="education-meta">Relevant Coursework: Data Structures & Algorithms, Database Management Systems, Operating Systems, Computer Networks, Object-Oriented Software Design, Web Technologies.</p>
                </div>
              </section>
            </article>
          ) : (
            <article className="document-sheet">
              <header className="sheet-header">
                <div className="sheet-headline">
                  <h1>RAJU UNNAMATLA</h1>
                  <p className="sheet-subtitle">Comprehensive Curriculum Vitae · Software Systems & Architecture</p>
                </div>
                <div className="sheet-meta-grid">
                  <span><strong>Email:</strong> rajurockstar435@gmail.com</span>
                  <span><strong>LinkedIn:</strong> linkedin.com/in/raju-unnamatla</span>
                  <span><strong>GitHub:</strong> github.com/unnamatlaraju</span>
                  <span><strong>Portfolio:</strong> Raju Cosmic Worlds</span>
                </div>
              </header>

              <hr className="sheet-divider" />

              <section className="sheet-section">
                <h2>VITA & ENGINEERING PHILOSOPHY</h2>
                <p>
                  Full-Stack Software Engineer dedicated to precision, database integrity, and high-impact software systems.
                  Specialized in translating intricate domain requirements into resilient system architectures with verified unit tests,
                  defense-in-depth security principles, and clean user experience.
                </p>
              </section>

              <section className="sheet-section">
                <h2>DETAILED SYSTEMS ENGINEERING & ARCHITECTURE</h2>
                
                <div className="project-entry">
                  <div className="entry-header">
                    <h3>Distributed Idempotency & Concurrency Hardening</h3>
                  </div>
                  <p>
                    Engineered robust transaction isolation protocols for financial logging. Designed compound unique constraints
                    preventing race conditions in multi-threaded asynchronous requests. Implemented client-side in-flight mutex guards
                    coupled with database row locks to guarantee zero double-spend anomalies across edge environments.
                  </p>
                </div>

                <div className="project-entry">
                  <div className="entry-header">
                    <h3>Serverless Rate Limiting & Denial-of-Service Defense</h3>
                  </div>
                  <p>
                    Developed PostgreSQL fixed-window rate limiter utilizing atomic upserts to enforce IP and account-level throttles
                    across stateless serverless function instances, returning RFC-compliant 429 status codes with Retry-After headers.
                  </p>
                </div>

                <div className="project-entry">
                  <div className="entry-header">
                    <h3>Defensive API Design & Access Control Scoping</h3>
                  </div>
                  <p>
                    Enforced strict object-level authorization (IDOR protection) on 100% of API endpoints. Implemented mass-assignment
                    sanitization via Zod schemas, constant-time bcrypt execution against account enumeration, and hardened safe redirect paths.
                  </p>
                </div>
              </section>

              <section className="sheet-section">
                <h2>ACADEMIC & TECHNICAL CURRICULUM</h2>
                <div className="skills-grid">
                  <div className="skill-item">
                    <strong>Algorithmic Foundations:</strong> Computational complexity (Big-O), graph theory, tree traversals, dynamic programming, sorting & searching algorithms.
                  </div>
                  <div className="skill-item">
                    <strong>Database Engineering:</strong> ACID guarantees, transaction isolation levels, indexing strategies (B-Tree, Compound, Unique), relational schema normalization (3NF/BCNF).
                  </div>
                  <div className="skill-item">
                    <strong>Operating Systems & Networking:</strong> Concurrency, processes & threads, memory allocation, TCP/IP, HTTP/1.1 to HTTP/3 protocols, DNS, SSL/TLS handshakes.
                  </div>
                </div>
              </section>

              <section className="sheet-section">
                <h2>HONORS & MILESTONES</h2>
                <ul className="entry-bullets">
                  <li><strong>Lighthouse Triple 100 Certification:</strong> Engineered Spendly to score 100 on Accessibility, 100 on Best Practices, and 100 on SEO.</li>
                  <li><strong>Automated Test Suite:</strong> Authored 69 passing Vitest unit tests covering complex recurring calendar mechanics and timezone calculations.</li>
                  <li><strong>Production Deployments:</strong> Successfully deployed high-concurrency web applications across Vercel edge networks and Supabase Postgres clusters.</li>
                </ul>
              </section>
            </article>
          )}
        </div>
      </div>
    </dialog>
  )
}
