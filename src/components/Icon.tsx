interface IconProps {
  name: 'arrow' | 'back' | 'grid' | 'close' | 'orbit' | 'spark' | 'motion' | 'ship' | 'linkedin' | 'github' | 'mail' | 'download' | 'file'
  className?: string
}

export function Icon({ name, className = '' }: IconProps) {
  return (
    <svg className={`icon ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {name === 'arrow' && <><path d="M4 12h15M13 6l6 6-6 6" /></>}
      {name === 'back' && <path d="M20 12H5m6-6-6 6 6 6" />}
      {name === 'grid' && <><rect x="4" y="4" width="5" height="5" rx="1" /><rect x="15" y="4" width="5" height="5" rx="1" /><rect x="4" y="15" width="5" height="5" rx="1" /><rect x="15" y="15" width="5" height="5" rx="1" /></>}
      {name === 'close' && <path d="m6 6 12 12M6 18 18 6" />}
      {name === 'orbit' && <><circle cx="12" cy="12" r="4.5" /><ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-35 12 12)" /><path d="M19 2v4m-2-2h4" /></>}
      {name === 'spark' && <path d="m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3L12 2Z" />}
      {name === 'motion' && <><circle cx="12" cy="12" r="3" /><path d="M19 7a8.6 8.6 0 0 1-1 12M5 17A8.6 8.6 0 0 1 6 5M17 3l2 4 3-3M2 20l3-3 2 4" /></>}
      {name === 'ship' && <><path d="M12 3c3.5 1.1 5.6 4.7 5.6 9.1L12 18l-5.6-5.9C6.4 7.7 8.5 4.1 12 3Z" /><path d="m8.1 14.3-3.4 1.1 3.7 2.2M15.9 14.3l3.4 1.1-3.7 2.2M10.2 19.3 12 22l1.8-2.7" /><circle cx="12" cy="9.4" r="1.35" /></>}
      {name === 'linkedin' && <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></>}
      {name === 'github' && <><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></>}
      {name === 'mail' && <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>}
      {name === 'download' && <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>}
      {name === 'file' && <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></>}
    </svg>
  )
}
