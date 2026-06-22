import type {PositionedTimeBlock, TimeBlockInteractions} from '../model/types.ts'
import './TimeBlock.css'
import React, {useRef, useState, useEffect} from "react";
import {formatTime} from "../../../shared/lib/date/date.ts";
import {PIXEL_PER_MINUTES} from "../model/helpers.ts";

type Props = {
    block: PositionedTimeBlock
    interactions: TimeBlockInteractions
}

export function TimeBlock({block, interactions}: Props) {
    const [title, setTitle] = useState(block.title)
    const inputRef = useRef<HTMLInputElement>(null)
    const isEditing = block.isNew || block.title === ''

    const segment = block.segment
    const source = block.sourceBlock

    const segmentClass =
        segment === 'head' ? ' time-block--head' :
        segment === 'tail' ? ' time-block--tail' : ''

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus()
        }
    }, [isEditing])

    function commit() {
        const value = title.trim()
        console.log(value)

        if (value === '') {
            interactions.crud.cancelCreate(block.id)
            return
        }

        if (block.isNew) {
            interactions.crud.commitCreate(block.id, value)
        } else {
            interactions.crud.updateTitle(block.id, value)
        }
    }

    function onKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter') commit()
        if (e.key === 'Escape') interactions.crud.cancelCreate(block.id)
    }

    return (
        <div
            className={`time-block${segmentClass}`}
            style={{
                top: block.top,
                height: block.height - 2,
                left: `${block.left}%`,
                width: `calc(${block.width}% - 4px)`,
                backgroundColor: block.color ?? '#d2e3fc',
                zIndex: interactions.move.isDragging ? 100 : undefined,
                opacity: interactions.move.isDragging ? 0.85 : undefined,
            }}
            onMouseDown={e => {
                if (isEditing) {
                    e.stopPropagation()
                    return
                }
                if (segment === 'tail') return
                interactions.move.start(e, block.id)
            }}
            onContextMenu={e =>  {
                e.preventDefault()
                interactions.menu.open(e.clientX, e.clientY, source)
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
                    onMouseDown={e => e.stopPropagation()}
                />
            ) : (
                <div className="time-block__title">
                    {block.title}
                </div>
            )}

            {block.height > PIXEL_PER_MINUTES * 30 && (
                <div className="time-block__timeline">
                    {formatTime(source.startAt)} – {formatTime(source.endAt)}
                </div>
            )}

            {block.description && (
                <div className="time-block__description">
                    {block.description}
                </div>
            )}
            {segment !== 'head' && (
                <div
                    className="time-block__resize-handle"
                    onMouseDown={e => {
                        e.stopPropagation()
                        interactions.resize.start(e, block.id)
                    }}
                />
            )}
        </div>
    )
}
