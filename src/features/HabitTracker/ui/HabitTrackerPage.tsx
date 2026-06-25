import { useState, useEffect, useRef, useCallback } from 'react'
import { HabitFilterStatus } from '../model/types'
import type { HabitDto, EntryChange } from '../model/types'
import { fetchHabits } from '../storage/habitApi'
import { fetchMonthEntries, batchUpsertEntries, sendBeaconEntries } from '../storage/habitEntryApi'
import { HabitListModal } from './HabitListModal'
import './HabitTrackerPage.css'

const FLUSH_DELAY = 10_000

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const MONTH_LABELS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']

const now = new Date()
const CURRENT_YEAR = now.getFullYear()
const CURRENT_MONTH = now.getMonth() + 1

const YEAR_FROM = 2020
const YEARS = Array.from({ length: CURRENT_YEAR - YEAR_FROM + 1 }, (_, i) => CURRENT_YEAR - i)

function getMonthsForYear(year: number) {
  return Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1
    return {
      key: `${year}-${String(monthNum).padStart(2, '0')}`,
      label: MONTH_LABELS[i],
      disabled: year === CURRENT_YEAR && monthNum > CURRENT_MONTH,
    }
  })
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
  const available = getMonthsForYear(year).filter(m => !m.disabled)
  return raw && available.find(m => m.key === raw) ? raw : available[available.length - 1].key
}

export function HabitTrackerPage() {
  const [habitListOpen, setHabitListOpen] = useState(false)
  const [selectedYear, setSelectedYearState] = useState(restoreYear)
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false)
  const yearRef = useRef<HTMLDivElement>(null)

  const months = getMonthsForYear(selectedYear)
  const [selectedMonth, setSelectedMonthState] = useState(() => restoreMonth(restoreYear()))

  const [habits, setHabits] = useState<HabitDto[]>([])
  const [doneKeys, setDoneKeys] = useState<Set<string>>(new Set())

  // Buffer
  const bufferRef = useRef<Map<string, EntryChange>>(new Map())
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  // Load habits once
  useEffect(() => {
    fetchHabits({ page: 1, limit: 100, search: '', filter: HabitFilterStatus.Active })
      .then(res => setHabits(res.data))
      .catch(() => {})
  }, [])

  // Load entries when month changes
  useEffect(() => {
    fetchMonthEntries(selectedMonth)
      .then(entries => {
        setDoneKeys(new Set(entries.map(e => `${e.habit_id}:${e.date}`)))
      })
      .catch(() => {})
  }, [selectedMonth])

  // Flush on unmount (смена роута внутри SPA)
  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      const changes = Array.from(bufferRef.current.values())
      if (changes.length > 0) batchUpsertEntries(changes).catch(() => {})
    }
  }, [])

  // Flush при закрытии/перезагрузке вкладки — sendBeacon гарантирует доставку
  useEffect(() => {
    function handleBeforeUnload() {
      const changes = Array.from(bufferRef.current.values())
      if (changes.length === 0) return
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      sendBeaconEntries(changes)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Close year dropdown on outside click
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

  const flushBuffer = useCallback(async () => {
    if (flushTimerRef.current) { clearTimeout(flushTimerRef.current); flushTimerRef.current = null }
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null }
    setCountdown(null)

    const changes = Array.from(bufferRef.current.values())
    if (changes.length === 0) return
    bufferRef.current.clear()

    setIsSaving(true)
    try {
      await batchUpsertEntries(changes)
      setSavedFlash(true)
      setTimeout(() => setSavedFlash(false), 2000)
    } finally {
      setIsSaving(false)
    }
  }, [])

  function startFlushTimer() {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

    flushTimerRef.current = setTimeout(flushBuffer, FLUSH_DELAY)

    let remaining = FLUSH_DELAY / 1000
    setCountdown(remaining)
    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1
      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current!)
        countdownIntervalRef.current = null
        setCountdown(null)
      } else {
        setCountdown(remaining)
      }
    }, 1000)
  }

  function flushBufferSync() {
    if (flushTimerRef.current) { clearTimeout(flushTimerRef.current); flushTimerRef.current = null }
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null }
    setCountdown(null)
    const changes = Array.from(bufferRef.current.values())
    if (changes.length > 0) {
      bufferRef.current.clear()
      batchUpsertEntries(changes).catch(() => {})
    }
  }

  function setSelectedYear(y: number) {
    setSelectedYearState(y)
    localStorage.setItem(LS_TRACKER_YEAR, String(y))
    const available = getMonthsForYear(y).filter(m => !m.disabled)
    const newMonth = available[available.length - 1].key
    setSelectedMonthState(newMonth)
    localStorage.setItem(LS_TRACKER_MONTH, newMonth)
  }

  function setSelectedMonth(m: string) {
    flushBufferSync()
    setSelectedMonthState(m)
    localStorage.setItem(LS_TRACKER_MONTH, m)
  }

  useEffect(() => {
    const available = getMonthsForYear(selectedYear).filter(m => !m.disabled)
    if (!available.find(m => m.key === selectedMonth)) {
      setSelectedMonth(available[available.length - 1].key)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear])

  function handleToggle(habitId: number, date: string) {
    const key = `${habitId}:${date}`
    const newDone = !doneKeys.has(key)

    setDoneKeys(prev => {
      const next = new Set(prev)
      if (newDone) next.add(key)
      else next.delete(key)
      return next
    })

    bufferRef.current.set(key, { habit_id: habitId, date, done: newDone })
    startFlushTimer()
  }

  const [year, month] = selectedMonth.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const isCurrentMonth = year === CURRENT_YEAR && month === CURRENT_MONTH
  const todayDay = now.getDate()

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const date = `${selectedMonth}-${String(day).padStart(2, '0')}`
    const dayOfWeek = new Date(year, month - 1, day).getDay()
    const disabled = isCurrentMonth && day > todayDay
    return { day, date, dayName: DAY_NAMES[dayOfWeek], disabled }
  })

  const monthLabel = months.find(m => m.key === selectedMonth)?.label ?? ''

  return (
    <div className="ht-page">
      <div className="ht-page-months">

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

        {months.map(m => (
          <button
            key={m.key}
            className={`ht-page-month-btn${selectedMonth === m.key ? ' ht-page-month-btn--active' : ''}${m.disabled ? ' ht-page-month-btn--disabled' : ''}`}
            onClick={() => !m.disabled && setSelectedMonth(m.key)}
            disabled={m.disabled}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="ht-page-main">
        <div className="ht-page-topbar">
          <span className="ht-page-title">Привычки — {monthLabel} {selectedYear}</span>
          <div className="ht-page-topbar-right">
            {(countdown !== null || isSaving || savedFlash) && (
              <span className="ht-page-save-status">
                {isSaving && 'Сохранение...'}
                {savedFlash && !isSaving && '✓ Сохранено'}
                {countdown !== null && !isSaving && !savedFlash && (
                  <>
                    через {countdown}с
                    <button className="ht-page-save-now" onClick={flushBuffer}>
                      Сохранить
                    </button>
                  </>
                )}
              </span>
            )}
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
        </div>

        {habitListOpen && <HabitListModal onClose={() => setHabitListOpen(false)} />}

        {habits.length === 0 ? (
          <div className="ht-page-empty">Нет активных привычек. Добавьте их через «Список привычек».</div>
        ) : (
          <div className="ht-page-table-wrap">
            <table className="ht-page-table">
              <thead>
                <tr>
                  <th className="ht-page-th ht-page-date-th">Дата</th>
                  {habits.map(h => (
                    <th key={h.id} className="ht-page-th">{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map(({ day, date, dayName, disabled }) => (
                  <tr key={date} className={disabled ? 'ht-page-row--disabled' : ''}>
                    <td className="ht-page-date-td">
                      <div className="ht-page-date-inner">
                        <span className="ht-page-day-name">{dayName}</span>
                        <span className="ht-page-day-num">{day}</span>
                      </div>
                    </td>
                    {habits.map(h => {
                      const done = !disabled && doneKeys.has(`${h.id}:${date}`)
                      return (
                        <td
                          key={h.id}
                          className={`ht-page-check-td${done ? ' ht-page-check-td--done' : ''}`}
                          onClick={disabled ? undefined : () => handleToggle(h.id, date)}
                        >
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
              <tfoot>
                <tr>
                  <td className="ht-page-total-label">Итого</td>
                  {habits.map(h => {
                    const count = days.filter(({ date, disabled }) => !disabled && doneKeys.has(`${h.id}:${date}`)).length
                    return (
                      <td key={h.id} className="ht-page-total-td">{count}</td>
                    )
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
