import {CalendarPageRefactored} from "../pages/Calendar/CalendarPageRefactored.tsx";
import {CalendarProvider} from "./providers/CalendarProvider.tsx";

export default function App() {
    return <CalendarProvider><CalendarPageRefactored/></CalendarProvider>
}