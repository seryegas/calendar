import type { PositionedTimeBlock } from '../types'

export type DragBase = {
    block: PositionedTimeBlock
    startY: number
}

export type DragMoveState = DragBase & {
    initialTop: number
}

export type DragResizeState = DragBase & {
    initialHeight: number
}