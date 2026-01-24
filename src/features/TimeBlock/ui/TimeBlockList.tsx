import type {PositionedTimeBlock, TimeBlockInteractions} from '../model/types.ts'
import { TimeBlock } from './TimeBlock.tsx'
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

                return (
                    <TimeBlock
                        key={block.id}
                        block={computedBlock}
                        interactions={{
                            ...interactions,
                            move: { start: moveBind.onMouseDown },
                            resize: { start: resizeBind.onMouseDown },
                        }}
                    />
                )
            })}
        </>
    )
}