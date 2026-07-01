import { useState, useEffect, useRef, type JSX } from 'react'
import { formatRange } from "../../shared/lib/date/formatRange.ts"
import { ViewSwitcher } from "./ui/ViewSwitcher.tsx"
import "./ui/Header.css"
import { useApp } from "../../app/providers/CalendarProvider.tsx"
import { Navigation } from "./ui/Navigation.tsx"
import type { AppSection } from "../../app/providers/applicationTypes.ts"

const SECTIONS: { id: AppSection; name: string; icon: JSX.Element; disabled?: boolean }[] = [
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
    id: 'budget',
    name: 'Бюджет',
    disabled: true,
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
    <header className="header">
      <div className="header-left">
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

        {appSection === 'calendar' && (
          <>
            <Navigation />
            <div className="current-date">{currentDate}</div>
          </>
        )}
      </div>

      <div className="header-right">
        {appSection === 'calendar' && <ViewSwitcher />}
        <button className="account-button">С</button>
      </div>
    </header>
  )
}
