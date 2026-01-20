import type { PositionedTimeBlock } from '../model/types'
import './TimeBlock.css'

type Props = {
    block: PositionedTimeBlock
}

export function TimeBlock({ block }: Props) {
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