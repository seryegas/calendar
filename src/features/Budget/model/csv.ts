import type { BudgetKind } from './types'
import { categoryIdByName } from './types'

// ===== Парс CSV с учётом кавычек =====

export function detectDelimiter(sample: string): string {
  const line = sample.split(/\r?\n/).find(l => l.trim()) ?? ''
  const counts: Record<string, number> = {
    ';': (line.match(/;/g) || []).length,
    ',': (line.match(/,/g) || []).length,
    '\t': (line.match(/\t/g) || []).length,
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] || ';'
}

function splitLine(line: string, delim: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === delim && !inQuotes) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map(s => s.trim())
}

export interface ParsedCsv {
  headers: string[]
  rows: string[][]
}

export function parseCsv(text: string, delim: string): ParsedCsv {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }
  const headers = splitLine(lines[0], delim)
  const rows = lines.slice(1).map(l => splitLine(l, delim))
  return { headers, rows }
}

// ===== Парс значений =====

/** "-1 234,56" / "1234.56" → число (модуль) + знак */
export function parseAmount(raw: string): number {
  if (!raw) return NaN
  let s = raw.replace(/\s| |₽|руб\.?/gi, '')
  const neg = s.startsWith('-') || s.startsWith('−')
  s = s.replace(/[−-]/g, '')
  if (s.includes(',') && s.includes('.')) {
    // '.' — тысячи, ',' — десятичные
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (s.includes(',')) {
    s = s.replace(',', '.')
  }
  const n = parseFloat(s)
  if (isNaN(n)) return NaN
  return neg ? -n : n
}

/** "DD.MM.YYYY[ HH:MM:SS]" | "YYYY-MM-DD" → YYYY-MM-DD */
export function parseDate(raw: string): string | null {
  if (!raw) return null
  const s = raw.trim().split(/[ T]/)[0]
  let m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  return null
}

// ===== Пресеты банков =====

export interface BankPreset {
  id: string
  name: string
  delimiter: string
  encoding: 'utf-8' | 'windows-1251'
  cols: { date: string; amount: string; category?: string; desc?: string }
}

export const BANK_PRESETS: BankPreset[] = [
  {
    id: 'tbank',
    name: 'Т-Банк (Тинькофф)',
    delimiter: ';',
    encoding: 'windows-1251',
    cols: { date: 'Дата операции', amount: 'Сумма операции', category: 'Категория', desc: 'Описание' },
  },
  {
    id: 'sber',
    name: 'Сбер',
    delimiter: ';',
    encoding: 'windows-1251',
    cols: { date: 'Дата операции', amount: 'Сумма', category: 'Категория', desc: 'Описание' },
  },
  {
    id: 'vtb',
    name: 'ВТБ',
    delimiter: ';',
    encoding: 'windows-1251',
    cols: { date: 'Дата операции', amount: 'Сумма в валюте счёта', category: 'Категория', desc: 'Описание операции' },
  },
  {
    id: 'generic',
    name: 'Другой (настроить вручную)',
    delimiter: ';',
    encoding: 'utf-8',
    cols: { date: '', amount: '' },
  },
]

/** Индекс колонки по имени заголовка (case-insensitive, contains) */
export function findColumn(headers: string[], name: string): number {
  if (!name) return -1
  const n = name.toLowerCase()
  let i = headers.findIndex(h => h.toLowerCase() === n)
  if (i >= 0) return i
  return headers.findIndex(h => h.toLowerCase().includes(n))
}

// ===== Авто-категоризация =====

const EXPENSE_KEYWORDS: Record<string, string[]> = {
  groceries: ['супермаркет', 'продукт', 'магнит', 'пятероч', 'перекрест', 'ашан', 'лента', 'дикси', 'вкусвилл', 'grocery'],
  dining: ['ресторан', 'кафе', 'фастфуд', 'бар', 'кофейн', 'кофе', 'бургер', 'пицц', 'суши', 'starbucks', 'кофемания'],
  transport: ['транспорт', 'такси', 'метро', 'яндекс.такси', 'uber', 'topup', 'проезд', 'каршеринг', 'парковк', 'топлив', 'азс', 'бензин'],
  housing: ['жкх', 'коммунал', 'аренд', 'квартплат', 'электроэнерг', 'газ', 'вода', 'ипотек'],
  health: ['аптек', 'здоровье', 'клиник', 'больниц', 'медицин', 'стоматолог', 'врач', 'анализ'],
  fitness: ['фитнес', 'спорт', 'бассейн', 'тренаж', 'gym', 'йога'],
  shopping: ['одежд', 'обувь', 'wildberries', 'ozon', 'маркетплейс', 'магазин', 'техник', 'днс', 'мвидео', 'икеа', 'ikea'],
  entertainment: ['развлеч', 'кино', 'театр', 'игр', 'steam', 'концерт', 'музе'],
  subscriptions: ['подписк', 'связь', 'интернет', 'мобильн', 'мтс', 'билайн', 'мегафон', 'tele2', 'netflix', 'spotify', 'youtube', 'apple', 'google'],
  education: ['образован', 'курс', 'книг', 'обучен', 'школ', 'универ', 'udemy'],
  travel: ['путешеств', 'авиа', 'билет', 'отел', 'гостиниц', 'booking', 'aviasales', 'ржд', 'aeroflot'],
  gifts: ['подар', 'цвет', 'донат'],
}

const INCOME_KEYWORDS: Record<string, string[]> = {
  salary: ['зарплат', 'заработн', 'оклад', 'salary'],
  bonus: ['преми', 'бонус', 'аванс'],
  freelance: ['фриланс', 'подработ', 'услуг'],
  business: ['бизнес', 'выручк', 'ип '],
  investments: ['дивиденд', 'процент', 'вклад', 'инвест', 'купон', 'кэшбэк', 'cashback'],
  rental: ['аренд', 'наём', 'найм'],
}

export function guessCategory(kind: BudgetKind, bankCategory: string, desc: string): number {
  const hay = `${bankCategory} ${desc}`.toLowerCase()
  const dict = kind === 'income' ? INCOME_KEYWORDS : EXPENSE_KEYWORDS
  for (const [name, words] of Object.entries(dict)) {
    if (words.some(w => hay.includes(w))) return categoryIdByName(kind, name)
  }
  return categoryIdByName(kind, 'other')
}
