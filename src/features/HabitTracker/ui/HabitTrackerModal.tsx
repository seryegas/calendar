import { useState, useEffect } from 'react'
import { HABITS, MOCK_ENTRIES, MONTHS } from '../model/mockData'
import './HabitTrackerModal.css'

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

type Props = {
  onClose: () => void
}

export function HabitTrackerModal({ onClose }: Props) {
  const [selectedMonth, setSelectedMonth] = useState('2026-06')

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const [year, month] = selectedMonth.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const maxDay = selectedMonth === '2026-06' ? 24 : daysInMonth

  const days = Array.from({ length: maxDay }, (_, i) => {
    const day = i + 1
    const date = `${selectedMonth}-${String(day).padStart(2, '0')}`
    const dayOfWeek = new Date(year, month - 1, day).getDay()
    return { day, date, dayName: DAY_NAMES[dayOfWeek] }
  })

  const doneSet = new Set(
    MOCK_ENTRIES
      .filter(e => e.date.startsWith(selectedMonth))
      .map(e => `${e.habitId}:${e.date}`)
  )

  const monthLabel = MONTHS.find(m => m.key === selectedMonth)?.label ?? selectedMonth

  return (
    <div
      className="ht-overlay"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="ht-panel" onMouseDown={e => e.stopPropagation()}>
        <div className="ht-header">
          <span className="ht-title">Трекер привычек</span>
          <button className="ht-close-btn" onClick={onClose} title="Закрыть">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="ht-body">
          <div className="ht-months">
            {MONTHS.map(m => (
              <button
                key={m.key}
                className={`ht-month-btn${selectedMonth === m.key ? ' ht-month-btn--active' : ''}`}
                onClick={() => setSelectedMonth(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="ht-table-wrap">
            <table className="ht-table">
              <thead>
                <tr>
                  <th className="ht-th ht-date-th">{monthLabel}</th>
                  {HABITS.map(h => (
                    <th key={h.id} className="ht-th">{h.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map(({ day, date, dayName }) => (
                  <tr key={date}>
                    <td className="ht-date-td">
                      <div className="ht-date-inner">
                        <span className="ht-day-name">{dayName}</span>
                        <span className="ht-day-num">{day}</span>
                      </div>
                    </td>
                    {HABITS.map(h => {
                      const done = doneSet.has(`${h.id}:${date}`)
                      return (
                        <td key={h.id} className={`ht-check-td${done ? ' ht-check-td--done' : ''}`}>
                          {done && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
