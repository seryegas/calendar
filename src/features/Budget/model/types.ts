export const BUDGET_MODES = ['month', 'year'] as const
export type BudgetMode = typeof BUDGET_MODES[number]

export interface BudgetCategory {
  id: number
  name: string   // англ-слаг (стабильный ключ для правил/маппинга)
  label: string  // отображаемое имя
  color: string
}

export type BudgetKind = 'expense' | 'income'

// ===== Целесообразность траты (ось независима от категории) =====
export const NECESSITY_LEVELS = ['mandatory', 'useful', 'neutral', 'excess'] as const
export type Necessity = typeof NECESSITY_LEVELS[number]

export interface NecessityMeta {
  key: Necessity
  label: string
  color: string
}

// порядок = от нужного к лишнему (для сортировки/легенды)
export const NECESSITY_META: NecessityMeta[] = [
  { key: 'mandatory', label: 'Обязательное', color: '#1a73e8' },
  { key: 'useful',    label: 'Полезное',     color: '#34a853' },
  { key: 'neutral',   label: 'Нейтральное',  color: '#9aa0a6' },
  { key: 'excess',    label: 'Лишнее',       color: '#ea4335' },
]

export function necessityMeta(key: Necessity): NecessityMeta {
  return NECESSITY_META.find(m => m.key === key) ?? NECESSITY_META[2]
}

// id: расходы 1..99, доходы 101..199 (уникальны глобально)
export const EXPENSE_CATEGORIES: BudgetCategory[] = [
  { id: 1,  name: 'groceries',     label: 'Продукты',          color: '#34a853' },
  { id: 2,  name: 'dining',        label: 'Кафе и рестораны',  color: '#f9ab00' },
  { id: 3,  name: 'transport',     label: 'Транспорт',         color: '#1a73e8' },
  { id: 4,  name: 'housing',       label: 'Жильё и ЖКХ',       color: '#a142f4' },
  { id: 14, name: 'hygiene',       label: 'Гигиена',           color: '#00bfa5' },
  { id: 15, name: 'clothing',      label: 'Одежда',            color: '#ab47bc' },
  { id: 5,  name: 'health',        label: 'Здоровье',          color: '#ea4335' },
  { id: 6,  name: 'fitness',       label: 'Физкультура',       color: '#558b2f' },
  { id: 7,  name: 'shopping',      label: 'Покупки',           color: '#ff6d00' },
  { id: 9,  name: 'subscriptions', label: 'Подписки и связь',  color: '#00acc1' },
  { id: 10, name: 'education',     label: 'Образование',       color: '#3f51b5' },
  { id: 11, name: 'travel',        label: 'Путешествия',       color: '#009688' },
  { id: 12, name: 'gifts',         label: 'Подарки',           color: '#c0ca33' },
  { id: 8,  name: 'entertainment', label: 'Развлечения',       color: '#e91e63' },
  { id: 13, name: 'other',         label: 'Прочее',            color: '#9aa0a6' },
]

export const INCOME_CATEGORIES: BudgetCategory[] = [
  { id: 101, name: 'salary',      label: 'Зарплата',    color: '#34a853' },
  { id: 102, name: 'bonus',       label: 'Премия',      color: '#1a73e8' },
  { id: 103, name: 'freelance',   label: 'Фриланс',     color: '#a142f4' },
  { id: 104, name: 'business',    label: 'Бизнес',      color: '#f9ab00' },
  { id: 105, name: 'investments', label: 'Инвестиции',  color: '#00acc1' },
  { id: 106, name: 'rental',      label: 'Аренда',      color: '#ff6d00' },
  { id: 107, name: 'other',       label: 'Прочее',      color: '#9aa0a6' },
]

/** id категории по слагу (для правил/пресетов) */
export function categoryIdByName(kind: BudgetKind, name: string): number {
  const cats = categoriesOf(kind)
  return (cats.find(c => c.name === name) ?? cats[cats.length - 1]).id
}

export function categoriesOf(kind: BudgetKind): BudgetCategory[] {
  return kind === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}

// legacy-алиас (расходы)
export const CATEGORIES = EXPENSE_CATEGORIES

export const MONTH_LABELS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
