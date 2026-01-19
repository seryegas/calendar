import { useCurrentTime } from '../model/useCurrentTime.ts'
import './CurrentTimeIndicator.css'

const HOUR_HEIGHT = 60

export function CurrentTimeIndicator() {
    const now = useCurrentTime()
    const additionalPixels = 10

    const minutesFromStart =
        now.getHours() * 60 + now.getMinutes() + additionalPixels

    const top = minutesFromStart * (HOUR_HEIGHT / 60)

    return (
        <div
            className="current-time"
            style={{ top }}
        >
            <div className="current-time__dot" />
            <div className="current-time__line" />
        </div>
    )
}