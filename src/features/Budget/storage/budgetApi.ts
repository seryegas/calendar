import type { NewTransaction, Transaction } from '../model/transaction'
import type { BudgetKind, BudgetMode } from '../model/types'

const HOST = import.meta.env.VITE_HOST || ''
const PORT = import.meta.env.VITE_PORT || ''
const API_PART = import.meta.env.VITE_API_PART || ''

const API_URL = `http://${HOST}:${PORT}/${API_PART}/budget-transactions`

// Ответ агрегации с бэкенда
export interface BudgetSummary {
  view: BudgetMode
  year: number
  month?: number
  // cells[kind][period][categoryId] = сумма; period = день (month) или месяц (year)
  cells: Record<BudgetKind, Record<number, Record<number, number>>>
  categoryTotals: Record<BudgetKind, Record<number, number>>
  totals: { income: number; expense: number; balance: number }
}

function toPayload(t: NewTransaction) {
  return {
    kind: t.kind,
    categoryId: t.categoryId,
    amount: t.amount,
    description: t.note ?? '',
    date: t.date,
    source: t.source,
    extId: t.extId,
  }
}

export async function fetchSummary(
  view: BudgetMode,
  year: number,
  month: number,
): Promise<BudgetSummary> {
  const q = new URLSearchParams({ view, year: String(year), month: String(month) })
  const res = await fetch(`${API_URL}/summary?${q}`)
  if (!res.ok) throw new Error('summary failed')
  return res.json()
}

export async function createTransaction(tx: NewTransaction): Promise<void> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toPayload(tx)),
  })
  if (!res.ok) throw new Error('create failed')
}

export async function bulkCreate(list: NewTransaction[]): Promise<number> {
  const res = await fetch(`${API_URL}/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(list.map(toPayload)),
  })
  if (!res.ok) throw new Error('bulk failed')
  const data = await res.json()
  return data.added ?? 0
}

export async function clearTransactions(source?: string): Promise<void> {
  const url = source ? `${API_URL}?source=${encodeURIComponent(source)}` : API_URL
  await fetch(url, { method: 'DELETE' })
}

// ===== drill-down: список операций по ячейке =====

export interface TxFilter {
  year: number
  month?: number
  day?: number
  kind?: BudgetKind
  categoryId?: number
}

function fromDoc(d: any): Transaction {
  return {
    id: d.id,
    date: d.date,
    kind: d.kind,
    categoryId: d.categoryId,
    amount: d.amount,
    note: d.description || undefined,
    source: d.source,
    extId: d.extId,
  }
}

export async function fetchTransactions(f: TxFilter): Promise<Transaction[]> {
  const q = new URLSearchParams({ year: String(f.year) })
  if (f.month != null) q.set('month', String(f.month))
  if (f.day != null) q.set('day', String(f.day))
  if (f.kind) q.set('kind', f.kind)
  if (f.categoryId != null) q.set('categoryId', String(f.categoryId))
  const res = await fetch(`${API_URL}?${q}`)
  if (!res.ok) throw new Error('list failed')
  const docs = await res.json()
  return (docs as any[]).map(fromDoc)
}

export async function updateTransaction(id: number, tx: NewTransaction): Promise<void> {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(toPayload(tx)),
  })
  if (!res.ok) throw new Error('update failed')
}

export async function deleteTransaction(id: number): Promise<void> {
  await fetch(`${API_URL}/${id}`, { method: 'DELETE' })
}
