export function formatWeekRange(weekStart: Date): string {
    const start = new Date(weekStart)
    const end = new Date(weekStart)
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