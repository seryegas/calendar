import { useState, useRef, useEffect } from 'react'
import { HABITS, MOCK_ENTRIES } from '../model/mockData'
import { HabitListModal } from './HabitListModal'
import './HabitTrackerPage.css'

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const MONTH_LABELS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

const CURRENT_YEAR = 2026
const CURRENT_MONTH = 6
const YEAR_FROM = 2020

const YEARS = Array.from(
  { length: CURRENT_YEAR - YEAR_FROM + 1 },
  (_, i) => CURRENT_YEAR - i
)

function getMonthsForYear(year: number) {
  const count = year === CURRENT_YEAR ? CURRENT_MONTH : 12
  return Array.from({ length: count }, (_, i) => ({
    key: `${year}-${String(count - i).padStart(2, '0')}`,
    label: MONTH_LABELS[count - i - 1],
  }))
}

const LS_TRACKER_YEAR = 'tracker_year'
const LS_TRACKER_MONTH = 'tracker_month'

function restoreYear(): number {
  const raw = localStorage.getItem(LS_TRACKER_YEAR)
  const y = raw ? parseInt(raw) : CURRENT_YEAR
  return y >= YEAR_FROM && y <= CURRENT_YEAR ? y : CURRENT_YEAR
}

function restoreMonth(year: number): string {
  const raw = localStorage.getItem(LS_TRACKER_MONTH)
  const months = getMonthsForYear(year)
  return raw && months.find(m => m.key === raw) ? raw : months[0].key
}

export function HabitTrackerPage() {
  const [habitListOpen, setHabitListOpen] = useState(false)
  const [selectedYear, setSelectedYearState] = useState(restoreYear)
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false)
  const yearRef = useRef<HTMLDivElement>(null)

  const months = getMonthsForYear(selectedYear)
  const [selectedMonth, setSelectedMonthState] = useState(() => restoreMonth(restoreYear()))

  function setSelectedYear(y: number) {
    setSelectedYearState(y)
    localStorage.setItem(LS_TRACKER_YEAR, String(y))
    const newMonth = getMonthsForYear(y)[0].key
    setSelectedMonthState(newMonth)
    localStorage.setItem(LS_TRACKER_MONTH, newMonth)
  }

  function setSelectedMonth(m: string) {
    setSelectedMonthState(m)
    localStorage.setItem(LS_TRACKER_MONTH, m)
  }

  // when year changes, reset to first (most recent) month of that year
  useEffect(() => {
    const months = getMonthsForYear(selectedYear)
    if (!months.find(m => m.key === selectedMonth)) {
      setSelectedMonth(months[0].key)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear])

  useEffect(() => {
    if (!yearDropdownOpen) return
    function handler(e: MouseEvent) {
      if (yearRef.current && !yearRef.current.contains(e.target as Node)) {
        setYearDropdownOpen(false)
      }
    }
    window.addEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [yearDropdownOpen])

  const [year, month] = selectedMonth.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const isCurrentMonth = year === CURRENT_YEAR && month === CURRENT_MONTH
  const maxDay = isCurrentMonth ? 24 : daysInMonth

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

  const monthLabel = months.find(m => m.key === selectedMonth)?.label ?? ''

  return (
    <div className="ht-page">
      <div className="ht-page-months">

        {/* Year selector */}
        <div className="ht-year-selector" ref={yearRef}>
          <button
            className={`ht-year-btn${yearDropdownOpen ? ' ht-year-btn--open' : ''}`}
            onClick={() => setYearDropdownOpen(o => !o)}
          >
            <span>{selectedYear}</span>
            <svg
              className={`ht-year-chevron${yearDropdownOpen ? ' ht-year-chevron--up' : ''}`}
              width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {yearDropdownOpen && (
            <div className="ht-year-dropdown">
              {YEARS.map(y => (
                <button
                  key={y}
                  className={`ht-year-option${y === selectedYear ? ' ht-year-option--active' : ''}`}
                  onClick={() => { setSelectedYear(y); setYearDropdownOpen(false) }}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Month list */}
        {months.map(m => (
          <button
            key={m.key}
            className={`ht-page-month-btn${selectedMonth === m.key ? ' ht-page-month-btn--active' : ''}`}
            onClick={() => setSelectedMonth(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="ht-page-main">
        <div className="ht-page-topbar">
          <span className="ht-page-title">Привычки — {monthLabel} {selectedYear}</span>
          <button className="ht-habits-list-btn" onClick={() => setHabitListOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="2.5"/>
              <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="2.5"/>
              <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="2.5"/>
            </svg>
            Список привычек
          </button>
        </div>

        {habitListOpen && <HabitListModal onClose={() => setHabitListOpen(false)} />}

        <div className="ht-page-table-wrap">
          <table className="ht-page-table">
            <thead>
              <tr>
                <th className="ht-page-th ht-page-date-th">Дата</th>
                {HABITS.map(h => (
                  <th key={h.id} className="ht-page-th">{h.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map(({ day, date, dayName }) => (
                <tr key={date}>
                  <td className="ht-page-date-td">
                    <div className="ht-page-date-inner">
                      <span className="ht-page-day-name">{dayName}</span>
                      <span className="ht-page-day-num">{day}</span>
                    </div>
                  </td>
                  {HABITS.map(h => {
                    const done = doneSet.has(`${h.id}:${date}`)
                    return (
                      <td key={h.id} className={`ht-page-check-td${done ? ' ht-page-check-td--done' : ''}`}>
                        {done && (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
  )
}
