export interface PeriodNavigator {
    currentDate: Date
    setCurrentDate: (date: Date) => void
    goNext: () => void
    goPrev: () => void
    goToToday: () => void
}