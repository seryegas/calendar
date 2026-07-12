import './DayGrid.css'
import {DayHeader} from "../week/ui/DayHeader.tsx";
import {DayColumn} from "../week/ui/DayColumn.tsx";
import { useApp } from "../../../../app/providers/CalendarProvider.tsx";
import {getSegmentsForDay} from "../../../../features/TimeBlock/model/selectors.ts";
import {TimeBlockMenu} from "../../../../features/TimeBlock/ui/TimeBlockMenu.tsx";
import {useTimeBlocksController} from "../../../../features/TimeBlock/api/useTimeBlockController.ts";
import {createTimeBlockRepository} from "../../../../features/TimeBlock/storage";
import type {Period} from "../../../../features/TimeBlock/model/types.ts";
import {useEffect, useMemo, useRef} from "react";
import {useDragMove} from "../../../../features/TimeBlock/model/drag/useDragMove.ts";
import {blockTop, dateFromTop} from "../../../../features/TimeBlock/model/helpers.ts";

export function DayGrid({ date }: { date?: Date } = {}) {
    const { selectedDay } = useApp()
    const source = date ?? selectedDay
    const dayStart = useMemo(() => {
        const d = new Date(source)
        d.setHours(0, 0, 0, 0)
        return d
    }, [source])

    const scrollRef = useRef<HTMLDivElement>(null)
    const repository = useMemo(
        () => createTimeBlockRepository(),
        []
    )

    const period = useMemo<Period>(() => ({
        view: 'day',
        startDate: dayStart
    }), [dayStart])

    const {
        blocks,
        menuState,
        interactions,
        isLoading
    } = useTimeBlocksController({ repository, period })

    const move = useDragMove({ onDrop: interactions.crud.updateBlockTime })

    const previewBlocks = move.dragInfo
        ? blocks.map(b => {
            if (b.id !== move.dragInfo!.blockId) return b
            const duration = b.endAt.getTime() - b.startAt.getTime()
            const newTop = blockTop(b.startAt) + move.dragInfo!.snappedDeltaY
            const newStart = dateFromTop(b.startAt, newTop)
            const newEnd = new Date(newStart.getTime() + duration)
            return { ...b, startAt: newStart, endAt: newEnd }
        })
        : blocks

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return

        const saved = localStorage.getItem('day-scroll')
        if (saved === null) return

        requestAnimationFrame(() => {
            el.scrollTop = Number(saved)
        })
    }, [dayStart, isLoading])

    if (isLoading) {
        return <div>Loading…</div>
    }

    return (
        <div className="day-view">
            <div className="day-view-header">
                <div className="time-col" />
                <DayHeader date={dayStart} />
            </div>

            <div className="day-view-scroll" ref={scrollRef} onScroll={() => {
                if (!scrollRef.current) return
                localStorage.setItem('day-scroll', String(scrollRef.current.scrollTop))
            }}>
                <div className="day-view-body">
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

                    <DayColumn
                        date={dayStart}
                        segments={getSegmentsForDay(previewBlocks, dayStart)}
                        interactions={interactions}
                        moveHook={move}
                    />
                </div>
            </div>

            {menuState.visible && menuState.block && (
                <TimeBlockMenu
                    block={menuState.block}
                    x={menuState.x}
                    y={menuState.y}
                    interactions={interactions}
                />
            )}
        </div>
    )
}
