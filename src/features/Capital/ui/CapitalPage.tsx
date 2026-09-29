import { useEffect, useState } from 'react'
import type { CapitalAdjustment, CapitalTimeline, NewAdjustment, Period } from '../model/types'
import { PERIOD_META, periodLabel, periodToParams } from '../model/types'
import {
  fetchTimeline,
  fetchAdjustments,
  createAdjustment,
  updateAdjustment,
  deleteAdjustment,
} from '../storage/capitalApi'
import { TrendChart, type TrendVariant } from '../../../shared/ui/TrendChart/TrendChart'
import { FireView } from './FireView'
import './CapitalPage.css'

type CapMode = 'dynamics' | 'fire'

const RUB = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

function fmtSigned(n: number): string {
  const s = RUB.format(Math.abs(n))
  return n < 0 ? `−${s}` : s
}

const TODAY = new Date().toISOString().slice(0, 10)
const LS_PERIOD = 'capital_period'
const LS_VARIANT = 'capital_variant'
const LS_MODE = 'capital_mode'

export function CapitalPage() {
  const [mode, setModeState] = useState<CapMode>(
    () => (localStorage.getItem(LS_MODE) as CapMode) || 'dynamics',
  )
  const [period, setPeriodState] = useState<Period>(
    () => (localStorage.getItem(LS_PERIOD) as Period) || 'year',
  )
  const [variant, setVariantState] = useState<TrendVariant>(
    () => (localStorage.getItem(LS_VARIANT) as TrendVariant) || 'bars',
  )
  const [timeline, setTimeline] = useState<CapitalTimeline | null>(null)
  const [adjustments, setAdjustments] = useState<CapitalAdjustment[]>([])
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)

  const reload = () => setReloadTick(t => t + 1)

  function setMode(m: CapMode) {
    setModeState(m)
    localStorage.setItem(LS_MODE, m)
  }
  function setPeriod(p: Period) {
    setPeriodState(p)
    localStorage.setItem(LS_PERIOD, p)
  }
  function setVariant(v: TrendVariant) {
    setVariantState(v)
    localStorage.setItem(LS_VARIANT, v)
  }

  // таймлайн зависит от периода и данных (операции + неучтённые)
  useEffect(() => {
    let cancelled = false
    setError('')
    fetchTimeline(periodToParams(period))
      .then(t => { if (!cancelled) setTimeline(t) })
      .catch(() => { if (!cancelled) setError('Не удалось загрузить данные капитала') })
    return () => { cancelled = true }
  }, [period, reloadTick])

  useEffect(() => {
    let cancelled = false
    fetchAdjustments()
      .then(a => { if (!cancelled) setAdjustments(a) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [reloadTick])

  const points = timeline?.points ?? []
  const gran = timeline?.granularity ?? 'month'
  const first = points[0]
  const last = points[points.length - 1]
  const isEmpty = !!timeline && points.length === 0

  // прирост капитала внутри окна = конец − капитал ДО первого бакета
  const opening = first ? first.total - first.net - first.adjustments : 0
  const growth = last ? last.total - opening : 0

  async function handleSave(a: NewAdjustment, editId: number | null) {
    if (editId != null) await updateAdjustment(editId, a)
    else await createAdjustment(a)
    reload()
  }
  async function handleDelete(id: number) {
    if (!confirm('Удалить эту запись?')) return
    await deleteAdjustment(id)
    reload()
  }

  return (
    <div className="cap-page">
      <div className="cap-main">
        {/* ===== TOPBAR ===== */}
        <div className="cap-topbar">
          <div className="cap-topbar-left">
            <span className="cap-title">Капитал</span>
            {last && <span className="cap-title-sub">{fmtSigned(last.total)}</span>}
            <div className="cap-seg cap-seg--mode">
              <button
                className={`cap-seg-btn${mode === 'dynamics' ? ' cap-seg-btn--active' : ''}`}
                onClick={() => setMode('dynamics')}
              >
                Динамика
              </button>
              <button
                className={`cap-seg-btn${mode === 'fire' ? ' cap-seg-btn--active' : ''}`}
                onClick={() => setMode('fire')}
              >
                Прогноз FIRE
              </button>
            </div>
          </div>
          <button
            className="cap-panel-toggle"
            onClick={() => setPanelOpen(true)}
            title="Неучтённые средства"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="13" rx="2" />
              <path d="M16 12h.01M2 10h20" />
            </svg>
            Неучтённые
          </button>
        </div>

        {mode === 'fire' ? (
          <FireView />
        ) : (
        <>
        {/* ===== CONTROLS ===== */}
        <div className="cap-controls">
          <div className="cap-seg">
            {PERIOD_META.map(p => (
              <button
                key={p.key}
                className={`cap-seg-btn${period === p.key ? ' cap-seg-btn--active' : ''}`}
                onClick={() => setPeriod(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="cap-variant">
            <button
              className={`cap-var-btn${variant === 'bars' ? ' cap-var-btn--active' : ''}`}
              onClick={() => setVariant('bars')}
              title="Колонны"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="6" y1="20" x2="6" y2="12" /><line x1="12" y1="20" x2="12" y2="6" /><line x1="18" y1="20" x2="18" y2="10" />
              </svg>
            </button>
            <button
              className={`cap-var-btn${variant === 'line' ? ' cap-var-btn--active' : ''}`}
              onClick={() => setVariant('line')}
              title="Линия"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 16 9 10 13 14 21 5" />
              </svg>
            </button>
          </div>
        </div>

        {error ? (
          <div className="cap-empty">
            <div className="cap-empty-title">{error}</div>
            <div className="cap-empty-sub">Проверьте, что бэкенд запущен.</div>
            <button className="cap-btn cap-btn--ghost" onClick={reload}>Повторить</button>
          </div>
        ) : isEmpty ? (
          <div className="cap-empty">
            <div className="cap-empty-title">Пока нет данных</div>
            <div className="cap-empty-sub">
              Капитал строится из операций бюджета и неучтённых средств.
              Добавьте операции в разделе «Бюджет» или неучтённые средства.
            </div>
          </div>
        ) : (
          <>
            <div className="cap-cards">
              <StatCard label="Общий капитал" value={fmtSigned(last?.total ?? 0)} accent />
              <StatCard label="По бюджету" value={fmtSigned(last?.cumulativeBudget ?? 0)} />
              <StatCard label="Неучтённые" value={fmtSigned(last?.cumulativeAdjustments ?? 0)} />
              <StatCard
                label="Прирост за период"
                value={fmtSigned(growth)}
                positive={growth > 0}
                negative={growth < 0}
              />
            </div>

            <div className="cap-chart-box">
              <TrendChart
                labels={points.map(p => periodLabel(p.period, gran))}
                series={[{ name: 'Капитал', color: '#f57c00', values: points.map(p => p.total) }]}
                variant={variant}
                formatValue={fmtSigned}
              />
            </div>
          </>
        )}
        </>
        )}
      </div>

      {/* ===== SLIDE-OVER: неучтённые средства ===== */}
      {panelOpen && <div className="cap-backdrop" onClick={() => setPanelOpen(false)} />}
      <AdjustmentsPanel
        open={panelOpen}
        items={adjustments}
        onClose={() => setPanelOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}

function StatCard({
  label, value, accent, negative, positive,
}: {
  label: string
  value: string
  accent?: boolean
  negative?: boolean
  positive?: boolean
}) {
  const cls =
    'cap-card' +
    (accent ? ' cap-card--accent' : '') +
    (negative ? ' cap-card--negative' : '') +
    (positive ? ' cap-card--positive' : '')
  return (
    <div className={cls}>
      <span className="cap-card-label">{label}</span>
      <span className="cap-card-value">{value}</span>
    </div>
  )
}

// ===== Панель неучтённых средств (slide-over) =====

function AdjustmentsPanel({
  open, items, onClose, onSave, onDelete,
}: {
  open: boolean
  items: CapitalAdjustment[]
  onClose: () => void
  onSave: (a: NewAdjustment, editId: number | null) => Promise<void>
  onDelete: (id: number) => void
}) {
  const [editId, setEditId] = useState<number | null>(null)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(TODAY)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const total = items.reduce((s, a) => s + a.amount, 0)

  function resetForm() {
    setEditId(null)
    setLabel('')
    setAmount('')
    setDate(TODAY)
    setNote('')
  }

  function startEdit(a: CapitalAdjustment) {
    setEditId(a.id)
    setLabel(a.label)
    setAmount(String(a.amount))
    setDate(a.date)
    setNote(a.note ?? '')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const amt = Number(amount.replace(',', '.'))
    if (!Number.isFinite(amt) || amt === 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return
    setBusy(true)
    try {
      await onSave({ label: label.trim(), amount: amt, date, note: note.trim() }, editId)
      resetForm()
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className={`cap-panel${open ? ' cap-panel--open' : ''}`}>
      <div className="cap-panel-head">
        <div>
          <span className="cap-panel-title">Неучтённые средства</span>
          <span className="cap-panel-total">{fmtSigned(total)}</span>
        </div>
        <button className="cap-panel-close" onClick={onClose} title="Закрыть">×</button>
      </div>
      <div className="cap-panel-hint">
        Деньги, что лежат отдельно от бюджета: заначки, вклады, наличка. Входят в общий капитал.
      </div>

      <form className="cap-form" onSubmit={submit}>
        <input
          className="cap-input"
          placeholder="Название (вклад, заначка)"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
        <div className="cap-form-row">
          <input
            className="cap-input"
            placeholder="Сумма (₽)"
            inputMode="decimal"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          <input
            className="cap-input"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
        <input
          className="cap-input"
          placeholder="Заметка (необязательно)"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <div className="cap-form-actions">
          <button className="cap-btn cap-btn--primary" disabled={busy}>
            {editId != null ? 'Сохранить' : '+ Добавить'}
          </button>
          {editId != null && (
            <button type="button" className="cap-btn cap-btn--ghost" onClick={resetForm}>
              Отмена
            </button>
          )}
        </div>
      </form>

      <div className="cap-list">
        {items.length === 0 && <div className="cap-list-empty">Пока пусто</div>}
        {items.map(a => (
          <div key={a.id} className={`cap-item${editId === a.id ? ' cap-item--edit' : ''}`}>
            <div className="cap-item-main" onClick={() => startEdit(a)}>
              <span className="cap-item-label">{a.label || 'Без названия'}</span>
              <span className="cap-item-meta">{a.date}{a.note ? ` · ${a.note}` : ''}</span>
            </div>
            <span className={`cap-item-amount${a.amount < 0 ? ' cap-item-amount--neg' : ''}`}>
              {fmtSigned(a.amount)}
            </span>
            <button className="cap-item-del" onClick={() => onDelete(a.id)} title="Удалить">×</button>
          </div>
        ))}
      </div>
    </aside>
  )
}
