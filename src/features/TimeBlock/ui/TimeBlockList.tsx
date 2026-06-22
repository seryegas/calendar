import type {PositionedTimeBlock, TimeBlockInteractions} from '../model/types.ts'
import { TimeBlock } from './TimeBlock.tsx'
import type {useDragMove} from "../model/drag/useDragMove.ts";
import {useDragResize} from "../model/drag/useDragResize.ts";

type Props = {
    blocks: PositionedTimeBlock[]
    interactions: TimeBlockInteractions
    moveHook: ReturnType<typeof useDragMove>
}

export function TimeBlockList({
                                  blocks,
                                  interactions,
                                  moveHook
                              }: Props) {
    const resize = useDragResize({onDrop: interactions.crud.updateBlockTime})

    return (
        <>
            {blocks.map(block => {
                const source = block.sourceBlock

                const moveBlock: PositionedTimeBlock = {
                    ...block,
                    startAt: source.startAt,
                    endAt: source.endAt,
                }

                const moveBind = moveHook.bindMove(moveBlock)
                const resizeBind = resize.bindResize(block, source.startAt)

                const computedBlock: PositionedTimeBlock = {
                    ...block,
                    height: resizeBind.draggedHeight,
                }

                return (
                    <TimeBlock
                        key={block.id + '-' + block.segment}
                        block={computedBlock}
                        interactions={{
                            ...interactions,
                            move: { start: moveBind.onMouseDown, deltaX: 0, isDragging: moveBind.isDragging },
                            resize: { start: resizeBind.onMouseDown },
                        }}
                    />
                )
            })}
        </>
    )
}
