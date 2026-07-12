import { useState } from 'react'
import type { BudgetKind } from '../model/types'
import { categoriesOf } from '../model/types'
import type { NewTransaction } from '../model/transaction'
import './modals.css'

function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function AddTransactionModal({
  defaultKind,
  onClose,
  onSave,
}: {
  defaultKind: BudgetKind
  onClose: () => void
  onSave: (tx: NewTransaction) => void
}) {
  const [kind, setKind] = useState<BudgetKind>(defaultKind)
  const [date, setDate] = useState(today)
  const cats = categoriesOf(kind)
  const [categoryId, setCategoryId] = useState(cats[0].id)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const amountNum = parseFloat(amount.replace(',', '.'))
  const valid = date && categoryId && amountNum > 0

  function switchKind(k: BudgetKind) {
    setKind(k)
    setCategoryId(categoriesOf(k)[0].id)
  }

  function submit() {
    if (!valid) return
    onSave({
      date,
      kind,
      categoryId,
      amount: Math.round(amountNum * 100) / 100,
      note: note.trim() || undefined,
      source: 'manual',
    })
    onClose()
  }

  return (
    <div className="bg-modal-overlay" onMouseDown={onClose}>
      <div className="bg-modal" onMouseDown={e => e.stopPropagation()}>
        <div className="bg-modal-head">
          <span className="bg-modal-title">Новая операция</span>
          <button className="bg-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="bg-modal-body">
          <div className="bg-kindswitch">
            <button
              className={`bg-kindswitch-btn${kind === 'expense' ? ' bg-kindswitch-btn--exp' : ''}`}
              onClick={() => switchKind('expense')}
            >
              Расход
            </button>
            <button
              className={`bg-kindswitch-btn${kind === 'income' ? ' bg-kindswitch-btn--inc' : ''}`}
              onClick={() => switchKind('income')}
            >
              Доход
            </button>
          </div>

          <label className="bg-field">
            <span className="bg-field-label">Дата</span>
            <input type="date" className="bg-input" value={date} onChange={e => setDate(e.target.value)} />
          </label>

          <label className="bg-field">
            <span className="bg-field-label">Категория</span>
            <select className="bg-input" value={categoryId} onChange={e => setCategoryId(Number(e.target.value))}>
              {cats.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </label>

          <label className="bg-field">
            <span className="bg-field-label">Сумма, ₽</span>
            <input
              type="number"
              className="bg-input"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              autoFocus
            />
          </label>

          <label className="bg-field">
            <span className="bg-field-label">Описание</span>
            <input
              type="text"
              className="bg-input"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="необязательно"
            />
          </label>
        </div>

        <div className="bg-modal-foot">
          <button className="bg-btn bg-btn--ghost" onClick={onClose}>Отмена</button>
          <button className="bg-btn bg-btn--primary" onClick={submit} disabled={!valid}>
            Добавить
          </button>
        </div>
      </div>
    </div>
  )
}
