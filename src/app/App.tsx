import {CalendarPage} from "../pages/Calendar/CalendarPage.tsx";
import {CalendarProvider} from "./providers/CalendarProvider.tsx";

export default function App() {
    return <CalendarProvider><CalendarPage/></CalendarProvider>
}