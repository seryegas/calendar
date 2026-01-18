import './ui/CalendarWidget.css'
import { WeekGrid } from '../calendar/grids/week/WeekGrid.tsx'

export function CalendarWidget() {
    return (
        <section className="calendar">
            <WeekGrid weekStart={weekStart} />
        </section>
    )
}