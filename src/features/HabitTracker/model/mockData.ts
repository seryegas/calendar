import type { Habit, HabitEntry, MonthMeta } from './types'

export const HABITS: Habit[] = [
  { id: 'reading', name: 'Чтение' },
  { id: 'sport', name: 'Спорт' },
  { id: 'meditation', name: 'Медитация' },
  { id: 'water', name: 'Вода 2л' },
  { id: 'no-sugar', name: 'Без сахара' },
]

export const MONTHS: MonthMeta[] = [
  { key: '2026-06', label: 'Июнь' },
  { key: '2026-05', label: 'Май' },
  { key: '2026-04', label: 'Апрель' },
  { key: '2026-03', label: 'Март' },
  { key: '2026-02', label: 'Февраль' },
  { key: '2026-01', label: 'Январь' },
]

// Deterministic patterns per habit (index % length → 1 = done, 0 = skip)
const PATTERNS: Record<string, number[]> = {
  reading:    [1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1],
  sport:      [1,0,1,0,1,0,1,0,1,0,1,1,0,1,0,1,0,1,0,1,1,0,1,0,1,0,1,0,1,0],
  meditation: [0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1],
  water:      [1,1,1,0,1,1,1,1,0,1,1,1,0,1,1,1,1,0,1,1,1,0,1,1,1,1,0,1,1,1],
  'no-sugar': [1,1,0,0,1,1,1,0,0,1,1,1,0,0,1,1,1,0,0,1,1,0,0,1,1,1,0,1,0,0],
}

function buildEntries(): HabitEntry[] {
  const entries: HabitEntry[] = []

  for (let month = 1; month <= 6; month++) {
    const daysInMonth = new Date(2026, month, 0).getDate()
    const maxDay = month === 6 ? 24 : daysInMonth

    for (let day = 1; day <= maxDay; day++) {
      const date = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      for (const habit of HABITS) {
        const pattern = PATTERNS[habit.id]
        if (pattern[(day - 1) % pattern.length]) {
          entries.push({ habitId: habit.id, date })
        }
      }
    }
  }

  return entries
}

export const MOCK_ENTRIES: HabitEntry[] = buildEntries()
