import type { TimeBlock, SegmentPosition } from './types.ts'

export function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    )
}

type DaySegment = TimeBlock & {
    segment: SegmentPosition
    sourceBlock: TimeBlock
}

function crossesMidnight(block: TimeBlock): boolean {
    if (isSameDay(block.startAt, block.endAt)) return false
    if (block.endAt.getHours() === 0 && block.endAt.getMinutes() === 0) return false
    return block.endAt > block.startAt
}

function endOfDay(day: Date): Date {
    const d = new Date(day)
    d.setHours(23, 59, 59, 999)
    return d
}

function startOfDay(day: Date): Date {
    const d = new Date(day)
    d.setHours(0, 0, 0, 0)
    return d
}

export function getSegmentsForDay(
    blocks: TimeBlock[],
    day: Date
): DaySegment[] {
    const segments: DaySegment[] = []

    for (const block of blocks) {
        if (!crossesMidnight(block)) {
            if (isSameDay(block.startAt, day)) {
                segments.push({
                    ...block,
                    segment: 'full',
                    sourceBlock: block,
                })
            }
        } else {
            if (isSameDay(block.startAt, day)) {
                segments.push({
                    ...block,
                    endAt: endOfDay(day),
                    segment: 'head',
                    sourceBlock: block,
                })
            }
            if (isSameDay(block.endAt, day)) {
                segments.push({
                    ...block,
                    startAt: startOfDay(day),
                    segment: 'tail',
                    sourceBlock: block,
                })
            }
        }
    }

    return segments
}
