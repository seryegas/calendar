import { HabitFilterStatus } from '../model/types'
import type { HabitDto, HabitListResponse } from '../model/types'

const HOST = import.meta.env.VITE_HOST || ''
const PORT = import.meta.env.VITE_PORT || ''
const API_PART = import.meta.env.VITE_API_PART || ''
const API_URL = `http://${HOST}:${PORT}/${API_PART}`

export type HabitListParams = {
  page: number
  limit: number
  search: string
  filter: HabitFilterStatus
}

export async function fetchHabits(params: HabitListParams): Promise<HabitListResponse> {
  const url = new URL(`${API_URL}/habits`)
  url.searchParams.set('page', String(params.page))
  url.searchParams.set('limit', String(params.limit))
  if (params.search) url.searchParams.set('search', params.search)
  if (params.filter === HabitFilterStatus.Active) url.searchParams.set('is_active', 'true')
  else if (params.filter === HabitFilterStatus.Inactive) url.searchParams.set('is_active', 'false')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Failed to fetch habits: ${res.status}`)
  return res.json()
}

export async function createHabit(label: string, is_active: boolean): Promise<HabitDto> {
  const res = await fetch(`${API_URL}/habits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label, is_active })
  })
  if (!res.ok) throw new Error(`Failed to create habit: ${res.status}`)
  return res.json()
}

export async function updateHabit(id: number, label: string, is_active: boolean): Promise<HabitDto> {
  const res = await fetch(`${API_URL}/habits/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label, is_active })
  })
  if (!res.ok) throw new Error(`Failed to update habit: ${res.status}`)
  return res.json()
}

export async function deleteHabit(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/habits/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete habit: ${res.status}`)
}
