import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from 'react'

export const CALENDAR_VIEWS = ['day', 'week', 'month', 'year'] as const
export type CalendarView = typeof CALENDAR_VIEWS[number]

type CalendarState = {
    view: CalendarView
    selectedDay: Date
    setView: (view: CalendarView) => void
    setSelectedDay: (day: Date) => void
}

const LS_KEYS = {
    view: 'calendar_view',
    selectedDay: 'calendar_selected_day',
}

const CalendarContext = createContext<CalendarState | null>(null)

export function CalendarProvider({ children }: { children: ReactNode }) {
    const [view, setViewState] = useState<CalendarView>(() => {
        const saved = localStorage.getItem(LS_KEYS.view)
        return (saved as CalendarView) || 'week'
    })

    const [selectedDay, setSelectedDayState] = useState<Date>(() => {
        const saved = localStorage.getItem(LS_KEYS.selectedDay)
        return saved ? new Date(saved) : startOfWeek(new Date())
    })

    const setView = (nextView: CalendarView) => {
        setViewState(nextView)
        localStorage.setItem(LS_KEYS.view, nextView)
    }

    const setSelectedDay = (day: Date) => {
        setSelectedDayState(day)
        localStorage.setItem(LS_KEYS.selectedDay, day.toISOString())
    }

    return (
        <CalendarContext.Provider
            value={{
                view,
                selectedDay,
                setView,
                setSelectedDay,
            }}
        >
            {children}
        </CalendarContext.Provider>
    )
}

export function useCalendar() {
    const ctx = useContext(CalendarContext)
    if (!ctx) {
        throw new Error(
            'useCalendar must be used inside CalendarProvider'
        )
    }
    return ctx
}

function startOfWeek(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
}