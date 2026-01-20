import { CurrentTimeIndicator } from "../../../../../features/current-time-indicator/ui/CurrentTimeIndicator.tsx";
import {TimeBlockList} from "../../../../../features/TimeBlock/ui/TimeBlockList.tsx";
import type {TimeBlock} from "../../../../../features/TimeBlock/model/types.ts";

type Props = {
    date: Date,
    blocks: TimeBlock[]
}

export function DayColumn({ date, blocks }: Props) {
    const now = new Date()

    const isToday =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()

    return (
        <div className="day-column">
            {isToday && <CurrentTimeIndicator />}

            <TimeBlockList blocks={blocks} />

            {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="hour-cell" />
            ))}
        </div>
    )
}