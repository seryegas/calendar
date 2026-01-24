import type {CalendarView} from "../../../app/providers/CalendarProvider.tsx";

export function startOfWeek(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()

    const diff = day === 0 ? -6 : 1 - day

    d.setDate(d.getDate() + diff)
    d.setHours(0, 0, 0, 0)

    return d
}

export function addWeeks(date: Date, weeks: number): Date {
    const d = new Date(date)
    d.setDate(d.getDate() + weeks * 7)
    return d
}

export function getPeriodStartDate(view: CalendarView, date: Date): Date {
    const result = new Date(date)
    switch (view) {
        case 'day':
            return result
        case 'week':
            const day = result.getDay()
            const diffToMonday = day === 0 ? -6 : 1 - day
            result.setDate(result.getDate() + diffToMonday)
            result.setHours(0, 0, 0, 0)
            return result
        case 'month':
            result.setDate(1)
            result.setHours(0, 0, 0, 0)
            return result
        case 'year':
            result.setMonth(0, 1)
            result.setHours(0, 0, 0, 0)
            return result
        default:
            return result
    }
}

export function formatTime(date: Date) {
    return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
    })
}