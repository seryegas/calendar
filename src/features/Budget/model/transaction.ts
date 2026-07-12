import type { BudgetKind } from './types'

export interface Transaction {
  id: number          // id операции (с бэкенда)
  date: string        // YYYY-MM-DD
  kind: BudgetKind
  categoryId: number  // id категории из констант
  amount: number      // рубли, > 0
  note?: string
  source: string      // 'manual' | 'tbank' | 'sber' | 'demo' | ...
  extId?: string      // id операции банка → для дедупликации
}

/** Новая операция без id (id присваивает бэкенд) */
export type NewTransaction = Omit<Transaction, 'id'>

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** Ключ дедупликации: extId банка, иначе дата+сумма+заметка */
export function dedupKey(t: Pick<Transaction, 'extId' | 'date' | 'kind' | 'amount' | 'note'>): string {
  if (t.extId) return `ext:${t.extId}`
  return `${t.kind}:${t.date}:${t.amount}:${t.note ?? ''}`
}
