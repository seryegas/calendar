import type { PositionedTimeBlock } from '../model/types'
import './TimeBlock.css'
import React, {useRef, useState, useEffect} from "react";

type Props = {
    block: PositionedTimeBlock
    onMouseDown: (e: React.MouseEvent) => void
    onResizeMouseDown: (e: React.MouseEvent) => void
    onUpdateTitle: (id: string, title: string) => void
    onCancelCreate: (id: string) => void
}

export function TimeBlock({ block, onMouseDown, onResizeMouseDown, onUpdateTitle, onCancelCreate }: Props) {
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
            onCancelCreate(block.id)
        } else {
            onUpdateTitle(block.id, title.trim())
        }
    }

    function onKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') onCancelCreate(block.id)
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
                    e.stopPropagation() // 🔥 не начинаем drag
                    return
                }
                onMouseDown(e)
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
                    e.stopPropagation() // 🔥
                    onResizeMouseDown(e)
                }}
            />
        </div>
    )
}