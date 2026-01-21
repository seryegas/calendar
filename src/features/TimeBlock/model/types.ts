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