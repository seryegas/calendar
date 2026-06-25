export type Habit = {
  id: string
  name: string
}

export type HabitEntry = {
  habitId: string
  date: string // YYYY-MM-DD
}

export type HabitEntryDto = {
  habit_id: number
  date: string // YYYY-MM-DD
}

export type EntryChange = {
  habit_id: number
  date: string
  done: boolean
}

export type MonthMeta = {
  key: string // YYYY-MM
  label: string
}

export const HabitFilterStatus = {
  All: 'all',
  Active: 'active',
  Inactive: 'inactive',
} as const

export type HabitFilterStatus = typeof HabitFilterStatus[keyof typeof HabitFilterStatus]

export type HabitDto = {
  id: number
  label: string
  is_active: boolean
}

export type HabitListResponse = {
  data: HabitDto[]
  page: number
  limit: number
  total: number
}
