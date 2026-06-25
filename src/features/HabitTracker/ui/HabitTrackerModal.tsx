import { useState, useEffect, useRef, useCallback } from 'react'
import { HabitFilterStatus } from '../model/types'
import type { HabitDto, EntryChange } from '../model/types'
import { fetchHabits } from '../storage/habitApi'
import { fetchMonthEntries, batchUpsertEntries } from '../storage/habitEntryApi'
import './HabitTrackerModal.css'

const FLUSH_DELAY = 10_000

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

function generateMonths(count = 6) {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { key, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` }
  })
}

const MONTHS = generateMonths()

type Props = { onClose: () => void }

export function HabitTrackerModal({ onClose }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[0].key)
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

  // Escape to close
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      const changes = Array.from(bufferRef.current.values())
      if (changes.length > 0) batchUpsertEntries(changes).catch(() => {})
    }
  }, [])

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
  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month
  const maxDay = isCurrentMonth ? today.getDate() : daysInMonth

  const days = Array.from({ length: maxDay }, (_, i) => {
    const day = i + 1
    const date = `${selectedMonth}-${String(day).padStart(2, '0')}`
    const dayOfWeek = new Date(year, month - 1, day).getDay()
    return { day, date, dayName: DAY_NAMES[dayOfWeek] }
  })

  const monthLabel = MONTHS.find(m => m.key === selectedMonth)?.label ?? selectedMonth

  return (
    <div className="ht-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
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
            {habits.length === 0 ? (
              <div className="ht-empty">Нет активных привычек</div>
            ) : (
              <table className="ht-table">
                <thead>
                  <tr>
                    <th className="ht-th ht-date-th">{monthLabel}</th>
                    {habits.map(h => (
                      <th key={h.id} className="ht-th">{h.label}</th>
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
                      {habits.map(h => {
                        const done = doneKeys.has(`${h.id}:${date}`)
                        return (
                          <td
                            key={h.id}
                            className={`ht-check-td${done ? ' ht-check-td--done' : ''}`}
                            onClick={() => handleToggle(h.id, date)}
                          >
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
            )}
          </div>
        </div>

        {(countdown !== null || isSaving || savedFlash) && (
          <div className="ht-save-bar">
            {isSaving && <span className="ht-save-bar__text">Сохранение...</span>}
            {savedFlash && !isSaving && (
              <span className="ht-save-bar__text ht-save-bar__text--saved">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Сохранено
              </span>
            )}
            {countdown !== null && !isSaving && !savedFlash && (
              <span className="ht-save-bar__text">
                Изменения · сохранение через {countdown}с
                <button className="ht-save-bar__now" onClick={flushBuffer}>Сохранить сейчас</button>
              </span>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
