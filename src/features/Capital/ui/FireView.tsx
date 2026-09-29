import { useEffect, useMemo, useState } from 'react'
import { fetchTimeline } from '../storage/capitalApi'
import { fetchMonthlySeries } from '../../Budget/storage/budgetApi'
import {
  deriveDefaults,
  displayHorizon,
  durationLabel,
  monthOffsetLabel,
  projectFire,
  type FireSettings,
  type HistoryInput,
} from '../model/fire'
import { TrendChart, type TrendMarker } from '../../../shared/ui/TrendChart/TrendChart'
import './FireView.css'

const RUB = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
})
const fmt = (n: number) => RUB.format(Math.round(n))

const LS_OVERRIDES = 'capital_fire_settings'
// любое поле может быть переопределено вручную поверх авто-значений
type Overrides = Partial<FireSettings>

function loadOverrides(): Overrides {
  try {
    return JSON.parse(localStorage.getItem(LS_OVERRIDES) || '{}')
  } catch {
    return {}
  }
}

// диапазон истории: последние 24 месяца
function historyRange(): { from: string; to: string } {
  const now = new Date()
  const pad = (m: number) => String(m).padStart(2, '0')
  const to = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
  const f = new Date(now.getFullYear(), now.getMonth() - 23, 1)
  const from = `${f.getFullYear()}-${pad(f.getMonth() + 1)}`
  return { from, to }
}

export function FireView() {
  const [history, setHistory] = useState<HistoryInput | null>(null)
  const [overrides, setOverrides] = useState<Overrides>(loadOverrides)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // загрузка: текущий капитал (таймлайн) + помесячные доходы/расходы
  useEffect(() => {
    let cancelled = false
    setError('')
    setLoading(true)
    const { from, to } = historyRange()
    // серия бюджета обязательна; капитал (timeline) — по возможности (роут может отсутствовать)
    Promise.all([
      fetchMonthlySeries(from, to),
      fetchTimeline({ granularity: 'month' }).catch(() => null),
    ])
      .then(([series, timeline]) => {
        if (cancelled) return
        const startCapital = timeline
          ? timeline.total ?? timeline.points[timeline.points.length - 1]?.total ?? 0
          : 0
        setHistory({ startCapital, incomes: series.income, expenses: series.expense })
      })
      .catch(() => { if (!cancelled) setError('Не удалось загрузить данные для прогноза') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const defaults = useMemo<FireSettings | null>(
    () => (history ? deriveDefaults(history) : null),
    [history],
  )

  const settings = useMemo<FireSettings | null>(
    () => (defaults ? { ...defaults, ...overrides } : null),
    [defaults, overrides],
  )

  const result = useMemo(() => (settings ? projectFire(settings) : null), [settings])

  function patch(p: Overrides) {
    setOverrides(prev => {
      const next = { ...prev, ...p }
      localStorage.setItem(LS_OVERRIDES, JSON.stringify(next))
      return next
    })
  }
  function resetAuto() {
    setOverrides({})
    localStorage.removeItem(LS_OVERRIDES)
  }

  if (loading) {
    return <div className="fire-empty"><div className="fire-empty-title">Загрузка прогноза…</div></div>
  }
  if (error) {
    return (
      <div className="fire-empty">
        <div className="fire-empty-title">{error}</div>
        <div className="fire-empty-sub">Проверьте, что бэкенд запущен.</div>
      </div>
    )
  }
  if (!settings || !result || !defaults) return null

  const isEmpty =
    settings.startCapital === 0 &&
    settings.targetExpense === 0 &&
    Object.keys(overrides).length === 0
  if (isEmpty) {
    return (
      <div className="fire-empty">
        <div className="fire-empty-title">Недостаточно данных</div>
        <div className="fire-empty-sub">
          Прогноз строится из капитала и истории доходов/расходов.
          Добавьте операции в «Бюджет» и неучтённые средства в «Капитал»
          — или задайте параметры вручную.
        </div>
        <button className="fire-reset" onClick={() => patch({ startCapital: 0 })}>
          Ввести вручную
        </button>
      </div>
    )
  }

  // окно отображения графиков
  const hz = displayHorizon(result)
  const pts = result.points.slice(0, hz + 1)
  const labels = pts.map(p => monthOffsetLabel(p.monthIndex))

  const flowMarker: TrendMarker[] =
    result.fiMonthA != null && result.fiMonthA <= hz
      ? [{ index: result.fiMonthA, label: 'ФИ', color: '#188038' }]
      : []
  const targetMarker: TrendMarker[] =
    result.fiMonthB != null && result.fiMonthB <= hz
      ? [{ index: result.fiMonthB, label: 'Цель', color: '#1a73e8' }]
      : []

  // норма сбережения и текущий пассив (следуют за настройками)
  const avgIncome = settings.monthlyContribution + settings.targetExpense
  const savingsRate = avgIncome > 0 ? (settings.monthlyContribution / avgIncome) * 100 : 0
  const passiveNow = settings.startCapital * (settings.annualReturn / 100 / 12)

  return (
    <div className="fire">
      {/* ===== карточки-итоги ===== */}
      <div className="fire-cards">
        <FireCard
          accent
          label="ФИ · пассив ≥ расходы"
          value={result.fiMonthA != null ? monthOffsetLabel(result.fiMonthA) : 'не достигается'}
          sub={durationLabel(result.fiMonthA)}
        />
        <FireCard
          label={`Цель 25× (SWR ${settings.withdrawRate}%)`}
          value={result.fiMonthB != null ? monthOffsetLabel(result.fiMonthB) : 'не достигается'}
          sub={fmt(result.targetNetWorth)}
        />
        <FireCard
          label="Норма сбережения"
          value={`${savingsRate.toFixed(0)}%`}
          sub={`${fmt(settings.monthlyContribution)} / мес`}
        />
        <FireCard
          label="Пассив сейчас"
          value={`${fmt(passiveNow)} / мес`}
          sub={`из ${fmt(settings.startCapital)}`}
        />
      </div>

      {/* ===== допущения ===== */}
      <div className="fire-controls">
        <Slider
          label="Доходность" suffix="% / год" min={0} max={15} step={0.5}
          value={settings.annualReturn} onChange={v => patch({ annualReturn: v })}
        />
        <Slider
          label="Инфляция" suffix="% / год" min={0} max={15} step={0.5}
          value={settings.inflation} onChange={v => patch({ inflation: v })}
        />
        <Slider
          label="Ставка изъятия" suffix="%" min={2} max={6} step={0.5}
          value={settings.withdrawRate} onChange={v => patch({ withdrawRate: v })}
        />
        <NumField
          label="Текущий капитал" value={settings.startCapital}
          onChange={v => patch({ startCapital: v })}
        />
        <NumField
          label="Взнос / мес" value={settings.monthlyContribution}
          onChange={v => patch({ monthlyContribution: v })}
        />
        <NumField
          label="Целевые расходы / мес" value={settings.targetExpense}
          onChange={v => patch({ targetExpense: v })}
        />
        <button className="fire-reset" onClick={resetAuto}>Сбросить к авто</button>
      </div>

      {/* ===== график 1: денежный поток ===== */}
      <div className="fire-chart-block">
        <div className="fire-chart-head">
          <span className="fire-chart-title">Денежный поток</span>
          <span className="fire-chart-hint">пересечение пассива и расходов = финансовая независимость</span>
        </div>
        <div className="fire-chart-box">
          <TrendChart
            variant="line"
            labels={labels}
            markers={flowMarker}
            formatValue={fmt}
            series={[
              { name: 'Расходы', color: '#ea4335', values: pts.map(p => p.expense) },
              { name: 'Пассивный доход', color: '#188038', values: pts.map(p => p.passive) },
              { name: 'Активный доход', color: '#9aa0a6', values: pts.map(() => avgIncome) },
            ]}
          />
        </div>
      </div>

      {/* ===== график 2: путь к цели ===== */}
      <div className="fire-chart-block">
        <div className="fire-chart-head">
          <span className="fire-chart-title">Путь к цели</span>
          <span className="fire-chart-hint">капитал против цели 25× годовых расходов</span>
        </div>
        <div className="fire-chart-box">
          <TrendChart
            variant="line"
            labels={labels}
            markers={targetMarker}
            formatValue={fmt}
            series={[
              { name: 'Капитал', color: '#1a73e8', values: pts.map(p => p.capital) },
              { name: 'Цель 25×', color: '#f57c00', values: pts.map(() => result.targetNetWorth) },
            ]}
          />
        </div>
      </div>
    </div>
  )
}

function FireCard({
  label, value, sub, accent,
}: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`fire-card${accent ? ' fire-card--accent' : ''}`}>
      <span className="fire-card-label">{label}</span>
      <span className="fire-card-value">{value}</span>
      {sub && <span className="fire-card-sub">{sub}</span>}
    </div>
  )
}

function Slider({
  label, suffix, min, max, step, value, onChange,
}: {
  label: string; suffix: string; min: number; max: number; step: number
  value: number; onChange: (v: number) => void
}) {
  return (
    <label className="fire-field">
      <span className="fire-field-label">
        {label}<b>{value}{suffix}</b>
      </span>
      <input
        className="fire-slider" type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </label>
  )
}

function NumField({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="fire-field">
      <span className="fire-field-label">{label}</span>
      <input
        className="fire-num" type="number" inputMode="numeric"
        value={value}
        onChange={e => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
    </label>
  )
}
