import { CurrentTimeIndicator } from "../../../../../features/current-time-indicator/ui/CurrentTimeIndicator.tsx";

type Props = {
    date: Date
}

export function DayColumn({ date }: Props) {
    const now = new Date()

    const isToday =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()

    return (
        <div className="day-column">
            {isToday && <CurrentTimeIndicator />}

            {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="hour-cell" />
            ))}
        </div>
    )
}