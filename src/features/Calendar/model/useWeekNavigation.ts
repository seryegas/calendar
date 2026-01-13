import { useState } from 'react'
import { addWeeks, startOfWeek } from '../../../shared/lib/date/date.ts'

export function useWeekNavigation() {
    const [weekStart, setWeekStart] = useState(() =>
        startOfWeek(new Date())
    )

    return {
        weekStart,
        goToToday: () => setWeekStart(startOfWeek(new Date())),
        goNext: () => setWeekStart(prev => addWeeks(prev, 1)),
        goPrev: () => setWeekStart(prev => addWeeks(prev, -1)),
    }
}