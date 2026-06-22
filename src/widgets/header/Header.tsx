import {formatRange} from "../../shared/lib/date/formatRange.ts";
import {ViewSwitcher} from "./ui/ViewSwitcher.tsx";
import "./ui/Header.css"
import {useCalendar} from "../../app/providers/CalendarProvider.tsx";
import {Navigation} from "./ui/Navigation.tsx";

export function Header(){
    const { selectedDay, view } = useCalendar()

    const currentDate = formatRange(selectedDay, view)

    return (
        <header className="header">
            <div className="header-left">
                <span className="logo">
                    <svg className="logo-icon" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Календарь
                </span>
                <Navigation />
                <div className="current-date">{currentDate}</div>
            </div>

            <div className="header-right">
                <ViewSwitcher />
                <button className="account-button">С</button>
            </div>
        </header>
    );
}