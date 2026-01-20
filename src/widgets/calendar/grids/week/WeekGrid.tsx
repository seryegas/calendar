import './ui/WeekGrid.css'
import {DayHeader} from "./ui/DayHeader.tsx";
import {DayColumn} from "./ui/DayColumn.tsx";
import {startOfWeek} from "../../../../shared/lib/date/date.ts";
import {useCalendar} from "../../../../app/providers/CalendarProvider.tsx";
import type {TimeBlock} from "../../../../features/TimeBlock/model/types.ts";

const blocks: TimeBlock[] = [
    {
        id: '1',
        title: 'Работа',
        startAt: new Date(2026, 0, 15, 9, 0),
        endAt: new Date(2026, 0, 15, 11, 0),
        color: '#4285f4',
    },
    {
        id: '2',
        title: 'Созвон',
        startAt: new Date(2026, 0, 15, 10, 0),
        endAt: new Date(2026, 0, 15, 15, 30),
        color: '#34a853',
    },
    {
        id: '3',
        title: 'Работfffffffа',
        startAt: new Date(2026, 0, 15, 9, 30),
        endAt: new Date(2026, 0, 15, 11, 0),
        color: '#742087',
    },
]

export function WeekGrid() {
    const {selectedDay} = useCalendar()
    const weekStart = startOfWeek(selectedDay);

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
                            <DayColumn key={day.toISOString()} date={day} blocks={blocks}/>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}