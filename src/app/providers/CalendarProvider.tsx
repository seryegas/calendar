import {
    createContext,
    useContext,
    useState,
    type ReactNode,
} from 'react'
import { type CalendarView, type AppSection } from './applicationTypes'

type AppState = {
    view: CalendarView
    selectedDay: Date
    setView: (view: CalendarView) => void
    setSelectedDay: (day: Date) => void
    appSection: AppSection
    setAppSection: (section: AppSection) => void
}

const LS_KEYS = {
    view: 'calendar_view',
    selectedDay: 'calendar_selected_day',
    appSection: 'app_section',
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
    const [view, setViewState] = useState<CalendarView>(() => {
        const saved = localStorage.getItem(LS_KEYS.view)
        return (saved as CalendarView) || 'week'
    })

    const [appSection, setAppSectionState] = useState<AppSection>(() => {
        const saved = localStorage.getItem(LS_KEYS.appSection)
        return (saved as AppSection) || 'dashboard'
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

    const setAppSection = (section: AppSection) => {
        setAppSectionState(section)
        localStorage.setItem(LS_KEYS.appSection, section)
    }

    return (
        <AppContext.Provider value={{ view, selectedDay, setView, setSelectedDay, appSection, setAppSection }}>
            {children}
        </AppContext.Provider>
    )
}

export function useApp() {
    const ctx = useContext(AppContext)
    if (!ctx) throw new Error('useApp must be used inside AppProvider')
    return ctx
}

// keep backwards-compat alias so nothing breaks during migration
export const CalendarProvider = AppProvider
export const useCalendar = useApp

function startOfWeek(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
}
