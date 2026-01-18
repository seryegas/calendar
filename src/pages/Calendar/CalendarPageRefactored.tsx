import {Header} from "../../widgets/header/Header.tsx";
import {CalendarWidget} from "../../widgets/calendar-week/CalendarWidget.tsx";

export function CalendarPageRefactored() {
    return <div>
        <Header {'key'} />
        <CalendarWidget />
    </div>;
}