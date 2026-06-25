import type { EntryChange, HabitEntryDto } from '../model/types'

const HOST = import.meta.env.VITE_HOST || ''
const PORT = import.meta.env.VITE_PORT || ''
const API_PART = import.meta.env.VITE_API_PART || ''
const API_URL = `http://${HOST}:${PORT}/${API_PART}`

export async function fetchMonthEntries(month: string): Promise<HabitEntryDto[]> {
  const url = new URL(`${API_URL}/habit-entries`)
  url.searchParams.set('month', month)
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Failed to fetch entries: ${res.status}`)
  return res.json()
}

export async function batchUpsertEntries(changes: EntryChange[]): Promise<void> {
  const res = await fetch(`${API_URL}/habit-entries/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  })
  if (!res.ok) throw new Error(`Failed to save entries: ${res.status}`)
}

export function sendBeaconEntries(changes: EntryChange[]): void {
  const blob = new Blob([JSON.stringify(changes)], { type: 'application/json' })
  navigator.sendBeacon(`${API_URL}/habit-entries/batch`, blob)
}
