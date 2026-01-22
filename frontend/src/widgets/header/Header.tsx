import {formatRange} from "../../shared/lib/date/formatRange.ts";
import {ViewSwitcher} from "./ui/ViewSwitcher.tsx";
import "./ui/Header.css"
import {useCalendar} from "../../app/providers/CalendarProvider.tsx";
import {Navigation} from "./ui/Navigation.tsx";

export function Header(){
    const { selectedDay } = useCalendar()

    const currentDate = formatRange(selectedDay)

    return (
        <header className="header">
            <div className="header-left">
                <span className="logo">📅 Календарь</span>
            </div>

            <Navigation />

            <div className="current-date">{currentDate}</div>

            <div className="header-center">
                <ViewSwitcher />
            </div>

            <div className="header-right">
                <button className="account-button">
                    👤 Аккаунт
                </button>
            </div>
        </header>
    );
}