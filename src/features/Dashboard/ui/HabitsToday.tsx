import { useState, useEffect, useCallback } from 'react'
import { HabitFilterStatus } from '../../HabitTracker/model/types'
import type { HabitDto } from '../../HabitTracker/model/types'
import { fetchHabits } from '../../HabitTracker/storage/habitApi'
import { fetchMonthEntries, batchUpsertEntries } from '../../HabitTracker/storage/habitEntryApi'

type Props = {
  monthKey: string // YYYY-MM
  dateKey: string  // YYYY-MM-DD (today)
}

export function HabitsToday({ monthKey, dateKey }: Props) {
  const [habits, setHabits] = useState<HabitDto[]>([])
  const [doneIds, setDoneIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchHabits({ page: 1, limit: 100, search: '', filter: HabitFilterStatus.Active }),
      fetchMonthEntries(monthKey),
    ])
      .then(([list, entries]) => {
        if (cancelled) return
        setHabits(list.data)
        setDoneIds(new Set(entries.filter(e => e.date === dateKey).map(e => e.habit_id)))
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [monthKey, dateKey])

  const toggle = useCallback((habitId: number) => {
    setDoneIds(prev => {
      const done = !prev.has(habitId)
      const next = new Set(prev)
      if (done) next.add(habitId); else next.delete(habitId)
      batchUpsertEntries([{ habit_id: habitId, date: dateKey, done }]).catch(() => {})
      return next
    })
  }, [dateKey])

  const total = habits.length
  const doneCount = habits.filter(h => doneIds.has(h.id)).length

  return (
    <div className="dash-widget dash-habits">
      <div className="dash-widget-head">
        <span className="dash-widget-title">Привычки на сегодня</span>
        {total > 0 && <span className="dash-habits-counter">{doneCount}/{total}</span>}
      </div>

      {loading ? (
        <div className="dash-widget-empty">Загрузка…</div>
      ) : total === 0 ? (
        <div className="dash-widget-empty">Нет активных привычек</div>
      ) : (
        <ul className="dash-habits-list">
          {habits.map(h => {
            const done = doneIds.has(h.id)
            return (
              <li key={h.id}>
                <button
                  className={`dash-habit${done ? ' dash-habit--done' : ''}`}
                  onClick={() => toggle(h.id)}
                >
                  <span className="dash-habit-check">
                    {done && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>
                  <span className="dash-habit-label">{h.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
