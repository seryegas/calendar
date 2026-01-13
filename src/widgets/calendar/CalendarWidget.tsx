import { useWeekNavigation } from '../../features/Calendar/model/useWeekNavigation.ts'
import { WeekGrid } from './ui/WeekGrid'

export function CalendarWidget() {
    const { weekStart, goNext, goPrev, goToToday } =
        useWeekNavigation()

    return (
        <section>
            <header>
                <button onClick={goPrev}>←</button>
                <button onClick={goToToday}>Today</button>
                <button onClick={goNext}>→</button>
            </header>

            <WeekGrid weekStart={weekStart} />
        </section>
    )
}