import type { PositionedTimeBlock } from '../model/types'
import { TimeBlock } from './TimeBlock'
import {useDragMove} from "../model/drag/useDragMove.ts";
import {useDragResize} from "../model/drag/useDragResize.ts";

type Props = {
    blocks: PositionedTimeBlock[]
    onChange: (
        id: string,
        startAt: Date,
        endAt: Date
    ) => void
    onUpdateTitle: (id: string, title: string) => void
    onCancelCreate: (id: string) => void
}

export function TimeBlockList({
                                  blocks,
                                  onChange,
                                  onUpdateTitle,
                                  onCancelCreate,
                              }: Props) {
    const move = useDragMove({onDrop: onChange,})
    const resize = useDragResize({onDrop: onChange})

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
                        onMouseDown={moveBind.onMouseDown}
                        onResizeMouseDown={resizeBind.onMouseDown}
                        onUpdateTitle={onUpdateTitle}
                        onCancelCreate={onCancelCreate}
                    />
                )
            })}
        </>
    )
}