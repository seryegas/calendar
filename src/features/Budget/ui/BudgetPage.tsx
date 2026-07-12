import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import type { BudgetMode, BudgetKind, BudgetCategory } from '../model/types'
import { categoriesOf, MONTH_LABELS } from '../model/types'
import type { NewTransaction } from '../model/transaction'
import type { BudgetSummary } from '../storage/budgetApi'
import {
  fetchSummary,
  createTransaction,
  bulkCreate,
  clearTransactions,
} from '../storage/budgetApi'
import type { TxFilter } from '../storage/budgetApi'
import { AddTransactionModal } from './AddTransactionModal'
import { ImportCsvModal } from './ImportCsvModal'
import { TransactionsListModal } from './TransactionsListModal'
import './BudgetPage.css'

const now = new Date()
const CURRENT_YEAR = now.getFullYear()
const CURRENT_MONTH = now.getMonth() + 1

const YEAR_FROM = 1970
// по возрастанию: 1970 → текущий
const YEARS = Array.from({ length: CURRENT_YEAR - YEAR_FROM + 1 }, (_, i) => YEAR_FROM + i)

const LS_MODE = 'budget_mode'
const LS_YEAR = 'budget_year'
const LS_MONTH = 'budget_month'
const LS_KIND = 'budget_kind'

function restoreMode(): BudgetMode {
  const raw = localStorage.getItem(LS_MODE)
  return raw === 'year' ? 'year' : 'month'
}

function restoreKind(): BudgetKind {
  const raw = localStorage.getItem(LS_KIND)
  return raw === 'income' ? 'income' : 'expense'
}

function restoreYear(): number {
  const y = parseInt(localStorage.getItem(LS_YEAR) ?? '')
  return y >= YEAR_FROM && y <= CURRENT_YEAR ? y : CURRENT_YEAR
}

function restoreMonth(): number {
  const m = parseInt(localStorage.getItem(LS_MONTH) ?? '')
  return m >= 1 && m <= 12 ? m : CURRENT_MONTH
}

const RUB = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})

function fmt(n: number): string {
  return n === 0 ? '—' : RUB.format(n)
}

function fmtSigned(n: number): string {
  const s = RUB.format(Math.abs(n))
  return n < 0 ? `−${s}` : s
}

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} млн`
  if (n >= 1_000) return `${Math.round(n / 1_000)} тыс`
  return String(Math.round(n))
}

export function BudgetPage() {
  const [mode, setModeState] = useState<BudgetMode>(restoreMode)
  const [kind, setKindState] = useState<BudgetKind>(restoreKind)
  const [selectedYear, setYearState] = useState<number>(restoreYear)
  const [selectedMonth, setMonthState] = useState<number>(restoreMonth)
  const [breakdownOpen, setBreakdownOpen] = useState(false)

  const [summary, setSummary] = useState<BudgetSummary | null>(null)
  const [error, setError] = useState('')
  const [reloadTick, setReloadTick] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [drill, setDrill] = useState<DrillState | null>(null)

  const reload = () => setReloadTick(t => t + 1)

  // Загрузка агрегатов с бэкенда при смене периода/данных
  useEffect(() => {
    let cancelled = false
    setError('')
    fetchSummary(mode, selectedYear, selectedMonth)
      .then(s => { if (!cancelled) setSummary(s) })
      .catch(() => { if (!cancelled) { setSummary(null); setError('Не удалось загрузить данные бюджета') } })
    return () => { cancelled = true }
  }, [mode, selectedYear, selectedMonth, reloadTick])

  const yearListRef = useRef<HTMLDivElement>(null)
  const activeYearRef = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    if (mode !== 'year') return
    const el = activeYearRef.current
    const box = yearListRef.current
    if (!el || !box) return
    box.scrollTop = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2
  }, [mode, selectedYear])

  function setMode(m: BudgetMode) {
    setModeState(m)
    localStorage.setItem(LS_MODE, m)
  }
  function setKind(k: BudgetKind) {
    setKindState(k)
    localStorage.setItem(LS_KIND, k)
  }
  function setYear(y: number) {
    setYearState(y)
    localStorage.setItem(LS_YEAR, String(y))
  }
  function setMonth(m: number) {
    setMonthState(m)
    localStorage.setItem(LS_MONTH, String(m))
  }

  // ===== мутации (через API), затем перезагрузка агрегатов =====
  async function handleAdd(tx: NewTransaction) {
    await createTransaction(tx)
    reload()
  }
  async function handleImport(list: NewTransaction[]): Promise<number> {
    const added = await bulkCreate(list)
    reload()
    return added
  }
  async function clearAll() {
    if (!confirm('Удалить все операции бюджета?')) return
    await clearTransactions()
    reload()
  }

  // ===== доступ к агрегатам summary =====
  const cellVal = (k: BudgetKind, period: number, catId: number) =>
    summary?.cells?.[k]?.[period]?.[catId] ?? 0

  const categories = categoriesOf(kind)

  const rows =
    mode === 'month'
      ? buildMonthRows(kind, selectedYear, selectedMonth, cellVal)
      : buildYearRows(kind, selectedYear, cellVal)

  const colTotals = categories.map(c => summary?.categoryTotals?.[kind]?.[c.id] ?? 0)
  const grandTotal = summary?.totals?.[kind] ?? 0

  const incomeByCat = categoriesOf('income').map(c => summary?.categoryTotals?.income?.[c.id] ?? 0)
  const expenseByCat = categoriesOf('expense').map(c => summary?.categoryTotals?.expense?.[c.id] ?? 0)
  const periodIncome = summary?.totals?.income ?? 0
  const periodExpense = summary?.totals?.expense ?? 0
  const balance = summary?.totals?.balance ?? 0

  const title =
    mode === 'month'
      ? `Бюджет — ${MONTH_LABELS[selectedMonth - 1]} ${selectedYear}`
      : `Бюджет — ${selectedYear} год`

  const isEmpty = !!summary && periodIncome === 0 && periodExpense === 0

  // клик по ячейке → drill-down списка операций
  function openCell(period: number, cat: BudgetCategory) {
    if (mode === 'month') {
      const mm = String(selectedMonth).padStart(2, '0')
      const dd = String(period).padStart(2, '0')
      setDrill({
        title: `${cat.label} — ${period} ${MONTH_LABELS[selectedMonth - 1]} ${selectedYear}`,
        kind,
        categoryId: cat.id,
        filter: { year: selectedYear, month: selectedMonth, day: period, kind, categoryId: cat.id },
        defaultDate: `${selectedYear}-${mm}-${dd}`,
      })
    } else {
      setDrill({
        title: `${cat.label} — ${MONTH_LABELS[period - 1]} ${selectedYear}`,
        kind,
        categoryId: cat.id,
        filter: { year: selectedYear, month: period, kind, categoryId: cat.id },
        defaultDate: `${selectedYear}-${String(period).padStart(2, '0')}-01`,
      })
    }
  }

  return (
    <div className="bg-page">
      {/* ===== SIDEBAR ===== */}
      <div className="bg-sidebar">
        {mode === 'month' ? (
          <>
            <div className="bg-year-selector">
              <div className="bg-year-value">{selectedYear}</div>
              <div className="bg-year-nav">
                <button
                  className="bg-year-arrow"
                  onClick={() => setYear(Math.max(YEAR_FROM, selectedYear - 1))}
                  disabled={selectedYear <= YEAR_FROM}
                >
                  ‹
                </button>
                <button
                  className="bg-year-arrow"
                  onClick={() => setYear(Math.min(CURRENT_YEAR, selectedYear + 1))}
                  disabled={selectedYear >= CURRENT_YEAR}
                >
                  ›
                </button>
              </div>
            </div>
            {MONTH_LABELS.map((label, i) => {
              const monthNum = i + 1
              const disabled =
                selectedYear === CURRENT_YEAR && monthNum > CURRENT_MONTH
              return (
                <button
                  key={label}
                  className={`bg-side-btn${selectedMonth === monthNum ? ' bg-side-btn--active' : ''}${disabled ? ' bg-side-btn--disabled' : ''}`}
                  onClick={() => !disabled && setMonth(monthNum)}
                  disabled={disabled}
                >
                  {label}
                </button>
              )
            })}
          </>
        ) : (
          <div className="bg-year-list" ref={yearListRef}>
            {YEARS.map(y => (
              <button
                key={y}
                ref={selectedYear === y ? activeYearRef : undefined}
                className={`bg-side-btn${selectedYear === y ? ' bg-side-btn--active' : ''}`}
                onClick={() => setYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ===== MAIN ===== */}
      <div className="bg-main">
        <div className="bg-topbar">
          <span className="bg-title">{title}</span>
          <div className="bg-topbar-actions">
            <button className="bg-action-btn bg-action-btn--primary" onClick={() => setAddOpen(true)}>
              + Добавить
            </button>
            <button className="bg-action-btn" onClick={() => setImportOpen(true)}>
              Импорт CSV
            </button>
            <div className="bg-mode-switch">
              <button
                className={`bg-mode-btn${mode === 'month' ? ' bg-mode-btn--active' : ''}`}
                onClick={() => setMode('month')}
              >
                Месяц
              </button>
              <button
                className={`bg-mode-btn${mode === 'year' ? ' bg-mode-btn--active' : ''}`}
                onClick={() => setMode('year')}
              >
                Год
              </button>
            </div>
          </div>
        </div>

        {/* ===== SUMMARY ===== */}
        <div className={`bg-summary${breakdownOpen ? ' bg-summary--open' : ''}`}>
          <button
            className="bg-sum-card bg-sum-card--income"
            onClick={() => setBreakdownOpen(o => !o)}
          >
            <span className="bg-sum-label">Доход</span>
            <span className="bg-sum-value">{fmt(periodIncome)}</span>
          </button>
          <button
            className="bg-sum-card bg-sum-card--expense"
            onClick={() => setBreakdownOpen(o => !o)}
          >
            <span className="bg-sum-label">Расход</span>
            <span className="bg-sum-value">{fmt(periodExpense)}</span>
          </button>
          <button
            className={`bg-sum-card bg-sum-card--balance${balance < 0 ? ' bg-sum-card--negative' : ''}`}
            onClick={() => setBreakdownOpen(o => !o)}
          >
            <span className="bg-sum-label">Остаток</span>
            <span className="bg-sum-value">{fmtSigned(balance)}</span>
          </button>
        </div>

        {/* ===== BREAKDOWN (пончики) ===== */}
        {breakdownOpen && (
          <div className="bg-breakdown">
            <Donut title="Доходы" categories={categoriesOf('income')} values={incomeByCat} />
            <Donut title="Расходы" categories={categoriesOf('expense')} values={expenseByCat} />
          </div>
        )}

        {/* ===== KIND TABS ===== */}
        <div className="bg-kind-tabs">
          <button
            className={`bg-kind-tab${kind === 'expense' ? ' bg-kind-tab--active' : ''}`}
            onClick={() => setKind('expense')}
          >
            Расходы
          </button>
          <button
            className={`bg-kind-tab${kind === 'income' ? ' bg-kind-tab--active' : ''}`}
            onClick={() => setKind('income')}
          >
            Доходы
          </button>
          {!isEmpty && (
            <span className="bg-tabs-right">
              <button className="bg-clear-link" onClick={clearAll}>Очистить</button>
            </span>
          )}
        </div>

        {error ? (
          <div className="bg-empty">
            <div className="bg-empty-title">{error}</div>
            <div className="bg-empty-sub">Проверьте, что бэкенд запущен.</div>
            <div className="bg-empty-actions">
              <button className="bg-btn bg-btn--ghost" onClick={reload}>Повторить</button>
            </div>
          </div>
        ) : isEmpty ? (
          <div className="bg-empty">
            <div className="bg-empty-title">Пока нет операций</div>
            <div className="bg-empty-sub">Добавьте вручную, импортируйте выписку банка или залейте демо-данные.</div>
            <div className="bg-empty-actions">
              <button className="bg-btn bg-btn--primary" onClick={() => setAddOpen(true)}>+ Добавить</button>
              <button className="bg-btn bg-btn--ghost" onClick={() => setImportOpen(true)}>Импорт CSV</button>
            </div>
          </div>
        ) : (
          <div className="bg-table-wrap">
            <table className="bg-table">
              <thead>
                <tr>
                  <th className="bg-th bg-row-th">
                    {mode === 'month' ? 'Дата' : 'Месяц'}
                  </th>
                  {categories.map(c => (
                    <th key={c.id} className="bg-th bg-th--cat">
                      <span className="bg-cat-dot" style={{ background: c.color }} />
                      <span className="bg-th-label">{c.label}</span>
                    </th>
                  ))}
                  <th className="bg-th bg-th--total">Итого</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const rowTotal = row.values.reduce((a, b) => a + b, 0)
                  return (
                    <tr key={row.key}>
                      <td className="bg-row-td">
                        <span className="bg-row-label">{row.label}</span>
                        {row.sub && <span className="bg-row-sub">{row.sub}</span>}
                      </td>
                      {row.values.map((v, ci) => (
                        <td
                          key={ci}
                          className={`bg-cell bg-cell--click${v === 0 ? ' bg-cell--zero' : ''}`}
                          onClick={() => openCell(row.period, categories[ci])}
                        >
                          {fmt(v)}
                        </td>
                      ))}
                      <td className="bg-cell bg-cell--total">{fmt(rowTotal)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="bg-foot-label">Итого</td>
                  {colTotals.map((t, ci) => (
                    <td key={ci} className="bg-foot-td">{fmt(t)}</td>
                  ))}
                  <td className="bg-foot-td bg-foot-td--grand">{fmt(grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {addOpen && (
        <AddTransactionModal
          defaultKind={kind}
          onClose={() => setAddOpen(false)}
          onSave={handleAdd}
        />
      )}
      {importOpen && (
        <ImportCsvModal
          onClose={() => setImportOpen(false)}
          onImport={handleImport}
        />
      )}
      {drill && (
        <TransactionsListModal
          title={drill.title}
          kind={drill.kind}
          categoryId={drill.categoryId}
          filter={drill.filter}
          defaultDate={drill.defaultDate}
          onClose={() => setDrill(null)}
          onChanged={reload}
        />
      )}
    </div>
  )
}

interface DrillState {
  title: string
  kind: BudgetKind
  categoryId: number
  filter: TxFilter
  defaultDate: string
}

function Donut({
  title,
  categories,
  values,
}: {
  title: string
  categories: BudgetCategory[]
  values: number[]
}) {
  const total = values.reduce((a, b) => a + b, 0)
  const segs = categories
    .map((c, i) => ({ c, v: values[i] }))
    .filter(s => s.v > 0)
    .sort((a, b) => b.v - a.v)

  let acc = 0
  const stops = segs.map(s => {
    const start = (acc / total) * 100
    acc += s.v
    const end = (acc / total) * 100
    return `${s.c.color} ${start}% ${end}%`
  })
  const bg = total > 0 ? `conic-gradient(${stops.join(', ')})` : '#eceef1'

  return (
    <div className="bg-donut-block">
      <div className="bg-donut-title">{title}</div>
      <div className="bg-donut-row">
        <div className="bg-donut" style={{ background: bg }}>
          <div className="bg-donut-hole">
            <span className="bg-donut-total">{fmtShort(total)}</span>
            <span className="bg-donut-cur">₽</span>
          </div>
        </div>
        <div className="bg-donut-legend">
          {segs.length === 0 && <span className="bg-legend-empty">Нет данных</span>}
          {segs.map(s => (
            <div key={s.c.id} className="bg-legend-row">
              <span className="bg-legend-dot" style={{ background: s.c.color }} />
              <span className="bg-legend-label">{s.c.label}</span>
              <span className="bg-legend-pct">{Math.round((s.v / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface Row {
  key: string
  label: string
  sub?: string
  period: number  // month-view → день; year-view → месяц
  values: number[]
}

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

function buildMonthRows(
  kind: BudgetKind,
  year: number,
  month: number,
  cellVal: (k: BudgetKind, period: number, catId: number) => number,
): Row[] {
  const cats = categoriesOf(kind)
  const daysInMonth = new Date(year, month, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dow = new Date(year, month - 1, day).getDay()
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return {
      key: date,
      label: String(day),
      sub: DAY_NAMES[dow],
      period: day,
      values: cats.map(c => cellVal(kind, day, c.id)),
    }
  })
}

function buildYearRows(
  kind: BudgetKind,
  year: number,
  cellVal: (k: BudgetKind, period: number, catId: number) => number,
): Row[] {
  const cats = categoriesOf(kind)
  return MONTH_LABELS.map((label, i) => {
    const month = i + 1
    return {
      key: `${year}-${month}`,
      label,
      period: month,
      values: cats.map(c => cellVal(kind, month, c.id)),
    }
  })
}
