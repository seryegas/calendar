import { useEffect, useState, useCallback } from 'react'
import type { BudgetKind } from '../model/types'
import type { Transaction } from '../model/transaction'
import type { TxFilter } from '../storage/budgetApi'
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../storage/budgetApi'
import './modals.css'

const RUB = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

interface Draft {
  date: string
  amount: string
  note: string
}

export function TransactionsListModal({
  title,
  kind,
  categoryId,
  filter,
  defaultDate,
  onClose,
  onChanged,
}: {
  title: string
  kind: BudgetKind
  categoryId: number
  filter: TxFilter
  defaultDate: string
  onClose: () => void
  onChanged: () => void
}) {
  const [items, setItems] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<number | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>({ date: defaultDate, amount: '', note: '' })

  const load = useCallback(() => {
    setLoading(true)
    fetchTransactions(filter)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.year, filter.month, filter.day, filter.kind, filter.categoryId])

  useEffect(() => { load() }, [load])

  const total = items.reduce((s, t) => s + t.amount, 0)

  function startEdit(t: Transaction) {
    setEditId(t.id)
    setDraft({ date: t.date, amount: String(t.amount), note: t.note ?? '' })
  }
  function startAdd() {
    setEditId('new')
    setDraft({ date: defaultDate, amount: '', note: '' })
  }

  const amountNum = parseFloat(draft.amount.replace(',', '.'))
  const draftValid = !!draft.date && amountNum > 0

  async function saveDraft() {
    if (!draftValid) return
    const payload = {
      kind,
      categoryId,
      amount: Math.round(amountNum * 100) / 100,
      note: draft.note.trim() || undefined,
      date: draft.date,
      source: 'manual',
    }
    if (editId === 'new') await createTransaction(payload)
    else if (typeof editId === 'number') await updateTransaction(editId, payload)
    setEditId(null)
    load()
    onChanged()
  }

  async function remove(id: number) {
    if (!confirm('Удалить операцию?')) return
    await deleteTransaction(id)
    load()
    onChanged()
  }

  return (
    <div className="bg-modal-overlay" onMouseDown={onClose}>
      <div className="bg-modal bg-modal--list" onMouseDown={e => e.stopPropagation()}>
        <div className="bg-modal-head">
          <span className="bg-modal-title">{title}</span>
          <button className="bg-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="bg-modal-body">
          <div className="bg-list-topbar">
            <span className="bg-list-total">
              Итого: <b>{RUB.format(total)}</b> · {items.length} оп.
            </span>
            <button className="bg-btn bg-btn--primary bg-btn--sm" onClick={startAdd} disabled={editId === 'new'}>
              + Добавить
            </button>
          </div>

          {loading ? (
            <div className="bg-list-empty">Загрузка…</div>
          ) : (
            <div className="bg-list">
              {editId === 'new' && (
                <EditRow
                  draft={draft}
                  setDraft={setDraft}
                  valid={draftValid}
                  onSave={saveDraft}
                  onCancel={() => setEditId(null)}
                />
              )}

              {items.length === 0 && editId !== 'new' && (
                <div className="bg-list-empty">Операций нет</div>
              )}

              {items.map(t =>
                editId === t.id ? (
                  <EditRow
                    key={t.id}
                    draft={draft}
                    setDraft={setDraft}
                    valid={draftValid}
                    onSave={saveDraft}
                    onCancel={() => setEditId(null)}
                  />
                ) : (
                  <div key={t.id} className="bg-list-row">
                    <span className="bg-list-date">{fmtDate(t.date)}</span>
                    <span className="bg-list-note">{t.note || '—'}</span>
                    <span className="bg-list-amount">{RUB.format(t.amount)}</span>
                    <span className="bg-list-actions">
                      <button className="bg-icon-btn" title="Изменить" onClick={() => startEdit(t)}>✎</button>
                      <button className="bg-icon-btn bg-icon-btn--danger" title="Удалить" onClick={() => remove(t.id)}>🗑</button>
                    </span>
                  </div>
                ),
              )}
            </div>
          )}
        </div>

        <div className="bg-modal-foot">
          <button className="bg-btn bg-btn--ghost" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  )
}

function EditRow({
  draft,
  setDraft,
  valid,
  onSave,
  onCancel,
}: {
  draft: Draft
  setDraft: (d: Draft) => void
  valid: boolean
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="bg-list-row bg-list-row--edit">
      <input
        type="date"
        className="bg-input bg-input--sm bg-edit-date"
        value={draft.date}
        onChange={e => setDraft({ ...draft, date: e.target.value })}
      />
      <input
        type="text"
        className="bg-input bg-input--sm bg-edit-note"
        placeholder="Описание"
        value={draft.note}
        onChange={e => setDraft({ ...draft, note: e.target.value })}
      />
      <input
        type="number"
        className="bg-input bg-input--sm bg-edit-amount"
        placeholder="Сумма"
        value={draft.amount}
        min="0"
        step="0.01"
        autoFocus
        onChange={e => setDraft({ ...draft, amount: e.target.value })}
      />
      <span className="bg-list-actions">
        <button className="bg-icon-btn bg-icon-btn--ok" title="Сохранить" onClick={onSave} disabled={!valid}>✓</button>
        <button className="bg-icon-btn" title="Отмена" onClick={onCancel}>×</button>
      </span>
    </div>
  )
}

function fmtDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}
