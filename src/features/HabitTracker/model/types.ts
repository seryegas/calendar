export type Habit = {
  id: string
  name: string
}

export type HabitEntry = {
  habitId: string
  date: string // YYYY-MM-DD
}

export type MonthMeta = {
  key: string // YYYY-MM
  label: string
}
