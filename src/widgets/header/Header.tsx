import { useState, useEffect, useRef, type JSX } from 'react'
import { formatRange } from "../../shared/lib/date/formatRange.ts"
import { ViewSwitcher } from "./ui/ViewSwitcher.tsx"
import "./ui/Header.css"
import { useApp } from "../../app/providers/CalendarProvider.tsx"
import { Navigation } from "./ui/Navigation.tsx"
import type { AppSection } from "../../app/providers/applicationTypes.ts"

const SECTIONS: { id: AppSection; name: string; icon: JSX.Element; disabled?: boolean }[] = [
  {
    id: 'dashboard',
    name: 'Рабочий стол',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1.5"/>
        <rect x="14" y="3" width="7" height="5" rx="1.5"/>
        <rect x="14" y="12" width="7" height="9" rx="1.5"/>
        <rect x="3" y="16" width="7" height="5" rx="1.5"/>
      </svg>
    ),
  },
  {
    id: 'calendar',
    name: 'Календарь',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    id: 'budget',
    name: 'Бюджет',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="22" x2="21" y2="22"/>
        <line x1="6" y1="18" x2="6" y2="11"/>
        <line x1="10" y1="18" x2="10" y2="11"/>
        <line x1="14" y1="18" x2="14" y2="11"/>
        <line x1="18" y1="18" x2="18" y2="11"/>
        <polygon points="12 2 20 7 4 7"/>
      </svg>
    ),
  },
  {
    id: 'tracker',
    name: 'Трекер',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="10" y1="6" x2="21" y2="6"/>
        <line x1="10" y1="12" x2="21" y2="12"/>
        <line x1="10" y1="18" x2="21" y2="18"/>
        <polyline points="3 6 4 7 6 5"/>
        <polyline points="3 12 4 13 6 11"/>
        <polyline points="3 18 4 19 6 17"/>
      </svg>
    ),
  },
  {
    id: 'tasks',
    name: 'Задачи',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
  },
]

export function Header() {
  const { selectedDay, view, appSection, setAppSection } = useApp()
  const currentDate = formatRange(selectedDay, view)

  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const current = SECTIONS.find(s => s.id === appSection) ?? SECTIONS[0]

  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handleOutside)
    return () => window.removeEventListener('mousedown', handleOutside)
  }, [open])

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  function handleSelect(section: AppSection) {
    setAppSection(section)
    setOpen(false)
  }

  return (
    <>
    <header className="header">
      <div className="header-apps">
        <nav className="section-tabs">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`section-tab${s.id === appSection ? ' section-tab--active' : ''}${s.disabled ? ' section-tab--disabled' : ''}`}
              onClick={() => !s.disabled && setAppSection(s.id)}
              disabled={s.disabled}
              title={s.name}
            >
              <span className="section-tab-icon">{s.icon}</span>
              <span className="section-tab-name">{s.name}</span>
            </button>
          ))}
        </nav>

        <div className="section-switcher" ref={wrapperRef}>
          <button
            className={`section-trigger${open ? ' section-trigger--open' : ''}`}
            onClick={() => setOpen(o => !o)}
          >
            <span className="section-trigger-icon" style={{ color: '#1a73e8' }}>{current.icon}</span>
            <span className="section-trigger-name">{current.name}</span>
            <svg
              className={`section-trigger-chevron${open ? ' section-trigger-chevron--up' : ''}`}
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {open && (
            <div className="section-dropdown">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  className={`section-dropdown-item${s.id === appSection ? ' section-dropdown-item--active' : ''}${s.disabled ? ' section-dropdown-item--disabled' : ''}`}
                  onClick={() => !s.disabled && handleSelect(s.id)}
                  disabled={s.disabled}
                >
                  <span className="section-dropdown-icon">{s.icon}</span>
                  <span className="section-dropdown-name">{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <button className="account-button">С</button>
    </header>

    {appSection === 'calendar' && (
      <div className="header-sub">
        <Navigation />
        <div className="current-date">{currentDate}</div>
        <ViewSwitcher />
      </div>
    )}
    </>
  )
}
