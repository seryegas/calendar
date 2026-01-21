import type {PositionedTimeBlock, TimeBlockInteractions} from '../model/types'
import './TimeBlock.css'
import React, {useRef, useState, useEffect} from "react";

type Props = {
    block: PositionedTimeBlock
    interactions: TimeBlockInteractions
}

export function TimeBlock({block, interactions}: Props) {
    const [title, setTitle] = useState(block.title)
    const inputRef = useRef<HTMLInputElement>(null)
    const isEditing = block.isNew || block.title === ''

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus()
        }
    }, [isEditing])

    function commit() {
        if (title.trim() === '') {
            interactions.crud.cancelCreate(block.id)
        } else {
            interactions.crud.updateTitle(block.id, title.trim())
        }
    }

    function onKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') interactions.crud.cancelCreate(block.id)
    }

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
            onMouseDown={e => {
                if (isEditing) {
                    e.stopPropagation()
                    return
                }
                interactions.move.start(e, block.id)
            }}
        >
            {isEditing ? (
                <input
                    ref={inputRef}
                    className="time-block__input"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onBlur={commit}
                    onKeyDown={onKeyDown}
                    onMouseDown={e => e.stopPropagation()} // 🔥
                />
            ) : (
                <div className="time-block__title">
                    {block.title}
                </div>
            )}

            {block.description && (
                <div className="time-block__description">
                    {block.description}
                </div>
            )}
            <div
                className="time-block__resize-handle"
                onMouseDown={e => {
                    e.stopPropagation()
                    interactions.resize.start(e, block.id)
                }}
            />
        </div>
    )
}