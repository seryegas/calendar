import type {CalendarView} from "../../../app/providers/CalendarProvider.tsx";

export function formatRange(startDate: Date, view: CalendarView = 'week'): string {
    const start = new Date(startDate)

    if (view === 'day') {
        return new Intl.DateTimeFormat('ru', {
            day: 'numeric',
            month: 'long',
        }).format(start)
    }

    const end = new Date(startDate)
    end.setDate(start.getDate() + 6)

    const sameYear = start.getFullYear() === end.getFullYear()
    const sameMonth =
        sameYear && start.getMonth() === end.getMonth()

    const monthFormatter = new Intl.DateTimeFormat('ru', {
        month: 'long',
    })

    if (sameMonth) {
        return `${monthFormatter.format(start)} ${start.getFullYear()}`
    }

    if (sameYear) {
        return `${monthFormatter.format(start)} – ${monthFormatter.format(end)} ${start.getFullYear()}`
    }

    return `${monthFormatter.format(start)} ${start.getFullYear()} – ${monthFormatter.format(end)} ${end.getFullYear()}`
}