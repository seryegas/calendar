import './ui/CalendarWidget.css'
import { useWeekNavigation } from '../../features/Calendar/model/useWeekNavigation.ts'
import { WeekGrid } from './ui/WeekGrid.tsx'
import {formatWeekRange} from "../../shared/lib/date/formatWeekRange.ts";

export function CalendarWidget() {
    const { weekStart, goNext, goPrev, goToToday } =
        useWeekNavigation()

    const title = formatWeekRange(weekStart)

    return (
        <section className="calendar">
            <header className="calendar-header">
                <div className="header-left">
                    <span className="logo">📅 Календарь</span>
                </div>
                <div className="calendar-nav">
                    <button onClick={goPrev}>←</button>
                    <button className="calendar-today" onClick={goToToday}>
                        Today
                    </button>
                    <button onClick={goNext}>→</button>
                </div>
                <div className="calendar-title">
                    {title}
                </div>
            </header>

            <WeekGrid weekStart={weekStart} />
        </section>
    )
}