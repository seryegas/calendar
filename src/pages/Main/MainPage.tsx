import { Header } from "../../widgets/header/Header.tsx"
import { Calendar } from "../../widgets/calendar/Calendar.tsx"
import { HabitTrackerPage } from "../../features/HabitTracker"
import { BudgetPage } from "../../features/Budget"
import { DashboardPage } from "../../features/Dashboard"
import { useApp } from "../../app/providers/CalendarProvider.tsx"
import type { AppSection } from "../../app/providers/applicationTypes.ts"

function renderSection(section: AppSection) {
    switch (section) {
        case 'tracker':  return <HabitTrackerPage />
        case 'budget':   return <BudgetPage />
        case 'calendar': return <Calendar />
        case 'dashboard':
        default:         return <DashboardPage />
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
