import { useEffect, useState } from 'react'

export function useCurrentTime() {
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date())
        }, 60_000)

        return () => clearInterval(interval)
    }, [])

    return now
}