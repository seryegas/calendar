import type {CalendarView} from "../../../app/providers/CalendarProvider.tsx";
import type {PeriodNavigator} from "./navigarors/types.ts";
import {useWeekNavigator} from "./navigarors/useWeekNavigator.ts";

export function usePeriodNavigation(view: CalendarView): PeriodNavigator {
    switch(view) {
        case 'day':
        //    return useDayNavigator(initialDate)
        case 'week':
            return useWeekNavigator()
        case 'month':
        // return useMonthNavigator(initialDate)
        case 'year':
        // return useYearNavigator(initialDate)
        default:
            return useWeekNavigator()
    }
}