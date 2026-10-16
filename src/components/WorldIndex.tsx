import { useEffect, useRef } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { destinations } from '../data/destinations'
import { Icon } from './Icon'

interface Props { open: boolean; onClose: () => void; onExplore: () => void; arrived: boolean }

export function WorldIndex({ open, onClose, onExplore, arrived }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) element.showModal()
    else if (!open && element.open) element.close()
  }, [open])

  const wrapFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== 'Tab') return
    const controls = dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
    if (!controls?.length) return
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <dialog ref={dialog} className="world-index" aria-labelledby="world-index-title" aria-describedby="world-index-description" onClose={onClose} onKeyDown={wrapFocus} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="index-inner">
        <div className="index-topline"><span className="eyebrow">THE COSMIC ATLAS</span><button className="icon-button" onClick={onClose} aria-label="Close world index" autoFocus><Icon name="close" /></button></div>
        <h2 id="world-index-title">Every world,<br />a different <em>story.</em></h2>
        <p id="world-index-description">A small universe, unfolding one world at a time. Begin with a first look at Vidyu.</p>
        <ol className="world-list">
          {destinations.map((destination, index) => (
            <li key={destination.id} style={{ '--world-color': destination.color } as CSSProperties}>
              <span className="world-number">0{index + 1}</span>
              <span className="world-dot" aria-hidden="true" />
              <div className="world-details"><h3>{destination.name}</h3><p>{destination.theme}</p></div>
              {destination.available ? <button className="world-visit" onClick={() => { onClose(); if (!arrived) onExplore() }} aria-label={arrived ? 'Return to Vidyu World view' : 'Visit Vidyu World'}>{arrived ? 'You’re here' : 'First look'}<Icon name="arrow" /></button> : <span className="future-label">Future <br />destination</span>}
            </li>
          ))}
        </ol>
        <p className="index-footnote"><span className="status-dot" /> Stage 1 · The gateway is open. More stories are on the horizon.</p>
      </div>
    </dialog>
  )
}
