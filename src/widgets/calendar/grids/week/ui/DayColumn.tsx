import { CurrentTimeIndicator } from "../../../../../features/current-time-indicator/ui/CurrentTimeIndicator.tsx";
import {TimeBlockList} from "../../../../../features/TimeBlock/ui/TimeBlockList.tsx";
import type {TimeBlockInteractions, SegmentPosition, TimeBlock} from "../../../../../features/TimeBlock/model/types.ts";
import {calculateDayLayout} from "../../../../../features/TimeBlock/lib/calculateDayLayout.ts";
import {dateFromTop} from "../../../../../features/TimeBlock/model/helpers.ts";
import type {useDragMove} from "../../../../../features/TimeBlock/model/drag/useDragMove.ts";
import React from "react";

type DaySegment = TimeBlock & { segment: SegmentPosition, sourceBlock: TimeBlock }

type Props = {
    date: Date,
    segments: DaySegment[]
    interactions: TimeBlockInteractions
    moveHook: ReturnType<typeof useDragMove>
}

export function DayColumn({ date, segments, interactions, moveHook }: Props) {
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

        interactions.crud.createDraft({
            id: crypto.randomUUID(),
            title: '',
            startAt,
            endAt,
            color: '#d2e3fc',
            isNew: true
        })
    }

    const now = new Date()

    const positioned = calculateDayLayout(segments)

    const isToday =
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()

    return (
        <div className="day-column" onClick={handleDayClick}>
            {isToday && <CurrentTimeIndicator />}

            <TimeBlockList blocks={positioned}
                           interactions={interactions}
                           moveHook={moveHook}
            />

            {Array.from({ length: 24 }).map((_, h) => (
                <div key={h} className="hour-cell" />
            ))}
        </div>
    )
}