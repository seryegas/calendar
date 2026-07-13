import { useState, useEffect } from 'react'
import { categoriesOf } from '../../Budget/model/types'
import type { BudgetCategory } from '../../Budget/model/types'
import type { NewTransaction } from '../../Budget/model/transaction'
import { fetchSummary, createTransaction } from '../../Budget/storage/budgetApi'
import { AddTransactionModal } from '../../Budget/ui/AddTransactionModal'

type Props = {
  year: number
  month: number // 1..12
}

function fmtShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} млн`
  if (n >= 1_000) return `${Math.round(n / 1_000)} тыс`
  return String(Math.round(n))
}

export function MonthlyDonuts({ year, month }: Props) {
  const [incomeVals, setIncomeVals] = useState<number[]>([])
  const [expenseVals, setExpenseVals] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [reloadTick, setReloadTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchSummary('month', year, month)
      .then(s => {
        if (cancelled) return
        setIncomeVals(categoriesOf('income').map(c => s.categoryTotals?.income?.[c.id] ?? 0))
        setExpenseVals(categoriesOf('expense').map(c => s.categoryTotals?.expense?.[c.id] ?? 0))
      })
      .catch(() => { if (!cancelled) { setIncomeVals([]); setExpenseVals([]) } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [year, month, reloadTick])

  async function handleAdd(tx: NewTransaction) {
    await createTransaction(tx)
    setAddOpen(false)
    setReloadTick(t => t + 1)
  }

  return (
    <div className="dash-widget dash-budget">
      <div className="dash-widget-head">
        <span className="dash-widget-title">Бюджет за месяц</span>
        <button
          className="dash-add-btn"
          title="Новая затрата"
          onClick={() => setAddOpen(true)}
        >
          +
        </button>
      </div>
      {loading ? (
        <div className="dash-widget-empty">Загрузка…</div>
      ) : (
        <div className="dash-semi-grid">
          <SemiDonut title="Доходы" categories={categoriesOf('income')} values={incomeVals} />
          <SemiDonut title="Расходы" categories={categoriesOf('expense')} values={expenseVals} />
        </div>
      )}

      {addOpen && (
        <AddTransactionModal
          defaultKind="expense"
          onClose={() => setAddOpen(false)}
          onSave={handleAdd}
        />
      )}
    </div>
  )
}

function SemiDonut({
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
    .map((c, i) => ({ c, v: values[i] ?? 0 }))
    .filter(s => s.v > 0)
    .sort((a, b) => b.v - a.v)

  // full conic = 360deg; the visible top semicircle = 0..180deg = 0..50%
  let acc = 0
  const stops = segs.map(s => {
    const start = (acc / total) * 50
    acc += s.v
    const end = (acc / total) * 50
    return `${s.c.color} ${start}% ${end}%`
  })
  const bg =
    total > 0
      ? `conic-gradient(from -90deg, ${stops.join(', ')}, #eceef1 50% 100%)`
      : '#eceef1'

  return (
    <div className="dash-semi-block">
      <div className="dash-semi-title">{title}</div>
      <div className="dash-semi">
        <div className="dash-semi-arc" style={{ background: bg }} />
        <div className="dash-semi-hole" />
        <div className="dash-semi-value">{fmtShort(total)} ₽</div>
      </div>
      <div className="dash-semi-legend">
        {segs.length === 0 && <span className="dash-widget-empty">Нет данных</span>}
        {segs.slice(0, 5).map(s => (
          <div key={s.c.id} className="dash-legend-row">
            <span className="dash-legend-dot" style={{ background: s.c.color }} />
            <span className="dash-legend-label">{s.c.label}</span>
            <span className="dash-legend-pct">{Math.round((s.v / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
