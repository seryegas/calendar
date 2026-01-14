import './WeekGrid.css'
import {DayHeader} from "./DayHeader.tsx";
import {CurrentTimeIndicator} from "../../../features/current-time-indicator/ui/CurrentTimeIndicator.tsx";

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
        <div className="week">
            <div className="week-header">
                <div className="time-col" />
                {days.map(day => (
                    <DayHeader key={day.toISOString()} date={day} />
                ))}
            </div>

            <div className="week-scroll">
                <div className="week-body">
                    <CurrentTimeIndicator />
                    <div className="time-col">
                        {Array.from({ length: 24 }, (_, h) => (
                            h === 0 ? (
                                <div key={h} className="hour-label-empty" />
                            ) : (
                                <div key={h} className="hour-label">
                                    {String(h).padStart(2, '0')}:00
                                </div>
                            )
                        ))}
                    </div>

                    <div className="days-grid">
                        {days.map(day => (
                            <div key={day.toISOString()} className="day-column">
                                {Array.from({ length: 24 }).map((_, h) => (
                                    <div key={h} className="hour-cell" />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}