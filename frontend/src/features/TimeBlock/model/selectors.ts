import type { TimeBlock } from './types'

export function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    )
}

export function getBlocksForDay(
    blocks: TimeBlock[],
    day: Date
): TimeBlock[] {
    return blocks.filter(block =>
        isSameDay(block.startAt, day)
    )
}