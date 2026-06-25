import { MainPage } from "../pages/Main/MainPage.tsx"
import { AppProvider } from "./providers/CalendarProvider.tsx"

export default function App() {
    return <AppProvider><MainPage /></AppProvider>
}
