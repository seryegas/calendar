// ===== FIRE-прогноз: когда пассивный доход с капитала покроет расходы =====
//
// Идея: исторические линии дохода/расхода/пассива в прошлом не пересекаются —
// пассив сегодня мал. Точка финансовой независимости живёт только в проекции
// в будущее: капитал растёт (доходность + сбережения) → пассив растёт →
// пересекает линию расходов (критерий A) и/или капитал достигает 25× годовых
// расходов (критерий B, правило SWR).

import { MONTH_SHORT } from './types'

export interface FireSettings {
  startCapital: number        // текущий капитал
  monthlyContribution: number // ежемесячное пополнение (сбережения)
  targetExpense: number       // целевые месячные расходы (в сегодняшних деньгах)
  annualReturn: number        // % годовых, ожидаемая доходность
  inflation: number           // % годовых, рост расходов
  withdrawRate: number        // % безопасная ставка изъятия (4 ⇒ цель 25×)
}

export interface FirePoint {
  monthIndex: number  // 0 = текущий месяц
  capital: number     // капитал на конец месяца
  passive: number     // пассивный доход за месяц
  expense: number     // расход за месяц (с учётом инфляции)
}

export interface FireResult {
  points: FirePoint[]
  fiMonthA: number | null  // пассив ≥ расходы
  fiMonthB: number | null  // капитал ≥ targetNetWorth (25×)
  targetNetWorth: number
}

// дефолты допущений (правятся слайдерами)
export const DEFAULT_ASSUMPTIONS = {
  annualReturn: 7,
  inflation: 4,
  withdrawRate: 4,
} as const

export interface HistoryInput {
  startCapital: number
  incomes: number[]   // помесячно
  expenses: number[]  // помесячно
}

const avg = (xs: number[]): number =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0

// авто-значения из истории: капитал, средние сбережения и расходы
export function deriveDefaults(h: HistoryInput): FireSettings {
  const avgExp = avg(h.expenses)
  const avgInc = avg(h.incomes)
  return {
    startCapital: Math.max(0, Math.round(h.startCapital)),
    monthlyContribution: Math.max(0, Math.round(avgInc - avgExp)),
    targetExpense: Math.max(0, Math.round(avgExp)),
    ...DEFAULT_ASSUMPTIONS,
  }
}

// помесячная проекция капитала и пассивного дохода вперёд
export function projectFire(s: FireSettings, maxMonths = 600): FireResult {
  const rM = s.annualReturn / 100 / 12
  const infM = s.inflation / 100 / 12
  const targetNetWorth =
    s.withdrawRate > 0 ? (s.targetExpense * 12) / (s.withdrawRate / 100) : Infinity

  const points: FirePoint[] = []
  let cap = s.startCapital
  let exp = s.targetExpense
  let fiMonthA: number | null = null
  let fiMonthB: number | null = null

  for (let m = 0; m <= maxMonths; m++) {
    const passive = cap * rM
    points.push({ monthIndex: m, capital: cap, passive, expense: exp })
    if (fiMonthA === null && exp > 0 && passive >= exp) fiMonthA = m
    if (fiMonthB === null && cap >= targetNetWorth) fiMonthB = m
    cap = cap * (1 + rM) + s.monthlyContribution
    exp = exp * (1 + infM)
  }

  return { points, fiMonthA, fiMonthB, targetNetWorth }
}

// сколько месяцев показывать на графике: до достижения ФИ + запас
export function displayHorizon(r: FireResult): number {
  const fi = Math.max(r.fiMonthA ?? 0, r.fiMonthB ?? 0)
  const last = r.points.length - 1
  if (!fi) return Math.min(120, last)
  return Math.min(last, Math.max(60, fi + 12))
}

// смещение в месяцах → 'Мар 2034'
export function monthOffsetLabel(n: number, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth() + n, 1)
  return `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few
  return many
}

// смещение в месяцах → 'через 8 лет 3 мес' | 'уже достигнуто' | '—'
export function durationLabel(n: number | null): string {
  if (n === null) return '—'
  if (n <= 0) return 'уже достигнуто'
  const y = Math.floor(n / 12)
  const m = n % 12
  const parts: string[] = []
  if (y) parts.push(`${y} ${plural(y, 'год', 'года', 'лет')}`)
  if (m) parts.push(`${m} мес`)
  return 'через ' + (parts.join(' ') || '0 мес')
}
