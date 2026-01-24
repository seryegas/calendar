import "./ViewSwitcher.css"
import {CALENDAR_VIEWS, type CalendarView, useCalendar} from "../../../app/providers/CalendarProvider.tsx";
import {getPeriodStartDate} from "../../../shared/lib/date/date.ts";

export function ViewSwitcher() {
    const { view, setView, selectedDay, setSelectedDay } = useCalendar()

    const handleChange = (view: CalendarView) => {
        if (view !== 'week') return // пока разрешна только неделя

        setView(view)
        setSelectedDay(getPeriodStartDate(view, selectedDay))
    }

    return (
        <div className="view-switcher">
            {CALENDAR_VIEWS.map(v => (
                <button
                    key={v}
                    className={`
                        view-switcher__button
                        ${v === view ? 'is-active' : ''}
                        ${v !== 'week' ? 'is-disabled' : ''}
                    `}
                    onClick={() => handleChange(v)}
                    type="button"
                    disabled={v !== 'week'} // делает кнопку не кликабельной
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