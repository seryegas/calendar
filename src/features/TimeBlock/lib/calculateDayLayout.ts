import type { TimeBlock, PositionedTimeBlock } from '../model/types'
import { blockTop, blockHeight } from '../model/helpers'

function overlaps(a: TimeBlock, b: TimeBlock): boolean {
    return a.startAt < b.endAt && b.startAt < a.endAt
}

export function calculateDayLayout(
    blocks: TimeBlock[]
): PositionedTimeBlock[] {
    if (blocks.length === 0) return []

    const sorted = [...blocks].sort(
        (a, b) => a.startAt.getTime() - b.startAt.getTime()
    )

    const groups: TimeBlock[][] = []

    for (const block of sorted) {
        let placed = false

        for (const group of groups) {
            if (group.some(b => overlaps(b, block))) {
                group.push(block)
                placed = true
                break
            }
        }

        if (!placed) {
            groups.push([block])
        }
    }

    const result: PositionedTimeBlock[] = []

    for (const group of groups) {
        const sortedGroup = [...group].sort(
            (a, b) => a.startAt.getTime() - b.startAt.getTime()
        )

        const columns: TimeBlock[][] = []

        for (const block of sortedGroup) {
            let placed = false

            for (const column of columns) {
                const last = column[column.length - 1]

                if (block.startAt >= last.endAt) {
                    column.push(block)
                    placed = true
                    break
                }
            }

            if (!placed) {
                columns.push([block])
            }
        }

        const columnsCount = columns.length

        columns.forEach((column, columnIndex) => {
            column.forEach(block => {
                result.push({
                    ...block,
                    top: blockTop(block.startAt),
                    height: blockHeight(block.startAt, block.endAt),
                    left: (columnIndex / columnsCount) * 100,
                    width: 100 / columnsCount,
                })
            })
        })
    }

    return result
}