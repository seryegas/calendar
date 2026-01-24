import React, { useEffect, useState } from 'react'
import {
    MIN_BLOCK_HEIGHT,
    snapMinutes,
    PIXEL_PER_MINUTES,
} from '../helpers.ts'
import type { PositionedTimeBlock } from '../types.ts'

type Params = {
    onDrop: (id: string, startAt: Date, endAt: Date) => void
}

export function useDragResize({ onDrop }: Params) {
    const [state, setState] =
        useState<{
            block: PositionedTimeBlock
            startY: number
            initialHeight: number
        } | null>(null)

    const [deltaY, setDeltaY] = useState(0)

    useEffect(() => {
        if (!state) return

        const onMove = (e: MouseEvent) =>
            setDeltaY(e.clientY - state.startY)

        const onUp = () => {
            const snapped = snapMinutes(deltaY)
            const height = Math.max(
                MIN_BLOCK_HEIGHT,
                state.initialHeight + snapped
            )

            const minutes = height / PIXEL_PER_MINUTES
            const newEnd = new Date(
                state.block.startAt.getTime() +
                minutes * 60 * 1000
            )

            onDrop(state.block.id, state.block.startAt, newEnd)
            setState(null)
            setDeltaY(0)
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)

        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
    }, [state, deltaY])

    return {
        bindResize(block: PositionedTimeBlock) {
            return {
                onMouseDown: (e: React.MouseEvent) => {
                    e.stopPropagation()
                    e.preventDefault()
                    setState({
                        block,
                        startY: e.clientY,
                        initialHeight: block.height,
                    })
                },
                draggedHeight:
                    state?.block.id === block.id
                        ? Math.max(
                            MIN_BLOCK_HEIGHT,
                            state.initialHeight +
                            snapMinutes(deltaY)
                        )
                        : block.height,
            }
        },
    }
}