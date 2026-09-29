// ===== Капитал: динамика состояния по месяцам =====

export type Granularity = 'day' | 'month' | 'year'

// Точка графика — один бакет (день/месяц/год) накопительным итогом
export interface CapitalPoint {
  period: string                // 'YYYY-MM-DD' | 'YYYY-MM' | 'YYYY'
  month: string                 // legacy-алиас
  income: number
  expense: number
  net: number                   // прирост за бакет (доход - расход)
  adjustments: number           // неучтённые средства за бакет
  cumulativeBudget: number      // капитал только по бюджету
  cumulativeAdjustments: number // накопленные неучтённые
  total: number                 // общий капитал на конец бакета
}

export interface CapitalTimeline {
  from: string | null
  to: string | null
  granularity?: Granularity
  points: CapitalPoint[]
  total: number                 // капитал на последний бакет
}

// ===== Периоды графика =====
export const PERIODS = ['week', 'month', 'year', 'fiveyears', 'all'] as const
export type Period = typeof PERIODS[number]

export interface PeriodMeta {
  key: Period
  label: string
  granularity: Granularity
}

export const PERIOD_META: PeriodMeta[] = [
  { key: 'week',      label: 'Неделя',    granularity: 'day' },
  { key: 'month',     label: 'Месяц',     granularity: 'day' },
  { key: 'year',      label: 'Год',       granularity: 'month' },
  { key: 'fiveyears', label: '5 лет',     granularity: 'month' },
  { key: 'all',       label: 'Всё время', granularity: 'month' },
]

const iso = (d: Date) => d.toISOString().slice(0, 10)

// период → параметры запроса timeline (from/to/granularity)
export function periodToParams(p: Period): { granularity: Granularity; from?: string; to?: string } {
  const now = new Date()
  const to = iso(now)
  const back = (fn: (d: Date) => void): string => {
    const d = new Date(now)
    fn(d)
    return iso(d)
  }
  switch (p) {
    case 'week':      return { granularity: 'day',   from: back(d => d.setDate(d.getDate() - 6)), to }
    case 'month':     return { granularity: 'day',   from: back(d => d.setDate(d.getDate() - 30)), to }
    case 'year':      return { granularity: 'month', from: back(d => d.setMonth(d.getMonth() - 11)), to }
    case 'fiveyears': return { granularity: 'month', from: back(d => d.setMonth(d.getMonth() - 59)), to }
    case 'all':       return { granularity: 'month' }
  }
}

// Неучтённые средства (заначки, вклады, наличка с давних времён)
export interface CapitalAdjustment {
  id: number
  label: string
  amount: number                // отрицательное = долг/списание
  date: string                  // 'YYYY-MM-DD'
  note?: string
}

export type NewAdjustment = Omit<CapitalAdjustment, 'id'>

export const MONTH_SHORT = [
  'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
  'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек',
]

// 'YYYY-MM' → 'Май 2026'
export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return `${MONTH_SHORT[(m || 1) - 1]} ${y}`
}

// подпись бакета по гранулярности:
//  day   'YYYY-MM-DD' → '5 Май'
//  month 'YYYY-MM'    → 'Май 2026'
//  year  'YYYY'       → '2026'
export function periodLabel(period: string, gran: Granularity): string {
  const parts = period.split('-').map(Number)
  if (gran === 'year') return String(parts[0])
  if (gran === 'day') return `${parts[2]} ${MONTH_SHORT[(parts[1] || 1) - 1]}`
  return `${MONTH_SHORT[(parts[1] || 1) - 1]} ${parts[0]}`
}
