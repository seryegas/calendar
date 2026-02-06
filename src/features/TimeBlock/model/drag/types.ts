import type { PositionedTimeBlock } from '../types.ts'

export type DragBase = {
    block: PositionedTimeBlock
    startY: number
}

export type DragMoveState = DragBase & {
    initialTop: number
    startX: number
    columnWidth: number
}

export type DragResizeState = DragBase & {
    initialHeight: number
}