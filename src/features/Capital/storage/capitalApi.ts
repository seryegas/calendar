import type { CapitalAdjustment, CapitalTimeline, NewAdjustment } from '../model/types'

const HOST = import.meta.env.VITE_HOST || ''
const PORT = import.meta.env.VITE_PORT || ''
const API_PART = import.meta.env.VITE_API_PART || ''

const API_URL = `http://${HOST}:${PORT}/${API_PART}/capital`

export interface TimelineParams {
  granularity?: 'day' | 'month' | 'year'
  from?: string   // 'YYYY-MM-DD'
  to?: string     // 'YYYY-MM-DD'
}

// Динамика капитала (график роста состояния) за выбранный период
export async function fetchTimeline(params: TimelineParams = {}): Promise<CapitalTimeline> {
  const q = new URLSearchParams()
  if (params.granularity) q.set('granularity', params.granularity)
  if (params.from) q.set('from', params.from)
  if (params.to) q.set('to', params.to)
  const qs = q.toString()
  const res = await fetch(`${API_URL}/timeline${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('timeline failed')
  return res.json()
}

function fromDoc(d: any): CapitalAdjustment {
  return {
    id: d.id,
    label: d.label ?? '',
    amount: d.amount,
    date: d.date,
    note: d.note || undefined,
  }
}

function toPayload(a: NewAdjustment) {
  return {
    label: a.label,
    amount: a.amount,
    date: a.date,
    note: a.note ?? '',
  }
}

export async function fetchAdjustments(): Promise<CapitalAdjustment[]> {
  const res = await fetch(`${API_URL}/adjustments`)
  if (!res.ok) throw new Error('adjustments failed')
  const docs = await res.json()
  return (docs as any[]).map(fromDoc)
}

export async function createAdjustment(a: NewAdjustment): Promise<void> {
  const res = await fetch(`${API_URL}/adjustments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toPayload(a)),
  })
  if (!res.ok) throw new Error('create failed')
}

export async function updateAdjustment(id: number, a: NewAdjustment): Promise<void> {
  const res = await fetch(`${API_URL}/adjustments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toPayload(a)),
  })
  if (!res.ok) throw new Error('update failed')
}

export async function deleteAdjustment(id: number): Promise<void> {
  await fetch(`${API_URL}/adjustments/${id}`, { method: 'DELETE' })
}
