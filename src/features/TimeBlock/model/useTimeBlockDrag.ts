import React, { useEffect, useState } from 'react'
import { dateFromTop } from './helpers.ts'
import type { PositionedTimeBlock } from './types'

type DragState = {
    block: PositionedTimeBlock
    startY: number
    initialTop: number
}

type Params = {
    onDrop: (id: string, startAt: Date, endAt: Date) => void
}

export function useTimeBlockDrag({ onDrop }: Params) {
    const [drag, setDrag] = useState<DragState | null>(null)
    const [deltaY, setDeltaY] = useState(0)

    useEffect(() => {
        if (!drag) return

        const onMove = (e: MouseEvent) => {
            setDeltaY(e.clientY - drag.startY)
        }

        const onUp = () => {
            const finalTop = drag.initialTop + deltaY

            const duration =
                drag.block.endAt.getTime() -
                drag.block.startAt.getTime()

            const newStart = dateFromTop(
                drag.block.startAt,
                finalTop
            )

            const newEnd = new Date(
                newStart.getTime() + duration
            )

            onDrop(drag.block.id, newStart, newEnd)

            setDrag(null)
            setDeltaY(0)
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)

        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
    }, [drag, deltaY, onDrop])

    function bind(block: PositionedTimeBlock) {
        return {
            onMouseDown: (e: React.MouseEvent) => {
                e.preventDefault()
                setDrag({
                    block,
                    startY: e.clientY,
                    initialTop: block.top,
                })
            },
            isDragging:
                drag?.block.id === block.id,
            draggedTop:
                drag?.block.id === block.id
                    ? drag.initialTop + deltaY
                    : block.top,
        }
    }

    return { bind }
}