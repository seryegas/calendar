import { useEffect, useState, useCallback, type KeyboardEvent } from 'react'
import type { BudgetKind, Necessity } from '../model/types'
import { NECESSITY_META } from '../model/types'
import type { Transaction } from '../model/transaction'
import type { TxFilter } from '../storage/budgetApi'
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  setNecessity as setNecessityApi,
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
  necessity?: Necessity
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
  const showNec = kind === 'expense'

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
    setDraft({ date: t.date, amount: String(t.amount), note: t.note ?? '', necessity: t.necessity })
  }
  function startAdd() {
    setEditId('new')
    setDraft({ date: defaultDate, amount: '', note: '', necessity: undefined })
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
      necessity: showNec ? draft.necessity : undefined,
    }
    if (editId === 'new') await createTransaction(payload)
    else if (typeof editId === 'number') await updateTransaction(editId, payload)
    setEditId(null)
    load()
    onChanged()
  }

  // клик по плашке в списке: точечная установка/снятие целесообразности
  async function changeNecessity(t: Transaction, next: Necessity | undefined) {
    const value = t.necessity === next ? undefined : next
    // оптимистично обновляем строку
    setItems(prev => prev.map(x => (x.id === t.id ? { ...x, necessity: value } : x)))
    try {
      await setNecessityApi(t.id, value ?? null)
      onChanged()
    } catch {
      load() // откат к серверному состоянию
    }
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
                  showNec={showNec}
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
                    showNec={showNec}
                    onSave={saveDraft}
                    onCancel={() => setEditId(null)}
                  />
                ) : (
                  <div key={t.id} className="bg-list-row">
                    <span className="bg-list-date">{fmtDate(t.date)}</span>
                    <span className="bg-list-note">
                      <span className="bg-list-note-text">{t.note || '—'}</span>
                      {showNec && (
                        <span className="bg-nec-pick">
                          {NECESSITY_META.map(m => {
                            const on = t.necessity === m.key
                            return (
                              <button
                                key={m.key}
                                type="button"
                                title={m.label}
                                className={`bg-nec-dot${on ? ' bg-nec-dot--on' : ''}`}
                                style={on
                                  ? { background: m.color, borderColor: m.color, color: '#fff' }
                                  : { color: m.color, borderColor: m.color }}
                                onClick={() => changeNecessity(t, m.key)}
                              >
                                {on ? m.label : ''}
                              </button>
                            )
                          })}
                        </span>
                      )}
                    </span>
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
  showNec,
  onSave,
  onCancel,
}: {
  draft: Draft
  setDraft: (d: Draft) => void
  valid: boolean
  showNec: boolean
  onSave: () => void
  onCancel: () => void
}) {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && valid) onSave()
  }
  return (
    <div className="bg-list-row bg-list-row--edit">
      <input
        type="date"
        className="bg-input bg-input--sm bg-edit-date"
        value={draft.date}
        onChange={e => setDraft({ ...draft, date: e.target.value })}
        onKeyDown={onKeyDown}
      />
      <input
        type="text"
        className="bg-input bg-input--sm bg-edit-note"
        placeholder="Описание"
        value={draft.note}
        autoFocus
        onChange={e => setDraft({ ...draft, note: e.target.value })}
        onKeyDown={onKeyDown}
      />
      <input
        type="number"
        className="bg-input bg-input--sm bg-edit-amount"
        placeholder="Сумма"
        value={draft.amount}
        min="0"
        step="0.01"
        onChange={e => setDraft({ ...draft, amount: e.target.value })}
        onKeyDown={onKeyDown}
      />
      <span className="bg-list-actions">
        <button className="bg-icon-btn bg-icon-btn--ok" title="Сохранить" onClick={onSave} disabled={!valid}>✓</button>
        <button className="bg-icon-btn" title="Отмена" onClick={onCancel}>×</button>
      </span>
      {showNec && (
        <div className="bg-nec-select bg-nec-select--edit">
          {NECESSITY_META.map(m => (
            <button
              key={m.key}
              type="button"
              className={`bg-nec-opt${draft.necessity === m.key ? ' bg-nec-opt--on' : ''}`}
              style={draft.necessity === m.key ? { background: m.color, borderColor: m.color, color: '#fff' } : { color: m.color }}
              onClick={() => setDraft({ ...draft, necessity: draft.necessity === m.key ? undefined : m.key })}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function fmtDate(d: string): string {
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}
