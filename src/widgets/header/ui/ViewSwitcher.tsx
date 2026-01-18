import "./ViewSwitcher.css"
import {CALENDAR_VIEWS, type CalendarView, useCalendar} from "../../../app/providers/CalendarProvider.tsx";
import {getPeriodStartDate} from "../../../shared/lib/date/date.ts";

export function ViewSwitcher() {
    const { view, setView, selectedDay, setSelectedDay } = useCalendar()

    const handleChange = (view: CalendarView) => {
        setView(view)
        setSelectedDay(getPeriodStartDate(view, selectedDay))
        console.log(view, selectedDay)
    }

    return (
        <div className="view-switcher">
            {CALENDAR_VIEWS.map(v => (
                <button
                    key={v}
                    className={`view-switcher__button ${
                        v === view ? 'is-active' : ''
                    }`}
                    onClick={() => handleChange(v)}
                    type="button"
                >
                    {labelByView[v]}
                </button>
            ))}
        </div>
    )
}

const labelByView: Record<CalendarView, string> = {
    day: 'День',
    week: 'Неделя',
    month: 'Месяц',
    year: 'Год',
}