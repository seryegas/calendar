import React from "react";

export type TimeBlockId = string

export type TimeBlock = {
    id: TimeBlockId
    title: string
    description?: string
    startAt: Date
    endAt: Date
    color?: string
    isNew?: boolean
}

export type PositionedTimeBlock = TimeBlock & {
    top: number
    height: number
    left: number
    width: number
}

export type TimeBlockInteractions = {
    move: {
        start: (
            e: React.MouseEvent,
            blockId: string
        ) => void
    }

    resize: {
        start: (
            e: React.MouseEvent,
            blockId: string
        ) => void
    }

    crud: {
        create: (block: TimeBlock) => void
        updateBlockTime: (
            id: string,
            startAt: Date,
            endAt: Date
        ) => void
        updateTitle: (
            id: string,
            title: string
        ) => void
        cancelCreate: (id: string) => void
    }
}