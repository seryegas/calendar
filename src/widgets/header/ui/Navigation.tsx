import {usePeriodNavigation} from "../../../features/Calendar/model/usePeriodNavigation.ts";
import {useCalendar} from "../../../app/providers/CalendarProvider.tsx";

export function Navigation() {
    const {view} = useCalendar()
    const {goPrev, goToToday, goNext} = usePeriodNavigation(view)

    return (
        <div className="calendar-nav">
            <button onClick={goPrev}>←</button>
            <button className="calendar-today" onClick={goToToday}>
                Сегодня
            </button>
            <button onClick={goNext}>→</button>
        </div>
    )
}