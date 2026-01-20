const MINUTES_IN_HOUR = 60
const PIXELS_PER_HOUR = 60
const ADDITIONAL_PIXES = 10

export function minutesFromDayStart(date: Date): number {
    return date.getHours() * MINUTES_IN_HOUR + date.getMinutes()
}

export function calculateTop(startAt: Date): number {
    return (minutesFromDayStart(startAt) / MINUTES_IN_HOUR) * PIXELS_PER_HOUR + ADDITIONAL_PIXES
}

export function calculateHeight(startAt: Date, endAt: Date): number {
    const diffMinutes =
        (endAt.getTime() - startAt.getTime()) / 1000 / 60

    return (diffMinutes / MINUTES_IN_HOUR) * PIXELS_PER_HOUR
}

export function blockTop(start: Date): number {
    return minutesFromDayStart(start) + ADDITIONAL_PIXES
}

export function blockHeight(start: Date, end: Date): number {
    return minutesFromDayStart(end) - minutesFromDayStart(start)
}

export function dateFromTop(baseDate: Date, top: number): Date {
    const minutes = Math.round((top / PIXELS_PER_HOUR) * 60)

    const d = new Date(baseDate)
    d.setHours(0, 0, 0, 0)
    d.setMinutes(minutes)

    return d
}