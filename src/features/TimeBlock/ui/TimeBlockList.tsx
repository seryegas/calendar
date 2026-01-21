import type {PositionedTimeBlock, TimeBlockInteractions} from '../model/types'
import { TimeBlock } from './TimeBlock'
import {useDragMove} from "../model/drag/useDragMove.ts";
import {useDragResize} from "../model/drag/useDragResize.ts";

type Props = {
    blocks: PositionedTimeBlock[]
    interactions: TimeBlockInteractions
}

export function TimeBlockList({
                                  blocks,
                                  interactions
                              }: Props) {
    const move = useDragMove({onDrop: interactions.crud.updateBlockTime,})
    const resize = useDragResize({onDrop: interactions.crud.updateBlockTime})

    return (
        <>
            {blocks.map(block => {
                const moveBind = move.bindMove(block)
                const resizeBind = resize.bindResize(block)

                const computedBlock = {
                    ...block,
                    top: moveBind.draggedTop,
                    height: resizeBind.draggedHeight
                }

                interactions.move.start = moveBind.onMouseDown
                interactions.resize.start = resizeBind.onMouseDown

                return (
                    <TimeBlock
                        key={block.id}
                        block={computedBlock}
                        interactions={interactions}
                    />
                )
            })}
        </>
    )
}