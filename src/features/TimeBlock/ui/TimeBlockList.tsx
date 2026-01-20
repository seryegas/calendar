import type { PositionedTimeBlock } from '../model/types'
import { TimeBlock } from './TimeBlock'
import { useTimeBlockDrag } from '../model/useTimeBlockDrag'

type Props = {
    blocks: PositionedTimeBlock[]
    onChange: (
        id: string,
        startAt: Date,
        endAt: Date
    ) => void
}

export function TimeBlockList({
                                  blocks,
                                  onChange,
                              }: Props) {
    const { bind } = useTimeBlockDrag({
        onDrop: onChange,
    })

    return (
        <>
            {blocks.map(block => {
                const drag = bind(block)

                block.top = drag.draggedTop

                return (
                    <TimeBlock
                        block={block}
                        onMouseDown={drag.onMouseDown}
                    />
                )
            })}
        </>
    )
}