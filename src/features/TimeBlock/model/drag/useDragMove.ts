import React, {useEffect, useState} from "react";
import {dateFromTop, PIXEL_PER_MINUTES, snapMinutes} from "../helpers.ts";
import type {PositionedTimeBlock} from "../types.ts";
import type {DragMoveState} from "./types.ts";

type Params = {
    onDrop: (id: string, startAt: Date, endAt: Date) => void
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export function useDragMove({ onDrop }: Params) {
    const [drag, setDrag] = useState<DragMoveState | null>(null)
    const [deltaY, setDeltaY] = useState(0)
    const [deltaX, setDeltaX] = useState(0)

    useEffect(() => {
        if (!drag) return

        const onMove = (e: MouseEvent) => {
            setDeltaY(e.clientY - drag.startY)
            setDeltaX(e.clientX - drag.startX)
        }

        const onUp = () => {
            const finalTop = drag.initialTop + deltaY
            const dayOffset = Math.round(deltaX / drag.columnWidth)

            const duration =
                drag.block.endAt.getTime() -
                drag.block.startAt.getTime()

            const newStart = dateFromTop(
                drag.block.startAt,
                finalTop
            )

            newStart.setTime(newStart.getTime() + dayOffset * MS_PER_DAY)

            const newEnd = new Date(
                newStart.getTime() + duration
            )

            onDrop(drag.block.id, newStart, newEnd)

            setDrag(null)
            setDeltaY(0)
            setDeltaX(0)
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)

        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
    }, [drag, deltaY, deltaX, onDrop])

    const snappedDeltaY = drag ? snapMinutes(deltaY / PIXEL_PER_MINUTES) * PIXEL_PER_MINUTES : 0
    const snappedDeltaX = drag ? Math.round(deltaX / drag.columnWidth) * drag.columnWidth : 0

    function bindMove(block: PositionedTimeBlock) {
        return {
            onMouseDown: (e: React.MouseEvent) => {
                e.preventDefault()
                const column = (e.target as HTMLElement).closest('.day-column')
                const columnWidth = column?.getBoundingClientRect().width ?? 100

                setDrag({
                    block,
                    startY: e.clientY,
                    startX: e.clientX,
                    initialTop: block.top,
                    columnWidth,
                })
            },
            isDragging:
                drag?.block.id === block.id,
            draggedTop:
                drag?.block.id === block.id
                    ? drag.initialTop + snappedDeltaY
                    : block.top,
            draggedDeltaX:
                drag?.block.id === block.id
                    ? snappedDeltaX
                    : 0,
        }
    }

    return { bindMove }
}