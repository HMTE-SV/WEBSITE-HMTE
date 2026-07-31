import type { AdminNavIcon } from '@/data/admin-nav'

export function AdminIcon({ name }: { name: AdminNavIcon }) {
  const props = {
    'aria-hidden': true,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  }

  if (name === 'dashboard') return <svg {...props}><path d="M4 4h6v6H4zM14 4h6v10h-6zM4 14h6v6H4zM14 18h6v2h-6z" /></svg>
  if (name === 'announcement') return <svg {...props}><path d="M4 13V9l13-5v14L4 13Z" /><path d="M7 14v5h4l-1-4M17 9h3M18 6l2-2M18 16l2 2" /></svg>
  if (name === 'calendar') return <svg {...props}><path d="M5 4h14a1 1 0 0 1 1 1v15H4V5a1 1 0 0 1 1-1ZM8 2v4M16 2v4M4 9h16" /><path d="M8 13h2M14 13h2M8 17h2" /></svg>
  if (name === 'article') return <svg {...props}><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 12h7M9 16h7" /></svg>
  if (name === 'page') return <svg {...props}><path d="M5 3h14v18H5zM8 7h8M8 11h8M8 15h5" /></svg>
  if (name === 'gallery') return <svg {...props}><rect x="3" y="4" width="18" height="16" rx="1" /><circle cx="9" cy="10" r="2" /><path d="m4 18 5-4 3 2 3-3 5 5" /></svg>
  if (name === 'media') return <svg {...props}><path d="M3 6h7l2 2h9v11H3z" /><circle cx="9" cy="13" r="2" /><path d="m4 18 4-3 3 2 3-3 5 4" /></svg>
  if (name === 'history') return <svg {...props}><path d="M4 5v5h5M5 10a8 8 0 1 1 2 7" /><path d="M12 7v5l3 2" /></svg>
  if (name === 'people') return <svg {...props}><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v1" /></svg>
  if (name === 'program') return <svg {...props}><path d="M4 6h16M4 12h16M4 18h16" /><rect x="6" y="4" width="5" height="4" rx="1" /><rect x="12" y="10" width="7" height="4" rx="1" /><rect x="7" y="16" width="6" height="4" rx="1" /></svg>
  if (name === 'division') return <svg {...props}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
  if (name === 'inbox') return <svg {...props}><path d="M4 4h16v16H4zM4 14h5l2 3h2l2-3h5" /><path d="M8 9h8" /></svg>

  return <svg {...props}><circle cx="12" cy="12" r="3" /><path d="M19 15a2 2 0 0 0 .4 2.2l.1.1-2.2 2.2-.1-.1A2 2 0 0 0 15 19a2 2 0 0 0-1 1.8v.2h-4v-.2A2 2 0 0 0 9 19a2 2 0 0 0-2.2.4l-.1.1-2.2-2.2.1-.1A2 2 0 0 0 5 15a2 2 0 0 0-1.8-1H3v-4h.2A2 2 0 0 0 5 9a2 2 0 0 0-.4-2.2l-.1-.1 2.2-2.2.1.1A2 2 0 0 0 9 5a2 2 0 0 0 1-1.8V3h4v.2A2 2 0 0 0 15 5a2 2 0 0 0 2.2-.4l.1-.1 2.2 2.2-.1.1A2 2 0 0 0 19 9a2 2 0 0 0 1.8 1h.2v4h-.2A2 2 0 0 0 19 15Z" /></svg>
}
