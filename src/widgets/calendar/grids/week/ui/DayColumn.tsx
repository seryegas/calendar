import { CurrentTimeIndicator } from "../../../../../features/current-time-indicator/ui/CurrentTimeIndicator.tsx";
import {TimeBlockList} from "../../../../../features/TimeBlock/ui/TimeBlockList.tsx";
import type {TimeBlock} from "../../../../../features/TimeBlock/model/types.ts";
import {calculateDayLayout} from "../../../../../features/TimeBlock/lib/calculateDayLayout.ts";
import {dateFromTop} from "../../../../../features/TimeBlock/model/helpers.ts";
import React from "react";

type Props = {
    date: Date,
    blocks: TimeBlock[]
    onUpdateBlock: (
        id: string,
        startAt: Date,
        endAt: Date
    ) => void
    onCreateBlock: (block: TimeBlock) => void
    onUpdateTitle: (id: string, title: string) => void
    onCancelCreate: (id: string) => void
}

export function DayColumn({ date, blocks, onUpdateBlock, onCreateBlock, onUpdateTitle, onCancelCreate }: Props) {
    function handleDayClick(
        e: React.MouseEvent<HTMLDivElement>
    ) {
        if ((e.target as HTMLElement).closest('.time-block')) {
            return
        }

        const rect = e.currentTarget.getBoundingClientRect()
        const clickY = e.clientY - rect.top

        const startAt = dateFromTop(date, clickY)

        const endAt = new Date(
            startAt.getTime() + 60 * 60 * 1000
        )

        onCreateBlock({
            id: crypto.randomUUID(),
            title: '',
            startAt,
            endAt,
            color: '#d2e3fc',
            isNew: true
        })
    }

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
        <div className="day-column" onClick={handleDayClick}>
            {isToday && <CurrentTimeIndicator />}

            <TimeBlockList blocks={positioned}
                           onChange={onUpdateBlock}
                           onUpdateTitle={onUpdateTitle}
                           onCancelCreate={onCancelCreate}
            />

            {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="hour-cell" />
            ))}
        </div>
    )
}