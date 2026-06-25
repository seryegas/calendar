export const CALENDAR_VIEWS = ['day', 'week', 'month', 'year'] as const
export type CalendarView = typeof CALENDAR_VIEWS[number]
export type AppSection = 'calendar' | 'tracker' | 'budget'
