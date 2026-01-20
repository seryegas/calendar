import type { TimeBlock } from '../model/types'
import { TimeBlock as TimeBlockItem } from './TimeBlock'
import {calculateDayLayout} from "../lib/calculateDayLayout.ts";

type Props = {
    blocks: TimeBlock[]
}

export function TimeBlockList({ blocks }: Props) {
    const positionedBlocks = calculateDayLayout(blocks)

    return (
        <>
            {positionedBlocks.map(block => (
                    <TimeBlockItem
                        key={block.id}
                block={block}
    />
))}
    </>
)
}