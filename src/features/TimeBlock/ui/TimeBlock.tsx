import type { PositionedTimeBlock } from '../model/types'
import './TimeBlock.css'
import React from "react";

type Props = {
    block: PositionedTimeBlock
    onMouseDown: (e: React.MouseEvent) => void
}

export function TimeBlock({ block, onMouseDown }: Props) {
    return (
        <div
            className="time-block"
            style={{
                top: block.top,
                height: block.height,
                left: `${block.left}%`,
                width: `${block.width}%`,
                backgroundColor: block.color ?? '#d2e3fc',
            }}
            onMouseDown={onMouseDown}
        >
            <div className="time-block__title">
                {block.title}
            </div>
            {block.description && (
                <div className="time-block__description">
                    {block.description}
                </div>
            )}
        </div>
    )
}