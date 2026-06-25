import {WeekGrid} from "./grids/week/WeekGrid.tsx";
import {DayGrid} from "./grids/day/DayGrid.tsx";
import {MonthGrid} from "./grids/month/MonthGrid.tsx";
import {YearGrid} from "./grids/year/YearGrid.tsx";
import { useApp } from "../../app/providers/CalendarProvider.tsx";

export function Calendar() {
    const { view } = useApp()

    switch (view) {
        case 'day':
            return <DayGrid />
        case 'week':
            return <WeekGrid />
        case 'month':
            return <MonthGrid />
        case 'year':
            return <YearGrid />
    }
}