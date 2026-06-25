import { Header } from "../../widgets/header/Header.tsx"
import { Calendar } from "../../widgets/calendar/Calendar.tsx"
import { HabitTrackerPage } from "../../features/HabitTracker"
import { useApp } from "../../app/providers/CalendarProvider.tsx"
import type { AppSection } from "../../app/providers/applicationTypes.ts"

function renderSection(section: AppSection) {
    switch (section) {
        case 'tracker': return <HabitTrackerPage />
        case 'budget':  return null // TODO: BudgetPage
        case 'calendar':
        default:        return <Calendar />
    }
}

export function MainPage() {
    const { appSection } = useApp()

    return (
        <div>
            <Header />
            {renderSection(appSection)}
        </div>
    )
}
