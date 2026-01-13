type Props = {
    weekStart: Date
}

export function WeekGrid({ weekStart }: Props) {
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart)
        d.setDate(d.getDate() + i)
        return d
    })

    return (
        <div className="week-grid">
            {days.map(day => (
                <div key={day.toISOString()} className="day-column">
                    {day.toDateString()}
                </div>
            ))}
        </div>
    )
}