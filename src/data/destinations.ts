export type DestinationId = 'vidyu' | 'learning' | 'achievements' | 'about' | 'contact'

export interface Destination {
  id: DestinationId
  name: string
  theme: string
  available: boolean
  color: string
}

// A destination registry for future worlds. Only Vidyu's arrival marker exists in Stage 1.
export const destinations: readonly Destination[] = [
  { id: 'vidyu', name: 'Vidyu World', theme: 'Product building & software engineering', available: true, color: '#bba6ff' },
  { id: 'learning', name: 'Learning World', theme: 'Education, skills & certifications', available: false, color: '#7fbfdc' },
  { id: 'achievements', name: 'Achievement World', theme: 'Verified achievements & milestones', available: false, color: '#d5b18b' },
  { id: 'about', name: 'About Me World', theme: 'Introduction, interests & ambitions', available: false, color: '#a4c9b9' },
  { id: 'contact', name: 'Final Portal', theme: 'Contact, professional links & résumé', available: false, color: '#c4a8c9' },
]
