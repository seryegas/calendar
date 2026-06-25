import './ui/WeekGrid.css'
import {DayHeader} from "./ui/DayHeader.tsx";
import {DayColumn} from "./ui/DayColumn.tsx";
import {startOfWeek} from "../../../../shared/lib/date/date.ts";
import { useApp } from "../../../../app/providers/CalendarProvider.tsx";
import {getSegmentsForDay} from "../../../../features/TimeBlock/model/selectors.ts";
import {TimeBlockMenu} from "../../../../features/TimeBlock/ui/TimeBlockMenu.tsx";
import {useTimeBlocksController} from "../../../../features/TimeBlock/api/useTimeBlockController.ts";
import {createTimeBlockRepository} from "../../../../features/TimeBlock/storage";
import type {Period} from "../../../../features/TimeBlock/model/types.ts";
import {useEffect, useMemo, useRef} from "react";
import {useDragMove} from "../../../../features/TimeBlock/model/drag/useDragMove.ts";
import {blockTop, dateFromTop} from "../../../../features/TimeBlock/model/helpers.ts";

export function WeekGrid() {
    const { selectedDay } = useApp()
    const weekStart = useMemo(
        () => startOfWeek(selectedDay),
        [selectedDay]
    )
    const scrollRef = useRef<HTMLDivElement>(null);
    const repository = useMemo(
        () => createTimeBlockRepository(),
        []
    )

    const period = useMemo<Period>(() => ({
        view: 'week',
        startDate: weekStart
    }), [weekStart])

    const {
        blocks,
        menuState,
        interactions,
        isLoading
    } = useTimeBlocksController({ repository, period })

    const move = useDragMove({ onDrop: interactions.crud.updateBlockTime })

    const MS_PER_DAY = 24 * 60 * 60 * 1000
    const previewBlocks = move.dragInfo
        ? blocks.map(b => {
            if (b.id !== move.dragInfo!.blockId) return b
            const duration = b.endAt.getTime() - b.startAt.getTime()
            const newTop = blockTop(b.startAt) + move.dragInfo!.snappedDeltaY
            const newStart = dateFromTop(b.startAt, newTop)
            newStart.setTime(newStart.getTime() + move.dragInfo!.dayOffset * MS_PER_DAY)
            const newEnd = new Date(newStart.getTime() + duration)
            return { ...b, startAt: newStart, endAt: newEnd }
        })
        : blocks

    const days = useMemo(
        () =>
            Array.from({ length: 7 }, (_, i) => {
                const d = new Date(weekStart)
                d.setDate(d.getDate() + i)
                return d
            }),
        [weekStart]
    )

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const saved = localStorage.getItem('week-scroll');

        if (saved === null) return;

        requestAnimationFrame(() => {
            el.scrollTop = Number(saved);
        });
    }, [weekStart, isLoading]);

    if (isLoading) {
        return <div>Loading…</div>
    }

    return (
        <div className="week">
            <div className="week-header">
                <div className="time-col" />
                {days.map(day => (
                    <DayHeader key={day.toISOString()} date={day} />
                ))}
            </div>

            <div className="week-scroll" ref={scrollRef} onScroll={() => {
                if (!scrollRef.current) return
                localStorage.setItem('week-scroll', String(scrollRef.current.scrollTop));
            }}>
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
                            <DayColumn
                                key={day.toISOString()}
                                date={day}
                                segments={getSegmentsForDay(previewBlocks, day)}
                                interactions={interactions}
                                moveHook={move}
                            />
                        ))}
                    </div>
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