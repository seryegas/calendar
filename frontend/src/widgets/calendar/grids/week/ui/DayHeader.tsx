import './DayHeader.css'

interface DayHeaderProps {
    date: Date
}

export function DayHeader({ date }: DayHeaderProps) {
    const isToday = date.toDateString() === new Date().toDateString()
    const headerClass = isToday ? 'day-header__date-circle' : undefined

    return (
        <div className="day-header">
            <div className="day-header__weekday">
                {date.toLocaleDateString(undefined, { weekday: 'short' })}
            </div>

            <div className="day-header__date">
                <span className={headerClass}>
                    {date.getDate()}
                </span>
            </div>
        </div>
    )
}