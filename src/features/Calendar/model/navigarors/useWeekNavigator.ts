import { useCallback } from 'react'
import type { PeriodNavigator } from './types'
import { useCalendar } from '../../../../app/providers/CalendarProvider.tsx'

export function useWeekNavigator(): PeriodNavigator {
    const { selectedDay, setSelectedDay } = useCalendar()

    const goNext = useCallback(() => {
        const next = new Date(selectedDay)
        next.setDate(selectedDay.getDate() + 7)
        setSelectedDay(next)
    }, [selectedDay, setSelectedDay])

    const goPrev = useCallback(() => {
        const prev = new Date(selectedDay)
        prev.setDate(selectedDay.getDate() - 7)
        setSelectedDay(prev)
    }, [selectedDay, setSelectedDay])

    const goToToday = useCallback(() => {
        setSelectedDay(new Date())
    }, [setSelectedDay])

    return {
        currentDate: selectedDay,
        setCurrentDate: setSelectedDay,
        goNext,
        goPrev,
        goToToday,
    }
}