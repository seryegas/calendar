const MINUTES_IN_HOUR = 60
const PIXELS_PER_HOUR = 60
export const PIXEL_PER_MINUTES = 1
export const SNAP_MINUTES = 15
export const MIN_BLOCK_HEIGHT = 15

export function minutesFromDayStart(date: Date): number {
    return date.getHours() * MINUTES_IN_HOUR + date.getMinutes()
}

export function calculateTop(startAt: Date): number {
    return (minutesFromDayStart(startAt) / MINUTES_IN_HOUR) * PIXELS_PER_HOUR
}

export function calculateHeight(startAt: Date, endAt: Date): number {
    const diffMinutes =
        (endAt.getTime() - startAt.getTime()) / 1000 / 60

    return (diffMinutes / MINUTES_IN_HOUR) * PIXELS_PER_HOUR
}

export function blockTop(start: Date): number {
    return minutesFromDayStart(start)
}

export function blockHeight(start: Date, end: Date): number {
    return minutesFromDayStart(end) - minutesFromDayStart(start)
}

export function snapMinutes(minutes: number): number {
    return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES
}

export function dateFromTop(baseDate: Date, top: number): Date {
    const minutes = top / PIXEL_PER_MINUTES
    const snappedMinutes = snapMinutes(minutes)

    const d = new Date(baseDate)
    d.setHours(0, snappedMinutes, 0, 0)

    return d
}