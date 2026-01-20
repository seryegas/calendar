import { CurrentTimeIndicator } from "../../../../../features/current-time-indicator/ui/CurrentTimeIndicator.tsx";
import {TimeBlockList} from "../../../../../features/TimeBlock/ui/TimeBlockList.tsx";
import type {TimeBlock} from "../../../../../features/TimeBlock/model/types.ts";
import {calculateDayLayout} from "../../../../../features/TimeBlock/lib/calculateDayLayout.ts";

type Props = {
    date: Date,
    blocks: TimeBlock[]
    onUpdateBlock: (
        id: string,
        startAt: Date,
        endAt: Date
    ) => void
}

export function DayColumn({ date, blocks, onUpdateBlock }: Props) {
    const now = new Date()

    const dayBlocks = blocks.filter(
        b =>
            b.startAt.toDateString() ===
            date.toDateString()
    )

    const positioned = calculateDayLayout(dayBlocks)

    const isToday =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()

    return (
        <div className="day-column">
            {isToday && <CurrentTimeIndicator />}

            <TimeBlockList blocks={positioned} onChange={onUpdateBlock} />

            {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="hour-cell" />
            ))}
        </div>
    )
}